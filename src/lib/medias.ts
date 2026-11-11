/**
 * Médiathèque — les images **apportées**, à côté de celles que l'outil génère.
 *
 * Pourquoi c'en est une vraie et pas un champ « URL de l'image » : une adresse
 * collée pointe vers un fichier qui vit ailleurs (un Drive, un Slack, un
 * bureau), et le jour où il bouge le visuel du post disparaît sans prévenir.
 * Ici le fichier est déposé une fois et l'outil en garde les octets.
 *
 * Deux emplacements, pour la même raison que la base elle-même :
 * - en local, `data/medias/` — un vrai dossier, durable, ouvrable au Finder ;
 * - sur Vercel, le **store Blob privé**, parce que le disque y est éphémère.
 *
 * Les octets ne vont **pas** dans SQLite : l'instantané de la base entière est
 * repoussé vers le Blob à chaque enregistrement, et y glisser des images
 * ferait grossir cette poussée à chaque sauvegarde de brouillon. La base ne
 * garde donc que la fiche ; le fichier vit à côté, désigné par sa clé.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { EN_SERVERLESS, blobActif } from './persistance';

/**
 * Liste blanche, et non liste noire : ce qui n'est pas une image connue des
 * réseaux est refusé. Le SVG en est volontairement exclu — c'est un document
 * qui peut porter du script, et il ne sert à rien sur LinkedIn ni Instagram,
 * qui n'en acceptent aucun.
 */
export const TYPES_IMAGE: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

/**
 * Les vidéos. Le MOV est là parce que c'est ce qui sort d'un iPhone et d'un
 * montage Premiere ou After Effects par défaut ; il n'est accepté par aucun
 * des quatre réseaux tel quel, mais il n'a pas à l'être : ici on stocke le
 * fichier source, l'export final est une autre affaire.
 */
export const TYPES_VIDEO: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
};

export const TYPES_ACCEPTES: Record<string, string> = { ...TYPES_IMAGE, ...TYPES_VIDEO };
/** Pistes audio (voix off ElevenLabs, musique déposée) : servies au studio, pas montrées comme visuels. */
export const TYPES_AUDIO: Record<string, string> = { 'audio/mpeg': 'mp3', 'audio/wav': 'wav' };

export const estVideo = (typeMime: string) => typeMime in TYPES_VIDEO;

/**
 * Deux chemins de dépôt, deux plafonds. Ce n'est pas une subtilité gratuite :
 *
 * - **par action serveur** (le chemin local), le corps de la requête passe par
 *   la fonction. Une fonction Vercel en refuse un au-delà de ~4,5 Mo, sans
 *   message exploitable — d'où 4 Mo, annoncés avant l'envoi plutôt qu'après.
 *   Aucune vidéo utile ne tient là-dedans, et c'est la raison d'être du second
 *   chemin.
 * - **directement vers le Blob** (le chemin de production), le navigateur
 *   téléverse sans traverser la fonction, qui ne signe qu'un jeton. La limite
 *   redevient celle du bon sens : une image de réseau ne pèse pas 10 Mo, et
 *   une vidéo courte ne pèse pas 300 Mo.
 */
export const TAILLE_MAX_ACTION = 4 * 1024 * 1024;
export const TAILLE_MAX_IMAGE = 10 * 1024 * 1024;
export const TAILLE_MAX_VIDEO = 300 * 1024 * 1024;

/** Le plafond qui s'applique vraiment, selon le chemin et le type. */
export function plafond(typeMime: string, directVersBlob: boolean): number {
  if (!directVersBlob) return TAILLE_MAX_ACTION;
  return estVideo(typeMime) ? TAILLE_MAX_VIDEO : TAILLE_MAX_IMAGE;
}

/**
 * Le dépôt direct n'est possible que là où le store Blob existe : c'est lui
 * qui reçoit les octets. En local, le chemin reste l'action serveur et son
 * plafond de 4 Mo — assez pour essayer, pas pour un rush de tournage.
 */
export const depotDirect = () => blobActif();

/**
 * Le plus gros fichier vidéo qu'on peut déposer par le chemin disponible :
 * direct vers le store (production), ou action serveur — bornée à ~4 Mo sur
 * Vercel, plus large en local où aucune plateforme ne coupe la requête. Le
 * studio règle son débit d'encodage là-dessus.
 */
export function plafondDepotVideo(): number {
  if (depotDirect()) return TAILLE_MAX_VIDEO;
  return process.env.VERCEL ? TAILLE_MAX_ACTION : 40 * 1024 * 1024;
}

const PREFIXE = 'machine-a-post/medias/';
const DOSSIER = EN_SERVERLESS ? '/tmp/medias' : path.join(process.cwd(), 'data', 'medias');

export function nouvelleCle(typeMime: string): string {
  return `${randomUUID()}.${TYPES_ACCEPTES[typeMime] ?? TYPES_AUDIO[typeMime] ?? 'bin'}`;
}

export async function ecrire(cle: string, octets: Buffer, typeMime: string): Promise<void> {
  if (blobActif()) {
    const { put } = await import('@vercel/blob');
    await put(PREFIXE + cle, octets, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: typeMime,
    });
    return;
  }
  mkdirSync(DOSSIER, { recursive: true });
  writeFileSync(path.join(DOSSIER, cle), octets);
}

export async function lire(cle: string): Promise<Buffer | null> {
  if (blobActif()) {
    try {
      const { get } = await import('@vercel/blob');
      const res = await get(PREFIXE + cle, { access: 'private', useCache: false });
      if (!res) return null;
      return Buffer.from(await new Response(res.stream).arrayBuffer());
    } catch {
      return null;
    }
  }
  const p = path.join(DOSSIER, cle);
  return existsSync(p) ? readFileSync(p) : null;
}

export async function effacer(cle: string): Promise<void> {
  if (blobActif()) {
    try {
      const { del } = await import('@vercel/blob');
      await del(PREFIXE + cle);
    } catch {
      // Fiche supprimée malgré tout : un objet orphelin dans le store coûte
      // moins cher qu'une ligne qui désigne un fichier illisible.
    }
    return;
  }
  rmSync(path.join(DOSSIER, cle), { force: true });
}

// ─────────────────────────────────────────────────────────────────────────────
// Dimensions, lues dans les octets
// ─────────────────────────────────────────────────────────────────────────────

/**
 * On lit les en-têtes à la main plutôt que d'ajouter une dépendance d'analyse
 * d'image : quatre formats, quelques dizaines d'octets chacun. Ça sert à dire
 * tout de suite si une image tiendra dans un format de réseau — une photo en
 * 4000 × 3000 déposée pour un carrousel LinkedIn sera recadrée par le réseau,
 * et mieux vaut l'apprendre ici que dans le fil.
 */
export function dimensions(b: Buffer, typeMime: string): { largeur: number; hauteur: number } | null {
  try {
    if (typeMime === 'image/png' && b.length > 24) {
      return { largeur: b.readUInt32BE(16), hauteur: b.readUInt32BE(20) };
    }
    if (typeMime === 'image/gif' && b.length > 10) {
      return { largeur: b.readUInt16LE(6), hauteur: b.readUInt16LE(8) };
    }
    if (typeMime === 'image/webp' && b.length > 30) {
      const forme = b.toString('ascii', 12, 16);
      if (forme === 'VP8X') return { largeur: (b.readUIntLE(24, 3) & 0xffffff) + 1, hauteur: b.readUIntLE(27, 3) + 1 };
      if (forme === 'VP8 ') return { largeur: b.readUInt16LE(26) & 0x3fff, hauteur: b.readUInt16LE(28) & 0x3fff };
      if (forme === 'VP8L') {
        const n = b.readUInt32LE(21);
        return { largeur: (n & 0x3fff) + 1, hauteur: ((n >> 14) & 0x3fff) + 1 };
      }
      return null;
    }
    if (typeMime === 'image/jpeg') {
      let i = 2;
      while (i + 9 < b.length) {
        if (b[i] !== 0xff) {
          i++;
          continue;
        }
        const marqueur = b[i + 1];
        // Marqueurs sans charge utile : on avance de deux octets.
        if (marqueur === 0xd8 || marqueur === 0x01 || (marqueur >= 0xd0 && marqueur <= 0xd9)) {
          i += 2;
          continue;
        }
        const longueur = b.readUInt16BE(i + 2);
        // SOF0…SOF15, hors tables de Huffman (C4), DNL (C8) et DAC (CC).
        if (marqueur >= 0xc0 && marqueur <= 0xcf && marqueur !== 0xc4 && marqueur !== 0xc8 && marqueur !== 0xcc) {
          return { hauteur: b.readUInt16BE(i + 5), largeur: b.readUInt16BE(i + 7) };
        }
        i += 2 + longueur;
      }
    }
  } catch {
    return null;
  }
  return null;
}

/** Les cadres que les réseaux acceptent sans recadrer. */
const CADRES: Array<{ nom: string; ratio: number; ou: string }> = [
  { nom: '1:1', ratio: 1, ou: 'LinkedIn, Instagram — carré' },
  { nom: '4:5', ratio: 0.8, ou: 'LinkedIn, Instagram — portrait' },
  { nom: '9:16', ratio: 0.5625, ou: 'Reel, TikTok — plein écran' },
  { nom: '1,91:1', ratio: 1.91, ou: 'LinkedIn — paysage, aperçu de lien' },
];

/**
 * Le cadre le plus proche, et s'il tombe juste. La tolérance de 2 % absorbe
 * les arrondis de dimensions (1080 × 1349 reste du 4:5) sans laisser passer
 * une photo d'appareil, qui est en 3:2 ou en 4:3.
 */
export function cadre(largeur?: number | null, hauteur?: number | null) {
  if (!largeur || !hauteur) return null;
  const r = largeur / hauteur;
  let meilleur = CADRES[0];
  for (const c of CADRES) if (Math.abs(c.ratio - r) < Math.abs(meilleur.ratio - r)) meilleur = c;
  const ecart = Math.abs(meilleur.ratio - r) / meilleur.ratio;
  return { ...meilleur, exact: ecart <= 0.02, ecart };
}

export function poids(octets: number): string {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} ko`;
  return `${(octets / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`;
}

/** Ce que l'interface affiche pour ne pas laisser croire à une durabilité absente. */
export function etatMedias(): { durable: boolean; libelle: string } {
  if (!EN_SERVERLESS) return { durable: true, libelle: 'dossier local data/medias/' };
  if (blobActif()) return { durable: true, libelle: 'store Blob privé' };
  return { durable: false, libelle: 'stockage éphémère — les fichiers déposés seront perdus au redémarrage' };
}

/**
 * Lecture en **flux**, avec gestion des requêtes partielles.
 *
 * Indispensable pour la vidéo, et pour deux raisons distinctes : un lecteur
 * `<video>` demande des tranches (`Range`) pour pouvoir se déplacer dans la
 * durée, et charger 200 Mo en mémoire dans une fonction serverless pour en
 * renvoyer trois secondes serait absurde. Les octets ne sont donc jamais
 * rassemblés : la tranche demandée est relayée telle quelle.
 */
export interface Flux {
  /** Toujours un flux, même depuis le disque : la réponse HTTP n'a qu'une forme à gérer. */
  corps: ReadableStream<Uint8Array>;
  statut: 200 | 206;
  taille: number;
  total: number;
  intervalle?: string;
}

function tranche(plage: string | null, total: number): { de: number; a: number } | null {
  if (!plage) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(plage.trim());
  if (!m) return null;
  const [, d, f] = m;
  // `bytes=-500` demande les 500 derniers octets.
  if (d === '' && f === '') return null;
  const de = d === '' ? Math.max(0, total - Number(f)) : Number(d);
  const a = d === '' ? total - 1 : f === '' ? total - 1 : Math.min(Number(f), total - 1);
  if (!Number.isFinite(de) || !Number.isFinite(a) || de > a || de >= total) return null;
  return { de, a };
}

export async function lireFlux(cle: string, plage: string | null): Promise<Flux | null> {
  if (blobActif()) {
    const { get } = await import('@vercel/blob');
    try {
      // Le `Range` est relayé au stockage : c'est lui qui découpe, pas nous.
      const res = await get(PREFIXE + cle, {
        access: 'private',
        useCache: true,
        ...(plage ? { headers: { Range: plage } } : {}),
      });
      if (!res || res.statusCode !== 200 || !res.stream) return null;
      const intervalle = res.headers.get('content-range');
      const taille = Number(res.headers.get('content-length') ?? res.blob.size);
      if (plage && intervalle) {
        const total = Number(intervalle.split('/')[1] ?? res.blob.size);
        return { corps: res.stream, statut: 206, taille, total, intervalle };
      }
      return { corps: res.stream, statut: 200, taille, total: res.blob.size };
    } catch {
      return null;
    }
  }

  const p = path.join(DOSSIER, cle);
  if (!existsSync(p)) return null;
  const octets = readFileSync(p);
  const t = tranche(plage, octets.byteLength);
  const flux = (b: Buffer) => new Blob([new Uint8Array(b)]).stream() as ReadableStream<Uint8Array>;
  if (!t) return { corps: flux(octets), statut: 200, taille: octets.byteLength, total: octets.byteLength };
  const bout = octets.subarray(t.de, t.a + 1);
  return {
    corps: flux(bout),
    statut: 206,
    taille: bout.byteLength,
    total: octets.byteLength,
    intervalle: `bytes ${t.de}-${t.a}/${octets.byteLength}`,
  };
}

/** Durée en minutes:secondes, telle qu'on la lit dans un plan de tournage. */
export function duree(secondes?: number | null): string | null {
  if (secondes == null || !Number.isFinite(secondes)) return null;
  const s = Math.round(secondes);
  if (s < 60) return `${s} s`;
  return `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')}`;
}

/**
 * Dimensions et durée d'un MP4 / MOV, lues dans les boîtes du conteneur.
 *
 * Le navigateur sait le faire, et le fait sur le chemin de dépôt direct. Mais
 * laisser l'information manquante sur l'autre chemin voudrait dire qu'une
 * vidéo déposée là n'est pas vérifiée contre le cadre 9:16 — exactement le
 * contrôle qui sert. Deux boîtes suffisent : `mvhd` pour la durée, `tkhd` pour
 * les dimensions de la piste image.
 *
 * Le WebM n'est pas couvert : son conteneur est de l'EBML, qui demande un vrai
 * analyseur. Une vidéo WebM sera affichée sans ses dimensions plutôt que
 * refusée.
 */
export function dimensionsVideo(b: Buffer): { largeur?: number; hauteur?: number; duree?: number } {
  const res: { largeur?: number; hauteur?: number; duree?: number } = {};
  let aire = 0;

  const parcourir = (debut: number, fin: number, profondeur: number) => {
    let i = debut;
    while (i + 8 <= fin && profondeur < 6) {
      let taille = b.readUInt32BE(i);
      const nom = b.toString('ascii', i + 4, i + 8);
      let corps = i + 8;
      if (taille === 1) {
        // Boîte étendue : la taille réelle est sur 64 bits juste après le nom.
        if (i + 16 > fin) return;
        taille = Number(b.readBigUInt64BE(i + 8));
        corps = i + 16;
      } else if (taille === 0) {
        taille = fin - i; // Jusqu'à la fin du fichier.
      }
      if (taille < 8 || i + taille > fin) return;

      if (nom === 'moov' || nom === 'trak' || nom === 'mdia') {
        parcourir(corps, i + taille, profondeur + 1);
      } else if (nom === 'mvhd' && corps + 20 <= fin) {
        // version 0 : 4 (version+indicateurs) + 4 + 4 → échelle à 12, durée à 16.
        // version 1 : les deux horodatages passent sur 8 octets → 20 et 24.
        const version = b[corps];
        const echelle = b.readUInt32BE(corps + (version === 1 ? 20 : 12));
        const duree = version === 1 ? Number(b.readBigUInt64BE(corps + 24)) : b.readUInt32BE(corps + 16);
        if (echelle > 0) res.duree = duree / echelle;
      } else if (nom === 'tkhd') {
        const version = b[corps];
        // Largeur et hauteur closent la boîte, après la matrice de 36 octets :
        // 76 octets depuis le début du corps en version 0, 88 en version 1.
        const decalage = corps + (version === 1 ? 88 : 76);
        if (decalage + 8 <= fin) {
          // 16.16 en virgule fixe : les deux octets hauts portent les pixels.
          const l = b.readUInt32BE(decalage) / 65536;
          const h = b.readUInt32BE(decalage + 4) / 65536;
          // Une piste audio porte 0 × 0 : on garde la plus grande surface.
          if (l * h > aire) {
            aire = l * h;
            res.largeur = Math.round(l);
            res.hauteur = Math.round(h);
          }
        }
      }
      i += taille;
    }
  };

  try {
    parcourir(0, b.byteLength, 0);
  } catch {
    return res;
  }
  return res;
}

// ─────────────────────────────────────────────────────────────────────────────
// Lien public temporaire
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Une adresse que **Meta et TikTok** peuvent atteindre, sans ouvrir la
 * médiathèque à tout le monde.
 *
 * C'est une contrainte des API, pas un choix : Instagram et TikTok ne reçoivent
 * pas de fichier, ils vont le **chercher** à une adresse. Un média privé, servi
 * derrière le mot de passe de l'outil, leur est donc invisible.
 *
 * Deux façons de produire cette adresse, selon l'environnement :
 * - avec le store Blob, une URL présignée sur l'hôte du stockage. Les octets
 *   ne traversent pas l'outil : un Reel de 80 Mo tiré par Meta à travers une
 *   fonction serverless dépasserait sa durée maximale d'exécution ;
 * - sans store (développement local), un lien signé sur notre propre route.
 *   Il n'est atteignable que depuis la machine, ce qui suffit pour vérifier la
 *   mécanique et pas pour publier.
 *
 * Dans les deux cas le lien **expire**. Il porte un droit de lecture sur un
 * fichier précis, pour le temps d'un appel d'API, et rien d'autre.
 */
export async function lienPublic(
  cle: string,
  base: string,
  entite: string,
  id: number,
  minutes = 120,
): Promise<{ url: string; expire: Date; porte: 'blob' | 'outil' }> {
  const expire = new Date(Date.now() + minutes * 60 * 1000);

  if (blobActif()) {
    const { issueSignedToken, presignUrl } = await import('@vercel/blob');
    const jeton = await issueSignedToken({
      pathname: PREFIXE + cle,
      operations: ['get'],
      validUntil: expire.getTime(),
    });
    const { presignedUrl } = await presignUrl(jeton, {
      operation: 'get',
      access: 'private',
      pathname: PREFIXE + cle,
      validUntil: expire.getTime(),
    });
    return { url: presignedUrl, expire, porte: 'blob' };
  }

  const exp = Math.floor(expire.getTime() / 1000);
  const signature = createHmac('sha256', process.env.MACHINE_CLE_SESSION ?? 'cle-de-developpement-non-secrete')
    .update(`${entite}:${id}:${exp}`)
    .digest('hex');
  return { url: `${base}/${entite}/medias/${id}?exp=${exp}&jeton=${signature}`, expire, porte: 'outil' };
}

/** Le pendant du précédent, côté route de service. */
export function lienSigne(entite: string, id: number, exp: string | null, jeton: string | null): boolean {
  if (!exp || !jeton) return false;
  const n = Number(exp);
  if (!Number.isFinite(n) || n * 1000 < Date.now()) return false;
  const attendu = createHmac('sha256', process.env.MACHINE_CLE_SESSION ?? 'cle-de-developpement-non-secrete')
    .update(`${entite}:${id}:${n}`)
    .digest('hex');
  const a = Buffer.from(jeton);
  const b = Buffer.from(attendu);
  return a.length === b.length && timingSafeEqual(a, b);
}
