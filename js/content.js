/* =========================================================================
   Contenu : leçons, exercices, matériel, morceaux d'exemple
   ========================================================================= */
(function (global) {
  'use strict';

  const LEVELS = {
    debutant: { label: 'Débutant', color: 'var(--lvl-1)', icon: '🌱' },
    intermediaire: { label: 'Intermédiaire', color: 'var(--lvl-2)', icon: '🔥' },
    avance: { label: 'Avancé', color: 'var(--lvl-3)', icon: '🚀' },
  };

  /* ---------------------------------------------------------------------
     LEÇONS
     Blocs : text (html), code (éditeur jouable), tip, sounds (boutons d'écoute)
     --------------------------------------------------------------------- */
  const LESSONS = [
    {
      id: 'intro', level: 'debutant', title: 'C\'est quoi le live coding ?', minutes: 4,
      summary: 'Écrire du code en direct pour créer de la musique devant un public.',
      blocks: [
        { type: 'text', html: `<p>Le <strong>live coding</strong>, c'est jouer de la musique en <em>écrivant du code en temps réel</em>. Au lieu de tourner des boutons ou de poser les doigts sur un clavier, le musicien tape des instructions… et la musique change instantanément.</p>
<p>Dans les soirées <strong>Algorave</strong>, l'écran du performeur est souvent projeté : le public voit le code évoluer pendant qu'il danse. C'est une philosophie d'ouverture : <em>« Show us your screens »</em>, le slogan du collectif TOPLAP.</p>` },
        { type: 'text', html: `<h3>Comment ça marche ici ?</h3>
<p>Ce site embarque un petit moteur musical. Chaque éditeur ci-dessous est jouable :</p>
<ul>
<li>Clique sur <span class="kbd">▶ Jouer</span> (ou <span class="kbd">Ctrl</span> + <span class="kbd">Entrée</span>) pour lancer ou mettre à jour le son.</li>
<li>Modifie le code pendant que ça joue, puis relance avec <span class="kbd">Ctrl</span> + <span class="kbd">Entrée</span> : la musique change sans s'arrêter.</li>
<li><span class="kbd">■</span> ou <span class="kbd">Ctrl</span> + <span class="kbd">.</span> arrête tout.</li>
</ul>` },
        { type: 'code', code: `// Appuie sur ▶ — voici ton premier beat !
s("bd hh sd hh")` },
        { type: 'tip', html: 'Pas de panique si tu ne comprends pas encore tout : chaque élément sera expliqué dans les leçons suivantes. Pense à mettre un casque ou des enceintes 🎧.' },
      ],
    },
    {
      id: 'premier-son', level: 'debutant', title: 'Ton premier son', minutes: 5,
      summary: 'La fonction s() et les sons de batterie disponibles.',
      blocks: [
        { type: 'text', html: `<p>La fonction <code>s()</code> (pour <em>sound</em>) joue des sons de batterie. Entre les guillemets, tu écris le nom d'un son :</p>` },
        { type: 'code', code: `s("bd")` },
        { type: 'text', html: `<p>Le son <code>bd</code> (<em>bass drum</em>, la grosse caisse) est joué <strong>une fois par cycle</strong>. Un <strong>cycle</strong>, c'est l'unité de temps de base : une mesure qui se répète en boucle.</p><h3>La boîte à rythmes</h3><p>Clique pour écouter chaque son :</p>` },
        { type: 'sounds', items: [['bd', 'Grosse caisse'], ['sd', 'Caisse claire'], ['hh', 'Charleston fermé'], ['oh', 'Charleston ouvert'], ['cp', 'Clap'], ['rim', 'Rimshot'], ['lt', 'Tom grave'], ['mt', 'Tom médium'], ['ht', 'Tom aigu'], ['cb', 'Cloche'], ['cr', 'Cymbale']] },
        { type: 'code', code: `// Remplace "cp" par un autre son, puis Ctrl+Entrée
s("cp")` },
      ],
    },
    {
      id: 'sequences', level: 'debutant', title: 'Séquences et silences', minutes: 6,
      summary: 'Enchaîner plusieurs sons dans un cycle, et utiliser ~ pour les silences.',
      blocks: [
        { type: 'text', html: `<p>Si tu écris plusieurs sons séparés par des espaces, ils se <strong>partagent le cycle</strong> à parts égales :</p>` },
        { type: 'code', code: `s("bd sd")        // 2 sons : chacun dure 1/2 cycle` },
        { type: 'code', code: `s("bd sd hh cp")  // 4 sons : chacun dure 1/4 de cycle` },
        { type: 'text', html: `<p>Plus tu ajoutes de sons, plus ils vont vite — le cycle, lui, garde toujours la même durée. Regarde la visualisation sous l'éditeur : chaque bloc est une note, la ligne verticale est la tête de lecture.</p>
<h3>Le silence : ~</h3><p>Le tilde <code>~</code> est un silence. Il prend une place, mais ne joue rien :</p>` },
        { type: 'code', code: `s("bd ~ sd ~")` },
        { type: 'code', code: `s("bd ~ ~ bd ~ ~ sd ~")` },
        { type: 'tip', html: 'Le rythme vient autant des silences que des sons. Essaie de déplacer les ~ pour créer des grooves différents.' },
      ],
    },
    {
      id: 'subdivisions', level: 'debutant', title: 'Subdivisions [ ] et répétitions *', minutes: 7,
      summary: 'Grouper des sons dans un seul temps et répéter facilement.',
      blocks: [
        { type: 'text', html: `<p>Les <strong>crochets</strong> <code>[ ]</code> regroupent plusieurs sons dans <em>une seule</em> case :</p>` },
        { type: 'code', code: `s("bd [sd sd] bd [hh hh hh]")` },
        { type: 'text', html: `<p>Ici, le cycle a 4 cases. La 2<sup>e</sup> contient deux caisses claires (deux fois plus rapides), la 4<sup>e</sup> trois charlestons (un triolet !).</p>
<h3>Répéter avec *</h3><p>L'étoile <code>*</code> répète un son dans sa case :</p>` },
        { type: 'code', code: `s("hh*8")           // 8 charlestons par cycle` },
        { type: 'code', code: `s("bd*2 [sd cp]*2")` },
        { type: 'text', html: `<h3>Répéter avec ! et étirer avec @</h3><p><code>!</code> recopie un élément (il prend plus de place), <code>@</code> lui donne un poids :</p>` },
        { type: 'code', code: `s("bd!3 sd")    // = "bd bd bd sd"
s("cp@3 rim")   // cp dure 3 fois plus longtemps que rim` },
      ],
    },
    {
      id: 'melodies', level: 'debutant', title: 'Notes et mélodies', minutes: 7,
      summary: 'La fonction note() pour jouer des notes avec un synthétiseur.',
      blocks: [
        { type: 'text', html: `<p>Pour jouer des notes, on utilise <code>note()</code>. On écrit les notes en notation anglo-saxonne :</p>
<table class="notes-table"><tr><th>Do</th><th>Ré</th><th>Mi</th><th>Fa</th><th>Sol</th><th>La</th><th>Si</th></tr><tr><td>c</td><td>d</td><td>e</td><td>f</td><td>g</td><td>a</td><td>b</td></tr></table>
<p>Le chiffre après la lettre indique l'<strong>octave</strong> (plus il est grand, plus c'est aigu). Ajoute <code>#</code> pour un dièse, <code>b</code> pour un bémol : <code>c#4</code>, <code>eb3</code>.</p>` },
        { type: 'code', code: `note("c3 e3 g3 b3")` },
        { type: 'code', code: `note("e4 d4 c4 d4 e4 e4 e4 ~")` },
        { type: 'text', html: `<p>Toutes les règles de rythme que tu connais marchent aussi : silences, crochets, répétitions…</p>` },
        { type: 'code', code: `note("c2*2 [~ c3] eb2 [g2 bb2]")` },
        { type: 'tip', html: 'Les nombres marchent aussi : <code>note("60 64 67")</code> utilise les numéros MIDI (60 = do central).' },
      ],
    },
    {
      id: 'pistes', level: 'debutant', title: 'Superposer des pistes', minutes: 6,
      summary: 'Jouer plusieurs motifs en même temps et régler leur volume.',
      blocks: [
        { type: 'text', html: `<p>Chaque ligne <code>s()</code> ou <code>note()</code> crée une <strong>piste</strong>. Toutes les pistes jouent ensemble, parfaitement synchronisées :</p>` },
        { type: 'code', code: `s("bd*4")
s("~ cp ~ cp")
s("hh*8").gain(0.4)
note("c2 ~ c2 eb2").wave("square").gain(0.5)` },
        { type: 'text', html: `<p>Le <code>.gain()</code> ajouté à la fin règle le <strong>volume</strong> de la piste (de 0 à 1 environ). C'est une <em>méthode</em> : on la colle à la piste avec un point. On peut en enchaîner plusieurs !</p>` },
        { type: 'tip', html: 'Astuce de performance : mets <code>//</code> devant une ligne pour la « couper » (la commenter), puis Ctrl+Entrée. Enlève les <code>//</code> pour la faire revenir.' },
      ],
    },
    {
      id: 'alternance', level: 'intermediaire', title: 'Alternance < >', minutes: 6,
      summary: 'Des motifs qui changent à chaque cycle.',
      blocks: [
        { type: 'text', html: `<p>Les chevrons <code>&lt; &gt;</code> choisissent <strong>un élément différent à chaque cycle</strong>. Parfait pour faire évoluer un motif sans tout réécrire :</p>` },
        { type: 'code', code: `s("bd <sd cp> bd <hh oh rim>")` },
        { type: 'text', html: `<p>Au cycle 1 : <code>sd</code> et <code>hh</code>, au cycle 2 : <code>cp</code> et <code>oh</code>, au cycle 3 : <code>sd</code> et <code>rim</code>… Idéal pour une ligne de basse qui suit une grille d'accords :</p>` },
        { type: 'code', code: `s("bd*4")
note("<c2 a1 f1 g1>*4").wave("saw").cutoff(600)` },
        { type: 'text', html: `<p>Combinée à <code>*</code>, l'alternance avance plusieurs fois par cycle. Et on peut les imbriquer : <code>&lt;a &lt;b c&gt;&gt;</code>.</p>` },
      ],
    },
    {
      id: 'tempo', level: 'intermediaire', title: 'Tempo : bpm, fast et slow', minutes: 5,
      summary: 'Régler la vitesse globale et la vitesse de chaque piste.',
      blocks: [
        { type: 'text', html: `<p><code>bpm()</code> règle le tempo global en battements par minute. Ici, un cycle = 4 temps. Quelques repères : hip-hop ~90, house ~124, techno ~130, drum &amp; bass ~174.</p>` },
        { type: 'code', code: `bpm(90)
s("bd ~ ~ bd ~ ~ sd ~")
s("hh*8").gain(0.35)` },
        { type: 'text', html: `<p><code>.fast(n)</code> et <code>.slow(n)</code> accélèrent ou ralentissent <em>une seule piste</em> :</p>` },
        { type: 'code', code: `bpm(120)
s("bd sd")
s("hh oh").fast(4).gain(0.4)
note("c3 g3 eb4 g3 c4 g3 eb3 bb3").slow(2).wave("tri")` },
        { type: 'tip', html: 'Change le bpm pendant que ça tourne : le moteur se recale sans couper le son.' },
      ],
    },
    {
      id: 'timbre', level: 'intermediaire', title: 'Sculpter le timbre', minutes: 8,
      summary: 'Formes d\'onde, filtre passe-bas, enveloppe.',
      blocks: [
        { type: 'text', html: `<p>Le synthé de <code>note()</code> a plusieurs <strong>formes d'onde</strong> avec <code>.wave()</code> :</p>
<ul><li><code>sine</code> — pure et douce</li><li><code>tri</code> — un peu plus riche, type flûte</li><li><code>square</code> — creux, rétro, jeux vidéo 8-bit</li><li><code>saw</code> — brillant et agressif, base de la techno</li><li><code>supersaw</code> — 5 dents de scie désaccordées, énorme pour les nappes</li></ul>` },
        { type: 'code', code: `// Essaie chaque forme : sine, tri, square, saw, supersaw
note("c3 e3 g3 c4").wave("square")` },
        { type: 'text', html: `<p>Découvre maintenant le <strong>filtre</strong> : <code>.cutoff(hz)</code> retire les aigus au-dessus d'une fréquence. <code>.resonance()</code> accentue cette fréquence (effet « acid »).</p>` },
        { type: 'code', code: `note("c2*8").wave("saw").cutoff(400).resonance(8)` },
        { type: 'text', html: `<p>L'<strong>enveloppe</strong> : <code>.attack(s)</code> = temps de montée, <code>.release(s)</code> = temps d'extinction, en secondes.</p>` },
        { type: 'code', code: `note("<[c3,eb3,g3] [ab2,c3,eb3]>").wave("supersaw").attack(0.4).release(1.5).cutoff(1500).gain(0.5)` },
      ],
    },
    {
      id: 'gammes', level: 'intermediaire', title: 'Gammes et accords', minutes: 8,
      summary: 'Jouer juste à tous les coups avec .scale(), et écrire des accords.',
      blocks: [
        { type: 'text', html: `<p>Avec <code>.scale()</code>, les nombres deviennent des <strong>degrés</strong> de la gamme : 0 = la 1<sup>re</sup> note, 1 = la 2<sup>e</sup>, etc. Impossible de jouer faux !</p>` },
        { type: 'code', code: `note("0 1 2 3 4 5 6 7").scale("c:major").wave("tri")` },
        { type: 'code', code: `note("0 2 4 <3 5> 7 4 2 ~").scale("a2:minor").wave("square").cutoff(1200)` },
        { type: 'text', html: `<p>Gammes disponibles : <code>major</code>, <code>minor</code>, <code>dorian</code>, <code>phrygian</code>, <code>lydian</code>, <code>mixolydian</code>, <code>pentatonic</code>, <code>minpent</code>, <code>blues</code>, <code>chromatic</code>. Les degrés négatifs descendent sous la tonique.</p>
<h3>Les accords : la virgule</h3><p>À l'intérieur des crochets, la <strong>virgule</strong> superpose des notes :</p>` },
        { type: 'code', code: `note("<[c3,e3,g3] [a2,c3,e3] [f2,a2,c3] [g2,b2,d3]>").wave("supersaw").release(0.8).gain(0.5)` },
        { type: 'code', code: `note("[0,2,4] [1,3,5] [-1,1,3] [0,2,4,6]").scale("d3:dorian").wave("tri")` },
      ],
    },
    {
      id: 'effets', level: 'intermediaire', title: 'Effets : delay et pan', minutes: 5,
      summary: 'Donner de l\'espace avec l\'écho et la stéréo.',
      blocks: [
        { type: 'text', html: `<p><code>.delay(x)</code> envoie la piste dans un <strong>écho</strong> calé sur le tempo (x de 0 à 1). <code>.pan(x)</code> la place dans l'espace stéréo : -1 à gauche, 0 au centre, 1 à droite.</p>` },
        { type: 'code', code: `s("~ rim ~ ~").delay(0.6)
note("e4 ~ ~ b3 ~ ~ g4 ~").wave("sine").delay(0.5).pan(0.6).gain(0.5)
note("e2 ~ ~ e2 ~ ~ ~ ~").wave("tri").gain(0.8)` },
        { type: 'tip', html: 'Au casque, le pan est spectaculaire. Le delay rend tout plus « grand » — mais avec modération, sinon ça devient de la bouillie sonore !' },
      ],
    },
    {
      id: 'patterns-params', level: 'avance', title: 'Paramètres en motifs', minutes: 8,
      summary: 'Faire bouger le volume, le filtre ou le pan au rythme du morceau.',
      blocks: [
        { type: 'text', html: `<p>Secret des pros : presque toutes les méthodes acceptent un <strong>motif</strong> au lieu d'un nombre ! La valeur change alors pendant le cycle.</p>` },
        { type: 'code', code: `s("hh*16").gain("0.6 0.2 0.35 0.2")` },
        { type: 'code', code: `note("c2*16").wave("saw").resonance(10)
  .cutoff("<200 400 800 1600>*4")` },
        { type: 'text', html: `<p>On peut même animer le pan et le delay :</p>` },
        { type: 'code', code: `bpm(126)
s("bd*4")
s("hh*8").pan("-0.8 0.8").gain(0.35)
note("0 2 4 6 4 2").scale("e3:minpent").fast(2).wave("square")
  .cutoff("<800 2000 3000 1200>").delay("<0 0.5>").gain(0.4)` },
        { type: 'tip', html: 'Les accents (gain fort/faible) donnent vie à une boucle mécanique : c\'est ce qu\'on appelle le <em>groove</em>.' },
      ],
    },
    {
      id: 'polyrythmes', level: 'avance', title: 'Polyrythmes et décalages', minutes: 7,
      summary: 'Superposer des cycles de longueurs différentes.',
      blocks: [
        { type: 'text', html: `<p>Un <strong>polyrythme</strong> superpose des divisions différentes du même temps. Avec la virgule, c'est immédiat :</p>` },
        { type: 'code', code: `s("[bd*3, hh*4]")` },
        { type: 'code', code: `s("[lt mt ht, cp ~ ~ ~ ~, rim*7]")` },
        { type: 'text', html: `<p>Et avec <code>.slow()</code>, des motifs de longueurs différentes se décalent progressivement : la combinaison ne se répète qu'au bout de nombreux cycles. C'est la technique de la <em>phase music</em> (Steve Reich).</p>` },
        { type: 'code', code: `note("0 2 4 5 7").scale("c4:major").wave("sine").gain(0.5)
note("0 2 4 5 7 9").scale("c3:major").wave("tri").slow(1.2).pan(0.7).gain(0.5)` },
      ],
    },
    {
      id: 'performance', level: 'avance', title: 'Construire une performance', minutes: 10,
      summary: 'Structurer un set en direct : intro, montée, drop, outro.',
      blocks: [
        { type: 'text', html: `<p>Une performance de live coding raconte une histoire. Une structure classique :</p>
<ol><li><strong>Intro</strong> — une nappe, un son isolé. On installe l'ambiance.</li>
<li><strong>Montée</strong> — on ajoute les éléments un par un : charleston, basse, percussions.</li>
<li><strong>Drop</strong> — tout le monde ensemble ! Grosse caisse sur chaque temps.</li>
<li><strong>Break</strong> — on retire la grosse caisse, on ouvre le filtre…</li>
<li><strong>Outro</strong> — on démonte progressivement.</li></ol>` },
        { type: 'code', code: `bpm(124)
// 1. décommente les lignes une à une, Ctrl+Entrée à chaque fois
note("<[c3,eb3,g3] [ab2,c3,eb3] [bb2,d3,f3] [g2,bb2,d3]>").wave("supersaw").attack(0.3).release(1).cutoff(1200).gain(0.35)
// s("hh*8").gain("0.4 0.15").pan("-0.5 0.5")
// note("<c2 ab1 bb1 g1>*8").wave("saw").cutoff("<300 600 900 1400>").resonance(6).gain(0.6)
// s("~ cp ~ cp").delay(0.3)
// s("bd*4")` },
        { type: 'text', html: `<h3>Conseils de scène</h3><ul>
<li><strong>Prépare des blocs</strong> commentés à l'avance, et active-les en live.</li>
<li><strong>Change une chose à la fois</strong> : le public doit pouvoir suivre.</li>
<li><strong>Grossis la police</strong> de ton éditeur : ton écran est projeté !</li>
<li><strong>L'erreur fait partie du jeu</strong> : un bug peut devenir une idée musicale.</li>
<li><strong>Entraîne-toi en conditions réelles</strong> : chrono, enregistrement, amis.</li></ul>` },
      ],
    },
    {
      id: 'plus-loin', level: 'avance', title: 'Aller plus loin', minutes: 6,
      summary: 'Les vrais outils des live coders et la communauté.',
      blocks: [
        { type: 'text', html: `<p>Ce que tu as appris ici est directement inspiré de la <strong>mini-notation</strong> de TidalCycles et Strudel. Tu peux passer aux outils « pros » sans repartir de zéro :</p>
<div class="tools-grid">
<a class="tool" href="https://strudel.cc" target="_blank" rel="noopener"><strong>Strudel</strong><span>Dans le navigateur, JavaScript, gratuit. La suite logique de ce site !</span></a>
<a class="tool" href="https://tidalcycles.org" target="_blank" rel="noopener"><strong>TidalCycles</strong><span>Le pionnier, en Haskell + SuperCollider. Très puissant pour les motifs.</span></a>
<a class="tool" href="https://sonic-pi.net" target="_blank" rel="noopener"><strong>Sonic Pi</strong><span>Basé sur Ruby, très pédagogique, idéal en classe et sur Raspberry Pi.</span></a>
<a class="tool" href="https://supercollider.github.io" target="_blank" rel="noopener"><strong>SuperCollider</strong><span>Le moteur de synthèse ultime. Courbe d'apprentissage raide.</span></a>
<a class="tool" href="https://hydra.ojack.xyz" target="_blank" rel="noopener"><strong>Hydra</strong><span>Live coding de vidéo et visuels, parfait pour accompagner ta musique.</span></a>
<a class="tool" href="https://github.com/hundredrabbits/Orca" target="_blank" rel="noopener"><strong>ORCA</strong><span>Un langage ésotérique en grille, qui pilote tes synthés MIDI.</span></a>
</div>
<h3>La communauté</h3><ul>
<li><a href="https://toplap.org" target="_blank" rel="noopener">TOPLAP</a> — le collectif historique, et ses nœuds locaux.</li>
<li><a href="https://algorave.com" target="_blank" rel="noopener">Algorave</a> — trouve des soirées près de chez toi.</li>
<li><a href="https://club.tidalcycles.org" target="_blank" rel="noopener">Tidal Club</a> — forum très accueillant pour les débutants.</li></ul>` },
        { type: 'tip', html: 'Prochaine étape : passe par la section <strong>Exercices</strong>, puis va jammer librement dans le <strong>Studio</strong>.' },
      ],
    },
  ];

  /* ---------------------------------------------------------------------
     EXERCICES — chaque check() reçoit (tracks, H) et retourne {ok, msg}
     --------------------------------------------------------------------- */
  const approx = (a, b) => Math.abs(a - b) < 0.002;
  const H = {
    // événements d'une piste au cycle c (dans le temps global, en tenant compte de fast/slow)
    events(track, c = 0) {
      const sp = track.speed, out = [];
      for (let lc = Math.floor(c * sp); lc < (c + 1) * sp; lc++) {
        for (const e of track.events(lc)) {
          const g = (lc + e.start) / sp - c;
          if (g >= -1e-9 && g < 1 - 1e-9) out.push({ start: g, dur: e.dur / sp, value: String(e.value).toLowerCase() });
        }
      }
      return out;
    },
    drumStarts(tracks, name, c = 0) {
      const set = new Set();
      tracks.filter((t) => t.kind === 'drum').forEach((t) => H.events(t, c).forEach((e) => { if (e.value.split(':')[0] === name) set.add(Math.round(e.start * 1000) / 1000); }));
      return [...set].sort((a, b) => a - b);
    },
    sameStarts(a, b) { return a.length === b.length && a.every((x, i) => approx(x, b[i])); },
  };

  const EXERCISES = [
    {
      id: 'ex-coeur', level: 'debutant', title: 'Le battement de cœur',
      goal: 'Joue une grosse caisse <code>bd</code> sur chacun des 4 temps du cycle.',
      starter: `s("bd")`, hint: 'L\'étoile * répète un son.', solution: `s("bd*4")`,
      check(tr) {
        const st = H.drumStarts(tr, 'bd');
        if (!st.length) return { ok: false, msg: 'Je n\'entends aucune grosse caisse « bd ».' };
        return H.sameStarts(st, [0, 0.25, 0.5, 0.75]) ? { ok: true } : { ok: false, msg: `J'entends ${st.length} « bd » par cycle, il en faut 4 régulières.` };
      },
    },
    {
      id: 'ex-boomtchak', level: 'debutant', title: 'Boom-Tchak',
      goal: 'Le rythme de base du rock : <code>bd</code> sur les temps 1 et 3, <code>sd</code> sur les temps 2 et 4.',
      starter: `s("bd")`, hint: 'Il faut 4 cases dans le cycle, en alternant deux sons.', solution: `s("bd sd bd sd")`,
      check(tr) {
        const bd = H.drumStarts(tr, 'bd'), sd = H.drumStarts(tr, 'sd');
        if (!H.sameStarts(bd, [0, 0.5])) return { ok: false, msg: 'La grosse caisse doit être sur les temps 1 et 3 uniquement.' };
        if (!H.sameStarts(sd, [0.25, 0.75])) return { ok: false, msg: 'La caisse claire doit être sur les temps 2 et 4.' };
        return { ok: true };
      },
    },
    {
      id: 'ex-hh', level: 'debutant', title: 'Charleston pressé',
      goal: 'Ajoute au beat une piste de <strong>8 charlestons</strong> <code>hh</code> réguliers par cycle, moins forts que le reste (gain inférieur à 0.6).',
      starter: `s("bd sd bd sd")\n`, hint: 'Une nouvelle ligne s("hh*…") avec .gain(0.4) à la fin.', solution: `s("bd sd bd sd")\ns("hh*8").gain(0.4)`,
      check(tr) {
        const t = tr.find((x) => x.kind === 'drum' && H.events(x).filter((e) => e.value === 'hh').length >= 8);
        if (!t) return { ok: false, msg: 'Il me faut une piste avec au moins 8 « hh » par cycle.' };
        if (typeof t.p.gain !== 'number' || t.p.gain >= 0.6) return { ok: false, msg: 'Baisse le volume des charlestons avec .gain(0.4) par exemple.' };
        return { ok: true };
      },
    },
    {
      id: 'ex-melodie', level: 'debutant', title: 'Première mélodie',
      goal: 'Écris une mélodie avec <code>note()</code> contenant <strong>au moins 4 notes différentes</strong> et au moins un silence <code>~</code>.',
      starter: `note("c3")`, hint: 'Exemple de notes : c3 d3 e3 g3. Le silence s\'écrit ~.', solution: `note("c3 e3 ~ g3 d3 ~ e3 c4")`,
      check(tr) {
        const t = tr.find((x) => x.kind === 'note');
        if (!t) return { ok: false, msg: 'Utilise la fonction note().' };
        const vals = new Set(H.events(t).map((e) => e.value));
        if (vals.size < 4) return { ok: false, msg: `J'entends ${vals.size} note(s) différente(s), il en faut 4.` };
        if (!/~/.test(t.pat.src)) return { ok: false, msg: 'Ajoute au moins un silence ~ pour faire respirer la mélodie.' };
        return { ok: true };
      },
    },
    {
      id: 'ex-groupe', level: 'intermediaire', title: 'Le groupe au complet',
      goal: 'Fais jouer <strong>en même temps</strong> au moins 2 pistes de batterie et 1 piste de notes.',
      starter: `s("bd*4")`, hint: 'Une ligne = une piste.', solution: `s("bd*4")\ns("~ cp ~ cp")\nnote("c2 c2 eb2 g2").wave("saw").cutoff(800)`,
      check(tr) {
        const d = tr.filter((t) => t.kind === 'drum').length, n = tr.filter((t) => t.kind === 'note').length;
        if (d < 2) return { ok: false, msg: `Il y a ${d} piste(s) de batterie, il en faut 2.` };
        if (n < 1) return { ok: false, msg: 'Ajoute une piste note().' };
        return { ok: true };
      },
    },
    {
      id: 'ex-alterne', level: 'intermediaire', title: 'Le motif qui évolue',
      goal: 'Crée une piste dont le contenu est <strong>différent au cycle 1 et au cycle 2</strong>, grâce à l\'alternance <code>&lt; &gt;</code>.',
      starter: `s("bd sd bd sd")`, hint: 'Remplace un son par <sd cp>.', solution: `s("bd <sd cp> bd <sd [cp cp]>")`,
      check(tr) {
        const ok = tr.some((t) => JSON.stringify(H.events(t, 0)) !== JSON.stringify(H.events(t, 1)));
        return ok ? { ok: true } : { ok: false, msg: 'Toutes tes pistes sont identiques d\'un cycle à l\'autre. Utilise < >.' };
      },
    },
    {
      id: 'ex-accord', level: 'intermediaire', title: 'Accord parfait',
      goal: 'Joue un <strong>accord</strong> : au moins 3 notes qui démarrent au même instant.',
      starter: `note("c3")`, hint: 'Dans des crochets, la virgule superpose : [a,b,c].', solution: `note("[c3,e3,g3]").wave("supersaw").release(1)`,
      check(tr) {
        for (const t of tr.filter((x) => x.kind === 'note')) {
          const count = {};
          H.events(t).forEach((e) => { const k = Math.round(e.start * 1000); count[k] = (count[k] || 0) + 1; });
          if (Object.values(count).some((c) => c >= 3)) return { ok: true };
        }
        return { ok: false, msg: 'Je ne trouve pas 3 notes simultanées.' };
      },
    },
    {
      id: 'ex-acid', level: 'intermediaire', title: 'Basse acid',
      goal: 'Une basse en <code>saw</code> ou <code>square</code>, filtrée sous 1000 Hz avec une résonance d\'au moins 5. Au moins 8 notes par cycle.',
      starter: `note("c2")`, hint: '.wave("saw").cutoff(500).resonance(8) et note("c2*8")…', solution: `note("c2*4 [c2 c3] eb2 c2").fast(2).wave("saw").cutoff(500).resonance(8)`,
      check(tr) {
        const t = tr.find((x) => x.kind === 'note' && ['sawtooth', 'square'].includes(x.p.wave));
        if (!t) return { ok: false, msg: 'Il faut une piste note() avec .wave("saw") ou .wave("square").' };
        if (typeof t.p.cutoff !== 'number' || t.p.cutoff >= 1000) return { ok: false, msg: 'Le .cutoff() doit être un nombre inférieur à 1000.' };
        if (typeof t.p.resonance !== 'number' || t.p.resonance < 5) return { ok: false, msg: 'Monte la .resonance() à 5 ou plus.' };
        if (H.events(t).length < 8) return { ok: false, msg: 'Il faut au moins 8 notes par cycle.' };
        return { ok: true };
      },
    },
    {
      id: 'ex-house', level: 'avance', title: 'Recette house',
      goal: 'Tempo entre 120 et 128 bpm, <code>bd</code> sur les 4 temps et <code>oh</code> (charleston ouvert) <strong>entre</strong> les temps (contretemps).',
      starter: `bpm(100)\ns("bd*4")`, hint: 'Le contretemps : "~ oh" répété 4 fois.', solution: `bpm(124)\ns("bd*4")\ns("[~ oh]*4").gain(0.5)`,
      check(tr) {
        const b = global.Pulse.getBpm();
        if (b < 120 || b > 128) return { ok: false, msg: `Le tempo est ${b} bpm : vise entre 120 et 128.` };
        if (!H.sameStarts(H.drumStarts(tr, 'bd'), [0, 0.25, 0.5, 0.75])) return { ok: false, msg: 'La grosse caisse doit jouer exactement les 4 temps.' };
        if (!H.sameStarts(H.drumStarts(tr, 'oh'), [0.125, 0.375, 0.625, 0.875])) return { ok: false, msg: 'Les « oh » doivent tomber pile entre les temps (4 par cycle).' };
        return { ok: true };
      },
    },
    {
      id: 'ex-gamme', level: 'avance', title: 'Mélodie modale',
      goal: 'Une mélodie de <strong>8 notes ou plus</strong> utilisant <code>.scale()</code> dans une gamme mineure (<code>minor</code>, <code>dorian</code>, <code>phrygian</code> ou <code>minpent</code>), avec au moins un degré négatif.',
      starter: `note("0 1 2 3")`, hint: 'note("0 2 -1 4 …").scale("a3:minor")', solution: `note("0 2 4 2 -1 0 -3 ~ 4 7 6 4").scale("a3:dorian").wave("tri").delay(0.3)`,
      check(tr) {
        const t = tr.find((x) => x.kind === 'note' && x.p.scale);
        if (!t) return { ok: false, msg: 'Ajoute .scale("…") à ta piste note().' };
        const st = t.p.scale.steps.join();
        const minors = ['minor', 'dorian', 'phrygian', 'minpent'].map((k) => global.Pulse.SCALES[k].join());
        if (!minors.includes(st)) return { ok: false, msg: 'Choisis une gamme mineure : minor, dorian, phrygian ou minpent.' };
        const evs = H.events(t);
        if (evs.length < 8) return { ok: false, msg: `${evs.length} notes par cycle, il en faut 8.` };
        if (!evs.some((e) => parseFloat(e.value) < 0)) return { ok: false, msg: 'Utilise au moins un degré négatif, comme -2.' };
        return { ok: true };
      },
    },
    {
      id: 'ex-poly', level: 'avance', title: '3 contre 4',
      goal: 'Crée un <strong>polyrythme</strong> : un son joué 3 fois par cycle et un autre 4 fois, régulièrement, en même temps.',
      starter: `s("bd*4")`, hint: 'Utilise la virgule [a*3, b*4] ou deux pistes.', solution: `s("[lt*3, hh*4]")`,
      check(tr) {
        const all = {};
        tr.forEach((t) => H.events(t).forEach((e) => { (all[e.value] = all[e.value] || new Set()).add(Math.round(e.start * 1000) / 1000); }));
        const reg = (n) => Object.values(all).some((s) => H.sameStarts([...s].sort((a, b) => a - b), Array.from({ length: n }, (_, i) => i / n)));
        if (!reg(3)) return { ok: false, msg: 'Il manque un son joué exactement 3 fois, régulièrement.' };
        if (!reg(4)) return { ok: false, msg: 'Il manque un son joué exactement 4 fois, régulièrement.' };
        return { ok: true };
      },
    },
    {
      id: 'ex-morceau', level: 'avance', title: 'Ton premier morceau',
      goal: 'Au moins <strong>5 pistes</strong>, dont une avec <code>.delay()</code>, une avec un paramètre en motif (ex : <code>.gain("1 0.3")</code>) et une avec <code>.pan()</code>.',
      starter: `bpm(122)\ns("bd*4")\n`, hint: 'Reprends tout ce que tu as appris : batterie, basse, accords, mélodie…',
      solution: `bpm(122)\ns("bd*4")\ns("~ cp").fast(2).delay(0.2)\ns("hh*16").gain("0.5 0.15 0.3 0.15").pan("-0.4 0.4")\nnote("<c2 ab1 bb1 g1>*8").wave("saw").cutoff(700).resonance(5).gain(0.5)\nnote("<[c3,eb3,g3] [ab2,c3,eb3]>").wave("supersaw").release(1).gain(0.3)`,
      check(tr) {
        if (tr.length < 5) return { ok: false, msg: `${tr.length} piste(s), il en faut 5.` };
        if (!tr.some((t) => t.p.delay instanceof global.Pulse.Pattern || t.p.delay > 0)) return { ok: false, msg: 'Ajoute .delay() sur une piste.' };
        if (!tr.some((t) => t.p.pan instanceof global.Pulse.Pattern || t.p.pan !== 0)) return { ok: false, msg: 'Utilise .pan() sur une piste.' };
        const pk = ['gain', 'cutoff', 'pan', 'delay', 'resonance', 'transpose', 'attack', 'release'];
        if (!tr.some((t) => pk.some((k) => t.p[k] instanceof global.Pulse.Pattern))) return { ok: false, msg: 'Mets un paramètre en motif, ex : .gain("1 0.3").' };
        return { ok: true };
      },
    },
  ];

  /* ---------------------------------------------------------------------
     MATÉRIEL — prix indicatifs en euros (neuf, 2025-2026)
     --------------------------------------------------------------------- */
  const GEAR_CATS = {
    ordi: { label: 'Ordinateur', icon: '💻' },
    controleur: { label: 'Contrôleur MIDI', icon: '🎛️' },
    interface: { label: 'Interface audio', icon: '🔌' },
    ecoute: { label: 'Écoute', icon: '🎧' },
    diy: { label: 'DIY', icon: '🛠️' },
    machine: { label: 'Machines & tables', icon: '🎚️' },
    logiciel: { label: 'Logiciel', icon: '💾' },
  };

  const GEAR = [
    // Logiciels (gratuits)
    { name: 'Strudel', cat: 'logiciel', level: 'debutant', price: 0, desc: 'Live coding dans le navigateur, rien à installer. La suite naturelle de ce site.', pros: ['Gratuit', 'Rien à installer', 'Énorme banque de sons'], cons: ['Dépend du navigateur'] },
    { name: 'Sonic Pi', cat: 'logiciel', level: 'debutant', price: 0, desc: 'Environnement pédagogique en Ruby, avec tutoriel intégré. Tourne même sur Raspberry Pi.', pros: ['Très pédagogique', 'Multi-plateforme'], cons: ['Moins orienté « motifs »'] },
    { name: 'TidalCycles + SuperCollider', cat: 'logiciel', level: 'avance', price: 0, desc: 'Le duo de référence des scènes Algorave. Puissant, mais installation plus technique.', pros: ['Ultra expressif', 'Grande communauté'], cons: ['Installation complexe'] },
    { name: 'VCV Rack', cat: 'logiciel', level: 'intermediaire', price: 0, desc: 'Synthétiseur modulaire virtuel, à piloter en MIDI ou OSC depuis ton code.', pros: ['Gratuit', 'Infini en sons'], cons: ['Gourmand en CPU'] },

    // Ordinateurs
    { name: 'Ton ordinateur actuel', cat: 'ordi', level: 'debutant', price: 0, desc: 'N\'importe quel ordinateur récent (même un Chromebook) suffit pour Strudel ou ce site.', pros: ['Déjà à la maison'], cons: ['Ventilateur parfois bruyant'] },
    { name: 'Raspberry Pi 5 (kit)', cat: 'ordi', level: 'debutant', price: 110, desc: 'Mini-ordinateur qui fait tourner Sonic Pi. Parfait pour une installation dédiée ou un atelier.', pros: ['Pas cher', 'Compact', 'Hackable'], cons: ['Puissance limitée'] },
    { name: 'MacBook Air (puce M)', cat: 'ordi', level: 'intermediaire', price: 1100, desc: 'Silencieux, faible latence audio native, grosse autonomie : un classique de la scène.', pros: ['Latence très faible', 'Silencieux'], cons: ['Prix', 'Peu de ports'] },
    { name: 'Laptop Linux (ex : ThinkPad)', cat: 'ordi', level: 'avance', price: 900, desc: 'Le choix de beaucoup de live coders : robuste, réparable, avec un noyau temps réel possible.', pros: ['Robuste', 'Libre'], cons: ['Réglages audio à faire (JACK/PipeWire)'] },

    // Contrôleurs
    { name: 'Korg nanoKONTROL2', cat: 'controleur', level: 'debutant', price: 65, desc: '8 faders + 8 potards ultra-compacts. Idéal pour régler les volumes de tes pistes en live.', pros: ['Pas cher', 'Tient dans un sac'], cons: ['Faders courts'] },
    { name: 'Arturia MiniLab 3', cat: 'controleur', level: 'debutant', price: 110, desc: 'Mini-clavier 25 touches, pads et potards : pour trouver tes mélodies avant de les coder.', pros: ['Polyvalent', 'Bonne finition'], cons: ['Mini-touches'] },
    { name: 'Novation Launch Control XL', cat: 'controleur', level: 'intermediaire', price: 190, desc: '24 potards, 8 faders, 16 boutons : la table de contrôle parfaite pour un set de live coding.', pros: ['Énormément de contrôles', 'Robuste'], cons: ['Encombrant'] },
    { name: 'Akai MPK Mini Plus', cat: 'controleur', level: 'intermediaire', price: 180, desc: '37 mini-touches, pads, séquenceur intégré et sorties CV pour piloter du modulaire.', pros: ['Séquenceur', 'Sorties CV'], cons: ['Mini-touches'] },
    { name: 'Intech Studio Grid / Faderfox', cat: 'controleur', level: 'avance', price: 300, desc: 'Contrôleurs modulaires et programmables en Lua (Grid) ou ultra-robustes (Faderfox) prisés des pros.', pros: ['Programmables', 'Qualité scène'], cons: ['Prix'] },

    // Interfaces audio
    { name: 'Behringer UMC22', cat: 'interface', level: 'debutant', price: 50, desc: 'L\'interface audio la moins chère et fiable : une sortie propre pour ton casque ou tes enceintes.', pros: ['Très abordable'], cons: ['Latence moyenne sous Windows'] },
    { name: 'Focusrite Scarlett 2i2 (4e gen)', cat: 'interface', level: 'intermediaire', price: 190, desc: 'La référence home-studio : préamplis propres, faible latence, très bons pilotes.', pros: ['Pilotes excellents', 'Son propre'], cons: ['Seulement 2 sorties'] },
    { name: 'MOTU M4', cat: 'interface', level: 'intermediaire', price: 260, desc: '4 sorties : envoie ta pré-écoute au casque et le mix à la sono séparément.', pros: ['Vu-mètres', '4 sorties'], cons: ['Un peu plus cher'] },
    { name: 'RME Babyface Pro FS', cat: 'interface', level: 'avance', price: 950, desc: 'Fiabilité légendaire, latence minimale : l\'interface des pros qui ne veulent aucune surprise sur scène.', pros: ['Ultra stable', 'Latence record'], cons: ['Prix'] },

    // Écoute
    { name: 'Casque Superlux HD681', cat: 'ecoute', level: 'debutant', price: 35, desc: 'Un casque fermé très abordable et étonnamment fidèle pour débuter.', pros: ['Prix imbattable'], cons: ['Finition plastique'] },
    { name: 'Audio-Technica ATH-M50x', cat: 'ecoute', level: 'intermediaire', price: 150, desc: 'Le casque de studio fermé le plus populaire : bon isolement, basses précises.', pros: ['Polyvalent', 'Pliable'], cons: ['Serre un peu'] },
    { name: 'Enceintes PreSonus Eris 3.5', cat: 'ecoute', level: 'debutant', price: 110, desc: 'Petits moniteurs de bureau, bien plus fidèles que des enceintes multimédia.', pros: ['Compactes', 'Prix'], cons: ['Peu de basses'] },
    { name: 'Yamaha HS5 (paire)', cat: 'ecoute', level: 'intermediaire', price: 400, desc: 'Moniteurs de studio réputés pour leur neutralité : ce que tu entends, c\'est ce qui est vrai.', pros: ['Très neutres'], cons: ['Exigent une pièce traitée'] },
    { name: 'Genelec 8030C (paire)', cat: 'ecoute', level: 'avance', price: 1700, desc: 'Monitoring professionnel compact, précision redoutable.', pros: ['Précision', 'Fiabilité'], cons: ['Prix élevé'] },

    // DIY
    { name: 'Contrôleur MIDI Arduino (Pro Micro)', cat: 'diy', level: 'debutant', price: 30, desc: 'Un Arduino Pro Micro, quelques potentiomètres et boutons : ton propre contrôleur USB-MIDI en un week-end.', pros: ['Très formateur', 'Sur mesure'], cons: ['Soudure nécessaire'] },
    { name: 'Teensy 4.1 + capteurs', cat: 'diy', level: 'intermediaire', price: 60, desc: 'Le microcontrôleur des makers musiciens : MIDI USB natif, audio, capteurs de distance, de lumière, d\'accéléromètre…', pros: ['Puissant', 'Bibliothèque audio'], cons: ['Programmation C++'] },
    { name: 'Kit Bela / Pi + DAC', cat: 'diy', level: 'avance', price: 180, desc: 'Construis un instrument autonome à latence ultra-faible qui fait tourner SuperCollider ou Pure Data.', pros: ['Latence infime', 'Autonome'], cons: ['Projet ambitieux'] },
    { name: 'Boîtier 3D + faders recyclés', cat: 'diy', level: 'intermediaire', price: 20, desc: 'Récupère des faders sur une vieille table de mixage et imprime un boîtier : écologique et unique.', pros: ['Récup', 'Style unique'], cons: ['Temps de fabrication'] },

    // Machines & tables
    { name: 'Behringer Xenyx 802S', cat: 'machine', level: 'debutant', price: 80, desc: 'Petite table de mixage analogique pour mélanger ton ordi, un synthé et un micro.', pros: ['Simple', 'Abordable'], cons: ['Peu d\'entrées'] },
    { name: 'Korg Volca (Drum, Bass, FM…)', cat: 'machine', level: 'intermediaire', price: 170, desc: 'Mini-machines synchronisables, pilotables en MIDI depuis ton code : mélange hardware et code !', pros: ['Fun', 'Sur piles'], cons: ['Haut-parleur intégré faible'] },
    { name: 'Elektron Digitakt II', cat: 'machine', level: 'avance', price: 1000, desc: 'Boîte à rythmes / sampleur de référence : à piloter en MIDI avec tes motifs pour un son hardware.', pros: ['Son incroyable', 'Séquenceur puissant'], cons: ['Courbe d\'apprentissage'] },
    { name: 'Allen & Heath Xone:96', cat: 'machine', level: 'avance', price: 1900, desc: 'Table de mixage DJ analogique haut de gamme, double interface USB : idéale pour un duo de live coders.', pros: ['Filtres mythiques', 'Son analogique'], cons: ['Prix', 'Poids'] },
    { name: 'Pioneer DJ DJM-A9', cat: 'machine', level: 'avance', price: 2700, desc: 'Le standard des clubs. Si tu joues en club, tu tomberas souvent dessus : savoir s\'y brancher est un atout.', pros: ['Standard des clubs', 'Effets intégrés'], cons: ['Prix très élevé'] },
  ];

  // Parcours / kits recommandés
  const KITS = [
    { id: 'diy', title: 'Le Bricoleur', budget: '~ 60 €', level: 'debutant', color: '#22d3a6', icon: '🛠️',
      desc: 'Pour ceux qui aiment comprendre et fabriquer.',
      items: ['Ton ordinateur actuel', 'Contrôleur MIDI Arduino (Pro Micro)', 'Casque Superlux HD681', 'Strudel'] },
    { id: 'starter', title: 'Le Curieux', budget: '~ 150 €', level: 'debutant', color: '#38bdf8', icon: '🌱',
      desc: 'Démarrer confortablement, sans se ruiner.',
      items: ['Ton ordinateur actuel', 'Korg nanoKONTROL2', 'Behringer UMC22', 'Casque Superlux HD681', 'Strudel'] },
    { id: 'scene', title: 'Prêt pour la scène', budget: '~ 900 €', level: 'intermediaire', color: '#f59e0b', icon: '🔥',
      desc: 'Pour tes premières Algoraves et un home-studio sérieux.',
      items: ['Novation Launch Control XL', 'Focusrite Scarlett 2i2 (4e gen)', 'Audio-Technica ATH-M50x', 'Yamaha HS5 (paire)', 'TidalCycles + SuperCollider'] },
    { id: 'pro', title: 'Le Studio Pro', budget: '5 000 € et +', level: 'avance', color: '#f43f5e', icon: '🚀',
      desc: 'Hybride code + hardware, pour les clubs et festivals.',
      items: ['MacBook Air (puce M)', 'RME Babyface Pro FS', 'Elektron Digitakt II', 'Allen & Heath Xone:96', 'Genelec 8030C (paire)', 'Intech Studio Grid / Faderfox'] },
  ];

  /* ---------------------------------------------------------------------
     MORCEAUX D'EXEMPLE pour le Studio
     --------------------------------------------------------------------- */
  const PRESETS = [
    { name: '🌌 Ambient', code: `bpm(70)
note("<[c3,g3,eb4] [ab2,eb3,c4] [f2,c3,ab3] [g2,d3,bb3]>")
  .wave("supersaw").attack(1.5).release(3).cutoff(900).gain(0.35)
note("0 ~ 4 ~ 2 ~ ~ 7").scale("c4:minor").slow(2)
  .wave("sine").delay(0.7).pan("-0.6 0.6").gain(0.4)
s("~ ~ rim ~").slow(2).delay(0.8).gain(0.3)` },
    { name: '🔊 Techno', code: `bpm(132)
s("bd*4")
s("[~ hh]*4").gain(0.5)
s("hh*16").gain("0.3 0.1 0.2 0.1").pan("-0.5 0.5")
s("~ ~ cp ~").delay(0.25)
note("c2*16").wave("saw").resonance(12)
  .cutoff("<300 500 900 1800>").gain(0.45)` },
    { name: '☕ Lo-fi hip-hop', code: `bpm(84)
s("bd ~ ~ bd ~ ~ [bd bd] ~")
s("~ sd ~ sd").gain(0.7)
s("hh*8").gain("0.35 0.15")
note("<[d3,f3,a3,c4] [g2,bb2,d3,f3] [c3,e3,g3,b3] [a2,c3,e3,g3]>")
  .wave("tri").cutoff(1400).release(0.9).gain(0.4)
note("<d2 g1 c2 a1>").wave("sine").gain(0.8)` },
    { name: '🧪 Acid', code: `bpm(128)
s("bd*4")
s("[~ oh]*4").gain(0.4)
note("c2 c2 [c3 c2] eb2 c2 [~ c2] g2 bb1").fast(2)
  .wave("saw").resonance(15)
  .cutoff("<400 700 1200 2500 1200 700>*2").gain(0.5)` },
    { name: '🥁 Polyrythmes', code: `bpm(110)
s("[bd*3, hh*4, ~ cp]")
s("lt mt ht mt ht").gain(0.5).pan(-0.6)
note("0 2 4 6 7").scale("e3:phrygian").wave("square").cutoff(1500).pan(0.6).gain(0.35)` },
    { name: '🎮 Chiptune', code: `bpm(150)
s("bd [~ bd] sd ~")
note("e4 e4 ~ e4 ~ c4 e4 ~ g4 ~ ~ ~ g3 ~ ~ ~").wave("square").release(0.05).gain(0.4)
note("<c3 a2 f2 g2>*4").wave("tri").gain(0.6)` },
  ];

  const CHEATSHEET = [
    ['s("bd sd")', 'Sons de batterie'],
    ['note("c3 e3 g3")', 'Notes au synthé'],
    ['bpm(120)', 'Tempo global'],
    ['~', 'Silence'],
    ['[a b]', 'Grouper dans une case'],
    ['a*4', 'Répéter dans la case'],
    ['a!3', 'Recopier 3 fois'],
    ['a@3', 'Durée × 3'],
    ['<a b>', 'Alterner par cycle'],
    ['[a,b,c]', 'Superposer (accord)'],
    ['.gain(0.5)', 'Volume'],
    ['.wave("saw")', 'sine tri square saw supersaw'],
    ['.cutoff(800)', 'Filtre passe-bas (Hz)'],
    ['.resonance(8)', 'Résonance du filtre'],
    ['.attack(0.1)', 'Montée (s)'],
    ['.release(1)', 'Extinction (s)'],
    ['.delay(0.5)', 'Écho (0–1)'],
    ['.pan(-1)', 'Stéréo (-1 à 1)'],
    ['.scale("c:minor")', 'Nombres → gamme'],
    ['.transpose(12)', 'Transposer (demi-tons)'],
    ['.fast(2) .slow(2)', 'Vitesse de la piste'],
    ['.speed(1.5)', 'Hauteur de la batterie'],
  ];

  global.Content = { LEVELS, LESSONS, EXERCISES, GEAR, GEAR_CATS, KITS, PRESETS, CHEATSHEET, H };
})(typeof window !== 'undefined' ? window : globalThis);
