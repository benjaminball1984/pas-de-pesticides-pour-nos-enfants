// Interactions des pages secondaires (commander, distribution, rencontre).
// Importé via <script> dans chaque page concernée.

// ── Quantités (page commander) ────────────────────────────────
window.updateQty = function (fmt, delta) {
  const el = document.getElementById('qty-' + fmt);
  if (!el) return;
  const min = Number(el.min) || 0;
  const max = Number(el.max) || 9999;
  el.value = Math.max(min, Math.min(max, (Number(el.value) || 0) + delta));
  window.updateRecap();
};

window.updateRecap = function () {
  const a5 = Number((document.getElementById('qty-a5') || {}).value || 0);
  const a3 = Number((document.getElementById('qty-a3') || {}).value || 0);
  const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  const kg = (n) => n.toFixed(1).replace('.', ',') + ' kg';
  set('r-a5', a5);
  set('r-a3', a3);
  const wA5 = (a5 * 8) / 1000; // ~8 g par flyer A5
  const wA3 = (a3 * 40) / 1000; // ~40 g par affiche A3
  set('r-a5-w', kg(wA5));
  set('r-a3-w', kg(wA3));
  set('r-weight', kg(wA5 + wA3));
};

// ── Onglets élu + copie (page rencontre) ──────────────────────
window.selectElu = function (label, key) {
  document.querySelectorAll('.elu-type').forEach((l) => l.classList.toggle('selected', l === label));
  document.querySelectorAll('.model').forEach((m) => m.classList.toggle('active', m.getAttribute('data-model') === key));
};

window.copyModel = function (btn) {
  const article = btn.closest('.model');
  const corps = article ? article.querySelector('.body') || article : null;
  const texte = corps ? corps.innerText.trim() : '';
  if (!texte || !navigator.clipboard) return;
  navigator.clipboard.writeText(texte).then(() => {
    const avant = btn.textContent;
    btn.textContent = '✓ Copié !';
    setTimeout(() => { btn.textContent = avant; }, 1800);
  });
};

// ── Formulaires « demande » (commander, distribution) ─────────
function libelle(el, i) {
  const lab = el.closest('label');
  const proche = el.closest('.row1, .row2, div');
  const txt =
    (lab && lab.querySelector('.label') && lab.querySelector('.label').textContent) ||
    (proche && proche.querySelector('.label') && proche.querySelector('.label').textContent) ||
    el.placeholder || el.name || ('champ ' + (i + 1));
  return txt.trim();
}

document.querySelectorAll('form[data-intake]').forEach((form) => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Honeypot anti-robot.
    const hp = form.querySelector('[name="site_web"]');
    if (hp && hp.value.trim() !== '') return;

    const btn = e.submitter || form.querySelector('button[type="submit"]');
    const type = form.getAttribute('data-intake');
    const payload = {};
    let email = '';
    form.querySelectorAll('input, select, textarea').forEach((el, i) => {
      if (['submit', 'button'].includes(el.type) || el.name === 'site_web') return;
      const cle = libelle(el, i);
      const val = el.type === 'checkbox' ? el.checked : el.value;
      if (el.type === 'email' && el.value) email = el.value;
      payload[cle] = val;
    });

    const avant = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Envoi…'; }
    try {
      const r = await fetch('/api/demande', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type, email, payload }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.ok) {
        if (btn) {
          btn.textContent = '✓ Demande bien reçue — l’équipe vous recontacte';
          btn.style.background = 'var(--green-700)';
          btn.style.color = 'var(--cream)';
          btn.style.boxShadow = '0 4px 0 var(--green-900)';
        }
        form.querySelectorAll('input, select, textarea, button').forEach((x) => (x.disabled = true));
      } else {
        if (btn) { btn.disabled = false; btn.textContent = avant; }
        alert(d.erreur === 'db' ? 'Une erreur est survenue. Merci de réessayer.' : d.erreur || 'Une erreur est survenue. Merci de réessayer.');
      }
    } catch (_) {
      if (btn) { btn.disabled = false; btn.textContent = avant; }
      alert('Connexion impossible. Merci de réessayer.');
    }
  });
});
