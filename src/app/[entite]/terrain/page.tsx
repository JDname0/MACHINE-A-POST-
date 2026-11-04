import { Flanc } from '@/components/Flanc';
import { marque, type EntiteSlug } from '@/lib/marques';
import { compteursMenu } from '@/lib/requetes';
import { nombre } from '@/lib/taux';
import { terrain, retombees } from '@/lib/suite-veolt';

export const dynamic = 'force-dynamic';

export default async function Terrain({ params }: { params: Promise<{ entite: string }> }) {
  const { entite } = await params;
  const e = entite as EntiteSlug;
  const m = marque(e);

  const [matiere, retours] = await Promise.all([terrain(e, 90), retombees(e, 90)]);

  return (
    <>
      <Flanc entite={e} page="terrain" compteurs={compteursMenu(e)} />
      <main className="corps">
        <header className="entete">
          <div className="sur">Terrain · {m.nom}</div>
          <h1>Ce que le marché a fait</h1>
          <p className="sous">
            Lu dans la machine à prospection, pas écrit ici. Des comptages, des signaux relevés sur des sites réels,
            les pages réellement lues.{' '}
            <strong style={{ color: 'var(--encre)' }}>Aucun nom, aucune adresse, aucun téléphone</strong> ne traverse ce
            pont : ce qui sert à écrire, ce sont les faits, pas les personnes.
          </p>
        </header>

        {matiere.etat === 'inerte' ? (
          <div className="encart" style={{ marginBottom: 20 }}>
            <strong>Le pont n&apos;est pas posé pour {m.nom}.</strong> Il reste inerte jusqu&apos;à ce que ces variables
            existent — et il ne devine rien en attendant :
            <ul style={{ margin: '10px 0 0', paddingLeft: 20 }}>
              {matiere.manques.map((x) => (
                <li key={x.variable} style={{ marginBottom: 4 }}>
                  <code>{x.variable}</code> — {x.remede}
                </li>
              ))}
            </ul>
          </div>
        ) : matiere.etat === 'panne' ? (
          <div className="encart" style={{ marginBottom: 20 }}>
            <strong>Rien n&apos;a pu être lu.</strong> {matiere.pourquoi}
            <br />
            <span className="aide">
              Les pages de cette machine continuent de fonctionner : une panne du pont ne doit jamais bloquer
              l&apos;écriture.
            </span>
          </div>
        ) : (
          <>
            {matiere.donnees.silences.length > 0 ? (
              <div className="encart" style={{ marginBottom: 20 }}>
                <strong>Ce qu&apos;un post ne doit pas affirmer.</strong> Mesuré vide — et vide pour une raison, pas par
                hasard :
                <ul style={{ margin: '10px 0 0', paddingLeft: 20 }}>
                  {matiere.donnees.silences.map((s) => (
                    <li key={s.quoi} style={{ marginBottom: 4 }}>
                      <strong style={{ color: 'var(--encre)' }}>{s.quoi}</strong> — {s.pourquoi}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <h2>Le portefeuille, par offre</h2>
            <p className="aide" style={{ marginBottom: 11 }}>
              {matiere.donnees.reparti_par_offre
                ? `Relevé le ${matiere.donnees.releve_le.slice(0, 10)}, sur ${matiere.donnees.fenetre_jours} jours.`
                : `Les organisations ne portent pas encore d'offre côté prospection : seul le total général est connu — ${nombre(
                    matiere.donnees.portefeuille_total.organisations,
                  )} organisations, ${nombre(matiere.donnees.portefeuille_total.contacts)} contacts. Un même total répété sur chaque offre ne serait pas une répartition.`}
            </p>
            <div className="tableau">
              <table>
                <thead>
                  <tr>
                    <th>Offre</th>
                    <th className="nb">Organisations</th>
                    <th className="nb">Contacts</th>
                    <th className="nb">Demandes</th>
                    <th>Signaux les plus relevés</th>
                  </tr>
                </thead>
                <tbody>
                  {matiere.donnees.offres.map((o) => (
                    <tr key={o.slug}>
                      <td>{o.libelle}</td>
                      <td className="nb">{o.organisations != null ? nombre(o.organisations) : '—'}</td>
                      <td className="nb">{o.contacts != null ? nombre(o.contacts) : '—'}</td>
                      <td className="nb">{o.demandes}</td>
                      <td className="aide">
                        {o.signaux.length === 0
                          ? '—'
                          : o.signaux
                              .slice(0, 4)
                              .map((s) => `${s.type} (${s.n})`)
                              .join(' · ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="sep" />

            <h2>Les signaux qui reviennent</h2>
            <p className="aide" style={{ marginBottom: 11 }}>
              Chacun a été relevé sur une page réelle. C&apos;est la matière la plus franche qu&apos;on ait pour un
              sujet : elle ne vient pas d&apos;une intuition sur le marché, elle vient du marché.
            </p>
            {matiere.donnees.signaux_frequents.length === 0 ? (
              <div className="encart">Aucun signal relevé pour l&apos;instant.</div>
            ) : (
              <div className="tableau">
                <table>
                  <thead>
                    <tr>
                      <th>Signal</th>
                      <th className="nb">Organisations concernées</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matiere.donnees.signaux_frequents.map((s) => (
                      <tr key={s.type}>
                        <td>{s.type}</td>
                        <td className="nb">{s.n}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="sep" />

            <h2>Les pages réellement lues</h2>
            <p className="aide" style={{ marginBottom: 11 }}>
              Mesurées par notre propre traceur sur {m.nom === 'Veolt' ? 'veolt.fr' : 'le site'} — sans cookie, sans
              adresse IP, sans tiers.
            </p>
            {matiere.donnees.pages_lues.length === 0 ? (
              <div className="encart">
                Aucune page mesurée. Le traceur n&apos;est pas encore posé sur le site : tant qu&apos;il ne l&apos;est
                pas, aucun post ne peut se prévaloir d&apos;une audience.
              </div>
            ) : (
              <div className="tableau">
                <table>
                  <thead>
                    <tr>
                      <th>Page</th>
                      <th className="nb">Vues</th>
                      <th className="nb">Temps moyen</th>
                      <th className="nb">Lue jusqu&apos;à</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matiere.donnees.pages_lues.map((p) => (
                      <tr key={p.url}>
                        <td>{p.url}</td>
                        <td className="nb">{p.vues}</td>
                        <td className="nb">{p.temps_moyen_s ? `${p.temps_moyen_s} s` : '—'}</td>
                        <td className="nb">{p.profondeur_pct ? `${p.profondeur_pct} %` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        <div className="sep" />

        <h2>Ce que les posts ont produit</h2>
        <p className="aide" style={{ marginBottom: 11 }}>
          Un post n&apos;est crédité que si le lien publié portait sa référence (<code>?v=…</code>). Publier le lien nu,
          c&apos;est accepter de ne jamais savoir — et des zéros ici veulent dire « le lien n&apos;a pas été suivi », pas
          « l&apos;outil n&apos;a pas compté ».
        </p>
        {retours.etat !== 'ok' ? (
          <div className="encart">
            {retours.etat === 'inerte'
              ? 'Pont non configuré — voir plus haut.'
              : retours.pourquoi}
          </div>
        ) : retours.donnees.posts.length === 0 ? (
          <div className="encart">
            Aucun post déclaré à la machine à prospection. La déclaration se fait au moment de publier, depuis la fiche
            de la publication.
          </div>
        ) : (
          <>
            {retours.donnees.note ? (
              <div className="encart" style={{ marginBottom: 12 }}>
                {retours.donnees.note}
              </div>
            ) : null}
            <div className="tableau">
              <table>
                <thead>
                  <tr>
                    <th>Post</th>
                    <th>Réseau</th>
                    <th>Publié</th>
                    <th className="nb">Visites</th>
                    <th className="nb">Clics</th>
                    <th className="nb">Demandes</th>
                  </tr>
                </thead>
                <tbody>
                  {retours.donnees.posts.map((p) => (
                    <tr key={p.ref}>
                      <td>{p.titre || p.ref}</td>
                      <td>{p.reseau || '—'}</td>
                      <td className="aide">{(p.publie_le || '').slice(0, 10)}</td>
                      <td className="nb">{p.visites}</td>
                      <td className="nb">{p.clics}</td>
                      <td className="nb">
                        {p.demandes > 0 ? (
                          <span className="pastille" data-t="ok">
                            {p.demandes}
                          </span>
                        ) : (
                          0
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </>
  );
}
