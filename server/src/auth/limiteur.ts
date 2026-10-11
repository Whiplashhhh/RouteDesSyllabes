export interface OptionsLimiteur {
  /** Nombre d'échecs à partir duquel on impose un délai. */
  seuil: number;
  /** Durée sans échec au bout de laquelle le compteur repart de zéro. */
  fenetreMs: number;
  /** Délai imposé au premier dépassement, doublé à chaque échec suivant. */
  delaiInitialMs: number;
  delaiMaxMs: number;
  /** Nombre maximal de clés suivies (protection mémoire). */
  clesMax?: number;
  maintenant?: () => number;
}

interface Entree {
  echecs: number;
  dernierEchec: number;
  bloqueJusqua: number;
}

/**
 * Limiteur de tentatives en mémoire (par IP ou par email) avec délai
 * exponentiel plafonné. Suffisant pour une instance unique.
 */
export class LimiteurTentatives {
  private readonly entrees = new Map<string, Entree>();
  private readonly maintenant: () => number;
  private readonly clesMax: number;

  constructor(private readonly options: OptionsLimiteur) {
    this.maintenant = options.maintenant ?? Date.now;
    this.clesMax = options.clesMax ?? 10_000;
  }

  /** Temps d'attente restant (en ms) avant une nouvelle tentative, 0 si autorisée. */
  attenteRestante(cle: string): number {
    const entree = this.entreeActive(cle);
    return entree ? Math.max(0, entree.bloqueJusqua - this.maintenant()) : 0;
  }

  enregistrerEchec(cle: string): void {
    const maintenant = this.maintenant();
    const entree = this.entreeActive(cle) ?? { echecs: 0, dernierEchec: 0, bloqueJusqua: 0 };
    entree.echecs += 1;
    entree.dernierEchec = maintenant;
    if (entree.echecs >= this.options.seuil) {
      const delai = this.options.delaiInitialMs * 2 ** (entree.echecs - this.options.seuil);
      entree.bloqueJusqua = maintenant + Math.min(delai, this.options.delaiMaxMs);
    }
    this.entrees.delete(cle); // réinsertion : l'ordre de la Map suit l'activité récente
    this.entrees.set(cle, entree);
    this.limiterTaille();
  }

  reinitialiser(cle: string): void {
    this.entrees.delete(cle);
  }

  /** Oublie les clés inactives depuis plus d'une fenêtre. */
  nettoyer(): void {
    for (const cle of this.entrees.keys()) this.entreeActive(cle);
  }

  get taille(): number {
    return this.entrees.size;
  }

  private entreeActive(cle: string): Entree | undefined {
    const entree = this.entrees.get(cle);
    if (!entree) return undefined;
    const maintenant = this.maintenant();
    const expiree =
      entree.bloqueJusqua <= maintenant &&
      maintenant - entree.dernierEchec > this.options.fenetreMs;
    if (expiree) {
      this.entrees.delete(cle);
      return undefined;
    }
    return entree;
  }

  private limiterTaille(): void {
    if (this.entrees.size <= this.clesMax) return;
    this.nettoyer();
    for (const cle of this.entrees.keys()) {
      if (this.entrees.size <= this.clesMax) break;
      this.entrees.delete(cle);
    }
  }
}
