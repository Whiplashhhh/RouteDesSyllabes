import { COULEURS, FONDS, ROUTES, VEHICULES } from '../../../shared/seance';
import { BandeRoute } from '../game/decor/BandeRoute';
import { Fond } from '../game/decor/Fond';
import { Vehicule } from '../game/vehicules/Vehicule';

/** Planche de tous les éléments graphiques : utile pour la revue visuelle. */
export function Vitrine() {
  return (
    <div style={{ padding: 24, display: 'grid', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
        {VEHICULES.map((v, i) => (
          <div key={v} style={{ background: '#dcf2fb', borderRadius: 16, padding: 12 }}>
            <Vehicule
              type={v}
              couleur={COULEURS[(i * 3) % COULEURS.length] ?? 'rouge'}
              style={{ width: '100%' }}
            />
            <Vehicule
              type={v}
              couleur={COULEURS[(i * 3 + 5) % COULEURS.length] ?? 'bleu'}
              yeux={false}
              style={{ width: '60%' }}
            />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {COULEURS.map((c) => (
          <Vehicule key={c} type="citadine" couleur={c} style={{ width: 150 }} />
        ))}
      </div>
      {ROUTES.map((r) => (
        <BandeRoute key={r} style={r} largeur={1200} hauteur={110} />
      ))}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        {FONDS.map((f) => (
          <div
            key={f}
            style={{
              position: 'relative',
              aspectRatio: '16/9',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <Fond fond={f} couleurUnie="#ffe9c7" anime={false} />
          </div>
        ))}
      </div>
    </div>
  );
}
