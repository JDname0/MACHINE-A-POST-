/**
 * Mise en ligne d'un article de blog sur le site de l'entité (26/11/2026).
 *
 * Le parcours : prévisualiser la page telle qu'elle sera en ligne → modifier le
 * texte sur la fiche → enregistrer → **valider** (Jonathan) → **mettre en
 * ligne** (Jonathan). Rien ne part seul : c'est un bouton, réservé à la
 * direction, sur un article validé (règle 1). Le contrôle ci-dessous refuse un
 * article qui n'est pas au niveau : 3 images au moins, une source nommée, aucun
 * repère « [?] », assez de matière.
 *
 * Où ça écrit : dans le dossier du site, sur le même serveur, désigné par une
 * variable d'environnement — jamais deviné :
 *   MAP_SITE_VEOLT_DOSSIER      chemin absolu de la racine de veolt.fr
 *   MAP_SITE_VEOLT_URL          https://veolt.fr (défaut)
 *   MAP_SITE_MAGISTRIA_DOSSIER / MAP_SITE_MAGISTRIA_URL  (même principe)
 * Le dossier doit contenir `blog.html` (preuve que c'est bien le site). Sans
 * variable, le bouton est remplacé par le téléchargement de la page, à déposer
 * à la main. veolt.fr est un site statique : l'article est un fichier
 * `blog-<titre>.html`, ses images `blog-img-<titre>-<n>.png`, et sa carte une
 * ligne de plus dans le tableau `ARTICLES` de `blog.html` (sauvegardé avant).
 * magistrai.fr n'a pas de blog statique à ce jour : l'entité garde l'aperçu et
 * le téléchargement, la mise en ligne directe attend une destination.
 *
 * Les trois fichiers absents de la copie locale du site (`me.php`…) ne sont
 * jamais touchés : on n'écrit que des fichiers `blog-*` et `blog.html`.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { EntiteSlug } from './marques';
import { marque } from './marques';
import type { LignePublication } from './requetes';
import { constatsDe, figuresArticle } from './fiche';
import { lire } from './medias';
import { db } from './db';
import { DOSSIER_DONNEES } from './persistance';

export interface Destination {
  entite: EntiteSlug;
  url: string;
  dossier: string | null;
  pret: boolean;
  /** Pourquoi la mise en ligne directe n'est pas possible, et quoi faire. */
  raison: string | null;
}

export function destinationSite(entite: EntiteSlug): Destination {
  const E = entite === 'veolt' ? 'VEOLT' : 'MAGISTRIA';
  const url = (process.env[`MAP_SITE_${E}_URL`]?.trim() || (entite === 'veolt' ? 'https://veolt.fr' : 'https://magistrai.fr')).replace(/\/+$/, '');
  const dossier = process.env[`MAP_SITE_${E}_DOSSIER`]?.trim() || null;
  if (!dossier)
    return {
      entite,
      url,
      dossier: null,
      pret: false,
      raison:
        entite === 'veolt'
          ? `Le dossier du site n'est pas déclaré. Sur o2switch : cPanel → Setup Node.js App → variables d'environnement → MAP_SITE_VEOLT_DOSSIER = chemin absolu de la racine de veolt.fr, puis Restart.`
          : `magistrai.fr n'a pas de blog où déposer une page à ce jour. L'article se télécharge ; la mise en ligne directe attend une destination (MAP_SITE_MAGISTRIA_DOSSIER).`,
    };
  if (!path.isAbsolute(dossier)) return { entite, url, dossier, pret: false, raison: `MAP_SITE_${E}_DOSSIER doit être un chemin absolu.` };
  if (!fs.existsSync(path.join(dossier, 'blog.html')))
    return { entite, url, dossier, pret: false, raison: `Le dossier déclaré ne contient pas blog.html : ce n'est pas la racine du site, rien n'y sera écrit.` };
  return { entite, url, dossier, pret: true, raison: null };
}

/** `blog-<titre>.html` : minuscules, sans accent, 70 caractères au plus. Un article déjà en ligne garde son adresse. */
export function fichierArticle(p: LignePublication): string {
  const deja = p.url_publiee?.match(/\/(blog-[a-z0-9-]+\.html)$/)?.[1];
  if (deja) return deja;
  const slug = (p.titre ?? `article-${p.id}`)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
    .replace(/-+$/, '');
  return `blog-${slug || `article-${p.id}`}.html`;
}

/** La source du fait avancé, telle que la fiche la porte (consignes), ou `null` si elle manque. */
export function sourceDe(p: LignePublication): string | null {
  const m = p.consignes_visuel.match(/SOURCE DU FAIT AVANCÉ — ([^\n]+)/);
  const s = m?.[1]?.trim();
  return s && !s.includes('[?]') ? s : null;
}

export interface PointControle {
  ok: boolean;
  libelle: string;
  detail: string;
}

/** Ce qu'un article doit tenir avant d'aller en ligne. Tout doit être vert. */
export function controleArticle(p: LignePublication): PointControle[] {
  const figures = figuresArticle(p);
  const texte = `${p.accroche}\n${p.corps}\n${p.appel}`;
  const mots = texte.split(/\s+/).filter(Boolean).length;
  const sections = (p.corps.match(/^## /gm) ?? []).length;
  const source = sourceDe(p);
  const { constats } = constatsDe(p);
  const blocages = constats.filter((c) => c.niveau === 'blocage');
  const tics = constats.filter((c) => c.regle.includes('tic d’écriture'));
  return [
    { ok: figures.length >= 3, libelle: '3 images au moins', detail: figures.length >= 3 ? `${figures.length} images, chacune avec sa légende et sa mention.` : `${figures.length} image(s) dans la médiathèque. Importer le pack (page Visuels) ou prévoir des figures au registre.` },
    { ok: !!source, libelle: 'Une source nommée', detail: source ?? 'Source du fait avancé non renseignée : la nommer dans les consignes de la fiche (« SOURCE DU FAIT AVANCÉ — … »).' },
    { ok: !/\[\?\]|\[à compléter\]/i.test(texte), libelle: 'Aucun repère à compléter', detail: /\[\?\]|\[à compléter\]/i.test(texte) ? 'Il reste un « [?] » ou « [à compléter] » dans le texte : le remplacer par un fait vérifié, ou réécrire autour.' : 'Aucun « [?] » dans le texte.' },
    { ok: mots >= 500 && sections >= 3, libelle: 'Assez de matière', detail: `${mots} mots, ${sections} sections (500 mots et 3 sections au moins).` },
    { ok: blocages.length === 0, libelle: 'Garde-fous', detail: blocages.length ? blocages.map((c) => `${c.regle} : ${c.message}`).join(' · ') : 'Aucun blocage (preuves interdites, ressources promises, persona).' },
    { ok: tics.length === 0, libelle: 'Une vraie voix', detail: tics.length ? `${tics[0].message} ${tics[0].remede}` : 'Aucun tic d’écriture « IA » relevé.' },
  ];
}

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const CATEGORIES: Array<[RegExp, { cat: string; classe: string; style: string; lien: string; cta: [string, string, string] }]> = [
  [/3d|publicit|packshot|vid[ée]o/i, { cat: '3D', classe: 'tag-3d', style: 'background:rgba(155,70,255,.12);border:1px solid rgba(155,70,255,.3);color:rgba(200,160,255,.9)', lien: 'price.html', cta: ['Votre produit en 3D', 'On le modélise une fois.', 'Rendus dès 119 € HT, vidéos en packs. Devis sous 24 h.'] }],
  [/site|web/i, { cat: 'Web', classe: 'tag-web', style: 'background:rgba(0,150,255,.1);border:1px solid rgba(0,150,255,.25);color:rgba(120,200,255,.9)', lien: 'web.html', cta: ['Votre site', 'On le construit avec vous.', 'Sites sur mesure dès 1 490 € HT. Devis sous 24 h.'] }],
  [/./, { cat: 'Business', classe: 'tag-business', style: 'background:rgba(255,160,0,.08);border:1px solid rgba(255,160,0,.2);color:rgba(255,200,100,.9)', lien: 'analyse.html', cta: ['Votre dossier', 'On le cadre avec vous.', 'Business plans dès 490 € HT. Analyse gratuite, réponse sous 24 h.'] }],
];
const categorieDe = (p: LignePublication) => CATEGORIES.find(([r]) => r.test(`${p.pilier} ${p.titre ?? ''}`))![1];

const MOIS = ['Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];

/** Le corps de l'article (texte échappé), les figures posées avant leurs sections. */
function corpsHtml(p: LignePublication, src: (i: number) => string): { html: string; description: string } {
  const figures = figuresArticle(p).map((f, i) => ({ ...f, src: src(i) }));
  const sortie: string[] = [];
  const figure = () => {
    const f = figures.shift();
    if (!f) return;
    sortie.push(
      `<figure style="margin:2rem 0;border-radius:16px;overflow:hidden;background:#0C0C0C"><img src="${esc(f.src)}" alt="${esc(f.montre)}" width="${f.largeur}" height="${f.hauteur}" style="width:100%;height:auto;display:block" loading="lazy">` +
        `<figcaption style="font-size:.78rem;color:rgba(215,226,234,.5);padding:.6rem .2rem 0">${esc(f.montre)} <span style="text-transform:uppercase;letter-spacing:.08em;font-size:.65rem;opacity:.8">· ${esc(f.mention)}</span></figcaption></figure>`,
    );
  };
  // L'accroche d'un article est souvent son titre (la réponse en bref ouvre le corps) : ne pas la répéter.
  const memeQueTitre = p.accroche.trim() === (p.titre ?? '').trim();
  if (!memeQueTitre) sortie.push(`<p><strong>${esc(p.accroche.trim())}</strong></p>`);
  let liste = false;
  const fermer = () => {
    if (liste) sortie.push('</ul>');
    liste = false;
  };
  let vuParagraphe = false;
  for (const ligne of p.corps.split('\n')) {
    const t = ligne.trim();
    if (!t) fermer();
    else if (t.startsWith('## ')) {
      fermer();
      const fin = /^(à retenir|dans la même série|sources?)\b/i.test(t.slice(3).trim());
      if (vuParagraphe && !fin) figure();
      sortie.push(`<h2>${esc(t.slice(3))}</h2>`);
    } else if (t.startsWith('# ')) {
      // Le titre est déjà en tête de page.
    } else if (t.startsWith('- ')) {
      if (!liste) sortie.push('<ul>');
      liste = true;
      sortie.push(`<li>${esc(t.slice(2))}</li>`);
    } else {
      fermer();
      vuParagraphe = true;
      sortie.push(`<p>${esc(t)}</p>`);
    }
  }
  fermer();
  while (figures.length) figure();
  const premier = p.corps.split('\n').map((l) => l.trim()).find((l) => l && !l.startsWith('#') && !l.startsWith('- ')) ?? '';
  const base = (memeQueTitre ? premier : p.accroche.trim()) || (p.titre ?? '');
  const description = base.length > 158 ? `${base.slice(0, base.lastIndexOf(' ', 155))}…` : base;
  return { html: sortie.join('\n      '), description };
}

/**
 * La page complète, dans le gabarit des articles de veolt.fr (mêmes styles, même
 * navigation, même pied). `images` donne l'adresse de chaque figure, dans l'ordre.
 */
export function pageArticle(p: LignePublication, images: (i: number) => string, dest: Destination, apercu = false): string {
  const m = marque(p.entite);
  const fichier = fichierArticle(p);
  const c = categorieDe(p);
  const { html, description } = corpsHtml(p, images);
  const titre = p.titre ?? '';
  const d = new Date();
  const dateLisible = `${MOIS[d.getMonth()]} ${d.getFullYear()}`;
  const mots = `${p.accroche} ${p.corps}`.split(/\s+/).filter(Boolean).length;
  const lecture = Math.max(2, Math.round(mots / 220));
  const source = sourceDe(p);
  const url = `${dest.url}/${fichier}`;
  const image0 = figuresArticle(p).length ? (apercu ? images(0) : `${dest.url}/${images(0)}`) : '';
  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: titre,
    description,
    datePublished: d.toISOString().slice(0, 10),
    dateModified: d.toISOString().slice(0, 10),
    author: { '@type': 'Organization', name: m.nom, url: dest.url },
    publisher: { '@type': 'Organization', name: m.nom, url: dest.url },
    mainEntityOfPage: url,
    ...(image0 ? { image: image0 } : {}),
  };
  const page = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ${apercu ? '<meta name="robots" content="noindex">' : '<meta name="robots" content="index, follow">'}
  <link href="fonts.css" rel="stylesheet" />
  <title>${esc(titre)} | Blog ${esc(m.nom)}</title>
  <meta name="description" content="${esc(description)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${esc(url)}">
  <meta property="og:title" content="${esc(titre)}">
  <meta property="og:description" content="${esc(description)}">
  <meta name="twitter:card" content="summary_large_image">
  ${image0 ? `<meta property="og:image" content="${esc(image0)}">` : ''}
  <link rel="canonical" href="${esc(url)}">
  <script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    html,body{background:#0C0C0C;font-family:'Kanit',sans-serif;color:#D7E2EA}
    .hg{background:linear-gradient(180deg,#646973 0%,#BBCCD7 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
    .ni{display:inline-flex;align-items:center;justify-content:center;text-align:center;color:#D7E2EA;font-weight:500;text-transform:uppercase;letter-spacing:.08em;font-size:.7rem;padding:.45rem .5rem;min-width:80px;border:1px solid rgba(215,226,234,.25);border-radius:999px;text-decoration:none}
    .ni:hover,.ni.active{border-color:rgba(215,226,234,.6);background:rgba(215,226,234,.08)}
    .prose h2{font-size:clamp(1.25rem,2.5vw,1.6rem);font-weight:800;color:#D7E2EA;margin:3rem 0 .9rem;text-transform:uppercase;letter-spacing:.02em;line-height:1.2}
    .prose p{color:rgba(215,226,234,.75);line-height:1.85;margin-bottom:1.2rem;font-size:clamp(.92rem,1.2vw,1.02rem)}
    .prose ul{margin:.75rem 0 1.5rem 1.75rem;color:rgba(215,226,234,.7);line-height:1.8;font-size:.95rem}
    .prose li{margin-bottom:.4rem}
    .prose strong{color:#D7E2EA;font-weight:700}
    .card{background:linear-gradient(160deg,rgba(215,226,234,.06) 0%,rgba(215,226,234,.02) 100%);border:1px solid rgba(0,150,255,.2);border-radius:24px;box-shadow:0 0 60px rgba(0,100,255,.08)}
  </style>
</head>
<body>
  <nav style="display:flex;flex-wrap:wrap;gap:10px;justify-content:space-between;padding:24px 32px;position:relative;z-index:20">
    <a href="index.html" class="ni">Accueil</a>
    <a href="about.html" class="ni">À propos</a>
    <a href="price.html" class="ni">Tarifs</a>
    <a href="blog.html" class="ni active">Blog</a>
    <a href="web.html" class="ni">Dév. Web</a>
    <a href="login.html" class="ni">Se connecter</a>
  </nav>

  <main style="max-width:780px;margin:0 auto;padding:48px 24px 96px">
    <div style="margin-bottom:40px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap">
        <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.15em;padding:4px 14px;border-radius:999px;${c.style}">${c.cat}</span>
        <span style="font-size:11px;color:rgba(215,226,234,.4);font-family:ui-monospace,monospace;letter-spacing:.08em">Mis à jour · ${dateLisible} · ${lecture} min de lecture</span>
      </div>
      <h1 class="hg" style="font-size:clamp(1.8rem,5vw,3rem);font-weight:900;text-transform:uppercase;line-height:1.05;letter-spacing:-.01em">${esc(titre)}</h1>
    </div>
    <div class="prose">
      ${html}
    </div>
    ${
      source
        ? `<div style="margin-top:48px;padding-top:24px;border-top:1px solid rgba(215,226,234,.1)">
      <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.15em;color:rgba(215,226,234,.45)">Sources et méthode</span>
      <p style="color:rgba(215,226,234,.6);line-height:1.7;font-size:.88rem;margin-top:10px">${esc(source)}</p>
      <p style="color:rgba(215,226,234,.4);line-height:1.7;font-size:.8rem;margin-top:8px">Les prix cités sont ceux affichés sur ${esc(dest.url.replace(/^https?:\/\//, ''))} à la date de mise à jour. Les ordres de grandeur du métier sont donnés comme tels, pas comme des mesures.</p>
    </div>`
        : ''
    }
    <div class="card" style="margin-top:56px;padding:40px 48px">
      <span style="font-size:11px;text-transform:uppercase;letter-spacing:.2em;color:rgba(215,226,234,.5)">${esc(c.cta[0])}</span>
      <h2 style="font-size:clamp(1.4rem,3vw,2rem);font-weight:900;text-transform:uppercase;color:#D7E2EA;margin:8px 0 16px">${esc(c.cta[1])}</h2>
      <p style="color:rgba(215,226,234,.6);margin-bottom:24px;font-size:.95rem">${esc(p.appel.trim() || c.cta[2])}</p>
      <a href="${c.lien}" style="display:inline-block;padding:12px 28px;border-radius:999px;color:white;font-weight:600;font-size:.85rem;text-transform:uppercase;letter-spacing:.1em;text-decoration:none;background:linear-gradient(123deg,#18011F 7%,#B600A8 37%,#7621B0 72%,#BE4C00 100%);box-shadow:0 4px 4px rgba(181,1,167,.25)">En savoir plus</a>
    </div>
  </main>

  <footer style="border-top:1px solid rgba(255,255,255,.07);padding:40px 32px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px">
    <a href="blog.html" style="color:rgba(215,226,234,.5);font-size:.8rem;text-transform:uppercase;letter-spacing:.1em;text-decoration:none">← Retour au blog</a>
    <p style="color:rgba(255,255,255,.2);font-size:.65rem;font-family:ui-monospace,monospace;letter-spacing:.1em;text-transform:uppercase">${d.getFullYear()} ${esc(m.nom)} · Studio créatif.</p>
  </footer>
</body>
</html>
`;
  // Aperçu : la page est servie par l'outil, ses liens relatifs (polices, navigation) pointent vers le site.
  return apercu ? page.replace(/href="(?!https?:|#|mailto:)([^"]+)"/g, (_m, h) => `href="${dest.url}/${h}" target="_blank"`) : page;
}

/** Le nom du fichier image n° i (à partir de 1) d'un article. */
export const fichierImage = (p: LignePublication, i: number) => `${fichierArticle(p).replace(/^blog-/, 'blog-img-').replace(/\.html$/, '')}-${i + 1}.png`;

function ecrireAtomique(chemin: string, contenu: Buffer | string) {
  const tmp = `${chemin}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, contenu);
  fs.renameSync(tmp, chemin);
}

/**
 * Ajoute la carte de l'article en tête du tableau `ARTICLES` de `blog.html`
 * (une ligne, la même forme que les autres). Sans effet si l'article y est
 * déjà. `blog.html` est copié dans les données avant d'être touché ; si le
 * tableau n'est pas trouvé, on ne touche à rien et on le dit.
 */
function inscrireAuBlog(dossier: string, p: LignePublication, description: string): string {
  const chemin = path.join(dossier, 'blog.html');
  const page = fs.readFileSync(chemin, 'utf8');
  const fichier = fichierArticle(p);
  if (page.includes(`href: '${fichier}'`)) return 'déjà dans la liste du blog';
  const ancre = page.match(/const ARTICLES = \[\r?\n/);
  if (!ancre) return 'liste du blog non modifiée : tableau ARTICLES introuvable dans blog.html (ajouter la carte à la main)';
  const c = categorieDe(p);
  const d = new Date();
  const figure = figuresArticle(p)[0];
  const js = (t: string) => JSON.stringify(t);
  const ligne = `      { cat: ${js(c.cat)}, catClass: ${js(c.classe)}, title: ${js(p.titre ?? '')}, desc: ${js(description)}, date: ${js(`${MOIS[d.getMonth()]} ${d.getFullYear()}`)}, href: '${fichier}', img: '${fichierImage(p, 0)}', alt: ${js(figure?.montre ?? p.titre ?? '')} },\n`;
  const copies = path.join(DOSSIER_DONNEES, 'sauvegardes-site');
  fs.mkdirSync(copies, { recursive: true });
  fs.writeFileSync(path.join(copies, `blog-${d.toISOString().replace(/[:.]/g, '-')}.html`), page);
  const i = ancre.index! + ancre[0].length;
  ecrireAtomique(chemin, page.slice(0, i) + ligne + page.slice(i));
  return 'ajouté en tête de la liste du blog';
}

/** Écrit l'article et ses images dans le dossier du site. Le contrôle doit être vert ; l'appelant vérifie rôle et statut. */
export async function ecrireArticle(p: LignePublication): Promise<{ url: string; fichiers: string[]; blog: string }> {
  const dest = destinationSite(p.entite);
  if (!dest.pret || !dest.dossier) throw new Error(dest.raison ?? 'Destination non prête.');
  const rate = controleArticle(p).filter((x) => !x.ok);
  if (rate.length) throw new Error(`Contrôle non passé : ${rate.map((x) => x.libelle).join(', ')}.`);
  const figures = figuresArticle(p);
  const fichiers: string[] = [];
  for (let i = 0; i < figures.length; i++) {
    const ligne = db().prepare('SELECT cle FROM medias WHERE id=? AND entite=?').get(figures[i].id, p.entite) as { cle: string } | undefined;
    const octets = ligne ? await lire(ligne.cle) : null;
    if (!octets) throw new Error(`Image « ${figures[i].nom} » illisible dans la médiathèque.`);
    const nom = fichierImage(p, i);
    ecrireAtomique(path.join(dest.dossier, nom), octets);
    fichiers.push(nom);
  }
  const fichier = fichierArticle(p);
  if (!/^blog-[a-z0-9-]+\.html$/.test(fichier)) throw new Error('Nom de fichier refusé.');
  const html = pageArticle(p, (i) => fichierImage(p, i), dest);
  ecrireAtomique(path.join(dest.dossier, fichier), html);
  fichiers.push(fichier);
  const { description } = corpsHtml(p, () => '');
  const blog = inscrireAuBlog(dest.dossier, p, description);
  return { url: `${dest.url}/${fichier}`, fichiers, blog };
}
