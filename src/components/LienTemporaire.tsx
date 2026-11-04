'use client';

import { useState } from 'react';
import { creerLienTemporaire } from '@/app/actions';

/**
 * Le bouton qui demande une adresse publique temporaire, et l'affiche.
 *
 * Le lien n'est pas mis dans l'adresse de la page : il vaut droit de lecture
 * sur le fichier, et l'adresse d'une page se retrouve dans un historique, un
 * journal de serveur, un partage d'écran. Il reste donc à l'écran, et nulle
 * part ailleurs.
 */
export function LienTemporaire({ entite, id }: { entite: string; id: number }) {
  const [etat, setEtat] = useState<
    { phase: 'repos' } | { phase: 'attente' } | { phase: 'ok'; url: string; expire: string; porte: string } | { phase: 'erreur'; raison: string }
  >({ phase: 'repos' });

  async function demander() {
    setEtat({ phase: 'attente' });
    const fd = new FormData();
    fd.set('entite', entite);
    fd.set('id', String(id));
    const r = await creerLienTemporaire(fd);
    setEtat(r.ok ? { phase: 'ok', url: r.url, expire: r.expire, porte: r.porte } : { phase: 'erreur', raison: r.raison });
  }

  return (
    <div style={{ marginTop: 9 }}>
      <button type="button" className="fantome" onClick={demander} disabled={etat.phase === 'attente'} style={{ padding: '7px 12px', fontSize: 12.5 }}>
        {etat.phase === 'attente' ? 'Signature…' : 'Lien public temporaire'}
      </button>

      {etat.phase === 'ok' ? (
        <>
          <pre className="bloc" style={{ fontSize: 11, marginTop: 9, wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
            {etat.url}
          </pre>
          <div className="aide" style={{ marginTop: 4 }}>
            Valable jusqu&apos;à {new Date(etat.expire).toLocaleString('fr-FR')} —{' '}
            {etat.porte === 'blob' ? 'servi par le stockage, sans passer par l’outil' : 'servi par l’outil, donc local'}. Passé
            ce délai le fichier redevient privé.
          </div>
          <button
            type="button"
            className="fantome"
            onClick={() => navigator.clipboard?.writeText(etat.url)}
            style={{ padding: '6px 11px', fontSize: 12, marginTop: 7 }}
          >
            Copier
          </button>
        </>
      ) : null}

      {etat.phase === 'erreur' ? (
        <div className="constat" data-n="blocage" style={{ marginTop: 9 }}>
          <div className="regle">Lien refusé</div>
          <div className="msg">{etat.raison}</div>
        </div>
      ) : null}
    </div>
  );
}
