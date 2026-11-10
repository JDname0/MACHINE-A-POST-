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
import { gabaritPour, deuxLignes, type GabaritSlug, type Contenu } from './visuels';
import { sousForums, joursDepuis, type LignePublication } from './requetes';
import { attendu } from './conformite-media';
import { aUneVideo } from './production';

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
  // Un post vidéo sans vidéo ne peut pas partir : il partirait vide. Le
  // calendrier fixe l'échéance de production (production.ts), ce garde-fou en
  // est le dernier verrou.
  if (attendu(p.format_slug) === 'video' && !aUneVideo(p.id)) {
    constats.unshift({
      niveau: 'blocage',
      regle: 'Vidéo manquante',
      message: 'Ce format se publie avec une vidéo, et aucune n’est rattachée à ce post.',
      remede: 'Monte-la dans le Studio vidéo (un clic avec les réglages par défaut), ou dépose un fichier dans la médiathèque.',
    });
  }
  return { constats, validable: estValidable(constats) };
}

/** Le gabarit et le texte du visuel généré de ce post. `null` si le format n'a pas de visuel. */
export function parametresVisuel(p: LignePublication): { slug: GabaritSlug; contenu: Partial<Contenu> } | null {
  const slug = gabaritPour(p.format_slug, p.pilier);
  if (!slug) return null;
  const { ligne1, ligne2 } = deuxLignes(p.titre ?? '');
  const contenu: Partial<Contenu> = { ligne1, ligne2, sousTitre: p.accroche.slice(0, 160) };
  if (slug === 'chiffre') {
    // Sur ce gabarit c'est la grande valeur qui porte : on prend le premier
    // nombre ou la première référence d'article trouvée dans l'accroche.
    const trouve = p.accroche.match(/(?:art\.?\s*)?[LRD]\.?\s*\d+(?:-\d+)?|\d[\d  ]*(?:\s*€|\s*%)?/i);
    contenu.chiffre = (trouve?.[0] ?? '—').trim();
    contenu.legende = p.preuve ?? '';
    contenu.sousTitre = p.accroche.slice(0, 180);
  }
  return { slug, contenu };
}

/** Le visuel généré qui va avec ce post, pré-rempli de son propre texte. `null` si le format n'en a pas. */
export function lienVisuel(p: LignePublication): string | null {
  const v = parametresVisuel(p);
  if (!v) return null;
  const q = new URLSearchParams(Object.entries(v.contenu).map(([k, x]) => [k, String(x ?? '')]));
  return `/${p.entite}/visuels/${v.slug}?${q.toString()}`;
}

/**
 * Les pages d'un carrousel, lues dans le corps du post (« PAGE n — … »), chacune
 * rendue avec le gabarit carrousel : la première phrase en titre, le reste en
 * sous-titre, la pagination en pied. `[]` si le post n'est pas un carrousel.
 */
export function pagesCarrousel(p: LignePublication): Array<{ slug: GabaritSlug; contenu: Partial<Contenu> }> {
  if (!/carrousel/.test(p.format_slug)) return [];
  const pages = [...p.corps.matchAll(/PAGE\s+(\d+)\s*[—–-]\s*([\s\S]*?)(?=\n\s*PAGE\s+\d+\s*[—–-]|$)/g)].map((m) => m[2].trim());
  return pages.map((texte, i) => {
    const [premiere, ...reste] = texte.split(/(?<=[.:!?])\s+/);
    const titre = premiere.length > 70 ? texte.slice(0, 70) : premiere;
    const { ligne1, ligne2 } = deuxLignes(titre);
    return {
      slug: 'carrousel' as GabaritSlug,
      contenu: {
        ligne1,
        ligne2,
        sousTitre: (premiere.length > 70 ? texte.slice(70) : reste.join(' ')).slice(0, 200),
        pagination: `${i + 1} / ${pages.length}`,
      },
    };
  });
}

/** Tous les visuels d'un post : son visuel principal, puis les pages s'il s'agit d'un carrousel. */
export function visuelsDuPost(p: LignePublication): Array<{ slug: GabaritSlug; contenu: Partial<Contenu> }> {
  const principal = parametresVisuel(p);
  const pages = pagesCarrousel(p);
  // Dans un carrousel, la page 1 tient lieu de couverture : pas de doublon.
  return pages.length ? pages : principal ? [principal] : [];
}

export function urlVisuel(entite: string, v: { slug: GabaritSlug; contenu: Partial<Contenu> }): string {
  const q = new URLSearchParams(Object.entries(v.contenu).map(([k, x]) => [k, String(x ?? '')]));
  return `/${entite}/visuels/${v.slug}?${q.toString()}`;
}

export function texteAColler(p: LignePublication): string {
  return [p.accroche, p.corps, p.appel, p.hashtags].filter(Boolean).join('\n\n');
}
