import type { RouteFixe, SeanceConfig } from '../../../../shared/seance';
import { BlocReglage, Pastille, Segments } from './Controles';

interface Props {
  config: SeanceConfig;
  modifier: (maj: Partial<SeanceConfig>) => void;
}

/** Petite illustration : N routes empilées. */
function IconeRoutes({ n }: { n: number }) {
  return (
    <svg viewBox="0 0 40 32" width={44} height={36} aria-hidden>
      {Array.from({ length: n }, (_, i) => {
        const h = 32 / n;
        return (
          <rect
            key={i}
            x={2}
            y={i * h + h * 0.3}
            width={36}
            height={h * 0.45}
            rx={h * 0.2}
            fill="currentColor"
            opacity={0.85}
          />
        );
      })}
    </svg>
  );
}

/** Règles : nombre de routes, voyelles par route, police, tirage. */
export function SectionRegles({ config, modifier }: Props) {
  const routesFixes: RouteFixe[] = Array.from(
    { length: config.nbRoutes },
    (_, i) => config.routesFixes[i] ?? { consonne: config.consonnes[0] ?? 'l', voyelles: [] },
  );

  const changerRouteFixe = (i: number, maj: Partial<RouteFixe>) => {
    const liste = [...routesFixes];
    liste[i] = { ...(liste[i] as RouteFixe), ...maj };
    // On conserve les routes au-delà du nombre actuel (si la maîtresse en rajoute).
    modifier({ routesFixes: [...liste, ...config.routesFixes.slice(liste.length)] });
  };

  return (
    <div className="section-editeur">
      <BlocReglage titre="Nombre de routes">
        <Segments
          libelle="Nombre de routes"
          valeur={config.nbRoutes}
          onChange={(nbRoutes) => modifier({ nbRoutes })}
          options={[1, 2, 3, 4].map((n) => ({
            valeur: n,
            aria: `${n} route${n > 1 ? 's' : ''}`,
            libelle: (
              <span className="segment-illustre">
                <IconeRoutes n={n} />
                <span>{n}</span>
              </span>
            ),
          }))}
        />
      </BlocReglage>

      <BlocReglage
        titre="Voyelles par route"
        aide="Peu de voyelles à la fois : les enfants ne sont pas submergés."
      >
        <Segments
          libelle="Voyelles par route"
          valeur={config.voyellesParRoute}
          onChange={(voyellesParRoute) => modifier({ voyellesParRoute })}
          options={[1, 2, 3].map((n) => ({
            valeur: n,
            aria: `${n} voyelle${n > 1 ? 's' : ''}`,
            libelle: (
              <span className="segment-illustre">
                <span className="points-voyelles" aria-hidden>
                  {Array.from({ length: n }, (_, i) => (
                    <span key={i} />
                  ))}
                </span>
                <span>{n}</span>
              </span>
            ),
          }))}
        />
      </BlocReglage>

      <BlocReglage titre="Écriture des lettres">
        <Segments
          libelle="Écriture des lettres"
          valeur={config.police}
          onChange={(police) => modifier({ police })}
          options={[
            {
              valeur: 'script-minuscule',
              aria: 'Script minuscule',
              libelle: (
                <span className="segment-police">
                  <span className="segment-police-exemple">la</span>
                  <span>Minuscules</span>
                </span>
              ),
            },
            {
              valeur: 'script-majuscule',
              aria: 'Script majuscule',
              libelle: (
                <span className="segment-police">
                  <span className="segment-police-exemple">LA</span>
                  <span>Majuscules</span>
                </span>
              ),
            },
            {
              valeur: 'cursive',
              aria: 'Cursive',
              libelle: (
                <span className="segment-police">
                  <span className="segment-police-exemple cursive">la</span>
                  <span>Cursive</span>
                </span>
              ),
            },
          ]}
        />
      </BlocReglage>

      <BlocReglage
        titre="Tirage des lettres"
        aide={
          config.tirage === 'aleatoire'
            ? 'À chaque « Nouvelles lettres », le jeu pioche dans vos lettres.'
            : 'Vous décidez précisément ce qu’il y a sur chaque route.'
        }
      >
        <Segments
          libelle="Tirage des lettres"
          valeur={config.tirage}
          onChange={(tirage) => modifier({ tirage })}
          options={[
            { valeur: 'aleatoire', libelle: 'Au hasard' },
            { valeur: 'fixe', libelle: 'Ordre fixe' },
          ]}
        />
        {config.tirage === 'fixe' && (
          <div className="routes-fixes">
            {routesFixes.map((r, i) => (
              <div key={i} className="route-fixe">
                <p className="route-fixe-titre">Route {i + 1}</p>
                <div className="route-fixe-ligne">
                  <span className="route-fixe-etiquette">Consonne</span>
                  <div className="clavier-pastilles compact">
                    {config.consonnes.map((c) => (
                      <Pastille
                        key={c}
                        texte={c}
                        actif={r.consonne === c}
                        onClick={() => changerRouteFixe(i, { consonne: c })}
                      />
                    ))}
                  </div>
                </div>
                <div className="route-fixe-ligne">
                  <span className="route-fixe-etiquette">Voyelles</span>
                  <div className="clavier-pastilles compact">
                    {config.voyelles.map((v) => {
                      const actif = r.voyelles.includes(v);
                      const plein = !actif && r.voyelles.length >= config.voyellesParRoute;
                      return (
                        <Pastille
                          key={v}
                          texte={v}
                          type="voyelle"
                          actif={actif}
                          desactive={plein}
                          onClick={() =>
                            changerRouteFixe(i, {
                              voyelles: actif
                                ? r.voyelles.filter((x) => x !== v)
                                : [...r.voyelles, v],
                            })
                          }
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </BlocReglage>
    </div>
  );
}
