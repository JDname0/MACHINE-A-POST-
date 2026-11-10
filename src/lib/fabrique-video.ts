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

import type { PlanMontage } from './montage';
import { deuxLignes } from './coupe';
import { enregistrerTeleversement, deposerVideoMontee } from '@/app/actions';

export interface ImageDispo {
  id: number;
  url: string;
  nom: string;
  origine: string;
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
}

const FPS = 30;
const FONDU = 0.35;
const POLICES: Record<string, { fichier: string; poids: string }> = {
  Bebas: { fichier: 'BebasNeue.ttf', poids: '400' },
  Kanit: { fichier: 'Kanit-Bold.ttf', poids: '700' },
  Spectral: { fichier: 'Spectral-SemiBold.ttf', poids: '600' },
  Inter: { fichier: 'Inter-SemiBold.ttf', poids: '600' },
  Mono: { fichier: 'JetBrainsMono-Medium.woff', poids: '500' },
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

/** Image en « cover » avec un léger zoom lent — le mouvement qui fait d'une image fixe un plan. */
function couvrir(ctx: CanvasRenderingContext2D, img: HTMLImageElement, l: number, h: number, zoom: number) {
  const r = Math.max(l / img.naturalWidth, h / img.naturalHeight) * zoom;
  const w = img.naturalWidth * r;
  const hh = img.naturalHeight * r;
  ctx.drawImage(img, (l - w) / 2, (h - hh) / 2, w, hh);
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

  // Les cartes donnent le fond à la charte (logo, pied, halos, trame) SANS
  // texte : le titre est dessiné ici, pour pouvoir l'animer.
  const sources = await Promise.all(
    plans.map((x, i) => {
      if (x.source.type === 'media') {
        const id = x.source.id;
        return charger(m.images.find((k) => k.id === id)?.url ?? carteDe(i));
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

  /** Le titre d'un plan, coupé comme les visuels, puis replié à la largeur utile. */
  const mise = new Map<number, { lignes: Array<{ t: string; accent: boolean }>; taille: number }>();
  const miseEnPage = (i: number, zoneBas: boolean) => {
    const cle = i * 2 + (zoneBas ? 1 : 0);
    const deja = mise.get(cle);
    if (deja) return deja;
    const brut = th.majuscules ? plans[i].texte.toUpperCase() : plans[i].texte;
    const { ligne1, ligne2 } = deuxLignes(brut);
    const base = th.policeTitre === 'Bebas' ? (vertical ? 0.125 : 0.1) : vertical ? 0.088 : 0.078;
    let taille = Math.round(L * base * (zoneBas ? 0.78 : 1));
    let lignesFinales: Array<{ t: string; accent: boolean }> = [];
    for (let essai = 0; essai < 6; essai++) {
      ctx.font = `${titre.poids} ${taille}px "${titre.famille}", sans-serif`;
      lignesFinales = [
        ...(ligne1 ? lignes(ctx, ligne1, largeurTexte).map((t) => ({ t, accent: false })) : []),
        ...lignes(ctx, ligne2, largeurTexte).map((t) => ({ t, accent: Boolean(th.degrade) })),
      ];
      if (lignesFinales.length <= (vertical ? 6 : 5)) break;
      taille = Math.round(taille * 0.88);
    }
    const r = { lignes: lignesFinales, taille };
    mise.set(cle, r);
    return r;
  };

  /** Le titre animé : décodage de lettres (Veolt) ou montée ligne par ligne (MagistrIA). */
  const dessinerTitre = (cx: CanvasRenderingContext2D, i: number, tl: number, t: number, zoneBas: boolean) => {
    const { lignes: ls, taille } = miseEnPage(i, zoneBas);
    const interligne = taille * (th.policeTitre === 'Bebas' ? 1.0 : 1.12);
    const hauteurBloc = interligne * ls.length;
    let y = zoneBas ? H - (vertical ? 230 : 170) - hauteurBloc + taille : H * 0.47 - hauteurBloc / 2 + taille;
    cx.textBaseline = 'alphabetic';

    // Sur-titre : le pilier du post, sur le plan d'ouverture seulement.
    if (i === 0 && sur && th.surTitre && m.surTitre) {
      const ts = Math.round(L * (th.surTitre.police === 'Mono' ? 0.021 : 0.034));
      cx.font = `${sur.poids} ${ts}px "${sur.famille}", monospace`;
      (cx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${Math.round(ts * 0.28)}px`;
      cx.globalAlpha = sortie(tl / 0.35);
      cx.fillStyle = th.surTitre.couleur;
      cx.fillText(m.surTitre.toUpperCase(), marge, y - taille - ts * 1.4);
      (cx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '0px';
      cx.globalAlpha = 1;
    }

    cx.font = `${titre.poids} ${taille}px "${titre.famille}", sans-serif`;
    ls.forEach((ligne, j) => {
      const remplissage = (largeur: number): string | CanvasGradient => {
        if (!ligne.accent || !th.degrade) return th.encre;
        const g = cx.createLinearGradient(marge, 0, marge + Math.max(largeur, L * 0.4), 0);
        th.degrade.forEach((col, k) => g.addColorStop(k / Math.max(1, th.degrade!.length - 1), col));
        return g;
      };
      const largeur = cx.measureText(ligne.t).width;
      if (th.animation === 'brouillage') {
        // Comme sur veolt.fr : les lettres défilent puis se fixent, de gauche à droite.
        const p = borne((tl - (0.05 + j * 0.07)) / 0.42);
        const fixes = Math.floor(p * ligne.t.length);
        cx.fillStyle = remplissage(largeur);
        let x = marge;
        for (let k = 0; k < ligne.t.length; k++) {
          const vrai = ligne.t[k];
          const montre = k < fixes || vrai === ' ' ? vrai : GLYPHES[Math.floor(hasard(Math.floor(t * 15) * 97 + k * 31 + j * 7 + i * 13) * GLYPHES.length)];
          cx.globalAlpha = k < fixes || vrai === ' ' ? 1 : 0.55;
          cx.fillText(montre, x, y);
          x += cx.measureText(vrai).width;
        }
        cx.globalAlpha = 1;
      } else {
        const e = sortie((tl - (0.08 + j * 0.11)) / 0.6);
        cx.globalAlpha = e;
        cx.fillStyle = remplissage(largeur);
        cx.fillText(ligne.t, marge, y + (1 - e) * 28);
        cx.globalAlpha = 1;
      }
      y += interligne;
    });

    // Le filet sous le titre, comme sur les visuels (marque sans dégradé).
    if (!th.degrade) {
      const e = sortie((tl - (0.1 + ls.length * 0.11)) / 0.5);
      cx.fillStyle = th.accent;
      cx.fillRect(marge, y - interligne + taille * 0.42, 190 * (L / 1080) * e, 5);
    }
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
    cx.globalAlpha = 1;
    cx.fillStyle = th.fond;
    cx.fillRect(0, 0, L, H);
    // Coupe sèche (Veolt) : un léger « punch » d'entrée, comme un raccord de montage.
    const punch = m.rythme === 'sec' ? 0.06 * Math.pow(1 - borne(tl / 0.22), 2) : 0;
    const genere = x.source.type === 'media' && m.images.find((k) => x.source.type === 'media' && k.id === x.source.id)?.origine === 'genere';

    if (x.source.type === 'carte') {
      couvrir(cx, img, L, H, 1 + 0.03 * u + punch);
    } else if (genere) {
      // Un visuel généré porte déjà son texte à la charte : il passe tel quel.
      couvrir(cx, img, L, H, 1 + 0.04 * u + punch);
    } else {
      couvrir(cx, img, L, H, 1 + 0.08 * u + punch);
      // Voile en bas pour que le texte reste lisible sur n'importe quelle image.
      const g = cx.createLinearGradient(0, H * 0.38, 0, H);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.82)');
      cx.fillStyle = g;
      cx.fillRect(0, H * 0.38, L, H * 0.62);
    }

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

    if (!genere) dessinerTitre(cx, i, tl, t, x.source.type === 'media');
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

  const dessiner = (k: number) => {
    const t = k / FPS;
    let i = bornes.findIndex(([a, b]) => t >= a && t < b);
    if (i < 0) i = plans.length - 1;
    const [a] = bornes[i];
    if (m.rythme === 'pose' && i > 0 && t - a < FONDU) {
      dessinerPlan(ctx, i - 1, Math.min(t, bornes[i - 1][1] - 0.001));
      dessinerPlan(tctx, i, t);
      ctx.globalAlpha = (t - a) / FONDU;
      ctx.drawImage(tmp, 0, 0);
      ctx.globalAlpha = 1;
    } else {
      dessinerPlan(ctx, i, t);
    }
    barre(t);
  };

  return { canvas: c, dessiner, bornes, nbImages: Math.round(t0 * FPS), duree: t0 };
}

/** Dessine et encode la vidéo. Renvoie le fichier et le mode d'encodage utilisé. */
export async function fabriquerVideo(m: Montage, progres: (pourcent: number) => void): Promise<{ fichier: File; mode: string }> {
  const r = await preparerRendu(m);
  return encoder(r.canvas, r.dessiner, r.nbImages, r.duree, m.plafondOctets, progres);
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
  v.height = Math.round((largeur * m.hauteur) / m.largeur);
  const vctx = v.getContext('2d')!;
  return r.bornes.map(([a, b]) => {
    // Une fois l'entrée du titre jouée : c'est l'image qu'on retient du plan.
    const t = a + Math.min(1.5, (b - a) * 0.8);
    r.dessiner(Math.floor(t * FPS));
    vctx.drawImage(r.canvas, 0, 0, v.width, v.height);
    return v.toDataURL('image/jpeg', 0.82);
  });
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
      const muxer = new Muxer({ target: new ArrayBufferTarget(), video: { codec: 'avc', width: c.width, height: c.height }, fastStart: 'in-memory' });
      let erreur: unknown = null;
      const enc = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: (e) => (erreur = e) });
      enc.configure({ codec, width: c.width, height: c.height, bitrate: debit, framerate: FPS });
      for (let k = 0; k < nbImages; k++) {
        dessiner(k);
        const vf = new VideoFrame(c, { timestamp: Math.round((k * 1e6) / FPS), duration: Math.round(1e6 / FPS) });
        enc.encode(vf, { keyFrame: k % (FPS * 2) === 0 });
        vf.close();
        if (erreur) throw erreur;
        // Laisser respirer l'encodeur et l'interface.
        if (enc.encodeQueueSize > 10) await new Promise((r) => setTimeout(r, 0));
        if (k % 10 === 0) progres(Math.round((k / nbImages) * 100));
      }
      await enc.flush();
      if (erreur) throw erreur;
      muxer.finalize();
      progres(100);
      return { fichier: new File([muxer.target.buffer], `video-${Date.now()}.mp4`, { type: 'video/mp4' }), mode: `MP4 H.264 (${codec})` };
    }
  }

  // Secours : enregistrement en temps réel.
  const type = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find((t) => MediaRecorder.isTypeSupported(t));
  if (!type) throw new Error('Ce navigateur ne sait pas fabriquer de vidéo. Utilise Chrome, Edge ou Safari récent.');
  const flux = c.captureStream(0);
  const piste = flux.getVideoTracks()[0] as MediaStreamTrack & { requestFrame?: () => void };
  const rec = new MediaRecorder(flux, { mimeType: type, videoBitsPerSecond: debit });
  const morceaux: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && morceaux.push(e.data);
  const fini = new Promise<void>((r) => (rec.onstop = () => r()));
  rec.start();
  const debut = performance.now();
  for (let k = 0; k < nbImages; k++) {
    dessiner(k);
    piste.requestFrame?.();
    const attente = debut + ((k + 1) * 1000) / FPS - performance.now();
    if (attente > 0) await new Promise((r) => setTimeout(r, attente));
    if (k % 10 === 0) progres(Math.round((k / nbImages) * 100));
  }
  rec.stop();
  await fini;
  progres(100);
  const mime = type.split(';')[0];
  return {
    fichier: new File(morceaux, `video-${Date.now()}.${mime === 'video/mp4' ? 'mp4' : 'webm'}`, { type: mime }),
    mode: `${mime} (temps réel)`,
  };
}
