/**
 * L'axe visuel — ce qu'on reprend de la référence, et ce qu'on refuse.
 *
 * Référence apportée par Jonathan le 2026-10-21 : le post de lancement de
 * Salvero Agency sur Instagram. Ce qui le fait fonctionner tient en sept
 * décisions, listées ci-dessous. On les reprend **toutes**, et on n'emprunte
 * ni la palette ni la typographie : les deux marques en ont déjà.
 *
 * Le piège est ailleurs. La référence est saturée — trois couleurs vives en
 * dégradé sur fond noir. Transposer cette exubérance sur MagistrIA détruirait
 * précisément l'actif qu'elle construit : un gestionnaire de sinistres n'achète
 * pas une IA juridique qui ressemble à une agence créative. « Moderne et
 * épuré » ne veut donc pas dire la même chose des deux côtés, et c'est le
 * cœur de ce fichier.
 */

export interface DecisionVisuelle {
  nom: string;
  reference: string;
  veolt: string;
  magistria: string;
}

export const DECISIONS: DecisionVisuelle[] = [
  {
    nom: 'Identité en haut, discrète',
    reference: 'logo + nom en haut à gauche, petit, sans fioriture',
    veolt: 'logo Veolt + « Studio Créatif », corps réduit',
    magistria: 'écusson MagistrIA + signature, corps réduit',
  },
  {
    nom: 'Titre en deux temps',
    reference: '« On lance » en blanc, « Salvero Agency. » en dégradé de marque',
    veolt: 'première ligne en encre, seconde en dégradé magenta → violet',
    magistria: 'première ligne en encre, seconde soulignée d’un filet or — pas de dégradé',
  },
  {
    nom: 'Sous-titre de positionnement',
    reference: '« Tech, IA & digital sans jargon » — le métier, puis la promesse de ton',
    veolt: '« 3D, web et analyse financière — réunis »',
    magistria: '« L’IA propose, le professionnel décide »',
  },
  {
    nom: 'Illustration abstraite, jamais photo',
    reference: 'fenêtre de navigateur stylisée, cartes flottantes, icônes',
    veolt: 'fenêtre + carte code + courbe financière + cube 3D : les trois métiers en un coup d’œil',
    magistria: 'un bloc de raisonnement en trois étapes, chacune portant sa source',
  },
  {
    nom: 'Ligne de services séparée par des points',
    reference: '« Sites web • Outils sur mesure • Audits »',
    veolt: '« Business plan • Sites & web 3D • Vidéo & 3D »',
    magistria: '« Analyse • Rédaction • Conformité »',
  },
  {
    nom: 'Pastille d’adresse avec flèche',
    reference: 'un bouton contourné portant l’URL',
    veolt: 'veoltproduction.fr',
    magistria: 'magistrai.fr',
  },
  {
    nom: 'Beaucoup d’air, fond très sombre',
    reference: 'fond quasi noir, halos colorés flous, larges marges',
    veolt: 'fond #0C0C0C, halos magenta/violet/orange assumés',
    magistria: 'fond #0D1B2A, **aucun halo saturé** — des filets fins et de l’air',
  },
];

/** Ce qu'on refuse explicitement, pour que personne ne le « corrige » plus tard. */
export const REFUS = [
  {
    quoi: 'Le dégradé tricolore saturé sur MagistrIA',
    pourquoi:
      "La crédibilité devant un assureur ou un cabinet est l'actif du produit. Un visuel d'agence créative la dépense d'un coup. L'or du cadrage sert d'accent unique, pas de dégradé.",
  },
  {
    quoi: 'Les emoji dans les visuels',
    pourquoi:
      "Ils datent le post et le rendent intraduisible en carrousel imprimé. Le 👋 de la référence passe sur Instagram, pas sur une page entreprise B2B.",
  },
  {
    quoi: 'Les photos de banque d’images',
    pourquoi:
      "La référence n'en utilise aucune, et c'est une de ses forces. Une illustration construite dit qu'on sait faire ; une photo achetée dit l'inverse.",
  },
  {
    quoi: 'Reprendre la typographie de la référence',
    pourquoi:
      "Veolt a Bebas Neue et Kanit, MagistrIA a Playfair Display et Inter. Les deux viennent de leurs cadrages respectifs. L'axe est une mise en page, pas une police.",
  },
];
