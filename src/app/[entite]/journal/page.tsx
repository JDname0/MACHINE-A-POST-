import Link from 'next/link';
import { Flanc } from '@/components/Flanc';
import { marque, type EntiteSlug } from '@/lib/marques';
import { compteursMenu, heureParis, journalFiltre, PAR_PAGE_JOURNAL } from '@/lib/requetes';

/**
 * Le journal complet : tout ce qui a été fait, par qui, quand — pour
 * superviser. Lecture seule. Filtres par personne (Jonathan, Équipe, la
 * machine), par période (jours de Paris), par type d'action et par mot.
 */

const QUI: Record<string, string> = { direction: 'Jonathan', equipe: 'Équipe', machine: 'La machine' };

export default async function Journal({
  params,
  searchParams,
}: {
  params: Promise<{ entite: string }>;
  searchParams: Promise<{ qui?: string; du?: string; au?: string; action?: string; q?: string; page?: string }>;
}) {
  const { entite } = await params;
  const f = await searchParams;
  const e = entite as EntiteSlug;
  const m = marque(e);
  const j = journalFiltre(e, { ...f, page: Number(f.page) || 1 });

  const filtresActifs = Boolean(f.qui || f.du || f.au || f.action || f.q);
  const lien = (page: number) => {
    const u = new URLSearchParams();
    for (const k of ['qui', 'du', 'au', 'action', 'q'] as const) if (f[k]) u.set(k, f[k]!);
    if (page > 1) u.set('page', String(page));
    const s = u.toString();
    return `/${e}/journal${s ? `?${s}` : ''}`;
  };
  const compte = (qui: string) => j.parAuteur.find((x) => x.qui === qui)?.n ?? 0;

  return (
    <>
      <Flanc entite={e} page="journal" compteurs={compteursMenu(e)} />
      <main className="corps">
        <header className="entete">
          <div className="sur">Journal · {m.nom}</div>
          <h1>Ce qui a été fait, par qui, quand</h1>
          <p className="sous">
            Tout ce que l&apos;outil a enregistré pour {m.nom}, du plus récent au plus ancien. « Jonathan » et « Équipe »
            sont les deux comptes ; « la machine », ce qu&apos;elle fait seule (démarrage, mise en place du calendrier).
            Les actions faites avant le 25/11/2026 n&apos;ont pas d&apos;auteur : les comptes n&apos;existaient pas.
          </p>
        </header>

        <form method="get" className="carte" style={{ marginBottom: 16 }}>
          <div className="rang" style={{ gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="champ" style={{ margin: 0 }}>
              <label htmlFor="qui">Qui</label>
              <select id="qui" name="qui" defaultValue={f.qui ?? ''}>
                <option value="">Tout le monde</option>
                <option value="direction">Jonathan</option>
                <option value="equipe">Équipe</option>
                <option value="machine">La machine</option>
              </select>
            </div>
            <div className="champ" style={{ margin: 0 }}>
              <label htmlFor="du">Du</label>
              <input id="du" name="du" type="date" defaultValue={f.du ?? ''} />
            </div>
            <div className="champ" style={{ margin: 0 }}>
              <label htmlFor="au">Au</label>
              <input id="au" name="au" type="date" defaultValue={f.au ?? ''} />
            </div>
            <div className="champ" style={{ margin: 0, minWidth: 220 }}>
              <label htmlFor="action">Type d&apos;action</label>
              <select id="action" name="action" defaultValue={f.action ?? ''}>
                <option value="">Toutes</option>
                {j.actions.map((a) => (
                  <option key={a.action} value={a.action}>
                    {a.action} ({a.n})
                  </option>
                ))}
              </select>
            </div>
            <div className="champ" style={{ margin: 0, flex: '1 1 180px' }}>
              <label htmlFor="q">Mot dans le détail</label>
              <input id="q" name="q" defaultValue={f.q ?? ''} placeholder="ex. publication 153, LinkedIn…" />
            </div>
            <button type="submit">Filtrer</button>
            {filtresActifs ? (
              <Link className="bouton fantome" href={`/${e}/journal`}>
                Effacer les filtres
              </Link>
            ) : null}
          </div>
        </form>

        <div className="rang" style={{ gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <span className="pastille">{j.total} action{j.total > 1 ? 's' : ''}</span>
          <span className="pastille">Jonathan : {compte('direction')}</span>
          <span className="pastille" data-t="accent">
            Équipe : {compte('equipe')}
          </span>
          <span className="pastille">La machine / avant les comptes : {compte('machine')}</span>
        </div>

        <div className="carte">
          {j.lignes.length === 0 ? (
            <p>Aucune action ne correspond à ces filtres.</p>
          ) : (
            <div className="pile">
              {j.lignes.map((l) => (
                <div key={l.id} style={{ fontSize: 13, borderBottom: '1px solid var(--ligne)', paddingBottom: 7 }}>
                  <span className="mono" style={{ color: 'var(--encre-dim)' }}>
                    {heureParis(l.le)}
                  </span>{' '}
                  <span className="pastille" data-t={l.auteur === 'equipe' ? 'accent' : undefined} style={{ margin: '0 6px' }}>
                    {QUI[l.auteur ?? 'machine']}
                  </span>
                  <strong style={{ color: 'var(--encre)' }}>{l.action}</strong>
                  {l.detail ? (
                    l.detail.length > 180 ? (
                      <details style={{ display: 'inline' }}>
                        <summary style={{ display: 'inline', cursor: 'pointer', color: 'var(--encre-dim)' }}>
                          {' '}
                          · {l.detail.slice(0, 160)}… (tout voir)
                        </summary>
                        <pre className="bloc" style={{ whiteSpace: 'pre-wrap', marginTop: 6 }}>
                          {l.detail}
                        </pre>
                      </details>
                    ) : (
                      <span style={{ color: 'var(--encre-dim)' }}> · {l.detail}</span>
                    )
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        {j.pages > 1 ? (
          <div className="rang" style={{ gap: 10, marginTop: 12, alignItems: 'center' }}>
            {j.page > 1 ? (
              <Link className="bouton fantome" href={lien(j.page - 1)}>
                ← Plus récentes
              </Link>
            ) : null}
            <span className="aide">
              Page {j.page} sur {j.pages} · {PAR_PAGE_JOURNAL} par page
            </span>
            {j.page < j.pages ? (
              <Link className="bouton fantome" href={lien(j.page + 1)}>
                Plus anciennes →
              </Link>
            ) : null}
          </div>
        ) : null}
      </main>
    </>
  );
}
