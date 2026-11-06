/* =========================================================================
   Pulse — moteur de live coding dans le navigateur
   - Mini-notation (inspirée de TidalCycles / Strudel) : "bd [sd sd] <hh oh> ~"
   - Synthèse Web Audio (batterie + synthés) sans aucun sample
   - Horloge à anticipation (lookahead) pour un timing précis
   ========================================================================= */
(function (global) {
  'use strict';

  /* ---------------------------------------------------------------------
     1. MINI-NOTATION : tokenizer + parser
     --------------------------------------------------------------------- */
  function tokenize(src) {
    const toks = [];
    let i = 0;
    while (i < src.length) {
      const c = src[i];
      if (/\s/.test(c)) { i++; continue; }
      if ('[]<>*!@,~'.includes(c)) { toks.push({ t: c, pos: i }); i++; continue; }
      if (/[A-Za-z0-9#.\-_:]/.test(c)) {
        let j = i;
        while (j < src.length && /[A-Za-z0-9#.\-_:]/.test(src[j])) j++;
        toks.push({ t: 'word', v: src.slice(i, j), pos: i });
        i = j;
        continue;
      }
      throw new Error('Caractère inattendu « ' + c + ' » dans le motif "' + src + '"');
    }
    return toks;
  }

  function parseMini(src) {
    const toks = tokenize(String(src));
    let p = 0;
    const peek = () => toks[p];
    const next = () => toks[p++];

    function parseNumber() {
      const tk = next();
      if (!tk || tk.t !== 'word' || isNaN(parseFloat(tk.v))) {
        throw new Error('Un nombre est attendu après * ou ! ou @ dans "' + src + '"');
      }
      return parseFloat(tk.v);
    }

    // Retourne une liste d'items { node, weight }
    function parseItems(end) {
      const layers = [[]];
      while (true) {
        const tk = peek();
        if (!tk) {
          if (end) throw new Error('Il manque un « ' + end + ' » dans "' + src + '"');
          break;
        }
        if (tk.t === end) { next(); break; }
        if (tk.t === ',') { next(); layers.push([]); continue; }
        if (tk.t === ']' || tk.t === '>') throw new Error('« ' + tk.t + ' » en trop dans "' + src + '"');

        let node = parseAtom();
        let weight = 1;
        let reps = 1;
        // postfix
        while (peek() && ['*', '!', '@'].includes(peek().t)) {
          const op = next().t;
          if (op === '*') {
            const n = Math.max(1, Math.round(parseNumber()));
            node = { type: 'fast', n, node };
          } else if (op === '!') {
            const tk2 = peek();
            if (tk2 && tk2.t === 'word' && !isNaN(parseFloat(tk2.v))) reps = Math.max(1, Math.round(parseNumber()));
            else reps += 1;
          } else if (op === '@') {
            weight = Math.max(0.01, parseNumber());
          }
        }
        const layer = layers[layers.length - 1];
        for (let r = 0; r < reps; r++) layer.push({ node, weight });
      }
      return layers;
    }

    function layersToNode(layers) {
      const seqs = layers.map((items) => ({ type: 'seq', items }));
      return seqs.length === 1 ? seqs[0] : { type: 'stack', layers: seqs };
    }

    function parseAtom() {
      const tk = next();
      if (!tk) throw new Error('Motif incomplet : "' + src + '"');
      if (tk.t === '[') return layersToNode(parseItems(']'));
      if (tk.t === '<') {
        const layers = parseItems('>');
        const items = layers[0].map((it) => it.node);
        if (!items.length) throw new Error('Alternance vide <> dans "' + src + '"');
        return { type: 'alt', items };
      }
      if (tk.t === '~') return { type: 'rest' };
      if (tk.t === 'word') return { type: 'atom', value: tk.v };
      throw new Error('Symbole inattendu « ' + tk.t + ' » dans "' + src + '"');
    }

    return layersToNode(parseItems(null));
  }

  function queryNode(node, cyc, s, d, out) {
    switch (node.type) {
      case 'atom': out.push({ start: s, dur: d, value: node.value }); break;
      case 'rest': break;
      case 'seq': {
        const total = node.items.reduce((a, it) => a + it.weight, 0);
        if (!total) break;
        let pos = s;
        for (const it of node.items) {
          const w = (d * it.weight) / total;
          queryNode(it.node, cyc, pos, w, out);
          pos += w;
        }
        break;
      }
      case 'stack': for (const l of node.layers) queryNode(l, cyc, s, d, out); break;
      case 'alt': {
        const n = node.items.length;
        const idx = ((cyc % n) + n) % n;
        queryNode(node.items[idx], Math.floor(cyc / n), s, d, out);
        break;
      }
      case 'fast': {
        const k = node.n;
        for (let i = 0; i < k; i++) queryNode(node.node, cyc * k + i, s + (i * d) / k, d / k, out);
        break;
      }
    }
  }

  class Pattern {
    constructor(src) {
      this.src = String(src);
      this.root = parseMini(this.src);
      this.cache = new Map();
    }
    query(cycle) {
      if (this.cache.has(cycle)) return this.cache.get(cycle);
      const out = [];
      queryNode(this.root, cycle, 0, 1, out);
      out.sort((a, b) => a.start - b.start);
      if (this.cache.size > 64) this.cache.clear();
      this.cache.set(cycle, out);
      return out;
    }
    valueAt(cycle, pos) {
      const evs = this.query(cycle);
      for (const e of evs) if (pos >= e.start - 1e-9 && pos < e.start + e.dur - 1e-9) return e.value;
      return evs.length ? evs[evs.length - 1].value : null;
    }
  }

  /* ---------------------------------------------------------------------
     2. NOTES & GAMMES
     --------------------------------------------------------------------- */
  const PC = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
  const SCALES = {
    major: [0, 2, 4, 5, 7, 9, 11],
    majeur: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    mineur: [0, 2, 3, 5, 7, 8, 10],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    phrygian: [0, 1, 3, 5, 7, 8, 10],
    lydian: [0, 2, 4, 6, 7, 9, 11],
    mixolydian: [0, 2, 4, 5, 7, 9, 10],
    pentatonic: [0, 2, 4, 7, 9],
    minpent: [0, 3, 5, 7, 10],
    blues: [0, 3, 5, 6, 7, 10],
    chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  };

  function noteToMidi(v) {
    const m = /^([a-gA-G])(#|s|b)?(-?\d+)?$/.exec(v);
    if (!m) return null;
    let midi = PC[m[1].toLowerCase()];
    if (m[2] === '#' || m[2] === 's') midi += 1;
    if (m[2] === 'b') midi -= 1;
    const oct = m[3] !== undefined ? parseInt(m[3], 10) : 3;
    return midi + 12 * (oct + 1);
  }

  function parseScale(str) {
    // "c:minor", "a3:pentatonic", "minor"
    const parts = String(str).toLowerCase().split(':');
    let root = 'c3', name = parts[0];
    if (parts.length > 1) { root = parts[0]; name = parts[1]; }
    const steps = SCALES[name];
    if (!steps) throw new Error('Gamme inconnue « ' + name + ' ». Essaie : ' + Object.keys(SCALES).join(', '));
    const rootMidi = noteToMidi(root);
    if (rootMidi === null) throw new Error('Note de base inconnue « ' + root + ' » pour la gamme');
    return { rootMidi, steps };
  }

  function degreeToMidi(deg, scale) {
    const n = scale.steps.length;
    const oct = Math.floor(deg / n);
    const idx = ((deg % n) + n) % n;
    return scale.rootMidi + oct * 12 + scale.steps[idx];
  }

  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  /* ---------------------------------------------------------------------
     3. PISTES (ce que l'utilisateur crée avec s() et note())
     --------------------------------------------------------------------- */
  const DRUMS = ['bd', 'sd', 'hh', 'oh', 'cp', 'rim', 'lt', 'mt', 'ht', 'cb', 'cr'];
  const WAVES = { saw: 'sawtooth', sawtooth: 'sawtooth', square: 'square', sine: 'sine', tri: 'triangle', triangle: 'triangle', supersaw: 'supersaw' };

  function pv(v, name) {
    if (typeof v === 'number') return v;
    if (typeof v === 'string') {
      const pat = new Pattern(v);
      pat.numeric = true;
      return pat;
    }
    throw new Error('Valeur invalide pour .' + name + '() : utilise un nombre ou un motif "0.2 0.8"');
  }

  class Track {
    constructor(kind, src) {
      if (typeof src !== 'string') throw new Error((kind === 'drum' ? 's' : 'note') + '() attend un texte entre guillemets, ex : ' + (kind === 'drum' ? 's("bd sd")' : 'note("c3 e3 g3")'));
      this.kind = kind;
      this.pat = new Pattern(src);
      this.speed = 1;
      this.p = {
        gain: 0.8, wave: 'sawtooth', cutoff: kind === 'drum' ? 20000 : 4000, resonance: 1,
        attack: 0.005, release: kind === 'drum' ? 0 : 0.25, pan: 0, delay: 0,
        transpose: 0, scale: null, speedRate: 1,
      };
    }
    gain(v) { this.p.gain = pv(v, 'gain'); return this; }
    cutoff(v) { this.p.cutoff = pv(v, 'cutoff'); return this; }
    lpf(v) { return this.cutoff(v); }
    resonance(v) { this.p.resonance = pv(v, 'resonance'); return this; }
    attack(v) { this.p.attack = pv(v, 'attack'); return this; }
    release(v) { this.p.release = pv(v, 'release'); return this; }
    pan(v) { this.p.pan = pv(v, 'pan'); return this; }
    delay(v) { this.p.delay = pv(v, 'delay'); return this; }
    transpose(v) { this.p.transpose = pv(v, 'transpose'); return this; }
    speed(v) { this.p.speedRate = pv(v, 'speed'); return this; }
    wave(w) {
      const k = WAVES[String(w).toLowerCase()];
      if (!k) throw new Error('Forme d\'onde inconnue « ' + w + ' ». Essaie : sine, square, saw, tri, supersaw');
      this.p.wave = k; return this;
    }
    sound(w) { return this.wave(w); }
    scale(str) { this.p.scale = parseScale(str); return this; }
    fast(n) { if (!(n > 0)) throw new Error('.fast() attend un nombre positif'); this.speed *= n; return this; }
    slow(n) { if (!(n > 0)) throw new Error('.slow() attend un nombre positif'); this.speed /= n; return this; }

    param(name, cycle, pos) {
      const v = this.p[name];
      if (v instanceof Pattern) {
        const x = parseFloat(v.valueAt(cycle, pos));
        return isNaN(x) ? 0 : x;
      }
      return v;
    }
    events(cycle) { return this.pat.query(cycle); }
  }

  /* ---------------------------------------------------------------------
     4. AUDIO
     --------------------------------------------------------------------- */
  let ctx = null, master = null, analyser = null, delayIn = null, delayNode = null, noiseBuf = null;

  function ensureAudio() {
    if (ctx) return ctx;
    const AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) throw new Error('Ton navigateur ne supporte pas Web Audio.');
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -12; comp.ratio.value = 4;
    master = ctx.createGain(); master.gain.value = 0.7;
    analyser = ctx.createAnalyser(); analyser.fftSize = 2048;
    master.connect(comp); comp.connect(analyser); analyser.connect(ctx.destination);

    delayIn = ctx.createGain();
    delayNode = ctx.createDelay(2);
    const fb = ctx.createGain(); fb.gain.value = 0.38;
    const dlp = ctx.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 3500;
    delayIn.connect(delayNode); delayNode.connect(dlp); dlp.connect(fb); fb.connect(delayNode);
    dlp.connect(master);

    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return ctx;
  }

  function noise(t, len) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf; src.loop = true;
    src.start(t, Math.random() * 0.5); src.stop(t + len + 0.05);
    return src;
  }

  function env(g, t, peak, attack, decay) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  function playDrum(name, t, out, rate) {
    const r = rate || 1;
    switch (name) {
      case 'bd': {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.frequency.setValueAtTime(160 * r, t);
        o.frequency.exponentialRampToValueAtTime(42 * r, t + 0.13);
        env(g, t, 1, 0.003, 0.42);
        o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.5);
        return true;
      }
      case 'sd': {
        const n = noise(t, 0.25); const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1200 * r;
        const g = ctx.createGain(); env(g, t, 0.7, 0.002, 0.2);
        n.connect(hp); hp.connect(g); g.connect(out);
        const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(200 * r, t);
        o.frequency.exponentialRampToValueAtTime(120 * r, t + 0.1);
        const g2 = ctx.createGain(); env(g2, t, 0.6, 0.002, 0.12);
        o.connect(g2); g2.connect(out); o.start(t); o.stop(t + 0.2);
        return true;
      }
      case 'hh': case 'oh': {
        const len = name === 'hh' ? 0.06 : 0.35;
        const n = noise(t, len); const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7500 * r;
        const g = ctx.createGain(); env(g, t, 0.45, 0.001, len);
        n.connect(hp); hp.connect(g); g.connect(out);
        return true;
      }
      case 'cr': {
        const n = noise(t, 1.4); const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 5000 * r;
        const g = ctx.createGain(); env(g, t, 0.35, 0.002, 1.3);
        n.connect(hp); hp.connect(g); g.connect(out);
        return true;
      }
      case 'cp': {
        const n = noise(t, 0.3); const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400 * r; bp.Q.value = 1.2;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        [0, 0.012, 0.024].forEach((dt) => {
          g.gain.setValueAtTime(0.9, t + dt);
          g.gain.exponentialRampToValueAtTime(0.1, t + dt + 0.01);
        });
        g.gain.setValueAtTime(0.8, t + 0.036);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
        n.connect(bp); bp.connect(g); g.connect(out);
        return true;
      }
      case 'rim': {
        const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = 1700 * r;
        const g = ctx.createGain(); env(g, t, 0.5, 0.001, 0.04);
        o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.08);
        return true;
      }
      case 'lt': case 'mt': case 'ht': {
        const f = { lt: 90, mt: 135, ht: 190 }[name] * r;
        const o = ctx.createOscillator(); o.frequency.setValueAtTime(f * 1.6, t);
        o.frequency.exponentialRampToValueAtTime(f, t + 0.08);
        const g = ctx.createGain(); env(g, t, 0.8, 0.003, 0.35);
        o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.45);
        return true;
      }
      case 'cb': {
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900 * r; bp.Q.value = 2;
        const g = ctx.createGain(); env(g, t, 0.45, 0.002, 0.25);
        [540, 800].forEach((f) => {
          const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = f * r;
          o.connect(bp); o.start(t); o.stop(t + 0.3);
        });
        bp.connect(g); g.connect(out);
        return true;
      }
    }
    return false;
  }

  function playNote(track, midi, t, dur, out, cyc, pos) {
    const atk = Math.max(0.002, track.param('attack', cyc, pos));
    const rel = Math.max(0.01, track.param('release', cyc, pos));
    const cutoff = Math.min(18000, Math.max(40, track.param('cutoff', cyc, pos)));
    const q = Math.max(0.1, track.param('resonance', cyc, pos));
    const freq = mtof(midi);

    const filt = ctx.createBiquadFilter(); filt.type = 'lowpass';
    filt.frequency.setValueAtTime(Math.min(18000, cutoff * 2.5), t);
    filt.frequency.exponentialRampToValueAtTime(cutoff, t + Math.min(0.25, dur));
    filt.Q.value = q;
    const g = ctx.createGain();
    const hold = Math.max(atk, dur * 0.85);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + atk);
    g.gain.setValueAtTime(0.5, t + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + hold + rel);
    filt.connect(g); g.connect(out);

    const end = t + hold + rel + 0.05;
    const oscs = track.p.wave === 'supersaw'
      ? [-14, -6, 0, 6, 14].map((det) => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.detune.value = det; return o; })
      : [(() => { const o = ctx.createOscillator(); o.type = track.p.wave; return o; })()];
    const scaleG = ctx.createGain(); scaleG.gain.value = 1 / Math.sqrt(oscs.length);
    scaleG.connect(filt);
    oscs.forEach((o) => { o.frequency.value = freq; o.connect(scaleG); o.start(t); o.stop(end); });
  }

  function resolveMidi(track, value, cyc, pos) {
    let midi = null;
    const num = Number(value);
    if (value !== '' && !isNaN(num)) {
      midi = track.p.scale ? degreeToMidi(Math.round(num), track.p.scale) : num;
    } else {
      midi = noteToMidi(value);
    }
    if (midi === null) return null;
    return midi + track.param('transpose', cyc, pos);
  }

  function trigger(track, value, t, dur, cyc, pos) {
    const gain = Math.max(0, track.param('gain', cyc, pos));
    if (gain <= 0) return;
    const pan = Math.max(-1, Math.min(1, track.param('pan', cyc, pos)));
    const dly = Math.max(0, Math.min(1, track.param('delay', cyc, pos)));

    const vg = ctx.createGain(); vg.gain.value = gain;
    let last = vg;
    if (ctx.createStereoPanner) {
      const p = ctx.createStereoPanner(); p.pan.value = pan; vg.connect(p); last = p;
    }
    last.connect(master);
    if (dly > 0) { const s = ctx.createGain(); s.gain.value = dly; last.connect(s); s.connect(delayIn); }
    // libère les nœuds après lecture
    setTimeout(() => { try { vg.disconnect(); last.disconnect(); } catch (e) { /* déjà libéré */ } }, (t - ctx.currentTime + dur + 3) * 1000);

    const name = String(value).split(':')[0].toLowerCase();
    if (track.kind === 'drum') {
      let out = vg;
      const cutoff = track.param('cutoff', cyc, pos);
      if (cutoff < 19000) {
        const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = Math.max(40, cutoff);
        f.connect(vg); out = f;
      }
      if (playDrum(name, t, out, track.param('speedRate', cyc, pos))) return;
    }
    const midi = resolveMidi(track, value, cyc, pos);
    if (midi !== null) playNote(track, midi, t, dur, vg, cyc, pos);
  }

  /* ---------------------------------------------------------------------
     5. HORLOGE & ÉVALUATION
     --------------------------------------------------------------------- */
  const LOOKAHEAD = 0.12;
  let tracks = [];
  let bpmValue = 120;
  let cps = bpmValue / 60 / 4; // 1 cycle = 1 mesure de 4 temps
  let playing = false, timer = null;
  let anchorTime = 0, anchorCycle = 0, schedCycle = 0;
  const listeners = new Set();

  const cycleAt = (t) => anchorCycle + (t - anchorTime) * cps;
  const timeAt = (c) => anchorTime + (c - anchorCycle) / cps;

  function scheduleTrack(track, a, b) {
    const sp = track.speed;
    const la = a * sp, lb = b * sp;
    for (let c = Math.floor(la); c < lb; c++) {
      for (const e of track.events(c)) {
        const ls = c + e.start;
        if (ls < la || ls >= lb) continue;
        const t = timeAt(ls / sp);
        if (t < ctx.currentTime - 0.02) continue;
        trigger(track, e.value, Math.max(t, ctx.currentTime), e.dur / sp / cps, c, e.start);
      }
    }
  }

  function tick() {
    const until = cycleAt(ctx.currentTime + LOOKAHEAD);
    if (until <= schedCycle) return;
    for (const tr of tracks) {
      try { scheduleTrack(tr, schedCycle, until); } catch (e) { console.error(e); }
    }
    schedCycle = until;
  }

  function setBpm(b) {
    b = Number(b);
    if (!(b >= 20 && b <= 300)) throw new Error('bpm() attend un tempo entre 20 et 300');
    if (playing && ctx) {
      // ré-ancre l'horloge au dernier point déjà programmé : continuité parfaite
      anchorTime = timeAt(schedCycle);
      anchorCycle = schedCycle;
      cps = b / 60 / 4;
    } else {
      cps = b / 60 / 4;
    }
    bpmValue = b;
    if (delayNode) delayNode.delayTime.value = Math.min(1.9, (60 / b) * 0.75);
  }

  function evaluate(code) {
    const created = [];
    let newBpm = null;
    const api = {
      s: (p) => { const t = new Track('drum', p); created.push(t); return t; },
      note: (p) => { const t = new Track('note', p); created.push(t); return t; },
      bpm: (b) => { newBpm = b; },
    };
    api.sound = api.s; api.n = api.note;
    try {
      const fn = new Function('s', 'sound', 'note', 'n', 'bpm', '"use strict";\n' + code);
      fn(api.s, api.sound, api.note, api.n, api.bpm);
    } catch (e) {
      return { ok: false, error: humanError(e) };
    }
    try { if (newBpm !== null) setBpm(newBpm); } catch (e) { return { ok: false, error: e.message }; }
    tracks = created;
    return { ok: true, tracks: created, bpm: bpmValue };
  }

  function humanError(e) {
    const msg = e && e.message ? e.message : String(e);
    if (e instanceof SyntaxError) return 'Erreur de syntaxe : ' + msg + ' (vérifie tes guillemets et parenthèses)';
    if (/is not defined/.test(msg)) return msg.replace(/(\w+) is not defined/, '« $1 » n\'existe pas. Fonctions disponibles : s(), note(), bpm()');
    if (/is not a function/.test(msg)) return msg + ' — cette méthode n\'existe pas. Consulte l\'aide-mémoire.';
    return msg;
  }

  function start() {
    ensureAudio();
    if (ctx.state === 'suspended') ctx.resume();
    if (playing) return;
    playing = true;
    anchorTime = ctx.currentTime + 0.06; anchorCycle = 0; schedCycle = 0;
    if (delayNode) delayNode.delayTime.value = Math.min(1.9, (60 / bpmValue) * 0.75);
    timer = setInterval(tick, 25);
    tick();
    listeners.forEach((f) => f('start'));
  }

  function stop() {
    if (!playing) return;
    playing = false;
    clearInterval(timer); timer = null;
    tracks = [];
    if (master) {
      // coupe brièvement le master pour éviter les queues de sons
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(0, now + 0.05);
      master.gain.linearRampToValueAtTime(0.7, now + 0.6);
    }
    listeners.forEach((f) => f('stop'));
  }

  // Pré-écoute d'un son seul (pour les boutons « écouter »)
  function preview(kind, value) {
    ensureAudio();
    if (ctx.state === 'suspended') ctx.resume();
    const t = new Track(kind, value);
    t.p.gain = 0.9;
    const now = ctx.currentTime + 0.02;
    trigger(t, value, now, 0.4, 0, 0);
  }

  global.Pulse = {
    Pattern, Track, parseMini, noteToMidi, SCALES, DRUMS,
    evaluate, start, stop, preview, setBpm,
    isPlaying: () => playing,
    getTracks: () => tracks,
    getBpm: () => bpmValue,
    // position courante (en cycles) pour l'affichage
    now: () => (playing && ctx ? Math.max(0, cycleAt(ctx.currentTime)) : 0),
    analyser: () => analyser,
    on: (f) => { listeners.add(f); return () => listeners.delete(f); },
  };
})(typeof window !== 'undefined' ? window : globalThis);
