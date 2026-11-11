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
import { aUneVideo, photoDuPost } from './production';

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
  let slug = gabaritPour(p.format_slug, p.pilier);
  if (!slug) return null;
  const trouve = p.accroche.match(/(?:art\.?\s*)?[LRD]\.?\s*\d+(?:-\d+)?|\d[\d  ]*(?:\s*€|\s*%)?/i);
  // Le gabarit « chiffre » sans chiffre réel dans l'accroche afficherait un
  // tiret, ou pire un nombre d'exemple : on passe à l'affirmation.
  if (slug === 'chiffre' && !trouve) slug = 'affirmation';
  const { ligne1, ligne2 } = deuxLignes(p.titre ?? '');
  const contenu: Partial<Contenu> = { ligne1, ligne2, sousTitre: p.accroche.slice(0, 160) };
  const photo = photoDuPost(p);
  if (photo) contenu.photo = String(photo);
  // La couverture d'un carrousel annonce son vrai nombre de pages (pas le « 1 / 9 » d'exemple).
  if (slug === 'carrousel') {
    const n = [...p.corps.matchAll(/PAGE\s+\d+\s*[—–-]/g)].length;
    contenu.pagination = n ? `1 / ${n}` : '';
  }
  if (slug === 'couverture') {
    // Le titre d'un article est déjà la requête (et l'accroche le répète) :
    // la couverture porte plutôt la première phrase de la réponse.
    const reponse = p.corps.replace(/^#+[^\n]*\n/, '').split(/(?<=[.?!])\s+/)[0] ?? '';
    contenu.sousTitre = reponse.length > 150 ? `${reponse.slice(0, reponse.lastIndexOf(' ', 148))}…` : reponse;
  }
  if (slug === 'chiffre' && trouve) {
    // Sur ce gabarit c'est la grande valeur qui porte : le premier nombre ou la
    // première référence d'article trouvée dans l'accroche.
    contenu.chiffre = trouve[0].trim();
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
  const photo = pages.length ? photoDuPost(p) : null;
  return pages.map((texte, i) => {
    const [premiere, ...reste] = texte.split(/(?<=[.:!?])\s+/);
    // Une première phrase trop longue pour le titre se coupe à une pause
    // (virgule, deux-points, tiret) ou entre deux mots — jamais dans un mot.
    // Quelques caractères de trop ne justifient pas de laisser un mot orphelin en sous-titre.
    const [titre, suite] = premiere.length > 82 ? couperTitre(premiere, 70) : [premiere, ''];
    const { ligne1, ligne2 } = deuxLignes(titre);
    return {
      slug: 'carrousel' as GabaritSlug,
      contenu: {
        ligne1,
        ligne2,
        sousTitre: borner([suite, ...reste].filter(Boolean).join(' '), 230),
        pagination: `${i + 1} / ${pages.length}`,
        // La couverture du carrousel porte la photo ; les pages restent nettes, pour la lecture.
        ...(i === 0 && photo ? { photo: String(photo) } : {}),
      },
    };
  });
}

/** Coupe un titre trop long à la dernière pause avant `max`, sinon au dernier espace ; la suite repart avec « … ». */
function couperTitre(phrase: string, max: number): [string, string] {
  const tete = phrase.slice(0, max + 1);
  const pause = Math.max(tete.lastIndexOf(', '), tete.lastIndexOf(' : '), tete.lastIndexOf(' — '));
  if (pause >= 25) {
    const signe = phrase[pause] === ',' ? '' : phrase.slice(pause, pause + 2).trim();
    return [`${phrase.slice(0, pause).trim()}${signe ? ` ${signe}` : ''}`, phrase.slice(pause + (phrase[pause] === ',' ? 1 : 2)).trim()];
  }
  const espace = tete.lastIndexOf(' ');
  const coupe = espace > 20 ? espace : max;
  return [`${phrase.slice(0, coupe).trim()}…`, `…${phrase.slice(coupe).trim()}`];
}

/** Borne un sous-titre à `max` caractères, en finissant sur une phrase ou un mot entier. */
function borner(texte: string, max: number): string {
  if (texte.length <= max) return texte;
  const tete = texte.slice(0, max);
  const phrase = Math.max(tete.lastIndexOf('. '), tete.lastIndexOf('? '), tete.lastIndexOf('! '));
  if (phrase > max * 0.6) return tete.slice(0, phrase + 1);
  return `${tete.slice(0, tete.lastIndexOf(' ')).replace(/[,;:—–-]\s*$/, '')}…`;
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
  // Un carrousel porte ses pages en images (ou en PDF) : la légende ne les
  // répète pas. Ce qui précède « PAGE 1 — » reste, s'il y en a.
  const corps = /carrousel/.test(p.format_slug) ? p.corps.replace(/PAGE\s+\d+\s*[—–-][\s\S]*$/, '').trim() : p.corps;
  return [p.accroche, corps, p.appel, p.hashtags].filter(Boolean).join('\n\n');
}

/**
 * Un article de blog en HTML, prêt à coller dans l'éditeur du site : titre,
 * sections (« ## »), listes (« - »), paragraphes, appel final. Tout le texte
 * est échappé — le HTML ne vient que de cette conversion, jamais du contenu.
 */
export function articleEnHtml(p: LignePublication): string {
  const echapper = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const sortie: string[] = [`<h1>${echapper(p.titre ?? p.accroche)}</h1>`];
  let liste = false;
  const fermer = () => {
    if (liste) sortie.push('</ul>');
    liste = false;
  };
  for (const ligne of p.corps.split('\n')) {
    const t = ligne.trim();
    if (!t) {
      fermer();
    } else if (t.startsWith('## ')) {
      fermer();
      sortie.push(`<h2>${echapper(t.slice(3))}</h2>`);
    } else if (t.startsWith('- ')) {
      if (!liste) sortie.push('<ul>');
      liste = true;
      sortie.push(`<li>${echapper(t.slice(2))}</li>`);
    } else {
      fermer();
      sortie.push(`<p>${echapper(t)}</p>`);
    }
  }
  fermer();
  if (p.appel.trim()) sortie.push(`<p><strong>${echapper(p.appel.trim())}</strong></p>`);
  return sortie.join('\n');
}
