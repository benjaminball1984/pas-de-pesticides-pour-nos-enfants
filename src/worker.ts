// Point d'entrée du Worker : le site Astro, plus la tâche planifiée du matin (rappels des distributions).
import serveur from '@astrojs/cloudflare/entrypoints/server';
import { envoyerRappels } from './lib/rappels';

export default {
  fetch: serveur.fetch,
  async scheduled(_controller: unknown, _env: unknown, ctx: { waitUntil(p: Promise<unknown>): void }) {
    ctx.waitUntil(envoyerRappels());
  },
};
