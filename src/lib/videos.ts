/**
 * Scripts vidéo — même axe que les visuels : moderne, épuré, rien de décoratif.
 *
 * Deux contraintes de format tenues dans chaque script (cf. `formats.ts`) :
 *  - les **trois premières secondes** portent le sujet, lisible sans son et
 *    sans logo. Pas de générique, pas d'animation de marque en ouverture ;
 *  - le **texte est incrusté** partout. La très grande majorité des lectures
 *    est muette, et une voix off sur un écran fixe ne tient personne.
 *
 * Ce qui change entre les deux marques n'est pas le montage, c'est le rythme :
 * Veolt peut couper sec toutes les deux secondes, MagistrIA non — un propos
 * juridique haché se lit comme une publicité, et perd ce qu'il vend.
 */

import type { EntiteSlug } from './marques';
import type { FormatSlug } from './formats';

export interface Plan {
  /** Repère temporel, en secondes. */
  de: number;
  a: number;
  /** Ce qu'on voit. */
  image: string;
  /** Ce qui est incrusté à l'écran, mot pour mot. */
  texte: string;
}

export interface ScriptVideo {
  ref: string;
  titre: string;
  entite: EntiteSlug;
  formatSlug: FormatSlug;
  pilier: string;
  duree: number;
  /** Ce qui rend ce script tournable sans moyens. */
  tournage: string;
  plans: Plan[];
  legende: string;
  indicateur: string;
}

export const VIDEOS: ScriptVideo[] = [
  // ── Veolt ───────────────────────────────────────────────────────────────
  {
    ref: 'vid-v-1',
    titre: 'Photo studio ou packshot 3D',
    entite: 'veolt',
    formatSlug: 'ig-reel',
    pilier: 'montrer-le-travail',
    duree: 18,
    tournage:
      "Aucun tournage : capture d'écran du logiciel 3D pendant le rendu, plus le visuel final. Tout existe déjà si une modélisation est en cours.",
    plans: [
      { de: 0, a: 3, image: 'Le rendu 3D final, plein cadre, sans transition.', texte: 'Ce produit n’a jamais été photographié.' },
      { de: 3, a: 7, image: 'Rotation lente du même modèle, fond qui change de couleur.', texte: 'Quatorze angles. Trois coloris. Zéro studio reloué.' },
      { de: 7, a: 12, image: 'Grille de six déclinaisons qui apparaissent une à une.', texte: 'Le modèle est fait une fois. Les variantes sont gratuites.' },
      { de: 12, a: 16, image: 'Retour au premier rendu, texte centré.', texte: 'Au-delà de 5 visuels par référence, la photo coûte plus cher.' },
      { de: 16, a: 18, image: 'Le premier plan revient — la boucle se referme.', texte: 'À partir de 119 € HT.' },
    ],
    legende:
      "La 3D ne remplace pas la photo. Elle remplace la deuxième séance photo.\n\nCombien de visuels produisez-vous par référence et par an ? Le chiffre suffit à trancher.",
    indicateur: 'taux de visionnage complet',
  },
  {
    ref: 'vid-v-2',
    titre: 'Les trois lignes qu’un banquier regarde',
    entite: 'veolt',
    formatSlug: 'ig-reel',
    pilier: 'demonter-un-chiffre',
    duree: 20,
    tournage:
      "Capture d'écran d'un tableur, trois lignes surlignées à l'écran l'une après l'autre. Aucune donnée de client réel — un prévisionnel d'exemple construit pour la vidéo, et le dire.",
    plans: [
      { de: 0, a: 3, image: 'Le tableur, zoom serré sur une ligne de trésorerie négative.', texte: 'Il ne lit pas votre business plan en entier.' },
      { de: 3, a: 8, image: 'Surlignage 1 : la trésorerie au point le plus bas.', texte: '1. La trésorerie au point le plus bas. Pas le résultat.' },
      { de: 8, a: 13, image: 'Surlignage 2 : apport rapporté au besoin.', texte: '2. L’apport sur le besoin. C’est son risque à lui.' },
      { de: 13, a: 18, image: 'Surlignage 3 : chiffre d’affaires vs capacité de production.', texte: '3. Vendez-vous plus que vous ne pouvez produire ?' },
      { de: 18, a: 20, image: 'Les trois lignes ensemble, le reste du tableau grisé.', texte: 'Tout le reste sert à justifier ces trois lignes.' },
    ],
    legende:
      "Un prévisionnel n’est pas un exercice d’optimisme. C’est une démonstration de capacité à rembourser.\n\nVotre point de trésorerie le plus bas, vous le connaissez ?",
    indicateur: 'taux de visionnage complet',
  },
  {
    ref: 'vid-v-3',
    titre: 'Sept étapes d’une publicité 3D',
    entite: 'veolt',
    formatSlug: 'tiktok-video',
    pilier: 'coulisses-methode',
    duree: 25,
    tournage:
      "Les sept étapes capturées dans le logiciel, deux à trois secondes chacune. C'est le script le plus simple à tourner : il suffit d'enregistrer son écran pendant une production réelle.",
    plans: [
      { de: 0, a: 3, image: 'Le rendu final, puis coupe nette vers le maillage brut.', texte: 'De ça… à ça. Sept étapes.' },
      { de: 3, a: 9, image: 'Modélisation puis matériaux, en accéléré.', texte: '1. Modélisation  2. Matériaux' },
      { de: 9, a: 15, image: 'Éclairage puis caméra.', texte: '3. Éclairage  4. Caméra' },
      { de: 15, a: 21, image: 'Animation, rendu, étalonnage.', texte: '5. Animation  6. Rendu  7. Étalonnage' },
      { de: 21, a: 25, image: 'Retour au rendu final.', texte: 'Les deux qui coûtent le plus cher ? Matériaux et éclairage.' },
    ],
    legende:
      "En 3D, le premier visuel paie le modèle. Les suivants ne paient que le cadrage.\n\nQuelle étape vous paraît la plus floue ? On en fera le prochain carrousel.",
    indicateur: 'taux de visionnage complet',
  },

  // ── MagistrIA ───────────────────────────────────────────────────────────
  {
    ref: 'vid-m-1',
    titre: 'Trois phrases décident de la garantie',
    entite: 'magistria',
    formatSlug: 'ig-reel',
    pilier: 'sinistre-decortique',
    duree: 22,
    tournage:
      "Capture d'écran du produit : un rapport chargé, puis les trois passages mis en évidence. Rapport d'exemple construit pour la vidéo — jamais une pièce de dossier réel, même anonymisée.",
    plans: [
      { de: 0, a: 3, image: 'Un rapport d’expertise qui défile vite, quarante pages.', texte: 'Quarante pages. Trois phrases qui comptent.' },
      { de: 3, a: 9, image: 'Arrêt sur la première phrase surlignée.', texte: '1. La date de compromission → commande le délai de déclaration.' },
      { de: 9, a: 15, image: 'Deuxième phrase surlignée.', texte: '2. Le vecteur d’entrée → commande l’exclusion.' },
      { de: 15, a: 20, image: 'Troisième phrase surlignée.', texte: '3. Les sauvegardes → commandent le montant indemnisable.' },
      { de: 20, a: 22, image: 'Les trois ensemble, le reste du rapport estompé.', texte: 'Vingt minutes de lecture au lieu de deux heures.' },
    ],
    legende:
      "Dans un rapport technique, cherchez les phrases qui déplacent une date, une exclusion ou un montant.\n\nLaquelle de ces trois est la plus souvent absente de vos rapports ?",
    indicateur: 'taux de visionnage complet',
  },
  {
    ref: 'vid-m-2',
    titre: 'L’outil qui sait dire « je ne peux pas conclure »',
    entite: 'magistria',
    formatSlug: 'ig-reel',
    pilier: 'position-ia',
    duree: 20,
    tournage:
      "Capture d'écran du produit sur un dossier d'exemple incomplet, pour montrer la sortie « pièces insuffisantes ». C'est la démonstration la plus difficile à copier, parce qu'elle suppose que le produit la fasse vraiment.",
    plans: [
      { de: 0, a: 3, image: 'La réponse de l’outil à l’écran : « Les pièces ne permettent pas de conclure. »', texte: 'Notre outil vient de refuser de répondre.' },
      { de: 3, a: 9, image: 'Le dossier à côté, deux pièces manquantes signalées.', texte: 'Parce qu’il manque la preuve du lien de causalité.' },
      { de: 9, a: 15, image: 'Le raisonnement découpé en trois étapes, chacune avec sa source.', texte: 'Règle citée. Faits qualifiés. Et ce qui manque, dit.' },
      { de: 15, a: 20, image: 'Plan fixe sur la signature du produit.', texte: 'Un outil qui conclut toujours produira une conclusion même quand il n’y en a pas.' },
    ],
    legende:
      "L’IA propose, le professionnel décide. Ce n’est pas un slogan : c’est une contrainte d’architecture, visible dans le produit.\n\nQu’attendez-vous d’un outil d’IA juridique avant de lui faire confiance : la source, l’étape, ou la limite ?",
    indicateur: 'taux de visionnage complet',
  },
];

export function videosDe(entite: EntiteSlug) {
  return VIDEOS.filter((v) => v.entite === entite);
}
