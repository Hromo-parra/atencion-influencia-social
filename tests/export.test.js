import test from 'node:test';
import assert from 'node:assert/strict';
import { computeSummary, toCsv } from '../src/export.js';

test('el resumen calcula captura respecto de la ventana local previa', () => {
  const common = { session_id: 's1', participant_id: 'p1', block: 1, correct: 1, target: 1, rt_valid: 1 };
  const pre = [400, 410, 420, 430, 440].map((rt, index) => ({ ...common, stage: 'main', trial_in_block: index + 1, rt_ms: rt, post_distractor_lag: 0, distractor_event_id: '', distractor_category: 'none' }));
  const post = [500, 470, 450, 430, 420].map((rt, index) => ({ ...common, stage: 'main', trial_in_block: index + 6, rt_ms: rt, post_distractor_lag: index + 1, distractor_event_id: 'd1', distractor_category: 'high' }));
  const summary = computeSummary([...pre, ...post]);
  const high = summary.find((row) => row.condition === 'high');
  assert.equal(high.local_baseline_median_rt_ms, 420);
  assert.equal(high.capture_cost_ms, 80);
  assert.equal(high.cost_lag_5_ms, 0);
});

test('CSV escapa comas, comillas y saltos de línea', () => {
  const csv = toCsv([{ id: 1, text: 'a,"b"\nc' }]);
  assert.match(csv, /"a,""b""\nc"/);
});
