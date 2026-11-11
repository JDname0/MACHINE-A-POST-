import { db } from '@/lib/db';
import { marque, type EntiteSlug } from '@/lib/marques';
import { duree } from '@/lib/medias';

/**
 * Les sons de la marque, rangés pour qu'on les retrouve : la musique (signature
 * sonore, partagée par toutes les vidéos de la marque) et les voix off, plan
 * par plan, sous le post qu'elles accompagnent. Chacun s'écoute ici.
 *
 * Ce ne sont pas des visuels : la médiathèque d'images ne les montre pas.
 */
export function Sons({ entite }: { entite: EntiteSlug }) {
  const lignes = db()
    .prepare(
      `SELECT m.id, m.nom, m.origine, m.duree_s, m.legende, m.publication_id, p.titre
         FROM medias m LEFT JOIN publications p ON p.id = m.publication_id
        WHERE m.entite = ? AND m.type_mime LIKE 'audio/%'
        ORDER BY m.origine, m.publication_id, m.nom`,
    )
    .all(entite) as Array<{ id: number; nom: string; origine: string; duree_s: number | null; legende: string | null; publication_id: number | null; titre: string | null }>;
  const musiques = lignes.filter((l) => l.origine === 'musique');
  const voix = lignes.filter((l) => l.origine === 'voix');
  const parPost = new Map<number, typeof voix>();
  for (const v of voix) {
    if (!v.publication_id) continue;
    parPost.set(v.publication_id, [...(parPost.get(v.publication_id) ?? []), v]);
  }
  const lecteur = (id: number) => (
    <audio src={`/${entite}/medias/${id}`} controls preload="none" style={{ width: '100%', height: 34, marginTop: 6 }} />
  );

  return (
    <section id="sons">
      <h2>Sons · musiques et voix off</h2>
      <p className="aide" style={{ marginBottom: 14, maxWidth: '76ch' }}>
        {musiques.length} musique{musiques.length > 1 ? 's' : ''} et {voix.length} voix off pour {marque(entite).nom}. La musique sans post est
        la signature sonore de la marque : toutes ses vidéos la prennent par défaut. Les voix se calent au début de leur plan, et le
        studio les mixe sous l&apos;image. Nouveaux fichiers : <code>node scripts/importer-media.mjs</code>.
      </p>
      {musiques.length ? (
        <div className="grille g3" style={{ marginBottom: 16 }}>
          {musiques.map((m) => (
            <div className="carte" key={m.id}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>🎵 {m.nom}</div>
              <div className="aide">
                {m.publication_id ? `Rattachée à ${m.titre ?? `publication ${m.publication_id}`}` : 'Signature sonore de la marque'}
                {m.duree_s ? ` · ${duree(m.duree_s)}` : ''}
              </div>
              {lecteur(m.id)}
            </div>
          ))}
        </div>
      ) : null}
      {parPost.size ? (
        <div className="pile">
          {[...parPost.entries()].map(([post, vs]) => (
            <details className="carte" key={post}>
              <summary style={{ cursor: 'pointer' }}>
                🎙 <a className="lien-accent" href={`/${entite}/videos?p=${post}`}>{vs[0].titre ?? `publication ${post}`}</a> · {vs.length} voix
              </summary>
              <div className="grille g3" style={{ marginTop: 10 }}>
                {vs.map((v) => (
                  <div key={v.id}>
                    <div className="aide">{v.legende ?? v.nom}{v.duree_s ? ` · ${duree(v.duree_s)}` : ''}</div>
                    {lecteur(v.id)}
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      ) : null}
    </section>
  );
}
