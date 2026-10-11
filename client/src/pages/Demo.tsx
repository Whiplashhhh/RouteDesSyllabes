import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  COULEURS,
  FONDS,
  ROUTES,
  VEHICULES,
  configParDefaut,
  type CouleurId,
  type FondId,
  type RouteStyleId,
  type SeanceConfig,
  type VehiculeId,
} from '../../../shared/seance';
import { EcranJeu } from '../game/EcranJeu';

function choisir<T extends string>(liste: readonly T[], valeur: string | null, defaut: T): T {
  return valeur && (liste as readonly string[]).includes(valeur) ? (valeur as T) : defaut;
}

/**
 * « Jouer sans compte » : une séance par défaut, non modifiable.
 * Quelques paramètres d'URL facultatifs permettent de varier la démonstration
 * (ex. `/demo?routes=4&fond=nuit&route=rails&vehicule=train`).
 */
export function Demo() {
  const [params] = useSearchParams();
  const naviguer = useNavigate();
  const config = useMemo<SeanceConfig>(() => {
    const c = configParDefaut();
    const n = Number(params.get('routes'));
    if (n >= 1 && n <= 4) c.nbRoutes = n;
    const v = Number(params.get('voyelles'));
    if (v >= 1 && v <= 3) c.voyellesParRoute = v;
    c.decor.fond = choisir<FondId>(FONDS, params.get('fond'), c.decor.fond);
    c.decor.route = choisir<RouteStyleId>(ROUTES, params.get('route'), c.decor.route);
    const vehicule = params.get('vehicule');
    if (vehicule) {
      c.decor.memeVehicule = true;
      c.decor.vehicules[0] = {
        type: choisir<VehiculeId>(VEHICULES, vehicule, 'citadine'),
        couleur: choisir<CouleurId>(COULEURS, params.get('couleur'), 'rouge'),
      };
    }
    if (params.get('majuscules') === '1') c.police = 'script-majuscule';
    if (params.get('cursive') === '1') c.police = 'cursive';
    if (params.get('fete') === '1') c.retours.fete = true;
    if (params.get('retour') === '1') c.retours.retourAuto = true;
    const lettres = params.get('lettres');
    if (lettres) {
      // Format : « l,m,r:a,i,o »
      const [cons, voy] = lettres.split(':');
      if (cons) c.consonnes = cons.split(',').filter(Boolean);
      if (voy) c.voyelles = voy.split(',').filter(Boolean);
    }
    return c;
  }, [params]);

  return <EcranJeu nom="Démonstration" config={config} onQuitter={() => naviguer('/')} />;
}
