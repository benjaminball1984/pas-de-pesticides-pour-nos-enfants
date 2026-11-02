import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { lireConfigSupabase } from '../../lib/env';
import { envoyerEmailsDistribution, type Distribution } from '../../lib/brevo';
import { geocoder } from '../../lib/demandes';
import { lienModeration } from '../../lib/liens';

// Demandes du site : déclaration d'une table (type 'distribution'). Les commandes de matériel et les
// engagements d'élu·es ont été retirés à la refonte de novembre 2026.
export const prerender = false;

const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

export const POST: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const origin = request.headers.get('origin');
  if (origin && origin !== url.origin) return json({ ok: false, erreur: 'Origine non autorisée.' }, 403);

  let body: { type?: string; email?: string; payload?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, erreur: 'Requête invalide.' }, 400);
  }

  if (body?.type !== 'distribution') return json({ ok: false, erreur: 'Ce formulaire n’existe plus.' }, 400);
  const type = 'distribution';
  const email = typeof body?.email === 'string' ? body.email.trim().slice(0, 160) : '';
  const payload = (body?.payload && typeof body.payload === 'object' ? body.payload : {}) as Record<string, unknown>;

  // Garde-fou taille (évite un payload abusif).
  if (JSON.stringify(payload).length > 20000) return json({ ok: false, erreur: 'Demande trop volumineuse.' }, 400);

  // Le contenu est vérifié ici, puis part par email à l'équipe et à la personne.
  const d = lireDistribution(payload);
  if (typeof d === 'string') return json({ ok: false, erreur: d }, 400);
  // Position sur la carte publique, calculée une fois à l'enregistrement.
  const pos = await geocoder(d.adresse, d.code_postal, d.ville);
  if (pos) { payload.lat = pos.lat; payload.lng = pos.lng; }
  const envoyer = async (id: string) => envoyerEmailsDistribution(d, { retirer: await lienModeration('retirer', id) });

  let id = '';
  const { url: su, key, configure } = lireConfigSupabase();
  if (!configure) {
    console.log(`[demande MOCK] type=${type}`);
  } else {
    const sb = createClient(su, key, { auth: { persistSession: false } });
    const { data, error } = await sb.from('demande').insert({ type, email: email || null, payload }).select('id').single();
    if (error) {
      console.error('[demande] erreur insertion:', error.message);
      return json({ ok: false, erreur: 'Une erreur est survenue. Merci de réessayer dans un instant.' }, 500);
    }
    id = (data as { id: string }).id;
  }

  // Si un email échoue, la demande reste enregistrée et la réponse reste positive.
  try {
    const r = await envoyer(id);
    if (!r.equipe || !r.personne) console.error(`[demande] email non parti (${type})`, r);
  } catch (e) {
    console.error(`[demande] email en erreur (${type})`, (e as Error).message);
  }
  return json({ ok: true });
};

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const texte = (v: unknown, max = 160) => (typeof v === 'string' ? v.replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '').trim().slice(0, max) : '');
const ligne = (v: unknown, max = 160) => texte(v, max).replace(/\n/g, ' ');

function lireDistribution(p: Record<string, unknown>): Distribution | string {
  const d: Distribution = {
    lieu: ligne(p['d-lieu'], 160),
    adresse: ligne(p['d-adr'], 200),
    code_postal: ligne(p['d-cp'], 5),
    ville: ligne(p['d-ville'], 80),
    type_lieu: ligne(p['d-type'], 80),
    date: ligne(p['d-date'], 10),
    horaires: ligne(p['d-h'], 60),
    commentaire: texte(p['d-com'], 1000),
    prenom: ligne(p['d-prenom'], 80),
    nom: ligne(p['d-nom'], 80),
    email: ligne(p['d-email']).toLowerCase(),
    telephone: ligne(p['d-tel'], 30),
    organisation: ligne(p['d-org']),
    carte: p['d-carte'] === true,
    contact: p['d-contact'] === true,
    rappels: p['d-rappel'] === true,
  };
  if (!d.lieu || !d.adresse || !d.ville) return 'Merci d’indiquer le lieu et l’adresse de la table.';
  if (!/^\d{5}$/.test(d.code_postal)) return 'Le code postal doit comporter 5 chiffres.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date)) return 'Merci d’indiquer la date de la table.';
  if (!d.horaires || !d.type_lieu) return 'Merci d’indiquer les horaires et le type de lieu.';
  if (!d.prenom || !d.nom) return 'Merci d’indiquer votre prénom et votre nom.';
  if (!RE_EMAIL.test(d.email)) return 'L’adresse email semble invalide.';
  return d;
}
