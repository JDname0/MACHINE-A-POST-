import { commenter, resoudreCommentaire } from '@/app/actions';
import type { Commentaire } from '@/lib/suivi';

/**
 * Le fil de validation d'un post : qui a demandé quoi, et si c'est réglé.
 * Un commentaire ne touche jamais au texte du post ; « Résolu » le range sans
 * l'effacer, pour garder la trace de la décision.
 */
export function FilCommentaires({
  entite,
  publicationId,
  commentaires,
  retour,
  compact = false,
}: {
  entite: string;
  publicationId: number;
  commentaires: Commentaire[];
  retour: string;
  compact?: boolean;
}) {
  const ouverts = commentaires.filter((c) => !c.resolu);
  const resolus = commentaires.filter((c) => c.resolu);
  const ligne = (c: Commentaire) => (
    <div key={c.id} className="constat" data-n={c.resolu ? 'conseil' : 'alerte'} style={{ opacity: c.resolu ? 0.7 : 1 }}>
      <div className="regle">
        {c.auteur ?? 'Sans nom'} · <span className="mono">{c.le.slice(0, 16).replace('T', ' ')}</span>
        {c.resolu ? ' · résolu' : ''}
      </div>
      <div className="msg" style={{ whiteSpace: 'pre-wrap' }}>{c.texte}</div>
      <form action={resoudreCommentaire} style={{ marginTop: 6 }}>
        <input type="hidden" name="commentaire_id" value={c.id} />
        <input type="hidden" name="entite" value={entite} />
        <input type="hidden" name="retour" value={retour} />
        <input type="hidden" name="resolu" value={c.resolu ? '0' : '1'} />
        <button type="submit" className="fantome" style={{ fontSize: 12, padding: '3px 9px' }}>
          {c.resolu ? 'Rouvrir' : 'Marquer résolu'}
        </button>
      </form>
    </div>
  );

  return (
    <div>
      {ouverts.map(ligne)}
      {resolus.length ? (
        <details style={{ marginTop: 6 }}>
          <summary className="aide">
            {resolus.length} commentaire{resolus.length > 1 ? 's' : ''} résolu{resolus.length > 1 ? 's' : ''}
          </summary>
          {resolus.map(ligne)}
        </details>
      ) : null}
      <details open={!compact} style={{ marginTop: 8 }}>
        <summary className="aide">Ajouter un commentaire</summary>
        <form action={commenter} style={{ marginTop: 8 }}>
          <input type="hidden" name="id" value={publicationId} />
          <input type="hidden" name="entite" value={entite} />
          <input type="hidden" name="retour" value={retour} />
          <div className="champ">
            <textarea name="texte" rows={3} required placeholder="Ce qu'il faut changer, ou pourquoi c'est bon." />
          </div>
          <div className="rang" style={{ gap: 8 }}>
            <input name="auteur" placeholder="Ton prénom (facultatif)" style={{ maxWidth: 220 }} />
            <button type="submit" className="fantome">Commenter</button>
          </div>
        </form>
      </details>
    </div>
  );
}
