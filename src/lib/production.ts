/**
 * Production des vidéos au rythme du calendrier.
 *
 * Chaque post vidéo a une **échéance de production** : sa vidéo doit exister
 * N jours avant sa date de publication (réglable : la veille par défaut), pour
 * laisser le temps de la relire et de la valider. L'outil dit ce qui est prêt, ce qui est
 * à monter et ce qui est en retard — et la production en lot fabrique d'un
 * coup tout ce qui est dû.
 *
 * Le montage par défaut d'un post (plans + images) est calculé ici, une seule
 * fois, pour le studio comme pour le lot.
 */

import { db } from './db';
import { publications, type LignePublication } from './requetes';
import { attendu, dureeConseillee } from './conformite-media';
import { visuelsDuPost } from './fiche';
import { videosDe } from './videos';
import { cadreVideo, plansDepuisPost, plansDepuisScript, type PlanMontage } from './montage';
import { deuxLignes, THEMES } from './visuels';
import { TYPES_IMAGE, depotDirect, plafondDepotVideo } from './medias';
import type { Montage, ThemeStudio } from './fabrique-video';
import { marque, type EntiteSlug } from './marques';

/** Horizon de l'anticipation : ce qui sera dû dans les sept jours. */
export const HORIZON_LOT_JOURS = 7;

// ── Réglages : quand et comment produire ───────────────────────────────────

/** Combien de jours avant la publication la vidéo doit exister. */
export const DELAIS = [
  { jours: 0, libelle: 'le jour même' },
  { jours: 1, libelle: 'la veille' },
  { jours: 3, libelle: 'trois jours avant' },
  { jours: 7, libelle: 'une semaine avant' },
] as const;

/**
 * - `boutons` : rien ne se fabrique sans un clic ;
 * - `rappel` : un bandeau sur toutes les pages le jour où une vidéo est due ;
 * - `auto` : la vidéo due se fabrique dès que l'outil est ouvert ce jour-là —
 *   elle reste à relire et à valider, comme toutes les autres.
 */
export const MODES = [
  { slug: 'boutons', libelle: 'Boutons seulement' },
  { slug: 'rappel', libelle: 'Rappel le jour venu' },
  { slug: 'auto', libelle: 'Automatique à l’ouverture' },
] as const;
export type ModeVideo = (typeof MODES)[number]['slug'];

export interface ReglagesVideo {
  delai: number;
  mode: ModeVideo;
}

export function reglagesVideo(entite: EntiteSlug): ReglagesVideo {
  const lire = (cle: string) =>
    (db().prepare('SELECT valeur FROM reglages WHERE cle=?').get(`video.${cle}.${entite}`) as { valeur: string } | undefined)?.valeur;
  const delai = Number(lire('delai'));
  const mode = lire('mode');
  return {
    delai: DELAIS.some((d) => d.jours === delai) ? delai : 1,
    mode: MODES.some((m) => m.slug === mode) ? (mode as ModeVideo) : 'rappel',
  };
}

export function poserReglagesVideo(entite: EntiteSlug, r: ReglagesVideo) {
  const ecrire = db().prepare('INSERT INTO reglages (cle, valeur) VALUES (?, ?) ON CONFLICT(cle) DO UPDATE SET valeur=excluded.valeur');
  ecrire.run(`video.delai.${entite}`, String(r.delai));
  ecrire.run(`video.mode.${entite}`, r.mode);
}

/**
 * - `prete` : une vidéo est rattachée ;
 * - `en-retard` : l'échéance est passée ;
 * - `aujourdhui` : c'est le jour de la produire ;
 * - `bientot` : dans les sept jours — on peut la faire en avance ;
 * - `plus-tard`.
 */
export type EtatVideo = 'prete' | 'en-retard' | 'aujourdhui' | 'bientot' | 'plus-tard';

export interface EcheanceVideo {
  p: LignePublication;
  echeance: string;
  etat: EtatVideo;
  joursRestants: number;
}

const iso = (d: Date) => d.toISOString().slice(0, 10);
const jours = (de: string, a: string) => Math.round((Date.parse(`${a}T12:00:00Z`) - Date.parse(`${de}T12:00:00Z`)) / 86_400_000);

export function aUneVideo(publicationId: number): boolean {
  return Boolean(
    db().prepare("SELECT 1 FROM medias WHERE publication_id=? AND type_mime LIKE 'video/%' LIMIT 1").get(publicationId),
  );
}

export function echeancesVideo(entite: EntiteSlug, aujourdhui = new Date()): EcheanceVideo[] {
  const jour = iso(aujourdhui);
  const { delai } = reglagesVideo(entite);
  return publications(entite)
    .filter((p) => attendu(p.format_slug) === 'video' && p.statut !== 'publie' && p.statut !== 'abandonne')
    .map((p) => {
      const d = new Date(`${p.date_prevue}T12:00:00Z`);
      d.setUTCDate(d.getUTCDate() - delai);
      const echeance = iso(d);
      const restants = jours(jour, echeance);
      const etat: EtatVideo = aUneVideo(p.id)
        ? 'prete'
        : restants < 0
          ? 'en-retard'
          : restants === 0
            ? 'aujourdhui'
            : restants <= HORIZON_LOT_JOURS
              ? 'bientot'
              : 'plus-tard';
      return { p, echeance, etat, joursRestants: restants };
    });
}

export interface ImageMemoire {
  id: number;
  nom: string;
  origine: string;
  publication_id: number | null;
  semaine: number | null;
}

/** Les images de la mémoire d'une entité (pas les vidéos), avec la semaine du post auquel elles sont rattachées. */
export function imagesMemoire(entite: EntiteSlug): ImageMemoire[] {
  const types = Object.keys(TYPES_IMAGE);
  return db()
    .prepare(
      `SELECT m.id, m.nom, m.origine, m.publication_id, p.semaine
         FROM medias m LEFT JOIN publications p ON p.id = m.publication_id
        WHERE m.entite = ? AND m.type_mime IN (${types.map(() => '?').join(',')})
        ORDER BY m.id DESC`,
    )
    .all(entite, ...types) as ImageMemoire[];
}

/** Les clips vidéo de la médiathèque (Higgsfield, Blender…), utilisables comme fonds de plan. */
export function clipsMemoire(entite: EntiteSlug): Array<{ id: number; nom: string; origine: string }> {
  return db()
    .prepare("SELECT id, nom, origine FROM medias WHERE entite=? AND origine='clip' AND type_mime LIKE 'video/%' ORDER BY id DESC")
    .all(entite) as Array<{ id: number; nom: string; origine: string }>;
}

/** Les images et les clips proposés au studio, sous la forme qu'attend le rendu. */
export function matiereStudio(entite: EntiteSlug, memoire: ImageMemoire[]) {
  return [
    ...memoire.map((x) => ({ id: x.id, url: `/${entite}/medias/${x.id}`, nom: x.nom, origine: x.origine, type: 'image' as const })),
    ...clipsMemoire(entite).map((x) => ({ id: x.id, url: `/${entite}/medias/${x.id}`, nom: x.nom, origine: x.origine, type: 'video' as const })),
  ];
}

/** Les morceaux de musique déposés pour une entité (Higgsfield / ElevenLabs Music, Suno…). */
export function musiquesDe(entite: EntiteSlug): Array<{ id: number; nom: string; url: string; publication_id: number | null }> {
  return (
    db()
      .prepare("SELECT id, nom, publication_id FROM medias WHERE entite=? AND origine='musique' AND type_mime LIKE 'audio/%' ORDER BY id DESC")
      .all(entite) as Array<{ id: number; nom: string; publication_id: number | null }>
  ).map((m) => ({ ...m, url: `/${entite}/medias/${m.id}` }));
}

export interface MontageParDefaut {
  plans: PlanMontage[];
  cartes: string[];
  largeur: number;
  hauteur: number;
  ratio: string;
  scriptRef: string | null;
}

/**
 * Le montage d'un post sans retouche : le script écrit pour ce format et ce
 * pilier s'il existe, sinon des plans tirés du texte du post.
 *
 * Les images viennent de la mémoire, sans rien inventer :
 *  - en ouverture, la carte animée (le titre du post, avec son entrée) ;
 *  - au milieu, les images **apportées** (rendus 3D, Higgsfield, photos)
 *    rattachées au post, puis celles de la même semaine ;
 *  - la fermeture garde la carte : l'appel à l'action doit rester lisible.
 */
export function montageParDefaut(p: LignePublication, memoire: ImageMemoire[], scriptRef?: string): MontageParDefaut {
  const scripts = videosDe(p.entite as EntiteSlug);
  // Le script écrit pour ce post (vidéo cas d'usage), sinon celui écrit pour
  // son **sujet**, dans un format au même cadre. Jamais par le seul pilier : un
  // post « avant / après » recevait sinon le script du packshot 3D, parce que
  // les deux sont du pilier « montrer le travail ». Sans script, les plans
  // viennent du texte du post.
  const vertical = new Set(['ig-reel', 'tiktok-video']);
  const memeCadre = (a: string, b: string) => a === b || (vertical.has(a) && vertical.has(b));
  const auto =
    scripts.find((s) => s.ref === p.sujet_ref) ??
    scripts.find((s) => !s.casUsage && !!s.sujet && s.sujet === p.sujet_ref && memeCadre(s.formatSlug, p.format_slug));
  const script = scriptRef === 'post' ? undefined : scripts.find((s) => s.ref === scriptRef) ?? auto;
  const conseil = dureeConseillee(p.format_slug)?.conseil;
  const plans = script ? plansDepuisScript(script) : plansDepuisPost(p, conseil);
  // Les clips nommés par le script (« veolt-orbite ») pris dans la médiathèque.
  const clips = clipsMemoire(p.entite as EntiteSlug);
  plans.forEach((x, i) => {
    const c = x.clip ? clips.find((k) => k.nom.replace(/\.[a-z0-9]+$/i, '') === x.clip) : undefined;
    if (c) plans[i] = { ...x, source: { type: 'media', id: c.id } };
  });

  // L'ouverture reste la carte animée (sur-titre + titre qui entre) : les trois
  // premières secondes décident de la rétention, une image fixe les gâche. Les
  // visuels mémorisés restent au choix dans le studio, plan par plan.

  const matiere = [
    ...memoire.filter((m) => m.origine === 'apporte' && m.publication_id === p.id),
    ...memoire.filter((m) => m.origine === 'apporte' && m.publication_id !== p.id && m.semaine != null && m.semaine === p.semaine),
  ];
  // Chaque image apportée sert une fois au plus, répartie sur le milieu de la
  // vidéo : la même image cinq fois de suite se voit, et fait pauvre. Les plans
  // restants gardent la carte à la charte.
  const milieu = plans.length - 2;
  if (matiere.length && milieu > 0) {
    const pas = Math.max(1, Math.floor(milieu / matiere.length));
    for (let k = 0, i = 1; k < matiere.length && i < plans.length - 1; k++, i += pas) {
      plans[i] = { ...plans[i], source: { type: 'media', id: matiere[k].id } };
    }
  }

  const cadre = cadreVideo(p.format_slug, script?.cadre);
  // La carte au cadre de la vidéo : rognée, une carte 9:16 dans une vidéo 4:5
  // perdrait l'en-tête et le pied de marque, et le texte toucherait le bord.
  const gabarit = cadre.ratio === '9:16' ? 'reel' : 'affirmation';
  const cartes = plans.map((x) => {
    const { ligne1, ligne2 } = deuxLignes(x.texte);
    return `/${p.entite}/visuels/${gabarit}?${new URLSearchParams({ ligne1, ligne2, sousTitre: '' })}`;
  });
  // Sans script : la vidéo finit sur l'écran de fin complet de la marque
  // (logotype, la phrase d'appel du post, bouton, adresse).
  if (!script && plans.length > 1) {
    const dernier = plans[plans.length - 1];
    plans[plans.length - 1] = { ...dernier, duree: Math.max(4.5, dernier.duree), scene: { type: 'fin', action: actionMarque(p.entite as EntiteSlug) } };
    // La 3D des sites aussi dans les vidéos tirées du texte : la forme se construit
    // derrière le titre d'ouverture, et revient, discrète, sous l'écran de fin.
    const forme = p.entite === 'veolt' ? ('sphere' as const) : ('cerveau' as const);
    if (plans[0].source.type === 'carte') plans[0] = { ...plans[0], noyau: { forme, place: 'fond', construction: true, intensite: 0.22 } };
    plans[plans.length - 1] = { ...plans[plans.length - 1], noyau: { forme: p.entite === 'veolt' ? 'galaxie' : 'cerveau', place: 'fond', cadran: true, intensite: 0.16 } };
  }
  return { plans, cartes, largeur: cadre.largeur, hauteur: cadre.hauteur, ratio: cadre.ratio, scriptRef: script?.ref ?? null };
}

/**
 * Le style vidéo de chaque marque, relevé sur son site en ligne le 10/11/2026.
 *  - Veolt (veolt.fr) : Bebas en capitales, seconde ligne en dégradé magenta →
 *    lavande, titres qui se « décodent » lettre à lettre comme sur le site,
 *    barre au dégradé signature magenta → violet → orange.
 *  - MagistrIA (magistrai.fr) : Spectral blanc sur nuit, sur-titre JetBrains
 *    Mono cyan, entrée douce ligne à ligne, filet et barre cyan.
 */
export function themeStudio(e: EntiteSlug): ThemeStudio {
  const t = THEMES[e].clair;
  if (e === 'veolt') {
    return {
      fond: t.fond,
      encre: t.encre,
      accent: t.accent,
      policeTitre: 'Bebas',
      degrade: ['#B600A8', '#C79BFF'],
      barre: ['#B600A8', '#7621B0', '#BE4C00'],
      animation: 'brouillage',
      surTitre: { couleur: '#C79BFF', police: 'Bebas' },
      lueur: 'rgba(182,0,168,0.13)',
      majuscules: true,
      douce: '#A9A6B8',
      surface: 'rgba(237,235,242,0.06)',
      filet: 'rgba(237,235,242,0.18)',
      ambre: '#FF8A3D',
      // Le bouton du site : violet → magenta.
      bouton: { fond: ['#7621B0', '#B600A8'], encre: '#FFFFFF' },
      adresse: t.adresse,
      accent2: '#C79BFF',
      // « Veolt vous met sur orbite » : l'arc d'une planète au dégradé signature.
      arc: ['#B600A8', '#7621B0', '#BE4C00'],
      rayons: ['#B600A8', '#BE4C00', '#7621B0'],
      fondDefaut: 'horizon',
      motMarque: ['VEOLT', '', '#FFFFFF'],
      slogan: 'Veolt vous met sur orbite',
      // L'écran produit en verre sombre teinté violet, comme les cartes de veolt.fr.
      app: {
        fond: '#16131B',
        encre: '#EDEBF2',
        douce: '#A9A6B8',
        accent: '#C79BFF',
        filet: 'rgba(237,235,242,0.14)',
        puce: 'rgba(199,155,255,0.16)',
        alerte: 'rgba(190,76,0,0.24)',
        alerteEncre: '#FFB27A',
        neutre: 'rgba(255,255,255,0.05)',
        ok: '#C79BFF',
        surAccent: '#16131B',
        champ: 'rgba(255,255,255,0.06)',
        verre: true,
        teinte: 'rgba(34,12,48,0.42)',
        bouton: ['#7621B0', '#B600A8'],
        papier: '#7621B0',
      },
    };
  }
  return {
    fond: t.fond,
    encre: t.encre,
    accent: t.accent,
    policeTitre: 'Spectral',
    barre: ['#3CC8FF'],
    animation: 'montee',
    surTitre: { couleur: '#7FB7D9', police: 'Mono' },
    lueur: 'rgba(60,200,255,0.08)',
    majuscules: false,
    douce: '#9AA9BB',
    surface: 'rgba(233,238,245,0.05)',
    filet: 'rgba(80,190,255,0.22)',
    ambre: '#FF9A3C',
    // Le bouton « Essayer gratuitement » du site : bordeaux.
    bouton: { fond: ['#7B2D3E', '#94384C'], encre: '#FFFFFF' },
    adresse: t.adresse,
    accent2: '#E0B85A',
    arc: ['#3CC8FF', '#7FB7D9', '#FF9A3C'],
    rayons: ['#3CC8FF', '#E0B85A'],
    fondDefaut: 'etoiles',
    motMarque: ['Magistr', 'IA', '#E0B85A'],
    slogan: 'L’intelligence au service du droit.',
    // L'écran produit aux couleurs du site en ligne (le blanc + bordeaux est
    // périmé pour les contenus, voir CLAUDE.md) : verre nuit, encre #E9EEF5,
    // accents cyan, renvois or ; le bordeaux ne sert qu'au bouton d'action.
    app: {
      fond: '#0A111E',
      encre: '#E9EEF5',
      douce: '#9AA9BB',
      accent: '#3CC8FF',
      filet: 'rgba(127,183,217,0.20)',
      puce: 'rgba(60,200,255,0.14)',
      alerte: 'rgba(255,154,60,0.15)',
      alerteEncre: '#FFB877',
      neutre: 'rgba(233,238,245,0.05)',
      ok: '#7FDBFF',
      surAccent: '#03050A',
      champ: 'rgba(233,238,245,0.06)',
      verre: true,
      teinte: 'rgba(8,18,36,0.46)',
      bouton: ['#7B2D3E', '#94384C'],
      papier: '#7B2D3E',
    },
  };
}

/** Le bouton d'action de chaque marque, tel que sur son site. */
export function actionMarque(e: EntiteSlug): string {
  return e === 'veolt' ? 'Demander l’analyse gratuite' : 'Essayer gratuitement';
}

/** Le nom lisible du pilier d'un post, pour le sur-titre d'ouverture. */
export function nomPilier(p: LignePublication): string {
  return marque(p.entite as EntiteSlug).piliers.find((x) => x.slug === p.pilier)?.nom ?? '';
}

/** Le montage complet d'un post, prêt à fabriquer dans le navigateur (studio, lot, boutons). */
export function montagePret(p: LignePublication, memoire: ImageMemoire[], scriptRef?: string): Montage {
  const e = p.entite as EntiteSlug;
  const md = montageParDefaut(p, memoire, scriptRef);
  return {
    entite: e,
    publicationId: p.id,
    largeur: md.largeur,
    hauteur: md.hauteur,
    plans: md.plans,
    cartes: md.cartes,
    images: matiereStudio(e, memoire),
    theme: themeStudio(e),
    surTitre: nomPilier(p),
    rythme: e === 'veolt' ? 'sec' : 'pose',
    direct: depotDirect(),
    plafondOctets: plafondDepotVideo(),
    legende: p.titre ?? '',
    son: sonParDefaut(p, md.plans),
  };
}

/**
 * La bande-son par défaut d'un post : le morceau rattaché au post s'il y en a
 * un (sinon la musique synthétisée de la marque), les bruitages, et les voix
 * off du post, chacune au début de son plan.
 */
export function sonParDefaut(p: LignePublication, plans: Array<{ duree: number }>) {
  const e = p.entite as EntiteSlug;
  const debut = (k: number) => plans.slice(0, k).reduce((n, x) => n + x.duree, 0) + 0.25;
  // Le morceau du post, sinon la signature sonore de la marque (morceau sans post).
  const tous = musiquesDe(e);
  const morceau = tous.find((m) => m.publication_id === p.id) ?? tous.find((m) => m.publication_id == null);
  return {
    musique: true,
    bruitages: true,
    musiqueUrl: morceau?.url,
    voix: voixDuPost(p.id, e)
      .filter((v) => v.plan < plans.length)
      .map((v) => ({ t: debut(v.plan), url: v.url, ...(v.duree ? { duree: v.duree } : {}) })),
  };
}

/** Les formats vidéo que la marque peut utiliser (réseau non exclu). */
export function formatsVideoDe(entite: EntiteSlug): string[] {
  const r = marque(entite).reseaux;
  const tous: Array<[string, keyof typeof r]> = [
    ['li-video', 'linkedin'],
    ['ig-reel', 'instagram'],
    ['ig-video', 'instagram'],
    ['tiktok-video', 'tiktok'],
  ];
  return tous.filter(([, reseau]) => r[reseau] && r[reseau] !== 'exclu').map(([f]) => f);
}

export interface VideoProduite {
  id: number;
  nom: string;
  octets: number;
  duree_s: number | null;
  largeur: number | null;
  hauteur: number | null;
  cree_le: string;
  publication_id: number | null;
  titre: string | null;
  date_prevue: string | null;
  format_slug: string | null;
  semaine: number | null;
}

/** Les vidéos rangées dans la médiathèque d'une entité, la plus récente d'abord. */
export function videosProduites(entite: EntiteSlug): VideoProduite[] {
  return db()
    .prepare(
      `SELECT m.id, m.nom, m.octets, m.duree_s, m.largeur, m.hauteur, m.cree_le, m.publication_id,
              p.titre, p.date_prevue, p.format_slug, p.semaine
         FROM medias m LEFT JOIN publications p ON p.id = m.publication_id
        WHERE m.entite = ? AND m.type_mime LIKE 'video/%' AND m.origine != 'clip'
        ORDER BY m.id DESC`,
    )
    .all(entite) as VideoProduite[];
}

/**
 * Les visuels à générer aujourd'hui : posts dont l'échéance (publication −
 * délai réglé) est atteinte, qui ont un visuel, et dont aucun visuel n'est
 * encore mémorisé. Contrairement aux vidéos, les images se fabriquent sur le
 * serveur : pas besoin d'avoir l'outil ouvert dans un navigateur puissant.
 */
export function visuelsDus(entite: EntiteSlug, aujourdhui = new Date()): LignePublication[] {
  const { delai } = reglagesVideo(entite);
  const limite = new Date(aujourdhui);
  limite.setUTCDate(limite.getUTCDate() + delai);
  const borne = iso(limite);
  const memorises = new Set(
    (db().prepare("SELECT DISTINCT publication_id FROM medias WHERE entite=? AND origine='genere' AND publication_id IS NOT NULL").all(entite) as Array<{
      publication_id: number;
    }>).map((x) => x.publication_id),
  );
  return publications(entite).filter(
    (p) =>
      p.statut !== 'publie' &&
      p.statut !== 'abandonne' &&
      p.date_prevue <= borne &&
      !memorises.has(p.id) &&
      visuelsDuPost(p).length > 0,
  );
}

/**
 * La photo de fond d'un post (générée par Higgsfield ou déposée), la plus
 * récente. À défaut, celle d'un autre post du même sujet (même marque, même
 * titre) : le calendrier reprend un sujet plusieurs fois, la photo suit, sans
 * dupliquer le fichier.
 */
export function photoDuPost(p: { id: number; entite: string; titre: string | null }): number | null {
  const d = db();
  const propre = d
    .prepare("SELECT id FROM medias WHERE publication_id=? AND origine='photo' AND type_mime LIKE 'image/%' ORDER BY id DESC LIMIT 1")
    .get(p.id) as { id: number } | undefined;
  if (propre) return propre.id;
  if (!p.titre) return null;
  const partagee = d
    .prepare(
      `SELECT m.id FROM medias m JOIN publications x ON x.id = m.publication_id
        WHERE m.origine='photo' AND m.type_mime LIKE 'image/%' AND x.entite=? AND x.titre=?
        ORDER BY m.id DESC LIMIT 1`,
    )
    .get(p.entite, p.titre) as { id: number } | undefined;
  return partagee?.id ?? null;
}

/** Les voix off ElevenLabs d'un post, plan par plan (voir `genererVoixOff`). */
export function voixDuPost(publicationId: number, entite: EntiteSlug): Array<{ plan: number; url: string; duree?: number }> {
  const lignes = db()
    .prepare("SELECT id, nom, duree_s FROM medias WHERE publication_id=? AND origine='voix' AND type_mime LIKE 'audio/%' ORDER BY id")
    .all(publicationId) as Array<{ id: number; nom: string; duree_s: number | null }>;
  return lignes
    .map((l) => ({ plan: Number(/plan-(\d+)/.exec(l.nom)?.[1] ?? -1), url: `/${entite}/medias/${l.id}`, ...(l.duree_s ? { duree: l.duree_s } : {}) }))
    .filter((v) => v.plan >= 0);
}
