/**
 * Ce qu'on calcule autour d'une publication, partagé entre le composeur
 * (`/[entite]/publications/[id]`) et la file de validation (`/[entite]/valider`).
 *
 * Un seul endroit, pour qu'un post « validable » dans la file le soit aussi
 * dans le composeur : deux copies du même calcul finissent toujours par
 * diverger, et c'est le garde-fou qui saute en premier.
 */

import type { EntiteSlug } from './marques';
import type { FormatSlug } from './formats';
import { controler, estValidable, type Constat } from './garde-fous';
import { gabaritPour, deuxLignes } from './visuels';
import { sousForums, joursDepuis, type LignePublication } from './requetes';

export function constatsDe(p: LignePublication): { constats: Constat[]; validable: boolean } {
  const sf = sousForums().find((x) => x.nom === p.sous_forum);
  const constats = controler({
    entite: p.entite as EntiteSlug,
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
    joursDepuisDernierPostSousForum: joursDepuis(sf?.dernier_post ?? null),
    plafondJoursSousForum: sf?.plafond_jours ?? null,
  });
  return { constats, validable: estValidable(constats) };
}

/** Le visuel généré qui va avec ce post, pré-rempli de son propre texte. `null` si le format n'en a pas. */
export function lienVisuel(p: LignePublication): string | null {
  const slug = gabaritPour(p.format_slug, p.pilier);
  if (!slug) return null;
  const { ligne1, ligne2 } = deuxLignes(p.titre ?? '');
  const q = new URLSearchParams({ ligne1, ligne2, sousTitre: p.accroche.slice(0, 160) });
  if (slug === 'chiffre') {
    // Sur ce gabarit c'est la grande valeur qui porte : on prend le premier
    // nombre ou la première référence d'article trouvée dans l'accroche.
    const trouve = p.accroche.match(/(?:art\.?\s*)?[LRD]\.?\s*\d+(?:-\d+)?|\d[\d  ]*(?:\s*€|\s*%)?/i);
    q.set('chiffre', (trouve?.[0] ?? '—').trim());
    q.set('legende', p.preuve ?? '');
    q.set('sousTitre', p.accroche.slice(0, 180));
  }
  return `/${p.entite}/visuels/${slug}?${q.toString()}`;
}

export function texteAColler(p: LignePublication): string {
  return [p.accroche, p.corps, p.appel, p.hashtags].filter(Boolean).join('\n\n');
}
