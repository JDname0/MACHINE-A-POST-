/**
 * Les séries Veolt du 25/11/2026 — tirées du **vrai contenu de veolt.fr**
 * (tarifs, questionnaire, espace client, analyse gratuite, concepts du
 * portfolio), relevé le jour même. Elles remplacent, dans le calendrier, les
 * créneaux qui répétaient huit fois le même post (`poserSeriesVeolt`, db.ts).
 *
 * Chaque série se décline en carrousel LinkedIn, Reel et TikTok. Rien n'y est
 * inventé : les prix et les étapes sont ceux du site, les concepts sont nommés
 * comme concepts, et les images portent leur mention (« Capture réelle ·
 * veolt.fr », « Illustration IA », « Concept Veolt »).
 */

import type { Sujet } from './sujets';

const SOURCE_TARIFS = 'veolt.fr/price.html, relevé le 25/11/2026 (packs vidéo, tarifs à l’unité, « Comment ça démarre »)';
const SOURCE_ANALYSE = 'veolt.fr/analyse.html, relevé le 25/11/2026 (questionnaire en 10 étapes, réponse sous 24 h, sans engagement)';

export const SERIES_VEOLT: Sujet[] = [
  {
    ref: 'v-vf-1',
    titre: 'De la demande au devis : ce que déclenche notre questionnaire',
    pilier: 'coulisses-methode',
    persona: 'dirigeant-site-bloque',
    accroche: "Chez Veolt, on n'envoie pas de devis au hasard. Tout part d'un questionnaire, et voilà ce qu'il déclenche.",
    corps: [
      "Le questionnaire prend quelques minutes : où en est votre projet, ce dont vous avez besoin, vos objectifs, votre budget et votre délai.",
      "À la fin, votre espace client se crée. Vous y réservez directement un appel de cadrage.",
      "Le devis arrive sous 24 h : périmètre, délai et prix arrêtés par écrit.",
      "Un premier paiement à la commande, le solde à la livraison. Rien ne démarre avant votre accord.",
    ],
    preuve: 'le parcours réel de veolt.fr, en captures',
    enseignement: 'Un devis précis commence par les bonnes questions, pas par un tarif générique.',
    appel: "Qu'est-ce qui vous freine le plus avant de demander un devis : le prix, le délai, ou savoir quoi demander ?",
    indicateur: 'clics vers le questionnaire',
    source: SOURCE_TARIFS,
  },
  {
    ref: 'v-vf-2',
    titre: 'Nos packs vidéo, ligne par ligne',
    pilier: 'positionnement-prix',
    persona: 'marque-produit',
    accroche: 'Cinq vidéos de 15 secondes pour 499 € HT. Voilà ce qu’il y a dedans, et pourquoi le prix par vidéo baisse avec le volume.',
    corps: [
      'Starter : 5 vidéos de 15 s, 499 € HT, soit 99,80 € la vidéo. Script, génération IA et montage, musique, sous-titres en format vertical.',
      'Creator : 10 vidéos de 15 s, 899 € HT. Des scripts variés, des accroches différentes, deux variations créatives.',
      'Business : 10 vidéos de 30 s, 1 799 € HT. Direction artistique, narration, plusieurs accroches à tester.',
      'À l’unité, une vidéo de 15 s coûte 119 € HT. Les packs restent plus avantageux, et on préfère le dire.',
    ],
    preuve: 'la grille tarifaire publique de veolt.fr, en captures',
    enseignement: 'Le prix d’une vidéo dépend moins de sa durée que du nombre de vidéos préparées ensemble.',
    appel: 'Combien de vidéos publiez-vous par mois aujourd’hui, et combien vous en faudrait-il ?',
    indicateur: 'clics vers les tarifs',
    source: SOURCE_TARIFS,
  },
  {
    ref: 'v-vf-3',
    titre: 'Une vidéo fabriquée avec l’IA, étape par étape',
    pilier: 'coulisses-methode',
    persona: 'marque-produit',
    accroche: '« Génération IA + montage » : c’est écrit dans nos packs. Voilà ce que ça veut dire, concrètement.',
    corps: [
      'Tout commence par un script et un concept, écrits avant de générer quoi que ce soit.',
      'Chaque plan se décrit dans un prompt : le sujet, la lumière, le cadre, les couleurs de la marque.',
      'On génère plusieurs versions, on garde les meilleures, on jette le reste. L’IA propose, on choisit.',
      'Puis le montage, la musique, le sound design et les sous-titres, au format de chaque réseau.',
    ],
    preuve: 'notre propre chaîne de production, montrée telle quelle',
    enseignement: 'L’IA fait gagner des jours de tournage. Le choix, le rythme et le message restent un travail humain.',
    appel: 'Qu’est-ce qui vous retient d’utiliser l’IA pour vos vidéos : la qualité, ou ne pas savoir par où commencer ?',
    indicateur: 'taux de visionnage complet',
    source: `${SOURCE_TARIFS} — contenu des packs : script & concept, génération IA + montage, musique & sound design, sous-titres`,
  },
  {
    ref: 'v-vf-4',
    titre: 'Atelier Noir, décortiqué : du zoning au site en ligne',
    pilier: 'montrer-le-travail',
    persona: 'dirigeant-site-bloque',
    accroche: 'Atelier Noir est un concept de parfumerie conçu par Veolt. Voilà comment une page comme la sienne se construit, étape par étape.',
    corps: [
      'D’abord le zoning : où va la promesse, où va le produit, où va le bouton. Sans couleur ni image.',
      'Puis la maquette : la typographie, la photo du flacon, le rythme des sections.',
      'Ensuite le développement : la même page, rapide sur mobile, avec ses vraies interactions.',
      'Enfin la mise en ligne : la page tient sur un téléphone comme sur un grand écran.',
    ],
    preuve: 'Atelier Noir, concept de parfumerie présenté sur veolt.fr',
    enseignement: 'Un beau site se décide au zoning, bien avant la première couleur.',
    appel: 'Sur votre site actuel, comprend-on en trois secondes ce que vous vendez ?',
    indicateur: 'enregistrements',
    source: 'veolt.fr, portfolio « Atelier Noir — Concept · Parfumerie », relevé le 25/11/2026 ; sites dès 1 490 € HT (veolt.fr)',
  },
  {
    ref: 'v-vf-5',
    titre: 'Une canette, de l’esquisse à la pub',
    pilier: 'montrer-le-travail',
    persona: 'marque-produit',
    accroche: 'Une canette en 3D passe par six étapes avant d’arriver dans une pub. Les voici, sur une canette concept dessinée pour l’exemple.',
    corps: [
      'L’esquisse fixe la silhouette et l’esprit de la marque.',
      'Le modèle 3D reprend les proportions exactes d’une canette slim.',
      'L’étiquette se dessine à plat, puis s’enroule sur le modèle.',
      'Matières, lumière et rendu donnent l’aluminium, les gouttes, les reflets.',
      'La même canette se pose ensuite dans n’importe quel décor, sans nouvelle séance photo.',
    ],
    preuve: 'une canette concept, dessinée pour l’exemple (mention « Illustration IA »)',
    enseignement: 'Une fois la canette modélisée, chaque nouvelle mise en scène ne coûte qu’un rendu.',
    appel: 'Votre produit a-t-il déjà un modèle 3D, ou repartez-vous d’une séance photo à chaque campagne ?',
    indicateur: 'enregistrements',
    source: 'méthode de production Veolt ; images du registre (illustrations.ts) ; rendus 3D dès 119 € HT (veolt.fr)',
  },
  {
    ref: 'v-vf-6',
    titre: 'L’analyse gratuite : ce qu’on vous demande, ce que vous recevez',
    pilier: 'positionnement-prix',
    persona: 'dirigeant-site-bloque',
    accroche: 'Notre analyse est gratuite et sans engagement. Voilà exactement ce qu’on vous demande, et ce que vous recevez sous 24 h.',
    corps: [
      'Dix étapes guidées : votre secteur, où en est le projet, vos besoins, vos objectifs, l’état de votre site et de vos réseaux, votre budget et votre délai.',
      'Puis votre entreprise et votre équipe, surtout en cases à cocher : ça va plus vite qu’écrire.',
      'Un expert Veolt lit l’ensemble et revient vers vous avec des recommandations concrètes : branding, vidéo, web, stratégie.',
      'Vous recevez un plan d’action clair pour la suite. Réponse sous 24 h, sans engagement.',
    ],
    preuve: 'le questionnaire réel de veolt.fr, en captures',
    enseignement: 'Donner l’analyse avant de vendre, c’est laisser le client juger sur pièce.',
    appel: 'Si un expert regardait votre projet demain, quelle est la première chose que vous voudriez qu’il vous dise ?',
    indicateur: 'demandes d’analyse',
    source: SOURCE_ANALYSE,
  },
  {
    ref: 'v-vf-7',
    titre: 'Vitrine, e-commerce, site animé : trois concepts Veolt décortiqués',
    pilier: 'montrer-le-travail',
    persona: 'dirigeant-site-bloque',
    accroche: 'Vitrine, e-commerce, site animé : trois concepts conçus par Veolt, et ce que chacun fait de différent.',
    corps: [
      'Novo, la vitrine : une page sombre et minimale, pensée pour qu’on comprenne l’offre sans défiler.',
      'Elysia, l’e-commerce : des catégories, des fiches produit qui se comparent, un parcours d’achat sans détour.',
      'Wealth, le site animé : le mouvement sert la lecture et guide l’œil de section en section.',
      'Trois besoins, trois structures : le choix se fait sur l’objectif, pas sur la mode.',
    ],
    preuve: 'Novo, Elysia et Wealth, concepts présentés sur veolt.fr',
    enseignement: 'Le bon type de site se choisit sur ce qu’il doit produire : un contact, une vente, une impression.',
    appel: 'Votre site doit-il d’abord vous faire appeler, vous faire acheter, ou vous faire remarquer ?',
    indicateur: 'enregistrements',
    source: 'veolt.fr, portfolio (Novo — Concept · Vitrine ; Elysia — Concept · E-commerce ; Wealth — Concept · Site animé), relevé le 25/11/2026',
  },
];
