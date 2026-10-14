import type { APIRoute } from 'astro';
import { base } from '../../lib/demandes';

// Engagements d'élu·es et de candidat·es publiés par l'équipe (lien « Publier » de l'email).
export const prerender = false;

export const GET: APIRoute = async () => {
  const sb = base();
  let liste: unknown[] = [];
  if (sb) {
    const { data, error } = await sb.from('demande').select('payload, created_at')
      .eq('type', 'autre').eq('payload->>formulaire', 'engagement_elu').eq('payload->>publie', 'true')
      .order('created_at', { ascending: false }).limit(2000);
    if (error) return new Response(JSON.stringify({ ok: false }), { status: 500 });
    liste = (data ?? []).map((l) => {
      const p = l.payload as Record<string, unknown>;
      return {
        nom: `${p['e-prenom']} ${p['e-nom']}`, qualite: p['e-qual'], territoire: p['e-terr'], departement: p['e-dep'],
        parti: p['e-parti'] || '', mot: p['e-mot'] || '', engagements: p.engagements ?? [], date: l.created_at,
      };
    });
  }
  return new Response(JSON.stringify({ ok: true, engagements: liste }), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=60' },
  });
};
