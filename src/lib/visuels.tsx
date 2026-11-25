/* eslint-disable @next/next/no-img-element */
/**
 * Générateur de visuels — rend de vraies images PNG aux dimensions des réseaux.
 *
 * Rendu par `next/og` (Satori) : la mise en page est en flexbox seulement,
 * il n'y a ni grille ni flou. Les halos de la référence sont donc refaits en
 * dégradés radiaux superposés plutôt qu'en `filter: blur` — le résultat est
 * proche et, surtout, il est reproductible côté serveur.
 *
 * Les polices sont celles des deux cadrages, embarquées dans le dépôt
 * (`src/assets/polices`) : Satori a besoin des fichiers, pas d'une feuille de
 * style — et dépendre de Google Fonts à chaque rendu ajouterait une panne
 * possible à chaque image.
 */

import type { EntiteSlug } from './marques';
import { DEGRADE_MOT } from './logo-veolt';
import { URL_PNG_V } from './logo-veolt-png';
import { URL_PNG_SPHERE } from './sphere-veolt-png';
import { cadrer, type Cadrage } from './illustrations';
import { PACKS_VEOLT, type PackVeolt } from './offres-veolt';

/** Une illustration du pack, prête pour Satori : octets en `data:`, dimensions, cadrage. */
export interface ImageCadree {
  donnees: string;
  largeur: number;
  hauteur: number;
  cadrage?: Cadrage;
  /** Ce qu'est l'image (« Illustration IA », « Concept Veolt · … »), dit dans le cadre. */
  mention?: string;
  /** Capture mobile réelle : montrée dans un téléphone. */
  forme?: 'telephone';
}

export type GabaritSlug = 'lancement' | 'affirmation' | 'chiffre' | 'carrousel' | 'reel' | 'couverture';

export interface Gabarit {
  slug: GabaritSlug;
  nom: string;
  largeur: number;
  hauteur: number;
  ratio: string;
  usage: string;
  /** Pourquoi ce visuel existe. Une phrase, affichée dans l'interface. */
  intention: string;
}

export const GABARITS: Record<GabaritSlug, Gabarit> = {
  lancement: {
    slug: 'lancement',
    nom: 'Lancement',
    largeur: 1080,
    hauteur: 1350,
    ratio: '4:5',
    usage: 'LinkedIn texte + image · Instagram carrousel (visuel 1)',
    intention: "Le post qui dit qui on est, ce qu'on fait et où aller. C'est la semaine 1 du cadrage, « Exister ».",
  },
  affirmation: {
    slug: 'affirmation',
    nom: 'Affirmation',
    largeur: 1080,
    hauteur: 1350,
    ratio: '4:5',
    usage: 'LinkedIn texte + image · Instagram carrousel',
    intention: "Une seule phrase, en très grand. Elle doit se lire en vignette et se retenir sans le texte du post.",
  },
  chiffre: {
    slug: 'chiffre',
    nom: 'Chiffre',
    largeur: 1080,
    hauteur: 1080,
    ratio: '1:1',
    usage: 'LinkedIn texte + image · Instagram',
    intention: "Un nombre et sa lecture. Le pilier « Démonter un chiffre » côté Veolt, « Un arrêt, une conséquence » côté MagistrIA.",
  },
  carrousel: {
    slug: 'carrousel',
    nom: 'Couverture de carrousel',
    largeur: 1080,
    hauteur: 1350,
    ratio: '4:5',
    usage: 'LinkedIn carrousel (page 1) · Instagram carrousel',
    intention: "La page 1 décide de l'ouverture. Le titre doit être lisible en vignette, en 6 à 10 mots.",
  },
  reel: {
    slug: 'reel',
    nom: 'Couverture de vidéo',
    largeur: 1080,
    hauteur: 1920,
    ratio: '9:16',
    usage: 'Instagram Reel · TikTok (Veolt)',
    intention: "La première image du montage. Elle doit être lisible sans son et sans logo imposant.",
  },
  couverture: {
    slug: 'couverture',
    nom: "Couverture d'article",
    largeur: 1200,
    hauteur: 630,
    ratio: '1,91:1',
    usage: "Article de blog · aperçu du lien partagé (LinkedIn, Open Graph)",
    intention: "L'image qui accompagne le lien de l'article partout où il circule. Le titre y est la requête, rien de plus.",
  },
};

export const TOUS_GABARITS = Object.values(GABARITS);

// ─────────────────────────────────────────────────────────────────────────────
// Thèmes
// ─────────────────────────────────────────────────────────────────────────────

interface ThemeVisuel {
  fond: string;
  encre: string;
  encreDouce: string;
  accent: string;
  accentDoux: string;
  /** Dégradés radiaux du fond — vides côté MagistrIA, volontairement. */
  halos: string;
  policeTitre: string;
  policeAffiche: string;
  /** Veolt met un dégradé sur la seconde ligne ; MagistrIA un filet or. */
  titreDegrade: string | null;
  marque: string;
  signature: string;
  services: string;
  adresse: string;
  /** Fond des cartes de l'illustration. */
  surface: string;
  /** Filet des cartes de l'illustration. */
  filet: string;
  /** Encre posée SUR l'accent — l'or veut du sombre, le bordeaux du blanc. */
  surAccent: string;
  /**
   * Logotype en mots, quand la marque n'a pas de pictogramme : [début, fin,
   * couleur de la fin]. MagistrIA s'écrit « Magistr » + « IA » en or, comme
   * sur son site. Absent : pictogramme carré + nom (Veolt).
   */
  logotype?: [string, string, string];
  /**
   * Monogramme dessiné (adresse `data:` d'un SVG), posé devant le nom de la
   * marque. Veolt : le logo V arrêté le 25/11/2026 (`logo-veolt.ts`), présent
   * sur chaque visuel. Absent : pictogramme carré + initiale.
   */
  pictogramme?: string;
  /**
   * Univers du kit Veolt (25/11/2026) : sphère de particules de veolt.fr posée
   * derrière le texte (PNG transparent), mot de la signature mis en lavande,
   * et la suite de la pastille (« Devis sous 24 h », preuve autorisée tant que
   * le délai est tenu — `marques.ts`).
   */
  kit?: { sphere: string; motAccent: string; pastilleSuite: string };
  /** Trame posée sous les halos (grille fine du site MagistrIA). */
  trame?: string;
  /** Sur-titre en petites capitales espacées, et sa couleur (police Mono). */
  surTitre?: { texte: string; couleur: string };
}

export type Variante = 'clair' | 'sombre';

/**
 * Les deux chartes, relevées là où elles font foi.
 *
 * Veolt vient du site en ligne (`veolt.fr`) : fond quasi noir,
 * dégradé magenta → violet → orange, Bebas Neue et Kanit.
 *
 * MagistrIA vient du **site en ligne** (`magistrai.fr`, relevé le 2026-11-10) :
 * nuit profonde, Spectral blanc, sur-titres Mono cyan, « IA » or, grille et
 * lueurs. Le blanc + bordeaux du dépôt et le bleu/or du cadrage de mai sont
 * périmés pour les contenus — c'est le site public qui fait foi.
 */
export const THEMES: Record<EntiteSlug, Record<Variante, ThemeVisuel>> = {
  veolt: {
    clair: {
      fond: '#0C0C0C',
      encre: '#EDEBF2',
      encreDouce: '#9A98A6',
      accent: '#B600A8',
      accentDoux: '#C79BFF',
      halos:
        'radial-gradient(900px 700px at 88% 6%, rgba(190,76,0,0.38) 0%, rgba(190,76,0,0) 62%),' +
        'radial-gradient(1000px 900px at 6% 86%, rgba(182,0,168,0.42) 0%, rgba(182,0,168,0) 64%),' +
        'radial-gradient(760px 700px at 78% 96%, rgba(118,33,176,0.40) 0%, rgba(118,33,176,0) 66%)',
      policeTitre: 'Bebas',
      policeAffiche: 'Kanit',
      // Le dégradé de texte du site en ligne (veolt.fr, relevé le 10/11) : magenta → lavande.
      titreDegrade: 'linear-gradient(100deg, #B600A8 0%, #C79BFF 100%)',
      marque: 'Veolt',
      signature: 'Studio créatif & conseil',
      pictogramme: URL_PNG_V,
      kit: { sphere: URL_PNG_SPHERE, motAccent: 'créatif', pastilleSuite: 'Devis sous 24 h' },
      services: 'Business plan  •  Sites & web 3D  •  Vidéo & 3D',
      adresse: 'veolt.fr',
      surface: 'rgba(237,235,242,0.06)',
      filet: 'rgba(237,235,242,0.16)',
      surAccent: '#FFFFFF',
    },
    // Veolt n'a qu'un registre : son site est déjà sombre. La seconde entrée
    // existe pour que la signature de type reste la même des deux côtés.
    sombre: null as unknown as ThemeVisuel,
  },
  magistria: {
    // Relevée sur le site en ligne magistrai.fr le 2026-11-10 : nuit profonde,
    // titres Spectral en blanc, sur-titres JetBrains Mono en capitales cyan,
    // logotype « Magistr » + « IA » or, grille fine bleutée et deux lueurs
    // (bleue, ambre). Le bordeaux ne sert plus qu'au bouton d'action.
    clair: {
      fond: '#03050A',
      encre: '#FFFFFF',
      encreDouce: '#9AA9BB',
      accent: '#3CC8FF',
      accentDoux: '#E0B85A',
      halos:
        'radial-gradient(1000px 900px at 62% 58%, rgba(28,86,160,0.34) 0%, rgba(28,86,160,0) 66%),' +
        'radial-gradient(760px 760px at 96% 78%, rgba(255,154,60,0.12) 0%, rgba(255,154,60,0) 62%)',
      trame:
        'repeating-linear-gradient(0deg, rgba(80,190,255,0.07) 0px, rgba(80,190,255,0.07) 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 54px),' +
        'repeating-linear-gradient(90deg, rgba(80,190,255,0.07) 0px, rgba(80,190,255,0.07) 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 54px)',
      policeTitre: 'Spectral',
      policeAffiche: 'Spectral',
      titreDegrade: null,
      marque: 'MagistrIA',
      signature: "L'intelligence au service du droit",
      services: 'Analyse  •  Rédaction  •  Conformité',
      adresse: 'magistrai.fr',
      surface: 'rgba(233,238,245,0.05)',
      filet: 'rgba(80,190,255,0.22)',
      surAccent: '#03050A',
      logotype: ['Magistr', 'IA', '#E0B85A'],
      surTitre: { texte: 'L’intelligence au service du droit', couleur: '#7FB7D9' },
    },
    // Une seule charte, comme Veolt : le site est sombre de bout en bout.
    sombre: null as unknown as ThemeVisuel,
  },
};

export function theme(entite: EntiteSlug, variante: Variante = 'clair'): ThemeVisuel {
  return THEMES[entite][variante] ?? THEMES[entite].clair;
}

// ─────────────────────────────────────────────────────────────────────────────
// Contenu par défaut — les vrais posts de lancement, pas du faux-texte
// ─────────────────────────────────────────────────────────────────────────────

export interface Contenu {
  ligne1: string;
  ligne2: string;
  sousTitre: string;
  chiffre?: string;
  legende?: string;
  pagination?: string;
  /** Identifiant d'une photo de la médiathèque (Higgsfield…) posée en fond, sous un voile à la charte. */
  photo?: string;
  /**
   * La question du post, posée dans l'image (LinkedIn, 2026) : elle appelle
   * une réponse argumentée sans la réclamer. Jamais « likez » ni « commentez
   * MOT » — LinkedIn pénalise l'appât à l'engagement (garde-fous.ts, règle 12).
   */
  question?: string;
  /** Dernière page d'un carrousel : page de fin à l'identité (logo, question, pastille). */
  fin?: string;
  /** Petite étiquette au-dessus du titre d'une page de carrousel (« À RETENIR », titre du sujet). */
  etiquette?: string;
  /**
   * Identifiant d'une illustration du pack (`illustrations.ts`), montrée dans
   * un cadre au-dessus du texte : ce que la page dit, en image. Chargée par
   * identifiant, dans la médiathèque de la même entité seulement.
   */
  illu?: string;
  /** Cadrage de l'illustration : « x,y,zoom » (point d'intérêt de 0 à 1, grossissement ≥ 1). */
  cadrage?: string;
  /** Page d'un pack (`offres-veolt.ts`) : la carte du pack, recomposée en entier et lisible. */
  pack?: string;
}

export const CONTENUS: Record<EntiteSlug, Record<GabaritSlug, Contenu>> = {
  veolt: {
    lancement: {
      ligne1: 'On lance',
      ligne2: 'Veolt Studio.',
      sousTitre: '3D, web et analyse financière,\nréunis dans la même structure.',
    },
    affirmation: {
      ligne1: 'Un prix bas se justifie',
      ligne2: 'par une structure,\npas par une remise.',
      sousTitre: 'Business plan dès 490 €  ·  Site dès 1 490 €  ·  Visuel 3D dès 119 €',
    },
    chiffre: {
      ligne1: '',
      ligne2: '',
      sousTitre: 'Au-delà de cinq visuels par référence, la 3D devient le seul format tenable.',
      chiffre: '5',
      legende: 'visuels par référence',
    },
    carrousel: {
      ligne1: 'Pourquoi un devis de site',
      ligne2: 'varie de 1 500 à 10 000 €',
      sousTitre: 'Les quatre lignes qui font la différence',
      pagination: '1 / 9',
    },
    reel: {
      ligne1: 'Photo studio',
      ligne2: 'ou packshot 3D ?',
      sousTitre: 'La différence n’est pas celle qu’on croit.',
    },
    couverture: {
      ligne1: 'Combien coûte un site',
      ligne2: 'pour un artisan ?',
      sousTitre: 'Ce qui fait varier un devis, ligne par ligne.',
    },
  },
  magistria: {
    lancement: {
      ligne1: 'Nous ouvrons',
      ligne2: 'MagistrIA.',
      sousTitre: "Une IA juridique qui montre son raisonnement\net ses sources. La décision reste la vôtre.",
    },
    affirmation: {
      ligne1: 'Une exclusion imprécise',
      ligne2: "n’est pas une exclusion\nopposable.",
      sousTitre: 'Code des assurances, art. L. 113-1 et L. 112-4',
    },
    chiffre: {
      ligne1: '',
      ligne2: '',
      sousTitre:
        "La preuve du lien entre le manquement allégué et le sinistre pèse sur l’assureur. Pas sur l’assuré.",
      chiffre: 'L. 113-1',
      legende: 'code des assurances',
    },
    carrousel: {
      ligne1: 'Les quatre vérifications',
      ligne2: 'avant un courrier de refus',
      sousTitre: 'Chacune a déjà fait tomber un refus devant un juge',
      pagination: '1 / 9',
    },
    reel: {
      ligne1: 'Un rapport cyber',
      ligne2: 'de quarante pages.',
      sousTitre: 'Trois phrases décident de la garantie.',
    },
    couverture: {
      ligne1: 'Refus de garantie :',
      ligne2: 'les vérifications à faire',
      sousTitre: 'Avant de répondre à l’assureur.',
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Rendu
// ─────────────────────────────────────────────────────────────────────────────

function Identite({ t, taille = 1 }: { t: ThemeVisuel; taille?: number }) {
  if (t.logotype) {
    const [debut, fin, couleur] = t.logotype;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 * taille }}>
        <div style={{ display: 'flex', fontFamily: t.policeAffiche, fontSize: 40 * taille, color: t.encre, lineHeight: 1.05 }}>
          <span>{debut}</span>
          <span style={{ color: couleur }}>{fin}</span>
        </div>
        {t.surTitre ? (
          <div style={{ display: 'flex', fontFamily: 'Mono', fontSize: 15 * taille, letterSpacing: 4 * taille, color: t.surTitre.couleur }}>
            {t.surTitre.texte.toUpperCase()}
          </div>
        ) : null}
      </div>
    );
  }
  if (t.pictogramme) {
    // Le logo Veolt : le V, puis VEOLT en Kanit Black argenté, la signature dessous.
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 * taille }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={t.pictogramme} alt="" width={78 * taille} height={78 * taille} style={{ marginLeft: -10 * taille }} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              fontFamily: 'Kanit',
              fontWeight: 900,
              fontSize: 36 * taille,
              lineHeight: 1,
              letterSpacing: -0.9 * taille,
              backgroundImage: DEGRADE_MOT,
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {t.marque.toUpperCase()}
          </div>
          <Signature t={t} taille={taille} />
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 * taille }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 56 * taille,
          height: 56 * taille,
          borderRadius: 16 * taille,
          background: t.titreDegrade ?? t.accent,
          color: t.surAccent,
          fontFamily: t.policeAffiche,
          fontSize: 30 * taille,
        }}
      >
        {t.marque[0]}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontFamily: t.policeAffiche, fontSize: 30 * taille, color: t.encre, lineHeight: 1.1 }}>
          {t.marque}
        </div>
        <div style={{ fontFamily: 'Inter', fontSize: 16 * taille, color: t.encreDouce }}>{t.signature}</div>
      </div>
    </div>
  );
}

/** La signature en petites capitales espacées ; kit Veolt : le mot d'accent en lavande. */
function Signature({ t, taille = 1 }: { t: ThemeVisuel; taille?: number }) {
  const texte = t.signature.toUpperCase();
  const accent = t.kit?.motAccent.toUpperCase();
  const i = accent ? texte.indexOf(accent) : -1;
  const morceaux: Array<[string, boolean]> =
    i < 0 || !accent ? [[texte, false]] : [[texte.slice(0, i), false], [accent, true], [texte.slice(i + accent.length), false]];
  return (
    <div style={{ display: 'flex', fontFamily: 'Inter', fontSize: 14 * taille, letterSpacing: 3 * taille, color: '#9BA5B1', marginTop: 6 * taille }}>
      {morceaux
        .filter(([m]) => m)
        .map(([m, a], k) => (
          <span key={k} style={{ color: a ? t.accentDoux : '#9BA5B1', fontWeight: a ? 600 : 400, whiteSpace: 'pre' }}>
            {m}
          </span>
        ))}
    </div>
  );
}

/**
 * La sphère de particules du kit (veolt.fr), derrière le texte : halo magenta
 * en dégradé radial (Satori), particules en PNG par-dessus. Positionnée en
 * absolu : elle ne prend aucune place dans la mise en page.
 */
function Sphere({ t, largeur, hauteur }: { t: ThemeVisuel; largeur: number; hauteur: number }) {
  if (!t.kit) return null;
  const paysage = largeur / hauteur > 1.4;
  const d = Math.round((paysage ? hauteur * 1.25 : Math.max(largeur, hauteur) * 0.82) / 2) * 2;
  const cx = paysage ? largeur * 0.82 : largeur * 0.88;
  const cy = paysage ? hauteur * 0.5 : hauteur * 0.25;
  const x = Math.round(cx - d / 2);
  const y = Math.round(cy - d / 2);
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: largeur, height: hauteur, display: 'flex' }}>
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: d,
          height: d,
          display: 'flex',
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(182,0,168,0.26) 0%, rgba(118,33,176,0.10) 45%, rgba(12,12,12,0) 70%)',
        }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={t.kit.sphere} alt="" width={d} height={d} style={{ position: 'absolute', left: x, top: y, opacity: 0.66 }} />
    </div>
  );
}

/**
 * La question du post, dans l'image (LinkedIn 2026). Une carte de verre :
 * sur-titre « Et vous ? », puis la question. Elle invite une réponse
 * argumentée, elle ne réclame ni like ni mot-clé.
 */
function QuestionCarte({ t, question, taille = 1 }: { t: ThemeVisuel; question: string; taille?: number }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10 * taille,
        padding: `${22 * taille}px ${28 * taille}px`,
        borderRadius: 22 * taille,
        backgroundColor: 'rgba(19,19,22,0.78)',
        border: '1.5px solid rgba(215,226,234,0.16)',
        borderLeft: `${5 * taille}px solid ${t.accent}`,
      }}
    >
      <div style={{ display: 'flex', fontFamily: 'Inter', fontWeight: 600, fontSize: 15 * taille, letterSpacing: 4 * taille, color: t.accentDoux }}>
        ET VOUS ?
      </div>
      <div style={{ display: 'flex', fontFamily: 'Inter', fontWeight: 600, fontSize: 30 * taille, lineHeight: 1.35, color: t.encre }}>
        {question}
      </div>
    </div>
  );
}

function Pastille({ t, taille = 1 }: { t: ThemeVisuel; taille?: number }) {
  if (t.kit) {
    // La pastille du kit : verre sombre, filet fin, point au dégradé, capitales espacées.
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14 * taille,
          alignSelf: 'flex-start',
          padding: `${15 * taille}px ${30 * taille}px`,
          borderRadius: 999,
          backgroundColor: 'rgba(19,19,22,0.82)',
          border: '1.5px solid rgba(215,226,234,0.18)',
          color: '#D7E2EA',
          fontFamily: 'Inter',
          fontWeight: 600,
          fontSize: 21 * taille,
          letterSpacing: 3 * taille,
        }}
      >
        <div style={{ display: 'flex', width: 13 * taille, height: 13 * taille, borderRadius: 999, backgroundImage: 'linear-gradient(135deg, #C79BFF, #B600A8)' }} />
        <span>{`${t.adresse} · ${t.kit.pastilleSuite}`.toUpperCase()}</span>
      </div>
    );
  }
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14 * taille,
        alignSelf: 'flex-start',
        padding: `${16 * taille}px ${30 * taille}px`,
        borderRadius: 999,
        border: `2px solid ${t.accent}`,
        color: t.encre,
        fontFamily: 'Inter',
        fontSize: 26 * taille,
      }}
    >
      <span>{t.adresse}</span>
      <span style={{ color: t.accent }}>→</span>
    </div>
  );
}

function Services({ t, taille = 1 }: { t: ThemeVisuel; taille?: number }) {
  return (
    <div style={{ display: 'flex', fontFamily: 'Inter', fontSize: 25 * taille, color: t.encreDouce }}>
      {t.services}
    </div>
  );
}

/** Illustration Veolt — les trois métiers en un coup d'œil. */
function SceneVeolt({ t }: { t: ThemeVisuel }) {
  const carte = (contenu: React.ReactNode, style: React.CSSProperties) => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: t.surface,
        border: `1px solid ${t.filet}`,
        borderRadius: 20,
        padding: 18,
        ...style,
      }}
    >
      {contenu}
    </div>
  );
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18 }}>
      {/* Fenêtre : le web */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: 548,
          borderRadius: 24,
          overflow: 'hidden',
          border: `1px solid ${t.filet}`,
          background: t.surface,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: 14, background: t.surface }}>
          <div style={{ width: 11, height: 11, borderRadius: 99, background: '#FF5F57' }} />
          <div style={{ width: 11, height: 11, borderRadius: 99, background: '#FEBC2E' }} />
          <div style={{ width: 11, height: 11, borderRadius: 99, background: '#28C840' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', padding: 16, gap: 12 }}>
          <div style={{ display: 'flex', height: 132, borderRadius: 16, background: t.titreDegrade ?? t.accent }} />
          <div style={{ display: 'flex', height: 15, width: '88%', borderRadius: 99, background: t.filet }} />
          <div style={{ display: 'flex', height: 15, width: '64%', borderRadius: 99, background: t.filet }} />
          <div style={{ display: 'flex', height: 44, width: 178, borderRadius: 99, background: t.accent }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Le code */}
        {carte(
          <>
            <div style={{ display: 'flex', fontFamily: 'Inter', fontSize: 34, color: t.accentDoux }}>{'</>'}</div>
            <div style={{ display: 'flex', height: 9, width: 118, borderRadius: 99, background: t.filet, marginTop: 12 }} />
            <div style={{ display: 'flex', height: 9, width: 78, borderRadius: 99, background: t.filet, marginTop: 8 }} />
          </>,
          { width: 236 },
        )}
        {/* L'analyse financière — barres croissantes */}
        {carte(
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 100 }}>
            {[34, 56, 78, 100].map((h, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  width: 28,
                  height: h,
                  borderRadius: 6,
                  background: i === 3 ? t.accent : 'rgba(199,155,255,0.55)',
                }}
              />
            ))}
          </div>,
          { width: 236 },
        )}
      </div>
    </div>
  );
}

/** Illustration MagistrIA — le raisonnement, étape par étape, avec ses sources. */
function SceneMagistria({ t }: { t: ThemeVisuel }) {
  const etape = (num: string, titre: string, source: string) => (
    <div
      key={num}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 20,
        padding: '30px 34px',
        borderLeft: `3px solid ${t.accent}`,
        background: t.surface,
      }}
    >
      <div style={{ display: 'flex', fontFamily: 'Inter', fontSize: 26, color: t.accent, width: 38 }}>{num}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <div style={{ display: 'flex', fontFamily: 'Inter', fontSize: 31, color: t.encre }}>{titre}</div>
        <div style={{ display: 'flex', fontFamily: 'Inter', fontSize: 24, color: t.encreDouce }}>{source}</div>
      </div>
    </div>
  );
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        width: 790,
        borderRadius: 18,
        overflow: 'hidden',
        border: `1px solid ${t.filet}`,
      }}
    >
      {etape('1.', 'Règle applicable', 'C. assur., art. L. 113-1')}
      {etape('2.', 'Faits qualifiés', 'pièces 3 et 5 du dossier')}
      {etape('3.', 'Ce qui manque pour conclure', 'le lien de causalité n’est pas établi')}
    </div>
  );
}

/** Les marques de mise en valeur (`*mot*`) retirées, pour un texte affiché nu. */
export const nu = (t: string | undefined | null) => (t ?? '').replace(/\*/g, '');

/** Découpe « texte *mis en valeur* suite » en mots, chacun marqué fort ou non. */
export function motsRiches(texte: string): Array<{ mot: string; fort: boolean; suite?: string }> {
  const sortie: Array<{ mot: string; fort: boolean; suite?: string }> = [];
  texte
    .replace(/'/g, '’')
    .split(/(\*[^*]+\*)/)
    .forEach((morceau) => {
      const fort = /^\*[^*]+\*$/.test(morceau);
      morceau
        .replace(/\*/g, '')
        .split(/\s+/)
        .filter(Boolean)
        .forEach((mot) => {
          // La ponctuation qui suit un mot reste collée à lui (jamais seule en
          // début de ligne, jamais d'espace avant « . , ») : « délai. », pas « délai . ».
          const prec = sortie[sortie.length - 1];
          const ponct = mot.match(/^([.,…)»;:!?]+)(.*)$/);
          if (prec && ponct) {
            prec.suite = (prec.suite ?? '') + (/^[;:!?]/.test(ponct[1]) ? '\u202F' : '') + ponct[1];
            if (ponct[2]) sortie.push({ mot: ponct[2], fort });
            return;
          }
          sortie.push({ mot, fort });
        });
    });
  return sortie;
}

/**
 * Le sous-texte d'une page, mis en forme : les mots entre astérisques ressortent
 * (lavande, demi-gras, souligné d'un trait d'accent). Mot à mot, en flex qui
 * passe à la ligne : Satori ne sait pas mêler les styles dans une même ligne de texte.
 */
function TexteRiche({ t, texte, taille, interligne = 1.42, style }: { t: ThemeVisuel; texte: string; taille: number; interligne?: number; style?: React.CSSProperties }) {
  const mots = motsRiches(texte);
  const esp = taille * 0.27;
  const fort: React.CSSProperties = {
    display: 'flex',
    color: t.accentDoux,
    fontWeight: 600,
    backgroundImage: `linear-gradient(0deg, ${t.accent}66 0%, ${t.accent}66 100%)`,
    backgroundSize: `100% ${Math.max(3, Math.round(taille * 0.12))}px`,
    backgroundPosition: `0 ${Math.round(taille * interligne * 0.88)}px`,
    backgroundRepeat: 'no-repeat',
  };
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', fontFamily: 'Inter', fontSize: taille, color: t.encre, lineHeight: interligne, ...style }}>
      {mots.map((m, i) => {
        // Dans un groupe mis en valeur, le soulignement traverse l'espace entre les mots.
        const lie = m.fort && !m.suite && (mots[i + 1]?.fort ?? false);
        return (
          <div key={i} style={{ display: 'flex', marginRight: lie ? 0 : esp }}>
            <div style={m.fort ? { ...fort, paddingRight: lie ? esp : 0 } : { display: 'flex' }}>{m.mot}</div>
            {m.suite ? <div style={{ display: 'flex' }}>{m.suite}</div> : null}
          </div>
        );
      })}
    </div>
  );
}

function Titre({
  t,
  c,
  taille,
}: {
  t: ThemeVisuel;
  c: Contenu;
  taille: number;
}) {
  const ligne2 = c.ligne2.split('\n');
  // Titre vide : la carte sert de fond (studio vidéo, qui dessine le titre
  // lui-même pour l'animer) — ni texte ni filet.
  if (!c.ligne1 && !c.ligne2.trim()) return <div style={{ display: 'flex' }} />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {c.ligne1 ? (
        <div
          style={{
            display: 'flex',
            fontFamily: t.policeTitre,
            fontSize: taille,
            color: t.encre,
            lineHeight: 1.0,
            letterSpacing: t.policeTitre === 'Bebas' ? 1 : -2,
          }}
        >
          {nu(c.ligne1).replace(/'/g, '’')}
        </div>
      ) : null}
      {ligne2.map((l, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            fontFamily: t.policeTitre,
            fontSize: taille,
            lineHeight: 1.0,
            letterSpacing: t.policeTitre === 'Bebas' ? 1 : -2,
            ...(t.titreDegrade
              ? { backgroundImage: t.titreDegrade, backgroundClip: 'text', color: 'transparent' }
              : { color: t.encre }),
          }}
        >
          {nu(l).replace(/'/g, '’')}
        </div>
      ))}
      {!t.titreDegrade ? (
        <div style={{ display: 'flex', width: 190, height: 5, background: t.accent, marginTop: 26 }} />
      ) : null}
    </div>
  );
}

/**
 * Le visuel, avec une photo en fond quand le post en a une (générée par
 * Higgsfield, déposée…) : la photo plein cadre, un voile aux couleurs de la
 * marque pour que le texte reste lisible, les halos du site par-dessus, puis
 * la mise en page habituelle. Sans photo : le visuel à la charte, tel quel.
 */
export function rendre(
  entite: EntiteSlug,
  gabarit: GabaritSlug,
  contenu?: Partial<Contenu>,
  variante: Variante = 'clair',
  photoDonnees?: string,
  illu?: ImageCadree,
) {
  // Une page de pack (Veolt) : la carte de l'abonnement, en entier, à la charte.
  if (entite === 'veolt' && contenu?.pack && PACKS_VEOLT[contenu.pack]) {
    const c = { ...CONTENUS[entite][gabarit], ...contenu };
    return pagePack(theme(entite, variante), GABARITS[gabarit], c, PACKS_VEOLT[contenu.pack]);
  }
  // Une illustration du pack (sans photo de fond choisie à la main) : la page
  // montre ce qu'elle dit, dans un cadre au-dessus du texte.
  if (illu && !photoDonnees) {
    const c = { ...CONTENUS[entite][gabarit], ...contenu };
    const illustre = rendreIllustre(entite, gabarit, c, variante, illu);
    if (illustre) return illustre;
  }
  // Sur une photo, la sphère du kit n'est pas posée : la photo est le décor.
  const el = rendreSansPhoto(entite, gabarit, contenu, variante, !photoDonnees);
  if (!photoDonnees) return el;
  const t = theme(entite, variante);
  const g = GABARITS[gabarit];
  const props = el.props as { style: React.CSSProperties; children: React.ReactNode };
  const nuit = entite === 'veolt' ? '12,12,12' : '3,5,10';
  const plein = { position: 'absolute' as const, top: 0, left: 0, width: g.largeur, height: g.hauteur, display: 'flex' };
  // Satori refuse `backgroundImage: 'none'` : on retire la clé (les halos sont reposés au-dessus de la photo).
  const { backgroundImage: _sansHalos, ...style } = props.style;
  void _sansHalos;
  return (
    <div style={{ ...style, position: 'relative' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photoDonnees} alt="" width={g.largeur} height={g.hauteur} style={{ ...plein, objectFit: 'cover' }} />
      <div
        style={{
          ...plein,
          backgroundImage: `linear-gradient(180deg, rgba(${nuit},0.72) 0%, rgba(${nuit},0.38) 30%, rgba(${nuit},0.55) 55%, rgba(${nuit},0.94) 100%)`,
        }}
      />
      {t.halos ? <div style={{ ...plein, backgroundImage: t.halos }} /> : null}
      {props.children}
    </div>
  );
}

/**
 * L'illustration dans son cadre de verre : l'image recadrée sur son point
 * d'intérêt (`cadrer`, le même calcul que les vidéos), un fondu bas qui la
 * pose sur la page, un filet lavande et une lueur magenta. Satori n'a ni flou
 * ni masque : la profondeur vient de l'ombre portée et des dégradés.
 */
function CadreIllu({ t, illu, largeur, hauteur, rayon = 30 }: { t: ThemeVisuel; illu: ImageCadree; largeur: number; hauteur: number; rayon?: number }) {
  const r = cadrer(largeur, hauteur, illu.largeur, illu.hauteur, illu.cadrage);
  return (
    <div
      style={{
        display: 'flex',
        position: 'relative',
        width: largeur,
        height: hauteur,
        borderRadius: rayon,
        overflow: 'hidden',
        border: `1.5px solid ${t.accentDoux}55`,
        boxShadow: `0 30px 80px rgba(0,0,0,0.55), 0 0 60px ${t.accent}33`,
        backgroundColor: '#050507',
      }}
    >
      <img
        src={illu.donnees}
        alt=""
        width={Math.round(r.w)}
        height={Math.round(r.h)}
        style={{ position: 'absolute', left: Math.round(r.gauche), top: Math.round(r.haut), width: Math.round(r.w), height: Math.round(r.h) }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: largeur,
          height: hauteur,
          display: 'flex',
          backgroundImage: 'linear-gradient(180deg, rgba(0,0,0,0) 62%, rgba(8,6,12,0.55) 100%), linear-gradient(115deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 32%)',
        }}
      />
      {illu.mention ? (
        <div
          style={{
            position: 'absolute',
            // Sur une capture d'écran, en haut à droite : en bas, elle masquerait une ligne du site.
            ...(illu.forme === 'telephone' ? { right: 18, bottom: 16 } : { left: 18, bottom: 16 }),
            display: 'flex',
            fontFamily: 'Inter',
            fontWeight: 600,
            fontSize: 15,
            letterSpacing: 2,
            color: 'rgba(233,230,245,0.85)',
            backgroundColor: 'rgba(8,6,12,0.55)',
            border: '1px solid rgba(199,155,255,0.3)',
            borderRadius: 999,
            padding: '6px 14px',
          }}
        >
          {illu.mention.toUpperCase()}
        </div>
      ) : null}
    </div>
  );
}

/** Une capture mobile réelle dans un téléphone : coque sombre, écran arrondi, filet lavande, mention en dessous. */
function Telephone({ t, illu, largeur }: { t: ThemeVisuel; illu: ImageCadree; largeur: number }) {
  const bord = Math.round(largeur * 0.035);
  const ecranL = largeur - bord * 2;
  const ecranH = Math.round(ecranL * (illu.hauteur / illu.largeur));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div
        style={{
          display: 'flex',
          padding: bord,
          borderRadius: Math.round(largeur * 0.14),
          backgroundColor: '#07070a',
          border: `2px solid ${t.accentDoux}66`,
          boxShadow: `0 40px 90px rgba(0,0,0,0.6), 0 0 70px ${t.accent}40`,
        }}
      >
        <div style={{ display: 'flex', width: ecranL, height: ecranH, borderRadius: Math.round(largeur * 0.11), overflow: 'hidden' }}>
          <img src={illu.donnees} alt="" width={ecranL} height={ecranH} style={{ width: ecranL, height: ecranH }} />
        </div>
      </div>
      {illu.mention ? (
        <div style={{ display: 'flex', fontFamily: 'Inter', fontWeight: 600, fontSize: 15, letterSpacing: 2, color: t.encreDouce }}>{illu.mention.toUpperCase()}</div>
      ) : null}
    </div>
  );
}

/** Coche lavande dessinée (la police n'a pas forcément le glyphe ✓). */
function Coche({ couleur, taille }: { couleur: string; taille: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: taille * 0.12 }}>
      <path d="M4 12.5l5 5L20 6.5" fill="none" stroke={couleur} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * La page d'un pack vidéo : la carte entière, comme sur veolt.fr, mais à la
 * taille d'une page de carrousel — nom, format, prix, prix par vidéo, phrase,
 * et chaque ligne du pack. Les données sont celles du site (`offres-veolt.ts`).
 */
function pagePack(t: ThemeVisuel, g: Gabarit, c: Contenu, pk: PackVeolt) {
  const marge = 72;
  return (
    <div
      style={{
        width: g.largeur,
        height: g.hauteur,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: marge,
        backgroundColor: t.fond,
        backgroundImage: t.trame ? `${t.halos},${t.trame}` : t.halos,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Identite t={t} taille={0.9} />
        {c.pagination ? (
          <div style={{ display: 'flex', fontFamily: 'Inter', fontSize: 24, color: t.encreDouce, border: `1px solid ${t.encreDouce}`, borderRadius: 999, padding: '8px 20px' }}>
            {c.pagination}
          </div>
        ) : (
          <div style={{ display: 'flex' }} />
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
        {c.etiquette ? (
          <div style={{ display: 'flex', fontFamily: 'Inter', fontWeight: 600, fontSize: 19, letterSpacing: 4, color: t.accentDoux }}>{c.etiquette.toUpperCase()}</div>
        ) : null}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            padding: '54px 58px',
            borderRadius: 38,
            marginTop: pk.recommande ? 22 : 0,
            backgroundColor: 'rgba(20,18,26,0.92)',
            border: pk.recommande ? `2px solid ${t.accent}` : '1.5px solid rgba(215,226,234,0.18)',
            boxShadow: pk.recommande ? `0 0 80px ${t.accent}55, 0 30px 80px rgba(0,0,0,0.5)` : '0 30px 80px rgba(0,0,0,0.5)',
          }}
        >
          {pk.recommande ? (
            <div
              style={{
                position: 'absolute',
                top: -24,
                left: 0,
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <div style={{ display: 'flex', fontFamily: 'Inter', fontWeight: 700, fontSize: 20, letterSpacing: 3, color: '#FFFFFF', backgroundImage: `linear-gradient(90deg, ${t.accent}, #7621B0)`, borderRadius: 999, padding: '10px 26px' }}>
                RECOMMANDÉ
              </div>
            </div>
          ) : null}
          <div style={{ display: 'flex', fontFamily: 'Kanit', fontWeight: 900, fontSize: 62, color: t.encre, letterSpacing: 1 }}>{pk.nom.toUpperCase()}</div>
          <div style={{ display: 'flex', fontFamily: 'Inter', fontSize: 30, color: t.encreDouce, marginTop: 4 }}>{pk.format}</div>
          {pk.aPartirDe ? (
            <div style={{ display: 'flex', fontFamily: 'Inter', fontWeight: 600, fontSize: 22, letterSpacing: 3, color: t.accentDoux, marginTop: 30 }}>À PARTIR DE</div>
          ) : null}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginTop: pk.aPartirDe ? 4 : 30 }}>
            {/* Les milliers séparés par un vrai blanc (« 1 799 »), dessiné, pas confié à la police. */}
            <div style={{ display: 'flex', gap: 38 }}>
              {pk.prix.split(' ').map((g, k) => (
                <div key={k} style={{ display: 'flex', fontFamily: 'Kanit', fontWeight: 900, fontSize: 150, lineHeight: 0.95, letterSpacing: -2, backgroundImage: 'linear-gradient(180deg, #F4F4F8 0%, #A9A7B6 100%)', backgroundClip: 'text', color: 'transparent' }}>
                  {g}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', fontFamily: 'Inter', fontWeight: 700, fontSize: 40, color: t.encreDouce, marginBottom: 14 }}>€ HT</div>
          </div>
          {pk.parVideo ? <div style={{ display: 'flex', fontFamily: 'Inter', fontSize: 28, color: t.encreDouce, marginTop: 8 }}>{pk.parVideo}</div> : null}
          <div style={{ display: 'flex', fontFamily: 'Inter', fontSize: 31, color: t.encre, lineHeight: 1.35, marginTop: 26 }}>{pk.pitch}</div>
          <div style={{ display: 'flex', height: 1, backgroundColor: 'rgba(215,226,234,0.14)', marginTop: 30, marginBottom: 26 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {pk.points.map((x) => (
              <div key={x} style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                <Coche couleur={t.accentDoux} taille={32} />
                <div style={{ display: 'flex', fontFamily: 'Inter', fontSize: 31, color: t.encre, lineHeight: 1.3 }}>{x}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', fontFamily: 'Inter', fontSize: 21, color: t.encreDouce }}>Prix affichés sur veolt.fr · Faites défiler →</div>
        <Signature t={t} taille={0.9} />
      </div>
    </div>
  );
}

/**
 * Les gabarits illustrés (Veolt) : l'image d'abord, puis le texte qui la
 * légende. `null` pour un gabarit qui n'a pas de version illustrée — le rendu
 * habituel prend alors la main.
 */
function rendreIllustre(entite: EntiteSlug, gabarit: GabaritSlug, c: Contenu, variante: Variante, illu: ImageCadree) {
  const t = theme(entite, variante);
  const g = GABARITS[gabarit];
  if (!t.kit) return null;
  if (gabarit === 'carrousel' && c.fin) return null;
  if (!['carrousel', 'affirmation', 'chiffre', 'couverture'].includes(gabarit)) return null;
  if (gabarit === 'couverture') {
    // Couverture d'article (1,91:1) : le titre à gauche, l'image à droite.
    const colonne = Math.round(g.largeur * 0.36);
    // Chaque ligne du titre doit tenir d'un trait dans la colonne de gauche.
    const largeurTexte = g.largeur - 104 - colonne - 40;
    const plusLongue = Math.max(c.ligne1.length, ...c.ligne2.split('\n').map((l) => l.length), 1);
    const taille = Math.max(40, Math.min(66, Math.floor(largeurTexte / (plusLongue * 0.43))));
    return (
      <div style={{ width: g.largeur, height: g.hauteur, display: 'flex', gap: 40, padding: '48px 52px', backgroundColor: t.fond, backgroundImage: t.trame ? `${t.halos},${t.trame}` : t.halos }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Identite t={t} taille={0.75} />
            <div style={{ display: 'flex', fontFamily: 'Mono', fontSize: 15, letterSpacing: 4, color: t.surTitre?.couleur ?? t.accent }}>ARTICLE</div>
          </div>
          <Titre t={t} c={c} taille={taille} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {c.sousTitre ? <div style={{ display: 'flex', fontFamily: 'Inter', fontSize: 19, color: t.encreDouce, lineHeight: 1.4 }}>{nu(c.sousTitre)}</div> : null}
            <Pastille t={t} taille={0.66} />
          </div>
        </div>
        <CadreIllu t={t} illu={illu} largeur={colonne} hauteur={g.hauteur - 96} rayon={24} />
      </div>
    );
  }
  const marge = 72;
  const interieur = g.largeur - marge * 2;
  const base: React.CSSProperties = {
    width: g.largeur,
    height: g.hauteur,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: marge,
    backgroundColor: t.fond,
    backgroundImage: t.trame ? `${t.halos},${t.trame}` : t.halos,
    position: 'relative',
  };
  const longueurTitre = `${c.ligne1} ${c.ligne2}`.trim().length;
  const entete = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Identite t={t} taille={0.9} />
      {c.pagination ? (
        <div style={{ display: 'flex', fontFamily: 'Inter', fontSize: 24, color: t.encreDouce, border: `1px solid ${t.encreDouce}`, borderRadius: 999, padding: '8px 20px' }}>
          {c.pagination}
        </div>
      ) : (
        <div style={{ display: 'flex' }} />
      )}
    </div>
  );

  if (gabarit === 'chiffre') {
    // Carré : le chiffre et sa lecture à gauche, l'image en colonne à droite.
    const colonne = 360;
    return (
      <div style={base}>
        {entete}
        <div style={{ display: 'flex', gap: 40, alignItems: 'stretch' }}>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16, width: interieur - colonne - 40 }}>
            <div
              style={{
                display: 'flex',
                fontFamily: t.policeTitre,
                fontSize: c.chiffre && c.chiffre.length > 5 ? 120 : 160,
                lineHeight: 1,
                letterSpacing: 2,
                ...(t.titreDegrade ? { backgroundImage: t.titreDegrade, backgroundClip: 'text', color: 'transparent' } : { color: t.accent }),
              }}
            >
              {c.chiffre}
            </div>
            {c.legende ? <div style={{ display: 'flex', fontFamily: 'Inter', fontSize: 26, color: t.encreDouce, lineHeight: 1.35 }}>{c.legende}</div> : null}
            <div style={{ display: 'flex', fontFamily: 'Inter', fontSize: 30, color: t.encre, lineHeight: 1.38 }}>{nu(c.sousTitre)}</div>
          </div>
          <CadreIllu t={t} illu={illu} largeur={colonne} hauteur={500} rayon={26} />
        </div>
        {c.question ? <QuestionCarte t={t} question={c.question} taille={0.8} /> : <Pastille t={t} />}
      </div>
    );
  }

  // Capture mobile réelle : le téléphone à gauche, le texte à droite.
  // Sans cadrage, le téléphone entier ; avec un cadrage, la capture passe en
  // grand cadre, zoomée sur le bloc utile (prix, question) : plus lisible.
  if (illu.forme === 'telephone' && !illu.cadrage && (gabarit === 'carrousel' || gabarit === 'affirmation')) {
    const tel = 400;
    const colonne = interieur - tel - 44;
    const long = `${c.ligne1} ${c.ligne2}`.trim().length;
    const taille = long > 60 ? 62 : long > 40 ? 70 : 80;
    return (
      <div style={base}>
        {entete}
        <div style={{ display: 'flex', gap: 44, alignItems: 'center' }}>
          <Telephone t={t} illu={illu} largeur={tel} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: colonne }}>
            {c.etiquette ? (
              <div style={{ display: 'flex', fontFamily: 'Inter', fontWeight: 600, fontSize: 18, letterSpacing: 4, color: t.accentDoux }}>{c.etiquette.toUpperCase()}</div>
            ) : null}
            <Titre t={t} c={c} taille={taille} />
            {gabarit === 'carrousel' && c.sousTitre ? <TexteRiche t={t} texte={c.sousTitre} taille={27} /> : null}
            {gabarit === 'affirmation' && c.question ? <QuestionCarte t={t} question={c.question} taille={0.7} /> : null}
          </div>
        </div>
        {gabarit === 'carrousel' ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', fontFamily: 'Inter', fontSize: 22, color: t.encreDouce }}>Faites défiler →</div>
            <Signature t={t} taille={0.9} />
          </div>
        ) : (
          <Pastille t={t} />
        )}
      </div>
    );
  }

  // Portrait 4:5 : en-tête, image, texte. L'image prend la place que le texte lui laisse.
  const avecQuestion = gabarit === 'affirmation' && !!c.question;
  const tailleTitre = longueurTitre > 70 ? 70 : longueurTitre > 48 ? 80 : 92;
  // La hauteur de l'image se règle sur le texte : estimer ce qu'il occupe
  // (lignes probables à cette taille), donner le reste à l'image. Un texte court
  // laisse une grande image ; un texte long garde au moins 420 px d'image.
  const lignes = (texte: string, taille: number, chasse: number) =>
    texte ? texte.split('\n').reduce((n, l) => n + Math.max(1, Math.ceil((l.length * taille * chasse) / interieur)), 0) : 0;
  const tailleSous = c.sousTitre && c.sousTitre.length > 150 ? 27 : 30;
  const hTitre = (lignes(c.ligne1, tailleTitre, 0.43) + lignes(c.ligne2, tailleTitre, 0.43)) * tailleTitre;
  const hEtiquette = c.etiquette ? 40 : 0;
  const hSous = gabarit === 'carrousel' && c.sousTitre ? lignes(c.sousTitre, tailleSous, 0.52) * tailleSous * 1.42 + 22 : 0;
  const hPied = avecQuestion ? 76 + lignes(c.question!, 24.6, 0.56) * 24.6 * 1.35 : gabarit === 'carrousel' ? 30 : 58;
  const disponible = g.hauteur - marge * 2 - 60 - hPied - 3 * 40;
  const hauteurImage = Math.round(Math.min(760, Math.max(420, disponible - hTitre - hEtiquette - hSous)));
  return (
    <div style={base}>
      {entete}
      <CadreIllu t={t} illu={illu} largeur={interieur} hauteur={hauteurImage} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {c.etiquette ? (
          <div style={{ display: 'flex', fontFamily: 'Inter', fontWeight: 600, fontSize: 19, letterSpacing: 4, color: t.accentDoux }}>
            {c.etiquette.toUpperCase()}
          </div>
        ) : null}
        <Titre t={t} c={c} taille={tailleTitre} />
        {gabarit === 'carrousel' && c.sousTitre ? <TexteRiche t={t} texte={c.sousTitre} taille={c.sousTitre.length > 150 ? 27 : 30} style={{ marginTop: 6 }} /> : null}
      </div>
      {avecQuestion ? (
        <QuestionCarte t={t} question={c.question!} taille={0.82} />
      ) : gabarit === 'carrousel' ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', fontFamily: 'Inter', fontSize: 22, color: t.encreDouce }}>Faites défiler →</div>
          <Signature t={t} taille={0.9} />
        </div>
      ) : (
        <Pastille t={t} />
      )}
    </div>
  );
}

function rendreSansPhoto(
  entite: EntiteSlug,
  gabarit: GabaritSlug,
  contenu?: Partial<Contenu>,
  variante: Variante = 'clair',
  avecSphere = true,
) {
  const t = theme(entite, variante);
  const g = GABARITS[gabarit];
  const c = { ...CONTENUS[entite][gabarit], ...contenu };
  const vertical = g.hauteur > g.largeur * 1.4;
  const marge = vertical ? 92 : 80;

  const base: React.CSSProperties = {
    width: g.largeur,
    height: g.hauteur,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: marge,
    backgroundColor: t.fond,
    backgroundImage: t.trame ? `${t.halos},${t.trame}` : t.halos,
    position: 'relative',
  };
  // L'univers du kit Veolt (sphère de particules), sous tout le reste.
  const sphere = avecSphere ? <Sphere t={t} largeur={g.largeur} hauteur={g.hauteur} /> : null;

  if (gabarit === 'chiffre') {
    return (
      <div style={base}>
        {sphere}
        <Identite t={t} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div
            style={{
              display: 'flex',
              fontFamily: t.policeTitre,
              fontSize: c.chiffre && c.chiffre.length > 3 ? 150 : 240,
              lineHeight: 1,
              letterSpacing: t.policeTitre === 'Bebas' ? 2 : -4,
              ...(t.titreDegrade
                ? { backgroundImage: t.titreDegrade, backgroundClip: 'text', color: 'transparent' }
                : { color: t.accent }),
            }}
          >
            {c.chiffre}
          </div>
          <div style={{ display: 'flex', fontFamily: 'Inter', fontSize: 34, color: t.encreDouce }}>{c.legende}</div>
          <div style={{ display: 'flex', fontFamily: 'Inter', fontSize: 36, color: t.encre, lineHeight: 1.4, maxWidth: 840 }}>
            {nu(c.sousTitre)}
          </div>
        </div>
        {c.question ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
            <QuestionCarte t={t} question={c.question} taille={0.9} />
            <Pastille t={t} />
          </div>
        ) : (
          <Pastille t={t} />
        )}
      </div>
    );
  }

  if (gabarit === 'couverture') {
    // Paysage 1,91:1 : le titre est la requête de l'article, il peut être
    // long — la taille suit sa longueur pour tenir sur trois lignes au plus.
    const long = `${c.ligne1} ${c.ligne2}`.trim().length;
    const taille = (entite === 'veolt' ? 1.3 : 1) * (long > 80 ? 46 : long > 55 ? 54 : 64);
    return (
      <div style={{ ...base, padding: '56px 64px' }}>
        {sphere}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Identite t={t} taille={0.8} />
          <div style={{ display: 'flex', fontFamily: 'Mono', fontSize: 16, letterSpacing: 4, color: t.surTitre?.couleur ?? t.accent }}>
            ARTICLE
          </div>
        </div>
        <Titre t={t} c={c} taille={taille} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 28 }}>
          <div style={{ display: 'flex', fontFamily: 'Inter', fontSize: 22, color: t.encreDouce, lineHeight: 1.4, maxWidth: 720 }}>
            {nu(c.sousTitre)}
          </div>
          <Pastille t={t} taille={0.72} />
        </div>
      </div>
    );
  }

  if (gabarit === 'affirmation') {
    return (
      <div style={base}>
        {sphere}
        <Identite t={t} />
        <Titre t={t} c={c} taille={entite === 'veolt' ? 108 : 88} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 34 }}>
          {c.question ? (
            <QuestionCarte t={t} question={c.question} />
          ) : (
            <div style={{ display: 'flex', fontFamily: 'Inter', fontSize: 28, color: t.encreDouce, lineHeight: 1.45 }}>
              {nu(c.sousTitre)}
            </div>
          )}
          <Pastille t={t} />
        </div>
      </div>
    );
  }

  if (gabarit === 'carrousel' && c.fin && t.kit) {
    // Page de fin d'un carrousel Veolt, à l'identité du kit : le logo en grand,
    // la question du post (ou son appel), la pastille. Elle se capture et se partage.
    return (
      <div style={{ ...base, alignItems: 'center', justifyContent: 'center', gap: 46 }}>
        <Sphere t={t} largeur={g.largeur} hauteur={g.hauteur} />
        {c.pagination ? (
          <div style={{ position: 'absolute', top: marge, right: marge, display: 'flex', fontFamily: 'Inter', fontSize: 24, color: t.encreDouce, border: `1px solid ${t.encreDouce}`, borderRadius: 999, padding: '8px 20px' }}>
            {c.pagination}
          </div>
        ) : null}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={t.pictogramme} alt="" width={230} height={230} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, marginTop: -30 }}>
          <div style={{ display: 'flex', fontFamily: 'Kanit', fontWeight: 900, fontSize: 120, lineHeight: 1, letterSpacing: -3, backgroundImage: DEGRADE_MOT, backgroundClip: 'text', color: 'transparent' }}>
            {t.marque.toUpperCase()}
          </div>
          <Signature t={t} taille={1.5} />
        </div>
        <div style={{ display: 'flex', width: 860 }}>
          {c.question ? (
            <QuestionCarte t={t} question={c.question} />
          ) : (
            <div style={{ display: 'flex', fontFamily: 'Inter', fontWeight: 600, fontSize: 34, lineHeight: 1.4, color: t.encre, textAlign: 'center' }}>
              {[c.ligne1, c.ligne2].filter(Boolean).join(' ')}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Pastille t={t} />
        </div>
      </div>
    );
  }

  if (gabarit === 'carrousel') {
    return (
      <div style={base}>
        {sphere}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Identite t={t} />
          {c.pagination ? (
            <div
              style={{
                display: 'flex',
                fontFamily: 'Inter',
                fontSize: 24,
                color: t.encreDouce,
                border: `1px solid ${t.encreDouce}`,
                borderRadius: 999,
                padding: '8px 20px',
              }}
            >
              {c.pagination}
            </div>
          ) : (
            <div style={{ display: 'flex' }} />
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {c.etiquette ? (
            <div style={{ display: 'flex', fontFamily: 'Inter', fontWeight: 600, fontSize: 20, letterSpacing: 4, color: t.accentDoux }}>
              {c.etiquette.toUpperCase()}
            </div>
          ) : null}
          <Titre t={t} c={c} taille={entite === 'veolt' ? 104 : 84} />
          {/* Veolt : l'explication suit son titre, au lieu d'attendre en pied de page. */}
          {t.kit && c.sousTitre ? <TexteRiche t={t} texte={c.sousTitre} taille={36} interligne={1.45} style={{ marginTop: 16, maxWidth: 900 }} /> : null}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
          {!t.kit ? (
            <div style={{ display: 'flex', fontFamily: 'Inter', fontSize: 32, color: t.encre, lineHeight: 1.4 }}>
              {nu(c.sousTitre)}
            </div>
          ) : null}
          <div style={{ display: 'flex', fontFamily: 'Inter', fontSize: 24, color: t.encreDouce }}>
            Faites défiler →
          </div>
        </div>
      </div>
    );
  }

  if (gabarit === 'reel') {
    return (
      <div style={base}>
        {sphere}
        <Identite t={t} taille={1.15} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 44 }}>
          <Titre t={t} c={c} taille={entite === 'veolt' ? 136 : 106} />
          <div style={{ display: 'flex', fontFamily: 'Inter', fontSize: 40, color: t.encreDouce, lineHeight: 1.4 }}>
            {nu(c.sousTitre)}
          </div>
        </div>
        <Pastille t={t} taille={1.15} />
      </div>
    );
  }

  // lancement
  return (
    <div style={base}>
      {sphere}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 46 }}>
        <Identite t={t} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
          <Titre t={t} c={c} taille={entite === 'veolt' ? 120 : 96} />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontFamily: 'Inter',
              fontSize: 36,
              color: t.encreDouce,
              lineHeight: 1.4,
            }}
          >
            {nu(c.sousTitre).split('\n').map((l, i) => (
              <div key={i} style={{ display: 'flex' }}>
                {l}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {entite === 'veolt' ? <SceneVeolt t={t} /> : <SceneMagistria t={t} />}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
        <Services t={t} />
        <Pastille t={t} />
      </div>
    </div>
  );
}

/**
 * Quel gabarit pour quelle publication.
 *
 * Sans cette correspondance, la galerie reste une vitrine : on voit les
 * visuels, mais rien ne relie un post à son image. Ici chaque publication
 * sait quel gabarit lui va, et le pré-remplit avec son propre texte.
 *
 * Renvoie `null` pour Reddit et le blog : l'un est volontairement textuel,
 * l'autre a ses propres illustrations de section.
 */
export function gabaritPour(formatSlug: string, pilier: string): GabaritSlug | null {
  if (formatSlug === 'reddit-texte') return null;
  if (formatSlug === 'blog-article') return 'couverture';
  if (formatSlug === 'li-carrousel' || formatSlug === 'ig-carrousel') return 'carrousel';
  if (formatSlug === 'ig-reel' || formatSlug === 'tiktok-video') return 'reel';
  // Les deux piliers qui portent un chiffre ou une référence méritent le
  // gabarit qui le met en grand ; les autres passent par l'affirmation.
  if (pilier === 'demonter-un-chiffre' || pilier === 'arret-consequence') return 'chiffre';
  return 'affirmation';
}

/**
 * Découpe un titre en deux lignes à peu près égales, sur une frontière de mot.
 * Un titre d'un seul tenant sur un gabarit à deux lignes laisse la seconde
 * vide et déséquilibre toute la composition.
 */
export { deuxLignes } from './coupe';
