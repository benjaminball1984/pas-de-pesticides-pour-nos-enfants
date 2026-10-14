// Comportements partagés : formulaires, quantités de la commande, modèles de courrier.
// Chaque bloc ne s'active que si ses éléments sont présents sur la page.

const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Liens externes : toujours dans un nouvel onglet (règle commune aux sites de la campagne).
document.addEventListener('click', (e) => {
  const a = e.target.closest && e.target.closest('a[href^="http"]');
  if (a && a.host !== location.host) { a.target = '_blank'; a.rel = 'noopener'; }
}, true);

function valeur(f, id) {
  const el = f.querySelector('#' + id);
  if (!el) return null;
  return el.type === 'checkbox' ? el.checked : el.value.trim();
}

// Vérifie les champs obligatoires ; renvoie le premier champ fautif.
function verifier(f) {
  let bad = null;
  f.querySelectorAll('[required]').forEach((i) => {
    const ok = i.type === 'checkbox' ? i.checked
      : i.value.trim() !== '' && (i.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(i.value.trim()));
    i.setAttribute('aria-invalid', ok ? 'false' : 'true');
    if (!ok && !bad) bad = i;
  });
  return bad;
}

function nomDuChamp(f, el) {
  if (el.type === 'checkbox') return 'la case à cocher';
  const lab = f.querySelector('label[for="' + el.id + '"]');
  return '« ' + (lab ? lab.firstChild.textContent.trim() : 'champ') + ' »';
}

function brancher(formId, doneId, envoyer) {
  const f = document.getElementById(formId);
  if (!f) return;
  const err = f.querySelector('.form-err');
  const bouton = f.querySelector('button[type="submit"]');
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const bad = verifier(f);
    if (bad) { err.textContent = 'Il manque ' + nomDuChamp(f, bad) + '.'; err.hidden = false; bad.focus(); return; }
    err.hidden = true;
    const libelle = bouton.textContent;
    bouton.disabled = true; bouton.textContent = 'Envoi…';
    try {
      const res = await envoyer(f);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.erreur || 'Une erreur est survenue. Merci de réessayer dans un instant.');
      const d = document.getElementById(doneId);
      if (formId === 'form-signer') {
        const p = document.getElementById('merci-prenom');
        if (p) p.textContent = valeur(f, 's-prenom');
        f.hidden = true;
      }
      d.hidden = false;
      d.scrollIntoView({ block: 'center', behavior: reduit ? 'auto' : 'smooth' });
    } catch (x) {
      err.textContent = x.message; err.hidden = false;
    } finally {
      bouton.disabled = false; bouton.textContent = libelle;
    }
  });
}

// Pétition : route /api/signer (FormData, champ piège site_web)
brancher('form-signer', 'merci', (f) => {
  const fd = new FormData();
  fd.set('site_web', f.querySelector('[name="site_web"]').value);
  fd.set('prenom', valeur(f, 's-prenom'));
  fd.set('nom', valeur(f, 's-nom'));
  fd.set('email', valeur(f, 's-email'));
  fd.set('code_postal', valeur(f, 's-cp'));
  fd.set('telephone', valeur(f, 's-tel'));
  if (valeur(f, 's-info')) fd.set('info_campagne', 'on');
  if (valeur(f, 's-nl')) fd.set('newsletter', 'on');
  return fetch('/api/signer', { method: 'POST', body: fd });
});

// Commandes, distributions, engagements d'élu·es : route /api/demande (JSON)
function demande(type, f, extra) {
  if (f.querySelector('[name="site_web"]').value) return Promise.resolve(new Response('{"ok":true}'));
  const payload = { ...extra };
  f.querySelectorAll('input[id], select[id], textarea[id]').forEach((el) => { payload[el.id] = valeur(f, el.id); });
  const email = payload['c-email'] || payload['d-email'] || payload['e-email'] || '';
  return fetch('/api/demande', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type, email, payload }),
  });
}
const q = { a5: 100, a3: 10 };
brancher('form-commander', 'merci-commande', (f) => demande('commande', f, { flyers_a5: q.a5, affiches_a3: q.a3 }));
brancher('form-distribution', 'merci-distrib', (f) => demande('distribution', f, {}));
brancher('form-elus', 'merci-elus', (f) => {
  const engagements = [...f.querySelectorAll('#e-dem input')].map((c, i) => (c.checked ? i + 1 : null)).filter(Boolean);
  return demande('autre', f, { formulaire: 'engagement_elu', engagements });
});

// Commande : quantités et poids estimé
if (document.getElementById('q-a5')) {
  const W = { a5: 0.008, a3: 0.04 };
  const kg = (n) => n.toFixed(1).replace('.', ',') + ' kg';
  const set = (id, v) => { document.getElementById(id).textContent = v; };
  const paint = () => {
    set('q-a5', q.a5); set('q-a3', q.a3); set('r-a5', q.a5); set('r-a3', q.a3);
    set('r-a5-w', kg(q.a5 * W.a5)); set('r-a3-w', kg(q.a3 * W.a3)); set('r-w', kg(q.a5 * W.a5 + q.a3 * W.a3));
    document.querySelector('[data-fmt="a5"]').classList.toggle('on', q.a5 > 0);
    document.querySelector('[data-fmt="a3"]').classList.toggle('on', q.a3 > 0);
  };
  document.querySelectorAll('.format').forEach((card) => {
    const k = card.getAttribute('data-fmt');
    card.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => {
      q[k] = Math.max(0, Math.min(k === 'a5' ? 2000 : 200, q[k] + Number(b.getAttribute('data-step'))));
      paint();
    }));
  });
  paint();
}

// Modèles de courrier
if (document.getElementById('letter')) {
  const v = (t) => '<span class="var">' + t + '</span>';
  const DEMANDES = [
    'Respecter immédiatement la loi EGalim : 50 % de produits durables et de qualité dont 20 % de bio dans toutes les cantines, et une trajectoire vers 100 % bio.',
    'Revenir à une cuisine faite sur place, par des cuisinier·es formé·es et dignement rémunéré·es.',
    'Privilégier l’achat direct, local et de saison auprès des paysannes et paysans bio du territoire.',
    'Proposer une alternative végétarienne chaque jour et réduire la part des produits carnés.',
    'Réduire les déchets et bannir les contenants plastiques de cuisson, de réchauffe et de service.',
    'Garantir progressivement la gratuité de la cantine, en commençant par les familles les plus modestes.',
    'Interdire l’usage des pesticides dans tous les espaces publics, en particulier autour des crèches et des écoles.',
    'Renforcer EGalim avec des sanctions effectives, et donner aux collectivités les moyens de l’appliquer.',
    'Rejeter la loi Omnibus, qui supprimerait les réévaluations des pesticides.',
  ];
  const CONSTATS = 'Elle s’appuie sur des constats établis : l’expertise collective de l’INSERM (2021) établit une présomption forte de lien entre l’exposition aux pesticides chez l’enfant et la survenue de cancers pédiatriques ; en 2025, l’Anses a alerté sur les effets de certains insecticides sur le neurodéveloppement des jeunes enfants ; l’étude PestiRiv (Santé publique France et Anses, septembre 2025) confirme que vivre près des cultures expose davantage. Huit ans après le vote de la loi EGalim, le bio représente moins de 7 % des achats de la restauration collective (Agence Bio), et seules 18 % des communes respectent les deux seuils de la loi (AMF, 2024).';
  const L = {
    maire: { label: 'Maire de la commune', dest: v('Madame la Maire / Monsieur le Maire') + '<br>Mairie de ' + v('[votre commune]') + '<br>' + v('[adresse de la mairie]'),
      objet: 'Pétition « Pas de pesticides pour nos enfants » : demande de rencontre', appel: v('Madame la Maire / Monsieur le Maire'),
      qui: 'Nous, parents, habitant·es et citoyen·nes de ' + v('[votre commune]') + ', sollicitons une rencontre avec vous, parce que la cantine scolaire est le premier levier dont vous disposez pour protéger la santé de nos enfants.',
      role: 'En tant que maire, vous avez la responsabilité directe des cantines des écoles maternelles et élémentaires de notre commune, ainsi que de l’usage des pesticides dans les espaces publics autour de ces écoles. Nous vous demandons d’engager publiquement la commune sur ces mesures, dans le périmètre de vos compétences.' },
    dep: { label: 'Conseil départemental', dest: v('Madame la Présidente / Monsieur le Président') + '<br>Conseil départemental ' + v('[du département]') + '<br>' + v('[adresse du conseil]'),
      objet: 'Pétition « Pas de pesticides pour nos enfants » : demande de rencontre pour les collèges du département', appel: v('Madame la Présidente / Monsieur le Président'),
      qui: 'Nous, parents et citoyen·nes du département ' + v('[nom du département]') + ', sollicitons une rencontre avec vous, parce que la restauration scolaire des collèges est une compétence du Département.',
      role: 'Le Département a la responsabilité directe des cantines des collèges et de la passation des marchés publics de restauration. Nous vous demandons un engagement public, immédiat et chiffré sur ces mesures pour les collèges du département.' },
    reg: { label: 'Conseil régional', dest: v('Madame la Présidente / Monsieur le Président') + '<br>Conseil régional ' + v('[de la région]') + '<br>' + v('[adresse du conseil]'),
      objet: 'Pétition « Pas de pesticides pour nos enfants » : demande de rencontre pour les lycées de la région', appel: v('Madame la Présidente / Monsieur le Président'),
      qui: 'Nous, parents, lycéen·nes et citoyen·nes de la région ' + v('[nom de la région]') + ', sollicitons une rencontre avec vous, parce que la restauration scolaire des lycées est une compétence régionale.',
      role: 'La Région a la responsabilité directe des cantines des lycées et joue un rôle majeur dans le développement de la filière bio régionale et l’accompagnement des paysan·nes du territoire. Nous vous demandons un engagement public, immédiat et chiffré sur ces mesures.' },
    depute: { label: 'Député·e de la circonscription', dest: v('Madame la Députée / Monsieur le Député') + '<br>Assemblée nationale<br>126 rue de l’Université, 75355 Paris 07 SP',
      objet: 'Pétition « Pas de pesticides pour nos enfants » : demande de rencontre dans votre circonscription', appel: v('Madame la Députée / Monsieur le Député'),
      qui: 'Nous, parents, habitant·es et citoyen·nes de votre circonscription, sollicitons une rencontre avec vous, parce que l’Assemblée nationale vote la loi qui protège la santé alimentaire de nos enfants.',
      role: 'Plusieurs de nos demandes supposent une intervention de la loi : des sanctions effectives pour EGalim, la gratuité de la cantine, l’interdiction des pesticides autour des écoles, les moyens des collectivités. Nous vous demandons de vous engager publiquement sur ces points.' },
    euro: { label: 'Eurodéputé·e', dest: v('Madame la Députée européenne / Monsieur le Député européen') + '<br>Parlement européen<br>60 rue Wiertz, 1047 Bruxelles, Belgique',
      objet: 'Pétition « Pas de pesticides pour nos enfants » : la loi Omnibus', appel: v('Madame la Députée européenne / Monsieur le Député européen'),
      qui: 'Nous, parents et citoyen·nes de ' + v('[votre commune]') + ', vous écrivons parce que le Parlement européen doit se prononcer sur la loi Omnibus pesticides.',
      role: 'La loi Omnibus supprimerait les réévaluations des pesticides et ouvrirait un énième laisser-passer aux entreprises agrochimiques. Nous vous demandons de la rejeter, et de nous recevoir pour en parler.' },
  };
  const render = (k) => {
    const d = L[k];
    document.getElementById('letter-label').textContent = 'Modèle · ' + d.label;
    document.getElementById('letter').innerHTML =
      '<p>' + v('[Prénom Nom]') + '<br>' + v('[adresse]') + '<br>' + v('[email]') + '</p>' +
      '<p class="right">' + d.dest + '</p>' +
      '<p class="right">À ' + v('[votre commune]') + ', le ' + v('[date]') + '</p>' +
      '<p><b>Objet&nbsp;:</b> ' + d.objet + '</p>' +
      '<p>' + d.appel + ',</p>' +
      '<p>' + d.qui + '</p>' +
      '<p>Nous portons la pétition «&nbsp;Pas de pesticides pour nos enfants&nbsp;», lancée par l’association Bio Consom’acteurs. ' + CONSTATS + '</p>' +
      '<p>La pétition formule neuf demandes&nbsp;:</p><ol>' + DEMANDES.map((x) => '<li>' + x + '</li>').join('') + '</ol>' +
      '<p>' + d.role + '</p>' +
      '<p>Une délégation de notre collectif serait heureuse de vous présenter nos demandes et les expériences déjà menées ailleurs, à votre convenance, dans les semaines qui viennent.</p>' +
      '<p>Dans l’attente de votre réponse, nous vous prions d’agréer, ' + d.appel + ', l’expression de notre considération distinguée.</p>' +
      '<p>' + v('[Signature]') + '</p>';
    document.querySelectorAll('.who-pick button').forEach((b) => b.setAttribute('aria-pressed', b.getAttribute('data-who') === k ? 'true' : 'false'));
  };
  document.querySelectorAll('.who-pick button').forEach((b) => b.addEventListener('click', () => render(b.getAttribute('data-who'))));
  render('maire');
  document.getElementById('copy-letter').addEventListener('click', () => {
    const el = document.getElementById('letter');
    const tag = document.getElementById('copied');
    const show = (t) => { tag.textContent = t; tag.hidden = false; setTimeout(() => { tag.hidden = true; }, 2400); };
    const fallback = () => {
      const r = document.createRange(); r.selectNodeContents(el);
      const s = getSelection(); s.removeAllRanges(); s.addRange(r);
      show('Texte sélectionné : Ctrl+C pour copier');
    };
    if (navigator.clipboard) navigator.clipboard.writeText(el.innerText).then(() => show('Texte copié'), fallback);
    else fallback();
  });
}

// Élu·es : liste publique des engagements, filtrable par département
const listeEng = document.getElementById('engage-list');
if (listeEng) {
  const vide = listeEng.innerHTML;
  const filtre = document.getElementById('e-filtre');
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const COURT = ['EGalim', 'Cuisine sur place', 'Local et de saison', 'Végétarien chaque jour', 'Sans plastique', 'Gratuité', 'Zéro pesticide', 'Sanctions et moyens', 'Contre l’Omnibus'];
  let tous = [];
  const afficher = () => {
    const dep = (filtre?.value || '').trim().toUpperCase();
    const vus = dep ? tous.filter((e) => String(e.departement).toUpperCase() === dep) : tous;
    if (!vus.length) {
      listeEng.innerHTML = dep && tous.length
        ? `<div class="empty"><b>Aucun engagement publié dans ce département pour l'instant.</b><span>Sollicitez vos élu·es avec notre <a class="link" href="/rencontre">modèle de courrier</a>.</span></div>`
        : vide;
      return;
    }
    listeEng.innerHTML = vus.map((e) => `<article class="eng"><b>${esc(e.nom)}</b><span class="q">${esc(e.qualite)} · ${esc(e.territoire)} (${esc(e.departement)})${e.parti ? ' · ' + esc(e.parti) : ''}</span>
<span class="tags">${(e.engagements || []).length === 9 ? '<span>Les 9 demandes</span>' : (e.engagements || []).map((n) => `<span>${esc(COURT[n - 1])}</span>`).join('')}</span>
${e.mot ? `<blockquote>« ${esc(e.mot)} »</blockquote>` : ''}</article>`).join('');
  };
  filtre?.addEventListener('input', afficher);
  fetch('/api/engagements').then((r) => r.json()).then((j) => { tous = j.engagements || []; afficher(); }).catch(() => {});
}

// Visuels : copie du lien Canva
document.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', () => {
  const t = b.getAttribute('data-copy');
  const ok = () => { const l = b.textContent; b.textContent = 'Lien copié'; setTimeout(() => { b.textContent = l; }, 2000); };
  if (navigator.clipboard) navigator.clipboard.writeText(t).then(ok, () => {});
}));
