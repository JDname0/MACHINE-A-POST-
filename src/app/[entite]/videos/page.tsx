import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Flanc } from '@/components/Flanc';
import { StudioVideo } from '@/components/StudioVideo';
import { ProductionLot } from '@/components/ProductionLot';
import { marque, type EntiteSlug } from '@/lib/marques';
import { format } from '@/lib/formats';
import { publication, compteursMenu, formaterDate, LIBELLE_STATUT } from '@/lib/requetes';
import { videosDe } from '@/lib/videos';
import { THEMES } from '@/lib/visuels';
import { depotDirect } from '@/lib/medias';
import { echeancesVideo, imagesMemoire, montageParDefaut, DELAI_VIDEO_JOURS, type EtatVideo } from '@/lib/production';
import { memoriserSemaine } from '@/app/actions';

/**
 * Le studio vidéo : l'échéancier des vidéos du calendrier, la production en
 * lot de tout ce qui est dû, et le montage fin d'un post.
 */

const LIBELLE_ETAT: Record<EtatVideo, { texte: string; t?: string }> = {
  prete: { texte: 'prête', t: 'ok' },
  'en-retard': { texte: 'en retard', t: 'blocage' },
  'a-monter': { texte: 'à monter', t: 'alerte' },
  'plus-tard': { texte: 'plus tard' },
};

export default async function Videos({
  params,
  searchParams,
}: {
  params: Promise<{ entite: string }>;
  searchParams: Promise<{ p?: string; script?: string; memorises?: string }>;
}) {
  const { entite } = await params;
  const { p: pid, script, memorises } = await searchParams;
  const e = entite as EntiteSlug;
  const m = marque(e);

  const echeances = echeancesVideo(e);
  const memoire = imagesMemoire(e);
  const generees = memoire.filter((x) => x.origine === 'genere').length;
  const images = memoire.map((x) => ({ id: x.id, url: `/${e}/medias/${x.id}`, nom: x.nom, origine: x.origine }));
  const t = THEMES[e].clair;
  const theme = { fond: t.fond, encre: t.encre, accent: t.accent, policeTitre: t.policeTitre };
  const rythme = e === 'veolt' ? ('sec' as const) : ('pose' as const);
  const direct = depotDirect();

  // Le post ouvert dans le studio : celui de l'adresse, sinon le plus urgent.
  const urgent = echeances.find((x) => x.etat === 'en-retard') ?? echeances.find((x) => x.etat === 'a-monter') ?? echeances[0];
  if (!pid && urgent) redirect(`/${e}/videos?p=${urgent.p.id}`);
  const choisi = pid ? publication(Number(pid)) : undefined;
  const p = choisi && choisi.entite === e ? choisi : undefined;
  const montage = p ? montageParDefaut(p, memoire, script) : null;
  const scripts = videosDe(e);

  const dues = echeances.filter((x) => x.etat === 'en-retard' || x.etat === 'a-monter');
  const lot = dues.map((x) => {
    const md = montageParDefaut(x.p, memoire);
    return {
      publicationId: x.p.id,
      titre: x.p.titre ?? 'Sans titre',
      echeance: x.echeance,
      montage: {
        entite: e,
        publicationId: x.p.id,
        largeur: md.largeur,
        hauteur: md.hauteur,
        plans: md.plans,
        cartes: md.cartes,
        images,
        theme,
        rythme,
        direct,
        legende: x.p.titre ?? '',
      },
    };
  });

  return (
    <>
      <Flanc entite={e} page="videos" compteurs={compteursMenu(e)} />
      <main className="corps">
        <header className="entete">
          <div className="sur">Studio vidéo · {m.nom}</div>
          <h1>Les vidéos du calendrier, au bon moment</h1>
          <p className="sous">
            Chaque post vidéo doit avoir sa vidéo {DELAI_VIDEO_JOURS} jours avant sa publication, pour laisser le temps de
            la relire et de la valider. Ce qui est dû se fabrique ici en un clic — dans ton navigateur — à partir du script
            et de la mémoire d&apos;images (visuels générés, rendus 3D, Higgsfield, After Effects…).
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

        <ProductionLot elements={lot} />

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
              theme={theme}
              rythme={rythme}
              direct={direct}
              legende={p.titre ?? ''}
            />
          </>
        ) : null}
      </main>
    </>
  );
}
