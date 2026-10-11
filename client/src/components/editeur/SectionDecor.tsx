import {
  COULEURS,
  FONDS,
  ROUTES,
  VEHICULES,
  type CouleurId,
  type Decor,
  type FondId,
  type RouteStyleId,
  type SeanceConfig,
  type VehiculeId,
} from '../../../../shared/seance';
import { BandeRoute } from '../../game/decor/BandeRoute';
import { Fond } from '../../game/decor/Fond';
import { TEINTES } from '../../game/palette';
import { CATALOGUE } from '../../game/vehicules/catalogue';
import { Vehicule } from '../../game/vehicules/Vehicule';
import { BlocReglage, Interrupteur, Vignette } from './Controles';

const NOMS_FONDS: Record<FondId, string> = {
  ciel: 'Ciel bleu',
  campagne: 'Campagne',
  coucher: 'Coucher de soleil',
  nuit: 'Nuit étoilée',
  uni: 'Couleur unie',
};

const NOMS_ROUTES: Record<RouteStyleId, string> = {
  goudron: 'Route',
  terre: 'Chemin de terre',
  rails: 'Rails',
  'arc-en-ciel': 'Arc-en-ciel',
};

const COULEURS_UNIES = [
  '#bfe3f5',
  '#d9f0d2',
  '#fff1c9',
  '#ffe1d3',
  '#ece4fb',
  '#f4eee4',
  '#cfd8f2',
];

interface Props {
  config: SeanceConfig;
  modifierDecor: (maj: Partial<Decor>) => void;
}

function ChoixCouleur({
  valeur,
  onChange,
  libelle,
}: {
  valeur: CouleurId;
  onChange: (c: CouleurId) => void;
  libelle: string;
}) {
  return (
    <div className="nuancier" role="radiogroup" aria-label={libelle}>
      {COULEURS.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={c === valeur}
          aria-label={TEINTES[c].nom}
          className={`nuance${c === valeur ? ' active' : ''}`}
          style={{ background: TEINTES[c].principale }}
          onClick={() => onChange(c)}
        />
      ))}
    </div>
  );
}

/** Décor : fond, route, véhicules et couleurs, tout en vignettes. */
export function SectionDecor({ config, modifierDecor }: Props) {
  const { decor } = config;
  const nbChoix = decor.memeVehicule ? 1 : config.nbRoutes;

  const changerVehicule = (i: number, maj: Partial<{ type: VehiculeId; couleur: CouleurId }>) => {
    const vehicules = decor.vehicules.map((v, j) => (j === i ? { ...v, ...maj } : v));
    modifierDecor({ vehicules });
  };

  return (
    <div className="section-editeur">
      <BlocReglage titre="Fond">
        <div className="grille-vignettes vignettes-fonds">
          {FONDS.map((f) => (
            <Vignette
              key={f}
              libelle={NOMS_FONDS[f]}
              actif={decor.fond === f}
              onClick={() => modifierDecor({ fond: f })}
            >
              <Fond fond={f} couleurUnie={decor.couleurUnie} anime={false} />
            </Vignette>
          ))}
        </div>
        {decor.fond === 'uni' && (
          <div className="nuancier nuancier-uni" role="radiogroup" aria-label="Couleur du fond">
            {COULEURS_UNIES.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={decor.couleurUnie === c}
                aria-label={`Couleur ${c}`}
                className={`nuance${decor.couleurUnie === c ? ' active' : ''}`}
                style={{ background: c }}
                onClick={() => modifierDecor({ couleurUnie: c })}
              />
            ))}
            <label className="nuance nuance-libre" title="Autre couleur">
              <input
                type="color"
                value={decor.couleurUnie}
                onChange={(e) => modifierDecor({ couleurUnie: e.target.value })}
                aria-label="Choisir une autre couleur"
              />
            </label>
          </div>
        )}
        <Interrupteur
          libelle="Nuages qui bougent"
          description="Très lents, pour un décor vivant mais calme."
          actif={decor.animationsFond}
          onChange={(v) => modifierDecor({ animationsFond: v })}
        />
      </BlocReglage>

      <BlocReglage titre="Route">
        <div className="grille-vignettes vignettes-routes">
          {ROUTES.map((r) => (
            <Vignette
              key={r}
              libelle={NOMS_ROUTES[r]}
              actif={decor.route === r}
              onClick={() => modifierDecor({ route: r })}
            >
              <span className="vignette-route-fond">
                <BandeRoute style={r} largeur={220} hauteur={58} />
              </span>
            </Vignette>
          ))}
        </div>
      </BlocReglage>

      <BlocReglage titre="Véhicules">
        <Interrupteur
          libelle="Le même véhicule sur toutes les routes"
          actif={decor.memeVehicule}
          onChange={(v) => modifierDecor({ memeVehicule: v })}
        />
        {Array.from({ length: nbChoix }, (_, i) => {
          const v = decor.vehicules[i] ?? { type: 'citadine' as const, couleur: 'rouge' as const };
          return (
            <div key={i} className="choix-vehicule">
              {nbChoix > 1 && <p className="choix-vehicule-titre">Route {i + 1}</p>}
              <div className="grille-vignettes vignettes-vehicules">
                {VEHICULES.map((type) => (
                  <Vignette
                    key={type}
                    libelle={CATALOGUE[type].nom}
                    actif={v.type === type}
                    onClick={() => changerVehicule(i, { type })}
                  >
                    <Vehicule type={type} couleur={v.couleur} yeux={decor.yeux} />
                  </Vignette>
                ))}
              </div>
              <ChoixCouleur
                libelle={`Couleur du véhicule de la route ${i + 1}`}
                valeur={v.couleur}
                onChange={(couleur) => changerVehicule(i, { couleur })}
              />
            </div>
          );
        })}
        <Interrupteur
          libelle="Des yeux rigolos"
          description="Les véhicules ont des yeux expressifs."
          actif={decor.yeux}
          onChange={(v) => modifierDecor({ yeux: v })}
        />
      </BlocReglage>
    </div>
  );
}
