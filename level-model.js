/* AI-assisted learning prototype: angle geometry and bounded feedback. */
(function (root, factory) {
  const model = factory();
  if (typeof module === "object" && module.exports) module.exports = model;
  else root.SpiritLevel = model;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function surfaceAngle(beta, gamma) {
    if (!Number.isFinite(beta) || !Number.isFinite(gamma)) return null;
    const radians = Math.PI / 180;
    const normalZ = Math.cos(beta * radians) * Math.cos(gamma * radians);
    return Math.acos(Math.min(1, Math.max(0, Math.abs(normalZ)))) / radians;
  }

  function isLevel(angle, previouslyLevel) {
    if (!Number.isFinite(angle)) return false;
    return angle <= (previouslyLevel ? 3 : 2);
  }

  function feedback(angle, level) {
    if (!Number.isFinite(angle) || level) return { gain: 0, pressure: 0, intervalMs: 1000 };
    const amount = Math.min(1, Math.max(0, (angle - 2) / 58));
    return {
      gain: 0.08 + 0.04 * amount,
      pressure: 0.55 + 0.25 * amount,
      intervalMs: 1000 - 840 * amount
    };
  }

  return { surfaceAngle, isLevel, feedback };
});
