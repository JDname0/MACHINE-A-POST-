#!/usr/bin/env bash
#
# Change le mot de passe de la Machine à post.
#
# Le mot de passe est saisi ici, en local et masqué : il ne transite par aucune
# conversation et n'est écrit nulle part ailleurs que dans SECRETS-A-GARDER.txt
# (non versionné) et dans les variables chiffrées de Vercel.
#
# La clé de session est **régénérée en même temps**, volontairement : le cookie
# est signé par cette clé et non dérivé du mot de passe. Sans cette rotation,
# changer le mot de passe ne déconnecterait personne — une session ouverte
# ailleurs resterait valide, ce qui est exactement ce qu'on cherche à éviter.

set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .vercel/project.json ]; then
  echo "✗ Projet Vercel non relié. Lancer d'abord : npx vercel link" >&2
  exit 1
fi

# La saisie masquée exige un vrai terminal. Si le script est lancé depuis un
# bouton ou un contexte sans terminal, on accepte le mot de passe en argument —
# mais on le dit, parce qu'il atterrit alors dans l'historique du shell.
if [ -t 0 ]; then
  printf 'Nouveau mot de passe (invisible à la frappe) : '
  read -rs MDP
  echo
  printf 'Confirmer                                    : '
  read -rs MDP2
  echo
  if [ "$MDP" != "$MDP2" ]; then
    echo "✗ Les deux saisies diffèrent. Rien n'a été changé." >&2
    exit 1
  fi
elif [ $# -ge 1 ]; then
  MDP="$1"
  echo "⚠ Mot de passe passé en argument : il reste dans l'historique du shell."
  echo "  Pour l'en retirer :  history -d \$(history 1 | awk '{print \$1}')"
else
  echo "✗ Pas de terminal pour la saisie masquée." >&2
  echo "  Ouvre Terminal et lance :  ~/Desktop/machine-a-post/scripts/changer-mot-de-passe.sh" >&2
  echo "  Ou passe le mot de passe en argument (il ira dans l'historique du shell)." >&2
  exit 1
fi
if [ ${#MDP} -lt 8 ]; then
  echo "✗ Huit caractères minimum. Le lien est public : le mot de passe est le seul rempart." >&2
  exit 1
fi

CLE=$(node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))")

echo "→ Pose des variables sur Vercel (production)…"
npx vercel env rm MACHINE_MOT_DE_PASSE production --yes >/dev/null 2>&1 || true
npx vercel env rm MACHINE_CLE_SESSION  production --yes >/dev/null 2>&1 || true
printf '%s' "$MDP" | npx vercel env add MACHINE_MOT_DE_PASSE production --sensitive >/dev/null
printf '%s' "$CLE" | npx vercel env add MACHINE_CLE_SESSION  production --sensitive >/dev/null

echo "→ Mise à jour des fichiers locaux…"
cat > SECRETS-A-GARDER.txt <<EOF
Machine à post — secrets de production
Mis à jour le $(date +%Y-%m-%d). Ce fichier est ignoré par git.
Ne pas le committer, ne pas le coller dans un chat.

MACHINE_MOT_DE_PASSE=$MDP
MACHINE_CLE_SESSION=$CLE

Le mot de passe est celui à saisir sur l'écran de connexion du site déployé.
Un seul mot de passe pour les deux entités : Veolt et MagistrIA sont deux
sections cloisonnées du même outil, pas deux comptes.
La clé de session signe le cookie — elle vient d'être régénérée, donc toutes
les sessions ouvertes sont tombées.
EOF
node -e "
const fs=require('fs');
const garder=(fs.existsSync('.env.local')?fs.readFileSync('.env.local','utf8').split('\n'):[])
  .filter(l=>l && !l.startsWith('MACHINE_MOT_DE_PASSE=') && !l.startsWith('MACHINE_CLE_SESSION='));
garder.push('MACHINE_MOT_DE_PASSE=' + process.argv[1], 'MACHINE_CLE_SESSION=' + process.argv[2], '');
fs.writeFileSync('.env.local', garder.join('\n'));
" "$MDP" "$CLE"

unset MDP MDP2 CLE

echo "→ Déploiement…"
npx vercel deploy --prod --yes 2>&1 | grep -oE 'https://machine-a-post\.vercel\.app' | head -1

echo
echo "✓ Terminé. Le nouveau mot de passe est actif sur https://machine-a-post.vercel.app"
echo "  Les sessions précédentes ont été coupées : il faut se reconnecter."
echo "  Copie de secours : SECRETS-A-GARDER.txt (jamais versionné)."
