/**
 * Le suivi d'un chargé de communication : ce qu'il y a à faire aujourd'hui,
 * le fil de validation de chaque post, et le rapport du mois.
 *
 * Tout est lu dans la base, rien n'est estimé. Une valeur qui n'a pas été
 * relevée à la main reste `null`, et l'interface l'affiche « non disponible » —
 * jamais zéro (même règle que `taux.ts`).
 */

import { db } from './db';
import { format, RESEAUX } from './formats';
import { diagnostiquer, type ReseauConnectable } from './connecteurs';
import type { LignePublication } from './requetes';
import type { EntiteSlug, ReseauSlug } from './marques';

// ─────────────────────────────────────────────────────────────────────────────
// Commentaires de validation
// ─────────────────────────────────────────────────────────────────────────────

export interface Commentaire {
  id: number;
  publication_id: number;
  entite: EntiteSlug;
  auteur: string | null;
  texte: string;
  resolu: number;
  le: string;
}

export function commentairesDe(publicationId: number): Commentaire[] {
  return db().prepare('SELECT * FROM commentaires WHERE publication_id=? ORDER BY id').all(publicationId) as Commentaire[];
}

/** Nombre de commentaires non résolus par publication, pour une entité. */
export function commentairesOuvertsParPost(entite: EntiteSlug): Map<number, number> {
  const lignes = db()
    .prepare('SELECT publication_id, COUNT(*) AS n FROM commentaires WHERE entite=? AND resolu=0 GROUP BY publication_id')
    .all(entite) as Array<{ publication_id: number; n: number }>;
  return new Map(lignes.map((l) => [l.publication_id, l.n]));
}

// ─────────────────────────────────────────────────────────────────────────────
// À faire aujourd'hui
// ─────────────────────────────────────────────────────────────────────────────

/** Jours après la publication au-delà desquels un relevé manquant est signalé. */
export const DELAI_RELEVE_JOURS = 7;

export interface APublier {
  p: LignePublication;
  /** Vrai si aucune API n'est prête pour ce réseau : c'est à la main. */
  manuel: boolean;
  retard: number;
}

export interface Journee {
  aujourdhui: string;
  aPublier: APublier[];
  aValiderUrgent: LignePublication[];
  aMesurer: Array<LignePublication & { jours: number }>;
  commentaires: Array<Commentaire & { titre: string | null; date_prevue: string }>;
  demain: LignePublication[];
}

function isoJour(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function ecartJours(de: string, a: string): number {
  return Math.round((new Date(`${a}T12:00:00Z`).getTime() - new Date(`${de}T12:00:00Z`).getTime()) / 86_400_000);
}

/** Une heure « HH:MM » valide (00:00 → 23:59), sinon `null`. */
export function heureValide(h: string | null | undefined): string | null {
  const v = (h ?? '').trim();
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? v : null;
}

/** « 08:30 · » devant un libellé quand le post a une heure prévue, rien sinon. */
export function prefixeHeure(p: { heure_prevue: string | null }): string {
  const h = heureValide(p.heure_prevue);
  return h ? `${h.replace(':', 'h')} · ` : '';
}

/** Ordre de la journée : par date, puis par heure prévue (les posts sans heure à la fin), puis par id. */
const ORDRE_JOUR = 'date_prevue, heure_prevue IS NULL, heure_prevue, id';

/**
 * Les réseaux qui ont réellement au moins une publication dans la base, pour
 * une entité — le filtre du calendrier n'en propose pas d'autre.
 */
export function reseauxPresents(entite: EntiteSlug): ReseauSlug[] {
  const formats = db().prepare('SELECT DISTINCT format_slug FROM publications WHERE entite=?').all(entite) as Array<{ format_slug: string }>;
  const vus = new Set(formats.map((f) => format(f.format_slug).reseau as ReseauSlug));
  return (Object.keys(RESEAUX) as ReseauSlug[]).filter((r) => vus.has(r));
}

export function estManuel(formatSlug: string): boolean {
  const r = format(formatSlug).reseau;
  if (r === 'blog') return true;
  return !diagnostiquer(r as ReseauConnectable).pret;
}

export function journee(entite: EntiteSlug, maintenant = new Date()): Journee {
  const d = db();
  const aujourdhui = isoJour(maintenant);
  const lendemain = new Date(maintenant);
  lendemain.setUTCDate(lendemain.getUTCDate() + 1);
  const dans3 = new Date(maintenant);
  dans3.setUTCDate(dans3.getUTCDate() + 3);

  const aPublier = (
    d
      .prepare(`SELECT * FROM publications WHERE entite=? AND statut='valide' AND date_prevue <= ? ORDER BY ${ORDRE_JOUR}`)
      .all(entite, aujourdhui) as LignePublication[]
  ).map((p) => ({ p, manuel: estManuel(p.format_slug), retard: ecartJours(p.date_prevue, aujourdhui) }));

  const aValiderUrgent = d
    .prepare(
      `SELECT * FROM publications WHERE entite=? AND statut IN ('brouillon','a-relire') AND date_prevue <= ? ORDER BY ${ORDRE_JOUR}`,
    )
    .all(entite, isoJour(dans3)) as LignePublication[];

  const limiteReleve = new Date(maintenant);
  limiteReleve.setUTCDate(limiteReleve.getUTCDate() - DELAI_RELEVE_JOURS);
  const aMesurer = (
    d
      .prepare(
        `SELECT p.* FROM publications p
          WHERE p.entite=? AND p.statut='publie' AND p.publie_le IS NOT NULL AND p.publie_le <= ?
            AND NOT EXISTS (SELECT 1 FROM metriques m WHERE m.publication_id = p.id)
          ORDER BY p.publie_le, p.id`,
      )
      .all(entite, isoJour(limiteReleve)) as LignePublication[]
  ).map((p) => ({ ...p, jours: ecartJours(p.publie_le!, aujourdhui) }));

  const commentaires = d
    .prepare(
      `SELECT c.*, p.titre, p.date_prevue FROM commentaires c JOIN publications p ON p.id = c.publication_id
        WHERE c.entite=? AND c.resolu=0 AND p.statut NOT IN ('publie','abandonne')
        ORDER BY p.date_prevue, c.id`,
    )
    .all(entite) as Array<Commentaire & { titre: string | null; date_prevue: string }>;

  const demain = d
    .prepare(`SELECT * FROM publications WHERE entite=? AND date_prevue=? AND statut NOT IN ('publie','abandonne') ORDER BY ${ORDRE_JOUR}`)
    .all(entite, isoJour(lendemain)) as LignePublication[];

  return { aujourdhui, aPublier, aValiderUrgent, aMesurer, commentaires, demain };
}

/** Le compteur du menu : ce qui demande un geste aujourd'hui. */
export function nbAFaire(entite: EntiteSlug): number {
  const j = journee(entite);
  return j.aPublier.length + j.aValiderUrgent.length + j.aMesurer.length;
}

// ─────────────────────────────────────────────────────────────────────────────
// Rappels de publication (.ics)
// ─────────────────────────────────────────────────────────────────────────────

function echapperIcs(t: string): string {
  return t.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Plie une ligne iCalendar à 75 octets (RFC 5545 §3.1). */
function plier(ligne: string): string {
  const octets = Buffer.from(ligne, 'utf8');
  if (octets.length <= 75) return ligne;
  const morceaux: string[] = [];
  let courant = '';
  for (const c of ligne) {
    if (Buffer.byteLength(courant + c, 'utf8') > (morceaux.length ? 74 : 75)) {
      morceaux.push(courant);
      courant = '';
    }
    courant += c;
  }
  morceaux.push(courant);
  return morceaux.join('\r\n ');
}

/**
 * Un rappel par publication à venir (ou en retard) qui doit être posée à la
 * main : un événement le jour prévu, avec une alarme. Le rappel ne publie
 * rien — il dit seulement que c'est le jour, et où trouver le texte.
 *
 * `heure` : l'heure locale du rappel (« 09:00 »), posée en heure flottante.
 * Un post qui porte sa propre heure prévue (`heure_prevue`) est rappelé à
 * cette heure-là ; sans heure, il garde l'heure par défaut.
 */
export function rappelsIcs(entite: EntiteSlug, base: string, nomMarque: string, heure = '09:00'): { ics: string; n: number } {
  const aujourdhui = isoJour(new Date());
  const pubs = db()
    .prepare(
      "SELECT * FROM publications WHERE entite=? AND statut IN ('brouillon','a-relire','valide') AND date_prevue >= date(?, '-7 day') ORDER BY date_prevue, id",
    )
    .all(entite, aujourdhui) as LignePublication[];
  const parDefaut = heureValide(heure) ?? '09:00';
  const horodatage = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const lignes = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Machine a post//Rappels//FR',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${echapperIcs(`Publications ${nomMarque}`)}`,
  ];
  let n = 0;
  for (const p of pubs) {
    if (!estManuel(p.format_slug)) continue;
    const f = format(p.format_slug);
    const jour = p.date_prevue.replace(/-/g, '');
    const propre = heureValide(p.heure_prevue);
    const [hh, mm] = (propre ?? parDefaut).split(':');
    const debut = `${jour}T${hh}${mm}00`;
    const etat =
      p.statut === 'valide'
        ? 'validé, prêt à poster'
        : `pas encore validé (${p.statut === 'a-relire' ? 'à relire' : 'brouillon'}) — à valider avant`;
    lignes.push(
      'BEGIN:VEVENT',
      `UID:machine-a-post-${entite}-${p.id}@machine-a-post`,
      `DTSTAMP:${horodatage}`,
      `DTSTART:${debut}`,
      'DURATION:PT15M',
      plier(`SUMMARY:${echapperIcs(`À poster · ${f.nom} — ${p.titre ?? 'sans titre'}`)}`),
      plier(
        `DESCRIPTION:${echapperIcs(
          `Statut : ${etat}.\n${propre ? `Heure prévue : ${propre}.` : `Pas d'heure prévue sur la fiche : rappel à ${parDefaut}.`}\nPublication manuelle : copier le texte depuis la fiche, poster, puis « Marquer comme publié ».\n${base}/${entite}/publications/${p.id}`,
        )}`,
      ),
      plier(`URL:${base}/${entite}/publications/${p.id}`),
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'TRIGGER:PT0M',
      plier(`DESCRIPTION:${echapperIcs(`À poster : ${p.titre ?? f.nom}`)}`),
      'END:VALARM',
      'END:VEVENT',
    );
    n++;
  }
  lignes.push('END:VCALENDAR');
  return { ics: lignes.join('\r\n') + '\r\n', n };
}

// ─────────────────────────────────────────────────────────────────────────────
// Rapport mensuel
// ─────────────────────────────────────────────────────────────────────────────

export interface LigneRapport {
  id: number;
  titre: string | null;
  format_slug: string;
  reseau: ReseauSlug;
  pilier: string;
  date_prevue: string;
  statut: string;
  publie_le: string | null;
  url_publiee: string | null;
  /** Dernier relevé saisi pour ce post (les relevés successifs ne s'additionnent pas). */
  impressions: number | null;
  interactions: number | null;
  clics: number | null;
  duree_s: number | null;
  releve_le: string | null;
}

export interface BilanReseau {
  reseau: ReseauSlug;
  nom: string;
  prevues: number;
  publiees: number;
  mesurees: number;
  impressions: number | null;
  interactions: number | null;
  clics: number | null;
}

export interface Rapport {
  mois: string;
  debut: string;
  fin: string;
  lignes: LigneRapport[];
  prevues: number;
  publiees: number;
  publieesHorsPlan: number;
  abandonnees: number;
  enAttente: number;
  parReseau: BilanReseau[];
  parPilier: Array<{ pilier: string; publiees: number }>;
  validations: number;
  renvois: number;
  commentaires: number;
  campagnes: { releves: number; depense: number | null; impressions: number | null; clics: number | null; conversations: number | null };
  seo: { articles: number; top10: number; citesIa: number; liensObtenus: number };
  /** Les mois qui précèdent et le mois du rapport, d'après les relevés SEO datés. */
  evolutionSeo: MoisSeo[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Suivi SEO mois par mois
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Un mois de suivi SEO, calculé uniquement sur les relevés datés de ce mois
 * (`seo_releves`). Pour chaque article ou lien, c'est son **dernier** relevé
 * du mois qui compte. Un mois sans relevé d'article laisse les valeurs
 * d'articles à `null` (« non disponible ») ; idem pour les liens.
 */
export interface MoisSeo {
  mois: string;
  articlesReleves: number;
  top10: number | null;
  citesIa: number | null;
  /** Moyenne des positions saisies ; `null` si aucune position n'a été notée. */
  positionMoyenne: number | null;
  positionsNotees: number;
  liensReleves: number;
  liensObtenus: number | null;
}

function moisPrecedents(mois: string, n: number): string[] {
  const [a, m] = mois.split('-').map(Number);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(a, m - 1 - (n - 1 - i), 1));
    return d.toISOString().slice(0, 7);
  });
}

export function evolutionSeo(entite: EntiteSlug, mois: string, n = 6): MoisSeo[] {
  const d = db();
  // Le dernier relevé de chaque article (puis de chaque lien) dans le mois.
  // La jointure sur l'entité de l'article ou du lien garde la cloison même
  // si une ligne de relevé était mal étiquetée.
  const articles = d.prepare(
    `SELECT r.top10, r.cite_par_ia, r.position FROM seo_releves r
       JOIN articles a ON a.id = r.article_id AND a.entite = r.entite
      WHERE r.entite = ? AND substr(r.releve_le,1,7) = ?
        AND r.id = (SELECT MAX(id) FROM seo_releves x
                     WHERE x.article_id = r.article_id AND x.entite = r.entite AND substr(x.releve_le,1,7) = ?)`,
  );
  const liens = d.prepare(
    `SELECT r.statut FROM seo_releves r
       JOIN backlinks b ON b.id = r.backlink_id AND b.entite = r.entite
      WHERE r.entite = ? AND substr(r.releve_le,1,7) = ?
        AND r.id = (SELECT MAX(id) FROM seo_releves x
                     WHERE x.backlink_id = r.backlink_id AND x.entite = r.entite AND substr(x.releve_le,1,7) = ?)`,
  );
  return moisPrecedents(mois, n).map((m) => {
    const ar = articles.all(entite, m, m) as Array<{ top10: number | null; cite_par_ia: number | null; position: number | null }>;
    const li = liens.all(entite, m, m) as Array<{ statut: string | null }>;
    const positions = ar.map((x) => x.position).filter((x): x is number => x != null);
    return {
      mois: m,
      articlesReleves: ar.length,
      top10: ar.length ? ar.filter((x) => x.top10).length : null,
      citesIa: ar.length ? ar.filter((x) => x.cite_par_ia).length : null,
      positionMoyenne: positions.length ? Math.round((positions.reduce((s, x) => s + x, 0) / positions.length) * 10) / 10 : null,
      positionsNotees: positions.length,
      liensReleves: li.length,
      liensObtenus: li.length ? li.filter((x) => x.statut === 'obtenu').length : null,
    };
  });
}

export function moisValide(m: string | undefined): string {
  if (m && /^\d{4}-(0[1-9]|1[0-2])$/.test(m)) return m;
  return new Date().toISOString().slice(0, 7);
}

/** Les mois qui ont au moins une publication prévue ou publiée, le plus récent d'abord. */
export function moisDisponibles(entite: EntiteSlug): string[] {
  const l = db()
    .prepare(
      `SELECT DISTINCT substr(date_prevue,1,7) AS m FROM publications WHERE entite=?
       UNION SELECT DISTINCT substr(publie_le,1,7) FROM publications WHERE entite=? AND publie_le IS NOT NULL
       UNION SELECT DISTINCT substr(releve_le,1,7) FROM seo_releves WHERE entite=?
       ORDER BY 1 DESC`,
    )
    .all(entite, entite, entite) as Array<{ m: string }>;
  return l.map((x) => x.m).filter(Boolean);
}

const somme = (vals: Array<number | null>): number | null => {
  const v = vals.filter((x): x is number => x != null);
  return v.length ? v.reduce((a, b) => a + b, 0) : null;
};

export function rapportMensuel(entite: EntiteSlug, mois: string): Rapport {
  const d = db();
  const debut = `${mois}-01`;
  const finDate = new Date(`${debut}T12:00:00Z`);
  finDate.setUTCMonth(finDate.getUTCMonth() + 1);
  finDate.setUTCDate(0);
  const fin = isoJour(finDate);

  // Le périmètre : tout post prévu dans le mois, plus tout post publié dans le
  // mois même s'il était prévu ailleurs (un retard rattrapé compte au mois où
  // il est sorti).
  const lignes = (
    d
      .prepare(
        `SELECT p.id, p.titre, p.format_slug, p.pilier, p.date_prevue, p.statut, p.publie_le, p.url_publiee,
                m.impressions, m.interactions, m.clics, m.duree_s, m.releve_le
           FROM publications p
           LEFT JOIN metriques m ON m.id = (SELECT MAX(id) FROM metriques WHERE publication_id = p.id)
          WHERE p.entite = ?
            AND ((p.date_prevue BETWEEN ? AND ?) OR (p.publie_le BETWEEN ? AND ?))
          ORDER BY COALESCE(p.publie_le, p.date_prevue), p.id`,
      )
      .all(entite, debut, fin, debut, fin) as Array<Omit<LigneRapport, 'reseau'>>
  ).map((l) => ({ ...l, reseau: format(l.format_slug).reseau as ReseauSlug }));

  const dansLeMois = (x: string | null) => x != null && x >= debut && x <= fin;
  const prevuesL = lignes.filter((l) => dansLeMois(l.date_prevue));
  const publieesL = lignes.filter((l) => l.statut === 'publie' && dansLeMois(l.publie_le));

  const parReseau = (Object.keys(RESEAUX) as ReseauSlug[]).map((r) => {
    const pub = publieesL.filter((l) => l.reseau === r);
    const mes = pub.filter((l) => l.releve_le != null);
    return {
      reseau: r,
      nom: RESEAUX[r].nom,
      prevues: prevuesL.filter((l) => l.reseau === r).length,
      publiees: pub.length,
      mesurees: mes.length,
      impressions: somme(mes.map((l) => l.impressions)),
      interactions: somme(mes.map((l) => l.interactions)),
      clics: somme(mes.map((l) => l.clics)),
    };
  });

  const piliers = new Map<string, number>();
  for (const l of publieesL) piliers.set(l.pilier, (piliers.get(l.pilier) ?? 0) + 1);

  const compteJournal = (motif: string) =>
    (
      d
        .prepare(`SELECT COUNT(*) AS n FROM journal WHERE entite=? AND date(le) BETWEEN ? AND ? AND (${motif})`)
        .get(entite, debut, fin) as { n: number }
    ).n;

  const camp = d
    .prepare(
      `SELECT COUNT(*) AS n, SUM(r.depense) AS dep, SUM(r.impressions) AS imp, SUM(r.clics) AS cl, SUM(r.conversations) AS conv
         FROM campagne_releves r JOIN campagnes c ON c.id = r.campagne_id
        WHERE c.entite=? AND date(r.releve_le) BETWEEN ? AND ?`,
    )
    .get(entite, debut, fin) as { n: number; dep: number | null; imp: number | null; cl: number | null; conv: number | null };

  const seo = d
    .prepare('SELECT COUNT(*) AS t, SUM(top10) AS top, SUM(cite_par_ia) AS ia FROM articles WHERE entite=?')
    .get(entite) as { t: number; top: number | null; ia: number | null };
  const liens = d.prepare("SELECT COUNT(*) AS n FROM backlinks WHERE entite=? AND statut='obtenu'").get(entite) as { n: number };

  return {
    mois,
    debut,
    fin,
    lignes,
    prevues: prevuesL.length,
    publiees: publieesL.length,
    publieesHorsPlan: publieesL.filter((l) => !dansLeMois(l.date_prevue)).length,
    abandonnees: prevuesL.filter((l) => l.statut === 'abandonne').length,
    enAttente: prevuesL.filter((l) => l.statut !== 'publie' && l.statut !== 'abandonne').length,
    parReseau,
    parPilier: [...piliers.entries()].map(([pilier, publiees]) => ({ pilier, publiees })).sort((a, b) => b.publiees - a.publiees),
    validations: compteJournal("action = 'validé depuis la file' OR (action = 'statut changé' AND detail LIKE '%→ valide')"),
    renvois: compteJournal("action = 'renvoyé en relecture' OR (action = 'statut changé' AND detail LIKE '%→ a-relire')"),
    commentaires: (
      d.prepare('SELECT COUNT(*) AS n FROM commentaires WHERE entite=? AND date(le) BETWEEN ? AND ?').get(entite, debut, fin) as { n: number }
    ).n,
    campagnes: { releves: camp.n, depense: camp.dep, impressions: camp.imp, clics: camp.cl, conversations: camp.conv },
    seo: { articles: seo.t, top10: seo.top ?? 0, citesIa: seo.ia ?? 0, liensObtenus: liens.n },
    evolutionSeo: evolutionSeo(entite, mois),
  };
}

/** Le rapport en CSV (séparateur « ; », BOM UTF-8 : s'ouvre tel quel dans un tableur français). */
export function rapportCsv(r: Rapport): string {
  const cell = (v: string | number | null) => {
    if (v == null) return 'non disponible';
    const s = typeof v === 'number' ? String(v).replace('.', ',') : v;
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const entete = [
    'id', 'date prévue', 'réseau', 'format', 'pilier', 'titre', 'statut', 'publié le', 'adresse',
    'impressions', 'interactions', 'clics', 'durée (s)', "taux d'engagement", 'relevé le',
  ];
  const lignes = r.lignes.map((l) => {
    const eng = l.impressions && l.interactions != null ? Math.round((l.interactions / l.impressions) * 10000) / 100 : null;
    return [
      l.id, l.date_prevue, RESEAUX[l.reseau].nom, format(l.format_slug).nom, l.pilier, l.titre ?? '', l.statut,
      l.publie_le ?? '', l.url_publiee ?? '', l.impressions, l.interactions, l.clics, l.duree_s,
      eng != null ? `${String(eng).replace('.', ',')} %` : null, l.releve_le ? l.releve_le.slice(0, 10) : null,
    ]
      .map(cell)
      .join(';');
  });
  return '\uFEFF' + [entete.join(';'), ...lignes].join('\r\n') + '\r\n';
}
