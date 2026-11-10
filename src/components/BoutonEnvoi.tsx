'use client';

import { useFormStatus } from 'react-dom';

/** Bouton qui se grise et change de libellé pendant l'envoi : un appel IA prend plusieurs secondes. */
export function BoutonEnvoi({ children, enCours }: { children: React.ReactNode; enCours: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? enCours : children}
    </button>
  );
}
