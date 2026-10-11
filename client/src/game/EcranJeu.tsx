import { useCallback, useEffect, useRef, useState } from 'react';
import type { SeanceConfig } from '../../../shared/seance';
import { quitterPleinEcran } from '../lib/pleinEcran';
import { BoutonAppuiLong } from './BoutonAppuiLong';
import { PanneauMaitresse, type SeanceCourte } from './PanneauMaitresse';
import { preparerVoix } from './retours/voix';
import { Scene, type Tirage } from './Scene';
import { nouveauTirage } from './tirage';

interface Props {
  id?: string;
  nom: string;
  config: SeanceConfig;
  seances?: SeanceCourte[];
  onChoisirSeance?: (id: string) => void;
  onQuitter: () => void;
}

/** Écran de jeu complet : la scène, le bouton discret et le panneau de la maîtresse. */
export function EcranJeu({ id, nom, config, seances = [], onChoisirSeance, onQuitter }: Props) {
  const [tirage, setTirage] = useState<Tirage>(() => nouveauTirage(config));
  const [jetonDepart, setJetonDepart] = useState(0);
  const [panneau, setPanneau] = useState(false);

  // Nouvelle séance choisie : nouveau tirage (pas au premier affichage).
  const configInitiale = useRef(config);
  useEffect(() => {
    if (configInitiale.current === config) return;
    configInitiale.current = config;
    setTirage((t) => nouveauTirage(config, t));
  }, [config]);

  useEffect(() => {
    if (config.retours.voix) preparerVoix();
  }, [config.retours.voix]);

  const nouvellesLettres = useCallback(() => {
    setPanneau(false);
    setTirage((t) => nouveauTirage(config, t));
  }, [config]);

  const remettreAuDepart = useCallback(() => {
    setPanneau(false);
    setJetonDepart((j) => j + 1);
  }, []);

  // Raccourcis clavier pour la maîtresse.
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nouvellesLettres();
      else if (e.key === 'Escape') setPanneau((p) => !p);
      else if (e.key === 'Home') remettreAuDepart();
    };
    window.addEventListener('keydown', touche);
    return () => window.removeEventListener('keydown', touche);
  }, [nouvellesLettres, remettreAuDepart]);

  // Pas de menu contextuel sur l'écran de jeu (appui long des enfants).
  useEffect(() => {
    const bloquer = (e: Event) => e.preventDefault();
    document.addEventListener('contextmenu', bloquer);
    document.documentElement.classList.add('mode-jeu');
    return () => {
      document.removeEventListener('contextmenu', bloquer);
      document.documentElement.classList.remove('mode-jeu');
    };
  }, []);

  const indexCourant = seances.findIndex((s) => s.id === id);
  const suivante = seances.length > 1 ? seances[(indexCourant + 1) % seances.length] : undefined;

  return (
    <div className="ecran-jeu" data-testid="ecran-jeu">
      <Scene config={config} tirage={tirage} jetonDepart={jetonDepart} />
      <BoutonAppuiLong onActive={() => setPanneau(true)} />
      {panneau && (
        <PanneauMaitresse
          nomSeance={nom}
          seances={seances}
          idCourant={id}
          onFermer={() => setPanneau(false)}
          onNouvellesLettres={nouvellesLettres}
          onRemettreAuDepart={remettreAuDepart}
          onSeanceSuivante={
            suivante && onChoisirSeance
              ? () => {
                  setPanneau(false);
                  onChoisirSeance(suivante.id);
                }
              : undefined
          }
          onChoisirSeance={
            onChoisirSeance
              ? (choisi) => {
                  setPanneau(false);
                  onChoisirSeance(choisi);
                }
              : undefined
          }
          onQuitter={() => {
            quitterPleinEcran();
            onQuitter();
          }}
        />
      )}
    </div>
  );
}
