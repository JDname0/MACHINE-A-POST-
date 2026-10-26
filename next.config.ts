import type { NextConfig } from 'next';

const config: NextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  // Les polices des visuels sont lues au runtime par `readFileSync`. Aucun
  // `import` ne les mentionne, donc le traçage de Next ne les embarquerait pas
  // dans le paquet serverless sans cette déclaration — et la génération
  // d'images échouerait en production uniquement.
  outputFileTracingIncludes: {
    '/[entite]/visuels/[gabarit]': ['./src/assets/polices/**'],
  },
};

export default config;
