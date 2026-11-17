/**
 * Motion design v4 (17/11/2026) — ce qui fait d'une suite de cartes une vidéo.
 *
 * Trois choses manquaient aux vidéos v3, et elles se voyaient d'un coup d'œil
 * sur une planche-contact : l'image ne bougeait jamais (un titre en haut à
 * gauche, une carte dessous, plan après plan), tous les raccords étaient le
 * même, et les scripts disaient au lieu de montrer.
 *
 *  - **Caméra virtuelle** : chaque plan a un mouvement lent (poussée, recul,
 *    dérive), et le décor bouge moins que le premier plan — la parallaxe donne
 *    la profondeur que le dessin à plat n'a pas.
 *  - **Raccords** : glissé, volet à l'arête lumineuse, iris, en plus du
 *    « à travers » de Veolt et du fondu flouté de MagistrIA.
 *  - **Scènes qui montrent** : typographie cinétique plein cadre, courbe qui
 *    se trace, parcours qui s'allume, rapport qui défile et s'arrête sur ses
 *    phrases, objet 3D réellement rendu (voir `objet3d.ts`).
 *
 * Les règles du dépôt tiennent ici comme ailleurs : une courbe ne porte aucune
 * valeur inventée, un rapport et un objet 3D sont des EXEMPLES dits à l'écran.
 *
 * Module navigateur : tout est fonction du temps seulement (même temps → même
 * image), et chaque scène déclare ses instants sonores (`e.repere`).
 */

import type { CameraPlan, MouvementCamera, PlanMontage, Scene, TransitionPlan } from './montage';
import { fonte, type Env } from './rendu-scenes';
import { verre, pastilleVerre } from './verre';
import type { MoteurObjet } from './objet3d';

type C2D = CanvasRenderingContext2D;
type Ctx = CanvasRenderingContext2D & { letterSpacing: string };

const borne = (x: number) => Math.min(1, Math.max(0, x));
/** Sortie cubique : rapide puis posée. */
const sortie = (x: number) => 1 - Math.pow(1 - borne(x), 3);
/** Sortie « expo » : l'entrée franche des titres plein cadre. */
const expo = (x: number) => (borne(x) >= 1 ? 1 : 1 - Math.pow(2, -10 * borne(x)));
/** Entrée-sortie douce, pour les mouvements de caméra et les raccords. */
const douce = (x: number) => {
  const p = borne(x);
  return p * p * (3 - 2 * p);
};
/** Ressort : dépasse un peu, puis revient. `x` de 0 à 1. */
const ressort = (x: number) => {
  const p = borne(x);
  return p >= 1 ? 1 : 1 - Math.exp(-6.5 * p) * Math.cos(9 * p);
};
const apparition = (tl: number, debut: number, duree = 0.45) => sortie((tl - debut) / duree);
const hasard = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};
const espacer = (cx: C2D, px: number) => ((cx as Ctx).letterSpacing = `${px}px`);

/** La mention d'exemple, sous une scène : réduite jusqu'à tenir sur une ligne — elle ne doit jamais sortir du cadre. */
function mentionSous(cx: C2D, e: Env, texte: string, y: number, taille: number, alpha: number) {
  let t = taille;
  cx.font = fonte(e.f.corpsL, t);
  while (cx.measureText(texte).width > e.largeurTexte && t > taille * 0.6) {
    t *= 0.95;
    cx.font = fonte(e.f.corpsL, t);
  }
  cx.globalAlpha = alpha;
  cx.fillStyle = e.douce;
  cx.fillText(texte, e.marge, y);
  cx.globalAlpha = 1;
}

function degradeH(cx: C2D, x: number, w: number, couleurs: string[]): CanvasGradient {
  const g = cx.createLinearGradient(x, 0, x + Math.max(10, w), 0);
  couleurs.forEach((c, k) => g.addColorStop(couleurs.length === 1 ? 0 : k / (couleurs.length - 1), c));
  if (couleurs.length === 1) g.addColorStop(1, couleurs[0]);
  return g;
}

// ─────────────────────────────────────────────────────────────────────────────
// Caméra virtuelle
// ─────────────────────────────────────────────────────────────────────────────

export interface EtatCamera {
  /** Échelle du premier plan (≥ 1 : rien ne découvre le bord). */
  z: number;
  dx: number;
  dy: number;
}

const CYCLE: MouvementCamera[] = ['pousse', 'derive-droite', 'recul', 'derive-gauche'];

/** Le mouvement d'un plan : celui du script, sinon un mouvement différent du plan précédent. */
export function mouvementDe(p: PlanMontage, i: number): MouvementCamera {
  if (p.camera?.mouvement) return p.camera.mouvement;
  const sc = p.scene?.type;
  // L'accroche, la marque et la fin se regardent de face : une poussée lente, rien d'autre.
  if (i === 0 || sc === 'fin' || sc === 'marque' || sc === 'mots') return 'pousse';
  // Un écran produit ou un tableau se lit : la caméra n'y dérive pas de côté.
  if (sc === 'app' || sc === 'analyse' || sc === 'tableur' || sc === 'rapport' || sc === 'site' || sc === 'dashboard' || sc === 'courbe') return i % 2 ? 'pousse' : 'recul';
  return CYCLE[i % CYCLE.length];
}

/**
 * Où est la caméra à l'instant `tl` d'un plan de durée `d`. Le mouvement est
 * continu sur tout le plan (pas d'arrêt au milieu : c'est un travelling, pas
 * une animation d'entrée). MagistrIA bouge un tiers de moins que Veolt.
 */
export function cameraDe(p: PlanMontage, i: number, tl: number, d: number, e: { L: number; H: number; marque: 'veolt' | 'magistria' }): EtatCamera {
  const c: CameraPlan = p.camera ?? {};
  const f = (c.force ?? 1) * (e.marque === 'veolt' ? 1 : 0.68);
  const u = borne(tl / Math.max(0.1, d));
  const m = mouvementDe(p, i);
  // Un plan long ne doit pas zoomer plus qu'un court : l'amplitude est bornée.
  const ampli = 0.05 * f * Math.min(1, 0.55 + d / 14);
  switch (m) {
    case 'pousse':
      return { z: 1 + ampli * u, dx: 0, dy: 0 };
    case 'recul':
      return { z: 1 + ampli * (1 - u), dx: 0, dy: 0 };
    case 'derive-droite':
      return { z: 1 + ampli * 0.6, dx: e.L * 0.014 * f * (u * 2 - 1), dy: 0 };
    case 'derive-gauche':
      return { z: 1 + ampli * 0.6, dx: -e.L * 0.014 * f * (u * 2 - 1), dy: 0 };
    case 'monte':
      return { z: 1 + ampli * 0.6, dx: 0, dy: -e.H * 0.01 * f * (u * 2 - 1) };
    case 'descend':
      return { z: 1 + ampli * 0.6, dx: 0, dy: e.H * 0.01 * f * (u * 2 - 1) };
    default:
      return { z: 1, dx: 0, dy: 0 };
  }
}

/**
 * Applique la caméra au contexte, pour une couche à la profondeur `facteur` :
 * 1 pour le premier plan (texte, scènes), 0,7 pour la 3D, 0,4 pour le décor.
 * `garde` ajoute un léger sur-cadrage aux couches de fond, pour qu'aucun bord
 * ne se découvre quand elles glissent.
 */
export function appliquerCamera(cx: C2D, cam: EtatCamera, L: number, H: number, facteur: number, garde = 0) {
  const z = 1 + (cam.z - 1) * facteur + garde;
  cx.translate(L / 2 + cam.dx * facteur, H / 2 + cam.dy * facteur);
  cx.scale(z, z);
  cx.translate(-L / 2, -H / 2);
}

// ─────────────────────────────────────────────────────────────────────────────
// Raccords
// ─────────────────────────────────────────────────────────────────────────────

export type RaccordResolu = Exclude<TransitionPlan, 'auto'>;

/** Durée d'entrée de chaque raccord, en secondes. */
export const DUREE_RACCORD: Record<RaccordResolu, number> = { coupe: 0, travers: 0.24, fondu: 0.5, glisse: 0.42, volet: 0.5, iris: 0.55 };

/**
 * Le raccord d'entrée du plan `i`. Sans réglage : celui de la marque, mais pas
 * toujours le même — Veolt alterne « à travers » et glissé, et ouvre ses
 * chapitres au volet ; MagistrIA garde son fondu flouté et n'ouvre au volet
 * que ses chapitres (un propos juridique ne se monte pas comme une publicité).
 */
export function raccordDe(plans: PlanMontage[], i: number, rythme: 'sec' | 'pose'): RaccordResolu {
  const voulu = plans[i].transition;
  if (voulu && voulu !== 'auto') return voulu;
  if (i === 0) return 'coupe';
  const p = plans[i];
  const chapitre = Boolean(p.chapitre) && p.chapitre !== plans[i - 1].chapitre;
  if (rythme === 'pose') return chapitre ? 'volet' : 'fondu';
  if (p.scene?.type === 'fin') return 'iris';
  if (chapitre) return 'volet';
  return i % 3 === 2 ? 'glisse' : 'travers';
}

/**
 * Compose le raccord sur `ctx` : `sortant` et `entrant` sont les deux plans
 * déjà dessinés, `p` l'avancement (0 → 1). Renvoie faux pour les raccords que
 * le rendu principal traite lui-même (coupe, travers, fondu).
 */
export function composerRaccord(
  ctx: C2D,
  type: RaccordResolu,
  p: number,
  sortant: HTMLCanvasElement,
  entrant: HTMLCanvasElement,
  o: { L: number; H: number; fond: string; couleurs: string[]; flou: boolean },
): boolean {
  const { L, H } = o;
  if (type === 'glisse') {
    // Le plan entrant monte et pousse le sortant ; les deux gardent une légère
    // traînée verticale pendant la course.
    const e = p < 0.5 ? 16 * p * p * p * p * p : 1 - Math.pow(-2 * p + 2, 5) / 2;
    const vitesse = Math.sin(Math.PI * p);
    ctx.fillStyle = o.fond;
    ctx.fillRect(0, 0, L, H);
    if (o.flou && vitesse > 0.05) ctx.filter = `blur(${(vitesse * 7).toFixed(1)}px)`;
    ctx.drawImage(sortant, 0, -H * e * 1.0);
    ctx.drawImage(entrant, 0, H * (1 - e));
    ctx.filter = 'none';
    // Le joint entre les deux plans : un filet de lumière aux couleurs de la marque.
    const yj = H * (1 - e);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = vitesse * 0.9;
    ctx.fillStyle = degradeH(ctx, 0, L, o.couleurs);
    ctx.fillRect(0, yj - 3, L, 6);
    const halo = ctx.createLinearGradient(0, yj - H * 0.08, 0, yj + H * 0.08);
    halo.addColorStop(0, 'rgba(0,0,0,0)');
    halo.addColorStop(0.5, `${o.couleurs[0]}55`);
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = vitesse * 0.7;
    ctx.fillStyle = halo;
    ctx.fillRect(0, yj - H * 0.08, L, H * 0.16);
    ctx.restore();
    return true;
  }
  if (type === 'volet') {
    // Un volet en biais traverse l'image ; son arête prend la lumière.
    const e = douce(p);
    const pente = H * 0.22;
    const x = -pente + (L + pente * 2) * e;
    ctx.drawImage(sortant, 0, 0);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-10, -10);
    ctx.lineTo(x + pente, -10);
    ctx.lineTo(x - pente, H + 10);
    ctx.lineTo(-10, H + 10);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(entrant, 0, 0);
    ctx.restore();
    const force = Math.sin(Math.PI * p);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(x - L * 0.1, 0, x + L * 0.02, 0);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.8, `${o.couleurs[0]}66`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = force;
    ctx.transform(1, 0, -(pente * 2) / H, 1, pente, 0);
    ctx.fillStyle = g;
    ctx.fillRect(x - L * 0.1, 0, L * 0.12, H);
    ctx.fillStyle = degradeH(ctx, 0, L, o.couleurs);
    ctx.fillRect(x - 2.5, 0, 5, H);
    ctx.restore();
    return true;
  }
  if (type === 'iris') {
    // Ouverture en cercle depuis le centre, le bord souligné d'un anneau.
    const e = douce(p);
    const R = Math.hypot(L, H) * 0.56 * e;
    ctx.drawImage(sortant, 0, 0);
    ctx.save();
    ctx.beginPath();
    ctx.arc(L / 2, H * 0.46, R, 0, Math.PI * 2);
    ctx.clip();
    // Le plan entrant arrive légèrement grossi et se pose.
    const z = 1 + 0.08 * (1 - e);
    ctx.translate(L / 2, H * 0.46);
    ctx.scale(z, z);
    ctx.translate(-L / 2, -H * 0.46);
    ctx.drawImage(entrant, 0, 0);
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.sin(Math.PI * p) * 0.9;
    ctx.beginPath();
    ctx.arc(L / 2, H * 0.46, R, 0, Math.PI * 2);
    ctx.strokeStyle = degradeH(ctx, L / 2 - R, R * 2, o.couleurs);
    ctx.lineWidth = 5;
    ctx.shadowColor = o.couleurs[0];
    ctx.shadowBlur = 40;
    ctx.stroke();
    ctx.restore();
    return true;
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Typographie cinétique plein cadre
// ─────────────────────────────────────────────────────────────────────────────

/** La plus grande taille à laquelle `texte` tient dans `largeur`, bornée par `max`. */
function ajuster(cx: C2D, f: { famille: string; poids: string }, texte: string, largeur: number, max: number, espace = 0): number {
  cx.font = fonte(f, 100);
  espacer(cx, espace * 100);
  const w = cx.measureText(texte).width || 1;
  espacer(cx, 0);
  return Math.min(max, (100 * largeur) / w);
}

/**
 * Les lignes arrivent l'une après l'autre, chacune taillée à la largeur de
 * l'écran : une affiche qui se compose. Veolt : capitales Bebas qui montent
 * derrière un cache et claquent ; MagistrIA : Spectral qui sort du flou, la
 * ligne d'accent en or, soulignée d'un filet qui se trace.
 */
export function sceneMots(cx: C2D, e: Env, sc: Extract<Scene, { type: 'mots' }>, tl: number, d: number) {
  const { L, H } = e;
  const veolt = e.marque === 'veolt';
  const n = sc.lignes.length;
  const unParUn = sc.mode === 'un-par-un';
  const maxGrand = L * (veolt ? (e.vertical ? 0.4 : 0.3) : e.vertical ? 0.15 : 0.12);
  const largeur = e.largeurTexte;
  const mesures = sc.lignes.map((l) => {
    const txt = e.majuscules && !l.petit ? l.texte.toUpperCase() : l.texte;
    if (l.petit) {
      const f = e.f.etiquette;
      const mono = f === e.f.mono;
      const t = ajuster(cx, f, txt.toUpperCase(), largeur, L * (mono ? 0.032 : 0.058), mono ? 0.24 : 0.08);
      return { txt: txt.toUpperCase(), f, t, h: t * 1.9, esp: (mono ? 0.24 : 0.08) * t, petit: true, accent: Boolean(l.accent) };
    }
    const t = ajuster(cx, e.f.titre, txt, largeur, maxGrand);
    return { txt, f: e.f.titre, t, h: t * (veolt ? 0.98 : 1.22), esp: 0, petit: false, accent: Boolean(l.accent) };
  });
  const pas = Math.min(unParUn ? 1.2 : 0.62, Math.max(0.28, (d - (unParUn ? 0.6 : 1.3)) / n));
  const hauteur = unParUn ? 0 : mesures.reduce((s, m) => s + m.h, 0);
  let y = H * 0.47 - hauteur / 2;

  mesures.forEach((m, k) => {
    // La première ligne est déjà en route à la toute première image : le sujet se lit dès l'ouverture.
    const t0 = (k === 0 ? -0.14 : 0.12) + k * pas;
    const a = (tl - t0) / (veolt ? 0.5 : 0.75);
    e.repere(m.petit ? 'pop' : veolt ? 'impact' : 'pop', Math.max(0, t0) + 0.04);
    let yLigne = y;
    let visible = 1;
    if (unParUn) {
      // Une ligne à la fois, au centre : la précédente s'efface quand la suivante arrive.
      yLigne = H * 0.47 - m.h / 2;
      const fin = k < n - 1 ? t0 + pas : Infinity;
      visible = 1 - sortie((tl - fin + 0.12) / 0.16);
    }
    y += m.h;
    if (a <= 0 || visible <= 0) return;
    cx.save();
    cx.font = fonte(m.f, m.t);
    espacer(cx, m.esp);
    const w = cx.measureText(m.txt).width;
    const x = (L - w) / 2;
    const base = yLigne + m.h * (m.petit ? 0.66 : veolt ? 0.86 : 0.8);
    const remplir = (): string | CanvasGradient => {
      if (m.petit) return m.accent ? e.accent2 : e.douce;
      if (!m.accent) return e.encre;
      return e.degrade ? degradeH(cx, x, w, e.degrade) : e.accent2;
    };
    if (veolt && !m.petit) {
      // Cache : la ligne monte de sous son propre bord, puis claque (léger dépassement d'échelle).
      const p = expo(a);
      const claque = 1 + 0.06 * Math.max(0, 1 - a * 1.6) * (a > 0.25 ? 1 : 0);
      cx.beginPath();
      cx.rect(0, yLigne - m.h * 0.04, L, m.h * 1.06);
      cx.clip();
      cx.globalAlpha = visible;
      cx.translate(L / 2, base);
      cx.scale(claque, claque);
      cx.translate(-L / 2, -base);
      if (m.accent && e.degrade) {
        cx.shadowColor = e.degrade[0];
        cx.shadowBlur = 30 + 50 * (1 - p);
      }
      cx.fillStyle = remplir();
      cx.fillText(m.txt, x, base + (1 - p) * m.h * 1.05);
    } else {
      // Sortie du flou, montée douce.
      const p = sortie(a);
      cx.globalAlpha = p * visible;
      if (p < 1) cx.filter = `blur(${((1 - p) * (m.petit ? 6 : 14)).toFixed(1)}px)`;
      cx.fillStyle = remplir();
      cx.fillText(m.txt, x, base + (1 - p) * (m.petit ? 14 : 34));
      cx.filter = 'none';
      if (m.accent && !m.petit && !e.degrade) {
        // Le filet or qui se trace sous la ligne d'accent.
        const pf = sortie((tl - t0 - 0.45) / 0.7);
        cx.globalAlpha = visible;
        cx.fillStyle = e.accent2;
        cx.fillRect(x, base + m.t * 0.2, w * pf, Math.max(3, m.t * 0.035));
      }
    }
    cx.restore();
    espacer(cx, 0);
  });

  // Une fois l'affiche composée : un trait de lumière la traverse, une seule fois.
  const tBalai = 0.12 + (n - 1) * pas + 0.55;
  const pb = (tl - tBalai) / 0.8;
  if (!unParUn && pb > 0 && pb < 1) {
    e.repere('scintille', tBalai, tBalai + 0.6);
    cx.save();
    cx.globalCompositeOperation = 'lighter';
    const xb = -L * 0.3 + L * 1.6 * douce(pb);
    const g = cx.createLinearGradient(xb - L * 0.18, 0, xb + L * 0.18, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, `rgba(255,255,255,${0.1 * Math.sin(Math.PI * pb)})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    cx.transform(1, 0, -0.35, 1, 0, 0);
    cx.fillStyle = g;
    cx.fillRect(-L, H * 0.47 - hauteur / 2 - 20, L * 3, hauteur + 40);
    cx.restore();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Courbe qui se trace
// ─────────────────────────────────────────────────────────────────────────────

/** Spline de Catmull-Rom échantillonnée : une courbe lisse qu'on peut tracer partiellement. */
function echantillonner(pts: Array<[number, number]>, parSegment = 18): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let s = 0; s < parSegment; s++) {
      const u = s / parSegment;
      const u2 = u * u;
      const u3 = u2 * u;
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * u + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * u + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3),
      ]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

export function sceneCourbe(cx: C2D, e: Env, sc: Extract<Scene, { type: 'courbe' }>, tl: number, d: number, y0: number, y1: number) {
  const { L } = e;
  const x = e.marge;
  const w = e.largeurTexte;
  const tLeg = L * (e.vertical ? 0.04 : 0.03);
  cx.font = fonte(e.f.corpsL, tLeg);
  const legende = sc.legende ? e.lignes(cx, sc.legende, w) : [];
  const basH = legende.length * tLeg * 1.4 + (sc.mention ? tLeg * 1.5 : 0) + (legende.length || sc.mention ? tLeg * 1.2 : 0);
  const h = Math.min(y1 - y0 - basH, w * (e.vertical ? 1.02 : 0.62));
  const yw = y0 + Math.max(0, (y1 - y0 - basH - h) * 0.3);
  const aF = apparition(tl, 0.05, 0.55);
  const chrome = L * 0.058;

  cx.save();
  cx.globalAlpha = aF;
  cx.translate(0, (1 - aF) * 50);
  verre(cx, x, yw, w, h, 22, { teinte: e.teinteVerre, t: e.t, flou: 28, lentille: 1.06 });
  for (let k = 0; k < 3; k++) {
    cx.beginPath();
    cx.arc(x + 30 + k * 22, yw + chrome / 2, 6.5, 0, Math.PI * 2);
    cx.fillStyle = k === 0 ? e.accent : 'rgba(255,255,255,0.2)';
    cx.fill();
  }
  cx.font = fonte(e.f.mono, L * 0.0185);
  espacer(cx, 1);
  cx.fillStyle = e.douce;
  cx.fillText(sc.fenetre, x + 106, yw + chrome / 2 + L * 0.0065);
  espacer(cx, 0);
  cx.fillStyle = 'rgba(255,255,255,0.14)';
  cx.fillRect(x, yw + chrome, w, 1.5);

  // Zone de tracé.
  const pad = L * 0.045;
  const px0 = x + pad + (sc.unite ? L * 0.045 : 0);
  const px1 = x + w - pad;
  const etiq = sc.etiquettesX?.length ? L * 0.05 : 0;
  const py0 = yw + chrome + pad * (sc.unite ? 2 : 1.5);
  const py1 = yw + h - pad - etiq;
  const min = Math.min(...sc.points);
  const max = Math.max(...sc.points);
  const amp = max - min || 1;
  const X = (k: number) => px0 + ((px1 - px0) * k) / Math.max(1, sc.points.length - 1);
  const Y = (v: number) => py1 - ((v - min) / amp) * (py1 - py0);

  if (sc.unite) {
    // Axe gradué : une valeur ronde par trait, l'unité en tête d'axe.
    cx.font = fonte(e.f.mono, L * 0.0175);
    for (const v of graduations(min, max, 6)) {
      if (v < min - amp * 0.02 || v > max + amp * 0.02 || v === 0) continue;
      cx.fillStyle = 'rgba(255,255,255,0.1)';
      cx.fillRect(px0, Y(v), px1 - px0, 1);
      cx.fillStyle = e.douce;
      const lab = nombre(v);
      cx.fillText(lab, px0 - 10 - cx.measureText(lab).width, Y(v) + L * 0.006);
    }
    espacer(cx, 1.2);
    cx.fillStyle = e.douce;
    cx.fillText(`EN ${sc.unite.toUpperCase()}`, px0, py0 - L * 0.022);
    espacer(cx, 0);
  } else {
    // Sans unité : des lignes de repère très discrètes, aucune graduation chiffrée.
    cx.fillStyle = 'rgba(255,255,255,0.07)';
    for (let k = 0; k <= 4; k++) cx.fillRect(px0, py0 + ((py1 - py0) * k) / 4, px1 - px0, 1);
  }
  // La ligne du zéro, quand la courbe passe dessous : c'est elle qu'on regarde.
  const sousZero = min < 0 && max > 0;
  if (sousZero) {
    cx.save();
    cx.setLineDash([10, 9]);
    cx.strokeStyle = 'rgba(255,255,255,0.42)';
    cx.lineWidth = 2;
    cx.beginPath();
    cx.moveTo(px0, Y(0));
    cx.lineTo(px1, Y(0));
    cx.stroke();
    cx.restore();
    cx.font = fonte(e.f.mono, L * 0.02);
    cx.fillStyle = e.douce;
    cx.fillText('0', px0 - L * 0.026, Y(0) + L * 0.007);
  }

  // La bande mise en avant (intervalle), avant la courbe.
  const tTrace = 0.55;
  const dTrace = Math.min(3.2, Math.max(1.4, d * 0.42));
  const prog = douce((tl - tTrace) / dTrace);
  if (sc.bande) {
    const ab = apparition(tl, tTrace + dTrace * 0.85, 0.6);
    if (ab > 0) {
      const bx0 = X(sc.bande.de);
      const bx1 = X(sc.bande.a);
      const g = cx.createLinearGradient(0, py0, 0, py1);
      g.addColorStop(0, `${e.accent}00`);
      g.addColorStop(1, `${e.accent}3D`);
      cx.globalAlpha = aF * ab;
      cx.fillStyle = g;
      cx.fillRect(bx0, py0, (bx1 - bx0) * ab, py1 - py0);
      cx.fillStyle = e.accent;
      cx.fillRect(bx0, py0, 2, py1 - py0);
      cx.fillRect(bx0 + (bx1 - bx0) * ab - 2, py0, 2, py1 - py0);
      if (sc.bande.note) {
        cx.font = fonte(e.f.mono, L * 0.021);
        espacer(cx, 1.5);
        cx.fillStyle = e.accent;
        const nw = cx.measureText(sc.bande.note.toUpperCase()).width;
        cx.fillText(sc.bande.note.toUpperCase(), (bx0 + bx1) / 2 - nw / 2, py0 - L * 0.014);
        espacer(cx, 0);
      }
      cx.globalAlpha = aF;
    }
  }

  // La courbe : aire en dégradé, puis le trait et sa lueur, jusqu'à l'avancement.
  const pts = echantillonner(sc.points.map((v, k) => [X(k), Y(v)] as [number, number]));
  const nb = Math.max(2, Math.round(pts.length * prog));
  e.repere('montee', tTrace, tTrace + dTrace);
  if (prog > 0) {
    const tete = pts[nb - 1];
    const socle = sousZero ? Y(0) : py1;
    cx.beginPath();
    cx.moveTo(pts[0][0], socle);
    for (let k = 0; k < nb; k++) cx.lineTo(pts[k][0], pts[k][1]);
    cx.lineTo(tete[0], socle);
    cx.closePath();
    const aire = cx.createLinearGradient(0, py0, 0, py1);
    aire.addColorStop(0, `${e.accent}55`);
    aire.addColorStop(1, `${e.accent}05`);
    cx.fillStyle = aire;
    cx.fill();

    const trait = () => {
      cx.beginPath();
      cx.moveTo(pts[0][0], pts[0][1]);
      for (let k = 1; k < nb; k++) cx.lineTo(pts[k][0], pts[k][1]);
      cx.stroke();
    };
    cx.lineJoin = 'round';
    cx.lineCap = 'round';
    cx.lineWidth = L * 0.0075;
    cx.strokeStyle = e.degrade ? degradeH(cx, px0, px1 - px0, [...e.degrade].reverse()) : e.accent;
    cx.shadowColor = e.accent;
    cx.shadowBlur = 26;
    trait();
    cx.shadowBlur = 0;
    if (sousZero) {
      // Sous zéro, le trait passe à l'ambre : c'est le creux qu'on est venu chercher.
      cx.save();
      cx.beginPath();
      cx.rect(px0 - 20, Y(0), px1 - px0 + 40, py1 - Y(0) + 30);
      cx.clip();
      cx.strokeStyle = e.app.alerteEncre;
      cx.shadowColor = e.app.alerteEncre;
      cx.shadowBlur = 22;
      trait();
      cx.restore();
    }
    // La tête du trait, tant qu'il avance.
    if (prog < 1) {
      cx.beginPath();
      cx.arc(tete[0], tete[1], L * 0.011, 0, Math.PI * 2);
      cx.fillStyle = '#FFFFFF';
      cx.shadowColor = e.accent;
      cx.shadowBlur = 30;
      cx.fill();
      cx.shadowBlur = 0;
    }
  }

  // Étiquettes de l'axe horizontal.
  if (sc.etiquettesX?.length) {
    cx.font = fonte(e.f.mono, L * 0.02);
    cx.fillStyle = e.douce;
    const ne = sc.etiquettesX.length;
    sc.etiquettesX.forEach((txt, k) => {
      const xx = px0 + ((px1 - px0) * k) / Math.max(1, ne - 1);
      const tw = cx.measureText(txt).width;
      cx.globalAlpha = aF * apparition(tl, 0.4 + k * 0.08, 0.4);
      cx.fillText(txt, Math.min(px1 - tw, Math.max(px0, xx - tw / 2)), py1 + etiq * 0.78);
    });
    cx.globalAlpha = aF;
  }

  // Le marqueur et sa note, quand le trait a passé le point.
  if (sc.repere) {
    const k = sc.repere.index;
    const tPoint = tTrace + dTrace * Math.min(1, (k / Math.max(1, sc.points.length - 1)) * 0.92 + 0.12);
    const am = (tl - tPoint) / 0.6;
    if (am > 0) {
      e.repere('scintille', tPoint, tPoint + 0.5);
      const mx = X(k);
      const my = Y(sc.points[k]);
      const col = sousZero && sc.points[k] < 0 ? e.app.alerteEncre : e.accent;
      // Anneaux qui s'élargissent, en boucle lente.
      for (let q = 0; q < 2; q++) {
        const cyc = ((tl - tPoint) * 0.7 + q * 0.5) % 1;
        cx.beginPath();
        cx.arc(mx, my, L * (0.014 + 0.05 * cyc), 0, Math.PI * 2);
        cx.strokeStyle = col;
        cx.globalAlpha = aF * (1 - cyc) * 0.7 * borne(am);
        cx.lineWidth = 3;
        cx.stroke();
      }
      cx.globalAlpha = aF;
      const r = L * 0.015 * ressort(am);
      cx.beginPath();
      cx.arc(mx, my, r, 0, Math.PI * 2);
      cx.fillStyle = col;
      cx.shadowColor = col;
      cx.shadowBlur = 24;
      cx.fill();
      cx.shadowBlur = 0;
      cx.beginPath();
      cx.arc(mx, my, r * 0.42, 0, Math.PI * 2);
      cx.fillStyle = '#FFFFFF';
      cx.fill();
      // La note, en pastille de verre, au-dessus du point si la place manque dessous.
      const tn = L * (e.vertical ? 0.03 : 0.024);
      const police = fonte(e.f.corps, tn);
      cx.font = police;
      // Avec une unité, la note porte la valeur du point.
      const noteR = sc.unite ? `${sc.repere.note} · ${nombre(sc.points[k])} ${sc.unite}` : sc.repere.note;
      const nw = cx.measureText(noteR).width + tn * 3;
      const dessus = my > (py0 + py1) / 2;
      const nx = Math.min(px1 - nw, Math.max(px0, mx - nw / 2));
      const ny = dessus ? my - tn * 3.6 : my + tn * 1.5;
      const an = sortie((tl - tPoint - 0.25) / 0.45);
      if (an > 0) {
        cx.save();
        cx.globalAlpha = aF * an;
        cx.translate(0, (1 - an) * (dessus ? 16 : -16));
        pastilleVerre(cx, nx, ny, noteR, police, tn, { teinte: 'rgba(0,0,0,0.5)', t: e.t, encre: e.encre, pastille: col, intensite: 1.15 });
        cx.restore();
      }
    }
  }
  cx.restore();

  // Sous le panneau : la légende, puis la mention d'exemple.
  let yl = yw + h + tLeg * 2;
  cx.font = fonte(e.f.corpsL, tLeg);
  cx.fillStyle = e.encre;
  legende.forEach((l, k) => {
    cx.globalAlpha = apparition(tl, tTrace + dTrace * 0.6 + k * 0.12, 0.5);
    cx.fillText(l, x, yl);
    yl += tLeg * 1.4;
  });
  if (sc.mention) mentionSous(cx, e, sc.mention, yl + tLeg * 0.3, tLeg * 0.66, apparition(tl, 0.5, 0.5));
  cx.globalAlpha = 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tableau de bord : indicateurs, graphique gradué, jauge
// ─────────────────────────────────────────────────────────────────────────────

/** Une graduation « ronde » : 1, 2, 2,5 ou 5 × 10ⁿ, pour quatre à six traits. */
function graduations(min: number, max: number, voulues = 5): number[] {
  const etendue = max - min || 1;
  const brut = etendue / voulues;
  const puissance = Math.pow(10, Math.floor(Math.log10(brut)));
  const pas = [1, 2, 2.5, 5, 10].map((k) => k * puissance).find((k) => k >= brut) ?? brut;
  const debut = Math.floor(min / pas) * pas;
  const out: number[] = [];
  for (let v = debut; v <= max + pas * 0.999; v += pas) out.push(Math.round(v * 1e6) / 1e6);
  return out;
}
function nombre(v: number): string {
  return v.toLocaleString('fr-FR').replace(/[\s  ]/g, ' ').replace('-', '−');
}

/** « 180 k€ » qui défile jusqu'à sa valeur : seule la partie chiffrée s'anime. */
function compter(valeur: string, p: number): string {
  const m = valeur.match(/^([^\d−-]*)([−-]?)(\d[\d\s  ]*(?:,\d+)?)(.*)$/);
  if (!m) return valeur;
  const decimales = (m[3].split(',')[1] ?? '').length;
  const cible = parseFloat(m[3].replace(/[\s  ]/g, '').replace(',', '.'));
  const v = cible * p;
  const txt = v.toLocaleString('fr-FR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales }).replace(/[\s  ]/g, ' ');
  return m[1] + m[2] + txt + m[4];
}

/**
 * Un tableau de bord qui se construit : les indicateurs s'allument, les axes
 * se graduent, les barres montent avec leur valeur, le repère désigne ce qu'il
 * faut lire, la jauge se remplit. Tout y est précis — graduations rondes,
 * unités, valeurs — et tout y est un EXEMPLE : la `mention` le dit à l'écran.
 */
export function sceneDashboard(cx: C2D, e: Env, sc: Extract<Scene, { type: 'dashboard' }>, tl: number, d: number, y0: number, y1: number) {
  const { L } = e;
  const x = e.marge;
  const w = e.largeurTexte;
  const tM = L * 0.022;
  const basH = tM * 2.8;
  const chrome = L * 0.058;
  const pad = L * 0.032;
  const nK = sc.indicateurs.length;
  const kh = L * 0.2;
  const jh = sc.jauge ? L * 0.21 : 0;
  const hMax = y1 - y0 - basH;
  const h = Math.min(hMax, chrome + pad * 2 + kh + pad + L * 0.98 + (jh ? jh + pad : 0));
  const yw = y0 + Math.max(0, (hMax - h) * 0.3);
  const aF = apparition(tl, 0.05, 0.55);
  const alerte = e.app.alerteEncre;
  const filet = 'rgba(255,255,255,0.13)';
  const veolt = e.marque === 'veolt';

  cx.save();
  cx.globalAlpha = aF;
  cx.translate(0, (1 - aF) * 50);
  verre(cx, x, yw, w, h, 22, { teinte: e.teinteVerre, t: e.t, flou: 28, lentille: 1.06 });
  for (let k = 0; k < 3; k++) {
    cx.beginPath();
    cx.arc(x + 30 + k * 22, yw + chrome / 2, 6.5, 0, Math.PI * 2);
    cx.fillStyle = k === 0 ? e.accent : 'rgba(255,255,255,0.2)';
    cx.fill();
  }
  cx.font = fonte(e.f.mono, L * 0.0185);
  espacer(cx, 1);
  cx.fillStyle = e.douce;
  cx.fillText(sc.fenetre, x + 106, yw + chrome / 2 + L * 0.0065);
  espacer(cx, 0);
  cx.fillStyle = filet;
  cx.fillRect(x, yw + chrome, w, 1.5);

  // ── Indicateurs ──
  const gap = L * 0.02;
  const kw = (w - pad * 2 - gap * (nK - 1)) / nK;
  const ky = yw + chrome + pad;
  sc.indicateurs.forEach((ind, k) => {
    const t0 = 0.4 + k * 0.22;
    const a = (tl - t0) / 0.5;
    if (a <= 0) return;
    e.repere('pop', t0 + 0.02);
    const kx = x + pad + k * (kw + gap);
    const col = ind.ton === 'alerte' ? alerte : e.accent;
    cx.save();
    cx.globalAlpha = aF * sortie(a);
    cx.translate(0, (1 - sortie(a)) * 18);
    cx.beginPath();
    cx.roundRect(kx, ky, kw, kh, 14);
    cx.fillStyle = 'rgba(255,255,255,0.045)';
    cx.fill();
    cx.strokeStyle = ind.ton === 'alerte' ? `${alerte}88` : filet;
    cx.lineWidth = 1.5;
    cx.stroke();
    // Le trait de couleur en tête de tuile : ce qui distingue l'indicateur d'alerte.
    cx.fillStyle = col;
    cx.fillRect(kx + 14, ky, kw * 0.28, 3);
    const tl2 = L * 0.0165;
    cx.font = fonte(e.f.mono, tl2);
    espacer(cx, 1.2);
    cx.fillStyle = e.douce;
    let lib = ind.libelle.toUpperCase();
    while (cx.measureText(lib).width > kw - 26 && lib.length > 4) lib = lib.slice(0, -1);
    cx.fillText(lib, kx + 14, ky + kh * 0.27);
    espacer(cx, 0);
    const tv = ajuster(cx, e.f.titre, ind.valeur, kw - 28, L * (veolt ? 0.088 : 0.064));
    cx.font = fonte(e.f.titre, tv);
    cx.fillStyle = ind.ton === 'alerte' ? alerte : e.encre;
    cx.fillText(compter(ind.valeur, sortie((tl - t0 - 0.1) / 0.9)), kx + 14, ky + kh * 0.27 + tv * (veolt ? 1.02 : 1.12));
    if (ind.note) {
      let tn = L * 0.0185;
      cx.font = fonte(e.f.corpsL, tn);
      while (cx.measureText(ind.note).width > kw - 26 && tn > L * 0.013) {
        tn *= 0.95;
        cx.font = fonte(e.f.corpsL, tn);
      }
      cx.fillStyle = ind.ton === 'alerte' ? alerte : e.douce;
      cx.fillText(ind.note, kx + 14, ky + kh - L * 0.022);
    }
    cx.restore();
  });

  // ── Graphique gradué ──
  const g = sc.graphique;
  const gy = ky + kh + pad;
  const gh = yw + h - pad - (jh ? jh + pad : 0) - gy;
  const gx = x + pad;
  const gw = w - pad * 2;
  const aG = apparition(tl, 0.85, 0.5);
  cx.globalAlpha = aF * aG;
  cx.beginPath();
  cx.roundRect(gx, gy, gw, gh, 14);
  cx.fillStyle = 'rgba(255,255,255,0.03)';
  cx.fill();
  cx.strokeStyle = filet;
  cx.lineWidth = 1.5;
  cx.stroke();
  const tT = L * 0.027;
  cx.font = fonte(e.f.corps, tT);
  cx.fillStyle = e.encre;
  cx.fillText(g.titre, gx + 18, gy + tT * 1.75);
  // Légende des séries, à droite du titre.
  const couleurs = [e.accent, 'rgba(255,255,255,0.42)', e.accent2];
  const tLg = L * 0.019;
  cx.font = fonte(e.f.corpsL, tLg);
  let lx = gx + gw - 18;
  [...g.series].reverse().forEach((s2, kr) => {
    const k = g.series.length - 1 - kr;
    const tw = cx.measureText(s2.nom).width;
    lx -= tw;
    cx.fillStyle = e.douce;
    cx.fillText(s2.nom, lx, gy + tT * 3.1);
    lx -= tLg * 1.1;
    cx.fillStyle = couleurs[k % couleurs.length];
    cx.fillRect(lx, gy + tT * 3.1 - tLg * 0.72, tLg * 0.7, tLg * 0.7);
    lx -= tLg * 1.3;
  });
  if (g.unite) {
    cx.font = fonte(e.f.mono, L * 0.017);
    espacer(cx, 1.2);
    cx.fillStyle = e.douce;
    cx.fillText(`EN ${g.unite.toUpperCase()}`, gx + 18, gy + tT * 3.1);
    espacer(cx, 0);
  }

  const toutes = g.series.flatMap((s2) => s2.valeurs);
  const vmin = Math.min(0, ...toutes);
  const vmax = Math.max(0, ...toutes);
  // De l'air au-dessus des barres : la note du repère s'y pose sans rien couvrir.
  const ticks = graduations(vmin, vmax * (g.repere ? 1.38 : 1.1));
  const tmin = ticks[0];
  const tmax = ticks[ticks.length - 1];
  const tAxe = L * 0.0175;
  cx.font = fonte(e.f.mono, tAxe);
  const axeW = Math.max(...ticks.map((v) => cx.measureText(nombre(v)).width)) + 16;
  const px0 = gx + 18 + axeW;
  const px1 = gx + gw - 22;
  const py0 = gy + tT * 4.4;
  const py1 = gy + gh - L * 0.062;
  const Y = (v: number) => py1 - ((v - tmin) / (tmax - tmin || 1)) * (py1 - py0);
  // Graduations : un trait fin par valeur ronde, le zéro en plein.
  ticks.forEach((v, k) => {
    const at = apparition(tl, 0.95 + k * 0.05, 0.35);
    cx.globalAlpha = aF * aG * at;
    cx.fillStyle = e.douce;
    cx.font = fonte(e.f.mono, tAxe);
    const lab = nombre(v);
    cx.fillText(lab, px0 - 12 - cx.measureText(lab).width, Y(v) + tAxe * 0.35);
    if (v === 0) {
      cx.fillStyle = 'rgba(255,255,255,0.5)';
      cx.fillRect(px0, Y(v) - 1, (px1 - px0) * at, 2);
    } else {
      cx.save();
      cx.setLineDash([5, 8]);
      cx.strokeStyle = 'rgba(255,255,255,0.14)';
      cx.lineWidth = 1.2;
      cx.beginPath();
      cx.moveTo(px0, Y(v));
      cx.lineTo(px0 + (px1 - px0) * at, Y(v));
      cx.stroke();
      cx.restore();
    }
    // Le petit trait de graduation, côté axe.
    cx.fillStyle = 'rgba(255,255,255,0.4)';
    cx.fillRect(px0 - 6, Y(v) - 1, 6, 2);
  });
  cx.globalAlpha = aF * aG;
  cx.fillStyle = 'rgba(255,255,255,0.4)';
  cx.fillRect(px0 - 1, py0 - 6, 2, py1 - py0 + 6);

  const nE = g.etiquettes.length;
  const nS = g.series.length;
  const pasX = (px1 - px0) / nE;
  const tDeb = 1.25;
  const tVal = L * 0.021;
  const centreX = (j: number) => px0 + pasX * (j + 0.5);
  e.repere('compteur', tDeb, tDeb + 0.7 + nE * 0.12);
  g.etiquettes.forEach((et, j) => {
    cx.font = fonte(e.f.mono, tAxe);
    cx.fillStyle = e.douce;
    cx.globalAlpha = aF * aG * apparition(tl, 1.0 + j * 0.06, 0.35);
    cx.fillText(et, centreX(j) - cx.measureText(et).width / 2, py1 + L * 0.036);
  });
  if (g.type === 'ligne') {
    // Lignes : le trait avance, chaque point se pose avec sa valeur.
    g.series.forEach((s2, k) => {
      const col = couleurs[k % couleurs.length];
      const pts = s2.valeurs.map((v, j) => [centreX(j), Y(v)] as [number, number]);
      const prog = douce((tl - tDeb - k * 0.2) / 1.6);
      if (prog <= 0) return;
      const lisse = echantillonner(pts, 14);
      const nb = Math.max(2, Math.round(lisse.length * prog));
      cx.globalAlpha = aF * aG;
      cx.beginPath();
      cx.moveTo(lisse[0][0], lisse[0][1]);
      for (let q = 1; q < nb; q++) cx.lineTo(lisse[q][0], lisse[q][1]);
      cx.lineWidth = L * 0.006;
      cx.lineJoin = 'round';
      cx.lineCap = 'round';
      cx.strokeStyle = col;
      if (k === 0) {
        cx.shadowColor = e.accent;
        cx.shadowBlur = 20;
      }
      cx.stroke();
      cx.shadowBlur = 0;
      pts.forEach((p, j) => {
        const ap = (prog * (pts.length - 1) - j + 0.15) / 0.5;
        if (ap <= 0) return;
        const neg = s2.valeurs[j] < 0;
        cx.globalAlpha = aF * aG * sortie(ap);
        cx.beginPath();
        cx.arc(p[0], p[1], L * 0.0085 * ressort(ap), 0, Math.PI * 2);
        cx.fillStyle = neg ? alerte : col;
        cx.fill();
        cx.beginPath();
        cx.arc(p[0], p[1], L * 0.0035, 0, Math.PI * 2);
        cx.fillStyle = e.fond;
        cx.fill();
        if (k === 0) {
          cx.font = fonte(e.f.corps, tVal);
          cx.fillStyle = neg ? alerte : e.encre;
          const lab = nombre(s2.valeurs[j]);
          cx.fillText(lab, p[0] - cx.measureText(lab).width / 2, p[1] + (neg ? tVal * 1.7 : -tVal * 0.8));
        }
      });
    });
  } else {
    // Barres groupées : elles montent depuis le zéro, leur valeur se pose dessus.
    const lb = Math.min(pasX * 0.34, L * 0.07);
    const eb = lb * 0.14;
    g.series.forEach((s2, k) => {
      s2.valeurs.forEach((v, j) => {
        const t0 = tDeb + j * 0.14 + k * 0.1;
        const p = ressort((tl - t0) / 0.9);
        if (tl <= t0) return;
        const bx = centreX(j) - (nS * lb + (nS - 1) * eb) / 2 + k * (lb + eb);
        const yz = Y(0);
        const yv = Y(v * p);
        const neg = v < 0;
        cx.globalAlpha = aF * aG;
        cx.beginPath();
        cx.roundRect(bx, Math.min(yz, yv), lb, Math.max(2, Math.abs(yz - yv)), neg ? [0, 0, 6, 6] : [6, 6, 0, 0]);
        if (neg) cx.fillStyle = alerte;
        else if (k === 0) {
          const gr = cx.createLinearGradient(0, yv, 0, yz);
          const cols = e.degrade ?? [e.accent, `${e.accent}99`];
          gr.addColorStop(0, cols[cols.length - 1]);
          gr.addColorStop(1, cols[0]);
          cx.fillStyle = gr;
          cx.shadowColor = e.accent;
          cx.shadowBlur = 16;
        } else cx.fillStyle = couleurs[k % couleurs.length];
        cx.fill();
        cx.shadowBlur = 0;
        const av = apparition(tl, t0 + 0.45, 0.35);
        if (av > 0) {
          cx.globalAlpha = aF * aG * av;
          cx.font = fonte(e.f.corps, tVal * (k === 0 ? 1 : 0.9));
          cx.fillStyle = neg ? alerte : k === 0 ? e.encre : e.douce;
          const lab = nombre(v);
          cx.fillText(lab, bx + lb / 2 - cx.measureText(lab).width / 2, neg ? yv + tVal * 1.3 : yv - tVal * 0.5);
        }
      });
    });
  }
  // Le repère : un cadre autour de ce qu'il faut lire, et sa note.
  if (g.repere) {
    const tR = tDeb + nE * 0.14 + 1.1;
    const ar = (tl - tR) / 0.5;
    if (ar > 0) {
      e.repere('scintille', tR, tR + 0.5);
      const j = g.repere.index;
      const col = g.repere.ton === 'alerte' ? alerte : e.accent2;
      cx.globalAlpha = aF * aG * sortie(ar);
      cx.beginPath();
      cx.roundRect(centreX(j) - pasX * 0.44, py0 - 4, pasX * 0.88, py1 - py0 + L * 0.05, 10);
      cx.setLineDash([9, 7]);
      cx.lineDashOffset = -tl * 14;
      cx.strokeStyle = col;
      cx.lineWidth = 2.5;
      cx.stroke();
      cx.setLineDash([]);
      const tn = L * 0.024;
      const police = fonte(e.f.corps, tn);
      cx.font = police;
      const nw = cx.measureText(g.repere.note).width + tn * 3;
      const nx = Math.min(px1 - nw + 10, Math.max(gx + 10, centreX(j) - nw / 2));
      cx.save();
      cx.translate(0, (1 - sortie(ar)) * 14);
      pastilleVerre(cx, nx, py0 - tn * 0.2, g.repere.note, police, tn, { teinte: 'rgba(0,0,0,0.5)', t: e.t, encre: e.encre, pastille: col, intensite: 1.15 });
      cx.restore();
    }
  }

  // ── Jauge ──
  if (sc.jauge) {
    const j = sc.jauge;
    const jy = yw + h - pad - jh;
    const tJ = Math.max(1.6, d * 0.5);
    const aj = apparition(tl, tJ, 0.5);
    cx.globalAlpha = aF * aj;
    cx.beginPath();
    cx.roundRect(gx, jy, gw, jh, 14);
    cx.fillStyle = 'rgba(255,255,255,0.03)';
    cx.fill();
    cx.strokeStyle = filet;
    cx.lineWidth = 1.5;
    cx.stroke();
    const r = jh * 0.33;
    const jcx = gx + pad + r + 6;
    const jcy = jy + jh / 2;
    const p = douce((tl - tJ - 0.15) / 1.1) * j.part;
    if (aj > 0) e.repere('compteur', tJ + 0.15, tJ + 1.2);
    cx.lineWidth = r * 0.3;
    cx.lineCap = 'round';
    cx.beginPath();
    cx.arc(jcx, jcy, r, 0, Math.PI * 2);
    cx.strokeStyle = 'rgba(255,255,255,0.12)';
    cx.stroke();
    cx.beginPath();
    cx.arc(jcx, jcy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p);
    cx.strokeStyle = e.degrade ? degradeH(cx, jcx - r, r * 2, e.degrade) : e.accent;
    cx.shadowColor = e.accent;
    cx.shadowBlur = 18;
    cx.stroke();
    cx.shadowBlur = 0;
    const pct = `${Math.round(p * 100)} %`;
    cx.font = fonte(e.f.corps, r * 0.5);
    cx.fillStyle = e.encre;
    cx.fillText(pct, jcx - cx.measureText(pct).width / 2, jcy + r * 0.18);
    const tx = jcx + r + pad * 1.2;
    const tLib = L * 0.029;
    cx.font = fonte(e.f.corps, tLib);
    cx.fillStyle = e.encre;
    cx.fillText(j.libelle, tx, jcy - tLib * 0.25);
    let tt2 = L * 0.022;
    cx.font = fonte(e.f.corpsL, tt2);
    while (cx.measureText(j.texte).width > gx + gw - tx - 14 && tt2 > L * 0.015) {
      tt2 *= 0.95;
      cx.font = fonte(e.f.corpsL, tt2);
    }
    cx.fillStyle = e.douce;
    cx.fillText(j.texte, tx, jcy + tLib * 0.95);
  }
  cx.restore();
  mentionSous(cx, e, sc.mention, yw + h + tM * 2.1, tM, apparition(tl, 0.5, 0.5));
  cx.globalAlpha = 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// Parcours : une lumière descend la ligne, chaque étape s'allume
// ─────────────────────────────────────────────────────────────────────────────

export function sceneParcours(cx: C2D, e: Env, sc: Extract<Scene, { type: 'parcours' }>, tl: number, d: number, y0: number, y1: number) {
  const { L } = e;
  const n = sc.etapes.length;
  // Peu d'étapes : chacune prend de la place et du corps ; beaucoup : elles se serrent.
  const pasY = Math.min(L * (n <= 4 ? 0.3 : 0.2), (y1 - y0) / n);
  const hauteur = pasY * n;
  const yb = y0 + Math.max(0, (y1 - y0 - hauteur) * 0.38);
  const r = L * (n <= 4 ? 0.03 : 0.024);
  const xl = e.marge + r + L * 0.006;
  const xt = xl + r + L * 0.045;
  const largeur = e.marge + e.largeurTexte - xt - L * 0.02;
  // Le corps des titres : le plus grand qui laisse chaque titre tenir sur deux lignes au plus.
  let tt = Math.min(L * (e.vertical ? (n <= 4 ? 0.064 : 0.052) : 0.036), pasY * (n <= 4 ? 0.26 : 0.36));
  let titres: string[][] = [];
  for (let essai = 0; essai < 8; essai++) {
    cx.font = fonte(e.f.corps, tt);
    titres = sc.etapes.map((et) => e.lignes(cx, et.titre, largeur));
    if (titres.every((ls) => ls.length <= (n <= 4 ? 2 : 1))) break;
    tt *= 0.93;
  }
  const td = tt * 0.66;
  const debut = 0.4;
  const course = Math.max(1.2, d - debut - 1.3);
  const instant = (k: number) => debut + (course * k) / Math.max(1, n - 1);
  const p = borne((tl - debut) / course) * (n - 1);
  const yN = (k: number) => yb + pasY * (k + 0.5);

  // Le rail éteint, puis sa partie allumée jusqu'à la tête de lumière.
  cx.fillStyle = 'rgba(255,255,255,0.13)';
  cx.fillRect(xl - 1.5, yN(0), 3, yN(n - 1) - yN(0));
  const yTete = yN(0) + (yN(n - 1) - yN(0)) * (p / Math.max(1, n - 1));
  if (tl > debut) {
    const g = cx.createLinearGradient(0, yN(0), 0, Math.max(yN(0) + 1, yTete));
    const cols = e.degrade ?? [e.accent, e.accent];
    cols.forEach((c, k) => g.addColorStop(cols.length === 1 ? 0 : k / (cols.length - 1), c));
    cx.fillStyle = g;
    cx.shadowColor = e.accent;
    cx.shadowBlur = 18;
    cx.fillRect(xl - 2.5, yN(0), 5, Math.max(0, yTete - yN(0)));
    cx.shadowBlur = 0;
    if (p < n - 1) {
      cx.beginPath();
      cx.arc(xl, yTete, L * 0.012, 0, Math.PI * 2);
      cx.fillStyle = '#FFFFFF';
      cx.shadowColor = e.accent;
      cx.shadowBlur = 34;
      cx.fill();
      cx.shadowBlur = 0;
    }
  }

  sc.etapes.forEach((et, k) => {
    const t0 = instant(k);
    const a = sortie((tl - t0) / 0.42);
    const y = yN(k);
    // Le nœud : anneau éteint, puis plein quand la lumière l'atteint.
    cx.beginPath();
    cx.arc(xl, y, r, 0, Math.PI * 2);
    cx.fillStyle = e.fond;
    cx.fill();
    cx.strokeStyle = a > 0 ? e.accent : 'rgba(255,255,255,0.28)';
    cx.lineWidth = 3;
    cx.stroke();
    if (a > 0) {
      e.repere(et.fort ? 'coche' : 'pop', t0 + 0.02);
      const rr = r * 0.62 * ressort((tl - t0) / 0.5);
      cx.beginPath();
      cx.arc(xl, y, rr, 0, Math.PI * 2);
      cx.fillStyle = e.degrade ? degradeH(cx, xl - r, r * 2, e.degrade) : e.accent;
      cx.shadowColor = e.accent;
      cx.shadowBlur = 20;
      cx.fill();
      cx.shadowBlur = 0;
    }
    if (a <= 0) {
      // Avant son tour, l'étape se devine : le numéro seul, éteint.
      cx.font = fonte(e.f.mono, td * 0.9);
      cx.fillStyle = 'rgba(255,255,255,0.22)';
      cx.fillText(String(k + 1).padStart(2, '0'), xt, y + td * 0.32);
      return;
    }
    const ls = titres[k];
    const hTitre = ls.length * tt * 1.16;
    const hBloc = hTitre + (et.detail ? td * 1.5 : 0);
    cx.save();
    cx.globalAlpha = a;
    cx.translate((1 - a) * 34, 0);
    if (et.fort) {
      // L'étape qu'on souligne : une carte de verre derrière elle, bordée aux couleurs de la marque.
      const ch = Math.min(pasY * 0.9, hBloc + tt * 1.1);
      verre(cx, xt - L * 0.024, y - ch / 2, largeur + L * 0.044, ch, 16, { teinte: e.teinteVerre, t: e.t + k, flou: 22, bordure: e.degrade ?? [e.accent2], ombre: false });
    }
    let yy = y - hBloc / 2 + tt * 0.86;
    cx.font = fonte(e.f.corps, tt);
    cx.fillStyle = e.encre;
    for (const l of ls) {
      cx.fillText(l, xt, yy);
      yy += tt * 1.16;
    }
    if (et.detail) {
      // Le détail : réduit jusqu'à tenir, jamais coupé.
      let t2 = td;
      cx.font = fonte(e.f.corpsL, t2);
      while (cx.measureText(et.detail).width > largeur && t2 > td * 0.7) {
        t2 *= 0.95;
        cx.font = fonte(e.f.corpsL, t2);
      }
      cx.fillStyle = et.fort ? e.accent2 : e.douce;
      cx.fillText(et.detail, xt, yy + td * 0.1);
    }
    cx.restore();
  });
  cx.globalAlpha = 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// Rapport : il défile, s'arrête, et ne garde que les phrases qui comptent
// ─────────────────────────────────────────────────────────────────────────────

export function sceneRapport(cx: C2D, e: Env, sc: Extract<Scene, { type: 'rapport' }>, tl: number, d: number, y0: number, y1: number) {
  const { L } = e;
  const tMention = L * 0.022;
  const basH = sc.mention ? tMention * 2.6 : 0;
  const w = e.largeurTexte * 0.94;
  const h = Math.min(y1 - y0 - basH, w * 1.36);
  const x = (L - w) / 2;
  const y = y0 + Math.max(0, (y1 - y0 - basH - h) * 0.3);
  const aF = apparition(tl, 0.05, 0.6);
  const pages = sc.pages ?? 40;
  const n = sc.phrases.length;

  // Trois temps : défilement rapide, arrêt, puis les phrases une à une.
  const tDefil = 0.35;
  const dDefil = Math.min(2.2, d * 0.24);
  const tArret = tDefil + dDefil;
  const pasP = Math.max(0.9, (d - tArret - 1.2) / n);
  const pd = borne((tl - tDefil) / dDefil);
  // Vitesse de défilement : forte, puis qui s'éteint (la page « se pose »).
  const avance = 1 - Math.pow(1 - pd, 3);
  const vitesse = pd < 1 ? Math.pow(1 - pd, 2) : 0;
  e.repere('defile', tDefil, tArret);
  e.repere('papier', tArret + 0.02);

  cx.save();
  cx.globalAlpha = aF;
  cx.translate(L / 2, y + h / 2 + (1 - aF) * 70);
  cx.rotate(-0.012 + (1 - aF) * -0.03);
  cx.translate(-L / 2, -(y + h / 2));
  // La feuille.
  cx.shadowColor = 'rgba(0,0,0,0.55)';
  cx.shadowBlur = 70;
  cx.shadowOffsetY = 30;
  cx.beginPath();
  cx.roundRect(x, y, w, h, 14);
  cx.fillStyle = '#F4F1EA';
  cx.fill();
  cx.shadowColor = 'transparent';
  cx.shadowBlur = 0;
  cx.shadowOffsetY = 0;

  const pad = w * 0.075;
  const enTete = w * 0.11;
  // En-tête : le titre de la pièce et le compteur de pages.
  cx.font = fonte(e.f.mono, w * 0.024);
  espacer(cx, 1.5);
  cx.fillStyle = '#6B6772';
  cx.fillText(sc.titre.toUpperCase(), x + pad, y + enTete * 0.62);
  const page = Math.max(1, Math.round(1 + (pages - 1) * avance * 0.3));
  const cpt = `P. ${String(page).padStart(2, '0')} / ${pages}`;
  const cw = cx.measureText(cpt).width;
  cx.fillText(cpt, x + w - pad - cw, y + enTete * 0.62);
  espacer(cx, 0);
  cx.fillStyle = '#D9D4CA';
  cx.fillRect(x + pad, y + enTete * 0.86, w - pad * 2, 1.5);

  // Le corps : des lignes « muettes » (le texte qu'on ne lit pas), et les
  // emplacements des phrases qui comptent.
  const zy0 = y + enTete + pad * 0.5;
  const zy1 = y + h - pad;
  const tp = w * (e.vertical ? 0.041 : 0.034);
  cx.font = fonte(e.f.corps, tp);
  const blocs = sc.phrases.map((ph) => e.lignes(cx, ph.texte, w - pad * 2 - tp * 0.5));
  const hBloc = (k: number) => blocs[k].length * tp * 1.36 + tp * 1.75;
  const hPhrases = blocs.reduce((s, _, k) => s + hBloc(k), 0);
  const libre = zy1 - zy0 - hPhrases;
  const hTrame = Math.max(tp * 1.2, libre / (n + 1));
  const lh = tp * 0.92;

  const trame = (yt: number, haut: number, graine: number, alpha: number, decal: number) => {
    // Lignes grises de largeur variable ; pendant le défilement elles filent vers le haut.
    const nbl = Math.floor(haut / lh);
    for (let q = 0; q < nbl; q++) {
      const yy = yt + q * lh + lh * 0.3;
      const lw = (w - pad * 2) * (hasard(graine * 7 + q + Math.floor(decal)) > 0.82 ? 0.45 + 0.3 * hasard(q + graine) : 0.86 + 0.14 * hasard(q * 3 + graine));
      cx.globalAlpha = aF * alpha;
      cx.fillStyle = '#C5C0B6';
      cx.fillRect(x + pad, yy, lw, lh * (0.24 + 0.5 * vitesse));
    }
  };

  cx.save();
  cx.beginPath();
  cx.rect(x, zy0 - 4, w, zy1 - zy0 + 8);
  cx.clip();
  if (pd < 1) {
    // Défilement : toute la page n'est que trame, étirée par la vitesse.
    const decal = avance * pages * 3;
    cx.translate(0, -((decal * lh * 6) % (lh * 2)));
    trame(zy0 - lh * 2, zy1 - zy0 + lh * 4, 1, 0.9, decal);
  } else {
    const estompe = 1 - 0.62 * sortie((tl - tArret - pasP * n) / 0.8);
    let yy = zy0;
    for (let k = 0; k <= n; k++) {
      trame(yy, hTrame - lh * 0.6, k + 11, estompe, 0);
      yy += hTrame;
      if (k === n) break;
      const t0 = tArret + 0.25 + k * pasP;
      const a = (tl - t0) / 0.5;
      const ls = blocs[k];
      // Avant son tour : la phrase est une trame comme les autres.
      if (a <= 0) {
        trame(yy, hBloc(k) - lh * 0.4, k + 31, 1, 0);
      } else {
        e.repere('scintille', t0, t0 + 0.5);
        e.repere('pop', t0 + 0.55);
        const bal = sortie(a);
        ls.forEach((l, q) => {
          const ly = yy + tp * 1.05 + q * tp * 1.36;
          cx.font = fonte(e.f.corps, tp);
          const lw = cx.measureText(l).width;
          // Le surligneur passe, ligne après ligne.
          const pq = sortie(a * 1.2 - q * 0.22);
          cx.globalAlpha = aF * 0.55;
          cx.fillStyle = '#FFD46B';
          cx.fillRect(x + pad - tp * 0.2, ly - tp * 0.92, (lw + tp * 0.4) * pq, tp * 1.24);
          cx.globalAlpha = aF * bal;
          cx.fillStyle = '#1B1820';
          cx.fillText(l, x + pad, ly);
        });
        // Ce que la phrase commande : la note de marge, à l'encre de la marque.
        const an = sortie((tl - t0 - 0.5) / 0.45);
        if (an > 0) {
          const ny = yy + ls.length * tp * 1.36 + tp * 0.95;
          cx.globalAlpha = aF * an;
          cx.font = fonte(e.f.mono, tp * 0.62);
          espacer(cx, 1);
          cx.fillStyle = e.app.papier ?? '#7B2D3E';
          cx.fillText(`→ ${sc.phrases[k].note.toUpperCase()}`, x + pad + (1 - an) * 16, ny);
          espacer(cx, 0);
        }
      }
      yy += hBloc(k);
    }
  }
  cx.restore();
  cx.restore();

  if (sc.mention) mentionSous(cx, e, sc.mention, y + h + tMention * 2.2, tMention, apparition(tl, 0.5, 0.5));
  cx.globalAlpha = 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// Vitrine : un film montré dans son cadre
// ─────────────────────────────────────────────────────────────────────────────

export function sceneVitrine(
  cx: C2D,
  e: Env,
  sc: Extract<Scene, { type: 'vitrine' }>,
  film: HTMLVideoElement | HTMLImageElement | null,
  tl: number,
  y0: number,
  y1: number,
) {
  const { L } = e;
  const tM = L * 0.022;
  const basH = sc.mention ? tM * 2.8 : 0;
  if (!film) {
    if (sc.mention) mentionSous(cx, e, sc.mention, y1 - tM * 0.4, tM, apparition(tl, 0.5, 0.5));
    return;
  }
  const lf = film instanceof HTMLVideoElement ? film.videoWidth : film.naturalWidth;
  const hf = film instanceof HTMLVideoElement ? film.videoHeight : film.naturalHeight;
  const ratio = lf && hf ? lf / hf : 9 / 16;
  const h = Math.min(y1 - y0 - basH, (e.largeurTexte * 0.9) / ratio);
  const w = h * ratio;
  const x = (L - w) / 2;
  const y = y0 + Math.max(0, (y1 - y0 - basH - h) * 0.4);
  // Le cadre est déjà en route à la première image : le film se voit dès l'ouverture.
  const a = (tl + 0.22) / 0.7;
  const p = sortie(a * 1.3);
  const s = 0.9 + 0.1 * ressort(a);
  const r = w * 0.055;
  e.repere('whoosh', 0.05);
  cx.save();
  cx.globalAlpha = p;
  // Le cadre flotte à peine, et arrive légèrement penché.
  cx.translate(L / 2, y + h / 2 + Math.sin(tl * 0.9) * 5 + (1 - p) * 60);
  cx.rotate((1 - p) * -0.03 + Math.sin(tl * 0.5) * 0.004);
  cx.scale(s, s);
  cx.translate(-L / 2, -(y + h / 2));
  // Lueur de marque derrière le cadre, puis l'ombre portée.
  cx.save();
  cx.globalCompositeOperation = 'lighter';
  const halo = cx.createRadialGradient(L / 2, y + h / 2, w * 0.2, L / 2, y + h / 2, h * 0.75);
  halo.addColorStop(0, `${e.accent}3A`);
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  cx.fillStyle = halo;
  cx.fillRect(x - w, y - h * 0.3, w * 3, h * 1.6);
  cx.restore();
  cx.shadowColor = 'rgba(0,0,0,0.6)';
  cx.shadowBlur = 80;
  cx.shadowOffsetY = 34;
  cx.beginPath();
  cx.roundRect(x, y, w, h, r);
  cx.fillStyle = '#000';
  cx.fill();
  cx.shadowColor = 'transparent';
  cx.shadowBlur = 0;
  cx.shadowOffsetY = 0;
  // Le film, avec une poussée lente à l'intérieur du cadre.
  cx.save();
  cx.beginPath();
  cx.roundRect(x, y, w, h, r);
  cx.clip();
  const z = 1.02 + 0.03 * borne(tl / 6);
  cx.drawImage(film, x - (w * (z - 1)) / 2, y - (h * (z - 1)) / 2, w * z, h * z);
  // Reflet du verre, en biais, qui passe une fois.
  const pr = (tl - 0.6) / 1.4;
  if (pr > 0 && pr < 1) {
    const xr = x - w * 0.6 + w * 2.2 * pr;
    const g = cx.createLinearGradient(xr, y, xr + w * 0.5, y + h * 0.5);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.13)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    cx.fillStyle = g;
    cx.fillRect(x, y, w, h);
  }
  cx.restore();
  // Liseré : la lumière en haut à gauche, la couleur de la marque en bas à droite.
  cx.beginPath();
  cx.roundRect(x, y, w, h, r);
  const lis = cx.createLinearGradient(x, y, x + w, y + h);
  lis.addColorStop(0, 'rgba(255,255,255,0.75)');
  lis.addColorStop(0.4, 'rgba(255,255,255,0.12)');
  lis.addColorStop(1, e.degrade ? e.degrade[0] : e.accent);
  cx.strokeStyle = lis;
  cx.lineWidth = 3;
  cx.stroke();
  // L'étiquette, en pastille de verre posée sur le coin du cadre.
  if (sc.etiquette) {
    const ae = sortie((tl - 0.7) / 0.45);
    if (ae > 0) {
      e.repere('pop', 0.72);
      const te = L * 0.022;
      cx.globalAlpha = p * ae;
      const f = e.f.mono;
      espacer(cx, 1.5);
      pastilleVerre(cx, x + w * 0.05, y + w * 0.05 + (1 - ae) * -12, sc.etiquette.toUpperCase(), fonte(f, te), te, { teinte: 'rgba(0,0,0,0.45)', t: e.t, encre: '#FFFFFF', pastille: e.accent, intensite: 1.1 });
      espacer(cx, 0);
    }
  }
  cx.restore();
  if (sc.mention) mentionSous(cx, e, sc.mention, y1 - tM * 0.4, tM, apparition(tl, 0.5, 0.5));
  cx.globalAlpha = 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// Objet 3D : un vrai rendu, pas une illustration
// ─────────────────────────────────────────────────────────────────────────────

const COLORIS_DEFAUT: Record<'veolt' | 'magistria', string[]> = {
  veolt: ['#B600A8', '#7621B0', '#BE4C00'],
  magistria: ['#3CC8FF', '#E0B85A', '#7FB7D9'],
};

/** Angle et bascule des six prises de vue de la grille. */
const VUES: Array<[number, number]> = [
  [0.12, 0.1],
  [0.78, 0.12],
  [0.5, 0.5],
  [1.5, 0.08],
  [3.3, 0.12],
  [-0.55, 0.26],
];

/**
 * Le reflet de l'objet sur le sol du studio : son image retournée sous le
 * pied, qui s'efface en descendant. C'est lui, avec l'ombre de contact, qui
 * pose l'objet au lieu de le laisser flotter.
 */
let toileReflet: HTMLCanvasElement | null = null;
function refletSol(cx: C2D, img: HTMLCanvasElement, x: number, y: number, cote: number, pied: number, force: number) {
  if (force <= 0) return;
  const n = img.width;
  if (!toileReflet) toileReflet = document.createElement('canvas');
  if (toileReflet.width !== n || toileReflet.height !== n) {
    toileReflet.width = n;
    toileReflet.height = n;
  }
  const r = toileReflet.getContext('2d')!;
  r.globalCompositeOperation = 'source-over';
  r.clearRect(0, 0, n, n);
  // L'image retournée autour de la ligne du pied.
  r.save();
  r.translate(0, 2 * pied * n);
  r.scale(1, -1);
  r.drawImage(img, 0, 0);
  r.restore();
  // Elle ne garde que le haut du reflet, en fondu.
  r.globalCompositeOperation = 'destination-in';
  const g = r.createLinearGradient(0, pied * n, 0, pied * n + n * 0.26);
  g.addColorStop(0, 'rgba(0,0,0,0.55)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  r.fillStyle = g;
  r.fillRect(0, 0, n, n);
  cx.save();
  cx.globalAlpha *= force;
  cx.drawImage(toileReflet, x, y, cote, cote);
  cx.restore();
}

/** L'ombre de contact sous l'objet : sans elle il flotte, et le rendu fait « maquette ». */
function ombreSol(cx: C2D, x: number, y: number, r: number, a: number) {
  cx.save();
  cx.translate(x, y);
  cx.scale(1, 0.16);
  const g = cx.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, `rgba(0,0,0,${0.62 * a})`);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  cx.fillStyle = g;
  cx.fillRect(-r, -r, r * 2, r * 2);
  cx.restore();
}

export function sceneObjet3D(
  cx: C2D,
  e: Env,
  sc: Extract<Scene, { type: 'objet3d' }>,
  moteur: MoteurObjet | null,
  tl: number,
  d: number,
  y0: number,
  y1: number,
) {
  const { L } = e;
  const cols = sc.coloris?.length ? sc.coloris : COLORIS_DEFAUT[e.marque];
  const tM = L * 0.022;
  const basH = sc.mention ? tM * 2.6 : 0;
  const zone = y1 - y0 - basH;
  const mention = () => {
    if (sc.mention) mentionSous(cx, e, sc.mention, y1 - tM * 0.4, tM, apparition(tl, 0.5, 0.5));
  };
  if (!moteur) {
    // Pas de WebGL : la scène ne casse pas, elle le dit.
    cx.font = fonte(e.f.corpsL, L * 0.03);
    cx.fillStyle = e.douce;
    cx.fillText('Rendu 3D indisponible dans ce navigateur.', e.marge, y0 + zone / 2);
    return mention();
  }

  if (sc.mode === 'grille') {
    // Les déclinaisons : six cartes de verre, chacune son coloris et son angle.
    const nb = 6;
    const colonnes = 2;
    const gap = L * 0.026;
    const cw = (e.largeurTexte - gap * (colonnes - 1)) / colonnes;
    const rangs = Math.ceil(nb / colonnes);
    const ch = Math.min(cw * 1.02, (zone - gap * (rangs - 1)) / rangs);
    const yb = y0 + Math.max(0, (zone - (ch * rangs + gap * (rangs - 1))) * 0.35);
    const pas = Math.min(0.55, Math.max(0.22, (d - 2.2) / nb));
    for (let k = 0; k < nb; k++) {
      const t0 = 0.3 + k * pas;
      const a = (tl - t0) / 0.55;
      if (a <= 0) continue;
      e.repere('pop', t0 + 0.03);
      const x = e.marge + (k % colonnes) * (cw + gap);
      const y = yb + Math.floor(k / colonnes) * (ch + gap);
      const s = 0.82 + 0.18 * ressort(a);
      cx.save();
      cx.globalAlpha = sortie(a * 1.4);
      cx.translate(x + cw / 2, y + ch / 2);
      cx.scale(s, s);
      cx.translate(-(x + cw / 2), -(y + ch / 2));
      verre(cx, x, y, cw, ch, 20, { teinte: e.teinteVerre, t: e.t + k * 0.7, flou: 22 });
      const taille = Math.min(cw, ch) * 0.98;
      // Six cadrages nommés (face, trois-quarts, plongée, profil, dos, détail) : l'objet
      // y oscille à peine — ce sont des prises de vue, pas un manège.
      const [ang, inc] = VUES[k % VUES.length];
      const img = moteur.rendre({ t: e.t, couleur: cols[k % cols.length], angle: ang + Math.sin(tl * 0.8 + k) * 0.1, inclinaison: inc, fil: 0, leger: true });
      const iy = y + ch / 2 - taille / 2 - ch * 0.03;
      ombreSol(cx, x + cw / 2, iy + taille * moteur.pied, taille * 0.3, 1);
      cx.drawImage(img, x + cw / 2 - taille / 2, iy, taille, taille);
      const lib = sc.etiquettes?.[k];
      if (lib) {
        cx.font = fonte(e.f.mono, L * 0.018);
        espacer(cx, 1.5);
        cx.fillStyle = e.douce;
        cx.fillText(lib.toUpperCase(), x + L * 0.022, y + L * 0.036);
        espacer(cx, 0);
      }
      cx.restore();
    }
    return mention();
  }

  // La place des pastilles de coloris et des étiquettes est réservée sous l'objet.
  const pied = L * 0.17;
  const taille = Math.min(e.largeurTexte * 1.16, zone - pied);
  const cxo = L / 2;
  const cyo = y0 + (zone - pied) * 0.5;
  const aE = apparition(tl, 0.05, 0.7);
  // Halo derrière l'objet : la lumière du studio.
  cx.save();
  cx.globalCompositeOperation = 'lighter';
  const halo = cx.createRadialGradient(cxo, cyo, 0, cxo, cyo, taille * 0.62);
  halo.addColorStop(0, `${e.accent}30`);
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  cx.globalAlpha = aE;
  cx.fillStyle = halo;
  cx.fillRect(cxo - taille, cyo - taille, taille * 2, taille * 2);
  cx.restore();

  if (sc.mode === 'fil') {
    // Du maillage au rendu : un volet vertical traverse l'objet.
    const tV = Math.max(1.1, d * 0.3);
    const dV = Math.min(1.6, d * 0.3);
    const p = douce((tl - tV) / dV);
    e.repere('whoosh', tV);
    e.repere('scintille', tV + dV * 0.7, tV + dV * 0.7 + 0.6);
    const angle = 0.6 + tl * 0.28;
    const cote = taille;
    const gx = cxo - cote / 2;
    const gy = cyo - cote / 2;
    const xv = gx + cote * (1 - p);
    ombreSol(cx, cxo, gy + cote * moteur.pied, cote * 0.3, aE * p);
    cx.globalAlpha = aE;
    // Gauche du volet : le maillage brut.
    const fil = moteur.rendre({ t: e.t, couleur: cols[0], angle, inclinaison: 0.16, fil: 1 });
    cx.save();
    cx.beginPath();
    cx.rect(gx - 4, gy, xv - gx + 4, cote);
    cx.clip();
    cx.drawImage(fil, gx, gy, cote, cote);
    cx.restore();
    // Droite : le rendu final.
    const rendu = moteur.rendre({ t: e.t, couleur: cols[0], angle, inclinaison: 0.16, fil: 0 });
    cx.save();
    cx.beginPath();
    cx.rect(xv, gy, gx + cote - xv + 4, cote * 1.3);
    cx.clip();
    refletSol(cx, rendu, gx, gy, cote, moteur.pied, 1);
    cx.drawImage(rendu, gx, gy, cote, cote);
    cx.restore();
    if (p > 0 && p < 1) {
      cx.save();
      cx.globalCompositeOperation = 'lighter';
      cx.fillStyle = e.degrade ? degradeH(cx, xv - 3, 6, e.degrade) : e.accent;
      cx.shadowColor = e.accent;
      cx.shadowBlur = 40;
      cx.fillRect(xv - 2.5, gy + cote * 0.04, 5, cote * 0.92);
      cx.restore();
    }
    // Les deux étiquettes : celle qui vaut à l'instant est allumée.
    const et = sc.etiquettes ?? ['Maillage', 'Rendu'];
    const tE = L * 0.026;
    cx.font = fonte(e.f.mono, tE);
    espacer(cx, 3);
    const yE = gy + cote + tE * 2;
    cx.globalAlpha = aE * (1 - 0.7 * p);
    cx.fillStyle = e.encre;
    cx.fillText(et[0].toUpperCase(), e.marge, yE);
    const w1 = cx.measureText(et[1].toUpperCase()).width;
    cx.globalAlpha = aE * (0.3 + 0.7 * p);
    cx.fillStyle = e.accent2;
    cx.fillText(et[1].toUpperCase(), e.marge + e.largeurTexte - w1, yE);
    espacer(cx, 0);
    cx.globalAlpha = 1;
    return mention();
  }

  // Héros : l'objet tourne, et change de coloris d'un demi-tour vif.
  const nc = cols.length;
  const palier = Math.max(1.1, (d - 0.5) / nc);
  const k = Math.min(nc - 1, Math.floor(tl / palier));
  const dans = tl - k * palier;
  // À chaque changement : un demi-tour rapide qui cache la bascule de couleur.
  let tour = 0;
  for (let q = 1; q <= k; q++) tour += Math.PI * 2;
  const pTour = k > 0 ? sortie(dans / 0.7) : 1;
  const angle = 0.5 + tl * 0.5 + tour - (1 - pTour) * Math.PI * 2;
  if (k > 0) {
    e.repere('whoosh', k * palier);
    e.repere('pop', k * palier + 0.3);
  }
  const couleur = k > 0 && dans < 0.22 ? cols[k - 1] : cols[k];
  const img = moteur.rendre({ t: e.t, couleur, angle, inclinaison: 0.14 + 0.05 * Math.sin(tl * 0.6), fil: 0 });
  const entree = 0.86 + 0.14 * ressort(tl / 0.9);
  const cote = taille * entree;
  ombreSol(cx, cxo, cyo - cote / 2 + cote * moteur.pied, cote * 0.3, aE);
  cx.globalAlpha = aE;
  refletSol(cx, img, cxo - cote / 2, cyo - cote / 2, cote, moteur.pied, 1);
  cx.drawImage(img, cxo - cote / 2, cyo - cote / 2, cote, cote);
  // L'éclat du changement de coloris.
  if (k > 0 && dans < 0.5) {
    cx.save();
    cx.globalCompositeOperation = 'lighter';
    const f = cx.createRadialGradient(cxo, cyo, 0, cxo, cyo, taille * 0.7);
    f.addColorStop(0, `${cols[k]}66`);
    f.addColorStop(1, 'rgba(0,0,0,0)');
    cx.globalAlpha = (1 - dans / 0.5) * 0.8;
    cx.fillStyle = f;
    cx.fillRect(cxo - taille, cyo - taille, taille * 2, taille * 2);
    cx.restore();
  }
  // Les pastilles de coloris, celle en cours cerclée.
  const rp = L * 0.021;
  const gapP = rp * 3.2;
  const yp = cyo + taille * 0.5 + rp * 1.6;
  const xp0 = cxo - ((nc - 1) * gapP) / 2;
  cols.forEach((c, q) => {
    const ap = apparition(tl, 0.5 + q * 0.1, 0.4);
    cx.globalAlpha = ap;
    cx.beginPath();
    cx.arc(xp0 + q * gapP, yp, rp * (q === k ? 1 : 0.78), 0, Math.PI * 2);
    cx.fillStyle = c;
    cx.fill();
    if (q === k) {
      cx.beginPath();
      cx.arc(xp0 + q * gapP, yp, rp * 1.5, 0, Math.PI * 2);
      cx.strokeStyle = e.encre;
      cx.lineWidth = 2.5;
      cx.stroke();
    }
  });
  const lib = sc.etiquettes?.[k];
  if (lib) {
    cx.globalAlpha = apparition(dans, 0.15, 0.4);
    cx.font = fonte(e.f.mono, L * 0.022);
    espacer(cx, 3);
    cx.fillStyle = e.douce;
    const lw = cx.measureText(lib.toUpperCase()).width;
    cx.fillText(lib.toUpperCase(), cxo - lw / 2, yp + rp * 3.4);
    espacer(cx, 0);
  }
  cx.globalAlpha = 1;
  mention();
}
