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

**Depuis le 25/11/2026, la production est https://post.veolt.fr** (o2switch,
section « Hébergement o2switch » plus bas, pas à pas dans
`MISE-EN-LIGNE-O2SWITCH.md`). Déploiement **à la main** depuis le Mac, sous
Node 22 : `deploy/o2switch/deployer.sh`. Un push ne met rien en ligne chez
o2switch. La branche `hebergement/o2switch` a été fusionnée dans `main` le
25/11 : partir de `main` pour toute suite.

**Vercel (historique)** : l'équipe Hobby est suspendue depuis le 20/11/2026
(`FAIR_USE_LIMITS_EXCEEDED`, dépassement du transfert « Fast Origin Transfer »,
surtout les médias servis par la fonction). Réouverture automatique prévue le
**20/12/2026**, avec la base Blob du 19/11, donc **périmée** par rapport à
o2switch. **Projet Vercel mis en pause le 25/11/2026** à la demande de
Jonathan (rien supprimé ; « unpause » dans les réglages du projet pour le
rallumer) : l'ancienne adresse ne se rallumera pas seule le 20/12. Tant que le
dépôt reste relié au projet Vercel, un push sur `main` y déclenche encore un
déploiement. Ce qui suit décrit ce mode Vercel, toujours
pris en charge par le code (sans `MAP_STOCKAGE`).

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

**Sur o2switch (production depuis le 25/11/2026)** : cPanel → Setup Node.js App
→ variables d'environnement, puis Restart. Changer `MACHINE_MOT_DE_PASSE`
**et** `MACHINE_CLE_SESSION` (`openssl rand -hex 32`) ensemble, pour la raison
dite plus bas. Le script ci-dessous ne vise que Vercel.

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

## Logo Veolt sur chaque post (25/11/2026)

`src/lib/logo-veolt.ts` porte le monogramme V arrêté avec Jonathan (branche
gauche argentée, branche droite lavande → violet → magenta, étincelle
lavande), en SVG pour Satori et en dessin canvas pour les vidéos. **Règle :
le logo figure sur chaque post Veolt.** MagistrIA n'est pas touché (rendu
identique à l'octet, vérifié).

- **Visuels** (`visuels.tsx`) : `ThemeVisuel.pictogramme` ; `Identite` pose
  le V (**en PNG**, `logo-veolt-png.ts` : en build de production, Satori
  réserve la place d'un SVG `data:` sans le dessiner — constaté sur
  post.veolt.fr le 25/11, alors que `next dev` l'affichait) puis VEOLT en Kanit Black (`Kanit-Black.woff`, poids 900, déclaré dans
  `polices.ts`) au dégradé argenté. Tous les gabarits, pages de carrousel et
  couvertures d'article en héritent.
- **Vidéos** : le V devant VEOLT sur l'écran de marque et l'écran de fin
  (`logotype()`, `rendu-scenes.ts`) ; en coin haut gauche sur tout plan qui
  n'affiche pas l'en-tête d'une carte — décor dessiné (horizon, sphère),
  photo, clip, vidéo apportée (`filigrane()`, `fabrique-video.ts`).
- **Empreinte** : `VERSION_CHARTE_VEOLT` entre dans l'empreinte des visuels
  mémorisés (`memoire.ts`), sinon un visuel d'avant le logo passerait pour à
  jour. La changer fait refaire les visuels Veolt au prochain passage.
- **« Remettre les visuels au logo »** (`/veolt/visuels`, action
  `remettreVisuelsAuLogo`) : refait les visuels des posts à venir (brouillon,
  à relire, validé), jamais un post publié (il garde l'image partie) ni
  abandonné. Relancer ne refait rien. Les vidéos se refont par les lots du
  studio vidéo (fabriquées dans le navigateur).

## Kit Veolt et codes LinkedIn 2026 (25/11/2026, suite)

- **Univers du kit** (`ThemeVisuel.kit`, Veolt seulement) : sphère de particules
  de veolt.fr derrière le texte (`sphere-veolt-png.ts`, PNG transparent ; halo en
  dégradé radial Satori, sinon la palette réduite fait des anneaux), signature
  « STUDIO CRÉATIF & CONSEIL » (`Signature`), pastille du kit
  « VEOLT.FR · DEVIS SOUS 24 H » (`Pastille`). Pas de sphère sur une photo.
- **Question dans l'image** (`Contenu.question`, `QuestionCarte`) : la question
  du post (`questionDuPost`, `fiche.ts` — l'appel s'il finit par « ? ») est
  posée dans le visuel LinkedIn image et la page de fin des carrousels.
  Jamais « likez » ni « commentez MOT ».
- **Carrousels** : page de fin du kit (`Contenu.fin` : logo, question,
  pastille), étiquette au-dessus du titre (`Contenu.etiquette` : « À retenir »,
  sinon le sujet), explication sous le titre. Pages **écrites pour le format**
  dans `carrousels-veolt.ts` (10 à 11 pages, une idée par page, preuves
  autorisées seulement, « [?] » gardés) ; `approfondirCarrousels()` (`db.ts`)
  les pose sur les brouillons **non retouchés**, tracé au journal.
- **Garde-fous** : règle 12 (appât à l'engagement LinkedIn, alerte), règle 13
  (ressource promise absente de `marques.ts > ressources`, blocage — Veolt :
  analyse gratuite et articles publiés seulement), règle 14 (appel Veolt
  LinkedIn qui n'est pas une question, conseil). Lien LinkedIn : plus de
  « premier commentaire », message privé ou Sélection de la page.
- **Formats** (relevé 2026-11-25) : LinkedIn texte 800–1 500 car., étape
  « Question » ; carrousel : documents natifs 7,00 % (Socialinsider 2026).
  `ia.ts` transmet les ressources réelles à l'IA.
- **Vidéos Veolt sans script** : sphère / galaxie en fond sur **tous** les
  plans et décor alterné (horizon, étoiles, rayons) ; écran de fin avec le
  surtitre du kit (`surTitreKit`). Les paramètres `question`, `fin`,
  `etiquette` sont vidés des cartes de fond vidéo (`fabrique-video.ts`).
- `VERSION_CHARTE_VEOLT = 'kit-2026-11-25'` : « Remettre les visuels au logo »
  refait tout au prochain clic.

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
- **Aperçu d'un PDF fourni** : `<iframe>`, pas `<object>` (`ApercuPost.tsx`).
  La CSP active porte `object-src 'none'` : Chromium bloquait l'`<object>`
  (« Loading plugin data … violates object-src 'none' ») et l'aperçu restait
  vide. Vérifié le 25/11 avec la visionneuse du Chromium complet. Ne pas
  revenir à `<object>`/`<embed>`, ni assouplir `object-src` pour ça.
- **Publier par API, prêt pour le branchement des réseaux (25/11/2026).**
  `publierParApi` : post cherché `AND entite=?` (cloison) ; refus serveur
  hors statut `valide`, même bouton forcé ; **verrou en base**
  (`publications.envoi_en_cours`, pris avant l'appel au réseau, libéré dans un
  `finally`, périmé après 10 min) contre le double envoi (deux clics, deux
  onglets, deux personnes, deux processus) ; `sauvegarder()` après chaque
  écriture ; résultat affiché sur la fiche (`?api=ok|refus|echec&detail=`,
  bloc `#publier`) en plus du journal. Essayé avec de fausses clés LinkedIn :
  refus hors validation, verrou, deux onglets simultanés (un seul envoi),
  statut resté « validé » après l'échec. Liens signés des médias (Instagram,
  TikTok) en mode fichiers : 200 sans session, 401 si modifiés ou expirés.
- Les messages « clé manquante » (IA, connecteurs, page Comptes) disent où
  poser une variable sur o2switch : cPanel → Setup Node.js App → variables
  d'environnement, puis Restart.

## Deux comptes : direction et équipe (25/11/2026)

`src/lib/auth.ts`, `src/lib/auteur.ts`. Un cookie signé porte le **rôle** ;
pas de table de comptes.

- **direction** (`MACHINE_MOT_DE_PASSE`) : tout, dont **valider** et
  **publier** — le « oui » de la règle 1. Son jeton est celui d'avant : les
  sessions ouvertes survivent au déploiement.
- **équipe** (`MACHINE_MOT_DE_PASSE_EQUIPE`, facultatif, différent du premier) :
  prépare — écrit, produit, importe, commente, renvoie « à retravailler »,
  poste à la main et marque « publié » **ce qui est validé**. Son jeton dérive
  aussi de son mot de passe : le changer déconnecte l'employé sans
  déconnecter Jonathan. Sans la variable, le compte n'existe pas.
- **Refusé à l'équipe côté serveur** (`exigerSession()` renvoie le rôle) :
  valider (`changerStatut`, `trancher`), `publierParApi`, `declarerAuTerrain`,
  `creerLienPartage` / `revoquerLienPartage`, marquer publié un post non validé. Les pages
  masquent ces boutons et le disent ; le serveur refuse quand même un
  formulaire forcé (testé).
- **Un post validé que l'équipe modifie repasse « à relire »**
  (`aRevaliderSiEquipe`) : texte, fichiers fournis ajoutés, retirés ou
  réordonnés. Sinon la validation serait contournable.
- **Journal : colonne `auteur`** (`direction`, `equipe`, vide = la machine),
  remplie par `tracer()` depuis un `AsyncLocalStorage` ouvert au début de
  `exigerSession()`, **avant tout `await`** — c'est ce qui l'attache au
  contexte de l'action. Ne pas déplacer `ouvrirPorteur()` après un `await`.
- Le menu dit qui est connecté (si le compte équipe existe) ; la page
  Comptes dit si le compte équipe est créé et comment le gérer.
- Toute **nouvelle action** commence par `const qui = await exigerSession();`
  et se demande si elle est un geste de la direction.

## Journal complet et liens de partage (25/11/2026)

- **Page Journal** (`/[entite]/journal`, menu « Journal — qui a fait quoi ») :
  tout le journal de l'entité et les lignes communes (jamais l'autre entité),
  100 par page, filtres **qui** (Jonathan, Équipe, la machine), **du / au**
  (jours de Paris, convertis en bornes UTC — `le` est en UTC), **type
  d'action**, **mot**. Heures affichées à l'heure de Paris (`heureParis`).
  Lecture seule. `journalFiltre()` dans `requetes.ts`.
- **Liens de partage** (`LienPartage.tsx`, table `liens_partage`, route
  publique `/p/<jeton>`) : 2 heures, 30 jours ou **permanent**, révocables un
  par un, réservés à la direction, tracés au journal. Jeton aléatoire en base
  (pas une signature) : révoquer un lien ne touche ni les autres liens ni les
  sessions. Lien révoqué, expiré ou inventé : même 404. La route ne sert que
  le fichier désigné, types de `TYPES_SERVIS` (`medias.ts`), `noindex`.
  Le lien signé de 2 heures envoyé à Instagram / TikTok par `publierParApi`
  est un autre mécanisme (`lienPublic`) et n'a pas à durer.
- `creerPublication` refuse un doublon format × pilier le même jour avec un
  message et le lien du post existant (la contrainte UNIQUE produisait une
  page d'erreur, relevé par le balayage des boutons du 25/11).
- **Vérifié le 25/11 sur la copie conforme du serveur** : chaque bouton de
  chaque page cliqué une fois, comptes direction et équipe (aucune 5xx hors
  le doublon corrigé) ; essais ciblés : copier le texte, visuel PNG, PDF du
  carrousel, rappels .ics, rapport CSV, article du plan, glisser-déposer,
  import, dépôt médiathèque par morceaux, liens de partage, **vidéo fabriquée
  dans le navigateur puis envoyée au serveur** (H.264 1080 × 1920, 25 s).
  Le son est en AAC si le navigateur sait l'encoder (Chrome sur Mac /
  Windows), sinon en Opus : fabriquer les vidéos dans Chrome.

## Montrer, pas dire : le pack d'illustrations (25/11/2026, fin de journée)

Système complet dans **`STUDIO-QUALITE.md`** (chaîne de génération, contrôle,
contenu réel de veolt.fr utilisable ou exclu). L'essentiel :

- **Registre** `src/lib/illustrations.ts` : `IMAGES_PACK` (job Higgsfield,
  adresse, référence, prompt mot pour mot, `mention`), `PLACEMENTS` (couverture
  d'un sujet, page repérée par le **début de son texte**, cadrage),
  `FIGURES_ARTICLES` (3 à 5 par article). Charte de prompt : `promptVeolt()`.
- **Import** : Visuels → « Importer les illustrations manquantes »
  (`importerIllustrations`, `illustrations-serveur.ts`). Hôtes autorisés :
  `HOTES_IMPORT` seulement ; médias d'origine `illustration`, empreinte = hachage
  de l'adresse. `MAP_ILLUS_MIROIR` (développement seulement) sert l'essai sans réseau.
- **Rendu** : `Contenu.illu` / `cadrage` → `rendreIllustre` (cadre de verre ;
  carrousel, affirmation, chiffre, couverture d'article). Une photo posée à la
  main (`photo`) passe avant. Les trois appels de `rendre` (route, mémoire, PDF)
  chargent l'illustration par `illustrationDuContenu`.
- **Vidéo** : `Plan.illustration` nommée par un script, sinon posée
  automatiquement sur les plans du milieu (texte qui reprend le `debut`, puis
  l'ordre du registre). `dessinerIllustration` (`fabrique-video.ts`).
  `controleMontage` (`production.ts`) s'affiche sous « Générer la vidéo ».
- **Version finale en situation** : `PAGES_FINALES_VEOLT`
  (`carrousels-veolt.ts`), posée avant « À retenir » ; `poserPagesFinales`
  (`db.ts`) l'a ajoutée aux brouillons non retouchés, tracé au journal.
- **La mention ne s'enlève pas** (« Illustration IA », « Concept Veolt · mise en
  situation IA ») : une image ne passe jamais pour un travail client (règle 2).
- **1337 est exclu** (Tonic, Focus, Gélule, Film de marque, showreel) : client.

## Calendrier, voix et import par le navigateur (25/11/2026, soir)

- **Jours de publication Veolt** : article de blog le **lundi**, réseaux le
  **mardi, mercredi, jeudi** (un seul post LinkedIn par jour, carrousel le
  mercredi vers 16 h ; Sprout Social et Buffer 2026). `SEMAINE_TYPE` suit ;
  `recalerMardiJeudiVeolt` (`db.ts`) a recalé les posts à venir **une seule
  fois** (marque au journal « calendrier : lundi blog, mardi-mercredi-jeudi
  réseaux ») : un post déplacé à la main ensuite n'est jamais ramené. Heures
  posées seulement si vides (LinkedIn 16:00, Instagram 18:00, TikTok 19:00,
  blog 09:00). Un post qui ne trouve pas de jour libre dans une semaine déjà
  entamée reste à sa date, tracé « calendrier : à replacer ».
- **Voix humaine** (`voixVeolt`, `gabarits.ts`) : une phrase de ton par pilier
  (une posture, jamais un fait), l'emoji du pilier devant l'enseignement, 👉
  devant l'appel, 👇 en fin d'accroche de carrousel. Jamais en ouverture
  (garde-fou 9), jamais dans les images (`questionDuPost` retire l'emoji).
  Blog et Reddit : texte nu. `poserVoixVeolt` (`db.ts`) l'a posée sur les
  brouillons non retouchés. Chaîne des migrations de texte : `fabriquer(…,
  { sansPagesEcrites, sansPageFinale, sansVoix })`.
- **Import des illustrations par le navigateur** (`ImporterPack.tsx` →
  `deposerIllustration`) : le serveur o2switch n'atteint pas le CDN de
  Higgsfield (constaté le 25/11), le navigateur si. L'import serveur reste en
  bouton secondaire, et s'arrête après deux échecs réseau.

## Séries tirées de veolt.fr, captures réelles, révisions de sujets (25/11/2026, 22 h)

- **7 séries** (`sujets-series-veolt.ts`, `v-vf-1` à `v-vf-7`) : parcours client
  (questionnaire → espace client → devis sous 24 h), packs vidéo aux vrais prix,
  une vidéo fabriquée avec l'IA, Atelier Noir décortiqué, une canette de
  l'esquisse à la pub, l'analyse gratuite, trois concepts de sites. Chacune :
  pages de carrousel, version finale en situation, placements d'images, script
  vidéo (`vid-v-vf-*`, 9:16 : Reel et TikTok). `poserSeriesVeolt` (`db.ts`) les
  a posées **seulement sur les créneaux en doublon** des semaines 4 à 10
  (carrousel LinkedIn, Reel, TikTok qui répétaient un post plus ancien, non
  retouchés) ; la première occurrence reste ; les anciennes vidéos et visuels
  du post sont **détachés**, pas supprimés. Semaines 11-12 : rediffusions, à
  remplir par les prochaines séries.
- **Captures réelles** de veolt.fr (mobile 430 × 932) dans `public/pack/`,
  inscrites au registre avec `forme: 'telephone'` et la mention « Capture
  réelle · veolt.fr » : montrées dans un téléphone (visuel : téléphone à gauche,
  texte à droite ; vidéo : téléphone centré). Aucune donnée personnelle : choix
  cochés pour l'exemple, rien envoyé.
- **Révisions de sujets** (`sujets-revisions.ts` garde l'ancienne version) :
  `appliquerRevisions` met la nouvelle version sur les brouillons encore
  identiques à l'ancienne. Premier cas : `v-pp-1` revu le 25/11 (le site dès
  799 € HT est l'ajout de Jonathan ; veolt.fr affiche « sites dès 1 490 € HT »).
- Les premières versions des étapes du pipeline (l'objet seul) restent au
  registre sous `illu-3d-*-objet`, en appoint.
- **Lisibilité des captures** : dans un carrousel, une capture qui a un
  `cadrage` passe en grand cadre zoomé sur le bloc utile (question, prix) ;
  sans cadrage, le téléphone entier. Les **pages de packs** (`v-vf-2`) ne
  montrent pas de capture : la carte du pack est **recomposée en entier**
  (`pagePack`, `visuels.tsx`) depuis `offres-veolt.ts`, copie mot pour mot de
  veolt.fr/price.html — à tenir à jour avec le site. Vidéo verticale : le
  téléphone fait 60 % de la hauteur.
- **Pas d'emoji à l'image** : ni dans les visuels (`sousTitre` nettoyé), ni dans
  le texte des plans vidéo (`phrases()`, `montage.ts`) — les polices de titre
  n'ont pas les glyphes, ils sortaient en « �� ».

## Repassage du 25/11/2026 (23 h) : court, illustré, supervisé

- **Consignes du studio** (`src/lib/consignes-studio.ts`) : toutes les demandes
  de Jonathan, écrites une fois (règle + pourquoi), lues par l'IA (`ia.ts`,
  `consignesPourIA`), par le prompt des images (`promptDeclaratif`, charte v2
  `CHARTE_PROMPT_VEOLT_V2`) et par le superviseur. Une consigne ajoutée là
  s'applique partout au prochain passage.
- **Carrousels Veolt : 7 pages au plus**, une image par page, plus de page
  « À retenir ». Version courte dans `carrousels-veolt.ts` ; la première
  version (10 à 12 pages) reste dans `carrousels-veolt-v1.ts` pour reconnaître
  les brouillons non retouchés : `raccourcirCarrousels` (`db.ts`) les passe à
  la version courte (brouillon **et** à relire, jamais validé), tracé au journal
  « carrousel : version courte ». `fabriquer(…, { carrouselV1 })` refait l'ancienne.
  `poserSeriesVeolt` reconnaît les deux versions.
- **Mise en forme** : `*mots*` dans le texte d'une page → mis en valeur à
  l'image (`TexteRiche`, lavande + souligné) ; `nu()` les retire partout
  ailleurs. Un ou deux par page. `coupe.ts` ne finit plus une ligne de titre
  sur un petit mot.
- **22 images déclaratives** (Higgsfield, 4:3, charte v2) au registre, une
  par page des carrousels courts ; nouvelles couvertures (v-dc-3, v-vf-4,
  v-vf-5, v-vf-7). Importées comme les autres (Visuels → Importer).
- **Vidéos : aucun plan texte seul.** Les plans « chiffre / liste / titre
  centré » des scripts v-vf-* sont devenus des captures réelles ou des images ;
  une capture avec `cadrage.zoom > 1` est **animée** (la caméra avance vers le
  bloc utile, sans déborder sur le texte, `fabrique-video.ts`). Script
  `vid-v-pp-2`. Écran de fin Veolt : 3 s au plus (`montage.ts`).
- **Scènes de texte dessiné sur image** (26/11) : liste, chiffre, comparatif
  (`SCENES_SUR_IMAGE`, `montage.ts`) reçoivent une image de la `banque` du
  script, plein cadre sous un voile dense (`fabrique-video.ts`) ; la banque
  tourne si elle est plus courte que les plans, jamais deux fois de suite.
- **Superviseur qualité** (`superviseur.ts`, page `/[entite]/qualite`, audit
  JSON `/[entite]/qualite/audit`) : relit tous les posts à venir (pages,
  images manquantes ou non importées, plans texte seul, figures d'article,
  tics « IA »), montre les rendus semaine par semaine. Lecture seule.
- **Garde-fou 15** : tics d'écriture « IA » (alerte).
- Veille et propositions classées : `PROPOSITIONS-TENDANCES-2026.md`.
- **Relecture indépendante (23 h 40)** : 21 images de plus — 12 illustrations
  de concept refaites en photographie réaliste (`*-reel`, les originales
  restent au registre) et 9 images propres à un carrousel, pour supprimer les
  doublons d'un carrousel à l'autre. Pack Pro ajouté au carrousel des packs ;
  « On refuse la vidéo à l'unité » (contredisait les tarifs) devient « On
  déconseille le visuel isolé ». Ponctuation collée au mot mis en valeur
  (`motsRiches`), couverture sans « : » final, étiquette courte
  (`etiquetteCourte`). **Satori refuse `backgroundImage: 'none'`** : ne pas
  l'utiliser pour « annuler » un fond. La version courte de 22 h 30 est gardée
  (`PAGES_CARROUSEL_VEOLT_V1B`) : `raccourcirCarrousels` reconnaît les deux.

## Mise en ligne des articles sur le site (26/11/2026)

`src/lib/mise-en-ligne.ts`, bloc « Mettre en ligne sur veolt.fr » sur la fiche
d'un article (`MiseEnLigne.tsx`), aperçu `publications/[id]/article`
(`?telecharger=1` pour la page à déposer à la main), action
`mettreArticleEnLigne`.

- **Le geste de Jonathan** : direction seulement, article **validé** (ou déjà
  publié, pour une mise à jour), contrôle entièrement vert — 3 images au moins,
  source nommée, aucun « [?] », 500 mots et 3 sections, aucun blocage des
  garde-fous, aucun tic « IA ». Refusé côté serveur sinon. Jamais automatique.
- **Destination par variable d'environnement, jamais devinée** :
  `MAP_SITE_VEOLT_DOSSIER` (racine de veolt.fr sur le même serveur, chemin
  absolu ; doit contenir `blog.html`), `MAP_SITE_VEOLT_URL` (défaut
  https://veolt.fr). Sans elle : aperçu et téléchargement seulement.
- **Ce qui est écrit** : `blog-<titre>.html` (gabarit des articles du site,
  bloc « Sources et méthode », JSON-LD Article, date de mise à jour), les
  images `blog-img-<titre>-<n>.png`, et une ligne en tête du tableau `ARTICLES`
  de `blog.html` (copie de `blog.html` gardée dans `<données>/sauvegardes-site/`
  avant). Écritures atomiques. Rien d'autre n'est touché sur le site.
- **MagistrIA** : magistrai.fr (Next.js) n'a pas de blog à ce jour ; l'entité a
  l'aperçu et le téléchargement, la mise en ligne directe attend une destination.
