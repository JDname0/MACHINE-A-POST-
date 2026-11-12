import Link from 'next/link';
import { format } from '@/lib/formats';
import { formaterDate, LIBELLE_STATUT, livrablesDe, mediasDePublication, type LignePublication } from '@/lib/requetes';
import { articleEnHtml, constatsDe, lienVisuel, pagesCarrousel, urlVisuel, texteAColler } from '@/lib/fiche';
import { attendu, controlerMedia } from '@/lib/conformite-media';
import { DELAIS, imagesMemoire, montagePret, reglagesVideo } from '@/lib/production';
import { trancher, memoriserVisuel, regenererTexte, deplacerLivrable, supprimerMedia } from '@/app/actions';
import { depotDirect, estDocument, plafondDepotVideo, TAILLE_MAX_DOCUMENT, TAILLE_MAX_IMAGE, TAILLE_MAX_VIDEO } from '@/lib/medias';
import { TeleverserLivrables } from './TeleverserLivrables';
import { sujet } from '@/lib/sujets';
import { AssistantIA } from './AssistantIA';
import { BoutonVideo } from './BoutonVideo';
import { BoutonCopier } from './BoutonCopier';
import type { EntiteSlug } from '@/lib/marques';
import type { ReactNode } from 'react';

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
  // Le post fourni : ce qui a été fait ailleurs et téléversé sur ce post. Il
  // prime sur ce que l'outil génère, qui reste consultable en repli.
  const livrables = livrablesDe(p.id);
  const fourni = livrables.length > 0;
  const video =
    medias.find((m) => m.origine === 'livrable' && m.type_mime.startsWith('video/')) ?? medias.find((m) => m.type_mime.startsWith('video/'));
  const direct = depotDirect();
  const plafondLocal = plafondDepotVideo();
  const plafonds = direct
    ? { image: TAILLE_MAX_IMAGE, video: TAILLE_MAX_VIDEO, document: TAILLE_MAX_DOCUMENT }
    : { image: plafondLocal, video: plafondLocal, document: plafondLocal };
  const imagesFournies = livrables.filter((m) => m.type_mime.startsWith('image/'));
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

        {/* ── Le post fourni : fait ailleurs, téléversé ici ───────────── */}
        {fourni ? (
          <div className="carte" style={{ marginBottom: 12, outline: '2px solid var(--accent)', outlineOffset: -2 }}>
            <h3>📥 Post fourni — fait hors de la machine</h3>
            <p className="aide" style={{ margin: '4px 0 10px' }}>
              Ces fichiers sont le post. Ce que l’outil avait généré reste plus bas, en repli.
            </p>
            {livrables
              .filter((m) => m.type_mime.startsWith('video/'))
              .map((m) => (
                <div key={m.id} style={{ marginBottom: 12 }}>
                  <video
                    src={`/${e}/medias/${m.id}#t=1`}
                    controls
                    playsInline
                    preload="metadata"
                    style={{ width: '100%', maxHeight: 520, borderRadius: 10, background: '#000' }}
                  />
                  <div className="rang" style={{ gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                    <a className="bouton" href={`/${e}/medias/${m.id}`} download={m.nom}>
                      Télécharger la vidéo
                    </a>
                    <span className="aide">{m.nom}</span>
                  </div>
                </div>
              ))}
            {imagesFournies.length ? (
              <>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                  {imagesFournies.map((m, i) => (
                    <div key={m.id} style={{ flex: '0 0 auto', width: imagesFournies.length > 1 ? 180 : '100%' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/${e}/medias/${m.id}`}
                        alt={m.nom}
                        loading="lazy"
                        style={{ width: '100%', borderRadius: 8, border: '1px solid var(--ligne)', display: 'block' }}
                      />
                      <div className="rang" style={{ gap: 4, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                        {imagesFournies.length > 1 ? <span className="aide">{i + 1}.</span> : null}
                        <a className="lien-accent" href={`/${e}/medias/${m.id}`} download={m.nom} style={{ fontSize: 12 }}>
                          ↓ télécharger
                        </a>
                        {imagesFournies.length > 1 ? (
                          <>
                            <form action={deplacerLivrable}>
                              <input type="hidden" name="entite" value={e} />
                              <input type="hidden" name="id" value={m.id} />
                              <input type="hidden" name="sens" value="haut" />
                              <input type="hidden" name="retour" value={ici} />
                              <button type="submit" className="fantome" disabled={i === 0} title="Avancer cette page" style={{ padding: '0 6px' }}>
                                ↑
                              </button>
                            </form>
                            <form action={deplacerLivrable}>
                              <input type="hidden" name="entite" value={e} />
                              <input type="hidden" name="id" value={m.id} />
                              <input type="hidden" name="sens" value="bas" />
                              <input type="hidden" name="retour" value={ici} />
                              <button
                                type="submit"
                                className="fantome"
                                disabled={i === imagesFournies.length - 1}
                                title="Reculer cette page"
                                style={{ padding: '0 6px' }}
                              >
                                ↓
                              </button>
                            </form>
                          </>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
                {pages.length || /carrousel/.test(p.format_slug) ? (
                  <div className="rang" style={{ gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
                    {f.reseau === 'linkedin' && !livrables.some((m) => estDocument(m.type_mime)) ? (
                      <a className="bouton" href={`/${e}/publications/${p.id}/carrousel`} download={`${e}-carrousel-${p.id}.pdf`}>
                        Télécharger le PDF (document LinkedIn)
                      </a>
                    ) : f.reseau === 'instagram' ? (
                      <span className="aide">Instagram prend les images une à une, dans l&apos;ordre ci-dessus.</span>
                    ) : null}
                  </div>
                ) : null}
              </>
            ) : null}
            {livrables
              .filter((m) => estDocument(m.type_mime))
              .map((m) => (
                <div key={m.id} style={{ marginTop: 10 }}>
                  <object data={`/${e}/medias/${m.id}`} type="application/pdf" style={{ width: '100%', height: 460, borderRadius: 8, border: '1px solid var(--ligne)' }}>
                    <p className="aide">Aperçu indisponible dans ce navigateur.</p>
                  </object>
                  <div className="rang" style={{ gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                    <a className="bouton" href={`/${e}/medias/${m.id}`} download={m.nom}>
                      Télécharger le PDF
                    </a>
                    <a className="lien-accent" href={`/${e}/medias/${m.id}`} target="_blank" rel="noreferrer">
                      Ouvrir dans un onglet
                    </a>
                    {p.format_slug !== 'li-carrousel' ? (
                      <span className="aide">Un PDF se publie comme « document » sur LinkedIn ; ce format-ci attend {veut === 'video' ? 'une vidéo' : 'des images'}.</span>
                    ) : null}
                  </div>
                </div>
              ))}
            {livrables
              .filter((m) => !estDocument(m.type_mime))
              .flatMap((m) => controlerMedia(p.format_slug, m).map((c) => ({ c, nom: m.nom })))
              .filter((x) => x.c.niveau !== 'conseil')
              .map(({ c, nom }, i) => (
                <div key={i} className="constat" data-n={c.niveau} style={{ marginTop: 8 }}>
                  <div className="regle">
                    {c.regle} — {nom}
                  </div>
                  <div className="msg">{c.message}</div>
                  <div className="remede">{c.remede}</div>
                </div>
              ))}
            <details style={{ marginTop: 10 }}>
              <summary className="aide" style={{ cursor: 'pointer' }}>
                Ajouter ou retirer des fichiers
              </summary>
              <div style={{ marginTop: 8 }}>
                <TeleverserLivrables entite={e} publicationId={p.id} direct={direct} plafonds={plafonds} carrousel={/carrousel/.test(p.format_slug)} />
                <div className="rang" style={{ gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                  {livrables.map((m) => (
                    <form key={m.id} action={supprimerMedia}>
                      <input type="hidden" name="entite" value={e} />
                      <input type="hidden" name="id" value={m.id} />
                      <input type="hidden" name="retour" value={ici} />
                      <button type="submit" className="fantome" style={{ padding: '2px 8px', fontSize: 12 }} title="Retirer ce fichier du post (définitif)">
                        ✕ {m.nom}
                      </button>
                    </form>
                  ))}
                </div>
              </div>
            </details>
          </div>
        ) : (
          <details className="carte" style={{ marginBottom: 12 }}>
            <summary style={{ cursor: 'pointer' }}>
              <strong>📥 Téléverser un post fait ailleurs</strong>{' '}
              <span className="aide">— vidéo, images, carrousel ou PDF ; il remplace ce que l’outil a généré</span>
            </summary>
            <div style={{ marginTop: 10 }}>
              <TeleverserLivrables entite={e} publicationId={p.id} direct={direct} plafonds={plafonds} carrousel={/carrousel/.test(p.format_slug)} />
            </div>
          </details>
        )}

        {/* ── Le média généré, selon le format (en repli si le post est fourni) ── */}
        <Repli actif={fourni}>
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
        </Repli>

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

/** Ce que l'outil a généré, replié quand un post fourni le remplace. */
function Repli({ actif, children }: { actif: boolean; children: ReactNode }) {
  if (!actif) return <>{children}</>;
  return (
    <details className="carte" style={{ marginBottom: 12 }}>
      <summary className="aide" style={{ cursor: 'pointer' }}>
        Ce que l’outil avait généré pour ce post — en repli, non utilisé
      </summary>
      <div style={{ marginTop: 10 }}>{children}</div>
    </details>
  );
}
