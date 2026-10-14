/**
 * Lecture de la configuration Supabase.
 *
 * On lit UNIQUEMENT via `env` de `cloudflare:workers` (le runtime Worker) :
 * - en production, ce sont les secrets posés sur Cloudflare ;
 * - en local (`astro dev`), Wrangler alimente ce `env` depuis .env.local / .dev.vars.
 *
 * On n'utilise PAS import.meta.env ici : cela incrusterait la clé secrète dans le
 * bundle au build. La clé service_role reste donc purement runtime, jamais embarquée.
 */
import { env } from 'cloudflare:workers';

export function lireConfigSupabase() {
  const cfEnv = env as unknown as Record<string, string | undefined>;
  const url = cfEnv?.SUPABASE_URL ?? '';
  const key = cfEnv?.SUPABASE_SERVICE_ROLE_KEY ?? '';
  return { url, key, configure: Boolean(url && key) };
}

/**
 * Brevo de Bio Consom'acteurs (clé posée en secret Cloudflare BREVO_API_KEY).
 * Expéditeur et destinataire des commandes modifiables par variables, sans redéployer le code.
 */
export function lireConfigBrevo() {
  const cfEnv = env as unknown as Record<string, string | undefined>;
  const apiKey = cfEnv?.BREVO_API_KEY ?? '';
  return {
    apiKey,
    senderEmail: cfEnv?.BREVO_SENDER_EMAIL || 'contact@bioconsomacteurs.org',
    senderName: cfEnv?.BREVO_SENDER_NAME || "Bio Consom'acteurs",
    commandesEmail: cfEnv?.COMMANDES_EMAIL || 'contact@bioconsomacteurs.org',
    configure: Boolean(apiKey),
  };
}
