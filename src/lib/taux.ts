/**
 * Les taux — le seul endroit où on divise une mesure par une autre.
 *
 * Deux règles tenues partout :
 *  - **un taux sans dénominateur n'est pas zéro, il est inconnu.** `null` est
 *    rendu « — » et jamais « 0 % ». Afficher 0 % quand on n'a rien relevé
 *    inventerait un résultat.
 *  - un dénominateur trop faible rend le taux illisible : `fiable` dit si on
 *    peut s'y appuyer, l'interface le signale plutôt que de le taire.
 */

export interface Taux {
  valeur: number | null;
  /** Dénominateur, pour que l'interface puisse dire « sur 3 relevés ». */
  base: number;
  fiable: boolean;
}

export function taux(numerateur: number | null, denominateur: number | null, baseMini = 1): Taux {
  if (!denominateur || denominateur <= 0 || numerateur == null) return { valeur: null, base: denominateur ?? 0, fiable: false };
  return { valeur: numerateur / denominateur, base: denominateur, fiable: denominateur >= baseMini };
}

export function pourcent(t: Taux | number | null, decimales = 0): string {
  const v = typeof t === 'number' ? t : t?.valeur;
  if (v == null || !Number.isFinite(v)) return '—';
  return `${(v * 100).toFixed(decimales).replace('.', ',')} %`;
}

export function euros(v: number | null, decimales = 0): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return `${v.toFixed(decimales).replace('.', ',')} €`;
}

export function nombre(v: number | null): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return v.toLocaleString('fr-FR');
}

/**
 * Seuils d'état. Ils ne sont pas universels : ils viennent des relevés 2026
 * du cadrage (§12) et sont donc datés comme eux.
 */
export function etatTaux(nom: 'engagement' | 'clic' | 'avancement' | 'lecture', v: number | null): 'bon' | 'attention' | 'grave' | null {
  if (v == null) return null;
  switch (nom) {
    // Un engagement B2B sain tourne autour de 2 à 5 % ; le format document
    // monte à ~6,6 %, c'est pour ça qu'il est le pilier du dispositif.
    case 'engagement':
      return v >= 0.03 ? 'bon' : v >= 0.015 ? 'attention' : 'grave';
    case 'clic':
      return v >= 0.01 ? 'bon' : v >= 0.004 ? 'attention' : 'grave';
    // Temps de lecture LinkedIn : 31 à 60 s donne la diffusion maximale.
    case 'lecture':
      return v >= 31 ? 'bon' : v >= 15 ? 'attention' : 'grave';
    case 'avancement':
      return v >= 0.8 ? 'bon' : v >= 0.5 ? 'attention' : 'grave';
  }
}
