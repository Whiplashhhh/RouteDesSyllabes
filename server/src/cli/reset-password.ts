import { changerMotDePasse, trouverUtilisateurParEmail } from '../comptes.js';
import { ErreurCli, executer, lireIdentifiants } from './commun.js';

const USAGE =
  'npm run reset-password -- --email maitresse@ecole.fr --password "nouveau mot de passe"';

await executer(async (db, hacheur) => {
  const { email, motDePasse } = lireIdentifiants(USAGE);
  const utilisateur = trouverUtilisateurParEmail(db, email);
  if (!utilisateur) throw new ErreurCli(`Aucun compte trouvé pour ${email}.`);
  const { sessionsFermees } = await changerMotDePasse(db, hacheur, utilisateur.id, motDePasse);
  return `Mot de passe changé pour ${email} (${sessionsFermees} session(s) fermée(s)).`;
});
