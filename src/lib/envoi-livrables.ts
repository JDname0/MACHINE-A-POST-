/**
 * Envoi d'un post fourni (fichiers faits hors de la machine) depuis le
 * navigateur. Deux chemins, comme pour la médiathèque :
 *  - **en production** (store Blob) : chaque fichier part directement au
 *    store — seule façon d'accepter une vidéo, une fonction Vercel refusant un
 *    corps de requête au-delà de ~4,5 Mo — puis l'action
 *    `enregistrerTeleversement` l'inscrit comme « livrable » du post ;
 *  - **en local** : les fichiers passent par l'action `deposerLivrables`.
 *
 * Module navigateur : il lit les fichiers avec le DOM (dimensions, durée).
 */
import { deposerLivrables, enregistrerTeleversement } from '@/app/actions';

export const TYPES_LIVRABLE_NAVIGATEUR = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'application/pdf',
];

export interface Plafonds {
  image: number;
  video: number;
  document: number;
}

/** Dimensions et durée, lues en chargeant le fichier dans le DOM. Un PDF n'en a pas. */
export function mesurer(f: File): Promise<{ largeur?: number; hauteur?: number; duree?: number }> {
  return new Promise((resolve) => {
    if (f.type === 'application/pdf') return resolve({});
    const url = URL.createObjectURL(f);
    const fini = (r: { largeur?: number; hauteur?: number; duree?: number }) => {
      URL.revokeObjectURL(url);
      resolve(r);
    };
    // Un fichier que le navigateur ne sait pas lire part sans ses mesures.
    const abandon = setTimeout(() => fini({}), 8000);
    if (f.type.startsWith('video/')) {
      const v = document.createElement('video');
      v.preload = 'metadata';
      v.onloadedmetadata = () => {
        clearTimeout(abandon);
        fini({ largeur: v.videoWidth, hauteur: v.videoHeight, duree: v.duration });
      };
      v.onerror = () => {
        clearTimeout(abandon);
        fini({});
      };
      v.src = url;
    } else {
      const i = new Image();
      i.onload = () => {
        clearTimeout(abandon);
        fini({ largeur: i.naturalWidth, hauteur: i.naturalHeight });
      };
      i.onerror = () => {
        clearTimeout(abandon);
        fini({});
      };
      i.src = url;
    }
  });
}

const extension = (type: string) =>
  ({ 'image/jpeg': 'jpg', 'video/quicktime': 'mov', 'application/pdf': 'pdf' })[type] ?? type.split('/')[1];

/**
 * Envoie les fichiers sur le post, dans l'ordre donné (l'ordre des pages d'un
 * carrousel). `progres` reçoit le fichier en cours et son pourcentage.
 */
export async function envoyerLivrables(
  entite: string,
  publicationId: number,
  fichiers: File[],
  direct: boolean,
  plafonds: Plafonds,
  progres: (fichier: string, rang: number, total: number, pourcent: number) => void,
): Promise<{ posees: number; refus: string[] }> {
  const refus: string[] = [];
  const valides = fichiers.filter((f) => {
    if (!TYPES_LIVRABLE_NAVIGATEUR.includes(f.type)) {
      refus.push(`${f.name} — ${f.type || 'type inconnu'} : image, vidéo ou PDF seulement`);
      return false;
    }
    const max = f.type.startsWith('video/') ? plafonds.video : f.type === 'application/pdf' ? plafonds.document : plafonds.image;
    if (f.size > max) {
      refus.push(`${f.name} — ${Math.round(f.size / 1048576)} Mo, au-delà de la limite de ${Math.round(max / 1048576)} Mo`);
      return false;
    }
    return true;
  });

  if (!direct) {
    const fd = new FormData();
    fd.set('entite', entite);
    fd.set('publication_id', String(publicationId));
    for (const f of valides) fd.append('fichiers', f);
    progres(valides.map((f) => f.name).join(', '), 1, 1, 0);
    const r = await deposerLivrables(fd);
    return { posees: r.posees, refus: [...refus, ...r.refus] };
  }

  const { uploadPresigned } = await import('@vercel/blob/client');
  let posees = 0;
  for (let i = 0; i < valides.length; i++) {
    const f = valides[i];
    progres(f.name, i + 1, valides.length, 0);
    const mesures = await mesurer(f);
    try {
      const blob = await uploadPresigned(`machine-a-post/medias/${crypto.randomUUID()}.${extension(f.type)}`, f, {
        access: 'private',
        contentType: f.type,
        handleUploadUrl: `/${entite}/medias/televerser`,
        onUploadProgress: ({ percentage }) => progres(f.name, i + 1, valides.length, Math.round(percentage)),
      });
      const fd = new FormData();
      fd.set('entite', entite);
      fd.set('chemin', blob.pathname);
      fd.set('nom', f.name);
      fd.set('publication_id', String(publicationId));
      fd.set('origine', 'livrable');
      if (mesures.largeur) fd.set('largeur', String(mesures.largeur));
      if (mesures.hauteur) fd.set('hauteur', String(mesures.hauteur));
      if (mesures.duree) fd.set('duree_s', String(mesures.duree));
      const res = await enregistrerTeleversement(fd);
      if (res.ok) posees++;
      else refus.push(`${f.name} — ${res.raison}`);
    } catch (err) {
      refus.push(`${f.name} — dépôt interrompu : ${(err as Error).message}`);
    }
  }
  return { posees, refus };
}
