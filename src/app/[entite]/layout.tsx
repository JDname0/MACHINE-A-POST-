import { notFound, redirect } from 'next/navigation';
import { estEntite } from '@/lib/marques';
import { connecte, protegee } from '@/lib/auth';
import { etatStockage } from '@/lib/persistance';

export default async function EntiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ entite: string }>;
}) {
  const { entite } = await params;
  if (!estEntite(entite)) notFound();
  if (!(await connecte())) redirect('/connexion');

  // L'interface ne doit jamais laisser croire à une protection ou à une
  // durabilité qui n'existent pas — c'est la même règle que sur DCR.
  const stockage = etatStockage();
  const avertissements: string[] = [];
  if (!protegee()) {
    avertissements.push(
      'Aucun mot de passe posé — l’outil est ouvert à quiconque atteint cette adresse (MACHINE_MOT_DE_PASSE).',
    );
  }
  if (!stockage.durable) avertissements.push(stockage.libelle);

  return (
    <div className="cadre" data-entite={entite}>
      {children}
      {avertissements.length > 0 ? (
        <div className="bandeau-bas">
          {avertissements.join(' · ')}
        </div>
      ) : null}
    </div>
  );
}
