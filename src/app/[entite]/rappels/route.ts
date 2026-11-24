import { connecte } from '@/lib/auth';
import { estEntite, marque } from '@/lib/marques';
import { rappelsIcs } from '@/lib/suivi';
import { adresseDepuisEntetes } from '@/lib/adresse';

/**
 * Les rappels de publication manuelle, en fichier .ics à importer dans un
 * agenda : un événement par post à poster à la main, le jour prévu, avec une
 * alarme. Le rappel ne publie rien.
 */
export async function GET(requete: Request, { params }: { params: Promise<{ entite: string }> }) {
  // Route de fichier : elle ne traverse pas le `layout`, elle vérifie donc la session elle-même.
  if (!(await connecte())) return new Response('Non autorisé', { status: 401 });
  const { entite } = await params;
  if (!estEntite(entite)) return new Response('Entité inconnue', { status: 404 });

  const url = new URL(requete.url);
  const heure = url.searchParams.get('heure') ?? '09:00';
  const { ics } = rappelsIcs(entite, adresseDepuisEntetes(requete.headers, url.host), marque(entite).nom, heure);
  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="rappels-${entite}.ics"`,
      'Cache-Control': 'no-store',
    },
  });
}
