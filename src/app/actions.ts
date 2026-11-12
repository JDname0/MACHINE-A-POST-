'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db, tracer } from '@/lib/db';
import { sauvegarder } from '@/lib/persistance';
import { verifier, ouvrirSession, fermerSession } from '@/lib/auth';
import { publier, type ReseauConnectable } from '@/lib/connecteurs';
import { format } from '@/lib/formats';

/**
 * L'adresse de base du site, telle qu'elle est vue depuis l'extérieur.
 *
 * Le protocole se lit dans `x-forwarded-proto` plutôt que de se supposer :
 * derrière Vercel c'est `https`, mais en développement c'est `http`, et un
 * lien en `https://localhost:3100` ne mène nulle part — relevé le 2026-11-04.
 */
async function adresseDeBase(): Promise<string> {
  const { headers } = await import('next/headers');
  const h = await headers();
  const hote = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const protocole = h.get('x-forwarded-proto') ?? (hote.startsWith('localhost') || hote.startsWith('127.') ? 'http' : 'https');
  return `${protocole}://${hote}`;
}

export async function seConnecter(fd: FormData) {
  const mdp = String(fd.get('motDePasse') ?? '');
  if (!verifier(mdp)) redirect('/connexion?erreur=1');
  await ouvrirSession();
  redirect('/veolt');
}

export async function seDeconnecter() {
  await fermerSession();
  redirect('/connexion');
}

export async function enregistrerPublication(fd: FormData) {
  const id = Number(fd.get('id'));
  const entite = String(fd.get('entite'));
  db()
    .prepare(
      `UPDATE publications SET titre=?, accroche=?, corps=?, appel=?, hashtags=?, consignes_visuel=?,
        persona=?, pilier=?, preuve=?, indicateur=?, sous_forum=?, maj_le=datetime('now') WHERE id=?`,
    )
    .run(
      String(fd.get('titre') ?? ''),
      String(fd.get('accroche') ?? ''),
      String(fd.get('corps') ?? ''),
      String(fd.get('appel') ?? ''),
      String(fd.get('hashtags') ?? ''),
      String(fd.get('consignes_visuel') ?? ''),
      String(fd.get('persona') ?? '') || null,
      String(fd.get('pilier') ?? ''),
      String(fd.get('preuve') ?? '') || null,
      String(fd.get('indicateur') ?? '') || null,
      String(fd.get('sous_forum') ?? '') || null,
      id,
    );
  tracer('brouillon enregistré', `publication ${id}`, entite);
  // Une mutation non poussée vers le Blob est une mutation perdue
  // au prochain démarrage d'instance. Elle ne coûte rien en local.
  await sauvegarder();
  revalidatePath(`/${entite}/publications/${id}`);
}

export async function changerStatut(fd: FormData) {
  const id = Number(fd.get('id'));
  const entite = String(fd.get('entite'));
  const statut = String(fd.get('statut'));
  if (!['brouillon', 'a-relire', 'valide', 'abandonne'].includes(statut)) return;
  if (statut === 'valide') {
    // Même règle que la file de validation : le garde-fou est revérifié ici,
    // un bouton grisé n'empêche pas un formulaire envoyé à la main.
    const { publication } = await import('@/lib/requetes');
    const { constatsDe } = await import('@/lib/fiche');
    const p = publication(id);
    if (!p || !constatsDe(p).validable) return;
  }
  db().prepare("UPDATE publications SET statut=?, maj_le=datetime('now') WHERE id=?").run(statut, id);
  if (statut === 'valide') {
    const { publication } = await import('@/lib/requetes');
    const p = publication(id);
    if (p) await memoriserSansBloquer(p);
  }
  tracer('statut changé', `publication ${id} → ${statut}`, entite);
  // Une mutation non poussée vers le Blob est une mutation perdue
  // au prochain démarrage d'instance. Elle ne coûte rien en local.
  await sauvegarder();
  revalidatePath(`/${entite}/publications/${id}`);
  revalidatePath(`/${entite}/publications`);
  revalidatePath(`/${entite}`);
}

/**
 * La décision prise depuis la file de validation : valider ou renvoyer en
 * relecture, un post à la fois.
 *
 * Le garde-fou est **revérifié ici**, côté serveur : un bouton grisé dans la
 * page n'empêche pas un formulaire envoyé à la main. Un post bloqué ne passe
 * jamais en « validé », quelle que soit la page d'où vient la demande.
 */
export async function trancher(fd: FormData) {
  const id = Number(fd.get('id'));
  const entite = String(fd.get('entite'));
  const decision = String(fd.get('decision'));
  const retour = String(fd.get('retour') ?? `/${entite}/valider`);
  const { publication } = await import('@/lib/requetes');
  const { constatsDe } = await import('@/lib/fiche');
  const p = publication(id);
  if (!p || p.entite !== entite || p.statut === 'publie') redirect(retour);

  if (decision === 'valide') {
    if (!constatsDe(p).validable) redirect(`${retour}${retour.includes('?') ? '&' : '?'}bloque=${id}#p${id}`);
    db().prepare("UPDATE publications SET statut='valide', maj_le=datetime('now') WHERE id=?").run(id);
    tracer('validé depuis la file', `publication ${id}`, entite);
    await memoriserSansBloquer(p);
  } else if (decision === 'a-relire') {
    db().prepare("UPDATE publications SET statut='a-relire', maj_le=datetime('now') WHERE id=?").run(id);
    tracer('renvoyé en relecture', `publication ${id}`, entite);
  } else {
    redirect(retour);
  }
  await sauvegarder();
  revalidatePath(`/${entite}`);
  revalidatePath(`/${entite}/publications`);
  revalidatePath(`/${entite}/publications/${id}`);
  redirect(`${retour}#p${id}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Mémoire des visuels — ranger les images générées dans la médiathèque
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mémorise le visuel d'un post validé. Un échec ne doit jamais empêcher la
 * validation : le visuel se régénère, il sera mémorisé à la prochaine occasion.
 */
async function memoriserSansBloquer(p: import('@/lib/requetes').LignePublication) {
  try {
    const { memoriserVisuelDe } = await import('@/lib/memoire');
    await memoriserVisuelDe(p);
  } catch (e) {
    console.error('[mémoire] visuel non mémorisé', p.id, e);
  }
}

export async function memoriserVisuel(fd: FormData) {
  const id = Number(fd.get('id'));
  const entite = String(fd.get('entite'));
  const retour = String(fd.get('retour') ?? '') || `/${entite}/publications/${id}`;
  const { publication } = await import('@/lib/requetes');
  const { memoriserVisuelDe } = await import('@/lib/memoire');
  const p = publication(id);
  if (!p || p.entite !== entite) redirect(retour);
  await memoriserVisuelDe(p);
  await sauvegarder();
  revalidatePath(`/${entite}/visuels`);
  revalidatePath(`/${entite}/videos`);
  revalidatePath(`/${entite}/publications/${id}`);
  redirect(retour);
}

/** Génère et range les visuels dus aujourd'hui (selon le réglage de l'entité). Appelé par le rappel, ou seul en mode auto. */
export async function memoriserVisuelsDus(fd: FormData) {
  const entite = String(fd.get('entite')) as 'veolt' | 'magistria';
  const { visuelsDus } = await import('@/lib/production');
  const { memoriserVisuelDe } = await import('@/lib/memoire');
  let n = 0;
  for (const p of visuelsDus(entite)) {
    try {
      if ((await memoriserVisuelDe(p)) === 'cree') n++;
    } catch (e) {
      console.error('[mémoire] visuel dû non généré', p.id, e);
    }
  }
  if (n) {
    tracer('visuels dus générés', `${n} post(s)`, entite);
    await sauvegarder();
  }
  revalidatePath(`/${entite}`, 'layout');
  return { n };
}

/** Mémorise d'un coup les visuels de toute une semaine — la matière du studio vidéo. */
export async function memoriserSemaine(fd: FormData) {
  const entite = String(fd.get('entite'));
  const semaine = Number(fd.get('semaine'));
  const retour = String(fd.get('retour') ?? '') || `/${entite}/valider?s=${semaine}`;
  const { publications } = await import('@/lib/requetes');
  const { memoriserVisuelDe } = await import('@/lib/memoire');
  let crees = 0;
  for (const p of publications(entite as 'veolt' | 'magistria').filter((x) => x.semaine === semaine)) {
    if ((await memoriserVisuelDe(p)) === 'cree') crees++;
  }
  tracer('visuels de la semaine mémorisés', `S${semaine} : ${crees} nouveau(x)`, entite);
  await sauvegarder();
  revalidatePath(`/${entite}/visuels`);
  revalidatePath(`/${entite}/videos`);
  redirect(`${retour}${retour.includes('?') ? '&' : '?'}memorises=${crees}`);
}

/**
 * Vidéo à la demande : un nouveau post vidéo, hors calendrier, tiré du texte
 * d'un post existant (un LinkedIn, un carrousel…). Le calendrier n'est pas
 * touché : le post créé n'a pas de semaine, il garde la date du post source.
 * Seuls les réseaux que la marque n'exclut pas sont proposés.
 */
export async function creerVideoDepuisPost(fd: FormData) {
  const entite = String(fd.get('entite'));
  const source = Number(fd.get('source'));
  const formatSlug = String(fd.get('format_slug'));
  const { publication } = await import('@/lib/requetes');
  const { formatsVideoDe } = await import('@/lib/production');
  const s = publication(source);
  if (!s || s.entite !== entite || !formatsVideoDe(entite as 'veolt' | 'magistria').includes(formatSlug)) redirect(`/${entite}/videos`);
  // Déjà créée depuis ce post, dans ce format : on la rouvre plutôt que d'en faire une seconde.
  const existe = db()
    .prepare('SELECT id FROM publications WHERE entite=? AND date_prevue=? AND format_slug=? AND pilier=?')
    .get(entite, s.date_prevue, formatSlug, s.pilier) as { id: number } | undefined;
  if (existe) redirect(`/${entite}/videos?p=${existe.id}`);
  const info = db()
    .prepare(
      `INSERT INTO publications (entite, format_slug, pilier, persona, sujet_ref, date_prevue, semaine, phase, raison,
        statut, titre, accroche, corps, appel, hashtags, consignes_visuel, preuve, indicateur)
       VALUES (?,?,?,?,?,?,NULL,NULL,?, 'brouillon', ?,?,?,?,?,?,?,?)`,
    )
    .run(
      entite,
      formatSlug,
      s.pilier,
      s.persona,
      s.sujet_ref,
      s.date_prevue,
      `Vidéo à la demande, tirée du post « ${(s.titre ?? '').slice(0, 80)} ».`,
      s.titre,
      s.accroche,
      s.corps,
      s.appel,
      s.hashtags,
      s.consignes_visuel,
      s.preuve,
      s.indicateur,
    );
  tracer('vidéo à la demande créée', `depuis la publication ${source} · ${formatSlug}`, entite);
  await sauvegarder();
  revalidatePath(`/${entite}/videos`);
  redirect(`/${entite}/videos?p=${info.lastInsertRowid}`);
}

/** Plans d'une vidéo proposés par l'IA. Rien n'est enregistré : le studio les affiche, Jonathan retouche. */
export async function proposerPlansIA(fd: FormData) {
  const id = Number(fd.get('id'));
  const { publication } = await import('@/lib/requetes');
  const { dureeConseillee } = await import('@/lib/conformite-media');
  const { proposerPlans, messageErreurIA } = await import('@/lib/ia');
  const p = publication(id);
  if (!p) return { ok: false as const, raison: 'Post introuvable.' };
  try {
    const r = await proposerPlans(p, dureeConseillee(p.format_slug), String(fd.get('consigne') ?? '').slice(0, 600));
    tracer('plans vidéo proposés par l’IA', `publication ${id} · ${r.plans.length} plans`, p.entite);
    return { ok: true as const, ...r };
  } catch (e) {
    return { ok: false as const, raison: messageErreurIA(e) };
  }
}

/**
 * Vidéo cas d'usage : un post hors calendrier, porté par un script de
 * démonstration (`casUsage` dans videos.ts). Le texte du post est la légende
 * du script ; le studio monte la vidéo à partir de ses scènes.
 */
export async function creerVideoCasUsage(fd: FormData) {
  const entite = String(fd.get('entite'));
  const ref = String(fd.get('ref'));
  const { VIDEOS } = await import('@/lib/videos');
  const s = VIDEOS.find((v) => v.ref === ref && v.entite === entite && v.casUsage);
  if (!s) redirect(`/${entite}/videos`);
  const existe = db().prepare('SELECT id FROM publications WHERE entite=? AND sujet_ref=? AND format_slug=?').get(entite, ref, s.formatSlug) as
    | { id: number }
    | undefined;
  if (existe) redirect(`/${entite}/videos?p=${existe.id}`);
  const [accroche, ...suite] = s.legende.split('\n\n');
  const { iso } = await import('@/lib/calendrier');
  // Une date libre : aujourd'hui, ou le premier jour suivant sans post de ce format et de ce pilier.
  const d = new Date();
  for (let k = 0; k < 60; k++) {
    const libre = !db()
      .prepare('SELECT 1 FROM publications WHERE entite=? AND date_prevue=? AND format_slug=? AND pilier=?')
      .get(entite, iso(d), s.formatSlug, s.pilier);
    if (libre) break;
    d.setDate(d.getDate() + 1);
  }
  const info = db()
    .prepare(
      `INSERT INTO publications (entite, format_slug, pilier, persona, sujet_ref, date_prevue, semaine, phase, raison,
        statut, titre, accroche, corps, appel, hashtags, consignes_visuel, preuve, indicateur)
       VALUES (?,?,?,NULL,?,?,NULL,NULL,?, 'brouillon', ?,?,?,'','','',NULL,?)`,
    )
    .run(entite, s.formatSlug, s.pilier, ref, iso(d), `Vidéo cas d’usage : ${s.titre}.`, s.titre, accroche, suite.join('\n\n'), s.indicateur);
  tracer('vidéo cas d’usage créée', `${ref} · ${s.formatSlug}`, entite);
  await sauvegarder();
  revalidatePath(`/${entite}/videos`);
  redirect(`/${entite}/videos?p=${info.lastInsertRowid}`);
}

/** Quand et comment produire les vidéos — choisi dans le studio, par entité. */
export async function majReglagesVideo(fd: FormData) {
  const entite = String(fd.get('entite')) as 'veolt' | 'magistria';
  const { poserReglagesVideo, DELAIS, MODES } = await import('@/lib/production');
  const delai = Number(fd.get('delai'));
  const mode = String(fd.get('mode'));
  const retour = String(fd.get('retour') ?? '').startsWith(`/${entite}/`) ? String(fd.get('retour')) : `/${entite}/videos`;
  if (!DELAIS.some((d) => d.jours === delai) || !MODES.some((m) => m.slug === mode)) redirect(retour);
  poserReglagesVideo(entite, { delai, mode: mode as 'boutons' | 'rappel' | 'auto' });
  tracer('réglages vidéo', `délai ${delai} j · mode ${mode}`, entite);
  await sauvegarder();
  revalidatePath(`/${entite}`, 'layout');
  redirect(`${retour}${retour.includes('?') ? '&' : '?'}reglages=1`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Assistance IA — proposer, adopter, rejeter
// ─────────────────────────────────────────────────────────────────────────────

function retourSur(fd: FormData, entite: string, id: number): string {
  return String(fd.get('retour') ?? '') || `/${entite}/publications/${id}`;
}
function avecParam(url: string, cle: string, val: string): string {
  const [base, ancre] = url.split('#');
  return `${base}${base.includes('?') ? '&' : '?'}${cle}=${encodeURIComponent(val)}${ancre ? `#${ancre}` : ''}`;
}

/**
 * « Refaire le texte depuis le sujet » : le post est retaillé à partir de son
 * sujet et de son format (`gabarits.ts`), comme au semis du calendrier — utile
 * après une retouche ratée ou une mise à jour des gabarits. Aucune IA, aucun
 * crédit. Le texte remplacé part au journal en entier : rien ne se perd. Un
 * texte neuf n'a pas été relu, donc le post repasse en brouillon même s'il
 * était validé (règle 1). Un post déjà publié n'est jamais touché.
 */
export async function regenererTexte(fd: FormData) {
  const id = Number(fd.get('id'));
  const entite = String(fd.get('entite'));
  const retour = retourSur(fd, entite, id);
  const { publication } = await import('@/lib/requetes');
  const { sujet } = await import('@/lib/sujets');
  const { fabriquer } = await import('@/lib/gabarits');
  const p = publication(id);
  if (!p || p.entite !== entite || p.statut === 'publie' || !p.sujet_ref) redirect(retour);
  const s = sujet(p.sujet_ref);
  // La cloison : un sujet de l'autre entité ne retaille jamais ce post.
  if (!s || !s.ref.startsWith(entite === 'veolt' ? 'v-' : 'm-')) redirect(retour);
  const f = fabriquer(s, p.format_slug as Parameters<typeof fabriquer>[1], entite as 'veolt' | 'magistria');
  const titre = f.titre ?? s.titre;
  // Rien n'a changé : on ne touche ni au texte ni au statut (une relecture déjà faite reste faite).
  if ([titre, f.accroche, f.corps, f.appel, f.hashtags].join('\u0000') === [p.titre, p.accroche, p.corps, p.appel, p.hashtags].join('\u0000')) {
    redirect(avecParam(retour, 'refait', `${id}-identique`));
  }
  tracer(
    'texte refait depuis le sujet',
    JSON.stringify({ publication: id, statutAvant: p.statut, avant: { titre: p.titre, accroche: p.accroche, corps: p.corps, appel: p.appel, hashtags: p.hashtags } }),
    entite,
  );
  db()
    .prepare(
      `UPDATE publications SET titre=?, accroche=?, corps=?, appel=?, hashtags=?, consignes_visuel=?, statut='brouillon',
         maj_le=datetime('now') WHERE id=?`,
    )
    .run(titre, f.accroche, f.corps, f.appel, f.hashtags, f.consignesVisuel.join('\n'), id);
  await sauvegarder();
  revalidatePath(`/${entite}/calendrier`);
  revalidatePath(`/${entite}/valider`);
  revalidatePath(`/${entite}/publications/${id}`);
  redirect(avecParam(retour, 'refait', String(id)));
}

/**
 * « Générer un article » à la demande, d'un clic, depuis le calendrier.
 *
 *  - `mode=plan` : un article déjà écrit du plan de référencement (réserve de
 *    `articles-*.ts`), posé à la date choisie. Sans IA, sans crédit.
 *  - `mode=ia`   : un article rédigé par l'IA sur une requête libre, au moule
 *    des articles de grappe, avec le cadre de la marque (preuves interdites
 *    comprises). Exige `ANTHROPIC_API_KEY` côté serveur.
 *
 * Dans les deux cas l'article entre en **brouillon** et repasse par les
 * garde-fous : rien ne part sans « Valider » (règle 1).
 */
export async function genererArticle(fd: FormData) {
  const entite = String(fd.get('entite')) as 'veolt' | 'magistria';
  const mode = String(fd.get('mode') ?? 'plan');
  const retour = `/${entite}/calendrier`;
  const { sujet, articlesDe, articlePourSujet, ARTICLES } = await import('@/lib/sujets');
  const { fabriquer } = await import('@/lib/gabarits');
  const { marque } = await import('@/lib/marques');
  const { publication, prochainCreneauBlog } = await import('@/lib/requetes');
  const { SEQUENCE_LANCEMENT } = await import('@/lib/calendrier');
  if (entite !== 'veolt' && entite !== 'magistria') redirect('/');
  const d = db();

  // Le calendrier guide l'article : un post qu'il développe (même semaine,
  // le lendemain), sinon le prochain créneau « blog » libre.
  const idSource = Number(fd.get('source_post') ?? 0);
  const source = idSource ? publication(idSource) : undefined;
  if (source && source.entite !== entite) redirect(retour);
  let date = String(fd.get('date_prevue') ?? '');
  if (!date && source) {
    const lendemain = new Date(`${source.date_prevue}T12:00:00Z`);
    lendemain.setUTCDate(lendemain.getUTCDate() + 1);
    date = lendemain.toISOString().slice(0, 10);
  }
  if (!date) date = prochainCreneauBlog(entite).date;

  let s: import('@/lib/sujets').Sujet | undefined;
  let sujetRef: string | null = null;
  if (mode === 'ia') {
    const requete = (String(fd.get('requete') ?? '').trim() || source?.titre || '').slice(0, 200);
    if (!requete) redirect(avecParam(retour, 'erreurArticle', 'Indique la requête, ou choisis un post du calendrier à développer.'));
    // La semaine où l'article paraît : sa phase et ses autres posts, pour qu'il les complète.
    const j = new Date(`${date}T12:00:00Z`);
    const lu = new Date(j);
    lu.setUTCDate(j.getUTCDate() - ((j.getUTCDay() + 6) % 7));
    const di = new Date(lu);
    di.setUTCDate(lu.getUTCDate() + 6);
    const voisins = d
      .prepare(
        "SELECT titre, semaine FROM publications WHERE entite=? AND date_prevue BETWEEN ? AND ? AND format_slug<>'blog-article' AND titre IS NOT NULL",
      )
      .all(entite, lu.toISOString().slice(0, 10), di.toISOString().slice(0, 10)) as Array<{ titre: string; semaine: number | null }>;
    const numero = voisins.find((v) => v.semaine != null)?.semaine ?? null;
    const phase = numero ? SEQUENCE_LANCEMENT.find((x) => x.semaine === numero) : undefined;
    const contexte = {
      ...(source
        ? { post: { titre: source.titre ?? '', format: source.format_slug, accroche: source.accroche, corps: source.corps, appel: source.appel } }
        : {}),
      ...(numero
        ? { semaine: { numero, phase: phase?.nom, intention: phase?.intention, autres: [...new Set(voisins.map((v) => v.titre))].slice(0, 8) } }
        : {}),
    };
    const nomGrappe = String(fd.get('grappe') ?? '');
    const freres = ARTICLES[entite].filter((a) => a.grappe === nomGrappe).map((a) => a.titre);
    const { redigerArticle, messageErreurIA } = await import('@/lib/ia');
    try {
      const a = await redigerArticle(
        entite,
        requete,
        nomGrappe ? { nom: nomGrappe, articles: freres } : null,
        String(fd.get('consigne') ?? '').slice(0, 600),
        contexte,
      );
      s = {
        ref: `ia-${Date.now()}`,
        titre: a.titre,
        pilier: a.pilier,
        persona: a.persona,
        accroche: a.accroche,
        corps: [a.complement, a.pourquoi, ...a.sections.map((x) => x.texte)],
        questions: a.sections.map((x) => x.question),
        aRetenir: a.aRetenir,
        preuve: a.preuve,
        enseignement: a.enseignement,
        appel: a.appel,
        indicateur: 'part des requêtes de la grappe en top 10, et citations par les IA (relevé manuel)',
        source: `Article rédigé par l’IA le ${new Date().toISOString().slice(0, 10)} sur la requête « ${requete} »${source ? `, à partir du post ${source.id} du calendrier` : ''} — à relire en entier avant validation. Sources déclarées : ${a.sources || 'aucune'}`,
        grappe: nomGrappe || undefined,
        requete,
      };
    } catch (e) {
      console.error('[ia article]', e);
      redirect(avecParam(retour, 'erreurArticle', messageErreurIA(e).slice(0, 200)));
    }
  } else {
    let ref = String(fd.get('sujet_ref') ?? '');
    // Depuis un post : l'article du plan qui reprend son sujet.
    if (!ref && source?.sujet_ref) ref = articlePourSujet(source.sujet_ref, entite)?.ref ?? '';
    if (!ref) {
      redirect(avecParam(retour, 'erreurArticle', 'Aucun article du plan ne développe ce post : choisis « Rédiger avec l’IA ».'));
    }
    // Un article déjà prévu n'est pas dupliqué : on l'ouvre.
    const existant = d
      .prepare("SELECT id FROM publications WHERE entite=? AND sujet_ref=? AND format_slug='blog-article' ORDER BY date_prevue LIMIT 1")
      .get(entite, ref) as { id: number } | undefined;
    if (existant) redirect(`${retour}?apercu=${existant.id}&deja=1`);
    s = articlesDe(entite).find((a) => a.ref === ref) ?? sujet(ref);
    if (!s || !ref.startsWith(entite === 'veolt' ? 'v-' : 'm-')) redirect(avecParam(retour, 'erreurArticle', 'Article introuvable dans le plan.'));
    sujetRef = s.ref;
  }
  if (!s) redirect(retour);

  const b = fabriquer(s, 'blog-article', entite);
  // La semaine du calendrier, si la date tombe dans l'une d'elles.
  const jour = new Date(`${date}T12:00:00Z`);
  const lundi = new Date(jour);
  lundi.setUTCDate(jour.getUTCDate() - ((jour.getUTCDay() + 6) % 7));
  const dimanche = new Date(lundi);
  dimanche.setUTCDate(lundi.getUTCDate() + 6);
  const sem = d
    .prepare('SELECT semaine FROM publications WHERE entite=? AND semaine IS NOT NULL AND date_prevue BETWEEN ? AND ? LIMIT 1')
    .get(entite, lundi.toISOString().slice(0, 10), dimanche.toISOString().slice(0, 10)) as { semaine: number } | undefined;

  let id: number;
  try {
    const info = d
      .prepare(
        `INSERT INTO publications (entite, format_slug, pilier, persona, sujet_ref, date_prevue, semaine, phase, raison,
          statut, titre, accroche, corps, appel, hashtags, consignes_visuel, preuve, indicateur)
         VALUES (?, 'blog-article', ?, ?, ?, ?, ?, NULL, ?, 'brouillon', ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        entite,
        s.pilier,
        s.persona,
        sujetRef,
        date,
        sem?.semaine ?? null,
        mode === 'ia' ? `Article généré à la demande par l’IA (${marque(entite).nom}).` : 'Article du plan de référencement, posé à la demande.',
        b.titre ?? s.titre,
        b.accroche,
        b.corps,
        b.appel,
        b.hashtags,
        b.consignesVisuel.join('\n'),
        s.preuve,
        s.indicateur,
      );
    id = Number(info.lastInsertRowid);
  } catch (e) {
    if (/UNIQUE/i.test((e as Error).message)) {
      redirect(avecParam(retour, 'erreurArticle', 'Un article du même pilier existe déjà ce jour-là : choisis une autre date.'));
    }
    throw e;
  }
  tracer(mode === 'ia' ? 'article généré par l’IA' : 'article du plan posé', `publication ${id} (${date}) : « ${s.titre} »`, entite);
  await sauvegarder();
  revalidatePath(`/${entite}/calendrier`);
  revalidatePath(`/${entite}/publications`);
  revalidatePath(`/${entite}/valider`);
  redirect(`${retour}?apercu=${id}&cree=1`);
}

/** Le rang suivant dans un post fourni : les fichiers s'ajoutent à la suite. */
function prochainRangLivrable(publicationId: number): number {
  const r = db().prepare("SELECT MAX(ordre) m FROM medias WHERE publication_id=? AND origine='livrable'").get(publicationId) as { m: number | null };
  return (r.m ?? 0) + 1;
}

/**
 * « Importer un post fait ailleurs » : crée le post (format, date, texte,
 * persona, preuve) ; les fichiers suivent, téléversés sur lui par le
 * navigateur. Le texte collé est découpé comme un post de la machine : premier
 * paragraphe en accroche, dernier en appel s'il pose une question, hashtags
 * finaux à part. Le post entre en **brouillon** et passe les garde-fous comme
 * les autres — rien ne part sans « Valider ».
 */
export async function creerPostImporte(fd: FormData): Promise<{ ok: true; id: number } | { ok: false; raison: string }> {
  const entite = String(fd.get('entite'));
  const { marque, estEntite } = await import('@/lib/marques');
  const { format, TOUS_FORMATS } = await import('@/lib/formats');
  const { semaineDuCalendrier } = await import('@/lib/requetes');
  if (!estEntite(entite)) return { ok: false, raison: 'Entité inconnue.' };
  const m = marque(entite);
  const formatSlug = String(fd.get('format_slug') ?? '');
  if (!TOUS_FORMATS.some((f) => f.slug === formatSlug) || m.reseaux[format(formatSlug as never).reseau] === 'exclu') {
    return { ok: false, raison: 'Format inconnu ou exclu pour cette marque.' };
  }
  const date = String(fd.get('date_prevue') ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, raison: 'Date manquante.' };
  const pilier = m.piliers.some((x) => x.slug === fd.get('pilier')) ? String(fd.get('pilier')) : m.piliers[0].slug;
  const persona = m.personas.some((x) => x.slug === fd.get('persona')) ? String(fd.get('persona')) : null;
  const titre = String(fd.get('titre') ?? '').trim().slice(0, 200) || 'Post importé';
  const preuve = String(fd.get('preuve') ?? '').trim() || null;

  // Le texte collé, découpé comme un post de la machine.
  const brut = String(fd.get('texte') ?? '').replace(/\r\n/g, '\n').trim();
  const blocs = brut.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
  let hashtags = '';
  if (blocs.length && /^(#[\p{L}\p{N}_]+\s*)+$/u.test(blocs[blocs.length - 1])) hashtags = blocs.pop()!;
  const accroche = blocs.shift() ?? '';
  const appel = blocs.length > 1 && blocs[blocs.length - 1].includes('?') ? blocs.pop()! : '';
  const corps = blocs.join('\n\n');

  try {
    const info = db()
      .prepare(
        `INSERT INTO publications (entite, format_slug, pilier, persona, sujet_ref, date_prevue, semaine, phase, raison,
          statut, titre, accroche, corps, appel, hashtags, consignes_visuel, preuve, indicateur)
         VALUES (?,?,?,?,NULL,?,?,NULL,?, 'brouillon', ?,?,?,?,?,?,?,?)`,
      )
      .run(
        entite,
        formatSlug,
        pilier,
        persona,
        date,
        semaineDuCalendrier(entite, date),
        `Post fait hors de la machine, importé le ${new Date().toISOString().slice(0, 10)}.`,
        titre,
        accroche,
        corps,
        appel,
        hashtags,
        'POST FOURNI — les fichiers joints sont le post ; le visuel généré par l’outil ne sert que de repli.',
        preuve,
        format(formatSlug as never).indicateurCle,
      );
    const id = Number(info.lastInsertRowid);
    tracer('post importé', `publication ${id} (${date}) : « ${titre} » · ${formatSlug}`, entite);
    await sauvegarder();
    revalidatePath(`/${entite}/calendrier`);
    revalidatePath(`/${entite}/publications`);
    revalidatePath(`/${entite}/valider`);
    return { ok: true, id };
  } catch (e) {
    if (/UNIQUE/i.test((e as Error).message)) {
      return { ok: false, raison: 'Un post de ce format et de ce pilier existe déjà ce jour-là : changer la date ou le pilier.' };
    }
    throw e;
  }
}

/**
 * Le dépôt d'un post fourni quand le store Blob n'existe pas (développement
 * local) : les fichiers passent par l'action. En production, le navigateur les
 * envoie directement au store, puis `enregistrerTeleversement` les inscrit.
 */
export async function deposerLivrables(fd: FormData): Promise<{ posees: number; refus: string[] }> {
  const entite = String(fd.get('entite'));
  const publicationId = Number(fd.get('publication_id'));
  const { publication } = await import('@/lib/requetes');
  const p = publication(publicationId);
  if (!p || p.entite !== entite) return { posees: 0, refus: ['Post introuvable.'] };
  const { TYPES_LIVRABLE, nouvelleCle, ecrire, dimensions, dimensionsVideo, estVideo, estDocument, poids, plafondDepotVideo } = await import('@/lib/medias');
  const refus: string[] = [];
  let posees = 0;
  for (const f of fd.getAll('fichiers').filter((x): x is File => x instanceof File && x.size > 0)) {
    if (!(f.type in TYPES_LIVRABLE)) {
      refus.push(`${f.name} — ${f.type || 'type inconnu'} : image, vidéo ou PDF seulement`);
      continue;
    }
    if (f.size > plafondDepotVideo()) {
      refus.push(`${f.name} — ${poids(f.size)}, au-delà de ce que ce chemin de dépôt accepte`);
      continue;
    }
    const octets = Buffer.from(await f.arrayBuffer());
    const d = estDocument(f.type) ? null : estVideo(f.type) ? dimensionsVideo(octets) : dimensions(octets, f.type);
    const cle = nouvelleCle(f.type);
    await ecrire(cle, octets, f.type);
    db()
      .prepare(
        `INSERT INTO medias (entite, cle, nom, type_mime, octets, largeur, hauteur, duree_s, publication_id, origine, ordre)
         VALUES (?,?,?,?,?,?,?,?,?, 'livrable', ?)`,
      )
      .run(
        entite,
        cle,
        f.name,
        f.type,
        octets.byteLength,
        d?.largeur ?? null,
        d?.hauteur ?? null,
        (d && 'duree' in d ? d.duree : null) ?? null,
        publicationId,
        prochainRangLivrable(publicationId),
      );
    posees++;
  }
  if (posees) tracer('post fourni téléversé', `publication ${publicationId} : ${posees} fichier(s)`, entite);
  await sauvegarder();
  revalidatePath(`/${entite}/calendrier`);
  revalidatePath(`/${entite}/visuels`);
  revalidatePath(`/${entite}/publications/${publicationId}`);
  return { posees, refus };
}

/** Change l'ordre d'un fichier dans un post fourni (une page de carrousel monte ou descend). */
export async function deplacerLivrable(fd: FormData) {
  const entite = String(fd.get('entite'));
  const id = Number(fd.get('id'));
  const sens = fd.get('sens') === 'haut' ? -1 : 1;
  const retour = String(fd.get('retour') ?? '') || `/${entite}/calendrier`;
  const { livrablesDe } = await import('@/lib/requetes');
  const m = db().prepare("SELECT publication_id FROM medias WHERE id=? AND entite=? AND origine='livrable'").get(id, entite) as
    | { publication_id: number }
    | undefined;
  if (m) {
    const liste = livrablesDe(m.publication_id);
    const i = liste.findIndex((x) => x.id === id);
    const j = i + sens;
    if (i >= 0 && j >= 0 && j < liste.length) {
      [liste[i], liste[j]] = [liste[j], liste[i]];
      const maj = db().prepare('UPDATE medias SET ordre=? WHERE id=?');
      db().transaction(() => liste.forEach((x, k) => maj.run(k + 1, x.id)))();
      await sauvegarder();
    }
  }
  revalidatePath(`/${entite}/calendrier`);
  redirect(retour);
}

/** Demande une réécriture à l'IA. Le post n'est pas touché : la proposition attend une décision. */
export async function demanderIA(fd: FormData) {
  const id = Number(fd.get('id'));
  const entite = String(fd.get('entite'));
  const consigne = String(fd.get('consigne') ?? '').slice(0, 600);
  const retour = retourSur(fd, entite, id);
  const { publication } = await import('@/lib/requetes');
  const { constatsDe } = await import('@/lib/fiche');
  const { proposerReecriture, messageErreurIA } = await import('@/lib/ia');
  const p = publication(id);
  if (!p || p.entite !== entite || p.statut === 'publie') redirect(retour);

  let erreur: string | null = null;
  try {
    const r = await proposerReecriture(p, constatsDe(p).constats, consigne);
    const d = db();
    d.prepare("UPDATE propositions_ia SET statut='remplacee' WHERE publication_id=? AND statut='en-attente'").run(id);
    d.prepare(
      'INSERT INTO propositions_ia (publication_id, accroche, corps, appel, hashtags, note, consigne) VALUES (?,?,?,?,?,?,?)',
    ).run(id, r.accroche, r.corps, r.appel, r.hashtags, r.note, consigne || null);
    tracer('réécriture IA proposée', `publication ${id}`, entite);
    await sauvegarder();
  } catch (e) {
    erreur = messageErreurIA(e);
    console.error('[ia]', e);
  }
  revalidatePath(`/${entite}/publications/${id}`);
  revalidatePath(`/${entite}/valider`);
  redirect(erreur ? avecParam(retour, 'erreurIA', `${id}|${erreur.slice(0, 200)}`) : retour);
}

/**
 * Adopter : le texte proposé remplace le brouillon, et le post repasse
 * « à relire » même s'il était validé — un texte changé est un texte à relire.
 */
export async function adopterIA(fd: FormData) {
  const pid = Number(fd.get('proposition'));
  const entite = String(fd.get('entite'));
  const d = db();
  const prop = d.prepare("SELECT * FROM propositions_ia WHERE id=? AND statut='en-attente'").get(pid) as
    | { publication_id: number; accroche: string; corps: string; appel: string; hashtags: string }
    | undefined;
  if (!prop) redirect(`/${entite}/valider`);
  const p = d.prepare('SELECT entite, statut, accroche, corps, appel, hashtags FROM publications WHERE id=?').get(prop.publication_id) as
    | { entite: string; statut: string; accroche: string; corps: string; appel: string; hashtags: string }
    | undefined;
  const retour = retourSur(fd, entite, prop.publication_id);
  if (!p || p.entite !== entite || p.statut === 'publie') redirect(retour);

  d.transaction(() => {
    // L'ancienne version reste lisible dans le journal : adopter n'efface rien.
    tracer('version remplacée par l’IA', JSON.stringify({ id: prop.publication_id, accroche: p.accroche, corps: p.corps, appel: p.appel, hashtags: p.hashtags }), entite);
    d.prepare(
      "UPDATE publications SET accroche=?, corps=?, appel=?, hashtags=?, statut='a-relire', maj_le=datetime('now') WHERE id=?",
    ).run(prop.accroche, prop.corps, prop.appel, prop.hashtags, prop.publication_id);
    d.prepare("UPDATE propositions_ia SET statut='adoptee' WHERE id=?").run(pid);
  })();
  await sauvegarder();
  revalidatePath(`/${entite}/publications/${prop.publication_id}`);
  revalidatePath(`/${entite}/valider`);
  revalidatePath(`/${entite}`);
  redirect(retour);
}

export async function rejeterIA(fd: FormData) {
  const pid = Number(fd.get('proposition'));
  const entite = String(fd.get('entite'));
  const d = db();
  const prop = d.prepare('SELECT publication_id FROM propositions_ia WHERE id=?').get(pid) as { publication_id: number } | undefined;
  if (!prop) redirect(`/${entite}/valider`);
  d.prepare("UPDATE propositions_ia SET statut='rejetee' WHERE id=? AND statut='en-attente'").run(pid);
  tracer('réécriture IA rejetée', `publication ${prop.publication_id}`, entite);
  await sauvegarder();
  revalidatePath(`/${entite}/publications/${prop.publication_id}`);
  revalidatePath(`/${entite}/valider`);
  redirect(retourSur(fd, entite, prop.publication_id));
}

export async function marquerPublie(fd: FormData) {
  const id = Number(fd.get('id'));
  const entite = String(fd.get('entite'));
  const url = String(fd.get('url_publiee') ?? '') || null;
  db()
    .prepare("UPDATE publications SET statut='publie', url_publiee=?, publie_le=date('now'), maj_le=datetime('now') WHERE id=?")
    .run(url, id);
  tracer('publication marquée publiée', `publication ${id}`, entite);
  // Une mutation non poussée vers le Blob est une mutation perdue
  // au prochain démarrage d'instance. Elle ne coûte rien en local.
  await sauvegarder();
  revalidatePath(`/${entite}/publications/${id}`);
  revalidatePath(`/${entite}`);
}

/** Le bouton qui appelle l'API. Il n'est proposé que sur une publication validée. */
export async function publierParApi(fd: FormData) {
  const id = Number(fd.get('id'));
  const entite = String(fd.get('entite'));
  const row = db().prepare('SELECT * FROM publications WHERE id=?').get(id) as Record<string, string> | undefined;
  if (!row) return;
  if (row.statut !== 'valide') {
    tracer('publication API refusée', `publication ${id} — statut ${row.statut}, validation requise`, entite);
    // Une mutation non poussée vers le Blob est une mutation perdue
    // au prochain démarrage d'instance. Elle ne coûte rien en local.
    await sauvegarder();
    revalidatePath(`/${entite}/publications/${id}`);
    return;
  }
  const f = format(row.format_slug);
  if (f.reseau === 'blog') return;

  // Le média : choisi par son identifiant, jamais par une adresse saisie. Deux
  // raisons — l'outil doit pouvoir le contrôler contre le format avant de
  // l'envoyer, et l'adresse publique est **signée et datée**, donc produite
  // ici et nulle part ailleurs.
  let mediaUrl: string | undefined;
  const mediaId = Number(fd.get('media_id') ?? 0);
  if (mediaId) {
    const media = db()
      .prepare('SELECT * FROM medias WHERE id=? AND entite=?')
      .get(mediaId, entite) as
      | { id: number; cle: string; nom: string; type_mime: string; largeur: number | null; hauteur: number | null; duree_s: number | null; octets: number }
      | undefined;
    if (!media) {
      tracer('publication API refusée', `publication ${id} — média ${mediaId} introuvable`, entite);
      revalidatePath(`/${entite}/publications/${id}`);
      return;
    }
    const { controlerMedia } = await import('@/lib/conformite-media');
    const constats = controlerMedia(row.format_slug, media);
    const bloquants = constats.filter((k) => k.niveau === 'blocage');
    if (bloquants.length > 0) {
      // Le même principe que pour le texte : l'outil propose, mais il ne laisse
      // pas partir ce qu'il sait non conforme.
      tracer('publication API refusée', `publication ${id} — média : ${bloquants.map((k) => k.message).join(' ; ')}`, entite);
      await sauvegarder();
      revalidatePath(`/${entite}/publications/${id}`);
      return;
    }
    const { lienPublic } = await import('@/lib/medias');
    const lien = await lienPublic(media.cle, await adresseDeBase(), entite, media.id);
    mediaUrl = lien.url;
    tracer('lien de média signé', `${media.nom} — valable jusqu’à ${lien.expire.toISOString()} (${lien.porte})`, entite);
  }

  const texte = [row.accroche, row.corps, row.appel, row.hashtags].filter(Boolean).join('\n\n');
  const res = await publier(f.reseau as ReseauConnectable, {
    texte,
    titre: row.titre ?? undefined,
    sousForum: row.sous_forum ?? undefined,
    mediaUrl,
  });
  if (res.ok) {
    db()
      .prepare("UPDATE publications SET statut='publie', url_publiee=?, publie_le=date('now'), maj_le=datetime('now') WHERE id=?")
      .run(res.url ?? null, id);
    tracer('publié par API', `publication ${id} → ${res.reseau} ${res.id}${res.avertissement ? ` · ${res.avertissement}` : ''}`, entite);
  } else {
    tracer('échec API', `publication ${id} → ${res.reseau} : ${res.raison}`, entite);
  }
  revalidatePath(`/${entite}/publications/${id}`);
}

export async function releverMetrique(fd: FormData) {
  const id = Number(fd.get('publication_id'));
  const entite = String(fd.get('entite'));
  const n = (k: string) => {
    const v = String(fd.get(k) ?? '').trim();
    return v === '' ? null : Number(v);
  };
  db()
    .prepare('INSERT INTO metriques (publication_id, impressions, interactions, clics, duree_s, note) VALUES (?,?,?,?,?,?)')
    .run(id, n('impressions'), n('interactions'), n('clics'), n('duree_s'), String(fd.get('note') ?? '') || null);
  tracer('relevé saisi', `publication ${id}`, entite);
  // Une mutation non poussée vers le Blob est une mutation perdue
  // au prochain démarrage d'instance. Elle ne coûte rien en local.
  await sauvegarder();
  revalidatePath(`/${entite}/publications/${id}`);
  revalidatePath(`/${entite}/indicateurs`);
}

export async function majArticle(fd: FormData) {
  const id = Number(fd.get('id'));
  const entite = String(fd.get('entite'));
  db()
    .prepare("UPDATE articles SET statut=?, url=?, mots=?, top10=?, cite_par_ia=?, maj_le=date('now') WHERE id=?")
    .run(
      String(fd.get('statut') ?? 'a-ecrire'),
      String(fd.get('url') ?? '') || null,
      String(fd.get('mots') ?? '') ? Number(fd.get('mots')) : null,
      fd.get('top10') ? 1 : 0,
      fd.get('cite_par_ia') ? 1 : 0,
      id,
    );
  // Une mutation non poussée vers le Blob est une mutation perdue
  // au prochain démarrage d'instance. Elle ne coûte rien en local.
  await sauvegarder();
  revalidatePath(`/${entite}/seo`);
}

export async function majBacklink(fd: FormData) {
  const id = Number(fd.get('id'));
  const entite = String(fd.get('entite'));
  db()
    .prepare('UPDATE backlinks SET statut=?, contact=?, url=? WHERE id=?')
    .run(String(fd.get('statut') ?? 'a-contacter'), String(fd.get('contact') ?? '') || null, String(fd.get('url') ?? '') || null, id);
  // Une mutation non poussée vers le Blob est une mutation perdue
  // au prochain démarrage d'instance. Elle ne coûte rien en local.
  await sauvegarder();
  revalidatePath(`/${entite}/seo`);
}

export async function majCampagne(fd: FormData) {
  const id = Number(fd.get('id'));
  const entite = String(fd.get('entite'));
  db()
    .prepare('UPDATE campagnes SET statut=?, budget=?, debut=?, fin=? WHERE id=?')
    .run(
      String(fd.get('statut') ?? 'projet'),
      String(fd.get('budget') ?? '') ? Number(fd.get('budget')) : null,
      String(fd.get('debut') ?? '') || null,
      String(fd.get('fin') ?? '') || null,
      id,
    );
  // Une mutation non poussée vers le Blob est une mutation perdue
  // au prochain démarrage d'instance. Elle ne coûte rien en local.
  await sauvegarder();
  revalidatePath(`/${entite}/campagnes`);
}

export async function releverCampagne(fd: FormData) {
  const id = Number(fd.get('campagne_id'));
  const entite = String(fd.get('entite'));
  const n = (k: string) => (String(fd.get(k) ?? '').trim() === '' ? null : Number(fd.get(k)));
  db()
    .prepare('INSERT INTO campagne_releves (campagne_id, depense, impressions, clics, conversations) VALUES (?,?,?,?,?)')
    .run(id, n('depense'), n('impressions'), n('clics'), n('conversations'));
  // Une mutation non poussée vers le Blob est une mutation perdue
  // au prochain démarrage d'instance. Elle ne coûte rien en local.
  await sauvegarder();
  revalidatePath(`/${entite}/campagnes`);
}

export async function majConnexion(fd: FormData) {
  const entite = String(fd.get('entite'));
  const reseau = String(fd.get('reseau'));
  db()
    .prepare("UPDATE connexions SET barreau=?, note=?, maj_le=datetime('now') WHERE entite=? AND reseau=?")
    .run(Number(fd.get('barreau')), String(fd.get('note') ?? '') || null, entite, reseau);
  tracer('connexion mise à jour', `${reseau} → barreau ${fd.get('barreau')}`, entite);
  // Une mutation non poussée vers le Blob est une mutation perdue
  // au prochain démarrage d'instance. Elle ne coûte rien en local.
  await sauvegarder();
  revalidatePath(`/${entite}/comptes`);
}

export async function majSousForum(fd: FormData) {
  const id = Number(fd.get('id'));
  const entite = String(fd.get('entite'));
  db().prepare('UPDATE sous_forums SET dernier_post=? WHERE id=?').run(String(fd.get('dernier_post') ?? '') || null, id);
  // Une mutation non poussée vers le Blob est une mutation perdue
  // au prochain démarrage d'instance. Elle ne coûte rien en local.
  await sauvegarder();
  revalidatePath(`/${entite}/comptes`);
}

/**
 * Création ponctuelle, hors calendrier.
 *
 * Nécessaire parce que tout ne se planifie pas : Reddit est volontairement hors
 * calendrier (sa cadence dépend du plafond du sous-forum, pas de notre rythme),
 * et une actualité — un arrêt qui tombe, un rendu qu'on veut montrer — ne se
 * programme pas douze semaines à l'avance.
 */
export async function creerPublication(fd: FormData) {
  const entite = String(fd.get('entite'));
  const formatSlug = String(fd.get('format_slug'));
  const date = String(fd.get('date_prevue'));
  const ref = String(fd.get('sujet_ref') ?? '');

  const { sujet, sujetsDe } = await import('@/lib/sujets');
  const { fabriquer } = await import('@/lib/gabarits');
  const s = ref ? sujet(ref) : undefined;
  const pilier = String(fd.get('pilier') ?? '') || s?.pilier || sujetsDe(entite as 'veolt' | 'magistria')[0].pilier;

  let titre = String(fd.get('titre') ?? '') || 'Sans titre';
  let b = { accroche: '', corps: '', appel: '', hashtags: '', consignesVisuel: [] as string[] };
  if (s) {
    const f = fabriquer(s, formatSlug as Parameters<typeof fabriquer>[1], entite as 'veolt' | 'magistria');
    b = { accroche: f.accroche, corps: f.corps, appel: f.appel, hashtags: f.hashtags, consignesVisuel: f.consignesVisuel };
    if (!String(fd.get('titre') ?? '')) titre = f.titre ?? s.titre;
  }

  const info = db()
    .prepare(
      `INSERT INTO publications (entite, format_slug, pilier, persona, sujet_ref, date_prevue, semaine, phase, raison,
        statut, titre, accroche, corps, appel, hashtags, consignes_visuel, preuve, indicateur)
       VALUES (?,?,?,?,?,?,NULL,NULL,?, 'brouillon', ?,?,?,?,?,?,?,?)`,
    )
    .run(
      entite,
      formatSlug,
      pilier,
      s?.persona ?? null,
      ref || null,
      date,
      String(fd.get('raison') ?? 'Créée hors calendrier.'),
      titre,
      b.accroche,
      b.corps,
      b.appel,
      b.hashtags,
      b.consignesVisuel.join('\n'),
      s?.preuve ?? null,
      s?.indicateur ?? null,
    );
  tracer('publication créée hors calendrier', `${formatSlug} le ${date}`, entite);
  // Une mutation non poussée vers le Blob est une mutation perdue
  // au prochain démarrage d'instance. Elle ne coûte rien en local.
  await sauvegarder();
  redirect(`/${entite}/publications/${info.lastInsertRowid}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Calendrier — recaler les 12 semaines
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Recale le calendrier des **deux** entités sur un nouveau premier lundi.
 *
 * Ne re-sème rien : seules les dates bougent, pour garder chaque brouillon
 * déjà retouché. Les semaines gardent leur numéro, donc leur phase de
 * lancement. Une publication déjà partie garde sa date — elle a eu lieu — et
 * les publications créées hors calendrier (sans semaine) ne bougent pas.
 *
 * Mise à jour en deux temps : décaler ligne à ligne sous la contrainte
 * `UNIQUE (entite, date_prevue, format_slug, pilier)` peut heurter
 * provisoirement une ligne pas encore déplacée.
 */
export async function recalerCalendrier(fd: FormData) {
  const entite = String(fd.get('entite'));
  const depart = String(fd.get('depart') ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(depart)) redirect(`/${entite}/calendrier?recale=erreur`);
  const pause = {
    apres: Math.max(0, Math.min(12, Number(fd.get('pause_apres') ?? 0) || 0)),
    semaines: Math.max(0, Math.min(4, Number(fd.get('pause_semaines') ?? 0) || 0)),
  };
  const { dateRecalee } = await import('@/lib/calendrier');
  const premierLundi = new Date(`${depart}T12:00:00`);

  const d = db();
  const lignes = d
    .prepare("SELECT id, date_prevue, semaine FROM publications WHERE semaine IS NOT NULL AND statut != 'publie'")
    .all() as Array<{ id: number; date_prevue: string; semaine: number }>;
  const temp = d.prepare("UPDATE publications SET date_prevue = '~' || id WHERE id = ?");
  const finale = d.prepare("UPDATE publications SET date_prevue = ?, maj_le = datetime('now') WHERE id = ?");
  d.transaction(() => {
    const cibles = lignes.map((l) => [l.id, dateRecalee(l.date_prevue, l.semaine, premierLundi, pause)] as const);
    for (const [id] of cibles) temp.run(id);
    for (const [id, date] of cibles) finale.run(date, id);
  })();

  const detail = `premier lundi ${depart}${pause.semaines ? `, pause de ${pause.semaines} sem. après S${pause.apres}` : ''} — ${lignes.length} publications`;
  tracer('calendrier recalé', detail);
  await sauvegarder();
  for (const e of ['veolt', 'magistria']) {
    revalidatePath(`/${e}`);
    revalidatePath(`/${e}/calendrier`);
    revalidatePath(`/${e}/publications`);
    revalidatePath(`/${e}/valider`);
  }
  redirect(`/${entite}/calendrier?recale=1`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Médiathèque — les images apportées
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Dépôt d'images, à côté de celles que l'outil génère.
 *
 * Tout ce qui est refusé est **dit**, fichier par fichier, et les autres
 * passent quand même : un envoi de six images dont une en PDF ne doit pas
 * échouer six fois. Le compte-rendu repart dans l'adresse plutôt que dans un
 * état de formulaire, parce que la page est servie côté serveur et que ça
 * survit au rechargement.
 */
export async function importerMedia(fd: FormData) {
  const entite = String(fd.get('entite'));
  const legende = String(fd.get('legende') ?? '').trim() || null;
  const rattache = String(fd.get('publication_id') ?? '').trim();
  const publicationId = rattache ? Number(rattache) : null;

  const { TYPES_ACCEPTES, TAILLE_MAX_ACTION, nouvelleCle, ecrire, dimensions, dimensionsVideo, estVideo, poids } =
    await import('@/lib/medias');

  const fichiers = fd.getAll('fichiers').filter((f): f is File => f instanceof File && f.size > 0);
  const refus: string[] = [];
  let posees = 0;
  let cumul = 0;

  for (const f of fichiers) {
    if (!(f.type in TYPES_ACCEPTES)) {
      refus.push(`${f.name} — ${f.type || 'type inconnu'} n’est pas une image acceptée par les réseaux`);
      continue;
    }
    if (f.size > TAILLE_MAX_ACTION) {
      refus.push(`${f.name} — ${poids(f.size)}, au-delà de la limite de ${poids(TAILLE_MAX_ACTION)} de ce chemin de dépôt`);
      continue;
    }
    // Le plafond cumulé n'est pas du zèle : une fonction Vercel rejette le
    // corps de requête entier au-delà de ~4,5 Mo, sans message exploitable.
    if (cumul + f.size > TAILLE_MAX_ACTION) {
      refus.push(`${f.name} — l’envoi dépasse ${poids(TAILLE_MAX_ACTION)} au total, à déposer en deux fois`);
      continue;
    }

    const octets = Buffer.from(await f.arrayBuffer());
    const d = estVideo(f.type) ? dimensionsVideo(octets) : dimensions(octets, f.type);
    const cle = nouvelleCle(f.type);
    await ecrire(cle, octets, f.type);
    db()
      .prepare(
        `INSERT INTO medias (entite, cle, nom, type_mime, octets, largeur, hauteur, duree_s, legende, publication_id)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(
        entite,
        cle,
        f.name,
        f.type,
        octets.byteLength,
        d?.largeur ?? null,
        d?.hauteur ?? null,
        (d && 'duree' in d ? d.duree : null) ?? null,
        legende,
        publicationId,
      );
    cumul += f.size;
    posees++;
  }

  if (posees > 0) {
    tracer('images déposées', `${posees} fichier(s)${publicationId ? ` · publication ${publicationId}` : ''}`, entite);
    // Une mutation non poussée vers le Blob est une mutation perdue
    // au prochain démarrage d'instance. Elle ne coûte rien en local.
    await sauvegarder();
  }
  if (refus.length > 0) tracer('images refusées', refus.join(' ; '), entite);

  revalidatePath(`/${entite}/visuels`);
  if (publicationId) revalidatePath(`/${entite}/publications/${publicationId}`);
  const q = new URLSearchParams();
  if (posees) q.set('posees', String(posees));
  if (refus.length) q.set('refus', refus.join(' | '));
  redirect(`/${entite}/visuels${q.size ? `?${q}` : ''}#images`);
}

export async function majMedia(fd: FormData) {
  const id = Number(fd.get('id'));
  const entite = String(fd.get('entite'));
  const rattache = String(fd.get('publication_id') ?? '').trim();
  const d = db();
  const avant = d.prepare('SELECT origine, type_mime FROM medias WHERE id=? AND entite=?').get(id, entite) as
    | { origine: string; type_mime: string }
    | undefined;
  d.prepare('UPDATE medias SET legende=?, publication_id=? WHERE id=? AND entite=?').run(
    String(fd.get('legende') ?? '').trim() || null,
    rattache ? Number(rattache) : null,
    id,
    entite,
  );
  // « Photo de fond » : une image apportée devient le fond du visuel de son
  // post. Une seule par post — l'ancienne redevient une image ordinaire, elle
  // reste dans la médiathèque et peut être recochée.
  if (avant && avant.type_mime.startsWith('image/') && (avant.origine === 'apporte' || avant.origine === 'photo')) {
    const fond = fd.get('fond') === 'on' && !!rattache;
    if (fond) {
      d.prepare("UPDATE medias SET origine='apporte' WHERE publication_id=? AND origine='photo' AND id<>?").run(Number(rattache), id);
      d.prepare("UPDATE medias SET origine='photo' WHERE id=?").run(id);
    } else if (avant.origine === 'photo') {
      d.prepare("UPDATE medias SET origine='apporte' WHERE id=?").run(id);
    }
    if (fond !== (avant.origine === 'photo')) tracer(fond ? 'photo de fond posée' : 'photo de fond retirée', `média ${id}`, entite);
  }
  // Une mutation non poussée vers le Blob est une mutation perdue
  // au prochain démarrage d'instance. Elle ne coûte rien en local.
  await sauvegarder();
  revalidatePath(`/${entite}/visuels`);
  revalidatePath(`/${entite}/calendrier`);
  revalidatePath(`/${entite}/valider`);
  if (rattache) revalidatePath(`/${entite}/publications/${rattache}`);
}

/** Le fichier part avec la fiche : une ligne qui désigne un objet absent ne sert personne. */
export async function supprimerMedia(fd: FormData) {
  const id = Number(fd.get('id'));
  const entite = String(fd.get('entite'));
  const row = db().prepare('SELECT cle, nom, publication_id FROM medias WHERE id=? AND entite=?').get(id, entite) as
    | { cle: string; nom: string; publication_id: number | null }
    | undefined;
  if (!row) return;
  const { effacer } = await import('@/lib/medias');
  await effacer(row.cle);
  db().prepare('DELETE FROM medias WHERE id=?').run(id);
  tracer('image supprimée', row.nom, entite);
  // Une mutation non poussée vers le Blob est une mutation perdue
  // au prochain démarrage d'instance. Elle ne coûte rien en local.
  await sauvegarder();
  revalidatePath(`/${entite}/visuels`);
  revalidatePath(`/${entite}/calendrier`);
  if (row.publication_id) revalidatePath(`/${entite}/publications/${row.publication_id}`);
  // Retiré depuis l'aperçu du calendrier : on y revient.
  const retour = String(fd.get('retour') ?? '');
  if (retour.startsWith(`/${entite}/`)) redirect(retour);
}

/**
 * Écrit la fiche d'un fichier **déjà** téléversé par le navigateur, droit dans
 * le store Blob.
 *
 * Elle ne reçoit donc pas d'octets : c'est tout l'intérêt, et c'est ce qui
 * rend la vidéo possible. Elle vérifie en revanche que l'objet existe bien à
 * ce chemin, et reprend sa taille et son type **du stockage** plutôt que de la
 * déclaration du navigateur — autrement une session valide pourrait inscrire
 * une fiche qui ne désigne rien, ou mentir sur ce qu'elle désigne.
 *
 * Les dimensions et la durée, elles, viennent du navigateur : lui seul a
 * décodé le fichier. Elles sont informatives (afficher « 1080 × 1920 · 14 s »),
 * jamais un contrôle.
 */
export async function enregistrerTeleversement(fd: FormData) {
  const entite = String(fd.get('entite'));
  const chemin = String(fd.get('chemin') ?? '');
  const prefixe = 'machine-a-post/medias/';
  if (!chemin.startsWith(prefixe)) return { ok: false as const, raison: 'Chemin de dépôt inattendu.' };
  const cle = chemin.slice(prefixe.length);

  const { TYPES_ACCEPTES, TYPES_LIVRABLE } = await import('@/lib/medias');
  const { head } = await import('@vercel/blob');
  const livrable = fd.get('origine') === 'livrable';
  let taille: number;
  let typeMime: string;
  try {
    const h = await head(chemin);
    taille = h.size;
    typeMime = h.contentType;
  } catch {
    return { ok: false as const, raison: 'Fichier introuvable dans le stockage — dépôt interrompu ?' };
  }
  if (!(typeMime in (livrable ? TYPES_LIVRABLE : TYPES_ACCEPTES))) return { ok: false as const, raison: `Type refusé : ${typeMime}.` };

  const n = (k: string) => {
    const v = String(fd.get(k) ?? '').trim();
    return v === '' || !Number.isFinite(Number(v)) ? null : Number(v);
  };
  const rattache = String(fd.get('publication_id') ?? '').trim();
  const publicationId = rattache ? Number(rattache) : null;

  db()
    .prepare(
      `INSERT INTO medias (entite, cle, nom, type_mime, octets, largeur, hauteur, duree_s, legende, publication_id, origine, ordre)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    )
    .run(
      entite,
      cle,
      String(fd.get('nom') ?? 'sans nom'),
      typeMime,
      taille,
      n('largeur'),
      n('hauteur'),
      n('duree_s'),
      String(fd.get('legende') ?? '').trim() || null,
      publicationId,
      livrable ? 'livrable' : fd.get('origine') === 'video' ? 'video' : 'apporte',
      livrable && publicationId ? prochainRangLivrable(publicationId) : null,
    );
  if (fd.get('origine') === 'video' && publicationId) await remplacerAnciennesVideos(publicationId, cle);
  tracer('fichier déposé', `${fd.get('nom')} · ${typeMime}`, entite);
  // Une mutation non poussée vers le Blob est une mutation perdue
  // au prochain démarrage d'instance. Elle ne coûte rien en local.
  await sauvegarder();
  revalidatePath(`/${entite}/visuels`);
  if (publicationId) revalidatePath(`/${entite}/publications/${publicationId}`);
  return { ok: true as const };
}

/**
 * Régénérer, c'est remplacer : une vidéo montée dans le studio pour un post
 * retire les précédentes vidéos du studio rattachées au même post (fichier et
 * fiche). Les vidéos déposées à la main ne sont jamais touchées.
 */
async function remplacerAnciennesVideos(publicationId: number, garder: string) {
  const { effacer } = await import('@/lib/medias');
  const anciennes = db()
    .prepare("SELECT id, cle FROM medias WHERE publication_id=? AND origine='video' AND cle != ?")
    .all(publicationId, garder) as Array<{ id: number; cle: string }>;
  for (const a of anciennes) {
    await effacer(a.cle);
    db().prepare('DELETE FROM medias WHERE id=?').run(a.id);
  }
  if (anciennes.length) tracer('vidéo régénérée', `publication ${publicationId} · ${anciennes.length} ancienne(s) remplacée(s)`);
}

/**
 * Dépôt d'une vidéo montée dans le studio, quand le store Blob n'existe pas
 * (développement local). En production la vidéo part directement vers le
 * store, comme tout fichier lourd, puis passe par `enregistrerTeleversement`.
 */
export async function deposerVideoMontee(fd: FormData) {
  const entite = String(fd.get('entite'));
  const f = fd.get('fichier');
  if (!(f instanceof File) || f.size === 0) return { ok: false as const, raison: 'Fichier vide.' };
  const { TYPES_VIDEO, plafondDepotVideo, nouvelleCle, ecrire } = await import('@/lib/medias');
  if (!(f.type in TYPES_VIDEO)) return { ok: false as const, raison: `Type refusé : ${f.type}.` };
  if (f.size > plafondDepotVideo()) return { ok: false as const, raison: 'Vidéo trop lourde pour ce chemin de dépôt.' };
  const cle = nouvelleCle(f.type);
  await ecrire(cle, Buffer.from(await f.arrayBuffer()), f.type);
  const n = (k: string) => (Number.isFinite(Number(fd.get(k))) ? Number(fd.get(k)) : null);
  const publicationId = Number(fd.get('publication_id')) || null;
  db()
    .prepare(
      `INSERT INTO medias (entite, cle, nom, type_mime, octets, largeur, hauteur, duree_s, legende, publication_id, origine)
       VALUES (?,?,?,?,?,?,?,?,?,?, 'video')`,
    )
    .run(entite, cle, f.name, f.type, f.size, n('largeur'), n('hauteur'), n('duree_s'), String(fd.get('legende') ?? '') || null, publicationId);
  if (publicationId) await remplacerAnciennesVideos(publicationId, cle);
  tracer('vidéo montée dans le studio', f.name, entite);
  await sauvegarder();
  revalidatePath(`/${entite}/visuels`);
  revalidatePath(`/${entite}/videos`);
  if (publicationId) revalidatePath(`/${entite}/publications/${publicationId}`);
  return { ok: true as const };
}

/**
 * Fabrique une adresse publique et datée pour un fichier de la médiathèque.
 *
 * Utile deux fois : c'est ce que les API d'Instagram et de TikTok vont
 * chercher, et c'est ce qu'on donne à un outil tiers — un programmateur, le
 * gestionnaire de publicités, un client — sans lui ouvrir l'outil entier ni
 * rendre le fichier public pour toujours.
 */
export async function creerLienTemporaire(fd: FormData) {
  const entite = String(fd.get('entite'));
  const id = Number(fd.get('id'));
  const row = db().prepare('SELECT cle, nom FROM medias WHERE id=? AND entite=?').get(id, entite) as
    | { cle: string; nom: string }
    | undefined;
  if (!row) return { ok: false as const, raison: 'Fichier introuvable.' };

  const { lienPublic } = await import('@/lib/medias');
  try {
    const l = await lienPublic(row.cle, await adresseDeBase(), entite, id);
    tracer('lien temporaire créé', `${row.nom} — jusqu’à ${l.expire.toISOString()} (${l.porte})`, entite);
    await sauvegarder();
    return { ok: true as const, url: l.url, expire: l.expire.toISOString(), porte: l.porte };
  } catch (e) {
    return { ok: false as const, raison: (e as Error).message };
  }
}

/**
 * Voix off ElevenLabs, plan par plan : un MP3 par plan, rangé dans la
 * médiathèque (origine « voix »), que le studio mixe sous l'image — la musique
 * s'efface sous la voix. Bouton pressé par Jonathan, jamais automatique ; la
 * vidéo reste à valider comme toutes les autres.
 */
export async function genererVoixOff(fd: FormData) {
  const entite = String(fd.get('entite'));
  const publicationId = Number(fd.get('publication_id'));
  let textes: Array<{ plan: number; texte: string }> = [];
  try {
    textes = JSON.parse(String(fd.get('textes') ?? '[]'));
  } catch {
    return { ok: false as const, raison: 'Textes illisibles.' };
  }
  textes = textes.filter((x) => x.texte?.trim()).slice(0, 14);
  if (!publicationId || !textes.length) return { ok: false as const, raison: 'Aucun texte à lire.' };
  const { voixElevenLabs } = await import('@/lib/fournisseurs-media');
  const { nouvelleCle, ecrire, effacer } = await import('@/lib/medias');
  const voix: Array<{ plan: number; url: string }> = [];
  try {
    // Les anciennes voix du post sont remplacées.
    const anciennes = db().prepare("SELECT id, cle FROM medias WHERE publication_id=? AND origine='voix'").all(publicationId) as Array<{ id: number; cle: string }>;
    for (const a of anciennes) {
      await effacer(a.cle);
      db().prepare('DELETE FROM medias WHERE id=?').run(a.id);
    }
    for (const t of textes) {
      const mp3 = await voixElevenLabs(t.texte.slice(0, 600), entite === 'veolt' ? 'veolt' : 'magistria');
      const cle = nouvelleCle('audio/mpeg');
      await ecrire(cle, mp3, 'audio/mpeg');
      const r = db()
        .prepare(`INSERT INTO medias (entite, cle, nom, type_mime, octets, legende, publication_id, origine) VALUES (?,?,?,?,?,?,?, 'voix')`)
        .run(entite, cle, `voix-plan-${t.plan}.mp3`, 'audio/mpeg', mp3.length, `Voix off · plan ${t.plan + 1}`, publicationId);
      voix.push({ plan: t.plan, url: `/${entite}/medias/${r.lastInsertRowid}` });
    }
  } catch (e) {
    await sauvegarder();
    return { ok: false as const, raison: e instanceof Error ? e.message : String(e) };
  }
  tracer('voix off générée (ElevenLabs)', `${voix.length} plan(s)`, entite);
  await sauvegarder();
  return { ok: true as const, voix };
}
