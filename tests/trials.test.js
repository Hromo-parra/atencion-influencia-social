import test from 'node:test';
import assert from 'node:assert/strict';
import { generatePlans, validatePlan } from '../src/trials.js';
import { CONFIG } from '../src/config.js';

test('la misma semilla produce el mismo plan', () => {
  const scores = { high: 8, neutral: 2, unknown: 0 };
  assert.deepEqual(generatePlans(20260830, scores), generatePlans(20260830, scores));
});

test('el plan contiene las tres fases y el número previsto de ensayos', () => {
  const plan = generatePlans(128, { high: 8, neutral: 2, unknown: 0 });
  assert.equal(plan.practice.length, CONFIG.experiment.practiceTrials);
  assert.equal(plan.baseline.length, CONFIG.experiment.baselineTrials);
  assert.equal(plan.main.length, CONFIG.experiment.blocks * CONFIG.experiment.trialsPerBlock);
});

test('cada distractor tiene cinco ensayos go de recuperación', () => {
  const plan = generatePlans(987654, { high: 9, neutral: 3, unknown: 0 });
  const report = validatePlan(plan);
  assert.equal(report.validRecovery, true);
  assert.equal(report.eventCount, 24);
});

test('las condiciones están balanceadas y no se repiten consecutivamente', () => {
  for (const seed of [1, 2, 3, 44, 812, 999999]) {
    const report = validatePlan(generatePlans(seed, { high: 7, neutral: 2, unknown: 0 }));
    assert.deepEqual(report.counts, { high: 8, neutral: 8, unknown: 8 });
    assert.equal(report.noAdjacentSame, true);
    assert.equal(report.valid, true);
  }
});

test('los alias no forman parte del plan experimental', () => {
  const serialized = JSON.stringify(generatePlans(12, { high: 8, neutral: 1, unknown: 0 }));
  assert.equal(serialized.includes('alias'), false);
  assert.equal(serialized.includes('nombre'), false);
});
