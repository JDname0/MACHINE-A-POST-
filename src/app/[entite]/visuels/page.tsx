import { Flanc } from '@/components/Flanc';
import { marque, type EntiteSlug } from '@/lib/marques';
import { compteursMenu } from '@/lib/requetes';
import { TOUS_GABARITS, CONTENUS, theme } from '@/lib/visuels';
import { DECISIONS, REFUS } from '@/lib/axe-visuel';
import { videosDe } from '@/lib/videos';
import { format } from '@/lib/formats';
import { Medias } from '@/components/Medias';
import { Sons } from '@/components/Sons';

export default async function Visuels({
  params,
  searchParams,
}: {
  params: Promise<{ entite: string }>;
  searchParams: Promise<{ variante?: string; posees?: string; refus?: string }>;
}) {
  const { entite } = await params;
  const { variante: v, posees, refus } = await searchParams;
  const variante = v === 'sombre' ? 'sombre' : 'clair';
  const e = entite as EntiteSlug;
  const m = marque(e);
  const t = theme(e, variante);
  const videos = videosDe(e);

  return (
    <>
      <Flanc entite={e} page="visuels" compteurs={compteursMenu(e)} />
      <main className="corps">
        <header className="entete">
          <div className="sur">Axe visuel · {m.nom}</div>
          <h1>Moderne et épuré, sans emprunter la palette</h1>
          <p className="sous">
            L&apos;axe vient d&apos;une référence apportée le 21 octobre : un post de lancement d&apos;agence, très
            sombre, très typographique, sans photo. On en reprend la <strong>mise en page</strong> — sept décisions,
            listées plus bas — et on garde les couleurs et les polices des deux cadrages. Les visuels ci-dessous sont
            générés aux dimensions exactes des réseaux : ce sont de vrais fichiers, pas des maquettes.
          </p>
        </header>

        {e === 'magistria' ? (
          <div className="encart" data-t="grave" style={{ marginBottom: 22 }}>
            <strong>Ce qu&apos;on ne transpose pas.</strong> La référence est saturée — trois couleurs vives en dégradé
            sur fond noir. Appliquée telle quelle à MagistrIA, elle dépenserait d&apos;un coup l&apos;actif que le
            produit construit : un gestionnaire de sinistres n&apos;achète pas une IA juridique qui ressemble à une
            agence créative. Ici « épuré » veut dire <strong>de l&apos;air, des filets fins et un seul accent or</strong>,
            pas un dégradé.
          </div>
        ) : (
          <div className="encart" style={{ marginBottom: 22 }}>
            <strong>Veolt peut y aller.</strong> Le site assume déjà le fond quasi noir et le dégradé magenta → violet →
            orange. L&apos;axe de la référence tombe donc juste, et les halos saturés sont un atout : un studio créatif
            qui publie sobre se vend moins bien que ce qu&apos;il sait faire.
          </div>
        )}

        {e === 'magistria' ? (
          <div className="rang" style={{ marginBottom: 18 }}>
            <span className="aide" style={{ marginTop: 0 }}>Registre :</span>
            <a
              className="pastille"
              data-t={variante === 'clair' ? 'accent' : undefined}
              href={`/${e}/visuels`}
            >
              clair — fidèle au produit
            </a>
            <a
              className="pastille"
              data-t={variante === 'sombre' ? 'accent' : undefined}
              href={`/${e}/visuels?variante=sombre`}
            >
              sombre — plus saillant dans un fil
            </a>
          </div>
        ) : null}

        {/* ── Les visuels ──────────────────────────────────────────────── */}
        <h2>Les gabarits</h2>
        <p className="aide" style={{ marginBottom: 16, maxWidth: '76ch' }}>
          Chaque image est générée à la demande et son texte se change dans l&apos;adresse — c&apos;est un générateur,
          pas cinq images figées. Clic droit « Enregistrer l&apos;image » pour récupérer le PNG.
        </p>

        <div className="pile" style={{ gap: 22 }}>
          {TOUS_GABARITS.map((g) => {
            const c = CONTENUS[e][g.slug];
            const src = `/${e}/visuels/${g.slug}${variante === 'sombre' ? '?variante=sombre' : ''}`;
            const horizontal = g.hauteur <= g.largeur;
            return (
              <div className="carte" key={g.slug}>
                <div className="rang" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
                  <h3>{g.nom}</h3>
                  <div className="rang">
                    <span className="pastille">{g.largeur} × {g.hauteur}</span>
                    <span className="pastille" data-t="accent">{g.ratio}</span>
                  </div>
                </div>
                <p style={{ marginBottom: 14 }}>{g.intention}</p>

                <div
                  className="grille"
                  style={{ gridTemplateColumns: horizontal ? '320px minmax(0,1fr)' : '270px minmax(0,1fr)', gap: 20 }}
                >
                  <a href={src} target="_blank" rel="noreferrer" title="Ouvrir le PNG en taille réelle">
                    <img
                      src={src}
                      alt={`${g.nom} — ${m.nom}`}
                      width={horizontal ? 320 : 270}
                      style={{
                        width: '100%',
                        height: 'auto',
                        borderRadius: 10,
                        border: '1px solid var(--ligne)',
                        display: 'block',
                        background: t.fond,
                      }}
                    />
                  </a>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontSize: 12.5, color: 'var(--encre-dim)' }}>
                      <strong style={{ color: 'var(--encre)' }}>Où ça sert.</strong> {g.usage}
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--encre-dim)' }}>
                      <strong style={{ color: 'var(--encre)' }}>Texte en place.</strong>{' '}
                      {[c.ligne1, c.ligne2, c.chiffre].filter(Boolean).join(' · ').replace(/\n/g, ' ')}
                    </div>
                    <div>
                      <div className="aide" style={{ marginTop: 0, marginBottom: 5 }}>
                        Changer le texte sans toucher au code :
                      </div>
                      <pre className="bloc" style={{ fontSize: 11.5 }}>
{`${src}${variante === 'sombre' ? '&' : '?'}ligne1=…&ligne2=…&sousTitre=…`}
                      </pre>
                    </div>
                    <div className="rang">
                      <a className="bouton fantome" href={src} download={`${e}-${g.slug}.png`}>
                        Télécharger le PNG
                      </a>
                      <a className="bouton fantome" href={src} target="_blank" rel="noreferrer">
                        Ouvrir en taille réelle
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="sep" />

        {/* ── Images apportées ────────────────────────────────────────── */}
        <Medias entite={e} posees={posees} refus={refus} />

        <div className="sep" />

        {/* ── Sons : musiques et voix off ─────────────────────────────── */}
        <Sons entite={e} />

        <div className="sep" />

        {/* ── Vidéos ──────────────────────────────────────────────────── */}
        <h2>Scripts vidéo</h2>
        <p className="aide" style={{ marginBottom: 16, maxWidth: '76ch' }}>
          Même axe, en mouvement. Deux règles tenues dans chaque script : les trois premières secondes portent le
          sujet, lisible sans son et sans logo ; le texte est incrusté partout, parce que la très grande majorité des
          lectures est muette.
          {e === 'magistria'
            ? " Le rythme, lui, diffère : un propos juridique haché se lit comme une publicité et perd ce qu'il vend."
            : ''}
        </p>

        <div className="pile" style={{ gap: 16 }}>
          {videos.map((v) => (
            <div className="carte" key={v.ref}>
              <div className="rang" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
                <h3>{v.titre}</h3>
                <div className="rang">
                  <span className="pastille" data-t="accent">{format(v.formatSlug).nom.replace(/^.*— /, '')}</span>
                  <span className="pastille">{v.duree} s</span>
                </div>
              </div>

              <div className="encart" style={{ marginBottom: 14 }}>
                <strong>Tournage.</strong> {v.tournage}
              </div>

              <div className="tbl-enveloppe" style={{ boxShadow: 'none' }}>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 90 }}>Temps</th>
                      <th>Ce qu&apos;on voit</th>
                      <th>Texte incrusté</th>
                    </tr>
                  </thead>
                  <tbody>
                    {v.plans.map((p, i) => (
                      <tr key={i}>
                        <td className="mono" style={{ whiteSpace: 'nowrap' }}>
                          {p.de}–{p.a} s
                        </td>
                        <td style={{ fontSize: 12.5, color: 'var(--encre-dim)' }}>{p.image}</td>
                        <td style={{ fontWeight: 500 }}>{p.texte}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: 14 }}>
                <div className="aide" style={{ marginTop: 0, marginBottom: 5 }}>Légende à coller :</div>
                <pre className="bloc">{v.legende}</pre>
              </div>
            </div>
          ))}
        </div>

        <div className="sep" />

        {/* ── Les décisions ───────────────────────────────────────────── */}
        <h2>Les sept décisions reprises de la référence</h2>
        <p className="aide" style={{ marginBottom: 14 }}>
          C&apos;est ce qui fait fonctionner le post d&apos;origine. On reprend les sept, traduites dans chaque marque.
        </p>
        <div className="tbl-enveloppe" style={{ marginBottom: 22 }}>
          <table>
            <thead>
              <tr>
                <th>Décision</th>
                <th>Dans la référence</th>
                <th>Chez {m.nom}</th>
              </tr>
            </thead>
            <tbody>
              {DECISIONS.map((d) => (
                <tr key={d.nom}>
                  <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{d.nom}</td>
                  <td style={{ fontSize: 12.5, color: 'var(--encre-dim)' }}>{d.reference}</td>
                  <td>{e === 'veolt' ? d.veolt : d.magistria}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>Ce qu&apos;on refuse</h2>
        <p className="aide" style={{ marginBottom: 14 }}>
          Écrit pour que personne ne le « corrige » plus tard en croyant bien faire.
        </p>
        <div className="grille g2">
          {REFUS.map((r) => (
            <div className="carte" key={r.quoi}>
              <div className="rang" style={{ marginBottom: 8 }}>
                <span className="pastille" data-t="blocage">refusé</span>
              </div>
              <h3>{r.quoi}</h3>
              <p style={{ marginTop: 6 }}>{r.pourquoi}</p>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
