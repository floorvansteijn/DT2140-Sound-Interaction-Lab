// AI-assisted learning prototype. See SPIRIT_LEVEL_GUIDE.md before coursework use.
let dspNode = null;
let dspNodeParams = null;
let jsonParams = null;
let levelGain = null;
const dspName = "brass";
const instance = new FaustWasm2ScriptProcessor(dspName);
window[dspName] = instance;

const levelState = {
  angle: null, level: false, sensorSeen: false, sensorError: "",
  rawX: null, rawY: null, nextBeep: 0, pressureMin: 0, pressureMax: 1
};
const levelUI = {
  angle: document.getElementById("level-angle"),
  status: document.getElementById("level-state"),
  input: document.getElementById("input-state"),
  sound: document.getElementById("sound-state"),
  marker: document.getElementById("level-marker"),
  simulation: document.getElementById("simulation"),
  simulator: document.getElementById("simulator"),
  x: document.getElementById("simulate-x"),
  y: document.getElementById("simulate-y"),
  xValue: document.getElementById("simulate-x-value"),
  yValue: document.getElementById("simulate-y-value")
};

instance.createDSP(audioContext, 1024).then(node => {
  dspNode = node;
  const metadata = JSON.parse(node.getJSON());
  jsonParams = metadata.ui;
  dspNodeParams = metadata.ui;
  const pressure = findByAddress(metadata.ui, "/brass/blower/pressure");
  if (!pressure || !Number.isFinite(Number(pressure.min)) || !Number.isFinite(Number(pressure.max))) {
    throw new Error("The brass pressure parameter is unavailable.");
  }
  levelState.pressureMin = Number(pressure.min);
  levelState.pressureMax = Number(pressure.max);
  levelGain = audioContext.createGain();
  levelGain.gain.value = 0;
  node.connect(levelGain);
  levelGain.connect(audioContext.destination);
  node.setParamValue("/brass/blower/pressure", 0);
  console.log("Spirit level: brass parameters", node.getParams());
  levelUI.sound.textContent = "Sound ready. Select Turn On DSP.";
}).catch(error => {
  levelState.sensorError = "Sound model could not load: " + error.message;
  levelUI.sound.textContent = levelState.sensorError;
  console.error(error);
});

window.addEventListener("deviceorientation", event => {
  if (Number.isFinite(event.beta) && Number.isFinite(event.gamma)) {
    levelState.sensorSeen = true;
    levelState.rawX = event.beta;
    levelState.rawY = event.gamma;
    levelState.sensorError = "";
  }
});

document.getElementById("enable-orientation").addEventListener("click", async () => {
  try {
    // Both permission requests are initiated within the same user gesture.
    const requests = [];
    for (const EventType of [window.DeviceOrientationEvent, window.DeviceMotionEvent]) {
      if (EventType && typeof EventType.requestPermission === "function") {
        requests.push(EventType.requestPermission());
      }
    }
    const permissions = await Promise.all(requests);
    if (permissions.some(value => value !== "granted")) throw new Error("Motion access was denied.");
    levelState.sensorError = "";
    levelUI.input.textContent = "Sensors enabled; tilt the phone to receive a reading.";
  } catch (error) {
    levelState.sensorError = error.message;
    levelUI.input.textContent = error.message;
    silenceLevel();
  }
});

levelUI.simulation.addEventListener("change", () => {
  levelUI.simulator.hidden = !levelUI.simulation.checked;
  levelState.angle = null;
  levelState.level = false;
  levelState.nextBeep = 0;
  silenceLevel();
});
for (const input of [levelUI.x, levelUI.y]) {
  input.addEventListener("input", () => {
    levelUI.xValue.textContent = levelUI.x.value + "°";
    levelUI.yValue.textContent = levelUI.y.value + "°";
  });
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden) silenceLevel();
});
window.addEventListener("pagehide", silenceLevel);

function silenceLevel() {
  levelState.nextBeep = 0;
  if (!levelGain) return;
  const now = audioContext.currentTime;
  levelGain.gain.cancelScheduledValues(now);
  levelGain.gain.setValueAtTime(0, now);
  if (dspNode) dspNode.setParamValue("/brass/blower/pressure", 0);
}

// This page requests phone permissions only from its explicit user-gesture button.
function setMotionListeners() {}

function accelerationChange() {}
function mousePressed() {}
function deviceMoved() { movetimer = millis(); }
function deviceTurned() {}
function deviceShaken() { shaketimer = millis(); }

function rotationChange() {
  const simulation = levelUI.simulation.checked;
  let beta = null;
  let gamma = null;
  if (simulation) {
    beta = Number(levelUI.x.value);
    gamma = Number(levelUI.y.value);
  } else if (levelState.sensorSeen && !levelState.sensorError) {
    beta = levelState.rawX;
    gamma = levelState.rawY;
  }
  const rawAngle = SpiritLevel.surfaceAngle(beta, gamma);
  if (rawAngle === null) {
    levelState.angle = null;
    levelState.level = false;
    levelUI.angle.textContent = "—";
    levelUI.marker.hidden = true;
    levelUI.sound.textContent = "Sound paused: no orientation reading.";
    levelUI.status.textContent = "WAITING FOR SENSOR DATA";
    levelUI.status.dataset.state = "waiting";
    levelUI.input.textContent = levelState.sensorError || "Phone: enable sensors and tilt. Computer: enable simulation below.";
    silenceLevel();
    return;
  }

  // Mild smoothing suppresses hand tremor without hiding a deliberate tilt.
  levelState.angle = levelState.angle === null ? rawAngle : levelState.angle + 0.2 * (rawAngle - levelState.angle);
  levelState.level = SpiritLevel.isLevel(levelState.angle, levelState.level);
  levelUI.marker.hidden = false;
  levelUI.angle.textContent = levelState.angle.toFixed(1) + "°";
  levelUI.status.textContent = levelState.level ? "LEVEL" : "TILTED";
  levelUI.status.dataset.state = levelState.level ? "level" : "tilted";
  levelUI.input.textContent = (simulation ? "Desktop simulation — not a phone measurement" : "Live phone orientation") +
    " · X " + beta.toFixed(1) + "° · Y " + gamma.toFixed(1) + "°";
  const signedAngle = Math.abs(gamma) >= Math.abs(beta) ? gamma : beta;
  const markerOffset = Math.min(45, Math.max(-45, signedAngle));
  levelUI.marker.style.left = (50 + markerOffset) + "%";
  levelUI.marker.dataset.level = String(levelState.level);

  if (!dspNode || !levelGain) return;
  if (audioContext.state !== "running" || document.hidden) {
    levelUI.sound.textContent = "Sound off. Select Turn On DSP.";
    silenceLevel();
    return;
  }
  const feedback = SpiritLevel.feedback(levelState.angle, levelState.level);
  if (feedback.gain === 0) {
    levelUI.sound.textContent = "Level: silent";
    silenceLevel();
    return;
  }
  levelUI.sound.textContent = "Tilt feedback: " + (1000 / feedback.intervalMs).toFixed(1) + " pulses/s";
  const nowMs = performance.now();
  if (nowMs < levelState.nextBeep) return;
  levelState.nextBeep = nowMs + feedback.intervalMs;
  const pressure = Math.min(levelState.pressureMax, Math.max(levelState.pressureMin, feedback.pressure));
  dspNode.setParamValue("/brass/blower/pressure", pressure);
  const now = audioContext.currentTime;
  levelGain.gain.cancelScheduledValues(now);
  levelGain.gain.setValueAtTime(0, now);
  levelGain.gain.linearRampToValueAtTime(feedback.gain, now + 0.012);
  levelGain.gain.setValueAtTime(feedback.gain, now + 0.07);
  levelGain.gain.linearRampToValueAtTime(0, now + 0.11);
}
