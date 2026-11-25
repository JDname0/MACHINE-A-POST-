/**
 * Le pack d'illustrations côté serveur : ce qui est déjà dans la médiathèque,
 * l'import depuis l'adresse d'origine, et la lecture pour le rendu.
 *
 * Une illustration importée est un média d'origine `illustration`, nommé
 * `<nom du registre>.png`, dont l'empreinte est le hachage de son adresse :
 * si le registre pointe un jour vers une nouvelle génération, l'image change
 * à l'import suivant ; sinon, relancer l'import ne refait rien.
 */

import { createHash } from 'node:crypto';
import { db, tracer } from './db';
import { ecrire, effacer, lire, nouvelleCle, signatureConforme, dimensions, TYPES_IMAGE } from './medias';
import {
  HOTES_IMPORT,
  IMAGES_PACK,
  PLACEMENTS,
  imagePack,
  placementsDe,
  placementPourTexte,
  cadrageDepuisTexte,
  mentionDe,
  type Cadrage,
  type ImagePack,
  type Placement,
} from './illustrations';

export interface IllustrationPosee {
  placement: Placement;
  image: ImagePack;
  id: number;
  largeur: number;
  hauteur: number;
}

const empreinteDe = (url: string) => `illu:${createHash('sha1').update(url).digest('hex')}`;

/** Les images du registre présentes dans la médiathèque de l'entité, par nom. */
function presentes(entite: string): Map<string, { id: number; largeur: number; hauteur: number; empreinte: string | null }> {
  const lignes = db()
    .prepare("SELECT id, nom, largeur, hauteur, empreinte FROM medias WHERE entite=? AND origine='illustration' ORDER BY id")
    .all(entite) as Array<{ id: number; nom: string; largeur: number | null; hauteur: number | null; empreinte: string | null }>;
  const m = new Map<string, { id: number; largeur: number; hauteur: number; empreinte: string | null }>();
  for (const l of lignes) m.set(l.nom.replace(/\.[a-z0-9]+$/i, ''), { id: l.id, largeur: l.largeur ?? 1000, hauteur: l.hauteur ?? 1000, empreinte: l.empreinte });
  return m;
}

/** Les illustrations d'un sujet déjà importées : couverture d'abord, puis les pages. */
export function illustrationsDuSujet(entite: string, sujet: string | null | undefined): IllustrationPosee[] {
  const l = placementsDe(entite, sujet);
  if (!l.length) return [];
  const p = presentes(entite);
  const sortie: IllustrationPosee[] = [];
  for (const placement of l) {
    const image = imagePack(placement.image);
    const m = p.get(placement.image);
    if (image && m) sortie.push({ placement, image, id: m.id, largeur: m.largeur, hauteur: m.hauteur });
  }
  return sortie;
}

export const couvertureDuSujet = (entite: string, sujet: string | null | undefined) =>
  illustrationsDuSujet(entite, sujet).find((x) => x.placement.role === 'couverture');

/** L'illustration de la page (ou du plan) dont le texte commence comme le placement l'indique. */
export function illustrationPourTexte(entite: string, sujet: string | null | undefined, texte: string): IllustrationPosee | undefined {
  const pl = placementPourTexte(entite, sujet, texte);
  if (!pl) return undefined;
  return illustrationsDuSujet(entite, sujet).find((x) => x.placement === pl);
}

/** Une image du registre déjà importée, par son nom. */
export function illustrationParNom(entite: string, nom: string): { id: number; largeur: number; hauteur: number } | undefined {
  const m = presentes(entite).get(nom);
  return m ? { id: m.id, largeur: m.largeur, hauteur: m.hauteur } : undefined;
}

/** L'état du pack pour la page Visuels : chaque image, importée ou non, et où elle sert. */
export function etatPack(entite: string) {
  if (entite !== 'veolt') return [];
  const p = presentes(entite);
  return IMAGES_PACK.map((image) => {
    const m = p.get(image.nom);
    return {
      image,
      id: m?.id ?? null,
      aJour: !!m && m.empreinte === empreinteDe(image.url),
      sujets: [...new Set(placementsDeImage(entite, image.nom))],
    };
  });
}

function placementsDeImage(entite: string, nom: string): string[] {
  return PLACEMENTS.filter((x) => x.entite === entite && x.image === nom).map((x) => x.sujet);
}

/** Une image de la médiathèque de l'entité, en `data:` pour Satori, avec ses dimensions. */
export async function imageEnDonnees(
  entite: string,
  id: string | number | null | undefined,
): Promise<{ donnees: string; largeur: number; hauteur: number; nom: string } | undefined> {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) return undefined;
  const m = db().prepare('SELECT cle, nom, type_mime, largeur, hauteur FROM medias WHERE id=? AND entite=?').get(n, entite) as
    | { cle: string; nom: string; type_mime: string; largeur: number | null; hauteur: number | null }
    | undefined;
  if (!m || !(m.type_mime in TYPES_IMAGE) || m.type_mime === 'image/webp') return undefined;
  const octets = await lire(m.cle);
  if (!octets) return undefined;
  const d = m.largeur && m.hauteur ? { largeur: m.largeur, hauteur: m.hauteur } : dimensions(octets, m.type_mime);
  return { donnees: `data:${m.type_mime};base64,${octets.toString('base64')}`, largeur: d?.largeur ?? 1000, hauteur: d?.hauteur ?? 1000, nom: m.nom };
}

/**
 * Hôte autorisé pour un import. En développement seulement, le serveur local
 * de test (`http://127.0.0.1:<port>`) est admis : il sert à éprouver l'import
 * sans réseau. En production : HTTPS et la liste fermée, rien d'autre.
 */
export function adresseAutorisee(brute: string): URL | null {
  let u: URL;
  try {
    u = new URL(brute);
  } catch {
    return null;
  }
  if (u.username || u.password) return null;
  if (u.protocol === 'https:' && HOTES_IMPORT.has(u.hostname)) return u;
  if (process.env.NODE_ENV !== 'production' && u.protocol === 'http:' && u.hostname === '127.0.0.1') return u;
  return null;
}

/**
 * Essai sans réseau (développement seulement) : `MAP_ILLUS_MIROIR` remplace
 * l'hôte d'origine par un serveur local qui sert les mêmes noms de fichiers.
 * Ignoré en production.
 */
function miroir(url: string): string {
  const m = process.env.MAP_ILLUS_MIROIR;
  if (!m || process.env.NODE_ENV === 'production') return url;
  return m.replace(/\/?$/, '/') + url.split('/').pop();
}

const PLAFOND_ILLUSTRATION = 15 * 1024 * 1024;

/** Télécharge une image autorisée : pas de redirection suivie, type et signature vérifiés, taille bornée. */
async function telecharger(u: URL, url: string): Promise<{ octets: Buffer; type: string }> {
  const r = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(45_000) });
  if (!r.ok) throw new Error(`réponse ${r.status}`);
  const type = (r.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  const annonce = Number(r.headers.get('content-length') ?? 0);
  if (annonce > PLAFOND_ILLUSTRATION) throw new Error('fichier trop lourd');
  const octets = Buffer.from(await r.arrayBuffer());
  if (octets.length > PLAFOND_ILLUSTRATION) throw new Error('fichier trop lourd');
  const typeReel = ['image/png', 'image/jpeg'].find((t) => signatureConforme(octets.subarray(0, 16), t));
  if (!typeReel) throw new Error(`ce n'est pas une image PNG ou JPEG (${type || 'type inconnu'}, ${u.hostname})`);
  return { octets, type: typeReel };
}

/**
 * Importe dans la médiathèque les images du registre manquantes ou périmées.
 * Rend le bilan ; l'appelant trace et sauvegarde.
 */
export async function importerPack(entite: 'veolt'): Promise<{ importees: string[]; deja: number; echecs: Array<{ nom: string; raison: string }> }> {
  const p = presentes(entite);
  const importees: string[] = [];
  const echecs: Array<{ nom: string; raison: string }> = [];
  let deja = 0;
  for (const image of IMAGES_PACK) {
    const empreinte = empreinteDe(image.url);
    const existante = p.get(image.nom);
    if (existante?.empreinte === empreinte) {
      deja++;
      continue;
    }
    const source = miroir(image.url);
    const u = adresseAutorisee(source);
    if (!u) {
      echecs.push({ nom: image.nom, raison: 'adresse hors de la liste autorisée' });
      continue;
    }
    try {
      const { octets, type } = await telecharger(u, source);
      const dim = dimensions(octets, type);
      const cle = nouvelleCle(type);
      await ecrire(cle, octets, type);
      const d = db();
      if (existante) {
        const ancienne = d.prepare('SELECT cle FROM medias WHERE id=?').get(existante.id) as { cle: string } | undefined;
        d.prepare('DELETE FROM medias WHERE id=?').run(existante.id);
        if (ancienne) await effacer(ancienne.cle).catch(() => undefined);
      }
      d.prepare(
        `INSERT INTO medias (entite, cle, nom, type_mime, octets, largeur, hauteur, legende, publication_id, origine, empreinte)
         VALUES (?,?,?,?,?,?,?,?, NULL, 'illustration', ?)`,
      ).run(entite, cle, `${image.nom}.${type === 'image/png' ? 'png' : 'jpg'}`, type, octets.length, dim?.largeur ?? null, dim?.hauteur ?? null, image.montre, empreinte);
      importees.push(image.nom);
    } catch (e) {
      echecs.push({ nom: image.nom, raison: e instanceof Error ? e.message : String(e) });
    }
  }
  if (importees.length) tracer('illustrations importées', `${importees.length} : ${importees.join(', ')}`, entite);
  if (echecs.length) tracer('illustrations non importées', echecs.map((x) => `${x.nom} (${x.raison})`).join(' ; '), entite);
  return { importees, deja, echecs };
}

/** L'illustration d'un visuel, d'après ses paramètres (`illu`, `cadrage`), prête pour `rendre`. */
export async function illustrationDuContenu(
  entite: string,
  contenu: { illu?: string | null; cadrage?: string | null },
): Promise<{ donnees: string; largeur: number; hauteur: number; cadrage?: Cadrage; mention?: string } | undefined> {
  if (!contenu.illu) return undefined;
  const img = await imageEnDonnees(entite, contenu.illu);
  if (!img) return undefined;
  const nom = img.nom.replace(/\.[a-z0-9]+$/i, '');
  return { donnees: img.donnees, largeur: img.largeur, hauteur: img.hauteur, cadrage: cadrageDepuisTexte(contenu.cadrage), mention: imagePack(nom) ? mentionDe(nom) : undefined };
}

export type { Cadrage };
