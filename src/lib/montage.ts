/**
 * Montage vidéo — la partie qui ne dépend ni du serveur ni du navigateur.
 *
 * Une vidéo de la machine est une suite de **plans** : une durée, un texte
 * incrusté (la très grande majorité des lectures est muette), et une source
 * d'image — soit la « carte » générée à la charte (gabarit Reel), soit une
 * image de la médiathèque. Le rendu et l'encodage se font dans le navigateur
 * (`StudioVideo`) : aucune limite de durée de fonction, aucun serveur vidéo.
 */

import type { ScriptVideo } from './videos';

export type SourcePlan = { type: 'carte' } | { type: 'media'; id: number };

export interface PlanMontage {
  duree: number;
  texte: string;
  /** Ce qu'on voit, tel que décrit par le script — une aide au choix de l'image. */
  image: string;
  source: SourcePlan;
}

/** Cadre de sortie par format : 9:16 là où le réseau l'impose, 4:5 ailleurs (le plus haut accepté en fil). */
export function cadreVideo(formatSlug: string): { largeur: number; hauteur: number; ratio: string } {
  return formatSlug === 'ig-reel' || formatSlug === 'tiktok-video'
    ? { largeur: 1080, hauteur: 1920, ratio: '9:16' }
    : { largeur: 1080, hauteur: 1350, ratio: '4:5' };
}

export function plansDepuisScript(s: ScriptVideo): PlanMontage[] {
  return s.plans.map((p) => ({
    duree: Math.max(1, p.a - p.de),
    texte: p.texte,
    image: p.image,
    source: { type: 'carte' },
  }));
}

/** Coupe un texte en phrases courtes, lisibles en incrustation (≤ 90 caractères). */
function phrases(texte: string): string[] {
  return texte
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?…])\s+|\s+[—–-]\s+/)
    .map((x) => x.trim())
    .filter((x) => x.length > 3)
    .flatMap((x) => {
      if (x.length <= 90) return [x];
      // Une phrase trop longue se coupe à la virgule la plus proche du milieu.
      const milieu = x.length / 2;
      const virgules = [...x.matchAll(/,\s/g)].map((m) => m.index ?? 0);
      const coupe = virgules.sort((a, b) => Math.abs(a - milieu) - Math.abs(b - milieu))[0];
      return coupe ? [x.slice(0, coupe + 1), x.slice(coupe + 2)] : [x.slice(0, 88) + '…'];
    });
}

/**
 * Faute de script écrit pour ce post : l'accroche ouvre (3 s — elle doit porter
 * le sujet sans le son), quatre phrases du corps au plus, l'appel ferme.
 */
export function plansDepuisPost(p: { accroche: string; corps: string; appel: string }): PlanMontage[] {
  const ouverture = phrases(p.accroche)[0] ?? p.accroche.slice(0, 90);
  const milieu = phrases(p.corps).slice(0, 4);
  const fin = phrases(p.appel)[0];
  const plans: PlanMontage[] = [{ duree: 3, texte: ouverture, image: 'Ouverture — le sujet, lisible sans le son.', source: { type: 'carte' } }];
  for (const t of milieu) plans.push({ duree: t.length > 60 ? 4 : 3, texte: t, image: '', source: { type: 'carte' } });
  if (fin) plans.push({ duree: 3, texte: fin, image: 'Fermeture — l’appel à l’action.', source: { type: 'carte' } });
  return plans;
}

export const dureeTotale = (plans: PlanMontage[]) => plans.reduce((n, p) => n + p.duree, 0);
