import Link from 'next/link';
import { marque, type EntiteSlug } from '@/lib/marques';

const PAGES = [
  ['', 'Tableau de bord'],
  ['calendrier', 'Calendrier éditorial'],
  ['publications', 'Publications'],
  ['formats', 'Formats 2026'],
  ['visuels', 'Visuels et vidéos'],
  ['seo', 'SEO, articles, liens'],
  ['campagnes', 'Campagnes'],
  ['comptes', 'Comptes et connexions'],
  ['indicateurs', 'Indicateurs'],
] as const;

export function Flanc({
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
        <strong style={{ color: 'var(--encre)' }}>L&apos;outil propose, tu décides.</strong>
        <br />
        Rien ne part sans ton « oui », publication par publication.
      </div>
    </aside>
  );
}
