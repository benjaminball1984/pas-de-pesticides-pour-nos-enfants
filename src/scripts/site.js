// Comportements partagés : formulaires et boutons de partage.
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

// Tables (distributions) : route /api/demande (JSON)
brancher('form-distribution', 'merci-distrib', (f) => {
  if (f.querySelector('[name="site_web"]').value) return Promise.resolve(new Response('{"ok":true}'));
  const payload = {};
  f.querySelectorAll('input[id], select[id], textarea[id]').forEach((el) => { payload[el.id] = valeur(f, el.id); });
  return fetch('/api/demande', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'distribution', email: payload['d-email'] || '', payload }),
  });
});

// Boutons de partage : [data-partage] reçoit les liens ; data-texte remplace le message par défaut.
const LIEN = 'https://pasdepesticidespournosenfants.net';
const TEXTE = `J'ai signé la pétition « Pas de pesticides pour nos enfants » de Bio Consom'acteurs. Signez aussi : ${LIEN}`;
document.querySelectorAll('[data-partage]').forEach((zone) => {
  const texte = zone.getAttribute('data-texte') || TEXTE;
  const t = encodeURIComponent(texte);
  const u = encodeURIComponent(LIEN);
  const liens = [
    ['WhatsApp', `https://wa.me/?text=${t}`],
    ['Facebook', `https://www.facebook.com/sharer/sharer.php?u=${u}`],
    ['X', `https://x.com/intent/post?text=${t}`],
    ['Bluesky', `https://bsky.app/intent/compose?text=${t}`],
    ['Email', `mailto:?subject=${encodeURIComponent('Pas de pesticides pour nos enfants')}&body=${t}`],
  ];
  zone.innerHTML = liens.map(([nom, href]) => `<a class="btn btn-noir" href="${href}">${nom}</a>`).join('')
    + '<button class="btn btn-ghost" type="button" data-copier>Copier</button>';
  const copier = zone.querySelector('[data-copier]');
  copier.addEventListener('click', () => {
    const ok = () => { copier.textContent = 'Copié'; setTimeout(() => { copier.textContent = 'Copier'; }, 2000); };
    if (navigator.clipboard) navigator.clipboard.writeText(texte).then(ok, () => {});
  });
  if (navigator.share) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'btn btn-corail'; b.textContent = 'Partager…';
    b.addEventListener('click', () => navigator.share({ title: 'Pas de pesticides pour nos enfants', text: texte }).catch(() => {}));
    zone.prepend(b);
  }
});
