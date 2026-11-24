import { createWriteStream, existsSync, mkdirSync, openSync, readdirSync, readFileSync, readSync, closeSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { connecte } from '@/lib/auth';
import { estEntite } from '@/lib/marques';
import { DOSSIER_DONNEES, MODE_FICHIERS } from '@/lib/persistance';
import { CHEMIN_DEPOT, PREFIXE_DEPOT, contraintesDepot, signatureConforme } from '@/lib/medias';

/**
 * Dépôt par morceaux — mode fichiers seulement (serveur à disque, o2switch).
 *
 * Sur Vercel, un gros fichier part directement du navigateur vers le store
 * Blob (route `televerser`). Sans store, il doit traverser l'outil ; Apache et
 * Passenger bornent la taille d'une requête. Le fichier arrive donc en
 * morceaux de quelques Mo, écrits en flux à la suite dans un fichier
 * temporaire : la mémoire ne voit jamais plus d'un morceau à la fois, et le
 * plafond reste celui de Vercel (300 Mo pour une vidéo).
 *
 *   POST ?etape=debut   { chemin, type, taille } → { id, morceau }
 *   PUT  ?id=…&offset=… octets bruts du morceau   → { recu }
 *   POST ?etape=fin     { id }                    → { pathname }
 *
 * Puis le navigateur appelle `enregistrerTeleversement`, comme après un dépôt
 * Blob. Verrous : la session (une route de fichier ne traverse pas le
 * `layout`), l'entité de l'adresse, le chemin (préfixe de la médiathèque +
 * identifiant aléatoire), le type et la taille annoncés puis vérifiés à la
 * fin (taille exacte, signature des premiers octets), et un fichier final
 * qui n'écrase jamais un existant. Un envoi abandonné est effacé au bout de
 * 24 h.
 */

export const dynamic = 'force-dynamic';

/** Taille d'un morceau : sous les limites de corps de requête usuelles d'Apache/Passenger. */
const MORCEAU = 5 * 1024 * 1024;
const EXPIRATION_MS = 24 * 60 * 60 * 1000;
const DOSSIER_ENVOIS = path.join(DOSSIER_DONNEES, 'envois');
const DOSSIER_MEDIAS = path.join(DOSSIER_DONNEES, 'medias');
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

interface Envoi {
  entite: string;
  chemin: string;
  type: string;
  taille: number;
  debut: number;
}

const json = (corps: unknown, status = 200) => Response.json(corps, { status, headers: { 'Cache-Control': 'no-store' } });
const refus = (raison: string, status = 400) => json({ erreur: raison }, status);

function lireEnvoi(id: string): Envoi | null {
  if (!ID.test(id)) return null;
  const f = path.join(DOSSIER_ENVOIS, `${id}.json`);
  if (!existsSync(f)) return null;
  try {
    return JSON.parse(readFileSync(f, 'utf8')) as Envoi;
  } catch {
    return null;
  }
}

/** Efface ce qui traîne depuis plus de 24 h (envois abandonnés, fiches non enregistrées). */
function nettoyer() {
  if (!existsSync(DOSSIER_ENVOIS)) return;
  const limite = Date.now() - EXPIRATION_MS;
  for (const f of readdirSync(DOSSIER_ENVOIS)) {
    const p = path.join(DOSSIER_ENVOIS, f);
    try {
      if (statSync(p).mtimeMs < limite) rmSync(p, { force: true });
    } catch {
      // déjà parti
    }
  }
}

async function controler(params: Promise<{ entite: string }>): Promise<string | Response> {
  if (!MODE_FICHIERS) return new Response('Not Found', { status: 404 });
  if (!(await connecte())) return new Response('Non autorisé', { status: 401 });
  const { entite } = await params;
  if (!estEntite(entite)) return new Response('Entité inconnue', { status: 404 });
  return entite;
}

export async function POST(requete: Request, { params }: { params: Promise<{ entite: string }> }) {
  const entite = await controler(params);
  if (entite instanceof Response) return entite;
  const etape = new URL(requete.url).searchParams.get('etape');
  const corps = (await requete.json().catch(() => ({}))) as Record<string, unknown>;

  if (etape === 'debut') {
    const chemin = String(corps.chemin ?? '');
    const type = String(corps.type ?? '');
    const taille = Number(corps.taille);
    if (!CHEMIN_DEPOT.test(chemin)) return refus('Chemin de dépôt refusé.');
    const { types, max } = contraintesDepot(chemin);
    if (!types.includes(type)) return refus(`Type refusé : ${type || 'inconnu'}.`);
    if (!Number.isInteger(taille) || taille <= 0) return refus('Taille invalide.');
    if (taille > max) return refus(`Fichier trop lourd : ${Math.round(taille / 1048576)} Mo, au-delà de ${Math.round(max / 1048576)} Mo.`);
    if (existsSync(path.join(DOSSIER_MEDIAS, chemin.slice(PREFIXE_DEPOT.length)))) return refus('Ce fichier existe déjà.');
    nettoyer();
    mkdirSync(DOSSIER_ENVOIS, { recursive: true });
    const id = randomUUID();
    const envoi: Envoi = { entite, chemin, type, taille, debut: Date.now() };
    writeFileSync(path.join(DOSSIER_ENVOIS, `${id}.part`), Buffer.alloc(0));
    writeFileSync(path.join(DOSSIER_ENVOIS, `${id}.json`), JSON.stringify(envoi));
    return json({ id, morceau: MORCEAU });
  }

  if (etape === 'fin') {
    const id = String(corps.id ?? '');
    const envoi = lireEnvoi(id);
    if (!envoi || envoi.entite !== entite) return refus('Envoi inconnu ou expiré.', 404);
    const part = path.join(DOSSIER_ENVOIS, `${id}.part`);
    const recu = existsSync(part) ? statSync(part).size : -1;
    const abandon = (raison: string) => {
      rmSync(part, { force: true });
      rmSync(path.join(DOSSIER_ENVOIS, `${id}.json`), { force: true });
      return refus(raison);
    };
    if (recu !== envoi.taille) return abandon(`Fichier incomplet : ${recu} octets reçus sur ${envoi.taille}.`);
    const tete = Buffer.alloc(16);
    const fd = openSync(part, 'r');
    try {
      readSync(fd, tete, 0, 16, 0);
    } finally {
      closeSync(fd);
    }
    if (!signatureConforme(tete, envoi.type)) return abandon(`Le contenu ne correspond pas au type annoncé (${envoi.type}).`);
    const cle = envoi.chemin.slice(PREFIXE_DEPOT.length);
    const final = path.join(DOSSIER_MEDIAS, cle);
    if (existsSync(final)) return abandon('Ce fichier existe déjà.');
    mkdirSync(DOSSIER_MEDIAS, { recursive: true });
    renameSync(part, final);
    // La fiche que `enregistrerTeleversement` lira (type et taille vérifiés
    // ici, entité d'origine), à la place du `head()` du mode Blob.
    writeFileSync(
      path.join(DOSSIER_ENVOIS, `${cle}.depot.json`),
      JSON.stringify({ entite, type: envoi.type, taille: envoi.taille }),
    );
    rmSync(path.join(DOSSIER_ENVOIS, `${id}.json`), { force: true });
    return json({ pathname: envoi.chemin });
  }

  return refus('Étape inconnue.');
}

export async function PUT(requete: Request, { params }: { params: Promise<{ entite: string }> }) {
  const entite = await controler(params);
  if (entite instanceof Response) return entite;
  const url = new URL(requete.url);
  const id = url.searchParams.get('id') ?? '';
  const offset = Number(url.searchParams.get('offset'));
  const envoi = lireEnvoi(id);
  if (!envoi || envoi.entite !== entite) return refus('Envoi inconnu ou expiré.', 404);
  const part = path.join(DOSSIER_ENVOIS, `${id}.part`);
  if (!existsSync(part)) return refus('Envoi inconnu ou expiré.', 404);
  const deja = statSync(part).size;
  // Les morceaux arrivent dans l'ordre : un décalage dit au navigateur où
  // reprendre (morceau renvoyé après une coupure, par exemple).
  if (offset !== deja) return json({ erreur: 'Décalage inattendu.', recu: deja }, 409);
  if (!requete.body) return refus('Morceau vide.');

  let compte = 0;
  const plafond = Math.min(MORCEAU, envoi.taille - deja);
  const borne = new Transform({
    transform(morceau: Buffer, _enc, suite) {
      compte += morceau.length;
      if (compte > plafond) suite(new Error('Morceau trop grand.'));
      else suite(null, morceau);
    },
  });
  try {
    await pipeline(Readable.fromWeb(requete.body as import('node:stream/web').ReadableStream), borne, createWriteStream(part, { flags: 'a' }));
  } catch (e) {
    // Ce qui a été écrit d'un morceau refusé est retiré : le fichier reste
    // aligné sur le dernier morceau complet.
    const { truncateSync } = await import('node:fs');
    truncateSync(part, deja);
    return refus((e as Error).message);
  }
  return json({ recu: deja + compte });
}
