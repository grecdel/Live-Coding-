# Pulse — apprendre le live coding

Un site pour apprendre le **live coding musical**, c'est-à-dire faire de la musique en écrivant du code en direct.

- **Apprendre** : 15 leçons interactives, du premier son jusqu'à la construction d'une performance, sur 3 niveaux (débutant, intermédiaire, avancé). Chaque exemple se joue et se modifie directement dans la page.
- **Exercices** : 12 défis corrigés automatiquement. Le site analyse ce que joue ton code, puis propose un indice ou la solution.
- **Matériel** : 4 setups complets (du bricolage à ~60 € au studio pro) et un catalogue de 31 équipements, filtrable par niveau, catégorie et budget.
- **Studio** : un espace de jam libre avec des morceaux d'exemple et un aide-mémoire.

Tous les sons sont synthétisés en direct avec Web Audio. Il n'y a ni sample, ni dépendance, ni étape de build. La progression est enregistrée dans le navigateur.

## Lancer le site

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

On peut aussi ouvrir `index.html` directement dans le navigateur, ou le publier tel quel sur GitHub Pages.

## Le langage

Il s'inspire de la mini-notation de [TidalCycles](https://tidalcycles.org) et [Strudel](https://strudel.cc) :

```js
bpm(124)
s("bd*4")                                   // batterie
s("~ cp ~ cp").delay(0.3)
s("hh*8").gain("0.4 0.15")                  // paramètre en motif
note("<c2 ab1 bb1 g1>*8").wave("saw").cutoff(600).resonance(6)
note("0 2 4 <3 5>").scale("c4:minor").wave("tri")
```

| Syntaxe | Effet |
|---|---|
| `~` | silence |
| `[a b]` | regroupe des sons dans une seule case |
| `a*4` | répète le son dans sa case |
| `a!3` | recopie le son 3 fois |
| `a@3` | étire la durée |
| `<a b>` | alterne à chaque cycle |
| `[a,b,c]` | superpose les sons (accord, polyrythme) |

## Structure

```
index.html        page unique (navigation par #ancre)
css/style.css     styles
js/engine.js      moteur : parseur de mini-notation, horloge, synthèse
js/content.js     leçons, exercices, matériel, morceaux d'exemple
js/app.js         interface : éditeurs, visualisation, pages
```

Pour ajouter une leçon, un exercice ou un équipement, il suffit de modifier `js/content.js`.

## Application Android

Le fichier **`android/dist/pulse.apk`** est prêt à installer. C'est le site complet, embarqué dans l'application : il fonctionne hors-ligne, la progression est sauvegardée et les liens externes s'ouvrent dans le navigateur.

**Installation sur le téléphone** : copier l'APK sur le téléphone, l'ouvrir, puis autoriser « Installer des applications inconnues » quand Android le demande. Android 7.0 ou plus récent est requis.

**Reconstruire l'APK après une modification du site** :

```bash
./android/build.sh        # Java 17+, Python 3 et curl suffisent
```

Le SDK Android n'est pas nécessaire. Le script télécharge les outils depuis Maven Central (le framework Android 14, `dx` et `apksig`), et `android/tools/apkbuild.py` encode lui-même le manifeste binaire et la table de ressources.

**Signature** : l'APK est signé avec la clé de développement `android/pulse-debug.p12` (mot de passe `pulse-debug`). Comme elle est conservée dans le dépôt, chaque nouvelle version peut s'installer par-dessus l'ancienne. Cette clé est publique : pour publier sur le Play Store, il faut créer ta propre clé et la passer au script via `PULSE_KEYSTORE`, `PULSE_STOREPASS` et `PULSE_KEYALIAS`.
