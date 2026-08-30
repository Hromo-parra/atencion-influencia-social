export const CONFIG = Object.freeze({
  appName: 'Atención bajo influencia social',
  version: '0.1.0-piloto',
  eligibility: { minAge: 18 },
  keys: { go: ' ' },
  timing: {
    fixationMs: 250,
    stimulusMs: 800,
    interTrialMs: 250,
    distractorMs: 700,
    practiceFeedbackMs: 450,
    minValidRtMs: 120,
  },
  experiment: {
    practiceTrials: 24,
    baselineTrials: 48,
    blocks: 3,
    trialsPerBlock: 84,
    noGoRate: 0.12,
    distractorsPerBlock: 8,
    recoveryTrials: 5,
    probeRatePerDistractor: 0.5,
    baselineWindow: 5,
  },
  conditions: ['high', 'neutral', 'unknown'],
});

export const CONDITION_LABELS = Object.freeze({
  high: 'Alta saliencia',
  neutral: 'Persona conocida neutra',
  unknown: 'Persona desconocida',
});
