/**
 * Couche d'accès aux signatures.
 * - Si Supabase est configuré (clés présentes) : on lit/écrit dans la base (Europe).
 * - Sinon : mode « mock » en mémoire, pour développer en local sans aucune clé.
 *
 * Toute la PII (prénom, nom, email, téléphone) ne transite QUE côté serveur.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { lireConfigSupabase } from './env';
import { objectifDynamique } from '../data/contenu';

export interface DonneesSignature {
  prenom: string;
  nom: string;
  email: string;
  code_postal: string;
  telephone?: string | null;
  info_campagne: boolean;
  newsletter: boolean;
}

export interface Compteurs {
  signataires: number;
  communes: number;
  objectif: number;
}

/** Stockage en mémoire utilisé uniquement quand Supabase n'est pas configuré (dev local). */
const mockStore: DonneesSignature[] = [];

function clientSupabase(): SupabaseClient {
  const { url, key } = lireConfigSupabase();
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function enregistrerSignature(
  d: DonneesSignature
): Promise<{ ok: boolean; deja?: boolean; erreur?: string }> {
  const { configure } = lireConfigSupabase();

  if (!configure) {
    const existe = mockStore.some((s) => s.email.toLowerCase() === d.email.toLowerCase());
    if (existe) return { ok: true, deja: true };
    mockStore.push(d);
    // Pas de PII dans les logs : on ne journalise qu'un compteur.
    console.log(`[signature MOCK] total ${mockStore.length}`);
    return { ok: true };
  }

  const sb = clientSupabase();
  const { error } = await sb.from('signature').insert({
    prenom: d.prenom,
    nom: d.nom,
    email: d.email,
    code_postal: d.code_postal,
    telephone: d.telephone || null,
    info_campagne: d.info_campagne,
    newsletter: d.newsletter,
  });

  if (error) {
    // 23505 = violation d'unicité = email déjà signataire : on traite ça comme un succès.
    if ((error as { code?: string }).code === '23505') return { ok: true, deja: true };
    // On logge le détail côté serveur mais on ne renvoie JAMAIS le message brut à l'appelant.
    console.error('[signature] erreur insertion:', error.message);
    return { ok: false, erreur: 'db' };
  }
  return { ok: true };
}

export async function lireCompteurs(): Promise<Compteurs> {
  const { configure } = lireConfigSupabase();

  if (!configure) {
    const cps = new Set(mockStore.map((s) => s.code_postal));
    const signataires = mockStore.length;
    return { signataires, communes: cps.size, objectif: objectifDynamique(signataires) };
  }

  const sb = clientSupabase();
  const { count, error } = await sb.from('signature').select('*', { count: 'exact', head: true });
  // En cas d'erreur, on REMONTE l'exception : l'endpoint renverra 500 et le client gardera
  // la valeur déjà affichée (jamais un « 0 » brutal en cas de panne transitoire).
  if (error) throw new Error('compteur indisponible');
  const signataires = count ?? 0;

  let communes = 0;
  const { data } = await sb.rpc('compter_communes');
  if (typeof data === 'number') communes = data;

  return { signataires, communes, objectif: objectifDynamique(signataires) };
}
