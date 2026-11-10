'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fabriquerVideo, enregistrerVideo, type Montage } from '@/lib/fabrique-video';

/**
 * Un bouton « Générer la vidéo » posable n'importe où (calendrier, file de
 * validation…) : montage par défaut, fabrication dans le navigateur, rangement
 * dans la médiathèque. Le post reste à relire et à valider.
 */
export function BoutonVideo({ montage, libelle = 'Générer la vidéo', compact = false }: { montage: Montage; libelle?: string; compact?: boolean }) {
  const router = useRouter();
  const [etat, setEtat] = useState<{ t: 'repos' | 'fab' | 'envoi' | 'ok' | 'ko'; pc?: number; msg?: string }>({ t: 'repos' });

  async function lancer(e: React.MouseEvent) {
    // Dans le calendrier le bouton vit dans un lien : il ne doit pas l'ouvrir.
    e.preventDefault();
    e.stopPropagation();
    try {
      setEtat({ t: 'fab', pc: 0 });
      const { fichier } = await fabriquerVideo(montage, (pc) => setEtat({ t: 'fab', pc }));
      setEtat({ t: 'envoi', pc: 0 });
      await enregistrerVideo(montage, fichier, (pc) => setEtat({ t: 'envoi', pc }));
      setEtat({ t: 'ok' });
      router.refresh();
    } catch (err) {
      setEtat({ t: 'ko', msg: err instanceof Error ? err.message : String(err) });
    }
  }

  const texte =
    etat.t === 'fab' ? `Fabrication ${etat.pc ?? 0} %` : etat.t === 'envoi' ? `Envoi ${etat.pc ?? 0} %` : etat.t === 'ok' ? 'Vidéo prête ✓' : etat.t === 'ko' ? 'Réessayer' : libelle;
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 3 }}>
      <button
        type="button"
        onClick={lancer}
        disabled={etat.t === 'fab' || etat.t === 'envoi' || etat.t === 'ok'}
        className={compact ? 'fantome' : undefined}
        style={compact ? { padding: '3px 8px', fontSize: 11.5 } : undefined}
        title={etat.t === 'ko' ? etat.msg : 'Fabrique la vidéo avec le montage par défaut et la range dans la médiathèque'}
      >
        {compact && etat.t === 'repos' ? '▶ vidéo' : texte}
      </button>
      {etat.t === 'ko' && !compact ? <span className="aide" style={{ color: 'var(--grave)' }}>{etat.msg}</span> : null}
    </span>
  );
}
