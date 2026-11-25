# Montrer au lieu de dire : ce qui marche en 2026, appliqué à la machine à post (Veolt)

Relevé du 25/11/2026. Recherche web (15 recherches, 9 pages lues), puis lecture du dépôt dans l'état
de 22 h 30 : `carrousels-veolt.ts` (version courte), `gabarits.ts`, `videos.ts` (scripts `vid-v-*`),
`superviseur.ts`, `formats.ts`, `garde-fous.ts`, `illustrations.ts`. **Aucun fichier du dépôt n'a été modifié.**

**À lire avant les chiffres :**
- Les chiffres des éditeurs d'outils (Buffer, Metricool, Socialinsider, MagicPost) mesurent les comptes de
  leurs clients. Ce sont des **corrélations**, et chaque éditeur calcule l'engagement à sa façon (par abonné,
  par portée, par impression). On ne compare pas un taux Buffer à un taux Socialinsider.
- Les études d'éditeurs de logiciels GEO ou d'IA (texta.ai, Jacquard) sont des **indices**, pas des preuves.
  Elles sont signalées comme telles.
- Rien de ce document n'est une preuve à citer dans un post Veolt. Ce sont des règles de fabrication.
- `[?]` = supposé, non vérifié, à mesurer.

---

## 0. L'état de l'outil ce soir, et ce qui reste à faire

**Déjà en place, et conforme aux tendances 2026 :** carrousels de 7 pages au plus, une idée et une image
par page, plus de page « À retenir », mots mis en valeur entre astérisques, superviseur « montrer, pas
dire », mention « Illustration IA » qui ne s'enlève pas, captures réelles de veolt.fr dans un téléphone,
question posée dans l'image, garde-fou contre l'appât à l'engagement LinkedIn, moteur de sous-titres
« karaoké » (`sousTitre`, `dessinerSousTitre`).

**Ce que la lecture du dépôt fait ressortir :**

| Constat | Où | Pourquoi ça compte |
|---|---|---|
| La couverture d'un carrousel est **le titre du sujet** (« Le même produit, en photo studio et en 3D ») : une étiquette, pas une tension | `gabarits.ts`, `PAGE 1 — ${s.titre}` | C'est la seule page que le fil montre (§1, C1) |
| **48 images du pack sur 57 sont des illustrations IA** (≈ 84 %) ; 9 seulement sont des captures réelles | `illustrations.ts` (`mentionDe` → « Illustration IA » par défaut) | 2026 récompense ce qui prouve qu'un humain a fait le travail (§5) |
| 9 des 10 vidéos courtes (`vid-v-1` à `vid-v-vf-7`) finissent sur **4 à 7 s de texte seul ou d'écran de fin** (titre centré sur la sphère, puis carte de fin) | `vid-v-vf-1` 19–26 s, `vid-v-vf-4` 16–23 s, `vid-v-vf-7` 15–22 s… | Jusqu'à 32 % de la durée passée à « dire » : c'est là que le visionnage complet se perd (§2, V3) |
| 3 ouvertures vidéo sont des **intitulés** : « Une canette, de l'esquisse à la pub. », « Une analyse gratuite, en dix étapes. », « Trois sites, trois objectifs. » | `vid-v-vf-5`, `-6`, `-7` | Les 3 premières secondes doivent porter la proposition, pas le sujet (§2, V1) |
| `vid-v-v3-1` pose une **scène de marque (logo) de 4,5 à 8 s** ; `vid-v-cu-1` ouvre sur **7,5 s de titres seuls** | `videos.ts` | Contredit la règle « pas d'animation de marque en ouverture » du dépôt, et la fenêtre de 6 s de TikTok |
| Aucune vidéo `vid-v-*` n'utilise `sousTitre` | `videos.ts` | Le moteur existe déjà : gain sans développement lourd (§2, V4) |
| **Consignes périmées** : « la fourchette utile est 8 à 10 » (gabarits), ossature de 10 pages et « 8 à 10 pages » (`li-carrousel`), « 6 à 10 visuels » (`ig-carrousel`), « 10 à 20 s » (`ig-reel`), « 1 200 × 627 » (`li-texte-image`), « 1:1 ou 4:5 » (`li-video`) | `gabarits.ts`, `formats.ts` | Le relecteur et l'IA (`ia.ts`) reçoivent des règles contradictoires avec les 7 pages |
| La voix Veolt pose **les trois mêmes marques sur chaque post** : une phrase d'aparté fixe par pilier (« Sans jargon, promis. », « Voici comment on s'y prend, concrètement. »), 👉 devant chaque appel, 👇 au bout de chaque accroche de carrousel | `gabarits.ts`, `VOIX_VEOLT` | Un lecteur régulier reconnaît un gabarit en trois semaines (§5) |
| `sujets.ts` contient 24 « n'est pas », dont 5 constructions « ce n'est pas X, c'est Y » | `sujets.ts` | Construction la plus repérée comme « tic IA » en 2026 (§5) |
| 13 mises en valeur sur 66 font plus de 5 mots (phrases entières : « *Ce modèle sert ensuite à tous les visuels.* », « *Le site part avant le modèle économique.* ») | `carrousels-veolt.ts` | Une phrase entière en lavande ne fait plus ressortir un mot (§1, C6) |

**Une tension à connaître, sans la trancher :** les données 2026 favorisent des carrousels LinkedIn plus
longs que 7 pages. Sur 67 765 carrousels, MagicPost relève une médiane de 26 « j'aime » pour 6 à 8 pages,
49 pour 9 à 12, 58 pour 13 à 20 (corrélation : les auteurs de carrousels longs sont aussi les plus investis).
La règle Veolt reste **7 pages**. Toutes les propositions ci-dessous la tiennent ; elles compensent la
longueur par le **temps passé sur chaque page** (une image qui se lit, pas un texte qui se survole).

---

## 1. Carrousels (LinkedIn document PDF et Instagram), 1 080 × 1 350

Classées par impact attendu.

### C1. Une couverture qui montre le résultat et pose une tension, au lieu du titre du sujet
- **Ce qu'on change.** Page 1 = l'image du résultat fini (ou un écran partagé maillage / rendu) + une
  phrase de 4 à 8 mots qui crée un écart : un fait surprenant, un chiffre publié, une question. Jamais le
  logo ni l'intitulé du sujet. Un petit « 1 / 7 → » en bas à droite, sur la couverture seulement.
- **Pourquoi.** Socialinsider (2026) : la couverture doit annoncer un résultat ou une tension non résolue,
  pas un thème ; un chiffre, une affirmation nette ou une question arrêtent le défilement, à condition que la
  suite tienne la promesse. MagicPost : la page 1 est la seule que le fil affiche ; promesse ou tension,
  jamais le logo.
- **Dans l'outil.**
  - Champ `couverture?: string` sur `Sujet`. À défaut, `gabarits.ts` reprend **le premier plan de la vidéo
    du même sujet** (`VIDEOS.find(v => v.sujet === s.ref)?.plans[0].texte`) : les accroches vidéo sont déjà
    écrites ainsi (« Ce produit n'a jamais été photographié. », « Ce site a commencé par des blocs gris. »,
    « Cette vidéo a commencé par une phrase. »). Un même sujet garde la même accroche partout.
  - Image de couverture : le placement `role: 'couverture'` pointe vers l'image « en situation » (le résultat),
    pas vers une étape.
  - L'accroche doit rester vraie **avec la mention de l'image** : « Ce produit n'a jamais été photographié »
    sur une image marquée « Illustration IA » laisse croire à un rendu 3D. Si l'image n'est pas un vrai rendu,
    changer l'image ou la phrase.
  - Superviseur, niveau conseil : couverture identique à `s.titre`, ou de la forme « X, de A à B »,
    « en N étapes », « X, décortiqué », « Trois X, trois Y ».

### C2. Des captures réelles annotées plutôt que des illustrations IA
- **Ce qu'on change.** Quand une page parle de veolt.fr, d'un logiciel ou d'un livrable, elle montre la
  **vraie capture**, avec 1 à 3 repères numérotés (anneau magenta #B600A8, numéro et libellé de 2 à 4 mots en
  lavande #C79BFF, Inter demi-gras) qui pointent l'élément dont parle le texte. L'illustration IA devient
  l'exception, réservée aux mises en situation, et garde sa mention.
- **Pourquoi.** Mosseri (lettre de fin 2025) : même l'IA de bonne qualité a un « look » qui sonne fabriqué,
  l'image léchée ne prouve plus rien, l'imperfection devient la preuve qu'un humain était là. Hootsuite
  (Social Trends 2026, 6 500 professionnels) : plus de 30 % des consommateurs disent moins choisir une marque
  dont les publicités sont visiblement générées par IA. Sprout Social (2026, 2 300 consommateurs) : le
  contenu fait par des humains est la priorité n° 1 demandée aux marques.
- **Dans l'outil.**
  - Étendre `Cadrage` (`illustrations.ts`) : `reperes?: Array<{ x: number; y: number; n: number; libelle: string }>`,
    dessinés par `rendreIllustre` (`visuels.tsx`). Le texte de la page peut dire « ① le bouton ».
  - Superviseur, conseil : « plus de 2 pages intérieures sur 4 en illustration IA » (test sur `mentionDe`).
  - Liste de captures à produire par Jonathan (voir V2), toutes réelles, sans donnée personnelle.

### C3. La page 2 tient lieu de seconde couverture (Instagram)
- **Ce qu'on change.** Sur `ig-carrousel`, la page 2 porte la deuxième image la plus forte (le résultat, ou
  l'avant / après) et une phrase qui accroche seule. Pas de « Étape 1, … » en page 2.
- **Pourquoi.** Metricool (2026, 24,3 millions de posts), repris par eMarketer : Instagram re-présente les
  carrousels aux personnes qui n'ont pas réagi au premier passage. `[?]` Les créateurs observent que ce second
  passage s'ouvre sur la page 2 ; la source ne le précise pas. À vérifier sur les statistiques du compte.
- **Dans l'outil.** Paramètre de gabarit `ig-carrousel` : la page 2 = la page dont le placement est le plus
  « montrant » (résultat, avant / après, capture). Superviseur, conseil : page 2 qui commence par
  « Étape 1 », « Ligne 1 », « Premier entretien ».

### C4. Chiffres géants, seulement pour les chiffres publiés
- **Ce qu'on change.** Une page qui contient un prix ou un délai **affiché sur veolt.fr** (119 € HT, 499 € HT,
  1 490 à 9 900 € HT, 24 h, 6 à 8 dossiers par mois) passe en gabarit « chiffre » : le nombre en Bebas Neue
  très grand (≥ 260 px sur 1 080), la légende en Inter, l'image de la page en vignette dans son cadre de
  verre (la règle « une image par page » tient).
- **Pourquoi.** Socialinsider : un chiffre est l'un des quatre déclencheurs d'arrêt du défilement. Adobe classe
  les « stats et repères » parmi les structures de carrousel qui fonctionnent. Un chiffre réel est aussi la
  preuve la plus difficile à contester.
- **Dans l'outil.** Détection dans `fiche.ts` : correspondance avec `offres-veolt.ts` et une courte liste
  blanche (« 24 h », « 6 à 8 dossiers »). **Jamais sur un `[?]`**, jamais sur un chiffre qui n'est pas dans
  ces deux sources.

### C5. L'avant / après en écran partagé, même objet, même cadre
- **Ce qu'on change.** Un gabarit `comparatif` : deux moitiés, étiquettes courtes en capitales (AVANT / APRÈS,
  ESQUISSE / RENDU, ZONING / EN LIGNE), séparateur vertical au dégradé de marque. Une image composée compte
  pour une image. Cas tout trouvés : `v-mt-2` pages 2-3, `v-mt-3` (maillage → rendu), `v-vf-4` (zoning → site),
  `v-vf-5` (esquisse → rendu).
- **Pourquoi.** Adobe range « tension / ceci ou cela » (comparaisons, révélations, avant / après) parmi les
  carrousels qui se démarquent. C'est la forme la plus directe du « montrer » : le lecteur juge lui-même.
- **Dans l'outil.** `placements` accepte `paire: [imageAvant, imageApres]`. Garde-fou : un avant / après sans
  mention « Concept Veolt » est bloqué s'il n'est pas un travail réel ; aucun chiffre de résultat (le `[?]` de
  `v-mt-2` reste tant qu'aucune mesure n'existe).

### C6. Un mot surligné, pas une phrase
- **Ce qu'on change.** La mise en valeur `*…*` existe ; la réserver à **1 à 4 mots** : le nombre, le nom
  concret, le verbe qui tranche. 13 mises en valeur actuelles font plus de 5 mots (une fourchette de prix
  comme « de 1 490 à 9 900 € HT » est l'exception normale).
- **Pourquoi.** Le surlignage sert à la lecture en diagonale sur mobile ; une phrase entière en couleur ne
  hiérarchise plus rien. Pas de chiffre d'étude trouvé sur ce point : règle de lisibilité, à mesurer `[?]`.
- **Dans l'outil.** Superviseur, conseil : surlignage de plus de 5 mots, ou plus de 2 surlignages par page.

### C7. Densité : la page se lit en 3 secondes
- **Ce qu'on change.** Titre ≤ 8 mots, explication ≤ 25 mots, ≤ 35 mots par page ; l'image occupe au moins
  la moitié de la surface `[?]`. Les pages actuelles (15 à 27 mots) passent ; la règle protège les suivantes.
- **Pourquoi.** Media Shower (agence) : 30 à 40 mots par page au plus, au-delà de 50 le lecteur décroche.
  Socialinsider : gros caractères, fort contraste, blocs courts.
- **Dans l'outil.** Superviseur, conseil par page. Le ratio image / texte se mesure dans `rendreIllustre`
  (hauteur du cadre de verre / hauteur utile).

### C8. Une page de fin qui demande le bon geste, selon le réseau
- **Ce qu'on change.** LinkedIn : la question (règle 14, inchangée). Instagram, carrousels de référence
  (packs `v-vf-2`, lignes de devis `v-dc-1`, pipeline `v-mt-3`) : « Gardez-le pour votre prochain devis. » ou
  « Envoyez-le à la personne qui s'occupe de votre site. »
- **Pourquoi.** Metricool 2026 : demander l'enregistrement augmente les enregistrements de 92 %, demander des
  commentaires les augmente de 203 %, demander des « j'aime » les fait baisser de 4,9 %. Les carrousels
  Instagram sont enregistrés 9 fois plus que les images seules. Mosseri : les envois en message privé pèsent
  lourd pour toucher des non-abonnés. Socialinsider : appel à l'enregistrement pour une méthode ou une liste.
- **Dans l'outil.** `appelIg?: string` sur `Sujet`, ou dérivé du pilier. Le garde-fou 12 ne vise que LinkedIn :
  y ajouter une liste blanche Instagram (garder, envoyer à) et garder l'interdiction de « likez ».

### C9. Légende Instagram : les mots qu'on cherche, peu de hashtags
- **Ce qu'on change.** Première ligne de légende = la phrase que le client taperait (« prix d'un rendu 3D
  produit », « devis site vitrine »), tirée de `s.requete` quand elle existe. 0 à 2 hashtags sur Instagram,
  en test A/B sur quatre semaines.
- **Pourquoi.** Metricool 2026 : les posts avec hashtags ont 31 % de vues et 33 % d'interactions de moins
  (corrélation, l'étude le dit) ; Instagram plafonne à 5 hashtags et indexe les légendes pour la recherche.
  Hootsuite : Google indexe désormais les contenus Instagram publics.
- **Dans l'outil.** `HASHTAGS` (`gabarits.ts`) : jeu distinct pour les formats `ig-*`, 2 au plus ; garde-fou 7
  étendu à Instagram.

### C10. Remettre les consignes à jour (cohérence)
- **Ce qu'on change.** `gabarits.ts` : « 7 pages (règle Veolt) » au lieu de « la fourchette utile est 8 à 10 ».
  `formats.ts` : ossature `li-carrousel` en 7 pages (couverture, 4 pages qui montrent, version finale, fin),
  `visuel` à « 7 pages au plus », `pieges` reformulé ; `ig-carrousel` idem. Titre du document LinkedIn
  (champ affiché au-dessus du PDF) = la phrase de couverture, pas le nom du fichier.
- **Pourquoi.** Le relecteur et l'IA reçoivent aujourd'hui deux règles contraires.
- **Dans l'outil.** Texte seulement ; la route PDF peut poser la métadonnée `Title`.

---

## 2. Reels, TikTok et vidéo LinkedIn

### V1. Les 3 premières secondes montrent le résultat et posent la tension
- **Ce qu'on change.** Plan 0 = l'image du résultat (ou l'écran partagé avant / après) + 4 à 8 mots qui
  créent un écart. Pas d'intitulé, pas de logo avant 6 s. Propositions de réécriture, **toutes tirées de faits
  déjà publiés** (à valider par Jonathan) :
  - `vid-v-vf-6` : « Dix questions. Une réponse sous 24 h. » (au lieu de « Une analyse gratuite, en dix étapes. »)
  - `vid-v-vf-7` : les trois sites côte à côte + « Vitrine, boutique ou site animé ? » (au lieu de « Trois sites, trois objectifs. »)
  - `vid-v-vf-5` : ouvrir sur les quatre coloris (le résultat), pas sur l'intitulé. `[?]` La formule « zéro photo »
    doit rester cohérente avec la mention « Illustration IA » de l'image.
  - `vid-v-v3-1` : déplacer la scène de marque (4,5–8 s) à la fin ; `vid-v-cu-1` : montrer le document dès 0 s,
    le titre en surimpression.
- **Pourquoi.** TikTok (guide créatif officiel) : la proposition dans les 3 premières secondes, l'accroche dans
  les 6 ; 90 % de l'effet sur la mémorisation publicitaire se joue dans les 6 premières secondes. Mosseri : le
  temps de visionnage est le premier signal de classement des Reels.
- **Dans l'outil.** Superviseur, conseil : premier texte qui ressemble à un intitulé (mêmes motifs que C1) ;
  alerte : scène `marque` ou `fin` qui commence avant 6 s.

### V2. De vraies démonstrations d'écran, dans le téléphone
- **Ce qu'on change.** Remplacer, plan par plan, les images fixes IA « animées » par des **enregistrements
  d'écran réels** de 3 à 6 s, posés dans le cadre téléphone déjà utilisé pour les captures (forme `telephone`).
  Mention « Enregistrement réel ». Liste de tournage courte, faisable en une heure, sans donnée client :
  1. le questionnaire de veolt.fr parcouru au doigt (enregistrement d'écran du téléphone) ;
  2. la page Tarifs défilée jusqu'au pack Business ;
  3. Blender : le logotype 3D ou la sphère de particules qui tourne (`outils/blender/` existe déjà) ;
  4. un rendu qui se calcule, tuile par tuile ;
  5. la timeline de montage d'une vraie vidéo Veolt.
- **Pourquoi.** TikTok (Global SMB Creative Playbook) : les publicités « lo-fi » obtiennent une considération
  33 % plus forte que les publicités léchées. Hootsuite 2026 : imperfections et rythme naturel signalent
  l'authenticité ; le sur-montage est passé. Mosseri : l'imperfection sert de preuve.
- **Dans l'outil.** `Plan.ecran?: string` (fichier de la médiathèque, origine `livrable` ou `clip`), rendu dans
  le téléphone par `fabrique-video.ts`. Priorité dans `montageParDefaut` : enregistrement réel > capture >
  illustration > décor 3D. Superviseur, conseil : vidéo des piliers `coulisses-methode` ou
  `montrer-le-travail` sans aucun plan réel.

### V3. Une fin courte, qui boucle
- **Ce qu'on change.** Supprimer le plan « titre centré, sphère en fond » (la morale passe en légende, ou en
  surimpression sur l'image du résultat). Ramener l'écran de fin de 4 s à 1,5 s au plus, sur l'image finale.
  Dernière image = première image, pour que la relecture s'enchaîne. L'appel passe dans la légende.
- **Pourquoi.** Temps de visionnage et taux de visionnage complet sont les premiers signaux (Mosseri, repris
  par Hootsuite, Later, SocialPilot) ; Hootsuite conseille explicitement de boucler les Reels. Aujourd'hui,
  `vid-v-vf-1` passe 7 s sur 26 à dire (27 %), `vid-v-vf-7` 7 s sur 22 (32 %).
- **Dans l'outil.** Superviseur, alerte : plans `centre` + `fin` > 15 % de la durée. `fabrique-video.ts` :
  option `boucle: true` qui fond le dernier plan vers l'image du plan 0.

### V4. Sous-titres cinétiques, un mot-clé en couleur
- **Ce qu'on change.** Le texte incrusté apparaît mot à mot au rythme du plan ; le mot entre astérisques (même
  syntaxe que les carrousels) prend le dégradé #B600A8 → #C79BFF. 10 mots par plan au plus.
- **Pourquoi.** TikTok : les éléments qui font lire augmentent le temps de visionnage et la mémorisation ;
  le guide recommande 5 à 10 mots par seconde au plus. Nos plans sont à 2 ou 3 mots par seconde : marge
  confortable. TikTok demande aussi de garder le texte dans la zone sûre de l'interface.
- **Dans l'outil.** Réutiliser `sousTitre` / `dessinerSousTitre` sans voix : minutage réparti sur la durée du
  plan. `[?]` Vérifier la marge droite (icônes TikTok et Instagram) en plus des 250 px réservés en bas.

### V5. Une durée par réseau, sans remplissage
- **Ce qu'on change.** TikTok : ≤ 30 s. Instagram : les vidéos de méthode passent à 40–60 s **en allongeant les
  démonstrations réelles** (V2), pas en ajoutant du texte. LinkedIn : une version longue de 90 à 180 s des
  séries « de bout en bout » (pipeline 3D, devis, Atelier Noir).
- **Pourquoi.** Socialinsider (statistiques vidéo 2026) : TikTok, 6,00 % d'engagement sous 30 s contre 4,20 à
  4,30 % entre 30 et 60 s ; Reels, 0,35 % et 10 374 vues en moyenne à 45–60 s contre 0,28 % et 4 700 vues sous
  30 s ; LinkedIn, 6,60 % et 900 vues à 120–180 s contre 5,80 % et 450 vues sous 30 s. Socialinsider précise :
  ne pas rallonger artificiellement. (Les trois réseaux ne calculent pas l'engagement de la même façon.)
- **Dans l'outil.** `formats.ts` : `ig-reel` « 10 à 20 s » → « 15–30 s (court), 40–60 s (méthode) » ;
  `ScriptVideo.variantes?: { tiktok?: Plan[]; linkedin?: Plan[] }`.

### V6. Un rythme d'ouverture plus serré
- **Ce qu'on change.** Le plan 0 se découpe automatiquement en trois micro-plans (zoom 1,0 → 1,15 → 1,3 sur le
  point d'intérêt du `cadrage`) ; ensuite, 3 à 5 s par plan sur les démonstrations.
- **Pourquoi.** TikTok : des changements de scène plus rapides retiennent en début de vidéo ; transitions et
  graphismes prolongent le visionnage.
- **Dans l'outil.** `fabrique-video.ts`, sur le plan 0 quand il a un `cadrage`. Aucun nouveau média.

### V7. Des transitions qui montrent la transformation
- **Ce qu'on change.** Entre deux étapes d'un même objet au même cadre (maillage → matériaux → éclairage →
  rendu), un balayage vertical plutôt qu'une coupe : on voit l'objet changer sur place.
- **Pourquoi.** Le pack a été généré à partir d'une seule référence : le cadre est déjà identique. Pas de
  chiffre d'étude trouvé sur ce point `[?]` : à juger sur la courbe de rétention des Reels concernés.
- **Dans l'outil.** `Plan.transition?: 'coupe' | 'balayage' | 'fondu'`, par défaut `coupe`.

### V8. Le son : une vraie voix, et l'IA dite quand elle parle
- **Ce qu'on change.** Une vidéo sur trois avec la voix de Jonathan (quelques phrases, hésitations comprises) ;
  sons réels de l'atelier (clics, ventilation d'un rendu) sous la musique de marque. Toute voix ElevenLabs est
  annoncée dans la légende (« voix de synthèse »).
- **Pourquoi.** Hootsuite 2026 : un léger accroc ou une hésitation passe désormais pour une marque
  d'authenticité. Sprout 2026 : ce que les consommateurs veulent le plus voir cesser, c'est le contenu IA non
  signalé ; Emplifi : 91 % attendent qu'une marque dise quand elle utilise l'IA.
- **Dans l'outil.** `Plan.voix?` / origine du fichier son ; garde-fou, alerte : voix d'origine `ia` sans mention
  dans la légende.

### V9. LinkedIn : penser au fil vidéo vertical
- **Ce qu'on change.** Exporter la version LinkedIn aussi en 9:16 (fil vidéo plein écran), avec sous-titres
  incrustés et une vignette = l'image du résultat ; garder une version 4:5 pour le fil principal `[?]`.
- **Pourquoi.** Sprout Social : LinkedIn a ajouté un fil vidéo vertical plein écran (mobile et ordinateur).
  Clipchamp (2025) signale que la vidéo verticale peut être recadrée dans le fil principal : d'où le test.
- **Dans l'outil.** `formats.ts`, `li-video` : « 4:5 (fil) et 9:16 (fil vidéo) ».

### V10. Aucun plan du milieu en texte seul
- **Ce qu'on change.** Étendre la règle du superviseur (« chaque plan du milieu montre ») à **tous les plans
  sauf le dernier**, ce qui attrape le plan de morale avant la fin et les ouvertures « titre seul ».
- **Dans l'outil.** `superviseur.ts`, `plansSansImage` : `slice(0, -1)` au lieu de `slice(1, -1)`.

---

## 3. Post image LinkedIn (et Instagram)

### I1. LinkedIn : plusieurs images plutôt qu'une
- **Ce qu'on change.** Pour un avant / après ou trois étapes, un post multi-images (2 à 4) plutôt qu'une image
  seule ; l'image seule reste pour le chiffre géant.
- **Pourquoi.** Buffer 2026 : sur LinkedIn, documents 21,77 % d'engagement, vidéo 7,35 %, images 6,52 %, texte
  3,18 %. Socialinsider 2026 : les posts multi-images obtiennent le plus de « j'aime » sur les grandes pages ;
  documents 7,00 %, multi-images 6,45 %.
- **Dans l'outil.** `li-texte-image` accepte `images[]` ; export PNG numérotés.

### I2. Quatre modèles d'image, choisis par le pilier
| Pilier | Modèle | Contenu autorisé |
|---|---|---|
| `positionnement-prix` | Chiffre géant | Prix affichés sur veolt.fr, rien d'autre |
| `demonter-un-chiffre` | Comparatif deux colonnes | Photo / 3D, devis A / devis B, avec des montants publiés ou des montants d'exemple **dits comme tels** |
| `coulisses-methode` | Bande de process (4 vignettes du même objet, une image composée) | Étapes réelles ou illustrées, mention gardée |
| `montrer-le-travail` | Avant / après | Concept Veolt mentionné, aucun résultat chiffré |
| `pedagogie-dirigeant` | Capture annotée | veolt.fr, un document d'exemple dit comme tel |

Une citation mise en forme ne sert que pour une phrase **réellement dite par Jonathan** : jamais de faux
témoignage (règle 2).
- **Dans l'outil.** `gabarits.ts` choisit le gabarit visuel par pilier ; `visuels.tsx` a déjà « chiffre »,
  « affirmation » et le cadre de verre ; reste `comparatif` (C5) et `bande`.

### I3. Le format portrait 4:5
- **Ce qu'on change.** 1 080 × 1 350 au lieu de 1 200 × 627 ou 1 200 × 1 200.
- **Pourquoi.** Socialinsider : le 4:5 occupe plus de hauteur dans le fil mobile ; à traiter comme une
  hypothèse à tester `[?]`.
- **Dans l'outil.** Consigne de `li-texte-image` et dimensions de la route PNG.

### I4. Le texte dans l'image : 12 mots, lisible en vignette
- **Ce qu'on change.** 12 mots au plus, 1 à 4 mots en couleur, pas d'emoji (règle existante). Test de
  vignette automatique : rendu à 270 px de large, aucune ligne sous l'équivalent de 12 px.
- **Dans l'outil.** Superviseur, conseil ; la taille de titre est déjà calculée dans `visuels.tsx`.

### I5. Garder la question dans l'image, en varier la forme
- **Pourquoi.** Metricool 2026 : une question en légende apporte 37 % de commentaires en plus.
- **Ce qu'on change.** Ne pas commencer toutes les questions par « Votre… » : alterner choix (« A ou B ? »),
  chiffre (« Combien de visuels par an ? »), expérience (« Qu'est-ce qui vous a freiné ? »).

### I6. Instagram : pas d'image seule
- **Pourquoi.** Metricool 2026 : image seule, portée −21,96 %, interactions −25,41 %, engagement −45,98 % sur un
  an. L'outil n'a pas de format image Instagram : le garder ainsi ; un sujet « image » devient un carrousel
  court ou un Reel.

---

## 4. Articles (blog veolt.fr et articles LinkedIn) : être lu, et cité par les IA

### A1. « Comment choisir », un tableau comparatif et une FAQ dans le gabarit
- **Ce qu'on change.** Le gabarit `blog-article` ajoute trois blocs : un tableau (critères en lignes, options en
  colonnes, montants publiés), une section « Comment choisir » (si… alors…), une FAQ de 3 à 5 questions.
- **Pourquoi.** Meltwater × LinkedIn (9,5 millions de citations IA, mai 2026), sur les 24 articles LinkedIn les
  plus cités : 100 % ont des listes, 92 % des intertitres H2/H3, 75 % nomment des outils ou des entreprises,
  67 % donnent des chiffres, 50 % une grille de comparaison, 33 % un guide « comment choisir ».

### A2. Des chiffres et des outils nommés
- **Ce qu'on change.** Chaque article donne au moins un chiffre publié (`offres-veolt.ts`) et nomme les outils
  **réellement utilisés** `[?]` (liste à fournir par Jonathan ; ne rien supposer).
- **Dans l'outil.** Garde-fou, conseil : article sans aucun nombre ou sans aucun outil nommé.

### A3. La fraîcheur se montre et s'entretient
- **Ce qu'on change.** « Mis à jour le JJ/MM/AAAA » visible ; revue à 90 jours des articles de prix ; l'année
  dans le titre des articles de prix (« Prix d'un site vitrine en 2026 : ce que contient un devis »).
- **Pourquoi.** Meltwater : 48 % des contenus LinkedIn cités ont moins de trois mois, 25 % des articles les
  plus cités ont l'année dans le titre. Ahrefs (17 millions d'URL citées) : ChatGPT cite des pages plus
  récentes que Google, et Perplexity comme ChatGPT classent leurs références de la plus récente à la plus
  ancienne.
- **Dans l'outil.** Colonne `revoir_le` ; la page « Aujourd'hui » liste les articles à revoir.

### A4. « La réponse, en bref » : 60 mots, un chiffre
- **Ce qu'on change.** Le bloc existe ; le contraindre à 60 mots au plus, avec le chiffre et les mots de la
  requête visée dès la première phrase.
- **Pourquoi.** texta.ai (étude d'éditeur, à prendre comme indice) : réponse dans les 100 à 150 premiers mots,
  67 % de citations en plus. Meltwater : poser la question, donner la réponse en haut, puis les sections.
- **Dans l'outil.** Garde-fou, conseil (longueur et présence d'un nombre).

### A5. Publier aussi depuis un profil de personne `[à rouvrir par Jonathan]`
- **Ce qu'on change.** Chaque article repris en article LinkedIn **signé Jonathan**, et un post de la page qui
  le résume et y renvoie.
- **Pourquoi.** Meltwater : 75 % des citations IA de LinkedIn viennent de profils de membres, 25 % des pages
  entreprise ; LinkedIn est la 2e source citée par les IA en B2B, derrière YouTube. Hootsuite : le public fait
  plus confiance aux personnes qu'aux marques sans visage. Sprout : 40 % jugent le contenu des employés plus
  authentique que celui du compte de marque.
- **Limite.** Contredit la décision du 06/10/2026 (garde-fou 3, « pages entreprise, nous »). Ce document ne
  tranche pas : c'est à Jonathan de rouvrir le sujet.

### A6. Des figures qui informent, avec une légende autonome
- **Ce qu'on change.** Figures = captures annotées, schémas tirés de chiffres publiés, avant / après ; chaque
  figure a une légende d'une phrase qui se comprend seule et un texte alternatif descriptif. Mention IA gardée.
- **Pourquoi.** Meltwater : les IA retiennent des mots, une structure, des entités et des nombres ; 83 % du
  contenu cité est du texte. L'image sert le lecteur, la légende sert la citation.

### A7. Un auteur et des sources visibles
- Encadré auteur (nom, rôle, ce qu'il a fait lui-même), section « Sources » en fin d'article, date. Meltwater
  conseille de confier chaque sujet à quelqu'un qui a l'expérience pratique, pas seulement le titre.

---

## 5. Ce qui fait « contenu IA », et comment l'éviter

### 5.1 Ce qui a changé en 2026 (faits)
- **LinkedIn** (communiqué officiel, mai-juin 2026) : des systèmes repèrent le contenu générique produit par
  IA ; en test, ils l'identifiaient correctement 94 % du temps ; ce contenu est moins diffusé au-delà du réseau
  immédiat. Ce que LinkedIn veut : un point de vue, du contexte, une expertise.
- **Fortune** (octobre 2026) : bouton « ressemble à du contenu IA » lancé le 30 juillet, utilisé plus d'un
  million de fois en deux semaines ; selon Pangram, 41 % des posts LinkedIn longs d'avril à juin 2026 étaient
  entièrement générés.
- **Instagram** (Mosseri) : l'image léchée ne prouve plus qu'une chose a eu lieu ; le brut, l'imparfait
  deviennent la preuve.
- **Public** : Sprout 2026, 56 % voient souvent du contenu IA de mauvaise qualité dans leur fil ; Hootsuite,
  plus de 30 % moins enclins à choisir une marque aux publicités visiblement IA ; en France, Ipsos × Eskimoz
  (mars 2026), 35 % seulement jugent crédibles les contenus de l'IA générative, contre 65 % pour les moteurs
  de recherche.
- **Nuance utile** (Search Engine Land, repris par la PRSA) : le tiret cadratin est le signe que les lecteurs
  citent le plus, mais il abonde aussi dans l'écriture humaine et brouille la mesure ; ce sont les
  constructions « non seulement… mais aussi » qui montrent une corrélation négative nette avec l'engagement.
  Inutile donc de chasser le tiret ; chasser les formules.

### 5.2 Les tics, en français
Les quatre premières lignes viennent des études citées (traduites) ; les suivantes sont une **liste de travail**
tirée de l'usage courant `[?]`, pas d'une étude.

| Tic | Exemple | À la place |
|---|---|---|
| Ouverture-cadre | « Dans un monde où… », « À l'ère du numérique… » | Le fait, tout de suite |
| Précaution creuse | « Il est important de noter que… » | Supprimer, dire la chose |
| Balancement | « Non seulement… mais aussi… » | Deux phrases, ou une seule idée |
| Conclusion annoncée | « En conclusion », « En somme » | La dernière phrase porte la conclusion |
| Annonce de plan | « Voici comment… », « Découvrons… », « Plongeons dans… » | Commencer par l'étape 1 |
| Contraste fabriqué | « Ce n'est pas X, c'est Y. » | Dire Y. Garder la forme une fois par post au plus |
| Question-réponse | « Le résultat ? … » | Donner le résultat |
| Triade rythmée | « Rapide. Simple. Efficace. » | Un seul adjectif, prouvé |
| Mots gonflés | « véritable », « au cœur de », « levier », « clé » | Le mot exact ou rien |
| Emoji-balises | 👉 devant chaque appel, 👇 en fin de chaque accroche | Un emoji, pas à chaque post |

### 5.3 Ce qui, dans l'outil, ressemble à un gabarit
- **L'aparté fixe par pilier** : la même phrase revient sur chaque post LinkedIn texte ou vidéo du pilier
  (« Sans jargon, promis. », « Voici comment on s'y prend, concrètement. »). Remède : 4 à 6 variantes par
  pilier, tirées par l'identifiant du post, jamais deux fois en quatre semaines ; ou pas d'aparté quand
  l'accroche porte déjà la posture.
- **Les trois marques d'emoji systématiques** (emoji du pilier, 👉, 👇) : un post sur deux sans, et jamais les
  trois ensemble. Bloomberg (janvier 2026) : sur LinkedIn, les lecteurs scrutent emojis, tirets et formules
  répétées pour démasquer l'IA.
- **Les constructions en « n'est pas »** de `sujets.ts` (24, dont 5 « ce n'est pas X, c'est Y ») : en garder
  une par post au plus. `carrousels-veolt.ts` a déjà été nettoyé dans ce sens.
- **Le visuel** : 84 % d'images IA dans le pack. Même bien faites, elles ont un air de famille (lumière
  parfaite, objet centré, matière trop propre). Remède : C2 et V2.

### 5.4 Règles outillables
1. **Garde-fou 15, « tics IA »** (`garde-fous.ts`) : la liste du tableau 5.2 en expressions régulières ; conseil
   pour 1 occurrence, alerte à partir de 2 ; « ce n'est pas … c'est » compté à part (alerte au-delà de 1).
2. **Budget d'emoji** : 2 par post au plus, rotation dans `voixVeolt`.
3. **Champ « détail vécu »** sur le sujet : une chose précise qui s'est passée pendant le vrai travail (temps
   d'un rendu, nombre de versions jetées, une erreur corrigée). Vide = `[?]`, qui **bloque** comme les autres
   repères. Il ne se remplit jamais de mémoire : c'est la réponse directe au critère de LinkedIn (pas de point
   de vue propre = contenu générique).
4. **Ratio réel / IA** au superviseur, par post et par semaine (C2, V2).
5. **Montrer le travail en cours** : une version rejetée, un rendu bruité à mi-calcul, la timeline réelle. Ce
   sont les images que l'IA ne fabrique pas de façon crédible, et les plus faciles à prouver.

---

## 6. Les 10 propositions les plus fortes, tous formats confondus

1. **Couverture = résultat montré + tension en ≤ 8 mots**, reprise de l'accroche vidéo du même sujet (C1).
2. **Captures et enregistrements d'écran réels** à la place des images IA, avec repères numérotés ; 5 tournages
   d'une heure listés (C2, V2).
3. **Vidéos : fin ramenée à ≤ 1,5 s et en boucle**, plan de morale supprimé (V3).
4. **Ouverture vidéo sans intitulé ni logo avant 6 s**, trois scripts à réécrire, deux à réordonner (V1).
5. **Garde-fou « tics IA »**, aparté et emojis en rotation, champ « détail vécu » qui bloque s'il est vide (§5.4).
6. **Chiffres géants automatiques** pour les seuls prix et délais publiés (C4).
7. **Avant / après en écran partagé** : gabarit `comparatif`, carrousels et posts multi-images LinkedIn (C5, I1).
8. **Sous-titres cinétiques avec un mot-clé au dégradé**, sur le moteur `sousTitre` existant (V4).
9. **Fin de carrousel selon le réseau** : question sur LinkedIn, « gardez-le / envoyez-le » sur Instagram (C8).
10. **Articles : tableau, « comment choisir », FAQ, date de mise à jour et année dans le titre** (A1, A3).

## 7. Ce que Jonathan décide (rien n'est tranché ici)
- 7 pages tenues malgré les données favorables à 9-12 : le dire, et suivre le taux d'achèvement des documents.
- Publier depuis son profil personnel (A5) : remet en cause la décision du 06/10/2026.
- Sa voix sur une vidéo sur trois (V8), et les cinq enregistrements d'écran (V2).
- La liste des outils réellement utilisés, à nommer dans les articles (A2).

---

## Sources

**Carrousels et formats**
- Socialinsider, 2026 LinkedIn Benchmarks : https://www.socialinsider.io/blog/linkedin-benchmark/
- Socialinsider, LinkedIn benchmarks 2026 (PDF) : https://cdn.socialinsider.io/documents/linkedin_benchmarks_2026.pdf
- Socialinsider, benchmarks LinkedIn par format (page roumaine, tableau 2024-2025) : https://www.socialinsider.io/ro/social-media-benchmarks/linkedin
- Socialinsider, LinkedIn Carousel: Performance Data, Tips and Best Practices : https://www.socialinsider.io/blog/linkedin-carousel/
- MagicPost, How Many Slides Should a LinkedIn Carousel Have? (67 765 carrousels) : https://magicpost.in/blog/how-many-slides-in-a-linkedin-carousel
- MagicPost, LinkedIn Statistics 2026 : https://magicpost.in/de/blog/linkedin-statistics
- Oktopost, LinkedIn carousel best practices for B2B in 2026 : https://www.oktopost.com/blog/linkedin-carousel-pdf-best-practices/
- Media Shower, How to create a LinkedIn carousel : https://www.mediashower.com/blog/create-a-linkedin-carousel/
- Adobe Express, The swipe-right era of social : https://www.adobe.com/express/learn/blog/carousels-stand-out
- Buffer, Best Content Format on Social Platforms in 2026 : https://buffer.com/resources/data-best-content-format-social-media/
- Buffer, Instagram Reels best for reach, not engagement (2024) : https://buffer.com/resources/instagram-reach-engagement-analysis/
- Metricool, communiqué Instagram Study 2026 : https://metricool.com/press-release-instagram-study-2026/
- Metricool, 10 Instagram Trends Backed By Real Data in 2026 : https://metricool.com/instagram-trends/
- eMarketer, Carousels and questions drive Instagram engagement : https://www.emarketer.com/content/carousels-questions-drive-instagram-engagement

**Vidéo**
- Socialinsider, 2026 Social Media Video Performance Statistics : https://www.socialinsider.io/social-media-benchmarks/social-media-video-statistics
- Socialinsider, TikTok vs. Reels vs. Shorts 2026 : https://www.socialinsider.io/blog/tiktok-vs-instagram-reels/
- Socialinsider, How Long Should TikTok Videos Be? : https://www.socialinsider.io/blog/how-long-are-tiktok-videos/
- TikTok Ads, Creative best practices for performance ads : https://ads.tiktok.com/resources/help/article/creative-best-practices?lang=en
- TikTok for Business, Creative best practices from top performing ads : https://ads.tiktok.com/business/en-US/blog/creative-best-practices-top-performing-ads
- TikTok, Global SMB Creative Playbook (PDF) : https://ads.tiktok.com/business/library/Global_SMB_Creative_Playbook.pdf
- Hootsuite, Instagram algorithm : https://blog.hootsuite.com/instagram-algorithm/
- Later, Instagram Reels algorithm : https://later.com/blog/instagram-reels-algorithm/
- SocialPilot, Instagram Reels Algorithm (septembre 2026) : https://www.socialpilot.co/blog/instagram-reels-algorithm
- Metricool, The Complete Instagram Reels Guide 2026 : https://metricool.com/instagram-reels-guide/
- Sprout Social, LinkedIn video : https://sproutsocial.com/insights/linkedin-video/
- Clipchamp, The ultimate guide to LinkedIn videos (2025) : https://clipchamp.com/en/blog/linkedin-guide/

**Authenticité, contenu IA**
- LinkedIn, Keeping conversations real on LinkedIn : https://news.linkedin.com/2026/keeping-conversations-real-on-linkedin
- Fortune, I've spent a decade teaching AI to write… (6 octobre 2026) : https://fortune.com/2026/10/06/ai-slop-marketing-ghostwriter-copy/
- WebProNews, LinkedIn's AI Slop Crisis (Pangram) : https://www.webpronews.com/linkedins-ai-slop-crisis-new-data-shows-over-40-of-long-posts-machine-written-as-platform-fights-back/
- Bloomberg, On LinkedIn, Everyone's an AI Detective Now : https://www.bloomberg.com/news/articles/2026-01-30/chatgpt-written-linkedin-posts-have-users-analyzing-emojis-other-ai-signs
- PRSA, Which Signs of AI Writing Disengage People Most? : https://www.prsa.org/article/which-signs-of-ai-writing-disengage-people-most-APRIL26
- Search Engine Land, The AI writing tics that hurt engagement : https://searchengineland.com/ai-writing-tics-engagement-study-470051
- Engadget, Instagram chief: … fingerprint real media : https://www.engadget.com/social-media/instagram-chief-ai-is-so-ubiquitous-it-will-be-more-practical-to-fingerprint-real-media-than-fake-media-202620080.html
- Creative Bloq, Instagram's boss admits AI slop has won : https://www.creativebloq.com/art/digital-art/instagrams-boss-admits-ai-slop-has-won-but-where-does-that-leave-creatives
- Hootsuite, Social Media Trends 2026 : https://www.hootsuite.com/research/social-trends
- Hootsuite, social media trends (blog) : https://blog.hootsuite.com/social-media-trends
- Think Digital, résumé Hootsuite Social Trends 2026 : https://www.thinkdigital.travel/research-directory/hootsuite-social-trends-2026
- Sprout Social, 2026 Social Media Content Strategy Report : https://sproutsocial.com/insights/data/2026-social-media-content-strategy-report/
- Sprout Social, Building trust through social media : https://sproutsocial.com/insights/building-trust-through-social-media/
- Sprout Social, communiqué sur l'information et l'IA : https://sproutsocial.com/insights/press/social-media-is-now-the-top-source-for-breaking-news-new-sprout-social-research-finds/
- eMarketer (Emplifi), Consumers demand proof of authenticity : https://www.emarketer.com/content/consumers-demand-proof-of-authenticity-across-every-touchpoint--survey-finds
- The Media Leader FR (Ipsos × Eskimoz) : https://fr.themedialeader.com/?p=221252

**Articles et GEO**
- Meltwater × LinkedIn, 9.5M AI citations analyzed : https://www.meltwater.com/en/blog/linkedin-ai-visibility-study
- Ahrefs, Do AI assistants prefer to cite fresh content? : https://ahrefs.com/blog/do-ai-assistants-prefer-to-cite-fresh-content
- Seer Interactive, Content Recency's Impact on AI Visibility in 2026 : https://www.seerinteractive.com/insights/study-content-recencys-impact-on-ai-visibility-in-2026
- texta.ai, ChatGPT Citation Study (étude d'éditeur) : https://texta.ai/blog/chatgpt-citation-study-1000-websites
