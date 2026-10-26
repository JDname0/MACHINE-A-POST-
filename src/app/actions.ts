'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db, tracer } from '@/lib/db';
import { sauvegarder } from '@/lib/persistance';
import { verifier, ouvrirSession, fermerSession } from '@/lib/auth';
import { publier, type ReseauConnectable } from '@/lib/connecteurs';
import { format } from '@/lib/formats';

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
  const texte = [row.accroche, row.corps, row.appel, row.hashtags].filter(Boolean).join('\n\n');
  const res = await publier(f.reseau as ReseauConnectable, {
    texte,
    titre: row.titre ?? undefined,
    sousForum: row.sous_forum ?? undefined,
    mediaUrl: String(fd.get('media_url') ?? '') || undefined,
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
