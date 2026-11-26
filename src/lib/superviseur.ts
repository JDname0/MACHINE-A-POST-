/**
 * Le superviseur qualité (25/11/2026) : il relit chaque post à venir et dit ce
 * qui n'est pas au niveau attendu, avec le remède. Il lit, il ne modifie rien.
 *
 * Les attentes, arrêtées avec Jonathan :
 *  - **Montrer, pas dire.** Chaque page de carrousel et chaque plan du milieu
 *    d'une vidéo montre ce qu'il dit : illustration, capture réelle de veolt.fr,
 *    carte de pack, clip. Un texte seul sur fond est un défaut.
 *  - **Court.** Un carrousel tient en 7 pages (8 au plus) : couverture, 4 à 5
 *    pages illustrées, la version finale en situation, la page de fin.
 *  - **Article** : 3 figures au moins.
 *  - Une image prévue au registre mais absente de la médiathèque ne se voit pas
 *    à l'image : le superviseur le dit (remède : importer le pack, page Visuels).
 *
 * Page `/[entite]/qualite`, audit JSON `/[entite]/qualite/audit`, et un bloc
 * dans l'aperçu de chaque post.
 */
import type { EntiteSlug } from './marques';
import type { LignePublication } from './requetes';
import { publications } from './requetes';
import { pagesCarrousel, figuresArticle, constatsDe } from './fiche';
import { FIGURES_ARTICLES, placementPourTexte, placementsDe, imagePack } from './illustrations';
import { illustrationParNom } from './illustrations-serveur';
import { imagesMemoire, montageParDefaut, type ImageMemoire } from './production';
import { packDePage } from './offres-veolt';

export type NiveauQualite = 'alerte' | 'conseil';
export interface ConstatQualite {
  niveau: NiveauQualite;
  message: string;
}
export interface AuditPost {
  id: number;
  date: string;
  heure: string | null;
  format: string;
  titre: string;
  sujet: string | null;
  statut: string;
  pages?: number;
  plansSansImage?: number;
  constats: ConstatQualite[];
}

export const PAGES_MAX_CARROUSEL = 8;
export const PAGES_VISEES_CARROUSEL = 7;
const VIDEOS = new Set(['ig-reel', 'tiktok-video', 'li-video', 'ig-video']);
/** Scènes qui montrent un objet (écran, tableur, documents) — pas du texte animé (liste, chiffre, bento). */
const SCENES_QUI_MONTRENT = new Set(['app', 'analyse', 'tableur', 'documents', 'site']);

/** Les pages qui ne sont ni couverture, ni fin, ni « À retenir » : celles qui doivent montrer. */
function pagesAMontrer(p: LignePublication): Array<{ numero: number; texte: string }> {
  const pages = [...p.corps.matchAll(/PAGE\s+(\d+)\s*[—–-]\s*([\s\S]*?)(?=\n\s*PAGE\s+\d+\s*[—–-]|$)/g)].map((m) => m[2].trim());
  return pages
    .map((texte, i) => ({ numero: i + 1, texte }))
    .filter((x, i) => i > 0 && i < pages.length - 1 && !/^À RETENIR\s*:/i.test(x.texte));
}

function plansSansImage(p: LignePublication, memoire: ImageMemoire[]): number {
  const md = montageParDefaut(p, memoire);
  return md.plans.slice(1, -1).filter((x) => !(x.source.type === 'media' || x.illustration || (x.scene && SCENES_QUI_MONTRENT.has(x.scene.type)))).length;
}

export function auditerPost(p: LignePublication, memoire: ImageMemoire[]): ConstatQualite[] {
  const sortie: ConstatQualite[] = [];
  if (p.entite !== 'veolt') return sortie;
  const debutDe = (t: string) => `« ${t.split(/(?<=[.?!])\s/)[0].slice(0, 60)} »`;

  if (/carrousel/.test(p.format_slug)) {
    const n = pagesCarrousel(p).length;
    if (n > PAGES_MAX_CARROUSEL)
      sortie.push({ niveau: 'alerte', message: `${n} pages : trop long. Viser ${PAGES_VISEES_CARROUSEL} (couverture, 4 à 5 pages illustrées, version finale en situation, fin).` });
    else if (n > 0 && n < 5) sortie.push({ niveau: 'conseil', message: `${n} pages seulement : le carrousel ne développe pas assez le sujet.` });
    const couverture = placementsDe(p.entite, p.sujet_ref).find((x) => x.role === 'couverture');
    if (!couverture) sortie.push({ niveau: 'alerte', message: 'Couverture sans image : aucune illustration prévue pour ce sujet au registre.' });
    else if (!illustrationParNom(p.entite, couverture.image))
      sortie.push({ niveau: 'alerte', message: `Couverture : l'image « ${couverture.image} » n'est pas dans la médiathèque. Importer le pack (page Visuels).` });
    for (const pg of pagesAMontrer(p)) {
      if (p.sujet_ref === 'v-vf-2' && packDePage(pg.texte)) continue; // carte de pack recomposée
      const pl = placementPourTexte(p.entite, p.sujet_ref, pg.texte);
      if (!pl) sortie.push({ niveau: 'alerte', message: `Page ${pg.numero} ${debutDe(pg.texte)} : texte seul, aucune image ne montre ce qu'elle dit.` });
      else if (!illustrationParNom(p.entite, pl.image))
        sortie.push({ niveau: 'alerte', message: `Page ${pg.numero} : l'image « ${pl.image} » n'est pas dans la médiathèque. Importer le pack (page Visuels).` });
    }
  }

  if (VIDEOS.has(p.format_slug)) {
    const md = montageParDefaut(p, memoire);
    const milieu = md.plans.slice(1, -1);
    const sans = milieu
      .map((x, i) => ({ x, i: i + 2 }))
      .filter(({ x }) => !(x.source.type === 'media' || x.illustration || (x.scene && SCENES_QUI_MONTRENT.has(x.scene.type))));
    if (sans.length)
      sortie.push({

        niveau: 'alerte',
        message: `Vidéo : ${sans.length} plan${sans.length > 1 ? 's' : ''} sur ${milieu.length} ne montre${sans.length > 1 ? 'nt' : ''} que du texte (plan${sans.length > 1 ? 's' : ''} ${sans.map((s) => s.i).join(', ')}). Lui donner une image, une capture animée ou une scène.`,
      });
    for (const { x, i } of milieu.map((x, i) => ({ x, i: i + 2 })))
      if (x.illustration && x.source.type !== 'media' && imagePack(x.illustration))
        sortie.push({ niveau: 'alerte', message: `Vidéo, plan ${i} : l'image « ${x.illustration} » n'est pas dans la médiathèque. Importer le pack (page Visuels).` });
    const total = md.plans.reduce((s, x) => s + x.duree, 0);
    if (total > 45) sortie.push({ niveau: 'conseil', message: `Vidéo de ${Math.round(total)} s : au-delà de 45 s, la rétention chute sur Reels et TikTok.` });
  }

  if (p.format_slug === 'blog-article') {
    const prevues = (FIGURES_ARTICLES[p.sujet_ref ?? ''] ?? []).length;
    const posees = figuresArticle(p).length;
    if (prevues < 3) sortie.push({ niveau: 'alerte', message: `Article : ${prevues} figure${prevues > 1 ? 's' : ''} prévue${prevues > 1 ? 's' : ''}, 3 au moins attendues.` });
    else if (posees < prevues) sortie.push({ niveau: 'alerte', message: `Article : ${prevues - posees} figure(s) prévue(s) absente(s) de la médiathèque. Importer le pack (page Visuels).` });
  }

  // Texte : les tics d'écriture « IA » relevés par les garde-fous (règle 15).
  for (const c of constatsDe(p).constats.filter((x) => x.regle === 'Texte — tic d’écriture « IA »'))
    sortie.push({ niveau: 'alerte', message: `Texte : ${c.message} ${c.remede}` });

  if (p.format_slug === 'li-texte-image') {
    const couverture = placementsDe(p.entite, p.sujet_ref).find((x) => x.role === 'couverture');
    if (!couverture) sortie.push({ niveau: 'conseil', message: 'Visuel sans illustration : il ne montre que le titre. Prévoir une image au registre.' });
  }
  return sortie;
}

/** Tous les posts à venir de l'entité (ni publiés ni abandonnés), audités. */
export function auditerEntite(entite: EntiteSlug): AuditPost[] {
  const memoire = imagesMemoire(entite);
  return publications(entite)
    .filter((p) => p.statut !== 'publie' && p.statut !== 'abandonne')
    .map((p) => {
      const constats = auditerPost(p, memoire);
      return {
        id: p.id,
        date: p.date_prevue,
        heure: p.heure_prevue ?? null,
        format: p.format_slug,
        titre: p.titre ?? '',
        sujet: p.sujet_ref,
        statut: p.statut,
        ...(/carrousel/.test(p.format_slug) ? { pages: pagesCarrousel(p).length } : {}),
        ...(VIDEOS.has(p.format_slug) ? { plansSansImage: plansSansImage(p, memoire) } : {}),
        constats,
      };
    });
}
