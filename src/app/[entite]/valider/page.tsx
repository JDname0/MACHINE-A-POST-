import Link from 'next/link';
import { Flanc } from '@/components/Flanc';
import { marque, type EntiteSlug } from '@/lib/marques';
import { format } from '@/lib/formats';
import { publications, compteursMenu, formaterDate, LIBELLE_STATUT, livrablesDe, mediasDePublication } from '@/lib/requetes';
import { constatsDe, lienVisuel, texteAColler } from '@/lib/fiche';
import { trancher, memoriserSemaine } from '@/app/actions';
import { AssistantIA } from '@/components/AssistantIA';
import { BoutonVideo } from '@/components/BoutonVideo';
import { attendu } from '@/lib/conformite-media';
import { aUneVideo, imagesMemoire, montagePret } from '@/lib/production';

/**
 * La file de validation : une semaine à la fois, chaque post avec son visuel,
 * son contrôle et deux boutons. C'est ici que se passe la supervision humaine
 * — l'outil a tout préparé, Jonathan tranche, un post à la fois.
 *
 * Pas de « tout valider » : la règle est un « oui » par publication.
 */

const A_TRANCHER = new Set(['brouillon', 'a-relire']);
const COURT = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
const court = (d: string) => COURT.format(new Date(`${d}T12:00:00`));

export default async function Valider({
  params,
  searchParams,
}: {
  params: Promise<{ entite: string }>;
  searchParams: Promise<{ s?: string; bloque?: string; erreurIA?: string }>;
}) {
  const { entite } = await params;
  const { s, bloque, erreurIA } = await searchParams;
  const [idErreurIA, ...msgIA] = (erreurIA ?? '').split('|');
  const e = entite as EntiteSlug;
  const m = marque(e);
  const tout = publications(e).filter((p) => p.semaine != null);

  const semaines = [...new Set(tout.map((p) => p.semaine!))].sort((a, b) => a - b);
  const resteParSemaine = new Map<number, number>();
  for (const p of tout) if (A_TRANCHER.has(p.statut)) resteParSemaine.set(p.semaine!, (resteParSemaine.get(p.semaine!) ?? 0) + 1);

  // Par défaut : la première semaine où il reste quelque chose à trancher.
  const premiere = semaines.find((n) => (resteParSemaine.get(n) ?? 0) > 0) ?? semaines[0] ?? 1;
  const semaine = s && semaines.includes(Number(s)) ? Number(s) : premiere;
  const pubs = tout.filter((p) => p.semaine === semaine);
  const valides = pubs.filter((p) => p.statut === 'valide' || p.statut === 'publie').length;
  const retour = `/${e}/valider?s=${semaine}`;
  const memoire = imagesMemoire(e);

  return (
    <>
      <Flanc entite={e} page="valider" compteurs={compteursMenu(e)} />
      <main className="corps">
        <header className="entete">
          <div className="sur">File de validation · {m.nom}</div>
          <h1>
            Semaine {semaine}
            {pubs.length ? (
              <span style={{ fontWeight: 400 }}>
                {' '}
                · {court(pubs[0].date_prevue)} → {court(pubs[pubs.length - 1].date_prevue)}
              </span>
            ) : null}
          </h1>
          <p className="sous">
            L&apos;outil a rédigé le texte et généré le visuel. Tu relis, tu valides ou tu renvoies en relecture — un
            post à la fois. Un post bloqué par un garde-fou ne peut pas être validé : ouvre-le pour le corriger.
          </p>
          <div className="rang" style={{ marginTop: 10 }}>
            <span className="pastille" data-t={valides === pubs.length && pubs.length ? 'ok' : 'accent'}>
              {valides}/{pubs.length} validés
            </span>
            {pubs[0]?.phase ? <span className="pastille">{pubs[0].phase}</span> : null}
            <form action={memoriserSemaine} style={{ marginLeft: 'auto' }}>
              <input type="hidden" name="entite" value={e} />
              <input type="hidden" name="semaine" value={semaine} />
              <input type="hidden" name="retour" value={retour} />
              <button type="submit" className="fantome" title="Range les visuels de la semaine dans la médiathèque — matière pour le studio vidéo">
                Mémoriser les visuels de la semaine
              </button>
            </form>
          </div>
        </header>

        <nav className="rang" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 6 }} aria-label="Semaines">
          {semaines.map((n) => {
            const reste = resteParSemaine.get(n) ?? 0;
            return (
              <Link
                key={n}
                href={`/${e}/valider?s=${n}`}
                className="pastille"
                data-t={n === semaine ? 'accent' : reste === 0 ? 'ok' : undefined}
                aria-current={n === semaine ? 'page' : undefined}
              >
                S{n}
                {reste ? ` · ${reste}` : ' ✓'}
              </Link>
            );
          })}
        </nav>

        {pubs.map((p) => {
          const f = format(p.format_slug);
          const { constats, validable } = constatsDe(p);
          const visuel = lienVisuel(p);
          const medias = mediasDePublication(p.id);
          // Un post fait ailleurs se valide sur ses propres fichiers, pas sur le visuel généré.
          const fournis = livrablesDe(p.id);
          const premier = fournis[0];
          const blocages = constats.filter((c) => c.niveau === 'blocage');
          const alertes = constats.filter((c) => c.niveau === 'alerte');
          const tranche = !A_TRANCHER.has(p.statut);
          return (
            <section
              key={p.id}
              id={`p${p.id}`}
              className="carte"
              style={{ marginBottom: 14, opacity: tranche ? 0.72 : 1, scrollMarginTop: 16 }}
            >
              <div className="rang" style={{ justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                <div className="rang" style={{ gap: 6, flexWrap: 'wrap' }}>
                  <span className="pastille">{formaterDate(p.date_prevue)}</span>
                  <span className="pastille">{f.nom}</span>
                  <span
                    className="pastille"
                    data-t={p.statut === 'valide' || p.statut === 'publie' ? 'ok' : p.statut === 'a-relire' ? 'alerte' : undefined}
                  >
                    {LIBELLE_STATUT[p.statut]}
                  </span>
                  {!validable ? <span className="pastille" data-t="blocage">bloqué</span> : null}
                  {alertes.length ? (
                    <span className="pastille" data-t="alerte">
                      {alertes.length} alerte{alertes.length > 1 ? 's' : ''}
                    </span>
                  ) : null}
                </div>
                <Link className="lien-accent" href={`/${e}/publications/${p.id}`}>
                  Modifier →
                </Link>
              </div>

              <h3 style={{ marginBottom: 10 }}>{p.titre}</h3>

              <div className="grille" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', alignItems: 'start' }}>
                <div>
                  {premier ? (
                    <div>
                      {premier.type_mime.startsWith('video/') ? (
                        <video
                          src={`/${e}/medias/${premier.id}#t=1`}
                          controls
                          playsInline
                          preload="metadata"
                          style={{ width: '100%', maxHeight: 420, borderRadius: 10, background: '#000', display: 'block' }}
                        />
                      ) : premier.type_mime.startsWith('image/') ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`/${e}/medias/${premier.id}`}
                          alt={`Post fourni — ${p.titre}`}
                          loading="lazy"
                          style={{ width: '100%', height: 'auto', borderRadius: 10, border: '1px solid var(--ligne)', display: 'block' }}
                        />
                      ) : (
                        <a className="encart" style={{ display: 'block', margin: 0 }} href={`/${e}/medias/${premier.id}`} target="_blank" rel="noreferrer">
                          📄 {premier.nom} — ouvrir le document
                        </a>
                      )}
                      <div className="aide" style={{ marginTop: 6 }}>
                        📥 Post fourni, fait hors de la machine · {fournis.length} fichier{fournis.length > 1 ? 's' : ''} — tout voir dans le calendrier.
                      </div>
                    </div>
                  ) : visuel ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={visuel}
                      alt={`Visuel — ${p.titre}`}
                      loading="lazy"
                      style={{ width: '100%', height: 'auto', borderRadius: 10, border: '1px solid var(--ligne)', display: 'block' }}
                    />
                  ) : (
                    <div className="encart" style={{ margin: 0 }}>
                      {f.reseau === 'blog'
                        ? 'Article de blog : pas de visuel généré.'
                        : medias.length
                          ? `${medias.length} média${medias.length > 1 ? 's' : ''} rattaché${medias.length > 1 ? 's' : ''} — à voir dans le composeur.`
                          : 'Vidéo : aucun fichier rattaché pour l’instant.'}
                      {attendu(p.format_slug) === 'video' && !aUneVideo(p.id) ? (
                        <div className="rang" style={{ marginTop: 8, gap: 10, flexWrap: 'wrap' }}>
                          <BoutonVideo montage={montagePret(p, memoire)} />
                          <Link className="lien-accent" href={`/${e}/videos?p=${p.id}`}>
                            Régler les plans dans le studio →
                          </Link>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>

                <div>
                  <pre className="bloc" style={{ maxHeight: 320, overflow: 'auto', whiteSpace: 'pre-wrap', margin: 0 }}>
                    {texteAColler(p) || '(texte vide)'}
                  </pre>
                </div>
              </div>

              {blocages.length || (bloque && Number(bloque) === p.id) ? (
                <div style={{ marginTop: 10 }}>
                  {blocages.map((c, i) => (
                    <div key={i} className="constat" data-n="blocage">
                      <div className="regle">{c.regle}</div>
                      <div className="msg">{c.message}</div>
                    </div>
                  ))}
                </div>
              ) : null}
              {alertes.length ? (
                <details style={{ marginTop: 8 }}>
                  <summary className="aide">Voir les alertes</summary>
                  {alertes.map((c, i) => (
                    <div key={i} className="constat" data-n="alerte">
                      <div className="regle">{c.regle}</div>
                      <div className="msg">{c.message}</div>
                    </div>
                  ))}
                </details>
              ) : null}

              {p.statut !== 'publie' ? (
                <div className="rang" style={{ marginTop: 12, gap: 8 }}>
                  <form action={trancher}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="entite" value={e} />
                    <input type="hidden" name="retour" value={retour} />
                    <input type="hidden" name="decision" value="valide" />
                    <button type="submit" disabled={!validable || p.statut === 'valide'}>
                      {p.statut === 'valide' ? 'Validé ✓' : 'Valider'}
                    </button>
                  </form>
                  <form action={trancher}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="entite" value={e} />
                    <input type="hidden" name="retour" value={retour} />
                    <input type="hidden" name="decision" value="a-relire" />
                    <button type="submit" className="fantome" disabled={p.statut === 'a-relire'}>
                      À retravailler
                    </button>
                  </form>
                </div>
              ) : null}

              <AssistantIA
                p={p}
                retour={`${retour}#p${p.id}`}
                erreur={Number(idErreurIA) === p.id ? msgIA.join('|') : undefined}
              />
            </section>
          );
        })}

        {pubs.length === 0 ? <div className="encart">Aucune publication cette semaine.</div> : null}
      </main>
    </>
  );
}
