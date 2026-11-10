/**
 * Couper un titre en deux lignes — partagé par les visuels (serveur) et le
 * studio vidéo (navigateur), pour que les cartes d'une vidéo soient coupées
 * exactement comme les visuels publiés.
 */

export function deuxLignes(titre: string): { ligne1: string; ligne2: string } {
  const s = titre.trim();
  const mots = s.split(/\s+/);
  if (mots.length < 3) return { ligne1: '', ligne2: s };

  // 1. Une ponctuation forte à peu près au milieu : c'est la meilleure coupe,
  //    parce qu'elle tombe là où le lecteur s'arrête déjà.
  const bas = s.length * 0.3;
  const haut = s.length * 0.72;
  let meilleure = -1;
  let ecartP = Infinity;
  for (const m of s.matchAll(/[.:;—–?!,]\s+/g)) {
    const fin = m.index! + m[0].length;
    if (fin < bas || fin > haut) continue;
    const ecart = Math.abs(fin - s.length / 2);
    if (ecart < ecartP) {
      ecartP = ecart;
      meilleure = fin;
    }
  }
  if (meilleure > 0) {
    return { ligne1: s.slice(0, meilleure).trim(), ligne2: s.slice(meilleure).trim() };
  }

  // 2. Sinon, la frontière de mot la plus proche du milieu.
  const cible = s.length / 2;
  let coupe = 1;
  let ecart = Infinity;
  for (let i = 1; i < mots.length; i++) {
    const g = mots.slice(0, i).join(' ').length;
    if (Math.abs(g - cible) < ecart) {
      ecart = Math.abs(g - cible);
      coupe = i;
    }
  }
  return { ligne1: mots.slice(0, coupe).join(' '), ligne2: mots.slice(coupe).join(' ') };
}
