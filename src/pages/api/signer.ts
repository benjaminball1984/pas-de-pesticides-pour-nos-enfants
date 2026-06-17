import type { APIRoute } from 'astro';
import { enregistrerSignature } from '../../lib/signatures';

// Route dynamique (exécutée à la demande), pas pré-générée.
export const prerender = false;

const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RE_CP = /^\d{5}$/;
const RE_TEL = /^[0-9+().\-\s]{6,30}$/;

// Retire les caractères de contrôle (code <= 31 ou == 127), puis trim.
// N'altère ni les espaces, ni les tirets, ni les accents des noms (ex. « Marie-Claire »).
const nettoyer = (s: string) =>
  Array.from(s)
    .filter((ch) => {
      const c = ch.charCodeAt(0);
      return c > 31 && c !== 127;
    })
    .join('')
    .trim();

export const POST: APIRoute = async ({ request }) => {
  // Contrôle d'origine (anti-CSRF) : on refuse un POST venant d'un autre site.
  // (En production output:'static', le contrôle natif d'Astro n'est pas monté : on le fait ici.)
  const url = new URL(request.url);
  const origin = request.headers.get('origin');
  if (origin && origin !== url.origin) {
    return json({ ok: false, erreur: 'Origine non autorisée.' }, 403);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, erreur: 'Requête invalide.' }, 400);
  }

  // Anti-robot : champ piège (honeypot) invisible. S'il est rempli, c'est un bot.
  // On répond « ok » sans rien enregistrer (ne pas renseigner les robots sur le filtre).
  if (String(form.get('site_web') ?? '').trim() !== '') return json({ ok: true });

  const prenom = nettoyer(String(form.get('prenom') ?? ''));
  const nom = nettoyer(String(form.get('nom') ?? ''));
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const code_postal = String(form.get('code_postal') ?? '').trim();
  const telephone = String(form.get('telephone') ?? '').trim();
  const info_campagne = form.get('info_campagne') != null;
  const newsletter = form.get('newsletter') != null;

  if (!prenom || !nom) return json({ ok: false, erreur: 'Merci d’indiquer votre prénom et votre nom.' }, 400);
  if (prenom.length > 80 || nom.length > 80 || email.length > 160) {
    return json({ ok: false, erreur: 'Champs trop longs.' }, 400);
  }
  if (!RE_EMAIL.test(email)) return json({ ok: false, erreur: 'L’adresse email semble invalide.' }, 400);
  if (!RE_CP.test(code_postal)) return json({ ok: false, erreur: 'Le code postal doit comporter 5 chiffres.' }, 400);
  if (telephone && !RE_TEL.test(telephone)) {
    return json({ ok: false, erreur: 'Le numéro de téléphone semble invalide.' }, 400);
  }

  const res = await enregistrerSignature({
    prenom, nom, email, code_postal, telephone: telephone || null, info_campagne, newsletter,
  });

  if (!res.ok) return json({ ok: false, erreur: 'Une erreur est survenue. Merci de réessayer dans un instant.' }, 500);
  return json({ ok: true, deja: res.deja ?? false });
};
