'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fabriquerVideo, enregistrerVideo, type Montage } from '@/lib/fabrique-video';

/**
 * Production en lot : toutes les vidéos dues, fabriquées l'une après l'autre
 * avec leur montage par défaut, puis rangées dans la médiathèque.
 *
 * Ce n'est pas une publication : chaque vidéo arrive rattachée à son post, qui
 * reste à relire et à valider un par un dans la file. Le lot fait gagner le
 * montage, pas la décision.
 */

export interface ElementLot {
  publicationId: number;
  titre: string;
  echeance: string;
  montage: Montage;
}

type EtatLigne = 'attente' | 'fabrication' | 'envoi' | 'faite' | 'erreur';

export function ProductionLot({ elements }: { elements: ElementLot[] }) {
  const router = useRouter();
  const [etats, setEtats] = useState<Record<number, { etat: EtatLigne; pourcent?: number; message?: string }>>({});
  const [enCours, setEnCours] = useState(false);

  const poser = (id: number, v: { etat: EtatLigne; pourcent?: number; message?: string }) =>
    setEtats((e) => ({ ...e, [id]: v }));

  async function lancer() {
    setEnCours(true);
    for (const el of elements) {
      if (etats[el.publicationId]?.etat === 'faite') continue;
      try {
        poser(el.publicationId, { etat: 'fabrication', pourcent: 0 });
        const { fichier } = await fabriquerVideo(el.montage, (pc) => poser(el.publicationId, { etat: 'fabrication', pourcent: pc }));
        poser(el.publicationId, { etat: 'envoi', pourcent: 0 });
        await enregistrerVideo(el.montage, fichier, (pc) => poser(el.publicationId, { etat: 'envoi', pourcent: pc }));
        poser(el.publicationId, { etat: 'faite' });
      } catch (e) {
        poser(el.publicationId, { etat: 'erreur', message: e instanceof Error ? e.message : String(e) });
      }
    }
    setEnCours(false);
    router.refresh();
  }

  if (elements.length === 0) return null;
  return (
    <div className="carte" style={{ marginBottom: 16 }}>
      <div className="rang" style={{ justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ marginBottom: 4 }}>
            {elements.length} vidéo{elements.length > 1 ? 's' : ''} à produire maintenant
          </h3>
          <div className="aide">
            Échéance dépassée ou dans les sept jours. Montage par défaut (script ou texte du post, images de la mémoire) ;
            chaque vidéo reste à relire et à valider dans la file.
          </div>
        </div>
        <button type="button" onClick={lancer} disabled={enCours}>
          {enCours ? 'Production en cours…' : `Générer ${elements.length > 1 ? `les ${elements.length} vidéos` : 'la vidéo'}`}
        </button>
      </div>
      <ul style={{ margin: '10px 0 0', paddingLeft: 18 }}>
        {elements.map((el) => {
          const e = etats[el.publicationId];
          const libelle =
            !e || e.etat === 'attente'
              ? ''
              : e.etat === 'fabrication'
                ? ` — fabrication ${e.pourcent ?? 0} %`
                : e.etat === 'envoi'
                  ? ` — envoi ${e.pourcent ?? 0} %`
                  : e.etat === 'faite'
                    ? ' — ✅ prête'
                    : ` — ⚠️ ${e.message}`;
          return (
            <li key={el.publicationId} className="aide" style={{ marginBottom: 3 }}>
              <strong style={{ color: 'var(--encre)' }}>{el.titre}</strong> · à produire avant le{' '}
              {new Date(`${el.echeance}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              {libelle}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
