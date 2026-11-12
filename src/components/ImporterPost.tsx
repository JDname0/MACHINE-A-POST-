'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { creerPostImporte } from '@/app/actions';
import { envoyerLivrables, TYPES_LIVRABLE_NAVIGATEUR, type Plafonds } from '@/lib/envoi-livrables';

interface Option {
  slug: string;
  nom: string;
}

/**
 * « Importer un post fait ailleurs » : un post déjà fini (vidéo, images,
 * carrousel, PDF + son texte) entre dans le calendrier comme les autres. Il
 * est créé en brouillon, passe les garde-fous de la marque, et attend
 * « Valider » — rien ne part sans le « oui » de Jonathan.
 */
export function ImporterPost({
  entite,
  formats,
  piliers,
  personas,
  preuveIndice,
  dateDefaut,
  direct,
  plafonds,
}: {
  entite: string;
  formats: Option[];
  piliers: Option[];
  personas: Option[];
  preuveIndice: string;
  dateDefaut: string;
  direct: boolean;
  plafonds: Plafonds;
}) {
  const router = useRouter();
  const fichiers = useRef<HTMLInputElement>(null);
  const [etat, setEtat] = useState('');
  const [erreur, setErreur] = useState<string[]>([]);
  const [envoi, setEnvoi] = useState(false);

  async function importer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnvoi(true);
    setErreur([]);
    setEtat('Création du post…');
    const fd = new FormData(e.currentTarget);
    fd.delete('fichiers');
    const r = await creerPostImporte(fd);
    if (!r.ok) {
      setEnvoi(false);
      setEtat('');
      setErreur([r.raison]);
      return;
    }
    const liste = [...(fichiers.current?.files ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'fr', { numeric: true }));
    let refus: string[] = [];
    if (liste.length) {
      const env = await envoyerLivrables(entite, r.id, liste, direct, plafonds, (nom, rang, total, pourcent) =>
        setEtat(`Envoi ${rang}/${total} — ${nom}${pourcent ? ` · ${pourcent} %` : ''}`),
      );
      refus = env.refus;
    }
    if (refus.length) {
      // Le post existe : on l'ouvre quand même, les refus restent affichés ici.
      setErreur(refus);
      setEnvoi(false);
    }
    router.push(`/${entite}/calendrier?apercu=${r.id}&importe=1`);
  }

  return (
    <form onSubmit={importer}>
      <input type="hidden" name="entite" value={entite} />
      <div className="rang" style={{ gap: 10, flexWrap: 'wrap' }}>
        <div className="champ" style={{ flex: '1 1 220px' }}>
          <label>Format</label>
          <select name="format_slug" required defaultValue={formats[0]?.slug}>
            {formats.map((f) => (
              <option key={f.slug} value={f.slug}>
                {f.nom}
              </option>
            ))}
          </select>
        </div>
        <div className="champ" style={{ width: 170 }}>
          <label>Date de publication</label>
          <input type="date" name="date_prevue" defaultValue={dateDefaut} required />
        </div>
        <div className="champ" style={{ flex: '1 1 200px' }}>
          <label>Pilier</label>
          <select name="pilier" defaultValue={piliers[0]?.slug}>
            {piliers.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.nom}
              </option>
            ))}
          </select>
        </div>
        <div className="champ" style={{ flex: '1 1 200px' }}>
          <label>À qui</label>
          <select name="persona" required defaultValue="">
            <option value="" disabled>
              — persona —
            </option>
            {personas.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.nom}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="champ">
        <label>Titre (pour le calendrier)</label>
        <input name="titre" required placeholder="Ce que dit le post, en une ligne" />
      </div>
      <div className="champ">
        <label>Texte du post (légende)</label>
        <textarea
          name="texte"
          rows={6}
          placeholder={'Colle le texte tel qu’il sera publié.\n\nPremier paragraphe = accroche · dernier paragraphe avec une question = appel · ligne de #hashtags à la fin.'}
        />
      </div>
      <div className="champ">
        <label>Sur quoi s’appuie ce post (preuve)</label>
        <input name="preuve" placeholder={preuveIndice} />
        <div className="aide">Vide, le post reste bloqué jusqu’à ce qu’elle soit dite : c’est la règle « aucune preuve inventée ».</div>
      </div>
      <div className="champ">
        <label>Fichiers du post</label>
        <input ref={fichiers} type="file" name="fichiers" multiple accept={TYPES_LIVRABLE_NAVIGATEUR.join(',')} />
        <div className="aide">
          Vidéo, images ou PDF. Pour un carrousel : les pages, nommées dans l’ordre (page-01, page-02…), ou le PDF déjà monté.
        </div>
      </div>
      <button type="submit" disabled={envoi}>
        {envoi ? 'Import en cours…' : 'Importer le post'}
      </button>
      {etat ? <div className="aide" style={{ marginTop: 6 }}>{etat}</div> : null}
      {erreur.length ? (
        <ul className="aide" style={{ marginTop: 6, color: 'var(--danger, #b00020)' }}>
          {erreur.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      ) : null}
    </form>
  );
}
