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
import { GABARITS, rendre } from './visuels';
import { chargerPolices } from './polices';
import { nouvelleCle, ecrire } from './medias';
import { parametresVisuel } from './fiche';
import type { EntiteSlug } from './marques';
import type { LignePublication } from './requetes';

export type ResultatMemoire = 'cree' | 'deja' | 'aucun';

export async function memoriserVisuelDe(p: LignePublication): Promise<ResultatMemoire> {
  const v = parametresVisuel(p);
  if (!v) return 'aucun';
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
  const reponse = new ImageResponse(rendre(p.entite as EntiteSlug, v.slug, v.contenu, 'clair'), {
    width: g.largeur,
    height: g.hauteur,
    fonts: chargerPolices(),
  });
  const octets = Buffer.from(await reponse.arrayBuffer());
  const cle = nouvelleCle('image/png');
  await ecrire(cle, octets, 'image/png');
  d.prepare(
    `INSERT INTO medias (entite, cle, nom, type_mime, octets, largeur, hauteur, legende, publication_id, origine, empreinte)
     VALUES (?,?,?,?,?,?,?,?,?, 'genere', ?)`,
  ).run(
    p.entite,
    cle,
    `${g.nom} — ${(p.titre ?? 'sans titre').slice(0, 80)}.png`,
    'image/png',
    octets.length,
    g.largeur,
    g.hauteur,
    p.titre ?? null,
    p.id,
    empreinte,
  );
  tracer('visuel mémorisé', `publication ${p.id} · ${v.slug}`, p.entite);
  return 'cree';
}
