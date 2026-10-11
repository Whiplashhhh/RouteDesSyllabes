import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { SceneAccueil } from '../components/SceneAccueil';
import { IconeJouer } from '../components/Icones';
import { api, ErreurApi } from '../lib/api';
import { demanderPleinEcran } from '../lib/pleinEcran';
import { useSession } from '../lib/session';

/** Page de connexion : une petite scène animée et le formulaire au centre. */
export function Connexion() {
  const { utilisateur, connecter, inscrire } = useSession();
  const lieu = useLocation();
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [resterConnectee, setResterConnectee] = useState(true);
  const [mode, setMode] = useState<'connexion' | 'inscription'>('connexion');
  const [inscriptionOuverte, setInscriptionOuverte] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    api
      .configPublique()
      .then((c) => setInscriptionOuverte(c.inscriptionOuverte))
      .catch(() => undefined);
  }, []);

  if (utilisateur) {
    const depuis = (lieu.state as { depuis?: string } | null)?.depuis;
    return <Navigate to={depuis && depuis !== '/connexion' ? depuis : '/'} replace />;
  }

  const envoyer = async (e: FormEvent) => {
    e.preventDefault();
    setErreur(null);
    if (mode === 'inscription' && motDePasse.length < 8) {
      setErreur('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    setEnvoi(true);
    try {
      if (mode === 'connexion') await connecter({ email, motDePasse, resterConnectee });
      else await inscrire({ email, motDePasse });
    } catch (err) {
      setErreur(
        err instanceof ErreurApi ? err.message : 'Oups, quelque chose a coincé. On réessaie ?',
      );
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <main className="page-connexion">
      <SceneAccueil />
      <div className="connexion-centre">
        <form className="carte-connexion" onSubmit={envoyer} noValidate>
          <div className="carte-connexion-marque">
            <Logo taille={64} />
            <h1>
              La Route
              <br />
              <span>des Syllabes</span>
            </h1>
          </div>
          <p className="carte-connexion-accroche">
            {mode === 'connexion'
              ? 'Bonjour ! Retrouvez vos séances de lecture.'
              : 'Créez votre espace pour préparer vos séances.'}
          </p>

          <label className="champ">
            <span className="champ-libelle">Email</span>
            <input
              type="email"
              name="email"
              autoComplete="username"
              inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="champ">
            <span className="champ-libelle">Mot de passe</span>
            <input
              type="password"
              name="motDePasse"
              autoComplete={mode === 'connexion' ? 'current-password' : 'new-password'}
              required
              minLength={8}
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
            />
          </label>

          {mode === 'connexion' && (
            <label className="case">
              <input
                type="checkbox"
                checked={resterConnectee}
                onChange={(e) => setResterConnectee(e.target.checked)}
              />
              <span className="case-boite" aria-hidden />
              <span>Rester connectée</span>
            </label>
          )}

          {erreur && (
            <p className="message-erreur" role="alert">
              {erreur}
            </p>
          )}

          <button type="submit" className="bouton bouton-principal bouton-large" disabled={envoi}>
            {envoi ? 'Un instant…' : mode === 'connexion' ? 'Se connecter' : 'Créer mon compte'}
          </button>

          {inscriptionOuverte && (
            <button
              type="button"
              className="lien-bouton"
              onClick={() => {
                setErreur(null);
                setMode(mode === 'connexion' ? 'inscription' : 'connexion');
              }}
            >
              {mode === 'connexion' ? 'Pas encore de compte ? En créer un' : 'J’ai déjà un compte'}
            </button>
          )}

          <div className="separateur">
            <span>ou</span>
          </div>
          <Link
            to="/demo"
            className="bouton bouton-soleil bouton-large"
            onClick={demanderPleinEcran}
          >
            <IconeJouer taille={22} />
            Jouer sans compte
          </Link>
        </form>
      </div>
    </main>
  );
}
