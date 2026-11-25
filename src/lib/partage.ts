/**
 * Durées proposées pour un lien de partage (25/11/2026). Module sans
 * dépendance serveur : le composant navigateur `LienPartage` l'importe aussi.
 */
export const DUREES_PARTAGE = {
  '2h': { libelle: '2 heures', heures: 2 },
  '30j': { libelle: '30 jours', heures: 24 * 30 },
  permanent: { libelle: 'permanent (jusqu’à révocation)', heures: null },
} as const;

export type DureePartage = keyof typeof DUREES_PARTAGE;
