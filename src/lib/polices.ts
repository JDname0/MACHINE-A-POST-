/**
 * Les polices des visuels, lues sur le disque.
 *
 * Partagées entre la route PNG (`/[entite]/visuels/[gabarit]`), l'action qui
 * mémorise un visuel dans la médiathèque, et la route qui sert les fichiers au
 * studio vidéo (le navigateur en a besoin pour incruster le texte à la charte).
 * Leur inclusion dans les fonctions Vercel est déclarée dans `next.config.ts` :
 * aucun `import` ne les mentionne, le traceur ne les verrait pas.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';

export const DOSSIER_POLICES = path.join(process.cwd(), 'src', 'assets', 'polices');

/** Seuls ces fichiers sont servis : la route ne lit jamais un chemin fourni tel quel. */
export const FICHIERS_POLICES = [
  'BebasNeue.ttf',
  'Kanit-Bold.ttf',
  'Spectral-Bold.ttf',
  'Spectral-SemiBold.ttf',
  'Inter-Regular.ttf',
  'Inter-SemiBold.ttf',
  'PlayfairDisplay-Bold.ttf',
  'JetBrainsMono-Medium.woff',
] as const;

const lire = (f: string) => readFileSync(path.join(DOSSIER_POLICES, f));

let cache: Array<{ name: string; data: Buffer; weight: 400 | 600 | 700; style: 'normal' }> | null = null;

export function chargerPolices() {
  if (cache) return cache;
  cache = [
    { name: 'Bebas', data: lire('BebasNeue.ttf'), weight: 400, style: 'normal' },
    { name: 'Kanit', data: lire('Kanit-Bold.ttf'), weight: 700, style: 'normal' },
    { name: 'Spectral', data: lire('Spectral-Bold.ttf'), weight: 700, style: 'normal' },
    { name: 'Spectral', data: lire('Spectral-SemiBold.ttf'), weight: 600, style: 'normal' },
    { name: 'Inter', data: lire('Inter-Regular.ttf'), weight: 400, style: 'normal' },
    { name: 'Inter', data: lire('Inter-SemiBold.ttf'), weight: 600, style: 'normal' },
    { name: 'Mono', data: lire('JetBrainsMono-Medium.woff'), weight: 600, style: 'normal' },
  ];
  return cache;
}

export function lirePolice(fichier: string): Buffer | null {
  return (FICHIERS_POLICES as readonly string[]).includes(fichier) ? lire(fichier) : null;
}
