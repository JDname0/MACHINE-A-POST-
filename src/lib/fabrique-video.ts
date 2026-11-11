/**
 * Fabrication d'une vidéo dans le navigateur, puis rangement dans la
 * médiathèque. Utilisé par le studio (une vidéo, réglée à la main) et par la
 * production en lot (toutes les vidéos dues, réglages par défaut).
 *
 * Pourquoi dans le navigateur : une fonction Vercel a une durée et une mémoire
 * bornées, et ffmpeg y pèse lourd. Le navigateur sait dessiner (canvas) et
 * encoder (WebCodecs, H.264 matériel sur Mac) — une vidéo de vingt secondes
 * se fabrique en quelques secondes.
 *
 * Règles de format tenues dans le dessin :
 *  - le texte est **incrusté** et présent dès la première image : la lecture
 *    est muette, et les trois premières secondes portent le sujet ;
 *  - le rythme suit la marque : coupes sèches pour Veolt, fondus courts pour
 *    MagistrIA (un propos juridique haché se lit comme une publicité).
 *
 * Module navigateur uniquement : il n'est importé que par des composants client.
 */

import type { PlanMontage, Scene } from './montage';
import {
  dessinerFond,
  dessinerChapitre,
  dessinerAccent,
  dessinerAnnotation,
  sceneApp,
  sceneMarque,
  sceneDocuments,
  sceneRecap,
  sceneFinV2,
  sceneSite,
  sceneBento,
  dessinerSousTitre,
  dessinerFleche,
  hauteurSousTitre,
  type CarteApp,
  type Env,
} from './rendu-scenes';
import { deuxLignes } from './coupe';
import { CollecteReperes, codecAudio, composerBandeSon, encoderAudio, FREQ, type OptionsSon, type VoixOff } from './son';
import { verre, grainFilm, vignette, filtreDisponible } from './verre';
import type { Forme3D, Moteur3D, Place3D } from './scene3d';
import { enregistrerTeleversement, deposerVideoMontee } from '@/app/actions';

export interface ImageDispo {
  id: number;
  url: string;
  nom: string;
  origine: string;
  /** Un clip vidéo (Higgsfield, Blender…) plutôt qu'une image. */
  type?: 'image' | 'video';
}

export interface ThemeStudio {
  fond: string;
  /** Encre du titre (première ligne). */
  encre: string;
  /** Filet sous le titre et barre de progression, quand il n'y a pas de dégradé. */
  accent: string;
  policeTitre: string;
  /** Dégradé de la seconde ligne du titre (Veolt) ; absent : encre pleine. */
  degrade?: string[];
  /** Couleurs de la barre de progression. */
  barre?: string[];
  /** Entrée du titre : décodage de lettres (site Veolt) ou montée douce (MagistrIA). */
  animation?: 'brouillage' | 'montee';
  /** Sur-titre du plan d'ouverture : couleur et police. */
  surTitre?: { couleur: string; police: 'Mono' | 'Bebas' };
  /** Lueur qui dérive lentement sur toute la vidéo. */
  lueur?: string;
  majuscules?: boolean;
  /** Texte secondaire (légendes, références). */
  douce?: string;
  /** Fond et filet des fenêtres et panneaux des scènes. */
  surface?: string;
  filet?: string;
  /** Couleur de surlignage et des valeurs négatives. */
  ambre?: string;
  /** Le bouton d'action de l'écran de fin, comme sur le site. */
  bouton?: { fond: string[]; encre: string };
  /** L'adresse affichée sous le bouton de fin. */
  adresse?: string;
  /** Second accent : phrase en italique, annotations, étoiles colorées. */
  accent2?: string;
  /** Couleurs de l'arc d'horizon et des rayons. */
  arc?: string[];
  rayons?: string[];
  /** Décor par défaut des plans (sinon le fond de marque généré). */
  fondDefaut?: 'carte' | 'etoiles' | 'horizon' | 'rayons';
  /** Logotype en mots : [début, fin, couleur de la fin] ; et la phrase de marque. */
  motMarque?: [string, string, string];
  slogan?: string;
  /** Couleurs de l'écran produit (l'application elle-même). */
  app?: CarteApp;
}

export interface Montage {
  entite: string;
  publicationId: number;
  largeur: number;
  hauteur: number;
  plans: PlanMontage[];
  cartes: string[];
  images: ImageDispo[];
  theme: ThemeStudio;
  rythme: 'sec' | 'pose';
  direct: boolean;
  legende: string;
  /** Taille maximale du fichier, selon le chemin de dépôt (voir `plafondDepotVideo`). */
  plafondOctets: number;
  /** Variante des cartes à la charte : fond clair (par défaut) ou sombre. */
  variante?: 'clair' | 'sombre';
  /** Sur-titre du plan d'ouverture (le pilier du post). */
  surTitre?: string;
  /** Bande-son : musique de marque, bruitages calés sur l'image, voix off. Absent : musique et bruitages. */
  son?: { musique: boolean; bruitages: boolean; volume?: number; voix?: VoixOff[]; musiqueUrl?: string };
}

const FPS = 30;
const FONDU = 0.35;
const POLICES: Record<string, { fichier: string; poids: string }> = {
  Bebas: { fichier: 'BebasNeue.ttf', poids: '400' },
  Kanit: { fichier: 'Kanit-Bold.ttf', poids: '700' },
  Spectral: { fichier: 'Spectral-SemiBold.ttf', poids: '600' },
  Inter: { fichier: 'Inter-SemiBold.ttf', poids: '600' },
  Mono: { fichier: 'JetBrainsMono-Medium.woff', poids: '500' },
  InterR: { fichier: 'Inter-Regular.ttf', poids: '400' },
  Italique: { fichier: 'Spectral-MediumItalic.woff', poids: '500' },
  Manuscrite: { fichier: 'Caveat-SemiBold.woff', poids: '600' },
};
const GLYPHES = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+';

async function chargerPolice(nom: string): Promise<{ famille: string; poids: string }> {
  const pol = POLICES[nom] ?? POLICES.Inter;
  const famille = `Studio${nom}`;
  if (![...document.fonts].some((f) => f.family === famille)) {
    const ff = new FontFace(famille, `url(/polices/${pol.fichier})`, { weight: pol.poids });
    document.fonts.add(await ff.load());
  }
  return { famille, poids: pol.poids };
}

const borne = (x: number) => Math.min(1, Math.max(0, x));
const sortie = (x: number) => 1 - Math.pow(1 - borne(x), 3);
/** Pseudo-aléatoire déterministe : la même vidéo ressort identique à chaque fabrication. */
const hasard = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

function charger(src: string): Promise<HTMLImageElement> {
  return new Promise((ok, ko) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = () => ko(new Error(`Image illisible : ${src.slice(0, 80)}`));
    i.src = src;
  });
}

type Source = HTMLImageElement | HTMLVideoElement;
const largeurDe = (s: Source) => (s instanceof HTMLVideoElement ? s.videoWidth : s.naturalWidth);
const hauteurDe = (s: Source) => (s instanceof HTMLVideoElement ? s.videoHeight : s.naturalHeight);

/** Image ou clip en « cover » avec un léger zoom lent — le mouvement qui fait d'une image fixe un plan. */
function couvrir(ctx: CanvasRenderingContext2D, img: Source, l: number, h: number, zoom: number) {
  const r = Math.max(l / largeurDe(img), h / hauteurDe(img)) * zoom;
  const w = largeurDe(img) * r;
  const hh = hauteurDe(img) * r;
  ctx.drawImage(img, (l - w) / 2, (h - hh) / 2, w, hh);
}

/** Un clip vidéo prêt à être positionné image par image (muet : le son vient de la bande-son). */
function chargerVideo(src: string): Promise<HTMLVideoElement> {
  return new Promise((ok, ko) => {
    const v = document.createElement('video');
    v.muted = true;
    v.playsInline = true;
    v.preload = 'auto';
    const delai = setTimeout(() => ko(new Error(`Clip illisible : ${src.slice(0, 80)}`)), 30000);
    v.onloadeddata = () => {
      clearTimeout(delai);
      ok(v);
    };
    v.onerror = () => {
      clearTimeout(delai);
      ko(new Error(`Clip illisible : ${src.slice(0, 80)}`));
    };
    v.src = src;
  });
}

/** Amène un clip à l'instant voulu et attend que l'image soit prête. */
function positionner(v: HTMLVideoElement, temps: number): Promise<void> {
  const cible = Math.max(0, Math.min(temps, (v.duration || 0) - 0.04));
  if (Math.abs(v.currentTime - cible) < 1 / 90) return Promise.resolve();
  return new Promise((ok) => {
    const fini = () => {
      clearTimeout(delai);
      v.removeEventListener('seeked', fini);
      ok();
    };
    const delai = setTimeout(fini, 3000);
    v.addEventListener('seeked', fini);
    v.currentTime = cible;
  });
}

function lignes(ctx: CanvasRenderingContext2D, texte: string, max: number): string[] {
  const out: string[] = [];
  let cur = '';
  for (const mot of texte.split(/\s+/)) {
    const essai = cur ? `${cur} ${mot}` : mot;
    if (ctx.measureText(essai).width > max && cur) {
      out.push(cur);
      cur = mot;
    } else cur = essai;
  }
  if (cur) out.push(cur);
  return out;
}

export const dureeDe = (plans: PlanMontage[]) => plans.reduce((n, x) => n + x.duree, 0);

/** Charge polices et images, et renvoie de quoi dessiner n'importe quelle image de la vidéo. */
async function preparerRendu(m: Montage) {
  const { largeur: L, hauteur: H, plans, theme: th } = m;
  const c = document.createElement('canvas');
  c.width = L;
  c.height = H;
  const ctx = c.getContext('2d')!;
  const carteDe = (i: number) => m.cartes[i] ?? m.cartes[m.cartes.length - 1];

  // Polices de la charte, servies par /polices — sans elles, le navigateur
  // incrusterait dans une police système et la vidéo sortirait de la marque.
  const titre = await chargerPolice(th.policeTitre);
  const sur = th.surTitre ? await chargerPolice(th.surTitre.police) : null;
  const corps = await chargerPolice('Inter');
  const corpsL = await chargerPolice('InterR');
  const mono = await chargerPolice('Mono');
  const italique = await chargerPolice('Italique');
  const manuscrite = await chargerPolice('Manuscrite');

  // Les cartes donnent le fond à la charte (logo, pied, halos, trame) SANS
  // texte : le titre est dessiné ici, pour pouvoir l'animer.
  const sources = await Promise.all(
    plans.map((x, i) => {
      if (x.source.type === 'media') {
        const id = x.source.id;
        const media = m.images.find((k) => k.id === id);
        if (media?.type === 'video') return chargerVideo(media.url).catch(() => charger(carteDe(i)));
        return charger(media?.url ?? carteDe(i));
      }
      const u = new URL(carteDe(i), window.location.origin);
      for (const cle of ['ligne1', 'ligne2', 'sousTitre', 'legende', 'pagination', 'chiffre']) u.searchParams.set(cle, '');
      if (m.variante === 'sombre') u.searchParams.set('variante', 'sombre');
      return charger(u.pathname + u.search);
    }),
  );

  const bornes: Array<[number, number]> = [];
  let t0 = 0;
  for (const x of plans) {
    bornes.push([t0, t0 + x.duree]);
    t0 += x.duree;
  }

  const vertical = H > L * 1.4;
  const marge = vertical ? 92 : 80;
  const largeurTexte = L - marge * 2;

  const appDefaut: CarteApp = {
    fond: '#FFFFFF',
    encre: '#15121A',
    douce: '#6E6B78',
    accent: th.accent,
    filet: '#E6E6EB',
    puce: '#EEF6EE',
    alerte: '#FFF4D6',
    alerteEncre: '#8A5A00',
    neutre: '#F3F3F6',
    ok: '#2E7D32',
    surAccent: '#FFFFFF',
    champ: '#FFFFFF',
  };
  const marque: 'veolt' | 'magistria' = m.entite === 'veolt' ? 'veolt' : 'magistria';
  // Les instants sonores déclarés par le dessin, en temps absolu.
  const collecte = new CollecteReperes();
  let debutPlan = 0;
  const env: Env = {
    L,
    H,
    vertical,
    marge,
    largeurTexte,
    encre: th.encre,
    douce: th.douce ?? 'rgba(255,255,255,0.62)',
    accent: th.accent,
    accent2: th.accent2 ?? th.accent,
    fond: th.fond,
    degrade: th.degrade,
    arc: th.arc ?? [th.accent],
    rayons: th.rayons ?? [th.accent],
    majuscules: Boolean(th.majuscules),
    motMarque: th.motMarque ?? ['Marque', '', th.encre],
    slogan: th.slogan ?? '',
    app: th.app ?? appDefaut,
    bouton: th.bouton ?? { fond: [th.accent], encre: '#FFFFFF' },
    adresse: th.adresse ?? '',
    // Veolt n'a pas d'italique dans sa charte : ses phrases d'accent sont en Bebas lavande.
    f: { titre, corps, corpsL, mono, italique: th.policeTitre === 'Bebas' ? titre : italique, manuscrite, etiquette: sur ?? mono },
    lignes,
    marque,
    t: 0,
    repere: (type, tl, fin) => collecte.ajouter({ type, t: debutPlan + tl, fin: fin === undefined ? undefined : debutPlan + fin }),
    teinteVerre: marque === 'veolt' ? 'rgba(46,14,64,0.34)' : 'rgba(10,22,42,0.38)',
  };

  // ── Couche 3D (sphère de veolt.fr, cerveau de magistrai.fr), chargée seulement si un plan la demande ──
  let moteur3D: Moteur3D | null = null;
  if (plans.some((x) => x.noyau)) {
    const { creerMoteur3D } = await import('./scene3d');
    moteur3D = await creerMoteur3D(marque, L, H, 0.75);
  }
  const formeDefaut: Forme3D = marque === 'veolt' ? 'sphere' : 'cerveau';
  const PLACES: Record<Place3D, { cx: number; cy: number; r: number; i: number }> = {
    centre: { cx: L / 2, cy: H * 0.46, r: L * 0.33, i: 0.95 },
    haut: { cx: L / 2, cy: H * (vertical ? 0.27 : 0.3), r: L * 0.24, i: 0.9 },
    bas: { cx: L / 2, cy: H * 0.8, r: L * 0.19, i: 0.8 },
    fond: { cx: L / 2, cy: H * 0.5, r: L * 0.56, i: 0.26 },
    gauche: { cx: L * 0.18, cy: H * 0.42, r: L * 0.3, i: 0.7 },
    droite: { cx: L * 0.82, cy: H * 0.42, r: L * 0.3, i: 0.7 },
  };
  const dessinerNoyau = (cx: CanvasRenderingContext2D, i: number, tl: number, t: number, d: number) => {
    const n = plans[i].noyau;
    if (!n || !moteur3D) return;
    const prec = i > 0 ? plans[i - 1].noyau : undefined;
    const forme = n.forme ?? formeDefaut;
    const formePrec = prec ? (prec.forme ?? formeDefaut) : forme;
    const ici = PLACES[n.place ?? 'centre'];
    const avant = prec ? PLACES[prec.place ?? 'centre'] : ici;
    const glisse = prec ? sortie(tl / 1.1) : 1;
    const lerp = (a2: number, b2: number) => a2 + (b2 - a2) * glisse;
    const tOnde = d * 0.45;
    const onde = n.onde && tl > tOnde && tl < tOnde + 1.6 ? (tl - tOnde) / 1.6 : 0;
    if (n.onde) env.repere('scintille', tOnde, tOnde + 0.9);
    const entree = prec ? 1 : n.construction ? 1 : sortie(tl / 0.5);
    const toile = moteur3D.rendre({
      t,
      de: formePrec,
      vers: forme,
      morph: formePrec === forme ? 1 : borne(tl / 1.5),
      cx: lerp(avant.cx, ici.cx),
      cy: lerp(avant.cy, ici.cy),
      rayon: lerp(avant.r, ici.r),
      construction: n.construction && !prec ? borne(tl / 2.6) : 1,
      onde,
      cadran: marque === 'magistria' && n.cadran ? (prec?.cadran ? 1 : borne((tl - 0.3) / 1.6)) : 0,
      activite: (n.activite ?? 0) + (onde > 0 ? Math.sin(Math.PI * onde) * 0.6 : 0),
      intensite: (n.intensite ?? lerp(avant.i, ici.i)) * entree,
    });
    if (formePrec !== forme) env.repere('whoosh', 0.35);
    if (n.construction && !prec) env.repere('montee', 0, 2.2);
    cx.save();
    cx.globalCompositeOperation = 'screen';
    cx.drawImage(toile, 0, 0, L, H);
    cx.restore();
  };

  const flou = filtreDisponible();
  type Zone = 'centre' | 'bas' | 'haut' | 'fin';
  const ECHELLE: Record<Zone, number> = { centre: 1, bas: 0.78, haut: 0.6, fin: 0.85 };

  /** Le titre d'un plan, coupé comme les visuels, puis replié à la largeur utile. */
  const mise = new Map<string, { lignes: Array<{ t: string; accent: boolean }>; taille: number }>();
  const miseEnPage = (i: number, zone: Zone) => {
    const cle = `${i}-${zone}`;
    const deja = mise.get(cle);
    if (deja) return deja;
    const brut = th.majuscules ? plans[i].texte.toUpperCase() : plans[i].texte;
    const { ligne1, ligne2 } = deuxLignes(brut);
    const base = th.policeTitre === 'Bebas' ? (vertical ? 0.125 : 0.1) : vertical ? 0.088 : 0.078;
    let taille = Math.round(L * base * ECHELLE[zone]);
    let lignesFinales: Array<{ t: string; accent: boolean }> = [];
    for (let essai = 0; essai < 6; essai++) {
      ctx.font = `${titre.poids} ${taille}px "${titre.famille}", sans-serif`;
      lignesFinales = [
        ...(ligne1 ? lignes(ctx, ligne1, largeurTexte).map((t) => ({ t, accent: false })) : []),
        ...lignes(ctx, ligne2, largeurTexte).map((t) => ({ t, accent: Boolean(th.degrade) })),
      ];
      if (lignesFinales.length <= (zone === 'haut' ? 3 : vertical ? 6 : 5)) break;
      taille = Math.round(taille * 0.88);
    }
    const r = { lignes: lignesFinales, taille };
    mise.set(cle, r);
    return r;
  };

  /**
   * Le titre animé : décodage de lettres (Veolt) ou montée ligne par ligne
   * (MagistrIA). Renvoie le bas du bloc, pour poser une scène dessous.
   */
  const dessinerTitre = (cx: CanvasRenderingContext2D, i: number, tl: number, t: number, zone: Zone): number => {
    const { lignes: ls, taille } = miseEnPage(i, zone);
    const interligne = taille * (th.policeTitre === 'Bebas' ? 1.0 : 1.12);
    const hauteurBloc = interligne * ls.length;
    let y =
      zone === 'bas'
        ? H - (vertical ? 230 : 170) - hauteurBloc + taille
        : zone === 'haut'
          ? H * (vertical ? 0.15 : 0.16) + taille
          : zone === 'fin'
            ? H * 0.36 - hauteurBloc / 2 + taille
            : H * 0.47 - hauteurBloc / 2 + taille;
    cx.textBaseline = 'alphabetic';

    const centre = Boolean(plans[i].centre);
    const xLigne = (w: number) => (centre ? (L - w) / 2 : marge);

    // Chapitre (« 01 / 06 · … »), sinon le pilier du post sur le plan d'ouverture.
    if (plans[i].chapitre) {
      dessinerChapitre(cx, env, plans[i].chapitre!, tl, y - taille - L * 0.035, centre);
    } else if (i === 0 && sur && th.surTitre && m.surTitre) {
      const ts = Math.round(L * (th.surTitre.police === 'Mono' ? 0.021 : 0.034));
      cx.font = `${sur.poids} ${ts}px "${sur.famille}", monospace`;
      (cx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${Math.round(ts * 0.28)}px`;
      cx.globalAlpha = sortie(tl / 0.35);
      cx.fillStyle = th.surTitre.couleur;
      const st = m.surTitre.toUpperCase();
      cx.fillText(st, xLigne(cx.measureText(st).width), y - taille - ts * 1.4);
      (cx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '0px';
      cx.globalAlpha = 1;
    }

    cx.font = `${titre.poids} ${taille}px "${titre.famille}", sans-serif`;
    if (th.animation === 'brouillage') env.repere('brouillage', 0.05, 0.47 + (ls.length - 1) * 0.07);
    ls.forEach((ligne, j) => {
      const largeur = cx.measureText(ligne.t).width;
      const x0 = xLigne(largeur);
      const remplissage = (): string | CanvasGradient => {
        if (!ligne.accent || !th.degrade) return th.encre;
        const g = cx.createLinearGradient(x0, 0, x0 + Math.max(largeur, L * 0.4), 0);
        th.degrade.forEach((col, k) => g.addColorStop(k / Math.max(1, th.degrade!.length - 1), col));
        return g;
      };
      if (th.animation === 'brouillage') {
        // Comme sur veolt.fr : les lettres défilent puis se fixent, de gauche à droite.
        const p = borne((tl - (0.05 + j * 0.07)) / 0.42);
        const fixes = Math.floor(p * ligne.t.length);
        cx.fillStyle = remplissage();
        // Lueur néon sur la ligne en dégradé, plus vive pendant le décodage.
        if (ligne.accent && th.degrade) {
          cx.shadowColor = th.degrade[0];
          cx.shadowBlur = 18 + 26 * (1 - p);
        }
        let x = x0;
        for (let k = 0; k < ligne.t.length; k++) {
          const vrai = ligne.t[k];
          const montre = k < fixes || vrai === ' ' ? vrai : GLYPHES[Math.floor(hasard(Math.floor(t * 15) * 97 + k * 31 + j * 7 + i * 13) * GLYPHES.length)];
          cx.globalAlpha = k < fixes || vrai === ' ' ? 1 : 0.55;
          cx.fillText(montre, x, y);
          x += cx.measureText(vrai).width;
        }
        cx.shadowBlur = 0;
        cx.globalAlpha = 1;
      } else {
        // Mot après mot : chacun monte et sort du flou (typographie cinétique).
        const mots = ligne.t.split(' ');
        const espace = cx.measureText(' ').width;
        let x = x0;
        cx.fillStyle = remplissage();
        mots.forEach((mot, q) => {
          const e = sortie((tl - (0.08 + j * 0.11 + q * 0.05)) / 0.6);
          if (e > 0) {
            cx.globalAlpha = e;
            if (flou && e < 1) cx.filter = `blur(${((1 - e) * 9).toFixed(1)}px)`;
            cx.fillText(mot, x, y + (1 - e) * 26);
            cx.filter = 'none';
          }
          x += cx.measureText(mot).width + espace;
        });
        cx.globalAlpha = 1;
      }
      y += interligne;
    });

    let bas = y - interligne + taille * 0.42;
    if (plans[i].accent) {
      bas = dessinerAccent(cx, env, plans[i].accent!, tl, bas - taille * 0.2, centre);
    } else if (!th.degrade && !centre) {
      // Le filet sous le titre, comme sur les visuels (marque sans dégradé).
      const e = sortie((tl - (0.1 + ls.length * 0.11)) / 0.5);
      cx.fillStyle = th.accent;
      cx.fillRect(marge, bas, 190 * (L / 1080) * e, 5);
    }
    return bas + 5;
  };

  // ── Scènes : écran produit, chiffre, liste, comparatif, fin ─────────────
  const douce = th.douce ?? 'rgba(255,255,255,0.62)';
  const surface = th.surface ?? 'rgba(255,255,255,0.05)';
  const filet = th.filet ?? 'rgba(255,255,255,0.16)';
  const ambre = th.ambre ?? '#FF9A3C';
  const fonte = (f: { famille: string; poids: string }, taille: number) => `${f.poids} ${Math.round(taille)}px "${f.famille}", sans-serif`;
  const apparition = (tl: number, debut: number, duree = 0.45) => sortie((tl - debut) / duree);
  type Ctx = CanvasRenderingContext2D & { letterSpacing: string };
  /** Petites capitales espacées : Mono (MagistrIA) ou Bebas (Veolt). */
  const etiquette = (cx: CanvasRenderingContext2D, texte: string, x: number, y: number, taille: number, couleur: string | CanvasGradient) => {
    const f = th.surTitre?.police === 'Mono' ? mono : titre;
    const tt = f === titre ? taille * 1.35 : taille;
    cx.font = fonte(f, tt);
    (cx as Ctx).letterSpacing = `${Math.round(tt * (f === titre ? 0.06 : 0.22))}px`;
    cx.fillStyle = couleur;
    cx.fillText(texte, x, y);
    (cx as Ctx).letterSpacing = '0px';
  };
  const degradeSur = (cx: CanvasRenderingContext2D, x: number, largeur: number): string | CanvasGradient => {
    if (!th.degrade) return th.accent;
    const g = cx.createLinearGradient(x, 0, x + Math.max(40, largeur), 0);
    th.degrade.forEach((col, k) => g.addColorStop(k / Math.max(1, th.degrade!.length - 1), col));
    return g;
  };
  const boite = (cx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fond?: string | CanvasGradient, trait?: string | CanvasGradient, epaisseur = 2) => {
    cx.beginPath();
    cx.roundRect(x, y, w, h, r);
    if (fond) {
      cx.fillStyle = fond;
      cx.fill();
    }
    if (trait) {
      cx.strokeStyle = trait;
      cx.lineWidth = epaisseur;
      cx.stroke();
    }
  };
  /** Cadre d'une fenêtre d'application : barre de titre, trois pastilles, libellé. */
  const fenetre = (cx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, libelle: string, a: number) => {
    cx.globalAlpha = a;
    verre(cx, x, y, w, h, 20, { teinte: env.teinteVerre, t: env.t, flou: 28 });
    cx.fillStyle = filet;
    cx.fillRect(x, y + 58, w, 1.5);
    for (let k = 0; k < 3; k++) {
      cx.beginPath();
      cx.arc(x + 30 + k * 22, y + 29, 6.5, 0, Math.PI * 2);
      cx.fillStyle = k === 0 ? th.accent : filet;
      cx.fill();
    }
    cx.font = fonte(mono, L * 0.0175);
    (cx as Ctx).letterSpacing = '1px';
    cx.fillStyle = douce;
    cx.fillText(libelle, x + 106, y + 36);
    (cx as Ctx).letterSpacing = '0px';
    cx.globalAlpha = 1;
  };

  const sceneChiffre = (cx: CanvasRenderingContext2D, sc: Extract<Scene, { type: 'chiffre' }>, tl: number, y0: number, y1: number) => {
    const m2 = sc.valeur.match(/^([−-]?)([\d\s  ]*\d)(.*)$/);
    let affiche = sc.valeur;
    if (m2) env.repere('compteur', 0.2, 1.1);
    if (m2) {
      const cible = parseInt(m2[2].replace(/\D/g, ''), 10);
      const n = Math.round(cible * sortie((tl - 0.2) / 0.9));
      affiche = m2[1] + n.toLocaleString('fr-FR').replace(/[\s  ]/g, ' ') + m2[3];
    }
    let taille = L * (th.policeTitre === 'Bebas' ? (vertical ? 0.3 : 0.24) : vertical ? 0.2 : 0.17);
    cx.font = fonte(titre, taille);
    const cibleL = cx.measureText(sc.valeur).width;
    if (cibleL > largeurTexte) taille *= largeurTexte / cibleL;
    cx.font = fonte(titre, taille);
    const yv = y0 + (y1 - y0) * 0.38 + taille * 0.35;
    cx.globalAlpha = apparition(tl, 0.05, 0.3);
    cx.fillStyle = degradeSur(cx, marge, cx.measureText(sc.valeur).width);
    cx.fillText(affiche, marge, yv);
    const tl2 = L * (vertical ? 0.044 : 0.032);
    cx.font = fonte(corpsL, tl2);
    cx.globalAlpha = apparition(tl, 0.9, 0.5);
    cx.fillStyle = douce;
    let y = yv + tl2 * 2.1;
    for (const l of lignes(cx, sc.legende, largeurTexte)) {
      cx.fillText(l, marge, y);
      y += tl2 * 1.4;
    }
    cx.globalAlpha = 1;
  };

  const sceneListe = (cx: CanvasRenderingContext2D, sc: Extract<Scene, { type: 'liste' }>, tl: number, y0: number, y1: number, d: number) => {
    const n = sc.items.length;
    const pas = Math.min(0.8, Math.max(0.28, (d - 1.8) / n));
    let tt = L * (vertical ? 0.058 : 0.037);
    let mesures: string[][] = [];
    let hauteur = 0;
    const retrait = tt * 2.3;
    for (let essai = 0; essai < 6; essai++) {
      cx.font = fonte(corps, tt);
      mesures = sc.items.map((it) => lignes(cx, it, largeurTexte - retrait));
      hauteur = mesures.reduce((h, ls) => h + ls.length * tt * 1.28 + tt * 1.05, 0);
      if (hauteur <= y1 - y0) break;
      tt *= 0.9;
    }
    let y = y0 + Math.max(0, (y1 - y0 - hauteur) * (vertical ? 0.42 : 0.35)) + tt;
    mesures.forEach((ls, k) => {
      env.repere('pop', 0.38 + k * pas);
      const a = apparition(tl, 0.35 + k * pas, 0.4);
      const dx = (1 - a) * 26;
      cx.globalAlpha = a;
      etiquette(cx, String(k + 1).padStart(2, '0'), marge + dx, y, tt * 0.62, th.surTitre?.police === 'Mono' ? th.accent : degradeSur(cx, marge, tt * 1.4));
      cx.font = fonte(corps, tt);
      cx.fillStyle = th.encre;
      ls.forEach((l, j) => cx.fillText(l, marge + retrait + dx, y + j * tt * 1.28));
      const basItem = y + (ls.length - 1) * tt * 1.28 + tt * 0.55;
      if (th.surTitre?.police === 'Mono') {
        cx.globalAlpha = a * 0.7;
        cx.fillStyle = filet;
        cx.fillRect(marge, basItem, largeurTexte * a, 1.5);
      }
      cx.globalAlpha = 1;
      y += ls.length * tt * 1.28 + tt * 1.05;
    });
  };

  /**
   * Deux options face à face : côte à côte en 4:5, empilées en 9:16 (deux
   * colonnes de 430 px y seraient illisibles sur un téléphone). La seconde,
   * celle qu'on défend, arrive après et porte la couleur de la marque.
   */
  const sceneComparatif = (cx: CanvasRenderingContext2D, sc: Extract<Scene, { type: 'comparatif' }>, tl: number, y0: number, y1: number) => {
    const empile = vertical;
    const gap = empile ? 30 : 26;
    const w = empile ? largeurTexte : (largeurTexte - gap) / 2;
    const pad = empile ? 34 : 28;
    let tp = L * (empile ? 0.04 : 0.027);
    let tTitre = L * (th.policeTitre === 'Bebas' ? (empile ? 0.075 : 0.06) : 0.045);
    const colonnes = [sc.gauche, sc.droite];
    let mes: string[][][] = [];
    let hs: number[] = [];
    for (let essai = 0; essai < 7; essai++) {
      cx.font = fonte(corpsL, tp);
      mes = colonnes.map((c) => c.points.map((pt) => lignes(cx, pt, w - pad * 2 - tp)));
      hs = mes.map((col) => col.reduce((s2, ls) => s2 + ls.length * tp * 1.3 + tp * 0.9, 0) + tTitre * 1.9 + pad * 2);
      const total = empile ? hs[0] + gap + hs[1] : Math.max(...hs);
      if (total <= y1 - y0) break;
      tp *= 0.92;
      tTitre *= 0.94;
    }
    if (!empile) hs = [Math.max(...hs), Math.max(...hs)];
    const total = empile ? hs[0] + gap + hs[1] : hs[0];
    const yb = y0 + Math.max(0, (y1 - y0 - total) * (empile ? 0.4 : 0.3));
    colonnes.forEach((c, ci) => {
      const debut = ci === 0 ? 0.3 : 0.6 + c.points.length * 0.32;
      const a = apparition(tl, debut, 0.45);
      const x = empile ? marge : marge + ci * (w + gap);
      const yp = empile ? yb + (ci === 0 ? 0 : hs[0] + gap) : yb;
      env.repere('pop', debut + 0.05);
      cx.globalAlpha = a;
      verre(cx, x, yp + (1 - a) * 20, w, hs[ci], 18, { teinte: env.teinteVerre, t: env.t + ci, flou: 26, bordure: ci === 1 ? th.degrade ?? [th.accent] : undefined });
      cx.font = fonte(titre, tTitre);
      cx.fillStyle = ci === 1 ? degradeSur(cx, x + pad, w * 0.7) : th.encre;
      cx.fillText(th.majuscules ? c.titre.toUpperCase() : c.titre, x + pad, yp + pad + tTitre * 0.95);
      let y = yp + pad + tTitre * 1.9 + tp * 0.4;
      mes[ci].forEach((ls, k) => {
        const ak = a * apparition(tl, debut + 0.25 + k * 0.3, 0.35);
        cx.globalAlpha = ak;
        cx.fillStyle = ci === 1 ? th.accent : douce;
        cx.fillRect(x + pad, y - tp * 0.45, tp * 0.36, tp * 0.36);
        cx.font = fonte(corpsL, tp);
        cx.fillStyle = ci === 1 ? th.encre : douce;
        ls.forEach((l, j) => cx.fillText(l, x + pad + tp, y + j * tp * 1.3));
        y += ls.length * tp * 1.3 + tp * 0.9;
      });
      cx.globalAlpha = 1;
    });
  };

  const ETATS: Record<string, { libelle: string; couleur: string }> = {
    verifiee: { libelle: 'VÉRIFIÉE', couleur: th.accent },
    inconnue: { libelle: 'INCONNUE', couleur: ambre },
    'hors-corpus': { libelle: 'HORS CORPUS', couleur: douce },
  };

  const sceneAnalyse = (cx: CanvasRenderingContext2D, sc: Extract<Scene, { type: 'analyse' }>, tl: number, y0: number, y1: number, d: number) => {
    const w = largeurTexte;
    const pad = 32;
    const iw = w - pad * 2;
    let k = 1;
    let fe = 0, fs = 0, fl = 0, fc = 0;
    let ext: string[] = [];
    let eta: string[][] = [];
    let total = 0;
    for (let essai = 0; essai < 7; essai++) {
      fe = L * 0.029 * k;
      fs = L * 0.028 * k;
      fl = L * 0.017 * k;
      fc = L * 0.024 * k;
      cx.font = fonte(corpsL, fe);
      ext = lignes(cx, sc.extrait, iw);
      cx.font = fonte(corps, fs);
      eta = sc.etapes.map((e) => lignes(cx, e.texte, iw - 22));
      total = 58 + pad + ext.length * fe * 1.42 + fe * 0.9 + eta.reduce((s2, ls) => s2 + fl * 1.9 + ls.length * fs * 1.34 + fs * 0.8, 0) + sc.citations.length * fc * 2.3 + pad;
      if (total <= y1 - y0) break;
      k *= 0.92;
    }
    const x = marge;
    const yw = y0 + Math.max(0, (y1 - y0 - total) * 0.25);
    fenetre(cx, x, yw, w, total, sc.fenetre, apparition(tl, 0.1, 0.4));
    let y = yw + 58 + pad + fe;
    // Extrait de la pièce, la clause surlignée en balayage.
    cx.font = fonte(corpsL, fe);
    const debutSurligne = 0.65;
    ext.forEach((l) => {
      const idx = sc.surligne ? l.indexOf(sc.surligne) : -1;
      if (idx >= 0) {
        const dx = cx.measureText(l.slice(0, idx)).width;
        const lw = cx.measureText(sc.surligne).width;
        cx.globalAlpha = 0.32 * apparition(tl, 0.3, 0.3);
        cx.fillStyle = ambre;
        cx.fillRect(x + pad + dx - 4, y - fe * 0.95, (lw + 8) * sortie((tl - debutSurligne) / 0.6), fe * 1.3);
      }
      cx.globalAlpha = apparition(tl, 0.3, 0.4) * 0.92;
      cx.fillStyle = th.encre;
      cx.fillText(l, x + pad, y);
      y += fe * 1.42;
    });
    y += fe * 0.9 - fe * 1.42 + fs * 0.4;
    // Le raisonnement, étape par étape.
    const pasE = Math.min(1.1, Math.max(0.6, (d - 3.5) / (sc.etapes.length + 1)));
    env.repere('scintille', debutSurligne, debutSurligne + 0.6);
    sc.etapes.forEach((e, j) => {
      env.repere('pop', 1.42 + j * pasE);
      const a = apparition(tl, 1.4 + j * pasE, 0.45);
      const hBloc = fl * 1.9 + eta[j].length * fs * 1.34;
      cx.globalAlpha = a;
      cx.fillStyle = th.accent;
      cx.fillRect(x + pad, y, 4, hBloc - fs * 0.2);
      cx.font = fonte(mono, fl);
      (cx as Ctx).letterSpacing = `${Math.round(fl * 0.25)}px`;
      cx.fillStyle = th.accent;
      cx.fillText(e.label, x + pad + 22, y + fl * 1.1);
      (cx as Ctx).letterSpacing = '0px';
      cx.font = fonte(corps, fs);
      cx.fillStyle = th.encre;
      eta[j].forEach((l, q) => cx.fillText(l, x + pad + 22 + (1 - a) * 18, y + fl * 1.9 + fs * 0.95 + q * fs * 1.34));
      y += hBloc + fs * 0.8;
      cx.globalAlpha = 1;
    });
    // Chaque citation, avec son état.
    sc.citations.forEach((c, j) => {
      env.repere(c.etat === 'verifiee' ? 'coche' : 'pop', 1.45 + sc.etapes.length * pasE + 0.15 + j * 0.4);
      const a = apparition(tl, 1.4 + sc.etapes.length * pasE + 0.15 + j * 0.4, 0.4);
      const etat = ETATS[c.etat];
      cx.globalAlpha = a;
      cx.fillStyle = filet;
      cx.fillRect(x + pad, y, iw, 1.5);
      cx.font = fonte(corpsL, fc);
      cx.fillStyle = douce;
      cx.fillText(c.ref, x + pad, y + fc * 1.55);
      cx.font = fonte(mono, fc * 0.78);
      (cx as Ctx).letterSpacing = '2px';
      const bw = cx.measureText(etat.libelle).width + 30;
      const bx = x + pad + iw - bw;
      cx.globalAlpha = a * 0.18;
      boite(cx, bx, y + fc * 0.45, bw, fc * 1.5, fc * 0.75, etat.couleur);
      cx.globalAlpha = a;
      boite(cx, bx, y + fc * 0.45, bw, fc * 1.5, fc * 0.75, undefined, etat.couleur, 1.5);
      cx.fillStyle = etat.couleur;
      cx.fillText(etat.libelle, bx + 15, y + fc * 1.47);
      (cx as Ctx).letterSpacing = '0px';
      y += fc * 2.3;
      cx.globalAlpha = 1;
    });
  };

  const sceneTableur = (cx: CanvasRenderingContext2D, sc: Extract<Scene, { type: 'tableur' }>, tl: number, y0: number, y1: number, d: number) => {
    const w = largeurTexte;
    const pad = 28;
    const iw = w - pad * 2;
    let fr = L * (vertical ? 0.038 : 0.026);
    const nbL = sc.lignes.length + 1;
    let rh = fr * 2.2;
    const hNotes = () => sc.reperes.length * fr * 1.9 + fr;
    const nbV = Math.max(1, sc.colonnes.length - 1);
    // Les colonnes se mesurent sur le texte réel : le plus long libellé, puis
    // la plus longue valeur — jamais une proportion fixe qui ferait chevaucher.
    const largeurs = () => {
      cx.font = fonte(corpsL, fr);
      const lib = Math.max(...sc.lignes.map((l) => cx.measureText(l.libelle).width));
      cx.font = fonte(corps, fr);
      const val = Math.max(...sc.lignes.flatMap((l) => l.valeurs.map((v) => cx.measureText(v).width)));
      return { lib, val };
    };
    for (let essai = 0; essai < 8; essai++) {
      const { lib, val } = largeurs();
      const tient = lib + 28 + nbV * (val + 26) <= iw && 58 + pad * 2 + nbL * rh + hNotes() + 30 <= y1 - y0;
      if (tient) break;
      fr *= 0.92;
      rh = fr * 2.2;
    }
    const hw = 58 + pad * 2 + nbL * rh;
    const x = marge;
    const yw = y0 + Math.max(0, (y1 - y0 - hw - hNotes() - 30) * (vertical ? 0.4 : 0.2));
    fenetre(cx, x, yw, w, hw, sc.fenetre, apparition(tl, 0.1, 0.4));
    const c1 = Math.max(iw * 0.4, largeurs().lib + 28);
    const cw = (iw - c1) / nbV;
    const pas = Math.min(2.2, Math.max(1.2, (d - 2.2) / sc.reperes.length));
    const actif = sc.reperes.findIndex((_, k) => tl >= 1.0 + k * pas && tl < 1.0 + (k + 1) * pas);
    // Repérage : la ligne active s'allume, les précédentes restent marquées.
    sc.reperes.forEach((r, k) => {
      env.repere('pop', 1.02 + k * pas);
      const a = apparition(tl, 1.0 + k * pas, 0.35);
      if (a <= 0) return;
      const yr = yw + 58 + pad + (r.ligne + 1) * rh;
      cx.globalAlpha = (k === actif ? 0.22 : 0.09) * a;
      cx.fillStyle = th.degrade ? th.degrade[0] : th.accent;
      cx.fillRect(x + pad - 10, yr - rh * 0.02, (iw + 20) * a, rh * 0.96);
      cx.globalAlpha = a;
      cx.fillStyle = degradeSur(cx, x, 6);
      cx.fillRect(x + pad - 10, yr - rh * 0.02, 5, rh * 0.96);
      cx.globalAlpha = 1;
    });
    const aT = apparition(tl, 0.3, 0.4);
    cx.globalAlpha = aT;
    // En-têtes de colonnes.
    cx.font = fonte(mono, fr * 0.75);
    cx.fillStyle = douce;
    sc.colonnes.forEach((col, k) => {
      if (k === 0) return;
      const tw = cx.measureText(col).width;
      cx.fillText(col, x + pad + c1 + k * cw - tw, yw + 58 + pad + rh * 0.62);
    });
    sc.lignes.forEach((li, j) => {
      const yr = yw + 58 + pad + (j + 1) * rh + rh * 0.62;
      cx.font = fonte(corpsL, fr);
      cx.fillStyle = th.encre;
      cx.fillText(li.libelle, x + pad, yr);
      cx.font = fonte(corps, fr);
      li.valeurs.forEach((v, k) => {
        const tw = cx.measureText(v).width;
        cx.fillStyle = /^[−-]/.test(v) ? ambre : th.encre;
        cx.fillText(v, x + pad + c1 + (k + 1) * cw - tw, yr);
      });
      cx.fillStyle = filet;
      cx.fillRect(x + pad, yw + 58 + pad + (j + 1) * rh, iw, 1);
    });
    cx.globalAlpha = 1;
    // Les notes, qui s'empilent sous le tableau.
    let yn = yw + hw + 30 + fr * 1.2;
    sc.reperes.forEach((r, k) => {
      const a = apparition(tl, 1.15 + k * pas, 0.4);
      cx.globalAlpha = a;
      cx.font = fonte(corps, fr * 1.12);
      cx.fillStyle = k === actif ? th.encre : douce;
      cx.fillText(r.note, x + (1 - a) * 20, yn);
      yn += fr * 1.9;
      cx.globalAlpha = 1;
    });
  };

  const dessinerScene = (cx: CanvasRenderingContext2D, i: number, tl: number, t: number, sc: Scene, d: number) => {
    if (sc.type === 'fin') return sceneFinV2(cx, env, sc, plans[i].texte, tl);
    if (sc.type === 'marque') return sceneMarque(cx, env, sc, tl);
    const y0 = dessinerTitre(cx, i, tl, t, 'haut') + L * 0.055;
    // Un sous-titre karaoké réserve le bas de l'écran.
    const y1 = H - (vertical ? 250 : 175) - (plans[i].sousTitre ? hauteurSousTitre(env) : 0);
    if (sc.type === 'chiffre') sceneChiffre(cx, sc, tl, y0, y1);
    else if (sc.type === 'liste') sceneListe(cx, sc, tl, y0, y1, d);
    else if (sc.type === 'comparatif') sceneComparatif(cx, sc, tl, y0, y1);
    else if (sc.type === 'analyse') sceneAnalyse(cx, sc, tl, y0, y1, d);
    else if (sc.type === 'tableur') sceneTableur(cx, sc, tl, y0, y1, d);
    else if (sc.type === 'app') sceneApp(cx, env, sc, tl, d, y0, y1);
    else if (sc.type === 'documents') sceneDocuments(cx, env, sc, tl, d, y0, y1);
    else if (sc.type === 'recap') sceneRecap(cx, env, sc, tl, d, y0, y1);
    else if (sc.type === 'site') sceneSite(cx, env, sc, tl, d, y0, y1);
    else if (sc.type === 'bento') sceneBento(cx, env, sc, tl, d, y0, y1);
  };

  // Toile de travail pour les fondus : le plan entrant y est dessiné, puis
  // posé sur le plan sortant avec une opacité croissante.
  const tmp = document.createElement('canvas');
  tmp.width = L;
  tmp.height = H;
  const tctx = tmp.getContext('2d')!;

  const dessinerPlan = (cx: CanvasRenderingContext2D, i: number, t: number) => {
    const x = plans[i];
    const img = sources[i];
    const [a, b] = bornes[i];
    const tl = t - a;
    const u = tl / (b - a);
    debutPlan = a;
    env.t = t;
    env.clip = img instanceof HTMLVideoElement;
    env.repere(i === 0 ? 'whoosh' : 'transition', i === 0 ? 0.1 : 0);
    cx.globalAlpha = 1;
    cx.fillStyle = th.fond;
    cx.fillRect(0, 0, L, H);
    // Coupe sèche (Veolt) : un léger « punch » d'entrée, comme un raccord de montage.
    const punch = m.rythme === 'sec' ? 0.06 * Math.pow(1 - borne(tl / 0.22), 2) : 0;
    const genere = x.source.type === 'media' && m.images.find((k) => x.source.type === 'media' && k.id === x.source.id)?.origine === 'genere';
    const clip = img instanceof HTMLVideoElement;

    const decor = x.source.type === 'carte' ? (x.fond ?? th.fondDefaut ?? 'carte') : 'carte';
    if (x.source.type === 'carte' && decor !== 'carte') {
      cx.save();
      const z = 1 + punch * 0.6;
      cx.translate(L / 2, H / 2);
      cx.scale(z, z);
      cx.translate(-L / 2, -H / 2);
      dessinerFond(cx, env, decor, t);
      cx.restore();
    } else if (x.source.type === 'carte') {
      couvrir(cx, img, L, H, 1 + 0.03 * u + punch);
    } else if (genere) {
      // Un visuel généré porte déjà son texte à la charte : il passe tel quel.
      couvrir(cx, img, L, H, 1 + 0.04 * u + punch);
    } else if (clip && x.scene?.type === 'marque') {
      // Le logotype en 3D (Blender) : plein cadre, sans voile — c'est le sujet.
      couvrir(cx, img, L, H, 1 + punch);
    } else if (clip) {
      // Un clip (Higgsfield, Blender…) : plein cadre, une poussée lente, puis
      // la teinte de la marque et un voile pour que le texte reste lisible.
      couvrir(cx, img, L, H, 1.02 + 0.05 * u + punch);
      cx.fillStyle = `${th.fond}59`;
      cx.fillRect(0, 0, L, H);
      const g = cx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, `${th.fond}99`);
      g.addColorStop(0.3, `${th.fond}00`);
      g.addColorStop(0.62, `${th.fond}00`);
      g.addColorStop(1, `${th.fond}E6`);
      cx.fillStyle = g;
      cx.fillRect(0, 0, L, H);
    } else {
      couvrir(cx, img, L, H, 1 + 0.08 * u + punch);
      // Voile en bas pour que le texte reste lisible sur n'importe quelle image.
      const g = cx.createLinearGradient(0, H * 0.38, 0, H);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.82)');
      cx.fillStyle = g;
      cx.fillRect(0, H * 0.38, L, H * 0.62);
    }

    // La couche 3D des sites, posée en « screen » sur le décor.
    if (x.source.type === 'carte') dessinerNoyau(cx, i, tl, t, b - a);

    // Lueur qui dérive : elle donne de la vie aux fonds fixes, sans distraire.
    if (th.lueur) {
      const cxp = L * (0.5 + 0.32 * Math.sin(t * 0.35));
      const cyp = H * (0.55 + 0.14 * Math.cos(t * 0.27));
      const rg = cx.createRadialGradient(cxp, cyp, 0, cxp, cyp, Math.max(L, H) * 0.55);
      rg.addColorStop(0, th.lueur);
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      cx.globalCompositeOperation = 'lighter';
      cx.fillStyle = rg;
      cx.fillRect(0, 0, L, H);
      cx.globalCompositeOperation = 'source-over';
    }

    if (!genere) {
      if (x.scene && x.scene.type !== 'titre') dessinerScene(cx, i, tl, t, x.scene, b - a);
      else dessinerTitre(cx, i, tl, t, x.source.type === 'media' && !x.centre ? 'bas' : 'centre');
      if (x.annotation) {
        // La note manuscrite en bas à droite de la scène, et sa flèche qui
        // remonte vers ce qu'elle désigne.
        const ax = L * (vertical ? 0.5 : 0.55);
        const ay = H - (vertical ? 250 : 175) - (x.sousTitre ? hauteurSousTitre(env) : 0) - L * 0.01;
        dessinerAnnotation(cx, env, x.annotation, tl, b - a, ax, ay);
        dessinerFleche(cx, env, ax - L * 0.03, ay - L * 0.035, ax - L * 0.12, ay - L * 0.13, borne((tl - (b - a) * 0.5 - 0.5) / 0.5));
      }
      if (x.sousTitre) {
        const v = m.son?.voix?.find((k) => k.t >= a - 0.01 && k.t < b);
        dessinerSousTitre(cx, env, x.sousTitre, tl, b - a, v?.duree ? [v.t - a, v.t - a + v.duree] : undefined);
      }
    }
  };

  /** Barre de progression en haut : elle tient l'œil jusqu'au bout (rétention). */
  const barre = (t: number) => {
    const cx2 = ctx;
    const h = Math.max(6, Math.round(H * 0.005));
    cx2.fillStyle = 'rgba(255,255,255,0.12)';
    cx2.fillRect(0, 0, L, h);
    const cols = th.barre?.length ? th.barre : [th.accent];
    const g = cx2.createLinearGradient(0, 0, L, 0);
    cols.forEach((col, k) => g.addColorStop(cols.length === 1 ? 0 : k / (cols.length - 1), col));
    if (cols.length === 1) g.addColorStop(1, cols[0]);
    cx2.fillStyle = g;
    cx2.fillRect(0, 0, L * borne(t / t0), h);
  };

  const tmp2 = document.createElement('canvas');
  tmp2.width = L;
  tmp2.height = H;
  const tctx2 = tmp2.getContext('2d')!;
  const FONDU_FLOU = 0.5;
  const WHIP = 0.24;

  const dessiner = (k: number) => {
    const t = k / FPS;
    let i = bornes.findIndex(([a, b]) => t >= a && t < b);
    if (i < 0) i = plans.length - 1;
    const [a, b] = bornes[i];
    ctx.filter = 'none';
    if (m.rythme === 'pose' && i > 0 && t - a < FONDU_FLOU) {
      // MagistrIA : fondu enchaîné à travers le flou — l'image sortante se
      // dissout pendant que l'entrante se met au point.
      const p = (t - a) / FONDU_FLOU;
      const e = p * p * (3 - 2 * p);
      dessinerPlan(tctx2, i - 1, Math.min(t, bornes[i - 1][1] - 0.001));
      dessinerPlan(tctx, i, t);
      ctx.fillStyle = th.fond;
      ctx.fillRect(0, 0, L, H);
      if (flou) ctx.filter = `blur(${(e * 12).toFixed(1)}px)`;
      ctx.drawImage(tmp2, 0, 0);
      if (flou) ctx.filter = `blur(${((1 - e) * 12).toFixed(1)}px)`;
      ctx.globalAlpha = e;
      ctx.drawImage(tmp, 0, 0);
      ctx.globalAlpha = 1;
      ctx.filter = 'none';
    } else if (m.rythme === 'sec' && ((i > 0 && t - a < WHIP) || (i < plans.length - 1 && b - t < WHIP * 0.45))) {
      // Veolt : coupe « à travers » — zoom et flou de vitesse de part et
      // d'autre de la coupe, éclair de marque au raccord.
      const entrant = i > 0 && t - a < WHIP;
      const p = entrant ? 1 - (t - a) / WHIP : 1 - (b - t) / (WHIP * 0.45);
      const force = entrant ? p * p : p * p * 0.7;
      dessinerPlan(tctx, i, t);
      ctx.fillStyle = th.fond;
      ctx.fillRect(0, 0, L, H);
      const z = entrant ? 1 + 0.16 * force : 1 + 0.1 * (1 - (b - t) / (WHIP * 0.45));
      ctx.save();
      ctx.translate(L / 2, H / 2);
      ctx.scale(z, z);
      ctx.translate(-L / 2, -H / 2);
      if (flou) ctx.filter = `blur(${(force * 16).toFixed(1)}px)`;
      ctx.drawImage(tmp, 0, 0);
      ctx.restore();
      ctx.filter = 'none';
      if (entrant && th.degrade) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(L / 2, H / 2, 0, L / 2, H / 2, Math.max(L, H) * 0.7);
        g.addColorStop(0, th.degrade[0]);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = force * 0.45;
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, L, H);
        ctx.restore();
      }
    } else {
      dessinerPlan(ctx, i, t);
    }
    // Finitions : vignettage et grain de film (il casse aussi les aplats que
    // l'encodeur transformerait en escaliers).
    vignette(ctx, L, H, 0.42);
    grainFilm(ctx, L, H, t, 0.04);
    barre(t);
  };

  /**
   * Avant de dessiner l'image `k` : chaque clip visible est amené à son instant.
   * Un clip plus court que son plan est ralenti pour le couvrir (5 s de
   * Higgsfield sur un plan de 8 s : ralenti doux, jamais d'image figée).
   */
  const clips = sources.map((s) => (s instanceof HTMLVideoElement ? s : null));
  const preparer = async (k: number) => {
    if (!clips.some(Boolean)) return;
    const t = k / FPS;
    let i = bornes.findIndex(([a2, b2]) => t >= a2 && t < b2);
    if (i < 0) i = plans.length - 1;
    const attentes: Array<Promise<void>> = [];
    for (const j of [i - 1, i, i + 1]) {
      const v = clips[j];
      if (!v) continue;
      const [a2, b2] = bornes[j];
      const tl = Math.min(Math.max(0, t - a2), b2 - a2);
      const vitesse = Math.min(1, ((v.duration || 5) - 0.1) / (b2 - a2));
      attentes.push(positionner(v, tl * vitesse));
    }
    await Promise.all(attentes);
  };

  return {
    canvas: c,
    dessiner,
    preparer,
    bornes,
    nbImages: Math.round(t0 * FPS),
    duree: t0,
    reperes: collecte.liste,
    marque,
    fermer: () => moteur3D?.detruire(),
  };
}

// Banc d'essai en développement : permet de mesurer le rendu image par image.
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  (window as unknown as { __fabrique?: unknown }).__fabrique = { preparerRendu, fabriquer: (m: Montage, p: (n: number) => void) => fabriquerVideo(m, p) };
}

/** Dessine et encode la vidéo, avec sa bande-son. Renvoie le fichier, le mode d'encodage et la bande-son. */
export async function fabriquerVideo(
  m: Montage,
  progres: (pourcent: number) => void,
): Promise<{ fichier: File; mode: string; bandeSon: AudioBuffer | null }> {
  const r = await preparerRendu(m);
  const reglage = m.son ?? { musique: true, bruitages: true };
  const avecSon = reglage.musique || reglage.bruitages || Boolean(reglage.voix?.length);
  const opts: OptionsSon = {
    musique: reglage.musique,
    bruitages: reglage.bruitages,
    style: r.marque,
    volumeMusique: reglage.volume,
    voix: reglage.voix,
    musiqueUrl: reglage.musiqueUrl,
  };
  let bandeSon: AudioBuffer | null = null;
  // Les repères sont collectés pendant le dessin : la bande-son se compose une
  // fois toutes les images passées.
  const composer = async () => (bandeSon = await composerBandeSon(r.duree, r.reperes, opts));
  try {
    const sortieV = await encoder(r.canvas, r.dessiner, r.nbImages, r.duree, m.plafondOctets, progres, avecSon ? composer : null, r.preparer);
    return { ...sortieV, bandeSon };
  } finally {
    r.fermer();
  }
}

/**
 * Le storyboard : une image par plan, prise une seconde après son début (ou au
 * milieu d'un plan court), en vignette JPEG. Mêmes polices, mêmes images, même
 * dessin que la vidéo — ce qu'on voit ici est ce qui sortira.
 */
export async function apercusPlans(m: Montage, largeur = 216): Promise<string[]> {
  const r = await preparerRendu(m);
  const v = document.createElement('canvas');
  v.width = largeur;
  try {
  v.height = Math.round((largeur * m.hauteur) / m.largeur);
  const vctx = v.getContext('2d')!;
  const vignettes: string[] = [];
  for (const [i, [a, b]] of r.bornes.entries()) {
    // Une fois l'entrée du titre jouée : c'est l'image qu'on retient du plan.
    const scene = m.plans[i]?.scene;
    const t = a + (scene && scene.type !== 'titre' ? (b - a) * 0.9 : Math.min(1.5, (b - a) * 0.8));
    await r.preparer(Math.floor(t * FPS));
    r.dessiner(Math.floor(t * FPS));
    vctx.drawImage(r.canvas, 0, 0, v.width, v.height);
    vignettes.push(v.toDataURL('image/jpeg', 0.82));
  }
  return vignettes;
  } finally {
    r.fermer();
  }
}

/** Range la vidéo dans la médiathèque, rattachée au post. */
export async function enregistrerVideo(m: Montage, fichier: File, progres: (pourcent: number) => void): Promise<void> {
  const fd = new FormData();
  fd.set('entite', m.entite);
  fd.set('publication_id', String(m.publicationId));
  fd.set('legende', m.legende);
  fd.set('largeur', String(m.largeur));
  fd.set('hauteur', String(m.hauteur));
  fd.set('duree_s', String(dureeDe(m.plans)));
  fd.set('nom', fichier.name);
  fd.set('origine', 'video');
  let res: { ok: boolean; raison?: string };
  if (m.direct) {
    const { uploadPresigned } = await import('@vercel/blob/client');
    const ext = fichier.type === 'video/mp4' ? 'mp4' : 'webm';
    const blob = await uploadPresigned(`machine-a-post/medias/${crypto.randomUUID()}.${ext}`, fichier, {
      access: 'private',
      contentType: fichier.type,
      handleUploadUrl: `/${m.entite}/medias/televerser`,
      onUploadProgress: ({ percentage }) => progres(Math.round(percentage)),
    });
    fd.set('chemin', blob.pathname);
    res = await enregistrerTeleversement(fd);
  } else {
    progres(50);
    fd.set('fichier', fichier);
    res = await deposerVideoMontee(fd);
  }
  if (!res.ok) throw new Error(res.raison ?? 'Enregistrement refusé.');
  progres(100);
}

/**
 * Encode les images dessinées une à une.
 *
 * Voie principale : WebCodecs + H.264 + conteneur MP4 — le format que les
 * quatre réseaux acceptent, plus vite que le temps réel. Voie de secours,
 * pour un navigateur sans encodeur H.264 : MediaRecorder en temps réel (MP4 si
 * le navigateur sait, sinon WebM — que l'outil signalera comme à convertir).
 */
async function encoder(
  c: HTMLCanvasElement,
  dessiner: (k: number) => void,
  nbImages: number,
  duree: number,
  plafond: number,
  progres: (pourcent: number) => void,
  /** Compose la bande-son une fois toutes les images dessinées (les repères viennent du dessin). */
  bandeSon: (() => Promise<AudioBuffer>) | null,
  /** Prépare l'image `k` (clips positionnés) avant son dessin. */
  preparer: (k: number) => Promise<void> = async () => {},
): Promise<{ fichier: File; mode: string }> {
  // 8 Mbit/s : net en 1080p pour des plans fixes animés. Si le chemin de dépôt
  // est plus étroit, on descend juste ce qu'il faut pour tenir dessous.
  const debit = Math.min(8_000_000, Math.floor((plafond * 0.85 * 8) / Math.max(duree, 1)));

  if ('VideoEncoder' in window) {
    let codec: string | null = null;
    for (const k of ['avc1.640028', 'avc1.4d0028', 'avc1.42e028']) {
      const r = await VideoEncoder.isConfigSupported({ codec: k, width: c.width, height: c.height, bitrate: debit, framerate: FPS });
      if (r.supported) {
        codec = k;
        break;
      }
    }
    if (codec) {
      const { Muxer, ArrayBufferTarget } = await import('mp4-muxer');
      // AAC là où le navigateur l'encode (Chrome et Safari sur Mac et Windows) ;
      // sinon Opus, que les lecteurs récents lisent dans un MP4.
      const audio = bandeSon ? await codecAudio() : null;
      const muxer = new Muxer({
        target: new ArrayBufferTarget(),
        video: { codec: 'avc', width: c.width, height: c.height },
        ...(audio ? { audio: { codec: audio.muxer, numberOfChannels: 2, sampleRate: FREQ } } : {}),
        fastStart: 'in-memory',
        firstTimestampBehavior: 'offset',
      });
      let erreur: unknown = null;
      const enc = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: (e) => (erreur = e) });
      enc.configure({ codec, width: c.width, height: c.height, bitrate: debit, framerate: FPS });
      for (let k = 0; k < nbImages; k++) {
        await preparer(k);
        dessiner(k);
        const vf = new VideoFrame(c, { timestamp: Math.round((k * 1e6) / FPS), duration: Math.round(1e6 / FPS) });
        enc.encode(vf, { keyFrame: k % (FPS * 2) === 0 });
        vf.close();
        if (erreur) throw erreur;
        // Laisser respirer l'encodeur, l'interface et le navigateur : sans
        // rendre la main régulièrement, les images de la couche 3D (WebGL) ne
        // sont jamais libérées et la mémoire grimpe jusqu'à faire tomber l'onglet.
        if (enc.encodeQueueSize > 10 || k % 6 === 5) await new Promise((r) => setTimeout(r, 0));
        if (k % 10 === 0) progres(Math.round((k / nbImages) * 100));
      }
      await enc.flush();
      if (erreur) throw erreur;
      let modeSon = audio || !bandeSon ? '' : ' · sans son (encodeur audio indisponible)';
      if (audio && bandeSon) {
        const b = await bandeSon();
        await encoderAudio(b, audio.webcodecs, (chunk, meta) => muxer.addAudioChunk(chunk, meta));
        modeSon = ` + son ${audio.muxer === 'aac' ? 'AAC' : 'Opus'}`;
      }
      muxer.finalize();
      progres(100);
      return { fichier: new File([muxer.target.buffer], `video-${Date.now()}.mp4`, { type: 'video/mp4' }), mode: `MP4 H.264 (${codec})${modeSon}` };
    }
  }

  // Secours : enregistrement en temps réel. Le son doit alors être prêt avant :
  // une passe de dessin rapide collecte les repères, puis la bande-son est
  // jouée dans le flux pendant l'enregistrement.
  const type = ['video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm'].find((t) => MediaRecorder.isTypeSupported(t));
  if (!type) throw new Error('Ce navigateur ne sait pas fabriquer de vidéo. Utilise Chrome, Edge ou Safari récent.');
  const flux = c.captureStream(0);
  const piste = flux.getVideoTracks()[0] as MediaStreamTrack & { requestFrame?: () => void };
  let lecteur: AudioBufferSourceNode | null = null;
  let actx: AudioContext | null = null;
  if (bandeSon) {
    for (let k = 0; k < nbImages; k += 1) {
      await preparer(k);
      dessiner(k);
      if (k % 30 === 0) await new Promise((r) => setTimeout(r, 0));
    }
    const b = await bandeSon();
    actx = new AudioContext({ sampleRate: FREQ });
    const dest = actx.createMediaStreamDestination();
    lecteur = actx.createBufferSource();
    lecteur.buffer = b;
    lecteur.connect(dest);
    for (const pa of dest.stream.getAudioTracks()) flux.addTrack(pa);
  }
  const rec = new MediaRecorder(flux, { mimeType: type, videoBitsPerSecond: debit });
  const morceaux: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && morceaux.push(e.data);
  const fini = new Promise<void>((r) => (rec.onstop = () => r()));
  rec.start();
  lecteur?.start();
  const debut = performance.now();
  for (let k = 0; k < nbImages; k++) {
    await preparer(k);
    dessiner(k);
    piste.requestFrame?.();
    const attente = debut + ((k + 1) * 1000) / FPS - performance.now();
    if (attente > 0) await new Promise((r) => setTimeout(r, attente));
    if (k % 10 === 0) progres(Math.round((k / nbImages) * 100));
  }
  rec.stop();
  await fini;
  await actx?.close();
  progres(100);
  const mime = type.split(';')[0];
  return {
    fichier: new File(morceaux, `video-${Date.now()}.${mime === 'video/mp4' ? 'mp4' : 'webm'}`, { type: mime }),
    mode: `${mime} (temps réel)`,
  };
}
