/**
 * Les deux identités éditoriales.
 *
 * Tout ce fichier est du **fait relevé**, pas de l'invention : il vient du
 * cadrage MagistrIA (docs/MagistrIA_Cadrage.pdf), de `~/Desktop/prospection`
 * (contexte/offres/veolt.md, contexte/ton-et-style.md) et du code des deux
 * produits. Les champs `preuvesInterdites` sont la partie la plus importante :
 * ce sont eux qui empêchent la machine d'écrire quelque chose de faux.
 *
 * Relevé le 2026-10-06. Voir 00-CADRAGE-MACHINE-A-POST.md §2.
 */

export type EntiteSlug = 'veolt' | 'magistria';
export type ReseauSlug = 'linkedin' | 'instagram' | 'reddit' | 'tiktok' | 'blog';

export interface Pilier {
  slug: string;
  nom: string;
  /** Part du calendrier, en pourcentage. La somme fait 100 par entité. */
  part: number;
  contenu: string;
  preuve: string;
}

export interface Persona {
  slug: string;
  nom: string;
  douleur: string;
  /** Ce qu'il tape dans une recherche — sert aux grappes SEO. */
  requeteType: string;
}

export interface Offre {
  nom: string;
  prixDepart: string;
  acheteur: string;
}

export interface Marque {
  slug: EntiteSlug;
  nom: string;
  nomLong: string;
  entiteJuridique: string;
  signature: string;
  promesseEditoriale: string;
  /** La phrase fondatrice. Tout post doit s'y rattacher. */
  principe: string;
  site: string;
  /** Thème de l'interface — rappel visuel qu'on a changé de métier et de règles. */
  theme: { fond: string; accent: string; accentDoux: string; encre: string; serif: boolean };
  piliers: Pilier[];
  personas: Persona[];
  offres: Offre[];
  reseaux: Partial<Record<ReseauSlug, 'principal' | 'secondaire' | 'prudent' | 'exclu'>>;
  /** Ce qu'on a le droit d'avancer comme preuve. */
  preuvesAutorisees: string[];
  /** Ce qui est bloqué, et pourquoi. Affiché tel quel quand le garde-fou déclenche. */
  preuvesInterdites: Array<{ motif: RegExp; libelle: string; raison: string }>;
  contraintes: string[];
}

export const MARQUES: Record<EntiteSlug, Marque> = {
  veolt: {
    slug: 'veolt',
    nom: 'Veolt',
    nomLong: 'Veolt Studio Créatif — 3D · Web · Stratégie',
    entiteJuridique: 'ENERVO, SAS au capital de 500 € — RCS Nanterre 107 715 823',
    signature: 'Veolt vous met sur orbite',
    promesseEditoriale:
      "Un studio qui réunit la 3D, le web et l'analyse financière, et qui le prouve en donnant son travail avant de le vendre.",
    principe: "On donne d'abord. L'analyse gratuite remplace la référence client comme preuve de compétence.",
    site: 'veoltproduction.fr',
    theme: { fond: '#0C0C0C', accent: '#B600A8', accentDoux: '#C79BFF', encre: '#EDEBF2', serif: false },
    piliers: [
      {
        slug: 'montrer-le-travail',
        nom: 'Montrer le travail',
        part: 30,
        contenu: 'rendus 3D, avant/après de site, packshots, motion',
        preuve: 'le livrable lui-même',
      },
      {
        slug: 'demonter-un-chiffre',
        nom: 'Démonter un chiffre',
        part: 25,
        contenu: "lecture d'un prévisionnel, coût réel d'un site, unités économiques",
        preuve: 'une analyse faite par nous',
      },
      {
        slug: 'coulisses-methode',
        nom: 'Coulisses et méthode',
        part: 20,
        contenu: 'le pipeline 3D, comment on cadre un business plan',
        preuve: 'le processus',
      },
      {
        slug: 'pedagogie-dirigeant',
        nom: 'Pédagogie dirigeant',
        part: 15,
        contenu: "ce qu'un banquier regarde, pourquoi un devis varie ×6",
        preuve: 'le droit commun du métier',
      },
      {
        slug: 'positionnement-prix',
        nom: 'Positionnement et prix',
        part: 10,
        contenu: "pourquoi nos prix sont bas et assumés, ce qu'on ne fait pas",
        preuve: 'les prix affichés',
      },
    ],
    personas: [
      {
        slug: 'porteur-projet',
        nom: 'Porteur de projet en recherche de financement',
        douleur: 'il doit présenter un prévisionnel à une banque sans savoir ce qu\'elle regarde',
        requeteType: 'business plan pour prêt bancaire création entreprise',
      },
      {
        slug: 'dirigeant-site-bloque',
        nom: 'Dirigeant dont le site freine l\'activité',
        douleur: 'son site ne convertit pas et il ne sait pas si le problème est le fond ou la forme',
        requeteType: 'combien coûte un site vitrine sur mesure',
      },
      {
        slug: 'marque-produit',
        nom: 'Marque produit ou e-commerce',
        douleur: 'il a besoin de visuels produit et la photo studio coûte trop cher par référence',
        requeteType: 'packshot 3D ou photo produit lequel choisir',
      },
    ],
    offres: [
      { nom: 'Business plan et analyse financière', prixDepart: 'à partir de 490 € HT', acheteur: 'porteur de projet en recherche de financement' },
      { nom: 'Sites web et web 3D', prixDepart: 'à partir de 1 490 € HT', acheteur: "dirigeant dont le site freine l'activité" },
      { nom: 'Vidéo, pub 3D et motion', prixDepart: 'à partir de 119 € HT', acheteur: 'marque produit, e-commerce, SaaS, agence' },
    ],
    reseaux: { linkedin: 'principal', instagram: 'principal', tiktok: 'secondaire', reddit: 'prudent', blog: 'principal' },
    preuvesAutorisees: [
      'le contenu des prestations — livrables, périmètre, méthode (vérifiable sur le site)',
      'les prix, réellement affichés et volontairement sous le marché',
      "le délai de réponse sous 24 h, à condition de le tenir",
      "l'analyse gratuite, qui est une vraie offre sans engagement",
      'la combinaison des trois métiers : développeurs web, créateurs vidéo et analystes financiers',
      "l'expérience personnelle de l'associé, formulée « mon associé a accompagné X sur Y »",
    ],
    preuvesInterdites: [
      {
        motif: /\b(28|28\+)\s*(\+)?\s*clients?\b|clients? accompagn|\bnos (?:nombreux )?clients?\b/i,
        libelle: 'référence au portefeuille client',
        raison:
          "ENERVO a trois mois et n'a aucun client à ce jour (confirmé le 2026-09-17). Les « 28+ clients » du site sont des données de démonstration. Dans un post public, horodaté et capturable, c'est une pratique commerciale trompeuse.",
      },
      {
        motif: /\bnous avons accompagn|\bnous avons aid|\bnous avons livr/i,
        libelle: '« nous avons accompagné »',
        raison:
          "Aucune mission n'a été réalisée sous Veolt. L'expérience de l'associé est citable, mais à la première personne : « mon associé a accompagné X sur Y ». La nuance est la différence entre une preuve et une tromperie.",
      },
      {
        motif: /\bROAS\b|×\s*2[,.]4|×\s*12\b|x12 en fréquence/i,
        libelle: 'résultats chiffrés du site',
        raison: 'Les ROAS et multiplicateurs affichés sur veoltproduction.fr sont des chiffres de démonstration.',
      },
      {
        motif: /\btémoignage|\bils nous font confiance|\bavis clients?\b/i,
        libelle: 'témoignages',
        raison: 'Les témoignages du site sont des données de démonstration.',
      },
    ],
    contraintes: [
      'Capacité : 6 à 8 dossiers par mois, toutes offres confondues. Saturer la capacité est un échec, pas un succès.',
      'Zone : France entière, Europe incluse.',
      "Citer le prix de départ dès qu'une offre est évoquée — le positionnement bas est un argument.",
      "Ne jamais vendre de vidéo à l'unité : le site assume que l'unité n'est pas compétitive.",
      'Aucun délai promis hors 24 h (devis) et 3 à 5 semaines (diagnostic stratégique).',
      "Ne jamais proposer un devis ou une démonstration en premier contact — proposer l'analyse gratuite.",
    ],
  },

  magistria: {
    slug: 'magistria',
    nom: 'MagistrIA',
    nomLong: "MagistrIA — l'intelligence au service du droit",
    entiteJuridique: '[?] à renseigner — voir mentions légales du produit',
    signature: "L'intelligence au service du droit",
    promesseEditoriale:
      'Une IA juridique qui montre son raisonnement et ses sources, pour que le professionnel garde la décision.',
    principe: "L'IA propose, le professionnel décide.",
    site: 'magistrai.fr',
    // Relevé dans le produit livré (`magistria-mvp/src/app/globals.css`) le
    // 2026-10-21, et non dans le cadrage de mai : la marque a évolué vers le
    // bordeaux sur fond clair, avec Spectral en police d'affichage.
    theme: { fond: '#FFFFFF', accent: '#7B2D3E', accentDoux: '#B8962E', encre: '#15121A', serif: true },
    piliers: [
      {
        slug: 'arret-consequence',
        nom: 'Un arrêt, une conséquence',
        part: 30,
        contenu: 'une décision récente et ce qu\'elle change en pratique',
        preuve: 'la décision, citée',
      },
      {
        slug: 'methode-nommee',
        nom: 'La méthode nommée',
        part: 25,
        contenu: "FAIR, EBIOS Risk Manager, syllogisme juridique : comment l'outil raisonne",
        preuve: 'la méthode publiée',
      },
      {
        slug: 'sinistre-decortique',
        nom: 'Le sinistre décortiqué',
        part: 20,
        contenu: "clause d'exclusion, délai de déclaration, charge de la preuve",
        preuve: 'le code des assurances',
      },
      {
        slug: 'conformite-datee',
        nom: 'Conformité datée',
        part: 15,
        contenu: 'NIS 2, RGPD, échéances réelles',
        preuve: 'les textes et leurs dates',
      },
      {
        slug: 'position-ia',
        nom: "Position sur l'IA",
        part: 10,
        contenu: "pourquoi « l'IA propose, le professionnel décide »",
        preuve: 'notre propre architecture',
      },
    ],
    personas: [
      {
        slug: 'gestionnaire-sinistres',
        nom: 'Gestionnaire de sinistres (assureur, mutuelle)',
        douleur: "il reçoit des rapports d'expertise cyber trop techniques pour décider d'une garantie",
        requeteType: 'refus de garantie clause exclusion formelle et limitée preuve',
      },
      {
        slug: 'avocat-independant',
        nom: 'Avocat ou juriste indépendant',
        douleur: "il doit trouver les points fragiles d'une argumentation adverse en temps contraint",
        requeteType: "clause de limitation de responsabilité opposable faute lourde",
      },
      {
        slug: 'juriste-entreprise',
        nom: "Juriste d'entreprise / direction juridique",
        douleur: "il doit tenir des échéances de conformité (NIS 2, RGPD) sans effectif dédié",
        requeteType: 'NIS 2 obligation notification incident délai secteur',
      },
    ],
    offres: [
      { nom: 'Freemium', prixDepart: '0 € — 10 crédits/mois, sans carte bancaire', acheteur: 'professionnel qui veut juger sur pièce' },
      { nom: 'Pro', prixDepart: '59 € HT/mois', acheteur: 'avocat ou juriste indépendant' },
      { nom: 'Cabinet / Entreprise', prixDepart: '249 € HT/mois', acheteur: "équipe — cabinet, entreprise, assureur" },
      { nom: 'Grand Compte', prixDepart: 'sur devis', acheteur: "groupe d'assurance, réseau de cabinets, institution" },
    ],
    reseaux: { linkedin: 'principal', instagram: 'secondaire', reddit: 'prudent', tiktok: 'exclu', blog: 'principal' },
    preuvesAutorisees: [
      'les méthodes nommées réellement implémentées : FAIR, EBIOS Risk Manager, syllogisme juridique',
      'les sources officielles réellement branchées : Légifrance/DILA, bases CVE/NIST, décisions CNIL, alertes ANSSI',
      'le principe de décision humaine, qui est une contrainte d\'architecture et pas un slogan',
      'les prix affichés, et le freemium sans carte bancaire',
      'le droit lui-même : un arrêt commenté est du contenu vrai, gratuit et renouvelable',
    ],
    preuvesInterdites: [
      {
        motif: /\b(rend|donne|fournit|délivre)\s+(un\s+)?avis juridique|\bremplace\s+(l'|un |le )?(avocat|juriste|professionnel)|\btranche\s+(le|un)\s+litige|\bconseil juridique automatis/i,
        libelle: 'avis juridique rendu par l\'outil',
        raison:
          "Contraire au principe fondateur « L'IA propose, le professionnel décide », et au périmètre réglementaire du conseil juridique. L'outil instruit, il ne tranche pas.",
      },
      {
        motif: /\bh[ée]bergement souverain|\bHDS\b|\bSecNumCloud\b|\bsouverainet[ée] (?:des donn|num)/i,
        libelle: 'hébergement souverain / HDS / SecNumCloud',
        raison:
          "Le cadrage les exige à terme ; elles ne sont pas en place aujourd'hui. L'affirmer publiquement serait faux, et c'est exactement le point qu'un acheteur assureur vérifiera.",
      },
      {
        motif: /\bmagistrats?\b/i,
        libelle: 'cible magistrats',
        raison:
          "Explicitement hors périmètre MVP du cadrage (réserves sur l'indépendance judiciaire et les garanties procédurales). Ne pas en faire un argument public.",
      },
      {
        motif: /\b(100|99)\s*%\s*(de\s*)?(fiab|précis|exact)|\bsans (?:aucune )?erreur\b|\bgarantit (?:le|un) r[ée]sultat/i,
        libelle: 'promesse de fiabilité absolue',
        raison: "Aucune IA ne garantit un résultat juridique, et le promettre détruit la crédibilité qu'on construit.",
      },
    ],
    contraintes: [
      'Charte réelle (site en ligne magistrai.fr, relevé le 10/11/2026) : fond nuit #03050A, titres Spectral en blanc, texte Inter #E9EEF5, sur-titres JetBrains Mono en capitales cyan, logotype « Magistr » + « IA » or #E0B85A, accents cyan #3CC8FF et ambre #FF9A3C, bordeaux #7B2D3E réservé au bouton d’action. Ton : sobre, précis, jamais publicitaire.',
      'Cœur de cible MVP : assureurs et mutuelles (cadrage §5), puis cabinets et directions juridiques.',
      "Toute affirmation de droit exige une référence : un article, une décision, une date.",
      'Marché comparable : Ordalie 69–105 €, Lexbase ~116 €, GenIA-L dès 213 €, Predictice dès 250 €. Nos prix se défendent par palier.',
      'Pas de TikTok : le registre du réseau est incompatible avec la gravité juridique.',
    ],
  },
};

export const ENTITES = Object.values(MARQUES);

export function marque(slug: string): Marque {
  const m = MARQUES[slug as EntiteSlug];
  if (!m) throw new Error(`Entité inconnue : ${slug}`);
  return m;
}

export function estEntite(slug: string | undefined): slug is EntiteSlug {
  return slug === 'veolt' || slug === 'magistria';
}

/** Garde-fous de ton, communs aux deux entités. Repris de contexte/ton-et-style.md. */
export const JARGON_BANNI = [
  'solution innovante',
  'révolutionner',
  'révolutionnaire',
  'disruptif',
  'disruption',
  'booster',
  'game changer',
  'game-changer',
  "n'hésitez pas à",
  'je me permets de',
  'incontournable',
  'leader du marché',
  'clé en main',
  'sur-mesure unique',
  'synergie',
];
