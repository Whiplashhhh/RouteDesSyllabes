import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { PoliceId, Retours, RouteStyleId, VehiculeRoute } from '../../../shared/seance';
import { syllabe, type RouteTiree } from '../../../shared/tirage';
import { BandeRoute } from './decor/BandeRoute';
import { VEHICULE_VB, placerVoyelles, type GeometrieRoute } from './geometrie';
import { afficher, cadreEtiquettes, police } from './polices';
import { Moteur, debloquerAudio, jouerDing } from './retours/sons';
import { direSyllabe } from './retours/voix';
import { CATALOGUE } from './vehicules/catalogue';
import { Vehicule } from './vehicules/Vehicule';

export interface PropsCouloir {
  index: number;
  largeur: number;
  geo: GeometrieRoute;
  route: RouteTiree;
  /** Variations d'espacement des voyelles (stables pour un tirage). */
  variations: number[];
  /** Change à chaque nouveau tirage : déclenche l'animation de départ/arrivée. */
  generation: number;
  /** Change quand la maîtresse demande « Remettre au départ ». */
  jetonDepart: number;
  vehicule: VehiculeRoute;
  yeux: boolean;
  styleRoute: RouteStyleId;
  police: PoliceId;
  retours: Retours;
  reduit: boolean;
  interactif: boolean;
}

type EtatVoyelle = { collee: boolean; armee: boolean };

const ETOILES = ['#ffd23f', '#ff8a65', '#5cc97a', '#4ea8f2', '#a37ff0', '#f58ab5'];

/** Estimation de la largeur d'une étiquette avant mesure réelle. */
function estimerLargeur(texte: string, taille: number): number {
  return Math.max(taille * 1.1, taille * (0.56 * texte.length + 0.5));
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}
function easeOut(t: number) {
  return 1 - (1 - t) ** 3;
}
function easeIn(t: number) {
  return t * t * t;
}
function easeOutBack(t: number) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
}

/**
 * Un couloir : une route, un véhicule qui porte une consonne, et quelques voyelles.
 *
 * Le déplacement est piloté de façon impérative (transform translate3d sur des refs)
 * pour rester fluide à 60 images/s sans aucun rendu React pendant le glisser.
 */
export function Couloir(props: PropsCouloir) {
  const { geo, largeur, interactif } = props;
  const [affichee, setAffichee] = useState<{
    route: RouteTiree;
    variations: number[];
    n: number;
  }>({ route: props.route, variations: props.variations, n: 0 });
  const [largeurs, setLargeurs] = useState<{ consonne: number; voyelles: number[] } | null>(null);

  const couloirRef = useRef<HTMLDivElement>(null);
  const rigRef = useRef<HTMLDivElement>(null);
  const inclinaisonRef = useRef<HTMLDivElement>(null);
  const suspensionRef = useRef<HTMLDivElement>(null);
  const consonneRef = useRef<HTMLDivElement>(null);
  const voyellesRef = useRef<(HTMLDivElement | null)[]>([]);
  const tracesRef = useRef<HTMLDivElement>(null);

  const p = police(props.police);
  const texteConsonne = afficher(affichee.route.consonne, props.police);
  const textesVoyelles = affichee.route.voyelles.map((v) => afficher(v, props.police));

  const cleVoyelles = textesVoyelles.join(',');
  const largeurConsonne = largeurs?.consonne ?? estimerLargeur(texteConsonne, geo.taillePolice);
  const largeursVoyelles = textesVoyelles.map(
    (t, i) => largeurs?.voyelles[i] ?? estimerLargeur(t, geo.taillePolice),
  );
  const positions = useMemo(
    () => placerVoyelles(largeur, geo, largeurConsonne, largeursVoyelles, affichee.variations),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [largeur, geo, largeurConsonne, largeursVoyelles.join(','), affichee.variations],
  );

  // Toutes les étiquettes de la route partagent un cadre, posé sur la même ligne.
  const cadre = cadreEtiquettes(
    p,
    [texteConsonne, ...textesVoyelles],
    geo.taillePolice,
    geo.etiquetteH,
  );
  const etiquetteHaut = geo.etiquetteHaut + geo.etiquetteH - cadre.hauteur;

  const echelle = geo.vehiculeH / VEHICULE_VB.hauteur;
  const rigHaut = geo.sol - geo.vehiculeH * (VEHICULE_VB.sol / VEHICULE_VB.hauteur);
  const def = CATALOGUE[props.vehicule.type] ?? CATALOGUE.citadine;

  // Paramètres courants, lus par les gestionnaires impératifs.
  const params = {
    ...props,
    largeurConsonne,
    positions,
    largeursVoyelles,
    rigHaut,
    etiquetteHaut,
    cadre,
    echelle,
    def,
    route: affichee.route,
  };
  const paramsRef = useRef(params);
  paramsRef.current = params;

  // État mutable du véhicule (hors React).
  const etat = useRef({
    x: geo.departX,
    pointeur: null as number | null,
    decalage: 0,
    dernierX: 0,
    dernierT: 0,
    vitesse: 0,
    angle: 0,
    voyelles: [] as EtatVoyelle[],
    derniereTrace: -Infinity,
    derniereFumee: 0,
    syllabeFaite: false,
    anim: 0,
    veille: 0 as ReturnType<typeof setTimeout> | 0,
    retour: 0 as ReturnType<typeof setTimeout> | 0,
    moteur: new Moteur(),
    traceSuivante: 0,
  });

  // Mesure réelle des étiquettes (après chargement des polices).
  useLayoutEffect(() => {
    let annule = false;
    const mesurer = () => {
      if (annule) return;
      const c = consonneRef.current?.firstElementChild as HTMLElement | null;
      const v = voyellesRef.current.map(
        (el) => (el?.firstElementChild as HTMLElement | null)?.offsetWidth ?? 0,
      );
      if (!c) return;
      const mesure = { consonne: c.offsetWidth, voyelles: v };
      setLargeurs((avant) =>
        avant &&
        Math.abs(avant.consonne - mesure.consonne) < 1 &&
        avant.voyelles.join() === mesure.voyelles.join()
          ? avant
          : mesure,
      );
    };
    mesurer();
    void document.fonts?.ready.then(mesurer);
    return () => {
      annule = true;
    };
  }, [texteConsonne, cleVoyelles, geo.taillePolice, props.police]);

  // --- Fonctions impératives ---------------------------------------------

  const api = useMemo(() => {
    const e = etat.current;
    const P = () => paramsRef.current;

    const elastique = (d: number) => {
      const t = P().geo.taillePolice;
      return t * 0.45 * (1 - 1 / (1 + d / (t * 1.2)));
    };

    const bornes = () => {
      const q = P();
      return {
        min: q.geo.departX * 0.4,
        max: q.largeur - q.geo.margeDroite - q.geo.etiquetteX - q.largeurConsonne,
      };
    };

    const placerVoyelle = (i: number, x: number, transition?: string) => {
      const el = voyellesRef.current[i];
      if (!el) return;
      el.style.transition = transition ?? 'none';
      el.style.transform = `translate3d(${x}px, 0, 0)`;
    };

    const consonneInterieur = () => consonneRef.current?.firstElementChild as HTMLElement | null;

    const feter = (x: number) => {
      const q = P();
      const hote = couloirRef.current;
      if (!hote) return;
      const y = q.etiquetteHaut + q.cadre.hauteur * 0.5;
      for (let k = 0; k < 8; k++) {
        const s = document.createElement('div');
        s.className = 'etoile-fete';
        const taille = q.geo.taillePolice * (0.16 + (k % 3) * 0.05);
        s.style.width = `${taille}px`;
        s.style.height = `${taille}px`;
        s.style.background = ETOILES[k % ETOILES.length] as string;
        s.style.left = `${x - taille / 2}px`;
        s.style.top = `${y - taille / 2}px`;
        hote.appendChild(s);
        const angle = -Math.PI / 2 + ((k - 3.5) / 8) * Math.PI * 1.6;
        const distance = q.geo.taillePolice * (0.9 + (k % 2) * 0.5);
        const anim = s.animate(
          [
            { transform: 'translate(0,0) scale(0.3) rotate(0deg)', opacity: 1 },
            {
              transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(1) rotate(${120 + k * 20}deg)`,
              opacity: 1,
              offset: 0.6,
            },
            {
              transform: `translate(${Math.cos(angle) * distance * 1.15}px, ${Math.sin(angle) * distance * 1.15 + taille}px) scale(0.6) rotate(${180 + k * 20}deg)`,
              opacity: 0,
            },
          ],
          { duration: 850, easing: 'cubic-bezier(.2,.7,.3,1)' },
        );
        anim.onfinish = () => s.remove();
      }
    };

    const coller = (i: number, front: number) => {
      const q = P();
      const v = e.voyelles[i];
      if (!v) return;
      // Une seule voyelle collée à la fois.
      e.voyelles.forEach((autre, j) => {
        if (j !== i && autre.collee) decoller(j);
      });
      v.collee = true;
      v.armee = false;
      e.syllabeFaite = true;
      placerVoyelle(i, front - 1, 'transform 130ms ease-out');
      const el = voyellesRef.current[i];
      el?.classList.add('soudee');
      consonneRef.current?.classList.add('soudee');
      const voyelle = q.route.voyelles[i];
      const lie = el?.querySelector<HTMLElement>('.syllabe-liee');
      const lettresConsonne = consonneInterieur()?.querySelector<HTMLElement>('.lettres');
      if (police(q.police).liee && el && lie && lettresConsonne && voyelle) {
        // Écriture liée : la syllabe entière, d'un trait. La consonne reste à sa place
        // et l'étiquette de la voyelle se resserre juste après la syllabe.
        const debut = lettresConsonne.offsetLeft - q.largeurConsonne;
        lie.textContent = afficher(syllabe(q.route.consonne, voyelle), q.police);
        lie.style.left = `${debut}px`;
        const marge = q.geo.taillePolice * 0.24;
        const largeur = Math.max(marge, debut + lie.offsetWidth + marge);
        el.style.setProperty('--largeur-liee', `${largeur}px`);
        el.classList.add('liee');
        consonneRef.current?.classList.add('liee');
      }

      if (q.retours.fusion) {
        const eclat = [
          { transform: 'scale(1)', backgroundColor: '#ffffff' },
          {
            transform: q.reduit ? 'scale(1)' : 'scale(1.2)',
            backgroundColor: '#ffe27a',
            offset: 0.3,
          },
          { transform: 'scale(1)', backgroundColor: '#fff7d6' },
        ];
        const opts = { duration: 620, easing: 'cubic-bezier(.3,1.4,.5,1)' };
        consonneInterieur()?.animate(eclat, opts);
        (el?.firstElementChild as HTMLElement | null)?.animate(eclat, opts);
      }
      if (q.retours.fete && !q.reduit) feter(front);
      if (q.retours.bruitages) jouerDing();
      if (q.retours.voix && voyelle) direSyllabe(syllabe(q.route.consonne, voyelle));
    };

    const decoller = (i: number) => {
      const q = P();
      const v = e.voyelles[i];
      if (!v || !v.collee) return;
      v.collee = false;
      voyellesRef.current[i]?.classList.remove('soudee', 'liee');
      if (!e.voyelles.some((x) => x.collee))
        consonneRef.current?.classList.remove('soudee', 'liee');
      const retour = q.reduit
        ? 'transform 200ms ease-out'
        : 'transform 480ms cubic-bezier(.34,1.56,.64,1)';
      placerVoyelle(i, q.positions[i] ?? 0, retour);
    };

    const decollerTout = () => e.voyelles.forEach((_, i) => decoller(i));

    const verifierContacts = (front: number) => {
      const q = P();
      const arriere = front - q.largeurConsonne - q.geo.etiquetteX;
      q.positions.forEach((vx, i) => {
        const v = (e.voyelles[i] ??= { collee: false, armee: true });
        // Voyelle dépassée, masquée par le véhicule : elle s'efface doucement.
        const couverte = !v.collee && front > vx + 4 && arriere < vx + (q.largeursVoyelles[i] ?? 0);
        voyellesRef.current[i]?.classList.toggle('couverte', couverte);
        if (v.collee) {
          if (front - vx > q.geo.decrochage || front < vx - q.geo.aimant * 1.6) decoller(i);
          else placerVoyelle(i, front - 1);
          return;
        }
        if (!v.armee && front < vx - q.geo.aimant * 1.6) v.armee = true;
        if (v.armee && front >= vx - q.geo.aimant) {
          coller(i, front);
          // Glissé très rapide : la voyelle est dépassée d'un coup.
          if (front - vx > q.geo.decrochage) decoller(i);
        }
      });
    };

    const tournerRoues = (x: number) => {
      const q = P();
      rigRef.current?.querySelectorAll<SVGGElement>('.roue').forEach((roue) => {
        const r = Number(roue.dataset.r) * q.echelle;
        roue.style.transform = `rotate(${((x / r) * 180) / Math.PI}deg)`;
      });
    };

    const poser = (xBrut: number, origine: 'doigt' | 'anim') => {
      const q = P();
      let x = xBrut;
      if (origine === 'doigt') {
        const { min, max } = bornes();
        if (x > max) x = max + elastique(x - max);
        else if (x < min) x = min - elastique(min - x);
      }
      e.x = x;
      if (rigRef.current) {
        rigRef.current.style.transform = `translate3d(${x}px, ${q.rigHaut}px, 0)`;
      }
      tournerRoues(x);
      if (origine === 'doigt') verifierContacts(x + q.geo.etiquetteX + q.largeurConsonne);
    };

    const arreterAnim = () => {
      if (e.anim) cancelAnimationFrame(e.anim);
      e.anim = 0;
    };

    const animer = (vers: number, duree: number, courbe: (t: number) => number) =>
      new Promise<void>((resolve) => {
        arreterAnim();
        const de = e.x;
        const debut = performance.now();
        const pas = (t: number) => {
          const k = Math.min(1, (t - debut) / duree);
          poser(de + (vers - de) * courbe(k), 'anim');
          if (k < 1) e.anim = requestAnimationFrame(pas);
          else {
            e.anim = 0;
            resolve();
          }
        };
        e.anim = requestAnimationFrame(pas);
      });

    const rebondir = () => {
      if (P().reduit) return;
      suspensionRef.current?.animate(
        [
          { transform: 'translateY(0)' },
          { transform: 'translateY(3.5%) scaleY(0.98)' },
          { transform: 'translateY(-1.5%)' },
          { transform: 'translateY(0)' },
        ],
        { duration: 460, easing: 'ease-out' },
      );
    };

    const incliner = (angle: number, transition = 'none') => {
      e.angle = angle;
      if (inclinaisonRef.current) {
        inclinaisonRef.current.style.transition = transition;
        inclinaisonRef.current.style.transform = `rotate(${angle}deg)`;
      }
    };

    const veiller = (actif: boolean) => {
      if (e.veille) clearTimeout(e.veille);
      e.veille = 0;
      rigRef.current?.classList.remove('en-veille');
      if (actif && !P().reduit) {
        e.veille = setTimeout(() => rigRef.current?.classList.add('en-veille'), 3500);
      }
    };

    const laisserTrace = (x: number) => {
      const q = P();
      const hote = tracesRef.current;
      if (!hote) return;
      const enfants = hote.children;
      const el = enfants[e.traceSuivante % enfants.length] as HTMLElement | undefined;
      e.traceSuivante++;
      if (!el) return;
      el.textContent = afficher(q.route.consonne, q.police);
      el.style.transform = `translate3d(${x}px, 0, 0)`;
      el.getAnimations().forEach((a) => a.cancel());
      el.animate([{ opacity: 0.6 }, { opacity: 0 }], {
        duration: q.reduit ? 500 : 950,
        easing: 'ease-out',
        fill: 'forwards',
      });
    };

    const fumer = (x: number) => {
      const q = P();
      const hote = couloirRef.current;
      if (!hote) return;
      const { echappement } = q.def;
      const taille = q.geo.vehiculeH * 0.16;
      const bouffee = document.createElement('div');
      bouffee.className = 'fumee';
      bouffee.style.width = `${taille}px`;
      bouffee.style.height = `${taille}px`;
      bouffee.style.left = `${x + echappement.x * q.echelle - taille / 2}px`;
      bouffee.style.top = `${q.rigHaut + echappement.y * q.echelle - taille / 2}px`;
      hote.appendChild(bouffee);
      const dx = echappement.haut ? -taille * 1.2 : -taille * 2.2;
      const dy = echappement.haut ? -taille * 2.4 : -taille * 0.8;
      const a = bouffee.animate(
        [
          { transform: 'translate(0,0) scale(0.4)', opacity: 0.75 },
          { transform: `translate(${dx}px, ${dy}px) scale(1.5)`, opacity: 0 },
        ],
        { duration: 720, easing: 'ease-out' },
      );
      a.onfinish = () => bouffee.remove();
    };

    return {
      poser,
      animer,
      arreterAnim,
      rebondir,
      incliner,
      veiller,
      laisserTrace,
      fumer,
      decollerTout,
      bornes,
      placerVoyelle,
    };
  }, []);

  // Position initiale et repositionnement au redimensionnement.
  useLayoutEffect(() => {
    const e = etat.current;
    const { min, max } = api.bornes();
    if (!e.anim) api.poser(Math.max(min, Math.min(max, e.x)), 'anim');
    positions.forEach((x, i) => {
      if (!e.voyelles[i]?.collee) api.placerVoyelle(i, x);
    });
  }, [api, positions, geo, largeur, largeurConsonne]);

  // Veille au montage.
  useEffect(() => {
    api.veiller(true);
    const e = etat.current;
    return () => {
      api.arreterAnim();
      e.moteur.arreter();
      if (e.veille) clearTimeout(e.veille);
      if (e.retour) clearTimeout(e.retour);
    };
  }, [api]);

  // --- Interaction au doigt ------------------------------------------------

  useEffect(() => {
    const el = couloirRef.current;
    if (!el || !interactif) return;
    const e = etat.current;

    const bas = (ev: PointerEvent) => {
      if (e.pointeur !== null) return; // un seul doigt par route
      const q = paramsRef.current;
      const rect = el.getBoundingClientRect();
      const px = ev.clientX - rect.left;
      const debutZone = e.x - q.geo.vehiculeL * 0.3;
      const finZone = e.x + q.geo.etiquetteX + q.largeurConsonne + q.geo.vehiculeL * 0.4;
      if (px < debutZone || px > finZone) return;
      ev.preventDefault();
      el.setPointerCapture(ev.pointerId);
      debloquerAudio();
      api.arreterAnim();
      if (e.retour) clearTimeout(e.retour);
      e.pointeur = ev.pointerId;
      e.decalage = px - e.x;
      e.dernierX = e.x;
      e.dernierT = ev.timeStamp;
      e.vitesse = 0;
      e.syllabeFaite = false;
      e.derniereTrace = e.x;
      api.veiller(false);
      api.rebondir();
      rigRef.current?.classList.add('tenu');
      if (q.retours.bruitages) e.moteur.demarrer();
    };

    const bouge = (ev: PointerEvent) => {
      if (ev.pointerId !== e.pointeur) return;
      const q = paramsRef.current;
      const rect = el.getBoundingClientRect();
      const brut = ev.clientX - rect.left - e.decalage;
      api.poser(brut, 'doigt');

      const dt = Math.max(1, ev.timeStamp - e.dernierT) / 1000;
      const v = (e.x - e.dernierX) / dt;
      const ancienne = e.vitesse;
      e.vitesse = ancienne * 0.75 + v * 0.25;
      e.dernierX = e.x;
      e.dernierT = ev.timeStamp;

      if (!q.reduit) {
        const accel = (e.vitesse - ancienne) / dt;
        const cible = Math.max(-2.5, Math.min(2.5, (-accel / (q.geo.vehiculeL * 12)) * 2.5));
        api.incliner(e.angle + (cible - e.angle) * 0.3);
      }

      const espacement = q.geo.taillePolice * 0.8;
      if (q.retours.trainee && e.x - e.derniereTrace > espacement) {
        e.derniereTrace = e.x;
        api.laisserTrace(e.x - q.geo.taillePolice * 0.7);
      } else if (e.x < e.derniereTrace) {
        e.derniereTrace = e.x;
      }

      const rapide = e.vitesse > q.geo.vehiculeL * 2.2;
      if (q.retours.fumee && !q.reduit && rapide && ev.timeStamp - e.derniereFumee > 90) {
        e.derniereFumee = ev.timeStamp;
        api.fumer(e.x);
      }
      if (q.retours.bruitages) e.moteur.regler(Math.abs(e.vitesse) / (q.geo.vehiculeL * 4));
    };

    const haut = (ev: PointerEvent) => {
      if (ev.pointerId !== e.pointeur) return;
      const q = paramsRef.current;
      e.pointeur = null;
      rigRef.current?.classList.remove('tenu');
      e.moteur.arreter();
      api.incliner(0, 'transform 380ms cubic-bezier(.34,1.56,.64,1)');
      api.rebondir();
      api.veiller(true);
      const { min, max } = api.bornes();
      if (e.x > max || e.x < min) {
        // Petit rebond élastique contre le bord.
        void api.animer(Math.max(min, Math.min(max, e.x)), 420, easeOutBack);
      }
      if (q.retours.retourAuto && e.syllabeFaite) {
        e.retour = setTimeout(() => {
          api.decollerTout();
          const d = Math.abs(e.x - paramsRef.current.geo.departX);
          void api.animer(paramsRef.current.geo.departX, Math.min(1400, 500 + d * 0.6), easeInOut);
        }, 900);
      }
    };

    el.addEventListener('pointerdown', bas);
    el.addEventListener('pointermove', bouge);
    el.addEventListener('pointerup', haut);
    el.addEventListener('pointercancel', haut);
    el.addEventListener('lostpointercapture', haut);
    return () => {
      el.removeEventListener('pointerdown', bas);
      el.removeEventListener('pointermove', bouge);
      el.removeEventListener('pointerup', haut);
      el.removeEventListener('pointercancel', haut);
      el.removeEventListener('lostpointercapture', haut);
    };
  }, [api, interactif]);

  // --- Remettre au départ ----------------------------------------------------

  const premierDepart = useRef(props.jetonDepart);
  useEffect(() => {
    if (premierDepart.current === props.jetonDepart) return;
    premierDepart.current = props.jetonDepart;
    const e = etat.current;
    api.decollerTout();
    const d = Math.abs(e.x - geo.departX);
    void api.animer(geo.departX, Math.min(1300, 450 + d * 0.5), easeInOut);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.jetonDepart, api]);

  // --- Nouvelles lettres : le véhicule part à droite et revient -------------

  const premiereGeneration = useRef(props.generation);
  const entreeEnAttente = useRef(false);
  useEffect(() => {
    if (premiereGeneration.current === props.generation) return;
    premiereGeneration.current = props.generation;
    const e = etat.current;
    const q = paramsRef.current;
    let annule = false;
    const delai = props.index * 140;
    const minuteur = setTimeout(async () => {
      api.decollerTout();
      voyellesRef.current.forEach((v) =>
        v?.firstElementChild?.animate(
          [
            { transform: 'scale(1)', opacity: 1 },
            { transform: 'scale(0.4)', opacity: 0 },
          ],
          { duration: 260, easing: 'ease-in', fill: 'forwards' },
        ),
      );
      if (q.reduit) {
        await rigRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: 220,
          fill: 'forwards',
        }).finished;
      } else {
        await api.animer(q.largeur + q.geo.vehiculeL * 0.2, 750, easeIn);
      }
      if (annule) return;
      entreeEnAttente.current = true;
      e.voyelles = [];
      setLargeurs(null);
      setAffichee((a) => ({ route: props.route, variations: props.variations, n: a.n + 1 }));
    }, delai);
    return () => {
      annule = true;
      clearTimeout(minuteur);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.generation]);

  // Après le changement de lettres : arrivée par la gauche.
  useLayoutEffect(() => {
    if (!entreeEnAttente.current) return;
    entreeEnAttente.current = false;
    const q = paramsRef.current;
    voyellesRef.current.forEach((v, i) =>
      v?.firstElementChild?.animate(
        [
          { transform: 'scale(0.3)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1 },
        ],
        {
          duration: 420,
          delay: 350 + i * 120,
          easing: 'cubic-bezier(.34,1.56,.64,1)',
          fill: 'backwards',
        },
      ),
    );
    if (q.reduit) {
      api.poser(q.geo.departX, 'anim');
      rigRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 220,
        fill: 'forwards',
      });
    } else {
      rigRef.current?.getAnimations().forEach((a) => a.cancel());
      api.poser(-(q.geo.etiquetteX + q.largeurConsonne + 20), 'anim');
      void api.animer(q.geo.departX, 900, easeOut).then(() => api.rebondir());
    }
  }, [affichee, api]);

  // --- Rendu ---------------------------------------------------------------

  const styleEtiquette = {
    fontSize: geo.taillePolice * p.taille,
    height: cadre.hauteur,
    lineHeight: `${cadre.interligne}px`,
    fontFamily: p.famille,
    fontWeight: p.graisse,
    '--rayon-etiquette': `${geo.taillePolice * 0.3}px`,
    paddingInline: geo.taillePolice * 0.24,
    minWidth: geo.etiquetteH * 0.86,
  } as CSSProperties;

  return (
    <div
      ref={couloirRef}
      className="couloir"
      data-route={props.index}
      style={{ height: geo.hauteurCouloir, top: props.index * geo.hauteurCouloir }}
    >
      <div className="couloir-route" style={{ top: geo.routeHaut }}>
        <BandeRoute style={props.styleRoute} largeur={largeur} hauteur={geo.routeH} />
      </div>

      <div ref={tracesRef} className="traces" style={{ top: etiquetteHaut }} aria-hidden>
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="trace" style={{ ...styleEtiquette, opacity: 0 }} />
        ))}
      </div>

      {textesVoyelles.map((texte, i) => (
        <div
          key={`${affichee.n}-${i}`}
          ref={(el) => {
            voyellesRef.current[i] = el;
          }}
          className="porte-etiquette voyelle"
          data-voyelle={affichee.route.voyelles[i]}
          style={{ top: etiquetteHaut, transform: `translate3d(${positions[i]}px,0,0)` }}
        >
          <div className="etiquette" style={styleEtiquette}>
            <span className="lettres">{texte}</span>
            <span className="syllabe-liee" aria-hidden />
          </div>
        </div>
      ))}

      <div
        ref={rigRef}
        className="vehicule-rig"
        data-consonne={affichee.route.consonne}
        style={{ width: geo.vehiculeL, height: geo.vehiculeH }}
      >
        <div ref={inclinaisonRef} className="inclinaison">
          <div ref={suspensionRef} className="suspension">
            <Vehicule
              type={props.vehicule.type}
              couleur={props.vehicule.couleur}
              yeux={props.yeux}
              className="vehicule-svg"
            />
          </div>
        </div>
        <div
          ref={consonneRef}
          className="porte-etiquette consonne"
          style={{ left: geo.etiquetteX, top: etiquetteHaut - rigHaut }}
        >
          <div className="etiquette" style={styleEtiquette}>
            <span className="lettres">{texteConsonne}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
