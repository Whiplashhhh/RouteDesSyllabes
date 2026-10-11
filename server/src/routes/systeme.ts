import type { FastifyPluginAsync } from 'fastify';
import type { ConfigPublique } from '../../../shared/api.js';
import type { OptionsRoutes } from '../contexte.js';

export const routesSysteme: FastifyPluginAsync<OptionsRoutes> = async (app, { contexte }) => {
  const verifierBase = contexte.db.prepare('SELECT 1');

  app.get('/health', async () => {
    verifierBase.get();
    return { ok: true };
  });

  app.get(
    '/config',
    async (): Promise<ConfigPublique> => ({
      inscriptionOuverte: contexte.config.allowSignup,
    }),
  );
};
