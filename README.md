# Drapeaux du Monde

Un jeu pour apprendre les 197 drapeaux de la planète (193 pays de l'ONU, plus le Vatican, la Palestine, le Kosovo et Taïwan).

**Jouer :** activez GitHub Pages (Settings → Pages → branche `main`, dossier `/`), puis ouvrez `https://<votre-compte>.github.io/drapeaux-du-monde/`.

## Modes
- **Quel est ce pays ?** : un drapeau s'affiche, trouvez le pays.
- **Trouve le drapeau** : un pays s'affiche, choisissez son drapeau.

## Niveaux
| Niveau | Pays | Réponse |
|---|---|---|
| Découverte | 43 drapeaux célèbres | 4 choix au hasard |
| Voyageur | 116 pays | 4 choix du même continent |
| Explorateur | 197 pays | 6 choix, drapeaux sosies (Tchad/Roumanie, Monaco/Indonésie…) |
| Vexillologue | 197 pays | saisie libre (accents et petites fautes tolérés), indices |

## Fonctionnalités
- Filtre par continent, parties de 10, 20 ou 50 questions
- Score avec bonus de rapidité et de série
- Les drapeaux ratés reviennent plus souvent ; mode « Réviser mes erreurs »
- Progression par continent, records par niveau, atlas consultable
- Raccourcis clavier : `1`–`6` pour répondre, `Entrée` pour continuer, `Échap` pour quitter
- Fonctionne sur téléphone et ordinateur, en thème clair ou sombre

Aucune installation : HTML, CSS et JavaScript. Pour tester en local : `python3 -m http.server` puis http://localhost:8000.

Drapeaux SVG : [flag-icons](https://github.com/lipis/flag-icons) (licence MIT, voir `flags/LICENSE`).
