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
#
# Le module SQLite (better-sqlite3) est un binaire compilé. Le serveur
# o2switch « sun » a glibc 2.28 et aucun compilateur (relevé le 24/11/2026) ;
# le binaire précompilé officiel pour Node 22 exige glibc 2.29 (log, pow,
# exp de libm). Deux voies :
#
# O2_BINAIRE_SERVEUR : chemin, SUR LE SERVEUR, d'un better_sqlite3.node qui y
#               fonctionne déjà, de la MÊME version de better-sqlite3 (12.10.0)
#               et du même Node. Ex. celui de MagistrAI :
#               magistria/node_modules/better-sqlite3/build/Release/better_sqlite3.node
#               Il est copié dans l'app puis CHARGÉ par le Node du serveur avant
#               le redémarrage ; échec = arrêt, l'ancienne version reste en place.
# Sinon       : binaire précompilé (prebuild-install), refusé s'il exige une glibc
#               plus récente que O2_GLIBC_MAX (2.28 par défaut).
#
# O2_NODE     : le Node du serveur pour ce test (défaut : celui de cPanel,
#               nodevenv/<O2_APP>/<NODE_MAJEUR>/bin/node).
set -euo pipefail

: "${O2_HOTE:?O2_HOTE manquant (ex. compte@serveur.o2switch.net)}"
: "${O2_APP:?O2_APP manquant (ex. machine-a-post-app)}"
: "${NODE_MAJEUR:?NODE_MAJEUR manquant (20 ou 22, comme dans cPanel)}"

# Ce script ne doit toucher QUE la Machine à post : MagistrAI, les machines de
# prospection et le site veolt.fr vivent sur le même compte. Il n'écrit que
# dans ~/<O2_APP>, ~/<O2_APP>.nouveau et ~/<O2_APP>.precedent ; un binaire
# pris chez MagistrAI (O2_BINAIRE_SERVEUR) est seulement lu et copié.
case "$O2_APP" in
  *machine-a-post*) ;;
  *) echo "✖ O2_APP=$O2_APP : refusé, le dossier doit contenir « machine-a-post » (protection des autres applications)." >&2; exit 1 ;;
esac
case "$O2_APP" in */*|.*) echo "✖ O2_APP doit être un simple nom de dossier sous le home." >&2; exit 1 ;; esac

O2_GLIBC_MAX="${O2_GLIBC_MAX:-2.28}"
O2_BINAIRE_SERVEUR="${O2_BINAIRE_SERVEUR:-}"
O2_NODE="${O2_NODE:-nodevenv/$O2_APP/$NODE_MAJEUR/bin/node}"
VERSION_BSQ="$(node -p "require('./node_modules/better-sqlite3/package.json').version" 2>/dev/null || echo inconnue)"

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

BINAIRE_REL="node_modules/better-sqlite3/build/Release/better_sqlite3.node"

# La plus haute version de glibc qu'un binaire exige (vide si aucune).
glibc_requise() {
  strings "$1" | grep -oE 'GLIBC_2\.[0-9]+' | sed 's/GLIBC_//' | sort -t. -k1,1n -k2,2n | tail -1
}
# Vrai si $1 > $2 (versions 2.x).
plus_recente() {
  [ "$(printf '%s\n%s\n' "$1" "$2" | sort -t. -k1,1n -k2,2n | tail -1)" = "$1" ] && [ "$1" != "$2" ]
}

if [ -n "$O2_BINAIRE_SERVEUR" ]; then
  echo "▸ better-sqlite3 $VERSION_BSQ : binaire du serveur ($O2_BINAIRE_SERVEUR), posé après l'envoi"
  # Pas de binaire du Mac dans le paquet : celui du serveur le remplacera.
  rm -rf "$DIST/node_modules/better-sqlite3/build"
else
  echo "▸ better-sqlite3 $VERSION_BSQ pour Linux x64, Node $NODE_MAJEUR (précompilé)"
  ( cd "$DIST/node_modules/better-sqlite3" \
    && rm -rf build \
    && npx --yes prebuild-install --runtime node --target "$NODE_MAJEUR.0.0" --platform linux --arch x64 )
  test -f "$DIST/$BINAIRE_REL"
  REQUISE="$(glibc_requise "$DIST/$BINAIRE_REL")"
  echo "  glibc exigée : ${REQUISE:-aucune} (serveur : $O2_GLIBC_MAX)"
  if [ -n "$REQUISE" ] && plus_recente "$REQUISE" "$O2_GLIBC_MAX"; then
    echo "✖ Ce binaire exige glibc $REQUISE, le serveur n'a que $O2_GLIBC_MAX : il planterait à chaque requête." >&2
    echo "  Relancer avec O2_BINAIRE_SERVEUR=<chemin d'un better_sqlite3.node $VERSION_BSQ qui marche sur le serveur>" >&2
    echo "  (ex. magistria/node_modules/better-sqlite3/build/Release/better_sqlite3.node). Rien n'a été envoyé." >&2
    exit 1
  fi
fi

# Exécution côté serveur. O2_HOTE=local joue tout dans le dossier personnel
# courant (essai du script sans serveur).
distant() { if [ "$O2_HOTE" = local ]; then (cd "$HOME" && bash -s -- "$@"); else ssh "$O2_HOTE" bash -s -- "$@"; fi; }
cible() { if [ "$O2_HOTE" = local ]; then echo "$HOME/$1"; else echo "$O2_HOTE:$1"; fi; }

echo "▸ Envoi vers ~/$O2_APP.nouveau (l'application en place n'est pas touchée)"
distant "$O2_APP" <<'EOS'
set -e
rm -rf "$1.nouveau"
if [ -d "$1" ]; then cp -al "$1" "$1.nouveau"; else mkdir -p "$1.nouveau"; fi
EOS
rsync -az --delete --exclude 'tmp/' "$DIST/" "$(cible "$O2_APP.nouveau")/"

if [ -n "$O2_BINAIRE_SERVEUR" ]; then
  echo "▸ Pose du binaire SQLite du serveur"
  distant "$O2_APP" "$O2_BINAIRE_SERVEUR" "$O2_NODE" "$VERSION_BSQ" "$BINAIRE_REL" <<'EOS'
set -e
APP="$1"; BIN="$2"; NODE="$3"; ATTENDUE="$4"; REL="$5"
[ -f "$BIN" ] || { echo "✖ Binaire introuvable sur le serveur : $BIN" >&2; exit 1; }
PAQUET="$(cd "$(dirname "$(dirname "$(dirname "$BIN")")")" && pwd)"
V="$("$NODE" -p "require('$PAQUET/package.json').version" 2>/dev/null || echo '?')"
[ "$V" = "$ATTENDUE" ] || { echo "✖ Ce binaire vient de better-sqlite3 $V ; l'application attend $ATTENDUE." >&2; exit 1; }
mkdir -p "$APP.nouveau/$(dirname "$REL")"
cp "$BIN" "$APP.nouveau/$REL"
EOS
fi

echo "▸ Le module SQLite se charge-t-il avec le Node du serveur ?"
if ! distant "$O2_APP" "$O2_NODE" <<'EOS'
set -e
cd "$1.nouveau"
"$2" -e "const D=require('better-sqlite3');const d=new D(':memory:');d.prepare('select 1').get();d.close();console.log('  ✓ better-sqlite3 chargé, Node '+process.version)"
EOS
then
  echo "✖ better-sqlite3 ne se charge pas sur le serveur : rien n'a été basculé, l'application en place tourne toujours." >&2
  echo "  Node utilisé : $O2_NODE (à corriger avec O2_NODE si besoin)." >&2
  exit 1
fi

echo "▸ Bascule : ~/$O2_APP.nouveau devient ~/$O2_APP (l'ancienne version est gardée en $O2_APP.precedent)"
distant "$O2_APP" <<'EOS'
set -e
rm -rf "$1.precedent"
if [ -d "$1" ]; then mv "$1" "$1.precedent"; fi
mv "$1.nouveau" "$1"
mkdir -p "$1/tmp"
EOS

echo "▸ Redémarrage Passenger"
distant "$O2_APP" <<'EOS'
touch "$1/tmp/restart.txt"
EOS
echo "✓ Code envoyé. Vérifier le site (MISE-EN-LIGNE-O2SWITCH.md, étape 7)."
