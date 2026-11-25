'use client';

import { useState } from 'react';
import { deposerIllustration } from '@/app/actions';

/**
 * Import du pack d'illustrations par le navigateur (25/11/2026) : le serveur
 * o2switch n'atteint pas le CDN de Higgsfield, le navigateur si. Chaque image
 * est téléchargée ici puis envoyée à `deposerIllustration` (≈ 1 Mo l'image,
 * sous la limite des actions serveur), qui la vérifie et l'inscrit au registre.
 * Les adresses viennent du registre côté serveur, jamais d'une saisie.
 */
export function ImporterPack({ entite, items }: { entite: string; items: Array<{ nom: string; source: string }> }) {
  const [etat, setEtat] = useState<{ rang: number; nom: string } | null>(null);
  const [refus, setRefus] = useState<string[]>([]);

  async function importer() {
    const echecs: string[] = [];
    let posees = 0;
    for (let i = 0; i < items.length; i++) {
      const { nom, source } = items[i];
      setEtat({ rang: i + 1, nom });
      try {
        const r = await fetch(source);
        if (!r.ok) throw new Error(`réponse ${r.status}`);
        const blob = await r.blob();
        const type = blob.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
        const fichier = new File([blob], `${nom}.${type === 'image/png' ? 'png' : 'jpg'}`, { type });
        const fd = new FormData();
        fd.set('entite', entite);
        fd.set('illustration', nom);
        fd.set('fichier', fichier);
        const res = await deposerIllustration(fd);
        if (res.ok) posees++;
        else echecs.push(`${nom} — ${res.raison}`);
      } catch (e) {
        echecs.push(`${nom} — ${(e as Error).message}`);
      }
    }
    setEtat(null);
    setRefus(echecs);
    if (posees) window.location.assign(`/${entite}/visuels?illus=${posees}${echecs.length ? `&illusEchecs=${echecs.length}` : ''}#illustrations`);
  }

  if (!items.length) return <button type="button" disabled>Pack importé, à jour</button>;
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 4 }}>
      <button type="button" onClick={importer} disabled={!!etat}>
        {etat ? `Import ${etat.rang} / ${items.length} — ${etat.nom}` : `Importer les ${items.length} illustration(s) manquante(s)`}
      </button>
      {refus.length ? (
        <span className="aide" style={{ color: 'var(--grave)' }}>
          {refus.length} échec(s) : {refus.join(' · ')}
        </span>
      ) : null}
    </span>
  );
}
