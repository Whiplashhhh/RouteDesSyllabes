import { Link } from 'react-router-dom';
import { useSession } from '../lib/session';
import { IconeDeconnexion } from './Icones';
import { Logo } from './Logo';

/** En-tête de l'espace maîtresse : logo, nom de l'application, déconnexion discrète. */
export function Entete() {
  const { utilisateur, deconnecter } = useSession();
  return (
    <header className="entete">
      <Link to="/" className="entete-marque" aria-label="Accueil, mes séances">
        <Logo taille={46} />
        <span className="entete-nom">
          La Route <span>des Syllabes</span>
        </span>
      </Link>
      {utilisateur && (
        <div className="entete-compte">
          <span className="entete-email" title={utilisateur.email}>
            {utilisateur.email}
          </span>
          <button type="button" className="bouton-discret" onClick={() => void deconnecter()}>
            <IconeDeconnexion taille={20} />
            <span>Se déconnecter</span>
          </button>
        </div>
      )}
    </header>
  );
}
