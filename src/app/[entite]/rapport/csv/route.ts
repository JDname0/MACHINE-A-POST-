import { connecte } from '@/lib/auth';
import { estEntite } from '@/lib/marques';
import { moisValide, rapportCsv, rapportMensuel } from '@/lib/suivi';

/** Le détail du rapport mensuel, un post par ligne, pour un tableur. */
export async function GET(requete: Request, { params }: { params: Promise<{ entite: string }> }) {
  // Route de fichier : elle ne traverse pas le `layout`, elle vérifie donc la session elle-même.
  if (!(await connecte())) return new Response('Non autorisé', { status: 401 });
  const { entite } = await params;
  if (!estEntite(entite)) return new Response('Entité inconnue', { status: 404 });
  const mois = moisValide(new URL(requete.url).searchParams.get('mois') ?? undefined);
  return new Response(rapportCsv(rapportMensuel(entite, mois)), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="rapport-${entite}-${mois}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
