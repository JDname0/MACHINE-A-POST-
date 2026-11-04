# RECAP — état du système

**Dernière mise à jour : 2026-10-06**

- **Étape : 2/5 — déployé, rien n'a été publié.** Les 12 semaines de calendrier
  sont générées et pré-remplies, aucun compte n'est branché par API.
- **En production : https://machine-a-post.vercel.app** (équipe
  `jonathandubost-heticnets-projects`, projet `machine-a-post`). Déploiement
  manuel par `npx vercel deploy --prod --yes`, pas de dépôt Git relié.
- **Double protection d'accès** : la *Vercel Authentication* du projet (il faut
  être connecté au compte Vercel) **plus** le mot de passe de l'outil
  (`MACHINE_MOT_DE_PASSE`, posé en variable sensible). Les deux secrets sont
  dans `SECRETS-A-GARDER.txt`, non versionné.
- **Persistance : store Blob privé `machine-a-post-base`** (`store_UzbKNroTvJznQ8y0`,
  région cdg1), connecté en **OIDC** — donc pas de `BLOB_READ_WRITE_TOKEN`, c'est
  `BLOB_STORE_ID` qui fait foi. Le fichier SQLite entier y est rangé sous
  `machine-a-post/machine.db` : hydraté au démarrage de chaque instance, repoussé
  après chaque mutation. Vérifié le 06/10 — 380 Ko relus, 144 publications,
  calendrier du 05/10 au 26/12.
- ⚠️ **Dernier écrivain gagne.** Deux onglets qui enregistrent en même temps sur
  deux instances : l'un écrase l'autre. Acceptable à un opérateur, pas à deux.
- **Deux entités cloisonnées** : `veolt` (studio créatif, ENERVO, 3 mois
  d'existence, aucun client citable) et `magistria` (IA juridique, cœur de cible
  assureurs). Thème d'interface différent par entité — c'est volontaire.
- **Périmètre arrêté le 06/10** : LinkedIn (texte+image, carrousel, vidéo),
  Instagram (carrousel, Reel, vidéo), Reddit (post textuel), TikTok (vidéo
  courte), blog. Rien d'autre.
- **Porte-parole : les pages entreprise uniquement.** Le « nous » est imposé par
  un garde-fou. À rouvrir si la portée reste plate après six semaines.
- **Calendrier** : 84 publications Veolt (7/semaine) et 60 MagistrIA
  (5/semaine) sur 12 semaines, toutes en brouillon. Les 4 premières semaines
  suivent la séquence exister → prouver → servir → ouvrir.
- **Garde-fous vérifiés en conditions réelles le 06/10** : les preuves interdites
  Veolt (28 clients, « nous avons accompagné », ROAS) bloquent bien la
  validation ; le plafond de fréquence Reddit bloque aussi.
- **Connexions : 4 réseaux au barreau 1 sur 5** — les comptes existent, aucune
  application développeur n'est créée. Ordre recommandé : Reddit (sans revue),
  Instagram, LinkedIn, TikTok.
- **SEO** : 3 grappes par entité, 17 articles planifiés chacune, 0 écrit.
  6 cibles de backlink par entité, dont 1 marquée « jamais ».
- **Campagnes** : 2 par entité, toutes en projet. Côté Veolt la campagne Meta est
  **bloquée** tant que le consentement n'est pas posé sur `veoltproduction.fr`.
- **En attente de Jonathan** `[?]` : la liste des missions réelles de l'associé
  Veolt (déjà demandée côté prospection), et le consentement sur le site Veolt.
- **Prochaine action** : créer l'application Reddit (une heure, aucune revue) —
  c'est elle qui valide la plomberie de bout en bout.

## Médiathèque — images et vidéos apportées (2026-11-04)

Sur `/[entite]/visuels`, section « Tes images » : dépôt de fichiers à côté des
cinq gabarits générés. `src/lib/medias.ts` tient le stockage (dossier
`data/medias/` en local, store Blob privé sur Vercel — **pas** dans SQLite,
dont l'instantané entier est repoussé à chaque enregistrement), la liste
blanche de types, le plafond de 4 Mo et la lecture des dimensions dans les
en-têtes PNG/JPEG/WebP/GIF. `src/app/[entite]/medias/[id]/route.ts` sert les
octets avec son **propre** contrôle d'accès, comme le générateur de visuels :
une route de fichier ne traverse pas le `layout`. Une image peut être rattachée
à une publication, et apparaît alors dans le composeur de ce post.

Trois pièges tenus par le code, à ne pas « corriger » :
- le plafond est à 4 Mo **par envoi complet**, parce qu'une fonction Vercel
  refuse un corps de requête au-delà de ~4,5 Mo sans message exploitable ;
- `experimental.serverActions.bodySizeLimit` dans `next.config.ts` : la limite
  par défaut d'une action serveur est de 1 Mo, donc toute photo échouerait ;
- le SVG est volontairement hors liste blanche — document scriptable, et aucun
  des quatre réseaux ne l'accepte.

### Vidéo : le dépôt direct (2026-11-04)

Une vidéo ne peut pas passer par une action serveur — une fonction Vercel
refuse un corps au-delà de ~4,5 Mo, soit moins de deux secondes de Reel. Le
navigateur téléverse donc **directement** vers le store, et la fonction ne
signe qu'un jeton (`/[entite]/medias/televerser`).

Deux choses relevées en production, qui expliquent le code tel qu'il est :
- `handleUpload` / « client token » **ne marche pas ici** : il exige un
  `BLOB_READ_WRITE_TOKEN` statique, et le store de ce projet est connecté par
  OIDC. D'où `handleUploadPresigned` + `issueSignedToken`, qui acceptent l'OIDC.
- le jeton est une autorisation d'écriture dans le store **où vit aussi
  l'instantané de la base**. Le chemin demandé est donc validé contre une
  expression exacte (préfixe de la médiathèque + UUID + extension connue) —
  vérifié : `machine-a-post/machine.db` est refusé.

La route de service relaie le `Range` jusqu'au stockage : sans ça, se déplacer
dans une vidéo redemanderait le fichier entier, rassemblé en mémoire dans la
fonction. Les dimensions et la durée viennent du navigateur sur ce chemin, et
d'une lecture des boîtes `mvhd` / `tkhd` du MP4 sur l'autre (`dimensionsVideo`).
Le WebM n'est pas analysé côté serveur — conteneur EBML, pas rentable.

## Rendre les médias publiables (2026-11-04)

Le dépôt ne suffisait pas : un fichier déposé ne pouvait pas servir au moment
de publier. Trois pièces ajoutées.

**Le lien public temporaire** (`lienPublic`). Instagram et TikTok ne reçoivent
pas d'octets : ils vont **chercher** le fichier à une adresse, donc un média
privé leur est invisible. Avec le store Blob, l'adresse est une URL présignée
sur l'hôte du stockage — vérifié en production : 200 depuis l'extérieur, 403
sans la signature ou avec une signature modifiée. Sans store, c'est un lien
HMAC sur notre propre route, que `lienSigne` vérifie (testé : autre média,
autre entité, jeton modifié, date dépassée → tous refusés). Deux heures par
défaut.

Pourquoi l'URL présignée et pas notre route en production : Meta tirerait un
Reel de 80 Mo **à travers la fonction**, qui a une durée maximale d'exécution.

**Le contrôle du média contre le format** (`src/lib/conformite-media.ts`). Même
grammaire que les garde-fous du texte — blocage / alerte / conseil, et jamais
« corrigez » tout court. Un blocage empêche la publication par API, côté
serveur et pas seulement dans l'interface.

**Le choix du média à publier.** L'ancien champ « URL publique du média »,
libre et jamais rempli, est remplacé par un choix parmi les fichiers rattachés
et **conformes** : l'outil doit pouvoir contrôler ce qu'il envoie, et l'adresse
publique est signée ici, pas saisie.

Deux limites à dire, pas à cacher :
- **LinkedIn n'attache toujours pas le fichier.** Son API demande un envoi en
  deux temps (initialisation puis téléversement des octets) ; le connecteur
  étant inerte faute de revue, écrire ce code reviendrait à livrer
  non testé. Le message de l'interface le dit.
- **TikTok exige que le domaine de l'URL soit vérifié dans sa console.** Ni
  `*.blob.vercel-storage.com` ni `machine-a-post.vercel.app` ne peuvent l'être
  par nous. Il faudra un domaine à soi au moment de gravir ce barreau.
