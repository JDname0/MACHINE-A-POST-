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
  return { publications: aTraiter.n, seo: articles.n, campagnes: campagnes.n, visuels: medias.n };
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
  cree_le: string;
}

/** Les images déposées pour une entité, la dernière en premier. */
export function mediasDe(entite: EntiteSlug): LigneMedia[] {
  return db()
    .prepare(
      `SELECT m.*, p.titre AS titre_publication
         FROM medias m LEFT JOIN publications p ON p.id = m.publication_id
        WHERE m.entite = ? ORDER BY m.id DESC`,
    )
    .all(entite) as LigneMedia[];
}

/** Les images rattachées à une publication, pour l'afficher dans le composeur. */
export function mediasDePublication(id: number): LigneMedia[] {
  return db().prepare('SELECT * FROM medias WHERE publication_id = ? ORDER BY id DESC').all(id) as LigneMedia[];
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
