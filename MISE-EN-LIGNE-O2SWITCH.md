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
| Adresse | **https://post.veolt.fr** (exemple retenu ; un autre domaine pourra s'ajouter) |

Dans les commandes, remplace `<compte>` par ton identifiant cPanel et
`<serveur>` par le serveur o2switch (ceux de Prospection).

Le nom de domaine n'est écrit **nulle part dans le code** : il ne vit que dans
la variable `MAP_URL_PUBLIQUE` (étape 4). Changer de domaine plus tard ne
demande aucune modification du code (voir « Changer ou ajouter un domaine »).

---

## 1. Sous-domaine et HTTPS

On démarre sur **`post.veolt.fr`** : `veolt.fr` est déjà dans ton cPanel, rien
à acheter. (Pour `veolt-magistrai.fr` plus tard, voir « Changer ou ajouter un
domaine ».)

1. **Sous-domaine `post`** : cPanel → **Domaines** → **Créer un domaine** →
   `post.veolt.fr`. Racine du document : laisse celle proposée
   (`/home/<compte>/post.veolt.fr`). L'application Node.js prendra ce
   sous-domaine à l'étape 3 ; ni le code ni les données n'iront dans ce
   dossier.
2. **DNS** : si la zone DNS de `veolt.fr` est gérée par o2switch, cPanel crée
   l'enregistrement tout seul. Si elle est gérée ailleurs (par exemple là où
   pointe le site `veolt.fr`), ajoute chez ce gestionnaire un enregistrement
   `A` pour `post` vers l'adresse IP du serveur o2switch (cPanel, colonne de
   droite « Adresse IP partagée »). **Ne touche pas** aux enregistrements de
   `veolt.fr` et `www` : le site vitrine ne doit pas bouger.
3. **Certificat** : cPanel → **SSL/TLS Status** → coche `post.veolt.fr` →
   **Run AutoSSL** (il faut que le DNS de l'étape 2 réponde déjà). Vérifie
   ensuite `https://post.veolt.fr` : cadenas valide, sans avertissement. Ne
   passe pas à l'étape 7 avant.

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
| Application URL | `post.veolt.fr` |
| Application startup file | `app.js` |

**Ne clique pas sur « Run NPM Install »** : le build envoyé contient déjà ses
dépendances, avec le module SQLite compilé pour le serveur.

## 4. Variables d'environnement (dans cPanel, jamais dans le dépôt)

Même écran → **Environment variables** → **Add variable** :

| Nom | Valeur |
|---|---|
| `MAP_URL_PUBLIQUE` | `https://post.veolt.fr` (sans `/` final) |
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
navigateur, sur `https://post.veolt.fr` :

1. La page de **connexion** s'affiche. Le mot de passe fonctionne.
2. **Calendrier Veolt** et **calendrier MagistrIA** : les posts sont là, aux
   bonnes dates (premier post le 24/11).
3. Ouvre un post avec une **image** : elle s'affiche.
4. Ouvre un post avec une **vidéo** : elle se lit et on peut avancer dedans.
5. Change l'heure d'un post, recharge : elle est restée.
6. `https://post.veolt.fr/api/qg/stats` sans jeton répond **401**.
7. Le bandeau « Aucun mot de passe posé » **n'apparaît pas**.

Par SSH, `ls ~/machine-a-post-donnees/sauvegardes` montre une sauvegarde datée
du démarrage.

**Dans QG** : remplace l'adresse `https://machine-a-post.vercel.app` par
`https://post.veolt.fr` (même jeton, même route), et espace l'appel à une
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

### À quoi sert `MAP_URL_PUBLIQUE`

Aux liens **absolus** que l'outil fabrique : rappels `.ics` (lien vers la
fiche du post) et liens temporaires vers un média (Instagram, TikTok vont le
chercher). Elle rend aussi le cookie de session réservé au HTTPS. Les
redirections internes sont relatives et le cookie n'est lié à aucun domaine :
ils marchent sur n'importe quelle adresse.

## Changer ou ajouter un domaine plus tard

Rien à modifier dans le code. Exemple : passer à `post.veolt-magistrai.fr`.

1. Si le domaine est neuf : l'acheter (de préférence chez o2switch, espace
   client → Domaines ; `veolt-magistrai.fr` était libre le 24/11/2026), puis
   l'ajouter dans cPanel → **Domaines** → **Créer un domaine** s'il n'y
   apparaît pas tout seul (acheté ailleurs : pointer d'abord ses DNS vers
   o2switch). Créer le sous-domaine (`post.veolt-magistrai.fr`), puis AutoSSL
   et vérifier le cadenas, comme à l'étape 1. La racine du domaine : rien, ou
   une redirection permanente (cPanel → Domaines → Redirections, 301) vers
   l'adresse de l'outil.
2. Setup Node.js App → **Application URL** : le nouveau nom.
   `MAP_URL_PUBLIQUE` : la nouvelle adresse. Puis **Restart**.
3. L'ancienne adresse : redirection permanente (301) vers la nouvelle, pour
   ne casser ni les favoris ni les liens des anciens rappels `.ics`.
4. Se reconnecter une fois (le cookie suit le nom de domaine), réimporter le
   fichier de rappels `.ics` dans l'agenda, et changer l'adresse dans QG.

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

- **Dépôt de fichiers** : sans store Blob, un gros fichier part **en
  morceaux de 5 Mo** vers l'outil (route `morceaux`), écrits à la suite sur le
  disque. Mêmes plafonds que sur Vercel (300 Mo par vidéo, 50 Mo par PDF,
  10 Mo par image), même barre de progression. Testé le 24/11 avec une vidéo
  de 300 Mo : fichier identique à l'octet, mémoire du serveur sous 250 Mo. Un
  envoi abandonné est effacé au bout de 24 h (`~/machine-a-post-donnees/envois/`).
- **Liens temporaires** (Instagram, TikTok vont chercher le fichier) : ils
  pointent vers `https://post.veolt.fr/…`, signés et datés, au lieu du store.
- **Mémoire** : ~125 Mo au démarrage, ~210 Mo en navigation (mesuré en local
  le 24/11). La génération des vidéos se fait dans le navigateur, pas sur le
  serveur.
- **En-têtes de sécurité** : identiques. Le HSTS, que Vercel ajoutait seul,
  est posé par l'application dans ce build.
