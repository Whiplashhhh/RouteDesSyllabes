import { useId, type CSSProperties } from 'react';
import type { FondId } from '../../../../shared/seance';

interface Props {
  fond: FondId;
  couleurUnie: string;
  anime: boolean;
}

/** Nuage arrondi, dessiné avec quelques cercles. */
function Nuage({ x, y, s, o = 0.92 }: { x: number; y: number; s: number; o?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      <ellipse cx={0} cy={22} rx={78} ry={22} fill="#fff" />
      <circle cx={-34} cy={8} r={26} fill="#fff" />
      <circle cx={6} cy={-6} r={36} fill="#fff" />
      <circle cx={44} cy={10} r={24} fill="#fff" />
      <ellipse cx={0} cy={34} rx={70} ry={8} fill="#dbeaf5" opacity={0.6} />
    </g>
  );
}

/** Nuages qui dérivent très lentement (désactivable). */
function Nuages({ anime, teinte = 1 }: { anime: boolean; teinte?: number }) {
  const nuages = [
    { x: 180, y: 120, s: 0.9, d: 190, r: 0 },
    { x: 760, y: 70, s: 0.7, d: 240, r: -80 },
    { x: 1280, y: 150, s: 1, d: 210, r: -150 },
    { x: 460, y: 420, s: 0.55, d: 260, r: -40 },
    { x: 1460, y: 520, s: 0.6, d: 230, r: -120 },
    { x: 980, y: 700, s: 0.5, d: 280, r: -200 },
  ];
  return (
    <g opacity={teinte}>
      {nuages.map((n, i) => (
        <g
          key={i}
          className={anime ? 'nuage-derive' : undefined}
          style={
            {
              animationDuration: `${n.d}s`,
              animationDelay: `${n.r}s`,
              '--de': `${-n.x - 260}px`,
              '--a': `${1860 - n.x}px`,
            } as CSSProperties
          }
        >
          <Nuage x={n.x} y={n.y} s={n.s} />
        </g>
      ))}
    </g>
  );
}

function Etoiles({ anime }: { anime: boolean }) {
  // Positions fixes et régulières : pas d'aléatoire, le rendu reste stable.
  const etoiles = Array.from({ length: 46 }, (_, i) => ({
    x: (i * 337) % 1600,
    y: (i * 191) % 880,
    r: 1.6 + ((i * 7) % 5) * 0.45,
    d: 3 + (i % 5),
  }));
  return (
    <g>
      {etoiles.map((e, i) => (
        <circle
          key={i}
          cx={e.x}
          cy={e.y}
          r={e.r}
          fill="#fff6d8"
          className={anime ? 'etoile-scintille' : undefined}
          style={{ animationDuration: `${e.d}s`, animationDelay: `${-i * 0.37}s` }}
          opacity={0.75}
        />
      ))}
    </g>
  );
}

/** Décor de fond, sobre et peu contrasté pour laisser la vedette aux lettres. */
export function Fond({ fond, couleurUnie, anime }: Props) {
  const id = useId().replace(/:/g, '');
  const vb = '0 0 1600 900';
  const commun = {
    viewBox: vb,
    preserveAspectRatio: 'xMidYMid slice',
    className: 'fond',
    'aria-hidden': true,
  } as const;

  if (fond === 'uni') {
    return <div className="fond" style={{ background: couleurUnie }} aria-hidden />;
  }

  if (fond === 'campagne') {
    return (
      <svg {...commun}>
        <defs>
          <linearGradient id={`${id}-ciel`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#a9dcf6" />
            <stop offset="0.7" stopColor="#e4f5fb" />
          </linearGradient>
        </defs>
        <rect width={1600} height={900} fill={`url(#${id}-ciel)`} />
        <circle cx={1380} cy={130} r={70} fill="#fff3c4" opacity={0.85} />
        <Nuages anime={anime} teinte={0.8} />
        <path
          d="M0 470 C 220 400 420 420 640 480 C 860 540 1100 430 1340 450 C 1460 460 1540 480 1600 470 L 1600 900 L 0 900 Z"
          fill="#dff1d6"
          opacity={0.8}
        />
        <path
          d="M0 640 C 260 520 520 560 760 620 C 1000 680 1260 540 1600 600 L 1600 900 L 0 900 Z"
          fill="#cdeac0"
        />
        <path
          d="M0 740 C 300 660 600 700 900 760 C 1180 816 1400 700 1600 730 L 1600 900 L 0 900 Z"
          fill="#b6e0a6"
        />
      </svg>
    );
  }

  if (fond === 'coucher') {
    return (
      <svg {...commun}>
        <defs>
          <linearGradient id={`${id}-ciel`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#b9a7e8" />
            <stop offset="0.45" stopColor="#f6b3a8" />
            <stop offset="1" stopColor="#ffd9a6" />
          </linearGradient>
          <radialGradient id={`${id}-soleil`}>
            <stop offset="0" stopColor="#fff1c2" />
            <stop offset="0.55" stopColor="#ffd38a" stopOpacity="0.8" />
            <stop offset="1" stopColor="#ffd38a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width={1600} height={900} fill={`url(#${id}-ciel)`} />
        <circle cx={1200} cy={700} r={330} fill={`url(#${id}-soleil)`} />
        <circle cx={1200} cy={700} r={120} fill="#ffe7a8" opacity={0.85} />
        <g opacity={0.55}>
          <Nuages anime={anime} />
        </g>
      </svg>
    );
  }

  if (fond === 'nuit') {
    return (
      <svg {...commun}>
        <defs>
          <linearGradient id={`${id}-ciel`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2f3f7c" />
            <stop offset="1" stopColor="#5f6fb5" />
          </linearGradient>
        </defs>
        <rect width={1600} height={900} fill={`url(#${id}-ciel)`} />
        <Etoiles anime={anime} />
        <g transform="translate(1340 150)">
          <circle r={64} fill="#fff4cf" opacity={0.18} />
          <circle r={46} fill="#fff4cf" />
          <circle cx={20} cy={-12} r={42} fill="#3a4a8a" />
        </g>
      </svg>
    );
  }

  // Ciel bleu (par défaut)
  return (
    <svg {...commun}>
      <defs>
        <linearGradient id={`${id}-ciel`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#94d3f4" />
          <stop offset="1" stopColor="#dcf2fb" />
        </linearGradient>
      </defs>
      <rect width={1600} height={900} fill={`url(#${id}-ciel)`} />
      <Nuages anime={anime} />
    </svg>
  );
}
