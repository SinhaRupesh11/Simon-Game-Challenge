// Simon Game Deluxe — By Rupesh ✨

// Core variables
let buttonColors = ["red", "blue", "green", "yellow"];
let gamePattern = [];
let userClickedPattern = [];
let started = false;
let level = 0;
let lives = 3;
let playerName = "";
let clickCount = 0;
let difficulty = "easy";
let allowClick = false; // 🚫 Prevent clicks during sequence animation

// Difficulty speeds
const speedMap = {
  easy: 800,
  medium: 550,
  hard: 350
};

// ============================
// 🎮 INITIAL SETUP
// ============================
$(document).ready(function () {
  if (!localStorage.getItem("playerName")) {
    $("#name-modal").fadeIn(400);
  } else {
    playerName = localStorage.getItem("playerName");
    $("#name-modal").hide();
  }

  updateLeaderboard();
  updateLives();
  $("#click-count").text("Clicks: 0 / 0");
});

// Save name
$("#save-name").click(function () {
  let nameInput = $("#player-name").val().trim();
  if (nameInput.length > 0) {
    playerName = nameInput;
    localStorage.setItem("playerName", playerName);
    $("#name-modal").fadeOut(400);
  }
});

// ============================
// 🧠 START / RESET / DIFFICULTY
// ============================
$("#start-btn").click(function () {
  if (!started) {
    startGame();
  }
});

$("#reset-btn").click(function () {
  resetLeaderboard();
});

$(".diff-btn").click(function () {
  $(".diff-btn").removeClass("active");
  $(this).addClass("active");
  difficulty = $(this).data("diff");
});

// ============================
// ⚙️ GAME LOGIC
// ============================
function startGame() {
  level = 0;
  lives = 3;
  gamePattern = [];
  started = true;
  updateLives();
  $("#start-btn").text("Playing...");
  $("#level-title").text("Level " + level);
  nextSequence();
}

$(".btn").click(function () {
  if (!started || !allowClick) return; // 🚫 Ignore clicks during sequence

  let userChosenColor = $(this).attr("id");
  userClickedPattern.push(userChosenColor);
  clickCount++;
  updateClickCount();

  playSound(userChosenColor);
  animatePress(userChosenColor);
  checkAnswer(userClickedPattern.length - 1);
});

function checkAnswer(currentLevel) {
  if (gamePattern[currentLevel] === userClickedPattern[currentLevel]) {
    if (userClickedPattern.length === gamePattern.length) {
      allowClick = false; // Stop clicking until next sequence finishes
      setTimeout(function () {
        nextSequence();
      }, 800);
    }
  } else {
    wrongMove();
  }
}

function wrongMove() {
  playSound("wrong");
  $("body").addClass("game-over");
  setTimeout(() => $("body").removeClass("game-over"), 300);

  lives--;
  updateLives();

  if (lives > 0) {
    $("#level-title").text(`Oops! ${lives} lives left. Try again.`);
    userClickedPattern = [];
    allowClick = false; // prevent clicks during replay
    setTimeout(() => replaySequence(), 1000);
  } else {
    gameOver();
  }
}

// Generate and show next color
function nextSequence() {
  userClickedPattern = [];
  level++;
  clickCount = 0;
  updateClickCount();

  $("#level-title").text("Level " + level);
  let randomNumber = Math.floor(Math.random() * 4);
  let randomChosenColor = buttonColors[randomNumber];
  gamePattern.push(randomChosenColor);

  showSequence(); // 🔹 play the full sequence animation
}

// 🔹 Replay current sequence after mistake
function replaySequence() {
  showSequence();
}

// 🔹 Animate sequence and only allow clicks afterward
function showSequence() {
  allowClick = false; // 🚫 block clicks
  let delay = 0;

  gamePattern.forEach((color, i) => {
    setTimeout(() => {
      $("#" + color).fadeIn(150).fadeOut(150).fadeIn(150);
      playSound(color);

      // ✅ Enable user input after the last color finishes
      if (i === gamePattern.length - 1) {
        setTimeout(() => {
          allowClick = true;
        }, 500);
      }
    }, i * speedMap[difficulty]);
  });
}

// ============================
// 💾 LEADERBOARD + STORAGE
// ============================
function gameOver() {
  playSound("wrong");
  $("#level-title").text("💀 Game Over! Press Start to Play Again");
  started = false;
  allowClick = false;
  $("#start-btn").text("Start Again");

  saveScore(level);
  updateLeaderboard();
}

function saveScore(score) {
  let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
  leaderboard.push({ name: playerName, score: score });

  leaderboard.sort((a, b) => b.score - a.score);
  leaderboard = leaderboard.slice(0, 5);

  localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
}

function updateLeaderboard() {
  let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
  $("#leaderboard").empty();
  leaderboard.forEach((entry, index) => {
    $("#leaderboard").append(
      `<li><span class="leader-name">${index + 1}. ${entry.name}</span> 
       <span class="leader-score">${entry.score}</span></li>`
    );
  });
}

function resetLeaderboard() {
  localStorage.removeItem("leaderboard");
  updateLeaderboard();
}

// ============================
// 🔊 SOUND + UI HELPERS
// ============================
function playSound(name) {
  let audio = new Audio("sounds/" + name + ".mp3");
  audio.play();
}

function animatePress(color) {
  $("#" + color).addClass("pressed");
  setTimeout(() => {
    $("#" + color).removeClass("pressed");
  }, 150);
}

function updateLives() {
  $("#lives").empty();
  for (let i = 0; i < 3; i++) {
    let heart = $("<span>").addClass("heart").html("❤️");
    if (i >= lives) heart.addClass("lost");
    $("#lives").append(heart);
  }
}

function updateClickCount() {
  $("#click-count").text(`Clicks: ${userClickedPattern.length} / ${gamePattern.length}`);
}
