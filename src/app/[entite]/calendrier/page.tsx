import Link from 'next/link';
import { Flanc } from '@/components/Flanc';
import { marque, type EntiteSlug } from '@/lib/marques';
import { format } from '@/lib/formats';
import { publications, publication, compteursMenu, LIBELLE_STATUT, prochainCreneauBlog } from '@/lib/requetes';
import { ApercuPost } from '@/components/ApercuPost';
import { ReglagesProduction } from '@/components/ReglagesProduction';
import { attendu } from '@/lib/conformite-media';
import { SEQUENCE_LANCEMENT, lundiDe, iso } from '@/lib/calendrier';
import { recalerCalendrier, memoriserSemaine } from '@/app/actions';
import { BoutonVideo } from '@/components/BoutonVideo';
import { ProductionLot } from '@/components/ProductionLot';
import { GenerateurArticle } from '@/components/GenerateurArticle';
import { ImporterPost } from '@/components/ImporterPost';
import { TOUS_FORMATS } from '@/lib/formats';
import { depotDirect, plafondDepotVideo, TAILLE_MAX_DOCUMENT, TAILLE_MAX_IMAGE, TAILLE_MAX_VIDEO } from '@/lib/medias';
import { ARTICLES, articlesDe } from '@/lib/sujets';
import { iaDisponible } from '@/lib/ia';
import { echeancesVideo, imagesMemoire, montagePret } from '@/lib/production';
import { reseauxPresents, prefixeHeure, moisValide } from '@/lib/suivi';
import { RESEAUX } from '@/lib/formats';
import type { LignePublication } from '@/lib/requetes';
import type { ReseauSlug } from '@/lib/marques';

// La rédaction d'un article par l'IA prend une à deux minutes : l'action
// serveur appelée depuis cette page doit pouvoir durer jusque-là sur Vercel.
export const maxDuration = 300;

const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

const COURT = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
const court = (d: string) => COURT.format(new Date(`${d}T12:00:00`));
const MOIS_LONG = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });

/** Les couleurs d'état du thème (celles des pastilles), pour la légende. */
const LEGENDE: Array<[string, string]> = [
  ['brouillon', 'var(--ligne-forte)'],
  ['a-relire', 'var(--attention)'],
  ['valide', 'var(--accent-texte)'],
  ['publie', 'var(--bon)'],
  ['abandonne', 'var(--grave)'],
];

function decalerMois(mois: string, n: number): string {
  const [a, m] = mois.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1 + n, 1)).toISOString().slice(0, 7);
}

const icone = (slug: string) =>
  attendu(slug) === 'video' ? '🎬 ' : /carrousel/.test(slug) ? '🗂️ ' : attendu(slug) === 'image' ? '🖼️ ' : '✍️ ';

export default async function Calendrier({
  params,
  searchParams,
}: {
  params: Promise<{ entite: string }>;
  searchParams: Promise<{
    recale?: string;
    apercu?: string;
    reglages?: string;
    refait?: string;
    memorises?: string;
    cree?: string;
    deja?: string;
    importe?: string;
    erreurArticle?: string;
    vue?: string;
    reseau?: string;
    mois?: string;
  }>;
}) {
  const { entite } = await params;
  const { recale, apercu, reglages, refait, memorises, cree, deja, erreurArticle, importe, vue: vueQ, reseau: reseauQ, mois: moisQ } =
    await searchParams;
  const ouvert = apercu ? publication(Number(apercu)) : undefined;
  const e = entite as EntiteSlug;
  const m = marque(e);
  const tout = publications(e);

  // Vue (semaine ou mois) et filtre par réseau — seulement les réseaux qui ont
  // réellement des posts dans la base de cette entité.
  const vue: 'semaine' | 'mois' = vueQ === 'mois' ? 'mois' : 'semaine';
  const reseaux = reseauxPresents(e);
  const filtre = reseaux.includes(reseauQ as ReseauSlug) ? (reseauQ as ReseauSlug) : undefined;
  const affiches = filtre ? tout.filter((p) => format(p.format_slug).reseau === filtre) : tout;
  const moisCourant = new Date().toISOString().slice(0, 7);
  const moisAvecPosts = [...new Set(affiches.map((p) => p.date_prevue.slice(0, 7)))].sort();
  const moisVu =
    moisQ && moisValide(moisQ) === moisQ
      ? moisQ
      : moisAvecPosts.includes(moisCourant)
        ? moisCourant
        : (moisAvecPosts.find((x) => x > moisCourant) ?? moisAvecPosts[moisAvecPosts.length - 1] ?? moisCourant);
  /** L'adresse de la page avec la vue, le filtre et le mois en cours, plus `extra`. */
  const lien = (extra: Record<string, string | number | undefined> = {}) => {
    const q = new URLSearchParams();
    const tous = { vue: vue === 'mois' ? 'mois' : undefined, reseau: filtre, mois: vue === 'mois' ? moisVu : undefined, ...extra };
    for (const [k, v] of Object.entries(tous)) if (v != null && v !== '') q.set(k, String(v));
    const t = q.toString();
    return `/${e}/calendrier${t ? `?${t}` : ''}`;
  };

  const parSemaine = new Map<number, typeof tout>();
  for (const p of affiches) {
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

  // Le générateur d'articles s'appuie sur le calendrier : posts à venir à
  // développer, réserve du plan non encore posée, prochain créneau libre.
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const refsPosees = new Set(tout.map((p) => p.sujet_ref));
  const reserve = articlesDe(e)
    .filter((a) => !refsPosees.has(a.ref))
    .map((a) => ({ ref: a.ref, titre: a.titre, grappe: a.grappe }));
  const grappes = [...new Set(ARTICLES[e].map((a) => a.grappe).filter((g): g is string => !!g))];
  const vusTitres = new Set<string>();
  const postsSources = tout
    .filter((p) => p.format_slug !== 'blog-article' && p.date_prevue >= aujourdhui && p.statut !== 'publie' && p.titre)
    .filter((p) => (vusTitres.has(p.titre!) ? false : (vusTitres.add(p.titre!), true)))
    .map((p) => ({
      id: p.id,
      libelle: `${p.semaine ? `S${p.semaine} · ` : ''}${court(p.date_prevue)} · ${format(p.format_slug).nom.replace(/^.*— /, '')} — ${p.titre}`,
    }));
  const creneau = prochainCreneauBlog(e);
  // « Importer un post fait ailleurs » : les formats de la marque, et le chemin
  // de dépôt disponible (direct au store en production, action en local).
  const direct = depotDirect();
  const plafondLocal = plafondDepotVideo();
  const demain = new Date();
  demain.setDate(demain.getDate() + 1);
  const libelleCreneau = `${court(creneau.date)}${creneau.semaine ? ` (semaine ${creneau.semaine})` : ' (après les 12 semaines)'}`;

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

        {erreurArticle ? (
          <div className="constat" data-n="blocage" style={{ marginBottom: 14 }}>
            <div className="regle">Article non généré</div>
            <div className="msg">{erreurArticle}</div>
          </div>
        ) : null}

        <GenerateurArticle
          entite={e}
          iaOk={iaDisponible()}
          reserve={reserve}
          grappes={grappes}
          posts={postsSources}
          creneau={{ date: creneau.date, libelle: libelleCreneau }}
          ouvert={!!erreurArticle}
        />

        <details className="encart" style={{ marginBottom: 18 }}>
          <summary style={{ cursor: 'pointer' }}>
            <strong>📥 Importer un post fait ailleurs</strong>{' '}
            <span className="aide">— vidéo, images, carrousel ou PDF, avec son texte : il entre au calendrier en brouillon</span>
          </summary>
          <div style={{ marginTop: 12 }}>
            <ImporterPost
              entite={e}
              formats={TOUS_FORMATS.filter((x) => m.reseaux[x.reseau] !== 'exclu' && x.reseau !== 'blog').map((x) => ({ slug: x.slug, nom: x.nom }))}
              piliers={m.piliers.map((x) => ({ slug: x.slug, nom: x.nom }))}
              personas={m.personas.map((x) => ({ slug: x.slug, nom: x.nom }))}
              preuveIndice={m.preuvesAutorisees.slice(0, 2).join(' ; ')}
              dateDefaut={iso(demain)}
              direct={direct}
              plafonds={direct ? { image: TAILLE_MAX_IMAGE, video: TAILLE_MAX_VIDEO, document: TAILLE_MAX_DOCUMENT } : { image: plafondLocal, video: plafondLocal, document: plafondLocal }}
            />
          </div>
        </details>

        {memorises != null && !apercu ? (
          <div className="encart" style={{ marginBottom: 14 }}>
            ✅ Visuels de la semaine rangés dans la médiathèque : {memorises} nouveau(x) — les autres étaient déjà à jour.
          </div>
        ) : null}

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

        <div className="encart" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
          <div className="rang" style={{ gap: 6 }}>
            <Link className="pastille" data-t={vue === 'semaine' ? 'accent' : undefined} href={lien({ vue: undefined, mois: undefined })}>
              Semaine
            </Link>
            <Link className="pastille" data-t={vue === 'mois' ? 'accent' : undefined} href={lien({ vue: 'mois', mois: moisVu })}>
              Mois
            </Link>
          </div>
          <div className="rang" style={{ gap: 6 }}>
            <Link className="pastille" data-t={!filtre ? 'accent' : undefined} href={lien({ reseau: undefined })}>
              Tous les réseaux
            </Link>
            {reseaux.map((r) => (
              <Link key={r} className="pastille" data-t={filtre === r ? 'accent' : undefined} href={lien({ reseau: r })}>
                {RESEAUX[r].nom}
              </Link>
            ))}
          </div>
          <div className="legende-statuts" style={{ marginLeft: 'auto' }}>
            {LEGENDE.map(([st, c]) => (
              <span key={st} style={{ '--c': c } as React.CSSProperties}>{LIBELLE_STATUT[st]}</span>
            ))}
          </div>
        </div>

        {vue === 'mois' ? (
          <VueMois
            mois={moisVu}
            posts={affiches}
            lien={lien}
            ouvertId={ouvert?.id}
            precedent={lien({ mois: decalerMois(moisVu, -1) })}
            suivant={lien({ mois: decalerMois(moisVu, 1) })}
          />
        ) : null}

        {vue === 'semaine' && affiches.length === 0 ? (
          <div className="encart">Aucun post sur ce réseau dans le calendrier.</div>
        ) : null}

        {vue === 'semaine' && [...parSemaine.entries()].map(([s, pubs]) => {
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
              <form action={memoriserSemaine} style={{ display: 'inline-block', margin: '6px 12px 0 0' }}>
                <input type="hidden" name="entite" value={e} />
                <input type="hidden" name="semaine" value={s} />
                <input type="hidden" name="retour" value={`/${e}/calendrier`} />
                <button type="submit" className="fantome" style={{ padding: '3px 10px', fontSize: 12.5 }}>
                  🖼️ Générer les visuels de la semaine {s}
                </button>
              </form>
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
                              data-statut={p.statut}
                              href={lien({ apercu: p.id })}
                              scroll={false}
                              title={p.raison ?? ''}
                              style={ouvert?.id === p.id ? { outline: '2px solid var(--accent-texte)' } : undefined}
                            >
                              <div className="r">
                                {icone(p.format_slug)}
                                {f.nom.replace(/^.*— /, '')}
                              </div>
                              {p.heure_prevue ? <div className="h">{prefixeHeure(p).replace(/ · $/, '')}</div> : null}
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
      {ouvert && ouvert.entite === e ? (
        <ApercuPost
          p={ouvert}
          fermer={lien()}
          notice={
            importe === '1'
              ? '✅ Post importé en brouillon. Vérifie le texte découpé (accroche, appel), la preuve et les fichiers, puis valide.'
              : cree === '1'
              ? '✅ Article généré en brouillon. Relis-le, complète les éventuels « [?] », puis valide.'
              : deja === '1'
                ? 'Cet article du plan est déjà au calendrier : le voici, plutôt qu’un doublon.'
                : refait === String(ouvert.id)
              ? 'Texte refait depuis le sujet. L’ancien est gardé au journal ; le post est repassé en brouillon.'
              : refait === `${ouvert.id}-identique`
                ? 'Le texte est déjà celui du sujet : rien n’a changé, le statut non plus.'
              : memorises != null
                ? 'Rendu rangé dans la médiathèque, à jour du texte et de la photo.'
                : undefined
          }
        />
      ) : null}
    </>
  );
}

/**
 * La vue Mois : le mois du lundi au dimanche, chaque post à son jour, avec
 * son heure prévue s'il en a une et la couleur de son état. Un clic ouvre le
 * même aperçu que la vue Semaine.
 */
function VueMois({
  mois,
  posts,
  lien,
  ouvertId,
  precedent,
  suivant,
}: {
  mois: string;
  posts: LignePublication[];
  lien: (extra?: Record<string, string | number | undefined>) => string;
  ouvertId?: number;
  precedent: string;
  suivant: string;
}) {
  const premier = new Date(`${mois}-01T12:00:00`);
  const debut = lundiDe(premier);
  const fin = new Date(premier);
  fin.setMonth(fin.getMonth() + 1, 0);
  const jours: Date[] = [];
  for (const d = new Date(debut); d <= fin || jours.length % 7 !== 0; d.setDate(d.getDate() + 1)) jours.push(new Date(d));
  const parDate = new Map<string, LignePublication[]>();
  for (const p of posts) {
    if (!parDate.has(p.date_prevue)) parDate.set(p.date_prevue, []);
    parDate.get(p.date_prevue)!.push(p);
  }
  const aujourdhui = iso(new Date());
  const dansLeMois = posts.filter((p) => p.date_prevue.startsWith(mois)).length;
  return (
    <section style={{ marginBottom: 24 }}>
      <div className="ban-semaine">
        <Link className="pastille" href={precedent} scroll={false}>←</Link>
        <h2 style={{ textTransform: 'capitalize' }}>{MOIS_LONG.format(premier)}</h2>
        <Link className="pastille" href={suivant} scroll={false}>→</Link>
        <span className="int" style={{ marginLeft: 'auto' }}>
          {dansLeMois} publication{dansLeMois > 1 ? 's' : ''}
        </span>
      </div>
      <div className="mois-grille">
        {JOURS.map((j) => (
          <div key={j} className="entete-jour">{j.slice(0, 3)}</div>
        ))}
        {jours.map((d) => {
          const cle = iso(d);
          const liste = parDate.get(cle) ?? [];
          const hors = !cle.startsWith(mois);
          return (
            <div key={cle} className={`jour${liste.length ? '' : ' vide'}${hors ? ' hors' : ''}${cle === aujourdhui ? ' auj' : ''}`}>
              <div className="d">
                <span>{d.getDate()}</span>
                {liste.length > 1 ? <span>{liste.length}</span> : null}
              </div>
              {liste.map((p) => (
                <Link
                  key={p.id}
                  className="vignette"
                  data-statut={p.statut}
                  href={lien({ apercu: p.id })}
                  scroll={false}
                  title={`${format(p.format_slug).nom} — ${LIBELLE_STATUT[p.statut]}`}
                  style={ouvertId === p.id ? { outline: '2px solid var(--accent-texte)' } : undefined}
                >
                  <span className="h">{prefixeHeure(p)}</span>
                  {icone(p.format_slug)}
                  {p.titre ?? format(p.format_slug).nom}
                </Link>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}
