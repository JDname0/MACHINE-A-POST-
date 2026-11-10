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

export type EtatCitation = 'verifiee' | 'inconnue' | 'hors-corpus';

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
  /** Écran de fin : titre, bouton d'action, adresse du site. */
  | { type: 'fin'; action: string; adresse?: string };

export interface PlanMontage {
  duree: number;
  texte: string;
  /** Ce qu'on voit, tel que décrit par le script — une aide au choix de l'image. */
  image: string;
  source: SourcePlan;
  /** La scène du plan ; absente : titre animé seul. */
  scene?: Scene;
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

export const dureeTotale = (plans: PlanMontage[]) => plans.reduce((n, p) => n + p.duree, 0);
