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

import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const OBJET = 'machine-a-post/machine.db';

/** `/tmp` est le seul emplacement inscriptible sur Vercel. */
export const EN_SERVERLESS = Boolean(process.env.VERCEL);

/**
 * Hébergement sur un serveur à disque durable (o2switch, 2026-11-24) :
 * `MAP_STOCKAGE=fichiers` et `MAP_DOSSIER_DONNEES=/chemin/absolu`, hors de la
 * racine web. La base et les médias vivent alors dans ce dossier, sans Blob.
 * Sans ces variables, rien ne change : Blob sur Vercel, `data/` en local.
 */
export const MODE_FICHIERS = process.env.MAP_STOCKAGE === 'fichiers';
const DOSSIER_DONNEES_BRUT = process.env.MAP_DOSSIER_DONNEES?.trim() ?? '';
if (MODE_FICHIERS && !path.isAbsolute(DOSSIER_DONNEES_BRUT)) {
  // Refuser de démarrer plutôt que d'écrire la base dans un dossier deviné.
  throw new Error('MAP_STOCKAGE=fichiers exige MAP_DOSSIER_DONNEES, un chemin absolu (dossier des données, hors racine web).');
}

/** Le dossier qui porte `machine.db`, `medias/` et `sauvegardes/`. */
export const DOSSIER_DONNEES = MODE_FICHIERS
  ? DOSSIER_DONNEES_BRUT
  : EN_SERVERLESS
    ? '/tmp'
    : path.join(process.cwd(), 'data');

export const CHEMIN_BASE = path.join(DOSSIER_DONNEES, 'machine.db');

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
  if (!EN_SERVERLESS || MODE_FICHIERS) return false;
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
  if (MODE_FICHIERS) {
    await sauvegardeDatee();
    return;
  }
  if (!blobActif() || !existsSync(CHEMIN_BASE)) return;
  const { put } = await import('@vercel/blob');
  await put(OBJET, readFileSync(CHEMIN_BASE), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/octet-stream',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Mode fichiers : sauvegardes datées de la base
// ─────────────────────────────────────────────────────────────────────────────

/** Nombre de sauvegardes datées gardées (les plus récentes). */
const A_GARDER = Math.max(3, Number(process.env.MAP_SAUVEGARDES_A_GARDER) || 30);
/** Au plus une sauvegarde par intervalle : `sauvegarder()` suit chaque enregistrement. */
const INTERVALLE_MS = 10 * 60 * 1000;
const DOSSIER_SAUVEGARDES = path.join(DOSSIER_DONNEES, 'sauvegardes');
let derniere = 0;

function horodatage(d = new Date()): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\..+$/, '').replace('T', '-');
}

/**
 * En mode fichiers, SQLite écrit déjà la base sur disque, transaction par
 * transaction : il n'y a rien à « pousser ». Ce qu'on ajoute, c'est un
 * instantané daté, cohérent (API de sauvegarde de SQLite, pas une copie de
 * fichier en cours d'écriture), écrit à côté puis renommé — un instantané
 * n'existe jamais à moitié. Les plus anciens au-delà de `A_GARDER` partent.
 *
 * **Ne lève jamais d'erreur** (corrigé le 25/11/2026). L'instantané est un
 * filet en plus : la base est déjà écrite sur disque quand il part. Avant, un
 * échec ici faisait échouer l'enregistrement qui l'appelait — et, au démarrage,
 * cassait le processus pour toute sa durée de vie, puisque `db.ts` l'attend
 * avant d'ouvrir la base. C'est arrivé sous Passenger : deux processus nés dans
 * la même seconde visaient le même `machine-<seconde>.db.tmp`, l'un des deux
 * sortait en `ERR_SQLITE_ERROR` (« not an error »), et toutes les requêtes qui
 * tombaient sur lui répondaient 500 — dont l'enregistrement d'un post. D'où le
 * nom temporaire propre au processus, et l'erreur seulement journalisée.
 */
export async function sauvegardeDatee(force = false): Promise<string | null> {
  if (!existsSync(CHEMIN_BASE)) return null;
  if (!force && Date.now() - derniere < INTERVALLE_MS) return null;
  derniere = Date.now();
  const cible = path.join(DOSSIER_SAUVEGARDES, `machine-${horodatage()}.db`);
  const temporaire = `${cible}.${process.pid}.${randomUUID().slice(0, 8)}.tmp`;
  try {
    mkdirSync(DOSSIER_SAUVEGARDES, { recursive: true });
    // Un autre processus vient de prendre l'instantané de cette seconde : il suffit.
    if (existsSync(cible)) return cible;
    // Moteur du mode fichiers (node:sqlite) : voir sqlite.ts.
    const { copierBase } = await import('./sqlite');
    await copierBase(CHEMIN_BASE, temporaire);
    renameSync(temporaire, cible);
    const fichiers = readdirSync(DOSSIER_SAUVEGARDES);
    const instantanes = fichiers.filter((f) => /^machine-\d{8}-\d{6}\.db$/.test(f)).sort();
    for (const f of instantanes.slice(0, Math.max(0, instantanes.length - A_GARDER))) {
      rmSync(path.join(DOSSIER_SAUVEGARDES, f), { force: true });
    }
    // Les restes d'un essai interrompu (processus tué en pleine copie), après une heure.
    for (const f of fichiers.filter((x) => /^machine-.*\.tmp$/.test(x))) {
      const p = path.join(DOSSIER_SAUVEGARDES, f);
      try {
        if (Date.now() - statSync(p).mtimeMs > 60 * 60 * 1000) rmSync(p, { force: true });
      } catch {
        // déjà parti
      }
    }
    return cible;
  } catch (e) {
    rmSync(temporaire, { force: true });
    console.error('[sauvegarde datée] instantané non pris, la base elle-même est intacte :', e);
    return null;
  }
}

/** Écriture atomique d'un fichier : à côté, puis renommage. */
export function ecrireAtomique(chemin: string, octets: Buffer): void {
  mkdirSync(path.dirname(chemin), { recursive: true });
  const temporaire = `${chemin}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(temporaire, octets);
  renameSync(temporaire, chemin);
}

export function tailleFichier(chemin: string): number | null {
  try {
    return statSync(chemin).size;
  } catch {
    return null;
  }
}

/** Ce que l'interface affiche pour ne pas laisser croire à une durabilité absente. */
export function etatStockage(): { durable: boolean; libelle: string } {
  if (MODE_FICHIERS) return { durable: true, libelle: `fichiers sur le serveur — ${DOSSIER_DONNEES}, sauvegarde datée au plus toutes les 10 min (${A_GARDER} gardées)` };
  if (!EN_SERVERLESS) return { durable: true, libelle: 'base locale — fichier data/machine.db' };
  if (blobActif()) return { durable: true, libelle: 'store Blob privé — instantané poussé à chaque enregistrement' };
  return {
    durable: false,
    libelle: 'stockage éphémère — toute modification sera perdue au prochain démarrage de l’instance',
  };
}
