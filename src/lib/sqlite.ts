/**
 * Ouverture de la base SQLite, avec deux moteurs possibles.
 *
 * - **better-sqlite3** (défaut : Vercel, local) — inchangé.
 * - **node:sqlite**, le SQLite intégré à Node 22 — en mode fichiers
 *   (o2switch). Raison, relevée le 24/11/2026 : le serveur « sun » a glibc
 *   2.28 et aucun compilateur ; tous les binaires précompilés de
 *   better-sqlite3 pour Node 22 exigent glibc 2.29 (« GLIBC_2.29 not found »),
 *   y compris celui de MagistrAI. `node:sqlite` est dans Node lui-même : aucun
 *   binaire à fournir.
 *
 * L'adaptateur reproduit le sous-ensemble de l'API better-sqlite3 dont le
 * dépôt se sert : prepare().run/get/all (paramètres positionnels ou nommés
 * sans préfixe), exec, pragma (avec `simple`), transaction (imbriquable),
 * close. Les lignes sont rendues en objets ordinaires : `node:sqlite` les
 * crée sans prototype, ce que React refuse de transmettre aux composants.
 */

import { existsSync } from 'node:fs';
import Database from 'better-sqlite3';
import { MODE_FICHIERS } from './persistance';

type Valeur = null | number | bigint | string | Uint8Array;
type Params = Valeur[] | [Record<string, Valeur | undefined>];

export interface Resultat {
  changes: number | bigint;
  lastInsertRowid: number | bigint;
}

export interface Instruction {
  run(...p: unknown[]): Resultat;
  get(...p: unknown[]): unknown;
  all(...p: unknown[]): unknown[];
}

export interface Base {
  prepare(sql: string): Instruction;
  exec(sql: string): unknown;
  pragma(source: string, options?: { simple?: boolean }): unknown;
  transaction<F extends (...args: never[]) => unknown>(fn: F): F;
  close(): unknown;
}

/** Le moteur réellement utilisé, pour l'affichage et les journaux. */
export const MOTEUR_SQLITE: 'better-sqlite3' | 'node:sqlite' = MODE_FICHIERS ? 'node:sqlite' : 'better-sqlite3';

// ── node:sqlite, chargé sans passer par le bundler ──────────────────────────

interface StatementSync {
  run(...p: Params): Resultat;
  get(...p: Params): Record<string, unknown> | undefined;
  all(...p: Params): Array<Record<string, unknown>>;
}
interface DatabaseSync {
  prepare(sql: string): StatementSync;
  exec(sql: string): void;
  close(): void;
}
interface ModuleSqlite {
  DatabaseSync: new (chemin: string, options?: { readOnly?: boolean }) => DatabaseSync;
  backup?: (source: DatabaseSync, destination: string) => Promise<number>;
}

export function moduleSqlite(): ModuleSqlite {
  // `process.getBuiltinModule` (Node ≥ 22.3) : le bundler de Next ne voit pas
  // l'import, et rien n'est résolu à la compilation.
  const p = process as unknown as { getBuiltinModule?: (nom: string) => unknown };
  if (!p.getBuiltinModule) throw new Error('node:sqlite exige Node 22.5 ou plus récent.');
  return p.getBuiltinModule('node:sqlite') as ModuleSqlite;
}

const ordinaire = (ligne: Record<string, unknown> | undefined) => (ligne ? { ...ligne } : undefined);

class InstructionNode implements Instruction {
  constructor(private readonly s: StatementSync) {}
  run(...p: unknown[]) {
    return this.s.run(...(p as Params));
  }
  get(...p: unknown[]) {
    return ordinaire(this.s.get(...(p as Params)));
  }
  all(...p: unknown[]) {
    return this.s.all(...(p as Params)).map((l) => ({ ...l }));
  }
}

class BaseNode implements Base {
  private profondeur = 0;
  constructor(readonly brute: DatabaseSync) {}

  prepare(sql: string): Instruction {
    return new InstructionNode(this.brute.prepare(sql));
  }

  exec(sql: string) {
    this.brute.exec(sql);
    return this;
  }

  pragma(source: string, options: { simple?: boolean } = {}) {
    const lignes = this.brute.prepare(`PRAGMA ${source}`).all().map((l) => ({ ...l }));
    if (!options.simple) return lignes;
    const premiere = lignes[0];
    return premiere ? Object.values(premiere)[0] : undefined;
  }

  /** Comme better-sqlite3 : BEGIN/COMMIT, et des points de reprise si imbriquée. */
  transaction<F extends (...args: never[]) => unknown>(fn: F): F {
    const base = this;
    return function (this: unknown, ...args: Parameters<F>) {
      const niveau = base.profondeur;
      const point = `t${niveau}`;
      base.brute.exec(niveau === 0 ? 'BEGIN' : `SAVEPOINT ${point}`);
      base.profondeur++;
      try {
        const r = fn.apply(this, args);
        base.brute.exec(niveau === 0 ? 'COMMIT' : `RELEASE ${point}`);
        return r;
      } catch (e) {
        base.brute.exec(niveau === 0 ? 'ROLLBACK' : `ROLLBACK TO ${point}; RELEASE ${point}`);
        throw e;
      } finally {
        base.profondeur--;
      }
    } as F;
  }

  close() {
    this.brute.close();
    return this;
  }
}

/** Ouvre la base avec le moteur du mode courant. */
export function ouvrirBase(chemin: string, options: { readonly?: boolean; fileMustExist?: boolean } = {}): Base {
  if (MOTEUR_SQLITE === 'better-sqlite3') {
    return new Database(chemin, options) as unknown as Base;
  }
  if (options.fileMustExist && !existsSync(chemin)) throw new Error(`Base introuvable : ${chemin}`);
  const { DatabaseSync } = moduleSqlite();
  return new BaseNode(new DatabaseSync(chemin, { readOnly: Boolean(options.readonly) }));
}

/**
 * Copie cohérente de la base vers `destination` (fichier qui ne doit pas
 * exister), quel que soit le moteur.
 */
export async function copierBase(source: string, destination: string): Promise<void> {
  if (MOTEUR_SQLITE === 'better-sqlite3') {
    const d = new Database(source, { readonly: true, fileMustExist: true });
    try {
      await d.backup(destination);
    } finally {
      d.close();
    }
    return;
  }
  const { DatabaseSync, backup } = moduleSqlite();
  const d = new DatabaseSync(source, { readOnly: true });
  try {
    // Un autre processus peut écrire au même moment : attendre plutôt qu'échouer.
    d.exec('PRAGMA busy_timeout = 5000');
    if (backup) await backup(d, destination);
    else d.exec(`VACUUM INTO '${destination.replace(/'/g, "''")}'`);
  } finally {
    d.close();
  }
}
