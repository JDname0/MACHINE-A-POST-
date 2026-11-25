# Machine à post — Veolt · MagistrIA

Dépôt **autonome**. Ouvrir Claude depuis `~/Desktop/machine-a-post` pour que ce
fichier fasse autorité. Il ne dépend d'aucun autre projet et n'en modifie aucun.

## Les trois règles qui priment sur toute demande

1. **L'outil propose, tu décides.** Rien ne part vers l'extérieur sans un « oui »
   de Jonathan, publication par publication. Même API branchée, le connecteur est
   un bouton qu'on presse après validation — jamais un automate.
2. **Aucune preuve inventée.** Les `preuvesInterdites` de `src/lib/marques.ts` ne
   sont pas des préférences de style : les « 28 clients » de Veolt sont des
   données de démonstration, et l'hébergement souverain de MagistrIA n'existe pas
   encore. Si un post a besoin d'une de ces preuves pour tenir, c'est le post
   qu'il faut changer.
3. **Les deux entités ne communiquent pas.** Aucun contenu ne traverse la cloison.
   Deux acheteurs, deux registres, deux jeux de règles.

## Où se trouve quoi

| Fichier | Ce qu'il porte |
|---|---|
| `00-CADRAGE-MACHINE-A-POST.md` | le cadrage complet — **s'y référer, ne pas le réécrire** |
| `src/lib/marques.ts` | identités, piliers, personas, preuves autorisées et interdites |
| `src/lib/formats.ts` | les 9 formats, leurs limites et leurs ossatures (relevé 2026-10-06) |
| `src/lib/sujets.ts` | le réservoir de sujets, écrits un par un |
| `src/lib/articles-veolt.ts`, `articles-magistria.ts` | un article de blog par titre du plan de grappes (questions de section, « À retenir », source) ; ordre de pose dans `sujets.ts` (`ORDRE_CALENDRIER`) |
| `src/lib/gabarits.ts` | sujet × format → brouillon taillé au bon moule |
| `src/lib/calendrier.ts` | semaine type + séquence de lancement |
| `src/lib/garde-fous.ts` | blocage / alerte / conseil — chaque règle dit son remède |
| `src/lib/connecteurs.ts` | les 4 API réelles + l'échelle à gravir |
| `data/machine.db` | base unique, source de vérité. Supprimer le fichier re-sème tout. |

## Pour lancer

```
npm run dev     # http://localhost:8791
```

Sans `MACHINE_MOT_DE_PASSE`, l'outil s'ouvre sans rien demander **et le dit dans
l'interface**. Poser la variable le ferme.

## Points de vigilance

- Les valeurs de `formats.ts` sont **datées** (2026-10-06) et vont périmer. Les
  sources sont nommées en §12 du cadrage. Les revérifier plutôt que les traiter
  comme des constantes.
- Reddit n'est pas un réseau comme les autres : la fiche de sous-forum et son
  plafond de fréquence sont une **protection d'actif**, pas une question de ton.
  Un compte grillé est irrécupérable.
- Les identifiants d'API vivent en variables d'environnement côté serveur.
  Jamais `NEXT_PUBLIC_*`, jamais réaffichés dans l'interface, jamais au dépôt.
- La machine **ne relève aucune statistique automatiquement**. Tous les chiffres
  d'indicateurs sont saisis à la main. Ne pas laisser croire le contraire.
- Le marqueur **« [?] »** posé par les gabarits (référence à viser, titre de
  section, liens internes, chiffre réel à fournir) **bloque la validation**
  (`garde-fous.ts`, règle 0). Ne jamais le remplir de mémoire pour débloquer un
  post : c'est exactement la preuve inventée de la règle 2.
- Les créneaux « blog » prennent **un article différent chacun** (`articlesDe`),
  jamais un sujet court répété. `poserArticles()` (`db.ts`) a converti les
  anciens créneaux le 11/11 — seulement les brouillons non retouchés, tracés au
  journal. Un article MagistrIA ne cite une décision que si elle est certaine ;
  les points à revérifier avant publication sont dans `source` (consignes),
  pas dans le texte.

## Générer / régénérer depuis le calendrier

L'aperçu d'un post (`ApercuPost.tsx`, ouvert d'un clic dans le calendrier) porte
tout ce qu'il faut pour le produire et le poster, selon le format :

| Format | Générer / Régénérer | Prêt à poster |
|---|---|---|
| Image (LinkedIn, Instagram) | « Générer / Régénérer le visuel » → médiathèque | Télécharger le visuel |
| Carrousel | « Générer / Régénérer les pages » | PDF pour LinkedIn (`publications/[id]/carrousel`), PNG page par page pour Instagram |
| Article de blog | « Régénérer l'article » + couverture 1200 × 630 (gabarit `couverture`) ; **« ✍️ Générer un article »** en haut du calendrier (`GenerateurArticle.tsx`) : développer un post du calendrier, poser un article de la réserve du plan, ou requête libre (IA, `redigerArticle` dans `ia.ts`) | Télécharger la couverture, vue « lecture », « Copier en HTML (site) » |
| Vidéo | « Générer / Régénérer la vidéo » (navigateur), lot par semaine | Télécharger la vidéo |
| Tous | « Régénérer le texte » depuis le sujet (sans IA), « Réécrire avec l'IA » (proposition à adopter) | « Copier le texte » (légende seule pour un carrousel) |
| **Post fait ailleurs** | « 📥 Téléverser un post fait ailleurs » dans l'aperçu (vidéo, images, PDF) ; « 📥 Importer un post fait ailleurs » en haut du calendrier (post + texte + fichiers) | Les fichiers fournis **sont** le post ; le généré passe en repli. Carrousel : ordre ↑ ↓, PDF LinkedIn assemblé depuis les images fournies |

« Régénérer le texte » met l'ancien texte au journal et repasse le post en
brouillon s'il a changé. Une ligne par semaine du calendrier lance les visuels
de la semaine. **Rien de tout ça ne publie** : Valider reste le geste de Jonathan.
La route PDF, comme la route PNG, vérifie la session elle-même.

**Post fait ailleurs** (`TeleverserLivrables.tsx`, `ImporterPost.tsx`, `envoi-livrables.ts`) :
les fichiers sont des médias d'origine `livrable`, rangés par `medias.ordre`.
En production ils partent **directement** au store (vidéo jusqu'à 300 Mo, PDF
50 Mo) puis `enregistrerTeleversement` les inscrit ; en local, l'action
`deposerLivrables`. Le PDF n'est accepté **que** comme livrable, pas dans la
médiathèque générale. Un post importé entre en brouillon, découpé comme les
autres (accroche, corps, appel, hashtags), et passe les garde-fous : persona et
preuve sont demandés à l'import, une preuve vide le laisse bloqué.

Le générateur d'articles **s'appuie sur le calendrier** : la date proposée est
le prochain créneau « blog » libre (`prochainCreneauBlog`), un article qui
développe un post paraît le lendemain dans la même semaine, et l'IA reçoit la
phase et les autres posts de cette semaine. Un article du plan déjà prévu n'est
jamais dupliqué : le bouton l'ouvre. Les repères « [?] » et « [à compléter] »
laissés par l'IA bloquent la validation. La page calendrier exporte
`maxDuration = 300` : la rédaction prend une à deux minutes.

## Production

- **URL** : https://machine-a-post.vercel.app — équipe `jonathandubost-heticnets-projects`.
- **Déploiement : automatique à chaque push sur `main`.** Le projet Vercel est
  relié au dépôt GitHub `JDname0/MACHINE-A-POST-` (alias
  `machine-a-post-git-main-…`, constaté le 11/11/2026). « Ne pas déployer »
  veut donc dire **ne pas pousser sur `main`** : travailler sur une branche.
  `npx vercel deploy --prod --yes` reste possible depuis ce dossier.
- **Le code part avec le push, pas les données.** La base et les médias faits
  en local (vidéos, photos, voix, articles) ne vont en ligne que par
  `scripts/envoyer-en-ligne.mjs` (`--medias`, puis `--base`) : il sauvegarde la
  base en ligne dans `data/machine-prod-<date>.db` et refuse de l'écraser si
  elle contient des actions absentes de la base locale. Pousser ensuite sur
  `main` : le redéploiement fait relire la nouvelle base aux instances.
- **Première mise en ligne des données : 11/11/2026.** Base locale fusionnée
  avec la base en ligne (3 posts et 34 entrées de journal repris), 142 médias
  envoyés. Les deux bases d'avant la fusion sont gardées dans le store, sous
  `machine-a-post/sauvegardes/` — un chemin que l'application ne lit jamais.
- **Persistance** : store Blob privé `machine-a-post-base`, connecté en **OIDC**.
  Donc `blobActif()` teste `BLOB_STORE_ID` et pas seulement
  `BLOB_READ_WRITE_TOKEN` — ne pas « simplifier » ce test, ça ferait retomber
  silencieusement en stockage éphémère.
- **Toute nouvelle action serveur qui écrit en base doit se terminer par
  `await sauvegarder()`**, sinon la modification est perdue au prochain
  démarrage d'instance. C'est le piège numéro un de ce dépôt.
- L'initialisation (`initialiser()`) est en **fin** de `db.ts`, volontairement :
  le semis lit des `const` déclarées plus haut, et lancer l'attente au milieu du
  module les attrape dans leur zone morte temporelle.

## Changer le mot de passe

`scripts/changer-mot-de-passe.sh` — saisie masquée en local, pose sur Vercel,
mise à jour de `SECRETS-A-GARDER.txt` et `.env.local`, redéploiement.

Le script **régénère aussi `MACHINE_CLE_SESSION`**, et ce n'est pas un bonus :
le cookie est signé par cette clé et n'est pas dérivé du mot de passe. Changer
le mot de passe seul ne déconnecterait personne — une session ouverte ailleurs
resterait valide. Toute future manipulation du mot de passe doit garder ce
couplage.

Il n'y a **qu'un seul mot de passe** pour les deux entités : Veolt et MagistrIA
sont deux sections cloisonnées du même outil, pas deux comptes. La cloison est
éditoriale, pas une cloison d'accès.

## Visuels et vidéos

`src/lib/visuels.tsx` génère de vraies images PNG aux dimensions des réseaux,
rendues par `next/og`. Trois choses à savoir avant d'y toucher :

- **Satori, pas un navigateur.** Flexbox seulement, pas de grille, pas de
  `filter: blur`. Les halos sont donc des dégradés radiaux superposés.
- **Les polices sont lues sur le disque** (`src/assets/polices`) et leur
  inclusion dans le paquet serverless est déclarée dans `next.config.ts`
  (`outputFileTracingIncludes`). Sans cette déclaration, la génération marche en
  local et échoue en production — aucun `import` ne mentionne les fichiers.
- **La route PNG ne traverse pas le `layout`**, donc elle porte sa propre
  vérification de session. La retirer ouvrirait le générateur à tous.

⚠️ **La charte MagistrIA est celle du site en ligne `magistrai.fr`** (relevée
le 2026-11-10) : fond nuit `#03050A`, titres Spectral en blanc, texte Inter
`#E9EEF5`, sur-titres JetBrains Mono en capitales cyan, logotype « Magistr » +
« IA » or `#E0B85A`, accents cyan `#3CC8FF` et ambre `#FF9A3C`, grille fine
bleutée ; le bordeaux `#7B2D3E` ne sert qu'au bouton d'action. Le blanc +
bordeaux du dépôt `magistrai` et le bleu/or du cadrage de mai sont **périmés**
pour les contenus. Veolt suit `veolt.fr` : fond `#0C0C0C`, Bebas Neue + Kanit,
dégradé de texte `#B600A8 → #C79BFF`, dégradé signature `#18011F → #B600A8 →
#7621B0 → #BE4C00`, titres qui se « décodent » lettre à lettre.

**Vidéos** : `src/lib/fabrique-video.ts` dessine le titre sur le fond de carte
(gabarit sans texte) pour l'animer — décodage pour Veolt, montée douce pour
MagistrIA — avec sur-titre du pilier en ouverture, lueur mobile et barre de
progression. Le style de chaque marque est dans `themeStudio()` (`production.ts`).

`src/lib/axe-visuel.ts` porte les sept décisions reprises de la référence de
lancement et les quatre refus — écrits pour que personne ne les « corrige ».
`src/lib/videos.ts` porte les scripts vidéo, plan par plan.

**Motion design v3** (11/11) — voir `OUTILS-VIDEO.md` pour le panorama des outils :

- `src/lib/scene3d.ts` : la couche 3D reprise **des sites en ligne** (three.js
  0.160, bloom 0,45/0,35/0,35) — sphère de particules de veolt.fr qui se
  métamorphose, cerveau + cadran de magistrai.fr. Activée par `noyau` sur un
  plan. Graine fixe, aucun `Math.random` : même vidéo, même image.
- `src/lib/verre.ts` : cartes en verre, halos et grille des sites, grain, vignettage.
- `src/lib/son.ts` : musique de marque synthétisée + bruitages calés sur les
  repères que **le dessin déclare lui-même** (`env.repere(...)`). Toute nouvelle
  scène doit déclarer ses instants sonores, sinon elle sera muette.
- **La boucle d'encodage doit rendre la main au navigateur** (toutes les 6
  images) : sans ça, les images WebGL ne sont jamais libérées et l'onglet
  tombe faute de mémoire. Ne pas « optimiser » ce `setTimeout`.
- L'écran produit MagistrIA est en **verre nuit, encre #E9EEF5, accents cyan** ;
  le bordeaux n'y sert qu'au bouton d'action (« Valider »).
- **Higgsfield** (abonnement Starter) fournit voix (ElevenLabs v4), musiques et
  clips : surveiller les crédits (≈ 0,3 par voix, 7 par musique, 5 par clip
  Seedance Mini). Les fichiers entrent par `scripts/importer-media.mjs` ; un
  plan de script les appelle par nom (`clip: 'veolt-orbite'`). Un clip absent
  n'est pas une erreur : le plan retombe sur la 3D / la carte.
- `src/lib/export-ae.ts` (projet After Effects .jsx), `outils/blender/`
  (noyau de particules en vrai rendu), `src/lib/fournisseurs-media.ts`
  (ElevenLabs, Runway, Ollama — clés serveur uniquement, bouton pressé par
  Jonathan, jamais automatique).

## Suivi du chargé de communication (18/11/2026)

`src/lib/suivi.ts` porte trois ajouts, tous en lecture des vraies données :

- **Aujourd'hui** (`/[entite]/aujourdhui`) : posts validés dus (voie « manuel »
  si aucune API n'est prête), posts à trancher sous 3 jours, vidéos dues,
  relevés manquants à J+7, commentaires ouverts. **Rappels .ics**
  (`/[entite]/rappels`, session vérifiée par la route) : un événement avec
  alarme par post à poster à la main. Le rappel ne publie rien.
- **Commentaires de validation** : table `commentaires` (ajout additif). Fil sur
  la fiche et dans la file « À valider » ; le motif de « À retravailler »
  devient un commentaire. Un commentaire ne modifie jamais le post.
- **Rapport mensuel** (`/[entite]/rapport`, CSV `/[entite]/rapport/csv`,
  impression/PDF par le navigateur) : prévu / publié / mesuré par réseau, à
  partir du **dernier** relevé de chaque post. Non relevé = « non disponible ».

**Ajouts du 18/11/2026 (suite)**, toujours additifs :

- **Calendrier** : vue Mois (`?vue=mois&mois=AAAA-MM`) en plus de la vue Semaine,
  filtre par réseau (`?reseau=`) limité aux réseaux présents en base
  (`reseauxPresents`). L'état se lit au liseré, couleurs du thème (`data-statut`).
- **Heure prévue** : colonne facultative `publications.heure_prevue` (« HH:MM »),
  saisie sur la fiche, affichée au calendrier et dans « Aujourd'hui ». Les rappels
  .ics l'utilisent ; sans heure, ils gardent 9 h.
- **Relevés SEO datés** : table `seo_releves`, une ligne par « ok » sur la page SEO
  (date saisissable, jamais future). Le rapport mensuel en tire l'évolution sur
  6 mois (`evolutionSeo`) ; un mois sans relevé reste « non disponible ».
- **Déplacer un post** (19/11) : glisser-déposer dans la vue Mois (`GlisserMois.tsx`
  → action `deplacerPost`). Seule la date change (texte et statut intacts, tracé
  au journal). Refusé : post publié ou abandonné, date passée, doublon
  format × pilier le même jour. Le post prend la semaine et la phase des posts de
  la semaine d'arrivée ; une semaine sans post le met « hors calendrier »
  (`semaine` NULL), que « Recaler » ne bouge plus.
- **CSV du rapport** : colonne « heure prévue », puis l'évolution SEO mois par mois
  après une ligne vide.
- **Recaler : premier jour de publication** (19/11) : la semaine type publie dès
  le lundi ; pour démarrer un autre jour (ex. mardi), le champ facultatif reporte
  les posts de la semaine 1 datés avant ce jour (jour libre suivant si doublon
  format × pilier), tracé au journal.

## Hébergement o2switch (préparé le 24/11/2026, branche `hebergement/o2switch`)

Après la suspension du compte Vercel Hobby. Pas à pas : `MISE-EN-LIGNE-O2SWITCH.md`.

- **Deux modes de stockage**, choisis par l'environnement. Défaut : Blob sur
  Vercel, `data/` en local — rien ne change. `MAP_STOCKAGE=fichiers` +
  `MAP_DOSSIER_DONNEES` (absolu, hors racine web) : base, médias et
  `sauvegardes/` sur le disque ; `blobActif()` répond faux, donc toutes les
  branches Blob existantes sont court-circuitées. Sans dossier, refus de démarrer.
- En mode fichiers, `sauvegarder()` fait un **instantané daté** (API backup de
  SQLite, puis rename) au démarrage et au plus toutes les 10 min ; 30 gardés.
  Médias écrits de façon atomique, servis en flux avec Range (jamais chargés
  en mémoire).
- **Build `standalone`** seulement avec `MAP_BUILD_STANDALONE=1` ; il ajoute
  le HSTS que Vercel posait lui-même. `deploy/o2switch/` : `app.js`
  (Passenger), `deployer.sh` (build Mac → binaire better-sqlite3 Linux → rsync),
  `sauvegarder-base.mjs` (cron quotidien). Export : `scripts/exporter-depuis-blob.mjs`.
- `/connexion` est `force-dynamic` : un build fait sans mot de passe la figeait
  en redirection.
- **Aucun domaine en dur.** `MAP_URL_PUBLIQUE` (ex. `https://post.veolt.fr`)
  sert aux liens absolus (`src/lib/adresse.ts` : rappels .ics, liens
  temporaires de médias) et rend le cookie de session `Secure`. Sans elle,
  l'adresse se déduit des en-têtes, comme avant. Redirections relatives,
  cookie sans domaine : changer de domaine = changer la variable.
- **Dépôt par morceaux** (mode fichiers) : `src/lib/depot-direct.ts` est le
  seul point d'entrée navigateur (médiathèque, posts faits ailleurs, studio).
  Sur Vercel → `uploadPresigned` vers le Blob, inchangé ; si la page porte
  `data-depot="morceaux"` (layout, mode fichiers) → route
  `[entite]/medias/morceaux` : morceaux de 5 Mo écrits en flux dans
  `<données>/envois/`, taille exacte + signature vérifiées, rename atomique,
  fiche `<cle>.depot.json` lue par `enregistrerTeleversement` à la place du
  `head()` Blob. Mêmes plafonds que Vercel (300 Mo vidéo). Envois abandonnés
  effacés après 24 h. La route répond 404 hors mode fichiers.
- **o2switch (sun) : glibc 2.28, pas de compilateur** (relevé le 24/11). Aucun
  binaire de better-sqlite3 n'y tourne : le précompilé Node 22 exige glibc 2.29
  (`log`, `pow`, `exp`), en 11 comme en 12, **et celui de MagistrAI aussi**
  (essayé). En mode fichiers, la base passe donc par **`node:sqlite`** (SQLite
  intégré à Node 22, sans binaire) via `src/lib/sqlite.ts` : `ouvrirBase()`,
  `copierBase()`, sous-ensemble de l'API better-sqlite3 utilisé ici (prepare
  run/get/all, exec, pragma, transaction imbriquable, close), lignes rendues
  en objets ordinaires (React refuse les objets sans prototype). Hors mode
  fichiers : better-sqlite3, inchangé. `deployer.sh` n'envoie pas le binaire,
  teste `node:sqlite` avec le Node du serveur dans `<app>.nouveau`, puis
  bascule (ancienne version en `<app>.precedent`) ; il refuse tout `O2_APP`
  sans « machine-a-post ». Essai sans serveur : `O2_HOTE=local` (tout sous `$HOME`).
- **Enregistrer un post sur le serveur (corrigé le 25/11/2026).** Sous
  Passenger, plusieurs processus naissent souvent dans la même seconde ; leur
  instantané de démarrage visait le même `machine-<seconde>.db.tmp`, l'un
  sortait en `ERR_SQLITE_ERROR` (« not an error ») et, comme `db.ts` attend
  cet instantané avant d'ouvrir la base, **ce processus restait cassé** :
  500 à chaque requête qui tombait sur lui, dont « Enregistrer le brouillon ».
  Reproduit en local (4 processus sur la même base). Désormais
  `sauvegardeDatee()` prend un nom temporaire propre au processus, saute la
  seconde déjà prise et **ne lève jamais** : l'erreur est journalisée, la base
  elle-même est déjà sur disque. Ne pas remettre de `throw` dans ce chemin.
- **Chaque action serveur vérifie la session** (`exigerSession()` en tête de
  `actions.ts`), sauf `seConnecter` / `seDeconnecter`. Le `layout` protège les
  pages, pas les actions, et les identifiants des actions des composants
  navigateur sont dans le JavaScript public. Toute nouvelle action commence
  par `await exigerSession();`.
- « Enregistrer le brouillon » renvoie sur la fiche avec `?enregistre=HH:MM`
  et affiche « ✓ Brouillon enregistré à … » ; l'`UPDATE` porte `AND entite=?`
  (cloison), et un post introuvable le dit au lieu de faire semblant.
