import type { NextConfig } from 'next';

/**
 * En-têtes de sécurité, sur toutes les pages.
 *
 * La CSP est en observation (Report-Only) : le navigateur signale ce qu'elle
 * bloquerait, sans rien bloquer. Une fois vérifiée sur le site (console sans
 * avertissement), la passer en Content-Security-Policy.
 */
const ENTETES = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Content-Security-Policy-Report-Only',
    value: [
      "default-src 'self'",
      "img-src 'self' data: blob: https:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "frame-ancestors 'self'",
    ].join('; '),
  },
];

const config: NextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  experimental: {
    // Le dépôt d'images passe par une action serveur, dont le corps est limité
    // à 1 Mo par défaut — toute photo le dépasserait. 6 Mo laisse passer un
    // envoi de 4 Mo (le plafond que `src/lib/medias.ts` fait respecter) plus
    // l'enveloppe multipart. Au-delà, c'est la fonction Vercel elle-même qui
    // refuserait la requête, et sans message exploitable.
    serverActions: { bodySizeLimit: '6mb' },
  },
  async headers() {
    return [{ source: '/:path*', headers: ENTETES }];
  },
  // Les polices des visuels sont lues au runtime par `readFileSync`. Aucun
  // `import` ne les mentionne, donc le traçage de Next ne les embarquerait pas
  // dans le paquet serverless sans cette déclaration — et la génération
  // d'images échouerait en production uniquement.
  outputFileTracingIncludes: {
    '/[entite]/visuels/[gabarit]': ['./src/assets/polices/**'],
  },
};

export default config;
