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
# NODE_MAJEUR : version majeure de Node choisie dans cPanel (22 : node:sqlite
#               exige Node ≥ 22.5).
#
# Base de données : chez o2switch, l'application utilise le SQLite INTÉGRÉ à
# Node 22 (node:sqlite, mode fichiers — voir src/lib/sqlite.ts). Le serveur
# « sun » a glibc 2.28 et aucun compilateur : aucun binaire de better-sqlite3
# n'y tourne (ni le précompilé, ni celui de MagistrAI, qui exigent glibc 2.29).
# Le script n'envoie donc pas ce binaire et vérifie node:sqlite sur place.
#
# O2_NODE     : le Node du serveur pour cet essai (défaut : celui de cPanel,
#               nodevenv/<O2_APP>/<NODE_MAJEUR>/bin/node, relatif au home).
set -euo pipefail

: "${O2_HOTE:?O2_HOTE manquant (ex. compte@serveur.o2switch.net)}"
: "${O2_APP:?O2_APP manquant (ex. machine-a-post-app)}"
: "${NODE_MAJEUR:?NODE_MAJEUR manquant (20 ou 22, comme dans cPanel)}"

# Ce script ne doit toucher QUE la Machine à post : MagistrAI, les machines de
# prospection et le site veolt.fr vivent sur le même compte. Il n'écrit que
# dans ~/<O2_APP>, ~/<O2_APP>.nouveau et ~/<O2_APP>.precedent.
case "$O2_APP" in
  *machine-a-post*) ;;
  *) echo "✖ O2_APP=$O2_APP : refusé, le dossier doit contenir « machine-a-post » (protection des autres applications)." >&2; exit 1 ;;
esac
case "$O2_APP" in */*|.*) echo "✖ O2_APP doit être un simple nom de dossier sous le home." >&2; exit 1 ;; esac

O2_NODE="${O2_NODE:-nodevenv/$O2_APP/$NODE_MAJEUR/bin/node}"

RACINE="$(cd "$(dirname "$0")/../.." && pwd)"
DIST="$RACINE/.deploiement-o2switch"
cd "$RACINE"

# Copies « … 2 » que macOS / iCloud laissent sur le Bureau (relevé le
# 25/11/2026 : `node_modules/@types/better-sqlite3 2` faisait échouer le
# build). Dans `node_modules/@types`, elles sont devenues sans effet : le
# tsconfig nomme ses types implicites. Dans `src/` ou `public/`, une copie
# serait compilée ou servie avec l'application : s'arrêter et les montrer,
# sans rien effacer soi-même.
echo "▸ Copies en double (« … 2 ») dans src/ et public/"
DOSSIERS_VUS=""; for d in src public deploy; do [ -d "$d" ] && DOSSIERS_VUS="$DOSSIERS_VUS $d"; done
# shellcheck disable=SC2086 # la liste de dossiers est voulue en mots séparés
DOUBLONS="$(find $DOSSIERS_VUS \( -name '* [0-9]' -o -name '* [0-9].*' \) -print 2>/dev/null | head -20 || true)"
if [ -n "$DOUBLONS" ]; then
  echo "✖ Copies en double trouvées : les supprimer (ou les renommer) avant de déployer." >&2
  printf '%s\n' "$DOUBLONS" | sed 's/^/    /' >&2
  exit 1
fi

# Le build ouvre la base locale avec better-sqlite3 (Next importe les routes
# pour « Collecting page data »). Son module natif doit correspondre au Node
# qui lance le build : relevé le 25/11/2026, module compilé pour Node 20
# (NODE_MODULE_VERSION 115) alors que le build tournait sous Node 22 (127).
# Ce module ne part pas sur le serveur (node:sqlite y sert) ; il ne compte
# que pour le build sur le Mac.
essai_sqlite() { node -e "new (require('better-sqlite3'))(':memory:').close()" >/dev/null 2>&1; }
echo "▸ Module SQLite du Mac adapté à Node $(node -v) ?"
if ! essai_sqlite; then
  echo "  ↻ compilé pour un autre Node : npm rebuild better-sqlite3"
  npm rebuild better-sqlite3
  if ! essai_sqlite; then
    echo "✖ better-sqlite3 ne se charge toujours pas avec Node $(node -v)." >&2
    echo "  Réinstaller les dépendances avec ce Node : npm ci, puis relancer ce script." >&2
    exit 1
  fi
fi
echo "  ✓ better-sqlite3 se charge"

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

echo "▸ better-sqlite3 non envoyé : le serveur utilise node:sqlite"
# Le binaire du Mac ne tournerait pas sur le serveur ; il n'y sert pas.
rm -rf "$DIST/node_modules/better-sqlite3/build"

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

echo "▸ SQLite (node:sqlite) fonctionne-t-il avec le Node du serveur ?"
if ! distant "$O2_APP" "$O2_NODE" <<'EOS'
set -e
# Chemin du Node relatif = relatif au dossier personnel, pas à l'app.
case "$2" in /*) NODE="$2" ;; *) NODE="$HOME/$2" ;; esac
[ -x "$NODE" ] || { echo "  ✖ Node introuvable sur le serveur : $NODE" >&2; exit 1; }
cd "$1.nouveau"
"$NODE" --no-warnings -e "const {DatabaseSync}=process.getBuiltinModule('node:sqlite');const d=new DatabaseSync(':memory:');d.exec('create table t(x)');d.prepare('insert into t values (?)').run(1);if(d.prepare('select count(*) n from t').get().n!==1)throw new Error('lecture');d.close();console.log('  ✓ node:sqlite opérationnel, Node '+process.version)"
EOS
then
  echo "✖ node:sqlite ne fonctionne pas avec ce Node : rien n'a été basculé, l'application en place tourne toujours." >&2
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
