import { ImageResponse } from 'next/og';
import { chargerPolices } from '@/lib/polices';
import { estEntite, type EntiteSlug } from '@/lib/marques';
import { connecte } from '@/lib/auth';
import { GABARITS, rendre, type GabaritSlug, type Contenu, type Variante } from '@/lib/visuels';
import { db } from '@/lib/db';
import { lire, TYPES_IMAGE } from '@/lib/medias';

/**
 * Sert le visuel en PNG, aux dimensions exactes du réseau.
 *
 * Les polices sont lues sur le disque plutôt que chargées depuis Google à
 * chaque rendu : Satori veut les octets du fichier, et une dépendance réseau
 * par image ajouterait une panne possible à chaque génération. Leur inclusion
 * dans le paquet serverless est déclarée dans `next.config.ts`
 * (`outputFileTracingIncludes`) — sans ça le traçage de Next ne les voit pas,
 * puisqu'aucun `import` ne les mentionne.
 */

export async function GET(
  requete: Request,
  { params }: { params: Promise<{ entite: string; gabarit: string }> },
) {
  // Une route de fichier ne traverse pas le `layout` : sans ce contrôle, le
  // générateur serait ouvert à tous, et n'importe qui pourrait faire composer
  // du texte arbitraire sur un visuel portant la marque.
  if (!(await connecte())) return new Response('Non autorisé', { status: 401 });

  const { entite, gabarit } = await params;
  if (!estEntite(entite)) return new Response('Entité inconnue', { status: 404 });
  if (!(gabarit in GABARITS)) return new Response('Gabarit inconnu', { status: 404 });

  const g = GABARITS[gabarit as GabaritSlug];
  const url = new URL(requete.url);

  // Le texte est surchargeable : c'est un générateur, pas cinq images figées.
  const surcharge: Partial<Contenu> = {};
  for (const cle of ['ligne1', 'ligne2', 'sousTitre', 'chiffre', 'legende', 'pagination'] as const) {
    const v = url.searchParams.get(cle);
    if (v != null) surcharge[cle] = v;
  }

  const variante: Variante = url.searchParams.get('variante') === 'sombre' ? 'sombre' : 'clair';

  // La photo de fond ne vient que de la médiathèque de la même entité, par
  // son identifiant : jamais une adresse arbitraire passée dans l'URL.
  let photo: string | undefined;
  const idPhoto = Number(url.searchParams.get('photo'));
  if (Number.isInteger(idPhoto) && idPhoto > 0) {
    const m = db().prepare('SELECT cle, type_mime FROM medias WHERE id=? AND entite=?').get(idPhoto, entite) as
      | { cle: string; type_mime: string }
      | undefined;
    if (m && m.type_mime in TYPES_IMAGE && m.type_mime !== 'image/webp') {
      const octets = await lire(m.cle);
      if (octets) photo = `data:${m.type_mime};base64,${octets.toString('base64')}`;
    }
  }

  return new ImageResponse(rendre(entite as EntiteSlug, gabarit as GabaritSlug, surcharge, variante, photo), {
    width: g.largeur,
    height: g.hauteur,
    fonts: chargerPolices(),
    headers: {
      // Le contenu dépend des paramètres ; on laisse le navigateur cacher court.
      'Cache-Control': 'public, max-age=60',
    },
  });
}
