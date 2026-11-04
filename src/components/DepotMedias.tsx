'use client';

import { useRef, useState } from 'react';
import { enregistrerTeleversement } from '@/app/actions';

/**
 * Le dépôt, côté navigateur, quand le store Blob existe.
 *
 * Il téléverse **directement** vers le stockage, sans passer par une action
 * serveur — seule façon d'accepter une vidéo, puisqu'une fonction Vercel
 * refuse un corps de requête au-delà de ~4,5 Mo. La fonction ne signe qu'un
 * jeton ; les octets vont du navigateur au store.
 *
 * Deux choses sont mesurées ici et nulle part ailleurs, parce que seul le
 * navigateur a décodé le fichier : les dimensions d'une vidéo et sa durée. Un
 * décodeur côté serveur les lirait aussi, mais au prix d'une dépendance
 * d'analyse de conteneur MP4 pour afficher « 14 s ».
 */

interface Choix {
  id: number;
  libelle: string;
}

type Etat =
  | { phase: 'repos' }
  | { phase: 'envoi'; fichier: string; rang: number; total: number; pourcent: number }
  | { phase: 'fini'; posees: number; refus: string[] };

const VIDEO = /^video\//;

/** Dimensions et durée, lues en chargeant le fichier dans un élément du DOM. */
function mesurer(f: File): Promise<{ largeur?: number; hauteur?: number; duree?: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(f);
    const fini = (r: { largeur?: number; hauteur?: number; duree?: number }) => {
      URL.revokeObjectURL(url);
      resolve(r);
    };
    // Un fichier illisible par le navigateur ne doit pas bloquer le dépôt : on
    // le téléverse sans ses dimensions plutôt que de refuser.
    const abandon = setTimeout(() => fini({}), 8000);
    if (VIDEO.test(f.type)) {
      const v = document.createElement('video');
      v.preload = 'metadata';
      v.onloadedmetadata = () => {
        clearTimeout(abandon);
        fini({ largeur: v.videoWidth, hauteur: v.videoHeight, duree: v.duration });
      };
      v.onerror = () => {
        clearTimeout(abandon);
        fini({});
      };
      v.src = url;
    } else {
      const i = new Image();
      i.onload = () => {
        clearTimeout(abandon);
        fini({ largeur: i.naturalWidth, hauteur: i.naturalHeight });
      };
      i.onerror = () => {
        clearTimeout(abandon);
        fini({});
      };
      i.src = url;
    }
  });
}

export function DepotMedias({
  entite,
  publications,
  typesAcceptes,
  plafondImage,
  plafondVideo,
  libellePlafonds,
}: {
  entite: string;
  publications: Choix[];
  typesAcceptes: string[];
  plafondImage: number;
  plafondVideo: number;
  libellePlafonds: string;
}) {
  const [etat, setEtat] = useState<Etat>({ phase: 'repos' });
  const champ = useRef<HTMLInputElement>(null);
  const legende = useRef<HTMLInputElement>(null);
  const rattachement = useRef<HTMLSelectElement>(null);

  async function deposer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fichiers = [...(champ.current?.files ?? [])];
    if (fichiers.length === 0) return;

    // `uploadPresigned` et non `upload` : le store est connecté par OIDC, et
    // la variante « client token » exige un jeton statique que le projet n'a
    // pas. Voir la route qui signe.
    const { uploadPresigned } = await import('@vercel/blob/client');
    const refus: string[] = [];
    let posees = 0;

    for (let i = 0; i < fichiers.length; i++) {
      const f = fichiers[i];
      const video = VIDEO.test(f.type);
      if (!typesAcceptes.includes(f.type)) {
        refus.push(`${f.name} — ${f.type || 'type inconnu'} n’est pas un format accepté`);
        continue;
      }
      const max = video ? plafondVideo : plafondImage;
      if (f.size > max) {
        refus.push(`${f.name} — ${Math.round(f.size / 1048576)} Mo, au-delà de la limite de ${Math.round(max / 1048576)} Mo`);
        continue;
      }

      setEtat({ phase: 'envoi', fichier: f.name, rang: i + 1, total: fichiers.length, pourcent: 0 });
      const mesures = await mesurer(f);
      const extension = f.type.split('/')[1].replace('quicktime', 'mov').replace('jpeg', 'jpg');
      const chemin = `machine-a-post/medias/${crypto.randomUUID()}.${extension}`;

      try {
        const blob = await uploadPresigned(chemin, f, {
          access: 'private',
          contentType: f.type,
          handleUploadUrl: `/${entite}/medias/televerser`,
          onUploadProgress: ({ percentage }) =>
            setEtat({ phase: 'envoi', fichier: f.name, rang: i + 1, total: fichiers.length, pourcent: Math.round(percentage) }),
        });

        const fd = new FormData();
        fd.set('entite', entite);
        fd.set('chemin', blob.pathname);
        fd.set('nom', f.name);
        fd.set('legende', legende.current?.value ?? '');
        fd.set('publication_id', rattachement.current?.value ?? '');
        if (mesures.largeur) fd.set('largeur', String(mesures.largeur));
        if (mesures.hauteur) fd.set('hauteur', String(mesures.hauteur));
        if (mesures.duree) fd.set('duree_s', String(mesures.duree));
        const res = await enregistrerTeleversement(fd);
        if (res.ok) posees++;
        else refus.push(`${f.name} — ${res.raison}`);
      } catch (err) {
        refus.push(`${f.name} — dépôt interrompu : ${(err as Error).message}`);
      }
    }

    setEtat({ phase: 'fini', posees, refus });
    if (champ.current) champ.current.value = '';
    // La liste est rendue côté serveur : il faut la redemander pour la voir.
    if (posees > 0) window.location.assign(`/${entite}/visuels#images`);
  }

  const envoi = etat.phase === 'envoi';

  return (
    <div className="carte" style={{ marginBottom: 22 }}>
      <form onSubmit={deposer}>
        <div className="grille g2" style={{ alignItems: 'start' }}>
          <div className="champ" style={{ marginBottom: 0 }}>
            <label htmlFor="fichiers">Fichiers</label>
            <input id="fichiers" type="file" name="fichiers" multiple accept={typesAcceptes.join(',')} ref={champ} required />
            <div className="aide">{libellePlafonds}</div>
          </div>
          <div className="champ" style={{ marginBottom: 0 }}>
            <label htmlFor="legende">À quoi ça sert (facultatif)</label>
            <input id="legende" name="legende" ref={legende} placeholder="Rendu 3D du flacon — version finale" />
            <div className="aide">Écrit pour toi dans six semaines, quand le nom du fichier ne dira plus rien.</div>
          </div>
        </div>

        <div className="champ" style={{ marginTop: 14, marginBottom: 0 }}>
          <label htmlFor="rattache">Rattacher à une publication (facultatif)</label>
          <select id="rattache" name="publication_id" ref={rattachement} defaultValue="">
            <option value="">— aucune publication —</option>
            {publications.map((p) => (
              <option key={p.id} value={p.id}>
                {p.libelle}
              </option>
            ))}
          </select>
          <div className="aide">Rattaché, le fichier apparaît dans le composeur du post, à côté du visuel généré.</div>
        </div>

        <div className="rang" style={{ marginTop: 16 }}>
          <button type="submit" disabled={envoi}>
            {envoi ? 'Dépôt en cours…' : 'Déposer'}
          </button>
          {envoi ? (
            <span className="aide" style={{ marginTop: 0 }}>
              {etat.fichier} — {etat.rang} sur {etat.total}, {etat.pourcent} %
            </span>
          ) : null}
        </div>

        {envoi ? (
          <div className="jauge" aria-hidden>
            <span style={{ width: `${etat.pourcent}%` }} />
          </div>
        ) : null}

        {etat.phase === 'fini' && etat.refus.length > 0
          ? etat.refus.map((r, i) => (
              <div className="constat" data-n="blocage" key={i} style={{ marginTop: 10 }}>
                <div className="regle">Fichier refusé</div>
                <div className="msg">{r}</div>
              </div>
            ))
          : null}
      </form>
    </div>
  );
}
