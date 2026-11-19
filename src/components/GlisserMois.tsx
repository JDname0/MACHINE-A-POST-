'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type DragEvent, type ReactNode } from 'react';
import { deplacerPost } from '@/app/actions';

/**
 * Glisser-déposer de la vue Mois : un post (`[data-glisser]`) déposé sur un
 * jour (`[data-jour]`) change de date prévue. Rien ne se publie ; le texte et
 * le statut ne changent pas. Le serveur refuse ce qui ne doit pas bouger
 * (post publié, doublon format × pilier) et le dit ici.
 */
export function GlisserMois({ entite, children }: { entite: string; children: ReactNode }) {
  const router = useRouter();
  const [enCours, demarrer] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const jourSous = (ev: DragEvent) => (ev.target as HTMLElement).closest<HTMLElement>('[data-jour]');

  return (
    <div
      onDragStart={(ev) => {
        const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-glisser]');
        if (!el) return;
        ev.dataTransfer.setData('application/x-machine-post', el.dataset.glisser!);
        ev.dataTransfer.effectAllowed = 'move';
      }}
      onDragOver={(ev) => {
        if (!ev.dataTransfer.types.includes('application/x-machine-post') || !jourSous(ev)) return;
        ev.preventDefault();
        ev.dataTransfer.dropEffect = 'move';
      }}
      onDragEnter={(ev) => jourSous(ev)?.classList.add('cible')}
      onDragLeave={(ev) => {
        const j = jourSous(ev);
        if (j && !j.contains(ev.relatedTarget as Node)) j.classList.remove('cible');
      }}
      onDrop={(ev) => {
        const j = jourSous(ev);
        const id = ev.dataTransfer.getData('application/x-machine-post');
        j?.classList.remove('cible');
        if (!j || !id) return;
        ev.preventDefault();
        const fd = new FormData();
        fd.set('id', id);
        fd.set('entite', entite);
        fd.set('date', j.dataset.jour!);
        demarrer(async () => {
          const r = await deplacerPost(fd);
          setMessage(r.ok ? null : r.raison);
          router.refresh();
        });
      }}
      aria-busy={enCours}
      style={enCours ? { opacity: 0.7 } : undefined}
    >
      {message ? (
        <div className="constat" data-n="alerte" style={{ marginBottom: 10 }}>
          <div className="regle">Déplacement refusé</div>
          <div className="msg">{message}</div>
        </div>
      ) : null}
      {children}
    </div>
  );
}
