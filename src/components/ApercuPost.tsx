import Link from 'next/link';
import { format } from '@/lib/formats';
import { formaterDate, LIBELLE_STATUT, mediasDePublication, type LignePublication } from '@/lib/requetes';
import { articleEnHtml, constatsDe, lienVisuel, pagesCarrousel, urlVisuel, texteAColler } from '@/lib/fiche';
import { attendu } from '@/lib/conformite-media';
import { DELAIS, imagesMemoire, montagePret, reglagesVideo } from '@/lib/production';
import { trancher, memoriserVisuel, regenererTexte } from '@/app/actions';
import { sujet } from '@/lib/sujets';
import { AssistantIA } from './AssistantIA';
import { BoutonVideo } from './BoutonVideo';
import { BoutonCopier } from './BoutonCopier';
import type { EntiteSlug } from '@/lib/marques';

/**
 * Le post vu depuis le calendrier, quel que soit son format : texte, image,
 * pages de carrousel ou vidéo — avec ce qu'il faut pour le produire et le
 * valider sans quitter le calendrier.
 */
export function ApercuPost({ p, fermer, notice }: { p: LignePublication; fermer: string; notice?: string }) {
  const e = p.entite as EntiteSlug;
  const f = format(p.format_slug);
  const { constats, validable } = constatsDe(p);
  const blocages = constats.filter((c) => c.niveau === 'blocage');
  const veut = attendu(p.format_slug);
  const pages = pagesCarrousel(p);
  const visuel = lienVisuel(p);
  const medias = mediasDePublication(p.id);
  const video = medias.find((m) => m.type_mime.startsWith('video/'));
  const generes = medias.filter((m) => m.origine === 'genere').length;
  const reglages = reglagesVideo(e);
  const quand = DELAIS.find((d) => d.jours === reglages.delai)?.libelle ?? '';
  const echeance = new Date(`${p.date_prevue}T12:00:00Z`);
  echeance.setUTCDate(echeance.getUTCDate() - reglages.delai);
  const ici = `${fermer}${fermer.includes('?') ? '&' : '?'}apercu=${p.id}`;
  // Un article de blog n'exige pas d'image, mais son lien circule avec une couverture.
  const couverture = f.reseau === 'blog' && !!visuel;
  const s = p.sujet_ref ? sujet(p.sujet_ref) : undefined;
  const refaisable = !!s && p.statut !== 'publie';

  return (
    <>
      <Link href={fermer} scroll={false} aria-label="Fermer l’aperçu" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.28)', zIndex: 69 }} />
      <aside
        aria-label={`Aperçu — ${p.titre ?? ''}`}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(560px, 100vw)',
          overflow: 'auto',
          background: 'var(--fond)',
          borderLeft: '1px solid var(--ligne)',
          boxShadow: '-12px 0 40px rgba(0,0,0,.18)',
          zIndex: 70,
          padding: '18px 20px 80px',
        }}
      >
        <div className="rang" style={{ justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
          <div className="aide">
            {f.nom} · {formaterDate(p.date_prevue)} · {p.phase ?? (p.semaine ? `semaine ${p.semaine}` : 'hors calendrier')}
          </div>
          <Link href={fermer} scroll={false} className="bouton fantome" style={{ padding: '2px 10px' }}>
            ×
          </Link>
        </div>
        <h2 style={{ marginBottom: 8 }}>{p.titre}</h2>
        {notice ? (
          <div className="encart" style={{ marginBottom: 10 }}>
            {notice}
          </div>
        ) : null}
        <div className="rang" style={{ gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          <span className="pastille" data-t={p.statut === 'valide' || p.statut === 'publie' ? 'ok' : p.statut === 'a-relire' ? 'alerte' : undefined}>
            {LIBELLE_STATUT[p.statut]}
          </span>
          <span className="pastille" data-t={validable ? 'ok' : 'blocage'}>
            {validable ? 'validable' : 'bloqué'}
          </span>
          {veut !== 'aucun' ? (
            <span className="pastille" title={`Réglage de production : ${quand} de la publication`}>
              à produire le {formaterDate(echeance.toISOString().slice(0, 10))}
            </span>
          ) : null}
          {generes ? <span className="pastille" data-t="accent">{generes} visuel(s) en mémoire</span> : null}
        </div>

        {/* ── Le média, selon le format ─────────────────────────────── */}
        {veut === 'video' ? (
          <div className="carte" style={{ marginBottom: 12 }}>
            <h3>Vidéo</h3>
            {video ? (
              <>
                <video
                  src={`/${e}/medias/${video.id}#t=2`}
                  controls
                  playsInline
                  preload="metadata"
                  style={{ width: '100%', maxHeight: 520, borderRadius: 10, background: '#000', marginTop: 8 }}
                />
                <div className="rang" style={{ gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
                  <a className="bouton" href={`/${e}/medias/${video.id}`} download={`${e}-${p.id}.mp4`}>
                    Télécharger la vidéo
                  </a>
                  <BoutonVideo montage={montagePret(p, imagesMemoire(e))} libelle="Régénérer la vidéo" />
                  <Link className="lien-accent" href={`/${e}/videos?p=${p.id}`}>
                    Retoucher les plans dans le studio →
                  </Link>
                </div>
                <p className="aide" style={{ marginTop: 6 }}>Régénérer remplace la vidéo actuelle (montage par défaut, mémoire à jour).</p>
              </>
            ) : (
              <>
                <p className="aide" style={{ margin: '6px 0 10px' }}>
                  Pas encore de vidéo. Génère-la maintenant avec le montage par défaut, ou règle les plans dans le studio.
                </p>
                <div className="rang" style={{ gap: 10, flexWrap: 'wrap' }}>
                  <BoutonVideo montage={montagePret(p, imagesMemoire(e))} />
                  <Link className="lien-accent" href={`/${e}/videos?p=${p.id}`}>
                    Ouvrir le studio →
                  </Link>
                </div>
              </>
            )}
          </div>
        ) : null}

        {pages.length ? (
          <div className="carte" style={{ marginBottom: 12 }}>
            <h3>Carrousel · {pages.length} pages</h3>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginTop: 8, paddingBottom: 4 }}>
              {pages.map((v, i) => (
                <div key={i} style={{ flex: '0 0 auto', width: 200 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={urlVisuel(e, v)}
                    alt={`Page ${i + 1}`}
                    loading="lazy"
                    style={{ width: 200, borderRadius: 8, border: '1px solid var(--ligne)', display: 'block' }}
                  />
                  <a className="lien-accent" href={urlVisuel(e, v)} download={`${e}-${p.id}-page-${i + 1}.png`} style={{ fontSize: 12 }}>
                    ↓ page {i + 1}
                  </a>
                </div>
              ))}
            </div>
            <div className="rang" style={{ gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
              {f.reseau === 'linkedin' ? (
                <a className="bouton" href={`/${e}/publications/${p.id}/carrousel`} download={`${e}-carrousel-${p.id}.pdf`}>
                  Télécharger le PDF (document LinkedIn)
                </a>
              ) : (
                <span className="aide">Instagram prend les images une à une : télécharge chaque page, dans l&apos;ordre.</span>
              )}
            </div>
          </div>
        ) : visuel && (veut === 'image' || couverture) ? (
          <div className="carte" style={{ marginBottom: 12 }}>
            <h3>{couverture ? 'Couverture de l’article · aperçu du lien' : 'Visuel'}</h3>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={visuel} alt={`Visuel — ${p.titre}`} style={{ width: '100%', borderRadius: 10, border: '1px solid var(--ligne)', marginTop: 8 }} />
            <div className="rang" style={{ marginTop: 10 }}>
              <a className="bouton" href={visuel} download={`${e}-${p.id}.png`}>
                {couverture ? 'Télécharger la couverture' : 'Télécharger le visuel'}
              </a>
            </div>
          </div>
        ) : veut === 'aucun' ? (
          <div className="encart" style={{ marginBottom: 12 }}>
            Post textuel : pas de média, c’est voulu sur ce réseau.
          </div>
        ) : null}

        {f.reseau === 'blog' ? (
          <div className="carte" style={{ marginBottom: 12 }}>
            <div className="rang" style={{ justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <h3>Article · lecture</h3>
              <BoutonCopier texte={articleEnHtml(p)} libelle="Copier en HTML (site)" />
            </div>
            <style>{`.article-lecture h1{font-size:22px;margin:4px 0 12px}.article-lecture h2{font-size:16px;margin:18px 0 6px}.article-lecture p{margin:0 0 10px;line-height:1.6}.article-lecture ul{margin:0 0 10px 18px;line-height:1.6}`}</style>
            <div
              className="article-lecture"
              style={{ marginTop: 8, maxHeight: 520, overflow: 'auto', paddingRight: 6 }}
              // Le HTML vient de articleEnHtml, qui échappe tout le texte.
              dangerouslySetInnerHTML={{ __html: articleEnHtml(p) }}
            />
          </div>
        ) : null}

        <div className="carte" style={{ marginBottom: 12 }}>
          <div className="rang" style={{ justifyContent: 'space-between', gap: 8 }}>
            <h3>{pages.length ? 'Légende' : f.reseau === 'blog' ? 'Texte brut (Markdown)' : 'Texte'}</h3>
            <BoutonCopier texte={texteAColler(p)} />
          </div>
          <pre className="bloc" style={{ whiteSpace: 'pre-wrap', maxHeight: f.reseau === 'blog' ? 160 : 360, overflow: 'auto', marginTop: 8 }}>
            {texteAColler(p) || '(texte vide)'}
          </pre>
          {refaisable ? (
            <details style={{ marginTop: 8 }}>
              <summary className="aide" style={{ cursor: 'pointer' }}>
                {f.reseau === 'blog' ? 'Régénérer l’article' : 'Régénérer le texte'} depuis le sujet « {s!.titre} »
              </summary>
              <form action={regenererTexte} style={{ marginTop: 8 }}>
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="entite" value={e} />
                <input type="hidden" name="retour" value={ici} />
                <p className="aide" style={{ margin: '0 0 8px' }}>
                  Retaille le texte depuis le sujet et le moule du format ({f.nom}), sans IA et sans crédit. Le texte
                  actuel est gardé au journal ; le post repasse en brouillon, à relire et valider.
                </p>
                <button type="submit" className="fantome">
                  {f.reseau === 'blog' ? 'Régénérer l’article' : 'Régénérer le texte'}
                </button>
              </form>
            </details>
          ) : null}
          <AssistantIA p={p} retour={ici} />
        </div>

        {blocages.length ? (
          <div style={{ marginBottom: 12 }}>
            {blocages.map((c, i) => (
              <div key={i} className="constat" data-n="blocage">
                <div className="regle">{c.regle}</div>
                <div className="msg">{c.message}</div>
                <div className="remede">{c.remede}</div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="rang" style={{ gap: 8, flexWrap: 'wrap' }}>
          {p.statut !== 'publie' ? (
            <>
              <form action={trancher}>
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="entite" value={e} />
                <input type="hidden" name="retour" value={ici} />
                <input type="hidden" name="decision" value="valide" />
                <button type="submit" disabled={!validable || p.statut === 'valide'}>
                  {p.statut === 'valide' ? 'Validé ✓' : 'Valider'}
                </button>
              </form>
              <form action={trancher}>
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="entite" value={e} />
                <input type="hidden" name="retour" value={ici} />
                <input type="hidden" name="decision" value="a-relire" />
                <button type="submit" className="fantome" disabled={p.statut === 'a-relire'}>
                  À retravailler
                </button>
              </form>
            </>
          ) : null}
          {(veut !== 'aucun' || couverture) && (visuel || pages.length) ? (
            <form action={memoriserVisuel}>
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="entite" value={e} />
              <input type="hidden" name="retour" value={ici} />
              <button type="submit" className="fantome" title="Range le rendu dans la médiathèque (et la mémoire des vidéos), à jour du texte et de la photo actuels.">
                {`${generes ? 'Régénérer' : 'Générer'} ${pages.length ? 'les pages' : couverture ? 'la couverture' : 'le visuel'}`}
              </button>
            </form>
          ) : null}
          <Link className="bouton fantome" href={`/${e}/publications/${p.id}`}>
            Modifier le post
          </Link>
        </div>
      </aside>
    </>
  );
}
