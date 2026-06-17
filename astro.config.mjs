import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  // Domaine cible (utilisé pour les liens canoniques et les images de partage social).
  // À confirmer : domaine définitif. En attendant, on vise le domaine prévu.
  site: 'https://pasdepesticidespournosenfants.fr',

  // Pages générées en statique (rapides, mises en cache au bord du réseau).
  // Seules les routes /api/* sont dynamiques (`export const prerender = false`).
  output: 'static',

  // On n'utilise pas les sessions Astro : un driver mémoire inerte évite que
  // l'adaptateur Cloudflare réclame un namespace KV « SESSION » au déploiement.
  session: { driver: 'memory' },

  // Déploiement sur Cloudflare (Workers). En dev comme en prod, les variables/secrets
  // sont lus via `cloudflare:workers` (et .dev.vars / .env.local en local).
  adapter: cloudflare(),
});
