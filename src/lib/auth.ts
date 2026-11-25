/**
 * Authentification — usage interne, deux comptes au plus (25/11/2026).
 *
 * - **direction** (`MACHINE_MOT_DE_PASSE`) : tout, dont **valider** et
 *   **publier**. C'est le « oui » de Jonathan de la règle 1.
 * - **équipe** (`MACHINE_MOT_DE_PASSE_EQUIPE`, facultatif) : prépare — écrit,
 *   produit, importe, commente, poste à la main ce qui est validé — mais ne
 *   valide ni ne publie. Sans cette variable, le compte n'existe pas et rien
 *   ne change.
 *
 * Un cookie signé porte le rôle, pas de table de comptes. Le jeton de la
 * direction est celui d'avant (sessions ouvertes conservées au déploiement) ;
 * celui de l'équipe dérive aussi de **son** mot de passe : le changer
 * déconnecte l'employé sans déconnecter Jonathan. Pour tout fermer, changer
 * `MACHINE_CLE_SESSION`.
 *
 * Sans `MACHINE_MOT_DE_PASSE`, l'outil s'ouvre sans rien demander **et le dit
 * dans l'interface** — laisser croire à une protection absente serait pire.
 */

import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { cookieSecurise } from './adresse';

const NOM = 'machine_session';

export type Role = 'direction' | 'equipe';

export const LIBELLE_ROLE: Record<Role, string> = {
  direction: 'Jonathan (direction)',
  equipe: 'Équipe',
};

function cle(): string {
  return process.env.MACHINE_CLE_SESSION ?? 'cle-de-developpement-non-secrete';
}

export function protegee(): boolean {
  return Boolean(process.env.MACHINE_MOT_DE_PASSE);
}

/** Le compte équipe n'existe que si son mot de passe est posé, et différent de celui de la direction. */
export function compteEquipeActif(): boolean {
  const e = process.env.MACHINE_MOT_DE_PASSE_EQUIPE;
  return protegee() && Boolean(e) && e !== process.env.MACHINE_MOT_DE_PASSE;
}

function egal(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

function jetonDirection(): string {
  return createHmac('sha256', cle()).update('ouvert').digest('hex');
}

function jetonEquipe(): string | null {
  if (!compteEquipeActif()) return null;
  const empreinte = createHash('sha256').update(process.env.MACHINE_MOT_DE_PASSE_EQUIPE!).digest('hex');
  return `equipe.${createHmac('sha256', cle()).update(`equipe:${empreinte}`).digest('hex')}`;
}

/** Le rôle de la session en cours, ou `null` si personne n'est connecté. */
export async function role(): Promise<Role | null> {
  if (!protegee()) return 'direction';
  const v = (await cookies()).get(NOM)?.value;
  if (!v) return null;
  if (egal(v, jetonDirection())) return 'direction';
  const je = jetonEquipe();
  if (je && egal(v, je)) return 'equipe';
  return null;
}

export async function connecte(): Promise<boolean> {
  return (await role()) !== null;
}

/** Le rôle que donne ce mot de passe, ou `null` s'il ne correspond à aucun compte. */
export function verifier(motDePasse: string): Role | null {
  const direction = process.env.MACHINE_MOT_DE_PASSE;
  if (!direction) return 'direction';
  if (egal(motDePasse, direction)) return 'direction';
  if (compteEquipeActif() && egal(motDePasse, process.env.MACHINE_MOT_DE_PASSE_EQUIPE!)) return 'equipe';
  return null;
}

export async function ouvrirSession(r: Role = 'direction') {
  const c = await cookies();
  const valeur = r === 'equipe' ? jetonEquipe() : jetonDirection();
  if (!valeur) return;
  // Sans domaine : le cookie suit l'adresse où l'on s'est connecté, quel que
  // soit le nom de domaine. `secure` seulement si l'adresse publique déclarée
  // est en HTTPS (MAP_URL_PUBLIQUE) : rien ne change sur Vercel ni en local.
  c.set(NOM, valeur, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30, secure: cookieSecurise() });
}

export async function fermerSession() {
  const c = await cookies();
  c.delete(NOM);
}
