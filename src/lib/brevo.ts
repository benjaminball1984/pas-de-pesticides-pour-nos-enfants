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

/** Données d'une commande, telles que validées par /api/demande. */
export interface Commande {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  organisation: string;
  adresse: string;
  complement: string;
  code_postal: string;
  ville: string;
  flyers_a5: number;
  affiches_a3: number;
  newsletter: boolean;
}

const gabarit = (titre: string, corps: string) => `<!doctype html><html lang="fr"><body style="margin:0;background:#FAF7F0;font-family:Arial,Helvetica,sans-serif;color:#0E2E27">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:12px;overflow:hidden">
<tr><td style="background:#004D40;color:#FFCC45;padding:20px 28px;font-size:20px;font-weight:bold">Pas de pesticides pour nos enfants&nbsp;!</td></tr>
<tr><td style="padding:24px 28px;font-size:15px;line-height:1.55">
<h1 style="font-size:20px;margin:0 0 14px;color:#004D40">${titre}</h1>
${corps}
</td></tr>
<tr><td style="padding:16px 28px;background:#F2EDE0;font-size:12px;color:#5F6F65">Bio Consom'acteurs · 10 rue Beaumarchais, 93100 Montreuil · <a href="https://pasdepesticidespournosenfants.net" style="color:#0E6B5C">pasdepesticidespournosenfants.net</a></td></tr>
</table></td></tr></table></body></html>`;

const poids = (c: Commande) => (c.flyers_a5 * 0.008 + c.affiches_a3 * 0.04).toFixed(1).replace('.', ',');

function recap(c: Commande) {
  const ligne = (k: string, v: string) => `<tr><td style="padding:6px 10px;color:#5F6F65;white-space:nowrap;vertical-align:top">${k}</td><td style="padding:6px 10px">${v}</td></tr>`;
  const adresse = [c.adresse, c.complement, `${c.code_postal} ${c.ville}`].filter(Boolean).map(echapper).join('<br>');
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;background:#FAF7F0;border-radius:8px;margin:12px 0">
${ligne('Flyers A5', String(c.flyers_a5))}
${ligne('Affiches A3', String(c.affiches_a3))}
${ligne('Poids estimé', `${poids(c)} kg`)}
${ligne('Destinataire', echapper(`${c.prenom} ${c.nom}`) + (c.organisation ? `<br>${echapper(c.organisation)}` : ''))}
${ligne('Adresse', adresse)}
${ligne('Email', echapper(c.email))}
${c.telephone ? ligne('Téléphone', echapper(c.telephone)) : ''}
</table>`;
}

/** Tableau de récapitulatif : les valeurs sont échappées, les lignes vides sautées. */
function tableau(lignes: [string, string | undefined][]) {
  const rows = lignes
    .filter(([, v]) => v && v.trim())
    .map(([k, v]) => `<tr><td style="padding:6px 10px;color:#5F6F65;white-space:nowrap;vertical-align:top">${k}</td><td style="padding:6px 10px">${echapper(v).replace(/\n/g, '<br>')}</td></tr>`)
    .join('');
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;background:#FAF7F0;border-radius:8px;margin:12px 0">${rows}</table>`;
}
const ouiNon = (b: boolean) => (b ? 'oui' : 'non');
const lien = (href: string, txt: string) => `<a href="${href}" style="color:#B8461F;font-weight:bold">${txt}</a>`;

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

export async function envoyerEmailsDistribution(d: Distribution) {
  const { commandesEmail } = lireConfigBrevo();
  const equipe = await envoyerEmail({
    to: [{ email: commandesEmail }],
    replyTo: { email: d.email, name: `${d.prenom} ${d.nom}` },
    subject: `Nouvelle distribution : ${d.ville} (${d.code_postal}), ${dateFr(d.date)}`,
    html: gabarit('Nouvelle distribution déclarée', `<p>Une distribution vient d'être déclarée sur le site de la campagne.</p>
${recapDistribution(d)}
${tableau([
  ['Sur la carte publique', ouiNon(d.carte)],
  ['Accepte d’être contacté·e', ouiNon(d.contact)],
  ['Fiche pratique et rappels', ouiNon(d.rappels)],
])}
<p>Répondre à cet email écrit directement à la personne qui organise.</p>`),
  });
  const personne = await envoyerEmail({
    to: [{ email: d.email, name: `${d.prenom} ${d.nom}` }],
    subject: 'Votre distribution « Pas de pesticides pour nos enfants »',
    html: gabarit(`Merci ${echapper(d.prenom)}, votre distribution est bien enregistrée&nbsp;!`, `<p>Voici ce que vous avez déclaré&nbsp;:</p>
${recapDistribution(d)}
<h2 style="font-size:17px;margin:20px 0 8px;color:#004D40">Réussir sa distribution</h2>
<p style="margin:0 0 6px"><b>Avant</b>&nbsp;: prévoyez flyers, affiches, scotch, stylos et feuilles de signatures. Trouvez une ou deux personnes pour vous accompagner, et fixez l'heure, le lieu précis et la durée.</p>
<p style="margin:0 0 6px"><b>Pendant</b>&nbsp;: allez vers les gens avec le sourire, sans insister. Posez des questions simples, mettez en avant des messages concrets. Ne bloquez pas le passage et respectez les refus.</p>
<p style="margin:0 0 12px"><b>Après</b>&nbsp;: comptez les flyers distribués, les signatures et les contacts, et envoyez-nous une photo en réponse à cet email.</p>
<p>Pas encore de matériel&nbsp;? ${lien('https://pasdepesticidespournosenfants.net/commander', 'Commandez vos flyers et affiches')}, c'est gratuit.</p>
<p>Une question&nbsp;? Répondez simplement à cet email.</p>
<p>L'équipe de Bio Consom'acteurs</p>`),
  });
  return { equipe, personne };
}

export const DEMANDES_COURTES = [
  'Respecter EGalim tout de suite, et une trajectoire vers 100 % bio',
  'Cuisiner sur place',
  'Acheter local et de saison',
  'Une alternative végétarienne chaque jour',
  'Bannir le plastique',
  'Vers la gratuité de la cantine',
  'Zéro pesticide autour des écoles',
  'Des sanctions et des moyens pour EGalim',
  'Rejeter la loi Omnibus',
];

export interface Engagement {
  prenom: string; nom: string; qualite: string; territoire: string; departement: string;
  email: string; parti: string; mot: string; engagements: number[]; publication: boolean;
}

function recapEngagement(e: Engagement) {
  const liste = e.engagements.map((n) => `<li>${n}. ${echapper(DEMANDES_COURTES[n - 1])}</li>`).join('');
  return tableau([
    ['Élu·e ou candidat·e', `${e.prenom} ${e.nom}`],
    ['Mandat ou candidature', e.qualite],
    ['Territoire', e.territoire],
    ['Département', e.departement],
    ['Parti ou liste', e.parti],
    ['Email', e.email],
    ['Son mot', e.mot],
  ]) + `<p style="margin:12px 0 4px"><b>Engagements (${e.engagements.length} sur 9)&nbsp;:</b></p><ul style="margin:0 0 12px;padding-left:20px">${liste}</ul>`;
}

export async function envoyerEmailsEngagement(e: Engagement) {
  const { commandesEmail } = lireConfigBrevo();
  const equipe = await envoyerEmail({
    to: [{ email: commandesEmail }],
    replyTo: { email: e.email, name: `${e.prenom} ${e.nom}` },
    subject: `Nouvel engagement : ${e.prenom} ${e.nom}, ${e.qualite} (${e.departement})`,
    html: gabarit('Nouvel engagement d’élu·e ou de candidat·e', `<p>Un engagement vient d'arriver par la page Élu·es du site.</p>
${recapEngagement(e)}
<p>Accord pour la publication&nbsp;: <b>${ouiNon(e.publication)}</b>.</p>
<p>À faire&nbsp;: vérifier que la personne est bien celle qu'elle dit être (mandat, candidature, adresse email) avant toute publication. Répondre à cet email lui écrit directement.</p>`),
  });
  const personne = await envoyerEmail({
    to: [{ email: e.email, name: `${e.prenom} ${e.nom}` }],
    subject: 'Votre engagement « Pas de pesticides pour nos enfants »',
    html: gabarit(`Merci ${echapper(e.prenom)} ${echapper(e.nom)} pour votre engagement&nbsp;!`, `<p>Nous avons bien reçu votre engagement&nbsp;:</p>
${recapEngagement(e)}
<p>L'équipe de Bio Consom'acteurs vérifie chaque engagement avant de le publier sur le site. Nous revenons vers vous par email.</p>
<p>Pour aller plus loin, vous pouvez ${lien('https://pasdepesticidespournosenfants.net/appel', 'relire l’appel complet')} et ${lien('https://pasdepesticidespournosenfants.net/visuels/', 'partager les visuels de la campagne')}.</p>
<p>L'équipe de Bio Consom'acteurs</p>`),
  });
  return { equipe, personne };
}

/** Prévient l'équipe, puis confirme à la personne. Renvoie le résultat de chaque envoi. */
export async function envoyerEmailsCommande(c: Commande) {
  const { commandesEmail } = lireConfigBrevo();
  const equipe = await envoyerEmail({
    to: [{ email: commandesEmail }],
    replyTo: { email: c.email, name: `${c.prenom} ${c.nom}` },
    subject: `Nouvelle commande de matériel : ${c.prenom} ${c.nom} (${c.code_postal} ${c.ville})`,
    html: gabarit('Nouvelle commande de matériel', `<p>Une commande vient d'arriver par le site de la campagne.</p>
${recap(c)}
<p>Lettre d'information demandée&nbsp;: <b>${c.newsletter ? 'oui' : 'non'}</b>.</p>
<p>Prochaine étape&nbsp;: recontacter la personne pour confirmer l'envoi et le montant des frais de port. Répondre à cet email lui écrit directement.</p>`),
  });
  const personne = await envoyerEmail({
    to: [{ email: c.email, name: `${c.prenom} ${c.nom}` }],
    subject: 'Votre commande de matériel « Pas de pesticides pour nos enfants »',
    html: gabarit(`Merci ${echapper(c.prenom)}, votre commande est bien reçue&nbsp;!`, `<p>Voici le récapitulatif de votre commande&nbsp;:</p>
${recap(c)}
<p>Le matériel est gratuit. L'équipe de Bio Consom'acteurs vous recontacte par email pour confirmer l'envoi et le montant des frais de port, au coût réel. Expédition depuis Montreuil.</p>
<p>Pour faire vivre ce matériel&nbsp;: <a href="https://pasdepesticidespournosenfants.net/distribution" style="color:#B8461F;font-weight:bold">organisez une distribution</a> devant une école ou sur un marché, ou <a href="https://pasdepesticidespournosenfants.net/rencontre" style="color:#B8461F;font-weight:bold">sollicitez un rendez-vous avec votre élu·e</a>.</p>
<p>Une question&nbsp;? Répondez simplement à cet email.</p>
<p>L'équipe de Bio Consom'acteurs</p>`),
  });
  return { equipe, personne };
}
