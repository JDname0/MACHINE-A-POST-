import { db } from '@/lib/db';
import { estEntite } from '@/lib/marques';
import { connecte } from '@/lib/auth';
import { lireFlux, lienSigne } from '@/lib/medias';

/**
 * Sert une image déposée.
 *
 * Même règle que le générateur de visuels : une route de fichier ne traverse
 * pas le `layout`, donc elle porte son propre contrôle. Sans lui, le store
 * privé serait lisible par n'importe qui connaissant un identifiant — et les
 * identifiants sont des entiers consécutifs.
 *
 * Le type servi est celui relevé au dépôt, et il est **réduit à la liste
 * blanche** : pas question de renvoyer `text/html` parce qu'une fiche aurait
 * été écrite de travers, ce qui ferait de la médiathèque un hébergeur de page.
 */

const TYPES_SERVIS = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'audio/mpeg',
  'audio/wav',
]);

export async function GET(requete: Request, { params }: { params: Promise<{ entite: string; id: string }> }) {
  const { entite, id } = await params;
  if (!estEntite(entite)) return new Response('Entité inconnue', { status: 404 });

  const n = Number(id);
  if (!Number.isInteger(n)) return new Response('Identifiant invalide', { status: 400 });

  // Deux façons d'être autorisé : la session de l'outil, ou un lien signé et
  // daté. Le second existe pour les API qui vont **chercher** le fichier —
  // Instagram et TikTok ne reçoivent pas d'octets, ils suivent une adresse, et
  // n'ont évidemment pas le mot de passe. Le lien ne vaut que pour ce fichier
  // et pour quelques heures.
  const url = new URL(requete.url);
  const autorise =
    (await connecte()) || lienSigne(entite, n, url.searchParams.get('exp'), url.searchParams.get('jeton'));
  if (!autorise) return new Response('Non autorisé', { status: 401 });

  const row = db()
    .prepare('SELECT cle, nom, type_mime FROM medias WHERE id=? AND entite=?')
    .get(n, entite) as { cle: string; nom: string; type_mime: string } | undefined;
  if (!row) return new Response('Image inconnue', { status: 404 });

  // Le `Range` du lecteur vidéo est relayé jusqu'au stockage : sans ça, se
  // déplacer dans la durée redemanderait le fichier entier à chaque clic, et
  // 200 Mo seraient rassemblés en mémoire dans la fonction pour en renvoyer
  // trois secondes.
  const plage = requete.headers.get('range');
  const flux = await lireFlux(row.cle, plage);
  if (!flux) {
    // Cas réel sur Vercel quand le store n'est pas connecté : la fiche a
    // survécu dans l'instantané, le fichier non. Le dire plutôt que servir
    // un fichier vide.
    return new Response('Fichier introuvable dans le stockage', { status: 410 });
  }

  const type = TYPES_SERVIS.has(row.type_mime) ? row.type_mime : 'application/octet-stream';
  return new Response(flux.corps, {
    status: flux.statut,
    headers: {
      'Content-Type': type,
      'Content-Length': String(flux.taille),
      ...(flux.intervalle ? { 'Content-Range': flux.intervalle } : {}),
      // Annoncé même sur une réponse complète : c'est ce qui autorise le
      // lecteur à demander des tranches ensuite.
      'Accept-Ranges': 'bytes',
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(row.nom)}`,
      // Court, et surtout pas `immutable` : les octets d'un identifiant donné
      // ne changent jamais, mais l'identifiant peut **disparaître**. Relevé en
      // production le 2026-11-04 — après suppression, le serveur répondait 410
      // et le navigateur continuait d'afficher l'image depuis son cache. Cinq
      // minutes suffisent à ne pas retélécharger une grille à chaque
      // rechargement, sans faire survivre une image effacée une semaine.
      'Cache-Control': 'private, max-age=300',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
