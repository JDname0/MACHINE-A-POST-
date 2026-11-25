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
import type { Scene, FondPlan, Noyau3D } from './montage';

export interface Plan {
  /** Repère temporel, en secondes. */
  de: number;
  a: number;
  /** Ce qu'on voit. */
  image: string;
  /** Ce qui est incrusté à l'écran, mot pour mot. */
  texte: string;
  /** La scène dessinée dans le studio (écran produit, chiffre, liste…) ; absente : titre seul. */
  scene?: Scene;
  chapitre?: string;
  accent?: string;
  annotation?: string;
  fond?: FondPlan;
  centre?: boolean;
  sousTitre?: string;
  /** Couche 3D de particules, reprise des sites. */
  noyau?: Noyau3D;
  /** Clip vidéo de la médiathèque posé en fond (nom du fichier sans extension). */
  clip?: string;
  /** Illustration du pack montrée dans le plan, dans son cadre de verre (nom du registre). */
  illustration?: string;
  /** Cadrage de cette illustration (point d'intérêt de 0 à 1, grossissement ≥ 1). */
  cadrage?: import('./illustrations').Cadrage;
}

export interface ScriptVideo {
  ref: string;
  titre: string;
  entite: EntiteSlug;
  formatSlug: FormatSlug;
  pilier: string;
  /**
   * Le sujet du réservoir (`sujets.ts`) que ce script met en images. C'est par
   * lui, et non par le pilier, qu'un post reçoit ce script : deux sujets du
   * même pilier ne disent pas la même chose.
   */
  sujet?: string;
  duree: number;
  /** Ce qui rend ce script tournable sans moyens. */
  tournage: string;
  plans: Plan[];
  legende: string;
  indicateur: string;
  /** Cadre imposé (sinon celui du format) : un cas d'usage Instagram se tourne en 9:16. */
  cadre?: '9:16' | '4:5';
  /** Démonstration d'un cas d'utilisation réel du produit ou du service. */
  casUsage?: boolean;
}

export const VIDEOS: ScriptVideo[] = [
  // ── Veolt ───────────────────────────────────────────────────────────────
  {
    ref: 'vid-v-1',
    sujet: 'v-mt-1',
    titre: 'Photo studio ou packshot 3D',
    entite: 'veolt',
    formatSlug: 'ig-reel',
    pilier: 'montrer-le-travail',
    duree: 18,
    tournage:
      "Aucun tournage : les illustrations du pack (rendu 3D, studio et poste 3D, modèle décliné, courbes de coût) dans leur cadre de verre, puis le prix affiché. Une capture du logiciel pendant un rendu réel peut remplacer n'importe quel plan.",
    plans: [
      { de: 0, a: 3, image: 'Le rendu 3D du flacon, seul dans le cadre.', texte: 'Ce produit n’a jamais été photographié.', illustration: 'illu-photo-ou-3d', cadrage: { x: 0.76, y: 0.5, zoom: 1.9 } },
      { de: 3, a: 7, image: 'Le poste 3D, le même produit en quatre coloris à l’écran.', texte: 'Quatorze angles. Trois coloris. Zéro studio reloué.', illustration: 'illu-studio-et-poste-3d', cadrage: { x: 0.74, y: 0.62, zoom: 1.7 } },
      { de: 7, a: 12, image: 'Un modèle au centre, dix rendus qui en partent.', texte: 'Le modèle est fait une fois. Les variantes ne coûtent presque plus rien.', illustration: 'illu-un-modele-dix-coloris' },
      { de: 12, a: 16, image: 'Les deux courbes de coût qui se croisent.', texte: 'Au-delà de 5 visuels par référence, la photo coûte plus cher.', illustration: 'illu-courbes-cout' },
      { de: 16, a: 18, image: 'Le prix, sur la carte de marque.', texte: 'À partir de 119 € HT.' },
    ],
    legende:
      "La 3D ne remplace pas la photo. Elle remplace la deuxième séance photo.\n\nCombien de visuels produisez-vous par référence et par an ? Le chiffre suffit à trancher.",
    indicateur: 'taux de visionnage complet',
  },
  {
    ref: 'vid-v-2',
    sujet: 'v-dc-2',
    titre: 'Les trois lignes qu’un banquier regarde',
    entite: 'veolt',
    formatSlug: 'ig-reel',
    pilier: 'demonter-un-chiffre',
    duree: 20,
    tournage:
      "Tout est dessiné par le studio : le prévisionnel est un EXEMPLE aux chiffres fictifs, et l'écran le dit. Aucune donnée de client réel.",
    plans: [
      { de: 0, a: 3, image: 'Le prévisionnel imprimé sur le bureau du banquier, trois lignes surlignées.', texte: 'Il ne lit pas votre business plan en entier.', illustration: 'illu-previsionnel-banquier' },
      {
        de: 3,
        a: 15,
        image: 'Le tableur d’exemple : les trois lignes repérées une à une.',
        texte: 'Il regarde trois lignes.',
        chapitre: 'Prévisionnel d’exemple',
        fond: 'horizon',
        scene: {
          type: 'tableur',
          fenetre: 'Prévisionnel · EXEMPLE — chiffres fictifs',
          colonnes: ['', 'An 1', 'An 2', 'An 3'],
          lignes: [
            { libelle: 'Chiffre d’affaires', valeurs: ['180 k€', '240 k€', '290 k€'] },
            { libelle: 'Capacité de production', valeurs: ['200 k€', '220 k€', '260 k€'] },
            { libelle: 'Apport sur le besoin', valeurs: ['22 %', '—', '—'] },
            { libelle: 'Trésorerie au plus bas', valeurs: ['−8 k€', '12 k€', '31 k€'] },
            { libelle: 'Résultat net', valeurs: ['4 k€', '38 k€', '61 k€'] },
          ],
          reperes: [
            { ligne: 3, note: '1. Le point le plus bas, pas le résultat' },
            { ligne: 2, note: '2. L’apport sur le besoin : son risque à lui' },
            { ligne: 0, note: '3. Plus de ventes que de capacité ?' },
          ],
        },
      },
      { de: 15, a: 20, image: 'Titre centré, la sphère en fond.', texte: 'Tout le reste sert à justifier ces trois lignes.', centre: true, fond: 'rayons', noyau: { forme: 'galaxie', place: 'fond', intensite: 0.16 } },
    ],
    legende:
      "Un prévisionnel n’est pas un exercice d’optimisme. C’est une démonstration de capacité à rembourser.\n\nVotre point de trésorerie le plus bas, vous le connaissez ?",
    indicateur: 'taux de visionnage complet',
  },
  {
    ref: 'vid-v-3',
    sujet: 'v-mt-3',
    titre: 'Sept étapes d’une publicité 3D',
    entite: 'veolt',
    formatSlug: 'tiktok-video',
    pilier: 'coulisses-methode',
    duree: 28,
    tournage:
      "Une étape par plan, le même flacon d'un bout à l'autre (illustrations du pack, générées à partir d'une seule référence). Chaque plan peut être remplacé par la capture du logiciel pendant une production réelle, à la même étape.",
    plans: [
      { de: 0, a: 3, image: 'Le flacon mi-maillage, mi-rendu.', texte: 'De ça… à ça. Sept étapes.', illustration: 'illu-pipeline-3d' },
      { de: 3, a: 5.5, image: 'Le maillage filaire.', chapitre: '01 / 07 · Modélisation', texte: 'La forme exacte, faite une fois.', illustration: 'illu-3d-modelisation' },
      { de: 5.5, a: 8, image: 'L’argile et les sphères de matières.', chapitre: '02 / 07 · Matériaux', texte: 'Verre, chrome, laque : chaque surface se règle.', illustration: 'illu-3d-materiaux' },
      { de: 8, a: 10.5, image: 'Les boîtes à lumière autour du flacon.', chapitre: '03 / 07 · Éclairage', texte: 'C’est la lumière qui fait premium.', illustration: 'illu-3d-eclairage' },
      { de: 10.5, a: 13, image: 'La caméra virtuelle et son champ.', chapitre: '04 / 07 · Caméra', texte: 'On cadre comme un photographe.', illustration: 'illu-3d-camera' },
      { de: 13, a: 15.5, image: 'Le flacon en rotation, traînées de lumière.', chapitre: '05 / 07 · Animation', texte: 'Quelques secondes bien rythmées.', illustration: 'illu-3d-animation' },
      { de: 15.5, a: 18, image: 'L’image qui se résout tuile par tuile.', chapitre: '06 / 07 · Rendu', texte: 'Le calcul, image par image.', illustration: 'illu-3d-rendu' },
      { de: 18, a: 20.5, image: 'Trois étalonnages côte à côte.', chapitre: '07 / 07 · Étalonnage', texte: 'Les couleurs de la marque.', illustration: 'illu-3d-etalonnage' },
      { de: 20.5, a: 24, image: 'Le flacon fini, posé dans une vraie salle de bain.', chapitre: 'Le résultat', texte: 'Le produit fini, en situation.', illustration: 'illu-flacon-en-situation' },
      { de: 24, a: 28, image: 'Titre centré, la sphère en fond.', texte: 'Les deux qui coûtent le plus cher ? Matériaux et éclairage.', centre: true, fond: 'rayons', noyau: { forme: 'sphere', place: 'fond', intensite: 0.18 } },
    ],
    legende:
      "En 3D, le premier visuel paie le modèle. Les suivants ne paient que le cadrage.\n\nQuelle étape vous paraît la plus floue ? On en fera le prochain carrousel.",
    indicateur: 'taux de visionnage complet',
  },

  {
    ref: 'vid-v-pp-2',
    sujet: 'v-pp-2',
    titre: 'Pourquoi on donne l’analyse avant de vendre',
    entite: 'veolt',
    formatSlug: 'ig-reel',
    pilier: 'positionnement-prix',
    duree: 21,
    tournage: 'Le rapport remis de la main à la main, le vrai questionnaire de veolt.fr dans un téléphone, le plan d’action.',
    plans: [
      { de: 0, a: 3, image: 'Une main tend un rapport d’analyse ouvert, de l’autre côté de la table.', texte: 'On vous donne l’analyse avant de vendre.', illustration: 'illu-analyse-remise' },
      { de: 3, a: 6.5, image: 'Un dossier, une loupe qui fait ressortir une seule ligne.', chapitre: '01 · Pas de plaquette', texte: 'Vous jugez le travail, pas la promesse.', illustration: 'illu-dossier-loupe' },
      { de: 6.5, a: 10, image: 'Le questionnaire de veolt.fr dans un téléphone : la caméra avance sur les choix.', chapitre: '02 · Dix questions', texte: 'Quelques minutes sur veolt.fr.', illustration: 'veolt-questionnaire-1', cadrage: { x: 0.5, y: 0.42, zoom: 1.7 } },
      { de: 10, a: 13.5, image: 'Un plan d’action imprimé, trois étapes repérées.', chapitre: '03 · Sous 24 h', texte: 'Un plan d’action, par écrit.', illustration: 'illu-plan-action' },
      { de: 13.5, a: 17, image: 'Le rapport ouvert, en gros plan.', texte: 'S’il ne vous sert pas, vous ne nous devez rien.', illustration: 'illu-analyse-remise', cadrage: { x: 0.55, y: 0.55, zoom: 1.5 } },
      { de: 17, a: 21, image: 'Écran de fin.', texte: '', fond: 'horizon', scene: { type: 'fin', action: 'Demander l’analyse gratuite', note: 'Gratuit · sans engagement · sous 24 h' } },
    ],
    legende: 'Sans référence client à montrer, on prouve en travaillant d’abord.\n\nSur quoi voulez-vous être challengé : le prévisionnel, le site ou les visuels ?',
    indicateur: 'demandes d’analyse',
  },

  // ── Séries du 25/11/2026 : le contenu réel de veolt.fr, décortiqué ─────
  // Captures réelles dans un téléphone (« Capture réelle · veolt.fr »),
  // illustrations à la charte (« Illustration IA »), prix et délais du site.
  {
    ref: 'vid-v-vf-1',
    sujet: 'v-vf-1',
    titre: 'De la demande au devis, sur veolt.fr',
    entite: 'veolt',
    formatSlug: 'ig-reel',
    pilier: 'coulisses-methode',
    duree: 26,
    tournage: 'Captures réelles de veolt.fr (mobile), une illustration de l’espace client, le délai affiché sur le site.',
    plans: [
      { de: 0, a: 3, image: 'Le questionnaire de veolt.fr dans un téléphone.', texte: 'Un devis précis commence par dix questions.', illustration: 'veolt-questionnaire-1' },
      { de: 3, a: 6, image: 'Étape 2 du questionnaire.', chapitre: '01 · Le questionnaire', texte: 'Quelques minutes, guidé.', illustration: 'veolt-questionnaire-2' },
      { de: 6, a: 9, image: 'Étape 3 : les besoins cochés.', chapitre: '02 · Vos besoins', texte: 'Plusieurs réponses possibles.', illustration: 'veolt-questionnaire-3' },
      { de: 9, a: 12, image: 'L’espace client : l’appel réservé, le devis.', chapitre: '03 · Votre espace client', texte: 'Vous y réservez l’appel de cadrage.', illustration: 'illu-espace-client' },
      { de: 12, a: 16, image: '« Comment ça démarre » sur veolt.fr : la caméra avance jusqu’au délai de 24 h.', chapitre: '04 · Le devis', texte: 'Sous 24 h, par écrit.', illustration: 'veolt-demarrage', cadrage: { x: 0.5, y: 0.72, zoom: 1.8 } },
      { de: 16, a: 19, image: 'La commande : la même page, la caméra sur les étapes.', chapitre: '05 · La commande', texte: 'Un paiement à la commande, le solde à la livraison.', illustration: 'veolt-demarrage', cadrage: { x: 0.5, y: 0.45, zoom: 1.6 } },
      { de: 19, a: 22, image: 'Un devis relu ligne par ligne, coché au stylo.', texte: 'Rien ne démarre avant votre accord.', illustration: 'illu-devis-coche' },
      { de: 22, a: 26, image: 'Écran de fin.', texte: '', fond: 'horizon', scene: { type: 'fin', action: 'Remplir le questionnaire', note: 'Devis sous 24 h · prix affichés' } },
    ],
    legende: 'Chez Veolt, on n’envoie pas de devis au hasard.\n\nQu’est-ce qui vous freine le plus avant de demander un devis ?',
    indicateur: 'clics vers le questionnaire',
  },
  {
    ref: 'vid-v-vf-2',
    sujet: 'v-vf-2',
    titre: 'Nos packs vidéo, ligne par ligne',
    entite: 'veolt',
    formatSlug: 'ig-reel',
    pilier: 'positionnement-prix',
    duree: 24,
    tournage: 'Captures réelles de la page Tarifs de veolt.fr (mobile) et les prix affichés.',
    plans: [
      { de: 0, a: 3, image: 'Le pack Starter sur veolt.fr, dans un téléphone.', texte: '5 vidéos pour 499 € HT. Voilà ce qu’il y a dedans.', illustration: 'veolt-packs-starter' },
      { de: 3, a: 7, image: 'La carte Starter sur veolt.fr : la caméra avance jusqu’au prix.', chapitre: 'Starter · 499 € HT', texte: '5 vidéos de 15 s, 99,80 € la vidéo.', illustration: 'veolt-packs-starter', cadrage: { x: 0.5, y: 0.2, zoom: 1.9 } },
      { de: 7, a: 10, image: 'Le montage : timeline et son.', texte: 'Script, génération IA, montage, musique, sous-titres.', illustration: 'illu-ia-montage' },
      { de: 10, a: 14, image: 'La carte Business sur veolt.fr, recommandée : la caméra avance jusqu’au prix.', chapitre: 'Business · 1 799 € HT', texte: '10 vidéos de 30 s. Le pack recommandé.', illustration: 'veolt-packs-business', cadrage: { x: 0.5, y: 0.2, zoom: 1.9 } },
      { de: 14, a: 17, image: 'La carte Premium sur veolt.fr.', chapitre: 'Premium · 2 499 € HT', texte: '5 vidéos de 60 s, narration cinéma.', illustration: 'veolt-packs-business', cadrage: { x: 0.5, y: 0.8, zoom: 1.8 } },
      { de: 17, a: 20, image: 'Une vidéo finie, dans le fil, sur un téléphone en main.', chapitre: 'À l’unité · dès 119 € HT', texte: '15 s à 119 €, 30 s à 199 €.', illustration: 'illu-ia-en-situation' },
      { de: 20, a: 24, image: 'Écran de fin.', texte: '', fond: 'horizon', scene: { type: 'fin', action: 'Voir les tarifs', note: 'Prix affichés sur veolt.fr' } },
    ],
    legende: 'Le prix d’une vidéo dépend moins de sa durée que du nombre de vidéos préparées ensemble.\n\nCombien de vidéos publiez-vous par mois ?',
    indicateur: 'clics vers les tarifs',
  },
  {
    ref: 'vid-v-vf-3',
    sujet: 'v-vf-3',
    titre: 'Une vidéo fabriquée avec l’IA',
    entite: 'veolt',
    formatSlug: 'ig-reel',
    pilier: 'coulisses-methode',
    duree: 29,
    tournage: 'Le geste à chaque étape, sur la même canette concept (illustrations du pack). Une capture de notre écran pendant une vraie production peut remplacer chaque plan.',
    plans: [
      { de: 0, a: 3, image: 'Le prompt tapé, les quatre versions générées.', texte: 'Cette vidéo a commencé par une phrase.', illustration: 'illu-ia-prompt' },
      { de: 3, a: 6, image: 'L’esquisse et le script.', chapitre: '01 · Le script', texte: 'Le message d’abord.', illustration: 'illu-canette-esquisse' },
      { de: 6, a: 9, image: 'Le champ du prompt, en gros plan.', chapitre: '02 · Le prompt', texte: 'Le sujet, la lumière, le cadre.', illustration: 'illu-ia-prompt', cadrage: { x: 0.62, y: 0.3, zoom: 1.5 } },
      { de: 9, a: 12, image: 'Huit versions générées.', chapitre: '03 · La génération', texte: 'Plusieurs versions en quelques minutes.', illustration: 'illu-ia-tri' },
      { de: 12, a: 15, image: 'Deux versions gardées, cochées.', chapitre: '04 · Le tri', texte: 'L’IA propose, on choisit.', illustration: 'illu-ia-tri', cadrage: { x: 0.36, y: 0.38, zoom: 1.6 } },
      { de: 15, a: 18, image: 'La timeline de montage.', chapitre: '05 · Le montage', texte: 'Le rythme, les coupes, l’ordre.', illustration: 'illu-ia-montage' },
      { de: 18, a: 21, image: 'La piste son et la table de mixage.', chapitre: '06 · Le son et les formats', texte: 'Musique, sous-titres, un format par réseau.', illustration: 'illu-ia-montage', cadrage: { x: 0.5, y: 0.72, zoom: 1.6 } },
      { de: 21, a: 25, image: 'La vidéo finie, sur un téléphone en main.', chapitre: 'Le résultat', texte: 'Dans le fil, sur le téléphone de vos clients.', illustration: 'illu-ia-en-situation' },
      { de: 25, a: 29, image: 'Écran de fin.', texte: '', fond: 'horizon', scene: { type: 'fin', action: 'Voir les packs vidéo', note: 'Génération IA + montage · dès 499 € HT' } },
    ],
    legende: 'L’IA fait gagner des jours de tournage. Le choix, le rythme et le message restent un travail humain.\n\nQu’est-ce qui vous retient d’utiliser l’IA pour vos vidéos ?',
    indicateur: 'taux de visionnage complet',
  },
  {
    ref: 'vid-v-vf-4',
    sujet: 'v-vf-4',
    titre: 'Atelier Noir, du zoning au site en ligne',
    entite: 'veolt',
    formatSlug: 'ig-reel',
    pilier: 'montrer-le-travail',
    duree: 23,
    tournage: 'Le concept Atelier Noir de veolt.fr, étape par étape (étapes illustrées à partir du vrai concept).',
    plans: [
      { de: 0, a: 3, image: 'Le zoning en blocs gris.', texte: 'Ce site a commencé par des blocs gris.', illustration: 'illu-an-zoning' },
      { de: 3, a: 6, image: 'La grille et les blocs.', chapitre: '01 · Le zoning', texte: 'La promesse, le produit, le bouton.', illustration: 'illu-an-zoning', cadrage: { x: 0.45, y: 0.4, zoom: 1.3 } },
      { de: 6, a: 9, image: 'La maquette en noir et blanc.', chapitre: '02 · La maquette', texte: 'La typographie et le flacon, sans effet.', illustration: 'illu-an-maquette' },
      { de: 9, a: 12, image: 'Le code et la page en direct.', chapitre: '03 · Le développement', texte: 'Rapide sur mobile, avec ses interactions.', illustration: 'illu-an-developpement' },
      { de: 12, a: 16, image: 'Atelier Noir ouvert en boutique.', chapitre: 'Le résultat', texte: 'Le site, en situation.', illustration: 'illu-atelier-noir-en-boutique' },
      { de: 16, a: 19, image: 'Les quatre étapes du même site, côte à côte sur la table.', texte: 'Un beau site se décide au zoning.', illustration: 'illu-an-etapes' },
      { de: 19, a: 23, image: 'Écran de fin.', texte: '', fond: 'horizon', scene: { type: 'fin', action: 'Demander l’analyse gratuite', note: 'Sites web dès 1 490 € HT' } },
    ],
    legende: 'Un beau site se décide au zoning, bien avant la première couleur.\n\nSur votre site, comprend-on en trois secondes ce que vous vendez ?',
    indicateur: 'enregistrements',
  },
  {
    ref: 'vid-v-vf-5',
    sujet: 'v-vf-5',
    titre: 'Une canette, de l’esquisse à la pub',
    entite: 'veolt',
    formatSlug: 'ig-reel',
    pilier: 'montrer-le-travail',
    duree: 25,
    tournage: 'Une canette concept dessinée pour l’exemple, de l’esquisse à la mise en situation (illustrations du pack, même canette d’un bout à l’autre).',
    plans: [
      { de: 0, a: 3, image: 'La canette tenue en main, en terrasse.', texte: 'Une canette, de l’esquisse à la pub.', illustration: 'illu-canette-en-main' },
      { de: 3, a: 6, image: 'L’esquisse au feutre.', chapitre: '01 · L’esquisse', texte: 'La silhouette, au feutre.', illustration: 'illu-canette-esquisse' },
      { de: 6, a: 9, image: 'Le maillage à l’écran.', chapitre: '02 · Le modèle 3D', texte: 'Fait une fois pour toutes.', illustration: 'illu-canette-modele' },
      { de: 9, a: 12, image: 'L’étiquette à plat, puis enroulée.', chapitre: '03 · L’étiquette', texte: 'Dessinée à plat, enroulée au millimètre.', illustration: 'illu-canette-etiquette' },
      { de: 12, a: 15, image: 'Quatre coloris côte à côte.', chapitre: '04 · Les déclinaisons', texte: 'Quatre coloris, zéro photo.', illustration: 'illu-canette-coloris' },
      { de: 15, a: 18, image: 'La canette en situation, gros plan.', chapitre: '05 · En situation', texte: 'N’importe quel décor, sans séance photo.', illustration: 'illu-canette-en-main', cadrage: { x: 0.62, y: 0.45, zoom: 1.5 } },
      { de: 18, a: 21, image: 'Les quatre étapes de la même canette, alignées sur l’établi.', chapitre: 'Le rendu 3D · dès 119 € HT', texte: 'Un modèle, toutes les mises en scène.', illustration: 'illu-canette-etapes' },
      { de: 21, a: 25, image: 'Écran de fin.', texte: '', fond: 'horizon', scene: { type: 'fin', action: 'Demander un devis', note: 'Rendus 3D dès 119 € HT' } },
    ],
    legende: 'Une fois la canette modélisée, chaque nouvelle mise en scène ne coûte qu’un rendu.\n\nVotre produit a-t-il déjà un modèle 3D ?',
    indicateur: 'enregistrements',
  },
  {
    ref: 'vid-v-vf-6',
    sujet: 'v-vf-6',
    titre: 'L’analyse gratuite, en dix étapes',
    entite: 'veolt',
    formatSlug: 'ig-reel',
    pilier: 'positionnement-prix',
    duree: 28,
    tournage: 'Captures réelles du questionnaire de veolt.fr (mobile), le délai affiché sur le site.',
    plans: [
      { de: 0, a: 3, image: 'Le questionnaire dans un téléphone.', texte: 'Une analyse gratuite, en dix étapes.', illustration: 'veolt-questionnaire-1' },
      { de: 3, a: 6, image: 'Étape 1 : le secteur.', chapitre: 'Étape 1', texte: 'Votre secteur.', illustration: 'veolt-questionnaire-1' },
      { de: 6, a: 9, image: 'Étape 2 : où en est le projet.', chapitre: 'Étape 2', texte: 'Où en est le projet.', illustration: 'veolt-questionnaire-2' },
      { de: 9, a: 12, image: 'Étape 3 : les besoins.', chapitre: 'Étape 3', texte: 'Ce dont vous avez besoin.', illustration: 'veolt-questionnaire-3' },
      { de: 12, a: 16, image: 'L’étape des besoins : la caméra avance sur les cases cochées.', chapitre: 'Étapes 4 à 10', texte: 'Objectifs, budget, équipe : des cases à cocher.', illustration: 'veolt-questionnaire-3', cadrage: { x: 0.5, y: 0.5, zoom: 1.7 } },
      { de: 16, a: 20, image: 'Un plan d’action imprimé, remis sur la table.', chapitre: 'La réponse · sous 24 h', texte: 'Des recommandations concrètes.', illustration: 'illu-plan-action' },
      { de: 20, a: 24, image: 'Le rapport remis de la main à la main.', texte: 'Un plan d’action clair pour la suite.', illustration: 'illu-analyse-remise' },
      { de: 24, a: 28, image: 'Écran de fin.', texte: '', fond: 'horizon', scene: { type: 'fin', action: 'Demander l’analyse gratuite', note: 'Gratuit · sans engagement · sous 24 h' } },
    ],
    legende: 'Donner l’analyse avant de vendre, c’est laisser le client juger sur pièce.\n\nQue voudriez-vous qu’un expert vous dise en premier ?',
    indicateur: 'demandes d’analyse',
  },
  {
    ref: 'vid-v-vf-7',
    sujet: 'v-vf-7',
    titre: 'Trois sites, trois objectifs',
    entite: 'veolt',
    formatSlug: 'ig-reel',
    pilier: 'montrer-le-travail',
    duree: 22,
    tournage: 'Trois concepts de veolt.fr : Novo et Elysia en situation, Wealth en capture réelle de sa vidéo.',
    plans: [
      { de: 0, a: 3, image: 'Elysia sur une tablette, au salon.', texte: 'Trois sites, trois objectifs.', illustration: 'illu-elysia-en-situation' },
      { de: 3, a: 7, image: 'Novo sur un portable.', chapitre: '01 · Novo, la vitrine', texte: 'On comprend l’offre sans défiler.', illustration: 'illu-novo-en-situation' },
      { de: 7, a: 11, image: 'Elysia, le catalogue.', chapitre: '02 · Elysia, l’e-commerce', texte: 'Le parcours suit le panier.', illustration: 'illu-elysia-en-situation', cadrage: { x: 0.5, y: 0.72, zoom: 1.4 } },
      { de: 11, a: 15, image: 'Wealth, image tirée de sa vidéo.', chapitre: '03 · Wealth, le site animé', texte: 'Le mouvement guide l’œil.', illustration: 'veolt-wealth' },
      { de: 15, a: 18, image: 'Les trois concepts côte à côte : portable, tablette, téléphone.', texte: 'Le choix se fait sur l’objectif.', illustration: 'illu-trois-concepts' },
      { de: 18, a: 22, image: 'Écran de fin.', texte: '', fond: 'horizon', scene: { type: 'fin', action: 'Demander l’analyse gratuite', note: 'Sites web dès 1 490 € HT' } },
    ],
    legende: 'Le bon type de site se choisit sur ce qu’il doit produire : un contact, une vente, une impression.\n\nVotre site doit-il vous faire appeler, acheter, ou remarquer ?',
    indicateur: 'enregistrements',
  },

  // ── MagistrIA ───────────────────────────────────────────────────────────
  {
    ref: 'vid-m-1',
    sujet: 'm-sd-1',
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
    sujet: 'm-pi-1',
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

  // ── Cas d'usage : démonstrations longues (45–60 s), scènes dessinées ─────
  //
  // Construits uniquement sur ce qui est vrai : prix affichés, fonctions du
  // produit réellement livrées, dossiers et chiffres d'EXEMPLE signalés comme
  // tels. Aucun client, aucun résultat, aucun témoignage.
  {
    ref: 'vid-v-cu-1',
    titre: 'Cas type : du projet au rendez-vous bancaire',
    entite: 'veolt',
    formatSlug: 'ig-video',
    cadre: '9:16',
    casUsage: true,
    pilier: 'demonter-un-chiffre',
    duree: 51,
    tournage:
      "Tout est dessiné par le studio : aucun tournage. Le prévisionnel est un EXEMPLE construit pour la vidéo, et l'écran le dit. Vérifier la liste des livrables contre la page de l'offre avant validation.",
    plans: [
      { de: 0, a: 3.5, image: 'Titre seul, plein cadre.', texte: 'Votre banquier lit trois lignes. Pas trente pages.' },
      { de: 3.5, a: 7.5, image: 'Titre seul.', texte: 'Cas type : un projet qui cherche son premier prêt.' },
      {
        de: 7.5,
        a: 17.5,
        image: 'Prévisionnel d’exemple, trois lignes repérées une à une.',
        texte: 'Les trois lignes qu’il regarde',
        scene: {
          type: 'tableur',
          fenetre: 'Prévisionnel · EXEMPLE — chiffres fictifs',
          colonnes: ['', 'An 1', 'An 2', 'An 3'],
          lignes: [
            { libelle: 'Chiffre d’affaires', valeurs: ['180 k€', '240 k€', '290 k€'] },
            { libelle: 'Charges fixes', valeurs: ['132 k€', '150 k€', '164 k€'] },
            { libelle: 'Trésorerie au plus bas', valeurs: ['−8 k€', '12 k€', '31 k€'] },
            { libelle: 'Annuités d’emprunt', valeurs: ['18 k€', '18 k€', '18 k€'] },
            { libelle: 'Résultat net', valeurs: ['4 k€', '38 k€', '61 k€'] },
          ],
          reperes: [
            { ligne: 2, note: '1. Le point bas de trésorerie' },
            { ligne: 3, note: '2. Les annuités face au résultat' },
            { ligne: 0, note: '3. L’hypothèse de chiffre d’affaires' },
          ],
        },
      },
      { de: 17.5, a: 21.5, image: 'Titre seul.', texte: 'Un point bas négatif ? Le prêt se joue là.' },
      {
        de: 21.5,
        a: 28.5,
        image: 'Liste qui se construit.',
        texte: 'Ce que nous préparons avec vous',
        scene: {
          type: 'liste',
          items: [
            'Le prévisionnel sur trois ans, ligne par ligne',
            'Le plan de trésorerie, mois par mois',
            'Les réponses aux questions du banquier',
          ],
        },
      },
      {
        de: 28.5,
        a: 32.5,
        image: 'Le prix affiché, qui défile.',
        texte: 'Business plan et analyse financière',
        scene: { type: 'chiffre', valeur: '490 €', legende: 'HT, à partir de — le prix affiché' },
      },
      {
        de: 32.5,
        a: 39.5,
        image: 'Les trois offres et leurs prix.',
        texte: 'Une équipe pour lancer, faire connaître et financer',
        scene: {
          type: 'liste',
          items: ['Business plan — dès 490 € HT', 'Site web et web 3D — dès 1 490 € HT', 'Vidéo, pub 3D et motion — dès 119 € HT'],
        },
      },
      {
        de: 39.5,
        a: 43.5,
        image: 'Le délai, qui défile.',
        texte: 'Votre devis',
        scene: { type: 'chiffre', valeur: '24 h', legende: 'de délai de réponse — un engagement tenu' },
      },
      { de: 43.5, a: 47, image: 'Titre seul.', texte: 'On commence par une analyse gratuite de votre projet.' },
      {
        de: 47,
        a: 51,
        image: 'Écran de fin, bouton d’action.',
        texte: 'Votre projet mérite trois lignes solides.',
        scene: { type: 'fin', action: 'Demander l’analyse gratuite' },
      },
    ],
    legende:
      "Un banquier ne lit pas trente pages : il cherche le point bas de trésorerie, la capacité à rembourser et l'hypothèse de chiffre d'affaires.\n\nBusiness plan et analyse financière dès 490 € HT. On commence par une analyse gratuite de votre projet.",
    indicateur: 'taux de visionnage complet',
  },
  {
    ref: 'vid-v-cu-2',
    titre: 'Cas type : une référence produit, quatorze visuels',
    entite: 'veolt',
    formatSlug: 'ig-video',
    cadre: '9:16',
    casUsage: true,
    pilier: 'montrer-le-travail',
    duree: 46,
    tournage:
      "Tout est dessiné par le studio. Remplacer les cartes des plans 2 et 5 par de vrais rendus 3D dès qu'ils existent (médiathèque) : la vidéo y gagne tout.",
    plans: [
      { de: 0, a: 3.5, image: 'Le rendu 3D final, plein cadre.', texte: 'Ce produit n’a jamais été photographié.' },
      { de: 3.5, a: 7.5, image: 'Rendu 3D sous un autre angle.', texte: 'Cas type : une marque qui a besoin de visuels pour chaque référence.' },
      {
        de: 7.5,
        a: 17,
        image: 'Comparatif en deux colonnes.',
        texte: 'Photo studio ou packshot 3D ?',
        scene: {
          type: 'comparatif',
          gauche: { titre: 'Photo studio', points: ['La matière réelle', 'Un studio à relouer à chaque déclinaison', 'Moins chère sous cinq visuels'] },
          droite: { titre: 'Packshot 3D', points: ['Quatorze angles, trois coloris', 'Le fond change sans studio', 'Plus rentable au-delà de cinq visuels'] },
        },
      },
      {
        de: 17,
        a: 26,
        image: 'Le pipeline, étape par étape.',
        texte: 'Sept étapes, faites une seule fois',
        scene: { type: 'liste', items: ['Modélisation', 'Matériaux', 'Éclairage', 'Caméra', 'Animation', 'Rendu', 'Étalonnage'] },
      },
      { de: 26, a: 31, image: 'Grille de déclinaisons.', texte: 'Le premier visuel paie le modèle. Les suivants ne paient que le cadrage.' },
      {
        de: 31,
        a: 35,
        image: 'Le prix affiché, qui défile.',
        texte: 'Vidéo, pub 3D et motion',
        scene: { type: 'chiffre', valeur: '119 €', legende: 'HT, à partir de — le prix affiché' },
      },
      { de: 35, a: 41, image: 'Titre seul.', texte: 'Au-delà de cinq visuels par référence, la 3D devient le format tenable.' },
      {
        de: 41,
        a: 46,
        image: 'Écran de fin, bouton d’action.',
        texte: 'Combien de visuels par référence et par an ?',
        scene: { type: 'fin', action: 'Demander l’analyse gratuite' },
      },
    ],
    legende:
      "La 3D ne remplace pas la photo. Elle remplace la deuxième séance photo.\n\nEn dessous de cinq visuels par référence, la photo reste moins chère ; au-delà, le modèle 3D fait une fois rend les variantes presque gratuites. Vidéo, pub 3D et motion dès 119 € HT.",
    indicateur: 'taux de visionnage complet',
  },
  {
    ref: 'vid-m-cu-1',
    titre: 'Cas d’usage : un refus de garantie après un sinistre cyber',
    entite: 'magistria',
    formatSlug: 'li-video',
    casUsage: true,
    pilier: 'sinistre-decortique',
    duree: 60,
    tournage:
      "Tout est dessiné par le studio, sur un dossier d'EXEMPLE construit pour la vidéo — jamais une pièce de dossier réel, même anonymisée. L'écran montre des fonctions livrées : raisonnement en trois étapes, citations classées, refus de conclure quand les pièces manquent.",
    plans: [
      { de: 0, a: 4, image: 'Titre seul.', texte: 'Un refus de garantie tient-il devant un juge ?' },
      { de: 4, a: 8.5, image: 'Titre seul.', texte: 'Cas d’usage : un gestionnaire de sinistres face à un rapport d’expertise cyber.' },
      {
        de: 8.5,
        a: 16.5,
        image: 'Les trois phrases qui comptent.',
        texte: 'Dans le rapport, trois phrases comptent',
        scene: {
          type: 'liste',
          items: [
            'La date de compromission — elle commande le délai de déclaration',
            'Le vecteur d’entrée — il commande l’exclusion',
            'Les sauvegardes — elles commandent le montant',
          ],
        },
      },
      {
        de: 16.5,
        a: 30,
        image: 'L’écran d’analyse sur un dossier d’exemple.',
        texte: 'L’outil instruit, étape par étape',
        scene: {
          type: 'analyse',
          fenetre: 'magistrai.fr · Analyse — dossier d’exemple',
          extrait:
            'Article 7 — Exclusions. Sont exclus les dommages résultant d’un défaut de mise à jour des systèmes d’information de l’assuré.',
          surligne: 'défaut de mise à jour',
          etapes: [
            { label: 'MAJEURE', texte: 'Art. L. 113-1 C. assur. : une exclusion n’est opposable que si elle est formelle et limitée.' },
            { label: 'MINEURE', texte: 'La clause vise un « défaut de mise à jour » sans en fixer le périmètre ni le délai.' },
            { label: 'CONCLUSION', texte: 'Le caractère limité est discutable. La décision revient au gestionnaire.' },
          ],
          citations: [
            { ref: 'Code des assurances, art. L. 113-1', etat: 'verifiee' },
            { ref: 'Rapport d’expertise, p. 12', etat: 'hors-corpus' },
          ],
        },
      },
      { de: 30, a: 34.5, image: 'Titre seul.', texte: 'Chaque affirmation porte sa source. Chaque citation, son état.' },
      { de: 34.5, a: 39, image: 'Titre seul.', texte: 'Et quand les pièces manquent, l’outil le dit : « je ne peux pas conclure ».' },
      {
        de: 39,
        a: 46,
        image: 'Les sources réellement branchées.',
        texte: 'Les sources branchées',
        scene: { type: 'liste', items: ['Légifrance / DILA', 'Bases CVE / NIST', 'Décisions de la CNIL', 'Alertes de l’ANSSI'] },
      },
      { de: 46, a: 50, image: 'Titre seul.', texte: 'L’IA propose. Le gestionnaire décide.' },
      {
        de: 50,
        a: 55,
        image: 'Le prix, qui défile.',
        texte: 'Pour juger sur pièce',
        scene: { type: 'chiffre', valeur: '0 €', legende: 'Freemium — 10 crédits par mois, sans carte bancaire' },
      },
      {
        de: 55,
        a: 60,
        image: 'Écran de fin, bouton d’action.',
        texte: 'Testez-le sur un dossier d’exemple.',
        scene: { type: 'fin', action: 'Essayer gratuitement' },
      },
    ],
    legende:
      "Une exclusion n'est opposable que si elle est formelle et limitée (C. assur., art. L. 113-1). Encore faut-il le montrer, pièce par pièce.\n\nMagistrIA instruit : règle citée, faits qualifiés, conclusion laissée au gestionnaire. Et quand les pièces manquent, il le dit. Freemium sans carte bancaire.",
    indicateur: 'taux de visionnage complet',
  },
  {
    ref: 'vid-m-cu-2',
    titre: 'Cas d’usage : chiffrer un risque cyber avec FAIR',
    entite: 'magistria',
    formatSlug: 'li-video',
    casUsage: true,
    pilier: 'methode-nommee',
    duree: 50,
    tournage:
      "Tout est dessiné par le studio, sur un scénario d'EXEMPLE. Aucun montant n'est affiché : la vidéo montre la méthode, pas un résultat.",
    plans: [
      { de: 0, a: 4, image: 'Titre seul.', texte: 'Un risque cyber « élevé », ça vaut combien ?' },
      { de: 4, a: 8.5, image: 'Titre seul.', texte: 'Cas d’usage : une direction juridique doit chiffrer un risque, pas le colorier.' },
      {
        de: 8.5,
        a: 15.5,
        image: 'La décomposition FAIR.',
        texte: 'La méthode FAIR décompose',
        scene: { type: 'liste', items: ['La fréquence d’un événement', 'L’ampleur de la perte', 'Une distribution en euros — pas une couleur'] },
      },
      {
        de: 15.5,
        a: 27.5,
        image: 'L’écran d’analyse sur un scénario d’exemple.',
        texte: 'Hypothèses d’un côté, résultat de l’autre',
        scene: {
          type: 'analyse',
          fenetre: 'magistrai.fr · FAIR — scénario d’exemple',
          extrait: 'Scénario : un rançongiciel chiffre la messagerie et les partages de fichiers pendant trois jours.',
          surligne: 'rançongiciel',
          etapes: [
            { label: 'HYPOTHÈSES', texte: 'Fréquence et ampleur saisies séparément, chacune modifiable.' },
            { label: 'CALCUL', texte: 'La perte annuelle est simulée selon la méthode FAIR.' },
            { label: 'RÉSULTAT', texte: 'Une fourchette en euros, les hypothèses affichées à côté.' },
          ],
          citations: [{ ref: 'Méthode Open FAIR (The Open Group)', etat: 'verifiee' }],
        },
      },
      { de: 27.5, a: 32.5, image: 'Titre seul.', texte: 'Changer une hypothèse ne refait pas tout : on voit ce qui bouge, et pourquoi.' },
      {
        de: 32.5,
        a: 40,
        image: 'Les méthodes nommées.',
        texte: 'Les méthodes nommées dans l’outil',
        scene: {
          type: 'liste',
          items: ['FAIR — le risque en euros', 'EBIOS Risk Manager — la méthode de l’ANSSI', 'Le syllogisme juridique — majeure, mineure, conclusion'],
        },
      },
      {
        de: 40,
        a: 45,
        image: 'Le prix, qui défile.',
        texte: 'Offre Pro',
        scene: { type: 'chiffre', valeur: '59 €', legende: 'HT par mois — pour un juriste ou un avocat indépendant' },
      },
      {
        de: 45,
        a: 50,
        image: 'Écran de fin, bouton d’action.',
        texte: 'Chiffrez votre premier risque.',
        scene: { type: 'fin', action: 'Essayer gratuitement' },
      },
    ],
    legende:
      "Un risque « élevé » ne se budgète pas. La méthode FAIR décompose un risque en fréquence et en ampleur de perte, puis produit une distribution en euros.\n\nDans MagistrIA, les hypothèses restent affichées à côté du résultat : on peut en changer une sans refaire l'autre.",
    indicateur: 'taux de visionnage complet',
  },

  // ── Motion design (11/11) : inspirés des vidéos de lancement fournies ────
  //
  // Chapitres, écran produit vivant, sous-titres karaoké, documents, marque,
  // récap coché, fin complète. Interfaces fidèles, données d'EXEMPLE dites.
  {
    ref: 'vid-m-v2-1',
    titre: 'Du dossier au courrier de position',
    entite: 'magistria',
    formatSlug: 'li-video',
    cadre: '9:16',
    casUsage: true,
    pilier: 'sinistre-decortique',
    duree: 50.5,
    tournage:
      "Tout est dessiné par le studio. Dossier d'EXEMPLE, mention à l'écran. Les deux articles cités (C. assur. L. 113-1 et L. 112-4) sont réels ; aucune décision de justice n'est citée faute de référence vérifiée.",
    plans: [
      {
        de: 0,
        a: 6.5,
        image: 'Trois pièces qui se posent sur le bureau de nuit (clip Higgsfield), puis s’éparpillent.',
        clip: 'magistria-bureau',
        texte: 'Un rapport d’expertise. Des conditions générales.',
        accent: 'Une question : le sinistre est-il couvert ?',
        centre: true,
        fond: 'etoiles',
        noyau: { forme: 'cerveau', place: 'fond', construction: true },
        scene: { type: 'documents', items: ['Rapport d’expertise', 'Conditions générales', 'Contrat'], dispersion: true },
      },
      { de: 6.5, a: 10, image: 'Le logotype en 3D (Blender).', clip: 'magistria-logo-3d', texte: '', fond: 'etoiles', scene: { type: 'marque' }, noyau: { forme: 'cerveau', place: 'fond', onde: true, cadran: true, intensite: 0.2 } },
      {
        de: 10,
        a: 18,
        image: 'Les pièces lues, la chronologie posée.',
        texte: 'Le dossier lu pour vous.',
        chapitre: '01 / 03 · Analyse de sinistre',
        fond: 'horizon',
        scene: {
          type: 'app',
          fenetre: 'MagistrIA · espace de travail',
          onglets: ['Analyse', 'Recherche juridique', 'Rédaction'],
          elements: [
            {
              type: 'fichiers',
              items: [
                { nom: 'Rapport_expertise_cyber.pdf', etat: '✓ lu' },
                { nom: 'Police_assurance.pdf', etat: '✓ lu' },
                { nom: 'Constat_huissier.jpg', etat: '✓ OCR' },
              ],
              chronologie: [
                { quand: 'J', texte: 'Intrusion détectée', tag: 'Rapport p. 4' },
                { quand: 'J+2', texte: 'Sinistre déclaré', tag: 'Police art. 7' },
              ],
            },
          ],
          flux: ['Rapport', 'Police', 'Chronologie'],
          mention: 'Exemple d’interface · données fictives',
        },
      },
      {
        de: 18,
        a: 31,
        image: 'La question, les sources, la réponse sourcée ; le réseau de nœuds derrière le verre (clip Higgsfield).',
        clip: 'magistria-reseau',
        texte: 'Chaque phrase, sa source.',
        chapitre: '02 / 03 · Recherche juridique',
        fond: 'horizon',
        scene: {
          type: 'app',
          fenetre: 'MagistrIA · espace de travail',
          onglets: ['Recherche juridique', 'Jurisprudence', 'Conformité'],
          elements: [
            { type: 'question', texte: 'Une clause d’exclusion pour défaut de mise à jour est-elle opposable à l’assuré ?' },
            { type: 'sources', items: ['C. assur., art. L. 113-1', 'C. assur., art. L. 112-4'] },
            {
              type: 'reponse',
              titre: 'Réponse · Assurance',
              texte:
                'Une exclusion n’est opposable que si elle est **formelle et limitée** [1] et rédigée en **caractères très apparents** [2]. Ici, le « défaut de mise à jour » n’est pas défini : son caractère limité est discutable.',
            },
            {
              type: 'bloc',
              titre: 'À vérifier avant de conclure',
              ton: 'alerte',
              items: ['La police produite est-elle celle en vigueur au jour du sinistre ?', 'La clause figure-t-elle aux conditions particulières ?'],
            },
          ],
          flux: ['Textes', 'Réponse', 'Points à vérifier'],
          mention: 'Exemple d’interface · données fictives',
        },
      },
      {
        de: 31,
        a: 40,
        image: 'Le courrier qui s’écrit, puis la validation.',
        texte: 'Le courrier, prêt à relire.',
        chapitre: '03 / 03 · Rédaction',
        fond: 'horizon',
        annotation: 'vous relisez,\nvous signez',
        scene: {
          type: 'app',
          fenetre: 'MagistrIA · espace de travail',
          onglets: ['Rédaction', 'Analyse', 'Recherche juridique'],
          elements: [
            {
              type: 'courrier',
              titre: 'Courrier de position',
              tag: 'Brouillon · à valider',
              texte: 'Madame, Monsieur,\nNous accusons réception de votre déclaration de sinistre. Après analyse des pièces versées, nous vous informons de notre position sur la garantie.',
            },
            { type: 'clic', avant: 'Brouillon', libelle: 'Courrier de position', bouton: 'Valider', apres: 'Validé par vous', toast: 'Rien ne part sans votre accord' },
          ],
          flux: ['Analyse', 'Brouillon', 'Validation'],
          mention: 'Exemple d’interface · données fictives',
        },
      },
      {
        de: 40,
        a: 45.5,
        image: 'Récapitulatif coché.',
        texte: 'Ce que l’outil fait pour vous',
        chapitre: 'Récap',
        fond: 'etoiles',
        scene: { type: 'recap', items: ['Le dossier analysé', 'Les sources vérifiées', 'Le courrier préparé'] },
      },
      {
        de: 45.5,
        a: 50.5,
        image: 'Écran de fin.',
        texte: '',
        fond: 'etoiles',
        scene: {
          type: 'fin',
          action: 'Essayer gratuitement',
          slogan: ['L’IA propose.', 'Vous décidez.'],
          public: 'Conçu pour les assureurs et mutuelles',
          note: 'Sans carte bancaire · chaque source vérifiable',
        },
      },
    ],
    legende:
      "Un rapport d'expertise, des conditions générales, et une question : le sinistre est-il couvert ?\n\nMagistrIA lit le dossier, cite chaque source (C. assur., art. L. 113-1 et L. 112-4), dit ce qu'il reste à vérifier, et prépare le courrier. Vous relisez, vous décidez.",
    indicateur: 'taux de visionnage complet',
  },
  {
    ref: 'vid-m-v2-2',
    titre: 'Ce que reçoit l’assuré, ce que vous voyez',
    entite: 'magistria',
    formatSlug: 'li-video',
    cadre: '9:16',
    casUsage: true,
    pilier: 'position-ia',
    duree: 31,
    tournage: "Tout est dessiné par le studio, sur un dossier d'EXEMPLE. Sous-titres karaoké : la vidéo se comprend sans le son.",
    plans: [
      {
        de: 0,
        a: 6.5,
        image: 'Le courrier reçu par l’assuré ; derrière le verre, la lettre ouverte sur la table (clip Higgsfield).',
        clip: 'magistria-courrier',
        texte: 'Votre assuré reçoit ça.',
        fond: 'horizon',
        sousTitre: 'Ça, c’est ce que votre assuré reçoit : un courrier clair.',
        scene: {
          type: 'app',
          fenetre: 'Courrier · exemple',
          elements: [
            {
              type: 'courrier',
              titre: 'Position sur la garantie',
              texte: 'Madame, Monsieur,\nAprès analyse des pièces de votre dossier, la clause d’exclusion invoquée doit être formelle et limitée pour vous être opposée.',
            },
          ],
          mention: 'Exemple · données fictives',
        },
      },
      {
        de: 6.5,
        a: 14,
        image: 'Les sources derrière chaque phrase.',
        texte: 'Vous, vous voyez ça.',
        fond: 'horizon',
        annotation: 'les sources !',
        sousTitre: 'Vous, vous voyez chaque source, phrase par phrase.',
        scene: {
          type: 'app',
          fenetre: 'MagistrIA · espace de travail',
          onglets: ['Recherche juridique', 'Jurisprudence', 'Conformité'],
          elements: [
            { type: 'sources', items: ['C. assur., art. L. 113-1', 'C. assur., art. L. 112-4'] },
            {
              type: 'reponse',
              titre: 'Réponse · Assurance',
              texte: 'L’exclusion doit être **formelle et limitée** [1] et figurer en **caractères très apparents** [2].',
            },
          ],
          mention: 'Exemple d’interface · données fictives',
        },
      },
      {
        de: 14,
        a: 20.5,
        image: 'Ce qu’il reste à vérifier.',
        texte: 'Et ce qu’il reste à vérifier.',
        fond: 'horizon',
        sousTitre: 'Et ce qu’il reste à vérifier avant de conclure.',
        scene: {
          type: 'app',
          fenetre: 'MagistrIA · espace de travail',
          elements: [
            {
              type: 'bloc',
              titre: 'À vérifier avant de conclure',
              ton: 'alerte',
              items: ['La police en vigueur au jour du sinistre', 'La clause aux conditions particulières', 'Le lien entre le manquement et le sinistre'],
            },
          ],
          mention: 'Exemple d’interface · données fictives',
        },
      },
      {
        de: 20.5,
        a: 26,
        image: 'Un clic : c’est vous qui validez.',
        texte: 'Et en un clic, vous validez.',
        fond: 'horizon',
        sousTitre: 'Un clic, et c’est vous qui validez.',
        scene: {
          type: 'app',
          fenetre: 'MagistrIA · espace de travail',
          elements: [{ type: 'clic', avant: 'Brouillon', libelle: 'Courrier de position', bouton: 'Valider', apres: 'Validé', toast: 'Rien ne part sans votre accord' }],
          mention: 'Exemple d’interface · données fictives',
        },
      },
      {
        de: 26,
        a: 31,
        image: 'Écran de fin.',
        texte: '',
        fond: 'etoiles',
        scene: {
          type: 'fin',
          action: 'Essayer gratuitement',
          slogan: ['Des sources vérifiées,', 'jamais inventées.'],
          public: 'Conçu pour les assureurs et mutuelles',
          note: 'Essai gratuit · sans carte bancaire',
        },
      },
    ],
    legende:
      "Votre assuré reçoit un courrier clair. Vous, vous voyez chaque source, phrase par phrase, et ce qu'il reste à vérifier.\n\nL'IA propose, vous validez. Rien ne part sans votre accord.",
    indicateur: 'taux de visionnage complet',
  },
  {
    ref: 'vid-v-v2-1',
    titre: 'Vos clients voient votre site. Vous, vous voyez leurs demandes.',
    entite: 'veolt',
    formatSlug: 'ig-video',
    cadre: '9:16',
    casUsage: true,
    pilier: 'montrer-le-travail',
    duree: 31,
    tournage: "Tout est dessiné par le studio : site et boîte de réception sont des MAQUETTES d'exemple, et l'écran le dit.",
    plans: [
      {
        de: 0,
        a: 7,
        image: 'Le site qui défile dans le téléphone.',
        texte: 'Vos clients voient ça.',
        fond: 'horizon',
        sousTitre: 'Ça, c’est ce que vos clients voient.',
        scene: {
          type: 'site',
          nom: 'Maison Exemple',
          metier: 'Menuiserie sur mesure',
          accroche: 'Des cuisines faites pour durer.',
          action: 'Demander un devis',
          services: ['Cuisines sur mesure', 'Escaliers', 'Rénovation'],
          horaires: ['Lundi – vendredi · 8 h – 18 h', 'Samedi · sur rendez-vous'],
          couleur: '#8A5A3C',
          reperes: ['Ce que vous faites, en une phrase', 'Le bouton devis, toujours visible'],
        },
      },
      {
        de: 7,
        a: 14,
        image: 'Les demandes qui arrivent ; derrière le verre, le téléphone qui s’allume (clip Higgsfield).',
        clip: 'veolt-telephone',
        texte: 'Vous, vous voyez ça.',
        fond: 'horizon',
        annotation: 'vos demandes !',
        sousTitre: 'Vous, chaque demande arrive directement chez vous.',
        scene: {
          type: 'app',
          fenetre: 'Boîte de réception · exemple',
          elements: [
            {
              type: 'notifications',
              items: [
                { titre: 'Nouvelle demande de devis', detail: 'Formulaire du site · cuisine sur mesure' },
                { titre: 'Rappel demandé', detail: 'Bouton « Appeler » · 18 h 05' },
                { titre: 'Question sur les délais', detail: 'Formulaire du site' },
              ],
            },
          ],
          mention: 'Exemple d’interface · données fictives',
        },
      },
      {
        de: 14,
        a: 21,
        image: 'Un clic pour répondre.',
        texte: 'Et en un clic, vous répondez.',
        fond: 'horizon',
        sousTitre: 'Un clic, et votre client a sa réponse.',
        scene: {
          type: 'app',
          fenetre: 'Boîte de réception · exemple',
          elements: [
            { type: 'clic', avant: 'Nouveau', libelle: 'Devis · cuisine sur mesure', bouton: 'Répondre', apres: 'Répondu', toast: 'Réponse envoyée' },
          ],
          mention: 'Exemple d’interface · données fictives',
        },
      },
      {
        de: 21,
        a: 26,
        image: 'Le prix affiché, qui défile.',
        texte: 'Sites web et web 3D',
        fond: 'rayons',
        sousTitre: 'Sites web et web 3D, dès 1 490 euros HT.',
        scene: { type: 'chiffre', valeur: '1 490 €', legende: 'HT, à partir de — le prix affiché' },
      },
      {
        de: 26,
        a: 31,
        image: 'Écran de fin.',
        texte: '',
        fond: 'horizon',
        scene: {
          type: 'fin',
          action: 'Demander l’analyse gratuite',
          slogan: ['Votre site,', 'votre meilleur commercial.'],
          public: 'Sites web · Vidéo & 3D · Business plan',
          note: 'Devis sous 24 h · prix affichés',
        },
      },
    ],
    legende:
      "Vos clients voient votre site. Vous, vous voyez leurs demandes, au fil de la journée.\n\nSites web et web 3D dès 1 490 € HT. On commence par une analyse gratuite de votre projet.",
    indicateur: 'taux de visionnage complet',
  },
  {
    ref: 'vid-v-v2-2',
    titre: 'Le site d’un artisan, de A à Z',
    entite: 'veolt',
    formatSlug: 'ig-video',
    cadre: '9:16',
    casUsage: true,
    pilier: 'pedagogie-dirigeant',
    duree: 39,
    tournage: "Tout est dessiné par le studio. Le site est une MAQUETTE d'exemple, dite à l'écran. La liste porte sur ce qu'un site d'artisan doit avoir — pas sur des résultats.",
    plans: [
      { de: 0, a: 4, image: 'Le téléphone qui s’allume (clip Higgsfield), titre centré.', clip: 'veolt-telephone', texte: 'Votre futur client vous cherche sur son téléphone.', centre: true, fond: 'rayons', noyau: { forme: 'sphere', place: 'fond', construction: true, intensite: 0.22 } },
      { de: 4, a: 7.5, image: 'Le logotype en 3D (Blender).', clip: 'veolt-logo-3d', texte: '', fond: 'horizon', scene: { type: 'marque' }, noyau: { forme: 'sphere', place: 'fond', onde: true, intensite: 0.22 } },
      {
        de: 7.5,
        a: 17.5,
        image: 'Le site d’artisan qui défile.',
        texte: 'En cinq secondes : qui, quoi, comment vous joindre.',
        chapitre: '01 / 03 · Ce qu’il doit voir',
        fond: 'horizon',
        scene: {
          type: 'site',
          nom: 'Boulangerie Exemple',
          metier: 'Artisan boulanger',
          accroche: 'Le pain du quartier, cuit chaque matin.',
          action: 'Appeler la boulangerie',
          services: ['Pains au levain', 'Viennoiseries', 'Commandes pour événements'],
          couleur: '#B5651D',
          reperes: ['Qui vous êtes, en une phrase', 'Vos services, sans jargon', 'Le bouton d’appel, toujours visible'],
        },
      },
      {
        de: 17.5,
        a: 25,
        image: 'Les essentiels, un par un.',
        texte: 'Les essentiels d’un site d’artisan',
        chapitre: '02 / 03 · Ce qu’il doit avoir',
        fond: 'horizon',
        annotation: 'souvent oublié',
        scene: { type: 'recap', items: ['Une page par service', 'Un affichage rapide sur mobile', 'Horaires et accès en un coup d’œil', 'Un formulaire de devis simple'] },
      },
      {
        de: 25,
        a: 30,
        image: 'Le prix affiché, qui défile.',
        texte: 'Sites web et web 3D',
        chapitre: '03 / 03 · Le prix, affiché',
        fond: 'rayons',
        scene: { type: 'chiffre', valeur: '1 490 €', legende: 'HT, à partir de — le prix affiché' },
      },
      { de: 30, a: 34, image: 'La boulangerie à l’aube (clip Higgsfield), titre centré.', clip: 'veolt-boulangerie', texte: 'On commence par une analyse gratuite de votre projet.', centre: true, fond: 'rayons' },
      {
        de: 34,
        a: 39,
        image: 'Écran de fin.',
        texte: '',
        fond: 'horizon',
        scene: {
          type: 'fin',
          action: 'Demander l’analyse gratuite',
          slogan: ['Un site qui travaille', 'pendant que vous travaillez.'],
          public: 'Sites web · Vidéo & 3D · Business plan',
          note: 'Devis sous 24 h · prix affichés',
        },
      },
    ],
    legende:
      "Votre futur client vous cherche sur son téléphone. En cinq secondes, il doit savoir qui vous êtes, ce que vous faites, et comment vous joindre.\n\nSites web et web 3D dès 1 490 € HT. On commence par une analyse gratuite.",
    indicateur: 'taux de visionnage complet',
  },
  // ── Motion design v3 : couche 3D des sites, verre, bento, son ─────────────
  {
    ref: 'vid-m-v3-1',
    titre: 'Le cerveau de votre dossier',
    entite: 'magistria',
    formatSlug: 'li-video',
    cadre: '9:16',
    casUsage: true,
    pilier: 'sinistre-decortique',
    duree: 50.5,
    tournage:
      "Tout est dessiné par le studio, son compris (musique et bruitages synthétisés). La 3D reprend le cerveau de particules et le cadran de magistrai.fr. Dossier d'EXEMPLE, mention à l'écran. Articles cités réels (C. assur. L. 113-1, L. 112-4). Prix et freemium tels qu'affichés.",
    plans: [
      {
        de: 0,
        a: 5.5,
        image: 'Le bureau de nuit, les pièces et le stylo (clip Higgsfield) ; sans clip : le cerveau de particules se construit.',
        clip: 'magistria-bureau',
        texte: 'Un sinistre. Trois pièces.',
        accent: 'Une seule question : est-il couvert ?',
        centre: true,
        fond: 'etoiles',
        noyau: { forme: 'cerveau', place: 'fond', construction: true, cadran: true, intensite: 0.22 },
      },
      { de: 5.5, a: 9.5, image: 'Le logotype en 3D (Blender) ; sans clip : la marque et l’onde de choc dans le cerveau.', clip: 'magistria-logo-3d', texte: '', fond: 'etoiles', scene: { type: 'marque' }, noyau: { forme: 'cerveau', place: 'fond', onde: true, cadran: true, intensite: 0.2 } },
      {
        de: 9.5,
        a: 19,
        image: 'Les pièces lues, la chronologie posée ; derrière le verre, les particules forment un document.',
        texte: 'Le dossier, lu pour vous.',
        chapitre: '01 / 03 · Analyse de sinistre',
        fond: 'etoiles',
        noyau: { forme: 'document', place: 'fond', activite: 0.4 },
        scene: {
          type: 'app',
          fenetre: 'MagistrIA · espace de travail',
          onglets: ['Analyse', 'Recherche juridique', 'Rédaction'],
          elements: [
            {
              type: 'fichiers',
              items: [
                { nom: 'Rapport_expertise_cyber.pdf', etat: '✓ lu' },
                { nom: 'Police_assurance.pdf', etat: '✓ lu' },
                { nom: 'Constat_huissier.jpg', etat: '✓ OCR' },
              ],
              chronologie: [
                { quand: 'J', texte: 'Intrusion détectée', tag: 'Rapport p. 4' },
                { quand: 'J+2', texte: 'Sinistre déclaré', tag: 'Police art. 7' },
              ],
            },
          ],
          bulles: [
            { texte: 'Pièces lues', icone: '✓', cote: 'droite', a: 2.2, hauteur: 0.05 },
            { texte: 'Chronologie posée', icone: '⌁', cote: 'gauche', a: 4.6, hauteur: 0.86 },
          ],
          mention: 'Exemple d’interface · données fictives',
        },
      },
      {
        de: 19,
        a: 31.5,
        image: 'La question, les sources, la réponse sourcée ; derrière le verre, le réseau de nœuds (clip Higgsfield).',
        clip: 'magistria-reseau',
        texte: 'Chaque phrase, sa source.',
        chapitre: '02 / 03 · Recherche juridique',
        fond: 'etoiles',
        noyau: { forme: 'balance', place: 'fond', activite: 0.6 },
        scene: {
          type: 'app',
          fenetre: 'MagistrIA · espace de travail',
          onglets: ['Recherche juridique', 'Jurisprudence', 'Conformité'],
          elements: [
            { type: 'question', texte: 'Une exclusion pour défaut de mise à jour est-elle opposable à l’assuré ?' },
            { type: 'sources', items: ['C. assur., art. L. 113-1', 'C. assur., art. L. 112-4'] },
            {
              type: 'reponse',
              titre: 'Réponse · Assurance',
              texte:
                'Une exclusion n’est opposable que si elle est **formelle et limitée** [1] et rédigée en **caractères très apparents** [2]. Ici, le « défaut de mise à jour » n’est pas défini : son caractère limité est discutable.',
            },
            { type: 'bloc', titre: 'À vérifier avant de conclure', ton: 'alerte', items: ['La police produite est-elle celle en vigueur au jour du sinistre ?'] },
          ],
          bulles: [
            { texte: 'L. 113-1 · source liée', icone: '§', cote: 'droite', a: 4.2, hauteur: 0.04 },
            { texte: 'Ce qui reste à vérifier', icone: '!', cote: 'gauche', a: 9.6, hauteur: 0.9 },
          ],
          mention: 'Exemple d’interface · données fictives',
        },
      },
      {
        de: 31.5,
        a: 40,
        image: 'Le courrier qui s’écrit, puis la validation au bouton bordeaux.',
        texte: 'Le courrier, prêt à relire.',
        chapitre: '03 / 03 · Rédaction',
        fond: 'etoiles',
        annotation: 'vous relisez,\nvous signez',
        noyau: { forme: 'bouclier', place: 'fond' },
        scene: {
          type: 'app',
          fenetre: 'MagistrIA · espace de travail',
          onglets: ['Rédaction', 'Analyse', 'Recherche juridique'],
          elements: [
            {
              type: 'courrier',
              titre: 'Courrier de position',
              tag: 'Brouillon · à valider',
              texte: 'Madame, Monsieur,\nAprès analyse des pièces versées, nous vous informons de notre position sur la garantie.',
            },
            { type: 'clic', avant: 'Brouillon', libelle: 'Courrier de position', bouton: 'Valider', apres: 'Validé par vous', toast: 'Rien ne part sans votre accord' },
          ],
          mention: 'Exemple d’interface · données fictives',
        },
      },
      {
        de: 40,
        a: 45.5,
        image: 'Les tuiles de verre s’assemblent : principe, sources, méthodes, prix.',
        texte: 'Ce que vous avez en main',
        fond: 'etoiles',
        noyau: { forme: 'cerveau', place: 'fond', cadran: true },
        scene: {
          type: 'bento',
          tuiles: [
            { titre: 'L’IA propose. Vous décidez.', texte: 'Aucune décision ne part sans votre validation.', icone: '⚖' },
            { titre: 'Sources officielles', texte: 'Légifrance et DILA, liées à chaque phrase.', icone: '§' },
            { titre: 'Méthodes nommées', texte: 'Syllogisme juridique, FAIR, EBIOS RM.', icone: '◈' },
            { titre: 'Freemium', grand: '0 €', texte: '10 crédits par mois, sans carte bancaire.', icone: '✦' },
            { titre: 'Pro', grand: '59 € HT', texte: 'par mois, pour l’avocat ou le juriste indépendant.', icone: '◆' },
          ],
        },
      },
      {
        de: 45.5,
        a: 50.5,
        image: 'Écran de fin, le cadran tourne derrière.',
        texte: '',
        fond: 'etoiles',
        noyau: { forme: 'cerveau', place: 'fond', cadran: true, intensite: 0.16 },
        scene: {
          type: 'fin',
          action: 'Essayer gratuitement',
          slogan: ['L’IA propose.', 'Vous décidez.'],
          public: 'Conçu pour les assureurs et mutuelles',
          note: 'Sans carte bancaire · chaque source vérifiable',
        },
      },
    ],
    legende:
      "Un sinistre, trois pièces, une question : est-il couvert ?\n\nMagistrIA lit le dossier, lie chaque phrase à sa source (C. assur., art. L. 113-1 et L. 112-4), dit ce qu'il reste à vérifier, et prépare le courrier. Vous relisez, vous décidez.\n\nFreemium sans carte bancaire, Pro à 59 € HT/mois.",
    indicateur: 'taux de visionnage complet',
  },
  {
    ref: 'vid-v-v3-1',
    titre: 'Trois métiers, une équipe',
    entite: 'veolt',
    formatSlug: 'ig-reel',
    cadre: '9:16',
    casUsage: true,
    pilier: 'positionnement-prix',
    duree: 44,
    tournage:
      "Tout est dessiné par le studio, son compris. La 3D reprend le champ de particules de veolt.fr : sphère → écran → € → lecture → galaxie, comme au défilement du site. Prix « à partir de » tels qu'affichés ; aucune référence client, aucun résultat chiffré.",
    plans: [
      {
        de: 0,
        a: 4.5,
        image: 'L’orbite (clip Higgsfield) ; sans clip : la sphère de particules se construit.',
        clip: 'veolt-orbite',
        texte: 'Trois métiers. Une seule équipe.',
        centre: true,
        fond: 'horizon',
        noyau: { forme: 'sphere', place: 'fond', construction: true, intensite: 0.22 },
      },
      { de: 4.5, a: 8, image: 'Le logotype en 3D (Blender) ; sans clip : la marque et l’éclat sur la sphère.', clip: 'veolt-logo-3d', texte: '', fond: 'horizon', scene: { type: 'marque' }, noyau: { forme: 'sphere', place: 'fond', onde: true, intensite: 0.22 } },
      {
        de: 8,
        a: 13.5,
        image: 'La sphère devient un écran ; le prix défile.',
        texte: 'Sites web et web 3D',
        chapitre: '01 / 03 · Le site',
        fond: 'horizon',
        noyau: { forme: 'ecran', place: 'bas' },
        scene: { type: 'chiffre', valeur: '1 490 €', legende: 'HT, à partir de — pour le dirigeant dont le site freine l’activité' },
      },
      {
        de: 13.5,
        a: 19,
        image: 'L’écran devient un €.',
        texte: 'Business plan et analyse financière',
        chapitre: '02 / 03 · Le financement',
        fond: 'horizon',
        noyau: { forme: 'euro', place: 'bas' },
        scene: { type: 'chiffre', valeur: '490 €', legende: 'HT, à partir de — pour le porteur de projet qui cherche un financement' },
      },
      {
        de: 19,
        a: 24.5,
        image: 'Le € devient un bouton de lecture.',
        texte: 'Vidéo, pub 3D et motion',
        chapitre: '03 / 03 · L’image',
        fond: 'horizon',
        noyau: { forme: 'lecture', place: 'bas' },
        scene: { type: 'chiffre', valeur: '119 €', legende: 'HT, à partir de — pour la marque, l’e-commerce, le SaaS' },
      },
      {
        de: 24.5,
        a: 33,
        image: 'La demande d’analyse arrive dans l’écran de verre ; derrière, le téléphone qui s’allume (clip Higgsfield).',
        clip: 'veolt-telephone',
        texte: 'Tout commence par une analyse gratuite.',
        fond: 'horizon',
        noyau: { forme: 'sphere', place: 'fond', activite: 0.5 },
        scene: {
          type: 'app',
          fenetre: 'Veolt · demandes',
          onglets: ['Demandes', 'Projets', 'Devis'],
          elements: [
            { type: 'notifications', items: [{ titre: 'Nouvelle demande d’analyse', detail: 'Site vitrine · artisan' }] },
            { type: 'question', texte: 'Mon site ne m’apporte aucun appel. Vous pouvez regarder ?' },
            { type: 'bloc', titre: 'Analyse gratuite · sans engagement', items: ['Ce qui freine le site aujourd’hui', 'Ce qu’on changerait, et pourquoi', 'Le prix, affiché avant tout'] },
            { type: 'clic', avant: 'Reçue', libelle: 'Votre demande', bouton: 'Répondre', apres: 'Réponse envoyée', toast: 'Réponse sous 24 h' },
          ],
          bulles: [
            { texte: 'Sans engagement', icone: '✓', cote: 'droite', a: 1.4, hauteur: 0.04 },
            { texte: 'Réponse sous 24 h', icone: '⏱', cote: 'gauche', a: 6.8, hauteur: 0.9 },
          ],
          mention: 'Exemple d’interface · données fictives',
        },
      },
      {
        de: 33,
        a: 39,
        image: 'Les tuiles de verre s’assemblent.',
        texte: 'Pourquoi c’est simple',
        fond: 'horizon',
        noyau: { forme: 'galaxie', place: 'fond' },
        scene: {
          type: 'bento',
          tuiles: [
            { titre: 'Trois métiers, une équipe', texte: 'Développeurs web, créateurs vidéo, analystes financiers.', icone: '✦' },
            { titre: 'Analyse gratuite', texte: 'Une vraie offre, sans engagement.', icone: '◎' },
            { titre: 'Réponse sous 24 h', texte: 'Un délai qu’on tient.', icone: '⏱' },
            { titre: 'Prix affichés', texte: 'Volontairement sous le marché.', icone: '€' },
            { titre: 'Tout se voit', texte: 'Le périmètre et les livrables, écrits avant de commencer.', icone: '◆' },
          ],
        },
      },
      {
        de: 39,
        a: 44,
        image: 'Écran de fin, la galaxie tourne derrière.',
        texte: '',
        fond: 'horizon',
        noyau: { forme: 'galaxie', place: 'fond', intensite: 0.2 },
        scene: {
          type: 'fin',
          action: 'Demander l’analyse gratuite',
          slogan: ['Trois métiers.', 'Une seule équipe.'],
          public: 'Sites web · Vidéo & 3D · Business plan',
          note: 'Réponse sous 24 h · prix affichés',
        },
      },
    ],
    legende:
      "Un site, un business plan, une vidéo : trois métiers, une seule équipe.\n\nSites web et web 3D dès 1 490 € HT · business plan dès 490 € HT · vidéo et motion dès 119 € HT. Tout commence par une analyse gratuite, sans engagement, avec une réponse sous 24 h.",
    indicateur: 'taux de visionnage complet',
  },

];

export function videosDe(entite: EntiteSlug) {
  return VIDEOS.filter((v) => v.entite === entite);
}
