'use client';

/** Imprimer la page, ou l'enregistrer en PDF depuis la boîte d'impression du navigateur. */
export function BoutonImprimer({ libelle = 'Imprimer / PDF' }: { libelle?: string }) {
  return (
    <button type="button" className="fantome" onClick={() => window.print()}>
      {libelle}
    </button>
  );
}
