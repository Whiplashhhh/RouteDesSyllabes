import { creerCompte, EmailDejaPris } from '../comptes.js';
import { ErreurCli, executer, lireIdentifiants } from './commun.js';

const USAGE = 'npm run create-user -- --email maitresse@ecole.fr --password "mot de passe"';

await executer(async (db, hacheur) => {
  const { email, motDePasse } = lireIdentifiants(USAGE);
  try {
    await creerCompte(db, hacheur, email, motDePasse);
  } catch (erreur) {
    if (erreur instanceof EmailDejaPris) {
      throw new ErreurCli(`Un compte existe déjà pour ${email}.`);
    }
    throw erreur;
  }
  return `Compte créé pour ${email}, avec les séances d'exemple.`;
});
