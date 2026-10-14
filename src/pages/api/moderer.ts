import type { APIRoute } from 'astro';
import { lireDemande, completerPayload } from '../../lib/demandes';
import { verifier } from '../../lib/liens';

// Liens de modération des emails de l'équipe. Le GET n'affiche qu'une confirmation : les messageries
// ouvrent parfois les liens toutes seules (analyse antivirus), seul le bouton (POST) agit.
export const prerender = false;

const page = (titre: string, corps: string, status = 200) =>
  new Response(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>${titre}</title></head>
<body style="margin:0;font-family:Arial,Helvetica,sans-serif;background:#FAF7F0;color:#0E2E27">
<div style="background:#004D40;color:#FFCC45;padding:18px 24px;font-weight:bold;font-size:18px">Pas de pesticides pour nos enfants&nbsp;!</div>
<main style="max-width:560px;margin:32px auto;padding:0 20px;line-height:1.55"><h1 style="font-size:22px;color:#004D40">${titre}</h1>${corps}</main></body></html>`,
    { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });

const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function preparer(url: URL) {
  const a = url.searchParams.get('a') ?? '';
  const id = url.searchParams.get('id') ?? '';
  const t = url.searchParams.get('t') ?? '';
  if (!['publier', 'retirer', 'remettre'].includes(a) || !(await verifier(a, id, t))) return { erreur: 'Lien invalide ou incomplet.' };
  const ligne = await lireDemande(id);
  if (!ligne) return { erreur: 'Cette demande n’existe plus.' };
  const p = ligne.payload;
  const engagement = p.formulaire === 'engagement_elu';
  if (!engagement && ligne.type !== 'distribution') return { erreur: 'Rien à modérer ici.' };
  const quoi = engagement
    ? `l'engagement de <b>${esc(p['e-prenom'])} ${esc(p['e-nom'])}</b> (${esc(p['e-qual'])}, ${esc(p['e-terr'])})`
    : `la distribution <b>${esc(p['d-lieu'])}</b> à ${esc(p['d-ville'])}, le ${esc(p['d-date'])}`;
  const verbe = { publier: 'Publier', retirer: engagement ? 'Retirer de la liste publique' : 'Retirer de la carte', remettre: 'Remettre sur la carte' }[a]!;
  return { a, id, t, engagement, quoi, verbe };
}

export const GET: APIRoute = async ({ url }) => {
  const r = await preparer(url);
  if ('erreur' in r) return page('Lien invalide', `<p>${r.erreur}</p>`, 400);
  return page(r.verbe, `<p>${r.verbe}&nbsp;: ${r.quoi}&nbsp;?</p>
<form method="post"><button style="background:#EB734D;color:#fff;border:0;border-radius:999px;padding:12px 22px;font-size:16px;font-weight:bold;cursor:pointer">${r.verbe}</button></form>`);
};

export const POST: APIRoute = async ({ url }) => {
  const r = await preparer(url);
  if ('erreur' in r) return page('Lien invalide', `<p>${r.erreur}</p>`, 400);
  const modif = r.engagement
    ? { publie: r.a === 'publier', modere_le: new Date().toISOString() }
    : { masque: r.a === 'retirer', modere_le: new Date().toISOString() };
  const ok = await completerPayload(r.id, modif);
  if (!ok) return page('Échec', '<p>La modification n’a pas pu être enregistrée. Réessayez dans un instant.</p>', 500);
  const ou = r.engagement ? '<a href="/elus">la page Élu·es</a>' : '<a href="/distribution">la carte des distributions</a>';
  const fait = { publier: 'Publié', retirer: 'Retiré', remettre: 'Remis sur la carte' }[r.a]!;
  return page(fait, `<p>C'est fait&nbsp;: ${r.quoi}. Le changement apparaît sur ${ou} d'ici une minute.</p>`);
};
