import Link from 'next/link';
import { Flanc } from '@/components/Flanc';
import { marque, type EntiteSlug } from '@/lib/marques';
import { format, RESEAUX } from '@/lib/formats';
import { publications, compteursMenu, formaterDate, LIBELLE_STATUT, STATUTS } from '@/lib/requetes';
import { controler, compter } from '@/lib/garde-fous';
import { TOUS_FORMATS } from '@/lib/formats';
import { sujetsDe, articlesDe } from '@/lib/sujets';
import { creerPublication } from '@/app/actions';
import { iso } from '@/lib/calendrier';
import type { FormatSlug } from '@/lib/formats';

export default async function Publications({
  params,
  searchParams,
}: {
  params: Promise<{ entite: string }>;
  searchParams: Promise<{ statut?: string; reseau?: string }>;
}) {
  const { entite } = await params;
  const { statut, reseau } = await searchParams;
  const e = entite as EntiteSlug;
  const m = marque(e);
  const liste = publications(e, { statut, reseau });

  const lien = (p: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    if (p.statut) q.set('statut', p.statut);
    if (p.reseau) q.set('reseau', p.reseau);
    const s = q.toString();
    return `/${e}/publications${s ? `?${s}` : ''}`;
  };

  return (
    <>
      <Flanc entite={e} page="publications" compteurs={compteursMenu(e)} />
      <main className="corps">
        <header className="entete">
          <div className="sur">File de publication</div>
          <h1>{liste.length} publications</h1>
          <p className="sous">
            Chaque brouillon passe les garde-fous de {m.nom} avant de pouvoir être validé. La colonne « contrôle » donne
            le nombre de blocages — un blocage n&apos;est pas un avis de style, c&apos;est quelque chose de faux ou de
            risqué.
          </p>
        </header>

        <details className="carte" style={{ marginBottom: 16 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
            Créer une publication hors calendrier
          </summary>
          <p className="aide" style={{ margin: '8px 0 12px' }}>
            Tout ne se planifie pas. Reddit est volontairement hors calendrier — sa cadence dépend du plafond du
            sous-forum, pas de notre rythme — et un arrêt qui tombe ou un rendu qu&apos;on veut montrer ne se programme
            pas douze semaines à l&apos;avance. Choisir un sujet du réservoir pré-remplit le brouillon au bon moule.
          </p>
          <form action={creerPublication} className="rang" style={{ alignItems: 'flex-end' }}>
            <input type="hidden" name="entite" value={e} />
            <div style={{ width: 215 }}>
              <label>Format</label>
              <select name="format_slug" defaultValue="reddit-texte">
                {TOUS_FORMATS.filter((f) => m.reseaux[f.reseau] !== 'exclu').map((f) => (
                  <option key={f.slug} value={f.slug}>
                    {f.nom}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ width: 150 }}>
              <label>Date prévue</label>
              <input type="date" name="date_prevue" defaultValue={iso(new Date())} required />
            </div>
            <div style={{ flex: 1, minWidth: 230 }}>
              <label>Sujet du réservoir</label>
              <select name="sujet_ref" defaultValue="">
                <option value="">— brouillon vide —</option>
                <optgroup label="Sujets courts (réseaux)">
                  {sujetsDe(e).map((s) => (
                    <option key={s.ref} value={s.ref}>
                      {s.titre}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Articles de blog (plan de référencement)">
                  {articlesDe(e).map((s) => (
                    <option key={s.ref} value={s.ref}>
                      {s.titre}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
            <button type="submit">Créer</button>
          </form>
        </details>

        <div className="rang" style={{ marginBottom: 14 }}>
          <Link className="pastille" data-t={!statut && !reseau ? 'accent' : undefined} href={lien({})}>
            tout
          </Link>
          {STATUTS.map((s) => (
            <Link key={s} className="pastille" data-t={statut === s ? 'accent' : undefined} href={lien({ statut: s, reseau })}>
              {LIBELLE_STATUT[s]}
            </Link>
          ))}
          <span style={{ width: 12 }} />
          {Object.entries(RESEAUX).map(([slug, r]) => (
            <Link key={slug} className="pastille" data-t={reseau === slug ? 'accent' : undefined} href={lien({ statut, reseau: slug })}>
              {r.nom}
            </Link>
          ))}
        </div>

        <div className="tbl-enveloppe">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Format</th>
                <th>Sujet</th>
                <th>Pilier</th>
                <th>Contrôle</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {liste.map((p) => {
                const constats = controler({
                  entite: e,
                  formatSlug: p.format_slug as FormatSlug,
                  accroche: p.accroche,
                  corps: p.corps,
                  appel: p.appel,
                  hashtags: p.hashtags,
                  persona: p.persona,
                  pilier: p.pilier,
                  preuve: p.preuve,
                  indicateur: p.indicateur,
                  sousForum: p.sous_forum,
                });
                const c = compter(constats);
                const pilier = m.piliers.find((x) => x.slug === p.pilier);
                return (
                  <tr key={p.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formaterDate(p.date_prevue)}</td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: 12.5 }}>{format(p.format_slug).nom}</td>
                    <td>
                      <Link className="lien-accent" href={`/${e}/publications/${p.id}`}>
                        {p.titre}
                      </Link>
                    </td>
                    <td style={{ fontSize: 12.5, color: 'var(--encre-dim)' }}>{pilier?.nom ?? p.pilier}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {c.blocages > 0 ? (
                        <span className="pastille" data-t="blocage">
                          {c.blocages} blocage{c.blocages > 1 ? 's' : ''}
                        </span>
                      ) : c.alertes > 0 ? (
                        <span className="pastille" data-t="alerte">
                          {c.alertes} alerte{c.alertes > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="pastille" data-t="ok">
                          validable
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="pastille" data-t={p.statut === 'publie' ? 'ok' : p.statut === 'valide' ? 'accent' : undefined}>
                        {LIBELLE_STATUT[p.statut]}
                      </span>
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
