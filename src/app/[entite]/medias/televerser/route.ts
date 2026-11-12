import { handleUploadPresigned, type HandleUploadPresignedBody } from '@vercel/blob/client';
import { issueSignedToken } from '@vercel/blob';
import { estEntite } from '@/lib/marques';
import { connecte } from '@/lib/auth';
import { TYPES_IMAGE, TYPES_VIDEO, TYPES_DOCUMENT, TAILLE_MAX_IMAGE, TAILLE_MAX_VIDEO, TAILLE_MAX_DOCUMENT } from '@/lib/medias';

/**
 * Signe un jeton pour que le navigateur téléverse **directement** vers le
 * store Blob.
 *
 * C'est le seul moyen d'accepter une vidéo : par une action serveur, les
 * octets traversent la fonction, et une fonction Vercel refuse un corps au-delà
 * de ~4,5 Mo. Ici la fonction ne voit passer qu'un jeton de quelques centaines
 * d'octets ; le fichier va du navigateur au stockage sans intermédiaire.
 *
 * Le jeton est **présigné** et non « client token » : ce dernier exige un
 * `BLOB_READ_WRITE_TOKEN` statique, que ce projet n'a pas — son store est
 * connecté par OIDC. Relevé en production le 2026-11-04, où `handleUpload`
 * répondait « No read-write token found ». `issueSignedToken` accepte l'OIDC,
 * et c'est donc lui qui signe.
 *
 * Ce jeton est une autorisation d'écriture dans le store. Trois verrous :
 * - **la session.** Sans cookie valide, pas de jeton. Une route de fichier ne
 *   traverse pas le `layout`, donc le contrôle est ici, comme ailleurs.
 * - **le chemin.** Le navigateur propose un chemin ; on n'accepte que le
 *   préfixe de la médiathèque suivi d'un identifiant tiré au hasard. Sans ça,
 *   un jeton permettrait d'écraser l'instantané de la base, qui vit dans le
 *   même store.
 * - **le type et la taille**, appliqués par le stockage lui-même et non par
 *   une vérification côté navigateur, qu'on ne contrôle pas.
 */

const CHEMIN_ATTENDU = /^machine-a-post\/medias\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|webp|gif|mp4|mov|webm|pdf)$/;

export async function POST(requete: Request, { params }: { params: Promise<{ entite: string }> }) {
  if (!(await connecte())) return new Response('Non autorisé', { status: 401 });

  const { entite } = await params;
  if (!estEntite(entite)) return new Response('Entité inconnue', { status: 404 });

  const corps = (await requete.json()) as HandleUploadPresignedBody;

  try {
    const res = await handleUploadPresigned({
      body: corps,
      request: requete,
      getSignedToken: async (chemin) => {
        if (!CHEMIN_ATTENDU.test(chemin)) throw new Error('Chemin de dépôt refusé');
        const video = /\.(mp4|mov|webm)$/.test(chemin);
        const document = /\.pdf$/.test(chemin);
        const contraintes = {
          allowedContentTypes: Object.keys(video ? TYPES_VIDEO : document ? TYPES_DOCUMENT : TYPES_IMAGE),
          maximumSizeInBytes: video ? TAILLE_MAX_VIDEO : document ? TAILLE_MAX_DOCUMENT : TAILLE_MAX_IMAGE,
        };
        // Une heure : le temps d'un gros téléversement sur une connexion
        // moyenne, pas davantage. Le jeton ne porte que l'écriture, et que sur
        // ce chemin précis.
        const validUntil = Date.now() + 60 * 60 * 1000;
        const token = await issueSignedToken({ pathname: chemin, operations: ['put'], validUntil, ...contraintes });
        return {
          token,
          urlOptions: { ...contraintes, validUntil, addRandomSuffix: false, allowOverwrite: false },
          // La fiche est écrite par l'action `enregistrerTeleversement`, que le
          // navigateur appelle quand le téléversement est fini. On ne s'appuie
          // pas sur `onUploadCompleted` : ce rappel vient de l'extérieur et
          // n'existe pas en développement local, où rien n'est joignable.
        };
      },
    });
    return Response.json(res);
  } catch (e) {
    return Response.json({ erreur: (e as Error).message }, { status: 400 });
  }
}
