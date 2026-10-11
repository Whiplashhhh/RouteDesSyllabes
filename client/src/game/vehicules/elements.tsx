/**
 * Éléments graphiques communs à tous les véhicules : roues, yeux, phares, ombre.
 * Tous les véhicules sont dessinés dans un viewBox 240 × 150, tournés vers la droite.
 */

export interface IdsDegrades {
  carrosserie: string;
  vitre: string;
}

const CONTOUR = 'var(--carrosserie-fonce)';
export const TRAIT = { stroke: CONTOUR, strokeWidth: 3, strokeLinejoin: 'round' as const };

export function Ombre({ cx = 120, rx = 104 }: { cx?: number; rx?: number }) {
  return <ellipse cx={cx} cy={146} rx={rx} ry={5} fill="#1d2433" opacity={0.16} />;
}

/** Une roue : elle tourne autour de son centre, piloté par le contrôleur de route. */
export function Roue({
  cx,
  cy,
  r,
  crampons = false,
}: {
  cx: number;
  cy: number;
  r: number;
  crampons?: boolean;
}) {
  return (
    <g>
      <g
        className="roue"
        data-r={r}
        style={{ transformOrigin: `${cx}px ${cy}px`, transformBox: 'view-box' }}
      >
        {crampons &&
          Array.from({ length: 18 }, (_, i) => (
            <rect
              key={i}
              x={cx - 3.5}
              y={cy - r - 3}
              width={7}
              height={6}
              rx={2}
              fill="#343a4a"
              transform={`rotate(${i * 20} ${cx} ${cy})`}
            />
          ))}
        <circle cx={cx} cy={cy} r={r} fill="#343a4a" />
        <circle cx={cx} cy={cy} r={r * 0.9} fill="none" stroke="#4a5266" strokeWidth={1.5} />
        <circle cx={cx} cy={cy} r={r * 0.6} fill="#eef2f7" />
        <circle cx={cx} cy={cy} r={r * 0.6} fill="none" stroke="#c9d2de" strokeWidth={1.5} />
        {[0, 72, 144, 216, 288].map((a) => {
          const rad = (a * Math.PI) / 180;
          return (
            <circle
              key={a}
              cx={cx + Math.cos(rad) * r * 0.36}
              cy={cy + Math.sin(rad) * r * 0.36}
              r={r * 0.09}
              fill="#b7c2d0"
            />
          );
        })}
        <circle cx={cx} cy={cy} r={r * 0.17} fill="var(--carrosserie)" />
      </g>
      {/* Reflet fixe sur le pneu : il ne tourne pas, comme une vraie lumière. */}
      <path
        d={`M ${cx - r * 0.72} ${cy - r * 0.3} A ${r * 0.78} ${r * 0.78} 0 0 1 ${cx - r * 0.2} ${cy - r * 0.76}`}
        fill="none"
        stroke="#fff"
        strokeOpacity={0.22}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </g>
  );
}

/** Passage de roue : un arc sombre derrière la roue. */
export function PassageRoue({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return <circle cx={cx} cy={cy} r={r + 5} fill="var(--carrosserie-fonce)" opacity={0.9} />;
}

/** Deux yeux expressifs, qui regardent vers l'avant (la droite). */
export function Yeux({
  x,
  y,
  taille = 7,
  ecart = 18,
}: {
  x: number;
  y: number;
  taille?: number;
  ecart?: number;
}) {
  const oeil = (ox: number) => (
    <g className="oeil" style={{ transformOrigin: `${ox}px ${y}px`, transformBox: 'view-box' }}>
      <ellipse
        cx={ox}
        cy={y}
        rx={taille * 0.82}
        ry={taille}
        fill="#fff"
        stroke="#2b3142"
        strokeWidth={1.6}
      />
      <circle cx={ox + taille * 0.28} cy={y + taille * 0.12} r={taille * 0.52} fill="#2b3142" />
      <circle cx={ox + taille * 0.45} cy={y - taille * 0.15} r={taille * 0.19} fill="#fff" />
    </g>
  );
  return (
    <g className="yeux">
      {oeil(x)}
      {oeil(x + ecart)}
    </g>
  );
}

/** Petit sourire, utilisé avec les yeux. */
export function Sourire({ x, y, l = 12 }: { x: number; y: number; l?: number }) {
  return (
    <path
      d={`M ${x} ${y} Q ${x + l / 2} ${y + l * 0.45} ${x + l} ${y}`}
      fill="none"
      stroke="#2b3142"
      strokeWidth={2}
      strokeLinecap="round"
    />
  );
}

export function Phare({
  cx,
  cy,
  rx = 6,
  ry = 7,
}: {
  cx: number;
  cy: number;
  rx?: number;
  ry?: number;
}) {
  return (
    <g className="phare">
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx + 4}
        ry={ry + 4}
        fill="#fff3b0"
        className="phare-halo"
        opacity={0}
      />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#fff8d6" stroke="#e8c65a" strokeWidth={1.5} />
    </g>
  );
}

export function Feu({ x, y, l = 6, h = 11 }: { x: number; y: number; l?: number; h?: number }) {
  return (
    <rect
      x={x}
      y={y}
      width={l}
      height={h}
      rx={2.5}
      fill="#ff6f6f"
      stroke="#c94848"
      strokeWidth={1.2}
    />
  );
}
