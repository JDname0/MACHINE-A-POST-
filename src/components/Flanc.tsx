import Link from 'next/link';
import { marque, type EntiteSlug } from '@/lib/marques';
import { role, compteEquipeActif, LIBELLE_ROLE } from '@/lib/auth';

const PAGES = [
  ['', 'Tableau de bord'],
  ['aujourdhui', 'Aujourd’hui'],
  ['valider', 'À valider'],
  ['calendrier', 'Calendrier éditorial'],
  ['publications', 'Publications'],
  ['formats', 'Formats 2026'],
  ['visuels', 'Visuels et vidéos'],
  ['videos', 'Studio vidéo'],
  ['seo', 'SEO, articles, liens'],
  ['campagnes', 'Campagnes'],
  ['comptes', 'Comptes et connexions'],
  ['indicateurs', 'Indicateurs'],
  ['terrain', 'Terrain'],
  ['rapport', 'Rapport mensuel'],
  ['qualite', 'Qualité — superviseur'],
  ['journal', 'Journal — qui a fait quoi'],
] as const;

export async function Flanc({
  entite,
  page,
  compteurs,
}: {
  entite: EntiteSlug;
  page: string;
  compteurs?: Record<string, number>;
}) {
  const m = marque(entite);
  const autre: EntiteSlug = entite === 'veolt' ? 'magistria' : 'veolt';
  const qui = await role();
  return (
    <aside className="flanc">
      <div>
        <div className="marque-nom">{m.nom}</div>
        <div className="marque-sig">{m.signature}</div>
      </div>

      <div className="bascule">
        <Link href={`/${entite}`} data-actif="1">
          {m.nom}
        </Link>
        <Link href={`/${autre}`}>{marque(autre).nom}</Link>
      </div>

      <nav className="menu">
        {PAGES.map(([slug, nom]) => {
          const n = compteurs?.[slug || 'accueil'];
          return (
            <Link key={slug} href={`/${entite}${slug ? `/${slug}` : ''}`} data-actif={page === (slug || 'accueil') ? '1' : '0'}>
              <span>{nom}</span>
              {n != null && n > 0 ? <span className="cpt">{n}</span> : null}
            </Link>
          );
        })}
      </nav>

      <div className="flanc-pied">
        {qui && compteEquipeActif() ? (
          <div style={{ marginBottom: 8 }}>
            Connecté : <strong style={{ color: 'var(--encre)' }}>{LIBELLE_ROLE[qui]}</strong>
            {qui === 'equipe' ? (
              <>
                <br />
                Tu prépares ; la validation et la publication sont réservées à Jonathan.
              </>
            ) : null}
          </div>
        ) : null}
        <strong style={{ color: 'var(--encre)' }}>L&apos;outil propose, tu décides.</strong>
        <br />
        Rien ne part sans ton « oui », publication par publication.
      </div>
    </aside>
  );
}
