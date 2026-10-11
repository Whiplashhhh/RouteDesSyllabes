# Rapport de mission — La Route des Syllabes

## En bref

L'application est **complète et fonctionnelle** : le mode élève (le jeu), l'espace maîtresse
(connexion, séances, éditeur avec aperçu en direct), le serveur sécurisé, l'image Docker, la
documentation et les tests. Les phases 1 à 8 sont livrées, bonus compris (PWA, « Jouer sans compte »).

Tout a été intégré à `main` par des pull requests passées au vert en CI (GitHub Actions) :
format, lint, types, tests unitaires et d'API, build, tests de bout en bout Playwright,
**construction et démarrage de l'image Docker** avec test de fumée.

## Lancer la démo et créer le compte de la maîtresse

Sur le VPS (ou en local), depuis le dossier du projet :

```bash
cp .env.example .env
sed -i "s|^SESSION_SECRET=.*|SESSION_SECRET=$(openssl rand -base64 48 | tr -d '\n/+=')|" .env
# Facultatif : changer APP_PORT dans .env si le port 8080 est déjà pris
docker compose up -d --build
docker compose ps                     # attendre l'état « healthy »
docker compose exec app npm run create-user -- --email maitresse@ecole.fr --password "choisir-un-mot-de-passe"
```

Puis ouvrir `http://IP_DU_VPS:8080` (ou `http://localhost:8080`).
Sans compte, le bouton **« Jouer sans compte »** de la page de connexion lance directement le jeu.

Autres commandes utiles : `docker compose exec app npm run reset-password -- --email … --password …`,
et la sauvegarde de la base (voir le README, section 4).

## Ce qui est fait

### Mode élève (le cœur)

- 1 à 4 routes empilées ; consonne portée à l'avant du véhicule, 1 à 3 voyelles par route
  (2 par défaut), toujours de gauche à droite.
- Lettres énormes en **Andika** (« a » à un étage), noir sur blanc, environ 10 % de la hauteur
  d'écran avec 3 routes.
- **Glisser au doigt** (Pointer Events + `setPointerCapture`) : un doigt par route,
  **multi-touch indépendant**, axe vertical verrouillé, zone de prise généreuse, 60 i/s en
  `translate3d` sans rendu React pendant le mouvement.
- `touch-action: none`, pas de zoom, pas de sélection, pas de menu contextuel, pas de rebond.
- **Fusion** : aimantation, étiquette soudée « la », décrochage si l'on continue, voyelle qui
  reprend sa place ; le retour vers la gauche ne déclenche rien. Au relâchement, le véhicule reste
  où il est (retour automatique au départ en option). Bord élastique : le véhicule ne sort jamais.
- **8 véhicules SVG** dessinés à la main (voiture, bus scolaire, pompiers, tracteur, petit train,
  scooter avec son pilote, police, taxi), 10 couleurs, yeux expressifs optionnels.
- **Micro-animations** : roues qui tournent selon la distance, rebond de suspension, inclinaison
  selon l'accélération, fumée quand on tire vite, veille (respiration, phares, clignement d'yeux).
- **4 routes** (goudron, terre, rails, arc-en-ciel) et **5 fonds** (ciel, campagne, coucher de
  soleil, nuit étoilée, couleur unie), nuages très lents et désactivables.
- **Retours optionnels** : traînée du son, fusion animée, petite fête, bruitages Web Audio, voix
  `fr-FR` (jamais une consonne seule), fumée, retour au départ, animations réduites, et
  `prefers-reduced-motion`.
- **Commandes maîtresse** : bouton discret à appui long de 1,5 s avec anneau de progression, puis
  « Nouvelles lettres » (les véhicules partent et reviennent), « Remettre au départ », « Séance
  suivante », « Choisir une séance », « Quitter ». Clavier : → et Échap.
- Tirage : consonnes distinctes entre routes si possible, voyelles distinctes, ordre fixe en option,
  graphèmes à plusieurs lettres (`ch`, `ou`, `eau`…).

### Espace maîtresse

- Connexion avec une petite scène animée (une voiture forme des syllabes en boucle), « Rester
  connectée » coché par défaut.
- « Mes séances » : grandes cartes avec un **aperçu réel** du jeu, gros bouton **▶ Jouer** (plein
  écran), modifier, dupliquer, supprimer (confirmation douce puis « Annuler » pendant 7 s).
- **Éditeur-atelier** : nom, puis onglets Lettres (clavier de pastilles, consonnes « qui glissent »
  marquées d'une vague, sons complexes, champ libre), Décor (vignettes de fonds, routes, véhicules
  et nuanciers), Règles (routes, voyelles, minuscules/majuscules, hasard/ordre fixe), Retours
  (interrupteurs, avec « Tester » pour les sons et la voix). **Aperçu en direct jouable** et
  enregistrement automatique avec statut visible.
- 4 séances d'exemple créées pour chaque compte, selon la progression demandée.
- Messages d'erreur humains, squelettes de chargement, cibles tactiles d'au moins 64 px.

### Serveur et sécurité

- Fastify 5 + SQLite (better-sqlite3), migrations versionnées, SQL direct.
- Mots de passe **argon2id** ; sessions serveur (seul le HMAC du jeton est stocké) ; cookie
  `HttpOnly`, `SameSite=Lax`, `Secure` piloté par `COOKIE_SECURE` ; 30 jours glissants.
- Vérification de l'en-tête `Origin` ; limitation des tentatives par IP et par email avec délai
  progressif ; CSP stricte, `nosniff`, `Referrer-Policy`, `frame-ancestors 'none'` ; validation
  zod ; messages qui ne révèlent jamais l'existence d'un email ; isolation stricte des séances
  (404 pour la séance d'un autre).
- CLI `create-user` et `reset-password` ; inscription contrôlée par `ALLOW_SIGNUP`.
- Aucune donnée d'élève (voir le README).
- `npm audit --omit=dev` : 0 vulnérabilité après la mise à jour de la PR #7.

### Déploiement

- `Dockerfile` multi-étapes (`node:22-bookworm-slim`, 263 Mo), utilisateur non root, seules les
  dépendances de production du serveur.
- `docker-compose.yml` : `APP_PORT`, volume nommé, `restart: unless-stopped`, healthcheck sur
  `/api/health`.
- `.env.example` commenté, README complet (VPS pas à pas, sauvegarde, HTTPS avec Nginx et Caddy,
  avertissement HTTP, police cursive future, RGPD).
- **PWA** : manifest (`display: fullscreen`) et icônes pour « installer » l'application.

### Tests

- **14 tests unitaires client** : tirage (consonnes distinctes, ordre fixe, graphèmes multiples,
  listes vides…) et géométrie (proportions du portable au 4K, voyelles toujours dans l'écran).
- **97 tests serveur** : argon2, jetons, limiteur, validation, base, API (connexion, 429, cookies,
  origine, CRUD, suppression douce) et **droits d'accès** (un compte ne peut ni lire, ni modifier,
  ni supprimer, ni dupliquer, ni restaurer la séance d'un autre).
- **9 tests de bout en bout Playwright** sur le build de production, dont **deux doigts simultanés
  sur deux routes**, l'appui long, la création avec enregistrement automatique, la suppression
  annulée.

## Captures d'écran finales

Dans `docs/screenshots/`, pour chaque résolution (`1366x768/`, `1920x1080/`, `3840x2160/`) :

| Fichier                                                            | Écran                                              |
| ------------------------------------------------------------------ | -------------------------------------------------- |
| `01-connexion.png`                                                 | page de connexion animée                           |
| `02-accueil.png`                                                   | « Mes séances »                                    |
| `03-editeur-lettres.png`                                           | éditeur, onglet Lettres                            |
| `04-editeur-decor.png`                                             | éditeur, onglet Décor                              |
| `05-editeur-regles.png`                                            | éditeur, onglet Règles                             |
| `06-editeur-retours.png`                                           | éditeur, onglet Retours                            |
| `07-jeu-1-route.png`, `07-jeu-3-routes.png`, `07-jeu-4-routes.png` | jeu avec 1, 3 et 4 routes                          |
| `08-jeu-fusion.png`                                                | jeu pendant une fusion (deux doigts en même temps) |
| `09-panneau-maitresse.png`                                         | panneau de la maîtresse                            |

Pour les régénérer : `npm run build && npm run screenshots`.

## Décisions prises

Le détail est dans [`DECISIONS.md`](DECISIONS.md). Les principales :

- Lettres plus grandes que les « 8 à 12 % de la route » : environ 10 % de **l'écran**, pour la
  lisibilité au fond de la classe.
- Traînée du son déposée sur la route derrière le véhicule (juste derrière l'étiquette, elle
  aurait été cachée par la carrosserie).
- Vouvoiement chaleureux ; enregistrement automatique dans l'éditeur.
- Pas de Framer Motion (CSS + Web Animations API) ; SQL direct plutôt qu'un ORM.
- Image Debian slim plutôt qu'Alpine (binaires natifs précompilés fiables).
- Limiteur de tentatives en mémoire (un seul conteneur).
- `style-src 'unsafe-inline'` dans la CSP, car le jeu positionne ses éléments par styles en ligne ;
  `script-src` reste strict.
- Workflow : une branche et une PR par phase, en Conventional Commits. J'ai fusionné moi-même chaque
  PR une fois la CI au vert, faute de relecteur disponible.

## Ce qui reste à faire ou à améliorer

- **Essai sur le vrai écran Prowise** : latence tactile, plein écran sous Android, nombre réel de
  doigts simultanés pris en charge. Le multi-touch n'a été vérifié que par émulation.
- **Voix** : la qualité dépend des voix installées sur l'appareil. Sur Android, installer une voix
  française de bonne qualité dans les réglages de synthèse vocale.
- **Docker n'a pas pu être lancé dans l'environnement de développement** : l'image est construite
  et démarrée à chaque PR dans la CI GitHub (healthcheck, création de compte, connexion, séances,
  utilisateur non root), mais pas encore sur le VPS lui-même.
- Police cursive scolaire : architecture prête, fichier à fournir (README, section 8).
- Réinitialisation du mot de passe par email (aujourd'hui en ligne de commande seulement).
- Réordonner les séances par glisser-déposer ; dossiers de séances.
- La jointure des deux étiquettes soudées laisse parfois deviner un très fin liseré.
- Un audit d'accessibilité complet (lecteur d'écran) de l'espace maîtresse reste à faire.
- Les compteurs anti-force-brute sont remis à zéro au redémarrage du conteneur.
