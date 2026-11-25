import { connecte } from '@/lib/auth';
import { estEntite } from '@/lib/marques';
import { publication } from '@/lib/requetes';
import { figuresArticle } from '@/lib/fiche';
import { destinationSite, fichierArticle, fichierImage, pageArticle } from '@/lib/mise-en-ligne';

/**
 * L'article tel qu'il sera en ligne : aperçu (images servies par la
 * médiathèque, styles et polices du site), ou `?telecharger=1` pour la page à
 * déposer à la main (images nommées comme sur le site). Ne publie rien.
 */
export async function GET(requete: Request, { params }: { params: Promise<{ entite: string; id: string }> }) {
  // Route de fichier : elle ne traverse pas le `layout`, elle vérifie donc la session elle-même.
  if (!(await connecte())) return new Response('Non autorisé', { status: 401 });
  const { entite, id } = await params;
  if (!estEntite(entite)) return new Response('Entité inconnue', { status: 404 });
  const p = publication(Number(id));
  // La cloison : un post de l'autre entité n'existe pas vu d'ici.
  if (!p || p.entite !== entite || p.format_slug !== 'blog-article') return new Response('Article inconnu', { status: 404 });
  const dest = destinationSite(entite);
  const telecharger = new URL(requete.url).searchParams.get('telecharger') === '1';
  if (telecharger) {
    return new Response(pageArticle(p, (i) => fichierImage(p, i), dest), {
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Content-Disposition': `attachment; filename="${fichierArticle(p)}"`, 'Cache-Control': 'private, no-store' },
    });
  }
  const figures = figuresArticle(p);
  return new Response(pageArticle(p, (i) => `/${entite}/medias/${figures[i].id}`, dest, true), {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex' },
  });
}
