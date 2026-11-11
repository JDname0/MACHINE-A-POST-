import Link from 'next/link';
import { format } from '@/lib/formats';
import { formaterDate, LIBELLE_STATUT, mediasDePublication, type LignePublication } from '@/lib/requetes';
import { constatsDe, lienVisuel, pagesCarrousel, urlVisuel, texteAColler } from '@/lib/fiche';
import { attendu } from '@/lib/conformite-media';
import { DELAIS, imagesMemoire, montagePret, reglagesVideo } from '@/lib/production';
import { trancher, memoriserVisuel } from '@/app/actions';
import { BoutonVideo } from './BoutonVideo';
import type { EntiteSlug } from '@/lib/marques';

/**
 * Le post vu depuis le calendrier, quel que soit son format : texte, image,
 * pages de carrousel ou vidéo — avec ce qu'il faut pour le produire et le
 * valider sans quitter le calendrier.
 */
export function ApercuPost({ p, fermer }: { p: LignePublication; fermer: string }) {
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
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={urlVisuel(e, v)}
                  alt={`Page ${i + 1}`}
                  loading="lazy"
                  style={{ width: 200, flex: '0 0 auto', borderRadius: 8, border: '1px solid var(--ligne)' }}
                />
              ))}
            </div>
          </div>
        ) : visuel && veut === 'image' ? (
          <div className="carte" style={{ marginBottom: 12 }}>
            <h3>Visuel</h3>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={visuel} alt={`Visuel — ${p.titre}`} style={{ width: '100%', borderRadius: 10, border: '1px solid var(--ligne)', marginTop: 8 }} />
          </div>
        ) : veut === 'aucun' ? (
          <div className="encart" style={{ marginBottom: 12 }}>
            {f.reseau === 'blog' ? 'Article de blog : texte seul.' : 'Post textuel : pas de média, c’est voulu sur ce réseau.'}
          </div>
        ) : null}

        <div className="carte" style={{ marginBottom: 12 }}>
          <h3>Texte</h3>
          <pre className="bloc" style={{ whiteSpace: 'pre-wrap', maxHeight: 360, overflow: 'auto', marginTop: 8 }}>
            {texteAColler(p) || '(texte vide)'}
          </pre>
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
          {veut !== 'aucun' && (visuel || pages.length) ? (
            <form action={memoriserVisuel}>
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="entite" value={e} />
              <input type="hidden" name="retour" value={ici} />
              <button type="submit" className="fantome">
                {pages.length ? 'Générer les pages' : 'Générer le visuel'}
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
