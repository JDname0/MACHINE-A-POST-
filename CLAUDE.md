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

## Production

- **URL** : https://machine-a-post.vercel.app — équipe `jonathandubost-heticnets-projects`.
- **Déploiement** : `npx vercel deploy --prod --yes` depuis ce dossier. Aucun
  dépôt Git relié, donc aucun déploiement automatique.
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
- `src/lib/export-ae.ts` (projet After Effects .jsx), `outils/blender/`
  (noyau de particules en vrai rendu), `src/lib/fournisseurs-media.ts`
  (ElevenLabs, Runway, Ollama — clés serveur uniquement, bouton pressé par
  Jonathan, jamais automatique).
