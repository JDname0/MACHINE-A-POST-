#!/usr/bin/env node
/**
 * Sauvegarde quotidienne de la base, pour une tâche planifiée cPanel :
 *
 *   MAP_DOSSIER_DONNEES=/home/<compte>/machine-a-post-donnees node /home/<compte>/machine-a-post-app/sauvegarder-base.mjs
 *
 * Instantané cohérent par l'API de sauvegarde de SQLite (node:sqlite) (pas une copie de
 * fichier en cours d'écriture), écrit à côté puis renommé. Garde les
 * MAP_SAUVEGARDES_QUOTIDIENNES dernières (14 par défaut) dans
 * <données>/sauvegardes/quotidiennes/.
 */
import { existsSync, mkdirSync, readdirSync, renameSync, rmSync } from 'node:fs';
import path from 'node:path';
// SQLite intégré à Node (node:sqlite) : le serveur o2switch ne peut pas
// charger le binaire de better-sqlite3 (glibc 2.28). Voir src/lib/sqlite.ts.
const { DatabaseSync, backup } = process.getBuiltinModule('node:sqlite');

const dossier = process.env.MAP_DOSSIER_DONNEES?.trim();
if (!dossier || !path.isAbsolute(dossier)) {
  console.error('MAP_DOSSIER_DONNEES doit être un chemin absolu.');
  process.exit(1);
}
const base = path.join(dossier, 'machine.db');
if (!existsSync(base)) {
  console.error(`Base introuvable : ${base}`);
  process.exit(1);
}
const garder = Math.max(3, Number(process.env.MAP_SAUVEGARDES_QUOTIDIENNES) || 14);
const cibleDossier = path.join(dossier, 'sauvegardes', 'quotidiennes');
mkdirSync(cibleDossier, { recursive: true });
const jour = new Date().toISOString().slice(0, 10);
const cible = path.join(cibleDossier, `machine-${jour}.db`);
const tmp = `${cible}.tmp`;
const db = new DatabaseSync(base, { readOnly: true });
try {
  if (backup) await backup(db, tmp);
  else db.exec(`VACUUM INTO '${tmp.replace(/'/g, "''")}'`);
} finally {
  db.close();
}
renameSync(tmp, cible);
const fichiers = readdirSync(cibleDossier).filter((f) => /^machine-\d{4}-\d{2}-\d{2}\.db$/.test(f)).sort();
for (const f of fichiers.slice(0, Math.max(0, fichiers.length - garder))) rmSync(path.join(cibleDossier, f), { force: true });
console.log(`Sauvegarde : ${cible} (${fichiers.length > garder ? garder : fichiers.length} gardées)`);
