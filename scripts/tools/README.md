# Outils optionnels

Ces outils servent seulement à régénérer des assets. Le build normal (`npm run build`) n'en a pas besoin.

| Outil | Rôle | Prérequis |
|---|---|---|
| `prep-flags.mjs` | Régénère `assets/flags/*.svg` et `assets/flags-meta.json` à partir de region-flags (Noto) et flag-icons. | `npm i -D svgo` + sources (voir l'en-tête du fichier) |
| `render-flags.js` | Rend les drapeaux en PNG pour le calcul des sosies. | `npm i -D @resvg/resvg-js` |
| `similarity.py` | Recalcule `assets/neighbors.json`, les sosies visuels utilisés comme pièges. | `pip install numpy pillow` |
| `make-icons.js` | Régénère `assets/icons/`. | `npm i -D @resvg/resvg-js` |

## Ajouter ou modifier un drapeau
1. Pose le SVG dans `assets/flags/<CODE>.svg`. Il doit avoir les proportions officielles, un `viewBox`, et aucun script ni `foreignObject`. Pour un drapeau existant qui change, garde le même code.
2. Mets à jour le ratio largeur/hauteur dans `assets/flags-meta.json`, ou relance `prep-flags.mjs` pour ce code.
3. Recalcule les sosies : `node scripts/tools/render-flags.js /tmp/png && python3 scripts/tools/similarity.py /tmp/png`.
4. Pour un nouveau code, ajoute l'entrée dans `src/data.js` (nom, alias, capitale, zone, notoriété, statut si territoire, info) et, si pertinent, dans un groupe de `GROUPS`.
5. Lance `npm test`, `npm run build` et `npm run test:e2e`.
