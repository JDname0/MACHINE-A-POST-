import { genererArticle } from '@/app/actions';
import { BoutonEnvoi } from './BoutonEnvoi';

/**
 * « Générer un article », d'un clic, depuis le calendrier — qui guide le choix :
 *  1. développer un post du calendrier (l'article du plan qui le reprend, ou
 *     une version longue rédigée par l'IA, le lendemain du post) ;
 *  2. poser un article de la réserve du plan au prochain créneau libre ;
 *  3. rédiger un article sur une requête libre (IA), au prochain créneau libre.
 * Tout entre en brouillon : « Valider » reste le geste de Jonathan.
 */
export function GenerateurArticle({
  entite,
  iaOk,
  reserve,
  grappes,
  posts,
  creneau,
  ouvert,
}: {
  entite: string;
  iaOk: boolean;
  reserve: Array<{ ref: string; titre: string; grappe?: string }>;
  grappes: string[];
  posts: Array<{ id: number; libelle: string }>;
  creneau: { date: string; libelle: string };
  ouvert?: boolean;
}) {
  const carte = { border: '1px solid var(--ligne)', borderRadius: 10, padding: 12, background: 'var(--fond)' } as const;
  const sansCle = !iaOk ? (
    <div className="aide" style={{ marginTop: 6 }}>
      La rédaction par l’IA demande la clé <code>ANTHROPIC_API_KEY</code> côté serveur (Vercel). Les articles du plan, eux, se
      génèrent sans clé.
    </div>
  ) : null;

  return (
    <details className="encart" open={ouvert} style={{ marginBottom: 18 }}>
      <summary style={{ cursor: 'pointer' }}>
        <strong>✍️ Générer un article</strong>{' '}
        <span className="aide">— prochain créneau libre du calendrier : {creneau.libelle}</span>
      </summary>

      <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
        {/* 1. Depuis un post du calendrier */}
        <form action={genererArticle} style={carte}>
          <input type="hidden" name="entite" value={entite} />
          <strong>Développer un post du calendrier</strong>
          <div className="aide" style={{ margin: '4px 0 8px' }}>
            L’article paraît le lendemain du post, dans la même semaine, et en reprend l’angle. « Article du plan » ouvre
            l’article déjà écrit qui reprend ce sujet ; « Rédiger avec l’IA » écrit une version longue nouvelle.
          </div>
          <div className="champ">
            <label>Post</label>
            <select name="source_post" required defaultValue="">
              <option value="" disabled>
                — choisir un post à venir —
              </option>
              {posts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.libelle}
                </option>
              ))}
            </select>
          </div>
          <div className="champ">
            <label>Consigne (facultatif, IA)</label>
            <input name="consigne" placeholder="Insister sur… / pour un lecteur qui…" />
          </div>
          <div className="rang" style={{ gap: 8, flexWrap: 'wrap' }}>
            <BoutonEnvoi name="mode" value="plan" enCours="Recherche…" className="fantome">
              Article du plan
            </BoutonEnvoi>
            <BoutonEnvoi name="mode" value="ia" enCours="Rédaction en cours (1 à 2 min)…" desactive={!iaOk}>
              Rédiger avec l’IA
            </BoutonEnvoi>
          </div>
          {sansCle}
        </form>

        {/* 2. La réserve du plan de référencement */}
        <form action={genererArticle} style={carte}>
          <input type="hidden" name="entite" value={entite} />
          <input type="hidden" name="mode" value="plan" />
          <strong>Un article déjà écrit du plan de référencement</strong>
          <div className="aide" style={{ margin: '4px 0 8px' }}>
            {reserve.length
              ? `${reserve.length} article(s) en réserve, écrits et relus, pas encore au calendrier. Sans IA, sans crédit.`
              : 'Tous les articles du plan sont déjà au calendrier.'}
          </div>
          {reserve.length ? (
            <>
              <div className="champ">
                <label>Article</label>
                <select name="sujet_ref" required>
                  {reserve.map((a) => (
                    <option key={a.ref} value={a.ref}>
                      {a.grappe ? `${a.grappe} — ` : ''}
                      {a.titre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="champ" style={{ maxWidth: 200 }}>
                <label>Date</label>
                <input type="date" name="date_prevue" defaultValue={creneau.date} required />
              </div>
              <BoutonEnvoi enCours="Création…">Générer l’article</BoutonEnvoi>
            </>
          ) : null}
        </form>

        {/* 3. Requête libre */}
        <form action={genererArticle} style={carte}>
          <input type="hidden" name="entite" value={entite} />
          <input type="hidden" name="mode" value="ia" />
          <strong>Sur une requête libre</strong>
          <div className="aide" style={{ margin: '4px 0 8px' }}>
            L’IA rédige au moule des articles de grappe, avec les règles de la marque, et tient compte des posts de la
            semaine où l’article paraît.
          </div>
          <div className="champ">
            <label>Requête visée</label>
            <input name="requete" placeholder="ce qu’un lecteur taperait dans un moteur de recherche" required />
          </div>
          <div className="rang" style={{ gap: 10, flexWrap: 'wrap' }}>
            <div className="champ" style={{ flex: '1 1 220px' }}>
              <label>Grappe</label>
              <select name="grappe" defaultValue={grappes[0] ?? ''}>
                {grappes.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
                <option value="">— hors grappe —</option>
              </select>
            </div>
            <div className="champ" style={{ width: 180 }}>
              <label>Date</label>
              <input type="date" name="date_prevue" defaultValue={creneau.date} required />
            </div>
          </div>
          <div className="champ">
            <label>Consigne (facultatif)</label>
            <input name="consigne" placeholder="Angle, lecteur, point à traiter en priorité…" />
          </div>
          <BoutonEnvoi enCours="Rédaction en cours (1 à 2 min)…" desactive={!iaOk}>
            Générer avec l’IA
          </BoutonEnvoi>
          {sansCle}
        </form>
      </div>
    </details>
  );
}
