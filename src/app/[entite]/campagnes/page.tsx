import { Flanc } from '@/components/Flanc';
import { marque, type EntiteSlug } from '@/lib/marques';
import { compteursMenu } from '@/lib/requetes';
import { db } from '@/lib/db';
import { majCampagne, releverCampagne } from '@/app/actions';
import { taux, pourcent, euros, nombre } from '@/lib/taux';

const STATUTS = ['projet', 'bloquee', 'prete', 'active', 'arretee'] as const;
const LIB: Record<string, string> = {
  projet: 'Projet',
  bloquee: 'Bloquée',
  prete: 'Prête',
  active: 'Active',
  arretee: 'Arrêtée',
};

export default async function Campagnes({ params }: { params: Promise<{ entite: string }> }) {
  const { entite } = await params;
  const e = entite as EntiteSlug;
  const m = marque(e);
  const d = db();

  const campagnes = d.prepare('SELECT * FROM campagnes WHERE entite=? ORDER BY id').all(e) as Array<{
    id: number;
    nom: string;
    canal: string;
    objectif: string | null;
    audience: string | null;
    budget: number | null;
    debut: string | null;
    fin: string | null;
    statut: string;
    note: string | null;
  }>;

  return (
    <>
      <Flanc entite={e} page="campagnes" compteurs={compteursMenu(e)} />
      <main className="corps">
        <header className="entete">
          <div className="sur">Campagnes payantes · {m.nom}</div>
          <h1>Pas avant la semaine 5</h1>
          <p className="sous">
            Payer pour amplifier un message qui n&apos;a pas encore tenu en organique, c&apos;est payer pour apprendre ce
            que l&apos;organique apprend gratuitement. Le canal est aussi un arbitrage :{' '}
            {e === 'magistria'
              ? 'LinkedIn Ads pour MagistrIA — le ciblage par fonction est le seul moyen d’atteindre un gestionnaire de sinistres.'
              : 'Meta pour Veolt — visuel, coût d’impression bas, et retargeting de l’analyse gratuite.'}
          </p>
        </header>

        {e === 'veolt' ? (
          <div className="encart" data-t="grave" style={{ marginBottom: 20 }}>
            <strong>Préalable bloquant.</strong> Le paquet de consentement n&apos;est pas posé sur{' '}
            <span className="mono">veoltproduction.fr</span> (relevé côté prospection, décision du 18/09). Le pixel Meta
            ne peut pas être installé avant, et Matomo — exempté de consentement — passe d&apos;abord. Un pixel posé sans
            bandeau conforme, sur un site qui vend du conseil, est un risque disproportionné.
          </div>
        ) : null}

        <div className="pile">
          {campagnes.map((c) => {
            const releves = d
              .prepare('SELECT * FROM campagne_releves WHERE campagne_id=? ORDER BY id DESC')
              .all(c.id) as Array<{ depense: number | null; impressions: number | null; clics: number | null; conversations: number | null; releve_le: string }>;
            const cumul = releves.reduce(
              (a, r) => ({
                depense: a.depense + (r.depense ?? 0),
                impressions: a.impressions + (r.impressions ?? 0),
                clics: a.clics + (r.clics ?? 0),
                conversations: a.conversations + (r.conversations ?? 0),
              }),
              { depense: 0, impressions: 0, clics: 0, conversations: 0 },
            );
            const ctr = taux(cumul.clics, cumul.impressions);
            const coutParClic = cumul.clics > 0 ? cumul.depense / cumul.clics : null;
            const coutParConversation = cumul.conversations > 0 ? cumul.depense / cumul.conversations : null;
            return (
              <div className="carte" key={c.id}>
                <div className="rang" style={{ justifyContent: 'space-between', marginBottom: 9 }}>
                  <h3>{c.nom}</h3>
                  <div className="rang">
                    <span className="pastille" data-t="accent">{c.canal}</span>
                    <span className="pastille" data-t={c.statut === 'active' ? 'ok' : c.statut === 'bloquee' ? 'blocage' : undefined}>
                      {LIB[c.statut]}
                    </span>
                  </div>
                </div>

                <div className="grille g2" style={{ marginBottom: 11 }}>
                  <div style={{ fontSize: 12.5, color: 'var(--encre-dim)' }}>
                    <strong style={{ color: 'var(--encre)' }}>Objectif.</strong> {c.objectif}
                    <br />
                    <strong style={{ color: 'var(--encre)' }}>Audience.</strong> {c.audience}
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--encre-dim)' }}>
                    <strong style={{ color: 'var(--alerte)' }}>Note.</strong> {c.note}
                  </div>
                </div>

                <div className="grille g4" style={{ marginBottom: 11 }}>
                  <div>
                    <div className="chiffre" style={{ fontSize: 21 }}>{euros(cumul.depense || null)}</div>
                    <div className="etiq">dépensé</div>
                  </div>
                  <div>
                    <div className="chiffre" style={{ fontSize: 21 }}>{pourcent(ctr, 2)}</div>
                    <div className="etiq">taux de clic — clics ÷ impressions</div>
                  </div>
                  <div>
                    <div className="chiffre" style={{ fontSize: 21 }}>{euros(coutParClic, 2)}</div>
                    <div className="etiq">coût par clic</div>
                  </div>
                  <div>
                    <div className="chiffre" style={{ fontSize: 21, color: 'var(--accent)' }}>
                      {euros(coutParConversation)}
                    </div>
                    <div className="etiq">coût par conversation engagée</div>
                  </div>
                </div>

                <div className="aide" style={{ marginBottom: 11 }}>
                  On suit le coût par <strong>conversation engagée</strong> plutôt que le coût par clic : c&apos;est la
                  conversation qui se transforme en dossier, pas le clic.
                </div>

                <div className="grille g2">
                  <form action={majCampagne} className="rang" style={{ gap: 6, alignItems: 'flex-end' }}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="entite" value={e} />
                    <div style={{ width: 120 }}>
                      <label>Statut</label>
                      <select name="statut" defaultValue={c.statut}>
                        {STATUTS.map((s) => (
                          <option key={s} value={s}>{LIB[s]}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ width: 95 }}>
                      <label>Budget</label>
                      <input name="budget" defaultValue={c.budget ?? ''} />
                    </div>
                    <div style={{ width: 135 }}>
                      <label>Début</label>
                      <input type="date" name="debut" defaultValue={c.debut ?? ''} />
                    </div>
                    <div style={{ width: 135 }}>
                      <label>Fin</label>
                      <input type="date" name="fin" defaultValue={c.fin ?? ''} />
                    </div>
                    <button type="submit" className="fantome">Mettre à jour</button>
                  </form>

                  <form action={releverCampagne} className="rang" style={{ gap: 6, alignItems: 'flex-end' }}>
                    <input type="hidden" name="campagne_id" value={c.id} />
                    <input type="hidden" name="entite" value={e} />
                    <div style={{ width: 85 }}>
                      <label>Dépense</label>
                      <input name="depense" inputMode="decimal" />
                    </div>
                    <div style={{ width: 95 }}>
                      <label>Impressions</label>
                      <input name="impressions" inputMode="numeric" />
                    </div>
                    <div style={{ width: 70 }}>
                      <label>Clics</label>
                      <input name="clics" inputMode="numeric" />
                    </div>
                    <div style={{ width: 85 }}>
                      <label>Convers.</label>
                      <input name="conversations" inputMode="numeric" />
                    </div>
                    <button type="submit" className="fantome">Relever</button>
                  </form>
                </div>

                {releves.length > 0 ? (
                  <div className="tbl-enveloppe" style={{ marginTop: 12, background: 'transparent', border: 'none' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Le</th>
                          <th className="nb">Dépense</th>
                          <th className="nb">Impressions</th>
                          <th className="nb">Clics</th>
                          <th className="nb">Conversations</th>
                        </tr>
                      </thead>
                      <tbody>
                        {releves.map((r, i) => (
                          <tr key={i}>
                            <td className="mono">{r.releve_le.slice(0, 10)}</td>
                            <td className="nb">{euros(r.depense)}</td>
                            <td className="nb">{nombre(r.impressions)}</td>
                            <td className="nb">{nombre(r.clics)}</td>
                            <td className="nb">{nombre(r.conversations)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
