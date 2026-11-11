/**
 * Rendu des scènes « motion design » : décors animés, écran produit vivant,
 * apparition de la marque, documents, récapitulatif, écran de fin.
 *
 * Inspiré des vidéos de lancement MagistrIA fournies par Jonathan (11/11) —
 * chapitres numérotés, interface qui se remplit sous les yeux, documents qui
 * se posent, phrase d'accent en italique, annotations manuscrites, fin
 * complète — et ramené aux couleurs de chaque marque (themeStudio).
 *
 * Module navigateur : toutes les fonctions dessinent sur un canvas 2D, en
 * fonction du temps seulement (même temps → même image), pour que la vidéo
 * ressorte identique à chaque fabrication.
 */

import type { ElementApp, FondPlan, Scene } from './montage';
import type { TypeRepere } from './son';
import { verre, pastilleVerre, halosSite, grilleSite } from './verre';

export interface Fonte {
  famille: string;
  poids: string;
}

export interface CarteApp {
  fond: string;
  encre: string;
  douce: string;
  accent: string;
  filet: string;
  puce: string;
  alerte: string;
  alerteEncre: string;
  neutre: string;
  ok: string;
  /** Texte posé sur une pastille d'accent (numéros de renvoi, bouton). */
  surAccent: string;
  /** Champs et pastilles d'état, sur la fenêtre. */
  champ: string;
  /** Fenêtre en verre (flou d'arrière-plan) plutôt qu'opaque. */
  verre?: boolean;
  /** Teinte du verre de la fenêtre. */
  teinte?: string;
  /** Le bouton d'action dans l'écran (MagistrIA : bordeaux, seul usage de cette couleur). */
  bouton?: string[];
  /** L'encre des libellés posés sur le papier (documents). */
  papier?: string;
}

export interface Env {
  L: number;
  H: number;
  vertical: boolean;
  marge: number;
  largeurTexte: number;
  encre: string;
  douce: string;
  accent: string;
  accent2: string;
  fond: string;
  degrade?: string[];
  arc: string[];
  rayons: string[];
  majuscules: boolean;
  motMarque: [string, string, string];
  slogan: string;
  app: CarteApp;
  bouton: { fond: string[]; encre: string };
  adresse: string;
  f: { titre: Fonte; corps: Fonte; corpsL: Fonte; mono: Fonte; italique: Fonte; manuscrite: Fonte; etiquette: Fonte };
  lignes: (cx: CanvasRenderingContext2D, texte: string, max: number) => string[];
  marque: 'veolt' | 'magistria';
  /** Temps absolu de l'image en cours (reflets du verre). */
  t: number;
  /** Déclare un instant sonore, en secondes depuis le début du plan (voir son.ts). */
  repere: (type: TypeRepere, tl: number, fin?: number) => void;
  /** Teinte des cartes en verre hors écran produit. */
  teinteVerre: string;
  /** Le plan en cours a un clip en fond (Higgsfield, Blender…). */
  clip?: boolean;
}

type Ctx = CanvasRenderingContext2D & { letterSpacing: string };
type C2D = CanvasRenderingContext2D;

export const fonte = (f: Fonte, taille: number) => `${f.poids} ${Math.round(taille)}px "${f.famille}", sans-serif`;
const borne = (x: number) => Math.min(1, Math.max(0, x));
const sortie = (x: number) => 1 - Math.pow(1 - borne(x), 3);
const apparition = (tl: number, debut: number, duree = 0.45) => sortie((tl - debut) / duree);
const hasard = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

function boite(cx: C2D, x: number, y: number, w: number, h: number, r: number, fond?: string | CanvasGradient, trait?: string | CanvasGradient, ep = 2) {
  cx.beginPath();
  cx.roundRect(x, y, w, h, r);
  if (fond) {
    cx.fillStyle = fond;
    cx.fill();
  }
  if (trait) {
    cx.strokeStyle = trait;
    cx.lineWidth = ep;
    cx.stroke();
  }
}

function degrade(cx: C2D, x: number, w: number, couleurs: string[]): CanvasGradient {
  const g = cx.createLinearGradient(x, 0, x + Math.max(10, w), 0);
  couleurs.forEach((c, k) => g.addColorStop(couleurs.length === 1 ? 0 : k / (couleurs.length - 1), c));
  if (couleurs.length === 1) g.addColorStop(1, couleurs[0]);
  return g;
}

function espacer(cx: C2D, px: number) {
  (cx as Ctx).letterSpacing = `${px}px`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Décors
// ─────────────────────────────────────────────────────────────────────────────

/**
 * - `etoiles` : ciel profond, étoiles qui scintillent et dérivent lentement ;
 * - `horizon` : l'arc lumineux d'une planète (« Veolt vous met sur orbite ») ;
 * - `rayons` : faisceau rayonnant depuis le bas, qui tourne à peine.
 */
export function dessinerFond(cx: C2D, e: Env, type: Exclude<FondPlan, 'carte'>, t: number) {
  const { L, H } = e;
  cx.fillStyle = e.fond;
  cx.fillRect(0, 0, L, H);
  // Un voile central très léger : la profondeur, sans dessin.
  const rv = cx.createRadialGradient(L * 0.5, H * 0.45, 0, L * 0.5, H * 0.45, Math.max(L, H) * 0.7);
  rv.addColorStop(0, 'rgba(255,255,255,0.045)');
  rv.addColorStop(1, 'rgba(0,0,0,0)');
  cx.fillStyle = rv;
  cx.fillRect(0, 0, L, H);
  // Les halos des sites en ligne, et la grille fine bleutée de magistrai.fr.
  halosSite(cx, L, H, t, e.marque);
  if (e.marque === 'magistria') grilleSite(cx, L, H, t, Math.round(L / 19));

  if (type === 'etoiles' || type === 'horizon') {
    const n = type === 'etoiles' ? 170 : 90;
    for (let k = 0; k < n; k++) {
      const x = hasard(k * 3.1) * L;
      const y0 = hasard(k * 7.7) * H;
      const y = (((y0 - t * (4 + hasard(k) * 6)) % H) + H) % H;
      const r = 0.6 + hasard(k * 1.9) * 1.6;
      const a = 0.18 + 0.55 * Math.abs(Math.sin(t * (0.6 + hasard(k * 5.3) * 1.4) + k));
      cx.globalAlpha = a;
      cx.fillStyle = hasard(k * 2.2) > 0.82 ? e.accent2 : '#FFFFFF';
      cx.beginPath();
      cx.arc(x, y, r, 0, Math.PI * 2);
      cx.fill();
    }
    cx.globalAlpha = 1;
  }

  if (type === 'horizon') {
    // Une planète dont on ne voit que le haut : un disque sombre, son liseré
    // lumineux, et l'atmosphère qui en monte.
    const R = L * 1.35;
    const sommet = H * (e.vertical ? 0.33 : 0.36);
    const cxp = L * 0.5;
    const cyp = sommet + R;
    const souffle = 1 + 0.04 * Math.sin(t * 0.8);
    for (let k = 6; k >= 1; k--) {
      cx.beginPath();
      cx.arc(cxp, cyp, R, Math.PI * 1.08, Math.PI * 1.92);
      cx.strokeStyle = degrade(cx, 0, L, e.arc);
      cx.globalAlpha = (0.07 / k) * 6 * souffle * 0.55;
      cx.lineWidth = k * 16;
      cx.stroke();
    }
    cx.globalAlpha = 1;
    cx.beginPath();
    cx.arc(cxp, cyp, R, 0, Math.PI * 2);
    const disque = cx.createLinearGradient(0, sommet, 0, H);
    disque.addColorStop(0, 'rgba(0,0,0,0.55)');
    disque.addColorStop(1, 'rgba(0,0,0,0.9)');
    cx.fillStyle = disque;
    cx.fill();
    cx.beginPath();
    cx.arc(cxp, cyp, R, Math.PI * 1.06, Math.PI * 1.94);
    cx.strokeStyle = degrade(cx, 0, L, e.arc);
    cx.lineWidth = 3;
    cx.stroke();
    const atmo = cx.createLinearGradient(0, sommet - H * 0.22, 0, sommet);
    atmo.addColorStop(0, 'rgba(0,0,0,0)');
    atmo.addColorStop(1, `${e.arc[Math.floor(e.arc.length / 2)]}22`);
    cx.fillStyle = atmo;
    cx.fillRect(0, sommet - H * 0.22, L, H * 0.22);
  }

  if (type === 'rayons') {
    const ox = L * 0.5;
    const oy = H * 1.05;
    const n = 30;
    const rot = Math.sin(t * 0.15) * 0.05;
    for (let k = 0; k < n; k++) {
      const a0 = Math.PI + (k / n) * Math.PI + rot;
      const a1 = a0 + (Math.PI / n) * 0.55;
      cx.beginPath();
      cx.moveTo(ox, oy);
      cx.arc(ox, oy, Math.max(L, H) * 1.3, a0, a1);
      cx.closePath();
      cx.fillStyle = e.rayons[k % e.rayons.length];
      cx.globalAlpha = 0.07 + 0.05 * hasard(k);
      cx.fill();
    }
    cx.globalAlpha = 1;
    const voile = cx.createLinearGradient(0, 0, 0, H * 0.5);
    voile.addColorStop(0, e.fond);
    voile.addColorStop(1, 'rgba(0,0,0,0)');
    cx.fillStyle = voile;
    cx.fillRect(0, 0, L, H * 0.5);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Habillage du titre : chapitre, accent italique, annotation manuscrite
// ─────────────────────────────────────────────────────────────────────────────

/** « 01 / 06 · POSEZ VOTRE QUESTION ——— » au-dessus du titre. */
export function dessinerChapitre(cx: C2D, e: Env, texte: string, tl: number, y: number, centre: boolean) {
  const t = Math.round(e.L * (e.f.etiquette === e.f.mono ? 0.02 : 0.032));
  cx.font = fonte(e.f.etiquette, t);
  espacer(cx, Math.round(t * (e.f.etiquette === e.f.mono ? 0.24 : 0.06)));
  const txt = texte.toUpperCase();
  const w = cx.measureText(txt).width;
  const a = apparition(tl, 0, 0.35);
  e.repere('pop', 0.02);
  // Le repère de chapitre posé sur une pastille de verre, avec son point lumineux.
  const pad = t * 1.1;
  const pw = w + pad * 2 + t * 1.1;
  const ph = t * 2.3;
  const x = centre ? (e.L - pw) / 2 : e.marge;
  const py = y - ph * 0.68;
  cx.globalAlpha = a;
  cx.save();
  cx.translate(0, (1 - a) * 12);
  verre(cx, x, py, pw, ph, ph / 2, { teinte: e.teinteVerre, t: e.t, flou: 16, ombre: false, intensite: 0.8 });
  const pouls = 0.6 + 0.4 * Math.abs(Math.sin(tl * 2.4));
  cx.beginPath();
  cx.arc(x + pad * 0.85, py + ph / 2, t * 0.22, 0, Math.PI * 2);
  cx.fillStyle = e.accent;
  cx.globalAlpha = a * pouls;
  cx.shadowColor = e.accent;
  cx.shadowBlur = 12;
  cx.fill();
  cx.shadowBlur = 0;
  cx.globalAlpha = a;
  cx.font = fonte(e.f.etiquette, t);
  espacer(cx, Math.round(t * (e.f.etiquette === e.f.mono ? 0.24 : 0.06)));
  cx.fillStyle = e.accent;
  cx.fillText(txt, x + pad + t * 0.9, py + ph / 2 + t * 0.36);
  espacer(cx, 0);
  cx.restore();
  cx.globalAlpha = 1;
}

/** La phrase d'accent en italique, sous le titre. Renvoie le bas du bloc. */
export function dessinerAccent(cx: C2D, e: Env, texte: string, tl: number, y: number, centre: boolean): number {
  const t = e.L * (e.vertical ? 0.05 : 0.045);
  cx.font = fonte(e.f.italique, t);
  const ls = e.lignes(cx, texte, e.largeurTexte);
  const a = apparition(tl, 0.55, 0.6);
  cx.globalAlpha = a;
  cx.fillStyle = e.accent2;
  let yy = y + t * 1.25;
  for (const l of ls) {
    const w = cx.measureText(l).width;
    cx.fillText(l, centre ? (e.L - w) / 2 : e.marge, yy + (1 - a) * 14);
    yy += t * 1.25;
  }
  cx.globalAlpha = 1;
  return yy - t * 0.6;
}

/** Une note manuscrite qui s'écrit de gauche à droite, légèrement penchée. */
export function dessinerAnnotation(cx: C2D, e: Env, texte: string, tl: number, d: number, x: number, y: number) {
  const t = e.L * 0.052;
  cx.font = fonte(e.f.manuscrite, t);
  const ls = texte.split('\n');
  const w = Math.max(...ls.map((l) => cx.measureText(l).width));
  const p = borne((tl - d * 0.5) / 0.9);
  if (p <= 0) return;
  cx.save();
  cx.translate(x, y);
  cx.rotate(-0.06);
  cx.beginPath();
  cx.rect(-10, -t * 1.2, (w + 20) * p, t * 1.3 * ls.length + t);
  cx.clip();
  cx.fillStyle = e.accent2;
  ls.forEach((l, k) => cx.fillText(l, 0, k * t * 1.15));
  cx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
// Marque
// ─────────────────────────────────────────────────────────────────────────────

/** Un voile sombre et doux derrière un texte posé sur la 3D : la lisibilité d'abord. */
function voile(cx: C2D, e: Env, y: number, rx: number, ry: number, a: number) {
  cx.save();
  cx.translate(e.L / 2, y);
  cx.scale(1, ry / rx);
  const g = cx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, e.fond);
  g.addColorStop(0.55, `${e.fond}CC`);
  g.addColorStop(1, `${e.fond}00`);
  cx.globalAlpha = a * 0.85;
  cx.fillStyle = g;
  cx.fillRect(-rx, -rx, rx * 2, rx * 2);
  cx.restore();
}

/** Le logotype « Magistr » + « IA » (ou « VEOLT »), centré, avec un reflet qui passe. */
function logotype(cx: C2D, e: Env, y: number, taille: number, a: number, reflet: number) {
  const [debut, fin, couleurFin] = e.motMarque;
  cx.font = fonte(e.f.titre, taille);
  const w1 = cx.measureText(debut).width;
  const w2 = cx.measureText(fin).width;
  const x = (e.L - w1 - w2) / 2;
  cx.globalAlpha = a;
  cx.fillStyle = e.degrade && !fin ? degrade(cx, x, w1, e.degrade) : e.encre;
  cx.fillText(debut, x, y);
  cx.fillStyle = fin ? couleurFin : e.encre;
  if (fin) cx.fillText(fin, x + w1, y);
  // Reflet : une bande claire qui traverse le mot une fois.
  if (reflet > 0 && reflet < 1) {
    const bx = x - 120 + (w1 + w2 + 240) * reflet;
    const g = cx.createLinearGradient(bx - 60, 0, bx + 60, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    cx.save();
    cx.globalCompositeOperation = 'source-atop';
    cx.fillStyle = g;
    cx.fillRect(x, y - taille, w1 + w2, taille * 1.2);
    cx.restore();
  }
  cx.globalAlpha = 1;
  return { x, w: w1 + w2 };
}

export function sceneMarque(cx: C2D, e: Env, sc: Extract<Scene, { type: 'marque' }>, tl: number) {
  const taille = e.L * (e.majuscules ? 0.2 : 0.13);
  const a = apparition(tl, 0.1, 0.7);
  if (e.clip) {
    // Le logotype est dans le clip (rendu 3D Blender) : seulement la phrase de
    // marque, au-dessus, quand le mot s'est posé.
    e.repere('impact', 0.2);
    e.repere('scintille', 1.6, 2.6);
    const slogan = sc.slogan ?? e.slogan;
    if (!slogan) return;
    const ts = e.L * (e.majuscules ? 0.042 : 0.04);
    cx.font = fonte(e.majuscules ? e.f.etiquette : e.f.italique, ts);
    if (e.majuscules) espacer(cx, Math.round(ts * 0.08));
    const txt = e.majuscules ? slogan.toUpperCase() : slogan;
    const w = cx.measureText(txt).width;
    const as = apparition(tl, 1.8, 0.6);
    cx.globalAlpha = as;
    cx.fillStyle = e.majuscules ? e.accent2 : e.douce;
    cx.fillText(txt, (e.L - w) / 2, e.H * 0.36 + (1 - as) * 12);
    espacer(cx, 0);
    cx.globalAlpha = 1;
    return;
  }
  e.repere('montee', -1.1, 0.12);
  e.repere('impact', 0.12);
  e.repere('scintille', 0.6, 1.5);
  voile(cx, e, e.H * 0.47 + taille * 0.1, e.L * 0.62, taille * 2.4, a);
  // L'éclat anamorphique : une longue traînée horizontale qui traverse le logo.
  const ec = borne((tl - 0.08) / 1.1);
  if (ec > 0 && ec < 1) {
    const yE = e.H * 0.47 - taille * 0.35;
    const force = Math.sin(Math.PI * ec);
    cx.save();
    cx.globalCompositeOperation = 'lighter';
    const g = cx.createLinearGradient(0, 0, e.L, 0);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.5, e.degrade ? e.degrade[0] : e.accent);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    cx.globalAlpha = 0.55 * force;
    cx.fillStyle = g;
    cx.fillRect(0, yE - 3, e.L, 6);
    cx.globalAlpha = 0.35 * force;
    cx.fillRect(0, yE - 22, e.L, 44);
    const r = cx.createRadialGradient(e.L / 2, yE, 0, e.L / 2, yE, e.L * 0.35);
    r.addColorStop(0, 'rgba(255,255,255,0.5)');
    r.addColorStop(1, 'rgba(0,0,0,0)');
    cx.globalAlpha = 0.5 * force;
    cx.fillStyle = r;
    cx.fillRect(0, yE - e.L * 0.35, e.L, e.L * 0.7);
    cx.restore();
  }
  const echelle = 0.94 + 0.06 * a;
  cx.save();
  cx.translate(e.L / 2, e.H * 0.47);
  cx.scale(echelle, echelle);
  cx.translate(-e.L / 2, -e.H * 0.47);
  logotype(cx, e, e.H * 0.47, taille, a, borne((tl - 0.6) / 0.9));
  cx.restore();
  const slogan = sc.slogan ?? e.slogan;
  if (slogan) {
    const ts = e.L * (e.majuscules ? 0.042 : 0.04);
    cx.font = fonte(e.majuscules ? e.f.etiquette : e.f.italique, ts);
    if (e.majuscules) espacer(cx, Math.round(ts * 0.08));
    const txt = e.majuscules ? slogan.toUpperCase() : slogan;
    const w = cx.measureText(txt).width;
    cx.globalAlpha = apparition(tl, 0.9, 0.6);
    cx.fillStyle = e.majuscules ? e.accent2 : e.douce;
    cx.fillText(txt, (e.L - w) / 2, e.H * 0.47 + ts * 2.4);
    espacer(cx, 0);
    cx.globalAlpha = 1;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Documents
// ─────────────────────────────────────────────────────────────────────────────

/** Des pièces qui se posent l'une sur l'autre, puis (option) s'éparpillent. */
export function sceneDocuments(cx: C2D, e: Env, sc: Extract<Scene, { type: 'documents' }>, tl: number, d: number, y0: number, y1: number) {
  const n = sc.items.length;
  const w = e.L * (e.vertical ? 0.46 : 0.38);
  const h = w * 1.3;
  const cxm = e.L / 2;
  const cym = y0 + (y1 - y0) * 0.5;
  const pas = Math.min(1.1, (d * 0.62) / Math.max(1, n));
  const depart = sc.dispersion ? d * 0.78 : Infinity;
  if (sc.dispersion) e.repere('whoosh', depart);
  sc.items.forEach((libelle, k) => {
    e.repere('papier', 0.2 + k * pas + 0.35);
    const a = apparition(tl, 0.2 + k * pas, 0.6);
    if (a <= 0) return;
    const angle = (hasard(k * 4.1) - 0.5) * 0.16;
    const dx = (k - (n - 1) / 2) * 14;
    const dy = (1 - a) * e.H * 0.18 - k * 8;
    const ex = borne((tl - depart) / 0.9);
    const fuite = sortie(ex);
    const dirX = (hasard(k * 9.3) - 0.5) * e.L * 1.1;
    const dirY = (hasard(k * 6.7) - 0.65) * e.H * 0.6;
    cx.save();
    cx.globalAlpha = a * (1 - fuite * 0.8);
    cx.translate(cxm + dx + dirX * fuite, cym + dy + dirY * fuite);
    cx.rotate(angle + (1 - a) * 0.2 + fuite * (hasard(k) - 0.5) * 0.8);
    cx.shadowColor = 'rgba(0,0,0,0.45)';
    cx.shadowBlur = 40;
    cx.shadowOffsetY = 16;
    boite(cx, -w / 2, -h / 2, w, h, 10, '#F3EFE7');
    cx.shadowColor = 'transparent';
    cx.fillStyle = '#4A4650';
    cx.fillRect(-w / 2 + w * 0.1, -h / 2 + h * 0.08, w * 0.42, h * 0.035);
    cx.fillStyle = '#C9C4BC';
    for (let q = 0; q < 9; q++) cx.fillRect(-w / 2 + w * 0.1, -h / 2 + h * (0.18 + q * 0.065), w * (q % 3 === 2 ? 0.55 : 0.78), h * 0.018);
    cx.font = fonte(e.f.italique, w * 0.06);
    cx.fillStyle = e.app.papier ?? e.app.accent;
    const lw = cx.measureText(libelle).width;
    cx.fillText(libelle, w / 2 - w * 0.08 - lw, h / 2 - h * 0.06);
    cx.restore();
  });
  cx.globalAlpha = 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// Récapitulatif
// ─────────────────────────────────────────────────────────────────────────────

export function sceneRecap(cx: C2D, e: Env, sc: Extract<Scene, { type: 'recap' }>, tl: number, d: number, y0: number, y1: number) {
  // La taille qui fait tenir la plus longue ligne, coche comprise — jamais de texte coupé.
  let t = e.L * (e.vertical ? 0.052 : 0.042);
  cx.font = fonte(e.f.corps, t);
  const plusLongue = Math.max(...sc.items.map((it) => cx.measureText(it).width));
  const place = e.largeurTexte - t * 2.6;
  if (plusLongue > place) t *= place / plusLongue;
  const pas = Math.min(0.8, (d - 1.5) / Math.max(1, sc.items.length));
  const hauteur = sc.items.length * t * 2.05;
  let y = y0 + Math.max(0, (y1 - y0 - hauteur) * 0.4) + t;
  sc.items.forEach((it, k) => {
    const a = apparition(tl, 0.3 + k * pas, 0.4);
    e.repere('coche', 0.5 + k * pas);
    const r = t * 0.42;
    const cxr = e.marge + t * 0.6 + r;
    const cyr = y - t * 0.33;
    cx.globalAlpha = a;
    // Chaque ligne sur sa pastille de verre, qui glisse en place.
    cx.save();
    cx.translate((1 - a) * 40, 0);
    verre(cx, e.marge, y - t * 1.18, e.largeurTexte, t * 1.7, t * 0.85, { teinte: e.teinteVerre, t: e.t + k * 0.6, flou: 18, ombre: k === 0, intensite: 0.9 });
    cx.restore();
    cx.beginPath();
    cx.arc(cxr, cyr, r, 0, Math.PI * 2);
    cx.strokeStyle = e.accent;
    cx.lineWidth = 3;
    cx.stroke();
    // La coche se trace, au lieu d'apparaître.
    const p = borne((tl - (0.45 + k * pas)) / 0.35);
    if (p > 0) {
      cx.beginPath();
      const p1 = [cxr - r * 0.45, cyr + r * 0.02];
      const p2 = [cxr - r * 0.1, cyr + r * 0.38];
      const p3 = [cxr + r * 0.5, cyr - r * 0.35];
      cx.moveTo(p1[0], p1[1]);
      if (p < 0.4) cx.lineTo(p1[0] + (p2[0] - p1[0]) * (p / 0.4), p1[1] + (p2[1] - p1[1]) * (p / 0.4));
      else {
        cx.lineTo(p2[0], p2[1]);
        const q = (p - 0.4) / 0.6;
        cx.lineTo(p2[0] + (p3[0] - p2[0]) * q, p2[1] + (p3[1] - p2[1]) * q);
      }
      cx.strokeStyle = e.accent;
      cx.lineWidth = 4;
      cx.lineCap = 'round';
      cx.stroke();
    }
    cx.font = fonte(e.f.corps, t);
    cx.fillStyle = e.encre;
    cx.fillText(it, e.marge + t * 0.6 + r * 2 + t * 0.55 + (1 - a) * 40, y);
    cx.globalAlpha = 1;
    y += t * 2.05;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Écran produit vivant
// ─────────────────────────────────────────────────────────────────────────────

const DUREE_ELEMENT: Record<ElementApp['type'], (x: ElementApp) => number> = {
  fichiers: (x) => {
    const f = x as Extract<ElementApp, { type: 'fichiers' }>;
    return 0.4 + f.items.length * 0.42 + (f.chronologie ? 0.3 + f.chronologie.length * 0.45 : 0);
  },
  question: (x) => 0.5 + (x as Extract<ElementApp, { type: 'question' }>).texte.length * 0.032 + 0.45,
  sources: (x) => 0.3 + (x as Extract<ElementApp, { type: 'sources' }>).items.length * 0.3,
  reponse: (x) => 0.3 + (x as Extract<ElementApp, { type: 'reponse' }>).texte.replace(/\*\*|\[\d+\]/g, '').length * 0.017,
  bloc: (x) => {
    const b = x as Extract<ElementApp, { type: 'bloc' }>;
    return 0.5 + (b.items ? b.items.length * 0.35 : (b.texte ?? '').length * 0.011);
  },
  courrier: (x) => 0.4 + (x as Extract<ElementApp, { type: 'courrier' }>).texte.length * 0.026,
  piege: (x) => 0.4 + (x as Extract<ElementApp, { type: 'piege' }>).reponse.length * 0.03 + 1,
  notifications: (x) => 0.3 + (x as Extract<ElementApp, { type: 'notifications' }>).items.length * 0.55,
  clic: () => 2.6,
};

/** Découpe « texte **gras** [1] » en segments, pour le révéler caractère par caractère. */
function segments(texte: string): Array<{ t: string; gras: boolean; renvoi?: number }> {
  const out: Array<{ t: string; gras: boolean; renvoi?: number }> = [];
  const re = /(\*\*[^*]+\*\*|\[\d+\])/g;
  let i = 0;
  for (const m of texte.matchAll(re)) {
    if ((m.index ?? 0) > i) out.push({ t: texte.slice(i, m.index), gras: false });
    if (m[0].startsWith('[')) out.push({ t: '', gras: false, renvoi: Number(m[0].slice(1, -1)) });
    else out.push({ t: m[0].slice(2, -2), gras: true });
    i = (m.index ?? 0) + m[0].length;
  }
  if (i < texte.length) out.push({ t: texte.slice(i), gras: false });
  return out;
}

interface Disposition {
  hauteur: number;
  dessiner: (y: number, tl: number) => void;
}

/**
 * L'écran produit : une fenêtre d'application qui se remplit sous les yeux,
 * élément après élément, et défile quand elle déborde — comme une vraie
 * démonstration. La mention « Exemple d'interface · données fictives » est
 * posée sous la fenêtre : l'interface est fidèle, les données sont inventées
 * pour la vidéo, et c'est dit.
 */
function appInterne(
  cx: C2D,
  e: Env,
  sc: Extract<Scene, { type: 'app' }>,
  tl: number,
  d: number,
  y0: number,
  y1: number,
  fs: number,
  hImpose: number,
  mesurer: boolean,
): number {
  const A = e.app;
  const x = e.marge;
  const w = e.largeurTexte;
  const legendeH = sc.flux || sc.mention ? fs * 3.6 : 0;
  const h = hImpose || Math.max(fs * 14, y1 - y0 - legendeH);
  const chrome = fs * 2.1;
  const ongletsH = sc.onglets?.length ? fs * 2.2 : 0;
  const aQuestion = sc.elements.some((x2) => x2.type === 'question');
  const saisieH = aQuestion || sc.saisie ? fs * 3 : 0;
  const pad = fs * 1.05;
  const zx = x + pad;
  const zw = w - pad * 2;
  const zy = y0 + chrome + ongletsH + pad * 0.8;
  const zh = h - chrome - ongletsH - saisieH - pad * 1.4;

  // Calendrier des éléments : chacun commence quand le précédent a fini,
  // le tout ramené à la durée du plan.
  const durees = sc.elements.map((el) => DUREE_ELEMENT[el.type](el));
  const total = durees.reduce((a2, b2) => a2 + b2, 0);
  const echelle = Math.min(1, (d - 1.1) / Math.max(0.1, total));
  const debuts: number[] = [];
  let acc = 0.45;
  for (const du of durees) {
    debuts.push(acc);
    acc += du * echelle;
  }

  // ── Dispositions des éléments ──
  const lignes = e.lignes;
  const dispo: Disposition[] = sc.elements.map((el, k) => {
    const t0 = debuts[k];
    const du = durees[k] * echelle;
    const prog = (tl2: number) => borne((tl2 - t0) / Math.max(0.1, du));
    if (el.type === 'fichiers') {
      const rh = fs * 2.15;
      const ch = el.chronologie ? fs * 1.9 + el.chronologie.length * fs * 1.75 : 0;
      return {
        hauteur: el.items.length * rh + ch + fs * 0.6,
        dessiner: (y, tl2) => {
          el.items.forEach((f, q) => {
            e.repere('pop', t0 + q * 0.42 * echelle + 0.1);
            const a = apparition(tl2, t0 + q * 0.42 * echelle, 0.35);
            if (a <= 0) return;
            cx.globalAlpha = a;
            boite(cx, zx, y, zw, rh - fs * 0.35, fs * 0.4, undefined, A.filet, 1);
            // icône de fichier, coin plié
            const ix = zx + fs * 0.6;
            const iy = y + fs * 0.42;
            cx.fillStyle = A.neutre;
            cx.fillRect(ix, iy, fs * 0.8, fs * 1.0);
            cx.fillStyle = A.douce;
            cx.fillRect(ix + fs * 0.15, iy + fs * 0.35, fs * 0.5, fs * 0.08);
            cx.fillRect(ix + fs * 0.15, iy + fs * 0.55, fs * 0.4, fs * 0.08);
            cx.font = fonte(e.f.corps, fs * 0.66);
            cx.fillStyle = A.encre;
            cx.fillText(f.nom, ix + fs * 1.3, y + fs * 1.15);
            const ac = apparition(tl2, t0 + q * 0.42 * echelle + 0.28, 0.3);
            if (ac > 0) {
              cx.globalAlpha = a * ac;
              cx.font = fonte(e.f.mono, fs * 0.55);
              const cw = cx.measureText(f.etat).width + fs * 0.9;
              boite(cx, zx + zw - cw - fs * 0.5, y + fs * 0.48, cw, fs * 0.95, fs * 0.47, A.puce);
              cx.fillStyle = A.ok;
              cx.fillText(f.etat, zx + zw - cw - fs * 0.05, y + fs * 1.15);
            }
            cx.globalAlpha = 1;
            y += rh;
          });
          if (el.chronologie) {
            const a0 = apparition(tl2, t0 + el.items.length * 0.42 * echelle, 0.35);
            cx.globalAlpha = a0;
            cx.font = fonte(e.f.mono, fs * 0.55);
            espacer(cx, 2);
            cx.fillStyle = A.douce;
            cx.fillText('CHRONOLOGIE', zx, y + fs * 1.1);
            espacer(cx, 0);
            y += fs * 1.9;
            el.chronologie.forEach((c, q) => {
              const a = apparition(tl2, t0 + (el.items.length * 0.42 + 0.3 + q * 0.45) * echelle, 0.35);
              cx.globalAlpha = a;
              cx.font = fonte(e.f.mono, fs * 0.6);
              cx.fillStyle = A.douce;
              cx.fillText(c.quand, zx, y + fs * 0.9);
              cx.font = fonte(e.f.corpsL, fs * 0.66);
              cx.fillStyle = A.encre;
              cx.fillText(c.texte, zx + fs * 3.2, y + fs * 0.9);
              if (c.tag) {
                const tw = cx.measureText(c.texte).width;
                cx.font = fonte(e.f.mono, fs * 0.5);
                const gw = cx.measureText(c.tag).width + fs * 0.8;
                boite(cx, zx + fs * 3.2 + tw + fs * 0.5, y + fs * 0.22, gw, fs * 0.9, fs * 0.45, A.alerte);
                cx.fillStyle = A.alerteEncre;
                cx.fillText(c.tag, zx + fs * 3.2 + tw + fs * 0.9, y + fs * 0.85);
              }
              y += fs * 1.75;
            });
            cx.globalAlpha = 1;
          }
        },
      };
    }
    if (el.type === 'question') {
      cx.font = fonte(e.f.corpsL, fs * 0.72);
      const ls = lignes(cx, `Vous : ${el.texte}`, zw - fs * 1.4);
      const tTape = t0 + 0.3 * echelle;
      const fTape = t0 + (0.3 + el.texte.length * 0.032) * echelle;
      return {
        hauteur: ls.length * fs * 1.1 + fs * 1.6,
        dessiner: (y, tl2) => {
          e.repere('frappe', tTape, fTape);
          e.repere('whoosh', fTape + 0.12 * echelle);
          // Phase 1 : la question se tape dans le champ de saisie (dessinée plus bas).
          const a = apparition(tl2, fTape + 0.15 * echelle, 0.4);
          if (a <= 0) return;
          cx.globalAlpha = a;
          boite(cx, zx, y, zw, ls.length * fs * 1.1 + fs * 1.1, fs * 0.45, A.neutre);
          ls.forEach((l, q) => {
            const yy = y + fs * 1.15 + q * fs * 1.1;
            if (q === 0) {
              cx.font = fonte(e.f.corps, fs * 0.72);
              cx.fillStyle = A.encre;
              cx.fillText('Vous :', zx + fs * 0.7, yy);
              const vw = cx.measureText('Vous : ').width;
              cx.font = fonte(e.f.corpsL, fs * 0.72);
              cx.fillText(l.slice(7), zx + fs * 0.7 + vw, yy);
            } else {
              cx.font = fonte(e.f.corpsL, fs * 0.72);
              cx.fillStyle = A.encre;
              cx.fillText(l, zx + fs * 0.7, yy);
            }
          });
          cx.globalAlpha = 1;
          void tTape;
        },
      };
    }
    if (el.type === 'sources') {
      cx.font = fonte(e.f.mono, fs * 0.58);
      const tailles = el.items.map((s2) => cx.measureText(s2).width + fs * 2.1);
      const rangs: number[][] = [[]];
      let lx = 0;
      tailles.forEach((tw, q) => {
        if (lx + tw > zw && rangs[rangs.length - 1].length) {
          rangs.push([]);
          lx = 0;
        }
        rangs[rangs.length - 1].push(q);
        lx += tw + fs * 0.5;
      });
      return {
        hauteur: rangs.length * fs * 1.5 + fs * 0.7,
        dessiner: (y, tl2) => {
          rangs.forEach((rg, ri) => {
            let px = zx;
            rg.forEach((q) => {
              e.repere('pop', t0 + q * 0.3 * echelle + 0.05);
              const a = apparition(tl2, t0 + q * 0.3 * echelle, 0.3);
              if (a > 0) {
                cx.globalAlpha = a;
                const yy = y + ri * fs * 1.5;
                boite(cx, px, yy, tailles[q], fs * 1.15, fs * 0.58, undefined, A.filet, 1.2);
                cx.beginPath();
                cx.arc(px + fs * 0.62, yy + fs * 0.575, fs * 0.36, 0, Math.PI * 2);
                cx.fillStyle = A.accent;
                cx.fill();
                cx.font = fonte(e.f.corps, fs * 0.46);
                cx.fillStyle = A.surAccent;
                const nt = String(q + 1);
                cx.fillText(nt, px + fs * 0.62 - cx.measureText(nt).width / 2, yy + fs * 0.74);
                cx.font = fonte(e.f.mono, fs * 0.58);
                cx.fillStyle = A.encre;
                cx.fillText(el.items[q], px + fs * 1.25, yy + fs * 0.78);
                cx.globalAlpha = 1;
              }
              px += tailles[q] + fs * 0.5;
            });
          });
        },
      };
    }
    if (el.type === 'reponse') {
      // Mise en page mot par mot, en gardant le gras et les renvois.
      const segs = segments(el.texte);
      type Mot = { t: string; gras: boolean; renvoi?: number; x: number; y: number; w: number; idx: number };
      const mots: Mot[] = [];
      const tf = fs * 0.74;
      const lh = tf * 1.42;
      let mx = 0;
      let my = 0;
      let idx = 0;
      for (const sg of segs) {
        if (sg.renvoi) {
          const rw = tf * 0.95;
          mots.push({ t: '', gras: false, renvoi: sg.renvoi, x: mx, y: my, w: rw, idx });
          mx += rw;
          continue;
        }
        for (const morceau of sg.t.split(/(\s+)/)) {
          if (!morceau) continue;
          cx.font = fonte(sg.gras ? e.f.corps : e.f.corpsL, tf);
          const mw = cx.measureText(morceau).width;
          if (/^\s+$/.test(morceau)) {
            mx += mw;
            continue;
          }
          if (mx + mw > zw && mx > 0) {
            mx = 0;
            my += lh;
          }
          mots.push({ t: morceau, gras: sg.gras, x: mx, y: my, w: mw, idx });
          idx += morceau.length + 1;
          mx += mw;
        }
      }
      const totalCar = idx;
      const titreH = el.titre ? fs * 1.3 : 0;
      return {
        hauteur: titreH + my + lh + fs * 0.6,
        dessiner: (y, tl2) => {
          e.repere('scintille', t0, t0 + du);
          const p = prog(tl2);
          if (p <= 0) return;
          if (el.titre) {
            cx.font = fonte(e.f.mono, fs * 0.55);
            espacer(cx, 2);
            cx.fillStyle = A.accent;
            cx.fillText(el.titre.toUpperCase(), zx, y + fs * 0.8);
            espacer(cx, 0);
          }
          const visibles = p * totalCar;
          for (const mo of mots) {
            if (mo.idx > visibles) break;
            const yy = y + titreH + mo.y + tf;
            if (mo.renvoi) {
              const pulse = p >= 1 ? 1 + 0.25 * Math.max(0, Math.sin((tl2 - debuts[k] - durees[k] * echelle) * 6)) * Math.exp(-(tl2 - debuts[k] - durees[k] * echelle)) : 1;
              cx.beginPath();
              cx.arc(zx + mo.x + mo.w / 2, yy - tf * 0.62, tf * 0.36 * pulse, 0, Math.PI * 2);
              cx.fillStyle = A.accent;
              cx.fill();
              cx.font = fonte(e.f.corps, tf * 0.48);
              cx.fillStyle = A.surAccent;
              const nt = String(mo.renvoi);
              cx.fillText(nt, zx + mo.x + mo.w / 2 - cx.measureText(nt).width / 2, yy - tf * 0.45);
              continue;
            }
            cx.font = fonte(mo.gras ? e.f.corps : e.f.corpsL, tf);
            cx.fillStyle = A.encre;
            cx.fillText(mo.t, zx + mo.x, yy);
          }
        },
      };
    }
    if (el.type === 'bloc') {
      const tf = fs * 0.68;
      cx.font = fonte(e.f.corpsL, tf);
      const contenu = el.items ? el.items.map((it) => lignes(cx, it, zw - fs * 2.4)) : [lignes(cx, el.texte ?? '', zw - fs * 1.4)];
      const hC = contenu.reduce((s2, ls) => s2 + ls.length * tf * 1.38 + (el.items ? tf * 0.45 : 0), 0);
      const hB = fs * 1.6 + hC + fs * 0.8;
      const alerte = el.ton === 'alerte';
      return {
        hauteur: hB + fs * 0.6,
        dessiner: (y, tl2) => {
          e.repere(alerte ? 'notif' : 'pop', t0 + 0.05);
          const a = apparition(tl2, t0, 0.4);
          if (a <= 0) return;
          cx.globalAlpha = a;
          boite(cx, zx, y, zw, hB, fs * 0.45, alerte ? A.alerte : A.neutre);
          if (alerte) {
            cx.fillStyle = A.alerteEncre;
            cx.fillRect(zx, y + fs * 0.3, 3, hB - fs * 0.6);
          }
          cx.font = fonte(e.f.mono, fs * 0.52);
          espacer(cx, 2);
          cx.fillStyle = alerte ? A.alerteEncre : A.douce;
          cx.fillText(el.titre.toUpperCase(), zx + fs * 0.7, y + fs * 1.05);
          espacer(cx, 0);
          let yy = y + fs * 1.6 + tf;
          contenu.forEach((ls, q) => {
            const aq = el.items ? apparition(tl2, t0 + 0.3 + q * 0.35 * echelle, 0.3) : 1;
            cx.globalAlpha = a * aq;
            if (el.items) {
              cx.font = fonte(e.f.corps, tf * 0.8);
              cx.fillStyle = alerte ? A.alerteEncre : A.accent;
              cx.fillText(alerte ? '•' : String(q + 1), zx + fs * 0.75, yy);
            }
            cx.font = fonte(e.f.corpsL, tf);
            cx.fillStyle = A.encre;
            ls.forEach((l, j) => cx.fillText(l, zx + (el.items ? fs * 1.7 : fs * 0.7), yy + j * tf * 1.38));
            yy += ls.length * tf * 1.38 + (el.items ? tf * 0.45 : 0);
          });
          cx.globalAlpha = 1;
        },
      };
    }
    if (el.type === 'courrier') {
      const tf = fs * 0.74;
      const fCourrier = e.f.titre.famille.includes('Spectral') ? e.f.titre : e.f.corpsL;
      cx.font = fonte(fCourrier, tf);
      const paragraphes = el.texte.split('\n');
      const ls = paragraphes.flatMap((pg) => (pg ? lignes(cx, pg, zw - fs * 1.4) : ['']));
      return {
        hauteur: fs * 2.2 + ls.length * tf * 1.45 + fs * 1.4,
        dessiner: (y, tl2) => {
          e.repere('frappe', t0 + 0.05, t0 + du);
          const a = apparition(tl2, t0, 0.35);
          if (a <= 0) return;
          cx.globalAlpha = a;
          cx.font = fonte(e.f.corps, fs * 0.72);
          cx.fillStyle = A.encre;
          cx.fillText(el.titre, zx, y + fs * 0.9);
          if (el.tag) {
            cx.font = fonte(e.f.mono, fs * 0.52);
            const gw = cx.measureText(el.tag).width + fs * 0.9;
            boite(cx, zx, y + fs * 1.3, gw, fs * 0.95, fs * 0.47, A.alerte);
            cx.fillStyle = A.alerteEncre;
            cx.fillText(el.tag, zx + fs * 0.45, y + fs * 1.97);
          }
          const total2 = ls.reduce((s2, l) => s2 + l.length + 1, 0);
          let reste = prog(tl2) * total2;
          let yy = y + fs * 2.2 + fs * 1.2;
          cx.font = fonte(fCourrier, tf);
          cx.fillStyle = A.encre;
          let curseur: [number, number] | null = null;
          for (const l of ls) {
            if (reste <= 0) break;
            const vis = l.slice(0, Math.ceil(reste));
            cx.fillText(vis, zx, yy);
            curseur = [zx + cx.measureText(vis).width + 3, yy];
            reste -= l.length + 1;
            yy += tf * 1.45;
          }
          if (curseur && Math.floor(tl2 * 2.2) % 2 === 0) {
            cx.fillStyle = A.accent;
            cx.fillRect(curseur[0], curseur[1] - tf * 0.85, 3, tf * 1.05);
          }
          cx.globalAlpha = 1;
        },
      };
    }
    if (el.type === 'notifications') {
      const rh = fs * 2.35;
      return {
        hauteur: el.items.length * rh + fs * 0.4,
        dessiner: (y, tl2) => {
          el.items.forEach((n, q) => {
            e.repere('notif', t0 + q * 0.55 * echelle + 0.05);
            const a = apparition(tl2, t0 + q * 0.55 * echelle, 0.4);
            if (a <= 0) return;
            const dx = (1 - a) * zw * 0.4;
            cx.globalAlpha = a;
            boite(cx, zx + dx, y, zw, rh - fs * 0.4, fs * 0.45, A.neutre);
            cx.beginPath();
            cx.arc(zx + dx + fs * 0.8, y + fs * 0.98, fs * 0.22, 0, Math.PI * 2);
            cx.fillStyle = A.accent;
            cx.fill();
            cx.font = fonte(e.f.corps, fs * 0.66);
            cx.fillStyle = A.encre;
            cx.fillText(n.titre, zx + dx + fs * 1.4, y + fs * 0.95);
            if (n.detail) {
              cx.font = fonte(e.f.corpsL, fs * 0.54);
              cx.fillStyle = A.douce;
              cx.fillText(n.detail, zx + dx + fs * 1.4, y + fs * 1.7);
            }
            cx.globalAlpha = 1;
            y += rh;
          });
        },
      };
    }
    if (el.type === 'clic') {
      const bh = fs * 2.3;
      return {
        hauteur: bh + fs * 2.6,
        dessiner: (y, tl2) => {
          const tClic = t0 + 1.0 * echelle;
          e.repere('clic', tClic);
          if (el.toast) e.repere('succes', tClic + 0.35);
          const a = apparition(tl2, t0, 0.35);
          if (a <= 0) return;
          cx.globalAlpha = a;
          boite(cx, zx, y, zw, bh, bh / 2, A.neutre, A.filet, 1);
          const fait = tl2 >= tClic;
          // statut : avant → après
          cx.font = fonte(e.f.mono, fs * 0.55);
          const st = fait ? `✓ ${el.apres}` : el.avant;
          const sw2 = cx.measureText(st).width + fs * 0.9;
          boite(cx, zx + fs * 0.5, y + bh * 0.24, sw2, bh * 0.52, bh * 0.26, fait ? A.puce : A.champ, fait ? undefined : A.filet, 1);
          cx.fillStyle = fait ? A.ok : A.douce;
          cx.fillText(st, zx + fs * 0.95, y + bh * 0.6);
          cx.font = fonte(e.f.corps, fs * 0.62);
          cx.fillStyle = A.encre;
          cx.fillText(el.libelle, zx + fs * 1.2 + sw2, y + bh * 0.6);
          // le bouton, qui s'enfonce au clic
          cx.font = fonte(e.f.corps, fs * 0.6);
          const bw = cx.measureText(el.bouton).width + fs * 1.4;
          const bx = zx + zw - bw - fs * 0.35;
          const presse = tl2 >= tClic && tl2 < tClic + 0.18 ? 0.94 : 1;
          cx.save();
          cx.translate(bx + bw / 2, y + bh / 2);
          cx.scale(presse, presse);
          boite(cx, -bw / 2, -bh * 0.3, bw, bh * 0.6, bh * 0.3, A.bouton ? degrade(cx, -bw / 2, bw, A.bouton) : A.accent);
          cx.fillStyle = A.bouton ? '#FFFFFF' : A.surAccent;
          cx.fillText(el.bouton, -bw / 2 + fs * 0.7, fs * 0.22);
          cx.restore();
          // onde du clic
          if (tl2 >= tClic && tl2 < tClic + 0.6) {
            const r = (tl2 - tClic) / 0.6;
            cx.beginPath();
            cx.arc(bx + bw * 0.55, y + bh * 0.55, fs * (0.4 + 1.6 * r), 0, Math.PI * 2);
            cx.strokeStyle = A.accent;
            cx.globalAlpha = a * (1 - r);
            cx.lineWidth = 3;
            cx.stroke();
            cx.globalAlpha = a;
          }
          // le curseur arrive, clique, repart un peu
          const pc = sortie((tl2 - t0 - 0.2 * echelle) / (0.75 * echelle));
          const cxx = zx + zw * 0.35 + (bx + bw * 0.55 - zx - zw * 0.35) * pc;
          const cyy = y + bh * 2.2 + (y + bh * 0.55 - y - bh * 2.2) * pc;
          curseur(cx, cxx, cyy, fs * 1.1);
          // la bulle de confirmation
          if (el.toast) {
            const at = apparition(tl2, tClic + 0.35, 0.35);
            if (at > 0) {
              cx.globalAlpha = a * at;
              cx.font = fonte(e.f.corps, fs * 0.58);
              const tw = cx.measureText(`✓ ${el.toast}`).width + fs * 1.4;
              boite(cx, zx, y + bh + fs * 0.7 + (1 - at) * 10, tw, fs * 1.3, fs * 0.65, A.champ, A.filet, 1);
              cx.fillStyle = A.ok;
              cx.fillText(`✓ ${el.toast}`, zx + fs * 0.7, y + bh + fs * 1.55 + (1 - at) * 10);
            }
          }
          cx.globalAlpha = 1;
        },
      };
    }
    // piège
    const pg = el as Extract<ElementApp, { type: 'piege' }>;
    const tf = fs * 0.72;
    cx.font = fonte(e.f.corpsL, tf);
    const lsR = lignes(cx, pg.reponse, zw - fs * 2);
    const hP = fs * 3.6 + lsR.length * tf * 1.4 + fs * 2.2;
    return {
      hauteur: hP + fs * 0.6,
      dessiner: (y, tl2) => {
        const a = apparition(tl2, t0, 0.35);
        if (a <= 0) return;
        cx.globalAlpha = a;
        boite(cx, zx, y, zw, hP, fs * 0.45, undefined, A.filet, 1.2);
        cx.font = fonte(e.f.mono, fs * 0.52);
        cx.fillStyle = A.douce;
        cx.fillText('Assistant IA générique', zx + fs * 0.7, y + fs * 1.05);
        cx.font = fonte(e.f.corpsL, fs * 0.62);
        cx.fillText(pg.question, zx + fs * 0.7, y + fs * 2.2);
        const du2 = pg.reponse.length * 0.03 * echelle;
        e.repere('frappe', t0 + 0.35 * echelle, t0 + 0.35 * echelle + du2);
        e.repere('erreur', t0 + 0.35 * echelle + du2 + 0.5);
        const p = borne((tl2 - t0 - 0.35 * echelle) / Math.max(0.1, du2));
        let reste = p * pg.reponse.length;
        let yy = y + fs * 3.6;
        cx.font = fonte(e.f.corpsL, tf);
        const finLignes: Array<[number, number]> = [];
        for (const l of lsR) {
          if (reste <= 0) break;
          const vis = l.slice(0, Math.ceil(reste));
          cx.fillStyle = A.encre;
          cx.fillText(vis, zx + fs * 0.7, yy);
          finLignes.push([cx.measureText(vis).width, yy]);
          reste -= l.length + 1;
          yy += tf * 1.4;
        }
        // Puis la réponse est barrée, et le piège nommé.
        const barre = borne((tl2 - t0 - 0.35 * echelle - du2 - 0.15) / 0.5);
        if (barre > 0) {
          cx.fillStyle = A.accent;
          finLignes.forEach(([lw, ly]) => cx.fillRect(zx + fs * 0.7, ly - tf * 0.32, lw * barre, 2.5));
          const ac = apparition(tl2, t0 + 0.35 * echelle + du2 + 0.5, 0.35);
          cx.globalAlpha = a * ac;
          cx.font = fonte(e.f.corps, fs * 0.6);
          const gw = cx.measureText(`⚠ ${pg.alerte}`).width + fs * 1.2;
          boite(cx, zx + fs * 0.7, yy - tf * 0.2, gw, fs * 1.2, fs * 0.6, undefined, A.accent, 1.8);
          cx.fillStyle = A.accent;
          cx.fillText(`⚠ ${pg.alerte}`, zx + fs * 1.3, yy + fs * 0.62);
        }
        cx.globalAlpha = 1;
      },
    };
  });

  // ── Défilement : l'élément qui arrive reste toujours visible ──
  const hauts: number[] = [];
  let cumul = 0;
  for (const dp of dispo) {
    hauts.push(cumul);
    cumul += dp.hauteur;
  }
  // Première passe : on ne fait que mesurer la hauteur utile.
  if (mesurer) return chrome + ongletsH + pad * 1.6 + cumul + saisieH;

  // ── Fenêtre ──
  const aF = apparition(tl, 0, 0.55);
  cx.save();
  cx.globalAlpha = aF;
  // Entrée : la fenêtre monte, grandit à peine et se redresse ; puis elle flotte.
  const flotte = Math.sin(tl * 1.1) * 4;
  const zoom = 0.94 + 0.06 * aF;
  cx.translate(x + w / 2, y0 + h / 2 + (1 - aF) * 60 + flotte);
  cx.rotate((1 - aF) * -0.035);
  cx.scale(zoom, zoom);
  cx.translate(-(x + w / 2), -(y0 + h / 2));
  if (A.verre) {
    verre(cx, x, y0, w, h, fs * 0.8, { teinte: A.teinte ?? A.fond, t: e.t, flou: 30, lentille: 1.06 });
  } else {
    cx.shadowColor = 'rgba(0,0,0,0.5)';
    cx.shadowBlur = 50;
    cx.shadowOffsetY = 20;
    boite(cx, x, y0, w, h, fs * 0.8, A.fond);
    cx.shadowColor = 'transparent';
    boite(cx, x, y0, w, h, fs * 0.8, undefined, A.filet, 1.5);
  }
  for (let k = 0; k < 3; k++) {
    cx.beginPath();
    cx.arc(x + fs * 1.1 + k * fs * 0.85, y0 + chrome / 2, fs * 0.24, 0, Math.PI * 2);
    cx.fillStyle = A.filet;
    cx.fill();
  }
  cx.font = fonte(e.f.mono, fs * 0.62);
  cx.fillStyle = A.douce;
  cx.fillText(sc.fenetre, x + fs * 3.9, y0 + chrome / 2 + fs * 0.22);
  cx.fillStyle = A.filet;
  cx.fillRect(x, y0 + chrome, w, 1);
  if (sc.onglets?.length) {
    let ox = x + pad;
    sc.onglets.forEach((o, k) => {
      cx.font = fonte(e.f.corps, fs * 0.66);
      const ow = cx.measureText(o).width;
      cx.fillStyle = k === 0 ? A.accent : A.douce;
      cx.fillText(o, ox, y0 + chrome + ongletsH * 0.62);
      if (k === 0) cx.fillRect(ox, y0 + chrome + ongletsH - 3, ow, 3);
      ox += ow + fs * 1.4;
    });
    cx.fillStyle = A.filet;
    cx.fillRect(x, y0 + chrome + ongletsH, w, 1);
  }

  const decalage = (k: number) => Math.max(0, hauts[k] + dispo[k].hauteur - zh);
  let defil = 0;
  for (let k = 0; k < dispo.length; k++) {
    const a = apparition(tl, debuts[k], 0.55);
    if (a <= 0) break;
    defil = defil + (decalage(k) - defil) * a;
  }
  cx.save();
  cx.beginPath();
  cx.rect(x, zy - pad * 0.5, w, zh + pad * 0.5);
  cx.clip();
  dispo.forEach((dp, k) => dp.dessiner(zy + hauts[k] - defil, tl));
  cx.restore();

  // ── Champ de saisie, avec la frappe de la question ──
  if (saisieH) {
    const sy = y0 + h - saisieH + fs * 0.45;
    const sh = saisieH - fs * 0.9;
    boite(cx, zx, sy, zw, sh, sh / 2, A.champ, A.filet, 1.3);
    const q = sc.elements.findIndex((el2) => el2.type === 'question');
    const qEl = q >= 0 ? (sc.elements[q] as Extract<ElementApp, { type: 'question' }>) : null;
    let texte = '';
    let actif = false;
    if (qEl) {
      const tA = debuts[q] + 0.3 * echelle;
      const tB = tA + qEl.texte.length * 0.032 * echelle;
      if (tl >= tA && tl < tB + 0.15 * echelle) {
        texte = qEl.texte.slice(0, Math.ceil(((tl - tA) / (tB - tA)) * qEl.texte.length));
        actif = true;
      }
    }
    cx.font = fonte(e.f.corpsL, fs * 0.66);
    let vis = texte || sc.saisie || 'Posez votre question…';
    while (cx.measureText(vis).width > zw - fs * 3.4 && vis.length > 4) vis = '…' + vis.slice(2);
    cx.fillStyle = texte ? A.encre : A.douce;
    cx.fillText(vis, zx + fs * 0.9, sy + sh * 0.63);
    if (actif && Math.floor(tl * 2.2) % 2 === 0) {
      cx.fillStyle = A.accent;
      cx.fillRect(zx + fs * 0.9 + cx.measureText(vis).width + 3, sy + sh * 0.26, 2.5, sh * 0.48);
    }
    boite(cx, zx + zw - sh * 0.92 - fs * 0.15, sy + sh * 0.08, sh * 0.84, sh * 0.84, sh * 0.25, A.accent);
    cx.font = fonte(e.f.corps, fs * 0.7);
    cx.fillStyle = A.surAccent;
    cx.fillText('→', zx + zw - sh * 0.92 - fs * 0.15 + sh * 0.42 - fs * 0.28, sy + sh * 0.66);
  }
  cx.restore();

  // ── Pastilles de verre qui flottent au bord de la fenêtre ──
  (sc.bulles ?? []).forEach((b2, k) => {
    const tb = b2.a ?? 0.9 + k * 0.7;
    e.repere('pop', tb);
    const ab = apparition(tl, tb, 0.45);
    if (ab <= 0) return;
    const tb2 = fs * 0.62;
    cx.font = fonte(e.f.corps, tb2);
    const largeurB = cx.measureText(`${b2.icone ? b2.icone + '  ' : ''}${b2.texte}`).width + tb2 * 2.1 + tb2 * 0.9;
    const droite = (b2.cote ?? (k % 2 ? 'gauche' : 'droite')) === 'droite';
    const bxb = droite ? x + w - largeurB * 0.78 : x - largeurB * 0.18;
    const byb = y0 + h * (b2.hauteur ?? 0.18 + 0.27 * k) + Math.sin(tl * 1.4 + k) * 6;
    cx.save();
    cx.globalAlpha = ab;
    cx.translate(bxb + largeurB / 2, byb);
    const rebond = 0.7 + 0.3 * ab + 0.08 * Math.sin(Math.PI * ab);
    cx.scale(rebond, rebond);
    cx.translate(-(bxb + largeurB / 2), -byb);
    pastilleVerre(cx, bxb, byb, b2.texte, fonte(e.f.corps, tb2), tb2, { teinte: e.teinteVerre, t: e.t, encre: e.encre, pastille: e.accent, icone: b2.icone, intensite: 1.1 });
    cx.restore();
  });

  // ── Sous la fenêtre : le parcours, et la mention d'exemple ──
  if (sc.flux || sc.mention) {
    const ly = y0 + h + fs * 1.5;
    cx.globalAlpha = apparition(tl, 0.5, 0.5);
    if (sc.flux) {
      cx.font = fonte(e.f.corps, fs * 0.7);
      cx.fillStyle = e.encre;
      const txt = sc.flux.join('  →  ');
      cx.fillText(txt, x, ly);
    }
    if (sc.mention) {
      cx.font = fonte(e.f.corpsL, fs * 0.55);
      cx.fillStyle = e.douce;
      cx.fillText(sc.mention, x, ly + fs * 1.15);
    }
    cx.globalAlpha = 1;
  }
  return 0;
}

/**
 * L'écran produit à la taille de son contenu : une carte compacte quand il y a
 * peu à montrer (comme dans les références), le texte le plus grand possible
 * pour un téléphone, et réduit seulement s'il ne tient pas.
 */
export function sceneApp(cx: C2D, e: Env, sc: Extract<Scene, { type: 'app' }>, tl: number, d: number, y0: number, y1: number) {
  const legende = Boolean(sc.flux || sc.mention);
  let fs = e.L * (e.vertical ? 0.038 : 0.03);
  for (let essai = 0; essai < 5; essai++) {
    const dispo = y1 - y0 - (legende ? fs * 3.6 : 0);
    const besoin = appInterne(cx, e, sc, tl, d, y0, y1, fs, 0, true);
    if (besoin <= dispo || essai === 4) {
      const h = Math.min(dispo, Math.max(besoin, fs * 9));
      const cy0 = y0 + Math.max(0, (dispo - h) * 0.28);
      appInterne(cx, e, sc, tl, d, cy0, cy0 + h + (legende ? fs * 3.6 : 0), fs, h, false);
      return;
    }
    fs *= 0.9;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Fin
// ─────────────────────────────────────────────────────────────────────────────

/** L'écran de fin complet : marque, slogan, public, bouton, adresse, petite ligne. */
export function sceneFinV2(cx: C2D, e: Env, sc: Extract<Scene, { type: 'fin' }>, titre: string, tl: number) {
  const L = e.L;
  e.repere('impact', 0.05);
  e.repere('pop', 0.9);
  let y = e.H * (e.vertical ? 0.36 : 0.3);
  const tl1 = L * (e.majuscules ? 0.15 : 0.1);
  voile(cx, e, y + e.H * 0.13, L * 0.7, e.H * 0.3, apparition(tl, 0, 0.5));
  logotype(cx, e, y, tl1, apparition(tl, 0, 0.5), borne((tl - 0.4) / 0.9));
  y += tl1 * 0.75;
  const lignesSlogan = sc.slogan ?? (titre ? [titre] : []);
  const ts = L * (e.majuscules ? 0.07 : 0.058);
  lignesSlogan.forEach((l, k) => {
    const a = apparition(tl, 0.35 + k * 0.18, 0.5);
    cx.font = fonte(e.f.titre, ts);
    const txt = e.majuscules ? l.toUpperCase() : l;
    const ls = e.lignes(cx, txt, e.largeurTexte);
    for (const li of ls) {
      y += ts * 1.12;
      const w = cx.measureText(li).width;
      cx.globalAlpha = a;
      cx.fillStyle = k === lignesSlogan.length - 1 && lignesSlogan.length > 1 ? (e.degrade ? degrade(cx, (L - w) / 2, w, e.degrade) : e.accent2) : e.encre;
      cx.fillText(li, (L - w) / 2, y + (1 - a) * 16);
    }
  });
  cx.globalAlpha = 1;
  if (sc.public) {
    y += ts * 1.45;
    const tp = L * 0.021;
    cx.font = fonte(e.f.etiquette, e.f.etiquette === e.f.mono ? tp : tp * 1.5);
    espacer(cx, Math.round(tp * 0.25));
    const txt = sc.public.toUpperCase();
    const w = cx.measureText(txt).width;
    cx.globalAlpha = apparition(tl, 0.7, 0.5);
    cx.fillStyle = e.douce;
    cx.fillText(txt, (L - w) / 2, y);
    espacer(cx, 0);
    cx.globalAlpha = 1;
  }
  // Le bouton, qui respire.
  const fb = L * (e.vertical ? 0.04 : 0.035);
  cx.font = fonte(e.f.corps, fb);
  const tw = cx.measureText(`${sc.action}  →`).width;
  const bw = tw + fb * 2.4;
  const bh = fb * 2.5;
  const by = y + fb * 1.6;
  const a = apparition(tl, 0.85, 0.5);
  const pulse = tl > 1.5 ? 1 + 0.025 * Math.sin((tl - 1.5) * 4.2) : 1;
  cx.save();
  cx.globalAlpha = a;
  cx.translate(L / 2, by + bh / 2);
  cx.scale(pulse, pulse);
  cx.shadowColor = e.bouton.fond[e.bouton.fond.length - 1];
  cx.shadowBlur = 40 + 14 * Math.sin(tl * 4.2);
  boite(cx, -bw / 2, -bh / 2, bw, bh, bh / 2, degrade(cx, -bw / 2, bw, e.bouton.fond));
  cx.shadowBlur = 0;
  // Reflet de verre sur le bouton.
  const rb = cx.createLinearGradient(0, -bh / 2, 0, bh / 2);
  rb.addColorStop(0, 'rgba(255,255,255,0.28)');
  rb.addColorStop(0.5, 'rgba(255,255,255,0.04)');
  rb.addColorStop(1, 'rgba(255,255,255,0)');
  boite(cx, -bw / 2, -bh / 2, bw, bh, bh / 2, rb, 'rgba(255,255,255,0.35)', 1.2);
  cx.fillStyle = e.bouton.encre;
  cx.fillText(`${sc.action}  →`, -tw / 2, fb * 0.36);
  cx.restore();
  const adr = sc.adresse ?? e.adresse;
  cx.globalAlpha = apparition(tl, 1.05, 0.5);
  cx.font = fonte(e.f.corps, fb * 0.75);
  const aw = cx.measureText(adr).width;
  cx.fillStyle = e.encre;
  cx.fillText(adr, (L - aw) / 2, by + bh + fb * 1.7);
  if (sc.note) {
    cx.font = fonte(e.f.corpsL, fb * 0.52);
    const nw = cx.measureText(sc.note).width;
    cx.fillStyle = e.douce;
    cx.fillText(sc.note, (L - nw) / 2, e.H - (e.vertical ? 140 : 90));
  }
  cx.globalAlpha = 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// Site sur téléphone
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Une maquette de site d'artisan qui défile dans un téléphone, avec ses
 * repères (« bouton d'appel toujours visible »…) qui s'affichent dessous au
 * fil du défilement. C'est une maquette d'exemple, et la mention le dit :
 * Veolt n'a pas encore de client à montrer, on montre la façon de faire.
 */
export function sceneSite(cx: C2D, e: Env, sc: Extract<Scene, { type: 'site' }>, tl: number, d: number, y0: number, y1: number) {
  const reperesH = sc.reperes?.length ? e.L * 0.075 : 0;
  const mentionH = e.L * 0.04;
  const dispo = y1 - y0 - reperesH - mentionH;
  let pw = e.L * (e.vertical ? 0.5 : 0.36);
  let ph = pw * 2.05;
  if (ph > dispo) {
    ph = dispo;
    pw = ph / 2.05;
  }
  const px = (e.L - pw) / 2;
  const py = y0 + (dispo - ph) * 0.3;
  const a = apparition(tl, 0, 0.5);

  // Le téléphone : il arrive par le bas, puis se pose.
  cx.save();
  cx.globalAlpha = a;
  cx.translate(0, (1 - a) * e.H * 0.08);
  cx.shadowColor = 'rgba(0,0,0,0.55)';
  cx.shadowBlur = 60;
  cx.shadowOffsetY = 26;
  boite(cx, px, py, pw, ph, pw * 0.13, '#0B0B0D');
  cx.shadowColor = 'transparent';
  boite(cx, px, py, pw, ph, pw * 0.13, undefined, 'rgba(255,255,255,0.18)', 2);
  const bord = pw * 0.035;
  const sx = px + bord;
  const sy = py + bord;
  const sw = pw - bord * 2;
  const sh = ph - bord * 2;

  // Le site, dessiné en hauteur, puis défilé.
  const u = sw / 100; // unité : 1 % de la largeur d'écran
  const coul = sc.couleur ?? '#B5651D';
  const papier = '#FBF8F3';
  const encre = '#1E1B18';
  const doux = '#7A726A';
  // La vraie hauteur du site (mêmes mesures que le dessin plus bas) : on ne
  // défile jamais au-delà du pied de page — sinon l'écran finit vide.
  const nServices = Math.min(4, sc.services.length);
  const nHoraires = (sc.horaires ?? ['', '', '']).length;
  const hauteurSite = (14 + 78 + 12 + 6 + nServices * 21 + 8 + 6 + nHoraires * 7 + 3 + 52 + 8) * u;
  const course = Math.max(0, hauteurSite + 20 * u - sh);
  // Défilement par paliers : on s'arrête sur chaque partie, comme un visiteur.
  const paliers = [0, 0.38, 0.72, 1];
  const pas = (d - 1.2) / (paliers.length - 1);
  let pos = 0;
  for (let k = 1; k < paliers.length; k++) e.repere('defile', 0.6 + (k - 1) * pas + pas * 0.25);
  for (let k = 1; k < paliers.length; k++) {
    const p = sortie((tl - 0.6 - (k - 1) * pas - pas * 0.25) / (pas * 0.55));
    pos = paliers[k - 1] + (paliers[k] - paliers[k - 1]) * p;
    if (p < 1) break;
  }
  const defil = course * pos;

  cx.beginPath();
  cx.roundRect(sx, sy, sw, sh, pw * 0.1);
  cx.save();
  cx.clip();
  cx.fillStyle = papier;
  cx.fillRect(sx, sy, sw, sh);
  cx.translate(sx, sy - defil);
  // Barre de navigation
  cx.fillStyle = papier;
  cx.fillRect(0, 0, sw, 14 * u);
  cx.font = fonte(e.f.italique, 6.4 * u);
  cx.fillStyle = encre;
  cx.fillText(sc.nom, 6 * u, 9.2 * u);
  for (let k = 0; k < 3; k++) cx.fillRect(sw - 13 * u, (5.2 + k * 2.2) * u, 7 * u, 0.8 * u);
  // Héros : image chaude, titre, bouton
  const hh = 78 * u;
  const g = cx.createLinearGradient(0, 14 * u, sw, 14 * u + hh);
  g.addColorStop(0, coul);
  g.addColorStop(1, '#2A1E16');
  cx.fillStyle = g;
  cx.fillRect(0, 14 * u, sw, hh);
  for (let k = 0; k < 5; k++) {
    cx.beginPath();
    cx.arc((20 + k * 17) * u, 14 * u + hh * (0.35 + 0.25 * hasard(k + 3)), (7 + 6 * hasard(k)) * u, 0, Math.PI * 2);
    cx.fillStyle = `rgba(255,235,205,${0.1 + 0.12 * hasard(k * 2)})`;
    cx.fill();
  }
  cx.font = fonte(e.f.corps, 3.4 * u);
  cx.fillStyle = 'rgba(255,255,255,0.8)';
  cx.fillText(sc.metier.toUpperCase(), 6 * u, 14 * u + hh * 0.52);
  cx.font = fonte(e.f.titre.famille.includes('Spectral') ? e.f.titre : e.f.italique, 8.6 * u);
  cx.fillStyle = '#FFFFFF';
  e.lignes(cx, sc.accroche, sw - 12 * u).slice(0, 3).forEach((l, k) => cx.fillText(l, 6 * u, 14 * u + hh * 0.66 + k * 9.6 * u));
  // Services
  let y = 14 * u + hh + 12 * u;
  cx.font = fonte(e.f.corps, 6 * u);
  cx.fillStyle = encre;
  cx.fillText('Nos services', 6 * u, y);
  y += 6 * u;
  sc.services.slice(0, 4).forEach((sv, k) => {
    boite(cx, 6 * u, y, sw - 12 * u, 17 * u, 3 * u, '#FFFFFF', '#E9E2D8', 1);
    cx.beginPath();
    cx.arc(15 * u, y + 8.5 * u, 4.6 * u, 0, Math.PI * 2);
    cx.fillStyle = coul;
    cx.globalAlpha = 0.16;
    cx.fill();
    cx.globalAlpha = a;
    cx.font = fonte(e.f.corps, 4.6 * u);
    cx.fillStyle = coul;
    cx.fillText(String(k + 1), 13.6 * u, y + 10.2 * u);
    cx.font = fonte(e.f.corps, 4.4 * u);
    cx.fillStyle = encre;
    cx.fillText(sv, 24 * u, y + 7.6 * u);
    cx.fillStyle = '#E3DCD2';
    cx.fillRect(24 * u, y + 10.6 * u, 50 * u, 1.3 * u);
    y += 21 * u;
  });
  // Horaires et accès
  y += 8 * u;
  cx.font = fonte(e.f.corps, 6 * u);
  cx.fillStyle = encre;
  cx.fillText('Horaires & accès', 6 * u, y);
  y += 6 * u;
  (sc.horaires ?? ['Mardi – samedi · 7 h – 19 h', 'Dimanche · 7 h – 13 h', 'Lundi · fermé']).forEach((hr) => {
    cx.font = fonte(e.f.corpsL, 4.2 * u);
    cx.fillStyle = doux;
    cx.fillText(hr, 6 * u, y + 4 * u);
    y += 7 * u;
  });
  y += 3 * u;
  boite(cx, 6 * u, y, sw - 12 * u, 40 * u, 3 * u, '#E9E4DC');
  cx.strokeStyle = '#D7D0C5';
  cx.lineWidth = 1;
  for (let k = 1; k < 6; k++) {
    cx.beginPath();
    cx.moveTo(6 * u, y + k * 6.6 * u);
    cx.lineTo(sw - 6 * u, y + k * 6.6 * u + 6 * u);
    cx.stroke();
  }
  cx.beginPath();
  cx.arc(sw / 2, y + 17 * u, 3.4 * u, 0, Math.PI * 2);
  cx.fillStyle = coul;
  cx.fill();
  y += 52 * u;
  cx.font = fonte(e.f.corpsL, 3.4 * u);
  cx.fillStyle = doux;
  cx.fillText(`© ${sc.nom}`, 6 * u, y);
  cx.restore();
  // Bouton d'appel collé en bas de l'écran — l'essentiel d'un site d'artisan.
  const bh = 12 * u;
  boite(cx, sx + 6 * u, sy + sh - bh - 5 * u, sw - 12 * u, bh, bh / 2, coul);
  cx.font = fonte(e.f.corps, 4.6 * u);
  cx.fillStyle = '#FFFFFF';
  const tw = cx.measureText(sc.action).width;
  cx.fillText(sc.action, sx + (sw - tw) / 2, sy + sh - bh / 2 - 5 * u + 1.6 * u);
  // Encoche
  boite(cx, px + pw * 0.36, py + bord * 1.4, pw * 0.28, bord * 1.3, bord * 0.65, '#0B0B0D');
  cx.restore();

  // Les repères, un par palier, sous le téléphone.
  if (sc.reperes?.length) {
    const n = sc.reperes.length;
    const k = Math.min(n - 1, Math.floor(borne((tl - 0.6) / Math.max(0.1, d - 1.2)) * n));
    const debutK = 0.6 + (k * (d - 1.2)) / n;
    sc.reperes.forEach((_, q) => e.repere('pop', 0.6 + (q * (d - 1.2)) / n + 0.05));
    const ak = apparition(tl, debutK, 0.35);
    const txt = sc.reperes[k];
    const tr = e.L * (e.vertical ? 0.034 : 0.028);
    cx.font = fonte(e.f.corps, tr);
    const w = cx.measureText(txt).width + tr * 2.1 + tr * 0.9;
    const ry = py + ph + reperesH * 0.12;
    cx.globalAlpha = ak;
    pastilleVerre(cx, (e.L - w) / 2, ry + (1 - ak) * 10, txt, fonte(e.f.corps, tr), tr, {
      teinte: e.teinteVerre,
      t: e.t,
      encre: e.encre,
      pastille: e.accent,
      bordure: e.degrade ?? [e.accent],
    });
    cx.globalAlpha = 1;
  }
  // La mention, juste sous les repères — jamais par-dessus.
  const mention = sc.mention ?? 'Maquette d’exemple — conçue pour la vidéo';
  cx.font = fonte(e.f.corpsL, e.L * 0.022);
  const mw = cx.measureText(mention).width;
  cx.globalAlpha = apparition(tl, 0.6, 0.5) * 0.9;
  cx.fillStyle = e.douce;
  cx.fillText(mention, (e.L - mw) / 2, py + ph + reperesH + mentionH * 0.75);
  cx.globalAlpha = 1;
}

/** Le pointeur de souris, avec son liseré — il guide l'œil vers le geste. */
function curseur(cx: C2D, x: number, y: number, t: number) {
  cx.save();
  cx.translate(x, y);
  cx.beginPath();
  cx.moveTo(0, 0);
  cx.lineTo(0, t * 1.15);
  cx.lineTo(t * 0.3, t * 0.86);
  cx.lineTo(t * 0.52, t * 1.32);
  cx.lineTo(t * 0.68, t * 1.25);
  cx.lineTo(t * 0.46, t * 0.8);
  cx.lineTo(t * 0.84, t * 0.8);
  cx.closePath();
  cx.fillStyle = '#111111';
  cx.shadowColor = 'rgba(0,0,0,0.35)';
  cx.shadowBlur = 8;
  cx.fill();
  cx.shadowColor = 'transparent';
  cx.strokeStyle = '#FFFFFF';
  cx.lineWidth = 2;
  cx.stroke();
  cx.restore();
}

/** Hauteur réservée en bas d'écran par un sous-titre karaoké. */
export const hauteurSousTitre = (e: Env) => e.L * (e.vertical ? 0.2 : 0.14);

/**
 * Le sous-titre « karaoké » : la phrase entière en bas d'écran, et le mot en
 * cours posé sur une pastille aux couleurs de la marque. C'est ce qui tient
 * une lecture muette, mot à mot.
 */
export function dessinerSousTitre(cx: C2D, e: Env, texte: string, tl: number, d: number, voix?: [number, number]) {
  const t = e.L * (e.vertical ? 0.046 : 0.036);
  cx.font = fonte(e.f.corps, t);
  const mots = texte.split(/\s+/).filter(Boolean);
  const poids = mots.map((m) => 1 + m.length * 0.25);
  const total = poids.reduce((a, b) => a + b, 0);
  // Avec une voix off, le mot surligné suit la voix ; sans, il suit le plan.
  const debut = voix ? voix[0] : 0.15;
  const fin = voix ? Math.max(debut + 0.5, voix[1] - 0.15) : Math.max(debut + 0.5, d - 0.35);
  let acc = debut;
  const bornes = poids.map((p) => {
    const a = acc;
    acc += ((fin - debut) * p) / total;
    return a;
  });
  const courant = tl < debut ? -1 : bornes.findIndex((b, k) => tl >= b && (k === mots.length - 1 || tl < bornes[k + 1]));
  // Mise en lignes centrées (2 au plus, sinon plus petit).
  const espace = cx.measureText(' ').width;
  const lignes: number[][] = [[]];
  let lw = 0;
  mots.forEach((m, k) => {
    const w = cx.measureText(m).width;
    if (lw + w > e.largeurTexte && lignes[lignes.length - 1].length) {
      lignes.push([]);
      lw = 0;
    }
    lignes[lignes.length - 1].push(k);
    lw += w + espace;
  });
  const a = apparition(tl, 0, 0.25);
  const yBase = e.H - (e.vertical ? 300 : 175) - (lignes.length - 1) * t * 1.45;
  const plusLarge = Math.max(...lignes.map((lg) => lg.reduce((s2, k) => s2 + cx.measureText(mots[k]).width, 0) + espace * (lg.length - 1)));
  cx.globalAlpha = a;
  verre(cx, (e.L - plusLarge) / 2 - t * 0.8, yBase - t * 1.35, plusLarge + t * 1.6, lignes.length * t * 1.45 + t * 0.75, t * 0.6, { teinte: 'rgba(0,0,0,0.28)', t: e.t, flou: 20, ombre: false, intensite: 0.7 });
  cx.font = fonte(e.f.corps, t);
  cx.globalAlpha = 1;
  lignes.forEach((lg, li) => {
    const largeur = lg.reduce((s2, k) => s2 + cx.measureText(mots[k]).width, 0) + espace * (lg.length - 1);
    let x = (e.L - largeur) / 2;
    const y = yBase + li * t * 1.45;
    lg.forEach((k) => {
      const w = cx.measureText(mots[k]).width;
      if (k === courant) {
        boite(cx, x - t * 0.22, y - t * 0.92, w + t * 0.44, t * 1.22, t * 0.2, e.degrade ? degrade(cx, x, w, e.degrade) : e.app.accent);
      }
      cx.globalAlpha = a * (courant >= 0 && k > courant ? 0.6 : 1);
      cx.fillStyle = '#FFFFFF';
      cx.fillText(mots[k], x, y);
      cx.globalAlpha = 1;
      x += w + espace;
    });
  });
}

/** Une flèche tracée à la main, qui se dessine — pour pointer l'écran. */
export function dessinerFleche(cx: C2D, e: Env, x0: number, y0: number, x1: number, y1: number, p: number) {
  if (p <= 0) return;
  const mx = (x0 + x1) / 2 + (y1 - y0) * 0.35;
  const my = (y0 + y1) / 2 - (x1 - x0) * 0.35;
  const n = 30;
  const fin = Math.max(2, Math.floor(n * borne(p)));
  cx.beginPath();
  let px = x0;
  let py = y0;
  cx.moveTo(x0, y0);
  for (let k = 1; k <= fin; k++) {
    const t = k / n;
    px = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * mx + t * t * x1;
    py = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * my + t * t * y1;
    cx.lineTo(px, py);
  }
  cx.strokeStyle = e.accent2;
  cx.lineWidth = Math.max(3, e.L * 0.0035);
  cx.lineCap = 'round';
  cx.stroke();
  if (p >= 1) {
    const ang = Math.atan2(y1 - my, x1 - mx);
    const h = e.L * 0.022;
    cx.beginPath();
    cx.moveTo(x1, y1);
    cx.lineTo(x1 - h * Math.cos(ang - 0.5), y1 - h * Math.sin(ang - 0.5));
    cx.moveTo(x1, y1);
    cx.lineTo(x1 - h * Math.cos(ang + 0.5), y1 - h * Math.sin(ang + 0.5));
    cx.stroke();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Bento : tuiles de verre qui s'assemblent
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Une grille « bento » (la mise en page des pages produit actuelles) : la
 * première tuile sur toute la largeur, les suivantes deux par deux. Chaque
 * tuile arrive avec un léger rebond, porte une icône lumineuse, un titre, un
 * texte court — ou une grande valeur (un prix affiché, jamais un résultat inventé).
 */
export function sceneBento(cx: C2D, e: Env, sc: Extract<Scene, { type: 'bento' }>, tl: number, d: number, y0: number, y1: number) {
  const n = sc.tuiles.length;
  const gap = e.L * 0.022;
  const w2 = (e.largeurTexte - gap) / 2;
  const rangs = 1 + Math.ceil((n - 1) / 2);
  const dispo = y1 - y0;
  const hGrand = Math.min(dispo * 0.34, e.L * 0.36);
  const hPetit = Math.min((dispo - hGrand - gap * (rangs - 1)) / Math.max(1, rangs - 1), e.L * 0.42);
  const total = hGrand + (rangs - 1) * (hPetit + gap);
  const yb = y0 + Math.max(0, (dispo - total) * 0.35);
  const pas = Math.min(0.55, (d - 1.6) / Math.max(1, n));
  sc.tuiles.forEach((tu, k) => {
    const debut = 0.25 + k * pas;
    e.repere('pop', debut + 0.05);
    const a = apparition(tl, debut, 0.5);
    if (a <= 0) return;
    const grande = k === 0;
    const col = grande ? 0 : (k - 1) % 2;
    const rang = grande ? 0 : 1 + Math.floor((k - 1) / 2);
    const w = grande ? e.largeurTexte : w2;
    const h = grande ? hGrand : hPetit;
    const x = e.marge + col * (w2 + gap);
    const y = yb + (rang === 0 ? 0 : hGrand + gap + (rang - 1) * (hPetit + gap));
    const rebond = 0.86 + 0.14 * a + 0.05 * Math.sin(Math.PI * a);
    cx.save();
    cx.globalAlpha = a;
    cx.translate(x + w / 2, y + h / 2 + (1 - a) * 30 + Math.sin(tl * 1.2 + k) * 3);
    cx.scale(rebond, rebond);
    cx.translate(-(x + w / 2), -(y + h / 2));
    verre(cx, x, y, w, h, e.L * 0.035, { teinte: e.teinteVerre, t: e.t + k * 0.9, flou: 28, bordure: grande ? e.degrade ?? [e.accent, e.accent2] : undefined, intensite: grande ? 1.15 : 1 });
    const pad = e.L * 0.04;
    // L'icône dans son disque lumineux.
    const ri = e.L * (grande ? 0.04 : 0.034);
    const icx = x + pad + ri;
    const icy = y + pad + ri;
    const halo = cx.createRadialGradient(icx, icy, 0, icx, icy, ri * 2.2);
    halo.addColorStop(0, e.degrade ? `${e.degrade[0]}88` : `${e.accent}66`);
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    cx.fillStyle = halo;
    cx.fillRect(icx - ri * 2.2, icy - ri * 2.2, ri * 4.4, ri * 4.4);
    boite(cx, icx - ri, icy - ri, ri * 2, ri * 2, ri * 0.6, 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.22)', 1.2);
    cx.font = fonte(e.f.corps, ri * 1.05);
    const ic = tu.icone ?? '✦';
    cx.fillStyle = e.accent;
    cx.fillText(ic, icx - cx.measureText(ic).width / 2, icy + ri * 0.38);
    // Texte de la tuile.
    let yy = icy + ri + pad * 0.5;
    if (tu.grand) {
      const tg = e.L * (grande ? (e.majuscules ? 0.12 : 0.09) : e.majuscules ? 0.085 : 0.065);
      cx.font = fonte(e.f.titre, tg);
      const gw = cx.measureText(tu.grand).width;
      cx.fillStyle = e.degrade ? degrade(cx, x + pad, gw, e.degrade) : e.encre;
      if (grande) {
        cx.fillText(tu.grand, x + w - pad - gw, icy + tg * 0.36);
      } else {
        yy += tg * 0.75;
        cx.fillText(tu.grand, x + pad, yy);
        yy += tg * 0.35;
      }
    }
    const tt = e.L * (grande ? 0.042 : 0.036);
    cx.font = fonte(e.f.corps, tt);
    cx.fillStyle = e.encre;
    for (const l of e.lignes(cx, e.majuscules ? tu.titre.toUpperCase() : tu.titre, w - pad * 2).slice(0, 2)) {
      yy += tt * 1.05;
      cx.fillText(l, x + pad, yy);
    }
    if (tu.texte) {
      const tx = e.L * (grande ? 0.03 : 0.027);
      cx.font = fonte(e.f.corpsL, tx);
      cx.fillStyle = e.douce;
      yy += tx * 0.6;
      for (const l of e.lignes(cx, tu.texte, w - pad * 2).slice(0, grande ? 2 : 3)) {
        yy += tx * 1.35;
        if (yy > y + h - pad * 0.18) break;
        cx.fillText(l, x + pad, yy);
      }
    }
    cx.restore();
  });
  cx.globalAlpha = 1;
}
