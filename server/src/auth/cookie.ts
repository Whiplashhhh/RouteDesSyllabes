import type { FastifyReply } from 'fastify';
import { DUREE_SESSION_PERSISTANTE_MS } from './sessions.js';

export const NOM_COOKIE_SESSION = 'rds_session';

/**
 * Pose le cookie de session. Sans « rester connectée », cookie de session
 * navigateur (pas de Max-Age) : il disparaît à la fermeture du navigateur.
 */
export function poserCookieSession(
  reply: FastifyReply,
  token: string,
  persistante: boolean,
  secure: boolean,
): void {
  reply.setCookie(NOM_COOKIE_SESSION, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure,
    ...(persistante ? { maxAge: DUREE_SESSION_PERSISTANTE_MS / 1000 } : {}),
  });
}

export function effacerCookieSession(reply: FastifyReply, secure: boolean): void {
  reply.clearCookie(NOM_COOKIE_SESSION, { httpOnly: true, sameSite: 'lax', path: '/', secure });
}
