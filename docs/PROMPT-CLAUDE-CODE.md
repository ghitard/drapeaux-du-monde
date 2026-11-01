# Prompts pour Claude Code

Ouvre Claude Code dans ce dossier, sur ton ordinateur : dans un terminal, `cd drapeaux-en-tete` puis `claude`, ou ouvre le dossier depuis l'app Claude Code. Colle ensuite le prompt voulu. Claude Code lit `CLAUDE.md` tout seul au démarrage.

## 1. Première session : mettre l'app en ligne

```
Tu reprends « Drapeaux en tête », ma web app de flashcards pour apprendre les drapeaux du monde. Le projet complet est dans ce dossier. Lis d'abord CLAUDE.md, README.md, docs/DECISIONS.md et docs/DEPLOY.md.

Objectif de cette session : mettre l'app en ligne sur GitHub Pages, pour que je l'ouvre sur mon téléphone et mon PC sans passer par Claude.

Procède dans cet ordre, avec un point d'une ou deux phrases après chaque étape :
1. Vérifie les outils : node (18 ou plus), git et gh. S'il en manque, dis-moi exactement quoi installer sur mon ordinateur, puis attends.
2. Lance npm test puis npm run build. Tout doit passer avant d'aller plus loin.
3. Lance npm run test:e2e (installe Playwright pour ce test si besoin) et regarde les captures dans tests/screenshots/. Si un test échoue, trouve la cause et corrige-la, sans contourner ni affaiblir le test.
4. Publie en suivant docs/DEPLOY.md, option A. Si gh n'est pas connecté, guide-moi pour gh auth login. Avant de créer le dépôt public, demande-moi de confirmer son nom (par défaut « drapeaux »).
5. Attends la fin du déploiement (gh run watch), puis vérifie que l'adresse répond pour la page, sw.js, manifest.webmanifest et un drapeau.
6. Termine par : l'adresse de l'app, comment l'installer sur iPhone et sur Android, comment récupérer ma progression de la version Claude, et comment publier une mise à jour plus tard.

Règles :
- Respecte les invariants de CLAUDE.md : format de sauvegarde, FSRS identique à py-fsrs, codes des drapeaux jamais renommés, chemins relatifs.
- Ne change ni le contenu ni le design de l'app dans cette session, sauf pour corriger un problème bloquant. Dans ce cas, relance tous les tests.
- Aucune action irréversible ou publique sans mon accord : création ou suppression de dépôt, changement de visibilité, force-push.
- Si une commande ou une action GitHub échoue, cherche la cause dans le message d'erreur et la documentation à jour plutôt que de deviner, et dis-moi ce que tu as changé.
- Réponds en français, simplement, sans jargon.
```

## 2. Sessions suivantes : faire évoluer l'app

```
Lis CLAUDE.md. Je veux : [décris le changement, par exemple « ajouter un mode capitales », « corriger le drapeau de tel pays » ou « passer à 12 nouveaux drapeaux par jour par défaut »].

Propose d'abord ton plan en quelques lignes, avec les fichiers touchés et les risques pour ma progression enregistrée, puis attends mon accord.
Une fois validé : fais le changement, lance npm test, npm run build et npm run test:e2e, regarde les captures dans tests/screenshots/ en clair et en sombre, puis publie (commit + push sur main) et vérifie le déploiement avec gh run watch.
Si tu modifies des données (capitale, statut, drapeau), vérifie-les avec une source récente et cite-la dans le message de commit.
Termine par deux phrases : ce qui a changé et comment le voir dans l'app.
```
