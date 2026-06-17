import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { lireConfigSupabase } from '../../lib/env';

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

  const { url: su, key, configure } = lireConfigSupabase();
  if (!configure) {
    console.log(`[demande MOCK] type=${type}`);
    return json({ ok: true });
  }

  const sb = createClient(su, key, { auth: { persistSession: false } });
  const { error } = await sb.from('demande').insert({ type, email: email || null, payload });
  if (error) {
    console.error('[demande] erreur insertion:', error.message);
    return json({ ok: false, erreur: 'db' }, 500);
  }
  return json({ ok: true });
};
