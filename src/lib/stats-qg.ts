/**
 * Statistiques pour QG — lecture seule, version 1.
 *
 * Que des compteurs et des dates : aucun texte de publication, aucun nom de
 * compte, aucune valeur de jeton. Aucune écriture en base, aucun appel réseau.
 * Ce que l'outil ne mesure pas vaut `null`, jamais estimé.
 *
 * « Aujourd'hui » est le jour civil à Paris (Europe/Paris) : `date_prevue` et
 * `publie_le` sont des dates AAAA-MM-JJ sans heure, posées en jour local.
 */

import { db } from './db';
import { format, RESEAUX } from './formats';
import { diagnostiquer, CONNEXIONS, type ReseauConnectable } from './connecteurs';
import { ENTITES } from './marques';
import type { ReseauSlug } from './marques';

/**
 * Empreinte SHA-256 (hexadécimal minuscule, 64 caractères) du jeton de QG.
 *
 * Ce n'est pas un secret : on ne retrouve pas le jeton à partir de son
 * empreinte. Elle remplace une variable d'environnement, pour qu'il n'y ait
 * rien à poser sur Vercel. Vide = la route /api/qg/stats répond 404.
 * Pour changer de jeton : remplacer cette valeur par sha256(nouveau jeton).
 */
export const EMPREINTE_JETON_QG = 'bcaf4e1176f54eee3c8d4067b556577e3c81e38529e84c5c0a2d575f8d7c6364';

export interface StatsQG {
  version: 1;
  genereLe: string;
  publications: {
    total: number;
    publieesTotal: number;
    parStatut: Record<string, number>;
    aRelire: number;
    brouillons: number;
    validees: number;
    publiees7j: number;
    publiees30j: number;
    prevues7j: number;
    prevues7jNonPretes: number;
    enRetard: number;
    prochaineLe: string | null;
    dernierePublieeLe: string | null;
  };
  parEntite: Array<{ entite: string; libelle: string; prevues7j: number; publiees30j: number; aRelire: number; enRetard: number }>;
  parReseau: Array<{ reseau: string; prevues7j: number; publiees30j: number }>;
  reseaux: { connectes: number; total: number; aReconnecter: number | null };
  resultats: { vues30j: number | null; interactions30j: number | null; abonnesGagnes30j: number | null } | null;
  activite: { derniereModificationLe: string | null };
}

/** Le jour civil à Paris, décalé de `jours`, en AAAA-MM-JJ. */
function jourParis(jours = 0, maintenant = new Date()): string {
  const auj = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(maintenant);
  const d = new Date(`${auj}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + jours);
  return d.toISOString().slice(0, 10);
}

/** Une date SQLite UTC (« AAAA-MM-JJ HH:MM:SS ») en ISO 8601. */
const isoUtc = (v: string | null): string | null => (v ? `${v.replace(' ', 'T')}${v.length > 10 ? 'Z' : ''}` : null);

interface Ligne {
  entite: string;
  format_slug: string;
  statut: string;
  date_prevue: string;
  publie_le: string | null;
}

export function statsQG(maintenant = new Date()): StatsQG {
  const d = db();
  const auj = jourParis(0, maintenant);
  const dans7 = jourParis(6, maintenant); // aujourd'hui + les 6 jours suivants = 7 jours
  const ilya7 = jourParis(-6, maintenant); // les 7 derniers jours, aujourd'hui compris
  const ilya30 = jourParis(-29, maintenant); // les 30 derniers jours, aujourd'hui compris

  // Seules les colonnes nécessaires aux compteurs sont lues : ni titre, ni texte.
  const lignes = d.prepare('SELECT entite, format_slug, statut, date_prevue, publie_le FROM publications').all() as Ligne[];
  const publieLe = (l: Ligne) => (l.publie_le ? l.publie_le.slice(0, 10) : null);

  // Prévue dans les 7 jours : date prévue entre aujourd'hui et J+6, hors abandonnées (publiées comprises).
  const prevue7 = (l: Ligne) => l.statut !== 'abandonne' && l.date_prevue >= auj && l.date_prevue <= dans7;
  // Non prête : prévue dans les 7 jours et encore en brouillon ou à relire (ni validée ni publiée).
  const nonPrete = (l: Ligne) => prevue7(l) && (l.statut === 'brouillon' || l.statut === 'a-relire');
  // Publiée sur N jours : statut « publie » et date de publication réelle dans la fenêtre.
  const publieeDepuis = (l: Ligne, depuis: string) => l.statut === 'publie' && (publieLe(l) ?? '') >= depuis && (publieLe(l) ?? '') <= auj;
  // En retard : date prévue passée, ni publiée ni abandonnée.
  const retard = (l: Ligne) => l.date_prevue < auj && l.statut !== 'publie' && l.statut !== 'abandonne';
  const reseauDe = (l: Ligne) => format(l.format_slug).reseau as ReseauSlug;

  const parStatut: Record<string, number> = {};
  for (const l of lignes) parStatut[l.statut] = (parStatut[l.statut] ?? 0) + 1;

  // Prochaine publication prévue : la plus proche date prévue ≥ aujourd'hui, ni publiée ni abandonnée.
  const prochaine = lignes
    .filter((l) => l.date_prevue >= auj && l.statut !== 'publie' && l.statut !== 'abandonne')
    .map((l) => l.date_prevue)
    .sort()[0];
  const derniere = lignes
    .filter((l) => l.statut === 'publie')
    .map(publieLe)
    .filter((x): x is string => !!x)
    .sort()
    .pop();

  const compte = (f: (l: Ligne) => boolean, sur = lignes) => sur.filter(f).length;

  const parEntite = ENTITES.map((m) => {
    const sur = lignes.filter((l) => l.entite === m.slug);
    return {
      entite: m.slug,
      libelle: m.nom,
      prevues7j: compte(prevue7, sur),
      publiees30j: compte((l) => publieeDepuis(l, ilya30), sur),
      aRelire: compte((l) => l.statut === 'a-relire', sur),
      enRetard: compte(retard, sur),
    };
  });

  // Par réseau : les réseaux qui ont au moins une publication en base.
  const presents = new Set(lignes.map(reseauDe));
  const parReseau = (Object.keys(RESEAUX) as ReseauSlug[])
    .filter((r) => presents.has(r))
    .map((r) => {
      const sur = lignes.filter((l) => reseauDe(l) === r);
      return { reseau: r, prevues7j: compte(prevue7, sur), publiees30j: compte((l) => publieeDepuis(l, ilya30), sur) };
    });

  // Réseaux : un réseau est « connecté » quand toutes ses variables d'API sont
  // posées côté serveur (présence testée, valeur jamais lue ni renvoyée). Le
  // blog n'a pas d'API. L'outil ne suit pas l'expiration des jetons :
  // `aReconnecter` vaut null.
  const connectables = Object.keys(CONNEXIONS) as ReseauConnectable[];
  const reseaux = { connectes: connectables.filter((r) => diagnostiquer(r).pret).length, total: connectables.length, aReconnecter: null };

  // Résultats : l'outil ne relève rien automatiquement. Les seuls chiffres
  // existants sont les relevés saisis à la main (table `metriques`) : pour
  // chaque post publié dans les 30 derniers jours, son DERNIER relevé.
  // Aucun relevé → null. Les abonnés ne sont pas suivis → null.
  const rel = d
    .prepare(
      `SELECT COUNT(m.id) AS n, SUM(m.impressions) AS vues, SUM(m.interactions) AS inter
         FROM publications p
         JOIN metriques m ON m.id = (SELECT MAX(id) FROM metriques WHERE publication_id = p.id)
        WHERE p.statut = 'publie' AND substr(p.publie_le, 1, 10) BETWEEN ? AND ?`,
    )
    .get(ilya30, auj) as { n: number; vues: number | null; inter: number | null };
  const resultats = rel.n ? { vues30j: rel.vues, interactions30j: rel.inter, abonnesGagnes30j: null } : null;

  // Dernière modification : la plus récente entre une publication modifiée et une ligne du journal.
  const derniereModif = d
    .prepare('SELECT MAX(x) AS le FROM (SELECT MAX(maj_le) AS x FROM publications UNION ALL SELECT MAX(le) FROM journal)')
    .get() as { le: string | null };

  return {
    version: 1,
    genereLe: maintenant.toISOString(),
    publications: {
      total: lignes.length,
      publieesTotal: parStatut.publie ?? 0,
      parStatut,
      aRelire: parStatut['a-relire'] ?? 0,
      brouillons: parStatut.brouillon ?? 0,
      validees: parStatut.valide ?? 0,
      publiees7j: compte((l) => publieeDepuis(l, ilya7)),
      publiees30j: compte((l) => publieeDepuis(l, ilya30)),
      prevues7j: compte(prevue7),
      prevues7jNonPretes: compte(nonPrete),
      enRetard: compte(retard),
      prochaineLe: prochaine ?? null,
      dernierePublieeLe: derniere ?? null,
    },
    parEntite,
    parReseau,
    reseaux,
    resultats,
    activite: { derniereModificationLe: isoUtc(derniereModif.le) },
  };
}
