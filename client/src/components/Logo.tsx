import { Vehicule } from '../game/vehicules/Vehicule';

/** Logo : une petite voiture souriante qui porte la syllabe « la ». */
export function Logo({ taille = 56 }: { taille?: number }) {
  return (
    <span className="logo" style={{ height: `${taille / 16}rem` }} aria-hidden>
      <Vehicule type="citadine" couleur="rouge" style={{ height: '100%', width: 'auto' }} />
      <span className="logo-etiquette" style={{ fontSize: `${(taille * 0.42) / 16}rem` }}>
        la
      </span>
    </span>
  );
}
