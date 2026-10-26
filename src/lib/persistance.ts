/**
 * Persistance de la base entre deux instances serverless.
 *
 * Le problème, déjà rencontré sur MagistrIA et DCR : sur Vercel le disque est
 * éphémère. Chaque instance démarre avec `/tmp` vide, donc une publication
 * modifiée sur une instance est inconnue de la suivante — le symptôme visible
 * étant « j'enregistre, je recharge, c'est revenu comme avant ».
 *
 * La réponse retenue est la même qu'ailleurs : un **store Blob privé**. Ici on
 * y range le fichier SQLite entier plutôt que de réécrire la couche de données,
 * parce que le volume est minuscule (quelques centaines de lignes) et que ça
 * garde tout le SQL existant intact.
 *
 * Ce que ça implique, et qu'il faut assumer :
 * - **dernier écrivain gagne.** Deux onglets qui enregistrent en même temps sur
 *   deux instances différentes : l'un des deux écrase l'autre. Acceptable pour
 *   un outil interne à un seul opérateur ; ça ne le serait pas à plusieurs.
 * - journal SQLite en mode `DELETE` et non `WAL` en production : un instantané
 *   doit tenir dans un seul fichier, sinon on sauvegarde une base amputée de
 *   ses dernières écritures.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const OBJET = 'machine-a-post/machine.db';

/** `/tmp` est le seul emplacement inscriptible sur Vercel. */
export const EN_SERVERLESS = Boolean(process.env.VERCEL);
export const CHEMIN_BASE = EN_SERVERLESS
  ? '/tmp/machine.db'
  : path.join(process.cwd(), 'data', 'machine.db');

/**
 * Deux modes d'authentification possibles selon la façon dont le store a été
 * connecté : un jeton statique (`BLOB_READ_WRITE_TOKEN`) ou OIDC
 * (`BLOB_STORE_ID` + le jeton d'identité de l'instance, que le SDK va chercher
 * seul). Le store de ce projet est en OIDC — ne tester que le jeton statique
 * ferait silencieusement retomber en stockage éphémère.
 */
export function blobActif(): boolean {
  // Le Blob ne sert **que** sur Vercel. En local, `data/machine.db` est déjà
  // durable, et partager le store avec la production ferait qu'un essai local
  // écraserait la vraie base — ce qui arriverait tout seul au premier
  // `vercel env pull`, puisqu'il dépose `BLOB_STORE_ID` dans `.env.local`.
  if (!EN_SERVERLESS) return false;
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

export type Niveau = 'local' | 'blob-restaure' | 'blob-vide' | 'instance-chaude';

/**
 * Ramène l'instantané du Blob dans `/tmp` avant toute ouverture de la base.
 * Appelée une fois par instance, au chargement du module `db.ts`.
 */
export async function hydrater(): Promise<Niveau> {
  mkdirSync(path.dirname(CHEMIN_BASE), { recursive: true });

  if (!blobActif()) return 'local';
  if (existsSync(CHEMIN_BASE)) return 'instance-chaude';

  try {
    const { get } = await import('@vercel/blob');
    const res = await get(OBJET, { access: 'private', useCache: false });
    if (!res) return 'blob-vide';
    const octets = Buffer.from(await new Response(res.stream).arrayBuffer());
    if (octets.byteLength > 0) {
      writeFileSync(CHEMIN_BASE, octets);
      return 'blob-restaure';
    }
    return 'blob-vide';
  } catch {
    // Premier démarrage : l'objet n'existe pas encore. La base sera semée,
    // puis poussée au premier enregistrement.
    return 'blob-vide';
  }
}

/**
 * Pousse l'état courant vers le Blob. À appeler **après** chaque mutation —
 * une mutation non sauvegardée est une mutation perdue au prochain démarrage.
 */
export async function sauvegarder(): Promise<void> {
  if (!blobActif() || !existsSync(CHEMIN_BASE)) return;
  const { put } = await import('@vercel/blob');
  await put(OBJET, readFileSync(CHEMIN_BASE), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/octet-stream',
  });
}

/** Ce que l'interface affiche pour ne pas laisser croire à une durabilité absente. */
export function etatStockage(): { durable: boolean; libelle: string } {
  if (!EN_SERVERLESS) return { durable: true, libelle: 'base locale — fichier data/machine.db' };
  if (blobActif()) return { durable: true, libelle: 'store Blob privé — instantané poussé à chaque enregistrement' };
  return {
    durable: false,
    libelle: 'stockage éphémère — toute modification sera perdue au prochain démarrage de l’instance',
  };
}
