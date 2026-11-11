import { db } from './db';
import type { EntiteSlug } from './marques';

export interface LignePublication {
  id: number;
  entite: EntiteSlug;
  format_slug: string;
  pilier: string;
  persona: string | null;
  sujet_ref: string | null;
  date_prevue: string;
  semaine: number | null;
  phase: string | null;
  raison: string | null;
  statut: string;
  titre: string | null;
  accroche: string;
  corps: string;
  appel: string;
  hashtags: string;
  consignes_visuel: string;
  preuve: string | null;
  indicateur: string | null;
  sous_forum: string | null;
  url_publiee: string | null;
  publie_le: string | null;
}

export const STATUTS = ['brouillon', 'a-relire', 'valide', 'publie', 'abandonne'] as const;
export const LIBELLE_STATUT: Record<string, string> = {
  brouillon: 'Brouillon',
  'a-relire': 'À relire',
  valide: 'Validé',
  publie: 'Publié',
  abandonne: 'Abandonné',
};

export function publications(entite: EntiteSlug, filtres: { statut?: string; reseau?: string } = {}) {
  let sql = 'SELECT * FROM publications WHERE entite = ?';
  const args: unknown[] = [entite];
  if (filtres.statut) {
    sql += ' AND statut = ?';
    args.push(filtres.statut);
  }
  if (filtres.reseau) {
    sql += ' AND format_slug LIKE ?';
    args.push(`${filtres.reseau === 'linkedin' ? 'li' : filtres.reseau === 'instagram' ? 'ig' : filtres.reseau}-%`);
  }
  sql += ' ORDER BY date_prevue ASC, id ASC';
  return db().prepare(sql).all(...args) as LignePublication[];
}

export function publication(id: number) {
  return db().prepare('SELECT * FROM publications WHERE id = ?').get(id) as LignePublication | undefined;
}

export function compteursMenu(entite: EntiteSlug): Record<string, number> {
  const d = db();
  const aTraiter = d
    .prepare("SELECT COUNT(*) AS n FROM publications WHERE entite=? AND statut IN ('brouillon','a-relire') AND date_prevue <= date('now','+7 day')")
    .get(entite) as { n: number };
  const articles = d.prepare("SELECT COUNT(*) AS n FROM articles WHERE entite=? AND statut='a-ecrire'").get(entite) as { n: number };
  const campagnes = d.prepare("SELECT COUNT(*) AS n FROM campagnes WHERE entite=? AND statut='active'").get(entite) as { n: number };
  const medias = d.prepare('SELECT COUNT(*) AS n FROM medias WHERE entite=?').get(entite) as { n: number };
  // La file de validation compte toute la semaine en cours de traitement,
  // pas seulement les sept jours qui viennent : on valide avec de l'avance.
  const aValider = d
    .prepare("SELECT COUNT(*) AS n FROM publications WHERE entite=? AND semaine IS NOT NULL AND statut IN ('brouillon','a-relire')")
    .get(entite) as { n: number };
  // Vidéos dues aujourd'hui ou en retard (échéance = publication − délai réglé), sans vidéo rattachée.
  const delai = Number((d.prepare('SELECT valeur FROM reglages WHERE cle=?').get(`video.delai.${entite}`) as { valeur: string } | undefined)?.valeur ?? 1);
  const videos = d
    .prepare(
      `SELECT COUNT(*) AS n FROM publications p
        WHERE p.entite=? AND p.format_slug IN ('ig-reel','ig-video','li-video','tiktok-video')
          AND p.statut NOT IN ('publie','abandonne')
          AND date(p.date_prevue, '-' || ? || ' day') <= date('now')
          AND NOT EXISTS (SELECT 1 FROM medias m WHERE m.publication_id = p.id AND m.type_mime LIKE 'video/%')`,
    )
    .get(entite, Number.isFinite(delai) ? delai : 1) as { n: number };
  return { videos: videos.n, valider: aValider.n, publications: aTraiter.n, seo: articles.n, campagnes: campagnes.n, visuels: medias.n };
}

export function statsEntite(entite: EntiteSlug) {
  const d = db();
  const q = <T>(sql: string, ...a: unknown[]) => d.prepare(sql).get(...a) as T;
  return {
    total: q<{ n: number }>('SELECT COUNT(*) AS n FROM publications WHERE entite=?', entite).n,
    parStatut: d
      .prepare('SELECT statut, COUNT(*) AS n FROM publications WHERE entite=? GROUP BY statut')
      .all(entite) as Array<{ statut: string; n: number }>,
    semaineCourante: d
      .prepare(
        "SELECT * FROM publications WHERE entite=? AND date_prevue BETWEEN date('now','weekday 1','-7 day') AND date('now','weekday 0') ORDER BY date_prevue",
      )
      .all(entite) as LignePublication[],
    prochaines: d
      .prepare("SELECT * FROM publications WHERE entite=? AND statut IN ('brouillon','a-relire','valide') AND date_prevue >= date('now') ORDER BY date_prevue LIMIT 8")
      .all(entite) as LignePublication[],
    enRetard: d
      .prepare("SELECT COUNT(*) AS n FROM publications WHERE entite=? AND statut IN ('brouillon','a-relire') AND date_prevue < date('now')")
      .get(entite) as { n: number },
    articles: q<{ total: number; ecrits: number; top10: number; ia: number }>(
      "SELECT COUNT(*) AS total, SUM(statut='publie') AS ecrits, SUM(top10) AS top10, SUM(cite_par_ia) AS ia FROM articles WHERE entite=?",
      entite,
    ),
    liens: d.prepare('SELECT statut, COUNT(*) AS n FROM backlinks WHERE entite=? GROUP BY statut').all(entite) as Array<{
      statut: string;
      n: number;
    }>,
    journal: d.prepare('SELECT * FROM journal WHERE entite=? OR entite IS NULL ORDER BY id DESC LIMIT 8').all(entite) as Array<{
      action: string;
      detail: string | null;
      le: string;
    }>,
  };
}

export function sousForums() {
  return db().prepare('SELECT * FROM sous_forums ORDER BY promotion_interdite, nom').all() as Array<{
    id: number;
    nom: string;
    regle: string;
    plafond_jours: number | null;
    promotion_interdite: number;
    dernier_post: string | null;
    note: string | null;
  }>;
}

export function joursDepuis(date: string | null): number | null {
  if (!date) return null;
  const d = new Date(`${date}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86_400_000);
}

export function formaterDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

/**
 * Agrégats de résultats par réseau — ce qui alimente le bloc « Résultats »
 * du tableau de bord et la page Indicateurs.
 *
 * Les relevés sont saisis à la main : un réseau sans relevé renvoie `null`
 * partout, et c'est volontaire. « 0 % » dirait qu'on a mesuré et que c'était
 * nul ; « — » dit qu'on n'a pas mesuré.
 */
export interface ResultatReseau {
  reseau: string;
  nom: string;
  planifiees: number;
  publiees: number;
  releves: number;
  impressions: number | null;
  interactions: number | null;
  clics: number | null;
  dureeMoyenne: number | null;
}

export function resultats(entite: EntiteSlug): ResultatReseau[] {
  const d = db();
  const prefixe: Record<string, string> = {
    linkedin: 'li-%',
    instagram: 'ig-%',
    reddit: 'reddit-%',
    tiktok: 'tiktok-%',
    blog: 'blog-%',
  };
  const noms: Record<string, string> = {
    linkedin: 'LinkedIn', instagram: 'Instagram', reddit: 'Reddit', tiktok: 'TikTok', blog: 'Blog',
  };

  return Object.keys(prefixe).map((r) => {
    const p = d
      .prepare(
        "SELECT COUNT(*) AS planifiees, SUM(statut='publie') AS publiees FROM publications WHERE entite=? AND format_slug LIKE ?",
      )
      .get(entite, prefixe[r]) as { planifiees: number; publiees: number | null };
    const m = d
      .prepare(
        `SELECT COUNT(*) AS n, SUM(mt.impressions) AS imp, SUM(mt.interactions) AS inter,
                SUM(mt.clics) AS clics, AVG(mt.duree_s) AS duree
         FROM metriques mt JOIN publications pu ON pu.id = mt.publication_id
         WHERE pu.entite=? AND pu.format_slug LIKE ?`,
      )
      .get(entite, prefixe[r]) as { n: number; imp: number | null; inter: number | null; clics: number | null; duree: number | null };

    return {
      reseau: r,
      nom: noms[r],
      planifiees: p.planifiees,
      publiees: p.publiees ?? 0,
      releves: m.n,
      impressions: m.imp,
      interactions: m.inter,
      clics: m.clics,
      dureeMoyenne: m.duree,
    };
  });
}

export interface LigneMedia {
  id: number;
  entite: EntiteSlug;
  cle: string;
  nom: string;
  type_mime: string;
  octets: number;
  largeur: number | null;
  hauteur: number | null;
  duree_s: number | null;
  legende: string | null;
  publication_id: number | null;
  titre_publication: string | null;
  /** 'apporte' (déposé), 'genere' (visuel de l'outil) ou 'video' (montée dans le studio). */
  origine: string;
  cree_le: string;
}

/** Les images déposées pour une entité, la dernière en premier. */
export function mediasDe(entite: EntiteSlug): LigneMedia[] {
  return db()
    .prepare(
      `SELECT m.*, p.titre AS titre_publication
         FROM medias m LEFT JOIN publications p ON p.id = m.publication_id
        WHERE m.entite = ? AND m.type_mime NOT LIKE 'audio/%' ORDER BY m.id DESC`,
    )
    .all(entite) as LigneMedia[];
}

/** Les images rattachées à une publication, pour l'afficher dans le composeur. */
export function mediasDePublication(id: number): LigneMedia[] {
  return db().prepare("SELECT * FROM medias WHERE publication_id = ? AND type_mime NOT LIKE 'audio/%' ORDER BY id DESC").all(id) as LigneMedia[];
}

/** De quoi remplir le choix « rattacher à une publication ». */
export function publicationsPourChoix(entite: EntiteSlug) {
  return db()
    .prepare(
      `SELECT id, titre, format_slug, date_prevue FROM publications
        WHERE entite = ? ORDER BY date_prevue DESC LIMIT 120`,
    )
    .all(entite) as Array<{ id: number; titre: string | null; format_slug: string; date_prevue: string }>;
}

/**
 * Le prochain créneau « blog » proposé par le calendrier : la première semaine
 * à venir qui n'a pas encore d'article (le mercredi, ou demain si la semaine
 * est entamée), sinon une semaine après le dernier article prévu — la cadence
 * hebdomadaire continue au-delà des douze semaines.
 */
export function prochainCreneauBlog(entite: EntiteSlug): { date: string; semaine: number | null } {
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const demain = new Date();
  demain.setUTCDate(demain.getUTCDate() + 1);
  const min = iso(demain);
  const lignes = db()
    .prepare('SELECT date_prevue, semaine, format_slug FROM publications WHERE entite=? ORDER BY date_prevue')
    .all(entite) as Array<{ date_prevue: string; semaine: number | null; format_slug: string }>;
  const semaines = new Map<number, { lundi: string; blog: boolean }>();
  for (const l of lignes) {
    if (l.semaine == null) continue;
    const j = new Date(`${l.date_prevue}T12:00:00Z`);
    j.setUTCDate(j.getUTCDate() - ((j.getUTCDay() + 6) % 7));
    const w = semaines.get(l.semaine) ?? { lundi: iso(j), blog: false };
    if (l.format_slug === 'blog-article') w.blog = true;
    semaines.set(l.semaine, w);
  }
  for (const [n, w] of [...semaines.entries()].sort((a, b) => a[0] - b[0])) {
    const mercredi = new Date(`${w.lundi}T12:00:00Z`);
    mercredi.setUTCDate(mercredi.getUTCDate() + 2);
    const dimanche = new Date(`${w.lundi}T12:00:00Z`);
    dimanche.setUTCDate(dimanche.getUTCDate() + 6);
    if (iso(dimanche) < min || w.blog) continue;
    return { date: iso(mercredi) < min ? min : iso(mercredi), semaine: n };
  }
  const blogs = lignes.filter((l) => l.format_slug === 'blog-article').map((l) => l.date_prevue);
  const dernier = blogs.length ? new Date(`${blogs[blogs.length - 1]}T12:00:00Z`) : new Date();
  dernier.setUTCDate(dernier.getUTCDate() + 7);
  return { date: iso(dernier) < min ? min : iso(dernier), semaine: null };
}
