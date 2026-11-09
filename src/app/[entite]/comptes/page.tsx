import { Flanc } from '@/components/Flanc';
import { marque, type EntiteSlug } from '@/lib/marques';
import { compteursMenu, sousForums, joursDepuis } from '@/lib/requetes';
import { BARREAUX, CONNEXIONS, diagnostiquer, type ReseauConnectable } from '@/lib/connecteurs';
import { db } from '@/lib/db';
import { majConnexion, majSousForum } from '@/app/actions';

export default async function Comptes({ params }: { params: Promise<{ entite: string }> }) {
  const { entite } = await params;
  const e = entite as EntiteSlug;
  const m = marque(e);

  const etats = db().prepare('SELECT * FROM connexions WHERE entite=?').all(e) as Array<{
    reseau: string;
    barreau: number;
    note: string | null;
    maj_le: string;
  }>;
  const specs = (Object.values(CONNEXIONS) as (typeof CONNEXIONS)[ReseauConnectable][]).sort(
    (a, b) => a.ordreRecommande - b.ordreRecommande,
  );
  const fs = sousForums();

  return (
    <>
      <Flanc entite={e} page="comptes" compteurs={compteursMenu(e)} />
      <main className="corps">
        <header className="entete">
          <div className="sur">Comptes et connexions · {m.nom}</div>
          <h1>Avoir le compte ne suffit pas pour publier</h1>
          <p className="sous">
            Les quatre comptes existent. Chaque réseau exige en plus une application développeur, des permissions
            accordées, et pour trois d&apos;entre eux une revue humaine de cette application. Tant que le barreau 5
            n&apos;est pas atteint, la voie manuelle assistée reste la bonne — et ce n&apos;est pas un pis-aller.
          </p>
        </header>

        <div className="encart" style={{ marginBottom: 20 }}>
          <strong>Ordre recommandé.</strong> Reddit d&apos;abord — c&apos;est le seul sans revue, et ça valide la
          plomberie de la machine en une heure. Instagram ensuite, l&apos;application Meta Business existant déjà.
          LinkedIn en troisième, la plus sélective. TikTok en dernier : MagistrIA n&apos;y va pas, et Veolt n&apos;y
          publie qu&apos;en secondaire.
        </div>

        <div className="pile">
          {specs.map((spec) => {
            const etat = etats.find((x) => x.reseau === spec.reseau);
            const barreau = etat?.barreau ?? 1;
            const d = diagnostiquer(spec.reseau);
            const exclu = m.reseaux[spec.reseau] === 'exclu';
            return (
              <div key={spec.reseau} className="carte" style={{ opacity: exclu ? 0.55 : 1 }}>
                <div className="rang" style={{ justifyContent: 'space-between', marginBottom: 11 }}>
                  <h3>
                    {spec.ordreRecommande}. {spec.nom}
                  </h3>
                  <div className="rang">
                    {exclu ? <span className="pastille">exclu pour {m.nom}</span> : null}
                    <span className="pastille" data-t={spec.revueRequise ? 'alerte' : 'ok'}>
                      {spec.revueRequise ? 'revue requise' : 'aucune revue'}
                    </span>
                    <span className="pastille" data-t={d.pret ? 'ok' : undefined}>
                      {d.pret ? 'identifiants posés' : 'inerte'}
                    </span>
                  </div>
                </div>

                <div className="echelle" style={{ marginBottom: 12 }}>
                  {BARREAUX.map((b) => (
                    <div key={b.n} className="b" data-atteint={b.n < barreau ? '1' : '0'} data-courant={b.n === barreau ? '1' : '0'}>
                      <div style={{ fontWeight: 700 }}>{b.n}. {b.nom}</div>
                      <div style={{ fontSize: 10.5, marginTop: 2 }}>{b.detail}</div>
                    </div>
                  ))}
                </div>

                <div className="grille g2" style={{ marginBottom: 11 }}>
                  <div style={{ fontSize: 12.5, color: 'var(--encre-dim)' }}>
                    <strong style={{ color: 'var(--encre)' }}>Difficulté réelle.</strong> {spec.difficulte}
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--encre-dim)' }}>
                    <strong style={{ color: 'var(--alerte)' }}>Le piège.</strong> {spec.piege}
                  </div>
                </div>

                <div style={{ fontSize: 12.5, color: 'var(--encre-dim)', marginBottom: 11 }}>
                  <strong style={{ color: 'var(--encre)' }}>Portées.</strong>{' '}
                  <span className="mono">{spec.portees.join(' · ')}</span>
                  <br />
                  <strong style={{ color: 'var(--encre)' }}>Variables.</strong>{' '}
                  {spec.variables.map((v) => (
                    <span key={v} className="pastille" data-t={process.env[v] ? 'ok' : undefined} style={{ marginRight: 5 }}>
                      <span className="mono">{v}</span> {process.env[v] ? '✓ posée' : '— manquante'}
                    </span>
                  ))}
                  <div className="aide">
                    Les valeurs ne sont jamais réaffichées ici, et jamais exposées côté client. La machine montre « posé »
                    ou « manquant », pas la valeur.
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <a className="lien-accent" href={spec.doc} target="_blank" rel="noreferrer">
                      documentation du réseau ↗
                    </a>
                  </div>
                </div>

                <form action={majConnexion} className="rang">
                  <input type="hidden" name="entite" value={e} />
                  <input type="hidden" name="reseau" value={spec.reseau} />
                  <div style={{ width: 150 }}>
                    <select name="barreau" defaultValue={barreau}>
                      {BARREAUX.map((b) => (
                        <option key={b.n} value={b.n}>
                          barreau {b.n} — {b.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <input name="note" defaultValue={etat?.note ?? ''} placeholder="où ça bloque, qui a répondu quoi…" />
                  </div>
                  <button type="submit" className="fantome">Mettre à jour</button>
                </form>
              </div>
            );
          })}
        </div>

        <div className="sep" />

        <h2>Reddit — fiches des sous-forums</h2>
        <p className="aide" style={{ marginBottom: 12 }}>
          Reddit n&apos;est pas traité comme les autres réseaux. La machine tient une fiche par sous-forum et bloque un
          brouillon qui violerait la fréquence déclarée. Un compte Reddit grillé est irrécupérable : ce garde-fou est une
          protection d&apos;actif, pas une question de ton.
        </p>
        <div className="tbl-enveloppe">
          <table>
            <thead>
              <tr>
                <th>Sous-forum</th>
                <th>Règle</th>
                <th>Plafond</th>
                <th>Dernier post</th>
                <th>Écoulé</th>
                <th>Mettre à jour</th>
              </tr>
            </thead>
            <tbody>
              {fs.map((x) => {
                const ecoule = joursDepuis(x.dernier_post);
                const bloque = x.plafond_jours != null && ecoule != null && ecoule < x.plafond_jours;
                return (
                  <tr key={x.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <strong>{x.nom}</strong>
                      {x.promotion_interdite ? (
                        <>
                          <br />
                          <span className="pastille" data-t="blocage">promotion interdite</span>
                        </>
                      ) : null}
                    </td>
                    <td style={{ fontSize: 12.5 }}>
                      {x.regle}
                      {x.note ? <div style={{ color: 'var(--encre-dim)', marginTop: 3 }}>{x.note}</div> : null}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{x.plafond_jours ? `${x.plafond_jours} j` : '—'}</td>
                    <td className="mono" style={{ whiteSpace: 'nowrap' }}>{x.dernier_post ?? '—'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {ecoule == null ? (
                        '—'
                      ) : (
                        <span className="pastille" data-t={bloque ? 'blocage' : 'ok'}>
                          {ecoule} j
                        </span>
                      )}
                    </td>
                    <td>
                      <form action={majSousForum} className="rang" style={{ gap: 6 }}>
                        <input type="hidden" name="id" value={x.id} />
                        <input type="hidden" name="entite" value={e} />
                        <input type="date" name="dernier_post" defaultValue={x.dernier_post ?? ''} style={{ width: 150 }} />
                        <button type="submit" className="fantome">ok</button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
