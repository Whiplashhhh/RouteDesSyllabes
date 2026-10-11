import { useId } from 'react';
import type { RouteStyleId } from '../../../../shared/seance';

interface Props {
  style: RouteStyleId;
  largeur: number;
  hauteur: number;
}

/**
 * Bande de route vue de côté, dessinée en SVG à la taille réelle en pixels
 * (les motifs restent nets et réguliers quelle que soit la largeur).
 */
export function BandeRoute({ style, largeur, hauteur: h }: Props) {
  const id = useId().replace(/:/g, '');
  const l = Math.max(1, Math.round(largeur));
  const herbe = h * 0.16;

  const accotement = (
    <>
      <rect x={0} y={h - herbe} width={l} height={herbe} fill="#9fd89a" />
      <rect x={0} y={h - herbe} width={l} height={herbe * 0.25} fill="#86c982" />
    </>
  );

  let contenu;
  if (style === 'terre') {
    const motif = h * 0.9;
    contenu = (
      <>
        <defs>
          <pattern id={`${id}-cailloux`} width={motif} height={h} patternUnits="userSpaceOnUse">
            <ellipse cx={motif * 0.2} cy={h * 0.3} rx={h * 0.035} ry={h * 0.022} fill="#c49b67" />
            <ellipse cx={motif * 0.62} cy={h * 0.55} rx={h * 0.03} ry={h * 0.02} fill="#c49b67" />
            <ellipse cx={motif * 0.85} cy={h * 0.24} rx={h * 0.022} ry={h * 0.015} fill="#e8cc9f" />
            <ellipse cx={motif * 0.4} cy={h * 0.68} rx={h * 0.025} ry={h * 0.016} fill="#e8cc9f" />
          </pattern>
          <pattern
            id={`${id}-touffes`}
            width={h * 0.7}
            height={h * 0.2}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${h * 0.05} ${h * 0.2} Q ${h * 0.1} ${h * 0.02} ${h * 0.16} ${h * 0.2} Q ${h * 0.2} ${h * 0.06} ${h * 0.26} ${h * 0.2} Z`}
              fill="#8fcf87"
            />
          </pattern>
        </defs>
        <rect x={0} y={0} width={l} height={h - herbe} fill="#e2bd86" rx={h * 0.08} />
        <rect x={0} y={0} width={l} height={h - herbe} fill={`url(#${id}-cailloux)`} />
        <rect x={0} y={h * 0.2} width={l} height={h * 0.05} fill="#d4aa70" opacity={0.6} />
        <rect x={0} y={h * 0.58} width={l} height={h * 0.05} fill="#d4aa70" opacity={0.6} />
        {accotement}
        <rect x={0} y={-h * 0.14} width={l} height={h * 0.2} fill={`url(#${id}-touffes)`} />
      </>
    );
  } else if (style === 'rails') {
    const pas = h * 0.42;
    contenu = (
      <>
        <defs>
          <pattern id={`${id}-traverses`} width={pas} height={h} patternUnits="userSpaceOnUse">
            <rect
              x={pas * 0.18}
              y={h * 0.1}
              width={pas * 0.4}
              height={h * 0.62}
              rx={h * 0.03}
              fill="#a9774c"
            />
            <rect
              x={pas * 0.18}
              y={h * 0.1}
              width={pas * 0.4}
              height={h * 0.06}
              rx={h * 0.03}
              fill="#c08d60"
            />
          </pattern>
          <pattern
            id={`${id}-ballast`}
            width={h * 0.3}
            height={h * 0.3}
            patternUnits="userSpaceOnUse"
          >
            <circle cx={h * 0.06} cy={h * 0.08} r={h * 0.022} fill="#a59d92" />
            <circle cx={h * 0.2} cy={h * 0.2} r={h * 0.018} fill="#d2cbc1" />
          </pattern>
        </defs>
        <rect x={0} y={0} width={l} height={h - herbe} fill="#c4bdb2" />
        <rect x={0} y={0} width={l} height={h - herbe} fill={`url(#${id}-ballast)`} />
        <rect x={0} y={0} width={l} height={h} fill={`url(#${id}-traverses)`} />
        {[0.2, 0.62].map((y) => (
          <g key={y}>
            <rect x={0} y={h * y} width={l} height={h * 0.07} fill="#7f8a9b" />
            <rect x={0} y={h * y} width={l} height={h * 0.025} fill="#d6dde6" />
          </g>
        ))}
        {accotement}
      </>
    );
  } else if (style === 'arc-en-ciel') {
    const couleurs = ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#bdb2ff'];
    const bande = (h - herbe) / couleurs.length;
    contenu = (
      <>
        {couleurs.map((c, i) => (
          <rect key={c} x={0} y={i * bande} width={l} height={bande + 0.5} fill={c} />
        ))}
        <rect x={0} y={0} width={l} height={h * 0.035} fill="#fff" opacity={0.7} />
        {accotement}
      </>
    );
  } else {
    // Route goudronnée avec lignes blanches
    const tiret = h * 0.55;
    contenu = (
      <>
        <defs>
          <pattern id={`${id}-tirets`} width={tiret * 2} height={h} patternUnits="userSpaceOnUse">
            <rect x={0} y={h * 0.4} width={tiret} height={h * 0.05} rx={h * 0.025} fill="#f4f6f8" />
          </pattern>
        </defs>
        <rect x={0} y={0} width={l} height={h - herbe} fill="#6b7383" />
        <rect x={0} y={0} width={l} height={h * 0.05} fill="#7e8697" />
        <rect x={0} y={h * 0.08} width={l} height={h * 0.035} fill="#f4f6f8" opacity={0.9} />
        <rect x={0} y={h * 0.74} width={l} height={h * 0.035} fill="#f4f6f8" opacity={0.9} />
        <rect x={0} y={0} width={l} height={h} fill={`url(#${id}-tirets)`} />
        {accotement}
      </>
    );
  }

  return (
    <svg className="bande-route" width={l} height={h} viewBox={`0 0 ${l} ${h}`} aria-hidden>
      {contenu}
    </svg>
  );
}
