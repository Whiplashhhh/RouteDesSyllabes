import { useEffect, useRef, useState } from 'react';
import { IconeEngrenage } from '../components/Icones';

interface Props {
  duree?: number;
  onActive: () => void;
}

/**
 * Bouton discret réservé à la maîtresse : il ne s'active qu'après un appui
 * maintenu (≈ 1,5 s) pendant qu'un anneau de progression se remplit.
 * Un simple tap d'enfant ne fait donc rien.
 */
export function BoutonAppuiLong({ duree = 1500, onActive }: Props) {
  const [progression, setProgression] = useState(0);
  const anim = useRef(0);
  const pointeur = useRef<number | null>(null);

  const annuler = () => {
    cancelAnimationFrame(anim.current);
    pointeur.current = null;
    setProgression(0);
  };

  useEffect(() => () => cancelAnimationFrame(anim.current), []);

  const commencer = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    pointeur.current = e.pointerId;
    const debut = performance.now();
    const pas = (t: number) => {
      const k = Math.min(1, (t - debut) / duree);
      setProgression(k);
      if (k < 1) anim.current = requestAnimationFrame(pas);
      else {
        annuler();
        onActive();
      }
    };
    anim.current = requestAnimationFrame(pas);
  };

  const r = 22;
  const circonference = 2 * Math.PI * r;

  return (
    <button
      type="button"
      className={`bouton-maitresse${progression > 0 ? ' actif' : ''}`}
      aria-label="Réglages de la maîtresse (appui long)"
      onPointerDown={commencer}
      onPointerUp={annuler}
      onPointerCancel={annuler}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onActive();
        }
      }}
      data-testid="bouton-maitresse"
    >
      <svg viewBox="0 0 52 52" aria-hidden>
        <circle cx="26" cy="26" r={r} className="anneau-fond" />
        <circle
          cx="26"
          cy="26"
          r={r}
          className="anneau"
          strokeDasharray={circonference}
          strokeDashoffset={circonference * (1 - progression)}
          transform="rotate(-90 26 26)"
        />
      </svg>
      <IconeEngrenage className="bouton-maitresse-icone" />
    </button>
  );
}
