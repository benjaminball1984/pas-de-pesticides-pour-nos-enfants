import type { APIRoute } from 'astro';
import { lireDemande, completerPayload } from '../../lib/demandes';
import { verifier } from '../../lib/liens';

// Liens de modération des emails de l'équipe. Le GET n'affiche qu'une confirmation : les messageries
// ouvrent parfois les liens toutes seules (analyse antivirus), seul le bouton (POST) agit.
export const prerender = false;

const page = (titre: string, corps: string, status = 200) =>
  new Response(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>${titre}</title></head>
<body style="margin:0;font-family:Arial,Helvetica,sans-serif;background:#FBF5EA;color:#2A2622">
<div style="background:#4F7F57;color:#FFFFFF;padding:18px 24px;font-weight:bold;font-size:18px">Pas de pesticides pour nos enfants&nbsp;!</div>
<main style="max-width:560px;margin:32px auto;padding:0 20px;line-height:1.55"><h1 style="font-size:22px;color:#2A2622">${titre}</h1>${corps}</main></body></html>`,
    { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });

const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function preparer(url: URL) {
  const a = url.searchParams.get('a') ?? '';
  const id = url.searchParams.get('id') ?? '';
  const t = url.searchParams.get('t') ?? '';
  if (!['retirer', 'remettre'].includes(a) || !(await verifier(a, id, t))) return { erreur: 'Lien invalide ou incomplet.' };
  const ligne = await lireDemande(id);
  if (!ligne) return { erreur: 'Cette demande n’existe plus.' };
  const p = ligne.payload;
  if (ligne.type !== 'distribution') return { erreur: 'Rien à modérer ici.' };
  const quoi = `la table <b>${esc(p['d-lieu'])}</b> à ${esc(p['d-ville'])}, le ${esc(p['d-date'])}`;
  const verbe = { retirer: 'Retirer de la carte', remettre: 'Remettre sur la carte' }[a]!;
  return { a, id, t, quoi, verbe };
}

export const GET: APIRoute = async ({ url }) => {
  const r = await preparer(url);
  if ('erreur' in r) return page('Lien invalide', `<p>${r.erreur}</p>`, 400);
  return page(r.verbe, `<p>${r.verbe}&nbsp;: ${r.quoi}&nbsp;?</p>
<form method="post"><button style="background:#A9492F;color:#fff;border:0;border-radius:999px;padding:12px 22px;font-size:16px;font-weight:bold;cursor:pointer">${r.verbe}</button></form>`);
};

export const POST: APIRoute = async ({ url }) => {
  const r = await preparer(url);
  if ('erreur' in r) return page('Lien invalide', `<p>${r.erreur}</p>`, 400);
  const modif = { masque: r.a === 'retirer', modere_le: new Date().toISOString() };
  const ok = await completerPayload(r.id, modif);
  if (!ok) return page('Échec', '<p>La modification n’a pas pu être enregistrée. Réessayez dans un instant.</p>', 500);
  const fait = { retirer: 'Retiré', remettre: 'Remis sur la carte' }[r.a]!;
  return page(fait, `<p>C'est fait&nbsp;: ${r.quoi}. Le changement apparaît sur <a href="/distribution">la carte des tables</a> d'ici une minute.</p>`);
};
