import { db } from '@/lib/db';
import { lireFlux, TYPES_SERVIS } from '@/lib/medias';

/**
 * Lien de partage public : `/p/<jeton>`. Sert le fichier tant que le lien
 * n'est ni expiré ni révoqué (`liens_partage`), sans session — c'est le but.
 * Rien d'autre n'est lisible par ce chemin : un jeton désigne un fichier, un
 * seul, et ne donne accès à aucune page de l'outil.
 */
export async function GET(requete: Request, { params }: { params: Promise<{ jeton: string }> }) {
  const { jeton } = await params;
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(jeton)) return new Response('Lien inconnu', { status: 404 });

  const row = db()
    .prepare(
      `SELECT m.cle, m.nom, m.type_mime FROM liens_partage l JOIN medias m ON m.id = l.media_id
       WHERE l.jeton = ? AND l.revoque_le IS NULL AND (l.expire_le IS NULL OR l.expire_le > datetime('now'))`,
    )
    .get(jeton) as { cle: string; nom: string; type_mime: string } | undefined;
  // Même réponse pour un lien expiré, révoqué ou inventé : rien à deviner.
  if (!row) return new Response('Lien expiré, révoqué ou inconnu', { status: 404 });

  const flux = await lireFlux(row.cle, requete.headers.get('range'));
  if (!flux) return new Response('Fichier introuvable dans le stockage', { status: 410 });

  const type = TYPES_SERVIS.has(row.type_mime) ? row.type_mime : 'application/octet-stream';
  return new Response(flux.corps, {
    status: flux.statut,
    headers: {
      'Content-Type': type,
      'Content-Length': String(flux.taille),
      ...(flux.intervalle ? { 'Content-Range': flux.intervalle } : {}),
      'Accept-Ranges': 'bytes',
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(row.nom)}`,
      // Court : un lien révoqué doit cesser de servir vite, même depuis un cache.
      'Cache-Control': 'private, max-age=300',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex',
    },
  });
}
