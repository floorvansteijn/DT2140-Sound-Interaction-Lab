const test = require('node:test');
const assert = require('node:assert/strict');
let model = {};
try { model = require('./level-model.js'); } catch (error) {
  if (error.code !== 'MODULE_NOT_FOUND') throw error;
}

test('surface inclination handles horizontal, inverted and vertical phone poses', () => {
  assert.equal(typeof model.surfaceAngle, 'function', 'angle model is not implemented');
  for (const [x, y, expected] of [[0, 0, 0], [180, 0, 0], [90, 0, 90], [0, 90, 90], [30, 0, 30], [0, -30, 30], [45, 45, 60]]) {
    assert.ok(Math.abs(model.surfaceAngle(x, y) - expected) < 1e-6, `${x}, ${y}: expected ${expected}`);
  }
});

test('invalid sensor readings are not treated as a level surface', () => {
  assert.equal(typeof model.surfaceAngle, 'function', 'angle model is not implemented');
  for (const invalid of [null, undefined, NaN, Infinity, '0']) {
    assert.equal(model.surfaceAngle(invalid, 0), null);
    assert.equal(model.surfaceAngle(0, invalid), null);
  }
});

test('level hysteresis rejects small fluctuations around the boundary', () => {
  assert.equal(typeof model.isLevel, 'function', 'hysteresis is not implemented');
  assert.equal(model.isLevel(2.5, false), false);
  assert.equal(model.isLevel(1.9, false), true);
  assert.equal(model.isLevel(2.5, true), true);
  assert.equal(model.isLevel(3.1, true), false);
  assert.equal(model.isLevel(null, true), false);
});

test('feedback is silent at level and becomes faster with increasing inclination', () => {
  assert.equal(typeof model.feedback, 'function', 'feedback is not implemented');
  assert.equal(model.feedback(0, true).gain, 0);
  assert.equal(model.feedback(null, false).gain, 0);
  const gentle = model.feedback(5, false);
  const steep = model.feedback(45, false);
  const extreme = model.feedback(90, false);
  assert.ok(gentle.intervalMs > steep.intervalMs);
  for (const value of [gentle, steep, extreme]) {
    assert.ok(Number.isFinite(value.intervalMs) && value.intervalMs >= 160);
    assert.ok(value.pressure >= 0 && value.pressure <= 1);
    assert.ok(value.gain > 0 && value.gain <= 0.12);
  }
});
