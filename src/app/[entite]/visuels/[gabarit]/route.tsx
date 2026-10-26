import { ImageResponse } from 'next/og';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { estEntite, type EntiteSlug } from '@/lib/marques';
import { connecte } from '@/lib/auth';
import { GABARITS, rendre, type GabaritSlug, type Contenu, type Variante } from '@/lib/visuels';

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

const DOSSIER = path.join(process.cwd(), 'src', 'assets', 'polices');
const lire = (f: string) => readFileSync(path.join(DOSSIER, f));

let polices: Array<{ name: string; data: Buffer; weight: 400 | 600 | 700; style: 'normal' }> | null = null;
function chargerPolices() {
  if (polices) return polices;
  polices = [
    { name: 'Bebas', data: lire('BebasNeue.ttf'), weight: 400, style: 'normal' },
    { name: 'Kanit', data: lire('Kanit-Bold.ttf'), weight: 700, style: 'normal' },
    { name: 'Spectral', data: lire('Spectral-Bold.ttf'), weight: 700, style: 'normal' },
    { name: 'Spectral', data: lire('Spectral-SemiBold.ttf'), weight: 600, style: 'normal' },
    { name: 'Inter', data: lire('Inter-Regular.ttf'), weight: 400, style: 'normal' },
    { name: 'Inter', data: lire('Inter-SemiBold.ttf'), weight: 600, style: 'normal' },
  ];
  return polices;
}

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

  return new ImageResponse(rendre(entite as EntiteSlug, gabarit as GabaritSlug, surcharge, variante), {
    width: g.largeur,
    height: g.hauteur,
    fonts: chargerPolices(),
    headers: {
      // Le contenu dépend des paramètres ; on laisse le navigateur cacher court.
      'Cache-Control': 'public, max-age=60',
    },
  });
}
