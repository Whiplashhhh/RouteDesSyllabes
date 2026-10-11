/**
 * Lecture des syllabes par la synthèse vocale du navigateur.
 * Règle pédagogique : on ne fait jamais prononcer une consonne seule
 * (« l » serait lu « elle ») — uniquement des syllabes complètes.
 */

let voixChoisie: SpeechSynthesisVoice | null | undefined;

const NOMS_PREFERES = [
  'natural',
  'neural',
  'google',
  'amélie',
  'amelie',
  'audrey',
  'marie',
  'thomas',
  'denise',
  'henri',
  'aurélie',
];

function score(v: SpeechSynthesisVoice): number {
  const lang = v.lang.toLowerCase().replace('_', '-');
  if (!lang.startsWith('fr')) return -1;
  let s = lang === 'fr-fr' ? 10 : 4;
  const nom = v.name.toLowerCase();
  if (NOMS_PREFERES.some((n) => nom.includes(n))) s += 5;
  if (nom.includes('natural') || nom.includes('neural')) s += 3;
  if (v.localService) s += 1;
  return s;
}

function choisirVoix(): SpeechSynthesisVoice | null {
  if (!voixPresente()) return null;
  const voix = window.speechSynthesis.getVoices();
  if (!voix.length) return null;
  const triees = voix.map((v) => [score(v), v] as const).filter(([s]) => s >= 0);
  triees.sort((a, b) => b[0] - a[0]);
  return triees[0]?.[1] ?? null;
}

function voixPresente(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** Précharge la liste des voix (elle arrive parfois en différé). */
export function preparerVoix(): void {
  if (!voixPresente()) return;
  voixChoisie = choisirVoix();
  window.speechSynthesis.addEventListener?.('voiceschanged', () => {
    voixChoisie = choisirVoix();
  });
}

export function voixFrancaiseDisponible(): boolean {
  if (voixChoisie === undefined) voixChoisie = choisirVoix();
  return voixChoisie !== null;
}

/** Prononce une syllabe (toujours en minuscules, sinon certaines voix épellent). */
export function direSyllabe(syllabe: string): void {
  if (!voixPresente()) return;
  if (voixChoisie === undefined || voixChoisie === null) voixChoisie = choisirVoix();
  const synth = window.speechSynthesis;
  synth.cancel();
  const enonce = new SpeechSynthesisUtterance(syllabe.toLocaleLowerCase('fr-FR'));
  enonce.lang = 'fr-FR';
  if (voixChoisie) enonce.voice = voixChoisie;
  enonce.rate = 0.8;
  enonce.pitch = 1.05;
  enonce.volume = 1;
  synth.speak(enonce);
}
