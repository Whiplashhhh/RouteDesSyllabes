import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Seance } from '../../../shared/seance';
import { ApercuSeance } from '../components/ApercuSeance';
import { Entete } from '../components/Entete';
import {
  IconeCopier,
  IconeCrayon,
  IconeJouer,
  IconePlus,
  IconePoubelle,
} from '../components/Icones';
import { useNotifier } from '../components/Notifications';
import { api, ErreurApi } from '../lib/api';
import { demanderPleinEcran } from '../lib/pleinEcran';

function Lettres({ seance }: { seance: Seance }) {
  const { consonnes, voyelles } = seance.config;
  return (
    <p className="carte-lettres" aria-label={`Lettres : ${[...consonnes, ...voyelles].join(', ')}`}>
      {consonnes.map((l) => (
        <span key={`c${l}`} className="pastille-mini pastille-consonne">
          {l}
        </span>
      ))}
      <span className="carte-lettres-plus" aria-hidden>
        +
      </span>
      {voyelles.map((l) => (
        <span key={`v${l}`} className="pastille-mini pastille-voyelle">
          {l}
        </span>
      ))}
    </p>
  );
}

function CarteSquelette() {
  return (
    <div className="carte-seance squelette" aria-hidden>
      <div className="apercu squelette-bloc" />
      <div className="carte-corps">
        <div className="squelette-ligne" style={{ width: '60%' }} />
        <div className="squelette-ligne" style={{ width: '85%' }} />
        <div className="squelette-ligne epaisse" />
      </div>
    </div>
  );
}

/** Accueil : les séances de la maîtresse, en grandes cartes visuelles. */
export function Accueil() {
  const [seances, setSeances] = useState<Seance[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [aConfirmer, setAConfirmer] = useState<string | null>(null);
  const naviguer = useNavigate();
  const notifier = useNotifier();

  const charger = useCallback(() => {
    setErreur(null);
    api
      .seances()
      .then(setSeances)
      .catch((e: unknown) =>
        setErreur(e instanceof ErreurApi ? e.message : 'Oups, la connexion a été coupée.'),
      );
  }, []);

  useEffect(charger, [charger]);

  const jouer = (s: Seance) => {
    demanderPleinEcran();
    naviguer(`/jouer/${s.id}`);
  };

  const dupliquer = async (s: Seance) => {
    try {
      const copie = await api.dupliquerSeance(s.id);
      setSeances((l) => {
        if (!l) return l;
        const i = l.findIndex((x) => x.id === s.id);
        return [...l.slice(0, i + 1), copie, ...l.slice(i + 1)];
      });
      notifier({ ton: 'succes', message: `« ${copie.nom} » est prête.` });
    } catch (e) {
      notifier({ ton: 'erreur', message: e instanceof ErreurApi ? e.message : String(e) });
    }
  };

  const supprimer = async (s: Seance) => {
    setAConfirmer(null);
    const avant = seances ?? [];
    const position = avant.findIndex((x) => x.id === s.id);
    setSeances(avant.filter((x) => x.id !== s.id));
    try {
      await api.supprimerSeance(s.id);
      notifier({
        ton: 'info',
        message: `« ${s.nom} » a été supprimée.`,
        duree: 7000,
        action: {
          libelle: 'Annuler',
          faire: () => {
            void api
              .restaurerSeance(s.id)
              .then((restauree) =>
                setSeances((l) => {
                  const liste = [...(l ?? [])];
                  liste.splice(Math.min(position, liste.length), 0, restauree);
                  return liste;
                }),
              )
              .catch(() =>
                notifier({
                  ton: 'erreur',
                  message: 'Oups, impossible de la récupérer. On réessaie ?',
                }),
              );
          },
        },
      });
    } catch (e) {
      setSeances(avant);
      notifier({ ton: 'erreur', message: e instanceof ErreurApi ? e.message : String(e) });
    }
  };

  return (
    <div className="page-maitresse">
      <Entete />
      <main className="contenu">
        <div className="titre-page">
          <div>
            <h1>Mes séances</h1>
            <p className="sous-titre">Choisissez une séance et lancez le jeu sur le grand écran.</p>
          </div>
          <Link to="/seances/nouvelle" className="bouton bouton-secondaire">
            <IconePlus taille={22} />
            Nouvelle séance
          </Link>
        </div>

        {erreur && (
          <div className="encart-erreur" role="alert">
            <p>{erreur}</p>
            <button type="button" className="bouton bouton-secondaire" onClick={charger}>
              Réessayer
            </button>
          </div>
        )}

        <div className="grille-seances">
          {!seances && !erreur && [0, 1, 2].map((i) => <CarteSquelette key={i} />)}
          {seances?.map((s) => (
            <article key={s.id} className="carte-seance" data-testid="carte-seance">
              <button
                type="button"
                className="carte-apercu-bouton"
                onClick={() => jouer(s)}
                aria-label={`Jouer « ${s.nom} »`}
              >
                <ApercuSeance config={s.config} graine={s.id} />
              </button>
              <div className="carte-corps">
                <h2 className="carte-titre">{s.nom}</h2>
                <Lettres seance={s} />
                {aConfirmer === s.id ? (
                  <div
                    className="carte-confirmation"
                    role="group"
                    aria-label="Confirmer la suppression"
                  >
                    <p>Supprimer cette séance ?</p>
                    <button
                      type="button"
                      className="bouton bouton-danger"
                      onClick={() => void supprimer(s)}
                    >
                      Supprimer
                    </button>
                    <button
                      type="button"
                      className="bouton bouton-secondaire"
                      onClick={() => setAConfirmer(null)}
                    >
                      Garder
                    </button>
                  </div>
                ) : (
                  <div className="carte-actions">
                    <button
                      type="button"
                      className="bouton bouton-principal bouton-jouer"
                      onClick={() => jouer(s)}
                    >
                      <IconeJouer taille={26} />
                      Jouer
                    </button>
                    <Link
                      to={`/seances/${s.id}`}
                      className="bouton-icone"
                      aria-label={`Modifier « ${s.nom} »`}
                      title="Modifier"
                    >
                      <IconeCrayon />
                    </Link>
                    <button
                      type="button"
                      className="bouton-icone"
                      onClick={() => void dupliquer(s)}
                      aria-label={`Dupliquer « ${s.nom} »`}
                      title="Dupliquer"
                    >
                      <IconeCopier />
                    </button>
                    <button
                      type="button"
                      className="bouton-icone bouton-icone-danger"
                      onClick={() => setAConfirmer(s.id)}
                      aria-label={`Supprimer « ${s.nom} »`}
                      title="Supprimer"
                    >
                      <IconePoubelle />
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
          {seances && (
            <Link to="/seances/nouvelle" className="carte-nouvelle">
              <span className="carte-nouvelle-plus">
                <IconePlus taille={40} />
              </span>
              <span>Créer une nouvelle séance</span>
            </Link>
          )}
        </div>
      </main>
      <footer className="pied-page">
        <p className="mention-createur">La Route des Syllabes · créé par Willem Vanbaelinghem</p>
      </footer>
    </div>
  );
}
