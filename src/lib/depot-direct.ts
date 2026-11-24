/**
 * Dépôt direct d'un fichier depuis le navigateur — un seul point d'entrée
 * pour la médiathèque, les posts faits ailleurs et les vidéos du studio.
 *
 * - **Vercel (store Blob)** : envoi direct au store, signé par la route
 *   `televerser`. Comportement inchangé.
 * - **Serveur à disque (o2switch, MAP_STOCKAGE=fichiers)** : la page porte
 *   `data-depot="morceaux"` ; le fichier part en morceaux vers la route
 *   `morceaux`, même plafond (300 Mo pour une vidéo).
 *
 * Dans les deux cas le navigateur appelle ensuite `enregistrerTeleversement`
 * avec le `pathname` renvoyé.
 */
export async function deposerDirect(
  entite: string,
  chemin: string,
  fichier: File,
  progres: (pourcent: number) => void,
): Promise<{ pathname: string }> {
  const parMorceaux = typeof document !== 'undefined' && document.querySelector('[data-depot="morceaux"]') !== null;
  if (!parMorceaux) {
    const { uploadPresigned } = await import('@vercel/blob/client');
    const blob = await uploadPresigned(chemin, fichier, {
      access: 'private',
      contentType: fichier.type,
      handleUploadUrl: `/${entite}/medias/televerser`,
      onUploadProgress: ({ percentage }) => progres(Math.round(percentage)),
    });
    return { pathname: blob.pathname };
  }

  const base = `/${entite}/medias/morceaux`;
  const lireErreur = async (r: Response) => {
    const j = (await r.json().catch(() => null)) as { erreur?: string } | null;
    return j?.erreur ?? `Erreur ${r.status}`;
  };

  const debut = await fetch(`${base}?etape=debut`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chemin, type: fichier.type, taille: fichier.size }),
  });
  if (!debut.ok) throw new Error(await lireErreur(debut));
  const { id, morceau } = (await debut.json()) as { id: string; morceau: number };

  let offset = 0;
  let essais = 0;
  progres(0);
  while (offset < fichier.size) {
    const tranche = fichier.slice(offset, Math.min(offset + morceau, fichier.size));
    let r: Response;
    try {
      r = await fetch(`${base}?id=${id}&offset=${offset}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: tranche,
      });
    } catch (e) {
      // Coupure réseau : on réessaie le même morceau, trois fois au plus.
      if (++essais > 3) throw e;
      await new Promise((ok) => setTimeout(ok, 1000 * essais));
      continue;
    }
    if (r.status === 409) {
      // Le serveur dit où il en est (morceau déjà reçu avant une coupure).
      const j = (await r.json()) as { recu: number };
      offset = j.recu;
      continue;
    }
    if (!r.ok) throw new Error(await lireErreur(r));
    offset = ((await r.json()) as { recu: number }).recu;
    essais = 0;
    progres(Math.min(99, Math.round((offset / fichier.size) * 100)));
  }

  const fin = await fetch(`${base}?etape=fin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!fin.ok) throw new Error(await lireErreur(fin));
  progres(100);
  return (await fin.json()) as { pathname: string };
}
