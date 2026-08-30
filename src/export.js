import { CONDITION_LABELS, CONFIG } from './config.js';

function escapeCell(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toCsv(rows) {
  if (!rows.length) return '';
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  return [columns.join(','), ...rows.map((row) => columns.map((column) => escapeCell(row[column])).join(','))].join('\n');
}

export function download(content, filename, type = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function median(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function computeSummary(trials) {
  const bySession = trials.reduce((map, row) => map.set(row.session_id, [...(map.get(row.session_id) || []), row]), new Map());
  const summaries = [];
  bySession.forEach((rows, sessionId) => {
    const main = rows.filter((row) => row.stage === 'main').sort((a, b) => a.block - b.block || a.trial_in_block - b.trial_in_block);
    const globalBaselineRt = median(rows.filter((row) => row.stage === 'baseline' && row.correct === 1 && row.target === 1 && row.rt_valid === 1).map((row) => Number(row.rt_ms)));
    const events = new Map();
    main.forEach((row, index) => {
      if (!row.distractor_event_id) return;
      if (!events.has(row.distractor_event_id)) {
        const preRows = main.slice(Math.max(0, index - CONFIG.experiment.baselineWindow), index)
          .filter((candidate) => candidate.correct === 1 && candidate.target === 1 && candidate.rt_valid === 1 && candidate.post_distractor_lag === 0);
        events.set(row.distractor_event_id, {
          condition: row.distractor_category,
          baselineRt: median(preRows.map((candidate) => Number(candidate.rt_ms))),
          rows: [],
        });
      }
      events.get(row.distractor_event_id).rows.push(row);
    });
    for (const condition of CONFIG.conditions) {
      const conditionEvents = [...events.values()].filter((event) => event.condition === condition);
      const row = {
        session_id: sessionId,
        participant_id: rows[0]?.participant_id || '',
        condition,
        condition_label: CONDITION_LABELS[condition],
        global_baseline_median_rt_ms: globalBaselineRt ?? '',
        local_baseline_median_rt_ms: median(conditionEvents.map((event) => event.baselineRt)) ?? '',
        valid_distractor_events: conditionEvents.filter((event) => event.baselineRt !== null).length,
      };
      for (let lag = 1; lag <= CONFIG.experiment.recoveryTrials; lag += 1) {
        const lagRows = conditionEvents.flatMap((event) => event.rows.filter((trial) => trial.post_distractor_lag === lag));
        const rt = median(lagRows.filter((trial) => trial.correct === 1 && trial.rt_valid === 1).map((trial) => Number(trial.rt_ms)));
        const costs = conditionEvents.flatMap((event) => {
          const trial = event.rows.find((candidate) => candidate.post_distractor_lag === lag);
          return event.baselineRt !== null && trial?.correct === 1 && trial.rt_valid === 1 ? [Number(trial.rt_ms) - event.baselineRt] : [];
        });
        row[`median_rt_lag_${lag}_ms`] = rt ?? '';
        const cost = median(costs);
        row[`cost_lag_${lag}_ms`] = cost === null ? '' : Math.round(cost * 100) / 100;
        row[`error_rate_lag_${lag}`] = lagRows.length ? lagRows.filter((trial) => trial.correct !== 1).length / lagRows.length : '';
      }
      row.capture_cost_ms = row.cost_lag_1_ms;
      summaries.push(row);
    }
  });
  return summaries;
}
