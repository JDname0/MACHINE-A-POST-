/**
 * Les consignes du studio Veolt (25/11/2026) — tout ce que Jonathan a demandé
 * au fil des échanges, écrit une fois, et lu par chaque génération :
 *
 *  - la rédaction par l'IA (`ia.ts` : réécriture, plans vidéo, articles) ;
 *  - le prompt des images (`illustrations.ts`, `promptVeolt`) ;
 *  - le superviseur qualité (`superviseur.ts`, page Qualité) ;
 *  - l'affichage dans le studio (pages Visuels, Studio vidéo, Qualité).
 *
 * Une consigne ajoutée ici s'applique partout au prochain passage. Chaque ligne
 * dit la règle et pourquoi — pour que personne ne la « corrige ».
 */
import type { EntiteSlug } from './marques';

export interface Consigne {
  domaine: 'Tous' | 'Texte' | 'Carrousel' | 'Image' | 'Vidéo' | 'Article';
  regle: string;
  pourquoi: string;
}

export const CONSIGNES_VEOLT: Consigne[] = [
  // ── Tous les formats ───────────────────────────────────────────────────
  { domaine: 'Tous', regle: 'Montrer, pas dire : chaque page, chaque plan montre ce que dit son texte (image, capture réelle, carte de prix, écran).', pourquoi: 'Un texte seul sur fond ne prouve rien et se fait défiler.' },
  { domaine: 'Tous', regle: 'Le contenu réel de veolt.fr d’abord (questionnaire, packs et prix, espace client, analyse gratuite, concepts de sites), l’IA en complément.', pourquoi: 'Le vrai rassure plus que le généré, et il se vérifie.' },
  { domaine: 'Tous', regle: 'Chaque processus finit sur la version finale en situation réelle : le produit dans un vrai décor, le site en main.', pourquoi: 'Le client achète le résultat, pas les étapes.' },
  { domaine: 'Tous', regle: 'Aucune preuve inventée : ni client, ni chiffre de résultat, ni logo client. 1337 (Tonic, Focus, Gélule…) est exclu.', pourquoi: 'Règle 2 de la machine. Un « [?] » reste tant qu’une mesure réelle manque.' },
  { domaine: 'Tous', regle: 'Une image générée porte sa mention (« Illustration IA », « Concept Veolt · mise en situation IA ») ; une capture, « Capture réelle · veolt.fr ».', pourquoi: 'Rien ne passe pour un travail client.' },
  { domaine: 'Tous', regle: 'Pas d’emoji dans les images ni dans les titres de vidéo. Le logo V figure sur chaque post.', pourquoi: 'Les polices de titre n’ont pas les glyphes ; le logo signe le post.' },

  // ── Texte ──────────────────────────────────────────────────────────────
  { domaine: 'Texte', regle: 'Écrire comme on parle à un client : phrases courtes, mots concrets, « on » ou « nous ».', pourquoi: 'Le lecteur repère le texte « IA » en deux lignes et décroche.' },
  { domaine: 'Texte', regle: 'Bannir les tics d’IA : « Le vrai X n’est pas Y, c’est Z », les triades plaquées, « Et si… ? » en ouverture, « Dans un monde où », les adverbes d’emphase, les deux-points en cascade.', pourquoi: 'Ce sont les structures que les lecteurs associent au texte généré.' },
  { domaine: 'Texte', regle: 'LinkedIn et Instagram : des emojis mesurés (un par idée au plus, jamais en ouverture), 👉 devant l’appel. Blog et Reddit : aucun.', pourquoi: 'Humain sans faire enfantin.' },
  { domaine: 'Texte', regle: 'Finir sur une vraie question (LinkedIn), jamais « likez » ni « commentez MOT ».', pourquoi: 'Codes LinkedIn 2026 : l’appât à l’engagement est pénalisé.' },

  // ── Carrousel ──────────────────────────────────────────────────────────
  { domaine: 'Carrousel', regle: '7 pages au plus : couverture, 4 à 5 pages illustrées, la version finale en situation, la page de fin.', pourquoi: 'Au-delà, la lecture décroche ; 10 ou 12 pages, c’est trop.' },
  { domaine: 'Carrousel', regle: 'Une idée par page : un titre court (une phrase, finie par « . » ou « ? »), puis une ou deux phrases simples.', pourquoi: 'Lisible en une seconde sur un téléphone.' },
  { domaine: 'Carrousel', regle: 'Mise en forme : un ou deux mots-clés par page entre astérisques (*dès 119 € HT*), mis en valeur à l’image.', pourquoi: 'L’œil accroche le mot qui compte ; un bloc de texte uniforme fait « généré ».' },
  { domaine: 'Carrousel', regle: 'Les prix se montrent dans leur carte complète (packs recomposés depuis veolt.fr), jamais en capture coupée.', pourquoi: 'L’abonnement doit se lire en entier.' },

  // ── Image ──────────────────────────────────────────────────────────────
  { domaine: 'Image', regle: 'Une image déclarative : elle montre exactement l’action de la page (le geste, l’outil, l’objet), pas une ambiance.', pourquoi: 'Le lecteur doit comprendre la page sans lire.' },
  { domaine: 'Image', regle: 'Photographie éditoriale réaliste, matières et outils réels, mains au travail (jamais de visage), lumière d’accent magenta ou violette, pas un bain de couleur.', pourquoi: 'Moins « IA », plus « studio ».' },
  { domaine: 'Image', regle: 'Écrans et documents en blocs gris abstraits ; aucun texte lisible, aucun chiffre, aucun logo dans l’image générée.', pourquoi: 'Le texte généré sort déformé ; les vrais chiffres viennent de la mise en page.' },
  { domaine: 'Image', regle: 'Interdits : hologrammes, particules lumineuses partout, HUD futuriste, rendu plastique, poses de banque d’images, mains sans corps.', pourquoi: 'Ce sont les signes du visuel « IA générique ».' },

  // ── Vidéo ──────────────────────────────────────────────────────────────
  { domaine: 'Vidéo', regle: 'Aucun plan en texte seul : chaque plan du milieu porte une image, une capture réelle animée (la caméra avance vers le bloc utile) ou un écran produit.', pourquoi: 'Une suite de textes animés n’est pas une vidéo.' },
  { domaine: 'Vidéo', regle: 'Accroche montrée dès la première seconde, 3 mots par seconde au plus, 20 à 30 s, une étape par plan avec son numéro (01 · …).', pourquoi: 'Lu sans le son, la rétention se joue au début.' },
  { domaine: 'Vidéo', regle: 'Chaque scène déclare ses sons (pose du cadre, reflet) ; fabriquer les vidéos dans Chrome (son AAC).', pourquoi: 'Une scène sans repère sonore sort muette.' },

  // ── Article ────────────────────────────────────────────────────────────
  { domaine: 'Article', regle: '3 figures au moins, chacune avant la section qu’elle illustre ; une réponse en bref en tête ; une source par fait.', pourquoi: 'Lisible, citable par les moteurs et les IA.' },
];

export function consignesDe(entite: EntiteSlug): Consigne[] {
  return entite === 'veolt' ? CONSIGNES_VEOLT : [];
}

/** Les consignes, en texte, pour le cadre donné à l'IA (`ia.ts`). */
export function consignesPourIA(entite: EntiteSlug): string[] {
  const c = consignesDe(entite).filter((x) => x.domaine === 'Tous' || x.domaine === 'Texte' || x.domaine === 'Carrousel' || x.domaine === 'Vidéo' || x.domaine === 'Article');
  if (!c.length) return [];
  return ['Consignes du studio (Jonathan) — à tenir dans tout ce que tu écris :', ...c.map((x) => `- [${x.domaine}] ${x.regle}`), ''];
}
