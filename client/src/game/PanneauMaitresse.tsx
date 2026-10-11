import { useEffect, useRef, useState } from 'react';
import {
  IconeDepart,
  IconeFermer,
  IconeGrille,
  IconeMelanger,
  IconeQuitter,
  IconeRetour,
  IconeSuivante,
} from '../components/Icones';

export interface SeanceCourte {
  id: string;
  nom: string;
  lettres: string;
}

interface Props {
  nomSeance: string;
  seances: SeanceCourte[];
  idCourant?: string;
  onFermer: () => void;
  onNouvellesLettres: () => void;
  onRemettreAuDepart: () => void;
  onSeanceSuivante?: () => void;
  onChoisirSeance?: (id: string) => void;
  onQuitter: () => void;
}

/** Petit panneau de commandes de la maîtresse, ouvert par appui long. */
export function PanneauMaitresse(props: Props) {
  const [choix, setChoix] = useState(false);
  const premierBouton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    premierBouton.current?.focus();
  }, [choix]);

  const plusieurs = props.seances.length > 1;

  return (
    <div
      className="panneau-voile"
      role="presentation"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) props.onFermer();
      }}
    >
      <div
        className="panneau"
        role="dialog"
        aria-modal="true"
        aria-label="Commandes de la maîtresse"
      >
        <header className="panneau-entete">
          {choix ? (
            <button
              type="button"
              className="panneau-retour"
              onClick={() => setChoix(false)}
              aria-label="Retour"
            >
              <IconeRetour taille={28} />
            </button>
          ) : null}
          <div>
            <p className="panneau-surtitre">{choix ? 'Choisir une séance' : 'Séance en cours'}</p>
            {!choix && <h2 className="panneau-titre">{props.nomSeance}</h2>}
          </div>
          <button
            type="button"
            className="panneau-fermer"
            onClick={props.onFermer}
            aria-label="Fermer"
          >
            <IconeFermer taille={28} />
          </button>
        </header>

        {choix ? (
          <ul className="panneau-liste">
            {props.seances.map((s, i) => (
              <li key={s.id}>
                <button
                  ref={i === 0 ? premierBouton : undefined}
                  type="button"
                  className={`panneau-seance${s.id === props.idCourant ? ' courante' : ''}`}
                  onClick={() => props.onChoisirSeance?.(s.id)}
                >
                  <span className="panneau-seance-nom">{s.nom}</span>
                  <span className="panneau-seance-lettres">{s.lettres}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="panneau-actions">
            <button
              ref={premierBouton}
              type="button"
              className="action-grande action-soleil"
              onClick={props.onNouvellesLettres}
            >
              <IconeMelanger taille={40} />
              <span>Nouvelles lettres</span>
            </button>
            <button
              type="button"
              className="action-grande action-ciel"
              onClick={props.onRemettreAuDepart}
            >
              <IconeDepart taille={40} />
              <span>Remettre au départ</span>
            </button>
            {plusieurs && props.onSeanceSuivante && (
              <button
                type="button"
                className="action-grande action-prairie"
                onClick={props.onSeanceSuivante}
              >
                <IconeSuivante taille={40} />
                <span>Séance suivante</span>
              </button>
            )}
            {plusieurs && props.onChoisirSeance && (
              <button
                type="button"
                className="action-grande action-violet"
                onClick={() => setChoix(true)}
              >
                <IconeGrille taille={40} />
                <span>Choisir une séance</span>
              </button>
            )}
            <button type="button" className="action-grande action-corail" onClick={props.onQuitter}>
              <IconeQuitter taille={40} />
              <span>Quitter</span>
            </button>
          </div>
        )}
        <p className="panneau-astuce">
          Au clavier : flèche droite pour de nouvelles lettres, Échap pour ce panneau
        </p>
      </div>
    </div>
  );
}
