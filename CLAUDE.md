# Drapeaux en tête : instructions pour Claude Code

## Le projet en bref
Web app de flashcards pour apprendre les drapeaux du monde, faite pour Ghita. C'est une PWA installable sur téléphone et PC, qui marche hors ligne. Interface en français, avec tutoiement.
- 231 drapeaux : 194 pays (ONU + Vatican), 3 États à reconnaissance limitée (Kosovo, Palestine, Taïwan, `t:'lim'`), 34 territoires (`t:'terr'`, affichés « Territoire, pas un pays »).
- Méthode d'apprentissage : répétition espacée FSRS-6, rappel actif (QCM puis saisie), pièges choisis parmi les sosies visuels, correction immédiate avec astuces, note objective. Le détail et les sources sont dans `docs/DECISIONS.md`.
- Tout est statique : pas de serveur, pas de dépendance à l'exécution. La progression est dans le `localStorage` de chaque appareil. On passe d'un appareil à l'autre par export/import, avec une fusion carte par carte.

## Commandes
| Commande | Rôle |
|---|---|
| `npm test` | Tests unitaires : données + FSRS. Aucune dépendance. |
| `npm run build` | Génère `dist/`, le site à publier. |
| `node scripts/build.js --test` | Génère `dist-test/`, qui garde les hooks `window.__det` pour les tests. |
| `npm run serve` | Build + http://localhost:8080 |
| `npm run test:e2e` | Test complet dans Chromium headless, captures dans `tests/screenshots/`. Prérequis une fois : `npm i -D playwright && npx playwright install chromium`. |

**Avant tout commit ou publication : `npm test && npm run build`, et `npm run test:e2e` si Playwright est disponible.** Après un changement visuel, regarde aussi les captures à 390 px en clair et en sombre.

## Où est quoi
- `src/data.js` contient les données. Chaque entrée de `FLAGS` a les champs suivants :
  - `c` : code, qui est aussi le nom du fichier du drapeau ;
  - `n` : nom affiché ;
  - `a` : alias acceptés à la saisie ;
  - `cap` : capitale ;
  - `ct` : zone ;
  - `f` : notoriété de 1 à 4, qui fixe l'ordre d'introduction ;
  - `t` et `s` : statut ;
  - `i` : sens des symboles.

  Le fichier contient aussi `GROUPS` (groupes de sosies avec leur astuce) et `NAME_PAIRS` (noms faciles à confondre).
- `src/engine.js` contient FSRS-6, identique à py-fsrs 6.3.2, et `scheduleCard()`, qui gère les étapes d'apprentissage pendant la séance et la remise en file.
- `src/app.js` contient toute l'application en JS vanilla, avec un rendu par gabarits de chaînes : état, séances, collection, stats, réglages, transfert, installation, enregistrement du service worker. La constante `WEB` vaut `BUILD.target === 'web'`. `Store.connect()` (`window.claude`) est l'ancien mode « artefact Claude » : il est inactif dans la version web, ne pas s'en servir.
- **Défi chrono** (section « défi » de `src/app.js`) : jeu à 4 niveaux (Découverte f≤1, Voyageur f≤2, Explorateur tous les pays, Vexillologue avec territoires et saisie), score, séries et records. Il ne lit ni n'écrit `state` : ses réglages et records sont sous la clé `drapeaux-en-tete:defi` `{dir, lvl, zone, len, best: {"f-3": score}}`.
- `src/app.css` : les tokens de couleur clair/sombre sont en tête de fichier. Toute couleur passe par un token.
- `assets/flags/*.svg` : drapeaux optimisés, aux proportions officielles. `assets/flags-meta.json` donne le ratio largeur/hauteur. `assets/neighbors.json` donne 10 sosies visuels par drapeau, calculés en CIELAB.
- `assets/fonts` (Lexend, auto-hébergée) et `assets/icons` (icônes de l'app).
- `scripts/build.js` assemble `index.html` (CSS, données et JS en ligne), `sw.js`, `manifest.webmanifest`, `_headers` (Netlify) et `.nojekyll`.
- `scripts/tools/` : outils optionnels pour régénérer drapeaux, sosies et icônes. Voir leur README.
- `.github/workflows/deploy.yml` : déploiement sur GitHub Pages à chaque push sur `main`.

## Invariants : ne jamais casser
1. **Format de sauvegarde.** La clé `localStorage` est `drapeaux-en-tete:v1`. L'état a cette forme : `{v, epoch, epochAt, settings, settingsAt, cards, days, conf, updatedAt}`, où :
   - `cards["FR_f"] = {st, s, d, lr, due, n, k, r, l, fs, lt, stp}` ;
   - `days[dayIndex] = {n, k, nw, t, g}` ;
   - `conf["A~B"] = nombre`.

   Si tu changes ce format, écris une migration rétrocompatible et un test. Les fichiers d'export `{app:'drapeaux-en-tete', v:1, exportedAt, state}`, ainsi que l'ancien état brut copié depuis l'artefact Claude, doivent rester importables.
2. **FSRS.** `src/engine.js` doit continuer à donner exactement les résultats de py-fsrs. `npm test` compare 2 563 révisions. Ne change pas les paramètres sans raison explicite.
3. **Identifiants des cartes.** Ils s'écrivent `<code>_f` (drapeau → nom) et `<code>_r` (nom → drapeau). Ne renomme jamais un code existant de `FLAGS`, sinon la progression est perdue. Pour corriger un nom, modifie `n` ou `a`.
4. **Chemins relatifs partout.** Le site est servi sous `/<dépôt>/` sur GitHub Pages.
5. **Changement de jour à 4 h du matin**, heure locale (`dayIndex`).
6. **Exactitude des données.** Toute modification de capitale, de statut ou de drapeau se vérifie avec une source récente et fiable, citée dans le message de commit. Les territoires gardent `t:'terr'` et un `s` explicite. Pour un nouveau drapeau, il faut le fichier SVG avec un `viewBox`, son ratio et ses sosies (voir `scripts/tools/README.md`), puis `npm test`.
7. **Textes de l'interface.** Français, tutoiement, phrases courtes. Un message d'erreur dit quoi faire.
8. **Pas de dépendance à l'exécution.** Pas de CDN, pas de bibliothèque : l'app doit marcher hors ligne.
9. **Mises à jour sans manipulation.** La version du cache du service worker vient d'un hash du contenu, il n'y a rien à incrémenter à la main. La page est servie « réseau d'abord », donc une nouvelle version arrive à l'ouverture suivante.

## Comportements voulus (à ne pas « corriger »)
- **Nouveaux drapeaux** : 8 par jour par défaut, réglable à 4, 8, 12 ou 16. Les plus connus viennent d'abord, et deux sosies sont séparés d'au moins 9 rangs.
- **Sens inverse** : il se débloque quand la stabilité atteint 5 jours et après au moins une révision réussie un autre jour, avec 6 cartes par jour au maximum. Si un sens d'un drapeau a été travaillé aujourd'hui, l'autre sens attend le lendemain.
- **Mode adaptatif** : QCM tant que la carte est nouvelle ou que sa stabilité est sous 4 jours, puis saisie du nom. Le sens inverse se fait toujours par choix du drapeau parmi 4 ou 6.
- **Note** : elle se calcule à partir de la justesse et du temps de réponse (`rate()`). « J'ai deviné » compte comme Again, « J'avais bon » comme Hard.
- **Pièges des QCM**, par ordre de priorité : confusions personnelles, groupes de sosies, voisins visuels, noms proches, même zone.
- **Import** : fusion idempotente, la révision la plus récente (`lr`) gagne.
- **iPhone** : l'app installée sur l'écran d'accueil a un stockage séparé de Safari. Le bandeau d'installation le dit.

## Publier
Voir `docs/DEPLOY.md`. Pour une mise à jour, `git commit` puis `git push` sur `main` suffit : le workflow teste, construit et publie. Vérifie ensuite avec `gh run watch`.

## Règles de collaboration
- Demande l'accord de Ghita avant toute action irréversible ou visible publiquement : créer ou supprimer un dépôt, changer sa visibilité, faire un force-push, modifier les réglages Pages.
- Si un outil, une version d'action GitHub ou une commande ne marche pas, vérifie la documentation à jour au lieu de deviner.
- Explique simplement, en français, sans jargon inutile.
- Les idées en attente sont listées dans `docs/DECISIONS.md` (section « À faire plus tard »). Ne les lance pas sans demande.
