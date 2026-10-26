/**
 * Génération du calendrier éditorial.
 *
 * Un calendrier n'est pas une liste de dates, c'est une **conséquence** :
 * piliers × réseaux × cadence. La machine le dérive, et affiche en clair
 * pourquoi chaque créneau existe — sinon on déplace les cases sans savoir ce
 * qu'on casse.
 *
 * Les quatre premières semaines suivent la séquence de lancement
 * (exister → prouver → servir → ouvrir), parce qu'un lancement n'est pas une
 * semaine type répétée quatre fois.
 */

import type { EntiteSlug } from './marques';
import type { FormatSlug } from './formats';

export interface Creneau {
  /** 1 = lundi … 7 = dimanche */
  jour: number;
  formatSlug: FormatSlug;
  pilier: string;
  raison: string;
}

/** Semaine type, une fois le lancement passé. Cadrage §9. */
export const SEMAINE_TYPE: Record<EntiteSlug, Creneau[]> = {
  veolt: [
    { jour: 1, formatSlug: 'li-texte-image', pilier: 'demonter-un-chiffre', raison: 'Ouvrir la semaine sur un chiffre : c\'est le pilier qui tient le plus longtemps en lecture.' },
    { jour: 2, formatSlug: 'ig-reel', pilier: 'montrer-le-travail', raison: 'Un rendu 3D est un Reel tout fait. Coût de production marginal.' },
    { jour: 3, formatSlug: 'blog-article', pilier: 'pedagogie-dirigeant', raison: 'Le seul actif qu\'on possède. Rythme non négociable.' },
    { jour: 3, formatSlug: 'ig-carrousel', pilier: 'coulisses-methode', raison: 'La méthode se montre mieux en carrousel qu\'en vidéo.' },
    { jour: 4, formatSlug: 'li-carrousel', pilier: 'montrer-le-travail', raison: 'Le format le plus performant, et le seul où une page tient face à un profil.' },
    { jour: 5, formatSlug: 'tiktok-video', pilier: 'montrer-le-travail', raison: 'Secondaire. On y va avec le montage déjà fait pour le Reel, remonté — pas réemployé brut.' },
    { jour: 6, formatSlug: 'li-texte-image', pilier: 'pedagogie-dirigeant', raison: 'Le samedi est peu concurrencé en B2B, et la pédagogie s\'y lit bien.' },
  ],
  magistria: [
    { jour: 1, formatSlug: 'li-texte-image', pilier: 'arret-consequence', raison: 'Un arrêt commenté le lundi : c\'est le contenu le plus partagé par les juristes.' },
    { jour: 2, formatSlug: 'blog-article', pilier: 'sinistre-decortique', raison: 'Grappe « Sinistre et garantie ». Rythme non négociable.' },
    { jour: 3, formatSlug: 'li-carrousel', pilier: 'methode-nommee', raison: 'Une méthode nommée se démontre en dix pages, pas en un paragraphe.' },
    { jour: 4, formatSlug: 'ig-carrousel', pilier: 'sinistre-decortique', raison: 'Instagram est secondaire ici : on y reprend le carrousel, retaillé.' },
    { jour: 5, formatSlug: 'li-texte-image', pilier: 'conformite-datee', raison: 'Les échéances de conformité se lisent en fin de semaine, quand on planifie.' },
  ],
};

export const SEQUENCE_LANCEMENT = [
  { semaine: 1, nom: 'Exister', intention: "Qui on est, ce qu'on fait, ce qu'on ne fait pas. Le post de positionnement, assumé, sans fausse preuve.", pilierVeolt: 'positionnement-prix', pilierMagistria: 'position-ia' },
  { semaine: 2, nom: 'Prouver', intention: "Le travail, la méthode, un chiffre à nous. C'est la semaine qui décide de la crédibilité.", pilierVeolt: 'montrer-le-travail', pilierMagistria: 'methode-nommee' },
  { semaine: 3, nom: 'Servir', intention: 'Du contenu utile sans contrepartie. Premier appel réel.', pilierVeolt: 'demonter-un-chiffre', pilierMagistria: 'arret-consequence' },
  { semaine: 4, nom: 'Ouvrir', intention: "Le produit, les prix, le freemium. On ne vend qu'après avoir donné trois semaines.", pilierVeolt: 'positionnement-prix', pilierMagistria: 'conformite-datee' },
] as const;

export function lundiDe(d: Date): Date {
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  const delta = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - delta);
  return x;
}

export function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export interface CreneauDate extends Creneau {
  date: string;
  semaine: number;
  phase: string | null;
}

/**
 * Déroule `semaines` semaines à partir du lundi de `depart`.
 * Les quatre premières semaines voient leur pilier forcé par la phase de
 * lancement — c'est l'intérêt d'avoir une séquence plutôt qu'un rythme.
 */
export function deroule(entite: EntiteSlug, depart: Date, semaines: number): CreneauDate[] {
  const base = SEMAINE_TYPE[entite];
  const lundi = lundiDe(depart);
  const out: CreneauDate[] = [];

  for (let s = 0; s < semaines; s++) {
    const phase = SEQUENCE_LANCEMENT[s];
    for (const c of base) {
      const d = new Date(lundi);
      d.setDate(d.getDate() + s * 7 + (c.jour - 1));
      const pilierForce =
        phase && c.formatSlug !== 'blog-article'
          ? entite === 'veolt'
            ? phase.pilierVeolt
            : phase.pilierMagistria
          : c.pilier;
      out.push({
        ...c,
        pilier: pilierForce,
        date: iso(d),
        semaine: s + 1,
        phase: phase ? `S${phase.semaine} — ${phase.nom}` : null,
      });
    }
  }
  return out;
}
