/**
 * Production des vidéos au rythme du calendrier.
 *
 * Chaque post vidéo a une **échéance de production** : sa vidéo doit exister
 * `DELAI_VIDEO_JOURS` jours avant sa date de publication, pour laisser le
 * temps de la relire et de la valider. L'outil dit ce qui est prêt, ce qui est
 * à monter et ce qui est en retard — et la production en lot fabrique d'un
 * coup tout ce qui est dû.
 *
 * Le montage par défaut d'un post (plans + images) est calculé ici, une seule
 * fois, pour le studio comme pour le lot.
 */

import { db } from './db';
import { publications, type LignePublication } from './requetes';
import { attendu } from './conformite-media';
import { videosDe } from './videos';
import { cadreVideo, plansDepuisPost, plansDepuisScript, type PlanMontage } from './montage';
import { deuxLignes } from './visuels';
import { TYPES_IMAGE } from './medias';
import type { EntiteSlug } from './marques';

export const DELAI_VIDEO_JOURS = 3;
/** Horizon de la production en lot : tout ce qui sera dû dans les sept jours. */
export const HORIZON_LOT_JOURS = 7;

export type EtatVideo = 'prete' | 'en-retard' | 'a-monter' | 'plus-tard';

export interface EcheanceVideo {
  p: LignePublication;
  echeance: string;
  etat: EtatVideo;
  joursRestants: number;
}

const iso = (d: Date) => d.toISOString().slice(0, 10);
const jours = (de: string, a: string) => Math.round((Date.parse(`${a}T12:00:00Z`) - Date.parse(`${de}T12:00:00Z`)) / 86_400_000);

export function aUneVideo(publicationId: number): boolean {
  return Boolean(
    db().prepare("SELECT 1 FROM medias WHERE publication_id=? AND type_mime LIKE 'video/%' LIMIT 1").get(publicationId),
  );
}

export function echeancesVideo(entite: EntiteSlug, aujourdhui = new Date()): EcheanceVideo[] {
  const jour = iso(aujourdhui);
  return publications(entite)
    .filter((p) => attendu(p.format_slug) === 'video' && p.statut !== 'publie' && p.statut !== 'abandonne')
    .map((p) => {
      const d = new Date(`${p.date_prevue}T12:00:00Z`);
      d.setUTCDate(d.getUTCDate() - DELAI_VIDEO_JOURS);
      const echeance = iso(d);
      const restants = jours(jour, echeance);
      const etat: EtatVideo = aUneVideo(p.id)
        ? 'prete'
        : restants < 0
          ? 'en-retard'
          : restants <= HORIZON_LOT_JOURS
            ? 'a-monter'
            : 'plus-tard';
      return { p, echeance, etat, joursRestants: restants };
    });
}

export interface ImageMemoire {
  id: number;
  nom: string;
  origine: string;
  publication_id: number | null;
  semaine: number | null;
}

/** Les images de la mémoire d'une entité (pas les vidéos), avec la semaine du post auquel elles sont rattachées. */
export function imagesMemoire(entite: EntiteSlug): ImageMemoire[] {
  const types = Object.keys(TYPES_IMAGE);
  return db()
    .prepare(
      `SELECT m.id, m.nom, m.origine, m.publication_id, p.semaine
         FROM medias m LEFT JOIN publications p ON p.id = m.publication_id
        WHERE m.entite = ? AND m.type_mime IN (${types.map(() => '?').join(',')})
        ORDER BY m.id DESC`,
    )
    .all(entite, ...types) as ImageMemoire[];
}

export interface MontageParDefaut {
  plans: PlanMontage[];
  cartes: string[];
  largeur: number;
  hauteur: number;
  ratio: string;
  scriptRef: string | null;
}

/**
 * Le montage d'un post sans retouche : le script écrit pour ce format et ce
 * pilier s'il existe, sinon des plans tirés du texte du post.
 *
 * Les images viennent de la mémoire, sans rien inventer :
 *  - en ouverture, le visuel **généré** du post lui-même s'il est mémorisé —
 *    il porte le titre, à la charte : c'est un premier plan tout fait ;
 *  - au milieu, les images **apportées** (rendus 3D, Higgsfield, photos)
 *    rattachées au post, puis celles de la même semaine ;
 *  - la fermeture garde la carte : l'appel à l'action doit rester lisible.
 */
export function montageParDefaut(p: LignePublication, memoire: ImageMemoire[], scriptRef?: string): MontageParDefaut {
  const scripts = videosDe(p.entite as EntiteSlug);
  const auto = scripts.find((s) => s.formatSlug === p.format_slug && s.pilier === p.pilier);
  const script = scriptRef === 'post' ? undefined : scripts.find((s) => s.ref === scriptRef) ?? auto;
  const plans = script ? plansDepuisScript(script) : plansDepuisPost(p);

  const ouverture = memoire.find((m) => m.origine === 'genere' && m.publication_id === p.id);
  if (ouverture && plans.length) plans[0] = { ...plans[0], source: { type: 'media', id: ouverture.id } };

  const matiere = [
    ...memoire.filter((m) => m.origine === 'apporte' && m.publication_id === p.id),
    ...memoire.filter((m) => m.origine === 'apporte' && m.publication_id !== p.id && m.semaine != null && m.semaine === p.semaine),
  ];
  if (matiere.length) {
    for (let i = 1, k = 0; i < plans.length - 1; i++, k++) {
      plans[i] = { ...plans[i], source: { type: 'media', id: matiere[k % matiere.length].id } };
    }
  }

  const cadre = cadreVideo(p.format_slug);
  const cartes = plans.map((x) => {
    const { ligne1, ligne2 } = deuxLignes(x.texte);
    return `/${p.entite}/visuels/reel?${new URLSearchParams({ ligne1, ligne2, sousTitre: '' })}`;
  });
  return { plans, cartes, largeur: cadre.largeur, hauteur: cadre.hauteur, ratio: cadre.ratio, scriptRef: script?.ref ?? null };
}
