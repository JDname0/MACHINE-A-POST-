#!/usr/bin/env node
/**
 * Exporte la base et TOUS les médias du store Blob de production vers un
 * dossier local, avant le passage chez o2switch. À lancer sur le Mac :
 *
 *   vercel env pull .env.local --environment=production
 *   node scripts/exporter-depuis-blob.mjs [dossier]     # défaut : ./export-blob-AAAAMMJJ-HHMM
 *
 * - Les identifiants Blob sont lus dans `.env.local` (BLOB_READ_WRITE_TOKEN,
 *   ou BLOB_STORE_ID + VERCEL_OIDC_TOKEN). Ils ne sont jamais affichés : seuls
 *   leurs NOMS apparaissent dans les messages.
 * - Rien n'est écrit dans le store : lecture seule (list + get).
 * - Vérifications : taille de chaque fichier = taille annoncée par le store ;
 *   chaque média référencé dans la base est présent ; sortie en erreur sinon.
 * - Store inaccessible (compte suspendu, jeton expiré) : erreur claire, code 2.
 *
 * Derrière un proxy : NODE_USE_ENV_PROXY=1.
 * Coût : 1 list par tranche de 1000 objets + 1 get par fichier, sur
 * l'allocation Blob du compte. À ne lancer qu'une fois, quand on bascule.
 */
import { createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const OBJET_BASE = 'machine-a-post/machine.db';
const PREFIXE = 'machine-a-post/medias/';
const NOMS = ['BLOB_READ_WRITE_TOKEN', 'BLOB_STORE_ID', 'VERCEL_OIDC_TOKEN'];

// ── Identifiants : .env.local, sans jamais en afficher la valeur ────────────
const fichierEnv = join(RACINE, '.env.local');
if (existsSync(fichierEnv)) {
  for (const ligne of readFileSync(fichierEnv, 'utf8').split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(ligne);
    if (!m || !NOMS.includes(m[1]) || process.env[m[1]]) continue;
    process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}
if (!process.env.BLOB_READ_WRITE_TOKEN && !(process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN)) {
  console.error('Identifiants Blob absents. Lancer d’abord : vercel env pull .env.local --environment=production');
  console.error(`(attendu dans .env.local : BLOB_READ_WRITE_TOKEN, ou BLOB_STORE_ID + VERCEL_OIDC_TOKEN)`);
  process.exit(1);
}

const { list, get } = await import('@vercel/blob');
const Database = (await import('better-sqlite3')).default;

const horo = new Date().toISOString().replace(/[-:]/g, '').slice(0, 13).replace('T', '-');
const sortie = process.argv[2] ?? join(process.cwd(), `export-blob-${horo}`);
if (existsSync(join(sortie, 'machine.db'))) {
  console.error(`${sortie} contient déjà une base : choisir un dossier vide.`);
  process.exit(1);
}
mkdirSync(join(sortie, 'medias'), { recursive: true });

function inaccessible(e) {
  const msg = String(e?.message ?? e);
  console.error('\n✖ Store Blob inaccessible.');
  console.error(`  ${msg.split('\n')[0].slice(0, 300)}`);
  console.error('  Causes probables : compte Vercel suspendu (dépassement Hobby : Blob coupé jusqu’à la fin de la période),');
  console.error('  jeton OIDC expiré (refaire `vercel env pull`), ou pas de réseau.');
  process.exit(2);
}

async function telecharger(chemin, destination, tailleAttendue) {
  let res;
  try {
    res = await get(chemin, { access: 'private', useCache: false });
  } catch (e) {
    inaccessible(e);
  }
  if (!res || !res.stream) throw new Error(`Objet absent : ${chemin}`);
  const tmp = `${destination}.part`;
  await pipeline(Readable.fromWeb(res.stream), createWriteStream(tmp));
  const taille = statSync(tmp).size;
  if (tailleAttendue != null && taille !== tailleAttendue) {
    throw new Error(`Taille incorrecte pour ${chemin} : ${taille} octets reçus, ${tailleAttendue} attendus.`);
  }
  renameSync(tmp, destination);
  return taille;
}

// ── Inventaire du store ─────────────────────────────────────────────────────
console.log('Inventaire du store…');
const objets = new Map();
let curseur;
try {
  do {
    const r = await list({ prefix: 'machine-a-post/', cursor: curseur, limit: 1000 });
    for (const b of r.blobs) objets.set(b.pathname, b.size);
    curseur = r.hasMore ? r.cursor : undefined;
  } while (curseur);
} catch (e) {
  inaccessible(e);
}
if (!objets.has(OBJET_BASE)) {
  console.error(`✖ La base (${OBJET_BASE}) n'est pas dans le store.`);
  process.exit(1);
}
const medias = [...objets].filter(([p]) => p.startsWith(PREFIXE) && !p.slice(PREFIXE.length).includes('/'));
const octetsMedias = medias.reduce((s, [, t]) => s + t, 0);
console.log(`  base : ${(objets.get(OBJET_BASE) / 1048576).toFixed(1)} Mo · médias : ${medias.length} fichiers, ${(octetsMedias / 1048576).toFixed(1)} Mo`);

// ── Base ────────────────────────────────────────────────────────────────────
await telecharger(OBJET_BASE, join(sortie, 'machine.db'), objets.get(OBJET_BASE));
const db = new Database(join(sortie, 'machine.db'), { readonly: true, fileMustExist: true });
const verif = db.pragma('integrity_check', { simple: true });
if (verif !== 'ok') {
  console.error(`✖ Base téléchargée mais intégrité SQLite : ${verif}`);
  process.exit(1);
}
const references = db.prepare('SELECT cle, octets FROM medias').all();
db.close();
console.log(`✓ base (intégrité ok, ${references.length} médias référencés)`);

// ── Médias, 3 à la fois ─────────────────────────────────────────────────────
const file = [...medias];
let faits = 0;
let octets = 0;
await Promise.all(
  [1, 2, 3].map(async () => {
    while (file.length) {
      const [chemin, taille] = file.shift();
      octets += await telecharger(chemin, join(sortie, 'medias', chemin.slice(PREFIXE.length)), taille);
      faits++;
      if (faits % 10 === 0 || faits === medias.length) console.log(`  ${faits}/${medias.length}`);
    }
  }),
);

// ── Contrôles finaux ────────────────────────────────────────────────────────
const manquants = references.filter((r) => !existsSync(join(sortie, 'medias', r.cle)));
console.log(`✓ ${faits} médias, ${(octets / 1048576).toFixed(1)} Mo écrits dans ${sortie}`);
if (manquants.length) {
  console.error(`✖ ${manquants.length} média(s) référencé(s) dans la base mais absent(s) du store :`);
  for (const m of manquants.slice(0, 20)) console.error(`  - ${m.cle}`);
  process.exit(1);
}
console.log('✓ Chaque média référencé par la base est présent. Export complet.');
