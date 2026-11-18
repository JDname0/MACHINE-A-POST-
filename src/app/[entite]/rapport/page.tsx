import Link from 'next/link';
import { Flanc } from '@/components/Flanc';
import { BoutonImprimer } from '@/components/BoutonImprimer';
import { marque, type EntiteSlug } from '@/lib/marques';
import { format } from '@/lib/formats';
import { compteursMenu, formaterDate, LIBELLE_STATUT } from '@/lib/requetes';
import { moisDisponibles, moisValide, rapportMensuel } from '@/lib/suivi';
import { taux, pourcent, nombre, euros } from '@/lib/taux';

export const dynamic = 'force-dynamic';

const ND = 'non disponible';

/** Un nombre relevé, ou « non disponible » s'il n'a pas été relevé — jamais 0 par défaut. */
const n = (v: number | null) => (v == null ? ND : nombre(v));
const pc = (num: number | null, den: number | null, dec = 1) => {
  const t = taux(num, den);
  return t.valeur == null ? ND : pourcent(t, dec);
};

function libelleMois(m: string): string {
  const t = new Date(`${m}-15T12:00:00`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/**
 * Le rapport mensuel : ce qui était prévu, ce qui est sorti, ce que ça a
 * donné. Uniquement des données de la base — les relevés sont saisis à la
 * main, et ce qui n'a pas été relevé est écrit « non disponible ».
 */
export default async function Rapport({
  params,
  searchParams,
}: {
  params: Promise<{ entite: string }>;
  searchParams: Promise<{ mois?: string }>;
}) {
  const { entite } = await params;
  const { mois: m0 } = await searchParams;
  const e = entite as EntiteSlug;
  const m = marque(e);
  const mois = moisValide(m0);
  const r = rapportMensuel(e, mois);
  const choix = [...new Set([new Date().toISOString().slice(0, 7), ...moisDisponibles(e)])].sort().reverse();

  const pub = r.lignes.filter((l) => l.statut === 'publie' && l.publie_le && l.publie_le >= r.debut && l.publie_le <= r.fin);
  const mesures = pub.filter((l) => l.releve_le != null);
  const totImp = mesures.reduce<number | null>((a, l) => (l.impressions == null ? a : (a ?? 0) + l.impressions), null);
  const totInter = mesures.reduce<number | null>((a, l) => (l.interactions == null ? a : (a ?? 0) + l.interactions), null);
  const totClics = mesures.reduce<number | null>((a, l) => (l.clics == null ? a : (a ?? 0) + l.clics), null);
  const meilleurs = mesures
    .filter((l) => l.impressions && l.interactions != null)
    .map((l) => ({ l, eng: l.interactions! / l.impressions! }))
    .sort((a, b) => b.eng - a.eng)
    .slice(0, 5);

  return (
    <>
      <Flanc entite={e} page="rapport" compteurs={compteursMenu(e)} />
      <main className="corps">
        <header className="entete">
          <div className="sur">Rapport mensuel · {m.nom}</div>
          <h1>{libelleMois(mois)}</h1>
          <p className="sous">
            Prévu, sorti, mesuré — du {formaterDate(r.debut)} au {formaterDate(r.fin)} — tout vient de la base : les
            résultats sont ceux <strong style={{ color: 'var(--encre)' }}>saisis à la main</strong> sur chaque fiche
            (dernier relevé par post). Ce qui n&apos;a pas été relevé est écrit « {ND} », jamais zéro.
          </p>
          <div className="rang sans-impression" style={{ marginTop: 10 }}>
            <form className="rang" style={{ gap: 8 }}>
              <select name="mois" defaultValue={mois} aria-label="Mois" style={{ width: "auto" }}>
                {choix.map((x) => (
                  <option key={x} value={x}>
                    {libelleMois(x)}
                  </option>
                ))}
              </select>
              <button type="submit" className="fantome">Afficher</button>
            </form>
            <BoutonImprimer />
            <a className="bouton fantome" href={`/${e}/rapport/csv?mois=${mois}`}>
              Exporter en CSV
            </a>
          </div>
        </header>

        {/* ── Production ─────────────────────────────────────────────── */}
        <h2>Production</h2>
        <div className="grille g4" style={{ marginTop: 10, marginBottom: 12 }}>
          <div className="carte">
            <div className="chiffre">{nombre(r.prevues)}</div>
            <div className="etiq">posts prévus dans le mois</div>
          </div>
          <div className="carte">
            <div className="chiffre">{nombre(r.publiees)}</div>
            <div className="etiq">
              publiés dans le mois{r.publieesHorsPlan ? ` (dont ${r.publieesHorsPlan} prévus un autre mois)` : ''}
            </div>
          </div>
          <div className="carte">
            <div className="chiffre">{nombre(r.enAttente)}</div>
            <div className="etiq">prévus, pas encore publiés</div>
          </div>
          <div className="carte">
            <div className="chiffre">{nombre(r.abandonnees)}</div>
            <div className="etiq">abandonnés</div>
          </div>
        </div>
        <p className="aide" style={{ marginBottom: 20 }}>
          Circuit de validation ce mois-ci : {nombre(r.validations)} validation{r.validations > 1 ? 's' : ''},{' '}
          {nombre(r.renvois)} renvoi{r.renvois > 1 ? 's' : ''} en relecture, {nombre(r.commentaires)} commentaire
          {r.commentaires > 1 ? 's' : ''} (lu au journal de la machine).
        </p>

        {/* ── Par réseau ─────────────────────────────────────────────── */}
        <h2>Par réseau</h2>
        <div className="tbl-enveloppe" style={{ marginTop: 10, marginBottom: 8 }}>
          <table>
            <thead>
              <tr>
                <th>Réseau</th>
                <th className="nb">Prévus</th>
                <th className="nb">Publiés</th>
                <th className="nb">Mesurés</th>
                <th className="nb">Impressions</th>
                <th className="nb">Interactions</th>
                <th className="nb">Clics</th>
                <th className="nb">Engagement</th>
                <th className="nb">Taux de clic</th>
              </tr>
            </thead>
            <tbody>
              {r.parReseau
                .filter((x) => x.prevues || x.publiees)
                .map((x) => (
                  <tr key={x.reseau}>
                    <td>{x.nom}</td>
                    <td className="nb">{x.prevues}</td>
                    <td className="nb">{x.publiees}</td>
                    <td className="nb">
                      {x.mesurees}/{x.publiees}
                    </td>
                    <td className="nb">{n(x.impressions)}</td>
                    <td className="nb">{n(x.interactions)}</td>
                    <td className="nb">{n(x.clics)}</td>
                    <td className="nb">{pc(x.interactions, x.impressions)}</td>
                    <td className="nb">{pc(x.clics, x.impressions, 2)}</td>
                  </tr>
                ))}
              <tr>
                <td>
                  <strong>Total</strong>
                </td>
                <td className="nb">{r.prevues}</td>
                <td className="nb">{r.publiees}</td>
                <td className="nb">
                  {mesures.length}/{pub.length}
                </td>
                <td className="nb">{n(totImp)}</td>
                <td className="nb">{n(totInter)}</td>
                <td className="nb">{n(totClics)}</td>
                <td className="nb">{pc(totInter, totImp)}</td>
                <td className="nb">{pc(totClics, totImp, 2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="aide" style={{ marginBottom: 20 }}>
          Les sommes et les taux ne portent que sur les posts mesurés. Abonnés, portée organique du compte et
          visites du site : {ND} — la machine ne les relève pas.
          {pub.length > mesures.length ? ` ${pub.length - mesures.length} post(s) publié(s) sans relevé : à saisir depuis « Aujourd’hui ».` : ''}
        </p>

        {/* ── Meilleurs posts ────────────────────────────────────────── */}
        <h2>Posts les plus engageants</h2>
        {meilleurs.length === 0 ? (
          <div className="encart" style={{ marginTop: 10, marginBottom: 20 }}>
            {ND} — aucun post publié ce mois-ci n&apos;a de relevé avec impressions et interactions.
          </div>
        ) : (
          <div className="tbl-enveloppe" style={{ marginTop: 10, marginBottom: 20 }}>
            <table>
              <thead>
                <tr>
                  <th>Publié</th>
                  <th>Format</th>
                  <th>Titre</th>
                  <th className="nb">Impressions</th>
                  <th className="nb">Engagement</th>
                </tr>
              </thead>
              <tbody>
                {meilleurs.map(({ l, eng }) => (
                  <tr key={l.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formaterDate(l.publie_le!)}</td>
                    <td style={{ fontSize: 12.5 }}>{format(l.format_slug).nom}</td>
                    <td>
                      <Link className="lien-accent" href={`/${e}/publications/${l.id}`}>
                        {l.titre}
                      </Link>
                    </td>
                    <td className="nb">{nombre(l.impressions)}</td>
                    <td className="nb">{pourcent(eng, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Piliers ────────────────────────────────────────────────── */}
        <div className="grille" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', marginBottom: 20 }}>
          <div className="carte">
            <h3>Publiés par pilier</h3>
            {r.parPilier.length === 0 ? (
              <p>Aucune publication ce mois-ci.</p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5 }}>
                {r.parPilier.map((x) => (
                  <li key={x.pilier}>
                    {x.pilier} — {x.publiees}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="carte">
            <h3>Campagnes payantes</h3>
            {r.campagnes.releves === 0 ? (
              <p>{ND} — aucun relevé de campagne saisi ce mois-ci.</p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5 }}>
                <li>Dépense : {r.campagnes.depense == null ? ND : euros(r.campagnes.depense, 2)}</li>
                <li>Impressions : {n(r.campagnes.impressions)}</li>
                <li>Clics : {n(r.campagnes.clics)}</li>
                <li>Conversations : {n(r.campagnes.conversations)}</li>
                <li className="aide">{r.campagnes.releves} relevé(s) saisi(s)</li>
              </ul>
            )}
          </div>
          <div className="carte">
            <h3>Référencement — état à date</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5 }}>
              <li>
                Requêtes de grappe en top 10 : {r.seo.top10}/{r.seo.articles}
              </li>
              <li>Articles cités par une IA : {r.seo.citesIa}</li>
              <li>Liens obtenus : {r.seo.liensObtenus}</li>
            </ul>
            <p className="aide">État courant de la page SEO. L&apos;évolution mois par mois, tirée des relevés datés, est juste en dessous.</p>
          </div>
        </div>

        {/* ── Évolution SEO ──────────────────────────────────────────── */}
        <h2>Référencement — évolution mois par mois</h2>
        <p className="aide" style={{ margin: '4px 0 10px' }}>
          D&apos;après les relevés datés saisis sur la page SEO : pour chaque article ou lien, son dernier relevé du
          mois. Un mois sans relevé est « {ND} » — la machine ne reporte pas un mois sur l&apos;autre.
        </p>
        <div className="tbl-enveloppe" style={{ marginBottom: 22 }}>
          <table>
            <thead>
              <tr>
                <th>Mois</th>
                <th className="nb">Articles relevés</th>
                <th className="nb">En top 10</th>
                <th className="nb">Position moyenne</th>
                <th className="nb">Cités par une IA</th>
                <th className="nb">Liens relevés</th>
                <th className="nb">Liens obtenus</th>
              </tr>
            </thead>
            <tbody>
              {r.evolutionSeo.map((x, i) => {
                const avant = i > 0 ? r.evolutionSeo[i - 1] : null;
                const ecart = (v: number | null, w: number | null | undefined, inverse = false) => {
                  if (v == null || w == null || v === w) return null;
                  const mieux = inverse ? v < w : v > w;
                  const d = Math.round((v - w) * 10) / 10;
                  return (
                    <span className="aide" style={{ color: mieux ? 'var(--bon)' : 'var(--attention)' }}>
                      {' '}({d > 0 ? '+' : ''}{String(d).replace('.', ',')})
                    </span>
                  );
                };
                return (
                  <tr key={x.mois} style={x.mois === r.mois ? { fontWeight: 650 } : undefined}>
                    <td style={{ whiteSpace: 'nowrap' }}>{libelleMois(x.mois)}</td>
                    <td className="nb">{x.articlesReleves || ND}</td>
                    <td className="nb">
                      {x.top10 == null ? ND : `${x.top10}/${x.articlesReleves}`}
                      {ecart(x.top10, avant?.top10)}
                    </td>
                    <td className="nb">
                      {x.positionMoyenne == null ? ND : String(x.positionMoyenne).replace('.', ',')}
                      {ecart(x.positionMoyenne, avant?.positionMoyenne, true)}
                      {x.positionMoyenne != null ? <span className="aide"> · {x.positionsNotees} noté(s)</span> : null}
                    </td>
                    <td className="nb">
                      {n(x.citesIa)}
                      {ecart(x.citesIa, avant?.citesIa)}
                    </td>
                    <td className="nb">{x.liensReleves || ND}</td>
                    <td className="nb">
                      {n(x.liensObtenus)}
                      {ecart(x.liensObtenus, avant?.liensObtenus)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Détail ─────────────────────────────────────────────────── */}
        <h2>Détail des posts</h2>
        {r.lignes.length === 0 ? (
          <div className="encart" style={{ marginTop: 10 }}>Aucun post prévu ni publié ce mois-ci.</div>
        ) : (
          <div className="tbl-enveloppe" style={{ marginTop: 10 }}>
            <table>
              <thead>
                <tr>
                  <th>Prévu</th>
                  <th>Format</th>
                  <th>Titre</th>
                  <th>Statut</th>
                  <th className="nb">Imp.</th>
                  <th className="nb">Inter.</th>
                  <th className="nb">Clics</th>
                </tr>
              </thead>
              <tbody>
                {r.lignes.map((l) => (
                  <tr key={l.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formaterDate(l.date_prevue)}</td>
                    <td style={{ fontSize: 12.5 }}>{format(l.format_slug).nom}</td>
                    <td>{l.titre}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {LIBELLE_STATUT[l.statut] ?? l.statut}
                      {l.publie_le ? <span className="aide"> · {formaterDate(l.publie_le)}</span> : null}
                    </td>
                    <td className="nb">{l.statut === 'publie' ? n(l.impressions) : '—'}</td>
                    <td className="nb">{l.statut === 'publie' ? n(l.interactions) : '—'}</td>
                    <td className="nb">{l.statut === 'publie' ? n(l.clics) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
