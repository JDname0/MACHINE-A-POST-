/**
 * L'adresse publique de l'outil, pour les liens absolus (rappels .ics, liens
 * temporaires de médias tirés par Instagram et TikTok).
 *
 * `MAP_URL_PUBLIQUE` (ex. « https://post.exemple.fr ») l'emporte quand elle
 * est posée : derrière un proxy (Passenger chez o2switch), les en-têtes de
 * la requête ne disent pas toujours le vrai nom ni le vrai protocole. Aucun
 * domaine n'est écrit dans le code : changer de domaine = changer la variable.
 * Sans elle, l'adresse se déduit des en-têtes, comme avant (Vercel, local).
 */
export function urlPublique(): string | null {
  const v = process.env.MAP_URL_PUBLIQUE?.trim();
  if (!v) return null;
  try {
    const u = new URL(v);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    return `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
}

/** L'adresse vue de l'extérieur : la variable, sinon les en-têtes de la requête. */
export function adresseDepuisEntetes(h: Headers, repli = 'localhost:3000'): string {
  const fixe = urlPublique();
  if (fixe) return fixe;
  const hote = h.get('x-forwarded-host') ?? h.get('host') ?? repli;
  // Le protocole se lit dans `x-forwarded-proto` plutôt que de se supposer :
  // derrière Vercel c'est `https`, en développement `http` (relevé le 2026-11-04).
  const protocole = h.get('x-forwarded-proto')?.split(',')[0]?.trim() ?? (hote.startsWith('localhost') || hote.startsWith('127.') ? 'http' : 'https');
  return `${protocole}://${hote}`;
}

/** Cookie de session réservé à HTTPS quand l'adresse publique est en HTTPS. */
export const cookieSecurise = () => urlPublique()?.startsWith('https://') ?? false;
