import { CONDITION_LABELS, CONFIG } from './src/config.js';
import { integerSeed } from './src/prng.js';
import { generatePlans, validatePlan } from './src/trials.js';
import { clearAll, getAll, putRecord } from './src/storage.js';
import { computeSummary, download, toCsv } from './src/export.js';

const app = document.querySelector('#app');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let session = null;
let aliases = null;
let plans = null;
let focusCompromised = false;

window.addEventListener('blur', () => {
  focusCompromised = true;
  if (session) saveEvent('focus_lost', { visibility_state: document.visibilityState });
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) focusCompromised = true;
  if (session) saveEvent('visibility_change', { visibility_state: document.visibilityState });
});

function frame(content, { compact = false, progress = '' } = {}) {
  return `
    <main class="shell ${compact ? 'compact-shell' : ''}">
      <header class="topbar">
        <button class="brand brand-button" id="homeLink" type="button">Laboratorio de atención</button>
        <div class="topbar-right">
          ${progress ? `<span class="progress-label">${escapeHtml(progress)}</span>` : ''}
          <span class="eyebrow">Piloto · Equipo 1</span>
        </div>
      </header>
      ${content}
    </main>`;
}

async function showHome() {
  session = null;
  aliases = null;
  plans = null;
  const sessions = await getAll('sessions').catch(() => []);
  app.innerHTML = frame(`
    <section class="hero">
      <div>
        <div class="eyebrow">Captura · recuperación · recurrencia</div>
        <h1>Atención bajo influencia social</h1>
        <p class="lede">Una tarea experimental para observar cuánto interrumpe una señal interpersonal y cuánto tarda la atención en regresar a su meta.</p>
        <div class="actions">
          <button class="btn" id="startBtn">Comenzar piloto</button>
          <button class="btn secondary" id="researcherBtn">Modo investigador</button>
        </div>
        <p class="privacy-note">Los alias se utilizan sólo durante la sesión y no se guardan en los archivos de resultados.</p>
      </div>
      <aside class="experiment-card" aria-label="Vista previa de la tarea">
        <div class="eyebrow">Tarea continua de atención</div>
        <div class="screen-demo">
          <div class="letter">M</div>
          <div class="notification"><strong>Nueva notificación</strong><br />Mensaje de Persona A</div>
        </div>
        <div class="metric-row">
          <div class="metric"><strong>Post 1</strong><span>captura inmediata</span></div>
          <div class="metric"><strong>Post 2–5</strong><span>recuperación</span></div>
          <div class="metric"><strong>Sonda</strong><span>pensamiento</span></div>
        </div>
      </aside>
    </section>
    ${sessions.length ? `<p class="local-count">Este dispositivo contiene ${sessions.length} sesión${sessions.length === 1 ? '' : 'es'} local${sessions.length === 1 ? '' : 'es'}.</p>` : ''}
  `);
  document.querySelector('#startBtn').onclick = showConsent;
  document.querySelector('#researcherBtn').onclick = showResearcher;
  wireHome();
}

function showConsent() {
  app.innerHTML = frame(`
    <section class="form-card narrow">
      <div class="eyebrow">Antes de comenzar</div>
      <h2>Consentimiento para piloto técnico</h2>
      <div class="reading-box">
        <p>Esta es una versión piloto de una tarea de atención. Verás letras y notificaciones simuladas vinculadas con alias elegidos por ti. La actividad dura aproximadamente 12–18 minutos.</p>
        <p>Puedes retirarte en cualquier momento. La tarea no proporciona diagnóstico ni evaluación clínica. No escribas nombres completos: usa iniciales, apodos o alias.</p>
        <p><strong>Importante:</strong> este texto es una plantilla técnica y debe sustituirse por el consentimiento aprobado antes de una recolección formal.</p>
      </div>
      <label class="check-row"><input type="checkbox" id="consentCheck" /> Soy mayor de 18 años, leí la información y acepto participar voluntariamente.</label>
      <div class="actions form-actions">
        <button class="btn" id="continueBtn" disabled>Continuar</button>
        <button class="btn secondary" id="cancelBtn">Cancelar</button>
      </div>
    </section>
  `, { compact: true });
  const check = document.querySelector('#consentCheck');
  const button = document.querySelector('#continueBtn');
  check.onchange = () => { button.disabled = !check.checked; };
  button.onclick = showParticipantForm;
  document.querySelector('#cancelBtn').onclick = showHome;
  wireHome();
}

function showParticipantForm() {
  const suggestedId = `E1-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  app.innerHTML = frame(`
    <section class="form-card narrow">
      <div class="eyebrow">Paso 1 de 3</div>
      <h2>Datos de la sesión</h2>
      <form id="participantForm" class="form-grid">
        <label>Código anónimo<input id="participantId" value="${suggestedId}" maxlength="40" required pattern="[A-Za-z0-9_-]{4,40}" /></label>
        <label>Edad<input id="age" type="number" min="18" max="99" required /></label>
        <label>Escolaridad
          <select id="education" required><option value="">Selecciona</option><option>Preparatoria</option><option>Licenciatura</option><option>Posgrado</option><option>Otra</option></select>
        </label>
        <label>Horas de sueño anoche<input id="sleepHours" type="number" min="0" max="24" step="0.5" required /></label>
        <label class="check-row full"><input type="checkbox" id="spanishCheck" required /> Comprendo instrucciones en español.</label>
        <label class="check-row full"><input type="checkbox" id="keyboardCheck" required /> Estoy usando computadora con teclado físico.</label>
        <div id="formError" class="full"></div>
        <button class="btn full" type="submit">Continuar</button>
      </form>
    </section>
  `, { compact: true });
  document.querySelector('#participantForm').onsubmit = (event) => {
    event.preventDefault();
    const participantId = document.querySelector('#participantId').value.trim();
    const age = Number(document.querySelector('#age').value);
    const isDesktop = document.querySelector('#keyboardCheck').checked && window.innerWidth >= 768;
    if (!/^[A-Za-z0-9_-]{4,40}$/.test(participantId) || age < CONFIG.eligibility.minAge || !isDesktop) {
      document.querySelector('#formError').innerHTML = '<div class="error">Se requiere un código válido, mayoría de edad y computadora con teclado físico.</div>';
      return;
    }
    session = {
      session_id: `${participantId}_${Date.now()}`,
      participant_id: participantId,
      random_seed: integerSeed(),
      app_version: CONFIG.version,
      status: 'setup',
      started_at: new Date().toISOString(),
      age,
      education: document.querySelector('#education').value,
      sleep_hours: Number(document.querySelector('#sleepHours').value),
      user_agent: navigator.userAgent,
      resolution: `${window.screen.width}x${window.screen.height}`,
    };
    showRelevanceSetup();
  };
  wireHome();
}

function slider(name, label) {
  return `<label class="slider-field"><span>${label}</span><span class="range-wrap"><input type="range" name="${name}" min="0" max="10" value="5" /><output>5</output></span></label>`;
}

function personRatings(prefix) {
  return [
    slider(`${prefix}_closeness`, 'Cercanía emocional'),
    slider(`${prefix}_attraction`, 'Atracción romántica'),
    slider(`${prefix}_thought`, 'Frecuencia de pensamiento'),
    slider(`${prefix}_contact`, 'Deseo de contacto'),
    slider(`${prefix}_importance`, 'Importancia personal'),
    slider(`${prefix}_communication`, 'Frecuencia de comunicación'),
  ].join('');
}

function showRelevanceSetup() {
  app.innerHTML = frame(`
    <section class="form-card wide-card">
      <div class="eyebrow">Paso 2 de 3</div>
      <h2>Prepara dos alias</h2>
      <p class="section-intro">Usa iniciales, apodos o nombres ficticios breves. Los alias aparecerán en pantalla, pero no se almacenarán.</p>
      <form id="relevanceForm">
        <div class="people-grid">
          <section class="person-panel high-panel">
            <span class="condition-pill high">Persona A · alta relevancia</span>
            <label>Alias<input id="highAlias" maxlength="12" placeholder="Ej. L" required /></label>
            ${personRatings('high')}
          </section>
          <section class="person-panel neutral-panel">
            <span class="condition-pill neutral">Persona B · conocida neutra</span>
            <label>Alias<input id="neutralAlias" maxlength="12" placeholder="Ej. M" required /></label>
            ${personRatings('neutral')}
          </section>
        </div>
        <div class="unknown-callout"><strong>Persona C · desconocida:</strong> la app utilizará el alias estandarizado “Alex”.</div>
        <div id="relevanceError"></div>
        <div class="actions form-actions"><button class="btn" type="submit">Guardar y ver instrucciones</button></div>
      </form>
    </section>
  `, { compact: true });
  document.querySelectorAll('input[type="range"]').forEach((input) => {
    input.oninput = () => { input.nextElementSibling.value = input.value; };
  });
  document.querySelector('#relevanceForm').onsubmit = async (event) => {
    event.preventDefault();
    const highAlias = document.querySelector('#highAlias').value.trim();
    const neutralAlias = document.querySelector('#neutralAlias').value.trim();
    if (!highAlias || !neutralAlias || highAlias.toLocaleLowerCase() === neutralAlias.toLocaleLowerCase()) {
      document.querySelector('#relevanceError').innerHTML = '<div class="error">Usa dos alias diferentes.</div>';
      return;
    }
    const values = Object.fromEntries([...new FormData(event.currentTarget)].filter(([key]) => key.includes('_')).map(([key, value]) => [key, Number(value)]));
    const highScore = mean(['closeness', 'attraction', 'thought', 'contact', 'importance'].map((key) => values[`high_${key}`]));
    const neutralScore = mean(['closeness', 'attraction', 'thought', 'contact', 'importance'].map((key) => values[`neutral_${key}`]));
    if (highScore <= neutralScore) {
      document.querySelector('#relevanceError').innerHTML = '<div class="warning">La Persona A no obtuvo mayor saliencia que la Persona B. Revisa tus valoraciones antes de continuar.</div>';
      return;
    }
    aliases = { high: highAlias, neutral: neutralAlias, unknown: 'Alex' };
    plans = generatePlans(session.random_seed, { high: highScore, neutral: neutralScore, unknown: 0 });
    const validation = validatePlan(plans);
    if (!validation.valid) throw new Error('El plan experimental no superó la validación interna.');
    session = { ...session, status: 'active', salience_high: highScore, salience_neutral: neutralScore, alias_high_length: highAlias.length, alias_neutral_length: neutralAlias.length, plan_validation: validation };
    await putRecord('sessions', session);
    await putRecord('assessments', { row_id: `${session.session_id}_relevance`, session_id: session.session_id, participant_id: session.participant_id, assessment: 'relevance_pre', ...values, salience_high: highScore, salience_neutral: neutralScore, alias_high_length: highAlias.length, alias_neutral_length: neutralAlias.length, timestamp: new Date().toISOString() });
    showInstructions();
  };
  wireHome();
}

function showInstructions() {
  app.innerHTML = frame(`
    <section class="form-card narrow instruction-card">
      <div class="eyebrow">Paso 3 de 3</div>
      <h2>Tu única meta es responder a las letras</h2>
      <div class="instruction-key"><span>ESPACIO</span></div>
      <p>Presiona la barra espaciadora ante todas las letras <strong>excepto X</strong>. Si aparece X, no respondas.</p>
      <p>En algunos momentos verás una notificación. Ignórala y continúa con la tarea. También aparecerán preguntas breves sobre lo que estabas pensando.</p>
      <div class="protocol-strip"><span>Letra común → responder</span><span>X → no responder</span><span>Notificación → ignorar</span></div>
      <label class="check-row"><input type="checkbox" id="readyCheck" /> Entiendo las instrucciones y estoy en un lugar sin interrupciones.</label>
      <div class="actions form-actions"><button class="btn" id="practiceBtn" disabled>Iniciar práctica</button><button class="btn secondary" id="fullscreenBtn">Pantalla completa</button></div>
    </section>
  `, { compact: true });
  const ready = document.querySelector('#readyCheck');
  const start = document.querySelector('#practiceBtn');
  ready.onchange = () => { start.disabled = !ready.checked; };
  document.querySelector('#fullscreenBtn').onclick = () => document.documentElement.requestFullscreen?.().catch(() => {});
  start.onclick = runExperiment;
  wireHome(false);
}

async function runExperiment() {
  await saveEvent('experiment_started');
  await runPhase(plans.practice, { practice: true, title: 'Práctica' });
  await showIntermission('Práctica completa', 'Ahora inicia el bloque basal, todavía sin notificaciones.', 'Continuar');
  await runPhase(plans.baseline, { title: 'Bloque basal' });

  const blocks = Array.from({ length: CONFIG.experiment.blocks }, (_, index) => plans.main.filter((trial) => trial.block === index + 1));
  for (let i = 0; i < blocks.length; i += 1) {
    await showIntermission(`Bloque ${i + 1} de ${blocks.length}`, i === 0 ? 'Comenzarán a aparecer notificaciones. Mantén tu atención en las letras.' : 'Descansa unos segundos. Continúa cuando estés listo/a.', 'Iniciar bloque');
    await runPhase(blocks[i], { title: `Bloque ${i + 1}` });
  }
  await showPostQuestionnaire();
}

async function runPhase(trials, { practice = false, title = '' } = {}) {
  for (let index = 0; index < trials.length; index += 1) {
    const trial = trials[index];
    if (trial.show_distractor_before) await showDistractor(trial);
    const row = await runTrial(trial, { practice, title, index, total: trials.length });
    await putRecord('trials', row);
    if (trial.probe_after) await showProbe(trial);
  }
}

async function showDistractor(trial) {
  const alias = aliases[trial.distractor_category];
  const onset = performance.now();
  app.innerHTML = `<main class="task-shell"><div class="notification-stage"><div class="large-notification"><span>Nueva notificación</span><strong>Mensaje de ${escapeHtml(alias)}</strong></div></div></main>`;
  await saveEvent('distractor_onset', { distractor_event_id: trial.distractor_event_id, distractor_category: trial.distractor_category, salience_score: trial.salience_score, performance_ms: round(onset) });
  await sleep(CONFIG.timing.distractorMs);
}

async function runTrial(trial, { practice, title, index, total }) {
  focusCompromised = !document.hasFocus();
  app.innerHTML = `<main class="task-shell"><div class="task-progress"><span>${escapeHtml(title)}</span><span>${index + 1}/${total}</span></div><div class="stimulus-stage"><div class="fixation">+</div></div></main>`;
  await sleep(CONFIG.timing.fixationMs);
  const stage = document.querySelector('.stimulus-stage');
  const onset = performance.now();
  let response = '';
  let rt = null;
  let finished = false;

  await new Promise((resolve) => {
    const finish = () => {
      if (finished) return;
      finished = true;
      window.removeEventListener('keydown', handler);
      resolve();
    };
    const handler = (event) => {
      if (event.code !== 'Space' || event.repeat) return;
      event.preventDefault();
      if (response) return;
      response = 'space';
      rt = performance.now() - onset;
      finish();
    };
    stage.innerHTML = `<div class="cpt-letter">${trial.stimulus}</div><div class="key-hint">ESPACIO ante todas excepto X</div>`;
    window.addEventListener('keydown', handler);
    setTimeout(finish, CONFIG.timing.stimulusMs);
  });
  const correct = Number((trial.target === 1 && response === 'space') || (trial.target === 0 && response === ''));
  const omission = Number(trial.target === 1 && !response);
  const falseAlarm = Number(trial.target === 0 && response === 'space');
  const rtValid = Number(rt !== null && rt >= CONFIG.timing.minValidRtMs && rt <= CONFIG.timing.stimulusMs);
  const validationFlag = rt !== null && rt < CONFIG.timing.minValidRtMs ? 'anticipatory' : focusCompromised ? 'focus_compromised' : '';

  if (practice) {
    stage.innerHTML = `<div class="practice-feedback ${correct ? 'correct' : 'incorrect'}">${correct ? 'Correcto' : trial.target ? 'Debías responder' : 'Ante X no respondas'}</div>`;
    await sleep(CONFIG.timing.practiceFeedbackMs);
  }
  await sleep(CONFIG.timing.interTrialMs);
  return {
    row_id: `${session.session_id}_${trial.trial_id}`,
    session_id: session.session_id,
    participant_id: session.participant_id,
    random_seed: session.random_seed,
    ...trial,
    response,
    correct,
    omission,
    false_alarm: falseAlarm,
    rt_ms: rt === null ? '' : round(rt),
    rt_valid: rtValid,
    validation_flag: validationFlag,
    window_focus: focusCompromised ? 'compromised' : 'focused',
    stimulus_onset_performance_ms: round(onset),
    timestamp: new Date().toISOString(),
  };
}

function showProbe(trial) {
  return new Promise((resolve) => {
    const start = performance.now();
    app.innerHTML = `<main class="task-shell probe-shell"><section class="probe-card"><div class="eyebrow">Sonda de pensamiento</div><h2>Justo antes de esta pregunta, ¿en qué estabas pensando?</h2><div class="probe-options">
      <button data-value="task">En la tarea</button><button data-value="recent_person">En la persona presentada recientemente</button><button data-value="other_person">En otra persona</button><button data-value="other">En otra cosa</button>
    </div></section></main>`;
    document.querySelectorAll('[data-value]').forEach((button) => {
      button.onclick = async () => {
        await putRecord('assessments', {
          row_id: `${session.session_id}_probe_${trial.distractor_event_id}`,
          session_id: session.session_id,
          participant_id: session.participant_id,
          assessment: 'thought_probe',
          distractor_event_id: trial.distractor_event_id,
          distractor_category: trial.distractor_category,
          probe_response: button.dataset.value,
          probe_rt_ms: round(performance.now() - start),
          timestamp: new Date().toISOString(),
        });
        resolve();
      };
    });
  });
}

function showIntermission(title, text, buttonLabel) {
  return new Promise((resolve) => {
    app.innerHTML = `<main class="task-shell pause-shell"><section class="pause-card"><div class="eyebrow">Pausa breve</div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(text)}</p><button class="btn" id="continuePhase">${escapeHtml(buttonLabel)}</button></section></main>`;
    document.querySelector('#continuePhase').onclick = resolve;
  });
}

function showPostQuestionnaire() {
  app.innerHTML = frame(`
    <section class="form-card wide-card">
      <div class="eyebrow">Comprobación final</div>
      <h2>¿Cómo se sintieron las notificaciones?</h2>
      <form id="postForm">
        <div class="manipulation-grid">
          ${CONFIG.conditions.map((condition) => `<section class="person-panel"><span class="condition-pill ${condition}">${CONDITION_LABELS[condition]}</span>${slider(`${condition}_urgency`, 'Urgencia percibida')}${slider(`${condition}_desire`, 'Deseo de responder')}${slider(`${condition}_thought`, 'Cuánto te hizo pensar en esa persona')}</section>`).join('')}
        </div>
        <label class="text-field">¿Notaste alguna estrategia o dificultad?<textarea id="comments" maxlength="500" rows="4" placeholder="Opcional; evita escribir nombres reales."></textarea></label>
        <button class="btn" type="submit">Finalizar sesión</button>
      </form>
    </section>
  `, { compact: true });
  document.querySelectorAll('input[type="range"]').forEach((input) => { input.oninput = () => { input.nextElementSibling.value = input.value; }; });
  document.querySelector('#postForm').onsubmit = async (event) => {
    event.preventDefault();
    const values = Object.fromEntries([...new FormData(event.currentTarget)].map(([key, value]) => [key, Number(value)]));
    await putRecord('assessments', { row_id: `${session.session_id}_manipulation`, session_id: session.session_id, participant_id: session.participant_id, assessment: 'manipulation_check', ...values, comments: document.querySelector('#comments').value.trim(), timestamp: new Date().toISOString() });
    session = { ...session, status: 'complete', completed_at: new Date().toISOString() };
    await putRecord('sessions', session);
    await saveEvent('experiment_completed');
    showFinal();
  };
}

function showFinal() {
  app.innerHTML = frame(`
    <section class="form-card narrow completion-card">
      <div class="completion-mark">✓</div>
      <div class="eyebrow">Sesión completa</div>
      <h2>Gracias por participar</h2>
      <p>Las respuestas quedaron guardadas localmente en este dispositivo. No se muestra una puntuación individual porque esta tarea no es diagnóstica.</p>
      <div class="actions form-actions"><button class="btn" id="downloadSession">Descargar esta sesión</button><button class="btn secondary" id="finishBtn">Volver al inicio</button></div>
    </section>
  `, { compact: true });
  document.querySelector('#downloadSession').onclick = downloadCurrentSession;
  document.querySelector('#finishBtn').onclick = showHome;
  wireHome();
}

async function downloadCurrentSession() {
  const [sessions, trials, assessments, events] = await Promise.all(['sessions', 'trials', 'assessments', 'events'].map(getAll));
  const payload = {
    exported_at: new Date().toISOString(),
    session: sessions.find((row) => row.session_id === session.session_id),
    trials: trials.filter((row) => row.session_id === session.session_id),
    assessments: assessments.filter((row) => row.session_id === session.session_id),
    events: events.filter((row) => row.session_id === session.session_id),
  };
  download(JSON.stringify(payload, null, 2), `${session.participant_id}_cpt_social.json`, 'application/json');
}

async function showResearcher() {
  const [sessions, trials, assessments, events] = await Promise.all(['sessions', 'trials', 'assessments', 'events'].map((name) => getAll(name).catch(() => [])));
  app.innerHTML = frame(`
    <section class="researcher-page">
      <div class="eyebrow">Modo investigador · datos locales</div>
      <div class="researcher-heading"><div><h2>Panel del piloto</h2><p>Este panel no está protegido por contraseña porque una clave incluida en una página estática no sería seguridad real.</p></div><button class="btn secondary" id="backHome">Salir</button></div>
      <div class="dashboard-stats"><div><strong>${sessions.length}</strong><span>sesiones</span></div><div><strong>${sessions.filter((row) => row.status === 'complete').length}</strong><span>completas</span></div><div><strong>${trials.length}</strong><span>ensayos</span></div><div><strong>${events.filter((row) => row.event_type === 'focus_lost').length}</strong><span>pérdidas de foco</span></div></div>
      <div class="export-bar"><button class="btn" id="exportTrials">CSV ensayos</button><button class="btn" id="exportSummary">CSV resumen</button><button class="btn secondary" id="exportAll">Respaldo JSON</button><button class="danger-button" id="clearData">Borrar datos locales</button></div>
      <div class="table-wrap"><table><thead><tr><th>Participante</th><th>Inicio</th><th>Estado</th><th>Semilla</th><th>Ensayos</th></tr></thead><tbody>${sessions.length ? sessions.sort((a, b) => b.started_at.localeCompare(a.started_at)).map((row) => `<tr><td>${escapeHtml(row.participant_id)}</td><td>${new Date(row.started_at).toLocaleString('es-MX')}</td><td><span class="status ${row.status}">${escapeHtml(row.status)}</span></td><td>${row.random_seed}</td><td>${trials.filter((trial) => trial.session_id === row.session_id).length}</td></tr>`).join('') : '<tr><td colspan="5">Todavía no hay sesiones.</td></tr>'}</tbody></table></div>
      <p class="privacy-note">Antes de una recolección formal, define el plan de transferencia, respaldo, retención y acceso institucional a los datos.</p>
    </section>
  `, { compact: true });
  document.querySelector('#backHome').onclick = showHome;
  document.querySelector('#exportTrials').onclick = () => download(toCsv(trials), 'cpt_social_ensayos.csv', 'text/csv;charset=utf-8');
  document.querySelector('#exportSummary').onclick = () => download(toCsv(computeSummary(trials)), 'cpt_social_resumen.csv', 'text/csv;charset=utf-8');
  document.querySelector('#exportAll').onclick = () => download(JSON.stringify({ exported_at: new Date().toISOString(), sessions, trials, assessments, events }, null, 2), 'cpt_social_respaldo.json', 'application/json');
  document.querySelector('#clearData').onclick = async () => {
    if (!confirm('¿Borrar todas las sesiones guardadas en este navegador? Descarga antes un respaldo.')) return;
    if (!confirm('Esta acción no se puede deshacer. ¿Continuar?')) return;
    await clearAll();
    showResearcher();
  };
  wireHome();
}

async function saveEvent(eventType, extra = {}) {
  if (!session) return;
  const rowId = `${session.session_id}_${eventType}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  await putRecord('events', { row_id: rowId, session_id: session.session_id, participant_id: session.participant_id, event_type: eventType, timestamp: new Date().toISOString(), ...extra });
}

function wireHome(active = true) {
  const home = document.querySelector('#homeLink');
  if (home) {
    home.disabled = !active;
    home.onclick = active ? showHome : null;
  }
}

function mean(values) { return round(values.reduce((sum, value) => sum + value, 0) / values.length); }
function round(value) { return Math.round(value * 100) / 100; }
function escapeHtml(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

showHome().catch((error) => {
  app.innerHTML = `<main class="shell"><section class="form-card narrow"><h2>No fue posible iniciar</h2><div class="error">${escapeHtml(error.message)}</div></section></main>`;
});
