// Third interaction, using the course's original page and controls.
// AI-assisted implementation; see SPIRIT_LEVEL_GUIDE.md.
let dspNode = null;
let dspNodeParams = null;
let jsonParams = null;
let levelGain = null;
let levelAngle = null;
let levelIsFlat = false;
let levelReading = null;
let levelNextPulse = 0;
let levelPressureRange = [0, 1];

// AUDIO SETUP: keep the repository's existing brass WASM model.
const dspName = "brass";
const instance = new FaustWasm2ScriptProcessor(dspName);
if (typeof module === "undefined") {
    window[dspName] = instance;
} else {
    module.exports = { [dspName]: instance };
}

brass.createDSP(audioContext, 1024).then(node => {
    dspNode = node;
    jsonParams = JSON.parse(node.getJSON()).ui;
    dspNodeParams = jsonParams;
    const pressure = findByAddress(dspNodeParams, "/brass/blower/pressure");
    if (!pressure) throw new Error("Brass pressure parameter not found.");
    levelPressureRange = [Number(pressure.min), Number(pressure.max)];
    levelGain = audioContext.createGain();
    levelGain.gain.value = 0;
    dspNode.connect(levelGain);
    levelGain.connect(audioContext.destination);
    dspNode.setParamValue("/brass/blower/pressure", 0);
    console.log("params:", dspNode.getParams());
}).catch(error => {
    showLevelInfo("Sound model could not load: " + error.message);
    console.error(error);
});

// The original Turn On DSP button calls this from a user gesture.
// Its call during setup is ignored so iPhone permissions are not requested on load.
function setMotionListeners() {
    if (typeof buttons === "undefined" || !buttons[0]) return;
    const requests = [];
    for (const EventType of [window.DeviceMotionEvent, window.DeviceOrientationEvent]) {
        if (EventType && typeof EventType.requestPermission === "function") {
            requests.push(EventType.requestPermission());
        }
    }
    Promise.all(requests).then(states => {
        if (states.some(state => state !== "granted")) {
            levelReading = null;
            silenceLevel();
            showLevelInfo("Motion access denied. Check permission and reload.");
        }
    }).catch(error => {
        levelReading = null;
        silenceLevel();
        showLevelInfo("Sensor permission: " + error.message);
    });
}

window.addEventListener("deviceorientation", event => {
    if (Number.isFinite(event.beta) && Number.isFinite(event.gamma)) {
        levelReading = [event.beta, event.gamma];
    }
});
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        levelReading = null;
        showLevelInfo("Waiting for a fresh phone orientation reading.");
        levelAngle = null;
        levelIsFlat = false;
        silenceLevel();
    }
});
window.addEventListener("pagehide", silenceLevel);

// INTERACTIONS: the original sketch calls these functions every frame.
function accelerationChange(accx, accy, accz) {}

function rotationChange(rotx, roty, rotz) {
    if (!levelReading) {
        silenceLevel();
        return;
    }
    // Read the standard orientation event in degrees, independent of p5 angleMode.
    const rawAngle = SpiritLevel.surfaceAngle(levelReading[0], levelReading[1]);
    if (rawAngle === null) {
        silenceLevel();
        return;
    }
    levelAngle = levelAngle === null ? rawAngle : levelAngle + 0.2 * (rawAngle - levelAngle);
    levelIsFlat = SpiritLevel.isLevel(levelAngle, levelIsFlat);
    showLevelInfo("Inclination: " + levelAngle.toFixed(1) + "° — " +
        (levelIsFlat ? "LEVEL (silent)" : "TILTED"));

    if (!dspNode || !levelGain || audioContext.state !== "running" || document.hidden) {
        silenceLevel();
        return;
    }
    const feedback = SpiritLevel.feedback(levelAngle, levelIsFlat);
    if (feedback.gain === 0) {
        silenceLevel();
        return;
    }
    const now = performance.now();
    if (now >= levelNextPulse) {
        levelNextPulse = now + feedback.intervalMs;
        playAudio(feedback.pressure, feedback.gain);
    }
}

function mousePressed() {
    // The level uses phone orientation, so touching a control does not trigger sound.
}
function deviceMoved() {
    movetimer = millis();
    statusLabels[2].style("color", "pink");
}
function deviceTurned() {
    threshVals[1] = turnAxis;
}
function deviceShaken() {
    shaketimer = millis();
    statusLabels[0].style("color", "pink");
}

// AUDIO INTERACTION: bounded pressure and a short, bounded gain envelope.
function playAudio(pressure, gain) {
    if (!dspNode || !levelGain || audioContext.state !== "running") return;
    const boundedPressure = Math.min(levelPressureRange[1], Math.max(levelPressureRange[0], pressure));
    dspNode.setParamValue("/brass/blower/pressure", boundedPressure);
    const now = audioContext.currentTime;
    levelGain.gain.cancelScheduledValues(now);
    levelGain.gain.setValueAtTime(0, now);
    levelGain.gain.linearRampToValueAtTime(Math.min(0.12, Math.max(0, gain)), now + 0.012);
    levelGain.gain.setValueAtTime(Math.min(0.12, Math.max(0, gain)), now + 0.07);
    levelGain.gain.linearRampToValueAtTime(0, now + 0.11);
}

function silenceLevel() {
    levelNextPulse = 0;
    if (!levelGain) return;
    const now = audioContext.currentTime;
    levelGain.gain.cancelScheduledValues(now);
    levelGain.gain.setValueAtTime(0, now);
    if (dspNode) dspNode.setParamValue("/brass/blower/pressure", 0);
}

function showLevelInfo(text) {
    const label = document.getElementById("level-reading");
    if (label) label.textContent = text;
}
