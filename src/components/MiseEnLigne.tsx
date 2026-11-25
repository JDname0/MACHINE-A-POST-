import { mettreArticleEnLigne } from '@/app/actions';
import type { LignePublication } from '@/lib/requetes';
import { controleArticle, destinationSite, fichierArticle } from '@/lib/mise-en-ligne';

/**
 * Le bloc « Mettre en ligne sur le site » d'un article : contrôle qualité,
 * aperçu de la page telle qu'elle sera en ligne, téléchargement, et le bouton
 * — réservé à la direction, sur un article validé. Le texte se modifie dans le
 * formulaire de la fiche ; l'aperçu suit après « Enregistrer ».
 */
export function MiseEnLigne({ p, equipe, etat, detail }: { p: LignePublication; equipe: boolean; etat?: string; detail?: string }) {
  const dest = destinationSite(p.entite);
  const points = controleArticle(p);
  const vert = points.every((x) => x.ok);
  const valide = p.statut === 'valide' || p.statut === 'publie';
  const apercu = `/${p.entite}/publications/${p.id}/article`;
  const site = dest.url.replace(/^https?:\/\//, '');
  return (
    <div className="carte" id="mise-en-ligne" style={{ marginBottom: 12 }}>
      <h3>Mettre en ligne sur {site}</h3>
      {etat ? (
        <div className="encart" style={{ margin: '8px 0', borderColor: etat === 'ok' ? 'var(--ok, #3a8)' : 'var(--attention)' }}>
          {etat === 'ok' ? '✓ En ligne : ' : etat === 'refus' ? 'Refusé : ' : 'Échec : '}
          {detail}
        </div>
      ) : null}
      {p.url_publiee ? (
        <p className="aide">
          Déjà en ligne :{' '}
          <a className="lien-accent" href={p.url_publiee} target="_blank" rel="noreferrer">
            {p.url_publiee}
          </a>
          . Remettre en ligne met la page à jour, à la même adresse.
        </p>
      ) : (
        <p className="aide">
          Adresse prévue : {dest.url}/{fichierArticle(p)}
        </p>
      )}
      <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0' }}>
        {points.map((x) => (
          <li key={x.libelle} style={{ marginBottom: 6 }}>
            <strong style={{ color: x.ok ? undefined : 'var(--attention)' }}>
              {x.ok ? '✓' : '✗'} {x.libelle}
            </strong>
            <span className="aide"> — {x.detail}</span>
          </li>
        ))}
      </ul>
      <details style={{ marginBottom: 10 }}>
        <summary style={{ cursor: 'pointer' }}>Prévisualiser la page telle qu’elle sera en ligne</summary>
        <iframe src={apercu} title="Aperçu de l’article" style={{ width: '100%', height: 720, border: '1px solid var(--ligne, #333)', borderRadius: 10, marginTop: 8, background: '#0C0C0C' }} />
      </details>
      <div className="rang" style={{ gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <a className="fantome" href={apercu} target="_blank" rel="noreferrer">
          Ouvrir l’aperçu dans un onglet
        </a>
        <a className="fantome" href={`${apercu}?telecharger=1`}>
          Télécharger la page (.html)
        </a>
        {dest.pret && !equipe ? (
          <form action={mettreArticleEnLigne}>
            <input type="hidden" name="id" value={p.id} />
            <input type="hidden" name="entite" value={p.entite} />
            <button type="submit" className="bouton" disabled={!vert || !valide}>
              {p.url_publiee ? 'Mettre à jour en ligne' : 'Mettre en ligne'}
            </button>
          </form>
        ) : null}
      </div>
      <p className="aide" style={{ marginTop: 8 }}>
        {equipe
          ? 'La mise en ligne est réservée à Jonathan (direction).'
          : !dest.pret
            ? dest.raison
            : !vert
              ? 'Le contrôle doit être entièrement vert.'
              : !valide
                ? 'Valider l’article d’abord : la mise en ligne ne part que d’un article validé.'
                : 'Écrit la page, ses images et la carte du blog dans le dossier du site. Rien ne part sans ce clic.'}
      </p>
    </div>
  );
}
