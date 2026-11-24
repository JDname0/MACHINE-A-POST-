# Mettre la Machine à post en ligne chez o2switch

Pas à pas pour Jonathan. Préparé le 24/11/2026, après la suspension du compte
Vercel Hobby (402 `DEPLOYMENT_DISABLED`). Même hébergement que MagistrAI et
MagistrAI Prospection : application Node.js de cPanel (Passenger).

**Principe.** Le code part du Mac (build), les données vivent sur le serveur
dans un dossier **hors de la racine web**. Aucun secret n'est écrit dans le
dépôt : tout se pose dans cPanel.

| Quoi | Où, chez o2switch |
|---|---|
| Application (code) | `~/machine-a-post-app/` |
| Données : `machine.db`, `medias/`, `sauvegardes/` | `~/machine-a-post-donnees/` |
| Adresse | un sous-domaine de ton choix, noté `<sous-domaine>` ci-dessous |

Dans les commandes, remplace `<compte>` par ton identifiant cPanel et
`<serveur>` par le serveur o2switch (ceux de Prospection).

---

## 1. Sous-domaine et HTTPS

1. cPanel → **Domaines** → **Créer un domaine** : `<sous-domaine>`.
   Racine du document : laisse celle proposée (l'application ne s'y sert pas ;
   les données n'y seront jamais).
2. cPanel → **SSL/TLS Status** → coche le sous-domaine → **Run AutoSSL**.
   Attends le cadenas vert avant l'étape 7.

## 2. Dossier des données

Par SSH :

```bash
ssh <compte>@<serveur>
mkdir -p ~/machine-a-post-donnees/medias ~/machine-a-post-donnees/sauvegardes
chmod 700 ~/machine-a-post-donnees
```

## 3. Application Node.js dans cPanel

cPanel → **Setup Node.js App** → **Create Application** :

| Champ | Valeur |
|---|---|
| Node.js version | **22** (sinon 20). Next 15.5 exige Node ≥ 18.18 ; garde la même majeure que `NODE_MAJEUR` à l'étape 6. |
| Application mode | Production |
| Application root | `machine-a-post-app` |
| Application URL | `<sous-domaine>` |
| Application startup file | `app.js` |

**Ne clique pas sur « Run NPM Install »** : le build envoyé contient déjà ses
dépendances, avec le module SQLite compilé pour le serveur.

## 4. Variables d'environnement (dans cPanel, jamais dans le dépôt)

Même écran → **Environment variables** → **Add variable** :

| Nom | Valeur |
|---|---|
| `MAP_STOCKAGE` | `fichiers` |
| `MAP_DOSSIER_DONNEES` | `/home/<compte>/machine-a-post-donnees` (chemin **absolu**) |
| `MACHINE_MOT_DE_PASSE` | ton mot de passe de l'outil |
| `MACHINE_CLE_SESSION` | une **nouvelle** clé : sur le Mac, `openssl rand -hex 32` |
| `ANTHROPIC_API_KEY` | si tu veux l'IA (rédaction, réécriture) |

Facultatif, seulement si tu t'en sers : `ELEVENLABS_API_KEY`, `RUNWAY_API_KEY`,
`OLLAMA_URL`, `OLLAMA_MODELE`, et les connecteurs réseaux (`LINKEDIN_JETON`,
`LINKEDIN_ORGANISATION_ID`, `META_JETON_LONGUE_DUREE`, `IG_COMPTE_ID`,
`TIKTOK_JETON`, `REDDIT_*`). `MAP_SAUVEGARDES_A_GARDER` (défaut 30) règle le
nombre de sauvegardes automatiques gardées.

Sans `MAP_DOSSIER_DONNEES`, l'application **refuse de démarrer** : c'est voulu,
elle n'écrira jamais la base dans un dossier deviné.

N'ajoute **pas** `BLOB_READ_WRITE_TOKEN` ni `BLOB_STORE_ID` : chez o2switch,
rien ne passe par Vercel.

## 5. Récupérer les données de Vercel, puis les envoyer

### 5a. Exporter depuis le Blob (sur le Mac)

```bash
cd ~/Desktop/machine-a-post
git checkout hebergement/o2switch && npm ci
vercel env pull .env.local --environment=production
node scripts/exporter-depuis-blob.mjs            # crée ./export-blob-AAAAMMJJ-HHMM/
```

Le script n'affiche jamais le jeton. Il vérifie la taille de chaque fichier,
l'intégrité de la base, et que chaque média référencé est présent. Il affiche
la place nécessaire (base + médias).

⚠️ **Si le Blob est coupé** par la suspension Hobby, le script s'arrête avec
« Store Blob inaccessible » (code 2). Deux issues :

- attendre la réouverture du Blob, puis relancer le script ;
- ou partir de la copie du Mac (`data/machine.db` et `data/medias/`), **si
  elle est à jour**. Tout ce qui a été fait en ligne depuis le dernier
  `envoyer-en-ligne.mjs` (validations, dépôts depuis le téléphone…) serait
  perdu. À ne choisir qu'en connaissance de cause.

### 5b. Envoyer vers le dossier des données (application arrêtée)

cPanel → Setup Node.js App → **Stop App**, puis, sur le Mac :

```bash
EXPORT=./export-blob-AAAAMMJJ-HHMM     # le dossier créé à l'étape 5a
# Si une base existe déjà là-bas, on la met de côté avant de l'écraser :
ssh <compte>@<serveur> 'cd ~/machine-a-post-donnees && [ -f machine.db ] && cp machine.db sauvegardes/avant-import-$(date +%Y%m%d-%H%M%S).db; rm -f machine.db-wal machine.db-shm; true'
rsync -av "$EXPORT/machine.db" <compte>@<serveur>:machine-a-post-donnees/
rsync -av "$EXPORT/medias/" <compte>@<serveur>:machine-a-post-donnees/medias/
```

Puis supprime le dossier d'export et `.env.local` du Mac, qui contiennent des
données réelles et un jeton :

```bash
rm -rf "$EXPORT" .env.local
```

## 6. Build et envoi du code (sur le Mac)

```bash
O2_HOTE=<compte>@<serveur> O2_APP=machine-a-post-app NODE_MAJEUR=22 \
  bash deploy/o2switch/deployer.sh
```

Le script fait le build `standalone`, récupère le module SQLite **pour Linux**
(celui du Mac ne tourne pas sur le serveur), envoie le code par rsync, sans
aucune donnée ni variable, et redémarre Passenger. Pour une mise à jour
ultérieure du code, c'est la seule commande à relancer.

## 7. Redémarrer et vérifier

cPanel → Setup Node.js App → **Start App** (ou **Restart**). Puis, dans le
navigateur, sur `https://<sous-domaine>` :

1. La page de **connexion** s'affiche. Le mot de passe fonctionne.
2. **Calendrier Veolt** et **calendrier MagistrIA** : les posts sont là, aux
   bonnes dates (premier post le 24/11).
3. Ouvre un post avec une **image** : elle s'affiche.
4. Ouvre un post avec une **vidéo** : elle se lit et on peut avancer dedans.
5. Change l'heure d'un post, recharge : elle est restée.
6. `https://<sous-domaine>/api/qg/stats` sans jeton répond **401**.
7. Le bandeau « Aucun mot de passe posé » **n'apparaît pas**.

Par SSH, `ls ~/machine-a-post-donnees/sauvegardes` montre une sauvegarde datée
du démarrage.

**Dans QG** : remplace l'adresse `https://machine-a-post.vercel.app` par
`https://<sous-domaine>` (même jeton, même route), et espace l'appel à une
fois par heure au plus.

### Si ça ne va pas : retour arrière

- **Le code** : relance l'étape 6 depuis le commit précédent
  (`git checkout <commit> && bash deploy/o2switch/deployer.sh`).
- **La base** : application arrêtée,
  `cp ~/machine-a-post-donnees/sauvegardes/<la-bonne>.db ~/machine-a-post-donnees/machine.db`
  et `rm -f ~/machine-a-post-donnees/machine.db-wal ~/machine-a-post-donnees/machine.db-shm`,
  puis redémarrage.
- Journal des erreurs de l'application : `~/machine-a-post-app/stderr.log`
  (ou le lien « Logs » dans Setup Node.js App).

## 8. Sauvegarde quotidienne (tâche planifiée cPanel)

En plus des instantanés automatiques (au démarrage, puis au plus un toutes les
10 minutes après un enregistrement ; 30 gardés), une copie par jour :

cPanel → **Tâches Cron** → une fois par jour, par exemple à 3 h 17 :

```
17 3 * * * MAP_DOSSIER_DONNEES=/home/<compte>/machine-a-post-donnees /home/<compte>/nodevenv/machine-a-post-app/22/bin/node /home/<compte>/machine-a-post-app/sauvegarder-base.mjs
```

(Le chemin exact de `node` est affiché en haut de l'écran Setup Node.js App,
dans la commande « source … activate ». Garde les 14 derniers jours :
`MAP_SAUVEGARDES_QUOTIDIENNES`.) Les copies vont dans
`~/machine-a-post-donnees/sauvegardes/quotidiennes/`.

Ces sauvegardes restent sur le même serveur. Pour une copie hors serveur, de
temps en temps depuis le Mac :
`rsync -av <compte>@<serveur>:machine-a-post-donnees/sauvegardes/quotidiennes/ ~/Sauvegardes/machine-a-post/`.

## 9. Le projet Vercel

**Garde-le tel quel, ne le supprime pas.** Il ne sert plus d'adresse
principale, mais il garde l'historique des déploiements et le store Blob (la
source de l'export). Le code reste compatible : sans `MAP_STOCKAGE`, il
fonctionne toujours en mode Blob. Un push sur `main` continuera de déclencher
un déploiement Vercel ; si tu veux l'éviter, déconnecte le dépôt dans les
réglages du projet (Git → Disconnect) plutôt que de supprimer le projet.

---

## Ce qui change par rapport à Vercel

- **Dépôt de vidéos** : sans store Blob, un dépôt passe par l'outil lui-même,
  plafonné à **40 Mo** par fichier. Pour une vidéo plus lourde, la compresser
  avant, ou la déposer directement dans `~/machine-a-post-donnees/medias/` puis
  l'inscrire (à faire avec Claude).
- **Liens temporaires** (Instagram, TikTok vont chercher le fichier) : ils
  pointent vers `https://<sous-domaine>/…`, signés et datés, au lieu du store.
- **Mémoire** : ~125 Mo au démarrage, ~210 Mo en navigation (mesuré en local
  le 24/11). La génération des vidéos se fait dans le navigateur, pas sur le
  serveur.
- **En-têtes de sécurité** : identiques. Le HSTS, que Vercel ajoutait seul,
  est posé par l'application dans ce build.
