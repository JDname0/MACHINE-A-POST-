import { lirePolice } from '@/lib/polices';

/**
 * Sert les polices de la charte au studio vidéo, qui incruste le texte dans le
 * navigateur. Liste blanche de fichiers (voir `lirePolice`) ; ce sont des
 * polices sous licence libre (OFL), rien de privé — pas de contrôle de session.
 */
export async function GET(_: Request, { params }: { params: Promise<{ fichier: string }> }) {
  const { fichier } = await params;
  const octets = lirePolice(fichier);
  if (!octets) return new Response('Introuvable', { status: 404 });
  return new Response(new Uint8Array(octets), {
    headers: { 'Content-Type': 'font/ttf', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
}
