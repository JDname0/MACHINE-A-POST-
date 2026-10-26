import Link from 'next/link';
import { Flanc } from '@/components/Flanc';
import { marque, type EntiteSlug } from '@/lib/marques';
import { format } from '@/lib/formats';
import { statsEntite, compteursMenu, formaterDate, LIBELLE_STATUT, resultats } from '@/lib/requetes';
import { taux, pourcent, nombre, etatTaux } from '@/lib/taux';
import { diagnostiquerTout, CONNEXIONS } from '@/lib/connecteurs';
import { SEQUENCE_LANCEMENT } from '@/lib/calendrier';

/** Ordre fixe, jamais cyclé : une série garde sa couleur quel que soit son rang. */
const SERIE = ['var(--serie-1)', 'var(--serie-2)', 'var(--serie-3)', 'var(--serie-4)', 'var(--serie-5)'];

export default async function TableauDeBord({ params }: { params: Promise<{ entite: string }> }) {
  const { entite } = await params;
  const e = entite as EntiteSlug;
  const m = marque(e);
  const s = statsEntite(e);
  const res = resultats(e);
  const diags = diagnostiquerTout();
  const pretsApi = diags.filter((d) => d.pret).length;

  const parStatut = (k: string) => s.parStatut.find((x) => x.statut === k)?.n ?? 0;
  const publiees = parStatut('publie');
  const aTraiter = parStatut('brouillon') + parStatut('a-relire');
  const avancement = taux(publiees, s.total);
  const maxPlanifiees = Math.max(...res.map((r) => r.planifiees), 1);

  // Cumuls tous réseaux — base des deux taux de communication.
  const cum = res.reduce(
    (a, r) => ({
      imp: a.imp + (r.impressions ?? 0),
      inter: a.inter + (r.interactions ?? 0),
      clics: a.clics + (r.clics ?? 0),
      releves: a.releves + r.releves,
    }),
    { imp: 0, inter: 0, clics: 0, releves: 0 },
  );
  const engagement = taux(cum.inter, cum.imp);
  const clic = taux(cum.clics, cum.imp);
  const partTop10 = taux(s.articles.top10, s.articles.total);

  return (
    <>
      <Flanc entite={e} page="accueil" compteurs={compteursMenu(e)} />
      <main className="corps">
        <header className="entete">
          <div className="sur">{m.nomLong}</div>
          <h1>{m.promesseEditoriale}</h1>
          <p className="sous">
            <strong style={{ color: 'var(--encre)' }}>{m.principe}</strong> Tout post doit pouvoir se rattacher à cette
            phrase. Si on n&apos;y arrive pas, le post n&apos;a pas de raison d&apos;exister.
          </p>
        </header>

        {/* ── Figure maîtresse — une seule par écran ───────────────────── */}
        <div className="carte" style={{ marginBottom: 12 }}>
          <div className="heros">
            <div className="valeur">
              {avancement.valeur != null ? (
                <>
                  {Math.round(avancement.valeur * 100)}
                  <span className="pct"> %</span>
                </>
              ) : (
                '—'
              )}
            </div>
            <div className="legende">
              <strong>du plan de 12 semaines est publié</strong> — {nombre(publiees)} publications sur {nombre(s.total)}.
              {s.enRetard.n > 0 ? ` ${s.enRetard.n} créneau${s.enRetard.n > 1 ? 'x' : ''} déjà passé${s.enRetard.n > 1 ? 's' : ''} sans être traité.` : ''}
            </div>
          </div>
          <div className="jauge" data-etat={etatTaux('avancement', avancement.valeur) ?? undefined}>
            <span style={{ width: `${Math.max((avancement.valeur ?? 0) * 100, 1)}%` }} />
          </div>
        </div>

        {/* ── Les quatre compteurs de la file ──────────────────────────── */}
        <div className="grille g4">
          <div className="carte">
            <div className="chiffre">{nombre(aTraiter)}</div>
            <div className="etiq">à écrire ou relire</div>
          </div>
          <div className="carte">
            <div className="chiffre">{nombre(parStatut('valide'))}</div>
            <div className="etiq">validés, prêts à partir</div>
          </div>
          <div className="carte">
            <div className="chiffre">{nombre(publiees)}</div>
            <div className="etiq">publiés</div>
          </div>
          <div className="carte">
            <div className="chiffre" style={{ color: s.enRetard.n > 0 ? 'var(--attention)' : undefined }}>
              {nombre(s.enRetard.n)}
            </div>
            <div className="etiq">créneaux passés non traités</div>
          </div>
        </div>

        <div className="sep" />

        {/* ── Résultats ────────────────────────────────────────────────── */}
        <h2>Résultats de la communication</h2>
        <p className="aide" style={{ marginBottom: 14, maxWidth: '76ch' }}>
          Ces taux sont calculés sur les relevés que tu saisis depuis chaque publication. Un tiret signifie{' '}
          <strong>non mesuré</strong>, jamais zéro : afficher 0 % sans relevé inventerait un résultat.
          {cum.releves === 0 ? ' Aucun relevé pour l’instant.' : ` ${cum.releves} relevé${cum.releves > 1 ? 's' : ''} saisi${cum.releves > 1 ? 's' : ''}.`}
        </p>

        <div className="grille g3" style={{ marginBottom: 12 }}>
          <div className="carte">
            <div className="chiffre">{pourcent(engagement, 1)}</div>
            <div className="etiq">taux d&apos;engagement — interactions ÷ impressions</div>
            <div className="jauge" data-etat={etatTaux('engagement', engagement.valeur) ?? undefined}>
              <span style={{ width: `${Math.min((engagement.valeur ?? 0) * 100 * 12, 100)}%` }} />
            </div>
            <div className="aide">Repère B2B 2026 : 2 à 5 %. Le format document monte à ~6,6 %.</div>
          </div>
          <div className="carte">
            <div className="chiffre">{pourcent(clic, 2)}</div>
            <div className="etiq">taux de clic sortant — clics ÷ impressions</div>
            <div className="jauge" data-etat={etatTaux('clic', clic.valeur) ?? undefined}>
              <span style={{ width: `${Math.min((clic.valeur ?? 0) * 100 * 40, 100)}%` }} />
            </div>
            <div className="aide">Le seul lien mesurable entre un post et le site.</div>
          </div>
          <div className="carte">
            <div className="chiffre">
              {pourcent(partTop10)}
              <span className="sur-total"> · {nombre(s.articles.top10 ?? 0)}/{nombre(s.articles.total)}</span>
            </div>
            <div className="etiq">requêtes de grappe en top 10 — autorité thématique</div>
            <div className="jauge">
              <span style={{ width: `${Math.max((partTop10.valeur ?? 0) * 100, 1)}%` }} />
            </div>
            <div className="aide">60 % de la catégorie = ~3,2× le trafic d&apos;un site à 20 %.</div>
          </div>
        </div>

        <div className="grille g2">
          <div className="carte">
            <h3>Répartition du plan par réseau</h3>
            <p style={{ marginBottom: 12 }}>
              Ce que les 12 semaines engagent, réseau par réseau. C&apos;est une conséquence de la cadence, pas un
              choix date par date.
            </p>
            <div className="barres">
              {res.map((r, i) => (
                <div key={r.reseau} className="barre-ligne">
                  <span className="nom">{r.nom}</span>
                  <span className="barre-piste">
                    <span style={{ width: `${(r.planifiees / maxPlanifiees) * 100}%`, background: SERIE[i % SERIE.length] }} />
                  </span>
                  <span className="val">{r.planifiees}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="carte">
            <h3>Taux par réseau</h3>
            <p style={{ marginBottom: 12 }}>Alimenté par les relevés. Vide tant que rien n&apos;est publié ni relevé.</p>
            <div className="tbl-enveloppe" style={{ border: 'none', boxShadow: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Réseau</th>
                    <th className="nb">Publiés</th>
                    <th className="nb">Engagement</th>
                    <th className="nb">Clic</th>
                  </tr>
                </thead>
                <tbody>
                  {res.map((r) => {
                    const eng = taux(r.interactions, r.impressions);
                    const cl = taux(r.clics, r.impressions);
                    return (
                      <tr key={r.reseau}>
                        <td>{r.nom}</td>
                        <td className="nb">
                          {r.publiees}
                          <span style={{ color: 'var(--encre-dim)' }}>/{r.planifiees}</span>
                        </td>
                        <td className="nb">{pourcent(eng, 1)}</td>
                        <td className="nb">{pourcent(cl, 2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="aide">
              <Link className="lien-accent" href={`/${e}/indicateurs`}>
                Le détail des relevés
              </Link>
            </div>
          </div>
        </div>

        <div className="sep" />

        {/* ── La semaine ───────────────────────────────────────────────── */}
        <h2>Cette semaine</h2>
        <p className="aide" style={{ marginBottom: 12 }}>
          Les créneaux ne sont pas des dates choisies : ils découlent des piliers, des formats et de la cadence. La
          colonne « pourquoi » dit ce qu&apos;on casse en déplaçant.
        </p>
        {s.semaineCourante.length === 0 ? (
          <div className="encart">
            Aucun créneau cette semaine.{' '}
            <Link className="lien-accent" href={`/${e}/calendrier`}>
              Voir le calendrier
            </Link>
            .
          </div>
        ) : (
          <div className="tbl-enveloppe">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Format</th>
                  <th>Sujet</th>
                  <th>Pourquoi ce créneau</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {s.semaineCourante.map((p) => (
                  <tr key={p.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formaterDate(p.date_prevue)}</td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: 12.5 }}>{format(p.format_slug).nom}</td>
                    <td>
                      <Link className="lien-accent" href={`/${e}/publications/${p.id}`}>
                        {p.titre}
                      </Link>
                    </td>
                    <td style={{ color: 'var(--encre-dim)', fontSize: 12.5 }}>{p.raison}</td>
                    <td>
                      <span className="pastille" data-t={p.statut === 'publie' ? 'ok' : p.statut === 'valide' ? 'accent' : undefined}>
                        {LIBELLE_STATUT[p.statut]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="sep" />

        <div className="grille g2">
          <div className="carte">
            <h3>La séquence de lancement</h3>
            <p style={{ marginBottom: 12 }}>
              Un lancement n&apos;est pas une semaine type répétée quatre fois. Les quatre premières semaines ont leur
              propre intention, et le calendrier force le pilier en conséquence.
            </p>
            <div className="pile">
              {SEQUENCE_LANCEMENT.map((p) => (
                <div key={p.semaine} style={{ fontSize: 13 }}>
                  <span className="pastille" data-t="accent">
                    S{p.semaine} · {p.nom}
                  </span>
                  <div style={{ color: 'var(--encre-dim)', fontSize: 12.5, marginTop: 4 }}>{p.intention}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="carte">
            <h3>Ce qu&apos;on ne peut pas dire</h3>
            <p style={{ marginBottom: 12 }}>
              {m.preuvesInterdites.length} règles bloquantes propres à {m.nom}. Elles s&apos;appliquent à chaque
              brouillon, et elles disent pourquoi — un garde-fou qu&apos;on ne comprend pas se contourne.
            </p>
            <div className="rang">
              {m.preuvesInterdites.map((p) => (
                <span key={p.libelle} className="pastille" data-t="blocage">
                  {p.libelle}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="sep" />

        <div className="grille g2">
          <div className="carte">
            <h3>Connexions aux comptes</h3>
            <p style={{ marginBottom: 12 }}>
              {pretsApi === 0
                ? "Aucune API branchée. Les quatre comptes existent, mais publier par API demande en plus une application développeur — et une revue pour trois des quatre réseaux. En attendant, la voie manuelle assistée est opérationnelle."
                : `${pretsApi} connecteur(s) sur 4 ont leurs identifiants posés.`}
            </p>
            <div className="pile">
              {diags.map((d) => (
                <div key={d.reseau} className="rang" style={{ justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13 }}>{CONNEXIONS[d.reseau].nom}</span>
                  <span className="pastille" data-t={d.pret ? 'ok' : undefined}>
                    {d.pret ? 'identifiants posés' : `${d.manquantes.length} variable(s) manquante(s)`}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14 }}>
              <Link className="bouton fantome" href={`/${e}/comptes`}>
                Voir l&apos;échelle à gravir
              </Link>
            </div>
          </div>

          <div className="carte">
            <h3>Journal</h3>
            <p style={{ marginBottom: 12 }}>Tout ce que la machine a fait. Elle ne fait rien qui ne soit pas là.</p>
            <div className="pile">
              {s.journal.map((j, i) => (
                <div key={i} style={{ fontSize: 12.5, color: 'var(--encre-dim)' }}>
                  <span className="mono">{j.le.slice(0, 16)}</span> — {j.action}
                  {j.detail ? ` · ${j.detail}` : ''}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
