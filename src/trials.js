import { CONFIG } from './config.js';
import { mulberry32, shuffle } from './prng.js';

const LETTERS = ['A', 'B', 'D', 'E', 'F', 'G', 'H', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'U', 'V', 'Y'];
const NO_GO = 'X';

function choose(items, random) {
  return items[Math.floor(random() * items.length)];
}

function baseTrials({ count, stage, block, random, noGoRate = CONFIG.experiment.noGoRate }) {
  const noGoCount = Math.round(count * noGoRate);
  const noGoIndices = new Set(shuffle(Array.from({ length: count }, (_, index) => index), random).slice(0, noGoCount));
  return Array.from({ length: count }, (_, index) => {
    const target = noGoIndices.has(index) ? 0 : 1;
    return {
      trial_id: `${stage}_b${block}_${index + 1}`,
      stage,
      block,
      trial_in_block: index + 1,
      stimulus: target ? choose(LETTERS, random) : NO_GO,
      target,
      correct_response: target ? 'space' : 'none',
      distractor_event_id: '',
      distractor_category: 'none',
      salience_score: '',
      post_distractor_lag: 0,
      show_distractor_before: false,
      probe_after: false,
    };
  });
}

function evenlySpacedPositions(count, number, random) {
  const margin = 7;
  const usable = count - margin * 2;
  const step = usable / number;
  return Array.from({ length: number }, (_, index) => {
    const center = margin + Math.floor(step * index + step / 2);
    const jitter = Math.floor(random() * 3) - 1;
    return Math.max(margin, Math.min(count - margin - 1, center + jitter));
  });
}

function conditionSequence(total, random) {
  const conditions = Array.from({ length: total }, (_, index) => CONFIG.conditions[index % CONFIG.conditions.length]);
  let result = shuffle(conditions, random);
  // Corrige repeticiones consecutivas sin cambiar el balance total.
  for (let i = 1; i < result.length; i += 1) {
    if (result[i] !== result[i - 1]) continue;
    const swapIndex = result.findIndex((value, candidate) => candidate > i && value !== result[i] && value !== result[candidate - 1]);
    if (swapIndex > i) [result[i], result[swapIndex]] = [result[swapIndex], result[i]];
  }
  return result;
}

export function generatePlans(seed, salienceScores) {
  const random = mulberry32(seed);
  const practice = baseTrials({ count: CONFIG.experiment.practiceTrials, stage: 'practice', block: 0, random, noGoRate: 0.2 });
  const baseline = baseTrials({ count: CONFIG.experiment.baselineTrials, stage: 'baseline', block: 0, random });
  const totalEvents = CONFIG.experiment.blocks * CONFIG.experiment.distractorsPerBlock;
  const conditions = conditionSequence(totalEvents, random);
  let eventOffset = 0;

  const main = Array.from({ length: CONFIG.experiment.blocks }, (_, blockIndex) => {
    const block = blockIndex + 1;
    const trials = baseTrials({ count: CONFIG.experiment.trialsPerBlock, stage: 'main', block, random });
    const positions = evenlySpacedPositions(trials.length, CONFIG.experiment.distractorsPerBlock, random);

    positions.forEach((position, localEventIndex) => {
      const eventNumber = eventOffset + localEventIndex + 1;
      const category = conditions[eventOffset + localEventIndex];
      const eventId = `distractor_${String(eventNumber).padStart(2, '0')}`;
      const probeAfter = random() < CONFIG.experiment.probeRatePerDistractor;

      for (let lag = 1; lag <= CONFIG.experiment.recoveryTrials; lag += 1) {
        const trial = trials[position + lag - 1];
        trial.distractor_event_id = eventId;
        trial.distractor_category = category;
        trial.salience_score = salienceScores[category] ?? 0;
        trial.post_distractor_lag = lag;
        // Se fuerza un ensayo go en la ventana para estimar RT en cada lag.
        trial.target = 1;
        trial.correct_response = 'space';
        if (trial.stimulus === NO_GO) trial.stimulus = choose(LETTERS, random);
      }
      trials[position].show_distractor_before = true;
      trials[position + CONFIG.experiment.recoveryTrials - 1].probe_after = probeAfter;
    });
    eventOffset += CONFIG.experiment.distractorsPerBlock;
    return trials;
  }).flat();

  return { practice, baseline, main };
}

export function validatePlan(plan) {
  const events = new Map();
  for (const trial of plan.main) {
    if (!trial.distractor_event_id) continue;
    if (!events.has(trial.distractor_event_id)) events.set(trial.distractor_event_id, []);
    events.get(trial.distractor_event_id).push(trial);
  }
  const validRecovery = [...events.values()].every((rows) => {
    const lags = rows.map((row) => row.post_distractor_lag).sort((a, b) => a - b);
    return lags.join(',') === '1,2,3,4,5' && rows.every((row) => row.target === 1);
  });
  const categories = [...events.values()].map((rows) => rows[0].distractor_category);
  const counts = Object.fromEntries(CONFIG.conditions.map((condition) => [condition, categories.filter((value) => value === condition).length]));
  const noAdjacentSame = categories.every((condition, index) => index === 0 || condition !== categories[index - 1]);
  return { valid: validRecovery && noAdjacentSame && Object.values(counts).every((count) => count === 8), validRecovery, noAdjacentSame, counts, eventCount: events.size };
}
