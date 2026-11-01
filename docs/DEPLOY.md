# Mettre l'app en ligne

L'app est un site statique : il suffit de publier le dossier `dist/` produit par `npm run build`. Deux options gratuites.

## Option A : GitHub Pages (recommandée avec Claude Code)
Les mises à jour se font ensuite automatiquement à chaque `git push`.

**Prérequis :** Node.js 18 ou plus récent, git et GitHub CLI (`gh`). Vérifie avec `node -v`, `git --version` et `gh --version`.

**1. Se connecter à GitHub (une fois)**
```
gh auth login        # GitHub.com → HTTPS → Login with a web browser
```

**2. Créer le dépôt public et envoyer le code**

Pour l'identité git, utilise l'adresse « noreply » de GitHub pour ne pas exposer d'e-mail personnel :
```
git config user.name "<pseudo>"
git config user.email "<id>+<pseudo>@users.noreply.github.com"
```
L'id s'obtient avec `gh api user --jq .id`.

Puis :
```
git init -b main
git add -A
git commit -m "Drapeaux en tête : première version"
gh repo create drapeaux --public --source=. --remote=origin --push
```
Ce premier push lance le workflow, qui échoue tant que Pages n'est pas activé. C'est normal.

**3. Activer GitHub Pages en mode « GitHub Actions »**
```
gh api -X POST "repos/{owner}/{repo}/pages" -f build_type=workflow
```
Si tu obtiens une erreur 409, Pages existe déjà. Dans ce cas :
```
gh api -X PUT "repos/{owner}/{repo}/pages" -f build_type=workflow
```

**4. Publier et suivre**
```
gh workflow run deploy.yml
gh run watch
gh api "repos/{owner}/{repo}/pages" --jq .html_url
```

**5. Vérifier**

Les quatre commandes suivantes doivent répondre `200` :
```
curl -sI <adresse>
curl -sI <adresse>sw.js
curl -sI <adresse>manifest.webmanifest
curl -sI <adresse>flags/FR.svg
```

**Si une action GitHub est refusée car obsolète**, mets à jour vers la dernière version majeure les actions concernées dans `.github/workflows/deploy.yml` (`actions/checkout`, `configure-pages`, `upload-pages-artifact`, `deploy-pages`), en vérifiant les versions sur leurs pages GitHub.

**Mises à jour** : `git add -A && git commit -m "…" && git push`. Le workflow relance les tests, construit et publie.

## Option B : Netlify
- **Sans ligne de commande** : lance `npm run build`, puis glisse le dossier `dist/` (ou un zip de son contenu) sur https://app.netlify.com/drop, avec un compte gratuit. Pour une mise à jour, glisse le nouveau `dist/` dans l'onglet « Deploys » du projet.
- **En ligne de commande** : lance `npx netlify-cli login`, puis `npm run build` et `npx netlify-cli deploy --prod --dir dist`. La première fois, choisis « créer un nouveau site » et un nom.

## Installer l'app sur le téléphone
- **iPhone** : dans Safari, ouvre l'adresse, puis Partager → « Sur l'écran d'accueil ». Ouvre ensuite toujours l'app par son icône : elle a sa propre mémoire, séparée de Safari.
- **Android** : dans Chrome, menu ⋮ → « Installer l'application ».
- **PC ou Mac** : dans Chrome ou Edge, clique sur l'icône d'installation dans la barre d'adresse, ou mets la page en favori.

## Récupérer la progression de la version Claude (artefact)
1. Dans l'artefact Claude : Réglages → Copie de secours → « Copier ».
2. Dans l'app web : Réglages → Sauvegarde et transfert → « Coller un texte » → colle → « Fusionner ».

## Passer d'un appareil à l'autre
Réglages → Sauvegarde et transfert. Sur l'appareil où tu as révisé, touche « Envoyer ma progression » : sur téléphone, ça ouvre le partage (AirDrop, WhatsApp à toi-même, e-mail…) ; sur PC, ça télécharge un fichier. Sur l'autre appareil, touche « Importer un fichier ». Les deux progressions sont fusionnées.
