import Link from 'next/link';
import { Flanc } from '@/components/Flanc';
import { marque, type EntiteSlug } from '@/lib/marques';
import { format } from '@/lib/formats';
import { publications, compteursMenu, LIBELLE_STATUT } from '@/lib/requetes';
import { SEQUENCE_LANCEMENT } from '@/lib/calendrier';

const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

export default async function Calendrier({ params }: { params: Promise<{ entite: string }> }) {
  const { entite } = await params;
  const e = entite as EntiteSlug;
  const m = marque(e);
  const tout = publications(e);

  const parSemaine = new Map<number, typeof tout>();
  for (const p of tout) {
    const s = p.semaine ?? 0;
    if (!parSemaine.has(s)) parSemaine.set(s, []);
    parSemaine.get(s)!.push(p);
  }

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
            {m.piliers.length} piliers ; le reste se déduit. Les quatre premières semaines suivent la séquence de
            lancement, qui force le pilier.
          </p>
        </header>

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
                {phase ? <span className="ph">{phase.nom}</span> : null}
                {phase ? <span className="int">{phase.intention}</span> : <span className="int">Semaine type.</span>}
                <span className="int" style={{ marginLeft: 'auto' }}>
                  {pubs.length} publication{pubs.length > 1 ? 's' : ''}
                </span>
              </div>
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
                        return (
                          <Link key={p.id} className="vignette" href={`/${e}/publications/${p.id}`} title={p.raison ?? ''}>
                            <div className="r">{f.nom.replace(/^.*— /, '')}</div>
                            <div>{p.titre}</div>
                            <div className="st">{LIBELLE_STATUT[p.statut]}</div>
                          </Link>
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
    </>
  );
}
