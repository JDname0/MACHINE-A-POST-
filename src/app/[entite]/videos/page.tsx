import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Flanc } from '@/components/Flanc';
import { StudioVideo } from '@/components/StudioVideo';
import { ProductionLot } from '@/components/ProductionLot';
import { marque, type EntiteSlug } from '@/lib/marques';
import { format } from '@/lib/formats';
import { publication, publications, compteursMenu, formaterDate, LIBELLE_STATUT } from '@/lib/requetes';
import { dureeConseillee, attendu } from '@/lib/conformite-media';
import { iaDisponible } from '@/lib/ia';
import { texteAColler } from '@/lib/fiche';
import { voixDuPost } from '@/lib/production';
import { duree as libelleDuree, poids } from '@/lib/medias';
import { videosDe } from '@/lib/videos';
import { depotDirect, plafondDepotVideo } from '@/lib/medias';
import { echeancesVideo, imagesMemoire, montageParDefaut, montagePret, themeStudio, nomPilier, reglagesVideo, formatsVideoDe, videosProduites, DELAIS, type EtatVideo } from '@/lib/production';
import { memoriserSemaine, creerVideoDepuisPost, creerVideoCasUsage } from '@/app/actions';
import { ReglagesProduction } from '@/components/ReglagesProduction';
import { BoutonVideo } from '@/components/BoutonVideo';

/**
 * Le studio vidéo : l'échéancier des vidéos du calendrier, la production en
 * lot de tout ce qui est dû, et le montage fin d'un post.
 */

const LIBELLE_ETAT: Record<EtatVideo, { texte: string; t?: string }> = {
  prete: { texte: 'prête', t: 'ok' },
  'en-retard': { texte: 'en retard', t: 'blocage' },
  aujourdhui: { texte: 'à faire aujourd’hui', t: 'alerte' },
  bientot: { texte: 'bientôt' },
  'plus-tard': { texte: 'plus tard' },
};

export default async function Videos({
  params,
  searchParams,
}: {
  params: Promise<{ entite: string }>;
  searchParams: Promise<{ p?: string; script?: string; memorises?: string; reglages?: string }>;
}) {
  const { entite } = await params;
  const { p: pid, script, memorises, reglages: reglesOk } = await searchParams;
  const reglages = reglagesVideo(entite as EntiteSlug);
  const quand = DELAIS.find((d) => d.jours === reglages.delai)?.libelle ?? '';
  const e = entite as EntiteSlug;
  const m = marque(e);

  const echeances = echeancesVideo(e);
  const memoire = imagesMemoire(e);
  const generees = memoire.filter((x) => x.origine === 'genere').length;
  const images = memoire.map((x) => ({ id: x.id, url: `/${e}/medias/${x.id}`, nom: x.nom, origine: x.origine }));
  const rythme = e === 'veolt' ? ('sec' as const) : ('pose' as const);
  const direct = depotDirect();

  // Le post ouvert dans le studio : celui de l'adresse, sinon le plus urgent.
  const urgent =
    echeances.find((x) => x.etat === 'en-retard') ??
    echeances.find((x) => x.etat === 'aujourdhui') ??
    echeances.find((x) => x.etat === 'bientot') ??
    echeances[0];
  if (!pid && urgent) redirect(`/${e}/videos?p=${urgent.p.id}`);
  const choisi = pid ? publication(Number(pid)) : undefined;
  const p = choisi && choisi.entite === e ? choisi : undefined;
  const montage = p ? montageParDefaut(p, memoire, script) : null;
  const scripts = videosDe(e);

  const produites = videosProduites(e);
  const postsVideo = new Map(
    produites.flatMap((v) => {
      const x = v.publication_id ? publication(v.publication_id) : undefined;
      return x && x.statut !== 'publie' ? [[x.id, x] as const] : [];
    }),
  );
  const formatsVideo = formatsVideoDe(e);
  const sources = publications(e).filter((x) => attendu(x.format_slug) !== 'video' && x.statut !== 'abandonne');

  const enLot = (liste: typeof echeances) =>
    liste.map((x) => ({ publicationId: x.p.id, titre: x.p.titre ?? 'Sans titre', echeance: x.echeance, montage: montagePret(x.p, memoire) }));
  const lotDuJour = enLot(echeances.filter((x) => x.etat === 'en-retard' || x.etat === 'aujourdhui'));
  const lotAvance = enLot(echeances.filter((x) => x.etat === 'bientot'));

  return (
    <>
      <Flanc entite={e} page="videos" compteurs={compteursMenu(e)} />
      <main className="corps">
        <header className="entete">
          <div className="sur">Studio vidéo · {m.nom}</div>
          <h1>Les vidéos du calendrier, au bon moment</h1>
          <p className="sous">
            Chaque vidéo du calendrier est produite <strong>{quand}</strong> de sa publication (réglable ci-dessous), puis
            relue et validée. Elle se fabrique en un clic — dans ton navigateur — à partir du script et de la mémoire
            d&apos;images (visuels générés, rendus 3D, Higgsfield, After Effects…).
          </p>
          <div className="rang" style={{ marginTop: 10, gap: 6, flexWrap: 'wrap' }}>
            <span className="pastille" data-t="accent">
              Mémoire : {memoire.length} image{memoire.length > 1 ? 's' : ''} · {generees} générée{generees > 1 ? 's' : ''}
            </span>
            <span className="pastille">
              {echeances.filter((x) => x.etat === 'prete').length}/{echeances.length} vidéos prêtes
            </span>
            {memorises != null ? (
              <span className="pastille" data-t="ok">
                {memorises} visuel{Number(memorises) > 1 ? 's' : ''} ajouté{Number(memorises) > 1 ? 's' : ''} à la mémoire
              </span>
            ) : null}
          </div>
        </header>

        {scripts.some((x) => x.casUsage) ? (
          <section className="carte" style={{ marginBottom: 12 }}>
            <strong>Vidéos cas d&apos;usage — démonstrations longues</strong>
            <div className="aide" style={{ marginBottom: 10 }}>
              45 à 60 secondes, construites sur ce qui est vrai : fonctions réelles sur un dossier d&apos;exemple, prix
              affichés, aucun client ni résultat inventé. Chacune crée un post hors calendrier, à relire et valider.
            </div>
            <div className="grille" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
              {scripts
                .filter((x) => x.casUsage)
                .map((x) => (
                  <form key={x.ref} action={creerVideoCasUsage} className="encart" style={{ margin: 0 }}>
                    <input type="hidden" name="entite" value={e} />
                    <input type="hidden" name="ref" value={x.ref} />
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{x.titre}</div>
                    <div className="aide" style={{ marginBottom: 8 }}>
                      {format(x.formatSlug).nom} · {x.duree} s · {x.plans.length} plans ·{' '}
                      {[...new Set(x.plans.map((pl) => pl.scene?.type).filter(Boolean))].join(', ')}
                    </div>
                    <button type="submit">Créer et ouvrir dans le studio</button>
                  </form>
                ))}
            </div>
          </section>
        ) : null}

        <form action={creerVideoDepuisPost} className="carte" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'end', marginBottom: 12 }}>
          <input type="hidden" name="entite" value={e} />
          <div style={{ flex: '1 1 220px' }}>
            <strong>Vidéo à la demande</strong>
            <div className="aide">
              À partir de n&apos;importe quel post de {m.nom} — un LinkedIn, un carrousel, un article. Crée un post vidéo hors
              calendrier ; le calendrier, lui, reste tel quel.
            </div>
          </div>
          <label style={{ flex: '2 1 280px' }}>
            <div className="aide">Post de départ</div>
            <select name="source" required style={{ width: '100%' }}>
              {sources.map((x) => (
                <option key={x.id} value={x.id}>
                  {formaterDate(x.date_prevue)} · {format(x.format_slug).nom.replace(/^.*— /, '')} · {(x.titre ?? '').slice(0, 70)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <div className="aide">Format</div>
            <select name="format_slug">
              {formatsVideo.map((f) => (
                <option key={f} value={f}>
                  {format(f).nom}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">Créer et ouvrir dans le studio</button>
        </form>

        <ReglagesProduction entite={e} retour={`/${e}/videos${p ? `?p=${p.id}` : ''}`} enregistre={reglesOk === '1'} />

        <ProductionLot
          elements={lotDuJour}
          titre={`${lotDuJour.length} vidéo${lotDuJour.length > 1 ? 's' : ''} à produire aujourd’hui`}
        />
        {lotAvance.length ? (
          <details style={{ marginBottom: 16 }}>
            <summary className="aide" style={{ cursor: 'pointer' }}>
              Prendre de l&apos;avance — {lotAvance.length} vidéo{lotAvance.length > 1 ? 's' : ''} dues dans les sept jours
            </summary>
            <div style={{ marginTop: 8 }}>
              <ProductionLot
                elements={lotAvance}
                titre="Produire en avance"
                aide="Utile avant un week-end ou un déplacement. Les vidéos restent à valider."
              />
            </div>
          </details>
        ) : null}

        {echeances.length === 0 ? (
          <div className="encart">
            Aucun post vidéo à produire pour {m.nom}. Pour une vidéo hors calendrier, crée le post dans Publications avec un
            format vidéo, puis reviens ici.
          </div>
        ) : (
          <details style={{ marginBottom: 16 }} open={!p}>
            <summary className="aide" style={{ cursor: 'pointer' }}>
              Échéancier — {echeances.length} vidéos au calendrier
            </summary>
            <div className="tbl-enveloppe" style={{ marginTop: 8 }}>
              <table>
                <thead>
                  <tr>
                    <th>Publication</th>
                    <th>Vidéo avant le</th>
                    <th>Format</th>
                    <th>Post</th>
                    <th>État</th>
                  </tr>
                </thead>
                <tbody>
                  {echeances.map((x) => (
                    <tr key={x.p.id} style={x.p.id === p?.id ? { background: 'var(--accent-voile)' } : undefined}>
                      <td>{formaterDate(x.p.date_prevue)}</td>
                      <td>{formaterDate(x.echeance)}</td>
                      <td>{format(x.p.format_slug).nom.replace(/^.*— /, '')}</td>
                      <td>
                        <Link href={`/${e}/videos?p=${x.p.id}`}>{x.p.titre}</Link>
                      </td>
                      <td>
                        <span className="pastille" data-t={LIBELLE_ETAT[x.etat].t}>
                          {LIBELLE_ETAT[x.etat].texte}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}

        {p && montage ? (
          <>
            <div className="carte" style={{ marginBottom: 14 }}>
              <div className="rang" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <h3 style={{ marginBottom: 4 }}>{p.titre}</h3>
                  <div className="aide">
                    {format(p.format_slug).nom} · publication {formaterDate(p.date_prevue)} · {LIBELLE_STATUT[p.statut]} · cadre{' '}
                    {montage.ratio}
                  </div>
                </div>
                <div className="rang" style={{ gap: 8, flexWrap: 'wrap' }}>
                  <form method="get" className="rang" style={{ gap: 6 }}>
                    <input type="hidden" name="p" value={p.id} />
                    <select name="script" defaultValue={montage.scriptRef ?? 'post'} aria-label="Source des plans">
                      <option value="post">Plans tirés du texte du post</option>
                      {scripts.map((s) => (
                        <option key={s.ref} value={s.ref}>
                          Script : {s.titre}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="fantome">
                      Appliquer
                    </button>
                  </form>
                  {p.semaine ? (
                    <form action={memoriserSemaine}>
                      <input type="hidden" name="entite" value={e} />
                      <input type="hidden" name="semaine" value={p.semaine} />
                      <input type="hidden" name="retour" value={`/${e}/videos?p=${p.id}`} />
                      <button type="submit" className="fantome" title="Range dans la médiathèque les visuels générés des posts de cette semaine">
                        Mémoriser les visuels de S{p.semaine}
                      </button>
                    </form>
                  ) : null}
                  <Link className="bouton fantome" href={`/${e}/publications/${p.id}`}>
                    Ouvrir le post
                  </Link>
                </div>
              </div>
            </div>

            <StudioVideo
              key={`${p.id}-${montage.scriptRef ?? 'post'}`}
              entite={e}
              publicationId={p.id}
              titre={p.titre ?? ''}
              largeur={montage.largeur}
              hauteur={montage.hauteur}
              plansInitiaux={montage.plans}
              cartes={montage.cartes}
              images={images}
              themes={{ clair: themeStudio(e), sombre: null }}
              surTitre={nomPilier(p)}
              rythme={rythme}
              direct={direct}
              plafondOctets={plafondDepotVideo()}
              aDejaVideo={produites.some((v) => v.publication_id === p.id)}
              legende={p.titre ?? ''}
              legendePublication={texteAColler(p)}
              conseil={dureeConseillee(p.format_slug)}
              iaDispo={iaDisponible()}
              voixDispo={Boolean(process.env.ELEVENLABS_API_KEY)}
              voixInitiales={voixDuPost(p.id, e)}
            />
          </>
        ) : null}
        <div className="sep" />
        <section id="produites">
          <h2 style={{ marginBottom: 6 }}>Vidéos produites · {produites.length}</h2>
          <p className="aide" style={{ marginBottom: 12 }}>
            Toutes les vidéos de {m.nom} rangées dans la médiathèque — fabriquées ici ou déposées — avec le post auquel elles
            sont rattachées.
          </p>
          {produites.length === 0 ? (
            <div className="encart">Aucune vidéo pour l&apos;instant. Génère la première ci-dessus.</div>
          ) : (
            <div className="grille" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))' }}>
              {produites.map((v) => (
                <div key={v.id} className="carte" style={{ padding: 10 }}>
                  <video
                    src={`/${e}/medias/${v.id}`}
                    controls
                    playsInline
                    preload="metadata"
                    style={{ width: '100%', borderRadius: 8, background: '#000', aspectRatio: v.largeur && v.hauteur ? `${v.largeur} / ${v.hauteur}` : '9 / 16' }}
                  />
                  <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 8 }}>{v.titre ?? v.nom}</div>
                  <div className="rang" style={{ gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                    {v.format_slug ? <span className="pastille">{format(v.format_slug).nom.replace(/^.*— /, '')}</span> : null}
                    {v.date_prevue ? <span className="pastille">{formaterDate(v.date_prevue)}</span> : null}
                    {v.semaine ? <span className="pastille">S{v.semaine}</span> : <span className="pastille">à la demande</span>}
                    {libelleDuree(v.duree_s) ? <span className="pastille">{libelleDuree(v.duree_s)}</span> : null}
                    <span className="pastille">{poids(v.octets)}</span>
                  </div>
                  {v.publication_id && postsVideo.get(v.publication_id) ? (
                    <div style={{ marginTop: 8 }}>
                      <BoutonVideo montage={montagePret(postsVideo.get(v.publication_id)!, memoire)} libelle="Régénérer" />
                    </div>
                  ) : null}
                  {v.publication_id ? (
                    <div className="rang" style={{ gap: 8, marginTop: 8 }}>
                      <Link className="lien-accent" href={`/${e}/videos?p=${v.publication_id}`}>
                        Studio
                      </Link>
                      <Link className="lien-accent" href={`/${e}/publications/${v.publication_id}`}>
                        Post
                      </Link>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
