/* =========================================================================
   Pulse — interface : navigation, éditeurs, visualisation, pages
   ========================================================================= */
(function () {
  'use strict';
  const { LEVELS, LESSONS, EXERCISES, GEAR, GEAR_CATS, KITS, PRESETS, CHEATSHEET, H } = window.Content;
  const view = document.getElementById('view');

  /* ---------- utilitaires ---------- */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const badge = (lvl) => `<span class="badge" style="--c:${LEVELS[lvl].color}">${LEVELS[lvl].icon} ${LEVELS[lvl].label}</span>`;
  const euro = (n) => (n === 0 ? 'Gratuit' : n.toLocaleString('fr-FR') + ' €');

  const store = {
    get(k, d) { try { const v = localStorage.getItem('pulse:' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('pulse:' + k, JSON.stringify(v)); } catch (e) { /* stockage indisponible */ } },
  };
  const doneSet = (k) => new Set(store.get(k, []));
  const markDone = (k, id) => { const s = doneSet(k); s.add(id); store.set(k, [...s]); };

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  function confetti() {
    const colors = ['#a78bfa', '#22d3ee', '#f472b6', '#34d399', '#fbbf24'];
    for (let i = 0; i < 60; i++) {
      const c = document.createElement('div');
      c.className = 'confetti';
      c.style.left = Math.random() * 100 + 'vw';
      c.style.background = colors[i % colors.length];
      c.style.animationDuration = 1.4 + Math.random() * 1.6 + 's';
      c.style.animationDelay = Math.random() * 0.3 + 's';
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 3500);
    }
  }

  /* ---------- coloration syntaxique ---------- */
  const TOKEN_RE = /(\/\/.*$)|("(?:[^"\\\n]|\\.)*"?|'(?:[^'\\\n]|\\.)*'?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)(?=\s*\()/gm;
  function highlight(code) {
    let out = '', last = 0, m;
    TOKEN_RE.lastIndex = 0;
    while ((m = TOKEN_RE.exec(code))) {
      if (m[0] === '') { TOKEN_RE.lastIndex++; continue; }
      out += esc(code.slice(last, m.index));
      if (m[1]) out += `<span class="hl-com">${esc(m[1])}</span>`;
      else if (m[2]) out += `<span class="hl-str">${esc(m[2]).replace(/([\[\]~*!@,]|&lt;|&gt;)/g, '<span class="hl-sym">$1</span>')}</span>`;
      else if (m[3]) out += `<span class="hl-num">${m[3]}</span>`;
      else if (m[4]) out += `<span class="hl-fn">${esc(m[4])}</span>`;
      last = m.index + m[0].length;
    }
    return out + esc(code.slice(last)) + '\n';
  }

  /* ---------- éditeur jouable ---------- */
  let activeEditor = null;

  function createEditor(code, opts = {}) {
    const root = el(`
      <div class="editor">
        <div class="ed-bar">
          <button class="ed-play" title="Jouer / mettre à jour (Ctrl + Entrée)">▶ Jouer</button>
          <button class="ed-stop" title="Arrêter (Ctrl + .)">■ Stop</button>
          <button class="ed-reset" title="Revenir au code d'origine">↺</button>
          <span class="ed-hint"><span class="kbd">Ctrl</span>+<span class="kbd">Entrée</span> mettre à jour · <span class="kbd">Ctrl</span>+<span class="kbd">.</span> stop</span>
        </div>
        <div class="ed-body"><pre aria-hidden="true"></pre><textarea rows="1" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" aria-label="Éditeur de code"></textarea></div>
        <canvas class="ed-viz"></canvas>
        <div class="ed-msg" role="status"></div>
      </div>`);
    const ta = $('textarea', root), pre = $('pre', root), msgEl = $('.ed-msg', root);
    const original = code;

    const ed = {
      root, canvas: $('canvas', root),
      getCode: () => ta.value,
      setCode(c) { ta.value = c; sync(); },
      msg(text, kind) {
        msgEl.textContent = text || '';
        msgEl.className = 'ed-msg' + (text ? ' show ' + kind : '');
      },
      setActive(on) {
        root.classList.toggle('is-active', on);
        $('.ed-play', root).textContent = on ? '⟳ Mettre à jour' : '▶ Jouer';
      },
      play() { return playEditor(ed); },
    };

    function sync() {
      pre.innerHTML = highlight(ta.value);
      ta.style.height = 'auto';
      ta.style.height = ta.scrollHeight + 'px';
      pre.scrollLeft = ta.scrollLeft;
      if (opts.onChange) opts.onChange(ta.value);
    }

    ta.value = code;
    ta.addEventListener('input', sync);
    ta.addEventListener('scroll', () => { pre.scrollLeft = ta.scrollLeft; });
    ta.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); opts.onRun ? opts.onRun(ed) : ed.play(); }
      else if ((e.ctrlKey || e.metaKey) && e.key === '.') { e.preventDefault(); window.Pulse.stop(); }
      else if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        const s = ta.selectionStart;
        ta.setRangeText('  ', s, ta.selectionEnd, 'end');
        sync();
      }
    });
    $('.ed-play', root).addEventListener('click', () => (opts.onRun ? opts.onRun(ed) : ed.play()));
    $('.ed-stop', root).addEventListener('click', () => window.Pulse.stop());
    $('.ed-reset', root).addEventListener('click', () => { ed.setCode(original); ed.msg('', ''); });

    // la hauteur n'est connue qu'une fois dans le DOM
    requestAnimationFrame(sync);
    return ed;
  }

  function playEditor(ed) {
    let r;
    try { r = window.Pulse.evaluate(ed.getCode()); } catch (e) { r = { ok: false, error: e.message }; }
    if (!r.ok) { ed.msg('⚠ ' + r.error, 'err'); return r; }
    ed.msg('', '');
    if (activeEditor && activeEditor !== ed) activeEditor.setActive(false);
    activeEditor = ed;
    ed.setActive(true);
    try { window.Pulse.start(); } catch (e) { ed.msg('⚠ ' + e.message, 'err'); return { ok: false, error: e.message }; }
    if (!r.tracks.length) ed.msg('Aucune piste : écris par exemple s("bd sd")', 'ok');
    return r;
  }

  window.Pulse.on((ev) => {
    document.body.classList.toggle('is-playing', ev === 'start');
    if (ev === 'stop' && activeEditor) { activeEditor.setActive(false); activeEditor = null; }
  });

  /* ---------- visualisation ---------- */
  const TRACK_COLORS = ['#a78bfa', '#22d3ee', '#f472b6', '#34d399', '#fbbf24', '#fb923c', '#60a5fa', '#e879f9'];
  let scopeBuf = null;

  function drawViz() {
    requestAnimationFrame(drawViz);
    const ed = activeEditor;
    if (!ed || !window.Pulse.isPlaying() || !document.body.contains(ed.root)) return;
    const cv = ed.canvas;
    const tracks = window.Pulse.getTracks();
    const laneH = 24, scopeH = 44, pad = 10;
    const cssH = pad * 2 + Math.max(1, tracks.length) * laneH + scopeH;
    ed.root.style.setProperty('--viz-h', cssH + 'px');
    const dpr = window.devicePixelRatio || 1;
    const W = cv.clientWidth, Hh = cssH;
    if (!W) return;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(Hh * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(Hh * dpr); }
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, Hh);

    const now = window.Pulse.now();
    const x0 = 12, w = W - 24;
    // grille des temps
    g.strokeStyle = 'rgba(255,255,255,.06)'; g.lineWidth = 1;
    for (let i = 0; i <= 16; i++) {
      const x = x0 + (w * i) / 16;
      g.globalAlpha = i % 4 === 0 ? 1 : 0.4;
      g.beginPath(); g.moveTo(x, pad); g.lineTo(x, pad + tracks.length * laneH); g.stroke();
    }
    g.globalAlpha = 1;
    g.font = '600 10px JetBrains Mono, monospace'; g.textBaseline = 'middle';

    tracks.forEach((tr, i) => {
      const col = TRACK_COLORS[i % TRACK_COLORS.length];
      const lc = now * tr.speed, c = Math.floor(lc), frac = lc - c;
      const y = pad + i * laneH + 3, h = laneH - 6;
      let evs = [];
      try { evs = tr.events(c); } catch (e) { /* ignore */ }
      // pour les accords, empile légèrement
      evs.forEach((e) => {
        const ex = x0 + e.start * w, ew = Math.max(3, e.dur * w - 2);
        const on = frac >= e.start && frac < e.start + e.dur;
        g.fillStyle = col; g.globalAlpha = on ? 1 : 0.28;
        roundRect(g, ex, y, ew, h, 4); g.fill();
        if (ew > 22) {
          g.globalAlpha = on ? 1 : 0.8;
          g.fillStyle = on ? '#0b0b14' : '#ececf6';
          g.fillText(String(e.value).slice(0, Math.floor(ew / 7)), ex + 5, y + h / 2 + 1);
        }
      });
      g.globalAlpha = 1;
      g.fillStyle = '#fff';
      g.fillRect(x0 + frac * w, y - 2, 2, h + 4);
    });

    // oscilloscope
    const an = window.Pulse.analyser();
    if (an) {
      if (!scopeBuf || scopeBuf.length !== an.fftSize) scopeBuf = new Uint8Array(an.fftSize);
      an.getByteTimeDomainData(scopeBuf);
      const sy = Hh - scopeH / 2 - 4;
      const grad = g.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, '#a78bfa'); grad.addColorStop(0.5, '#22d3ee'); grad.addColorStop(1, '#f472b6');
      g.strokeStyle = grad; g.lineWidth = 2; g.beginPath();
      const step = scopeBuf.length / W;
      for (let x = 0; x < W; x++) {
        const v = (scopeBuf[Math.floor(x * step)] - 128) / 128;
        const yy = sy + v * (scopeH / 2 - 2);
        x ? g.lineTo(x, yy) : g.moveTo(x, yy);
      }
      g.stroke();
    }
  }
  function roundRect(g, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    g.beginPath();
    g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  requestAnimationFrame(drawViz);

  /* ---------- animation de l'accueil ---------- */
  let heroRAF = null;
  function heroAnim(cv) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const g = cv.getContext('2d');
    const lines = [
      { c: 'rgba(167,139,250,.55)', a: 38, f: 0.009, s: 0.6, o: 0.35 },
      { c: 'rgba(34,211,238,.45)', a: 28, f: 0.014, s: -0.9, o: 0.55 },
      { c: 'rgba(244,114,182,.4)', a: 46, f: 0.006, s: 0.4, o: 0.75 },
    ];
    let t = 0;
    function frame() {
      if (!document.body.contains(cv)) { heroRAF = null; return; }
      const dpr = window.devicePixelRatio || 1, W = cv.clientWidth, Hh = cv.clientHeight;
      if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(Hh * dpr); }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, Hh);
      const energy = document.body.classList.contains('is-playing') ? 1.8 : 1;
      lines.forEach((l) => {
        g.strokeStyle = l.c; g.lineWidth = 2; g.beginPath();
        for (let x = 0; x <= W; x += 4) {
          const y = Hh * l.o + Math.sin(x * l.f + t * l.s) * l.a * energy * Math.sin(x * 0.002 + t * 0.3);
          x ? g.lineTo(x, y) : g.moveTo(x, y);
        }
        g.stroke();
      });
      t += 0.03;
      if (!reduce) heroRAF = requestAnimationFrame(frame);
    }
    if (heroRAF) cancelAnimationFrame(heroRAF);
    frame();
  }

  /* =====================================================================
     PAGES
     ===================================================================== */
  function progressBar(done, total) {
    const pct = total ? Math.round((done / total) * 100) : 0;
    return `<div class="progress"><span style="width:${pct}%"></span></div><div class="progress-label"><span>${done}/${total}</span><span>${pct}%</span></div>`;
  }

  /* ---------- Accueil ---------- */
  function renderHome() {
    const dl = doneSet('lessons'), de = doneSet('exercises');
    const levelCards = Object.entries(LEVELS).map(([k, L]) => {
      const ls = LESSONS.filter((l) => l.level === k), ex = EXERCISES.filter((e) => e.level === k);
      const done = ls.filter((l) => dl.has(l.id)).length + ex.filter((e) => de.has(e.id)).length;
      const first = ls.find((l) => !dl.has(l.id)) || ls[0];
      const txt = { debutant: 'Sons, rythmes, silences, premières mélodies. Aucune connaissance requise.', intermediaire: 'Alternances, tempo, synthèse sonore, gammes et effets.', avance: 'Paramètres animés, polyrythmes, construire une vraie performance.' }[k];
      return `<a class="card level-card" style="--c:${L.color}" href="#apprendre/${first.id}">
        <span class="card-icon">${L.icon}</span><h3>${L.label}</h3><p>${txt}</p>
        <div style="margin-top:18px">${progressBar(done, ls.length + ex.length)}</div>
        <div class="card-foot">${done ? 'Continuer' : 'Commencer'} →</div></a>`;
    }).join('');

    view.innerHTML = `
      <section class="hero">
        <canvas aria-hidden="true"></canvas>
        <div class="container hero-inner">
          <div class="fade-in">
            <div class="eyebrow">Apprendre le live coding musical</div>
            <h1>Code ta musique.<br><span class="grad-text">En direct.</span></h1>
            <p class="lead">Écris quelques lignes, appuie sur ▶ et entends ton code devenir un beat. Des leçons interactives, des exercices corrigés automatiquement et un guide pour choisir ton matériel.</p>
            <div class="hero-actions">
              <a class="btn btn-primary" href="#apprendre/intro">Commencer gratuitement →</a>
              <a class="btn" href="#studio">Ouvrir le studio</a>
            </div>
            <div class="hero-stats">
              <div><strong>${LESSONS.length}</strong><span>leçons</span></div>
              <div><strong>${EXERCISES.length}</strong><span>exercices</span></div>
              <div><strong>${GEAR.length}</strong><span>équipements</span></div>
              <div><strong>0 €</strong><span>rien à installer</span></div>
            </div>
          </div>
          <div class="fade-in" id="hero-editor" style="animation-delay:.15s"></div>
        </div>
      </section>

      <section class="section"><div class="container">
        <h2 class="section-title">Choisis ton niveau</h2>
        <p class="section-sub">Que tu n'aies jamais écrit une ligne de code ou que tu prépares ta première Algorave, il y a un parcours pour toi.</p>
        <div class="cards cards-3">${levelCards}</div>
      </div></section>

      <section class="section"><div class="container">
        <h2 class="section-title">Comment ça marche ?</h2>
        <p class="section-sub">Le live coding, c'est une boucle : écrire, écouter, modifier. Encore et encore, devant le public.</p>
        <div class="steps">
          <div class="step"><h3>Apprends</h3><p>Des leçons courtes avec des exemples jouables en un clic. Modifie-les, casse-les, écoute ce qui change.</p></div>
          <div class="step"><h3>Pratique</h3><p>Des défis musicaux vérifiés automatiquement : le site écoute ton code et te dit ce qui manque.</p></div>
          <div class="step"><h3>Joue</h3><p>Lâche-toi dans le studio avec des morceaux d'exemple, puis équipe-toi pour la scène.</p></div>
        </div>
      </div></section>

      <section class="section"><div class="container">
        <div class="cards cards-4">
          <a class="card" href="#apprendre"><span class="card-icon">📚</span><h3>Apprendre</h3><p>Des bases de la mini-notation jusqu'à la performance live.</p><div class="card-foot">Voir les leçons →</div></a>
          <a class="card" href="#exercices"><span class="card-icon">🎯</span><h3>Exercices</h3><p>${EXERCISES.length} défis corrigés, du premier beat au morceau complet.</p><div class="card-foot">Relever un défi →</div></a>
          <a class="card" href="#materiel"><span class="card-icon">🎛️</span><h3>Matériel</h3><p>Du contrôleur Arduino fait maison à la table de mixage de club.</p><div class="card-foot">Choisir mon setup →</div></a>
          <a class="card" href="#studio"><span class="card-icon">🎹</span><h3>Studio</h3><p>Un espace libre, des morceaux d'exemple et un aide-mémoire.</p><div class="card-foot">Jammer →</div></a>
        </div>
      </div></section>`;

    heroAnim($('.hero > canvas'));
    const ed = createEditor(`bpm(118)
s("bd*4")
s("~ cp").fast(2)
s("hh*8").gain("0.4 0.15")
note("<c2 eb2 ab1 bb1>*4").wave("saw").cutoff(700).resonance(6)
note("0 2 4 6").scale("c4:minor").wave("tri").delay(0.4).gain(0.3)`);
    $('#hero-editor').appendChild(ed.root);
  }

  /* ---------- Sidebar commune ---------- */
  function sidebar(items, doneKey, base, currentId, title) {
    const done = doneSet(doneKey);
    const count = items.filter((x) => done.has(x.id)).length;
    const groups = Object.entries(LEVELS).map(([k, L]) => {
      const list = items.filter((x) => x.level === k);
      if (!list.length) return '';
      return `<h4 style="--c:${L.color}">${L.icon} ${L.label}</h4>` + list.map((x) =>
        `<a class="side-link ${x.id === currentId ? 'active' : ''} ${done.has(x.id) ? 'done' : ''}" href="#${base}/${x.id}"><span class="check">${done.has(x.id) ? '✓' : ''}</span>${esc(x.title)}</a>`).join('');
    }).join('');
    return `<aside class="sidebar">
      <div class="side-progress"><strong>${title}</strong>${progressBar(count, items.length)}</div>
      <button class="btn btn-sm sidebar-toggle">☰ Sommaire</button>
      <div class="sidebar-list">${groups}</div></aside>`;
  }
  function bindSidebar() {
    const sb = $('.sidebar'), btn = $('.sidebar-toggle');
    if (sb && btn) btn.addEventListener('click', () => sb.classList.toggle('open'));
  }

  /* ---------- Apprendre ---------- */
  function renderLearn(id) {
    const lesson = LESSONS.find((l) => l.id === id) || LESSONS.find((l) => !doneSet('lessons').has(l.id)) || LESSONS[0];
    if (lesson.id !== id) { history.replaceState(null, '', '#apprendre/' + lesson.id); }
    const idx = LESSONS.indexOf(lesson);
    const prev = LESSONS[idx - 1], next = LESSONS[idx + 1];
    const isDone = doneSet('lessons').has(lesson.id);

    view.innerHTML = `<div class="container learn">
      ${sidebar(LESSONS, 'lessons', 'apprendre', lesson.id, 'Ta progression')}
      <article class="lesson fade-in">
        <header class="lesson-head">
          <div class="lesson-meta">${badge(lesson.level)}<span>Leçon ${idx + 1}/${LESSONS.length}</span><span>· ⏱ ${lesson.minutes} min</span></div>
          <h1>${esc(lesson.title)}</h1>
          <p class="muted" style="margin:0">${esc(lesson.summary)}</p>
        </header>
        <div class="lesson-blocks"></div>
        <nav class="lesson-nav">
          ${prev ? `<a class="btn btn-ghost" href="#apprendre/${prev.id}">← ${esc(prev.title)}</a>` : '<span></span>'}
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button class="btn ${isDone ? 'btn-good' : ''}" id="mark-done">${isDone ? '✓ Terminée' : 'Marquer comme terminée'}</button>
            ${next ? `<a class="btn btn-primary" id="next-lesson" href="#apprendre/${next.id}">${esc(next.title)} →</a>` : `<a class="btn btn-primary" id="next-lesson" href="#exercices">Passer aux exercices →</a>`}
          </div>
        </nav>
      </article></div>`;

    const wrap = $('.lesson-blocks');
    lesson.blocks.forEach((b) => {
      if (b.type === 'text') wrap.appendChild(el(`<div class="prose">${b.html}</div>`));
      else if (b.type === 'tip') wrap.appendChild(el(`<div class="tip"><div>${b.html}</div></div>`));
      else if (b.type === 'code') wrap.appendChild(createEditor(b.code).root);
      else if (b.type === 'sounds') {
        const pads = el(`<div class="sound-pads">${b.items.map(([n, l]) => `<button class="pad" data-s="${n}"><strong>${n}</strong><span>${l}</span></button>`).join('')}</div>`);
        pads.addEventListener('click', (e) => {
          const p = e.target.closest('.pad'); if (!p) return;
          window.Pulse.preview('drum', p.dataset.s);
          p.classList.add('hit'); setTimeout(() => p.classList.remove('hit'), 120);
        });
        wrap.appendChild(pads);
      }
    });

    $('#mark-done').addEventListener('click', () => { markDone('lessons', lesson.id); toast('Leçon terminée, bravo ! 🎉'); renderLearn(lesson.id); });
    $('#next-lesson').addEventListener('click', () => markDone('lessons', lesson.id));
    bindSidebar();
  }

  /* ---------- Exercices ---------- */
  let exFilter = 'tous';
  function renderExercises(id) {
    if (id) return renderExercise(id);
    const de = doneSet('exercises');
    const list = EXERCISES.filter((e) => exFilter === 'tous' || e.level === exFilter);
    view.innerHTML = `<div class="container">
      <div class="page-head fade-in">
        <div class="eyebrow">Pratique</div>
        <h1 class="section-title">Exercices</h1>
        <p class="section-sub">Chaque défi est vérifié automatiquement : le site analyse ce que joue ton code. Coincé ? Demande un indice, ou la solution.</p>
        <div style="max-width:420px;margin-bottom:24px">${progressBar(EXERCISES.filter((e) => de.has(e.id)).length, EXERCISES.length)}</div>
        <div class="chips" id="ex-filters">
          <button class="chip ${exFilter === 'tous' ? 'on' : ''}" data-f="tous">Tous</button>
          ${Object.entries(LEVELS).map(([k, L]) => `<button class="chip ${exFilter === k ? 'on' : ''}" data-f="${k}">${L.icon} ${L.label}</button>`).join('')}
        </div>
      </div>
      <div class="ex-grid section" style="padding-top:24px">
        ${list.map((e) => `<a class="card ex-card ${de.has(e.id) ? 'done' : ''}" href="#exercices/${e.id}">
          <span class="ex-num">#${String(EXERCISES.indexOf(e) + 1).padStart(2, '0')}</span> ${badge(e.level)}
          <h3>${esc(e.title)}</h3><p>${e.goal}</p></a>`).join('')}
      </div></div>`;
    $('#ex-filters').addEventListener('click', (e) => {
      const c = e.target.closest('.chip'); if (!c) return;
      exFilter = c.dataset.f; renderExercises();
    });
  }

  function renderExercise(id) {
    const ex = EXERCISES.find((e) => e.id === id);
    if (!ex) { location.hash = '#exercices'; return; }
    const idx = EXERCISES.indexOf(ex), next = EXERCISES[idx + 1];
    view.innerHTML = `<div class="container learn">
      ${sidebar(EXERCISES, 'exercises', 'exercices', ex.id, 'Défis réussis')}
      <article class="lesson fade-in">
        <header class="lesson-head">
          <div class="lesson-meta">${badge(ex.level)}<span>Exercice ${idx + 1}/${EXERCISES.length}</span></div>
          <h1>${esc(ex.title)}</h1>
        </header>
        <div class="ex-goal"><strong>🎯 Objectif</strong>${ex.goal}</div>
        <div id="ex-editor"></div>
        <div class="ex-actions">
          <button class="btn btn-primary" id="ex-check">✓ Vérifier</button>
          <button class="btn" id="ex-hint">💡 Indice</button>
          <button class="btn btn-ghost" id="ex-sol">👀 Voir la solution</button>
        </div>
        <div class="ex-feedback" id="ex-fb"></div>
        <div class="ex-hint" id="ex-hint-box" hidden>💡 ${ex.hint}</div>
        <nav class="lesson-nav">
          <a class="btn btn-ghost" href="#exercices">← Tous les exercices</a>
          ${next ? `<a class="btn" href="#exercices/${next.id}">Suivant : ${esc(next.title)} →</a>` : '<a class="btn" href="#studio">Direction le studio →</a>'}
        </nav>
      </article></div>`;

    const draftKey = 'draft:' + ex.id;
    const ed = createEditor(store.get(draftKey, ex.starter), {
      onChange: (c) => store.set(draftKey, c),
      onRun: (e) => check(e),
    });
    $('#ex-editor').appendChild(ed.root);
    const fb = $('#ex-fb');

    function check(edi) {
      const r = playEditor(edi);
      if (!r.ok) { fb.className = 'ex-feedback show ko'; fb.innerHTML = '⚠ Corrige d\'abord l\'erreur dans le code.'; return; }
      let res;
      try { res = ex.check(r.tracks, H); } catch (e) { res = { ok: false, msg: 'Impossible de vérifier : ' + e.message }; }
      if (res.ok) {
        const first = !doneSet('exercises').has(ex.id);
        markDone('exercises', ex.id);
        fb.className = 'ex-feedback show ok';
        fb.innerHTML = `<strong>🎉 Réussi !</strong> Écoute ton œuvre… ${next ? `<a href="#exercices/${next.id}">Exercice suivant →</a>` : 'Tu as terminé tous les exercices !'}`;
        if (first) { confetti(); $$('.side-link.active').forEach((a) => { a.classList.add('done'); $('.check', a).textContent = '✓'; }); }
      } else {
        fb.className = 'ex-feedback show ko';
        fb.innerHTML = `<strong>Pas encore…</strong> ${esc(res.msg)}`;
      }
    }
    $('#ex-check').addEventListener('click', () => check(ed));
    $('#ex-hint').addEventListener('click', () => { $('#ex-hint-box').hidden = false; });
    $('#ex-sol').addEventListener('click', () => {
      if (!confirm('Afficher la solution ? Ton code actuel sera remplacé.')) return;
      ed.setCode(ex.solution); ed.msg('Solution chargée — appuie sur Vérifier pour l\'écouter.', 'ok');
    });
    bindSidebar();
  }

  /* ---------- Matériel ---------- */
  const gearState = { level: 'tous', cat: 'tous', max: 3000 };
  function renderGear() {
    const priceOf = (n) => (GEAR.find((g) => g.name === n) || { price: 0 }).price;
    view.innerHTML = `<div class="container">
      <div class="page-head fade-in">
        <div class="eyebrow">S'équiper</div>
        <h1 class="section-title">Choisir son matériel</h1>
        <p class="section-sub">Bonne nouvelle : pour commencer, <strong>ton ordinateur et un casque suffisent</strong>. Ensuite, chaque pièce ajoute du confort, du contrôle ou du son. Voici comment tout s'assemble.</p>
      </div>

      <div class="signal-chain fade-in">
        <div class="node"><b>🎛️</b>Contrôleur<br><small>tes mains</small></div><span class="arrow">→</span>
        <div class="node"><b>💻</b>Ordinateur<br><small>ton code</small></div><span class="arrow">→</span>
        <div class="node"><b>🔌</b>Interface audio<br><small>son propre</small></div><span class="arrow">→</span>
        <div class="node"><b>🎚️</b>Table de mixage<br><small>optionnelle</small></div><span class="arrow">→</span>
        <div class="node"><b>🎧</b>Écoute<br><small>casque, enceintes</small></div>
      </div>

      <section class="section">
        <h2 class="section-title">4 setups clés en main</h2>
        <p class="section-sub">Du bricolage à 60 € à la configuration de festival. Clique sur un setup pour filtrer le catalogue à son niveau.</p>
        <div class="kits">
          ${KITS.map((k) => `<div class="card kit hoverable" style="--c:${k.color};cursor:pointer" data-level="${k.level}">
            <span class="card-icon">${k.icon}</span><h3>${k.title}</h3>
            <div class="kit-budget">${k.budget}</div><p>${k.desc}</p>
            <ul>${k.items.map((i) => { const g = GEAR.find((x) => x.name === i); return `<li><span>${GEAR_CATS[g.cat].icon}</span>${esc(i)}</li>`; }).join('')}</ul>
            <div class="kit-total">Total indicatif : <strong>${euro(k.items.reduce((a, i) => a + priceOf(i), 0))}</strong> (hors ordinateur déjà possédé)</div>
          </div>`).join('')}
        </div>
      </section>

      <section class="section" style="padding-top:0" id="catalogue">
        <h2 class="section-title">Le catalogue</h2>
        <p class="section-sub">Filtre par niveau, catégorie et budget. Prix neufs indicatifs : pense à l'occasion, le matériel audio se revend très bien.</p>
        <div class="gear-filters">
          <div><label>Niveau</label><div class="chips" data-k="level" style="margin-top:8px">
            <button class="chip" data-v="tous">Tous</button>
            ${Object.entries(LEVELS).map(([k, L]) => `<button class="chip" data-v="${k}">${L.icon} ${L.label}</button>`).join('')}
          </div></div>
          <div><label>Catégorie</label><div class="chips" data-k="cat" style="margin-top:8px">
            <button class="chip" data-v="tous">Tout</button>
            ${Object.entries(GEAR_CATS).map(([k, c]) => `<button class="chip" data-v="${k}">${c.icon} ${c.label}</button>`).join('')}
          </div></div>
          <div><label for="budget">Budget max par pièce</label><div class="budget-row">
            <input type="range" id="budget" min="0" max="3000" step="10" value="${gearState.max}"><output id="budget-out"></output>
          </div></div>
        </div>
        <div class="gear-grid" id="gear-grid"></div>
      </section></div>`;

    const grid = $('#gear-grid'), out = $('#budget-out'), range = $('#budget');
    function update() {
      $$('.gear-filters .chips').forEach((cs) => $$('.chip', cs).forEach((c) => c.classList.toggle('on', c.dataset.v === gearState[cs.dataset.k])));
      out.textContent = gearState.max >= 3000 ? 'Illimité' : euro(gearState.max);
      const list = GEAR
        .filter((g) => (gearState.level === 'tous' || g.level === gearState.level) && (gearState.cat === 'tous' || g.cat === gearState.cat) && (gearState.max >= 3000 || g.price <= gearState.max))
        .sort((a, b) => a.price - b.price);
      grid.innerHTML = list.length ? list.map((g) => `<div class="card gear hoverable fade-in">
          <div class="gear-top"><div><div class="gear-cat">${GEAR_CATS[g.cat].icon} ${GEAR_CATS[g.cat].label}</div><h3>${esc(g.name)}</h3></div>
          <div class="gear-price ${g.price === 0 ? 'free' : ''}">${g.price === 0 ? 'Gratuit' : '~' + euro(g.price)}</div></div>
          <div>${badge(g.level)}</div>
          <p>${esc(g.desc)}</p>
          <div class="pc"><ul class="pros">${g.pros.map((p) => `<li>${esc(p)}</li>`).join('')}</ul><ul class="cons">${g.cons.map((p) => `<li>${esc(p)}</li>`).join('')}</ul></div>
        </div>`).join('') : '<div class="empty">Aucun équipement ne correspond. Augmente ton budget ou change de filtre.</div>';
    }
    $$('.gear-filters .chips').forEach((cs) => cs.addEventListener('click', (e) => {
      const c = e.target.closest('.chip'); if (!c) return;
      gearState[cs.dataset.k] = c.dataset.v; update();
    }));
    range.addEventListener('input', () => { gearState.max = +range.value; update(); });
    $$('.kit').forEach((k) => k.addEventListener('click', () => {
      gearState.level = k.dataset.level; gearState.cat = 'tous'; gearState.max = 3000; range.value = 3000; update();
      $('#catalogue').scrollIntoView({ behavior: 'smooth' });
    }));
    update();
  }

  /* ---------- Studio ---------- */
  function renderStudio() {
    const saved = store.get('studio', null);
    view.innerHTML = `<div class="container">
      <div class="page-head fade-in">
        <div class="eyebrow">Jam libre</div>
        <h1 class="section-title">Studio</h1>
        <p class="section-sub" style="margin-bottom:0">Ton espace de création. Charge un morceau d'exemple pour t'inspirer, ou pars de zéro. Ton code est sauvegardé automatiquement.</p>
      </div>
      <div class="studio">
        <div>
          <div class="presets" id="presets">
            ${PRESETS.map((p, i) => `<button class="chip" data-i="${i}">${p.name}</button>`).join('')}
            <button class="chip" data-i="-1">✨ Page blanche</button>
          </div>
          <div id="studio-editor"></div>
        </div>
        <aside class="cheat">
          <h3>📋 Aide-mémoire</h3>
          <p class="muted" style="font-size:.8rem;margin:-6px 0 12px">Clique pour insérer dans le code.</p>
          <dl>${CHEATSHEET.map(([c, d]) => `<div><dt data-c="${esc(c)}">${esc(c)}</dt><dd>${esc(d)}</dd></div>`).join('')}</dl>
        </aside>
      </div></div>`;

    const ed = createEditor(saved || PRESETS[0].code, { onChange: (c) => store.set('studio', c) });
    $('#studio-editor').appendChild(ed.root);
    const ta = $('textarea', ed.root);

    $('#presets').addEventListener('click', (e) => {
      const c = e.target.closest('.chip'); if (!c) return;
      const i = +c.dataset.i;
      ed.setCode(i < 0 ? '// Ta page blanche. Lance-toi !\nbpm(120)\ns("bd")\n' : PRESETS[i].code);
      if (i >= 0) ed.play(); else window.Pulse.stop();
    });
    $$('.cheat dt').forEach((dt) => dt.addEventListener('click', () => {
      const snippet = dt.dataset.c;
      ta.focus();
      ta.setRangeText(snippet, ta.selectionStart, ta.selectionEnd, 'end');
      ta.dispatchEvent(new Event('input'));
    }));
  }

  /* =====================================================================
     ROUTEUR
     ===================================================================== */
  const ROUTES = { accueil: renderHome, apprendre: renderLearn, exercices: renderExercises, materiel: renderGear, studio: renderStudio };
  let lastRoute = null;

  function router() {
    const [name, arg] = location.hash.replace(/^#/, '').split('/');
    const r = ROUTES[name] ? name : 'accueil';
    // changer de page coupe la musique (l'éditeur qui la jouait disparaît)
    if (window.Pulse.isPlaying()) window.Pulse.stop();
    activeEditor = null;
    ROUTES[r](arg);
    $$('.nav a').forEach((a) => a.classList.toggle('active', a.dataset.route === r));
    $('.nav').classList.remove('open');
    $('.menu-btn').setAttribute('aria-expanded', 'false');
    const key = r + '/' + (arg || '');
    if (key !== lastRoute) window.scrollTo({ top: 0, behavior: 'instant' });
    lastRoute = key;
    document.title = { accueil: 'Pulse — Apprendre le live coding', apprendre: 'Apprendre · Pulse', exercices: 'Exercices · Pulse', materiel: 'Matériel · Pulse', studio: 'Studio · Pulse' }[r];
  }

  window.addEventListener('hashchange', router);
  $('#global-stop').addEventListener('click', () => window.Pulse.stop());
  $('.menu-btn').addEventListener('click', () => {
    const open = $('.nav').classList.toggle('open');
    $('.menu-btn').setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === '.') { e.preventDefault(); window.Pulse.stop(); }
  });
  router();
})();
