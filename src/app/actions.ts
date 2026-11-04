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
  db().prepare("UPDATE publications SET statut=?, maj_le=datetime('now') WHERE id=?").run(statut, id);
  tracer('statut changé', `publication ${id} → ${statut}`, entite);
  // Une mutation non poussée vers le Blob est une mutation perdue
  // au prochain démarrage d'instance. Elle ne coûte rien en local.
  await sauvegarder();
  revalidatePath(`/${entite}/publications/${id}`);
  revalidatePath(`/${entite}/publications`);
  revalidatePath(`/${entite}`);
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
  db()
    .prepare('UPDATE medias SET legende=?, publication_id=? WHERE id=? AND entite=?')
    .run(String(fd.get('legende') ?? '').trim() || null, rattache ? Number(rattache) : null, id, entite);
  // Une mutation non poussée vers le Blob est une mutation perdue
  // au prochain démarrage d'instance. Elle ne coûte rien en local.
  await sauvegarder();
  revalidatePath(`/${entite}/visuels`);
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
  if (row.publication_id) revalidatePath(`/${entite}/publications/${row.publication_id}`);
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

  const { TYPES_ACCEPTES } = await import('@/lib/medias');
  const { head } = await import('@vercel/blob');
  let taille: number;
  let typeMime: string;
  try {
    const h = await head(chemin);
    taille = h.size;
    typeMime = h.contentType;
  } catch {
    return { ok: false as const, raison: 'Fichier introuvable dans le stockage — dépôt interrompu ?' };
  }
  if (!(typeMime in TYPES_ACCEPTES)) return { ok: false as const, raison: `Type refusé : ${typeMime}.` };

  const n = (k: string) => {
    const v = String(fd.get(k) ?? '').trim();
    return v === '' || !Number.isFinite(Number(v)) ? null : Number(v);
  };
  const rattache = String(fd.get('publication_id') ?? '').trim();
  const publicationId = rattache ? Number(rattache) : null;

  db()
    .prepare(
      `INSERT INTO medias (entite, cle, nom, type_mime, octets, largeur, hauteur, duree_s, legende, publication_id)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
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
    );
  tracer('fichier déposé', `${fd.get('nom')} · ${typeMime}`, entite);
  // Une mutation non poussée vers le Blob est une mutation perdue
  // au prochain démarrage d'instance. Elle ne coûte rien en local.
  await sauvegarder();
  revalidatePath(`/${entite}/visuels`);
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
