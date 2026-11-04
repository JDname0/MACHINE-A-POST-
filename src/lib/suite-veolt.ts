/**
 * Le terrain — ce que la machine à prospection sait, lu par la machine à post.
 *
 * Jusqu'ici cette machine écrivait à l'aveugle : les sujets venaient de ce
 * qu'on croyait savoir du marché, jamais de ce que le marché avait fait. La
 * machine à prospection, elle, voit les pages réellement lues, les signaux
 * réellement relevés sur des sites réels, et les demandes réellement reçues.
 * C'est de la matière, et elle dormait de l'autre côté du mur.
 *
 * Trois règles tiennent ce pont :
 *
 * 1. **Cloisonnement par entité.** Veolt lit la machine Veolt, MagistrIA lira
 *    la sienne. Les variables sont préfixées par l'entité, jamais partagées.
 *    Une entité sans configuration ne lit rien — et le dit.
 *
 * 2. **Lecture seule, et sans personne dedans.** La route distante ne renvoie
 *    que des comptages, des types de signaux et des pages. Aucun nom, aucune
 *    adresse, aucun téléphone. Le texte libre des demandes n'est transmis que
 *    si le propriétaire l'a explicitement autorisé côté prospection.
 *
 * 3. **Inerte sans clé, et le remède exact plutôt qu'une erreur générique** —
 *    comme les connecteurs réseaux (cf. `connecteurs.ts`).
 *
 * Le bloc `silences` est aussi utile que les chiffres : il dit ce qui est
 * mesuré vide, donc ce qu'un post ne doit surtout pas affirmer.
 */

import type { EntiteSlug } from './marques';

export interface OffreTerrain {
  slug: string;
  libelle: string;
  /** `null` quand le portefeuille distant ne porte pas encore d'offre. */
  organisations: number | null;
  contacts: number | null;
  demandes: number;
  signaux: Array<{ type: string; n: number }>;
}

export interface Terrain {
  releve_le: string;
  fenetre_jours: number;
  reparti_par_offre: boolean;
  portefeuille_total: { organisations: number; contacts: number };
  offres: OffreTerrain[];
  signaux_frequents: Array<{ type: string; n: number }>;
  pages_lues: Array<{ url: string; vues: number; temps_moyen_s: number; profondeur_pct: number }>;
  canaux: Array<{ canal: string; visites: number }>;
  questions: Array<{ offre: string; page: string; question: string; recu_le: string }>;
  silences: Array<{ quoi: string; pourquoi: string }>;
}

export interface Retombee {
  ref: string;
  entite: string;
  reseau: string | null;
  titre: string | null;
  url: string | null;
  offre: string | null;
  publie_le: string;
  visites: number;
  pages_vues: number;
  clics: number;
  demandes: number;
}

/** Ce qui manque, dit avec le geste exact qui le règle. */
export interface Manque {
  variable: string;
  remede: string;
}

export type Lecture<T> =
  | { etat: 'ok'; donnees: T }
  | { etat: 'inerte'; manques: Manque[] }
  | { etat: 'panne'; pourquoi: string };

const DELAI_MS = 8000;

function config(entite: EntiteSlug): { url: string; jeton: string; manques: Manque[] } {
  const p = entite.toUpperCase();
  const url = (process.env[`${p}_SUITE_URL`] ?? '').trim().replace(/\/+$/, '');
  const jeton = (process.env[`${p}_SUITE_TOKEN`] ?? '').trim();
  const manques: Manque[] = [];
  if (!url) {
    manques.push({
      variable: `${p}_SUITE_URL`,
      remede:
        entite === 'veolt'
          ? "l'adresse de la machine à prospection de Veolt — https://veoltproduction.fr"
          : "l'adresse de la machine à prospection de MagistrIA (celle de Veolt ne convient pas : les deux entités ne se lisent jamais l'une l'autre)",
    });
  }
  if (!jeton) {
    manques.push({
      variable: `${p}_SUITE_TOKEN`,
      remede:
        'le même jeton que « suite.jeton » dans data/parametres.json de la machine à prospection (32 caractères au moins)',
    });
  } else if (jeton.length < 32) {
    manques.push({
      variable: `${p}_SUITE_TOKEN`,
      remede: `jeton trop court (${jeton.length} caractères) : la machine distante exige 32 caractères au moins et répondra 404 sinon`,
    });
  }
  return { url, jeton, manques };
}

/** Vrai si l'entité est reliée à sa machine à prospection. */
export function reliee(entite: EntiteSlug): boolean {
  return config(entite).manques.length === 0;
}

async function appeler<T>(
  entite: EntiteSlug,
  chemin: string,
  init?: RequestInit,
): Promise<Lecture<T>> {
  const { url, jeton, manques } = config(entite);
  if (manques.length) return { etat: 'inerte', manques };

  const stop = new AbortController();
  const minuteur = setTimeout(() => stop.abort(), DELAI_MS);
  try {
    const r = await fetch(`${url}${chemin}`, {
      ...init,
      headers: { 'X-Suite-Jeton': jeton, 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
      signal: stop.signal,
      cache: 'no-store',
    });
    const texte = await r.text();
    if (!r.ok) {
      // Les codes de la route distante disent chacun une chose précise. On les
      // traduit plutôt que d'afficher « erreur 404 » à quelqu'un qui n'a aucun
      // moyen de savoir ce que ça veut dire ici.
      const pourquoi =
        r.status === 404
          ? "la machine à prospection n'a pas de jeton « suite » posé : la route n'existe pas encore de son côté"
          : r.status === 401
            ? 'jeton refusé : celui d’ici et celui de la machine à prospection ne sont pas le même'
            : r.status === 429
              ? 'trop d’appels sur la minute, la machine distante demande de patienter'
              : `la machine à prospection a répondu ${r.status} — ${texte.slice(0, 200)}`;
      return { etat: 'panne', pourquoi };
    }
    return { etat: 'ok', donnees: JSON.parse(texte) as T };
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    return {
      etat: 'panne',
      pourquoi:
        m.includes('abort') || m.includes('timeout')
          ? `la machine à prospection n'a pas répondu en ${DELAI_MS / 1000} s`
          : `la machine à prospection est injoignable : ${m}`,
    };
  } finally {
    clearTimeout(minuteur);
  }
}

/** Ce que le terrain dit, pour choisir des sujets sur des faits. */
export function terrain(entite: EntiteSlug, jours = 90): Promise<Lecture<Terrain>> {
  return appeler<Terrain>(entite, `/api/suite/matiere?jours=${encodeURIComponent(String(jours))}`);
}

/** Ce que chaque post publié a réellement produit sur le site. */
export function retombees(entite: EntiteSlug, jours = 90): Promise<Lecture<{ posts: Retombee[]; note: string | null }>> {
  return appeler(entite, `/api/suite/retombees?jours=${encodeURIComponent(String(jours))}`);
}

/**
 * Déclare un post à la machine à prospection et récupère le lien à publier.
 *
 * C'est le seul appel qui écrit, et il n'écrit qu'une déclaration : une
 * référence, un réseau, une page de destination. Le lien renvoyé porte
 * `?v=<ref>` — c'est lui, et lui seul, qui permettra de dire plus tard ce que
 * ce post a produit. Publier le lien nu, c'est accepter de ne jamais savoir.
 */
export function declarerPost(
  entite: EntiteSlug,
  post: { ref: string; reseau?: string; titre?: string; url?: string; offre?: string; publie_le?: string },
): Promise<Lecture<{ ok: true; ref: string; lien_a_utiliser: string }>> {
  return appeler(entite, '/api/suite/post', {
    method: 'POST',
    body: JSON.stringify({ ...post, entite }),
  });
}

/** La référence d'un post, telle qu'elle voyagera dans les liens. */
export function reference(entite: EntiteSlug, id: number, dateIso: string): string {
  const mois = (dateIso || '').slice(0, 7).replace('-', '');
  return `${entite}-${mois}-${id}`;
}
