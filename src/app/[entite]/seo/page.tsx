import { Flanc } from '@/components/Flanc';
import { marque, type EntiteSlug } from '@/lib/marques';
import { compteursMenu } from '@/lib/requetes';
import { FORMATS } from '@/lib/formats';
import { db } from '@/lib/db';
import { majArticle, majBacklink } from '@/app/actions';

const STATUTS_ARTICLE = ['a-ecrire', 'en-cours', 'a-relire', 'publie', 'a-mettre-a-jour'] as const;
const LIB_ART: Record<string, string> = {
  'a-ecrire': 'À écrire',
  'en-cours': 'En cours',
  'a-relire': 'À relire',
  publie: 'Publié',
  'a-mettre-a-jour': 'À mettre à jour',
};
const STATUTS_LIEN = ['a-contacter', 'contacte', 'en-discussion', 'obtenu', 'refuse', 'ecarte'] as const;
const LIB_LIEN: Record<string, string> = {
  'a-contacter': 'À contacter',
  contacte: 'Contacté',
  'en-discussion': 'En discussion',
  obtenu: 'Obtenu',
  refuse: 'Refusé',
  ecarte: 'Écarté',
};

export default async function Seo({ params }: { params: Promise<{ entite: string }> }) {
  const { entite } = await params;
  const e = entite as EntiteSlug;
  const m = marque(e);
  const d = db();

  const grappes = d.prepare('SELECT * FROM grappes WHERE entite=? ORDER BY id').all(e) as Array<{
    id: number;
    nom: string;
    page_pilier: string;
  }>;
  const articles = d.prepare('SELECT * FROM articles WHERE entite=? ORDER BY grappe_id, id').all(e) as Array<{
    id: number;
    grappe_id: number | null;
    titre: string;
    requete: string;
    intention: string | null;
    statut: string;
    url: string | null;
    mots: number | null;
    top10: number;
    cite_par_ia: number;
    maj_le: string | null;
  }>;
  const liens = d.prepare('SELECT * FROM backlinks WHERE entite=? ORDER BY priorite, id').all(e) as Array<{
    id: number;
    domaine: string;
    type: string;
    priorite: number;
    contact: string | null;
    statut: string;
    note: string | null;
    url: string | null;
  }>;

  const f = FORMATS['blog-article'];
  const publies = articles.filter((a) => a.statut === 'publie').length;
  const top10 = articles.filter((a) => a.top10).length;
  const cites = articles.filter((a) => a.cite_par_ia).length;

  return (
    <>
      <Flanc entite={e} page="seo" compteurs={compteursMenu(e)} />
      <main className="corps">
        <header className="entete">
          <div className="sur">SEO, articles et liens · {m.nom}</div>
          <h1>Profondeur d&apos;abord, liens ensuite</h1>
          <p className="sous">
            En 2026 l&apos;autorité thématique est passée devant les backlinks comme premier signal B2B : un site qui
            classe 60 % des requêtes de sa catégorie capte ~3,2× plus de trafic organique et ~4,8× plus de citations par
            les IA qu&apos;un site qui en classe 20 %. Les liens n&apos;ont pas disparu — ils amplifient une autorité
            existante, ils ne la créent plus.
          </p>
        </header>

        <div className="grille g4">
          <div className="carte">
            <div className="chiffre">{articles.length}</div>
            <div className="etiq">articles planifiés</div>
          </div>
          <div className="carte">
            <div className="chiffre">{publies}</div>
            <div className="etiq">publiés</div>
          </div>
          <div className="carte">
            <div className="chiffre">
              {top10}
              <span style={{ fontSize: 15, color: 'var(--encre-dim)' }}>/{articles.length}</span>
            </div>
            <div className="etiq">en top 10 sur leur requête</div>
          </div>
          <div className="carte">
            <div className="chiffre">{cites}</div>
            <div className="etiq">cités par une IA (relevé manuel)</div>
          </div>
        </div>

        <div className="encart" style={{ marginTop: 14 }}>
          <strong>Rythme.</strong> {f.cadence}. La mise à jour d&apos;un article existant rapporte souvent plus que la
          création d&apos;un nouveau : les URL citées par les moteurs de réponse sont en moyenne ~26 % plus récentes que
          celles citées par la recherche classique.
        </div>

        <div className="sep" />

        {grappes.map((g) => {
          const dedans = articles.filter((a) => a.grappe_id === g.id);
          return (
            <section key={g.id} style={{ marginBottom: 24 }}>
              <div className="ban-semaine">
                <h2>{g.nom}</h2>
                <span className="ph">{dedans.length} articles</span>
                <span className="int">Page pilier : « {g.page_pilier} »</span>
              </div>
              <div className="tbl-enveloppe">
                <table>
                  <thead>
                    <tr>
                      <th>Article</th>
                      <th>Requête visée</th>
                      <th>Intention</th>
                      <th>État</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dedans.map((a) => (
                      <tr key={a.id}>
                        <td>
                          {a.url ? (
                            <a className="lien-accent" href={a.url} target="_blank" rel="noreferrer">
                              {a.titre}
                            </a>
                          ) : (
                            a.titre
                          )}
                          {a.maj_le ? (
                            <div style={{ fontSize: 11.5, color: 'var(--encre-dim)' }}>mis à jour le {a.maj_le}</div>
                          ) : null}
                        </td>
                        <td className="mono" style={{ fontSize: 12 }}>{a.requete}</td>
                        <td style={{ fontSize: 12.5, color: 'var(--encre-dim)' }}>{a.intention}</td>
                        <td>
                          <form action={majArticle} className="rang" style={{ gap: 6 }}>
                            <input type="hidden" name="id" value={a.id} />
                            <input type="hidden" name="entite" value={e} />
                            <select name="statut" defaultValue={a.statut} style={{ width: 135 }}>
                              {STATUTS_ARTICLE.map((s) => (
                                <option key={s} value={s}>{LIB_ART[s]}</option>
                              ))}
                            </select>
                            <input name="url" defaultValue={a.url ?? ''} placeholder="adresse" style={{ width: 130 }} />
                            <input name="mots" defaultValue={a.mots ?? ''} placeholder="mots" style={{ width: 70 }} />
                            <label style={{ display: 'flex', alignItems: 'center', gap: 4, margin: 0, textTransform: 'none', letterSpacing: 0 }}>
                              <input type="checkbox" name="top10" defaultChecked={!!a.top10} style={{ width: 'auto' }} /> top 10
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 4, margin: 0, textTransform: 'none', letterSpacing: 0 }}>
                              <input type="checkbox" name="cite_par_ia" defaultChecked={!!a.cite_par_ia} style={{ width: 'auto' }} /> cité IA
                            </label>
                            <button type="submit" className="fantome">ok</button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}

        <div className="sep" />

        <h2>Forme d&apos;un article qui se fait citer</h2>
        <pre className="bloc" style={{ marginTop: 10 }}>
          {f.ossature.map((o) => `[${o.nom.toUpperCase()}]\n    ${o.consigne}`).join('\n')}
        </pre>

        <div className="sep" />

        <h2>Backlinking — relevance avant volume</h2>
        <p className="aide" style={{ marginBottom: 12 }}>
          Priorité 1 d&apos;abord. Un lien d&apos;une publication sectorielle respectée vaut des dizaines de liens
          génériques, et les lignes marquées « à éviter » sont là pour qu&apos;on ne les redécouvre pas comme des bonnes
          idées dans six mois.
        </p>
        <div className="tbl-enveloppe">
          <table>
            <thead>
              <tr>
                <th>Prio</th>
                <th>Cible</th>
                <th>Type</th>
                <th>Pourquoi</th>
                <th>Suivi</th>
              </tr>
            </thead>
            <tbody>
              {liens.map((l) => (
                <tr key={l.id} style={{ opacity: l.type === 'à éviter' ? 0.6 : 1 }}>
                  <td>
                    <span className="pastille" data-t={l.priorite === 1 ? 'accent' : l.priorite === 5 ? 'blocage' : undefined}>
                      {l.priorite === 5 ? '⛔' : l.priorite}
                    </span>
                  </td>
                  <td>{l.domaine}</td>
                  <td style={{ fontSize: 12.5, color: 'var(--encre-dim)', whiteSpace: 'nowrap' }}>{l.type}</td>
                  <td style={{ fontSize: 12.5, color: 'var(--encre-dim)' }}>{l.note}</td>
                  <td>
                    {l.type === 'à éviter' ? (
                      <span className="pastille" data-t="blocage">jamais</span>
                    ) : (
                      <form action={majBacklink} className="rang" style={{ gap: 6 }}>
                        <input type="hidden" name="id" value={l.id} />
                        <input type="hidden" name="entite" value={e} />
                        <select name="statut" defaultValue={l.statut} style={{ width: 130 }}>
                          {STATUTS_LIEN.map((s) => (
                            <option key={s} value={s}>{LIB_LIEN[s]}</option>
                          ))}
                        </select>
                        <input name="contact" defaultValue={l.contact ?? ''} placeholder="contact" style={{ width: 120 }} />
                        <input name="url" defaultValue={l.url ?? ''} placeholder="lien obtenu" style={{ width: 120 }} />
                        <button type="submit" className="fantome">ok</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
