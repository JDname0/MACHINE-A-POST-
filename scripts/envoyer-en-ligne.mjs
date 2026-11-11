#!/usr/bin/env node
/**
 * Envoie l'état LOCAL de la machine (médias, puis base) dans le store Blob de
 * production. Sert quand le travail a été fait en local — vidéos, photos,
 * voix, articles — et doit apparaître sur https://machine-a-post.vercel.app.
 *
 *   vercel env pull /tmp/env-prod --environment=production   # BLOB_STORE_ID + VERCEL_OIDC_TOKEN
 *   set -a; . /tmp/env-prod; set +a; rm /tmp/env-prod
 *   node scripts/envoyer-en-ligne.mjs --medias             # idempotent : saute ce qui est déjà en ligne
 *   node scripts/envoyer-en-ligne.mjs --base               # sauvegarde la base en ligne, puis la remplace
 *
 * (Derrière un proxy, Node a besoin de NODE_USE_ENV_PROXY=1 pour que fetch le suive.)
 *
 * Garde-fous, à ne pas retirer :
 *  - la base en ligne est **toujours téléchargée et sauvegardée** dans
 *    `data/machine-prod-<date>.db` avant d'être remplacée ;
 *  - si elle contient des entrées de journal absentes de la base locale (un
 *    post validé en ligne, un dépôt fait depuis le téléphone…), le script
 *    s'arrête et les liste. `--forcer` passe outre, après relecture ;
 *  - le code ne bouge pas ici : un push sur `main` redéploie (intégration
 *    GitHub), et c'est ce redéploiement qui fait relire la nouvelle base aux
 *    instances. Sans lui, une instance chaude garderait l'ancienne en `/tmp`.
 */

import { createReadStream, existsSync, mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { get, list, put } from '@vercel/blob';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const OBJET_BASE = 'machine-a-post/machine.db';
const PREFIXE = 'machine-a-post/medias/';
const args = process.argv.slice(2);
const forcer = args.includes('--forcer');

if (!process.env.BLOB_READ_WRITE_TOKEN && !(process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN)) {
  console.error('Identifiants Blob absents : voir l’en-tête du script (vercel env pull --environment=production).');
  process.exit(1);
}
if (!args.includes('--medias') && !args.includes('--base')) {
  console.error('Usage : node scripts/envoyer-en-ligne.mjs [--medias] [--base] [--forcer]');
  process.exit(1);
}

const locale = new Database(join(RACINE, 'data', 'machine.db'), { readonly: true });

if (args.includes('--medias')) {
  const medias = locale.prepare('SELECT cle, type_mime FROM medias ORDER BY octets').all();
  const enLigne = new Map();
  let curseur;
  do {
    const r = await list({ prefix: PREFIXE, cursor: curseur, limit: 1000 });
    for (const b of r.blobs) enLigne.set(b.pathname, b.size);
    curseur = r.hasMore ? r.cursor : undefined;
  } while (curseur);
  const manquants = medias.filter((m) => !existsSync(join(RACINE, 'data', 'medias', m.cle)));
  if (manquants.length) console.log(`⚠ ${manquants.length} média(s) référencé(s) sans fichier local — ignorés.`);
  const aFaire = medias.filter((m) => {
    const f = join(RACINE, 'data', 'medias', m.cle);
    return existsSync(f) && enLigne.get(PREFIXE + m.cle) !== statSync(f).size;
  });
  console.log(`${medias.length} médias · ${medias.length - aFaire.length} déjà en ligne · ${aFaire.length} à envoyer`);
  let faits = 0;
  const file = [...aFaire];
  await Promise.all(
    [1, 2, 3].map(async () => {
      while (file.length) {
        const m = file.shift();
        const f = join(RACINE, 'data', 'medias', m.cle);
        await put(PREFIXE + m.cle, createReadStream(f), {
          access: 'private',
          addRandomSuffix: false,
          allowOverwrite: true,
          contentType: m.type_mime,
          multipart: statSync(f).size > 8 * 1024 * 1024,
        });
        faits++;
        if (faits % 10 === 0 || faits === aFaire.length) console.log(`  ${faits}/${aFaire.length}`);
      }
    }),
  );
}

if (args.includes('--base')) {
  // 1. Sauvegarde de la base en ligne.
  const res = await get(OBJET_BASE, { access: 'private', useCache: false });
  const horodatage = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const copie = join(RACINE, 'data', `machine-prod-${horodatage}.db`);
  if (res) {
    writeFileSync(copie, Buffer.from(await new Response(res.stream).arrayBuffer()));
    console.log(`Base en ligne sauvegardée : ${copie}`);
    // 2. Ce qui a été fait en ligne et que la base locale ne connaît pas.
    const prod = new Database(copie, { readonly: true });
    const cle = (j) => `${j.le}|${j.action}|${j.detail ?? ''}`;
    const connues = new Set(locale.prepare('SELECT le, action, detail FROM journal').all().map(cle));
    const inconnues = prod.prepare('SELECT le, entite, action, detail FROM journal ORDER BY le').all().filter((j) => !connues.has(cle(j)));
    prod.close();
    if (inconnues.length && !forcer) {
      console.log(`\n${inconnues.length} action(s) faite(s) en ligne, absente(s) de la base locale :`);
      for (const j of inconnues.slice(-30)) console.log(`  ${j.le} · ${j.entite ?? '—'} · ${j.action} · ${(j.detail ?? '').slice(0, 90)}`);
      console.log('\nRien n’a été remplacé. Relis la liste ; relance avec --forcer si elle peut être perdue.');
      process.exit(2);
    }
  }
  // 3. Un instantané propre de la base locale (un seul fichier, sans WAL) — c'est ce que la production attend.
  const instantane = join(RACINE, 'data', `.envoi-${process.pid}.db`);
  rmSync(instantane, { force: true });
  locale.exec(`VACUUM INTO '${instantane.replace(/'/g, "''")}'`);
  const fichier = new Database(instantane);
  fichier.pragma('journal_mode = DELETE');
  fichier.close();
  mkdirSync(join(RACINE, 'data'), { recursive: true });
  await put(OBJET_BASE, createReadStream(instantane), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/octet-stream',
  });
  console.log(`Base locale envoyée (${(statSync(instantane).size / 1024).toFixed(0)} Ko). Pousser sur main pour redéployer.`);
  rmSync(instantane, { force: true });
}
