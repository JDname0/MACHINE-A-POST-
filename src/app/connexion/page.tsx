import { protegee } from '@/lib/auth';
import { seConnecter } from '../actions';
import { redirect } from 'next/navigation';

export default async function Connexion({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  if (!protegee()) redirect('/veolt');
  const { erreur } = await searchParams;
  return (
    <main className="centre-ecran">
      <form action={seConnecter} className="carte" style={{ maxWidth: 380, width: '100%' }}>
        <h1 style={{ fontSize: 20 }}>Machine à post</h1>
        <p style={{ marginTop: 6, marginBottom: 16 }}>Veolt · MagistrIA — usage interne.</p>
        <div className="champ">
          <label htmlFor="mdp">Mot de passe</label>
          <input id="mdp" name="motDePasse" type="password" autoFocus required />
        </div>
        {erreur ? (
          <p style={{ color: 'var(--blocage)', fontSize: 13, marginBottom: 12 }}>Mot de passe incorrect.</p>
        ) : null}
        <button type="submit">Entrer</button>
      </form>
    </main>
  );
}
