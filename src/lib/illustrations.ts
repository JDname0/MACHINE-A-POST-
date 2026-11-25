/**
 * Le pack d'illustrations — « montrer, pas dire » (25/11/2026).
 *
 * Un texte de post dit ce que fait Veolt ; l'illustration le montre : l'objet,
 * l'étape, le résultat. Ce fichier est le **registre** de ces images, tenu
 * comme une pièce de production :
 *
 *  - `IMAGES_PACK` : chaque image avec sa source exacte (outil, modèle, job,
 *    adresse), la date, l'image de référence qui tient la continuité, et le
 *    prompt tel qu'il a été envoyé. Rien ne se génère sans laisser sa trace ici.
 *  - `PLACEMENTS` : où elle sert — couverture d'un sujet (visuel du post,
 *    page 1 du carrousel, plans de la vidéo) ou page précise d'un carrousel,
 *    repérée par le **début de son texte** (pas par un numéro qui bougerait).
 *
 * Les images ne vivent pas dans le dépôt : `importerIllustrations`
 * (`actions.ts`) les copie dans la médiathèque depuis leur adresse d'origine,
 * sur une liste fermée d'hôtes (`HOTES_IMPORT`). Une fois copiées, elles ne
 * dépendent plus de Higgsfield.
 *
 * Règles de la charte de génération (`promptVeolt`, et `STUDIO-QUALITE.md`) :
 * aucune lettre dans l'image (le texte est posé par la machine, toujours
 * juste et lisible), aucun logo, aucun client, aucune donnée lisible — une
 * image ne doit jamais servir de preuve inventée (règle 2).
 *
 * MagistrIA n'a pas de pack : la cloison tient (règle 3).
 */

import type { EntiteSlug } from './marques';

/** Point d'intérêt (0 → 1) et grossissement d'une image dans son cadre. */
export interface Cadrage {
  x: number;
  y: number;
  zoom: number;
}

export interface ImagePack {
  /** Nom dans la médiathèque, sans extension. Unique. */
  nom: string;
  /** Ce que l'image montre, en une phrase : texte alternatif, fiche, contrôle. */
  montre: string;
  ratio: '4:5' | '4:3';
  outil: 'Higgsfield';
  modele: string;
  /** Identifiant du job Higgsfield : la génération se retrouve et se refait. */
  job: string;
  url: string;
  date: string;
  /** Job utilisé en image de référence (même objet d'une étape à l'autre). */
  reference?: string;
  /** Le prompt envoyé, mot pour mot ; ou, pour les premières, la scène décrite. */
  prompt: string;
  /**
   * Ce que l'image est, dit dans le cadre (règle 2 : aucune image ne passe pour
   * un travail client). Par défaut « Illustration IA ». Une mise en situation
   * d'un concept réel de veolt.fr le nomme.
   */
  mention?: string;
  /** Image d'origine (veolt.fr…) qui a servi de référence, quand il y en a une. */
  source?: string;
}

export interface Placement {
  entite: EntiteSlug;
  sujet: string;
  image: string;
  role: 'couverture' | 'page';
  /** Début du texte de la page (ou du plan vidéo) que l'image illustre. */
  debut?: string;
  cadrage?: Cadrage;
}

/** Hôtes d'où la machine accepte d'importer une image ou un clip. Liste fermée. */
export const HOTES_IMPORT = new Set(['d8j0ntlcm91z4.cloudfront.net', 'veolt.fr', 'www.veolt.fr']);

/**
 * La charte de génération Veolt : ce qui se répète à chaque prompt. La scène
 * vient avant (le sujet, concret, un seul objet ou une seule action), la charte
 * après. Toute nouvelle illustration part de là.
 */
export const CHARTE_PROMPT_VEOLT =
  'Dark studio, black background, lit with magenta (#B600A8) and violet (#7621B0) light, lavender (#C79BFF) highlights. ' +
  'Premium, cinematic, sharp, editorial. No readable text, no letters, no numbers, no logo, no watermark.';

export const promptVeolt = (scene: string) => `${scene.trim().replace(/\.?$/, '.')} ${CHARTE_PROMPT_VEOLT}`;

const CDN = 'https://d8j0ntlcm91z4.cloudfront.net/user_3FPgRQCspY9X5oV5hVaU8GSp8Z7/';
const G = { outil: 'Higgsfield' as const, modele: 'gpt_image_2_6 · medium · 1k', date: '2026-11-25' };
const FLACON = 'dc5d360d-0bfc-451b-b193-16cbee7d143a';
const FLACON_FINI = '037e2cf9-dad0-4d9b-a988-2e1b1f96d99c';

export const IMAGES_PACK: ImagePack[] = [
  // ── Montrer le travail ────────────────────────────────────────────────────
  {
    ...G,
    nom: 'illu-photo-ou-3d',
    montre: 'Le même flacon noir : à gauche en photo studio sur fond gris, à droite en rendu 3D dans la nuit.',
    ratio: '4:5',
    job: 'd7cca791-8939-43f0-a051-c0228b756f70',
    url: `${CDN}hf_20261125_195230_d7cca791-8939-43f0-a051-c0228b756f70.png`,
    prompt:
      'Split-screen product comparison of the same minimalist black glass perfume bottle with a chrome cap. Left half: a real studio photograph on a seamless pale grey paper sweep, softbox reflections, natural shadow. Right half: the identical bottle as a flawless glossy 3D render floating in a deep black void, lit by magenta (#B600A8) and violet (#7621B0) rim lights with soft lavender (#C79BFF) highlights and a few floating particles. A thin clean vertical divide between the two halves. Premium, cinematic, sharp. No text, no letters, no logo, no watermark.',
  },
  {
    ...G,
    nom: 'illu-studio-et-poste-3d',
    montre: 'Un studio photo et un poste 3D dans la même pièce ; à l’écran, le même produit en quatre coloris.',
    ratio: '4:5',
    job: '6bd9a6c8-cdde-4671-b5b8-983ebb8c7a48',
    url: `${CDN}hf_20261125_195228_6bd9a6c8-cdde-4671-b5b8-983ebb8c7a48.png`,
    prompt:
      'Left: a compact photo studio setup with a camera on a tripod, two softboxes and a product on a small white pedestal. Right: a dark 3D workstation monitor showing the same product as a glossy render with multiple colour variants. Both in one dark studio scene lit with magenta (#B600A8) and violet (#7621B0) light, lavender (#C79BFF) highlights. Premium, cinematic, sharp. No text, no letters, no logo, no watermark.',
  },
  {
    ...G,
    nom: 'illu-matieres-photo',
    montre: 'Trois macros de matières réelles : un lin tissé, un grain de chêne, une goutte sur du verre.',
    ratio: '4:3',
    job: 'ac98e05e-a122-4470-be2c-cb362de0545b',
    url: `${CDN}hf_20261125_195811_ac98e05e-a122-4470-be2c-cb362de0545b.png`,
    prompt: promptVeolt(
      'Three extreme macro photographs side by side of real materials that photography captures best: a woven linen fabric texture, a raw oak wood grain, and a single water droplet on dark glass. Real photographic texture, natural detail',
    ),
  },
  {
    ...G,
    nom: 'illu-accueil-avant-apres',
    montre: 'Deux portables : à gauche une page d’accueil chargée, à droite une promesse claire et un seul bouton.',
    ratio: '4:5',
    job: 'cc006900-de7b-4b68-846b-9c5840206381',
    url: `${CDN}hf_20261125_195136_cc006900-de7b-4b68-846b-9c5840206381.png`,
    prompt:
      '(Prompt d’origine non recopié — génération du 25/11/2026, 19:51.) Scène : deux ordinateurs portables côte à côte, page d’accueil encombrée avant, page épurée avec un seul bouton magenta après ; charte Veolt, sans texte lisible ni logo.',
  },
  {
    ...G,
    nom: 'illu-pipeline-3d',
    montre: 'Un flacon dont une moitié est encore en maillage et l’autre déjà rendue : la 3D en train de se faire.',
    ratio: '4:5',
    job: '325f9cde-8f88-41e3-948d-d3bc6a29f858',
    url: `${CDN}hf_20261125_195137_325f9cde-8f88-41e3-948d-d3bc6a29f858.png`,
    prompt:
      '(Prompt d’origine non recopié — génération du 25/11/2026, 19:51.) Scène : un flacon de parfum qui passe du maillage filaire à l’argile puis au rendu final ; charte Veolt, sans texte lisible ni logo.',
  },
  {
    ...G,
    nom: 'illu-3d-modelisation',
    montre: 'Le flacon en maillage filaire lavande sur une grille : la forme exacte, reconstruite.',
    ratio: '4:3',
    job: FLACON,
    url: `${CDN}hf_20261125_195137_dc5d360d-0bfc-451b-b193-16cbee7d143a.png`,
    prompt:
      '(Prompt d’origine non recopié — génération du 25/11/2026, 19:51.) Scène : le flacon de référence en maillage filaire, étape « modélisation » ; c’est l’image de référence des six étapes suivantes.',
  },
  {
    ...G,
    nom: 'illu-3d-materiaux',
    montre: 'Le même flacon en argile grise, à côté de quatre sphères de matières : verre dépoli, chrome, noir mat, laque violette.',
    ratio: '4:3',
    job: '4bdf1b14-3ac5-42c6-8403-6ed0b29e4b81',
    reference: FLACON,
    url: `${CDN}hf_20261125_195327_4bdf1b14-3ac5-42c6-8403-6ed0b29e4b81.png`,
    prompt:
      'Materials stage of the same perfume bottle as the reference (same faceted cap and same shape): the bottle now shown as a clean grey clay model, next to a neat row of four material preview spheres (frosted glass, brushed chrome, matte black, glossy violet lacquer) on a dark surface. Magenta (#B600A8) and violet (#7621B0) rim light, lavender (#C79BFF) highlights, black background. Premium CGI look-development breakdown. No text, no letters, no UI labels, no logo, no watermark.',
  },
  {
    ...G,
    nom: 'illu-3d-eclairage',
    montre: 'Le flacon en verre sur une scène noire, entouré de boîtes à lumière et de faisceaux magenta et violets.',
    ratio: '4:3',
    job: '4eebd057-4197-4cdb-b14f-5cbaf38f67d5',
    reference: FLACON,
    url: `${CDN}hf_20261125_195326_4eebd057-4197-4cdb-b14f-5cbaf38f67d5.png`,
    prompt:
      'Lighting stage of the same perfume bottle as the reference (same faceted cap and same shape), now in glass with materials applied, standing on a black stage surrounded by virtual softboxes and a strip light, visible volumetric light cones in magenta (#B600A8) and violet (#7621B0), dramatic lavender (#C79BFF) highlights on the glass. Cinematic CGI lighting breakdown. No text, no letters, no UI labels, no logo, no watermark.',
  },
  {
    ...G,
    nom: 'illu-3d-camera',
    montre: 'Une caméra virtuelle et son champ de vision pointés sur le flacon : on cadre comme un photographe.',
    ratio: '4:3',
    job: 'de8186d6-fd23-449c-acae-ae6ac7134faf',
    reference: FLACON,
    url: `${CDN}hf_20261125_195326_de8186d6-fd23-449c-acae-ae6ac7134faf.png`,
    prompt:
      'Camera stage of the same perfume bottle as the reference (same faceted cap and same shape), lit in glass, with a stylised virtual camera and its translucent view frustum pointing at it from a low three-quarter angle, a thin lavender (#C79BFF) focus line, magenta (#B600A8) accent lighting, shallow depth of field, black background. Elegant CGI breakdown. No text, no letters, no UI labels, no logo, no watermark.',
  },
  {
    ...G,
    nom: 'illu-3d-animation',
    montre: 'Le flacon fini en rotation, avec ses traînées de lumière et les silhouettes de ses positions clés.',
    ratio: '4:3',
    job: FLACON_FINI,
    reference: FLACON,
    url: `${CDN}hf_20261125_195328_037e2cf9-dad0-4d9b-a988-2e1b1f96d99c.png`,
    prompt:
      'Animation stage of the same perfume bottle as the reference (same faceted cap and same shape), finished glass and chrome, captured mid-rotation with elegant motion-blur light trails in magenta (#B600A8) and violet (#7621B0) sweeping around it, faint ghosted keyframe silhouettes showing the motion path, black background. Dynamic, premium CGI. No text, no letters, no UI labels, no logo, no watermark.',
  },
  {
    ...G,
    nom: 'illu-3d-rendu',
    montre: 'Le flacon en cours de calcul : l’image se résout tuile par tuile, certaines encore noires.',
    ratio: '4:3',
    job: '17702802-069f-4ba0-83da-3aae2e656bf3',
    reference: FLACON_FINI,
    url: `${CDN}hf_20261125_195810_17702802-069f-4ba0-83da-3aae2e656bf3.png`,
    prompt: promptVeolt(
      'Rendering stage of the same perfume bottle as the reference (same faceted cap, same glass shape): the final photoreal hero shot being computed, the image partly resolved in clean square render tiles, some tiles still dark and empty, as in a progressive bucket render',
    ).replace('no numbers,', 'no numbers, no UI labels,'),
  },
  {
    ...G,
    nom: 'illu-3d-etalonnage',
    montre: 'Trois fois le même flacon, étalonné en argent froid, en neutre et en magenta chaud.',
    ratio: '4:3',
    job: 'd5aa593e-43f2-4fc8-a473-557d92fd7a51',
    reference: FLACON_FINI,
    url: `${CDN}hf_20261125_195809_d5aa593e-43f2-4fc8-a473-557d92fd7a51.png`,
    prompt: promptVeolt(
      'Colour-grading stage of the same perfume bottle as the reference (same faceted cap, same glass shape): three identical hero shots of the bottle side by side, each with a different colour grade — cool silver, neutral, and warm magenta — like a film grading comparison',
    ).replace('no numbers,', 'no numbers, no UI labels,'),
  },

  // ── Versions finales, en situation réelle ─────────────────────────────────
  {
    ...G,
    nom: 'illu-flacon-en-situation',
    montre: 'Le même flacon, fini, posé sur un marbre de salle de bain au crépuscule ; une main s’en approche.',
    ratio: '4:5',
    job: '94f294ba-d422-4d6c-9373-03afc73ad60e',
    reference: FLACON_FINI,
    url: `${CDN}hf_20261125_201415_94f294ba-d422-4d6c-9373-03afc73ad60e.png`,
    prompt:
      "The exact same perfume bottle as the reference (same faceted crystal cap, same square glass shape), now a finished real product in a real-life lifestyle advertising photograph: standing on a dark marble bathroom vanity at dusk, a folded linen towel and a small green plant beside it, a woman's hand reaching for it from the side (hand only, no face), soft window light mixed with a subtle violet and magenta ambient glow, natural reflections on the marble, shallow depth of field. Photorealistic, premium, editorial. No readable text, no letters, no numbers, no logo, no watermark.",
  },
  {
    ...G,
    nom: 'illu-site-en-main',
    montre: 'Le site refait, sur un téléphone tenu en main dans un café : une promesse, une ligne, un seul bouton.',
    ratio: '4:5',
    job: '168e6469-ac3a-4163-9dfe-fe65f951a3a8',
    reference: 'cc006900-de7b-4b68-846b-9c5840206381',
    url: `${CDN}hf_20261125_201415_168e6469-ac3a-4163-9dfe-fe65f951a3a8.png`,
    prompt:
      "A real person's hand holding a modern smartphone in a cosy café at evening; the phone screen shows the same clean dark website design as the right-hand laptop in the reference — one clear headline block, a short line under it, and a single glowing magenta button, adapted to mobile. A coffee cup and a notebook on the wooden table, warm bokeh lights with violet and magenta accents. Photorealistic lifestyle photograph, shallow depth of field. Hands only, no faces. No readable text, no letters, no numbers, no logo, no watermark.",
  },
  {
    ...G,
    nom: 'illu-atelier-noir-en-boutique',
    montre: 'Atelier Noir, concept de parfumerie de veolt.fr, ouvert sur un portable et un téléphone dans une vraie boutique.',
    ratio: '4:5',
    job: '6a02c364-553a-4cd4-a771-2502252cbd88',
    reference: '2d52582a-7064-4a63-b18d-0028e98def28',
    source: 'https://veolt.fr/04-atelier-noir-parfum.jpg',
    mention: 'Concept Veolt · mise en situation IA',
    url: `${CDN}hf_20261125_201415_6a02c364-553a-4cd4-a771-2502252cbd88.png`,
    prompt:
      'The finished e-commerce website from the reference — a dark luxury perfumery site with a black perfume bottle hero on stone — shown live on a laptop open on a counter inside a real upscale perfume boutique, and the same site on a smartphone lying next to it; glass shelves with bottles softly blurred behind. Photorealistic photograph, evening light, subtle violet and magenta accents in the boutique lighting. Keep the screen layout faithful to the reference but with no readable text, no letters, no logo, no watermark.',
  },
  {
    ...G,
    nom: 'illu-canette-en-main',
    montre: 'Une canette concept au graphisme magenta et violet, couverte de gouttes, tenue en main sur un toit au coucher du soleil.',
    ratio: '4:5',
    job: '2fd49f57-1c91-442b-83c3-b468583a6dc0',
    url: `${CDN}hf_20261125_201415_2fd49f57-1c91-442b-83c3-b468583a6dc0.png`,
    prompt:
      'A sleek slim aluminium drink can with an abstract label of magenta, violet and lavender geometric shapes (no letters at all), covered in fresh condensation droplets, held by a hand at a sunny rooftop terrace at golden hour, city blurred in the background. Photorealistic lifestyle advertising photograph, crisp detail on the droplets and the metal, shallow depth of field. Hand only, no face. No readable text, no letters, no numbers, no logo, no watermark.',
  },

  // ── Démonter un chiffre ───────────────────────────────────────────────────
  {
    ...G,
    nom: 'illu-deux-devis',
    montre: 'Deux devis sur un bureau : une page courte, et un long devis dont quatre lignes sont surlignées en magenta.',
    ratio: '4:5',
    job: '1af0fd44-a5e1-49f3-8ddd-2028915fa20a',
    url: `${CDN}hf_20261125_195230_1af0fd44-a5e1-49f3-8ddd-2028915fa20a.png`,
    prompt:
      'Two printed quotation documents lying on a dark desk under a soft spotlight: one short single page and one long multi-page quote, both with abstract line items (grey placeholder bars, no readable words). A magenta (#B600A8) highlighter has marked four line items on the long one. A pen nearby. Black studio background, violet (#7621B0) and lavender (#C79BFF) light accents. Cinematic, editorial, premium. No readable text, no letters, no logo, no watermark.',
  },
  {
    ...G,
    nom: 'illu-pages-gabarit',
    montre: 'Cinq pages de site taillées dans le même gabarit, et une sixième dessinée sur mesure, cerclée de magenta.',
    ratio: '4:3',
    job: 'dc9ade63-658b-4b1d-bc99-c2edb09bb58e',
    url: `${CDN}hf_20261125_195810_dc9ade63-658b-4b1d-bc99-c2edb09bb58e.png`,
    prompt: promptVeolt(
      'Five identical website page wireframes on thin glass panels lined up in a row, all built from the same grey template blocks, and a sixth page at the end that is clearly bespoke and custom-designed, glowing with a magenta outline. Abstract layout blocks only',
    ),
  },

  {
    ...G,
    nom: 'illu-previsionnel-banquier',
    montre: 'Un prévisionnel imprimé sur le bureau d’un banquier : trois lignes surlignées, des lunettes, un stylo.',
    ratio: '4:5',
    job: 'b18daa50-4cbc-4207-bde1-c8dc480a8e4e',
    url: `${CDN}hf_20261125_200004_b18daa50-4cbc-4207-bde1-c8dc480a8e4e.png`,
    prompt: promptVeolt(
      "A banker's desk seen at a low angle: a printed financial forecast on paper with long rows of grey placeholder bars, exactly three rows underlined with a lavender highlighter, a pair of reading glasses resting on the page, a fountain pen. Abstract bars only, no readable figures",
    ),
  },
  {
    ...G,
    nom: 'illu-courbes-cout',
    montre: 'Deux courbes de lumière qui se croisent au-dessus d’une file de flacons identiques : le coût photo et le coût 3D.',
    ratio: '4:5',
    job: '7ebe31b7-5c2e-4c0c-b4ec-40f5c117611a',
    url: `${CDN}hf_20261125_200004_7ebe31b7-5c2e-4c0c-b4ec-40f5c117611a.png`,
    prompt: promptVeolt(
      'Two glowing light curves crossing in mid-air above a long row of identical glossy product bottles that recede into the distance: one curve rising as a straight steep line in lavender, the other starting higher and staying almost flat in magenta, their crossing point marked by a soft bright flare. Abstract, no axes labels',
    ),
  },
  {
    ...G,
    nom: 'illu-bfr-reservoir',
    montre: 'Un réservoir de verre qui se remplit par un robinet et se vide par l’autre : le besoin en fonds de roulement.',
    ratio: '4:5',
    job: 'e610f624-dc2f-40ff-b589-2b01061118d4',
    url: `${CDN}hf_20261125_200004_e610f624-dc2f-40ff-b589-2b01061118d4.png`,
    prompt: promptVeolt(
      'A clear glass reservoir standing on a dark surface, partly filled with glowing violet liquid: liquid flows in through a tap on one side and out through another tap on the other side, with a visible gap of time between them — a calm, elegant metaphor for working capital and cash flow',
    ),
  },

  {
    ...G,
    nom: 'illu-dossier-loupe',
    montre: 'Un dossier de prêt sur un bureau de banque, une loupe posée dessus qui fait ressortir une seule ligne.',
    ratio: '4:5',
    job: 'f9bb1e74-2b19-48a0-85f8-7dc5d9d7a353',
    url: `${CDN}hf_20261125_200234_f9bb1e74-2b19-48a0-85f8-7dc5d9d7a353.png`,
    prompt: promptVeolt(
      'A closed loan application folder on a bank desk, one corner lifted, with a round magnifying glass resting on it that reveals a single highlighted line of abstract grey bars inside the folder. A desk lamp casts a narrow beam',
    ),
  },

  // ── Pédagogie et prix ─────────────────────────────────────────────────────
  {
    ...G,
    nom: 'illu-site-a-refaire',
    montre: 'Un téléphone qui charge encore un vieux site encombré, à côté d’un portable qui affiche une page nette et un seul bouton.',
    ratio: '4:5',
    job: '2d34a21f-0ccb-4f21-808f-5112b79ec74b',
    url: `${CDN}hf_20261125_200231_2d34a21f-0ccb-4f21-808f-5112b79ec74b.png`,
    prompt: promptVeolt(
      'A smartphone lying on a dark desk showing an outdated, cluttered website that is still loading, a thin progress bar stuck halfway, light dust on the glass, next to a modern laptop whose dark screen shows a clean minimal page with one glowing button. Abstract layout blocks only',
    ),
  },
  {
    ...G,
    nom: 'illu-un-modele-dix-coloris',
    montre: 'Un seul modèle 3D au centre de l’établi, relié par des fils de lumière à dix rendus finis en dix coloris.',
    ratio: '4:5',
    job: '4aa192ba-85c9-40d3-bcbd-ed74f9d48a74',
    url: `${CDN}hf_20261125_200231_4aa192ba-85c9-40d3-bcbd-ed74f9d48a74.png`,
    prompt: promptVeolt(
      'A single master 3D model of a product glowing at the centre on a dark workbench, with thin light threads branching out from it to a neat row of many finished product renders in different colourways, all derived from the same model — an image of efficiency, reuse and lean production',
    ),
  },
  {
    ...G,
    nom: 'illu-analyse-remise',
    montre: 'Une main tend un rapport d’analyse ouvert à une autre, de l’autre côté d’une table : on donne avant de vendre.',
    ratio: '4:5',
    job: '8d3fe3d6-71e9-452b-8da1-582f58c6d759',
    url: `${CDN}hf_20261125_200233_8d3fe3d6-71e9-452b-8da1-582f58c6d759.png`,
    prompt: promptVeolt(
      "Across a dark meeting table, one hand slides an open printed analysis report toward another person's hands, the report pages glowing softly with abstract charts and highlighted grey bars, a cup of coffee nearby. Generous, calm, trustworthy mood. Only hands visible, no faces",
    ),
  },

  // ── Coulisses et méthode ──────────────────────────────────────────────────
  {
    ...G,
    nom: 'illu-trois-metiers',
    montre: 'Un studio, une table commune et trois postes : le code d’un site, un montage vidéo 3D, un tableau financier.',
    ratio: '4:5',
    job: '3e556869-a498-48d3-845d-520c904895a9',
    url: `${CDN}hf_20261125_200002_3e556869-a498-48d3-845d-520c904895a9.png`,
    prompt: promptVeolt(
      'One dark open-plan studio with three workstations around a single shared central table: a web developer screen showing abstract code blocks, a 3D and video editing station with a product render and a timeline, and a financial analyst screen with abstract charts and spreadsheet cells. The three screens glow and light the same table',
    ),
  },
  {
    ...G,
    nom: 'illu-quatre-entretiens',
    montre: 'Une table de travail vue du dessus : un carnet ouvert, quatre cartes de questions vierges, un portable et son tableur.',
    ratio: '4:5',
    job: 'f085f2f5-1f41-4fc9-9b11-1d46dc42205f',
    url: `${CDN}hf_20261125_195231_f085f2f5-1f41-4fc9-9b11-1d46dc42205f.png`,
    prompt:
      'Overhead view of a dark meeting table: an open notebook, four blank question cards laid out in a row, a fountain pen, and a laptop whose screen glows violet (#7621B0) with an abstract financial spreadsheet (blurred cells, no readable numbers). Magenta (#B600A8) rim light, lavender (#C79BFF) highlights, black background. Calm, serious, premium editorial photography. No readable text, no letters, no logo, no watermark.',
  },
  {
    ...G,
    nom: 'illu-porte-ouverte',
    montre: 'Un couloir de portes closes ; une seule, au fond, est ouverte sur une lumière magenta.',
    ratio: '4:5',
    job: 'b7393cae-443f-4922-a3e6-f80bb73236ea',
    url: `${CDN}hf_20261125_195137_b7393cae-443f-4922-a3e6-f80bb73236ea.png`,
    prompt:
      '(Prompt d’origine non recopié — génération du 25/11/2026, 19:51.) Scène : un couloir sombre aux portes fermées, une seule porte ouverte au fond sur une lumière magenta ; charte Veolt, sans texte lisible ni logo.',
  },
];

/** Où chaque image sert. L'ordre compte : il est repris dans les vidéos. */
export const PLACEMENTS: Placement[] = [
  // Le même produit, en photo studio et en 3D
  { entite: 'veolt', sujet: 'v-mt-1', image: 'illu-photo-ou-3d', role: 'couverture' },
  { entite: 'veolt', sujet: 'v-mt-1', image: 'illu-matieres-photo', role: 'page', debut: 'Ce que la photo fait mieux' },
  { entite: 'veolt', sujet: 'v-mt-1', image: 'illu-studio-et-poste-3d', role: 'page', debut: 'Ce que la 3D fait mieux' },
  { entite: 'veolt', sujet: 'v-mt-1', image: 'illu-un-modele-dix-coloris', role: 'page', debut: 'Au-delà de cinq visuels' },

  // Avant / après sur une page d'accueil — la même image, recadrée sur chaque écran
  { entite: 'veolt', sujet: 'v-mt-2', image: 'illu-accueil-avant-apres', role: 'couverture' },
  { entite: 'veolt', sujet: 'v-mt-2', image: 'illu-accueil-avant-apres', role: 'page', debut: 'Le défaut le plus fréquent', cadrage: { x: 0.26, y: 0.47, zoom: 2.3 } },
  { entite: 'veolt', sujet: 'v-mt-2', image: 'illu-accueil-avant-apres', role: 'page', debut: 'Avant, le slogan d', cadrage: { x: 0.255, y: 0.4, zoom: 2.15 } },
  { entite: 'veolt', sujet: 'v-mt-2', image: 'illu-accueil-avant-apres', role: 'page', debut: 'Après, la promesse en haut', cadrage: { x: 0.745, y: 0.4, zoom: 2.15 } },
  { entite: 'veolt', sujet: 'v-mt-2', image: 'illu-site-en-main', role: 'page', debut: 'Un seul bouton', cadrage: { x: 0.55, y: 0.32, zoom: 1.25 } },
  { entite: 'veolt', sujet: 'v-mt-2', image: 'illu-site-en-main', role: 'page', debut: 'Le site refait, en main' },

  // Un pipeline 3D de bout en bout — une image par étape, le même flacon
  { entite: 'veolt', sujet: 'v-mt-3', image: 'illu-pipeline-3d', role: 'couverture' },
  { entite: 'veolt', sujet: 'v-mt-3', image: 'illu-3d-modelisation', role: 'page', debut: 'Modélisation' },
  { entite: 'veolt', sujet: 'v-mt-3', image: 'illu-3d-materiaux', role: 'page', debut: 'Matériaux' },
  { entite: 'veolt', sujet: 'v-mt-3', image: 'illu-3d-eclairage', role: 'page', debut: 'Éclairage' },
  { entite: 'veolt', sujet: 'v-mt-3', image: 'illu-3d-camera', role: 'page', debut: 'Caméra' },
  { entite: 'veolt', sujet: 'v-mt-3', image: 'illu-3d-animation', role: 'page', debut: 'Animation' },
  { entite: 'veolt', sujet: 'v-mt-3', image: 'illu-3d-rendu', role: 'page', debut: 'Rendu' },
  { entite: 'veolt', sujet: 'v-mt-3', image: 'illu-3d-etalonnage', role: 'page', debut: 'Étalonnage' },
  { entite: 'veolt', sujet: 'v-mt-3', image: 'illu-flacon-en-situation', role: 'page', debut: 'Le produit fini, en situation' },

  // Pourquoi un devis de site varie de 1 500 à 10 000 €
  { entite: 'veolt', sujet: 'v-dc-1', image: 'illu-deux-devis', role: 'couverture' },
  { entite: 'veolt', sujet: 'v-dc-1', image: 'illu-pages-gabarit', role: 'page', debut: 'Ligne 1, les pages uniques' },
  { entite: 'veolt', sujet: 'v-dc-1', image: 'illu-atelier-noir-en-boutique', role: 'page', debut: 'À l’arrivée, un site en ligne' },

  // Les trois lignes qu'un banquier regarde dans un prévisionnel
  { entite: 'veolt', sujet: 'v-dc-2', image: 'illu-previsionnel-banquier', role: 'couverture' },

  // Le coût réel d'un visuel produit
  { entite: 'veolt', sujet: 'v-dc-3', image: 'illu-courbes-cout', role: 'couverture' },
  { entite: 'veolt', sujet: 'v-dc-3', image: 'illu-courbes-cout', role: 'page', debut: 'Deux courbes qui se croisent', cadrage: { x: 0.55, y: 0.22, zoom: 1.35 } },
  { entite: 'veolt', sujet: 'v-dc-3', image: 'illu-matieres-photo', role: 'page', debut: 'Ce qui déplace ce point' },
  { entite: 'veolt', sujet: 'v-dc-3', image: 'illu-studio-et-poste-3d', role: 'page', debut: 'La 3D, un coût par produit' },
  { entite: 'veolt', sujet: 'v-dc-3', image: 'illu-canette-en-main', role: 'page', debut: 'Le visuel fini, en situation' },

  // Comment on cadre un business plan en quatre entretiens
  { entite: 'veolt', sujet: 'v-cm-1', image: 'illu-quatre-entretiens', role: 'couverture' },

  // Ce qu'on refuse de faire, et pourquoi
  { entite: 'veolt', sujet: 'v-cm-2', image: 'illu-porte-ouverte', role: 'couverture' },

  // Trois métiers dans la même structure
  { entite: 'veolt', sujet: 'v-cm-3', image: 'illu-trois-metiers', role: 'couverture' },

  // Le besoin en fonds de roulement, expliqué sans jargon
  { entite: 'veolt', sujet: 'v-pd-1', image: 'illu-bfr-reservoir', role: 'couverture' },

  // Trois signes qu'il faut refaire son site
  { entite: 'veolt', sujet: 'v-pd-2', image: 'illu-site-a-refaire', role: 'couverture' },

  // Ce que votre banquier ne vous dira pas sur votre dossier
  { entite: 'veolt', sujet: 'v-pd-3', image: 'illu-dossier-loupe', role: 'couverture' },

  // Nos prix sont bas. Voilà pourquoi
  { entite: 'veolt', sujet: 'v-pp-1', image: 'illu-un-modele-dix-coloris', role: 'couverture' },

  // Pourquoi nous donnons l'analyse avant de vendre
  { entite: 'veolt', sujet: 'v-pp-2', image: 'illu-analyse-remise', role: 'couverture' },
];

/**
 * Les figures des articles de blog Veolt : trois au moins par article, dans
 * l'ordre où elles se lisent. La première se pose après « la réponse en bref »
 * (avant la première section), les suivantes avant chaque section ; le reste
 * avant l'appel final. Rien qu'une image du registre, avec sa mention.
 */
export const FIGURES_ARTICLES: Record<string, string[]> = {
  'v-art-bp-1': ['illu-dossier-loupe', 'illu-previsionnel-banquier', 'illu-bfr-reservoir'],
  'v-art-bp-2': ['illu-quatre-entretiens', 'illu-analyse-remise', 'illu-trois-metiers'],
  'v-art-bp-3': ['illu-previsionnel-banquier', 'illu-bfr-reservoir', 'illu-dossier-loupe'],
  'v-art-bp-4': ['illu-bfr-reservoir', 'illu-previsionnel-banquier', 'illu-quatre-entretiens'],
  'v-art-bp-5': ['illu-previsionnel-banquier', 'illu-quatre-entretiens', 'illu-dossier-loupe'],
  'v-art-bp-6': ['illu-dossier-loupe', 'illu-porte-ouverte', 'illu-analyse-remise'],
  'v-art-site-1': ['illu-pages-gabarit', 'illu-deux-devis', 'illu-atelier-noir-en-boutique'],
  'v-art-site-2': ['illu-deux-devis', 'illu-pages-gabarit', 'illu-atelier-noir-en-boutique'],
  'v-art-site-3': ['illu-site-a-refaire', 'illu-accueil-avant-apres', 'illu-site-en-main'],
  'v-art-site-4': ['illu-atelier-noir-en-boutique', 'illu-pages-gabarit', 'illu-site-en-main'],
  'v-art-site-5': ['illu-pipeline-3d', 'illu-site-en-main', 'illu-atelier-noir-en-boutique'],
  'v-art-site-6': ['illu-accueil-avant-apres', 'illu-deux-devis', 'illu-site-en-main'],
  'v-art-3d-1': ['illu-photo-ou-3d', 'illu-matieres-photo', 'illu-studio-et-poste-3d', 'illu-flacon-en-situation'],
  'v-art-3d-2': ['illu-pipeline-3d', 'illu-3d-modelisation', 'illu-3d-eclairage', 'illu-3d-rendu', 'illu-flacon-en-situation'],
  'v-art-3d-3': ['illu-3d-modelisation', 'illu-3d-materiaux', 'illu-3d-eclairage', 'illu-3d-etalonnage', 'illu-flacon-en-situation'],
  'v-art-3d-4': ['illu-3d-animation', 'illu-site-en-main', 'illu-canette-en-main'],
  'v-art-3d-5': ['illu-courbes-cout', 'illu-un-modele-dix-coloris', 'illu-canette-en-main'],
};

export const imagePack = (nom: string) => IMAGES_PACK.find((x) => x.nom === nom);

/** La mention posée dans le cadre de l'image. */
export const mentionDe = (nom: string) => imagePack(nom)?.mention ?? 'Illustration IA';

/** Les placements d'un sujet : la couverture d'abord, puis les pages dans l'ordre du registre. */
export function placementsDe(entite: string, sujet: string | null | undefined): Placement[] {
  if (!sujet) return [];
  const l = PLACEMENTS.filter((x) => x.entite === entite && x.sujet === sujet);
  return [...l.filter((x) => x.role === 'couverture'), ...l.filter((x) => x.role === 'page')];
}

const sansAccents = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, "'")
    .toLowerCase()
    .trim();

/** Le placement de page dont le texte commence ainsi (insensible aux accents et à la casse). */
export function placementPourTexte(entite: string, sujet: string | null | undefined, texte: string): Placement | undefined {
  const t = sansAccents(texte.replace(/^\s*\d+[.)]\s*/, ''));
  return placementsDe(entite, sujet).find((x) => x.role === 'page' && x.debut && t.startsWith(sansAccents(x.debut)));
}

export const cadrageEnTexte = (c?: Cadrage) => (c ? `${c.x},${c.y},${c.zoom}` : '');

export function cadrageDepuisTexte(s: string | null | undefined): Cadrage | undefined {
  if (!s) return undefined;
  const [x, y, zoom] = s.split(',').map(Number);
  if (![x, y, zoom].every(Number.isFinite)) return undefined;
  return { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)), zoom: Math.min(4, Math.max(1, zoom)) };
}

/**
 * Où poser une image de `l × h` dans un cadre de `L × H` : elle couvre le
 * cadre (comme `object-fit: cover`), grossie de `zoom`, centrée au plus près
 * du point d'intérêt sans jamais laisser de bord vide. Sert au rendu des
 * visuels (Satori) et à celui des vidéos (canvas), pour un cadrage identique.
 */
export function cadrer(L: number, H: number, l: number, h: number, c?: Cadrage): { w: number; h: number; gauche: number; haut: number } {
  const k = Math.max(L / l, H / h) * (c?.zoom ?? 1);
  const w = l * k;
  const hh = h * k;
  const borne = (v: number, min: number) => Math.min(0, Math.max(min, v));
  return {
    w,
    h: hh,
    gauche: borne(L / 2 - (c?.x ?? 0.5) * w, L - w),
    haut: borne(H / 2 - (c?.y ?? 0.5) * hh, H - hh),
  };
}
