import Link from 'next/link';
import { Flanc } from '@/components/Flanc';
import { marque, type EntiteSlug } from '@/lib/marques';
import { format } from '@/lib/formats';
import { publications, publication, compteursMenu, LIBELLE_STATUT } from '@/lib/requetes';
import { ApercuPost } from '@/components/ApercuPost';
import { ReglagesProduction } from '@/components/ReglagesProduction';
import { attendu } from '@/lib/conformite-media';
import { SEQUENCE_LANCEMENT, lundiDe, iso } from '@/lib/calendrier';
import { recalerCalendrier } from '@/app/actions';
import { BoutonVideo } from '@/components/BoutonVideo';
import { ProductionLot } from '@/components/ProductionLot';
import { echeancesVideo, imagesMemoire, montagePret } from '@/lib/production';

const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

const COURT = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
const court = (d: string) => COURT.format(new Date(`${d}T12:00:00`));

export default async function Calendrier({
  params,
  searchParams,
}: {
  params: Promise<{ entite: string }>;
  searchParams: Promise<{ recale?: string; apercu?: string; reglages?: string }>;
}) {
  const { entite } = await params;
  const { recale, apercu, reglages } = await searchParams;
  const ouvert = apercu ? publication(Number(apercu)) : undefined;
  const e = entite as EntiteSlug;
  const m = marque(e);
  const tout = publications(e);

  const parSemaine = new Map<number, typeof tout>();
  for (const p of tout) {
    const s = p.semaine ?? 0;
    if (!parSemaine.has(s)) parSemaine.set(s, []);
    parSemaine.get(s)!.push(p);
  }

  // Les vidéos du calendrier : leur état et, si elles manquent, de quoi les
  // générer d'ici, sans passer par le studio.
  const echeances = new Map(echeancesVideo(e).map((x) => [x.p.id, x]));
  const memoire = echeances.size ? imagesMemoire(e) : [];
  const montages = new Map(
    [...echeances.values()].filter((x) => x.etat !== 'prete').map((x) => [x.p.id, montagePret(x.p, memoire)]),
  );
  const ETIQ: Record<string, string> = { prete: '🎬 prête', 'en-retard': '🎬 en retard', aujourdhui: '🎬 aujourd’hui', bientot: '🎬 à faire', 'plus-tard': '🎬 à faire' };

  // Le premier lundi actuel, et celui qu'on propose : le lundi qui vient.
  const s1 = parSemaine.get(1)?.[0]?.date_prevue;
  const debutActuel = s1 ? iso(lundiDe(new Date(`${s1}T12:00:00`))) : null;
  const prochain = lundiDe(new Date());
  prochain.setDate(prochain.getDate() + 7);

  return (
    <>
      <Flanc entite={e} page="calendrier" compteurs={compteursMenu(e)} />
      <main className="corps">
        <header className="entete">
          <div className="sur">Calendrier éditorial · 12 semaines</div>
          <h1>Piliers × formats × cadence</h1>
          <p className="sous">
            Un calendrier n&apos;est pas une liste de dates, c&apos;est une conséquence. {m.nom} tient{' '}
            {Object.entries(m.reseaux).filter(([r, v]) => r !== 'blog' && v !== 'exclu').length} réseaux et{' '}
            {m.piliers.length} piliers ; le reste se déduit. Clique un post pour le voir en entier — texte, image,
            carrousel ou vidéo — et le produire ou le valider d&apos;ici.
          </p>
        </header>

        {recale === '1' ? (
          <div className="encart" style={{ marginBottom: 14 }}>
            ✅ Calendrier recalé pour Veolt et MagistrIA. Les brouillons n&apos;ont pas bougé, seules les dates ont changé.
          </div>
        ) : null}

        <form action={recalerCalendrier} className="encart" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'end', marginBottom: 18 }}>
          <input type="hidden" name="entite" value={e} />
          <div style={{ flex: '1 1 260px' }}>
            <strong>Recaler les 12 semaines</strong>
            <div className="aide">
              {debutActuel ? <>Aujourd&apos;hui la semaine 1 commence le {court(debutActuel)}. </> : null}
              S&apos;applique aux deux entités. Les textes ne changent pas, les publications déjà parties non plus.
            </div>
          </div>
          <label>
            <div className="aide">Premier lundi</div>
            <input type="date" name="depart" defaultValue={iso(prochain)} required />
          </label>
          <label>
            <div className="aide">Pause après la semaine</div>
            <select name="pause_apres" defaultValue="0">
              <option value="0">aucune pause</option>
              {Array.from({ length: 11 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>S{n}</option>
              ))}
            </select>
          </label>
          <label>
            <div className="aide">Durée de la pause</div>
            <select name="pause_semaines" defaultValue="0">
              {[0, 1, 2, 3].map((n) => (
                <option key={n} value={n}>{n} semaine{n > 1 ? 's' : ''}</option>
              ))}
            </select>
          </label>
          <button className="bouton" type="submit">Recaler</button>
        </form>

        <ReglagesProduction entite={e} retour={`/${e}/calendrier`} enregistre={reglages === '1'} />

        {[...parSemaine.entries()].map(([s, pubs]) => {
          const phase = SEQUENCE_LANCEMENT.find((x) => x.semaine === s);
          const parJour = new Map<number, typeof pubs>();
          for (const p of pubs) {
            const j = (new Date(`${p.date_prevue}T12:00:00`).getDay() + 6) % 7;
            if (!parJour.has(j)) parJour.set(j, []);
            parJour.get(j)!.push(p);
          }
          return (
            <section key={s}>
              <div className="ban-semaine">
                <h2>Semaine {s}</h2>
                {pubs.length ? (
                  <span className="int">
                    {court(pubs[0].date_prevue)} → {court(pubs[pubs.length - 1].date_prevue)}
                  </span>
                ) : null}
                {phase ? <span className="ph">{phase.nom}</span> : null}
                {phase ? <span className="int">{phase.intention}</span> : <span className="int">Semaine type.</span>}
                <span className="int" style={{ marginLeft: 'auto' }}>
                  {pubs.length} publication{pubs.length > 1 ? 's' : ''}
                </span>
              </div>
              {(() => {
                const aFaire = pubs.filter((x) => montages.has(x.id));
                if (aFaire.length < 2) return null;
                return (
                  <details style={{ margin: '6px 0 8px' }}>
                    <summary className="aide" style={{ cursor: 'pointer' }}>
                      🎬 Générer les {aFaire.length} vidéos de la semaine {s}
                    </summary>
                    <div style={{ marginTop: 6 }}>
                      <ProductionLot
                        titre={`Vidéos de la semaine ${s}`}
                        elements={aFaire.map((x) => ({
                          publicationId: x.id,
                          titre: x.titre ?? 'Sans titre',
                          echeance: echeances.get(x.id)!.echeance,
                          montage: montages.get(x.id)!,
                        }))}
                      />
                    </div>
                  </details>
                );
              })()}
              <div className="semaine-grille">
                {JOURS.map((nom, j) => {
                  const liste = parJour.get(j) ?? [];
                  return (
                    <div key={j} className={`jour${liste.length ? '' : ' vide'}`}>
                      <div className="d">
                        <span>{nom}</span>
                        {liste[0] ? <span>{liste[0].date_prevue.slice(8)}</span> : null}
                      </div>
                      {liste.map((p) => {
                        const f = format(p.format_slug);
                        const ech = echeances.get(p.id);
                        const mo = montages.get(p.id);
                        return (
                          <div key={p.id}>
                            <Link
                              className="vignette"
                              href={`/${e}/calendrier?apercu=${p.id}`}
                              scroll={false}
                              title={p.raison ?? ''}
                              style={ouvert?.id === p.id ? { outline: '2px solid var(--accent)' } : undefined}
                            >
                              <div className="r">
                                {attendu(p.format_slug) === 'video' ? '🎬 ' : /carrousel/.test(p.format_slug) ? '🗂️ ' : attendu(p.format_slug) === 'image' ? '🖼️ ' : '✍️ '}
                                {f.nom.replace(/^.*— /, '')}
                              </div>
                              <div>{p.titre}</div>
                              <div className="st">
                                {LIBELLE_STATUT[p.statut]}
                                {ech ? ` · ${ETIQ[ech.etat]}` : ''}
                              </div>
                            </Link>
                            {mo ? (
                              <div style={{ marginTop: 4 }}>
                                <BoutonVideo montage={mo} compact />
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        <div className="sep" />
        <div className="encart">
          <strong>Pourquoi 12 semaines et pas 52 ?</strong> Parce qu&apos;un calendrier à un an se périme avant
          d&apos;être tenu. Trois mois, c&apos;est la durée au bout de laquelle on sait ce qui marche — et le moment de
          le refaire avec des mesures plutôt qu&apos;avec des hypothèses.
        </div>
      </main>
      {ouvert && ouvert.entite === e ? <ApercuPost p={ouvert} fermer={`/${e}/calendrier`} /> : null}
    </>
  );
}
