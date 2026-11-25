/**
 * Qui fait l'action en cours — pour que le journal dise « qui a fait quoi ».
 *
 * `tracer()` est appelé à des dizaines d'endroits, de façon synchrone. Plutôt
 * que de lui passer l'auteur partout, chaque action serveur ouvre un
 * « porteur » au tout début de `exigerSession()`, **avant le premier `await`** :
 * il s'attache ainsi au contexte asynchrone de l'action elle-même, et
 * `tracer()` le retrouve dans toute la suite de l'action. Une écriture hors
 * action (démarrage, semis, route de fichier) n'a pas d'auteur : elle est
 * notée sans.
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import type { Role } from './auth';

type Porteur = { auteur: Role | null };

const contexte = new AsyncLocalStorage<Porteur>();

/** À appeler de façon synchrone, avant tout `await`, au début d'une action. */
export function ouvrirPorteur(): Porteur {
  const p: Porteur = { auteur: null };
  contexte.enterWith(p);
  return p;
}

export function auteurCourant(): Role | null {
  return contexte.getStore()?.auteur ?? null;
}
