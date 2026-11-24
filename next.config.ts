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
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // CSP active minimale : ne restreint ni scripts, ni styles, ni images, ni
  // connexions. La CSP complète reste en observation juste en dessous.
  {
    key: 'Content-Security-Policy',
    value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'; upgrade-insecure-requests",
  },
  {
    key: 'Content-Security-Policy-Report-Only',
    value: [
      "default-src 'self'",
      "img-src 'self' data: blob: https:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      // L'aperçu du studio vidéo lit la vidéo fabriquée depuis une adresse blob:.
      "media-src 'self' blob:",
      "connect-src 'self' https:",
      "frame-ancestors 'self'",
    ].join('; '),
  },
];

/**
 * Build pour un serveur Node classique (o2switch, Passenger) : `MAP_BUILD_STANDALONE=1`.
 * Sur Vercel la variable est absente et rien ne change. Hors de Vercel, c'est
 * à l'application de poser le HSTS que Vercel ajoutait lui-même sur ses
 * domaines (même valeur que celle relevée en production le 2026-11-20).
 */
const STANDALONE = process.env.MAP_BUILD_STANDALONE === '1';
const ENTETES_SERVEUR = STANDALONE
  ? [...ENTETES, { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
  : ENTETES;

const config: NextConfig = {
  ...(STANDALONE ? { output: 'standalone' as const } : {}),
  serverExternalPackages: ['better-sqlite3'],
  experimental: {
    // Le dépôt d'images passe par une action serveur, dont le corps est limité
    // à 1 Mo par défaut — toute photo le dépasserait. 6 Mo laisse passer un
    // envoi de 4 Mo (le plafond que `src/lib/medias.ts` fait respecter) plus
    // l'enveloppe multipart. Au-delà, c'est la fonction Vercel elle-même qui
    // refuserait la requête, et sans message exploitable.
    // 40 Mo pour le dépôt de vidéos en local ; sur Vercel la plateforme coupe
    // de toute façon à ~4,5 Mo, et la production dépose en direct vers le store.
    serverActions: { bodySizeLimit: '40mb' },
  },
  async headers() {
    return [{ source: '/:path*', headers: ENTETES_SERVEUR }];
  },
  // Les polices des visuels sont lues au runtime par `readFileSync`. Aucun
  // `import` ne les mentionne, donc le traçage de Next ne les embarquerait pas
  // dans le paquet serverless sans cette déclaration — et la génération
  // d'images échouerait en production uniquement.
  // Les polices sont lues sur le disque (src/lib/polices.ts) : aucun import ne
  // les mentionne, il faut donc les déclarer. Toutes les routes, parce que les
  // actions serveur qui mémorisent un visuel tournent dans la fonction de la
  // page qui les appelle.
  outputFileTracingIncludes: {
    '/**': ['./src/assets/polices/**'],
  },
};

export default config;
