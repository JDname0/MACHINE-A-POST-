/**
 * Effet verre (« glassmorphism » / verre liquide) et finitions d'image.
 *
 * Une carte en verre, c'est : ce qu'il y a derrière, flouté et un peu saturé
 * (et légèrement grossi, comme à travers une lentille) ; une teinte de la
 * marque ; un liseré qui prend la lumière en haut à gauche et en bas à droite ;
 * un reflet qui glisse lentement ; un grain fin de verre dépoli ; une ombre
 * douce dessous. Tout se dessine sur canvas 2D, image par image.
 *
 * Le flou passe par `ctx.filter` quand le navigateur le sait (Chrome, Edge,
 * Firefox, Safari récent), sinon par une double réduction d'image — moins fin,
 * mais jamais de carte cassée.
 *
 * Finitions : grain de film (casse aussi les aplats que l'encodeur H.264
 * transforme en escaliers), vignettage, halos des sites, grille fine de
 * magistrai.fr.
 *
 * Module navigateur uniquement.
 */

type C2D = CanvasRenderingContext2D;

export interface OptionsVerre {
  /** Teinte posée sur le flou (rgba). */
  teinte?: string;
  /** Rayon du flou, en pixels de la vidéo. */
  flou?: number;
  /** Temps, pour le reflet qui glisse. */
  t?: number;
  ombre?: boolean;
  /** Liseré : couleur de la lumière (blanc par défaut) et intensité. */
  liseré?: string;
  intensite?: number;
  /** Grossissement du fond, comme à travers une lentille (1 = aucun). */
  lentille?: number;
  /** Second liseré coloré (dégradé de marque), pour une carte mise en avant. */
  bordure?: string[];
}

/** Interrupteurs du banc d'essai (développement seulement). */
function essai(nom: string): boolean {
  return process.env.NODE_ENV !== 'production' && typeof window !== 'undefined' && Boolean((window as unknown as Record<string, unknown>)[`__${nom}`]);
}

let filtreOk: boolean | null = null;
/** Le navigateur applique-t-il vraiment `ctx.filter` ? (lire la propriété ne suffit pas.) */
export function filtreDisponible(): boolean {
  if (essai('sansFiltre')) return false;
  if (filtreOk !== null) return filtreOk;
  try {
    const c = document.createElement('canvas');
    c.width = 9;
    c.height = 9;
    const x = c.getContext('2d')!;
    x.filter = 'blur(2px)';
    x.fillStyle = '#fff';
    x.fillRect(4, 4, 1, 1);
    filtreOk = x.getImageData(2, 4, 1, 1).data[3] > 0;
  } catch {
    filtreOk = false;
  }
  return filtreOk;
}

const toiles = new Map<string, { c: HTMLCanvasElement; x: C2D }>();
function toile(nom: string, l: number, h: number) {
  let t = toiles.get(nom);
  if (!t) {
    const c = document.createElement('canvas');
    t = { c, x: c.getContext('2d', { willReadFrequently: false })! };
    toiles.set(nom, t);
  }
  if (t.c.width !== l || t.c.height !== h) {
    t.c.width = l;
    t.c.height = h;
  }
  return t;
}

let motifGrain: CanvasPattern | null = null;
let toileGrain: HTMLCanvasElement | null = null;
function grain(cx: C2D): CanvasPattern | null {
  if (!toileGrain) {
    toileGrain = document.createElement('canvas');
    toileGrain.width = 160;
    toileGrain.height = 160;
    const g = toileGrain.getContext('2d')!;
    const img = g.createImageData(160, 160);
    let s = 9;
    for (let i = 0; i < img.data.length; i += 4) {
      s = (s * 16807) % 2147483647;
      const v = (s / 2147483647) * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }
  if (!motifGrain) motifGrain = cx.createPattern(toileGrain, 'repeat');
  return motifGrain;
}

/**
 * Une carte en verre. `x, y, w, h` sont dans le repère courant du contexte
 * (translations et échelles comprises) : le fond est pris là où la carte se
 * trouve réellement à l'écran.
 */
export function verre(cx: C2D, x: number, y: number, w: number, h: number, r: number, o: OptionsVerre = {}) {
  if (essai('sansVerre')) return;
  const k = o.intensite ?? 1;
  const flou = o.flou ?? 26;
  const m = cx.getTransform();
  // Boîte de la carte à l'écran.
  const coins = [
    [x, y],
    [x + w, y],
    [x, y + h],
    [x + w, y + h],
  ].map(([px, py]) => [m.a * px + m.c * py + m.e, m.b * px + m.d * py + m.f]);
  const bx = Math.min(...coins.map((c) => c[0]));
  const by = Math.min(...coins.map((c) => c[1]));
  const bw = Math.max(...coins.map((c) => c[0])) - bx;
  const bh = Math.max(...coins.map((c) => c[1])) - by;
  if (bw < 4 || bh < 4) return;
  const alpha = cx.globalAlpha;

  // Ombre portée, très douce.
  if (o.ombre !== false) {
    cx.save();
    cx.shadowColor = `rgba(0,0,0,${0.42 * alpha})`;
    cx.shadowBlur = 60;
    cx.shadowOffsetY = 26;
    cx.beginPath();
    cx.roundRect(x, y, w, h, r);
    cx.fillStyle = 'rgba(0,0,0,0.25)';
    cx.fill();
    cx.restore();
  }

  // Le fond flouté, pris sur la toile elle-même (avec une marge pour le flou).
  const marge = flou * 2;
  const ech = 0.25;
  const sx = Math.max(0, Math.floor(bx - marge));
  const sy = Math.max(0, Math.floor(by - marge));
  const sw = Math.min(cx.canvas.width - sx, Math.ceil(bw + marge * 2));
  const sh = Math.min(cx.canvas.height - sy, Math.ceil(bh + marge * 2));
  if (sw > 0 && sh > 0) {
    const pl = Math.max(1, Math.round(sw * ech));
    const ph = Math.max(1, Math.round(sh * ech));
    const p = toile('verre', pl, ph);
    p.x.clearRect(0, 0, pl, ph);
    if (filtreDisponible()) {
      p.x.filter = `blur(${Math.max(1, flou * ech)}px) saturate(165%) brightness(1.08)`;
      p.x.drawImage(cx.canvas, sx, sy, sw, sh, 0, 0, pl, ph);
      p.x.filter = 'none';
    } else {
      const q = toile('verre-q', Math.max(1, Math.round(pl / 3)), Math.max(1, Math.round(ph / 3)));
      q.x.drawImage(cx.canvas, sx, sy, sw, sh, 0, 0, q.c.width, q.c.height);
      p.x.imageSmoothingQuality = 'high';
      p.x.drawImage(q.c, 0, 0, pl, ph);
    }
    cx.save();
    cx.beginPath();
    cx.roundRect(x, y, w, h, r);
    cx.clip();
    cx.setTransform(1, 0, 0, 1, 0, 0);
    cx.imageSmoothingQuality = 'high';
    const z = o.lentille ?? 1.05;
    const ccx = sx + sw / 2;
    const ccy = sy + sh / 2;
    cx.drawImage(p.c, ccx - (sw * z) / 2, ccy - (sh * z) / 2, sw * z, sh * z);
    cx.restore();
  }

  cx.save();
  cx.beginPath();
  cx.roundRect(x, y, w, h, r);
  cx.clip();
  // Teinte de la marque, puis la lumière qui tombe d'en haut à gauche.
  cx.fillStyle = o.teinte ?? 'rgba(255,255,255,0.06)';
  cx.fillRect(x, y, w, h);
  const lum = cx.createLinearGradient(x, y, x + w * 0.6, y + h);
  lum.addColorStop(0, `rgba(255,255,255,${0.14 * k})`);
  lum.addColorStop(0.45, 'rgba(255,255,255,0.02)');
  lum.addColorStop(1, 'rgba(255,255,255,0)');
  cx.fillStyle = lum;
  cx.fillRect(x, y, w, h);
  // Reflet : une bande claire, en biais, qui traverse la carte en ~7 s.
  if (o.t !== undefined) {
    const cyc = ((o.t * 0.14 + (x + y) * 0.0003) % 1.6) - 0.3;
    const bxr = x + (w + h) * cyc - h;
    const g = cx.createLinearGradient(bxr, y, bxr + h * 0.9, y + h);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, `rgba(255,255,255,${0.07 * k})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    cx.fillStyle = g;
    cx.fillRect(x, y, w, h);
  }
  // Grain de verre dépoli.
  const gp = grain(cx);
  if (gp) {
    cx.globalAlpha = alpha * 0.045;
    cx.globalCompositeOperation = 'overlay';
    cx.fillStyle = gp;
    cx.fillRect(x, y, w, h);
    cx.globalCompositeOperation = 'source-over';
    cx.globalAlpha = alpha;
  }
  cx.restore();

  // Liseré spéculaire : vif en haut à gauche, à peine visible au milieu, repris en bas à droite.
  cx.save();
  cx.beginPath();
  cx.roundRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5, r);
  const lis = cx.createLinearGradient(x, y, x + w, y + h);
  const c = o.liseré ?? '255,255,255';
  lis.addColorStop(0, `rgba(${c},${0.55 * k})`);
  lis.addColorStop(0.32, `rgba(${c},${0.1 * k})`);
  lis.addColorStop(0.7, `rgba(${c},${0.06 * k})`);
  lis.addColorStop(1, `rgba(${c},${0.3 * k})`);
  cx.strokeStyle = lis;
  cx.lineWidth = 1.6;
  cx.stroke();
  if (o.bordure?.length) {
    const g = cx.createLinearGradient(x, y, x + w, y);
    o.bordure.forEach((col, i) => g.addColorStop(o.bordure!.length === 1 ? 0 : i / (o.bordure!.length - 1), col));
    cx.beginPath();
    cx.roundRect(x, y, w, h, r);
    cx.strokeStyle = g;
    cx.lineWidth = 2.4;
    cx.globalAlpha = alpha * 0.9;
    cx.stroke();
  }
  // Filet de lumière intérieur, tout en haut.
  cx.beginPath();
  cx.moveTo(x + r, y + 2.2);
  cx.lineTo(x + w - r, y + 2.2);
  const haut = cx.createLinearGradient(x, 0, x + w, 0);
  haut.addColorStop(0, 'rgba(255,255,255,0)');
  haut.addColorStop(0.3, `rgba(255,255,255,${0.35 * k})`);
  haut.addColorStop(0.7, `rgba(255,255,255,${0.12 * k})`);
  haut.addColorStop(1, 'rgba(255,255,255,0)');
  cx.strokeStyle = haut;
  cx.lineWidth = 1.2;
  cx.globalAlpha = alpha;
  cx.stroke();
  cx.restore();
}

/** Une pastille en verre avec son texte (puce flottante, repère, étiquette). */
export function pastilleVerre(
  cx: C2D,
  x: number,
  y: number,
  texte: string,
  police: string,
  taille: number,
  o: OptionsVerre & { encre?: string; pastille?: string; icone?: string } = {},
): { w: number; h: number } {
  cx.font = police;
  const icone = o.icone ? `${o.icone}  ` : '';
  const tw = cx.measureText(icone + texte).width;
  const h = taille * 2.15;
  const w = tw + taille * 2.1 + (o.pastille ? taille * 0.9 : 0);
  verre(cx, x, y, w, h, h / 2, { flou: 18, ...o });
  let tx = x + taille * 1.05;
  if (o.pastille) {
    cx.beginPath();
    cx.arc(tx + taille * 0.2, y + h / 2, taille * 0.26, 0, Math.PI * 2);
    cx.fillStyle = o.pastille;
    cx.fill();
    tx += taille * 0.9;
  }
  cx.fillStyle = o.encre ?? '#FFFFFF';
  cx.fillText(icone + texte, tx, y + h / 2 + taille * 0.36);
  return { w, h };
}

/** Grain de film sur toute l'image, qui change à chaque image. */
export function grainFilm(cx: C2D, l: number, h: number, t: number, force = 0.05) {
  const gp = grain(cx);
  if (!gp) return;
  const k = Math.floor(t * 30);
  cx.save();
  cx.setTransform(1, 0, 0, 1, (k * 53) % 160, (k * 97) % 160);
  cx.globalAlpha = force;
  cx.globalCompositeOperation = 'overlay';
  cx.fillStyle = gp;
  cx.fillRect(-160, -160, l + 320, h + 320);
  cx.restore();
}

/** Vignettage : les coins s'assombrissent, l'œil va au centre. */
export function vignette(cx: C2D, l: number, h: number, force = 0.5) {
  const g = cx.createRadialGradient(l / 2, h * 0.48, Math.min(l, h) * 0.35, l / 2, h * 0.48, Math.max(l, h) * 0.78);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(0,0,0,${force})`);
  cx.fillStyle = g;
  cx.fillRect(0, 0, l, h);
}

/**
 * Les halos des sites en ligne, qui dérivent lentement.
 * - magistrai.fr : brume bleu nuit en haut, braise orangée dans le coin bas droit ;
 * - veolt.fr : cœur aubergine (#241a2e → #0d0d10) et lueurs magenta / violet / orange.
 */
export function halosSite(cx: C2D, l: number, h: number, t: number, marque: 'veolt' | 'magistria') {
  const tache = (x: number, y: number, r: number, couleur: string) => {
    const g = cx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, couleur);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    cx.fillStyle = g;
    cx.fillRect(0, 0, l, h);
  };
  const d = (f: number, p: number) => Math.sin(t * f + p);
  cx.save();
  cx.globalCompositeOperation = 'lighter';
  if (marque === 'magistria') {
    tache(l * (0.5 + 0.08 * d(0.21, 0)), h * (0.28 + 0.04 * d(0.17, 1)), Math.max(l, h) * 0.55, 'rgba(14,70,140,0.30)');
    tache(l * (0.66 + 0.06 * d(0.13, 2)), h * 0.55, Math.max(l, h) * 0.38, 'rgba(30,110,220,0.12)');
    tache(l * (0.88 + 0.05 * d(0.19, 3)), h * 1.0, Math.max(l, h) * 0.36, 'rgba(255,110,20,0.09)');
    tache(l * (0.12 + 0.05 * d(0.11, 4)), h * (0.78 + 0.05 * d(0.15, 5)), Math.max(l, h) * 0.3, 'rgba(60,200,255,0.06)');
  } else {
    tache(l * 0.5, h * 0.5, Math.max(l, h) * 0.62, 'rgba(36,26,46,0.55)');
    tache(l * (0.2 + 0.1 * d(0.23, 0)), h * (0.3 + 0.06 * d(0.19, 1)), Math.max(l, h) * 0.42, 'rgba(182,0,168,0.13)');
    tache(l * (0.82 + 0.06 * d(0.17, 2)), h * (0.62 + 0.08 * d(0.13, 3)), Math.max(l, h) * 0.4, 'rgba(118,33,176,0.14)');
    tache(l * (0.6 + 0.1 * d(0.11, 4)), h * (0.98 + 0.02 * d(0.2, 5)), Math.max(l, h) * 0.34, 'rgba(190,76,0,0.10)');
  }
  cx.restore();
}

/** La grille fine bleutée de magistrai.fr (1 px tous les 56 px, à 3 % — un peu plus en vidéo). */
export function grilleSite(cx: C2D, l: number, h: number, t: number, pas = 56) {
  // La grille est dessinée une fois, masquée en fondu radial (comme le masque
  // du site), puis glissée doucement vers le haut.
  const g = toile(`grille-${l}x${h}`, l, h + pas);
  if (!(g.c as HTMLCanvasElement & { pret?: boolean }).pret) {
    g.x.clearRect(0, 0, l, h + pas);
    g.x.fillStyle = 'rgba(110,180,255,0.06)';
    for (let x = (l / 2) % pas; x < l; x += pas) g.x.fillRect(Math.round(x), 0, 1, h + pas);
    for (let y = 0; y < h + pas; y += pas) g.x.fillRect(0, Math.round(y), l, 1);
    g.x.globalCompositeOperation = 'destination-in';
    const m = g.x.createRadialGradient(l / 2, h * 0.45, Math.min(l, h) * 0.15, l / 2, h * 0.45, Math.max(l, h) * 0.7);
    m.addColorStop(0, 'rgba(0,0,0,1)');
    m.addColorStop(1, 'rgba(0,0,0,0)');
    g.x.fillStyle = m;
    g.x.fillRect(0, 0, l, h + pas);
    g.x.globalCompositeOperation = 'source-over';
    (g.c as HTMLCanvasElement & { pret?: boolean }).pret = true;
  }
  cx.drawImage(g.c, 0, -((t * 6) % pas));
}
