/**
 * Les versions précédentes des sujets revus (25/11/2026). Un sujet réécrit ne
 * change pas les posts déjà retouchés ; `appliquerRevisions` (db.ts) met la
 * nouvelle version sur les brouillons dont le texte est encore exactement celui
 * de l'ancienne (avec ou sans la voix), et le trace au journal.
 */

import type { Sujet } from './sujets';

export const REVISIONS_SUJETS: Record<string, Sujet> = {
  'v-pp-1': {
    ref: 'v-pp-1',
    titre: 'Nos prix sont bas. Voilà pourquoi, et ce que ça implique',
    pilier: 'positionnement-prix',
    persona: 'dirigeant-site-bloque',
    accroche: "Business plan à partir de 490 €, site à partir de 1 490 €, visuel 3D à partir de 119 €. Ces prix sont sous le marché, et ce n'est pas une promotion.",
    corps: [
      "Nous démarrons. Un studio immatriculé il y a trois mois n'a pas d'historique à faire payer.",
      "Nous prenons 6 à 8 dossiers par mois. À ce volume, nous n'avons pas de structure commerciale à financer.",
      "Ce que ça implique pour vous : des prix bas, et pas de référence client à vous montrer. Nous l'assumons plutôt que de le contourner.",
      "C'est aussi pourquoi l'analyse est gratuite : vous jugez sur pièce avant de payer quoi que ce soit.",
    ],
    preuve: 'les prix affichés, et notre ancienneté réelle',
    enseignement: "Un prix bas se justifie par une structure, pas par une remise.",
    appel: "Demandez l'analyse gratuite : réponse sous 24 h, sans engagement.",
    indicateur: 'clics sortants',
  },
  // Titre « en dix pages » : le carrousel en fait 7 depuis le 25/11/2026 (22 h 30).
  'v-mt-3': {
    ref: 'v-mt-3',
    titre: 'Un pipeline 3D de bout en bout, en dix pages',
    pilier: 'montrer-le-travail',
    persona: 'marque-produit',
    accroche: "Du brief au rendu final : les sept étapes d'une publicité 3D produit, avec ce que chacune coûte en temps.",
    corps: [
      "Modélisation. Matériaux. Éclairage. Caméra. Animation. Rendu. Étalonnage.",
      "Les deux étapes qui mangent le budget ne sont pas celles qu'on imagine : les matériaux et l'éclairage. La modélisation, elle, se réutilise indéfiniment.",
      "C'est pour ça qu'un deuxième visuel sur le même produit coûte une fraction du premier — et pourquoi on ne vend pas de vidéo à l'unité.",
    ],
    preuve: 'le processus, étape par étape',
    enseignement: "En 3D, le premier visuel paie le modèle. Les suivants ne paient que le cadrage.",
    appel: "Quelle étape vous paraît la plus floue ? On en fera le prochain carrousel.",
    indicateur: 'taux d\'achèvement du document',
  },
};
