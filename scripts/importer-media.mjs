#!/usr/bin/env node
/**
 * Importe un fichier produit ailleurs (Higgsfield, Blender, ElevenLabs, Suno…)
 * dans la médiathèque LOCALE de la machine (data/machine.db + data/medias/).
 *
 *   node scripts/importer-media.mjs <entite> <origine> <fichier> [--nom N] [--post ID] [--legende "…"]
 *
 *   origine : photo   → une photo posée en fond du visuel d'un post (--post obligatoire)
 *             clip    → un clip vidéo utilisable en fond de plan (`clip: '<nom sans extension>'`)
 *             musique → un morceau proposé dans le studio (rattaché au post avec --post)
 *             voix    → une voix off de plan ; --nom voix-plan-<N>.mp3 et --post obligatoires
 *
 * Exemples :
 *   node scripts/importer-media.mjs veolt clip ~/Downloads/orbite.mp4 --nom veolt-orbite.mp4
 *   node scripts/importer-media.mjs magistria musique piste.mp3 --post 161
 *
 * Même règle que le reste : rien de ce qui est importé ne part tout seul. Le
 * fichier sert au montage ; la vidéo reste à valider.
 */

import { createHash, randomUUID } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { basename, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const [entite, origine, fichier, ...reste] = process.argv.slice(2);
const opt = (n) => {
  const i = reste.indexOf(`--${n}`);
  return i >= 0 ? reste[i + 1] : undefined;
};
if (!['veolt', 'magistria'].includes(entite) || !['photo', 'clip', 'musique', 'voix'].includes(origine) || !fichier) {
  console.error('Usage : node scripts/importer-media.mjs <veolt|magistria> <photo|clip|musique|voix> <fichier> [--nom N] [--post ID] [--legende "…"]');
  process.exit(1);
}
const TYPES = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};
const ext = extname(fichier).toLowerCase();
const type = TYPES[ext];
if (!type) {
  console.error(`Type non pris en charge : ${ext}`);
  process.exit(1);
}
const nom = opt('nom') ?? basename(fichier);
const post = opt('post') ? Number(opt('post')) : null;
if (origine === 'photo' && !post) {
  console.error('Une photo de fond se rattache à un post (--post).');
  process.exit(1);
}
if (origine === 'voix' && (!post || !/plan-\d+/.test(nom))) {
  console.error('Une voix off se rattache à un post (--post) et à un plan (--nom voix-plan-<N>.mp3).');
  process.exit(1);
}

// Mesures : dimensions et durée, lues par ffprobe s'il est là.
let largeur = null;
let hauteur = null;
let duree = null;
try {
  const j = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=width,height:format=duration', '-of', 'json', fichier]).toString());
  const v = (j.streams ?? []).find((s) => s.width);
  largeur = v?.width ?? null;
  hauteur = v?.height ?? null;
  duree = j.format?.duration ? Number(j.format.duration) : null;
} catch {
  /* sans ffprobe : on s'en passe */
}

const cle = `${randomUUID()}${ext}`;
mkdirSync(join(racine, 'data', 'medias'), { recursive: true });
copyFileSync(fichier, join(racine, 'data', 'medias', cle));
const empreinte = createHash('sha1').update(readFileSync(fichier)).digest('hex');
const db = new Database(join(racine, 'data', 'machine.db'));
// Une voix ou une musique qui remplace la précédente du même post, du même nom.
if (post && origine !== 'clip') db.prepare('DELETE FROM medias WHERE publication_id=? AND origine=? AND nom=?').run(post, origine, nom);
if (origine === 'clip') db.prepare("DELETE FROM medias WHERE entite=? AND origine='clip' AND nom=?").run(entite, nom);
const r = db
  .prepare(
    `INSERT INTO medias (entite, cle, nom, type_mime, octets, largeur, hauteur, duree_s, legende, publication_id, origine, empreinte)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
  )
  .run(entite, cle, nom, type, statSync(fichier).size, largeur, hauteur, duree, opt('legende') ?? null, post, origine, empreinte);
console.log(`importé : #${r.lastInsertRowid} ${entite}/${origine} ${nom}${post ? ` → post ${post}` : ''}${duree ? ` · ${duree.toFixed(1)} s` : ''}`);
