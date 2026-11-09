import { Flanc } from '@/components/Flanc';
import { marque, type EntiteSlug } from '@/lib/marques';
import { RESEAUX, FORMATS, type FormatSlug } from '@/lib/formats';
import { compteursMenu } from '@/lib/requetes';

export default async function Formats({ params }: { params: Promise<{ entite: string }> }) {
  const { entite } = await params;
  const e = entite as EntiteSlug;
  const m = marque(e);

  return (
    <>
      <Flanc entite={e} page="formats" compteurs={compteursMenu(e)} />
      <main className="corps">
        <header className="entete">
          <div className="sur">Bibliothèque des formats · relevé du 2026-10-06</div>
          <h1>Ce qui fonctionne en 2026, format par format</h1>
          <p className="sous">
            Ces valeurs ne sont pas des opinions, et elles vont périmer. Elles viennent de relevés datés, listés en §12
            du cadrage — à revérifier dans six mois plutôt qu&apos;à traiter comme des constantes.
          </p>
        </header>

        {(Object.entries(RESEAUX) as Array<[string, { nom: string; formats: FormatSlug[] }]>).map(([slug, r]) => {
          const posture = m.reseaux[slug as keyof typeof m.reseaux];
          return (
            <section key={slug} style={{ marginBottom: 28 }}>
              <div className="ban-semaine">
                <h2>{r.nom}</h2>
                <span className="ph">
                  {posture === 'principal'
                    ? 'principal'
                    : posture === 'secondaire'
                      ? 'secondaire'
                      : posture === 'prudent'
                        ? 'prudent'
                        : 'exclu pour cette entité'}
                </span>
                {posture === 'exclu' ? (
                  <span className="int">
                    Le registre du réseau est incompatible avec la gravité juridique. Le compte peut rester ouvert et
                    dormant.
                  </span>
                ) : null}
              </div>

              <div className="grille g2">
                {r.formats.map((fs) => {
                  const f = FORMATS[fs];
                  return (
                    <div key={fs} className="carte" style={{ opacity: posture === 'exclu' ? 0.5 : 1 }}>
                      <div className="rang" style={{ justifyContent: 'space-between', marginBottom: 7 }}>
                        <h3>{f.nom.replace(/^.*— /, '')}</h3>
                        <span className="pastille" data-t="accent">{f.cadence}</span>
                      </div>
                      <p style={{ marginBottom: 10 }}>{f.raison}</p>

                      <div className="grille g3" style={{ marginBottom: 11 }}>
                        <div>
                          <div className="chiffre" style={{ fontSize: 19 }}>{f.accrocheMax}</div>
                          <div className="etiq">{f.accrocheLibelle}</div>
                        </div>
                        <div>
                          <div className="chiffre" style={{ fontSize: 19 }}>
                            {f.utileMin}–{f.utileMax}
                          </div>
                          <div className="etiq">fourchette utile</div>
                        </div>
                        <div>
                          <div className="chiffre" style={{ fontSize: 19 }}>{f.maxCaracteres}</div>
                          <div className="etiq">plafond dur</div>
                        </div>
                      </div>

                      <div style={{ fontSize: 12.5, color: 'var(--encre-dim)', marginBottom: 10 }}>
                        <strong style={{ color: 'var(--encre)' }}>Visuel.</strong> {f.visuel}
                        <br />
                        <strong style={{ color: 'var(--encre)' }}>On mesure.</strong> {f.indicateurCle}
                      </div>

                      <pre className="bloc">
                        {f.ossature
                          .map((o) => `[${o.nom.toUpperCase()}]${o.limite ? ` ≤ ${o.limite} car.` : ''}\n    ${o.consigne}`)
                          .join('\n')}
                      </pre>

                      <div style={{ marginTop: 10 }}>
                        <strong style={{ fontSize: 12.5 }}>Pièges</strong>
                        <ul style={{ paddingLeft: 17, fontSize: 12.5, color: 'var(--encre-dim)', marginTop: 4 }}>
                          {f.pieges.map((x) => (
                            <li key={x} style={{ marginBottom: 3 }}>{x}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>
    </>
  );
}
