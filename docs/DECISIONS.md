# Décisions, méthode et historique

## Objectif
Apprendre à reconnaître les drapeaux de tous les pays et des principaux territoires, sur téléphone et PC, avec la méthode la plus efficace possible, et garder sa progression.

## Méthode : ce que dit la recherche et où on l'applique
| Principe | Dans l'app | Références |
|---|---|---|
| Rappel actif (effet de test) | On répond toujours avant de voir la solution. | Roediger & Karpicke 2006 ; Rowland 2014 ; Dunlosky et al. 2013 |
| Répétition espacée | FSRS-6 estime la probabilité de rappel de chaque carte et la reprogramme quand elle passe sous la rétention visée (90 % par défaut). | Cepeda et al. 2006, 2008 ; Latimier, Peyre & Ramus 2021 ; Ye, Su & Cao 2022 (FSRS) |
| Entrelacement et discrimination des sosies | Les pièges sont des drapeaux visuellement proches (CIELAB) et tes propres confusions. Un mode « Duel des sosies » complète. | Kornell & Bjork 2008 ; Kang & Pashler 2012 ; Brunmair & Richter 2019 |
| Correction immédiate et contrastée | Ton choix et la bonne réponse s'affichent côte à côte, avec une astuce de différenciation. | Pashler et al. 2005 ; Butler & Roediger 2008 ; Butterfield & Metcalfe 2001 |
| Difficulté désirable (produire plutôt que reconnaître) | En mode adaptatif, on passe du QCM à la saisie du nom quand la carte est acquise. | Bjork 1994 ; Pyc & Rawson 2009 |
| Note objective (pas d'auto-évaluation) | La note vient de la justesse et du temps de réponse. | Dunlosky & Rawson 2012 ; Kornell & Bjork 2008 |
| Petits lots, apprentissage jusqu'au critère | 8 nouveaux par jour, chacun revu dans la séance jusqu'à la bonne réponse. | Rawson & Dunlosky 2011 ; Kornell 2009 |
| Sommeil et régularité | Séances courtes, série quotidienne, changement de jour à 4 h. | Diekelmann & Born 2010 ; Mazza et al. 2016 |
| Élaboration (donner du sens) | Chaque correction rappelle la capitale et le sens des symboles. | Paivio 1986 ; Dunlosky et al. 2013 |

Une simulation sur 90 jours avec 8 nouveaux drapeaux par jour donne ceci : tout est vu en environ un mois ; la charge est d'environ 20 à 25 minutes par jour au pic (3e et 4e semaines), puis moins de 10 minutes.

## Choix produit
- **Deux sens** : drapeau → nom (QCM puis saisie) et nom → drapeau (choix parmi 4 ou 6 drapeaux). Le second se débloque une fois le drapeau acquis.
- **Saisie tolérante** : accents, articles et tirets sont ignorés ; les alias sont acceptés ; une faute de frappe passe (une sur 5 à 8 lettres, deux au-delà), sauf si la saisie ressemble davantage à un autre pays (Niger/Nigeria, Mali/Malawi…).
- **Stats** : drapeaux vus, niveaux de maîtrise (stabilité ≥ 21 j = maîtrisé), rétention estimée, série, calendrier d'activité, révisions à venir, progression par zone, confusions fréquentes, cartes les plus coriaces.
- **Pas de synchro automatique** dans la version web : elle demanderait un serveur. Le transfert se fait par fichier ou par texte, avec fusion.

## Choix sur les données (vérifiés en octobre 2026)
- **Périmètre** : 194 pays (193 membres de l'ONU + Vatican), Kosovo, Palestine et Taïwan (« reconnaissance limitée »), et 34 territoires choisis pour leur notoriété : Groenland, Hong Kong, Porto Rico, nations du Royaume-Uni, territoires britanniques, néerlandais, américains et français à drapeau propre. Le Sahara occidental n'est pas inclus.
- **Afghanistan** : tricolore de l'ancienne République, encore utilisé aux JO de Paris 2024. La fiche mentionne le drapeau blanc des talibans.
- **Syrie** : drapeau vert-blanc-noir à trois étoiles rouges, officiel depuis 2025.
- **Kirghizistan** : version de décembre 2023, aux rayons droits.
- **Guinée équatoriale** : capitale Ciudad de la Paz depuis janvier 2026.
- **Indonésie** : capitale Jakarta, car le transfert vers Nusantara n'est pas effectif.
- **Capitales contestées ou multiples**, formulées de façon neutre : Israël « Jérusalem (statut contesté) », Palestine « Ramallah (siège), Jérusalem-Est revendiquée », Bolivie « Sucre (La Paz : siège du gouvernement) », Afrique du Sud (trois capitales).
- **Proportions** : chaque drapeau garde ses proportions officielles (Suisse et Vatican carrés, Népal non rectangulaire, Qatar 11:28…).

## Historique
- **25 octobre 2026, première version** : artefact sur claude.ai, avec la progression synchronisée via le compte Claude.
- **25 octobre 2026, version web autonome (PWA)** : installable, hors ligne, transfert entre appareils. Livrée en zip pour Netlify Drop, puis en dossier projet pour Claude Code, avec tests et déploiement GitHub Pages.

- **1er novembre 2026, Défi chrono** : mode jeu à 4 niveaux (Découverte, Voyageur, Explorateur, Vexillologue), dans les deux sens, avec chrono, score, séries et records. Séparé de la répétition espacée pour ne pas fausser le planning. Publication sur GitHub Pages, dépôt `ghitard/drapeaux-du-monde`.

## À faire plus tard (seulement sur demande)
- **Synchro automatique téléphone ↔ PC.** Il faut un service en ligne. Deux pistes :
  - Firebase (Firestore et connexion Google), gratuit, environ 10 minutes de configuration côté Ghita ;
  - Netlify Functions et Blobs avec un « code de synchro », qui demande un déploiement Git ou CLI.
- **Mode capitales** (pays → capitale), qui réutiliserait le moteur avec un nouveau type de carte, par exemple `<code>_c`.
- **Mode carte du monde** : situer le pays.
- **Rappels quotidiens** (notifications web) : délicat sur iPhone.
