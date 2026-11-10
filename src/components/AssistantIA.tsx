import { db } from '@/lib/db';
import { iaDisponible } from '@/lib/ia';
import { constatsDe } from '@/lib/fiche';
import type { LignePublication } from '@/lib/requetes';
import { demanderIA, adopterIA, rejeterIA } from '@/app/actions';
import { BoutonEnvoi } from './BoutonEnvoi';

interface Proposition {
  id: number;
  accroche: string;
  corps: string;
  appel: string;
  hashtags: string;
  note: string | null;
  consigne: string | null;
}

/**
 * Le bloc « réécriture IA » d'un post : demander, puis adopter ou rejeter.
 *
 * La proposition repasse par les **mêmes** garde-fous que le brouillon avant
 * d'être montrée : si l'IA a glissé une preuve interdite, ça se voit ici, et
 * le post adopté resterait de toute façon invalidable.
 */
export function AssistantIA({ p, retour, erreur }: { p: LignePublication; retour: string; erreur?: string }) {
  if (p.statut === 'publie') return null;
  const prop = db()
    .prepare("SELECT * FROM propositions_ia WHERE publication_id=? AND statut='en-attente' ORDER BY id DESC LIMIT 1")
    .get(p.id) as Proposition | undefined;
  const dispo = iaDisponible();

  if (prop) {
    const { constats, validable } = constatsDe({ ...p, ...prop, note: undefined } as unknown as LignePublication);
    const blocages = constats.filter((c) => c.niveau === 'blocage');
    const texte = [prop.accroche, prop.corps, prop.appel, prop.hashtags].filter(Boolean).join('\n\n');
    return (
      <div className="constat" data-n="conseil" style={{ marginTop: 12 }}>
        <div className="regle">Proposition de l&apos;IA — à adopter ou rejeter</div>
        {prop.note ? <div className="msg">{prop.note}</div> : null}
        {prop.consigne ? <div className="remede">Consigne : {prop.consigne}</div> : null}
        <pre className="bloc" style={{ maxHeight: 320, overflow: 'auto', whiteSpace: 'pre-wrap', marginTop: 8 }}>{texte}</pre>
        <div className="rang" style={{ gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          <span className="pastille" data-t={validable ? 'ok' : 'blocage'}>
            {validable ? 'passe les garde-fous' : `${blocages.length} blocage${blocages.length > 1 ? 's' : ''}`}
          </span>
          {blocages.map((c, i) => (
            <span key={i} className="pastille" data-t="blocage" title={c.message}>
              {c.regle}
            </span>
          ))}
        </div>
        <div className="rang" style={{ gap: 8, marginTop: 10 }}>
          <form action={adopterIA}>
            <input type="hidden" name="proposition" value={prop.id} />
            <input type="hidden" name="entite" value={p.entite} />
            <input type="hidden" name="retour" value={retour} />
            <button type="submit">Adopter (repasse « à relire »)</button>
          </form>
          <form action={rejeterIA}>
            <input type="hidden" name="proposition" value={prop.id} />
            <input type="hidden" name="entite" value={p.entite} />
            <input type="hidden" name="retour" value={retour} />
            <button type="submit" className="fantome">Rejeter</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <details style={{ marginTop: 10 }}>
      <summary className="aide" style={{ cursor: 'pointer' }}>✨ Réécrire avec l&apos;IA</summary>
      {erreur ? (
        <div className="constat" data-n="blocage" style={{ marginTop: 8 }}>
          <div className="msg">{erreur}</div>
        </div>
      ) : null}
      {dispo ? (
        <form action={demanderIA} style={{ marginTop: 8 }}>
          <input type="hidden" name="id" value={p.id} />
          <input type="hidden" name="entite" value={p.entite} />
          <input type="hidden" name="retour" value={retour} />
          <textarea
            name="consigne"
            rows={2}
            maxLength={600}
            placeholder="Consigne facultative : plus court, angle plus concret, ton plus direct…"
            style={{ width: '100%' }}
          />
          <div className="rang" style={{ marginTop: 6 }}>
            <BoutonEnvoi enCours="L’IA rédige… (10 à 30 s)">Proposer une réécriture</BoutonEnvoi>
            <span className="aide">Rien ne change tant que tu n&apos;as pas cliqué « Adopter ».</span>
          </div>
        </form>
      ) : (
        <div className="encart" style={{ marginTop: 8 }}>
          L&apos;assistance IA n&apos;est pas branchée : il manque la variable <code>ANTHROPIC_API_KEY</code> côté serveur
          (sur Vercel, en variable sensible).
        </div>
      )}
    </details>
  );
}
