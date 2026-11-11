import { ImageResponse } from 'next/og';
import { chargerPolices } from '@/lib/polices';
import { GABARITS, rendre, type Contenu, type GabaritSlug } from '@/lib/visuels';
import { photoEnDonnees } from '@/lib/medias';
import type { EntiteSlug } from '@/lib/marques';

/**
 * Les octets PNG d'un visuel, rendus côté serveur exactement comme la route
 * `/[entite]/visuels/[gabarit]` les sert — pour assembler un document (PDF du
 * carrousel) sans repasser par HTTP.
 */
export async function pngVisuel(
  entite: EntiteSlug,
  v: { slug: GabaritSlug; contenu: Partial<Contenu> },
): Promise<{ octets: Uint8Array; largeur: number; hauteur: number }> {
  const g = GABARITS[v.slug];
  const { photo: idPhoto, ...contenu } = v.contenu;
  // Même règle que la route : la photo ne vient que de la médiathèque de l'entité.
  const photo = await photoEnDonnees(entite, idPhoto ?? null);
  const reponse = new ImageResponse(rendre(entite, v.slug, contenu, 'clair', photo), {
    width: g.largeur,
    height: g.hauteur,
    fonts: chargerPolices(),
  });
  return { octets: new Uint8Array(await reponse.arrayBuffer()), largeur: g.largeur, hauteur: g.hauteur };
}
