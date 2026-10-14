// Carte publique des distributions à venir (page /distribution). Fond OpenStreetMap, Leaflet embarqué.
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const el = document.getElementById('carte');
const liste = document.getElementById('dist-liste');

if (el) {
  const carte = L.map(el, { scrollWheelZoom: false }).setView([46.6, 2.4], 5);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; contributeurs <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
  }).addTo(carte);

  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const jour = (iso) => new Date(iso + 'T12:00:00Z').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });

  fetch('/api/distributions').then((r) => r.json()).then(({ distributions = [] }) => {
    if (!distributions.length) return;
    liste.innerHTML = '';
    const points = [];
    distributions.forEach((d) => {
      const texte = `<time>${esc(jour(d.date))}</time><b>${esc(d.lieu)}</b><span>${esc(d.ville)} (${esc(d.cp)}) · ${esc(d.horaires)}</span><span>${esc(d.type)} · avec ${esc(d.par)}</span>`;
      let marque = null;
      if (d.lat != null && d.lng != null) {
        marque = L.circleMarker([d.lat, d.lng], { radius: 9, color: '#004D40', weight: 2, fillColor: '#EB734D', fillOpacity: 0.95 })
          .addTo(carte).bindPopup(`<div style="display:grid;gap:2px">${texte}</div>`);
        points.push([d.lat, d.lng]);
      }
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'dist';
      b.innerHTML = texte;
      b.addEventListener('click', () => {
        if (!marque) return;
        carte.setView(marque.getLatLng(), 14);
        marque.openPopup();
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
      liste.appendChild(b);
    });
    if (points.length === 1) carte.setView(points[0], 12);
    else if (points.length > 1) carte.fitBounds(points, { padding: [30, 30], maxZoom: 12 });
  }).catch(() => {});
}
