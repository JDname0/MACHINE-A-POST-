import { PDFDocument } from 'pdf-lib';
import { connecte } from '@/lib/auth';
import { estEntite, type EntiteSlug } from '@/lib/marques';
import { publication } from '@/lib/requetes';
import { pagesCarrousel } from '@/lib/fiche';
import { pngVisuel } from '@/lib/png-visuel';

/**
 * Le carrousel en un seul PDF, une page par visuel : c'est le format que
 * LinkedIn attend pour un post « document ». Instagram, lui, prend les images
 * une à une (liens par page dans l'aperçu).
 *
 * Rien n'est publié ici : le fichier se télécharge, Jonathan le dépose.
 */
export async function GET(_requete: Request, { params }: { params: Promise<{ entite: string; id: string }> }) {
  // Route de fichier : elle ne traverse pas le `layout`, elle vérifie donc la session elle-même.
  if (!(await connecte())) return new Response('Non autorisé', { status: 401 });

  const { entite, id } = await params;
  if (!estEntite(entite)) return new Response('Entité inconnue', { status: 404 });
  const p = publication(Number(id));
  // La cloison : un post de l'autre entité n'existe pas vu d'ici.
  if (!p || p.entite !== entite) return new Response('Publication inconnue', { status: 404 });

  const pages = pagesCarrousel(p);
  if (!pages.length) return new Response('Ce post n’a pas de pages de carrousel (« PAGE n — … »).', { status: 404 });

  const doc = await PDFDocument.create();
  doc.setTitle(p.titre ?? `Carrousel ${p.id}`);
  doc.setProducer('Machine à post');
  for (const v of pages) {
    const { octets, largeur, hauteur } = await pngVisuel(entite as EntiteSlug, v);
    const image = await doc.embedPng(octets);
    // 1 pixel = 1 point : LinkedIn affiche le document à la largeur du fil, le ratio seul compte.
    doc.addPage([largeur, hauteur]).drawImage(image, { x: 0, y: 0, width: largeur, height: hauteur });
  }
  const octets = await doc.save();
  return new Response(Buffer.from(octets), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${entite}-carrousel-${p.id}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
