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
import type { Forme3D, Place3D } from './scene3d';

/**
 * La couche 3D d'un plan, reprise des sites (voir scene3d.ts) : la sphère de
 * particules de veolt.fr ou le cerveau de magistrai.fr. D'un plan au suivant,
 * la forme se métamorphose (sphère → écran → € → galaxie…).
 */
export interface Noyau3D {
  forme?: Forme3D;
  place?: Place3D;
  /** La forme se construit depuis des particules dispersées. */
  construction?: boolean;
  /** Onde de choc / éclat au milieu du plan. */
  onde?: boolean;
  /** Le cadran façon Jarvis (MagistrIA) se trace autour. */
  cadran?: boolean;
  /** Agitation des particules : 0 calme, 1 « ça travaille ». */
  activite?: number;
  /** Luminosité imposée (0 à 1) ; sinon celle de la place (0,26 en fond). */
  intensite?: number;
}

/** Une pastille de verre qui flotte au bord de l'écran produit (« ✓ Source vérifiée »). */
export interface BulleApp {
  texte: string;
  icone?: string;
  cote?: 'gauche' | 'droite';
  /** Instant d'apparition dans le plan (s). */
  a?: number;
  /** Hauteur relative sur la fenêtre (0 haut, 1 bas). */
  hauteur?: number;
}

/**
 * Le mouvement de la caméra virtuelle pendant un plan (motion design v4). Sans
 * réglage, chaque plan reçoit un mouvement lent, différent de celui du plan
 * précédent : une image qui ne bouge jamais se lit comme une diapositive.
 * Le décor bouge moins que le premier plan (parallaxe) — c'est ce qui donne
 * la profondeur.
 */
export type MouvementCamera = 'pousse' | 'recul' | 'derive-gauche' | 'derive-droite' | 'monte' | 'descend' | 'fixe';
export interface CameraPlan {
  mouvement?: MouvementCamera;
  /** 1 par défaut ; 0 fige, 2 double l'amplitude. */
  force?: number;
}

/**
 * Le raccord à l'entrée d'un plan. `auto` : celui de la marque, varié d'un plan
 * à l'autre. `travers` : zoom et flou de vitesse ; `fondu` : fondu flouté ;
 * `glisse` : le plan entrant pousse le sortant vers le haut ; `volet` : volet
 * en biais à l'arête lumineuse ; `iris` : ouverture en cercle ; `coupe` : sèche.
 */
export type TransitionPlan = 'auto' | 'coupe' | 'travers' | 'fondu' | 'glisse' | 'volet' | 'iris';

export type SourcePlan = { type: 'carte' } | { type: 'media'; id: number };

export type EtatCitation = 'verifiee' | 'inconnue' | 'hors-corpus';

/** Décor animé d'un plan, dessiné dans le navigateur. `carte` : le fond de marque généré (logo, pied). */
export type FondPlan = 'carte' | 'etoiles' | 'horizon' | 'rayons';

/**
 * Ce qui apparaît, l'un après l'autre, dans l'écran produit d'une scène `app`.
 * Tout y est marqué comme exemple : l'interface est fidèle, les données fictives.
 */
export type ElementApp =
  | { type: 'fichiers'; items: Array<{ nom: string; etat: string }>; chronologie?: Array<{ quand: string; texte: string; tag?: string }> }
  /** Tapée dans le champ de saisie, puis posée en bulle « Vous : … ». */
  | { type: 'question'; texte: string }
  | { type: 'sources'; items: string[] }
  /** `**gras**` et renvois `[1]` reconnus. */
  | { type: 'reponse'; titre?: string; texte: string }
  | { type: 'bloc'; titre: string; texte?: string; items?: string[]; ton?: 'neutre' | 'alerte' }
  | { type: 'courrier'; titre: string; texte: string; tag?: string }
  /** Une réponse d'IA générique, puis barrée : « le piège, une réponse sans source ». */
  | { type: 'piege'; question: string; reponse: string; alerte: string }
  /** Des notifications qui arrivent en direct (« Nouvelle demande de devis »). */
  | { type: 'notifications'; items: Array<{ titre: string; detail?: string }> }
  /** Le curseur va sur le bouton, clique : le statut change, une bulle confirme. */
  | { type: 'clic'; avant: string; libelle: string; bouton: string; apres: string; toast?: string };

/**
 * Ce qui se passe dans un plan, au-delà du titre animé. Chaque scène est
 * dessinée et animée dans le navigateur, aux couleurs de la marque — c'est ce
 * qui fait d'une vidéo une démonstration plutôt qu'une suite de phrases.
 * Le `texte` du plan sert de titre à la scène.
 *
 * Règle tenue par les scripts qui les utilisent : rien n'y est inventé. Un
 * écran produit montre une fonction réelle sur un dossier d'exemple, un
 * tableur porte « EXEMPLE — chiffres fictifs », un chiffre est un prix affiché.
 */
export type Scene =
  | { type: 'titre' }
  /** Un chiffre réel qui défile jusqu'à sa valeur (prix affiché, délai tenu). */
  | { type: 'chiffre'; valeur: string; legende: string }
  /** Une liste qui se construit, élément par élément. */
  | { type: 'liste'; items: string[] }
  /** Deux colonnes, la seconde mise en avant. */
  | { type: 'comparatif'; gauche: { titre: string; points: string[] }; droite: { titre: string; points: string[] } }
  /** Écran d'analyse (MagistrIA) : clause surlignée, raisonnement en étapes, citations classées. */
  | {
      type: 'analyse';
      fenetre: string;
      extrait: string;
      surligne: string;
      etapes: Array<{ label: string; texte: string }>;
      citations: Array<{ ref: string; etat: EtatCitation }>;
    }
  /** Tableur d'exemple (Veolt) : lignes repérées une à une, avec leur note. */
  | {
      type: 'tableur';
      fenetre: string;
      colonnes: string[];
      lignes: Array<{ libelle: string; valeurs: string[] }>;
      reperes: Array<{ ligne: number; note: string }>;
    }
  /** Écran de fin : marque, slogan, public visé, bouton d'action, adresse, petite ligne. */
  | { type: 'fin'; action: string; adresse?: string; slogan?: string[]; public?: string; note?: string }
  /** Écran produit vivant : saisie, sources, réponse, blocs, courrier… dans une fenêtre d'application. */
  | { type: 'app'; fenetre: string; onglets?: string[]; saisie?: string; elements: ElementApp[]; flux?: string[]; mention?: string; bulles?: BulleApp[] }
  /**
   * Grille « bento » de tuiles en verre qui s'assemblent : les fonctions
   * réelles d'un outil, une par tuile. La première tuile prend toute la largeur.
   */
  | { type: 'bento'; tuiles: Array<{ titre: string; texte?: string; grand?: string; icone?: string }> }
  /** Apparition de la marque : logotype, puis sa phrase. */
  | { type: 'marque'; slogan?: string }
  /** Des pièces papier qui se posent et s'empilent, puis s'éparpillent. */
  | { type: 'documents'; items: string[]; dispersion?: boolean }
  /** Récapitulatif coché, élément par élément. */
  | { type: 'recap'; items: string[] }
  /**
   * Un site d'artisan ou de commerçant qui défile dans un téléphone — une
   * MAQUETTE d'exemple, dessinée pour la vidéo et présentée comme telle.
   */
  | {
      type: 'site';
      nom: string;
      metier: string;
      accroche: string;
      action: string;
      services: string[];
      horaires?: string[];
      couleur?: string;
      reperes?: string[];
      mention?: string;
    }
  // ── Motion design v4 (17/11) ────────────────────────────────────────────
  /**
   * Typographie cinétique plein cadre : les lignes arrivent l'une après
   * l'autre, chacune taillée à la largeur de l'écran. C'est l'accroche des
   * trois premières secondes. Le `texte` du plan garde la phrase entière
   * (aperçus, cartes, accessibilité) ; il n'est pas redessiné.
   */
  | { type: 'mots'; lignes: Array<{ texte: string; accent?: boolean; petit?: boolean }>; mode?: 'pile' | 'un-par-un' }
  /**
   * Une courbe qui se trace (trésorerie, distribution) dans un panneau de
   * verre. AUCUNE valeur n'est affichée sur l'axe : la forme est un EXEMPLE,
   * et la mention le dit. `repere` pose un marqueur et sa note sur un point.
   */
  | {
      type: 'courbe';
      fenetre: string;
      points: number[];
      etiquettesX?: string[];
      repere?: { index: number; note: string };
      /**
       * Avec une unité (« k€ »), l'axe vertical est gradué et le repère porte sa
       * valeur : les points sont alors des chiffres d'EXEMPLE, et la mention doit le dire.
       */
      unite?: string;
      /** Zone mise en avant, entre deux indices (« l'intervalle probable »). */
      bande?: { de: number; a: number; note?: string };
      legende?: string;
      mention?: string;
    }
  /** Un parcours vertical : une lumière descend la ligne, chaque étape s'allume. `fort` : l'étape qu'on souligne. */
  | { type: 'parcours'; etapes: Array<{ titre: string; detail?: string; fort?: boolean }> }
  /**
   * Un rapport qui défile vite, puis s'arrête : quelques phrases surlignées,
   * chacune avec ce qu'elle commande. Le reste s'estompe. Document d'EXEMPLE.
   */
  | { type: 'rapport'; titre: string; pages?: number; phrases: Array<{ texte: string; note: string }>; mention?: string }
  /**
   * Un vrai objet 3D, rendu image par image par le studio (three.js) : un
   * modèle d'EXEMPLE, dit à l'écran. `heros` : il tourne et change de coloris ;
   * `grille` : les déclinaisons s'alignent ; `fil` : du maillage au rendu.
   */
  | { type: 'objet3d'; mode: 'heros' | 'grille' | 'fil'; coloris?: string[]; etiquettes?: string[]; mention?: string }
  /**
   * Le clip du plan montré dans un cadre, comme une pièce de vitrine, au lieu
   * de passer en fond voilé derrière le texte : c'est lui qu'on regarde.
   * Sans clip (nom introuvable), le plan retombe sur son titre seul.
   */
  | { type: 'vitrine'; etiquette?: string; mention?: string }
  /**
   * Une galerie d'images RÉELLES livrées avec l'outil (`IMAGES_LIVREES`) : deux
   * bandes de vignettes qui défilent en sens contraire, comme sur veolt.fr.
   * Chaque vignette porte son nom et sa nature (« Concept · Parfumerie ») :
   * un concept reste un concept, il n'est jamais présenté comme un client.
   */
  | { type: 'galerie'; images: string[]; mention?: string }
  /**
   * Avant / après d'une page d'accueil : une MAQUETTE d'exemple (entreprise
   * fictive, dite à l'écran). Un volet découvre la version refaite, puis les
   * trois repères se posent dessus. Aucun chiffre de conversion : on montre le
   * travail, on n'annonce pas de résultat.
   */
  | {
      type: 'avant-apres';
      enseigne: string;
      avant: { accroche: string; boutons: string[] };
      apres: { promesse: string; bouton: string; preuves: string[] };
      reperes: string[];
      mention: string;
    }
  /**
   * Un tableau de bord qui se construit : indicateurs, graphique GRADUÉ (axes,
   * unités, valeurs sur chaque barre ou point), repère, jauge. La précision est
   * réelle ; les données sont un EXEMPLE, et `mention` — obligatoire — le dit.
   */
  | {
      type: 'dashboard';
      fenetre: string;
      indicateurs: Array<{ libelle: string; valeur: string; note?: string; ton?: 'neutre' | 'alerte' }>;
      graphique: {
        titre: string;
        unite?: string;
        type: 'barres' | 'ligne';
        etiquettes: string[];
        series: Array<{ nom: string; valeurs: number[] }>;
        repere?: { index: number; note: string; ton?: 'neutre' | 'alerte' };
      };
      jauge?: { libelle: string; part: number; texte: string };
      mention: string;
    };

export interface PlanMontage {
  duree: number;
  texte: string;
  /** Ce qu'on voit, tel que décrit par le script — une aide au choix de l'image. */
  image: string;
  source: SourcePlan;
  /** La scène du plan ; absente : titre animé seul. */
  scene?: Scene;
  /** Repère de chapitre au-dessus du titre (« 01 / 06 · Posez votre question »). */
  chapitre?: string;
  /** Phrase d'accent sous le titre, en italique (« le sinistre est-il couvert ? »). */
  accent?: string;
  /** Annotation manuscrite (« ← souvent oublié »). */
  annotation?: string;
  /** Décor du plan ; absent : celui de la marque. */
  fond?: FondPlan;
  /** Titre centré (accroche, phrase forte) plutôt qu'aligné à gauche. */
  centre?: boolean;
  /** Sous-titre « karaoké » en bas d'écran : le mot en cours surligné. */
  sousTitre?: string;
  /** Couche 3D de particules (sphère Veolt, cerveau MagistrIA). */
  noyau?: Noyau3D;
  /**
   * Clip vidéo de la médiathèque (Higgsfield, Blender…) à poser en fond, par son
   * nom de fichier sans extension. Résolu au montage ; introuvable : la carte.
   */
  clip?: string;
  /** Mouvement de caméra du plan ; absent : automatique. */
  camera?: CameraPlan;
  /** Raccord d'entrée du plan ; absent : automatique. */
  transition?: TransitionPlan;
}

/** Cadre de sortie par format : 9:16 là où le réseau l'impose, 4:5 ailleurs (le plus haut accepté en fil). */
export function cadreVideo(formatSlug: string, impose?: '9:16' | '4:5'): { largeur: number; hauteur: number; ratio: string } {
  if (impose === '9:16') return { largeur: 1080, hauteur: 1920, ratio: '9:16' };
  if (impose === '4:5') return { largeur: 1080, hauteur: 1350, ratio: '4:5' };
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
    ...(p.scene ? { scene: p.scene } : {}),
    ...(p.chapitre ? { chapitre: p.chapitre } : {}),
    ...(p.accent ? { accent: p.accent } : {}),
    ...(p.annotation ? { annotation: p.annotation } : {}),
    ...(p.fond ? { fond: p.fond } : {}),
    ...(p.centre ? { centre: true } : {}),
    ...(p.sousTitre ? { sousTitre: p.sousTitre } : {}),
    ...(p.noyau ? { noyau: p.noyau } : {}),
    ...(p.clip ? { clip: p.clip } : {}),
    ...(p.camera ? { camera: p.camera } : {}),
    ...(p.transition ? { transition: p.transition } : {}),
  }));
}

const MAX_TEXTE_PLAN = 70;

/** Coupe un texte en phrases courtes, lisibles en incrustation (≤ `max` caractères, souplement). */
function phrases(texte: string, max = MAX_TEXTE_PLAN): string[] {
  return texte
    .replace(/PAGE\s+\d+\s*[—–-]\s*/g, ' ')
    .replace(/À RETENIR\s*:\s*/g, '')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?…])\s+/)
    .map((x) => x.trim())
    .filter((x) => x.length > 3)
    .flatMap((x) => couper(x, max));
}

/**
 * Une phrase trop longue se coupe à la ponctuation la plus proche du milieu
 * (virgule, deux-points, tiret) — là où le lecteur s'arrête déjà. Sans
 * ponctuation utilisable, elle reste entière jusqu'à `max + 25` caractères :
 * une carte lit très bien trois lignes, alors qu'une phrase coupée au milieu
 * d'un groupe de mots (« sans montrer son / raisonnement ») ne se lit plus.
 */
function couper(x: string, max: number): string[] {
  if (x.length <= max) return [x];
  const milieu = x.length / 2;
  const c = [...x.matchAll(/[,:;—–]\s/g)]
    .map((m) => (m.index ?? 0) + 1)
    .filter((k) => k >= 15 && x.length - k >= 15)
    .sort((a, b) => Math.abs(a - milieu) - Math.abs(b - milieu))[0];
  if (c) return [...couper(x.slice(0, c).trim(), max), ...couper(x.slice(c).trim(), max)];
  if (x.length <= max + 25) return [x];
  const mot = x.lastIndexOf(' ', Math.round(milieu)) || Math.round(milieu);
  return [...couper(x.slice(0, mot).trim(), max), ...couper(x.slice(mot).trim(), max)];
}

const normal = (t: string) => t.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, ' ').trim();

/** Le temps de lire un texte incrusté : une seconde et quart, plus le temps de lecture, borné. */
const dureeLecture = (t: string) => Math.min(5, Math.max(2.5, Math.round((1.25 + t.length * 0.045) * 2) / 2));

/**
 * Faute de script écrit pour ce post : le titre ouvre (il porte le sujet sans
 * le son, dans les trois premières secondes), puis le propos phrase par phrase
 * jusqu'à la durée conseillée du format ; l'appel à l'action ferme, entier.
 *
 * Quand l'accroche n'est que le début du corps (cas courant : c'est ce qui
 * s'affiche avant « voir plus »), seul le corps sert — sinon la vidéo dirait
 * deux fois la même phrase.
 */
export function plansDepuisPost(
  p: { titre?: string | null; accroche: string; corps: string; appel: string },
  dureeVisee: [number, number] = [10, 20],
): PlanMontage[] {
  const plans: PlanMontage[] = [];
  const ouverture = (p.titre && p.titre.length <= 90 ? p.titre : phrases(p.accroche)[0]) ?? p.accroche.slice(0, MAX_TEXTE_PLAN);
  plans.push({ duree: 3, texte: ouverture, image: 'Ouverture — le sujet, lisible sans le son.', source: { type: 'carte' } });

  const accrocheDansCorps = normal(p.corps).startsWith(normal(p.accroche).slice(0, 60));
  const propos = accrocheDansCorps ? phrases(p.corps) : [...phrases(p.accroche), ...phrases(p.corps)];
  const fins = phrases(p.appel, 100).slice(0, 2);
  const reserve = fins.reduce((n, t) => n + dureeLecture(t), 0);

  const vus = [normal(ouverture)];
  let total = 3;
  let k = 0;
  const ajouter = (t: string) => {
    const d = dureeLecture(t);
    plans.push({ duree: d, texte: t, image: '', source: { type: 'carte' } });
    total += d;
  };
  for (; k < propos.length; k++) {
    if (plans.length + fins.length >= 11 || total + reserve >= dureeVisee[1]) break;
    const t = propos[k];
    const n = normal(t);
    if (!n || vus.some((v) => v.includes(n) || n.includes(v))) continue;
    vus.push(n);
    ajouter(t);
    if (total + reserve >= dureeVisee[0] && plans.length >= 5) {
      k++;
      break;
    }
  }
  // Ne jamais finir le propos sur un fragment (« Quand on n'a pas de preuve à
  // montrer, ») : on complète la phrase si la suite existe, sinon on le retire.
  const suspendu = () => plans.length > 1 && /[,:;—–]$/.test(plans[plans.length - 1].texte);
  while (suspendu() && k < propos.length && plans.length + fins.length < 12) ajouter(propos[k++]);
  while (suspendu()) total -= plans.pop()!.duree;
  for (const [i, t] of fins.entries()) {
    plans.push({ duree: dureeLecture(t), texte: t, image: i === 0 ? 'Fermeture — l’appel à l’action.' : '', source: { type: 'carte' } });
  }
  return plans;
}

/**
 * Clips livrés avec l'outil (`public/clips`), utilisables en fond de plan sans
 * passer par la médiathèque : un script les appelle par nom (`clip: '…'`).
 * Ce sont des films du portfolio vidéo du studio, repris le 17/11 en
 * 720 × 1280. Identifiants négatifs : ils ne croisent jamais ceux de la base.
 * Un clip du même nom déposé dans la médiathèque passe devant.
 *
 * Un plan qui les montre dit seulement « film produit par le studio » : aucun
 * script ne nomme un client ni n'annonce un résultat (règle 2 du dépôt).
 */
export const CLIPS_LIVRES: Array<{ id: number; entite: 'veolt' | 'magistria'; nom: string; url: string }> = [
  { id: -1, entite: 'veolt', nom: 'veolt-demo-canette', url: '/clips/veolt-demo-canette.mp4' },
  { id: -2, entite: 'veolt', nom: 'veolt-demo-espace', url: '/clips/veolt-demo-espace.mp4' },
  { id: -3, entite: 'veolt', nom: 'veolt-demo-tonic', url: '/clips/veolt-demo-tonic.mp4' },
];

/**
 * Images livrées avec l'outil (`public/actifs`), appelées par nom dans une
 * scène `galerie`. Pour Veolt : les huit concepts de sites montrés sur
 * veolt.fr (repris le 17/11), avec le nom et la nature que le site leur donne.
 * Ce sont des CONCEPTS — le site le dit, la vignette aussi.
 */
export const IMAGES_LIVREES: Record<string, { entite: 'veolt' | 'magistria'; url: string; nom: string; nature: string }> = {
  'concept-elysia': { entite: 'veolt', url: '/actifs/veolt/concept-elysia.jpg', nom: 'Elysia', nature: 'Concept · E-commerce high-tech' },
  'concept-novo': { entite: 'veolt', url: '/actifs/veolt/concept-novo.jpg', nom: 'Novo', nature: 'Concept · Vitrine minimaliste' },
  'concept-atelier-noir': { entite: 'veolt', url: '/actifs/veolt/concept-atelier-noir.jpg', nom: 'Atelier Noir', nature: 'Concept · Parfumerie' },
  'concept-nova': { entite: 'veolt', url: '/actifs/veolt/concept-nova.jpg', nom: 'Nova', nature: 'Concept · Sneakers' },
  'concept-aurelie': { entite: 'veolt', url: '/actifs/veolt/concept-aurelie.jpg', nom: 'Aurélie', nature: 'Concept · Horlogerie' },
  'concept-velora': { entite: 'veolt', url: '/actifs/veolt/concept-velora.jpg', nom: 'Velora', nature: 'Concept · Skincare' },
  'concept-moka': { entite: 'veolt', url: '/actifs/veolt/concept-moka.jpg', nom: 'Moka', nature: 'Concept · Café' },
  'concept-orme': { entite: 'veolt', url: '/actifs/veolt/concept-orme.jpg', nom: 'Orme', nature: 'Concept · Mobilier' },
};

export const dureeTotale = (plans: PlanMontage[]) => plans.reduce((n, p) => n + p.duree, 0);
