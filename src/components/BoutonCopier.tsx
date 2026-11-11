'use client';

import { useState } from 'react';

/** Copie le texte du post tel qu'il se colle sur le réseau. */
export function BoutonCopier({ texte, libelle = 'Copier le texte' }: { texte: string; libelle?: string }) {
  const [etat, setEtat] = useState<'' | 'ok' | 'refuse'>('');
  return (
    <button
      type="button"
      className="fantome"
      disabled={!texte}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texte);
          setEtat('ok');
        } catch {
          // Presse-papiers refusé (page non sécurisée, permission) : le texte reste sélectionnable.
          setEtat('refuse');
        }
        setTimeout(() => setEtat(''), 2200);
      }}
    >
      {etat === 'ok' ? 'Copié ✓' : etat === 'refuse' ? 'Sélectionne le texte à la main' : libelle}
    </button>
  );
}
