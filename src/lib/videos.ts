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
import type { Scene, FondPlan } from './montage';

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
  /** Cadre imposé (sinon celui du format) : un cas d'usage Instagram se tourne en 9:16. */
  cadre?: '9:16' | '4:5';
  /** Démonstration d'un cas d'utilisation réel du produit ou du service. */
  casUsage?: boolean;
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
    duree: 50,
    tournage:
      "Tout est dessiné par le studio. Dossier d'EXEMPLE, mention à l'écran. Les deux articles cités (C. assur. L. 113-1 et L. 112-4) sont réels ; aucune décision de justice n'est citée faute de référence vérifiée.",
    plans: [
      {
        de: 0,
        a: 6.5,
        image: 'Trois pièces qui se posent, puis s’éparpillent.',
        texte: 'Un rapport d’expertise. Des conditions générales.',
        accent: 'Une question : le sinistre est-il couvert ?',
        centre: true,
        fond: 'etoiles',
        scene: { type: 'documents', items: ['Rapport d’expertise', 'Conditions générales', 'Contrat'], dispersion: true },
      },
      { de: 6.5, a: 10, image: 'La marque apparaît.', texte: '', fond: 'etoiles', scene: { type: 'marque' } },
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
        image: 'La question, les sources, la réponse sourcée.',
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
        a: 45,
        image: 'Récapitulatif coché.',
        texte: 'Ce que l’outil fait pour vous',
        chapitre: 'Récap',
        fond: 'etoiles',
        scene: { type: 'recap', items: ['Le dossier analysé', 'Les sources vérifiées', 'Le courrier préparé'] },
      },
      {
        de: 45,
        a: 50,
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
        image: 'Le courrier reçu par l’assuré.',
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
        image: 'Les demandes qui arrivent.',
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
      { de: 0, a: 4, image: 'Titre seul, centré.', texte: 'Votre futur client vous cherche sur son téléphone.', centre: true, fond: 'rayons' },
      { de: 4, a: 7.5, image: 'La marque apparaît.', texte: '', fond: 'horizon', scene: { type: 'marque' } },
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
      { de: 30, a: 34, image: 'Titre seul, centré.', texte: 'On commence par une analyse gratuite de votre projet.', centre: true, fond: 'rayons' },
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
];

export function videosDe(entite: EntiteSlug) {
  return VIDEOS.filter((v) => v.entite === entite);
}
