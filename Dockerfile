# syntax=docker/dockerfile:1
# Image unique : le serveur Fastify sert l'API (/api) et le client buildé.

# --- 1. Dépendances complètes (pour construire) -------------------------------
FROM node:22-bookworm-slim AS dependances
WORKDIR /app
# Outils de compilation, au cas où un module natif n'aurait pas de binaire précompilé.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY client/package.json client/
COPY server/package.json server/
RUN npm ci --no-audit --no-fund

# --- 2. Construction du client et du serveur ----------------------------------
FROM dependances AS construction
COPY tsconfig.base.json ./
COPY shared shared
COPY client client
COPY server server
RUN npm run build

# --- 3. Dépendances de production du serveur uniquement -----------------------
FROM dependances AS production
RUN npm ci --omit=dev --workspace server --include-workspace-root=false --no-audit --no-fund

# --- 4. Image finale, légère, utilisateur non root ----------------------------
FROM node:22-bookworm-slim
ENV NODE_ENV=production \
  PORT=8080 \
  HOST=0.0.0.0 \
  DATABASE_PATH=/data/route-des-syllabes.sqlite \
  STATIC_DIR=/app/client/dist
WORKDIR /app
COPY --chown=node:node package.json ./
COPY --chown=node:node client/package.json client/
COPY --chown=node:node server/package.json server/
COPY --from=production --chown=node:node /app/node_modules node_modules
COPY --from=construction --chown=node:node /app/server/dist server/dist
COPY --from=construction --chown=node:node /app/client/dist client/dist
RUN mkdir -p /data && chown node:node /data
USER node
VOLUME ["/data"]
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server/dist/server/src/index.js"]
