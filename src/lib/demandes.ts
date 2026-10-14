/**
 * Accès serveur à la table `demande` (commandes, distributions, engagements d'élu·es).
 * Les champs ajoutés après coup (publication, retrait, rappels, coordonnées) vivent dans `payload`.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { lireConfigSupabase } from './env';

export interface Ligne {
  id: string;
  type: string;
  email: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

export function base(): SupabaseClient | null {
  const { url, key, configure } = lireConfigSupabase();
  return configure ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

export async function lireDemande(id: string): Promise<Ligne | null> {
  const sb = base();
  if (!sb || !/^[0-9a-f-]{36}$/.test(id)) return null;
  const { data } = await sb.from('demande').select('*').eq('id', id).maybeSingle();
  return (data as Ligne) ?? null;
}

/** Fusionne `modif` dans le payload (lecture puis écriture : les écritures concurrentes sont rares ici). */
export async function completerPayload(id: string, modif: Record<string, unknown>): Promise<boolean> {
  const sb = base();
  const ligne = await lireDemande(id);
  if (!sb || !ligne) return false;
  const { error } = await sb.from('demande').update({ payload: { ...ligne.payload, ...modif } }).eq('id', id);
  if (error) console.error('[demandes] mise à jour refusée', error.message);
  return !error;
}

/** Date du jour à Paris, au format AAAA-MM-JJ, décalée de `jours`. */
export function jourParis(jours = 0): string {
  const d = new Date(Date.now() + jours * 86400000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

/** Coordonnées par la Base adresse nationale ; à défaut, le centre de la commune. */
export async function geocoder(adresse: string, codePostal: string, ville: string): Promise<{ lat: number; lng: number } | null> {
  const essais = [`${adresse} ${ville}`, ville];
  for (const q of essais) {
    try {
      const u = `https://data.geopf.fr/geocodage/search?q=${encodeURIComponent(q)}&postcode=${codePostal}&limit=1`;
      const r = await fetch(u, { signal: AbortSignal.timeout(4000) });
      if (!r.ok) continue;
      const j = (await r.json()) as { features?: { geometry: { coordinates: [number, number] }; properties: { score: number } }[] };
      const f = j.features?.[0];
      if (f && f.properties.score > 0.4) return { lng: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] };
    } catch {
      /* essai suivant */
    }
  }
  return null;
}
