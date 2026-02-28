var g_interestedInFeatures = ["game_info", "match_info"];
var DISCORD_APP_ID = "1477278379601563738";

var onErrorListener, onInfoUpdates2Listener, onNewEventsListener;
var discordPlugin = null;
var discordRichPresence = null;

var currentScene = "lobby";
var currentScore = { left: "0", right: "0" };
var matchStartTimestamp = null;
var eventMoment = null;
var eventMomentUntil = 0;
var eventMomentTimer = null;
var BULLET = "\u2022";
var isRematchActive = false;
var eventsRegistered = false;

function stringify(value) {
  try {
    return JSON.stringify(value);
  } catch (e) {
    return String(value);
  }
}

function initDiscordRichPresence() {
  if (!DISCORD_APP_ID || DISCORD_APP_ID === "YOUR_DISCORD_APP_ID") {
    console.log("Discord RP disabled: set DISCORD_APP_ID in main.js");
    return;
  }

  discordPlugin = new OverwolfPlugin("discordPlugin", true);
  discordPlugin.initialize(function (status) {
    if (status !== true) {
      console.log("Discord RP plugin failed to load");
      return;
    }

    discordRichPresence = discordPlugin.get();
    console.log("Discord RP plugin loaded");

    try {
      if (
        discordRichPresence.onReady &&
        discordRichPresence.onReady.addListener
      ) {
        discordRichPresence.onReady.addListener(function (msg) {
          console.log("Discord onReady: " + stringify(msg));
        });
      }

      if (
        discordRichPresence.onError &&
        discordRichPresence.onError.addListener
      ) {
        discordRichPresence.onError.addListener(function (msg) {
          console.log("Discord onError: " + stringify(msg));
        });
      }

      discordRichPresence.initApp(DISCORD_APP_ID);
      syncWithRunningGame("init");
    } catch (e) {
      console.log("Discord init failed: " + e);
    }
  });
}

function clearDiscordPresence(reason) {
  if (!discordRichPresence) {
    return;
  }

  try {
    discordRichPresence.clearPresence();
    console.log("Discord presence cleared (" + reason + ")");
  } catch (e) {
    console.log("Discord clearPresence failed: " + e);
  }
}

function activateForRematch(reason) {
  isRematchActive = true;

  if (!eventsRegistered) {
    registerEvents();
    eventsRegistered = true;
  }

  setFeatures();
  pushDiscordPresence(reason || "active");
}

function deactivateForNoRematch(reason) {
  isRematchActive = false;
  currentScene = "lobby";
  matchStartTimestamp = null;
  eventMoment = null;
  eventMomentUntil = 0;

  if (eventMomentTimer) {
    clearTimeout(eventMomentTimer);
    eventMomentTimer = null;
  }

  if (eventsRegistered) {
    unregisterEvents();
    eventsRegistered = false;
  }

  clearDiscordPresence(reason || "inactive");
}

function syncWithRunningGame(reason) {
  overwolf.games.getRunningGameInfo(function (res) {
    if (gameRunning(res)) {
      activateForRematch(reason || "sync_running");
    } else {
      deactivateForNoRematch(reason || "sync_not_running");
    }
  });
}

function pushDiscordPresence(reason) {
  if (!discordRichPresence) {
    return;
  }

  var details = "In the lobby";
  var state = "Waiting for a match...";

  if (currentScene === "ingame") {
    details = "In a match";
    state = getSmartScoreLine();
  }

  if (eventMoment && Date.now() < eventMomentUntil) {
    state = eventMoment + " " + BULLET + " " + getSmartScoreLine();
  } else if (eventMoment && Date.now() >= eventMomentUntil) {
    eventMoment = null;
    eventMomentUntil = 0;
  }

  var presence = {
    details: details,
    state: state,
  };

  if (currentScene === "ingame" && matchStartTimestamp) {
    presence.timestamps = { start: matchStartTimestamp };
  }

  try {
    discordRichPresence.setPresence(presence);
    console.log(
      "Discord presence updated (" + reason + "): " + stringify(presence),
    );
  } catch (e) {
    console.log("Discord setPresence failed: " + e);
  }
}

function getSmartScoreLine() {
  var left = Number(currentScore.left);
  var right = Number(currentScore.right);

  if (isNaN(left) || isNaN(right)) {
    return "score " + currentScore.left + "-" + currentScore.right;
  }

  if (left > right) {
    return "Winning " + left + "-" + right;
  }

  if (left < right) {
    return "Losing " + left + "-" + right;
  }

  return "Drawing " + left + "-" + right;
}

function setEventMoment(message, reason) {
  if (!isRematchActive) {
    return;
  }

  eventMoment = message;
  eventMomentUntil = Date.now() + 7000;

  if (eventMomentTimer) {
    clearTimeout(eventMomentTimer);
    eventMomentTimer = null;
  }

  eventMomentTimer = setTimeout(function () {
    eventMoment = null;
    eventMomentUntil = 0;
    eventMomentTimer = null;
    pushDiscordPresence("moment_expired");
  }, 7000);

  pushDiscordPresence(reason || "moment");
}

function setScene(scene, reason) {
  if (!isRematchActive) {
    return;
  }

  var normalizedScene = String(scene || "").toLowerCase();
  if (!normalizedScene) {
    return;
  }

  if (
    normalizedScene === "ingame" ||
    normalizedScene === "in_game" ||
    normalizedScene === "match"
  ) {
    currentScene = "ingame";
    if (!matchStartTimestamp) {
      matchStartTimestamp = Date.now();
    }
  } else if (normalizedScene === "lobby") {
    currentScene = "lobby";
    matchStartTimestamp = null;
    eventMoment = null;
    eventMomentUntil = 0;
    if (eventMomentTimer) {
      clearTimeout(eventMomentTimer);
      eventMomentTimer = null;
    }
  } else {
    return;
  }

  pushDiscordPresence(reason || "scene");
}

function setScore(left, right, reason) {
  if (!isRematchActive) {
    return;
  }

  currentScore.left = String(left);
  currentScore.right = String(right);
  pushDiscordPresence(reason || "score");
}

function logGoalIfAny(info) {
  if (!info || !Array.isArray(info.events)) {
    return;
  }

  for (var i = 0; i < info.events.length; i++) {
    var eventName = info.events[i] && info.events[i].name;
    if (eventName === "team_goal") {
      console.log("GOAL SCORED BY YOUR TEAM");
      setEventMoment("Goal scored", "team_goal");
    } else if (eventName === "opponent_goal") {
      console.log("GOAL SCORED BY OPPONENT TEAM");
      setEventMoment("Goal conceded", "opponent_goal");
    } else if (eventName === "match_start") {
      console.log("MATCH STARTED");
      setScene("ingame", "match_start");
    } else if (eventName === "match_end") {
      console.log("MATCH ENDED");
      setScene("lobby", "match_end");
    }
  }
}

function logScoreUpdateIfAny(info) {
  var matchInfo = info && info.info && info.info.match_info;
  if (!matchInfo || !matchInfo.score) {
    return;
  }

  var scoreData = matchInfo.score;
  if (typeof scoreData === "string") {
    try {
      scoreData = JSON.parse(scoreData);
    } catch (e) {
      console.log("SCORE UPDATE RAW: " + scoreData);
      return;
    }
  }

  var leftScore = scoreData && scoreData.left_score;
  var rightScore = scoreData && scoreData.right_score;

  if (leftScore === undefined || rightScore === undefined) {
    console.log("SCORE UPDATE RAW: " + stringify(scoreData));
    return;
  }

  console.log("SCORE UPDATE: " + leftScore + " - " + rightScore);
  setScore(leftScore, rightScore, "match_info.score");
}

function logSceneIfAny(info) {
  var scene =
    info && info.info && info.info.game_info && info.info.game_info.scene;
  if (!scene) {
    return;
  }

  var normalizedScene = String(scene).toLowerCase();

  if (normalizedScene === "lobby") {
    console.log("PLAYER IN LOBBY");
    setScene("lobby", "game_info.scene");
    return;
  }

  if (
    normalizedScene === "ingame" ||
    normalizedScene === "in_game" ||
    normalizedScene === "match"
  ) {
    console.log("PLAYER IN GAME");
    setScene("ingame", "game_info.scene");
    return;
  }

  console.log("SCENE UPDATE: " + scene);
}

function registerEvents() {
  onErrorListener = function (info) {
    console.log("Error: " + JSON.stringify(info));
  };

  onInfoUpdates2Listener = function (info) {
    logScoreUpdateIfAny(info);
    logSceneIfAny(info);
  };

  onNewEventsListener = function (info) {
    logGoalIfAny(info);
  };

  // general events errors
  overwolf.games.events.onError.addListener(onErrorListener);

  // "static" data changed (total kills, username, steam-id)
  // This will also be triggered the first time we register
  // for events and will contain all the current information
  overwolf.games.events.onInfoUpdates2.addListener(onInfoUpdates2Listener);
  // an event triggerd
  overwolf.games.events.onNewEvents.addListener(onNewEventsListener);
}

function unregisterEvents() {
  overwolf.games.events.onError.removeListener(onErrorListener);
  overwolf.games.events.onInfoUpdates2.removeListener(onInfoUpdates2Listener);
  overwolf.games.events.onNewEvents.removeListener(onNewEventsListener);
}

function gameLaunched(gameInfoResult) {
  if (!gameInfoResult) {
    return false;
  }

  if (!gameInfoResult.gameInfo) {
    return false;
  }

  if (!gameInfoResult.runningChanged && !gameInfoResult.gameChanged) {
    return false;
  }

  if (!gameInfoResult.gameInfo.isRunning) {
    return false;
  }

  // NOTE: we divide by 10 to get the game class id without it's sequence number
  if (Math.floor(gameInfoResult.gameInfo.id / 10) != 26120) {
    return false;
  }

  console.log("Rematch Launched");
  return true;
}

function gameRunning(gameInfo) {
  if (!gameInfo) {
    return false;
  }

  if (!gameInfo.isRunning) {
    return false;
  }

  // NOTE: we divide by 10 to get the game class id without it's sequence number
  if (Math.floor(gameInfo.id / 10) != 26120) {
    return false;
  }

  console.log("Rematch running");
  return true;
}

function setFeatures() {
  overwolf.games.events.setRequiredFeatures(
    g_interestedInFeatures,
    function (info) {
      if (info.status == "error") {
        //console.log("Could not set required features: " + info.reason);
        //console.log("Trying in 2 seconds");
        window.setTimeout(setFeatures, 2000);
        return;
      }

      console.log("Set required features:");
      console.log(JSON.stringify(info));
    },
  );
}

window.addEventListener("beforeunload", function () {
  if (!discordRichPresence) {
    return;
  }

  try {
    discordRichPresence.clearPresence();
    if (discordRichPresence.dispose) {
      discordRichPresence.dispose();
    }
  } catch (e) {
    console.log("Discord dispose failed: " + e);
  }
});

// Start here
initDiscordRichPresence();

overwolf.games.onGameInfoUpdated.addListener(function (res) {
  var gameInfo = res && res.gameInfo;

  if (gameRunning(gameInfo)) {
    activateForRematch("onGameInfoUpdated_running");
  } else if (res && (res.runningChanged || res.gameChanged)) {
    deactivateForNoRematch("onGameInfoUpdated_not_running");
  }
});

overwolf.games.getRunningGameInfo(function (res) {
  if (gameRunning(res)) {
    activateForRematch("startup_running");
  } else {
    deactivateForNoRematch("startup_not_running");
  }
  console.log("getRunningGameInfo: " + JSON.stringify(res));
});
