/**
 * La mémoire des visuels : chaque image que l'outil génère peut être rangée
 * dans la médiathèque, comme un fichier apporté, avec `origine = 'genere'`.
 *
 * Pourquoi la ranger alors qu'on sait la régénérer : parce qu'un visuel validé
 * est un visuel **publié tel quel** — si le gabarit change plus tard, celui qui
 * est parti ne doit pas changer avec lui — et parce que le studio vidéo monte
 * ses plans à partir de la médiathèque. Une image mémorisée devient matière à
 * vidéo.
 *
 * Pas de doublon : l'empreinte (entité + gabarit + texte) identifie un visuel.
 */

import { createHash } from 'node:crypto';
import { ImageResponse } from 'next/og';
import { db, tracer } from './db';
import { GABARITS, rendre, type GabaritSlug, type Contenu } from './visuels';
import { chargerPolices } from './polices';
import { nouvelleCle, ecrire } from './medias';
import { visuelsDuPost } from './fiche';
import type { EntiteSlug } from './marques';
import type { LignePublication } from './requetes';

export type ResultatMemoire = 'cree' | 'deja' | 'aucun';

export async function memoriserVisuelDe(p: LignePublication): Promise<ResultatMemoire> {
  const visuels = visuelsDuPost(p);
  if (!visuels.length) return 'aucun';
  let cree = false;
  for (const [i, v] of visuels.entries()) {
    if ((await memoriserUn(p, v, visuels.length > 1 ? i + 1 : null)) === 'cree') cree = true;
  }
  return cree ? 'cree' : 'deja';
}

async function memoriserUn(
  p: LignePublication,
  v: { slug: GabaritSlug; contenu: Partial<Contenu> },
  page: number | null,
): Promise<ResultatMemoire> {
  const empreinte = createHash('sha1').update(JSON.stringify([p.entite, v.slug, v.contenu])).digest('hex');
  const d = db();
  const existe = d.prepare('SELECT id, publication_id FROM medias WHERE empreinte = ?').get(empreinte) as
    | { id: number; publication_id: number | null }
    | undefined;
  if (existe) {
    if (existe.publication_id == null) d.prepare('UPDATE medias SET publication_id=? WHERE id=?').run(p.id, existe.id);
    return 'deja';
  }

  const g = GABARITS[v.slug];
  const { photoEnDonnees, effacer } = await import('./medias');
  const photo = await photoEnDonnees(p.entite, v.contenu.photo);
  const reponse = new ImageResponse(rendre(p.entite as EntiteSlug, v.slug, v.contenu, 'clair', photo), {
    width: g.largeur,
    height: g.hauteur,
    fonts: chargerPolices(),
  });
  const octets = Buffer.from(await reponse.arrayBuffer());
  const cle = nouvelleCle('image/png');
  await ecrire(cle, octets, 'image/png');
  // Le visuel précédent du même post (même gabarit, même page) est remplacé :
  // un texte ou une photo changés ne doivent pas laisser l'ancienne version en mémoire.
  const nom = `${g.nom}${page ? ` p.${page}` : ''} — ${(p.titre ?? 'sans titre').slice(0, 80)}.png`;
  const anciens = d.prepare("SELECT id, cle FROM medias WHERE publication_id=? AND origine='genere' AND nom=?").all(p.id, nom) as Array<{ id: number; cle: string }>;
  for (const a of anciens) {
    await effacer(a.cle);
    d.prepare('DELETE FROM medias WHERE id=?').run(a.id);
  }
  d.prepare(
    `INSERT INTO medias (entite, cle, nom, type_mime, octets, largeur, hauteur, legende, publication_id, origine, empreinte)
     VALUES (?,?,?,?,?,?,?,?,?, 'genere', ?)`,
  ).run(
    p.entite,
    cle,
    nom,
    'image/png',
    octets.length,
    g.largeur,
    g.hauteur,
    p.titre ?? null,
    p.id,
    empreinte,
  );
  tracer('visuel mémorisé', `publication ${p.id} · ${v.slug}${page ? ` p.${page}` : ''}`, p.entite);
  return 'cree';
}
