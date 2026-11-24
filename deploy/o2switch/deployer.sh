#!/usr/bin/env bash
# Build sur le Mac, puis envoi du code chez o2switch par SSH (modèle :
# deploy/deployer.sh de MagistrAI Prospection). N'envoie JAMAIS de données :
# la base et les médias vivent dans le dossier de données, hors de l'app.
#
#   O2_HOTE=<compte>@<serveur> O2_APP=machine-a-post-app NODE_MAJEUR=22 \
#     bash deploy/o2switch/deployer.sh
#
# O2_APP      : dossier de l'application sous le home du compte (celui déclaré
#               dans cPanel « Setup Node.js App »).
# NODE_MAJEUR : version majeure de Node choisie dans cPanel (20 ou 22). Sert à
#               récupérer le binaire better-sqlite3 pour Linux x64 : celui du
#               Mac ne tourne pas sur le serveur.
set -euo pipefail

: "${O2_HOTE:?O2_HOTE manquant (ex. compte@serveur.o2switch.net)}"
: "${O2_APP:?O2_APP manquant (ex. machine-a-post-app)}"
: "${NODE_MAJEUR:?NODE_MAJEUR manquant (20 ou 22, comme dans cPanel)}"

RACINE="$(cd "$(dirname "$0")/../.." && pwd)"
DIST="$RACINE/.deploiement-o2switch"
cd "$RACINE"

echo "▸ Build standalone"
rm -rf .next "$DIST"
MAP_BUILD_STANDALONE=1 npm run build

# Le build doit avoir server.js à la racine du standalone. Sinon Next a pris
# un dossier parent pour racine (un package-lock.json qui traîne plus haut) :
# s'arrêter ici plutôt que d'envoyer un paquet inutilisable.
if [ ! -f .next/standalone/server.js ] || [ ! -d .next/standalone/node_modules/better-sqlite3 ]; then
  echo "✖ Build standalone imbriqué : .next/standalone/server.js absent à la racine." >&2
  echo "  Trouvé :" >&2
  find .next/standalone -maxdepth 6 -name server.js -not -path '*/node_modules/*' 2>/dev/null | head -3 >&2
  echo "  Cause probable : un package-lock.json dans un dossier parent (ex. ~/package-lock.json)." >&2
  exit 1
fi

echo "▸ Assemblage"
cp -R .next/standalone "$DIST"
mkdir -p "$DIST/.next"
cp -R .next/static "$DIST/.next/static"
[ -d public ] && cp -R public "$DIST/public"
cp deploy/o2switch/app.js deploy/o2switch/sauvegarder-base.mjs "$DIST/"
# Rien de local ne doit partir : ni base, ni médias, ni variables.
rm -rf "$DIST/data" "$DIST/.env" "$DIST/.env.local" "$DIST"/.env.*

echo "▸ better-sqlite3 pour Linux x64, Node $NODE_MAJEUR"
( cd "$DIST/node_modules/better-sqlite3" \
  && rm -rf build \
  && npx --yes prebuild-install --runtime node --target "$NODE_MAJEUR.0.0" --platform linux --arch x64 )
test -f "$DIST/node_modules/better-sqlite3/build/Release/better_sqlite3.node"

echo "▸ Envoi vers $O2_HOTE:~/$O2_APP (le dossier tmp/ de Passenger est conservé)"
rsync -az --delete --exclude 'tmp/' "$DIST/" "$O2_HOTE:$O2_APP/"

echo "▸ Redémarrage Passenger"
ssh "$O2_HOTE" "mkdir -p '$O2_APP/tmp' && touch '$O2_APP/tmp/restart.txt'"
echo "✓ Code envoyé. Vérifier le site (MISE-EN-LIGNE-O2SWITCH.md, étape 7)."
