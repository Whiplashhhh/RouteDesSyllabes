import type { FastifyInstance, FastifyRequest } from 'fastify';
import { estCheminApi } from './contexte.js';
import { ErreurHttp, MESSAGES } from './erreurs.js';

// Pas de upgrade-insecure-requests ni de HSTS : le premier déploiement est en HTTP.
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "media-src 'self' data: blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "manifest-src 'self'",
  "worker-src 'self'",
].join('; ');

export const ENTETES_SECURITE: Readonly<Record<string, string>> = {
  'Content-Security-Policy': CONTENT_SECURITY_POLICY,
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
};

const METHODES_MODIFIANTES = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Normalise un « hôte[:port] » (casse, port par défaut) pour comparaison. */
function hoteNormalise(protocole: string, hote: string): string | null {
  try {
    return new URL(`${protocole}://${hote}`).host;
  } catch {
    return null;
  }
}

/**
 * Protection CSRF : l'en-tête Origin doit désigner le même hôte que la requête.
 * Sans Origin, on n'accepte que `Sec-Fetch-Site: same-origin`.
 */
export function origineAutorisee(request: FastifyRequest): boolean {
  const origine = request.headers.origin;
  if (origine === undefined) return request.headers['sec-fetch-site'] === 'same-origin';
  let url: URL;
  try {
    url = new URL(origine);
  } catch {
    return false; // couvre notamment « Origin: null »
  }
  const protocole = url.protocol.replace(/:$/, '');
  const hoteRequete = hoteNormalise(protocole, request.host);
  return hoteRequete !== null && url.host === hoteRequete;
}

export function enregistrerSecurite(app: FastifyInstance): void {
  app.addHook('onRequest', async (request) => {
    if (!METHODES_MODIFIANTES.has(request.method) || !estCheminApi(request.url)) return;
    if (!origineAutorisee(request)) throw new ErreurHttp(403, MESSAGES.requeteRefusee);
  });

  app.addHook('onSend', async (request, reply, payload) => {
    reply.headers(ENTETES_SECURITE);
    if (estCheminApi(request.url)) reply.header('Cache-Control', 'no-store');
    return payload;
  });
}
