/**
 * Bruitages doux générés avec la Web Audio API : aucun fichier audio.
 * Le contexte audio n'est créé qu'après un geste (règle des navigateurs).
 */

let contexte: AudioContext | null = null;
let sortie: GainNode | null = null;

function obtenirContexte(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
  if (!contexte) {
    contexte = new AudioContext();
    sortie = contexte.createGain();
    sortie.gain.value = 0.55; // volume général modéré
    sortie.connect(contexte.destination);
  }
  return contexte;
}

/** À appeler lors d'un appui : débloque le son sur les navigateurs mobiles. */
export function debloquerAudio(): void {
  const ctx = obtenirContexte();
  if (ctx && ctx.state === 'suspended') void ctx.resume();
}

/** Petit « ding » cristallin au moment de la fusion. */
export function jouerDing(): void {
  const ctx = obtenirContexte();
  if (!ctx || !sortie) return;
  const t = ctx.currentTime;
  const notes: [number, number][] = [
    [783.99, 0.16], // sol
    [1174.66, 0.09], // ré, une quinte au-dessus
  ];
  for (const [frequence, volume] of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = frequence;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.75);
    osc.connect(gain).connect(sortie);
    osc.start(t);
    osc.stop(t + 0.8);
  }
}

/** Ronron de moteur : un par route, son intensité suit la vitesse. */
export class Moteur {
  private osc: OscillatorNode | null = null;
  private gain: GainNode | null = null;
  private filtre: BiquadFilterNode | null = null;

  demarrer(): void {
    const ctx = obtenirContexte();
    if (!ctx || !sortie || this.osc) return;
    this.osc = ctx.createOscillator();
    this.osc.type = 'sawtooth';
    this.osc.frequency.value = 48;
    this.filtre = ctx.createBiquadFilter();
    this.filtre.type = 'lowpass';
    this.filtre.frequency.value = 260;
    this.gain = ctx.createGain();
    this.gain.gain.value = 0;
    this.osc.connect(this.filtre).connect(this.gain).connect(sortie);
    this.osc.start();
  }

  /** `intensite` entre 0 (arrêt) et 1 (vitesse élevée). */
  regler(intensite: number): void {
    const ctx = contexte;
    if (!ctx || !this.osc || !this.gain || !this.filtre) return;
    const i = Math.max(0, Math.min(1, intensite));
    const t = ctx.currentTime;
    this.gain.gain.setTargetAtTime(0.012 + i * 0.05, t, 0.08);
    this.osc.frequency.setTargetAtTime(46 + i * 40, t, 0.1);
    this.filtre.frequency.setTargetAtTime(240 + i * 360, t, 0.1);
  }

  arreter(): void {
    const ctx = contexte;
    if (!ctx || !this.osc || !this.gain) return;
    const osc = this.osc;
    this.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
    osc.stop(ctx.currentTime + 0.4);
    this.osc = null;
    this.gain = null;
    this.filtre = null;
  }
}
