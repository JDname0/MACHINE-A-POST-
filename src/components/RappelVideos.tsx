'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ProductionLot, type ElementLot } from './ProductionLot';
import { memoriserVisuelsDus } from '@/app/actions';

/**
 * Le rappel du jour, en carte flottante sur chaque page : les visuels et les
 * vidéos à produire aujourd'hui (ou en retard), selon le réglage de l'entité.
 *
 * En mode « automatique », tout démarre seul à l'ouverture de l'outil, une
 * fois par jour : les visuels sur le serveur, les vidéos dans le navigateur.
 * Rien n'est publié : chaque contenu reste à relire et à valider.
 */
export function RappelVideos({
  entite,
  elements,
  visuels,
  auto,
  quand,
}: {
  entite: string;
  elements: ElementLot[];
  visuels: number;
  auto: boolean;
  quand: string;
}) {
  const chemin = usePathname();
  const router = useRouter();
  const [masque, setMasque] = useState(false);
  const [vis, setVis] = useState<{ t: 'repos' | 'enCours' | 'fait'; n?: number }>({ t: 'repos' });
  const lance = useRef(false);

  async function genererVisuels() {
    setVis({ t: 'enCours' });
    const fd = new FormData();
    fd.set('entite', entite);
    const r = await memoriserVisuelsDus(fd);
    setVis({ t: 'fait', n: r.n });
    router.refresh();
  }

  useEffect(() => {
    if (!auto || visuels === 0 || lance.current) return;
    lance.current = true;
    const cle = `machine-auto-visuels:${entite}:${new Date().toISOString().slice(0, 10)}`;
    try {
      if (localStorage.getItem(cle)) return;
      localStorage.setItem(cle, '1');
    } catch {
      return;
    }
    void genererVisuels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, visuels, entite]);

  const rien = elements.length === 0 && (visuels === 0 && vis.t !== 'fait');
  if (masque || rien || chemin.startsWith(`/${entite}/videos`)) return null;
  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        right: 18,
        bottom: 44,
        width: 'min(430px, calc(100vw - 36px))',
        zIndex: 60,
        boxShadow: '0 12px 40px rgba(0,0,0,.18)',
        borderRadius: 'var(--rayon)',
        maxHeight: '70vh',
        overflow: 'auto',
      }}
    >
      <button
        type="button"
        className="fantome"
        onClick={() => setMasque(true)}
        aria-label="Masquer le rappel"
        style={{ position: 'absolute', top: 8, right: 8, padding: '0 8px', zIndex: 1 }}
      >
        ×
      </button>
      {visuels > 0 || vis.t === 'fait' ? (
        <div className="carte" style={{ marginBottom: elements.length ? 8 : 0 }}>
          <h3 style={{ marginBottom: 4 }}>🖼️ {vis.t === 'fait' ? `${vis.n} visuel(s) générés` : `${visuels} visuel(s) à générer aujourd’hui`}</h3>
          <div className="aide" style={{ marginBottom: 8 }}>
            Réglage : produits {quand} de la publication{auto ? ' — génération automatique à l’ouverture' : ''}. Images et pages de
            carrousel rangées dans la mémoire, à valider avec leur post.
          </div>
          {vis.t !== 'fait' ? (
            <button type="button" onClick={genererVisuels} disabled={vis.t === 'enCours'}>
              {vis.t === 'enCours' ? 'Génération…' : 'Générer les visuels'}
            </button>
          ) : null}
        </div>
      ) : null}
      {elements.length ? (
        <ProductionLot
          elements={elements}
          auto={auto}
          cleAuto={entite}
          titre={`🎬 ${elements.length} vidéo${elements.length > 1 ? 's' : ''} à générer aujourd’hui`}
          aide={`Réglage : produites ${quand} de la publication${auto ? ' — production automatique à l’ouverture' : ''}. Elles restent à valider.`}
        />
      ) : null}
    </div>
  );
}
