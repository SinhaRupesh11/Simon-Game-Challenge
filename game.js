// game.js - Simon Deluxe with lives, difficulty, leaderboard (names + scores)
var buttonColors = ["red", "blue", "green", "yellow"];
var gamePattern = [];
var userClickedPattern = [];
var started = false;
var level = 0;
var lives = 3;
var acceptingInput = false; // when sequence playing, block user input
var flashSpeed = 1000; // ms per flash (difficulty adjusts)
var pauseBetween = 400; // small pause between flashes

// Sounds (ensure files exist under sounds/)
var soundMap = {
  red: "sounds/red.mp3",
  blue: "sounds/blue.mp3",
  green: "sounds/green.mp3",
  yellow: "sounds/yellow.mp3",
  wrong: "sounds/wrong.mp3"
};

// ---------- Leaderboard (localStorage) ----------
var LB_KEY = "simon_leaderboard_v1";
var leaderboard = loadLeaderboard(); // array of {name, score}

function loadLeaderboard() {
  try {
    var raw = localStorage.getItem(LB_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLeaderboard() {
  localStorage.setItem(LB_KEY, JSON.stringify(leaderboard));
}

function renderLeaderboard() {
  var $list = $("#leaderboard-list");
  $list.empty();
  var top = leaderboard.slice(0, 5);
  if (top.length === 0) {
    $list.append("<li class='muted'>No scores yet</li>");
    return;
  }
  top.forEach(function (entry) {
    var $li = $("<li>");
    $li.html("<span class='leader-name'>" + escapeHtml(entry.name) + "</span><span class='leader-score'>" + entry.score + "</span>");
    $list.append($li);
  });
}

// add score and keep sorted desc, keep top 10 in storage
function addScore(name, score) {
  leaderboard.push({ name: name || "Anon", score: score });
  leaderboard.sort(function (a, b) { return b.score - a.score; });
  leaderboard = leaderboard.slice(0, 10);
  saveLeaderboard();
  renderLeaderboard();
}

// helper to escape user input
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, function (m) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
  });
}

// ---------- UI initialization ----------
$(function () {
  // show high score from leaderboard
  var best = leaderboard.length ? leaderboard[0].score : 0;
  $("#high-score").text("⭐ High Score: " + best);

  // render leaderboard and lives UI
  renderLeaderboard();
  renderLives();

  // difficulty selector
  $(".diff-btn").click(function () {
    $(".diff-btn").removeClass("active");
    $(this).addClass("active");
    flashSpeed = parseInt($(this).attr("data-speed"), 10);
  });

  // start button
  $("#start-btn").click(function () {
    if (!started) {
      $("#rules-box").fadeOut(300);
      $(".diff-btn").addClass("disabled");
      $(this).fadeOut(200);
      restartGame(); // reset lives/level/pattern and start
      nextSequence();
    }
  });

  // reset leaderboard button
  $("#reset-leaderboard").click(function () {
    if (!confirm("Reset leaderboard? This will remove stored scores.")) return;
    leaderboard = [];
    saveLeaderboard();
    renderLeaderboard();
    $("#high-score").text("⭐ High Score: 0");
  });

  // color button clicks
  $(".btn").on("click touchstart", function (e) {
    e.preventDefault();
    if (!started || !acceptingInput) return;
    var id = $(this).attr("id");
    userClickedPattern.push(id);
    playSound(id);
    animatePress(id);
    checkAnswer(userClickedPattern.length - 1);
  });

  // modal save/skip handlers
  $("#save-score").click(function () {
    var name = $("#player-name").val().trim() || "Anon";
    name = name.substring(0, 15);
    addScore(name, level);
    $("#name-modal").hide();
    finalizeAfterGameOver();
  });
  $("#skip-save").click(function () {
    $("#name-modal").hide();
    finalizeAfterGameOver();
  });
});

// ---------- Game helpers ----------
function restartGame() {
  started = true;
  level = 0;
  gamePattern = [];
  userClickedPattern = [];
  lives = 3;
  acceptingInput = false;
  $("#current-info").text("");
  $("#level-title").text("Level " + level);
  renderLives();
}

function renderLives() {
  var $c = $("#lives-container");
  $c.empty();
  for (var i = 0; i < 3; i++) {
    var cls = (i < lives) ? "heart" : "heart lost";
    $c.append("<span class='" + cls + "'>❤</span>");
  }
}

// play sequence (used when nextSequence adds new or when replaying after life loss)
function playSequence(delayStart = 600) {
  acceptingInput = false;
  $("#current-info").text("Watch the sequence");
  var i = 0;
  setTimeout(function run() {
    if (i >= gamePattern.length) {
      // sequence done, now accept input
      acceptingInput = true;
      userClickedPattern = [];
      $("#current-info").text("Your turn");
      return;
    }
    var color = gamePattern[i];
    $("#" + color).fadeIn(100).fadeOut(100).fadeIn(100);
    playSound(color);
    i++;
    setTimeout(run, flashSpeed + pauseBetween - 200); // schedule next flash
  }, delayStart);
}

// ---------- Core logic ----------
function nextSequence() {
  userClickedPattern = [];
  level++;
  $("#level-title").text("Level " + level);

  // update high score display (not saved to leaderboard yet)
  var best = leaderboard.length ? leaderboard[0].score : 0;
  if (level > best) {
    $("#high-score").text("⭐ High Score: " + level);
  } else {
    $("#high-score").text("⭐ High Score: " + best);
  }

  // add random color then play
  var randomNumber = Math.floor(Math.random() * 4);
  var randomChosenColor = buttonColors[randomNumber];
  gamePattern.push(randomChosenColor);

  // play whole sequence
  playSequence(500);
}

function checkAnswer(currentIndex) {
  if (gamePattern[currentIndex] === userClickedPattern[currentIndex]) {
    // correct so far
    if (userClickedPattern.length === gamePattern.length) {
      acceptingInput = false;
      $("#current-info").text("Good! Next round...");
      setTimeout(function () {
        nextSequence();
      }, 900);
    }
  } else {
    // wrong press
    playSound("wrong");
    lives--;
    renderLives();

    if (lives > 0) {
      // show life lost feedback then replay same sequence (do not add new color)
      $("#level-title").text("Life lost! " + lives + " left");
      acceptingInput = false;
      setTimeout(function () {
        $("#level-title").text("Level " + level);
        playSequence(700);
      }, 900);
    } else {
      // final game over
      acceptingInput = false;
      started = false;
      $("#level-title").html("💀 Game Over!");
      $("#current-info").text("Enter your name to save score or skip");
      // show modal to save name
      $("#final-score").text(level);
      $("#player-name").val("");
      $("#name-modal").fadeIn(200);
      // also show rules/start again after modal's actions
    }
  }
}

// ---------- sounds & animations ----------
function playSound(name) {
  var src = soundMap[name];
  if (!src) return;
  try {
    var audio = new Audio(src);
    audio.currentTime = 0;
    audio.play();
  } catch (e) {
    // ignore sound errors on some browsers
  }
}

function animatePress(color) {
  var $el = $("#" + color);
  $el.addClass("pressed");
  setTimeout(function () { $el.removeClass("pressed"); }, 120);
}

// ---------- after game over finalize UI ----------
function finalizeAfterGameOver() {
  // show rules and start again
  setTimeout(function () {
    $("#rules-box").fadeIn(300);
    $("#start-btn").fadeIn(200);
    $("#level-title").text("Press Start to Begin");
    $("#current-info").text("");
    renderLives();
    // update high score display from leaderboard top
    var best = leaderboard.length ? leaderboard[0].score : 0;
    $("#high-score").text("⭐ High Score: " + best);
  }, 300);
}

// ---------- utility: initialize leaderboard UI on load ----------
$(function () { renderLeaderboard(); });
