import { createHash, timingSafeEqual } from 'node:crypto';
import { EMPREINTE_JETON_QG, statsQG } from '@/lib/stats-qg';

/**
 * GET /api/qg/stats — statistiques en LECTURE SEULE pour QG.
 *
 * Accès par jeton uniquement, envoyé en `Authorization: Bearer <jeton>` ou
 * `X-QG-Jeton: <jeton>`. La route calcule sha256(jeton reçu) et la compare,
 * à temps constant, à `EMPREINTE_JETON_QG` (src/lib/stats-qg.ts). Aucune
 * variable d'environnement n'est lue.
 * - empreinte vide ou mal formée → 404 (la route n'existe pas) ;
 * - jeton absent ou faux → 401.
 * Le jeton n'est jamais journalisé ni renvoyé.
 *
 * Cette route ne traverse aucun `layout` (pas de session par mot de passe) :
 * le jeton est sa seule protection. Le dépôt n'a pas de middleware, donc pas
 * d'exception à y poser.
 */
export const dynamic = 'force-dynamic';

const SANS_CACHE = { 'Cache-Control': 'no-store' };

function correspond(jeton: string, attendue: Buffer): boolean {
  if (!jeton) return false;
  const recue = createHash('sha256').update(jeton, 'utf8').digest();
  return timingSafeEqual(recue, attendue);
}

export async function GET(requete: Request) {
  const hex = EMPREINTE_JETON_QG.trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(hex)) return new Response('Not Found', { status: 404, headers: SANS_CACHE });
  const attendue = Buffer.from(hex, 'hex');

  const auth = requete.headers.get('authorization') ?? '';
  const bearer = /^Bearer\s+(.+)$/i.exec(auth)?.[1]?.trim() ?? '';
  const entete = requete.headers.get('x-qg-jeton')?.trim() ?? '';
  // Les deux sont toujours évalués : pas de court-circuit qui révélerait lequel est présent.
  const okBearer = correspond(bearer, attendue);
  const okEntete = correspond(entete, attendue);
  if (!okBearer && !okEntete) {
    return new Response('Unauthorized', { status: 401, headers: { ...SANS_CACHE, 'WWW-Authenticate': 'Bearer' } });
  }
  return Response.json(statsQG(), { headers: SANS_CACHE });
}
