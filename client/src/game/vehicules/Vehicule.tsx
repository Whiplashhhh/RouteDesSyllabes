import { useId, type CSSProperties } from 'react';
import type { CouleurId, VehiculeId } from '../../../../shared/seance';
import { VEHICULE_VB } from '../geometrie';
import { variablesTeinte } from '../palette';
import { CATALOGUE } from './catalogue';

interface Props {
  type: VehiculeId;
  couleur: CouleurId;
  yeux?: boolean;
  className?: string;
  style?: CSSProperties;
  titre?: string;
}

/** Dessin SVG d'un véhicule, coloré via des variables CSS. */
export function Vehicule({ type, couleur, yeux = true, className, style, titre }: Props) {
  const base = useId().replace(/:/g, '');
  const ids = { carrosserie: `${base}-c`, vitre: `${base}-v` };
  const def = CATALOGUE[type] ?? CATALOGUE.citadine;
  return (
    <svg
      viewBox={`0 0 ${VEHICULE_VB.largeur} ${VEHICULE_VB.hauteur}`}
      className={className}
      style={{ ...variablesTeinte(couleur), overflow: 'visible', ...style } as CSSProperties}
      role={titre ? 'img' : undefined}
      aria-label={titre}
      aria-hidden={titre ? undefined : true}
    >
      <defs>
        <linearGradient id={ids.carrosserie} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--carrosserie-clair)' }} />
          <stop offset="0.4" style={{ stopColor: 'var(--carrosserie)' }} />
          <stop offset="1" style={{ stopColor: 'var(--carrosserie)' }} />
        </linearGradient>
        <linearGradient id={ids.vitre} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#eaf7ff" />
          <stop offset="1" stopColor="#a6d6f4" />
        </linearGradient>
      </defs>
      {def.dessin({ ids, yeux, clip: `${base}-clip` })}
    </svg>
  );
}
