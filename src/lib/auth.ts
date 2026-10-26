/**
 * Authentification — mot de passe unique, usage interne, un seul opérateur.
 * Même approche que `dcr-prospection` : un cookie signé, pas de comptes.
 *
 * Le mot de passe vient de `MACHINE_MOT_DE_PASSE`. Sans cette variable, l'outil
 * s'ouvre sans demander quoi que ce soit **et le dit dans l'interface** —
 * laisser croire à une protection absente serait pire que de ne pas en avoir.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

const NOM = 'machine_session';

function cle(): string {
  return process.env.MACHINE_CLE_SESSION ?? 'cle-de-developpement-non-secrete';
}

export function protegee(): boolean {
  return Boolean(process.env.MACHINE_MOT_DE_PASSE);
}

function jeton(): string {
  return createHmac('sha256', cle()).update('ouvert').digest('hex');
}

export async function connecte(): Promise<boolean> {
  if (!protegee()) return true;
  const c = await cookies();
  const v = c.get(NOM)?.value;
  if (!v) return false;
  const a = Buffer.from(v);
  const b = Buffer.from(jeton());
  return a.length === b.length && timingSafeEqual(a, b);
}

export function verifier(motDePasse: string): boolean {
  const attendu = process.env.MACHINE_MOT_DE_PASSE;
  if (!attendu) return true;
  const a = Buffer.from(motDePasse);
  const b = Buffer.from(attendu);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function ouvrirSession() {
  const c = await cookies();
  c.set(NOM, jeton(), { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30 });
}

export async function fermerSession() {
  const c = await cookies();
  c.delete(NOM);
}
