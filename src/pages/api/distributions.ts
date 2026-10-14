import type { APIRoute } from 'astro';
import { base, jourParis } from '../../lib/demandes';

// Distributions à venir pour la carte publique : seulement ce que la personne a accepté de montrer
// (prénom et initiale du nom, jamais l'email ni le téléphone).
export const prerender = false;

export const GET: APIRoute = async () => {
  const sb = base();
  let liste: unknown[] = [];
  if (sb) {
    const { data, error } = await sb.from('demande').select('payload')
      .eq('type', 'distribution').eq('payload->>d-carte', 'true').gte('payload->>d-date', jourParis())
      .order('payload->>d-date', { ascending: true }).limit(1000);
    if (error) return new Response(JSON.stringify({ ok: false }), { status: 500 });
    liste = (data ?? [])
      .map((l) => l.payload as Record<string, unknown>)
      .filter((p) => p.masque !== true)
      .map((p) => ({
        lieu: p['d-lieu'], type: p['d-type'], ville: p['d-ville'], cp: p['d-cp'], date: p['d-date'], horaires: p['d-h'],
        par: `${p['d-prenom']} ${String(p['d-nom'] ?? '').charAt(0)}.`,
        lat: typeof p.lat === 'number' ? p.lat : null, lng: typeof p.lng === 'number' ? p.lng : null,
      }));
  }
  return new Response(JSON.stringify({ ok: true, distributions: liste }), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=60' },
  });
};
