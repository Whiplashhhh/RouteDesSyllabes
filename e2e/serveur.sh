#!/usr/bin/env bash
# Lance le serveur de production avec une base neuve et un compte de test.
set -euo pipefail
PORT="${1:-3210}"
cd "$(dirname "$0")/.."
DOSSIER="$(mktemp -d)"
export DATABASE_PATH="$DOSSIER/e2e.sqlite"
[ -f server/dist/server/src/index.js ] && [ -f client/dist/index.html ] || npm run build
node server/dist/server/src/cli/create-user.js --email maitresse@ecole.fr --password "bonjour123"
node server/dist/server/src/cli/create-user.js --email autre@ecole.fr --password "bonjour456"
NODE_ENV=production \
  SESSION_SECRET="secret-de-test-e2e-suffisamment-long-pour-passer" \
  PORT="$PORT" HOST=127.0.0.1 STATIC_DIR=client/dist \
  exec node server/dist/server/src/index.js
