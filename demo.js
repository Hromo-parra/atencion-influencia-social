/* Recorrido autónomo: no usa el almacenamiento ni la lógica de captura del estudio. */
(() => {
  'use strict';
  const config = window.DEMO_CONFIG;
  const app = document.querySelector('#demo-app');
  if (!config || !app) return;
  const steps = config.steps;
  let index = -1;
  let pendingTimer;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const button = (label, id, secondary = false) => `<button type="button" class="btn${secondary ? ' secondary' : ''}" id="${id}">${esc(label)}</button>`;
  const actions = (nextLabel = 'Continuar') => `<div class="actions">${button(nextLabel, 'next')}${index > 0 ? button('Anterior', 'previous', true) : ''}</div>`;
  function wrap(content) {
    app.innerHTML = `<div class="shell"><div class="top"><a class="back" href="index.html">← Volver a la app</a><span class="badge">DEMO · DATOS FICTICIOS</span></div><section class="card"><div class="progress">${index < 0 ? 'Presentación' : index >= steps.length ? 'Resumen' : `Paso ${index + 1} de ${steps.length}`}</div><div class="track"><span style="width:${index < 0 ? 0 : Math.min(100, Math.round((index + 1) / steps.length * 100))}%"></span></div>${content}</section><p class="footer-note">Esta demostración no solicita consentimiento, no guarda respuestas y no produce datos de investigación. Las tareas y tiempos están abreviados para una exposición.</p></div>`;
    const next = app.querySelector('#next');
    if (next) next.onclick = () => { index++; render(); };
    const prev = app.querySelector('#previous');
    if (prev) prev.onclick = () => { index--; render(); };
    const restart = app.querySelector('#restart');
    if (restart) restart.onclick = () => { index = -1; render(); };
  }
  function render() {
    clearTimeout(pendingTimer);
    pendingTimer = undefined;
    if (index < 0) {
      document.title = `Demo · ${config.title}`;
      wrap(`<div class="eyebrow">${esc(config.team)}</div><h1>${esc(config.title)}</h1><p>${esc(config.intro)}</p><p class="muted">Duración aproximada: ${esc(config.duration || '2–3 minutos')}.</p>${actions('Iniciar demostración')}`);
      return;
    }
    if (index >= steps.length) {
      wrap(`<div class="eyebrow">Fin de la demostración</div><h1>Así funciona ${esc(config.title)}</h1><p>${esc(config.outro)}</p><div class="actions">${button('Repetir demo', 'restart')}${button('Volver a la app', 'back-app', true)}</div>`);
      app.querySelector('#back-app').onclick = () => { location.href = 'index.html'; };
      return;
    }
    const step = steps[index];
    const heading = `<div class="eyebrow">${esc(step.label || 'Ejemplo')}</div><h2>${esc(step.title)}</h2><p>${esc(step.text)}</p>`;
    if (step.type === 'info') {
      wrap(heading + (step.points ? `<ul>${step.points.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '') + actions());
    } else if (step.type === 'choice') renderChoice(step, heading);
    else if (step.type === 'scale') renderScale(step, heading);
    else if (step.type === 'timer') renderTimer(step, heading);
    else if (step.type === 'cpt') renderCpt(step, heading);
    else if (step.type === 'nback') renderNback(step, heading);
    else if (step.type === 'pvt') renderPvt(step, heading);
    else if (step.type === 'video') renderVideo(step, heading);
    else wrap(heading + actions());
  }
  function renderChoice(step, heading) {
    wrap(heading + `<div class="task"><p><strong>${esc(step.question)}</strong></p><div class="options">${step.options.map((x, i) => `<button type="button" class="option" data-answer="${i}">${esc(x)}</button>`).join('')}</div><p class="feedback" aria-live="polite">Elige una respuesta de ejemplo.</p></div>` + actions());
    app.querySelectorAll('[data-answer]').forEach(el => el.onclick = () => {
      app.querySelectorAll('[data-answer]').forEach(x => x.classList.remove('selected'));
      el.classList.add('selected');
      app.querySelector('.feedback').textContent = step.feedback || 'En el estudio se registraría esta elección.';
    });
  }
  function renderScale(step, heading) {
    wrap(heading + `<div class="task"><p><strong>${esc(step.prompt)}</strong></p><input class="meter" id="rating" aria-label="Valoración" type="range" min="${step.min || 1}" max="${step.max || 9}" value="${step.value || 5}"><div class="scale-line"><span>${esc(step.left || 'Nada')}</span><span>${esc(step.right || 'Mucho')}</span></div><p class="feedback" aria-live="polite">Valor elegido: <span id="rating-value">${step.value || 5}</span></p></div>` + actions());
    app.querySelector('#rating').oninput = event => { app.querySelector('#rating-value').textContent = event.target.value; };
  }
  function renderTimer(step, heading) {
    let started = 0;
    wrap(heading + `<div class="task"><div class="stimulus">${esc(step.target || '2 s')}</div><p>No aparece un cronómetro durante el ensayo.</p><button class="btn" id="timer-button">Iniciar</button><p class="feedback" aria-live="polite"></p></div>` + actions());
    app.querySelector('#timer-button').onclick = event => {
      if (!started) { started = performance.now(); event.target.textContent = 'Detener'; app.querySelector('.feedback').textContent = 'Calcula el intervalo y detén cuando creas que pasó.'; }
      else { const elapsed = (performance.now() - started) / 1000; event.target.disabled = true; app.querySelector('.feedback').textContent = `Produjiste ${elapsed.toFixed(2)} segundos. En el estudio se registra el tiempo y el error respecto al objetivo.`; }
    };
  }
  function renderCpt(step, heading) {
    const letters = step.letters || ['A','M','X','R','X','T']; let n = 0, correct = 0;
    wrap(heading + `<div class="notification">Notificación simulada: «${esc(step.notification || 'Alguien conocido está cerca')}»</div><div class="task"><p>Responde a cada letra, excepto a X.</p><div class="stimulus" id="letter">${letters[0]}</div><p id="trial-count">Ensayo 1 de ${letters.length}</p><div class="actions" style="justify-content:center">${button('Responder', 'respond')}${button('No responder', 'omit', true)}</div><p class="feedback" aria-live="polite"></p></div>` + actions());
    const answer = didRespond => {
      if (n >= letters.length) return;
      if (didRespond === (letters[n] !== 'X')) correct++;
      n++;
      if (n < letters.length) { app.querySelector('#letter').textContent = letters[n]; app.querySelector('#trial-count').textContent = `Ensayo ${n + 1} de ${letters.length}`; }
      else { app.querySelector('#letter').textContent = '✓'; app.querySelector('#trial-count').textContent = 'Bloque abreviado terminado'; app.querySelector('#respond').disabled = true; app.querySelector('#omit').disabled = true; app.querySelector('.feedback').textContent = `${correct} de ${letters.length} respuestas según la regla. El estudio completo usa más ensayos y mide la recuperación tras distractores.`; }
    };
    app.querySelector('#respond').onclick = () => answer(true);
    app.querySelector('#omit').onclick = () => answer(false);
  }
  function renderNback(step, heading) {
    const letters = step.letters || ['A','B','A','C','B','C']; let n = 0, correct = 0;
    wrap(heading + `<div class="task"><p>Indica si la letra coincide con la de dos posiciones antes.</p><div class="stimulus" id="letter">${letters[0]}</div><p id="trial-count">Letra 1 de ${letters.length}</p><div class="actions" style="justify-content:center">${button('Coincide', 'match')}${button('No coincide', 'no-match', true)}</div><p class="feedback" aria-live="polite"></p></div>` + actions());
    const answer = match => {
      if (n >= letters.length) return;
      if (match === (n >= 2 && letters[n] === letters[n - 2])) correct++;
      n++;
      if (n < letters.length) { app.querySelector('#letter').textContent = letters[n]; app.querySelector('#trial-count').textContent = `Letra ${n + 1} de ${letters.length}`; }
      else { app.querySelector('#letter').textContent = '✓'; app.querySelector('#trial-count').textContent = 'Muestra terminada'; app.querySelector('#match').disabled = true; app.querySelector('#no-match').disabled = true; app.querySelector('.feedback').textContent = `${correct} de ${letters.length} respuestas según la regla. Esta versión no guarda resultados.`; }
    };
    app.querySelector('#match').onclick = () => answer(true);
    app.querySelector('#no-match').onclick = () => answer(false);
  }
  function renderPvt(step, heading) {
    let n = 0, start = 0, waiting = false;
    wrap(heading + `<div class="task"><div class="stimulus" id="signal">·</div><p id="trial-count">Reacción 1 de 3</p><button class="btn" id="react">Preparar señal</button><p class="feedback" aria-live="polite"></p></div>` + actions());
    const trigger = () => {
      if (n >= 3) return;
      if (!waiting && !start) {
        waiting = true; app.querySelector('#react').textContent = 'Espera…'; app.querySelector('.feedback').textContent = 'Espera a que aparezca ●.';
        pendingTimer = setTimeout(() => { waiting = false; start = performance.now(); app.querySelector('#signal').textContent = '●'; app.querySelector('#react').textContent = '¡Responder!'; }, 400 + Math.random() * 500);
      } else if (waiting) { clearTimeout(pendingTimer); waiting = false; app.querySelector('.feedback').textContent = 'Respuesta anticipada. Repite este ensayo.'; app.querySelector('#react').textContent = 'Preparar señal'; }
      else { const rt = Math.round(performance.now() - start); start = 0; n++; app.querySelector('#signal').textContent = '·'; app.querySelector('.feedback').textContent = `Tiempo de reacción: ${rt} ms${n === 3 ? '. Muestra terminada.' : '.'}`; app.querySelector('#trial-count').textContent = n === 3 ? 'Tres reacciones completadas' : `Reacción ${n + 1} de 3`; app.querySelector('#react').textContent = 'Preparar señal'; if (n === 3) app.querySelector('#react').disabled = true; }
    };
    app.querySelector('#react').onclick = trigger;
  }
  function renderVideo(step, heading) {
    wrap(heading + `<div class="task"><video class="video" controls preload="metadata" aria-label="Estímulo audiovisual del estudio"><source src="${esc(step.src)}" type="video/mp4">Tu navegador no admite este video.</video><p class="muted">En el protocolo, el evento se presenta una sola vez. Aquí puedes adelantar o pasar a la siguiente pantalla.</p></div>` + actions());
  }
  render();
})();
