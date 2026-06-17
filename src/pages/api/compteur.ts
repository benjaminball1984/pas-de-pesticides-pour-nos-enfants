import type { APIRoute } from 'astro';
import { lireCompteurs } from '../../lib/signatures';

// Route dynamique : renvoie les chiffres en direct (signataires, communes, objectif par palier).
export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const c = await lireCompteurs();
    return new Response(JSON.stringify(c), {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        // Cache navigateur ET bord du réseau (s-maxage) pour absorber les pics (presse).
        'cache-control': 'public, max-age=30, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch {
    // Panne transitoire : 500 sans valeur utile -> le client conserve le chiffre déjà affiché
    // (jamais un « 0 » brutal en page d'accueil).
    return new Response(JSON.stringify({ erreur: 'indisponible' }), {
      status: 500,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }
};
