/**
 * Les packs vidéo de Veolt, **mot pour mot** comme sur veolt.fr/price.html
 * (relevé le 25/11/2026). Ils servent à recomposer la carte d'un pack, en
 * entier et lisible, dans les pages de carrousel (`CartePack`, visuels.tsx) :
 * une capture d'écran zoomée coupe la carte, une capture entière est illisible.
 * À tenir à jour avec le site : un prix ici qui diffère du site est une erreur.
 */

export interface PackVeolt {
  nom: string;
  format: string;
  prix: string;
  /** « € HT » sous le prix, ou « À partir de » au-dessus pour Ultra. */
  aPartirDe?: boolean;
  parVideo?: string;
  pitch: string;
  points: string[];
  recommande?: boolean;
}

export const PACKS_VEOLT: Record<string, PackVeolt> = {
  starter: {
    nom: 'Starter',
    format: '5 × 15 secondes',
    prix: '499',
    parVideo: '99,80 € par vidéo',
    pitch: 'Pour tester Veolt avec une première campagne.',
    points: ['Script & concept', 'Génération IA + montage', 'Musique & sound design', 'Sous-titres, format vertical', '1 correction par vidéo'],
  },
  creator: {
    nom: 'Creator',
    format: '10 × 15 secondes',
    prix: '899',
    parVideo: '89,90 € par vidéo',
    pitch: 'Pour créateurs, e-commerce, startups et PME.',
    points: ['Scripts & concepts variés', 'Montage professionnel + narration', 'Sound design + sous-titres dynamiques', 'Hooks différents, 2 variations créatives', '1 correction par vidéo'],
  },
  pro: {
    nom: 'Pro',
    format: '5 × 30 secondes',
    prix: '999',
    parVideo: '199,80 € par vidéo',
    pitch: 'On monte clairement en gamme.',
    points: ['Script, storytelling & direction artistique', 'Génération IA avancée + voix off', 'Sound design + sous-titres', '2 variantes A/B', 'LinkedIn / TikTok / Instagram / Web'],
  },
  business: {
    nom: 'Business',
    format: '10 × 30 secondes',
    prix: '1 799',
    parVideo: '179,90 € par vidéo',
    pitch: 'Le pack pensé pour les entreprises.',
    points: ['Direction artistique + storytelling', 'Montage professionnel + narration', 'Sound design + sous-titres', 'Hooks multiples + A/B testing', 'LinkedIn / TikTok / Instagram / Web'],
    recommande: true,
  },
  premium: {
    nom: 'Premium',
    format: '5 × 60 secondes',
    prix: '2 499',
    parVideo: '499,80 € par vidéo',
    pitch: 'AI Studio Production.',
    points: ['Concept, script & storyboard', 'Direction artistique', 'Génération IA avancée', 'Montage premium + narration cinéma', 'VFX + motion design, 3 déclinaisons'],
  },
  unite: {
    nom: 'À l’unité',
    format: 'Tarif à l’unité',
    prix: '119',
    aPartirDe: true,
    pitch: 'Les packs Starter, Creator et Business restent plus avantageux.',
    points: ['15 secondes — 119 € HT', '30 secondes — 199 € HT', '60 secondes — 399 € HT', '60-90 s premium — 499 € HT'],
  },
  ultra: {
    nom: 'Ultra',
    format: 'Production sur mesure',
    prix: '3 500',
    aPartirDe: true,
    pitch: 'Pour grandes entreprises, agences, lancements produit et campagnes internationales.',
    points: ['Direction artistique', 'Concept & scénario', 'Production IA + montage', 'VFX & motion', 'Chef de projet dédié'],
  },
};

/** Le pack dont parle une page de carrousel, d'après le début de son texte. */
export function packDePage(texte: string): string | undefined {
  const t = texte.trim().toLowerCase();
  if (t.startsWith('starter')) return 'starter';
  if (t.startsWith('creator')) return 'creator';
  if (t.startsWith('pro,')) return 'pro';
  if (t.startsWith('business')) return 'business';
  if (t.startsWith('premium')) return 'premium';
  if (t.startsWith('à l\'unité') || t.startsWith('à l’unité')) return 'unite';
  if (t.startsWith('sur mesure')) return 'ultra';
  return undefined;
}
