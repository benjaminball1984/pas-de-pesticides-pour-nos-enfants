/**
 * Envois d'emails par le Brevo de Bio Consom'acteurs (API transactionnelle).
 * Sans clé (dev local), on journalise sans envoyer.
 */
import { lireConfigBrevo } from './env';

const echapper = (s: unknown) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

interface Email {
  to: { email: string; name?: string }[];
  subject: string;
  html: string;
  replyTo?: { email: string; name?: string };
}

export async function envoyerEmail(m: Email): Promise<boolean> {
  const { apiKey, senderEmail, senderName, configure } = lireConfigBrevo();
  if (!configure) {
    console.log(`[brevo MOCK] « ${m.subject} » → ${m.to.length} destinataire(s)`);
    return true;
  }
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: m.to,
      replyTo: m.replyTo,
      subject: m.subject,
      htmlContent: m.html,
    }),
  });
  if (!res.ok) {
    // Pas de données personnelles dans les journaux : le statut et le message de Brevo seulement.
    console.error('[brevo] envoi refusé', res.status, (await res.text()).slice(0, 300));
    return false;
  }
  return true;
}

const gabarit = (titre: string, corps: string) => `<!doctype html><html lang="fr"><body style="margin:0;background:#FBF5EA;font-family:Arial,Helvetica,sans-serif;color:#2A2622">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF5EA"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:12px;overflow:hidden">
<tr><td style="background:#4F7F57;color:#FFFFFF;padding:20px 28px;font-size:20px;font-weight:bold">Pas de pesticides pour nos enfants&nbsp;!</td></tr>
<tr><td style="padding:24px 28px;font-size:15px;line-height:1.55">
<h1 style="font-size:20px;margin:0 0 14px;color:#2A2622">${titre}</h1>
${corps}
</td></tr>
<tr><td style="padding:16px 28px;background:#F2EDE0;font-size:12px;color:#5F6F65">Bio Consom'acteurs · 10 rue Beaumarchais, 93100 Montreuil · <a href="https://pasdepesticidespournosenfants.net" style="color:#3F6B47">pasdepesticidespournosenfants.net</a></td></tr>
</table></td></tr></table></body></html>`;

/** Tableau de récapitulatif : les valeurs sont échappées, les lignes vides sautées. */
function tableau(lignes: [string, string | undefined][]) {
  const rows = lignes
    .filter(([, v]) => v && v.trim())
    .map(([k, v]) => `<tr><td style="padding:6px 10px;color:#5F6F65;white-space:nowrap;vertical-align:top">${k}</td><td style="padding:6px 10px">${echapper(v).replace(/\n/g, '<br>')}</td></tr>`)
    .join('');
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;background:#FBF5EA;border-radius:8px;margin:12px 0">${rows}</table>`;
}
const ouiNon = (b: boolean) => (b ? 'oui' : 'non');
const lien = (href: string, txt: string) => `<a href="${href}" style="color:#A9492F;font-weight:bold">${txt}</a>`;

export interface Distribution {
  lieu: string; adresse: string; code_postal: string; ville: string; type_lieu: string;
  date: string; horaires: string; commentaire: string;
  prenom: string; nom: string; email: string; telephone: string; organisation: string;
  carte: boolean; contact: boolean; rappels: boolean;
}

const dateFr = (iso: string) => {
  const d = new Date(iso + 'T12:00:00Z');
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
};

function recapDistribution(d: Distribution) {
  return tableau([
    ['Lieu', d.lieu],
    ['Type de lieu', d.type_lieu],
    ['Adresse', `${d.adresse}\n${d.code_postal} ${d.ville}`],
    ['Date', dateFr(d.date)],
    ['Horaires', d.horaires],
    ['Commentaire', d.commentaire],
    ['Organisé par', `${d.prenom} ${d.nom}` + (d.organisation ? `\n${d.organisation}` : '')],
    ['Email', d.email],
    ['Téléphone', d.telephone],
  ]);
}

const bouton = (href: string, txt: string, fond = '#2A2622') =>
  `<a href="${href}" style="display:inline-block;background:${fond};color:#FFFFFF;text-decoration:none;font-weight:bold;padding:10px 18px;border-radius:999px;margin:4px 6px 4px 0">${txt}</a>`;

export async function envoyerEmailsDistribution(d: Distribution, liens: { retirer?: string } = {}) {
  const { commandesEmail } = lireConfigBrevo();
  const moderation = d.carte && liens.retirer
    ? `<p>Elle apparaît dès maintenant sur la carte publique. En cas de problème&nbsp;: ${bouton(liens.retirer, 'Retirer de la carte', '#A9492F')}</p>`
    : '<p>La personne n’a pas souhaité apparaître sur la carte publique.</p>';
  const equipe = await envoyerEmail({
    to: [{ email: commandesEmail }],
    replyTo: { email: d.email, name: `${d.prenom} ${d.nom}` },
    subject: `Nouvelle table : ${d.ville} (${d.code_postal}), ${dateFr(d.date)}`,
    html: gabarit('Nouvelle table déclarée', `<p>Une table vient d'être déclarée sur le site de la campagne.</p>
${recapDistribution(d)}
${tableau([
  ['Sur la carte publique', ouiNon(d.carte)],
  ['Accepte d’être contacté·e', ouiNon(d.contact)],
  ['Fiche pratique et rappels', ouiNon(d.rappels)],
])}
${moderation}
<p>Répondre à cet email écrit directement à la personne qui organise.</p>`),
  });
  const personne = await envoyerEmail({
    to: [{ email: d.email, name: `${d.prenom} ${d.nom}` }],
    subject: 'Votre table « Pas de pesticides pour nos enfants »',
    html: gabarit(`Merci ${echapper(d.prenom)}, votre table est bien enregistrée&nbsp;!`, `<p>Voici ce que vous avez déclaré&nbsp;:</p>
${recapDistribution(d)}
<h2 style="font-size:17px;margin:20px 0 8px;color:#2A2622">Réussir sa table</h2>
<p style="margin:0 0 6px"><b>Avant</b>&nbsp;: imprimez les flyers et l'affiche du kit, prévoyez du scotch et un téléphone ou une tablette pour faire signer en ligne avec le QR code. Trouvez une ou deux personnes pour vous accompagner, et fixez l'heure, le lieu précis et la durée.</p>
<p style="margin:0 0 6px"><b>Pendant</b>&nbsp;: allez vers les gens avec le sourire, sans insister. Posez des questions simples, mettez en avant des messages concrets. Ne bloquez pas le passage et respectez les refus.</p>
<p style="margin:0 0 12px"><b>Après</b>&nbsp;: comptez les flyers distribués et les signatures, et envoyez-nous une photo en réponse à cet email.</p>
<p>Les flyers et l'affiche à imprimer chez vous, en couleur ou en noir et blanc&nbsp;: ${lien('https://pasdepesticidespournosenfants.net/kit', 'le kit de la pétition')}.</p>
<p>Une question&nbsp;? Répondez simplement à cet email.</p>
<p>L'équipe de Bio Consom'acteurs</p>`),
  });
  return { equipe, personne };
}

/** Rappel à la personne qui organise la table : la veille, puis le matin même. */
export async function envoyerRappelDistribution(d: Distribution, quand: 'veille' | 'jour') {
  const titre = quand === 'veille'
    ? `C'est demain, ${echapper(d.prenom)}&nbsp;!`
    : `C'est aujourd'hui, ${echapper(d.prenom)}&nbsp;!`;
  return envoyerEmail({
    to: [{ email: d.email, name: `${d.prenom} ${d.nom}` }],
    subject: quand === 'veille' ? `Rappel : votre table demain à ${d.ville}` : `C'est aujourd'hui : votre table à ${d.ville}`,
    html: gabarit(titre, `<p>${quand === 'veille' ? 'Petit rappel pour votre table de demain' : 'Votre table a lieu aujourd’hui'}&nbsp;:</p>
${recapDistribution(d)}
<h2 style="font-size:17px;margin:20px 0 8px;color:#2A2622">${quand === 'veille' ? 'À préparer ce soir' : 'Dans le sac'}</h2>
<ul style="margin:0 0 12px;padding-left:20px">
<li>les flyers et l'affiche du kit, du scotch ou des pinces&nbsp;;</li>
<li>un téléphone ou une tablette pour faire signer en ligne, et le QR code de la pétition&nbsp;;</li>
<li>de l'eau, et le numéro de la personne qui vous accompagne.</li>
</ul>
<p>Sur place&nbsp;: allez vers les gens avec le sourire, sans insister, et respectez les refus.</p>
<p>Après&nbsp;: répondez à cet email avec une photo, le nombre de flyers distribués et de signatures recueillies. Ça nous aide à raconter la campagne.</p>
<p>Merci pour votre engagement&nbsp;!<br>L'équipe de Bio Consom'acteurs</p>`),
  });
}
