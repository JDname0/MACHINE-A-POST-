import { marque, type EntiteSlug } from '@/lib/marques';
import { mediasDe, publicationsPourChoix } from '@/lib/requetes';
import {
  TYPES_ACCEPTES,
  TYPES_IMAGE,
  TYPES_VIDEO,
  TAILLE_MAX_ACTION,
  TAILLE_MAX_IMAGE,
  TAILLE_MAX_VIDEO,
  cadre,
  poids,
  duree,
  estVideo,
  depotDirect,
  etatMedias,
} from '@/lib/medias';
import { importerMedia, majMedia, supprimerMedia } from '@/app/actions';
import { DepotMedias } from '@/components/DepotMedias';
import { LienTemporaire } from '@/components/LienTemporaire';
import { format } from '@/lib/formats';

/**
 * La médiathèque, sur la page « Visuels et vidéos ».
 *
 * Elle est là parce que l'outil ne sait pas tout fabriquer : une photo de
 * chantier, un rendu 3D sorti de Blender, un montage After Effects, une
 * capture d'écran du produit ne se génèrent pas depuis un gabarit. Le
 * générateur couvre les affirmations et les chiffres ; le reste, on le dépose.
 *
 * Ce qui est affiché sur chaque fichier n'est pas décoratif : les dimensions,
 * le cadre et la durée disent tout de suite si le réseau va recadrer ou
 * couper, et c'est la question qu'on se pose au moment de publier, pas après.
 *
 * Deux chemins de dépôt, selon l'environnement — et c'est visible dans
 * l'interface, parce que les plafonds ne sont pas les mêmes. Voir
 * `src/lib/medias.ts`.
 */
export async function Medias({ entite, posees, refus }: { entite: EntiteSlug; posees?: string; refus?: string }) {
  const fichiers = mediasDe(entite);
  const publications = publicationsPourChoix(entite);
  const stockage = etatMedias();
  const direct = depotDirect();

  const choix = publications.map((p) => ({
    id: p.id,
    libelle: `${p.date_prevue} · ${format(p.format_slug).nom.replace(/^.*— /, '')} · ${p.titre ?? 'sans titre'}`,
  }));

  const Choix = ({ valeur }: { valeur?: number | null }) => (
    <select name="publication_id" defaultValue={valeur ? String(valeur) : ''}>
      <option value="">— aucune publication —</option>
      {choix.map((c) => (
        <option key={c.id} value={c.id}>
          {c.libelle}
        </option>
      ))}
    </select>
  );

  const extensions = [...new Set(Object.values(TYPES_ACCEPTES))].join(', ');
  const libellePlafonds = direct
    ? `Plusieurs d’un coup. ${poids(TAILLE_MAX_IMAGE)} par image, ${poids(TAILLE_MAX_VIDEO)} par vidéo.`
    : `Plusieurs d’un coup, tant que le total tient dans ${poids(TAILLE_MAX_ACTION)}.`;

  const images = fichiers.filter((f) => !estVideo(f.type_mime));
  const videos = fichiers.filter((f) => estVideo(f.type_mime));

  return (
    <section id="images">
      <h2>Tes images et tes vidéos</h2>
      <p className="aide" style={{ marginBottom: 16, maxWidth: '76ch' }}>
        À côté des gabarits générés plus haut : les fichiers que tu apportes — un rendu, une photo, un montage, une
        capture du produit. Ils sont stockés par l&apos;outil ({stockage.libelle}), pas pointés par une adresse qui
        peut mourir. Formats acceptés : {extensions}.
      </p>

      {!stockage.durable ? (
        <div className="encart" data-t="grave" style={{ marginBottom: 16 }}>
          <strong>Stockage éphémère.</strong> {stockage.libelle}. Connecter le store Blob au projet avant de déposer
          quoi que ce soit d&apos;important.
        </div>
      ) : null}

      {direct ? (
        <div className="encart" style={{ marginBottom: 16 }}>
          <strong>Le fichier ne passe pas par l&apos;outil.</strong> Il va de ton navigateur au stockage, directement.
          C&apos;est ce qui rend la vidéo possible : par le chemin ordinaire, une fonction refuse toute requête au-delà
          de ~4,5 Mo, soit moins de deux secondes de Reel.
        </div>
      ) : (
        <div className="encart" data-t="grave" style={{ marginBottom: 16 }}>
          <strong>Dépôt limité à {poids(TAILLE_MAX_ACTION)} ici.</strong> Sans store Blob — c&apos;est le cas en
          développement local — les octets traversent l&apos;outil, et le plafond s&apos;applique. Assez pour essayer,
          pas pour une vidéo de tournage : celles-là se déposent sur le site en ligne.
        </div>
      )}

      {posees ? (
        <div className="constat" data-n="conseil" style={{ marginBottom: 12 }}>
          <div className="regle">Dépôt effectué</div>
          <div className="msg">
            {posees} fichier{Number(posees) > 1 ? 's' : ''} enregistré{Number(posees) > 1 ? 's' : ''}.
          </div>
        </div>
      ) : null}

      {refus
        ? refus.split(' | ').map((r, i) => (
            <div className="constat" data-n="blocage" key={i} style={{ marginBottom: 9 }}>
              <div className="regle">Fichier refusé</div>
              <div className="msg">{r}</div>
            </div>
          ))
        : null}

      {direct ? (
        <DepotMedias
          entite={entite}
          publications={choix}
          typesAcceptes={Object.keys(TYPES_ACCEPTES)}
          plafondImage={TAILLE_MAX_IMAGE}
          plafondVideo={TAILLE_MAX_VIDEO}
          libellePlafonds={libellePlafonds}
        />
      ) : (
        <div className="carte" style={{ marginBottom: 22 }}>
          <form action={importerMedia}>
            <input type="hidden" name="entite" value={entite} />
            <div className="grille g2" style={{ alignItems: 'start' }}>
              <div className="champ" style={{ marginBottom: 0 }}>
                <label htmlFor="fichiers">Fichiers</label>
                <input
                  id="fichiers"
                  type="file"
                  name="fichiers"
                  multiple
                  accept={Object.keys(TYPES_ACCEPTES).join(',')}
                  required
                />
                <div className="aide">{libellePlafonds}</div>
              </div>
              <div className="champ" style={{ marginBottom: 0 }}>
                <label htmlFor="legende">À quoi ça sert (facultatif)</label>
                <input id="legende" name="legende" placeholder="Rendu 3D du flacon — version finale" />
                <div className="aide">Écrit pour toi dans six semaines, quand le nom du fichier ne dira plus rien.</div>
              </div>
            </div>
            <div className="champ" style={{ marginTop: 14, marginBottom: 0 }}>
              <label htmlFor="rattache">Rattacher à une publication (facultatif)</label>
              <Choix />
              <div className="aide">
                Rattaché, le fichier apparaît dans le composeur du post, à côté du visuel généré.
              </div>
            </div>
            <div className="rang" style={{ marginTop: 16 }}>
              <button type="submit">Déposer</button>
            </div>
          </form>
        </div>
      )}

      <p className="aide" style={{ marginBottom: 14 }}>
        {fichiers.length === 0
          ? `Rien de déposé pour ${marque(entite).nom}.`
          : `${images.length} image${images.length > 1 ? 's' : ''} et ${videos.length} vidéo${videos.length > 1 ? 's' : ''} pour ${marque(entite).nom}.`}
      </p>

      {fichiers.length === 0 ? (
        <div className="encart">
          <strong>Rien de déposé pour l&apos;instant.</strong> Les cinq gabarits ci-dessus suffisent pour les posts
          d&apos;affirmation et de chiffre. Cette zone sert à ce qu&apos;ils ne savent pas faire : montrer un vrai
          rendu, un vrai écran, un vrai montage.
        </div>
      ) : (
        <div className="grille g3">
          {fichiers.map((m) => {
            const c = cadre(m.largeur, m.hauteur);
            const src = `/${entite}/medias/${m.id}`;
            const video = estVideo(m.type_mime);
            const d = duree(m.duree_s);
            return (
              <div className="carte" key={m.id}>
                {video ? (
                  <video
                    src={`${src}#t=2`}
                    controls
                    preload="metadata"
                    playsInline
                    style={{
                      width: '100%',
                      aspectRatio: '4 / 5',
                      objectFit: 'contain',
                      background: '#000',
                      borderRadius: 9,
                      border: '1px solid var(--ligne)',
                      display: 'block',
                    }}
                  />
                ) : (
                  <a href={src} target="_blank" rel="noreferrer" title="Ouvrir en taille réelle">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={m.legende ?? m.nom}
                      style={{
                        width: '100%',
                        aspectRatio: '4 / 5',
                        objectFit: 'contain',
                        background: 'var(--fond)',
                        borderRadius: 9,
                        border: '1px solid var(--ligne)',
                        display: 'block',
                      }}
                    />
                  </a>
                )}

                <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 10, wordBreak: 'break-word' }}>{m.nom}</div>
                {m.legende ? (
                  <div style={{ fontSize: 12.5, color: 'var(--encre-2)', marginTop: 3 }}>{m.legende}</div>
                ) : null}

                <div className="rang" style={{ gap: 6, marginTop: 9 }}>
                  <span className="pastille" data-t={video ? 'accent' : undefined}>
                    {video ? 'vidéo' : 'image'}
                  </span>
                  <span className="pastille">
                    {m.largeur && m.hauteur ? `${m.largeur} × ${m.hauteur}` : 'dimensions inconnues'}
                  </span>
                  {d ? <span className="pastille">{d}</span> : null}
                  <span className="pastille">{poids(m.octets)}</span>
                  {m.origine === 'genere' ? <span className="pastille" data-t="accent">généré</span> : null}
                  {m.origine === 'video' ? <span className="pastille" data-t="accent">studio</span> : null}
                  {m.origine === 'photo' ? <span className="pastille" data-t="accent">photo de fond du post</span> : null}
                  {m.origine === 'clip' ? <span className="pastille" data-t="accent">clip · fond de plan vidéo</span> : null}
                  {c ? (
                    <span className="pastille" data-t={c.exact ? 'ok' : 'alerte'} title={c.ou}>
                      {c.exact ? c.nom : 'hors cadre'}
                    </span>
                  ) : null}
                </div>

                {c && !c.exact ? (
                  <div className="aide">
                    Aucun cadre de réseau : {m.largeur} × {m.hauteur} donne du{' '}
                    {(m.largeur! / m.hauteur!).toFixed(2).replace('.', ',')}:1, donc le réseau recadrera tout seul. Le
                    cadre le moins loin est le {c.nom} — {c.ou}.
                  </div>
                ) : null}

                {m.publication_id ? (
                  <div className="aide">
                    Rattaché à{' '}
                    <a className="lien-accent" href={`/${entite}/publications/${m.publication_id}`}>
                      {m.titre_publication ?? `publication ${m.publication_id}`}
                    </a>
                  </div>
                ) : null}

                <div className="rang" style={{ marginTop: 11, gap: 7 }}>
                  <a className="bouton fantome" href={src} download={m.nom} style={{ padding: '7px 12px', fontSize: 12.5 }}>
                    Télécharger
                  </a>
                </div>

                <LienTemporaire entite={entite} id={m.id} />

                <details style={{ marginTop: 11 }}>
                  <summary style={{ fontSize: 12.5 }}>Modifier ou supprimer</summary>
                  <form action={majMedia} style={{ marginTop: 10 }}>
                    <input type="hidden" name="entite" value={entite} />
                    <input type="hidden" name="id" value={m.id} />
                    <div className="champ">
                      <label>Légende</label>
                      <input name="legende" defaultValue={m.legende ?? ''} />
                    </div>
                    <div className="champ">
                      <label>Publication</label>
                      <Choix valeur={m.publication_id} />
                    </div>
                    <button type="submit" className="fantome">Enregistrer</button>
                  </form>
                  <form action={supprimerMedia} style={{ marginTop: 10 }}>
                    <input type="hidden" name="entite" value={entite} />
                    <input type="hidden" name="id" value={m.id} />
                    <button type="submit" className="danger">Supprimer le fichier</button>
                    <div className="aide">Le fichier part avec la fiche. C&apos;est définitif.</div>
                  </form>
                </details>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
