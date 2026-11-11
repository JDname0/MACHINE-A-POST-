'use client';

import { useFormStatus } from 'react-dom';

/** Bouton qui se grise et change de libellé pendant l'envoi : un appel IA prend plusieurs secondes. */
export function BoutonEnvoi({
  children,
  enCours,
  name,
  value,
  desactive,
  className,
}: {
  children: React.ReactNode;
  enCours: string;
  /** Pour distinguer deux boutons d'un même formulaire (`mode=plan` / `mode=ia`). */
  name?: string;
  value?: string;
  desactive?: boolean;
  className?: string;
}) {
  const { pending, data } = useFormStatus();
  // Seul le bouton pressé affiche « en cours » ; les autres se grisent.
  const moi = !name || data?.get(name) === value;
  return (
    <button type="submit" name={name} value={value} disabled={pending || desactive} className={className}>
      {pending && moi ? enCours : children}
    </button>
  );
}
