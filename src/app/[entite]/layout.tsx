import { notFound, redirect } from 'next/navigation';
import { estEntite } from '@/lib/marques';
import { connecte, protegee } from '@/lib/auth';
import { etatStockage } from '@/lib/persistance';
import { RappelVideos } from '@/components/RappelVideos';
import { echeancesVideo, imagesMemoire, montagePret, reglagesVideo, visuelsDus, DELAIS } from '@/lib/production';
import type { EntiteSlug } from '@/lib/marques';

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

  // Les vidéos à produire aujourd'hui (ou en retard), selon le réglage choisi.
  const e = entite as EntiteSlug;
  const reglages = reglagesVideo(e);
  const dues = reglages.mode === 'boutons' ? [] : echeancesVideo(e).filter((x) => x.etat === 'aujourdhui' || x.etat === 'en-retard');
  const memoire = dues.length ? imagesMemoire(e) : [];
  const rappel = dues.map((x) => ({ publicationId: x.p.id, titre: x.p.titre ?? 'Sans titre', echeance: x.echeance, montage: montagePret(x.p, memoire) }));
  const quand = DELAIS.find((d) => d.jours === reglages.delai)?.libelle ?? '';
  const nbVisuels = reglages.mode === 'boutons' ? 0 : visuelsDus(e).length;

  return (
    <div className="cadre" data-entite={entite}>
      {children}
      <RappelVideos entite={entite} elements={rappel} visuels={nbVisuels} auto={reglages.mode === 'auto'} quand={quand} />
      {avertissements.length > 0 ? (
        <div className="bandeau-bas">
          {avertissements.join(' · ')}
        </div>
      ) : null}
    </div>
  );
}
