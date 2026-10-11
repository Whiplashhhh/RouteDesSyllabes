import { setTimeout as patienter } from 'node:timers/promises';
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import type { Utilisateur } from '../../../shared/api.js';
import { effacerCookieSession, NOM_COOKIE_SESSION, poserCookieSession } from '../auth/cookie.js';
import { creerCompte, EmailDejaPris, trouverUtilisateurParEmail } from '../comptes.js';
import { exigerUtilisateur, type OptionsRoutes } from '../contexte.js';
import { ErreurHttp, MESSAGES } from '../erreurs.js';
import { schemaConnexion, schemaInscription, valider } from '../validation.js';

const MESSAGE_EMAIL_INVALIDE = 'Cet email ne semble pas valide.';
const MESSAGE_MOT_DE_PASSE_INVALIDE = 'Le mot de passe doit contenir entre 8 et 200 caractères.';

export const routesAuth: FastifyPluginAsync<OptionsRoutes> = async (app, { contexte }) => {
  const { config, db, hacheur, sessions, seances, limiteurEmail, limiteurIp } = contexte;

  function refuserSiTropDEssais(reply: FastifyReply, attenteMs: number): void {
    if (attenteMs <= 0) return;
    reply.header('Retry-After', String(Math.ceil(attenteMs / 1000)));
    throw new ErreurHttp(429, MESSAGES.tropDEssais);
  }

  function ouvrirSession(
    request: FastifyRequest,
    reply: FastifyReply,
    userId: string,
    persistante: boolean,
  ): void {
    // Une éventuelle ancienne session sur ce navigateur est fermée.
    const ancien = request.cookies[NOM_COOKIE_SESSION];
    if (ancien) sessions.supprimer(ancien);
    const { token } = sessions.creer(userId, persistante);
    poserCookieSession(reply, token, persistante, config.cookieSecure);
  }

  /** Délai artificiel sur échec, avec un peu d'aléa pour brouiller les mesures. */
  function delaiEchec(): Promise<void> {
    const base = contexte.delaiEchecConnexionMs;
    return base > 0 ? patienter(base + Math.random() * base) : Promise.resolve();
  }

  app.post('/login', async (request, reply): Promise<Utilisateur> => {
    const { email, motDePasse, resterConnectee } = valider(schemaConnexion, request.body);
    refuserSiTropDEssais(
      reply,
      Math.max(limiteurIp.attenteRestante(request.ip), limiteurEmail.attenteRestante(email)),
    );

    const utilisateur = trouverUtilisateurParEmail(db, email);
    const valide = utilisateur
      ? await hacheur.verifier(utilisateur.password_hash, motDePasse)
      : await hacheur.verifierFactice(motDePasse);

    if (!utilisateur || !valide) {
      limiteurIp.enregistrerEchec(request.ip);
      limiteurEmail.enregistrerEchec(email);
      await delaiEchec();
      throw new ErreurHttp(401, MESSAGES.identifiantsIncorrects);
    }

    limiteurEmail.reinitialiser(email);
    ouvrirSession(request, reply, utilisateur.id, resterConnectee);
    return { id: utilisateur.id, email: utilisateur.email };
  });

  app.post('/signup', async (request, reply): Promise<Utilisateur> => {
    if (!config.allowSignup) throw new ErreurHttp(403, MESSAGES.inscriptionFermee);
    refuserSiTropDEssais(reply, limiteurIp.attenteRestante(request.ip));

    const resultat = schemaInscription.safeParse(request.body);
    if (!resultat.success) {
      const champs = resultat.error.issues.map((i) => i.path.join('.'));
      const message = champs.includes('email')
        ? MESSAGE_EMAIL_INVALIDE
        : champs.includes('motDePasse')
          ? MESSAGE_MOT_DE_PASSE_INVALIDE
          : MESSAGES.validation;
      throw new ErreurHttp(400, message, [...new Set(champs)]);
    }

    try {
      const utilisateur = await creerCompte(
        db,
        hacheur,
        resultat.data.email,
        resultat.data.motDePasse,
        seances,
      );
      ouvrirSession(request, reply, utilisateur.id, true);
      return utilisateur;
    } catch (erreur) {
      if (!(erreur instanceof EmailDejaPris)) throw erreur;
      // Compte comme un échec : limite l'énumération d'emails via l'inscription.
      limiteurIp.enregistrerEchec(request.ip);
      await delaiEchec();
      throw new ErreurHttp(400, MESSAGES.inscriptionImpossible);
    }
  });

  app.post('/logout', async (request, reply) => {
    const token = request.cookies[NOM_COOKIE_SESSION];
    if (token) sessions.supprimer(token);
    effacerCookieSession(reply, config.cookieSecure);
    return reply.code(204).send();
  });

  app.get('/me', async (request): Promise<Utilisateur> => exigerUtilisateur(request));
};
