import { relative, sep } from 'node:path';
import fastifyCookie from '@fastify/cookie';
import fastifyStatic from '@fastify/static';
import Fastify, { type FastifyError, type FastifyInstance } from 'fastify';
import { effacerCookieSession, NOM_COOKIE_SESSION, poserCookieSession } from './auth/cookie.js';
import { LimiteurTentatives } from './auth/limiteur.js';
import { creerHacheur } from './auth/motDePasse.js';
import { DepotSessions } from './auth/sessions.js';
import type { Config } from './config.js';
import { estCheminApi, type Contexte } from './contexte.js';
import type { BaseDeDonnees } from './db/connexion.js';
import { ErreurHttp, MESSAGES } from './erreurs.js';
import { routesAuth } from './routes/auth.js';
import { routesSeances } from './routes/seances.js';
import { routesSysteme } from './routes/systeme.js';
import { DepotSeances } from './seances/depot.js';
import { enregistrerSecurite } from './securite.js';

const MINUTE = 60 * 1000;
const TAILLE_MAX_CORPS = 64 * 1024;
const INTERVALLE_NETTOYAGE_MS = 60 * MINUTE;
const CACHE_IMMUABLE = 'public, max-age=31536000, immutable';

export interface OptionsApp {
  config: Config;
  db: BaseDeDonnees;
  /** Active les journaux (désactivés par défaut, pour les tests). */
  journaux?: boolean;
  /** Délai de base ajouté à chaque échec de connexion (400 ms par défaut). */
  delaiEchecConnexionMs?: number;
  /** Horloge injectable (tests). */
  maintenant?: () => number;
}

function creerLimiteur(seuil: number, maintenant: () => number): LimiteurTentatives {
  return new LimiteurTentatives({
    seuil,
    fenetreMs: 15 * MINUTE,
    delaiInitialMs: 30 * 1000,
    delaiMaxMs: 15 * MINUTE,
    maintenant,
  });
}

export async function buildApp(options: OptionsApp): Promise<FastifyInstance> {
  const { config, db } = options;
  const maintenant = options.maintenant ?? Date.now;

  const contexte: Contexte = {
    config,
    db,
    hacheur: creerHacheur(config.argon2),
    sessions: new DepotSessions(db, config.sessionSecret, maintenant),
    seances: new DepotSeances(db, () => new Date(maintenant())),
    limiteurEmail: creerLimiteur(5, maintenant),
    limiteurIp: creerLimiteur(20, maintenant),
    delaiEchecConnexionMs: options.delaiEchecConnexionMs ?? 400,
  };

  const app = Fastify({
    logger: options.journaux
      ? {
          level: 'info',
          redact: {
            paths: [
              'req.headers.cookie',
              'req.headers.authorization',
              'res.headers["set-cookie"]',
              '*.motDePasse',
              '*.password',
            ],
            censor: '[masqué]',
          },
        }
      : false,
    trustProxy: config.trustProxy,
    bodyLimit: TAILLE_MAX_CORPS,
  });

  // Corps JSON vide accepté (ex. POST /restaurer envoyé avec Content-Type JSON).
  const parseurJson = app.getDefaultJsonParser('error', 'error');
  app.removeContentTypeParser('application/json');
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (request, corps, fin) => {
    if (corps.length === 0) fin(null, undefined);
    else parseurJson(request, corps.toString(), fin);
  });

  app.setErrorHandler((erreur: FastifyError | ErreurHttp, request, reply) => {
    if (erreur instanceof ErreurHttp) {
      const { statusCode, messagePublic, details } = erreur;
      return reply.code(statusCode).send({ erreur: messagePublic, ...(details && { details }) });
    }
    const statut = erreur.statusCode ?? 500;
    if (statut === 413) return reply.code(413).send({ erreur: MESSAGES.corpsTropGros });
    if (statut >= 400 && statut < 500) {
      return reply.code(statut).send({ erreur: MESSAGES.validation });
    }
    request.log.error({ err: erreur }, 'Erreur non gérée');
    return reply.code(500).send({ erreur: MESSAGES.interne });
  });

  enregistrerSecurite(app);
  await app.register(fastifyCookie);

  app.decorateRequest('session', null);
  app.addHook('onRequest', async (request, reply) => {
    if (!estCheminApi(request.url)) return;
    const token = request.cookies[NOM_COOKIE_SESSION];
    if (!token) return;
    const session = contexte.sessions.valider(token);
    if (!session) {
      effacerCookieSession(reply, config.cookieSecure);
      return;
    }
    request.session = session;
    // Expiration glissante : on réémet le cookie persistant quand la base a été prolongée.
    if (session.renouvelee && session.persistante) {
      poserCookieSession(reply, token, true, config.cookieSecure);
    }
  });

  await app.register(routesSysteme, { prefix: '/api', contexte });
  await app.register(routesAuth, { prefix: '/api/auth', contexte });
  await app.register(routesSeances, { prefix: '/api/seances', contexte });

  const { staticDir } = config;
  if (staticDir) {
    await app.register(fastifyStatic, {
      root: staticDir,
      cacheControl: false,
      setHeaders(res, chemin) {
        const estAsset = relative(staticDir, chemin).startsWith(`assets${sep}`);
        res.header('Cache-Control', estAsset ? CACHE_IMMUABLE : 'no-cache');
      },
    });
  }

  app.setNotFoundHandler((request, reply) => {
    const chemin = request.url.split('?')[0] ?? '/';
    const fallbackSpa =
      staticDir !== null &&
      (request.method === 'GET' || request.method === 'HEAD') &&
      !estCheminApi(chemin) &&
      !chemin.startsWith('/assets/');
    if (fallbackSpa) return reply.sendFile('index.html');
    return reply.code(404).send({ erreur: MESSAGES.introuvable });
  });

  // Ménage au démarrage puis toutes les heures.
  const nettoyer = () => {
    contexte.sessions.purgerExpirees();
    contexte.seances.purgerSupprimees();
    contexte.limiteurEmail.nettoyer();
    contexte.limiteurIp.nettoyer();
  };
  nettoyer();
  const minuteur = setInterval(() => {
    try {
      nettoyer();
    } catch (erreur) {
      app.log.error({ err: erreur }, 'Échec du nettoyage périodique');
    }
  }, INTERVALLE_NETTOYAGE_MS);
  minuteur.unref();
  app.addHook('onClose', async () => clearInterval(minuteur));

  return app;
}
