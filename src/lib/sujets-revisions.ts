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
};
