import { connecte } from '@/lib/auth';
import { estEntite } from '@/lib/marques';
import { auditerEntite } from '@/lib/superviseur';

/** L'audit du superviseur qualité, en JSON (posts à venir, constats). */
export async function GET(_r: Request, { params }: { params: Promise<{ entite: string }> }) {
  // Route de fichier : elle ne traverse pas le `layout`, elle vérifie donc la session elle-même.
  if (!(await connecte())) return new Response('Non autorisé', { status: 401 });
  const { entite } = await params;
  if (!estEntite(entite)) return new Response('Entité inconnue', { status: 404 });
  return Response.json(auditerEntite(entite), { headers: { 'Cache-Control': 'no-store' } });
}
