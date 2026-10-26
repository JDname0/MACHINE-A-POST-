import { Flanc } from '@/components/Flanc';
import { marque, type EntiteSlug } from '@/lib/marques';
import { compteursMenu, formaterDate } from '@/lib/requetes';
import { format, RESEAUX } from '@/lib/formats';
import { db } from '@/lib/db';
import { taux, pourcent, nombre, etatTaux } from '@/lib/taux';

export default async function Indicateurs({ params }: { params: Promise<{ entite: string }> }) {
  const { entite } = await params;
  const e = entite as EntiteSlug;
  const m = marque(e);
  const d = db();

  const releves = d
    .prepare(
      `SELECT p.id, p.titre, p.format_slug, p.pilier, p.date_prevue, p.publie_le,
              mt.impressions, mt.interactions, mt.clics, mt.duree_s, mt.releve_le
       FROM metriques mt JOIN publications p ON p.id = mt.publication_id
       WHERE p.entite = ? ORDER BY mt.id DESC`,
    )
    .all(e) as Array<{
    id: number;
    titre: string;
    format_slug: string;
    pilier: string;
    date_prevue: string;
    publie_le: string | null;
    impressions: number | null;
    interactions: number | null;
    clics: number | null;
    duree_s: number | null;
    releve_le: string;
  }>;

  const parReseau = Object.keys(RESEAUX).map((r) => {
    const dedans = releves.filter((x) => format(x.format_slug).reseau === r);
    const n = dedans.length;
    const moy = (k: 'impressions' | 'interactions' | 'clics' | 'duree_s') => {
      const vals = dedans.map((x) => x[k]).filter((v): v is number => v != null);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    };
    return { reseau: r, nom: RESEAUX[r as keyof typeof RESEAUX].nom, n, imp: moy('impressions'), inter: moy('interactions'), clics: moy('clics'), duree: moy('duree_s') };
  });

  const articles = d.prepare('SELECT COUNT(*) AS t, SUM(top10) AS top, SUM(cite_par_ia) AS ia FROM articles WHERE entite=?').get(e) as {
    t: number; top: number | null; ia: number | null;
  };
  const liensObtenus = d.prepare("SELECT COUNT(*) AS n FROM backlinks WHERE entite=? AND statut='obtenu'").get(e) as { n: number };

  return (
    <>
      <Flanc entite={e} page="indicateurs" compteurs={compteursMenu(e)} />
      <main className="corps">
        <header className="entete">
          <div className="sur">Indicateurs · {m.nom}</div>
          <h1>Mesurer ce qui décide</h1>
          <p className="sous">
            Un indicateur qu&apos;on ne peut pas relever n&apos;est pas un indicateur. Tout ce qui est ici est{' '}
            <strong style={{ color: 'var(--encre)' }}>saisi à la main</strong> après lecture des statistiques du réseau —
            la machine ne relève rien automatiquement, et le prétendre serait faux.
          </p>
        </header>

        <div className="encart" style={{ marginBottom: 20 }}>
          <strong>Ce qu&apos;on ne mesure pas : le nombre d&apos;abonnés.</strong> Il ne prédit rien ici. Ce qui prédit,
          c&apos;est le temps de lecture sur LinkedIn, le visionnage complet en vidéo, et la part des requêtes de grappe
          en top 10.
        </div>

        <h2>Moyennes par réseau</h2>
        <p className="aide" style={{ marginBottom: 11 }}>
          {releves.length === 0
            ? "Aucun relevé pour l'instant. Les colonnes se rempliront depuis la fiche de chaque publication."
            : `${releves.length} relevé(s) saisis.`}
        </p>
        <div className="tbl-enveloppe" style={{ marginBottom: 22 }}>
          <table>
            <thead>
              <tr>
                <th>Réseau</th>
                <th className="nb">Relevés</th>
                <th className="nb">Impressions moy.</th>
                <th className="nb">Interactions moy.</th>
                <th className="nb">Taux d&apos;engagement</th>
                <th className="nb">Taux de clic</th>
                <th>Durée moy.</th>
              </tr>
            </thead>
            <tbody>
              {parReseau.map((r) => {
                const eng = taux(r.inter, r.imp);
                const cl = taux(r.clics, r.imp);
                const etatLecture = etatTaux('lecture', r.duree);
                return (
                  <tr key={r.reseau}>
                    <td>{r.nom}</td>
                    <td className="nb">{r.n}</td>
                    <td className="nb">{r.imp != null ? nombre(Math.round(r.imp)) : '—'}</td>
                    <td className="nb">{r.inter != null ? r.inter.toFixed(1).replace('.', ',') : '—'}</td>
                    <td className="nb">{pourcent(eng, 1)}</td>
                    <td className="nb">{pourcent(cl, 2)}</td>
                    <td>
                      {r.duree != null && etatLecture ? (
                        <span className="pastille" data-t={etatLecture === 'bon' ? 'ok' : etatLecture === 'attention' ? 'alerte' : 'blocage'}>
                          {r.duree.toFixed(0)} s
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="grille g3">
          <div className="carte">
            <div className="chiffre">
              {articles.top ?? 0}
              <span style={{ fontSize: 15, color: 'var(--encre-dim)' }}>/{articles.t}</span>
            </div>
            <div className="etiq">requêtes de grappe en top 10</div>
            <p style={{ marginTop: 7, fontSize: 12.5 }}>
              C&apos;est l&apos;indicateur d&apos;autorité thématique. 60 % de la catégorie = ~3,2× le trafic d&apos;un
              site à 20 %.
            </p>
          </div>
          <div className="carte">
            <div className="chiffre">{articles.ia ?? 0}</div>
            <div className="etiq">articles cités par une IA</div>
            <p style={{ marginTop: 7, fontSize: 12.5 }}>
              Nouvelle surface, invisible dans les outils classiques. Relevé à la main sur dix requêtes types.
            </p>
          </div>
          <div className="carte">
            <div className="chiffre">{liensObtenus.n}</div>
            <div className="etiq">liens obtenus</div>
            <p style={{ marginTop: 7, fontSize: 12.5 }}>
              Les liens amplifient une autorité existante. Ce chiffre ne vaut rien sans la colonne de gauche.
            </p>
          </div>
        </div>

        {releves.length > 0 ? (
          <>
            <div className="sep" />
            <h2>Tous les relevés</h2>
            <div className="tbl-enveloppe" style={{ marginTop: 11 }}>
              <table>
                <thead>
                  <tr>
                    <th>Publication</th>
                    <th>Format</th>
                    <th>Prévue</th>
                    <th>Imp.</th>
                    <th>Inter.</th>
                    <th>Clics</th>
                    <th>Durée</th>
                    <th>Relevé</th>
                  </tr>
                </thead>
                <tbody>
                  {releves.map((r, i) => (
                    <tr key={i}>
                      <td>{r.titre}</td>
                      <td style={{ fontSize: 12.5 }}>{format(r.format_slug).nom}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{formaterDate(r.date_prevue)}</td>
                      <td>{r.impressions ?? '—'}</td>
                      <td>{r.interactions ?? '—'}</td>
                      <td>{r.clics ?? '—'}</td>
                      <td>{r.duree_s != null ? `${r.duree_s} s` : '—'}</td>
                      <td className="mono">{r.releve_le.slice(0, 10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </main>
    </>
  );
}
