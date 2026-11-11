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

export type GabaritSlug = 'lancement' | 'affirmation' | 'chiffre' | 'carrousel' | 'reel';

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
  /** Trame posée sous les halos (grille fine du site MagistrIA). */
  trame?: string;
  /** Sur-titre en petites capitales espacées, et sa couleur (police Mono). */
  surTitre?: { texte: string; couleur: string };
}

export type Variante = 'clair' | 'sombre';

/**
 * Les deux chartes, relevées là où elles font foi.
 *
 * Veolt vient du site en ligne (`veoltproduction.fr`) : fond quasi noir,
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
      signature: 'Studio Créatif',
      services: 'Business plan  •  Sites & web 3D  •  Vidéo & 3D',
      adresse: 'veoltproduction.fr',
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

function Pastille({ t, taille = 1 }: { t: ThemeVisuel; taille?: number }) {
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
          {c.ligne1}
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
          {l}
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
) {
  const el = rendreSansPhoto(entite, gabarit, contenu, variante);
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

function rendreSansPhoto(
  entite: EntiteSlug,
  gabarit: GabaritSlug,
  contenu?: Partial<Contenu>,
  variante: Variante = 'clair',
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
  };

  if (gabarit === 'chiffre') {
    return (
      <div style={base}>
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
            {c.sousTitre}
          </div>
        </div>
        <Pastille t={t} />
      </div>
    );
  }

  if (gabarit === 'affirmation') {
    return (
      <div style={base}>
        <Identite t={t} />
        <Titre t={t} c={c} taille={entite === 'veolt' ? 108 : 88} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 34 }}>
          <div style={{ display: 'flex', fontFamily: 'Inter', fontSize: 28, color: t.encreDouce, lineHeight: 1.45 }}>
            {c.sousTitre}
          </div>
          <Pastille t={t} />
        </div>
      </div>
    );
  }

  if (gabarit === 'carrousel') {
    return (
      <div style={base}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Identite t={t} />
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
        </div>
        <Titre t={t} c={c} taille={entite === 'veolt' ? 104 : 84} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
          <div style={{ display: 'flex', fontFamily: 'Inter', fontSize: 32, color: t.encre, lineHeight: 1.4 }}>
            {c.sousTitre}
          </div>
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
        <Identite t={t} taille={1.15} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 44 }}>
          <Titre t={t} c={c} taille={entite === 'veolt' ? 136 : 106} />
          <div style={{ display: 'flex', fontFamily: 'Inter', fontSize: 40, color: t.encreDouce, lineHeight: 1.4 }}>
            {c.sousTitre}
          </div>
        </div>
        <Pastille t={t} taille={1.15} />
      </div>
    );
  }

  // lancement
  return (
    <div style={base}>
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
            {c.sousTitre.split('\n').map((l, i) => (
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
  if (formatSlug === 'reddit-texte' || formatSlug === 'blog-article') return null;
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
