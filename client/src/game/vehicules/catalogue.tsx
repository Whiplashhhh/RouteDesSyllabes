/**
 * Les huit véhicules, dessinés à la main en SVG dans le même style « album jeunesse ».
 * Repère commun : viewBox 240 × 150, sol à y = 146, avant du véhicule à droite.
 */
import type { ReactNode } from 'react';
import type { VehiculeId } from '../../../../shared/seance';
import {
  Feu,
  Ombre,
  PassageRoue,
  Phare,
  Roue,
  TRAIT,
  Yeux,
  Sourire,
  type IdsDegrades,
} from './elements';

interface RoueDef {
  cx: number;
  cy: number;
  r: number;
}

export interface DefinitionVehicule {
  nom: string;
  roues: RoueDef[];
  /** Point d'où sort la fumée ; `haut` = cheminée vers le haut. */
  echappement: { x: number; y: number; haut: boolean };
  dessin: (p: { ids: IdsDegrades; yeux: boolean; clip: string }) => ReactNode;
}

const VITRE_TRAIT = { stroke: 'var(--carrosserie-fonce)', strokeWidth: 2.5 };
const GRIS_FONCE = '#3a4152';
const PARE_CHOC = { fill: '#e3e8ef', stroke: '#a9b3c1', strokeWidth: 1.5 };

/** Bande de reflet blanche en travers d'une vitre. */
function Brillance({ x, y1, y2, l = 9 }: { x: number; y1: number; y2: number; l?: number }) {
  const pente = (y2 - y1) * 0.45;
  return (
    <path
      d={`M ${x} ${y2} L ${x + pente} ${y1} L ${x + pente + l} ${y1} L ${x + l} ${y2} Z`}
      fill="#fff"
      opacity={0.45}
    />
  );
}

function roues(defs: RoueDef[]) {
  return (
    <>
      {defs.map((r) => (
        <PassageRoue key={`p${r.cx}`} {...r} />
      ))}
    </>
  );
}

function rouesDessus(defs: RoueDef[]) {
  return (
    <>
      {defs.map((r) => (
        <Roue key={`r${r.cx}`} {...r} />
      ))}
    </>
  );
}

// --- Citadine -------------------------------------------------------------

const ROUES_CITADINE = [
  { cx: 62, cy: 122, r: 22 },
  { cx: 182, cy: 122, r: 22 },
];
const CORPS_CITADINE =
  'M 20 124 C 10 124 8 114 9 102 C 10 89 20 80 38 78 L 62 76 C 72 50 92 32 120 30 L 148 30 C 174 32 190 50 199 74 L 212 77 C 227 81 234 92 234 106 C 234 117 230 124 221 124 Z';

const citadine: DefinitionVehicule = {
  nom: 'Voiture',
  roues: ROUES_CITADINE,
  echappement: { x: 8, y: 116, haut: false },
  dessin: ({ ids, yeux }) => (
    <>
      <Ombre />
      <path d={CORPS_CITADINE} fill={`url(#${ids.carrosserie})`} {...TRAIT} />
      <path
        d="M 28 90 C 70 84 180 84 220 92"
        fill="none"
        stroke="var(--carrosserie-clair)"
        strokeWidth={4}
        strokeLinecap="round"
        opacity={0.9}
      />
      <path
        d="M 76 74 C 84 54 98 41 118 40 L 128 40 L 128 74 Z"
        fill={`url(#${ids.vitre})`}
        {...VITRE_TRAIT}
      />
      <path
        d="M 138 40 L 148 40 C 168 42 181 55 188 74 L 138 74 Z"
        fill={`url(#${ids.vitre})`}
        {...VITRE_TRAIT}
      />
      <Brillance x={92} y1={44} y2={72} />
      {!yeux && <Brillance x={146} y1={44} y2={72} />}
      <path
        d="M 133 80 L 133 118"
        stroke="var(--carrosserie-fonce)"
        strokeWidth={2}
        opacity={0.55}
      />
      <rect
        x={140}
        y={86}
        width={14}
        height={5}
        rx={2.5}
        fill="var(--carrosserie-fonce)"
        opacity={0.7}
      />
      <rect x={220} y={108} width={17} height={10} rx={5} {...PARE_CHOC} />
      <rect x={3} y={108} width={16} height={10} rx={5} {...PARE_CHOC} />
      <Phare cx={225} cy={94} />
      <Feu x={10} y={87} />
      {roues(ROUES_CITADINE)}
      {rouesDessus(ROUES_CITADINE)}
      {yeux && <Yeux x={152} y={58} taille={7.5} ecart={19} />}
    </>
  ),
};

// --- Bus scolaire ---------------------------------------------------------

const ROUES_BUS = [
  { cx: 52, cy: 122, r: 21 },
  { cx: 198, cy: 122, r: 21 },
];

const bus: DefinitionVehicule = {
  nom: 'Bus',
  roues: ROUES_BUS,
  echappement: { x: 8, y: 118, haut: false },
  dessin: ({ ids, yeux }) => (
    <>
      <Ombre />
      <path
        d="M 26 124 C 14 124 8 118 8 106 L 8 46 C 8 34 16 26 30 26 L 204 26 C 220 26 229 36 231 50 L 236 104 C 237 116 232 124 220 124 Z"
        fill={`url(#${ids.carrosserie})`}
        {...TRAIT}
      />
      <rect
        x={16}
        y={31}
        width={200}
        height={5}
        rx={2.5}
        fill="var(--carrosserie-clair)"
        opacity={0.9}
      />
      {[20, 54, 88, 122].map((x) => (
        <g key={x}>
          <rect
            x={x}
            y={42}
            width={27}
            height={28}
            rx={7}
            fill={`url(#${ids.vitre})`}
            {...VITRE_TRAIT}
          />
          <Brillance x={x + 5} y1={45} y2={67} l={6} />
        </g>
      ))}
      <rect
        x={156}
        y={42}
        width={26}
        height={74}
        rx={6}
        fill="var(--carrosserie-fonce)"
        opacity={0.25}
      />
      <rect x={159} y={45} width={20} height={30} rx={4} fill={`url(#${ids.vitre})`} />
      <rect
        x={159}
        y={79}
        width={20}
        height={32}
        rx={4}
        fill={`url(#${ids.vitre})`}
        opacity={0.8}
      />
      <path
        d="M 192 42 L 214 42 C 221 42 224 47 225 54 L 228 78 L 192 78 Z"
        fill={`url(#${ids.vitre})`}
        {...VITRE_TRAIT}
      />
      {!yeux && <Brillance x={198} y1={46} y2={74} l={7} />}
      <rect x={8} y={86} width={147} height={5} fill={GRIS_FONCE} opacity={0.55} />
      <rect x={185} y={86} width={51} height={5} fill={GRIS_FONCE} opacity={0.55} />
      <rect x={8} y={98} width={147} height={4} fill={GRIS_FONCE} opacity={0.4} />
      <rect x={185} y={98} width={51} height={4} fill={GRIS_FONCE} opacity={0.4} />
      <rect x={222} y={110} width={16} height={10} rx={5} {...PARE_CHOC} />
      <rect x={3} y={110} width={14} height={10} rx={5} {...PARE_CHOC} />
      <Phare cx={229} cy={100} rx={5} ry={6} />
      <Feu x={10} y={66} h={12} />
      {roues(ROUES_BUS)}
      {rouesDessus(ROUES_BUS)}
      {yeux && <Yeux x={202} y={58} taille={6.5} ecart={15} />}
    </>
  ),
};

// --- Camion de pompiers ---------------------------------------------------

const ROUES_POMPIERS = [
  { cx: 50, cy: 122, r: 21 },
  { cx: 196, cy: 122, r: 21 },
];

const pompiers: DefinitionVehicule = {
  nom: 'Pompiers',
  roues: ROUES_POMPIERS,
  echappement: { x: 8, y: 118, haut: false },
  dessin: ({ ids, yeux }) => (
    <>
      <Ombre />
      {/* Échelle sur le toit */}
      <rect x={30} y={47} width={6} height={10} fill="#9aa6b6" />
      <rect x={124} y={47} width={6} height={10} fill="#9aa6b6" />
      <rect
        x={12}
        y={36}
        width={164}
        height={13}
        rx={4}
        fill="none"
        stroke="#9aa6b6"
        strokeWidth={3.5}
      />
      {Array.from({ length: 11 }, (_, i) => (
        <rect key={i} x={22 + i * 14.5} y={37} width={3} height={11} fill="#c3ccd8" />
      ))}
      <path
        d="M 22 124 C 12 124 8 118 8 110 L 8 64 C 8 58 12 54 18 54 L 152 54 L 152 124 Z"
        fill={`url(#${ids.carrosserie})`}
        {...TRAIT}
      />
      <path
        d="M 146 124 L 146 46 C 146 36 152 30 162 30 L 196 30 C 208 30 214 36 218 46 L 230 76 C 234 84 236 92 236 104 C 236 116 232 124 222 124 Z"
        fill={`url(#${ids.carrosserie})`}
        {...TRAIT}
      />
      <path d="M 170 30 C 170 18 188 18 188 30 Z" fill="#7fd0ff" stroke="#2a7cc4" strokeWidth={2} />
      <rect
        x={18}
        y={64}
        width={56}
        height={34}
        rx={7}
        fill="var(--carrosserie-fonce)"
        opacity={0.28}
      />
      <rect
        x={82}
        y={64}
        width={56}
        height={34}
        rx={7}
        fill="var(--carrosserie-fonce)"
        opacity={0.28}
      />
      <rect x={40} y={78} width={12} height={4} rx={2} fill="#f1f4f8" opacity={0.85} />
      <rect x={104} y={78} width={12} height={4} rx={2} fill="#f1f4f8" opacity={0.85} />
      <rect
        x={156}
        y={40}
        width={18}
        height={34}
        rx={5}
        fill={`url(#${ids.vitre})`}
        {...VITRE_TRAIT}
      />
      <path
        d="M 182 40 L 198 40 C 205 40 208 44 210 50 L 220 74 L 182 74 Z"
        fill={`url(#${ids.vitre})`}
        {...VITRE_TRAIT}
      />
      {!yeux && <Brillance x={188} y1={44} y2={72} l={7} />}
      <rect x={8} y={104} width={228} height={6} fill="#fff" opacity={0.9} />
      <rect x={222} y={110} width={16} height={10} rx={5} {...PARE_CHOC} />
      <Phare cx={229} cy={92} rx={5} ry={6} />
      <Feu x={10} y={66} h={12} />
      {roues(ROUES_POMPIERS)}
      {rouesDessus(ROUES_POMPIERS)}
      {yeux && <Yeux x={190} y={57} taille={6.5} ecart={15} />}
    </>
  ),
};

// --- Tracteur -------------------------------------------------------------

const ROUES_TRACTEUR = [
  { cx: 66, cy: 110, r: 34 },
  { cx: 194, cy: 124, r: 20 },
];

const tracteur: DefinitionVehicule = {
  nom: 'Tracteur',
  roues: ROUES_TRACTEUR,
  echappement: { x: 179, y: 26, haut: true },
  dessin: ({ ids, yeux }) => (
    <>
      <Ombre cx={124} rx={100} />
      <rect x={52} y={92} width={172} height={20} rx={7} fill={GRIS_FONCE} />
      {/* Cabine */}
      <path
        d="M 30 96 L 38 22 C 39 15 44 12 50 12 L 104 12 C 110 12 114 15 115 22 L 122 96 Z"
        fill={`url(#${ids.carrosserie})`}
        {...TRAIT}
      />
      <rect x={26} y={6} width={98} height={10} rx={5} fill="var(--carrosserie-fonce)" />
      <path d="M 48 24 L 104 24 L 108 70 L 45 70 Z" fill={`url(#${ids.vitre})`} {...VITRE_TRAIT} />
      {!yeux && <Brillance x={56} y1={28} y2={66} l={10} />}
      {/* Capot */}
      <path
        d="M 112 104 L 112 70 C 112 64 116 60 122 60 L 206 60 C 218 60 225 68 227 78 L 232 100 C 233 108 228 112 220 112 L 116 112 Z"
        fill={`url(#${ids.carrosserie})`}
        {...TRAIT}
      />
      <path
        d="M 126 70 L 206 70"
        stroke="var(--carrosserie-clair)"
        strokeWidth={4}
        strokeLinecap="round"
      />
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={140 + i * 14}
          y={80}
          width={8}
          height={18}
          rx={3}
          fill="var(--carrosserie-fonce)"
          opacity={0.45}
        />
      ))}
      <rect x={176} y={28} width={7} height={34} rx={3} fill="#8a94a6" />
      <rect x={173} y={24} width={13} height={7} rx={3} fill="#6b7486" />
      <Phare cx={226} cy={78} rx={5} ry={6} />
      {/* Garde-boue au-dessus de la grande roue */}
      <path
        d="M 22 110 A 44 44 0 0 1 110 110 L 102 110 A 36 36 0 0 0 30 110 Z"
        fill="var(--carrosserie)"
        {...TRAIT}
      />
      <Roue {...(ROUES_TRACTEUR[0] as RoueDef)} crampons />
      <PassageRoue {...(ROUES_TRACTEUR[1] as RoueDef)} />
      <Roue {...(ROUES_TRACTEUR[1] as RoueDef)} />
      {yeux && (
        <>
          <Yeux x={66} y={42} taille={8} ecart={21} />
          <Sourire x={72} y={58} l={13} />
        </>
      )}
    </>
  ),
};

// --- Petit train ----------------------------------------------------------

const ROUES_TRAIN = [
  { cx: 46, cy: 124, r: 20 },
  { cx: 112, cy: 124, r: 20 },
  { cx: 176, cy: 124, r: 20 },
];

const train: DefinitionVehicule = {
  nom: 'Petit train',
  roues: ROUES_TRAIN,
  echappement: { x: 195, y: 24, haut: true },
  dessin: ({ ids, yeux }) => (
    <>
      <Ombre />
      <rect x={10} y={104} width={216} height={14} rx={5} fill={GRIS_FONCE} />
      <path
        d="M 220 104 L 238 134 L 210 134 Z"
        fill="var(--carrosserie-fonce)"
        stroke={GRIS_FONCE}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {/* Chaudière */}
      <path
        d="M 90 58 L 206 58 C 218 58 224 68 224 82 C 224 96 218 106 206 106 L 90 106 Z"
        fill={`url(#${ids.carrosserie})`}
        {...TRAIT}
      />
      <path d="M 206 58 C 218 58 224 68 224 82 C 224 96 218 106 206 106 Z" fill={GRIS_FONCE} />
      <rect x={124} y={58} width={6} height={48} fill="var(--carrosserie-fonce)" opacity={0.5} />
      <rect x={168} y={58} width={6} height={48} fill="var(--carrosserie-fonce)" opacity={0.5} />
      <path
        d="M 100 66 L 200 66"
        stroke="var(--carrosserie-clair)"
        strokeWidth={4}
        strokeLinecap="round"
      />
      <path
        d="M 186 58 L 188 36 L 181 27 L 209 27 L 202 36 L 204 58 Z"
        fill={GRIS_FONCE}
        strokeLinejoin="round"
      />
      <path d="M 138 58 C 138 42 162 42 162 58 Z" fill="#f2c14e" stroke="#c99a22" strokeWidth={2} />
      {/* Cabine */}
      <path
        d="M 14 106 L 14 34 C 14 28 18 24 24 24 L 94 24 L 94 106 Z"
        fill={`url(#${ids.carrosserie})`}
        {...TRAIT}
      />
      <rect x={6} y={14} width={96} height={12} rx={6} fill="var(--carrosserie-fonce)" />
      <rect
        x={28}
        y={36}
        width={48}
        height={32}
        rx={9}
        fill={`url(#${ids.vitre})`}
        {...VITRE_TRAIT}
      />
      {!yeux && <Brillance x={36} y1={39} y2={65} l={9} />}
      <rect
        x={24}
        y={80}
        width={60}
        height={5}
        rx={2.5}
        fill="var(--carrosserie-clair)"
        opacity={0.8}
      />
      <Phare cx={222} cy={70} rx={4} ry={5} />
      {rouesDessus(ROUES_TRAIN)}
      <rect
        x={42}
        y={127}
        width={138}
        height={5}
        rx={2.5}
        fill="#c9d2de"
        stroke="#8d98a8"
        strokeWidth={1}
      />
      {yeux && <Yeux x={43} y={52} taille={8} ecart={20} />}
    </>
  ),
};

// --- Scooter --------------------------------------------------------------

const ROUES_SCOOTER = [
  { cx: 54, cy: 127, r: 17 },
  { cx: 190, cy: 127, r: 17 },
];

const scooter: DefinitionVehicule = {
  nom: 'Scooter',
  roues: ROUES_SCOOTER,
  echappement: { x: 20, y: 122, haut: false },
  dessin: ({ ids, yeux }) => (
    <>
      <Ombre rx={92} />
      {/* Pilote */}
      <path
        d="M 92 76 L 128 78 L 138 108"
        fill="none"
        stroke="#4a5f8a"
        strokeWidth={13}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <ellipse cx={142} cy={110} rx={10} ry={5} fill={GRIS_FONCE} />
      <path
        d="M 74 78 L 80 42 C 82 32 90 28 100 30 L 110 33 C 118 36 121 44 119 52 L 114 78 Z"
        fill="#ffb562"
        stroke="#d98a3a"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <path d="M 108 44 L 172 50" stroke="#ffb562" strokeWidth={10} strokeLinecap="round" />
      <circle cx={100} cy={18} r={14} fill="#ffd9b8" stroke="#e0a983" strokeWidth={2} />
      <path
        d="M 85 17 C 85 1 116 -1 116 15 L 116 17 Z"
        fill="var(--carrosserie)"
        stroke="var(--carrosserie-fonce)"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      {yeux ? (
        <Yeux x={102} y={21} taille={3.6} ecart={8} />
      ) : (
        <>
          <circle cx={104} cy={21} r={2} fill="#2b3142" />
          <circle cx={111} cy={21} r={2} fill="#2b3142" />
        </>
      )}
      <Sourire x={103} y={27} l={7} />
      {/* Scooter */}
      <path d="M 40 74 C 42 64 104 62 110 74 Z" fill={GRIS_FONCE} />
      <path
        d="M 20 118 C 13 98 26 78 52 74 L 106 72 C 118 72 124 82 122 96 L 118 118 Z"
        fill={`url(#${ids.carrosserie})`}
        {...TRAIT}
      />
      <path
        d="M 34 88 C 50 80 90 78 110 80"
        fill="none"
        stroke="var(--carrosserie-clair)"
        strokeWidth={4}
        strokeLinecap="round"
      />
      <rect x={110} y={108} width={64} height={10} rx={5} fill="var(--carrosserie-fonce)" />
      <path
        d="M 162 118 L 174 62 C 176 54 182 50 190 50 L 196 50 L 202 58 L 188 64 L 180 118 Z"
        fill={`url(#${ids.carrosserie})`}
        {...TRAIT}
      />
      <rect x={174} y={42} width={28} height={7} rx={3.5} fill={GRIS_FONCE} />
      <circle cx={176} cy={50} r={5.5} fill="#ffd9b8" stroke="#e0a983" strokeWidth={1.5} />
      <path
        d="M 170 126 C 172 106 210 106 212 126 Z"
        fill={`url(#${ids.carrosserie})`}
        {...TRAIT}
      />
      <Phare cx={200} cy={62} rx={5} ry={6} />
      <Feu x={14} y={92} l={6} h={9} />
      {rouesDessus(ROUES_SCOOTER)}
    </>
  ),
};

// --- Berline (police, taxi) -----------------------------------------------

const ROUES_BERLINE = [
  { cx: 60, cy: 122, r: 22 },
  { cx: 186, cy: 122, r: 22 },
];
const CORPS_BERLINE =
  'M 14 124 C 6 124 5 112 7 100 C 9 90 16 84 30 82 L 62 80 C 74 58 88 44 110 42 L 154 42 C 170 44 182 58 192 78 L 218 83 C 230 86 235 96 235 108 C 235 118 231 124 222 124 Z';

function Berline({
  ids,
  yeux,
  clip,
  enPlus,
  avantVitres,
}: {
  ids: IdsDegrades;
  yeux: boolean;
  clip: string;
  enPlus?: ReactNode;
  avantVitres?: ReactNode;
}) {
  return (
    <>
      <Ombre />
      <defs>
        <clipPath id={clip}>
          <path d={CORPS_BERLINE} />
        </clipPath>
      </defs>
      {avantVitres}
      <path d={CORPS_BERLINE} fill={`url(#${ids.carrosserie})`} {...TRAIT} />
      <g clipPath={`url(#${clip})`}>{enPlus}</g>
      <path d={CORPS_BERLINE} fill="none" {...TRAIT} />
      <path
        d="M 76 78 C 84 62 94 52 110 51 L 128 51 L 128 78 Z"
        fill={`url(#${ids.vitre})`}
        {...VITRE_TRAIT}
      />
      <path
        d="M 136 51 L 152 51 C 164 53 174 64 180 78 L 136 78 Z"
        fill={`url(#${ids.vitre})`}
        {...VITRE_TRAIT}
      />
      <Brillance x={94} y1={54} y2={76} l={8} />
      {!yeux && <Brillance x={146} y1={54} y2={76} l={8} />}
      <path
        d="M 132 82 L 132 120"
        stroke="var(--carrosserie-fonce)"
        strokeWidth={2}
        opacity={0.5}
      />
      <rect x={220} y={108} width={17} height={10} rx={5} {...PARE_CHOC} />
      <rect x={2} y={108} width={16} height={10} rx={5} {...PARE_CHOC} />
      <Phare cx={226} cy={95} />
      <Feu x={8} y={88} />
      {roues(ROUES_BERLINE)}
      {rouesDessus(ROUES_BERLINE)}
      {yeux && <Yeux x={148} y={64} taille={6.5} ecart={16} />}
    </>
  );
}

const police: DefinitionVehicule = {
  nom: 'Police',
  roues: ROUES_BERLINE,
  echappement: { x: 6, y: 116, haut: false },
  dessin: ({ ids, yeux, clip }) => (
    <Berline
      ids={ids}
      yeux={yeux}
      clip={clip}
      avantVitres={
        <>
          <rect x={110} y={33} width={42} height={10} rx={4} fill={GRIS_FONCE} />
          <path
            d="M 113 34 C 113 24 130 24 130 34 Z"
            fill="#ff7b7b"
            stroke="#c94848"
            strokeWidth={1.5}
          />
          <path
            d="M 132 34 C 132 24 149 24 149 34 Z"
            fill="#7fd0ff"
            stroke="#2a7cc4"
            strokeWidth={1.5}
          />
        </>
      }
      enPlus={
        <>
          <rect x={64} y={82} width={118} height={44} fill="#fbfcfe" />
          <rect x={0} y={96} width={240} height={5} fill="var(--carrosserie-fonce)" opacity={0.8} />
          <path
            d="M 100 84 l 3.2 6.5 7.2 1 -5.2 5 1.2 7.1 -6.4 -3.4 -6.4 3.4 1.2 -7.1 -5.2 -5 7.2 -1 Z"
            fill="#ffd23f"
            stroke="#d4a20a"
            strokeWidth={1.2}
            transform="translate(56 2)"
          />
        </>
      }
    />
  ),
};

const taxi: DefinitionVehicule = {
  nom: 'Taxi',
  roues: ROUES_BERLINE,
  echappement: { x: 6, y: 116, haut: false },
  dessin: ({ ids, yeux, clip }) => (
    <Berline
      ids={ids}
      yeux={yeux}
      clip={clip}
      avantVitres={
        <>
          <rect
            x={114}
            y={29}
            width={36}
            height={14}
            rx={5}
            fill="#fff8d6"
            stroke="#d4a20a"
            strokeWidth={2}
          />
          <text
            x={132}
            y={40}
            textAnchor="middle"
            fontSize={9}
            fontWeight={800}
            fill="#2b3142"
            fontFamily="Nunito, sans-serif"
          >
            TAXI
          </text>
        </>
      }
      enPlus={
        <g>
          {Array.from({ length: 30 }, (_, i) => (
            <g key={i}>
              <rect x={i * 8} y={88} width={8} height={6} fill={i % 2 ? '#fff' : GRIS_FONCE} />
              <rect x={i * 8} y={94} width={8} height={6} fill={i % 2 ? GRIS_FONCE : '#fff'} />
            </g>
          ))}
        </g>
      }
    />
  ),
};

export const CATALOGUE: Record<VehiculeId, DefinitionVehicule> = {
  citadine,
  bus,
  pompiers,
  tracteur,
  train,
  scooter,
  police,
  taxi,
};
