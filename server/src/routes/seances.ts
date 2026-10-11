import type { FastifyPluginAsync } from 'fastify';
import type { Seance } from '../../../shared/seance.js';
import { exigerUtilisateur, type OptionsRoutes } from '../contexte.js';
import { ErreurHttp, MESSAGES } from '../erreurs.js';
import { schemaSeanceEntree, valider } from '../validation.js';

interface ParametresSeance {
  Params: { id: string };
}

function trouvee(seance: Seance | null): Seance {
  // Une séance d'un autre compte est indiscernable d'une séance inexistante.
  if (!seance) throw new ErreurHttp(404, MESSAGES.seanceIntrouvable);
  return seance;
}

export const routesSeances: FastifyPluginAsync<OptionsRoutes> = async (app, { contexte }) => {
  const { seances } = contexte;

  app.addHook('onRequest', async (request) => {
    exigerUtilisateur(request);
  });

  app.get('/', async (request) => seances.lister(exigerUtilisateur(request).id));

  app.post('/', async (request, reply) => {
    const { id } = exigerUtilisateur(request);
    const { nom, config } = valider(schemaSeanceEntree, request.body);
    return reply.code(201).send(seances.creer(id, nom, config));
  });

  app.get<ParametresSeance>('/:id', async (request) =>
    trouvee(seances.obtenir(exigerUtilisateur(request).id, request.params.id)),
  );

  app.put<ParametresSeance>('/:id', async (request) => {
    const { id } = exigerUtilisateur(request);
    const { nom, config } = valider(schemaSeanceEntree, request.body);
    return trouvee(seances.modifier(id, request.params.id, nom, config));
  });

  app.delete<ParametresSeance>('/:id', async (request, reply) => {
    if (!seances.supprimer(exigerUtilisateur(request).id, request.params.id)) {
      throw new ErreurHttp(404, MESSAGES.seanceIntrouvable);
    }
    return reply.code(204).send();
  });

  app.post<ParametresSeance>('/:id/restaurer', async (request) =>
    trouvee(seances.restaurer(exigerUtilisateur(request).id, request.params.id)),
  );

  app.post<ParametresSeance>('/:id/dupliquer', async (request, reply) => {
    const copie = trouvee(seances.dupliquer(exigerUtilisateur(request).id, request.params.id));
    return reply.code(201).send(copie);
  });
};
