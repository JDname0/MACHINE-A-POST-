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

  // 2. Sinon, la frontière de mot la plus proche du milieu — mais jamais
  //    après un petit mot (« le », « de », « pour »…) : « Avant, le / slogan »
  //    laisse l'article en l'air. Une virgule proche du début vaut mieux.
  const cible = s.length / 2;
  const petit = /^(le|la|les|l’|l'|un|une|des|de|du|d’|d'|et|à|au|aux|en|sur|pour|par|qui|que|ce|se|ne|on|nous|vous|son|sa|ses|votre|vos|notre|nos)$/i;
  let coupe = 1;
  let ecart = Infinity;
  for (let i = 1; i < mots.length; i++) {
    if (petit.test(mots[i - 1]) && mots.length > 3) continue;
    // Au moins deux mots par ligne dès quatre mots : « Ce / que vous recevez » se lit mal.
    if (mots.length >= 4 && (i < 2 || mots.length - i < 2)) continue;
    const g = mots.slice(0, i).join(' ').length;
    // Une virgule en fin de première ligne est une pause naturelle : elle gagne à écart presque égal.
    const d = Math.abs(g - cible) - (/[,;:]$/.test(mots[i - 1]) ? 6 : 0);
    if (d < ecart) {
      ecart = d;
      coupe = i;
    }
  }
  return { ligne1: mots.slice(0, coupe).join(' '), ligne2: mots.slice(coupe).join(' ') };
}
