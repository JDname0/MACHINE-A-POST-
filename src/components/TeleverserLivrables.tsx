'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { envoyerLivrables, TYPES_LIVRABLE_NAVIGATEUR, type Plafonds } from '@/lib/envoi-livrables';

/**
 * Téléverser sur un post ce qui a été fait ailleurs — vidéo montée, images,
 * pages de carrousel, PDF — pour Veolt comme pour MagistrIA. Les fichiers
 * deviennent le post (« post fourni ») ; le visuel généré par l'outil reste
 * en repli.
 */
export function TeleverserLivrables({
  entite,
  publicationId,
  direct,
  plafonds,
  carrousel,
}: {
  entite: string;
  publicationId: number;
  direct: boolean;
  plafonds: Plafonds;
  carrousel?: boolean;
}) {
  const router = useRouter();
  const champ = useRef<HTMLInputElement>(null);
  const [etat, setEtat] = useState<string>('');
  const [refus, setRefus] = useState<string[]>([]);
  const [envoi, setEnvoi] = useState(false);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    // Triés par nom : « page-01.png, page-02.png… » arrivent dans l'ordre.
    const fichiers = [...(champ.current?.files ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'fr', { numeric: true }));
    if (!fichiers.length) return;
    setEnvoi(true);
    setRefus([]);
    const r = await envoyerLivrables(entite, publicationId, fichiers, direct, plafonds, (nom, rang, total, pourcent) =>
      setEtat(`Envoi ${rang}/${total} — ${nom}${pourcent ? ` · ${pourcent} %` : ''}`),
    );
    setEnvoi(false);
    setEtat(r.posees ? `${r.posees} fichier(s) ajouté(s) au post.` : '');
    setRefus(r.refus);
    if (champ.current) champ.current.value = '';
    if (r.posees) router.refresh();
  }

  return (
    <form onSubmit={envoyer}>
      <input
        ref={champ}
        type="file"
        multiple
        accept={TYPES_LIVRABLE_NAVIGATEUR.join(',')}
        required
        disabled={envoi}
        style={{ maxWidth: '100%' }}
      />
      <div className="aide" style={{ margin: '6px 0 8px' }}>
        Vidéo, images ou PDF faits ailleurs (Canva, CapCut, Figma, After Effects…).
        {carrousel ? ' Pour un carrousel, les pages se rangent par nom de fichier (page-01, page-02…) ; l’ordre se règle ensuite avec ↑ ↓.' : ''}
        {direct ? ' Envoi direct au stockage : vidéo jusqu’à 300 Mo.' : ''}
      </div>
      <button type="submit" disabled={envoi}>
        {envoi ? 'Envoi en cours…' : 'Téléverser sur ce post'}
      </button>
      {etat ? <div className="aide" style={{ marginTop: 6 }}>{etat}</div> : null}
      {refus.length ? (
        <ul className="aide" style={{ marginTop: 6, color: 'var(--danger, #b00020)' }}>
          {refus.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      ) : null}
    </form>
  );
}
