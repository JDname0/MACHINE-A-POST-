'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PlanMontage } from '@/lib/montage';
import { fabriquerVideo, enregistrerVideo, apercusPlans, dureeDe, type ImageDispo, type ThemeStudio, type Montage } from '@/lib/fabrique-video';
import { proposerPlansIA } from '@/app/actions';

/**
 * Le studio vidéo d'un post : les plans (texte, durée, image), le storyboard,
 * puis la fabrication (voir `src/lib/fabrique-video.ts`) et le rangement dans
 * la médiathèque. Valable pour les deux entités : la charte, la police et le
 * rythme viennent de la marque.
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
  /** `sombre` vaut null pour une marque à un seul registre (Veolt). */
  themes: { clair: ThemeStudio; sombre: ThemeStudio | null };
  rythme: 'sec' | 'pose';
  direct: boolean;
  plafondOctets: number;
  /** Une vidéo du studio existe déjà pour ce post : l'enregistrer la remplacera. */
  aDejaVideo?: boolean;
  legende: string;
  /** Le texte à publier avec la vidéo (légende du réseau). */
  legendePublication: string;
  conseil: { conseil: [number, number]; max: number; pourquoi: string } | null;
  iaDispo: boolean;
}

type Etat =
  | { phase: 'repos' }
  | { phase: 'rendu'; pourcent: number }
  | { phase: 'pret'; url: string; fichier: File; mode: string }
  | { phase: 'envoi'; pourcent: number; url: string; fichier: File; mode: string }
  | { phase: 'enregistre'; url: string; fichier: File; mode: string }
  | { phase: 'erreur'; message: string };

const VIDE: PlanMontage = { duree: 3, texte: '', image: '', source: { type: 'carte' } };

export function StudioVideo(p: Props) {
  const router = useRouter();
  const [plans, setPlans] = useState<PlanMontage[]>(p.plansInitiaux);
  const [variante, setVariante] = useState<'clair' | 'sombre'>('clair');
  const [etat, setEtat] = useState<Etat>({ phase: 'repos' });
  const [vignettes, setVignettes] = useState<string[] | null>(null);
  const [apercuEnCours, setApercuEnCours] = useState(false);
  const [ia, setIa] = useState<{ t: 'repos' | 'enCours' | 'note' | 'erreur'; texte?: string }>({ t: 'repos' });
  const [copie, setCopie] = useState(false);
  const consigneIA = useRef<HTMLInputElement>(null);
  const total = useMemo(() => dureeDe(plans), [plans]);

  const montage = (): Montage => ({
    entite: p.entite,
    publicationId: p.publicationId,
    largeur: p.largeur,
    hauteur: p.hauteur,
    plans,
    // Une carte par plan : si l'on a ajouté des plans, la dernière carte sert de modèle
    // (son texte est de toute façon remplacé par celui du plan au moment du rendu).
    cartes: plans.map((_, i) => p.cartes[i] ?? p.cartes[p.cartes.length - 1]),
    images: p.images,
    theme: (variante === 'sombre' && p.themes.sombre) || p.themes.clair,
    rythme: p.rythme,
    direct: p.direct,
    plafondOctets: p.plafondOctets,
    legende: p.legende,
    variante: p.themes.sombre ? variante : 'clair',
  });

  const maj = (i: number, champ: Partial<PlanMontage>) => setPlans((ps) => ps.map((x, k) => (k === i ? { ...x, ...champ } : x)));
  const deplacer = (i: number, d: -1 | 1) =>
    setPlans((ps) => {
      const j = i + d;
      if (j < 0 || j >= ps.length) return ps;
      const n = [...ps];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });

  async function apercu() {
    setApercuEnCours(true);
    try {
      setVignettes(await apercusPlans(montage()));
    } catch (e) {
      setEtat({ phase: 'erreur', message: e instanceof Error ? e.message : String(e) });
    }
    setApercuEnCours(false);
  }

  // Premier storyboard à l'ouverture, puis à la demande (les changements de
  // texte ne relancent pas tout le rendu à chaque frappe).
  useEffect(() => {
    void apercu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      router.refresh();
    } catch (e) {
      setEtat({ phase: 'erreur', message: e instanceof Error ? e.message : String(e) });
    }
  }

  async function planIA() {
    setIa({ t: 'enCours' });
    const fd = new FormData();
    fd.set('id', String(p.publicationId));
    fd.set('consigne', consigneIA.current?.value ?? '');
    const r = await proposerPlansIA(fd);
    if (!r.ok) {
      setIa({ t: 'erreur', texte: r.raison });
      return;
    }
    setPlans(r.plans.map((x) => ({ ...x, source: { type: 'carte' } })));
    setVignettes(null);
    setIa({ t: 'note', texte: r.note || 'Plans proposés par l’IA — relis-les avant de fabriquer.' });
  }

  const occupe = etat.phase === 'rendu' || etat.phase === 'envoi';
  const apercuVideo = 'url' in etat ? etat.url : null;
  const [cMin, cMax] = p.conseil?.conseil ?? [0, Infinity];
  const dansLaCible = total >= cMin && total <= cMax;

  return (
    <div className="grille" style={{ gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)', alignItems: 'start' }}>
      <section className="pile">
        {/* ── Storyboard ───────────────────────────────────────────── */}
        <div className="carte" style={{ padding: '12px 14px' }}>
          <div className="rang" style={{ justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            <strong>Storyboard</strong>
            <div className="rang" style={{ gap: 6, flexWrap: 'wrap' }}>
              <span className="pastille" data-t={p.conseil ? (dansLaCible ? 'ok' : 'alerte') : undefined} title={p.conseil?.pourquoi}>
                {total} s{p.conseil ? ` · conseillé ${cMin}–${cMax} s` : ''}
              </span>
              {p.themes.sombre ? (
                <select value={variante} onChange={(e) => setVariante(e.target.value as 'clair' | 'sombre')} aria-label="Variante des cartes">
                  <option value="clair">Cartes — charte principale</option>
                  <option value="sombre">Cartes — variante sombre</option>
                </select>
              ) : null}
              <button type="button" className="fantome" onClick={apercu} disabled={apercuEnCours}>
                {apercuEnCours ? 'Calcul…' : 'Mettre à jour l’aperçu'}
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {plans.map((x, i) => (
              <figure key={i} style={{ margin: 0, flex: '0 0 auto', width: p.largeur > p.hauteur ? 160 : 96 }}>
                {vignettes?.[i] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={vignettes[i]}
                    alt={`Plan ${i + 1}`}
                    style={{ width: '100%', borderRadius: 8, border: '1px solid var(--ligne)', display: 'block' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: `${p.largeur} / ${p.hauteur}`,
                      borderRadius: 8,
                      border: '1px dashed var(--ligne)',
                      display: 'grid',
                      placeItems: 'center',
                    }}
                    className="aide"
                  >
                    {apercuEnCours ? '…' : '—'}
                  </div>
                )}
                <figcaption className="aide" style={{ textAlign: 'center', marginTop: 3 }}>
                  {i + 1} · {x.duree} s
                </figcaption>
              </figure>
            ))}
          </div>
          {p.conseil && !dansLaCible ? (
            <div className="aide" style={{ marginTop: 6 }}>
              {total < cMin ? 'Un peu court' : 'Trop long'} pour ce format : {p.conseil.pourquoi}.
            </div>
          ) : null}
        </div>

        {/* ── Plans proposés par l'IA ─────────────────────────────── */}
        <details className="carte" style={{ padding: '10px 14px' }}>
          <summary style={{ cursor: 'pointer' }}>✨ Faire proposer les plans par l&apos;IA</summary>
          {p.iaDispo ? (
            <div className="rang" style={{ gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              <input ref={consigneIA} placeholder="Consigne facultative : plus rythmé, finir sur le prix…" style={{ flex: '1 1 240px' }} />
              <button type="button" onClick={planIA} disabled={ia.t === 'enCours'}>
                {ia.t === 'enCours' ? 'L’IA découpe… (10 à 30 s)' : 'Proposer des plans'}
              </button>
            </div>
          ) : (
            <p className="aide" style={{ marginTop: 8 }}>
              Il manque la variable <code>ANTHROPIC_API_KEY</code> côté serveur (sur Vercel, en variable sensible).
            </p>
          )}
          {ia.t === 'note' ? <p className="aide" style={{ marginTop: 6 }}>{ia.texte} Les plans ci-dessous ont été remplacés : relis-les.</p> : null}
          {ia.t === 'erreur' ? (
            <div className="constat" data-n="blocage" style={{ marginTop: 6 }}>
              <div className="msg">{ia.texte}</div>
            </div>
          ) : null}
        </details>

        {/* ── Les plans ────────────────────────────────────────────── */}
        {plans.map((x, i) => (
          <div key={i} className="carte" style={{ padding: '12px 14px' }}>
            <div className="rang" style={{ justifyContent: 'space-between', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <strong>Plan {i + 1}</strong>
              <div className="rang" style={{ gap: 4, flexWrap: 'wrap' }}>
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
                <button type="button" className="fantome" onClick={() => deplacer(i, -1)} disabled={i === 0} aria-label="Monter ce plan">
                  ↑
                </button>
                <button type="button" className="fantome" onClick={() => deplacer(i, 1)} disabled={i === plans.length - 1} aria-label="Descendre ce plan">
                  ↓
                </button>
                <button
                  type="button"
                  className="fantome"
                  onClick={() => setPlans((ps) => [...ps.slice(0, i + 1), { ...ps[i] }, ...ps.slice(i + 1)])}
                  aria-label="Dupliquer ce plan"
                >
                  ⧉
                </button>
                <button
                  type="button"
                  className="fantome"
                  disabled={plans.length <= 1}
                  onClick={() => setPlans((ps) => ps.filter((_, k) => k !== i))}
                  aria-label="Retirer ce plan"
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
              <button type="button" className={x.source.type === 'carte' ? '' : 'fantome'} onClick={() => maj(i, { source: { type: 'carte' } })}>
                Carte à la charte
              </button>
              {p.images.map((m) => {
                const choisi = x.source.type === 'media' && x.source.id === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => maj(i, { source: { type: 'media', id: m.id } })}
                    aria-label={`Image : ${m.nom}${m.origine === 'genere' ? ' (visuel généré, affiché tel quel)' : ''}`}
                    data-image={m.id}
                    style={{
                      padding: 0,
                      border: choisi ? `3px solid ${p.themes.clair.accent}` : '1px solid var(--ligne)',
                      borderRadius: 8,
                      overflow: 'hidden',
                      width: 46,
                      height: 58,
                      background: 'none',
                      position: 'relative',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    {m.origine === 'genere' ? (
                      <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, fontSize: 8, background: 'rgba(0,0,0,.6)', color: '#fff' }}>
                        généré
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <button type="button" className="fantome" onClick={() => setPlans((ps) => [...ps, { ...VIDE }])}>
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
              {etat.phase === 'rendu' ? `Fabrication… ${etat.pourcent} %` : p.aDejaVideo || etat.phase !== 'repos' ? 'Régénérer la vidéo' : 'Générer la vidéo'}
            </button>
            {etat.phase === 'pret' ? (
              <button type="button" onClick={enregistrer}>
                {p.aDejaVideo ? 'Enregistrer (remplace la vidéo actuelle)' : 'Enregistrer dans la médiathèque'}
              </button>
            ) : null}
            {apercuVideo && 'fichier' in etat ? (
              <a className="bouton fantome" href={apercuVideo} download={etat.fichier.name}>
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
        {apercuVideo ? (
          <video src={apercuVideo} controls playsInline loop style={{ width: '100%', borderRadius: 12, border: '1px solid var(--ligne)' }} />
        ) : (
          <div className="encart">L&apos;aperçu de la vidéo apparaîtra ici une fois générée. Le storyboard, à gauche, montre déjà chaque plan.</div>
        )}
        {p.legendePublication ? (
          <div className="carte">
            <div className="rang" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
              <h3 style={{ margin: 0 }}>Légende à publier</h3>
              <button
                type="button"
                className="fantome"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(p.legendePublication);
                    setCopie(true);
                    setTimeout(() => setCopie(false), 1800);
                  } catch {
                    /* presse-papiers refusé : le texte reste sélectionnable */
                  }
                }}
              >
                {copie ? 'Copié ✓' : 'Copier'}
              </button>
            </div>
            <pre className="bloc" style={{ whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto', margin: 0 }}>{p.legendePublication}</pre>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
