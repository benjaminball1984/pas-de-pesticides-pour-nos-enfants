import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { lireConfigSupabase } from '../../lib/env';
import { envoyerEmailsCommande, type Commande } from '../../lib/brevo';

// Capture générique des demandes (commande de matériel, déclaration de distribution).
export const prerender = false;

const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

const TYPES = ['commande', 'distribution', 'autre'];

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

  const type = TYPES.includes(body?.type ?? '') ? (body!.type as string) : 'autre';
  const email = typeof body?.email === 'string' ? body.email.trim().slice(0, 160) : '';
  const payload = body?.payload && typeof body.payload === 'object' ? body.payload : {};

  // Garde-fou taille (évite un payload abusif).
  if (JSON.stringify(payload).length > 20000) return json({ ok: false, erreur: 'Demande trop volumineuse.' }, 400);

  // Une commande est vérifiée ici : son contenu part ensuite par email à l'équipe et à la personne.
  let commande: Commande | null = null;
  if (type === 'commande') {
    const c = lireCommande(payload as Record<string, unknown>);
    if (typeof c === 'string') return json({ ok: false, erreur: c }, 400);
    commande = c;
  }

  const { url: su, key, configure } = lireConfigSupabase();
  if (!configure) {
    console.log(`[demande MOCK] type=${type}`);
  } else {
    const sb = createClient(su, key, { auth: { persistSession: false } });
    const { error } = await sb.from('demande').insert({ type, email: email || null, payload });
    if (error) {
      console.error('[demande] erreur insertion:', error.message);
      return json({ ok: false, erreur: 'Une erreur est survenue. Merci de réessayer dans un instant.' }, 500);
    }
  }

  // La commande est enregistrée : un email qui échoue ne la fait pas échouer (elle reste dans la base).
  if (commande) {
    try {
      const r = await envoyerEmailsCommande(commande);
      if (!r.equipe || !r.personne) console.error('[demande] email de commande non parti', r);
    } catch (e) {
      console.error('[demande] email de commande en erreur', (e as Error).message);
    }
  }
  return json({ ok: true });
};

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const texte = (v: unknown, max = 160) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max) : '');
const entier = (v: unknown, max: number) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) ? Math.min(Math.max(n, 0), max) : 0;
};

function lireCommande(p: Record<string, unknown>): Commande | string {
  const c: Commande = {
    prenom: texte(p['c-prenom'], 80),
    nom: texte(p['c-nom'], 80),
    email: texte(p['c-email']).toLowerCase(),
    telephone: texte(p['c-tel'], 30),
    organisation: texte(p['c-org']),
    adresse: texte(p['c-adr'], 200),
    complement: texte(p['c-adr2'], 200),
    code_postal: texte(p['c-cp'], 5),
    ville: texte(p['c-ville'], 80),
    flyers_a5: entier(p.flyers_a5, 2000),
    affiches_a3: entier(p.affiches_a3, 200),
    newsletter: p['c-nl'] === true,
  };
  if (!c.prenom || !c.nom) return 'Merci d’indiquer votre prénom et votre nom.';
  if (!RE_EMAIL.test(c.email)) return 'L’adresse email semble invalide.';
  if (!c.adresse || !c.ville) return 'Merci d’indiquer votre adresse de livraison.';
  if (!/^\d{5}$/.test(c.code_postal)) return 'Le code postal doit comporter 5 chiffres.';
  if (c.flyers_a5 + c.affiches_a3 === 0) return 'Choisissez au moins un flyer ou une affiche.';
  if (p['c-eng'] !== true) return 'Merci de cocher l’engagement à diffuser le matériel.';
  return c;
}
