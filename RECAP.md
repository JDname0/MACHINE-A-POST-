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
