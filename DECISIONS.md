# Décisions prises

Choix faits en autonomie quand la demande ne précisait pas. Chacun peut être revu facilement.

## Pédagogie et jeu

- **Taille des lettres** : la demande parle de « 8 à 12 % de la hauteur d'une route », mais aussi de
  lettres « énormes, lisibles du fond de la classe ». J'ai privilégié la lisibilité : la police vaut
  la moitié de la hauteur du véhicule, soit environ 10 % de la hauteur de l'écran avec 3 routes
  (≈ 108 px en 1080p), 7,5 % avec 4 routes et 11 % avec 1 route. Le réglage tient en une ligne
  (`client/src/game/geometrie.ts`).
- **Traînée du son** : les consonnes « fantômes » sont déposées sur la route derrière le véhicule,
  tous les ~0,8 lettre parcourue, et s'effacent en moins d'une seconde. Placées juste derrière
  l'étiquette, elles auraient été cachées par la carrosserie.
- **Fusion** : aimantation à ~0,2 lettre de distance ; la voyelle reste collée sur ~1 lettre de
  poussée puis se détache et revient à sa place avec un léger rebond. Une voyelle dépassée, cachée
  par le véhicule, s'efface et réapparaît quand on recule. Elle ne se recolle qu'après être repassée
  à gauche de la consonne : le retour vers la gauche ne déclenche rien.
- Pendant la fusion, les deux lettres se rapprochent légèrement pour se lire d'un seul souffle.
- **Consonne qui glisse** : marquée dans l'éditeur par une petite vague. Comme rien ne dépend du
  survol, la légende est aussi écrite en clair au-dessus du clavier de pastilles.
- **Voix** : la syllabe est toujours envoyée en minuscules (certaines voix épellent les majuscules).
  La meilleure voix `fr-FR` est choisie par score (voix « naturelles », Google, Amélie, Thomas…).
  Sans voix française, l'éditeur prévient au moment du test.
- **Sons complexes** : `ch`, `gn`, `ph`, `qu` sont rangés côté consonnes ; `ou`, `on`, `an`, `en`,
  `in`, `oi`, `au`, `eau`, `ai`, `ei`, `eu`, `un` côté voyelles. `é`, `è`, `ê` sont dans les voyelles.
  Un champ libre permet d'ajouter un graphème de 1 à 4 lettres.
- **Raccourcis clavier** : → (nouvelles lettres), Échap (panneau), Début (remettre au départ).
- La démonstration sans compte (`/demo`) accepte des paramètres d'URL facultatifs (`routes`, `fond`,
  `route`, `vehicule`, `couleur`, `lettres`, `majuscules`…), pratiques pour une présentation.

## Interface

- **Vouvoiement** chaleureux et neutre dans tout l'espace maîtresse, cohérent avec les messages du
  serveur.
- **Enregistrement automatique** dans l'éditeur (0,9 s après la dernière modification), avec un
  statut toujours visible (« Enregistré ✓ ») et un gros bouton « Enregistrer et revenir aux
  séances ». Une nouvelle séance n'est créée en base qu'au premier enregistrement.
- Le **nom** de la séance est un grand titre modifiable en haut de l'éditeur, au lieu d'un onglet à
  part. Les quatre autres sections sont des onglets numérotés, pour montrer peu de choses à la fois.
- **Suppression** : confirmation douce sur la carte (« Supprimer / Garder »), puis bulle « Annuler »
  pendant 7 secondes. Côté serveur, la suppression est douce et purgée définitivement après 7 jours.
- **Échelle** : la taille de base du texte suit la largeur d'écran
  (`clamp(15px, 0.42vw + 9.5px, 26px)`), et le jeu calcule toutes ses tailles à partir de la scène.
- **Bouton maîtresse** en haut à droite, semi-transparent, appui long de 1,5 s avec un anneau jaune.
  Il est aussi accessible au clavier (Entrée), pour la maîtresse qui a un clavier.
- Une page `/vitrine` (non liée dans l'interface) montre tous les véhicules, couleurs, routes et
  fonds, pour la revue visuelle.

## Technique

- **Pas de Framer Motion** : CSS et Web Animations API suffisent et allègent le bundle. Le glisser
  est piloté directement par `transform: translate3d`, sans rendu React pendant le mouvement.
- **SQL direct** avec better-sqlite3 et des migrations versionnées (table `schema_migrations`),
  plutôt qu'un ORM.
- **Sessions** : jeton aléatoire de 32 octets ; seul son HMAC-SHA256 (clé `SESSION_SECRET`) est en
  base. Durée de 30 jours glissante, renouvelée au plus une fois par heure. « Rester connectée »
  décoché : cookie de session du navigateur et 12 h glissantes côté serveur.
- **Limitation des tentatives** en mémoire (un seul conteneur) : par email, à partir de 5 échecs,
  attente de 30 s qui double à chaque échec (plafond 15 min) ; par IP, à partir de 20 échecs.
  Petit délai aléatoire sur chaque échec. Un redémarrage remet les compteurs à zéro, ce qui est
  acceptable ici.
- **Origine** : toute requête `POST/PUT/PATCH/DELETE` sous `/api` doit porter un en-tête `Origin` du
  même hôte (ou `Sec-Fetch-Site: same-origin`). En développement, le proxy Vite réécrit l'en-tête.
- **CSP** : `script-src 'self'` strict ; `style-src` autorise `'unsafe-inline'`, car le jeu place ses
  éléments par des styles en ligne (positions calculées). Pas de `upgrade-insecure-requests` ni de
  HSTS, pour que le premier déploiement en HTTP fonctionne.
- Une séance d'un autre compte renvoie **404** (et non 403), pour ne pas révéler son existence.
- **Image Docker** basée sur `node:22-bookworm-slim` plutôt qu'Alpine : better-sqlite3 et argon2
  utilisent leurs binaires précompilés glibc, sans compilation fragile. L'utilisateur est `node`
  (non root) et seules les dépendances de production du serveur sont copiées.
- **Monorepo** : workspaces npm `client` et `server`, plus un dossier `shared/` sans dépendance,
  importé par les deux (types, catalogues, tirage).

## Méthode de travail

- Une branche par phase et une pull request par branche, avec des Conventional Commits.
  Les premières PR ont été **empilées** (le jeu sur le serveur), car la CI vérifie client et serveur
  ensemble. J'ai fusionné moi-même chaque PR après le passage au vert de la CI, puisque personne
  n'était disponible pour relire.
- Docker n'est pas disponible dans l'environnement de développement utilisé : l'image est construite
  et démarrée **dans la CI GitHub Actions** (healthcheck, création de compte, connexion, liste des
  séances, utilisateur non root).
- Les captures et tests Playwright locaux utilisent un Chromium fourni par un paquet npm (le
  téléchargement habituel de Playwright était bloqué). La CI utilise le Chromium officiel de
  Playwright.
