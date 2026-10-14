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
