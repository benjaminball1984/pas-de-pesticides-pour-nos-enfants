import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { lireConfigSupabase } from '../../lib/env';
import {
  envoyerEmailsCommande, envoyerEmailsDistribution, envoyerEmailsEngagement,
  type Commande, type Distribution, type Engagement,
} from '../../lib/brevo';

// Demandes du site : commande de matériel, déclaration de distribution, engagement d'élu·e (type 'autre').
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
  const payload = (body?.payload && typeof body.payload === 'object' ? body.payload : {}) as Record<string, unknown>;

  // Garde-fou taille (évite un payload abusif).
  if (JSON.stringify(payload).length > 20000) return json({ ok: false, erreur: 'Demande trop volumineuse.' }, 400);

  // Chaque formulaire connu est vérifié ici ; son contenu part ensuite par email à l'équipe et à la personne.
  let envoyer: (() => Promise<{ equipe: boolean; personne: boolean }>) | null = null;
  if (type === 'commande') {
    const c = lireCommande(payload);
    if (typeof c === 'string') return json({ ok: false, erreur: c }, 400);
    envoyer = () => envoyerEmailsCommande(c);
  } else if (type === 'distribution') {
    const d = lireDistribution(payload);
    if (typeof d === 'string') return json({ ok: false, erreur: d }, 400);
    envoyer = () => envoyerEmailsDistribution(d);
  } else if (payload.formulaire === 'engagement_elu') {
    const e = lireEngagement(payload);
    if (typeof e === 'string') return json({ ok: false, erreur: e }, 400);
    envoyer = () => envoyerEmailsEngagement(e);
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

  // La demande est enregistrée : un email qui échoue ne la fait pas échouer (elle reste dans la base).
  if (envoyer) {
    try {
      const r = await envoyer();
      if (!r.equipe || !r.personne) console.error(`[demande] email non parti (${type})`, r);
    } catch (e) {
      console.error(`[demande] email en erreur (${type})`, (e as Error).message);
    }
  }
  return json({ ok: true });
};

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const texte = (v: unknown, max = 160) => (typeof v === 'string' ? v.replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '').trim().slice(0, max) : '');
const ligne = (v: unknown, max = 160) => texte(v, max).replace(/\n/g, ' ');
const entier = (v: unknown, max: number) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) ? Math.min(Math.max(n, 0), max) : 0;
};

function lireCommande(p: Record<string, unknown>): Commande | string {
  const c: Commande = {
    prenom: ligne(p['c-prenom'], 80),
    nom: ligne(p['c-nom'], 80),
    email: ligne(p['c-email']).toLowerCase(),
    telephone: ligne(p['c-tel'], 30),
    organisation: ligne(p['c-org']),
    adresse: ligne(p['c-adr'], 200),
    complement: ligne(p['c-adr2'], 200),
    code_postal: ligne(p['c-cp'], 5),
    ville: ligne(p['c-ville'], 80),
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
  if (!d.lieu || !d.adresse || !d.ville) return 'Merci d’indiquer le lieu et l’adresse de la distribution.';
  if (!/^\d{5}$/.test(d.code_postal)) return 'Le code postal doit comporter 5 chiffres.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date)) return 'Merci d’indiquer la date de la distribution.';
  if (!d.horaires || !d.type_lieu) return 'Merci d’indiquer les horaires et le type de lieu.';
  if (!d.prenom || !d.nom) return 'Merci d’indiquer votre prénom et votre nom.';
  if (!RE_EMAIL.test(d.email)) return 'L’adresse email semble invalide.';
  return d;
}

function lireEngagement(p: Record<string, unknown>): Engagement | string {
  const engagements = Array.isArray(p.engagements)
    ? [...new Set(p.engagements.map((n) => entier(n, 9)).filter((n) => n >= 1))].sort((a, b) => a - b)
    : [];
  const e: Engagement = {
    prenom: ligne(p['e-prenom'], 80),
    nom: ligne(p['e-nom'], 80),
    qualite: ligne(p['e-qual'], 80),
    territoire: ligne(p['e-terr'], 160),
    departement: ligne(p['e-dep'], 3).toUpperCase(),
    email: ligne(p['e-email']).toLowerCase(),
    parti: ligne(p['e-parti'], 120),
    mot: texte(p['e-mot'], 1500),
    engagements,
    publication: p['e-pub'] === true,
  };
  if (!e.prenom || !e.nom) return 'Merci d’indiquer votre prénom et votre nom.';
  if (!e.qualite) return 'Merci d’indiquer votre mandat ou votre candidature.';
  if (!e.territoire || !/^(\d{2,3}|2A|2B)$/.test(e.departement)) return 'Merci d’indiquer votre territoire et votre département (ex. 93, 2A, 974).';
  if (!RE_EMAIL.test(e.email)) return 'L’adresse email semble invalide.';
  if (e.engagements.length === 0) return 'Cochez au moins une demande sur laquelle vous vous engagez.';
  if (!e.publication) return 'Merci d’accepter la publication de votre engagement.';
  return e;
}
