# Drapeaux en tête

Flashcards pour apprendre les drapeaux du monde : 194 pays, Kosovo, Palestine, Taïwan et 34 territoires. C'est une web app installable sur téléphone et PC, qui marche hors ligne, en français. Elle a aussi un **Défi chrono** à 4 niveaux de difficulté (score, séries, records). Elle s'appuie sur la répétition espacée FSRS-6, le rappel actif, des pièges choisis parmi les drapeaux qui se ressemblent et une correction avec astuces.

## Utiliser l'app
- Mise en ligne : voir [docs/DEPLOY.md](docs/DEPLOY.md). Avec GitHub Pages, l'adresse est du type `https://<pseudo>.github.io/<dépôt>/` (ici https://ghitard.github.io/drapeaux-du-monde/).
- Installation sur le téléphone, transfert de progression entre appareils et récupération depuis la version Claude : voir [docs/DEPLOY.md](docs/DEPLOY.md).

## Développer
Il suffit de Node.js 18 ou plus récent. Aucune dépendance n'est nécessaire pour construire ou tester.

| Commande | Rôle |
|---|---|
| `npm test` | Tests des données et de l'algorithme FSRS |
| `npm run build` | Construit le site dans `dist/` |
| `npm run serve` | Construit puis sert l'app sur http://localhost:8080 |
| `npm run test:e2e` | Test complet dans un navigateur (après `npm i -D playwright && npx playwright install chromium`) |

```
src/            données (data.js), algorithme (engine.js), application (app.js, app.css)
assets/         drapeaux SVG, ratios, sosies visuels, polices, icônes
scripts/        build, serveur local, outils optionnels (tools/)
tests/          tests unitaires, test de bout en bout, valeurs de référence FSRS
docs/           déploiement, décisions et méthode, prompts pour Claude Code
.github/        déploiement automatique sur GitHub Pages
```

Pour travailler avec Claude Code, les règles du projet sont dans [CLAUDE.md](CLAUDE.md) et les prompts dans [docs/PROMPT-CLAUDE-CODE.md](docs/PROMPT-CLAUDE-CODE.md).

Les crédits (drapeaux, polices, algorithme) sont dans [CREDITS.md](CREDITS.md).
