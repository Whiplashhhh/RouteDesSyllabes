import type { ReactNode } from 'react';
import { IconeCoche, IconeSon, IconeVague } from '../Icones';

/** Pastille de lettre : un tap sélectionne ou désélectionne. */
export function Pastille({
  texte,
  actif,
  onClick,
  glisse = false,
  type = 'consonne',
  desactive = false,
}: {
  texte: string;
  actif: boolean;
  onClick: () => void;
  glisse?: boolean;
  type?: 'consonne' | 'voyelle';
  desactive?: boolean;
}) {
  return (
    <button
      type="button"
      className={`pastille pastille-${type}${actif ? ' active' : ''}`}
      aria-pressed={actif}
      onClick={onClick}
      disabled={desactive}
      title={glisse ? 'Son qui se prolonge, idéal pour débuter' : undefined}
    >
      <span className="pastille-texte">{texte}</span>
      {glisse && (
        <span className="pastille-vague" aria-label="son qui se prolonge">
          <IconeVague taille={16} />
        </span>
      )}
    </button>
  );
}

/** Interrupteur avec libellé, description et bouton « Tester » facultatif. */
export function Interrupteur({
  libelle,
  description,
  actif,
  onChange,
  onTester,
  illustration,
}: {
  libelle: string;
  description?: string;
  actif: boolean;
  onChange: (v: boolean) => void;
  onTester?: () => void;
  illustration?: ReactNode;
}) {
  return (
    <div className={`interrupteur-ligne${actif ? ' actif' : ''}`}>
      {illustration && <span className="interrupteur-illustration">{illustration}</span>}
      <label className="interrupteur">
        <span className="interrupteur-textes">
          <span className="interrupteur-libelle">{libelle}</span>
          {description && <span className="interrupteur-description">{description}</span>}
        </span>
        <input
          type="checkbox"
          role="switch"
          checked={actif}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="interrupteur-piste" aria-hidden>
          <span className="interrupteur-bouton" />
        </span>
      </label>
      {onTester && (
        <button type="button" className="bouton-tester" onClick={onTester}>
          <IconeSon taille={20} />
          Tester
        </button>
      )}
    </div>
  );
}

/** Vignette de choix visuel (fond, route, véhicule…). */
export function Vignette({
  libelle,
  actif,
  onClick,
  children,
  className = '',
}: {
  libelle: string;
  actif: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`vignette ${className}${actif ? ' active' : ''}`}
      aria-pressed={actif}
      onClick={onClick}
    >
      <span className="vignette-image">{children}</span>
      <span className="vignette-libelle">{libelle}</span>
      {actif && (
        <span className="vignette-coche" aria-hidden>
          <IconeCoche taille={16} />
        </span>
      )}
    </button>
  );
}

/** Choix segmenté (quelques grandes options côte à côte). */
export function Segments<T extends string | number>({
  options,
  valeur,
  onChange,
  libelle,
}: {
  options: { valeur: T; libelle: ReactNode; aria?: string }[];
  valeur: T;
  onChange: (v: T) => void;
  libelle: string;
}) {
  return (
    <div className="segments" role="radiogroup" aria-label={libelle}>
      {options.map((o) => (
        <button
          key={String(o.valeur)}
          type="button"
          role="radio"
          aria-checked={o.valeur === valeur}
          aria-label={o.aria}
          className={`segment${o.valeur === valeur ? ' actif' : ''}`}
          onClick={() => onChange(o.valeur)}
        >
          {o.libelle}
        </button>
      ))}
    </div>
  );
}

export function BlocReglage({
  titre,
  aide,
  children,
}: {
  titre: string;
  aide?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="bloc-reglage">
      <header>
        <h3>{titre}</h3>
        {aide && <p className="bloc-aide">{aide}</p>}
      </header>
      {children}
    </section>
  );
}
