/**
 * Connecteurs — les vrais appels d'API, plus l'échelle à gravir avant qu'ils
 * fonctionnent.
 *
 * Décision du 2026-10-06 (Jonathan) : on fait **les deux** — la voie manuelle
 * assistée, qui marche aujourd'hui, et les connecteurs réels, qui attendent que
 * les applications développeur existent.
 *
 * Le code ci-dessous est écrit et appelable. Il est **inerte** tant que les
 * variables d'environnement ne sont pas posées, et il le dit avec le remède
 * exact plutôt qu'une erreur générique. Les identifiants sont lus côté serveur
 * uniquement — jamais `NEXT_PUBLIC_*`, jamais réaffichés.
 *
 * Et la règle du cadrage §1 tient, API ou pas : le connecteur est un bouton
 * qu'on presse après validation, pas un automate.
 */

import type { ReseauSlug } from './marques';

export type ReseauConnectable = Extract<ReseauSlug, 'linkedin' | 'instagram' | 'reddit' | 'tiktok'>;

export const BARREAUX = [
  { n: 1, nom: 'Compte', detail: 'le compte existe et est de type professionnel' },
  { n: 2, nom: 'Application', detail: 'une application développeur est créée côté réseau' },
  { n: 3, nom: 'Permissions', detail: "les portées d'écriture sont demandées" },
  { n: 4, nom: 'Autorisation', detail: 'le jeton est obtenu et stocké côté serveur' },
  { n: 5, nom: 'Revue', detail: "le réseau a validé l'application pour la publication" },
] as const;

export interface SpecConnexion {
  reseau: ReseauConnectable;
  nom: string;
  /** Variables d'environnement attendues, dans l'ordre où on les obtient. */
  variables: string[];
  portees: string[];
  revueRequise: boolean;
  difficulte: string;
  piege: string;
  doc: string;
  ordreRecommande: number;
}

export const CONNEXIONS: Record<ReseauConnectable, SpecConnexion> = {
  reddit: {
    reseau: 'reddit',
    nom: 'Reddit',
    variables: ['REDDIT_CLIENT_ID', 'REDDIT_CLIENT_SECRET', 'REDDIT_UTILISATEUR', 'REDDIT_MOT_DE_PASSE'],
    portees: ['submit', 'identity'],
    revueRequise: false,
    difficulte: 'Le seul réseau branchable en une heure. Application de type « script », pas de revue.',
    piege:
      "Le `User-Agent` doit être nommé et stable, sinon Reddit limite puis bloque. Et la fréquence d'auto-promotion du sous-forum prime sur tout : le garde-fou la vérifie avant l'appel.",
    doc: 'https://www.reddit.com/prefs/apps',
    ordreRecommande: 1,
  },
  instagram: {
    reseau: 'instagram',
    nom: 'Instagram',
    variables: ['META_JETON_LONGUE_DUREE', 'IG_COMPTE_ID'],
    portees: ['instagram_content_publish', 'instagram_basic', 'pages_read_engagement'],
    revueRequise: true,
    difficulte:
      "Revue requise, mais c'est le chemin le plus court des trois puisque le Business Manager existe déjà.",
    piege:
      "Un compte Instagram « créateur » ne peut pas publier par API — il faut un compte **entreprise** rattaché à une page Facebook. C'est le piège le plus fréquent, et il se voit seulement au premier appel.",
    doc: 'https://developers.facebook.com/docs/instagram-platform/content-publishing',
    ordreRecommande: 2,
  },
  linkedin: {
    reseau: 'linkedin',
    nom: 'LinkedIn',
    variables: ['LINKEDIN_JETON', 'LINKEDIN_ORGANISATION_ID'],
    portees: ['w_organization_social', 'r_organization_social'],
    revueRequise: true,
    difficulte:
      "La plus sélective des quatre. Il faut le produit « Community Management API », rattaché à la page, et LinkedIn refuse les demandes sans cas d'usage précis.",
    piege:
      "Le jeton doit appartenir à un administrateur de la page, et l'identifiant d'organisation n'est pas le nom de la page : c'est un entier (`urn:li:organization:XXXX`).",
    doc: 'https://learn.microsoft.com/linkedin/marketing/community-management/',
    ordreRecommande: 3,
  },
  tiktok: {
    reseau: 'tiktok',
    nom: 'TikTok',
    variables: ['TIKTOK_JETON'],
    portees: ['video.publish', 'video.upload'],
    revueRequise: true,
    difficulte: 'Revue requise. En dernier : MagistrIA n\'y va pas et Veolt n\'y publie qu\'en secondaire.',
    piege:
      'Tant que l\'application n\'est pas auditée, la *Content Posting API* ne crée que des **brouillons privés** — la publication publique est impossible, même avec un jeton valide.',
    doc: 'https://developers.tiktok.com/doc/content-posting-api-get-started',
    ordreRecommande: 4,
  },
};

export interface Diagnostic {
  reseau: ReseauConnectable;
  /** Variables posées / manquantes — on ne montre jamais les valeurs. */
  posees: string[];
  manquantes: string[];
  pret: boolean;
}

export function diagnostiquer(reseau: ReseauConnectable): Diagnostic {
  const spec = CONNEXIONS[reseau];
  const posees: string[] = [];
  const manquantes: string[] = [];
  for (const v of spec.variables) {
    if (process.env[v]) posees.push(v);
    else manquantes.push(v);
  }
  return { reseau, posees, manquantes, pret: manquantes.length === 0 };
}

export function diagnostiquerTout(): Diagnostic[] {
  return (Object.keys(CONNEXIONS) as ReseauConnectable[]).map(diagnostiquer);
}

// ─────────────────────────────────────────────────────────────────────────────
// Publication
// ─────────────────────────────────────────────────────────────────────────────

export interface ChargePublication {
  texte: string;
  /** URL publique du média. Les quatre API exigent une URL atteignable, pas un fichier local. */
  mediaUrl?: string;
  /** Reddit uniquement. */
  sousForum?: string;
  titre?: string;
}

export type Resultat =
  | { ok: true; reseau: ReseauConnectable; id: string; url?: string; avertissement?: string }
  | { ok: false; reseau: ReseauConnectable; raison: string; remede: string };

function inerte(reseau: ReseauConnectable, d: Diagnostic): Resultat {
  const spec = CONNEXIONS[reseau];
  return {
    ok: false,
    reseau,
    raison: `Connecteur inerte : ${d.manquantes.join(', ')} ${d.manquantes.length > 1 ? 'ne sont pas posées' : "n'est pas posée"}.`,
    remede: `Créer l'application (${spec.doc}), obtenir les portées ${spec.portees.join(', ')}${
      spec.revueRequise ? ', passer la revue' : ''
    }, puis poser les variables dans l'environnement du serveur. En attendant, la voie manuelle assistée est opérationnelle : l'onglet « Préparer » donne le texte et les consignes de visuel prêts à coller.`,
  };
}

/** LinkedIn — Posts API, auteur = l'organisation (pages entreprise uniquement). */
async function publierLinkedIn(c: ChargePublication): Promise<Resultat> {
  const d = diagnostiquer('linkedin');
  if (!d.pret) return inerte('linkedin', d);
  const org = process.env.LINKEDIN_ORGANISATION_ID!;
  const r = await fetch('https://api.linkedin.com/rest/posts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.LINKEDIN_JETON}`,
      'Content-Type': 'application/json',
      'LinkedIn-Version': '202509',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      author: `urn:li:organization:${org}`,
      commentary: c.texte,
      visibility: 'PUBLIC',
      distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },
      lifecycleState: 'PUBLISHED',
      isReshareDisabledByAuthor: false,
    }),
  });
  if (!r.ok) {
    return {
      ok: false,
      reseau: 'linkedin',
      raison: `LinkedIn a répondu ${r.status} : ${(await r.text()).slice(0, 300)}`,
      remede:
        "403 signifie presque toujours que le produit « Community Management API » n'est pas accordé, ou que le jeton n'appartient pas à un administrateur de la page.",
    };
  }
  const id = r.headers.get('x-restli-id') ?? 'inconnu';
  return { ok: true, reseau: 'linkedin', id, avertissement: c.mediaUrl ? "L'image n'a pas été attachée : elle exige un envoi en deux temps (initialisation puis téléversement). À brancher une fois la revue passée." : undefined };
}

/** Instagram — publication en deux temps : conteneur puis publication. */
async function publierInstagram(c: ChargePublication): Promise<Resultat> {
  const d = diagnostiquer('instagram');
  if (!d.pret) return inerte('instagram', d);
  if (!c.mediaUrl) {
    return {
      ok: false,
      reseau: 'instagram',
      raison: 'Aucune URL de média.',
      remede:
        "L'API Instagram ne publie pas de texte seul, et n'accepte pas de fichier local : il faut une URL publique atteignable par Meta. Héberger le visuel, puis renseigner son adresse.",
    };
  }
  const base = `https://graph.facebook.com/v21.0/${process.env.IG_COMPTE_ID}`;
  const jeton = process.env.META_JETON_LONGUE_DUREE!;
  const creation = await fetch(`${base}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: c.mediaUrl, caption: c.texte, access_token: jeton }),
  });
  const cj = (await creation.json()) as { id?: string; error?: { message?: string } };
  if (!creation.ok || !cj.id) {
    return {
      ok: false,
      reseau: 'instagram',
      raison: `Création du conteneur refusée : ${cj.error?.message ?? creation.status}`,
      remede:
        "Vérifier que le compte Instagram est de type **entreprise** (et non créateur) et rattaché à une page Facebook — c'est la cause la plus fréquente.",
    };
  }
  const pub = await fetch(`${base}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: cj.id, access_token: jeton }),
  });
  const pj = (await pub.json()) as { id?: string; error?: { message?: string } };
  if (!pub.ok || !pj.id) {
    return {
      ok: false,
      reseau: 'instagram',
      raison: `Publication refusée : ${pj.error?.message ?? pub.status}`,
      remede: "Le conteneur a été créé mais pas publié. Vérifier la portée `instagram_content_publish`.",
    };
  }
  return { ok: true, reseau: 'instagram', id: pj.id };
}

/** Reddit — OAuth « script » puis /api/submit. Le seul sans revue. */
async function publierReddit(c: ChargePublication): Promise<Resultat> {
  const d = diagnostiquer('reddit');
  if (!d.pret) return inerte('reddit', d);
  if (!c.sousForum || !c.titre) {
    return {
      ok: false,
      reseau: 'reddit',
      raison: 'Sous-forum ou titre manquant.',
      remede: 'Un post Reddit exige les deux. Le sous-forum détermine aussi la règle de fréquence à vérifier.',
    };
  }
  const ua = 'machine-a-post/0.1 (par Veolt/MagistrIA — usage interne)';
  const auth = Buffer.from(`${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`).toString('base64');
  const t = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': ua },
    body: new URLSearchParams({
      grant_type: 'password',
      username: process.env.REDDIT_UTILISATEUR!,
      password: process.env.REDDIT_MOT_DE_PASSE!,
    }),
  });
  const tj = (await t.json()) as { access_token?: string; error?: string };
  if (!t.ok || !tj.access_token) {
    return {
      ok: false,
      reseau: 'reddit',
      raison: `Autorisation refusée : ${tj.error ?? t.status}`,
      remede:
        "L'application doit être de type « script », et le compte propriétaire de l'application doit être celui qui publie. Si le compte a l'authentification à deux facteurs, le mot de passe doit être suffixé du code — ce qui rend ce flux impraticable : désactiver la double authentification sur un compte dédié, ou passer en flux OAuth classique.",
    };
  }
  const nom = c.sousForum.replace(/^r\//, '');
  const s = await fetch('https://oauth.reddit.com/api/submit', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tj.access_token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': ua,
    },
    body: new URLSearchParams({ sr: nom, kind: 'self', title: c.titre, text: c.texte, api_type: 'json' }),
  });
  const sj = (await s.json()) as { json?: { errors?: unknown[]; data?: { url?: string; id?: string } } };
  const erreurs = sj.json?.errors ?? [];
  if (!s.ok || erreurs.length) {
    return {
      ok: false,
      reseau: 'reddit',
      raison: `Soumission refusée : ${JSON.stringify(erreurs).slice(0, 300)}`,
      remede:
        "Les refus les plus courants : compte trop récent ou karma insuffisant pour ce sous-forum, règle de flair obligatoire, ou filtre anti-promotion. Lire les règles du sous-forum avant de réessayer — un refus répété attire la modération.",
    };
  }
  return { ok: true, reseau: 'reddit', id: sj.json?.data?.id ?? 'inconnu', url: sj.json?.data?.url };
}

/** TikTok — Content Posting API. Brouillon privé tant que l'app n'est pas auditée. */
async function publierTikTok(c: ChargePublication): Promise<Resultat> {
  const d = diagnostiquer('tiktok');
  if (!d.pret) return inerte('tiktok', d);
  if (!c.mediaUrl) {
    return {
      ok: false,
      reseau: 'tiktok',
      raison: 'Aucune URL de vidéo.',
      remede: "La Content Posting API tire la vidéo depuis une URL publique dont le domaine doit être vérifié côté TikTok.",
    };
  }
  const r = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.TIKTOK_JETON}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify({
      post_info: { title: c.texte.slice(0, 2200), privacy_level: 'SELF_ONLY', disable_comment: false },
      source_info: { source: 'PULL_FROM_URL', video_url: c.mediaUrl },
    }),
  });
  const j = (await r.json()) as { data?: { publish_id?: string }; error?: { message?: string; code?: string } };
  if (!r.ok || !j.data?.publish_id) {
    return {
      ok: false,
      reseau: 'tiktok',
      raison: `TikTok a répondu ${r.status} : ${j.error?.message ?? j.error?.code ?? 'erreur inconnue'}`,
      remede:
        "Vérifier que le domaine de l'URL vidéo est vérifié dans la console TikTok — c'est un prérequis, pas une option.",
    };
  }
  return {
    ok: true,
    reseau: 'tiktok',
    id: j.data.publish_id,
    avertissement:
      "Publié en `SELF_ONLY` (privé). Tant que l'application n'est pas auditée, TikTok n'autorise pas la publication publique par API : il faut ouvrir l'application mobile pour rendre la vidéo visible.",
  };
}

export async function publier(reseau: ReseauConnectable, c: ChargePublication): Promise<Resultat> {
  switch (reseau) {
    case 'linkedin':
      return publierLinkedIn(c);
    case 'instagram':
      return publierInstagram(c);
    case 'reddit':
      return publierReddit(c);
    case 'tiktok':
      return publierTikTok(c);
  }
}
