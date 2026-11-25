/**
 * Le logo Veolt : le monogramme V et sa signature.
 *
 * Arrêté le 25/11/2026 avec Jonathan (kit d'identité : bannières LinkedIn,
 * photo de profil, posts). Deux branches : la gauche argentée, la droite au
 * dégradé du site (lavande → violet → magenta), une étincelle lavande en haut
 * à droite. Géométrie fixe dans une boîte de 1000 × 1000.
 *
 * Règle : **le logo figure sur chaque post Veolt** — visuels, pages de
 * carrousel, couvertures d'article et vidéos. Il ne se déforme pas, ne se
 * recolore pas. Le mot VEOLT suit le titre de veolt.fr : Kanit Black (900),
 * interlettrage serré, dégradé argenté vertical.
 *
 * MagistrIA n'est pas concerné : son logotype reste « Magistr » + « IA »
 * (`visuels.tsx`, `production.ts`). Aucun contenu ne traverse la cloison.
 */

/**
 * Version de la charte Veolt, comptée dans l'empreinte des visuels mémorisés
 * (`memoire.ts`). La changer fait refaire les visuels Veolt au prochain passage
 * (« Remettre les visuels au logo », lots de la semaine) ; MagistrIA n'est pas touché.
 */
export const VERSION_CHARTE_VEOLT = 'logo-v-png-2026-11-25';

/** Les deux branches, en points [x, y] de la boîte 1000 × 1000. */
export const V_GAUCHE: ReadonlyArray<readonly [number, number]> = [
  [170, 215], [360, 215], [496, 600], [496, 805], [428, 805],
];
export const V_DROITE: ReadonlyArray<readonly [number, number]> = [
  [640, 215], [830, 215], [572, 805], [504, 805], [504, 600],
];
/** L'étincelle : centre et rayons (branches, creux). */
const ETINCELLE = { x: 872, y: 178, r: 50, creux: 12 };

export const ARGENT = ['#EEF3F6', '#BBCCD7', '#7E8590'] as const;
export const VIOLET = ['#C79BFF', '#7621B0', '#B600A8'] as const;
/** Le mot VEOLT : dégradé argenté vertical, comme le titre de veolt.fr. */
export const DEGRADE_MOT = 'linear-gradient(180deg, #E6EDF2 0%, #BBCCD7 45%, #7E8590 100%)';

const points = (p: ReadonlyArray<readonly [number, number]>) => p.map(([x, y]) => `${x},${y}`).join(' ');

function etincelle(cx: number, cy: number, r: number, c: number): Array<[number, number]> {
  return [[0, -r], [c, -c], [r, 0], [c, c], [0, r], [-c, c], [-r, 0], [-c, -c]].map(([a, b]) => [cx + a, cy + b]);
}

/** Le monogramme en SVG autonome (aucune police, aucune ressource externe). */
export function svgV({ halo = true }: { halo?: boolean } = {}): string {
  const e = etincelle(ETINCELLE.x, ETINCELLE.y, ETINCELLE.r, ETINCELLE.creux);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000">` +
    `<defs>` +
    `<linearGradient id="a" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${ARGENT[0]}"/><stop offset=".5" stop-color="${ARGENT[1]}"/><stop offset="1" stop-color="${ARGENT[2]}"/>` +
    `</linearGradient>` +
    `<linearGradient id="v" x1="0" y1="0" x2=".35" y2="1">` +
    `<stop offset="0" stop-color="${VIOLET[0]}"/><stop offset=".45" stop-color="${VIOLET[1]}"/><stop offset="1" stop-color="${VIOLET[2]}"/>` +
    `</linearGradient>` +
    (halo ? `<filter id="h" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="22"/></filter>` : '') +
    `</defs>` +
    (halo ? `<polygon points="${points(V_DROITE)}" fill="#B600A8" opacity=".55" filter="url(#h)"/>` : '') +
    `<polygon points="${points(V_GAUCHE)}" fill="url(#a)"/>` +
    `<polygon points="${points(V_DROITE)}" fill="url(#v)"/>` +
    `<polygon points="${points(e)}" fill="${VIOLET[0]}"/>` +
    `</svg>`
  );
}

/** Le monogramme en adresse `data:` — pour `<img>` sous Satori (visuels PNG). */
export function urlV(opts?: { halo?: boolean }): string {
  const svg = svgV(opts); // ASCII seulement : btoa suffit dans le navigateur.
  const b64 = typeof Buffer !== 'undefined' ? Buffer.from(svg).toString('base64') : btoa(svg);
  return `data:image/svg+xml;base64,${b64}`;
}

/**
 * Le monogramme dessiné dans un canvas (vidéos, navigateur). `x`, `y` : coin
 * haut gauche de la boîte ; `taille` : côté de la boîte en pixels.
 */
export function dessinerV(
  cx: CanvasRenderingContext2D,
  x: number,
  y: number,
  taille: number,
  { alpha = 1, halo = true }: { alpha?: number; halo?: boolean } = {},
) {
  const k = taille / 1000;
  const poly = (p: ReadonlyArray<readonly [number, number]>) => {
    cx.beginPath();
    p.forEach(([a, b], i) => (i ? cx.lineTo(x + a * k, y + b * k) : cx.moveTo(x + a * k, y + b * k)));
    cx.closePath();
  };
  cx.save();
  cx.globalAlpha *= alpha;
  let g = cx.createLinearGradient(0, y + 215 * k, 0, y + 805 * k);
  g.addColorStop(0, ARGENT[0]);
  g.addColorStop(0.5, ARGENT[1]);
  g.addColorStop(1, ARGENT[2]);
  poly(V_GAUCHE);
  cx.fillStyle = g;
  cx.fill();
  g = cx.createLinearGradient(x + 640 * k, y + 215 * k, x + 845 * k, y + 805 * k);
  g.addColorStop(0, VIOLET[0]);
  g.addColorStop(0.45, VIOLET[1]);
  g.addColorStop(1, VIOLET[2]);
  if (halo) {
    cx.shadowColor = 'rgba(182,0,168,0.65)';
    cx.shadowBlur = 44 * k;
  }
  poly(V_DROITE);
  cx.fillStyle = g;
  cx.fill();
  cx.shadowBlur = 0;
  poly(etincelle(ETINCELLE.x, ETINCELLE.y, ETINCELLE.r, ETINCELLE.creux));
  cx.fillStyle = VIOLET[0];
  cx.fill();
  cx.restore();
}
