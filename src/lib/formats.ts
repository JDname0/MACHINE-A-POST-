/**
 * Bibliothèque des formats — un format = des limites dures, une ossature,
 * un indicateur à surveiller.
 *
 * Les valeurs ne sont pas des opinions : elles viennent des relevés 2026
 * listés en §12 du cadrage. Elles vont périmer — c'est pour ça que `releve`
 * porte une date et que les sources sont nommées dans le cadrage plutôt que
 * noyées dans le code.
 *
 * Périmètre arrêté le 2026-10-06 : LinkedIn (texte+image, carrousel, vidéo),
 * Instagram (carrousel, Reel, vidéo), Reddit (post textuel), TikTok (vidéo
 * courte), blog (article de grappe). Rien d'autre.
 */

import type { ReseauSlug } from './marques';

export type FormatSlug =
  | 'li-texte-image'
  | 'li-carrousel'
  | 'li-video'
  | 'ig-carrousel'
  | 'ig-reel'
  | 'ig-video'
  | 'reddit-texte'
  | 'tiktok-video'
  | 'blog-article';

export interface EtapeOssature {
  nom: string;
  consigne: string;
  /** Limite indicative en caractères pour cette étape, si elle en a une. */
  limite?: number;
}

export interface FormatSpec {
  slug: FormatSlug;
  reseau: ReseauSlug;
  nom: string;
  /** Pourquoi ce format existe dans le dispositif. Une phrase. */
  raison: string;
  cadence: string;
  /** Plafond dur imposé par la plateforme. */
  maxCaracteres: number;
  /** Fourchette utile constatée — ce n'est pas le plafond. */
  utileMin: number;
  utileMax: number;
  /** Longueur maximale de ce qui est visible avant troncature. */
  accrocheMax: number;
  accrocheLibelle: string;
  visuel: string;
  ossature: EtapeOssature[];
  indicateurCle: string;
  pieges: string[];
  releve: string;
}

export const FORMATS: Record<FormatSlug, FormatSpec> = {
  'li-texte-image': {
    slug: 'li-texte-image',
    reseau: 'linkedin',
    nom: 'LinkedIn — texte + image',
    raison: 'Le format de base. C\'est lui qui installe la régularité, et la régularité est ce qui diffuse une page.',
    cadence: '2 fois par semaine',
    maxCaracteres: 3000,
    utileMin: 900,
    utileMax: 1800,
    accrocheMax: 210,
    accrocheLibelle: 'visible avant « voir plus »',
    visuel: '1 200 × 1 200 (carré) ou 1 200 × 627. Lisible en vignette, porteuse d\'une information.',
    ossature: [
      { nom: 'Accroche', consigne: 'Une affirmation précise, chiffrée ou à contre-courant. Jamais une question creuse.', limite: 210 },
      { nom: 'Rupture', consigne: 'Un saut de ligne. Le « voir plus » doit tomber ici.' },
      { nom: 'Corps', consigne: 'Paragraphes de 1 à 2 lignes, beaucoup de blancs. 14 paragraphes courts battent 7 longs.' },
      { nom: 'Preuve', consigne: 'Le chiffre, la pièce, l\'arrêt, le rendu. C\'est ce qui tient le lecteur.' },
      { nom: 'Enseignement', consigne: 'Une phrase qui se retient et se cite.' },
      { nom: 'Appel', consigne: 'Une seule demande. Un avis, pas un rendez-vous.' },
    ],
    indicateurCle: 'temps de lecture — viser 30 s et plus ; 31 à 60 s donne la diffusion maximale',
    pieges: [
      'Un lien dans le corps réduit la diffusion : le mettre en commentaire, posté par la page.',
      'Plus de 3 hashtags dilue. Descriptifs, en pied.',
      'Un post très liké mais survolé est moins diffusé qu\'un post peu liké mais lu.',
    ],
    releve: '2026-10-06',
  },

  'li-carrousel': {
    slug: 'li-carrousel',
    reseau: 'linkedin',
    nom: 'LinkedIn — carrousel (document PDF)',
    raison:
      "Le format le plus performant disponible (~6,6 % d'engagement) et le seul où une page entreprise tient la comparaison avec un profil personnel. Pour nous qui publions en page, c'est le format décisif.",
    cadence: '1 fois par semaine',
    maxCaracteres: 3000,
    utileMin: 300,
    utileMax: 600,
    accrocheMax: 210,
    accrocheLibelle: 'texte du post, visible avant « voir plus »',
    visuel: '8 à 10 pages, 1 080 × 1 350 (4:5) ou carré, exporté en PDF.',
    ossature: [
      { nom: 'Page 1 — titre', consigne: 'Le titre = la promesse. Lisible en vignette, 6 à 10 mots.', limite: 80 },
      { nom: 'Page 2 — problème', consigne: 'Le problème, en une phrase et un chiffre.' },
      { nom: 'Pages 3 à 8 — corps', consigne: 'Une idée par page. Jamais deux. Une page = un écran de métro.' },
      { nom: 'Page 9 — à retenir', consigne: 'La synthèse, celle qu\'on capture d\'écran.' },
      { nom: 'Page 10 — appel', consigne: "L'appel, et l'identité de l'entité." },
      { nom: 'Texte du post', consigne: 'Court : 300 à 600 caractères. Il introduit, il ne résume pas.', limite: 600 },
    ],
    indicateurCle: 'taux d\'achèvement du document — viser 15 à 20 s de lecture sur le document',
    pieges: [
      'En dessous de 6 pages le format ne vaut pas le travail ; au-dessus de 12 l\'achèvement s\'effondre.',
      'Un titre de page 1 illisible en vignette annule tout le reste.',
    ],
    releve: '2026-10-06',
  },

  'li-video': {
    slug: 'li-video',
    reseau: 'linkedin',
    nom: 'LinkedIn — vidéo',
    raison:
      "Réservée à ce qui ne se raconte pas : une démonstration d'écran, un rendu 3D en mouvement. Sinon le carrousel coûte dix fois moins et porte plus loin.",
    cadence: 'ponctuelle — pas hebdomadaire',
    maxCaracteres: 3000,
    utileMin: 300,
    utileMax: 900,
    accrocheMax: 210,
    accrocheLibelle: 'texte du post, visible avant « voir plus »',
    visuel: '30 à 90 secondes, 1:1 ou 4:5, sous-titres incrustés obligatoires.',
    ossature: [
      { nom: 'Première seconde', consigne: "L'image la plus forte. Pas de générique, pas de logo en ouverture." },
      { nom: 'Démonstration', consigne: 'Ce qu\'on montre, montré. Pas commenté en voix off sur un écran fixe.' },
      { nom: 'Sous-titres', consigne: 'Incrustés. La lecture se fait sans son — ce n\'est pas une option.' },
      { nom: 'Texte du post', consigne: 'Ce que la vidéo ne dit pas. 300 à 900 caractères.' },
    ],
    indicateurCle: 'taux de visionnage à 30 secondes',
    pieges: ['Sans sous-titres incrustés, la vidéo est perdue : la très grande majorité des lectures est muette.'],
    releve: '2026-10-06',
  },

  'ig-carrousel': {
    slug: 'ig-carrousel',
    reseau: 'instagram',
    nom: 'Instagram — carrousel',
    raison:
      "Sur un compte installé, le carrousel dépasse souvent le Reel en portée. À tester plutôt qu'à présumer.",
    cadence: '2 fois par semaine',
    maxCaracteres: 2200,
    utileMin: 150,
    utileMax: 600,
    accrocheMax: 125,
    accrocheLibelle: 'visible dans le fil avant « plus »',
    visuel: '6 à 10 visuels, 1 080 × 1 350.',
    ossature: [
      { nom: 'Visuel 1', consigne: "L'accroche visuelle. Lisible sans légende, sans logo imposant." },
      { nom: 'Visuels 2 à 9', consigne: 'Une idée par visuel.' },
      { nom: 'Dernier visuel', consigne: "L'appel." },
      { nom: 'Légende', consigne: 'Les 125 premiers caractères comptent. La légende est indexée : elle contient les mots qu\'on cherche.', limite: 2200 },
    ],
    indicateurCle: 'enregistrements et partages — plus prédictifs que les mentions J\'aime',
    pieges: ['Un premier visuel qui demande la légende pour être compris ne sera pas ouvert.'],
    releve: '2026-10-06',
  },

  'ig-reel': {
    slug: 'ig-reel',
    reseau: 'instagram',
    nom: 'Instagram — Reel',
    raison: 'Le moteur de portée du réseau. Pour Veolt, un rendu 3D est un Reel tout fait.',
    cadence: '2 fois par semaine',
    maxCaracteres: 2200,
    utileMin: 80,
    utileMax: 400,
    accrocheMax: 125,
    accrocheLibelle: 'visible dans le fil avant « plus »',
    visuel: '10 à 20 secondes, 9:16, texte incrusté systématique. Plafond absolu 3 minutes.',
    ossature: [
      { nom: '0 à 3 secondes', consigne: 'Le sujet lisible sans son. Pas d\'intro, pas d\'animation de marque.' },
      { nom: 'Promesse', consigne: 'Ce que le spectateur saura dans quinze secondes.' },
      { nom: 'Corps', consigne: '10 à 20 secondes. Texte incrusté systématique.' },
      { nom: 'Boucle', consigne: 'La dernière seconde renvoie à la première — la relecture compte double.' },
      { nom: 'Légende', consigne: 'Indexée. Les mots qu\'on cherche doivent y être.', limite: 2200 },
    ],
    indicateurCle: 'taux de visionnage complet',
    pieges: [
      'Tout ce qui dépasse 40 secondes perd en achèvement.',
      'Une animation de logo en ouverture coûte les trois secondes qui décident de tout.',
    ],
    releve: '2026-10-06',
  },

  'ig-video': {
    slug: 'ig-video',
    reseau: 'instagram',
    nom: 'Instagram — vidéo longue (fil)',
    raison: "Au-delà de 60 secondes, pour une démonstration ou un cas détaillé.",
    cadence: 'ponctuelle',
    maxCaracteres: 2200,
    utileMin: 150,
    utileMax: 600,
    accrocheMax: 125,
    accrocheLibelle: 'visible dans le fil avant « plus »',
    visuel: '60 secondes et plus, 9:16 ou 4:5, sous-titres incrustés.',
    ossature: [
      { nom: 'Ouverture', consigne: "L'image la plus forte, pas un générique." },
      { nom: 'Corps', consigne: 'Une démonstration ou un cas, dans l\'ordre où on le vivrait.' },
      { nom: 'Sous-titres', consigne: 'Incrustés.' },
      { nom: 'Légende', consigne: 'Indexée.', limite: 2200 },
    ],
    indicateurCle: 'durée moyenne de visionnage',
    pieges: ['Un Reel réemployé tel quel en vidéo longue n\'a pas de raison d\'être : refaire le montage.'],
    releve: '2026-10-06',
  },

  'reddit-texte': {
    slug: 'reddit-texte',
    reseau: 'reddit',
    nom: 'Reddit — post textuel',
    raison:
      "Très forte valeur, très fort risque. Un post qui marche n'a rien à vendre : il raconte un chiffre, une erreur, une méthode. Le trafic vient de la signature, pas du lien.",
    cadence: 'soumis au plafond de fréquence déclaré du sous-forum',
    maxCaracteres: 40000,
    utileMin: 400,
    utileMax: 2000,
    accrocheMax: 300,
    accrocheLibelle: 'titre du post',
    visuel: 'aucun. C\'est un post textuel.',
    ossature: [
      { nom: 'Titre', consigne: 'Une question ou un constat. Jamais le nom du produit.', limite: 300 },
      { nom: 'Corps', consigne: 'Le contexte d\'abord, l\'utilité ensuite. 400 à 2 000 caractères.' },
      { nom: 'Affiliation', consigne: 'Une ligne, en clair, à la fin : qui on est. C\'est ce qui évite le ban.' },
      { nom: 'Lien', consigne: "Aucun au premier jet. En commentaire, si on le demande." },
    ],
    indicateurCle: 'ratio de votes positifs, et absence de retrait par la modération',
    pieges: [
      'La règle « 9 pour 1 » reste la norme de fait : neuf contributions utiles pour une mention de soi.',
      'r/SaaS : une auto-promotion tous les 60 jours depuis avril 2026, liste noire de l\'URL en cas de manquement.',
      'r/marketing, r/SEO, r/PPC, r/b2bmarketing, r/LeadGeneration interdisent purement la promotion.',
      'Un compte Reddit grillé est irrécupérable. Le garde-fou de fréquence est une protection d\'actif.',
    ],
    releve: '2026-10-06',
  },

  'tiktok-video': {
    slug: 'tiktok-video',
    reseau: 'tiktok',
    nom: 'TikTok — vidéo courte',
    raison: 'Veolt seulement. Le registre du réseau est incompatible avec la gravité juridique de MagistrIA.',
    cadence: '1 fois par semaine (Veolt)',
    maxCaracteres: 2200,
    utileMin: 50,
    utileMax: 300,
    accrocheMax: 100,
    accrocheLibelle: 'légende visible',
    visuel: '15 à 30 secondes, 9:16. Aucun watermark importé.',
    ossature: [
      { nom: '0 à 3 secondes', consigne: "L'image la plus forte du montage, pas une introduction." },
      { nom: '3 à 8 secondes', consigne: 'Le problème, dit en une phrase.' },
      { nom: '8 à 25 secondes', consigne: 'La démonstration, en plans courts.' },
      { nom: 'Fin', consigne: "L'appel implicite : « dis-moi en commentaire »." },
    ],
    indicateurCle: 'taux de visionnage complet',
    pieges: [
      'Un Reel réemployé brut avec son watermark est détecté et enterré.',
      'Le réseau punit les montages lents plus durement qu\'Instagram.',
    ],
    releve: '2026-10-06',
  },

  'blog-article': {
    slug: 'blog-article',
    reseau: 'blog',
    nom: 'Blog — article de grappe',
    raison:
      "Le seul actif qu'on possède vraiment. En 2026 l'autorité thématique est passée devant les backlinks comme premier signal B2B, et les moteurs de réponse citent ce qui répond dans les 100 premiers mots.",
    cadence: '2 par semaine au lancement, puis 1 par semaine + 1 mise à jour',
    maxCaracteres: 40000,
    utileMin: 1200,
    utileMax: 12000,
    accrocheMax: 160,
    accrocheLibelle: 'titre — écrit comme la requête',
    visuel: 'une illustration par section si elle apporte une information.',
    ossature: [
      { nom: 'Titre', consigne: 'Écrit comme la requête, pas comme une accroche de magazine.', limite: 160 },
      { nom: 'Réponse', consigne: 'La réponse directe, dans les 100 premiers mots, autonome et citable telle quelle.' },
      { nom: 'Contexte', consigne: 'Pourquoi la question se pose.' },
      { nom: 'Corps', consigne: 'Une section par sous-question. Chaque titre de section est une question réelle.' },
      { nom: 'Preuve', consigne: 'Données, articles de loi, décisions, chiffres mesurés par nous.' },
      { nom: 'À retenir', consigne: 'Liste courte, citable telle quelle par une IA.' },
      { nom: 'Maillage', consigne: '3 à 5 liens internes vers la grappe. Et remonter les articles existants vers celui-ci.' },
      { nom: 'Date', consigne: 'Date de mise à jour visible — les URL citées par les IA sont ~26 % plus récentes.' },
    ],
    indicateurCle: 'part des requêtes de la grappe en top 10, et citations par les IA (relevé manuel)',
    pieges: [
      'Un article isolé n\'établit aucune autorité. C\'est le maillage de 8 à 12 articles qui la crée.',
      'La mise à jour d\'un article existant rapporte souvent plus que la création d\'un nouveau.',
    ],
    releve: '2026-10-06',
  },
};

export const RESEAUX: Record<ReseauSlug, { nom: string; formats: FormatSlug[] }> = {
  linkedin: { nom: 'LinkedIn', formats: ['li-texte-image', 'li-carrousel', 'li-video'] },
  instagram: { nom: 'Instagram', formats: ['ig-carrousel', 'ig-reel', 'ig-video'] },
  reddit: { nom: 'Reddit', formats: ['reddit-texte'] },
  tiktok: { nom: 'TikTok', formats: ['tiktok-video'] },
  blog: { nom: 'Blog', formats: ['blog-article'] },
};

export function format(slug: string): FormatSpec {
  const f = FORMATS[slug as FormatSlug];
  if (!f) throw new Error(`Format inconnu : ${slug}`);
  return f;
}

export const TOUS_FORMATS = Object.values(FORMATS);
