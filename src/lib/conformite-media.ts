/**
 * Le média convient-il au format ?
 *
 * Mêmes règles d'écriture que les garde-fous du texte : on ne dit jamais
 * « corrigez », on dit ce qui cloche, pourquoi ça compte sur ce réseau-là, et
 * quoi faire. Un blocage empêche la publication par API ; une alerte laisse
 * passer en le disant.
 *
 * Les valeurs tenues ici viennent du cadrage (§6 et §12, relevés 2026) : 9:16
 * pour le plein écran, 4:5 pour ce qui occupe le plus de hauteur dans un fil,
 * et la fenêtre de durée au-delà de laquelle une vidéo courte décroche.
 */

import { format, type FormatSlug } from './formats';
import { cadre, estVideo } from './medias';
import type { Constat } from './garde-fous';

export interface MediaAControler {
  nom: string;
  type_mime: string;
  largeur: number | null;
  hauteur: number | null;
  duree_s: number | null;
  octets: number;
}

/** Ce que le format attend : rien, une image, ou une vidéo. */
export function attendu(formatSlug: string): 'image' | 'video' | 'aucun' {
  const f = format(formatSlug as FormatSlug);
  if (f.reseau === 'reddit' || f.reseau === 'blog') return 'aucun';
  return formatSlug === 'li-video' || formatSlug === 'ig-reel' || formatSlug === 'ig-video' || formatSlug === 'tiktok-video'
    ? 'video'
    : 'image';
}

/** Les cadres acceptés sans recadrage, par format. */
const CADRES: Record<string, string[]> = {
  'li-texte-image': ['1:1', '4:5', '1,91:1'],
  'li-carrousel': ['1:1', '4:5'],
  'li-video': ['1:1', '4:5', '9:16'],
  'ig-carrousel': ['1:1', '4:5'],
  'ig-reel': ['9:16'],
  'ig-video': ['1:1', '4:5', '9:16'],
  'tiktok-video': ['9:16'],
};

/** Durée courte conseillée, et plafond dur de la plateforme, en secondes. */
const DUREES: Record<string, { conseil: [number, number]; max: number; pourquoi: string }> = {
  'ig-reel': {
    conseil: [10, 20],
    max: 90,
    pourquoi: 'un Reel se joue en boucle : au-delà de vingt secondes la boucle ne se referme plus et la rétention chute',
  },
  'tiktok-video': {
    conseil: [10, 30],
    max: 600,
    pourquoi: 'la décision de rester se prend dans les trois premières secondes, et le taux de visionnage complet porte la diffusion',
  },
  'li-video': {
    conseil: [30, 90],
    max: 600,
    pourquoi: 'sur LinkedIn la vidéo se regarde posément, mais au-delà d’une minute et demie le temps passé par vue s’effondre',
  },
  'ig-video': { conseil: [20, 60], max: 900, pourquoi: 'au-delà d’une minute, le fil Instagram n’est plus le bon endroit' },
};

export function controlerMedia(formatSlug: string, m: MediaAControler): Constat[] {
  const c: Constat[] = [];
  const f = format(formatSlug as FormatSlug);
  const veut = attendu(formatSlug);
  const video = estVideo(m.type_mime);

  if (veut === 'aucun') {
    c.push({
      niveau: 'alerte',
      regle: 'Format sans média',
      message: `${f.nom} se publie sans fichier joint.`,
      remede:
        f.reseau === 'reddit'
          ? 'Un post Reddit est textuel : une image de marque y est lue comme une publicité, et c’est le genre de détail qui fait retirer un post. Détacher le fichier.'
          : 'Un article porte ses illustrations dans son corps, pas en pièce jointe. Détacher le fichier.',
    });
    return c;
  }

  if (veut === 'video' && !video) {
    c.push({
      niveau: 'blocage',
      regle: 'Type de média',
      message: `${f.nom} attend une vidéo, et ${m.nom} est une image.`,
      remede: 'Déposer la vidéo dans la médiathèque et la rattacher à cette publication.',
    });
    return c;
  }
  if (veut === 'image' && video) {
    c.push({
      niveau: 'blocage',
      regle: 'Type de média',
      message: `${f.nom} attend une image, et ${m.nom} est une vidéo.`,
      remede: 'Choisir une image, ou basculer cette publication sur un format vidéo.',
    });
    return c;
  }

  const attendus = CADRES[formatSlug];
  const k = cadre(m.largeur, m.hauteur);
  if (!k) {
    c.push({
      niveau: 'conseil',
      regle: 'Cadre inconnu',
      message: `Les dimensions de ${m.nom} n’ont pas pu être lues.`,
      remede: 'Le réseau recadrera peut-être sans prévenir. Vérifier l’aperçu avant de publier.',
    });
  } else if (attendus && (!k.exact || !attendus.includes(k.nom))) {
    c.push({
      niveau: k.exact ? 'alerte' : 'blocage',
      regle: 'Cadre du média',
      message: `${m.largeur} × ${m.hauteur} donne du ${k.nom}${k.exact ? '' : ' approximatif'}, quand ${f.nom} attend ${attendus.join(' ou ')}.`,
      remede: k.exact
        ? `Publiable, mais le réseau recadrera. Pour ce format, ${attendus[0]} est le cadre qui occupe le plus de place dans le fil.`
        : `Recadrer le fichier en ${attendus[0]} avant de le déposer. Un recadrage automatique coupe toujours là où on ne veut pas — en général le texte.`,
    });
  }

  const d = DUREES[formatSlug];
  if (video && d && m.duree_s != null) {
    const s = Math.round(m.duree_s);
    if (s > d.max) {
      c.push({
        niveau: 'blocage',
        regle: 'Durée',
        message: `${s} s, au-delà du plafond de ${d.max} s du format.`,
        remede: 'La plateforme refusera le fichier. Monter une version plus courte.',
      });
    } else if (s > d.conseil[1]) {
      c.push({
        niveau: 'conseil',
        regle: 'Durée',
        message: `${s} s, au-delà de la fourchette utile de ${d.conseil[0]} à ${d.conseil[1]} s.`,
        remede: `Publiable. Mais ${d.pourquoi}.`,
      });
    }
  }

  return c;
}
