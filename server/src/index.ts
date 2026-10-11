import { buildApp } from './app.js';
import { chargerConfig } from './config.js';
import { ouvrirBase } from './db/connexion.js';

const DELAI_ARRET_MAX_MS = 10_000;

async function demarrer(): Promise<void> {
  const { config, avertissements } = chargerConfig();
  const db = ouvrirBase(config.databasePath);
  const app = await buildApp({ config, db, journaux: true });
  for (const avertissement of avertissements) app.log.warn(avertissement);

  let arretEnCours = false;
  const arreter = async (signal: NodeJS.Signals) => {
    if (arretEnCours) return;
    arretEnCours = true;
    app.log.info(`Signal ${signal} reçu : arrêt du serveur…`);
    const forcer = setTimeout(() => {
      app.log.error('Arrêt trop long : sortie forcée.');
      process.exit(1);
    }, DELAI_ARRET_MAX_MS);
    forcer.unref();
    try {
      await app.close();
      db.close();
      process.exit(0);
    } catch (erreur) {
      app.log.error({ err: erreur }, "Erreur pendant l'arrêt");
      process.exit(1);
    }
  };
  process.once('SIGTERM', (signal) => void arreter(signal));
  process.once('SIGINT', (signal) => void arreter(signal));

  try {
    await app.listen({ port: config.port, host: config.host });
    app.log.info(`Base de données : ${config.databasePath}`);
    if (config.staticDir) app.log.info(`Client servi depuis ${config.staticDir}`);
  } catch (erreur) {
    app.log.error({ err: erreur }, 'Impossible de démarrer le serveur');
    db.close();
    process.exit(1);
  }
}

demarrer().catch((erreur: unknown) => {
  console.error(erreur instanceof Error ? erreur.message : erreur);
  process.exit(1);
});
