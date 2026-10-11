import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Seance } from '../../../shared/seance';
import { EcranJeu } from '../game/EcranJeu';
import { api, ErreurApi } from '../lib/api';

/** Mode élève : la séance choisie, en plein écran. */
export function Jouer() {
  const { id } = useParams();
  const naviguer = useNavigate();
  const [seances, setSeances] = useState<Seance[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    api
      .seances()
      .then(setSeances)
      .catch((e: unknown) =>
        setErreur(e instanceof ErreurApi ? e.message : 'Oups, la connexion a été coupée.'),
      );
  }, []);

  const seance = seances?.find((s) => s.id === id);
  const courtes = useMemo(
    () =>
      (seances ?? []).map((s) => ({
        id: s.id,
        nom: s.nom,
        lettres: `${s.config.consonnes.join(' ')} · ${s.config.voyelles.join(' ')}`,
      })),
    [seances],
  );

  if (erreur || (seances && !seance)) {
    return (
      <main className="page-attente">
        <div className="encart-erreur" role="alert">
          <p>{erreur ?? 'Cette séance est introuvable.'}</p>
          <Link to="/" className="bouton bouton-secondaire">
            Retour à mes séances
          </Link>
        </div>
      </main>
    );
  }

  if (!seance) {
    return (
      <main className="page-attente page-attente-jeu" aria-busy>
        <span className="chargement-roue" aria-label="Chargement" />
      </main>
    );
  }

  return (
    <EcranJeu
      id={seance.id}
      nom={seance.nom}
      config={seance.config}
      seances={courtes}
      onChoisirSeance={(autre) => naviguer(`/jouer/${autre}`, { replace: true })}
      onQuitter={() => naviguer('/')}
    />
  );
}
