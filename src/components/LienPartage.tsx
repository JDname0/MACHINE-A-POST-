'use client';

import { useState } from 'react';
import { creerLienPartage, revoquerLienPartage } from '@/app/actions';
import { DUREES_PARTAGE, type DureePartage } from '@/lib/partage';

type Lien = { id: number; jeton: string; duree: string; expire_le: string | null };

/**
 * Lien de partage d'un fichier : 2 heures, 30 jours ou permanent, révocable
 * un par un. Réservé à la direction (le serveur le refuse à l'équipe de
 * toute façon).
 */
export function LienPartage({ entite, id, liens, base, permis }: { entite: string; id: number; liens: Lien[]; base: string; permis: boolean }) {
  const [duree, setDuree] = useState<DureePartage>('permanent');
  const [etat, setEtat] = useState<{ phase: 'repos' } | { phase: 'attente' } | { phase: 'ok' } | { phase: 'erreur'; raison: string }>({ phase: 'repos' });

  if (!permis) {
    return (
      <div className="aide" style={{ marginTop: 9 }}>
        Lien de partage : réservé à Jonathan.
      </div>
    );
  }

  async function creer() {
    setEtat({ phase: 'attente' });
    const fd = new FormData();
    fd.set('entite', entite);
    fd.set('id', String(id));
    fd.set('duree', duree);
    const r = await creerLienPartage(fd);
    setEtat(r.ok ? { phase: 'ok' } : { phase: 'erreur', raison: r.raison });
  }

  const echeance = (l: Lien) =>
    l.expire_le
      ? `valable jusqu’au ${new Date(`${l.expire_le.replace(' ', 'T')}Z`).toLocaleString('fr-FR', { timeZone: 'Europe/Paris', dateStyle: 'short', timeStyle: 'short' })}`
      : 'permanent, jusqu’à révocation';

  return (
    <div style={{ marginTop: 9 }}>
      <div className="rang" style={{ gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={duree} onChange={(e) => setDuree(e.target.value as DureePartage)} aria-label="Durée du lien" style={{ fontSize: 12.5 }}>
          {(Object.keys(DUREES_PARTAGE) as DureePartage[]).map((k) => (
            <option key={k} value={k}>
              {DUREES_PARTAGE[k].libelle}
            </option>
          ))}
        </select>
        <button type="button" className="fantome" onClick={creer} disabled={etat.phase === 'attente'} style={{ padding: '7px 12px', fontSize: 12.5 }}>
          {etat.phase === 'attente' ? 'Création…' : 'Créer un lien de partage'}
        </button>
      </div>

      {etat.phase === 'ok' ? (
        <div className="aide" style={{ marginTop: 6 }}>
          ✓ Lien créé : il apparaît ci-dessous, prêt à copier.
        </div>
      ) : null}
      {etat.phase === 'erreur' ? (
        <div className="constat" data-n="blocage" style={{ marginTop: 9 }}>
          <div className="regle">Lien refusé</div>
          <div className="msg">{etat.raison}</div>
        </div>
      ) : null}

      {liens.length ? (
        <div className="pile" style={{ marginTop: 9 }}>
          {liens.map((l) => (
            <div key={l.id} data-lien-partage={l.id} style={{ fontSize: 11.5 }}>
              <pre className="bloc" style={{ fontSize: 11, wordBreak: 'break-all', whiteSpace: 'pre-wrap', margin: 0 }}>
                {`${base}/p/${l.jeton}`}
              </pre>
              <div className="rang" style={{ gap: 7, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                <span className="aide">{echeance(l)}</span>
                <button
                  type="button"
                  className="fantome"
                  onClick={() => navigator.clipboard?.writeText(`${base}/p/${l.jeton}`)}
                  style={{ padding: '5px 10px', fontSize: 12 }}
                >
                  Copier
                </button>
                <form action={revoquerLienPartage}>
                  <input type="hidden" name="entite" value={entite} />
                  <input type="hidden" name="lien" value={l.id} />
                  <button type="submit" className="fantome" style={{ padding: '5px 10px', fontSize: 12 }}>
                    Révoquer
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
