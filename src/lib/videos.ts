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
import type { Scene, FondPlan, Noyau3D, CameraPlan, TransitionPlan } from './montage';

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
  /** Mouvement de la caméra virtuelle ; absent : automatique. */
  camera?: CameraPlan;
  /** Raccord d'entrée ; absent : automatique. */
  transition?: TransitionPlan;
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
  //
  // Scripts courts repris le 17/11 (motion design v4) : ils disaient « rendu 3D
  // plein cadre » au-dessus d'une carte de texte. Ils montrent maintenant ce
  // qu'ils disent — un objet réellement rendu, une courbe qui se trace, un
  // parcours qui s'allume. Les phrases incrustées n'ont pas changé de sens.
  {
    ref: 'vid-v-1',
    sujet: 'v-mt-1',
    titre: 'Photo studio ou packshot 3D',
    entite: 'veolt',
    formatSlug: 'ig-reel',
    pilier: 'montrer-le-travail',
    duree: 18.4,
    tournage:
      "Aucun tournage : l'objet est un modèle 3D d'EXEMPLE rendu par le studio, et l'écran le dit. Le remplacer par un vrai rendu de production dès qu'il existe (médiathèque).",
    plans: [
      {
        de: 0,
        a: 3.6,
        image: 'Le modèle 3D tourne, plein cadre, et change de coloris.',
        texte: 'Ce produit n’a jamais été photographié.',
        fond: 'horizon',
        scene: { type: 'objet3d', mode: 'heros', etiquettes: ['Coloris 1 / 3', 'Coloris 2 / 3', 'Coloris 3 / 3'], mention: 'Modèle 3D d’exemple · rendu par le studio' },
      },
      {
        de: 3.6,
        a: 7.6,
        image: 'Du maillage brut au rendu : un volet traverse l’objet.',
        texte: 'Il a été modélisé. Une seule fois.',
        fond: 'horizon',
        scene: { type: 'objet3d', mode: 'fil', mention: 'Modèle 3D d’exemple · rendu par le studio' },
      },
      {
        de: 7.6,
        a: 12.6,
        image: 'Six déclinaisons s’alignent : angles et coloris.',
        texte: 'Les variantes ne coûtent que le cadrage.',
        fond: 'horizon',
        scene: {
          type: 'objet3d',
          mode: 'grille',
          etiquettes: ['Face', 'Trois-quarts', 'Plongée', 'Profil', 'Dos', 'Détail'],
          mention: 'Modèle 3D d’exemple · rendu par le studio',
        },
      },
      {
        de: 12.6,
        a: 16,
        image: 'Typographie plein cadre.',
        texte: 'Au-delà de 5 visuels par référence, la photo coûte plus cher.',
        fond: 'rayons',
        scene: { type: 'mots', lignes: [{ texte: 'Au-delà de', petit: true }, { texte: '5 visuels' }, { texte: 'par référence', petit: true }, { texte: 'la photo', accent: true }, { texte: 'coûte plus cher.', accent: true }] },
      },
      {
        de: 16,
        a: 18.4,
        image: 'Le prix affiché, qui défile.',
        texte: 'Vidéo, pub 3D et motion',
        fond: 'horizon',
        noyau: { forme: 'lecture', place: 'bas' },
        scene: { type: 'chiffre', valeur: '119 €', legende: 'HT, à partir de — le prix affiché' },
      },
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
    duree: 22,
    tournage:
      "Tout est dessiné par le studio. La courbe et le tableau sont des EXEMPLES construits pour la vidéo, sans valeur réelle, et l'écran le dit.",
    plans: [
      {
        de: 0,
        a: 3.4,
        image: 'Typographie plein cadre.',
        texte: 'Il ne lit pas votre business plan en entier.',
        fond: 'rayons',
        scene: { type: 'mots', lignes: [{ texte: 'Votre banquier', petit: true }, { texte: 'ne lit pas' }, { texte: 'votre business plan' }, { texte: 'en entier.', accent: true }] },
      },
      {
        de: 3.4,
        a: 9.6,
        image: 'La trésorerie mensuelle se trace ; le creux passe sous zéro.',
        texte: '1. La trésorerie au point le plus bas.',
        accent: 'Pas le résultat.',
        fond: 'horizon',
        scene: {
          type: 'courbe',
          fenetre: 'Trésorerie mensuelle · EXEMPLE',
          points: [22, 15, 7, -3, -9, -6, 2, 10, 17, 25, 31, 38],
          etiquettesX: ['M1', 'M4', 'M8', 'M12'],
          repere: { index: 4, note: 'Le point bas' },
          mention: 'Courbe d’exemple · aucune donnée réelle',
        },
      },
      {
        de: 9.6,
        a: 14.8,
        image: 'Le plan de financement d’exemple, la ligne d’apport repérée.',
        texte: '2. L’apport sur le besoin.',
        accent: 'C’est son risque à lui.',
        fond: 'horizon',
        scene: {
          type: 'tableur',
          fenetre: 'Plan de financement · EXEMPLE — chiffres fictifs',
          colonnes: ['', 'Montant'],
          lignes: [
            { libelle: 'Besoin total', valeurs: ['60 k€'] },
            { libelle: 'Apport personnel', valeurs: ['15 k€'] },
            { libelle: 'Emprunt demandé', valeurs: ['45 k€'] },
          ],
          reperes: [{ ligne: 1, note: 'L’apport, rapporté au besoin' }],
        },
      },
      {
        de: 14.8,
        a: 19,
        image: 'La sphère devient un € ; titre centré.',
        texte: '3. Vendez-vous plus que vous ne pouvez produire ?',
        fond: 'horizon',
        noyau: { forme: 'euro', place: 'bas', activite: 0.3 },
        scene: { type: 'mots', lignes: [{ texte: '3. La capacité', petit: true }, { texte: 'Vendez-vous plus' }, { texte: 'que vous ne pouvez' }, { texte: 'produire ?', accent: true }] },
      },
      {
        de: 19,
        a: 22,
        image: 'Typographie plein cadre.',
        texte: 'Tout le reste sert à justifier ces trois lignes.',
        fond: 'rayons',
        scene: { type: 'mots', lignes: [{ texte: 'Tout le reste', petit: true }, { texte: 'sert à justifier' }, { texte: 'ces trois lignes.', accent: true }] },
      },
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
    duree: 25,
    tournage:
      "Tout est rendu par le studio : un modèle 3D d'EXEMPLE, du maillage au rendu. À doubler d'une capture d'écran du logiciel pendant une production réelle dès qu'elle existe.",
    plans: [
      {
        de: 0,
        a: 4,
        image: 'Le maillage brut, puis le volet : le rendu final.',
        texte: 'De ça… à ça. Sept étapes.',
        fond: 'horizon',
        scene: { type: 'objet3d', mode: 'fil', mention: 'Modèle 3D d’exemple · rendu par le studio' },
      },
      {
        de: 4,
        a: 14.5,
        image: 'Les sept étapes s’allument l’une après l’autre.',
        texte: 'Sept étapes, faites une seule fois',
        fond: 'horizon',
        scene: {
          type: 'parcours',
          etapes: [
            { titre: 'Modélisation', detail: 'la forme' },
            { titre: 'Matériaux', detail: 'ce que la lumière en fait' },
            { titre: 'Éclairage', detail: 'le studio, sans studio' },
            { titre: 'Caméra', detail: 'le cadre et la focale' },
            { titre: 'Animation', detail: 'le mouvement' },
            { titre: 'Rendu', detail: 'le calcul des images' },
            { titre: 'Étalonnage', detail: 'la couleur finale' },
          ],
        },
      },
      {
        de: 14.5,
        a: 19.5,
        image: 'Typographie plein cadre.',
        texte: 'Les deux qui coûtent le plus cher ? Matériaux et éclairage.',
        fond: 'rayons',
        scene: { type: 'mots', lignes: [{ texte: 'Les deux qui coûtent le plus cher ?', petit: true }, { texte: 'Matériaux', accent: true }, { texte: 'et éclairage.', accent: true }] },
      },
      {
        de: 19.5,
        a: 25,
        image: 'Le modèle tourne et change de coloris.',
        texte: 'Le premier visuel paie le modèle. Les suivants, le cadrage.',
        fond: 'horizon',
        scene: { type: 'objet3d', mode: 'heros', mention: 'Modèle 3D d’exemple · rendu par le studio' },
      },
    ],
    legende:
      "En 3D, le premier visuel paie le modèle. Les suivants ne paient que le cadrage.\n\nQuelle étape vous paraît la plus floue ? On en fera le prochain carrousel.",
    indicateur: 'taux de visionnage complet',
  },

  // ── MagistrIA ───────────────────────────────────────────────────────────
  {
    ref: 'vid-m-1',
    sujet: 'm-sd-1',
    titre: 'Trois phrases décident de la garantie',
    entite: 'magistria',
    formatSlug: 'ig-reel',
    pilier: 'sinistre-decortique',
    duree: 23,
    tournage:
      "Tout est dessiné par le studio. Le rapport est un EXEMPLE rédigé pour la vidéo — jamais une pièce de dossier réel, même anonymisée — et l'écran le dit.",
    plans: [
      {
        de: 0,
        a: 3.8,
        image: 'Typographie plein cadre.',
        texte: 'Quarante pages. Trois phrases qui comptent.',
        fond: 'etoiles',
        noyau: { forme: 'document', place: 'fond', construction: true, intensite: 0.18 },
        scene: { type: 'mots', lignes: [{ texte: 'Quarante pages.' }, { texte: 'Trois phrases', accent: true }, { texte: 'qui comptent.' }] },
      },
      {
        de: 3.8,
        a: 18.5,
        image: 'Le rapport défile, s’arrête ; les trois phrases se surlignent, chacune avec ce qu’elle commande.',
        texte: 'Dans un rapport d’expertise cyber',
        fond: 'etoiles',
        scene: {
          type: 'rapport',
          titre: 'Rapport d’expertise · exemple',
          pages: 40,
          phrases: [
            { texte: 'L’intrusion initiale est datée du 3 mars.', note: 'commande le délai de déclaration' },
            { texte: 'L’accès s’est fait par un serveur non mis à jour.', note: 'commande l’exclusion' },
            { texte: 'Les sauvegardes hors ligne sont intactes.', note: 'commande le montant indemnisable' },
          ],
          mention: 'Rapport d’exemple, rédigé pour la vidéo · aucune pièce réelle',
        },
      },
      {
        de: 18.5,
        a: 23,
        image: 'Titre centré, le cerveau de particules derrière.',
        texte: 'Vingt minutes de lecture au lieu de deux heures.',
        accent: 'À condition de savoir quoi chercher.',
        centre: true,
        fond: 'etoiles',
        noyau: { forme: 'cerveau', place: 'fond', cadran: true, intensite: 0.2 },
      },
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
    duree: 22,
    tournage:
      "Tout est dessiné par le studio, sur un dossier d'EXEMPLE incomplet, pour montrer la sortie « pièces insuffisantes ». C'est la démonstration la plus difficile à copier, parce qu'elle suppose que le produit la fasse vraiment.",
    plans: [
      {
        de: 0,
        a: 4.2,
        image: 'La réponse de l’outil à l’écran : il ne conclut pas.',
        texte: 'Notre outil vient de refuser de répondre.',
        fond: 'etoiles',
        scene: {
          type: 'app',
          fenetre: 'MagistrIA · espace de travail',
          elements: [{ type: 'bloc', titre: 'Conclusion impossible en l’état', ton: 'alerte', items: ['Les pièces ne permettent pas de conclure.'] }],
          mention: 'Exemple d’interface · données fictives',
        },
      },
      {
        de: 4.2,
        a: 10,
        image: 'Le dossier : deux pièces lues, une pièce manquante signalée.',
        texte: 'Parce qu’il manque la preuve du lien de causalité.',
        fond: 'etoiles',
        scene: {
          type: 'app',
          fenetre: 'MagistrIA · espace de travail',
          onglets: ['Analyse', 'Recherche juridique', 'Rédaction'],
          elements: [
            {
              type: 'fichiers',
              items: [
                { nom: 'Rapport_expertise.pdf', etat: '✓ lu' },
                { nom: 'Police_assurance.pdf', etat: '✓ lu' },
                { nom: 'Preuve du lien de causalité', etat: 'manquante' },
              ],
            },
          ],
          mention: 'Exemple d’interface · données fictives',
        },
      },
      {
        de: 10,
        a: 16.5,
        image: 'Le raisonnement en trois étapes, la troisième soulignée.',
        texte: 'Règle citée. Faits qualifiés. Et ce qui manque, dit.',
        fond: 'etoiles',
        scene: {
          type: 'parcours',
          etapes: [
            { titre: 'La règle, citée', detail: 'avec sa source' },
            { titre: 'Les faits, qualifiés', detail: 'pièce par pièce' },
            { titre: 'Ce qui manque, dit', detail: '« je ne peux pas conclure »', fort: true },
          ],
        },
      },
      {
        de: 16.5,
        a: 22,
        image: 'Titre centré, le cerveau et son cadran derrière.',
        texte: 'Un outil qui conclut toujours produira une conclusion même quand il n’y en a pas.',
        fond: 'etoiles',
        noyau: { forme: 'cerveau', place: 'fond', cadran: true, intensite: 0.2 },
        scene: { type: 'mots', lignes: [{ texte: 'Un outil qui conclut toujours' }, { texte: 'produira une conclusion' }, { texte: 'même quand il n’y en a pas.', accent: true }] },
      },
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

  // ── Motion design v4 (17/11) : caméra, raccords, scènes qui montrent ──────
  //
  // Quatre films construits en actes — accroche, tension, démonstration,
  // preuve (le prix affiché), appel — au lieu d'une liste de fonctions.
  // Mêmes règles : prix « à partir de » tels qu'affichés, textes de loi réels,
  // courbes, rapports et objets 3D d'EXEMPLE dits à l'écran. Aucun client,
  // aucun résultat, aucun témoignage.
  {
    ref: 'vid-v-v4-1',
    titre: 'Ce produit n’existe pas',
    entite: 'veolt',
    formatSlug: 'ig-reel',
    cadre: '9:16',
    casUsage: true,
    pilier: 'montrer-le-travail',
    duree: 53,
    tournage:
      "Aucun tournage : l'objet est un modèle 3D d'EXEMPLE, modélisé et rendu par le studio image par image (matériaux physiques, éclairage de studio), et l'écran le dit. Le remplacer par un rendu de production dès qu'il existe. Prix « à partir de » tel qu'affiché ; le seuil de cinq visuels est celui du post d'origine.",
    plans: [
      {
        de: 0,
        a: 3.6,
        image: 'Le flacon tourne plein cadre et change de coloris.',
        texte: 'Ce produit n’existe pas.',
        fond: 'horizon',
        scene: { type: 'objet3d', mode: 'heros', etiquettes: ['Coloris 1 / 3', 'Coloris 2 / 3', 'Coloris 3 / 3'], mention: 'Modèle 3D d’exemple · rendu par le studio' },
      },
      {
        de: 3.6,
        a: 7.4,
        image: 'Typographie plein cadre.',
        texte: 'Aucun studio. Aucune photo. Un modèle 3D.',
        fond: 'rayons',
        scene: { type: 'mots', lignes: [{ texte: 'Aucun studio.' }, { texte: 'Aucune photo.' }, { texte: 'Un modèle 3D.', accent: true }] },
      },
      {
        de: 7.4,
        a: 13,
        image: 'Du maillage brut au rendu : le volet traverse l’objet.',
        texte: 'Il est modélisé une fois.',
        chapitre: '01 / 03 · Le modèle',
        fond: 'horizon',
        scene: { type: 'objet3d', mode: 'fil', mention: 'Modèle 3D d’exemple · rendu par le studio' },
      },
      {
        de: 13,
        a: 24,
        image: 'Les sept étapes s’allument ; matériaux et éclairage soulignés.',
        texte: 'Sept étapes, faites une seule fois',
        chapitre: '02 / 03 · La méthode',
        fond: 'horizon',
        scene: {
          type: 'parcours',
          etapes: [
            { titre: 'Modélisation', detail: 'la forme' },
            { titre: 'Matériaux', detail: 'le poste le plus lourd', fort: true },
            { titre: 'Éclairage', detail: 'l’autre poste lourd', fort: true },
            { titre: 'Caméra', detail: 'le cadre et la focale' },
            { titre: 'Animation', detail: 'le mouvement' },
            { titre: 'Rendu', detail: 'le calcul des images' },
            { titre: 'Étalonnage', detail: 'la couleur finale' },
          ],
        },
      },
      {
        de: 24,
        a: 31,
        image: 'Six déclinaisons s’alignent dans leurs cartes de verre.',
        texte: 'Ensuite, chaque visuel ne coûte que son cadrage.',
        chapitre: '03 / 03 · Les déclinaisons',
        fond: 'horizon',
        scene: {
          type: 'objet3d',
          mode: 'grille',
          etiquettes: ['Face', 'Trois-quarts', 'Plongée', 'Profil', 'Dos', 'Détail'],
          mention: 'Modèle 3D d’exemple · rendu par le studio',
        },
      },
      {
        de: 31,
        a: 39,
        image: 'Comparatif : la photo d’abord, la 3D ensuite.',
        texte: 'Photo studio ou packshot 3D ?',
        fond: 'horizon',
        scene: {
          type: 'comparatif',
          gauche: { titre: 'Photo studio', points: ['La matière réelle', 'Un studio à relouer à chaque déclinaison', 'Moins chère sous cinq visuels'] },
          droite: { titre: 'Packshot 3D', points: ['Le modèle fait une fois', 'Le fond et le coloris changent sans studio', 'Plus rentable au-delà de cinq visuels'] },
        },
      },
      {
        de: 39,
        a: 43.5,
        image: 'Le prix affiché défile ; la sphère devient un bouton de lecture.',
        texte: 'Vidéo, pub 3D et motion',
        fond: 'horizon',
        noyau: { forme: 'lecture', place: 'bas' },
        scene: { type: 'chiffre', valeur: '119 €', legende: 'HT, à partir de — le prix affiché' },
      },
      {
        de: 43.5,
        a: 48,
        image: 'Typographie plein cadre : la question qui tranche.',
        texte: 'Combien de visuels par référence, par an ?',
        fond: 'rayons',
        scene: { type: 'mots', lignes: [{ texte: 'Une seule question', petit: true }, { texte: 'Combien de visuels' }, { texte: 'par référence,' }, { texte: 'par an ?', accent: true }] },
      },
      {
        de: 48,
        a: 53,
        image: 'Écran de fin, la galaxie tourne derrière.',
        texte: '',
        fond: 'horizon',
        noyau: { forme: 'galaxie', place: 'fond', intensite: 0.2 },
        scene: {
          type: 'fin',
          action: 'Demander l’analyse gratuite',
          slogan: ['Le modèle, une fois.', 'Les visuels, autant qu’il faut.'],
          public: 'Vidéo & 3D · Sites web · Business plan',
          note: 'Réponse sous 24 h · prix affichés',
        },
      },
    ],
    legende:
      "Ce flacon n’existe pas : c’est un modèle 3D d’exemple, rendu image par image.\n\nLa 3D ne remplace pas la photo. Elle remplace la deuxième séance photo : le modèle est fait une fois, chaque visuel suivant ne coûte que son cadrage. En dessous de cinq visuels par référence, la photo reste moins chère.\n\nVidéo, pub 3D et motion dès 119 € HT. On commence par une analyse gratuite.",
    indicateur: 'taux de visionnage complet',
  },
  {
    ref: 'vid-v-v4-2',
    titre: 'Le prêt se joue sur un creux',
    entite: 'veolt',
    formatSlug: 'ig-reel',
    cadre: '9:16',
    casUsage: true,
    pilier: 'demonter-un-chiffre',
    duree: 54,
    tournage:
      "Tout est dessiné par le studio. La courbe de trésorerie et le prévisionnel sont des EXEMPLES construits pour la vidéo, sans valeur réelle, et l'écran le dit. Vérifier la liste des livrables contre la page de l'offre avant validation.",
    plans: [
      {
        de: 0,
        a: 3.8,
        image: 'Typographie plein cadre.',
        texte: 'Votre banquier lit trois lignes. Pas trente pages.',
        fond: 'rayons',
        scene: { type: 'mots', lignes: [{ texte: 'Votre banquier' }, { texte: 'lit trois lignes.', accent: true }, { texte: 'Pas trente pages', petit: true }] },
      },
      {
        de: 3.8,
        a: 7.8,
        image: 'Titre centré, la sphère de particules se construit derrière.',
        texte: 'Cas type : un premier prêt à décrocher.',
        centre: true,
        fond: 'horizon',
        noyau: { forme: 'sphere', place: 'fond', construction: true, intensite: 0.22 },
      },
      {
        de: 7.8,
        a: 17.5,
        image: 'La trésorerie mensuelle se trace ; le creux passe sous zéro, le marqueur s’y pose.',
        texte: 'D’abord, le mois où la caisse est au plus bas.',
        chapitre: '01 / 03 · Le point bas',
        fond: 'horizon',
        scene: {
          type: 'courbe',
          fenetre: 'Trésorerie mensuelle · EXEMPLE',
          points: [24, 17, 8, -2, -9, -7, 1, 9, 16, 24, 30, 37],
          etiquettesX: ['M1', 'M4', 'M8', 'M12'],
          repere: { index: 4, note: 'Le prêt se joue ici' },
          legende: 'Pas le résultat de fin d’année : le creux.',
          mention: 'Courbe d’exemple · aucune donnée réelle',
        },
      },
      {
        de: 17.5,
        a: 28,
        image: 'Prévisionnel d’exemple, trois lignes repérées une à une.',
        texte: 'Puis les trois lignes qu’il regarde',
        chapitre: '02 / 03 · La capacité à rembourser',
        fond: 'horizon',
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
      {
        de: 28,
        a: 35.5,
        image: 'Le parcours s’allume : ce qui est préparé, la dernière étape soulignée.',
        texte: 'Ce que nous préparons avec vous',
        chapitre: '03 / 03 · Le dossier',
        fond: 'horizon',
        scene: {
          type: 'parcours',
          etapes: [
            { titre: 'Le prévisionnel sur trois ans', detail: 'ligne par ligne' },
            { titre: 'Le plan de trésorerie', detail: 'mois par mois' },
            { titre: 'Les réponses au banquier', detail: 'avant qu’il pose les questions', fort: true },
          ],
        },
      },
      {
        de: 35.5,
        a: 40,
        image: 'Le prix affiché défile ; la sphère devient un €.',
        texte: 'Business plan et analyse financière',
        fond: 'horizon',
        noyau: { forme: 'euro', place: 'bas' },
        scene: { type: 'chiffre', valeur: '490 €', legende: 'HT, à partir de — le prix affiché' },
      },
      {
        de: 40,
        a: 44.5,
        image: 'Le délai défile.',
        texte: 'Votre devis',
        fond: 'horizon',
        noyau: { forme: 'coche', place: 'bas' },
        scene: { type: 'chiffre', valeur: '24 h', legende: 'de délai de réponse — un engagement tenu' },
      },
      {
        de: 44.5,
        a: 49,
        image: 'Typographie plein cadre.',
        texte: 'On commence par une analyse gratuite de votre projet.',
        fond: 'rayons',
        scene: { type: 'mots', lignes: [{ texte: 'On commence par', petit: true }, { texte: 'une analyse' }, { texte: 'gratuite', accent: true }, { texte: 'de votre projet', petit: true }] },
      },
      {
        de: 49,
        a: 54,
        image: 'Écran de fin.',
        texte: '',
        fond: 'horizon',
        noyau: { forme: 'galaxie', place: 'fond', intensite: 0.2 },
        scene: {
          type: 'fin',
          action: 'Demander l’analyse gratuite',
          slogan: ['Votre projet mérite', 'trois lignes solides.'],
          public: 'Business plan · Sites web · Vidéo & 3D',
          note: 'Réponse sous 24 h · prix affichés',
        },
      },
    ],
    legende:
      "Un banquier ne lit pas trente pages : il cherche le mois où la trésorerie est au plus bas, la capacité à rembourser et l'hypothèse de chiffre d'affaires.\n\nBusiness plan et analyse financière dès 490 € HT. On commence par une analyse gratuite de votre projet.",
    indicateur: 'taux de visionnage complet',
  },
  {
    ref: 'vid-m-v4-1',
    titre: 'Quarante pages, trois phrases',
    entite: 'magistria',
    formatSlug: 'li-video',
    cadre: '9:16',
    casUsage: true,
    pilier: 'sinistre-decortique',
    duree: 59,
    tournage:
      "Tout est dessiné par le studio. Le rapport est un EXEMPLE rédigé pour la vidéo — jamais une pièce de dossier réel, même anonymisée — et l'écran le dit. Articles cités réels (C. assur. L. 113-1, L. 112-4) ; aucune décision de justice citée faute de référence vérifiée. Prix et freemium tels qu'affichés.",
    plans: [
      {
        de: 0,
        a: 4.2,
        image: 'Typographie plein cadre ; les particules forment un document derrière.',
        texte: 'Quarante pages. Trois phrases décident de la garantie.',
        fond: 'etoiles',
        noyau: { forme: 'document', place: 'fond', construction: true, intensite: 0.18 },
        scene: { type: 'mots', lignes: [{ texte: 'Quarante pages.' }, { texte: 'Trois phrases', accent: true }, { texte: 'décident de la garantie.' }] },
      },
      { de: 4.2, a: 8, image: 'Le logotype ; le document de particules devient le cerveau, le cadran se trace.', clip: 'magistria-logo-3d', texte: '', fond: 'etoiles', scene: { type: 'marque' }, noyau: { forme: 'cerveau', place: 'fond', onde: true, cadran: true, intensite: 0.2 } },
      {
        de: 8,
        a: 23,
        image: 'Le rapport défile, s’arrête ; les trois phrases se surlignent, chacune avec ce qu’elle commande.',
        texte: 'Le rapport, lu pour ce qu’il déplace',
        chapitre: '01 / 03 · Le rapport',
        fond: 'etoiles',
        scene: {
          type: 'rapport',
          titre: 'Rapport d’expertise · exemple',
          pages: 40,
          phrases: [
            { texte: 'L’intrusion initiale est datée du 3 mars.', note: 'commande le délai de déclaration' },
            { texte: 'L’accès s’est fait par un serveur non mis à jour.', note: 'commande l’exclusion' },
            { texte: 'Les sauvegardes hors ligne sont intactes.', note: 'commande le montant indemnisable' },
          ],
          mention: 'Rapport d’exemple, rédigé pour la vidéo · aucune pièce réelle',
        },
      },
      {
        de: 23,
        a: 35.5,
        image: 'La question, les sources, la réponse sourcée, ce qui reste à vérifier ; la caméra suit ce qui s’écrit.',
        texte: 'Chaque phrase, sa source.',
        chapitre: '02 / 03 · Le droit',
        fond: 'etoiles',
        noyau: { forme: 'balance', place: 'fond', activite: 0.5 },
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
          mention: 'Exemple d’interface · données fictives',
        },
      },
      {
        de: 35.5,
        a: 43.5,
        image: 'Le raisonnement en trois étapes, la troisième soulignée.',
        texte: 'Et quand les pièces manquent, il le dit.',
        chapitre: '03 / 03 · La limite',
        fond: 'etoiles',
        scene: {
          type: 'parcours',
          etapes: [
            { titre: 'La règle, citée', detail: 'C. assur., art. L. 113-1' },
            { titre: 'Les faits, qualifiés', detail: 'pièce par pièce, page par page' },
            { titre: 'Ce qui manque, dit', detail: '« je ne peux pas conclure »', fort: true },
          ],
        },
      },
      {
        de: 43.5,
        a: 48,
        image: 'Typographie plein cadre ; la balance de particules derrière.',
        texte: 'L’IA propose. Le gestionnaire décide.',
        fond: 'etoiles',
        noyau: { forme: 'balance', place: 'fond', intensite: 0.2 },
        scene: { type: 'mots', lignes: [{ texte: 'L’IA propose.' }, { texte: 'Le gestionnaire décide.', accent: true }] },
      },
      {
        de: 48,
        a: 54,
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
        de: 54,
        a: 59,
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
      "Dans un rapport d’expertise cyber, trois phrases déplacent une date, une exclusion ou un montant. Le reste les justifie.\n\nMagistrIA lie chaque phrase à sa source (C. assur., art. L. 113-1 et L. 112-4), dit ce qu'il reste à vérifier — et, quand les pièces manquent, écrit qu'il ne peut pas conclure. L'IA propose, le gestionnaire décide.\n\nFreemium sans carte bancaire, Pro à 59 € HT/mois.",
    indicateur: 'taux de visionnage complet',
  },
  {
    ref: 'vid-m-v4-2',
    titre: 'Un risque « élevé », ça vaut combien ?',
    entite: 'magistria',
    formatSlug: 'li-video',
    cadre: '9:16',
    casUsage: true,
    pilier: 'methode-nommee',
    duree: 51,
    tournage:
      "Tout est dessiné par le studio, sur un scénario d'EXEMPLE. La distribution est une FORME d'exemple : aucun montant n'est affiché, la vidéo montre la méthode, pas un résultat. Méthode Open FAIR (The Open Group) ; EBIOS Risk Manager (ANSSI).",
    plans: [
      {
        de: 0,
        a: 4.2,
        image: 'Typographie plein cadre.',
        texte: 'Un risque « élevé », ça vaut combien ?',
        fond: 'etoiles',
        noyau: { forme: 'bouclier', place: 'fond', construction: true, intensite: 0.18 },
        scene: { type: 'mots', lignes: [{ texte: 'Un risque' }, { texte: '« élevé »,', accent: true }, { texte: 'ça vaut combien ?' }] },
      },
      {
        de: 4.2,
        a: 9,
        image: 'Titre centré, phrase d’accent en or.',
        texte: 'Une couleur ne se budgète pas.',
        accent: 'Une fourchette en euros, si.',
        centre: true,
        fond: 'etoiles',
        noyau: { forme: 'bouclier', place: 'fond', intensite: 0.2 },
      },
      {
        de: 9,
        a: 17,
        image: 'Le parcours s’allume : fréquence, ampleur, distribution.',
        texte: 'La méthode FAIR décompose',
        chapitre: '01 / 03 · Décomposer',
        fond: 'etoiles',
        scene: {
          type: 'parcours',
          etapes: [
            { titre: 'La fréquence', detail: 'combien de fois par an' },
            { titre: 'L’ampleur', detail: 'ce que coûte une occurrence' },
            { titre: 'La distribution', detail: 'une fourchette, pas un point', fort: true },
          ],
        },
      },
      {
        de: 17,
        a: 28.5,
        image: 'La distribution se trace ; l’intervalle probable s’allume, le marqueur se pose au sommet.',
        texte: 'Le résultat n’est pas un chiffre',
        chapitre: '02 / 03 · Simuler',
        fond: 'etoiles',
        noyau: { forme: 'cerveau', place: 'fond', activite: 0.5, intensite: 0.14 },
        scene: {
          type: 'courbe',
          fenetre: 'Perte annuelle simulée · EXEMPLE',
          points: [1, 3, 9, 22, 41, 55, 52, 40, 27, 17, 10, 6, 3, 2, 1],
          etiquettesX: ['Pertes faibles', 'Pertes fortes'],
          bande: { de: 3, a: 9, note: 'Intervalle probable' },
          repere: { index: 5, note: 'Le scénario le plus probable' },
          legende: 'C’est une distribution — avec ses hypothèses affichées à côté.',
          mention: 'Forme d’exemple · aucun montant, aucune donnée réelle',
        },
      },
      {
        de: 28.5,
        a: 33.5,
        image: 'Titre centré.',
        texte: 'Changer une hypothèse ne refait pas tout : on voit ce qui bouge, et pourquoi.',
        centre: true,
        fond: 'etoiles',
        noyau: { forme: 'cerveau', place: 'fond', intensite: 0.2 },
      },
      {
        de: 33.5,
        a: 41,
        image: 'Les méthodes nommées, une par étape.',
        texte: 'Les méthodes nommées dans l’outil',
        chapitre: '03 / 03 · Nommer',
        fond: 'etoiles',
        scene: {
          type: 'parcours',
          etapes: [
            { titre: 'FAIR', detail: 'le risque en euros' },
            { titre: 'EBIOS Risk Manager', detail: 'la méthode de l’ANSSI' },
            { titre: 'Le syllogisme juridique', detail: 'majeure, mineure, conclusion' },
          ],
        },
      },
      {
        de: 41,
        a: 46,
        image: 'Le prix défile.',
        texte: 'Offre Pro',
        fond: 'etoiles',
        noyau: { forme: 'bouclier', place: 'bas' },
        scene: { type: 'chiffre', valeur: '59 €', legende: 'HT par mois — pour un juriste ou un avocat indépendant' },
      },
      {
        de: 46,
        a: 51,
        image: 'Écran de fin, le cadran tourne derrière.',
        texte: '',
        fond: 'etoiles',
        noyau: { forme: 'cerveau', place: 'fond', cadran: true, intensite: 0.16 },
        scene: {
          type: 'fin',
          action: 'Essayer gratuitement',
          slogan: ['Un risque se chiffre.', 'Il ne se colorie pas.'],
          public: 'Pour les directions juridiques',
          note: 'Freemium sans carte bancaire',
        },
      },
    ],
    legende:
      "Un risque « élevé » ne se budgète pas. La méthode FAIR décompose un risque en fréquence et en ampleur de perte, puis produit une distribution en euros.\n\nDans MagistrIA, les hypothèses restent affichées à côté du résultat : on peut en changer une sans refaire l'autre.",
    indicateur: 'taux de visionnage complet',
  },

  {
    ref: 'vid-v-v4-3',
    titre: 'Pensé en série, pas à l’unité',
    entite: 'veolt',
    formatSlug: 'ig-reel',
    cadre: '9:16',
    casUsage: true,
    pilier: 'montrer-le-travail',
    duree: 35,
    tournage:
      "Aucun tournage : les trois films sont les DÉMONSTRATIONS du studio montrées sur veolt.fr (clips livrés avec l'outil, `public/clips`), présentées comme telles à l'écran — jamais comme un travail fait pour un client. Avant validation, confirmer que les marques visibles dans ces films sont bien des marques de démonstration.",
    plans: [
      {
        de: 0,
        a: 4.6,
        image: 'Le film « canette » dans son cadre, étiqueté démonstration.',
        clip: 'veolt-demo-canette',
        texte: 'Une pub produit, pensée pour le fil.',
        fond: 'horizon',
        scene: { type: 'vitrine', etiquette: 'Démonstration du studio', mention: 'Film de démonstration · produit par le studio' },
      },
      {
        de: 4.6,
        a: 9,
        image: 'Le film « espace » dans son cadre.',
        clip: 'veolt-demo-espace',
        texte: 'Le même produit, un autre univers.',
        fond: 'horizon',
        scene: { type: 'vitrine', etiquette: 'Démonstration du studio', mention: 'Film de démonstration · produit par le studio' },
      },
      {
        de: 9,
        a: 13.2,
        image: 'Le film « tonic » dans son cadre.',
        clip: 'veolt-demo-tonic',
        texte: 'Une gamme, une même écriture.',
        fond: 'horizon',
        scene: { type: 'vitrine', etiquette: 'Démonstration du studio', mention: 'Film de démonstration · produit par le studio' },
      },
      {
        de: 13.2,
        a: 20.5,
        image: 'Le parcours s’allume : ce qui se décline, c’est la méthode.',
        texte: 'Ce qui se décline, c’est la méthode',
        fond: 'horizon',
        scene: {
          type: 'parcours',
          etapes: [
            { titre: 'Le concept', detail: 'une idée, plusieurs films' },
            { titre: 'Les plans', detail: 'écrits avant d’être produits' },
            { titre: 'Le montage', detail: 'rythme, son, texte incrusté' },
            { titre: 'Les déclinaisons', detail: 'formats, durées, univers', fort: true },
          ],
        },
      },
      {
        de: 20.5,
        a: 25,
        image: 'Typographie plein cadre.',
        texte: 'Pensé en série, pas à l’unité.',
        fond: 'rayons',
        scene: { type: 'mots', lignes: [{ texte: 'Pensé en série,' }, { texte: 'pas à l’unité.', accent: true }] },
      },
      {
        de: 25,
        a: 29.8,
        image: 'Le prix affiché défile ; la sphère devient un bouton de lecture.',
        texte: 'Vidéo, pub 3D et motion',
        fond: 'horizon',
        noyau: { forme: 'lecture', place: 'bas' },
        scene: { type: 'chiffre', valeur: '119 €', legende: 'HT, à partir de — le prix affiché' },
      },
      {
        de: 29.8,
        a: 35,
        image: 'Écran de fin, la galaxie tourne derrière.',
        texte: '',
        fond: 'horizon',
        noyau: { forme: 'galaxie', place: 'fond', intensite: 0.2 },
        scene: {
          type: 'fin',
          action: 'Demander l’analyse gratuite',
          slogan: ['Une idée.', 'Autant de films qu’il en faut.'],
          public: 'Vidéo & 3D · Sites web · Business plan',
          note: 'Réponse sous 24 h · prix affichés',
        },
      },
    ],
    legende:
      "Trois films de démonstration, une même écriture : ce qui se décline, c’est la méthode — le concept, les plans, le montage, puis les formats.\n\nVidéo, pub 3D et motion dès 119 € HT, pensés en série plutôt qu’à l’unité. On commence par une analyse gratuite.",
    indicateur: 'taux de visionnage complet',
  },

];

export function videosDe(entite: EntiteSlug) {
  return VIDEOS.filter((v) => v.entite === entite);
}
