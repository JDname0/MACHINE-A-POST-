import { DELAIS, MODES, reglagesVideo } from '@/lib/production';
import { majReglagesVideo } from '@/app/actions';
import type { EntiteSlug } from '@/lib/marques';

/**
 * Quand et comment produire les contenus d'une entité — visuels et vidéos.
 * Le même formulaire dans le calendrier et dans le studio : un seul réglage.
 */
export function ReglagesProduction({ entite, retour, enregistre }: { entite: EntiteSlug; retour: string; enregistre?: boolean }) {
  const r = reglagesVideo(entite);
  return (
    <form action={majReglagesVideo} className="encart" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'end', marginBottom: 16 }}>
      <input type="hidden" name="entite" value={entite} />
      <input type="hidden" name="retour" value={retour} />
      <div style={{ flex: '1 1 260px' }}>
        <strong>Quand produire les visuels et les vidéos</strong>
        <div className="aide">
          {enregistre ? '✅ Réglages enregistrés. ' : ''}Le jour venu, l&apos;outil te le rappelle sur toutes ses pages — ou
          produit tout seul à l&apos;ouverture en mode automatique. Rien ne part sans ta validation.
        </div>
      </div>
      <label>
        <div className="aide">Moment</div>
        <select name="delai" defaultValue={String(r.delai)}>
          {DELAIS.map((d) => (
            <option key={d.jours} value={d.jours}>
              {d.libelle}
            </option>
          ))}
        </select>
      </label>
      <label>
        <div className="aide">Mode</div>
        <select name="mode" defaultValue={r.mode}>
          {MODES.map((x) => (
            <option key={x.slug} value={x.slug}>
              {x.libelle}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className="fantome">
        Enregistrer
      </button>
    </form>
  );
}
