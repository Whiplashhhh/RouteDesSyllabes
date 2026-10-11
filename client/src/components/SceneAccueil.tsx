import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { BandeRoute } from '../game/decor/BandeRoute';
import { Fond } from '../game/decor/Fond';
import { VEHICULE_VB } from '../game/geometrie';
import { Vehicule } from '../game/vehicules/Vehicule';

const SYLLABES: [string, string][] = [
  ['l', 'a'],
  ['m', 'i'],
  ['r', 'o'],
  ['ch', 'a'],
  ['s', 'u'],
  ['f', 'é'],
];

const easeOut = (t: number) => 1 - (1 - t) ** 3;
const easeIn = (t: number) => t * t;

/**
 * Petite scène animée de la page de connexion : une voiture roule en boucle
 * et forme des syllabes. Purement décorative.
 */
export function SceneAccueil() {
  const hoteRef = useRef<HTMLDivElement>(null);
  const rigRef = useRef<HTMLDivElement>(null);
  const voyelleRef = useRef<HTMLDivElement>(null);
  const consonneRef = useRef<HTMLDivElement>(null);
  const [taille, setTaille] = useState({ l: 1200, h: 800 });
  const [indice, setIndice] = useState(0);

  useLayoutEffect(() => {
    const el = hoteRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      setTaille({ l: el.clientWidth, h: el.clientHeight });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const carH = Math.max(70, Math.min(taille.h * 0.15, taille.l * 0.12, 170));
  const carL = (carH * VEHICULE_VB.largeur) / VEHICULE_VB.hauteur;
  const police = carH * 0.5;
  const etiquetteH = police * 1.24;
  const sol = taille.h * 0.93;
  const routeH = carH * 0.6;
  const [consonne, voyelle] = SYLLABES[indice % SYLLABES.length] ?? ['l', 'a'];

  useEffect(() => {
    const reduit = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const rig = rigRef.current;
    const voy = voyelleRef.current;
    const cons = consonneRef.current;
    if (!rig || !voy || !cons) return;

    const largeurConsonne = (cons.firstElementChild as HTMLElement).offsetWidth;
    const maison = taille.l * 0.6;
    const departX = -carL - largeurConsonne - 40;
    const contactX = maison - carL * 0.965 - largeurConsonne;
    const finX = taille.l + 60;
    const placer = (x: number, collee: boolean) => {
      rig.style.transform = `translate3d(${x}px,0,0)`;
      const front = x + carL * 0.965 + largeurConsonne;
      voy.style.transform = `translate3d(${collee ? front - 1 : maison}px,0,0)`;
      voy.classList.toggle('soudee', collee);
      cons.classList.toggle('soudee', collee);
      rig.querySelectorAll<SVGGElement>('.roue').forEach((roue) => {
        const r = Number(roue.dataset.r) * (carH / VEHICULE_VB.hauteur);
        roue.style.transform = `rotate(${((x / r) * 180) / Math.PI}deg)`;
      });
    };

    if (reduit) {
      placer(contactX, true);
      return;
    }

    let raf = 0;
    const debut = performance.now();
    const A = 2600; // arrivée
    const B = 1300; // pause sur la syllabe
    const C = 1900; // départ avec la syllabe
    const pas = (t: number) => {
      const e = t - debut;
      if (e < A) placer(departX + (contactX - departX) * easeOut(e / A), false);
      else if (e < A + B) {
        placer(contactX, true);
      } else if (e < A + B + C) {
        placer(contactX + (finX - contactX) * easeIn((e - A - B) / C), true);
      } else {
        setIndice((i) => i + 1);
        return;
      }
      raf = requestAnimationFrame(pas);
    };
    raf = requestAnimationFrame(pas);
    const rebond = window.setTimeout(() => {
      const anim = [
        { transform: 'scale(1)', backgroundColor: '#fff' },
        { transform: 'scale(1.18)', backgroundColor: '#ffe27a', offset: 0.35 },
        { transform: 'scale(1)', backgroundColor: '#fff7d6' },
      ];
      cons.firstElementChild?.animate(anim, { duration: 650, easing: 'ease-out' });
      voy.firstElementChild?.animate(anim, { duration: 650, easing: 'ease-out' });
    }, A + 20);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(rebond);
    };
  }, [indice, taille, carL, carH]);

  const styleEtiquette = {
    fontSize: police,
    height: etiquetteH,
    lineHeight: `${etiquetteH}px`,
    fontFamily: 'Andika, sans-serif',
    paddingInline: police * 0.24,
    minWidth: etiquetteH * 0.86,
    '--rayon-etiquette': `${police * 0.3}px`,
  } as CSSProperties;

  const haut = sol - carH * (VEHICULE_VB.sol / VEHICULE_VB.hauteur);

  return (
    <div ref={hoteRef} className="scene-accueil" aria-hidden>
      <Fond fond="campagne" couleurUnie="#fff" anime />
      <div className="scene-accueil-route" style={{ top: sol - routeH * 0.7 }}>
        <BandeRoute style="goudron" largeur={taille.l} hauteur={routeH} />
      </div>
      <div
        ref={voyelleRef}
        key={`v${indice}`}
        className="porte-etiquette voyelle scene-accueil-voyelle"
        style={{ top: sol - carH * 0.06 - etiquetteH }}
      >
        <div className="etiquette" style={styleEtiquette}>
          <span className="lettres">{voyelle}</span>
        </div>
      </div>
      <div
        ref={rigRef}
        className="vehicule-rig"
        style={{ width: carL, height: carH, top: haut, transform: 'translate3d(-400px,0,0)' }}
      >
        <Vehicule type="citadine" couleur="corail" className="vehicule-svg" />
        <div
          ref={consonneRef}
          className="porte-etiquette consonne"
          style={{
            left: carL * 0.965,
            top: carH * (VEHICULE_VB.sol / VEHICULE_VB.hauteur - 0.06) - etiquetteH,
          }}
        >
          <div className="etiquette" style={styleEtiquette}>
            <span className="lettres">{consonne}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
