/** Petites icônes dessinées à la main (trait arrondi), sans librairie externe. */
import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { taille?: number };

function Base({ taille = 24, children, ...reste }: P) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...reste}
    >
      {children}
    </svg>
  );
}

export const IconeJouer = (p: P) => (
  <Base {...p}>
    <path
      d="M8 5.5v13a1 1 0 0 0 1.5.86l10.2-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z"
      fill="currentColor"
    />
  </Base>
);

export const IconeMelanger = (p: P) => (
  <Base {...p}>
    <path d="M3 7h3.5c2 0 3.2 1 4.3 2.6l2.4 3.8c1 1.6 2.3 2.6 4.3 2.6H21" />
    <path d="M3 17h3.5c1.4 0 2.4-.5 3.2-1.3M14.3 8.3C15.1 7.5 16.1 7 17.5 7H21" />
    <path d="m18 4 3 3-3 3M18 14l3 3-3 3" />
  </Base>
);

export const IconeDepart = (p: P) => (
  <Base {...p}>
    <path d="M5 21V4" />
    <path d="M5 4h11l-2 3.5L16 11H5" fill="currentColor" fillOpacity={0.18} />
    <path d="M21 17h-9m3-3-3 3 3 3" />
  </Base>
);

export const IconeSuivante = (p: P) => (
  <Base {...p}>
    <path d="M5 5.5v13l9-6.5-9-6.5Z" fill="currentColor" fillOpacity={0.18} />
    <path d="M18 5v14" />
  </Base>
);

export const IconeGrille = (p: P) => (
  <Base {...p}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
  </Base>
);

export const IconeQuitter = (p: P) => (
  <Base {...p}>
    <path d="M14 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
    <path d="M10 16 6 12l4-4M6 12h10" />
  </Base>
);

export const IconeFermer = (p: P) => (
  <Base {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Base>
);

export const IconeCrayon = (p: P) => (
  <Base {...p}>
    <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" />
    <path d="m13.5 6.5 4 4" />
  </Base>
);

export const IconeCopier = (p: P) => (
  <Base {...p}>
    <rect x="8" y="8" width="12" height="12" rx="3" />
    <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
  </Base>
);

export const IconePoubelle = (p: P) => (
  <Base {...p}>
    <path d="M4 7h16M10 11v6M14 11v6" />
    <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
  </Base>
);

export const IconePlus = (p: P) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
);

export const IconeRetour = (p: P) => (
  <Base {...p}>
    <path d="M15 18 9 12l6-6" />
  </Base>
);

export const IconeCoche = (p: P) => (
  <Base {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Base>
);

export const IconeSon = (p: P) => (
  <Base {...p}>
    <path d="M4 9.5v5h3.5L12 19V5L7.5 9.5H4Z" fill="currentColor" fillOpacity={0.18} />
    <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
  </Base>
);

export const IconeEngrenage = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2.8v2.4M12 18.8v2.4M4.2 7.5l2.1 1.2M17.7 15.3l2.1 1.2M4.2 16.5l2.1-1.2M17.7 8.7l2.1-1.2" />
    <circle cx="12" cy="12" r="6.6" />
  </Base>
);

export const IconeVague = (p: P) => (
  <Base {...p}>
    <path d="M2 13c2.5 0 2.5-3 5-3s2.5 3 5 3 2.5-3 5-3 2.5 3 5 3" />
  </Base>
);

export const IconeDeconnexion = IconeQuitter;
