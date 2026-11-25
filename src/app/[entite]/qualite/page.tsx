import Link from 'next/link';
import { Flanc } from '@/components/Flanc';
import { marque, type EntiteSlug } from '@/lib/marques';
import { compteursMenu, publications, formaterDate } from '@/lib/requetes';
import { auditerEntite, PAGES_VISEES_CARROUSEL } from '@/lib/superviseur';
import { pagesCarrousel, urlVisuel } from '@/lib/fiche';
import { consignesDe } from '@/lib/consignes-studio';
import { imagesMemoire, montageParDefaut } from '@/lib/production';
import { imagePack } from '@/lib/illustrations';
import { LIBELLE_STATUT } from '@/lib/requetes';

export const dynamic = 'force-dynamic';

const VIDEOS = new Set(['ig-reel', 'tiktok-video', 'li-video', 'ig-video']);

/**
 * Le superviseur qualité : chaque post à venir relu selon les consignes du
 * studio (`consignes-studio.ts`), avec ses constats et — semaine par semaine —
 * ses rendus page par page et ses plans vidéo, pour juger sur pièce. Lecture
 * seule : il ne modifie rien.
 */
export default async function Qualite({
  params,
  searchParams,
}: {
  params: Promise<{ entite: string }>;
  searchParams: Promise<{ semaine?: string; tout?: string }>;
}) {
  const { entite } = await params;
  const f = await searchParams;
  const e = entite as EntiteSlug;
  const m = marque(e);
  const audit = auditerEntite(e);
  const posts = new Map(publications(e).map((p) => [p.id, p]));
  const memoire = imagesMemoire(e);
  const consignes = consignesDe(e);

  const semaines = [...new Set(audit.map((x) => posts.get(x.id)?.semaine ?? null).filter((s): s is number => s != null))].sort((a, b) => a - b);
  const semaine = f.semaine ? Number(f.semaine) : semaines[0];
  const aRevoir = audit.filter((x) => x.constats.length);
  const nbConstats = audit.reduce((n, x) => n + x.constats.length, 0);
  const visibles = audit.filter((x) => (f.tout ? true : (posts.get(x.id)?.semaine ?? null) === semaine));

  return (
    <>
      <Flanc entite={e} page="qualite" compteurs={compteursMenu(e)} />
      <main className="corps">
        <header className="entete">
          <div className="sur">Superviseur qualité · {m.nom}</div>
          <h1>Chaque post, relu selon les consignes du studio</h1>
          <p className="sous">
            Le superviseur relit tous les posts à venir : carrousels de {PAGES_VISEES_CARROUSEL} pages au plus, une image par page,
            aucun plan vidéo en texte seul, 3 figures par article, aucun tic d&apos;écriture « IA ». Il ne modifie rien : il dit
            ce qui ne va pas et comment le corriger. Les rendus ci-dessous sont ceux qui partiront.
          </p>
        </header>

        <section className="carte" style={{ marginBottom: 16 }}>
          <div className="rang" style={{ gap: 24, flexWrap: 'wrap' }}>
            <div>
              <div className="sur">Posts relus</div>
              <div style={{ fontSize: 28, fontWeight: 600 }}>{audit.length}</div>
            </div>
            <div>
              <div className="sur">Conformes</div>
              <div style={{ fontSize: 28, fontWeight: 600 }}>{audit.length - aRevoir.length}</div>
            </div>
            <div>
              <div className="sur">À revoir</div>
              <div style={{ fontSize: 28, fontWeight: 600, color: aRevoir.length ? 'var(--attention)' : undefined }}>{aRevoir.length}</div>
            </div>
            <div>
              <div className="sur">Constats</div>
              <div style={{ fontSize: 28, fontWeight: 600 }}>{nbConstats}</div>
            </div>
          </div>
          {aRevoir.length ? (
            <ul style={{ marginTop: 12, paddingLeft: 18 }}>
              {aRevoir.map((x) => (
                <li key={x.id} style={{ marginBottom: 6 }}>
                  <Link className="lien-accent" href={`/${e}/publications/${x.id}`}>
                    {formaterDate(x.date)} · {x.format} · {x.titre}
                  </Link>
                  <ul style={{ paddingLeft: 16 }}>
                    {x.constats.map((c, i) => (
                      <li key={i} className="aide" style={{ color: c.niveau === 'alerte' ? 'var(--attention)' : undefined }}>
                        {c.message}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          ) : (
            <p className="aide" style={{ marginTop: 10 }}>✓ Tous les posts à venir respectent les consignes du studio.</p>
          )}
        </section>

        {consignes.length ? (
          <details className="carte" style={{ marginBottom: 16 }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Les consignes du studio ({consignes.length}) — lues par chaque génération</summary>
            <table style={{ width: '100%', marginTop: 10, borderCollapse: 'collapse' }}>
              <tbody>
                {consignes.map((c, i) => (
                  <tr key={i} style={{ borderTop: '1px solid var(--ligne, #333)' }}>
                    <td style={{ padding: '6px 8px', whiteSpace: 'nowrap', verticalAlign: 'top' }} className="aide">
                      {c.domaine}
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      {c.regle}
                      <div className="aide">{c.pourquoi}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        ) : null}

        <section className="carte">
          <div className="rang" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
            <strong>Les rendus, semaine par semaine :</strong>
            {semaines.map((s) => (
              <Link key={s} className={!f.tout && s === semaine ? 'bouton' : 'fantome'} href={`/${e}/qualite?semaine=${s}`}>
                S{s}
              </Link>
            ))}
            <Link className={f.tout ? 'bouton' : 'fantome'} href={`/${e}/qualite?tout=1`}>
              Tout
            </Link>
          </div>
          {visibles.map((x) => {
            const p = posts.get(x.id);
            if (!p) return null;
            const pages = /carrousel/.test(p.format_slug) ? pagesCarrousel(p) : [];
            const plans = VIDEOS.has(p.format_slug) ? montageParDefaut(p, memoire).plans : [];
            return (
              <article key={x.id} style={{ borderTop: '1px solid var(--ligne, #333)', padding: '14px 0' }}>
                <div className="rang" style={{ gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <span className="aide">
                    {formaterDate(x.date)}
                    {x.heure ? ` · ${x.heure}` : ''} · {x.format} · {LIBELLE_STATUT[x.statut] ?? x.statut}
                  </span>
                  <Link className="lien-accent" href={`/${e}/publications/${x.id}`}>
                    {x.titre}
                  </Link>
                  <span className="aide" style={{ color: x.constats.length ? 'var(--attention)' : undefined }}>
                    {x.constats.length ? `⚠ ${x.constats.length} constat(s)` : '✓ conforme'}
                  </span>
                </div>
                {pages.length ? (
                  <div className="rang" style={{ gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                    {pages.map((v, i) => (
                      <a key={i} href={urlVisuel(e, v)} target="_blank" rel="noreferrer" title={`Page ${i + 1}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={urlVisuel(e, v)} alt={`Page ${i + 1}`} loading="lazy" width={150} height={188} style={{ borderRadius: 6, display: 'block' }} />
                      </a>
                    ))}
                  </div>
                ) : null}
                {plans.length ? (
                  <ol style={{ marginTop: 8, paddingLeft: 22 }} className="aide">
                    {plans.map((pl, i) => {
                      const montre =
                        pl.source.type === 'media'
                          ? `image : ${(pl.illustration && imagePack(pl.illustration)?.montre) || memoire.find((k) => k.id === (pl.source as { id: number }).id)?.nom || 'média'}`
                          : pl.illustration
                            ? `image prévue, à importer : ${pl.illustration}`
                            : pl.scene
                              ? `scène : ${pl.scene.type}`
                              : 'texte seul';
                      const seul = i > 0 && i < plans.length - 1 && montre === 'texte seul';
                      return (
                        <li key={i} style={{ color: seul ? 'var(--attention)' : undefined }}>
                          {pl.duree.toFixed(1)} s — {pl.chapitre ? `${pl.chapitre} · ` : ''}
                          {pl.texte || '(écran de fin)'} — <em>{montre}</em>
                        </li>
                      );
                    })}
                  </ol>
                ) : null}
              </article>
            );
          })}
        </section>
      </main>
    </>
  );
}
