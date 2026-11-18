import Link from 'next/link';
import { Flanc } from '@/components/Flanc';
import { marque, type EntiteSlug } from '@/lib/marques';
import { format } from '@/lib/formats';
import { compteursMenu, formaterDate, LIBELLE_STATUT } from '@/lib/requetes';
import { journee, DELAI_RELEVE_JOURS } from '@/lib/suivi';
import { constatsDe } from '@/lib/fiche';
import { echeancesVideo } from '@/lib/production';

export const dynamic = 'force-dynamic';

/**
 * « Aujourd'hui » : la liste de gestes du jour, dans l'ordre où on les fait.
 * Poster ce qui est validé et dû, trancher ce qui arrive, relever ce qui est
 * sorti il y a une semaine, répondre aux commentaires.
 *
 * Rien ne se publie d'ici : chaque ligne mène à la fiche du post, où le
 * « oui » reste un geste explicite.
 */
export default async function Aujourdhui({ params }: { params: Promise<{ entite: string }> }) {
  const { entite } = await params;
  const e = entite as EntiteSlug;
  const m = marque(e);
  const j = journee(e);
  const videos = echeancesVideo(e).filter((x) => x.etat === 'aujourdhui' || x.etat === 'en-retard');
  const total = j.aPublier.length + j.aValiderUrgent.length + j.aMesurer.length + j.commentaires.length + videos.length;
  const jourLong = new Date(`${j.aujourdhui}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <>
      <Flanc entite={e} page="aujourdhui" compteurs={compteursMenu(e)} />
      <main className="corps">
        <header className="entete">
          <div className="sur">Aujourd&apos;hui · {m.nom}</div>
          <h1 style={{ textTransform: 'capitalize' }}>{jourLong}</h1>
          <p className="sous">
            Les gestes du jour, dans l&apos;ordre : poster ce qui est dû, trancher ce qui arrive, relever ce qui est
            sorti, répondre aux commentaires.{' '}
            <strong style={{ color: 'var(--encre)' }}>Rien ne part d&apos;ici</strong> — chaque ligne ouvre la fiche
            du post.
          </p>
          <div className="rang" style={{ marginTop: 10 }}>
            <span className="pastille" data-t={total === 0 ? 'ok' : 'accent'}>
              {total === 0 ? 'Rien en attente ✓' : `${total} geste${total > 1 ? 's' : ''} en attente`}
            </span>
            <a className="pastille" href={`/${e}/rappels`} title="Fichier .ics à importer dans ton agenda (téléphone, Google, Outlook)">
              📅 Rappels de publication (.ics)
            </a>
          </div>
        </header>

        {/* ── 1. À poster ─────────────────────────────────────────────── */}
        <h2>1. À poster</h2>
        <p className="aide" style={{ marginBottom: 10 }}>
          Validés, dont la date est aujourd&apos;hui ou passée. « Manuel » : aucune API n&apos;est branchée pour ce
          réseau — copier le texte depuis la fiche, poster, puis « Marquer comme publié ».
        </p>
        {j.aPublier.length === 0 ? (
          <div className="encart" style={{ marginBottom: 20 }}>Rien de validé à poster aujourd&apos;hui.</div>
        ) : (
          <div className="tbl-enveloppe" style={{ marginBottom: 20 }}>
            <table>
              <thead>
                <tr>
                  <th>Prévu</th>
                  <th>Format</th>
                  <th>Titre</th>
                  <th>Voie</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {j.aPublier.map(({ p, manuel, retard }) => (
                  <tr key={p.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {formaterDate(p.date_prevue)}
                      {retard > 0 ? (
                        <span className="pastille" data-t="alerte" style={{ marginLeft: 6 }}>
                          {retard} j de retard
                        </span>
                      ) : null}
                    </td>
                    <td style={{ fontSize: 12.5 }}>{format(p.format_slug).nom}</td>
                    <td>{p.titre}</td>
                    <td>
                      <span className="pastille" data-t={manuel ? 'alerte' : 'ok'}>{manuel ? 'manuel' : 'API prête'}</span>
                    </td>
                    <td>
                      <Link className="lien-accent" href={`/${e}/publications/${p.id}`}>
                        Ouvrir →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── 2. À trancher ───────────────────────────────────────────── */}
        <h2>2. À valider — d&apos;ici 3 jours</h2>
        <p className="aide" style={{ marginBottom: 10 }}>
          Brouillons et posts à relire dont la date tombe dans les trois jours (ou est déjà passée).
        </p>
        {j.aValiderUrgent.length === 0 ? (
          <div className="encart" style={{ marginBottom: 20 }}>Aucun post en attente de décision à court terme.</div>
        ) : (
          <div className="tbl-enveloppe" style={{ marginBottom: 20 }}>
            <table>
              <thead>
                <tr>
                  <th>Prévu</th>
                  <th>Format</th>
                  <th>Titre</th>
                  <th>Statut</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {j.aValiderUrgent.map((p) => {
                  const { validable } = constatsDe(p);
                  return (
                    <tr key={p.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {formaterDate(p.date_prevue)}
                        {p.date_prevue < j.aujourdhui ? (
                          <span className="pastille" data-t="blocage" style={{ marginLeft: 6 }}>
                            date passée
                          </span>
                        ) : null}
                      </td>
                      <td style={{ fontSize: 12.5 }}>{format(p.format_slug).nom}</td>
                      <td>{p.titre}</td>
                      <td>
                        <span className="pastille" data-t={p.statut === 'a-relire' ? 'alerte' : undefined}>
                          {LIBELLE_STATUT[p.statut]}
                        </span>{' '}
                        {!validable ? <span className="pastille" data-t="blocage">bloqué</span> : null}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <Link className="lien-accent" href={p.semaine ? `/${e}/valider?s=${p.semaine}#p${p.id}` : `/${e}/publications/${p.id}`}>
                          Trancher →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── 3. Vidéos ───────────────────────────────────────────────── */}
        {videos.length ? (
          <>
            <h2>3. Vidéos à produire</h2>
            <p className="aide" style={{ marginBottom: 10 }}>Échéance de production atteinte (réglage du studio), sans vidéo rattachée.</p>
            <div className="encart" style={{ marginBottom: 20 }}>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {videos.map((x) => (
                  <li key={x.p.id} style={{ marginBottom: 4 }}>
                    {formaterDate(x.p.date_prevue)} — {x.p.titre}{' '}
                    {x.etat === 'en-retard' ? <span className="pastille" data-t="alerte">en retard</span> : null}{' '}
                    <Link className="lien-accent" href={`/${e}/videos?p=${x.p.id}`}>
                      Studio →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : null}

        {/* ── 4. À relever ────────────────────────────────────────────── */}
        <h2>{videos.length ? '4' : '3'}. Résultats à relever</h2>
        <p className="aide" style={{ marginBottom: 10 }}>
          Publiés depuis au moins {DELAI_RELEVE_JOURS} jours, sans aucun relevé. La machine ne lit pas les
          statistiques des réseaux : ouvre la statistique du post sur le réseau, puis saisis-la dans la fiche.
        </p>
        {j.aMesurer.length === 0 ? (
          <div className="encart" style={{ marginBottom: 20 }}>Aucun relevé en retard.</div>
        ) : (
          <div className="tbl-enveloppe" style={{ marginBottom: 20 }}>
            <table>
              <thead>
                <tr>
                  <th>Publié le</th>
                  <th>Format</th>
                  <th>Titre</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {j.aMesurer.map((p) => (
                  <tr key={p.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {formaterDate(p.publie_le!)} <span className="aide">(il y a {p.jours} j)</span>
                    </td>
                    <td style={{ fontSize: 12.5 }}>{format(p.format_slug).nom}</td>
                    <td>
                      {p.url_publiee ? (
                        <a className="lien-accent" href={p.url_publiee} target="_blank" rel="noreferrer">
                          {p.titre}
                        </a>
                      ) : (
                        p.titre
                      )}
                    </td>
                    <td>
                      <Link className="lien-accent" href={`/${e}/publications/${p.id}`}>
                        Saisir le relevé →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── 5. Commentaires ─────────────────────────────────────────── */}
        <h2>{videos.length ? '5' : '4'}. Commentaires ouverts</h2>
        {j.commentaires.length === 0 ? (
          <div className="encart" style={{ marginBottom: 20 }}>Aucun commentaire de validation en attente.</div>
        ) : (
          <div style={{ marginBottom: 20 }}>
            {j.commentaires.map((c) => (
              <div key={c.id} className="constat" data-n="alerte">
                <div className="regle">
                  {formaterDate(c.date_prevue)} · {c.titre} — {c.auteur ?? 'Sans nom'}
                </div>
                <div className="msg" style={{ whiteSpace: 'pre-wrap' }}>{c.texte}</div>
                <div className="remede">
                  <Link className="lien-accent" href={`/${e}/publications/${c.publication_id}#commentaires`}>
                    Ouvrir le fil →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {j.demain.length ? (
          <>
            <div className="sep" />
            <h2>Demain</h2>
            <ul style={{ margin: '6px 0 0', paddingLeft: 20 }}>
              {j.demain.map((p) => (
                <li key={p.id} style={{ marginBottom: 4 }}>
                  {format(p.format_slug).nom} — {p.titre}{' '}
                  <span className="pastille" data-t={p.statut === 'valide' ? 'ok' : undefined}>{LIBELLE_STATUT[p.statut]}</span>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </main>
    </>
  );
}
