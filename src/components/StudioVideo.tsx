'use client';

import { useMemo, useState } from 'react';
import type { PlanMontage } from '@/lib/montage';
import { fabriquerVideo, enregistrerVideo, dureeDe, type ImageDispo, type ThemeStudio } from '@/lib/fabrique-video';

/**
 * Le studio vidéo d'un post : les plans, une image par plan, puis la
 * fabrication (voir `src/lib/fabrique-video.ts`) et le rangement dans la
 * médiathèque.
 */

export type { ImageDispo, ThemeStudio };

interface Props {
  entite: string;
  publicationId: number;
  titre: string;
  largeur: number;
  hauteur: number;
  plansInitiaux: PlanMontage[];
  cartes: string[];
  images: ImageDispo[];
  theme: ThemeStudio;
  rythme: 'sec' | 'pose';
  direct: boolean;
  legende: string;
}

type Etat =
  | { phase: 'repos' }
  | { phase: 'rendu'; pourcent: number }
  | { phase: 'pret'; url: string; fichier: File; mode: string }
  | { phase: 'envoi'; pourcent: number; url: string; fichier: File; mode: string }
  | { phase: 'enregistre'; url: string; fichier: File; mode: string }
  | { phase: 'erreur'; message: string };

export function StudioVideo(p: Props) {
  const [plans, setPlans] = useState<PlanMontage[]>(p.plansInitiaux);
  const [etat, setEtat] = useState<Etat>({ phase: 'repos' });
  const total = useMemo(() => dureeDe(plans), [plans]);

  const maj = (i: number, champ: Partial<PlanMontage>) =>
    setPlans((ps) => ps.map((x, k) => (k === i ? { ...x, ...champ } : x)));

  const montage = () => ({
    entite: p.entite,
    publicationId: p.publicationId,
    largeur: p.largeur,
    hauteur: p.hauteur,
    plans,
    cartes: p.cartes,
    images: p.images,
    theme: p.theme,
    rythme: p.rythme,
    direct: p.direct,
    legende: p.legende,
  });

  async function fabriquer() {
    try {
      setEtat({ phase: 'rendu', pourcent: 0 });
      const { fichier, mode } = await fabriquerVideo(montage(), (pc) => setEtat({ phase: 'rendu', pourcent: pc }));
      setEtat({ phase: 'pret', url: URL.createObjectURL(fichier), fichier, mode });
    } catch (e) {
      setEtat({ phase: 'erreur', message: e instanceof Error ? e.message : String(e) });
    }
  }

  async function enregistrer() {
    if (etat.phase !== 'pret') return;
    const { fichier, url, mode } = etat;
    try {
      setEtat({ phase: 'envoi', pourcent: 0, url, fichier, mode });
      await enregistrerVideo(montage(), fichier, (pc) => setEtat({ phase: 'envoi', pourcent: pc, url, fichier, mode }));
      setEtat({ phase: 'enregistre', url, fichier, mode });
    } catch (e) {
      setEtat({ phase: 'erreur', message: e instanceof Error ? e.message : String(e) });
    }
  }

  const occupe = etat.phase === 'rendu' || etat.phase === 'envoi';
  const apercu = 'url' in etat ? etat.url : null;

  return (
    <div className="grille" style={{ gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)', alignItems: 'start' }}>
      <section className="pile">
        {plans.map((x, i) => (
          <div key={i} className="carte" style={{ padding: '12px 14px' }}>
            <div className="rang" style={{ justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
              <strong>Plan {i + 1}</strong>
              <div className="rang" style={{ gap: 6 }}>
                <label className="aide">
                  durée{' '}
                  <input
                    type="number"
                    min={1}
                    max={15}
                    step={0.5}
                    value={x.duree}
                    onChange={(e) => maj(i, { duree: Math.max(1, Number(e.target.value) || 1) })}
                    style={{ width: 64 }}
                  />{' '}
                  s
                </label>
                <button
                  type="button"
                  className="fantome"
                  disabled={plans.length <= 1}
                  onClick={() => setPlans((ps) => ps.filter((_, k) => k !== i))}
                  title="Retirer ce plan"
                >
                  ✕
                </button>
              </div>
            </div>
            {x.image ? <div className="aide" style={{ marginBottom: 6 }}>À l&apos;image : {x.image}</div> : null}
            <textarea
              rows={2}
              value={x.texte}
              onChange={(e) => maj(i, { texte: e.target.value })}
              style={{ width: '100%' }}
              aria-label={`Texte incrusté du plan ${i + 1}`}
            />
            <div className="rang" style={{ gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              <button
                type="button"
                className={x.source.type === 'carte' ? '' : 'fantome'}
                onClick={() => maj(i, { source: { type: 'carte' } })}
              >
                Carte à la charte
              </button>
              {p.images.map((m) => {
                const choisi = x.source.type === 'media' && x.source.id === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => maj(i, { source: { type: 'media', id: m.id } })}
                    title={`${m.nom}${m.origine === 'genere' ? ' (généré)' : ''}`}
                    style={{
                      padding: 0,
                      border: choisi ? `3px solid ${p.theme.accent}` : '1px solid var(--ligne)',
                      borderRadius: 8,
                      overflow: 'hidden',
                      width: 46,
                      height: 58,
                      background: 'none',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.url} alt={m.nom} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <button
          type="button"
          className="fantome"
          onClick={() => setPlans((ps) => [...ps, { duree: 3, texte: '', image: '', source: { type: 'carte' } }])}
        >
          + Ajouter un plan
        </button>
      </section>

      <aside className="pile" style={{ position: 'sticky', top: 16 }}>
        <div className="carte">
          <h3>Fabriquer la vidéo</h3>
          <p>
            {plans.length} plans · {total} s · {p.largeur}×{p.hauteur} · {p.rythme === 'sec' ? 'coupes sèches' : 'fondus courts'}
          </p>
          <div className="rang" style={{ gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <button type="button" onClick={fabriquer} disabled={occupe}>
              {etat.phase === 'rendu' ? `Fabrication… ${etat.pourcent} %` : 'Générer la vidéo'}
            </button>
            {etat.phase === 'pret' ? (
              <button type="button" onClick={enregistrer}>
                Enregistrer dans la médiathèque
              </button>
            ) : null}
            {apercu && 'fichier' in etat ? (
              <a className="bouton fantome" href={apercu} download={etat.fichier.name}>
                Télécharger
              </a>
            ) : null}
          </div>
          {etat.phase === 'envoi' ? <p className="aide" style={{ marginTop: 8 }}>Envoi… {etat.pourcent} %</p> : null}
          {etat.phase === 'enregistre' ? (
            <p className="aide" style={{ marginTop: 8, color: 'var(--ok)' }}>
              ✅ Vidéo rangée dans la médiathèque et rattachée au post. Elle passera par le contrôle du format dans le composeur.
            </p>
          ) : null}
          {'mode' in etat ? <p className="aide" style={{ marginTop: 6 }}>Encodage : {etat.mode}</p> : null}
          {etat.phase === 'erreur' ? (
            <div className="constat" data-n="blocage" style={{ marginTop: 8 }}>
              <div className="msg">{etat.message}</div>
            </div>
          ) : null}
        </div>
        {apercu ? (
          <video src={apercu} controls playsInline loop style={{ width: '100%', borderRadius: 12, border: '1px solid var(--ligne)' }} />
        ) : (
          <div className="encart">L&apos;aperçu apparaîtra ici une fois la vidéo générée.</div>
        )}
      </aside>
    </div>
  );
}
