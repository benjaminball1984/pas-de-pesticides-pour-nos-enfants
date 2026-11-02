/**
 * Objectif « par paliers » du compteur de signatures (/api/compteur).
 * Plutôt qu'un gros dénominateur décourageant (« 0 sur 20 000 »), on affiche le palier
 * juste au-dessus du nombre actuel de signatures. Dès que les signatures atteignent
 * `seuilPalier` (90 %) du palier courant, on passe automatiquement au palier suivant.
 * Les textes du site sont dans les pages elles-mêmes (src/pages/*.astro).
 */
export const paliers = [1000, 1500, 2500, 5000, 7500, 10000, 15000, 20000, 35000, 50000, 75000, 100000];
export const seuilPalier = 0.9;

/** Renvoie l'objectif courant (le premier palier qu'on n'a pas encore atteint à 90 %). */
export function objectifDynamique(signataires: number): number {
  for (const p of paliers) if (signataires < seuilPalier * p) return p;
  return paliers[paliers.length - 1];
}
