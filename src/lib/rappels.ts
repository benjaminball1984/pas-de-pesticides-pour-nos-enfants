/**
 * Rappels des distributions, lancés chaque matin par la tâche planifiée du Worker (src/worker.ts).
 * Veille et jour J, pour qui a coché « Recevoir la fiche pratique et des rappels ».
 * Chaque envoi est noté dans le payload (rappel_veille / rappel_jour) pour ne partir qu'une fois.
 */
import { base, jourParis, completerPayload } from './demandes';
import { envoyerRappelDistribution, type Distribution } from './brevo';

function versDistribution(p: Record<string, unknown>): Distribution {
  const s = (k: string) => String(p[k] ?? '');
  return {
    lieu: s('d-lieu'), adresse: s('d-adr'), code_postal: s('d-cp'), ville: s('d-ville'), type_lieu: s('d-type'),
    date: s('d-date'), horaires: s('d-h'), commentaire: s('d-com'), prenom: s('d-prenom'), nom: s('d-nom'),
    email: s('d-email'), telephone: s('d-tel'), organisation: s('d-org'),
    carte: p['d-carte'] === true, contact: p['d-contact'] === true, rappels: p['d-rappel'] === true,
  };
}

export async function envoyerRappels(): Promise<{ veille: number; jour: number }> {
  const sb = base();
  const compte = { veille: 0, jour: 0 };
  if (!sb) return compte;
  const tours: ['veille' | 'jour', string][] = [['veille', jourParis(1)], ['jour', jourParis(0)]];
  for (const [quand, date] of tours) {
    const { data, error } = await sb.from('demande').select('id, payload')
      .eq('type', 'distribution').eq('payload->>d-rappel', 'true').eq('payload->>d-date', date);
    if (error) { console.error('[rappels] lecture', error.message); continue; }
    for (const l of data ?? []) {
      const p = l.payload as Record<string, unknown>;
      const marque = quand === 'veille' ? 'rappel_veille' : 'rappel_jour';
      if (p[marque] || p.masque === true) continue;
      const ok = await envoyerRappelDistribution(versDistribution(p), quand);
      if (ok) { await completerPayload(l.id, { [marque]: new Date().toISOString() }); compte[quand]++; }
    }
  }
  console.log(`[rappels] veille=${compte.veille} jour=${compte.jour}`);
  return compte;
}
