/**
 * Liens de modération envoyés à l'équipe (publier ou retirer un engagement, retirer une distribution).
 * Signés par HMAC avec le secret LIENS_SECRET : sans le secret, impossible de fabriquer un lien valide.
 */
import { env } from 'cloudflare:workers';

export type Action = 'publier' | 'retirer' | 'remettre';
const SITE = 'https://pasdepesticidespournosenfants.net';

function secret(): string {
  const s = (env as unknown as Record<string, string | undefined>).LIENS_SECRET ?? '';
  return s.replace(/^﻿/, '').trim();
}

async function hmac(message: string): Promise<string> {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function lienModeration(action: Action, id: string): Promise<string> {
  if (!secret()) return '';
  return `${SITE}/api/moderer?a=${action}&id=${id}&t=${await hmac(`${action}:${id}`)}`;
}

export async function verifier(action: string, id: string, t: string): Promise<boolean> {
  if (!secret() || !t) return false;
  const attendu = await hmac(`${action}:${id}`);
  // comparaison à durée constante
  if (attendu.length !== t.length) return false;
  let diff = 0;
  for (let i = 0; i < t.length; i++) diff |= attendu.charCodeAt(i) ^ t.charCodeAt(i);
  return diff === 0;
}
