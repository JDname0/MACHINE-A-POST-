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
  encre: string;
  accent: string;
  policeTitre: string;
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
}

const FPS = 30;
const FONDU = 0.35;
const POLICES: Record<string, { fichier: string; poids: string }> = {
  Bebas: { fichier: 'BebasNeue.ttf', poids: '400' },
  Kanit: { fichier: 'Kanit-Bold.ttf', poids: '700' },
  Spectral: { fichier: 'Spectral-Bold.ttf', poids: '700' },
  Inter: { fichier: 'Inter-SemiBold.ttf', poids: '600' },
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

/** Dessine et encode la vidéo. Renvoie le fichier et le mode d'encodage utilisé. */
/** Charge polices et images, et renvoie de quoi dessiner n'importe quelle image de la vidéo. */
async function preparerRendu(m: Montage) {
  const { largeur: L, hauteur: H, plans } = m;
  const c = document.createElement('canvas');
  c.width = L;
  c.height = H;
  const ctx = c.getContext('2d')!;
  const carteDe = (i: number) => m.cartes[i] ?? m.cartes[m.cartes.length - 1];

  // Police de la charte, servie par /polices — sans elle, le navigateur
  // incrusterait dans une police système et la vidéo sortirait de la marque.
  const pol = POLICES[m.theme.policeTitre] ?? POLICES.Inter;
  const famille = `Studio${m.theme.policeTitre}`;
  if (![...document.fonts].some((f) => f.family === famille)) {
    const ff = new FontFace(famille, `url(/polices/${pol.fichier})`, { weight: pol.poids });
    document.fonts.add(await ff.load());
  }

  // Les cartes sont régénérées avec le texte du plan tel qu'il est au moment de fabriquer.
  const sources = await Promise.all(
    plans.map((x, i) => {
      if (x.source.type === 'media') {
        const id = x.source.id;
        return charger(m.images.find((k) => k.id === id)?.url ?? carteDe(i));
      }
      const u = new URL(carteDe(i), window.location.origin);
      const { ligne1, ligne2 } = deuxLignes(x.texte);
      u.searchParams.set('ligne1', ligne1);
      u.searchParams.set('ligne2', ligne2);
      u.searchParams.set('sousTitre', '');
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

  // Toile de travail pour les fondus : le plan entrant y est dessiné, puis
  // posé sur le plan sortant avec une opacité croissante.
  const tmp = document.createElement('canvas');
  tmp.width = L;
  tmp.height = H;
  const tctx = tmp.getContext('2d')!;

  const dessinerPlan = (cx: CanvasRenderingContext2D, i: number, u: number) => {
    const x = plans[i];
    const img = sources[i];
    cx.globalAlpha = 1;
    cx.fillStyle = m.theme.fond;
    cx.fillRect(0, 0, L, H);
    // Une carte, ou un visuel généré par l'outil, porte déjà son texte à la
    // charte : il passe tel quel, sans seconde incrustation par-dessus.
    const brut = x.source.type === 'carte' || m.images.find((k) => x.source.type === 'media' && k.id === x.source.id)?.origine === 'genere';
    if (brut) {
      couvrir(cx, img, L, H, 1 + 0.04 * u);
      return;
    }
    couvrir(cx, img, L, H, 1 + 0.08 * u);
    // Voile en bas pour que le texte reste lisible sur n'importe quelle image.
    const g = cx.createLinearGradient(0, H * 0.42, 0, H);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.78)');
    cx.fillStyle = g;
    cx.fillRect(0, H * 0.42, L, H * 0.58);
    const taille = Math.round(L * 0.075);
    cx.font = `${pol.poids} ${taille}px "${famille}", sans-serif`;
    cx.textBaseline = 'alphabetic';
    const ls = lignes(cx, x.texte, L - 160);
    const hauteurLigne = taille * 1.12;
    let y = H - 170 - (ls.length - 1) * hauteurLigne;
    cx.fillStyle = m.theme.accent;
    cx.fillRect(80, y - taille - 28, 90, 10);
    cx.fillStyle = '#FFFFFF';
    for (const l of ls) {
      cx.fillText(l, 80, y);
      y += hauteurLigne;
    }
  };

  const dessiner = (k: number) => {
    const t = k / FPS;
    let i = bornes.findIndex(([a, b]) => t >= a && t < b);
    if (i < 0) i = plans.length - 1;
    const [a, b] = bornes[i];
    const u = (t - a) / (b - a);
    if (m.rythme === 'pose' && i > 0 && t - a < FONDU) {
      dessinerPlan(ctx, i - 1, 1);
      dessinerPlan(tctx, i, u);
      ctx.globalAlpha = (t - a) / FONDU;
      ctx.drawImage(tmp, 0, 0);
      ctx.globalAlpha = 1;
      return;
    }
    dessinerPlan(ctx, i, u);
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
    const t = Math.min(a + 1, (a + b) / 2);
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
