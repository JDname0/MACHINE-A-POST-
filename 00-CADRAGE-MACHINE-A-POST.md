# Machine à post — cadrage

> Dépôt **autonome**. Il ne dépend d'aucun autre projet et n'en modifie aucun.
> Date : 2026-10-06 · Auteur : Jonathan + Claude
> Frères d'armes, à ne pas confondre : `~/Desktop/prospection` (sortant, un à un,
> Veolt) et `~/Desktop/magistria-prospection` (sortant, un à un, MagistrIA).
> **Celui-ci fait l'inverse : du public, du un-à-beaucoup, de l'entrant.**

---

## 1. Le prompt clair (ce que j'ai compris)

> « Construis-moi une machine à post, dans un environnement à part, qui serve
> **deux entités distinctes** — Veolt et MagistrIA — en reprenant ce que les deux
> projets existants disent déjà de l'idée, de la vision, du ton, de qui on est, de
> ce qu'on fait et de comment ça marche. Le but est de **réussir les lancements**
> sur LinkedIn, TikTok, Instagram, Reddit et le reste, avec un **calendrier
> éditorial**, des **structures de post qui fonctionnent en 2026** réseau par
> réseau, le **SEO**, les **articles**, le **backlinking**, et de quoi **suivre**
> la communication : posts, campagnes, indicateurs, Meta Ads, blog. »

### Le principe non négociable, repris des deux autres machines

**L'outil propose, tu décides.** Rien ne part vers l'extérieur sans un « oui » de
ta part, publication par publication. La machine prépare, contrôle, trace et
mesure. Elle ne publie pas à ta place.

C'est aussi une décision technique, pas seulement morale : brancher une
publication automatique sur cinq réseaux demanderait cinq jeux d'identifiants
d'API, cinq revues d'application et une responsabilité éditoriale déléguée à du
code. Aucun des trois n'existe aujourd'hui. Prétendre le contraire dans
l'interface serait le même mensonge que les « 28 clients » du site Veolt.

### Deux entités, deux cloisons

Ce n'est pas un outil avec un filtre « marque ». Ce sont **deux systèmes
éditoriaux dans la même maison**, parce que tout diverge : l'acheteur, le
registre de langue, les réseaux qui comptent, les preuves autorisées et même les
couleurs. Ce qui est commun, c'est la mécanique : piliers → calendrier → gabarit
→ garde-fous → publication → mesure.

Conséquence concrète : **aucun contenu ne traverse la cloison**. Un post Veolt ne
peut pas être « réutilisé » pour MagistrIA. L'interface change de thème quand on
change d'entité — c'est volontaire, c'est un rappel visuel qu'on a changé de
métier et de règles.

---

## 2. Qui on est — l'état réel des deux entités

Relevé le 2026-10-06 depuis le code et les cadrages existants. **Ce tableau est
le socle de tout ce qui suit** ; il contient notamment ce qu'on **n'a pas le
droit de dire**, qui compte autant que le reste.

### 2.1 Veolt — studio créatif et conseil

| | |
|---|---|
| Marque | **Veolt Studio Créatif** · « 3D · Web · Stratégie » |
| Entité juridique | **ENERVO**, SAS au capital de 500 € · RCS Nanterre 107 715 823 |
| Immatriculée | 17 juillet 2026 — **trois mois d'existence** |
| Site | `veoltproduction.fr` (o2switch) |
| Baselines existantes | « Veolt vous met sur orbite » · « de l'idée au lancement » · « votre assistant privé » |
| Offres | business plan 490–1 790 € · web et web 3D 1 490–9 900 € · vidéo/3D/motion 119–3 500 € |
| Capacité | **6 à 8 dossiers par mois**, toutes offres confondues |
| Zone | France, Europe incluse |
| Porte d'entrée | **analyse gratuite, réponse sous 24 h** |

**La singularité réelle** : des développeurs web, des créateurs vidéo **et des
analystes financiers** dans la même structure. Une agence créative ne fait pas de
prévisionnel ; un cabinet de conseil ne fait pas de 3D. C'est un fait vérifiable,
pas une promesse — donc c'est le meilleur angle éditorial disponible.

**⛔ Interdit en communication publique** (confirmé par Jonathan le 2026-09-17) :
les « 28+ clients accompagnés », les témoignages et tous les résultats chiffrés
affichés sur le site sont des **données de démonstration**. Les reprendre dans un
post serait une pratique commerciale trompeuse, et sur un réseau social c'est
public, horodaté et capturable. La règle vaut aussi pour les visuels.

**✅ Citable** : le contenu des prestations, les prix (volontairement sous le
marché — c'est un argument), le délai de 24 h *à condition de le tenir*,
l'analyse gratuite, la combinaison des trois métiers, et **l'expérience
personnelle de l'associé** — formulée « mon associé a accompagné X sur Y », jamais
« nous avons accompagné ».

**La stratégie qui en découle** : un studio sans historique ne vend pas en
rassurant, il vend en **donnant d'abord**. Sur les réseaux, ça se traduit
littéralement : on publie le travail, la méthode, les chiffres de nos propres
analyses, les coulisses de la 3D. Le post *est* l'échantillon.

### 2.2 MagistrIA — l'intelligence au service du droit

| | |
|---|---|
| Nom | contraction de **magistrat** + **IA** |
| Signature | **« L'intelligence au service du droit »** |
| Principe fondateur | **« L'IA propose, le professionnel décide »** |
| Cœur de cible MVP | **assureurs et mutuelles** (cadrage §5), puis cabinets et directions juridiques |
| Prix | Freemium 0 € · Pro 59 €HT/mois · Cabinet/Entreprise 249 €HT/mois · Grand Compte sur devis |
| Marché comparable | Ordalie 69–105 € · Lexbase ~116 € · GenIA-L dès 213 € · Predictice dès 250 € |
| Identité | Bleu Magistral `#0D1B2A` · Bleu Professionnel `#1E3A8A` · Or Juridique `#D4AF37` · Playfair Display + Inter |
| Logo | pilier (institution) + étoile (excellence) dans un écusson (confidentialité) |

**La singularité réelle** : l'outil **raisonne par méthodes professionnelles
nommées** — FAIR, EBIOS Risk Manager, syllogisme juridique — et non en IA
généraliste. Il cite ses sources (code des assurances, arrêts, bases CVE/NIST) et
dit quand les pièces ne permettent pas de conclure. C'est l'angle éditorial le
plus défendable face à la défiance des juristes envers l'IA : **on ne vend pas une
IA qui tranche, on vend une IA qui instruit et laisse trancher.**

**⛔ Interdit en communication publique** :
- toute formulation qui laisse croire que l'outil **rend un avis juridique** ou
  remplace le professionnel — c'est contraire au principe fondateur et au
  périmètre réglementaire de la profession ;
- la **cible magistrats**, explicitement hors périmètre MVP du cadrage
  (indépendance judiciaire) — ne pas en faire un argument public ;
- les **données de démonstration** de l'application présentées comme des cas réels ;
- toute promesse d'hébergement souverain / HDS / SecNumCloud : le cadrage les
  **exige à terme**, elles ne sont **pas en place**. Le dire serait faux.

**✅ Citable** : les méthodes nommées, les sources officielles réellement
branchées, le principe de décision humaine, les prix, le freemium sans carte
bancaire, et le droit lui-même — un arrêt commenté est du contenu vrai, gratuit
et infiniment renouvelable.

---

## 3. Vision et promesse éditoriale — une phrase par entité

Tout post doit pouvoir se rattacher à l'une de ces deux phrases. Si on n'y
arrive pas, le post n'a pas de raison d'exister.

> **Veolt** — « Un studio qui réunit la 3D, le web et l'analyse financière, et qui
> le prouve en donnant son travail avant de le vendre. »

> **MagistrIA** — « Une IA juridique qui montre son raisonnement et ses sources,
> pour que le professionnel garde la décision. »

---

## 4. Piliers éditoriaux — la grille qui remplit le calendrier

Un pilier n'est pas un thème, c'est un **engagement de fréquence**. Les parts
ci-dessous sont celles que la machine applique pour répartir le calendrier.

### Veolt

| Pilier | Part | Ce qu'on y met | Preuve mobilisée |
|---|---|---|---|
| **Montrer le travail** | 30 % | rendus 3D, avant/après de site, packshots, motion | le livrable lui-même |
| **Démonter un chiffre** | 25 % | lecture d'un prévisionnel, coût réel d'un site, unités économiques | analyse faite par nous |
| **Coulisses et méthode** | 20 % | le pipeline 3D, comment on cadre un business plan | le processus |
| **Pédagogie dirigeant** | 15 % | ce qu'un banquier regarde, pourquoi un devis varie ×6 | le droit commun du métier |
| **Positionnement et prix** | 10 % | pourquoi nos prix sont bas et assumés, ce qu'on ne fait pas | les prix affichés |

### MagistrIA

| Pilier | Part | Ce qu'on y met | Preuve mobilisée |
|---|---|---|---|
| **Un arrêt, une conséquence** | 30 % | une décision récente et ce qu'elle change en pratique | la décision, citée |
| **La méthode nommée** | 25 % | FAIR, EBIOS, syllogisme : comment l'outil raisonne | la méthode publiée |
| **Le sinistre décortiqué** | 20 % | clause d'exclusion, délai de déclaration, charge de la preuve | le code des assurances |
| **Conformité datée** | 15 % | NIS 2, RGPD, échéances réelles | les textes et leurs dates |
| **Position sur l'IA** | 10 % | pourquoi « l'IA propose, le professionnel décide » | notre propre architecture |

---

## 5. Les réseaux et les formats retenus

Périmètre arrêté par Jonathan le 2026-10-06. **Quatre réseaux, six formats**, plus
le blog. Rien d'autre n'est construit — ni X, ni YouTube, ni Pinterest — pour que
ce qui est là soit tenu correctement.

| Réseau | Formats retenus | Veolt | MagistrIA |
|---|---|---|---|
| **LinkedIn** | texte + image · carrousel (document) · vidéo *(ponctuelle)* | 🟢 principal | 🟢 **principal, et de loin** |
| **Instagram** | carrousel · Reel · vidéo | 🟢 principal | 🟡 secondaire |
| **Reddit** | post textuel | 🟡 prudent — voir §6.3 | 🟡 prudent — voir §6.3 |
| **TikTok** | vidéo courte | 🟢 secondaire | 🔴 à éviter |
| **Blog** | article de grappe | 🟢 socle | 🟢 socle |

**Qui porte la parole** : **les pages entreprise uniquement** (décision de
Jonathan). Tous les posts sont donc écrits au « nous », et la machine l'impose —
un brouillon à la première personne du singulier est signalé.

> Conséquence que je dois dire : une page entreprise démarre plus lentement qu'un
> profil personnel, LinkedIn diffusant structurellement moins les pages. Le
> calendrier en tient compte en misant sur le **format document**, qui est le seul
> où une page tient la comparaison avec un profil, et sur la régularité plutôt que
> sur les coups d'éclat. Si après six semaines la portée reste plate, le levier le
> plus rentable sera de relayer les posts de page depuis ton profil — à rouvrir à
> ce moment-là, pas avant.

**MagistrIA sur TikTok : non.** Le registre du réseau est incompatible avec la
gravité juridique, et une page d'IA juridique qui fait du TikTok perd exactement
l'actif qu'elle construit — la crédibilité devant un gestionnaire de sinistres.
Le compte peut rester ouvert et dormant.

## 6. Structure de post qui fonctionne en 2026, format par format

Cette section est l'ossature de la bibliothèque de formats de l'outil
(`src/lib/formats.ts`). Les valeurs viennent des relevés 2026 listés en §12.
Un format = des limites dures, une ossature, un indicateur à surveiller.

### 6.1 LinkedIn

**Ce qui a changé** : le signal dominant n'est plus l'engagement, c'est le **temps
de lecture**. Un post très liké mais survolé est moins diffusé qu'un post peu liké
mais lu trente secondes. Toute la structure en découle.

#### 6.1.1 Texte + image — le format de base, 2 fois par semaine

```
[ACCROCHE]      ≤ 210 caractères — c'est tout ce qui est visible avant « voir plus ».
                Une affirmation précise, chiffrée ou à contre-courant. Jamais une question creuse.
[RUPTURE]       un saut de ligne. Le « voir plus » doit tomber ici.
[CORPS]         paragraphes de 1 à 2 lignes, beaucoup de blancs.
                14 paragraphes courts battent 7 longs.
[PREUVE]        le chiffre, la pièce, l'arrêt, le rendu. C'est ce qui tient le lecteur.
[ENSEIGNEMENT]  une phrase qui se retient et se cite.
[APPEL]         une seule demande. Un avis, pas un rendez-vous.
```

- **Longueur utile** : 900 à 1 800 caractères. Viser 1 200–1 500. Plafond dur : 3 000.
- **Image** : 1 200 × 1 200 (carré) ou 1 200 × 627. Elle doit être lisible en
  vignette et porter une information, pas décorer.
- **Objectif** : 30 secondes de lecture et plus. 31–60 s = diffusion maximale.
- **Liens** : jamais dans le corps au premier jet. En commentaire, posté par la page.
- **Hashtags** : 3 maximum, descriptifs, en pied.

#### 6.1.2 Carrousel (document PDF) — le meilleur format disponible, 1 fois par semaine

C'est le format le plus performant tous réseaux confondus pour une page B2B :
~6,6 % d'engagement, et le seul où une page entreprise tient la comparaison avec
un profil personnel.

```
[PAGE 1]    le titre = la promesse. Lisible en vignette, 6 à 10 mots.
[PAGE 2]    le problème, en une phrase et un chiffre.
[PAGES 3-8] une idée par page. Jamais deux. Une page = un écran de métro.
[PAGE 9]    « à retenir » — la synthèse, celle qu'on capture d'écran.
[PAGE 10]   l'appel, et l'identité de l'entité.
```

- **8 à 10 pages.** En dessous de 6 le format ne vaut pas le travail, au-dessus
  de 12 le taux d'achèvement s'effondre.
- Format **1 080 × 1 350** (4:5) ou carré. PDF.
- **15 à 20 secondes** de lecture visées sur le document lui-même.
- Le texte du post qui l'accompagne reste court : 300 à 600 caractères.

#### 6.1.3 Vidéo — ponctuelle, pas hebdomadaire

Réservée à ce qui ne se raconte pas : une démonstration d'écran MagistrIA, un
rendu 3D Veolt en mouvement. **30 à 90 secondes**, 1:1 ou 4:5, **sous-titres
incrustés obligatoires** (la lecture se fait sans son), première seconde sur
l'image la plus forte. Sinon, on fait un carrousel : il coûte dix fois moins et
porte plus loin.

### 6.2 Instagram

#### 6.2.1 Carrousel — 2 fois par semaine

```
[VISUEL 1]  l'accroche visuelle. Lisible sans légende, sans logo imposant.
[VISUELS]   6 à 10 au total, une idée par visuel.
[DERNIER]   l'appel.
[LÉGENDE]   les 125 premiers caractères comptent — c'est tout ce qui s'affiche.
            La légende est indexée : elle contient les mots qu'on cherche.
```

Sur un compte installé, le carrousel **dépasse souvent le Reel** en portée. À
tester, pas à présumer. Format 1 080 × 1 350.

#### 6.2.2 Reel — 2 fois par semaine, le moteur de portée

```
[0–3 s]     le sujet lisible sans son. Pas d'intro, pas d'animation de marque.
[PROMESSE]  ce que le spectateur saura dans quinze secondes.
[CORPS]     10 à 20 secondes, 9:16, texte incrusté systématique.
[BOUCLE]    la dernière seconde renvoie à la première — la relecture compte double.
```

**10 à 20 secondes** est la zone utile. Plafond absolu 3 minutes, mais tout ce qui
dépasse 40 s perd en achèvement. **Veolt y est chez lui** : un rendu 3D est un
Reel tout fait.

#### 6.2.3 Vidéo longue (feed) — ponctuelle

Au-delà de 60 s, pour une démonstration ou un cas. Même règle : sous-titres
incrustés, pas de générique.

### 6.3 Reddit — post textuel

**Jonathan a tranché : on y poste.** Je le construis, et je dis une fois ce que ça
implique, parce que les règles 2026 sont plus dures qu'on ne le croit :

- la règle « 9 pour 1 » reste la norme de fait — neuf contributions utiles pour
  une mention de soi ; ~73 % des modérateurs raisonnent encore en ratio ;
- `r/SaaS` a resserré en avril 2026 à **une auto-promotion tous les 60 jours**,
  avec mise en liste noire de l'URL du produit en cas de manquement ;
- `r/marketing`, `r/SEO`, `r/PPC`, `r/b2bmarketing`, `r/LeadGeneration`
  **interdisent purement la promotion** ;
- certains sous-forums ne l'autorisent que dans un fil hebdomadaire dédié.

**Donc la machine ne traite pas Reddit comme les autres réseaux.** Elle tient une
fiche par sous-forum — règle d'auto-promotion, période minimale, date du dernier
post — et **bloque** un brouillon qui violerait la fréquence déclarée. Un compte
Reddit grillé est irrécupérable : c'est le seul réseau où le garde-fou est une
protection d'actif, pas une question de ton.

```
[TITRE]       une question ou un constat. Jamais le nom du produit.
[CORPS]       400 à 2 000 caractères. Le contexte d'abord, l'utilité ensuite.
[AFFILIATION] une ligne, en clair, à la fin : qui on est. C'est ce qui évite le ban.
[LIEN]        aucun au premier jet. En commentaire, si on le demande.
```

Un post Reddit qui marche **n'a rien à vendre**. Il raconte un chiffre, une
erreur, une méthode. Le trafic vient de la signature, pas du lien.

### 6.4 TikTok — vidéo courte, Veolt seulement

```
[0–3 s]   l'image la plus forte du montage, pas une introduction.
[3–8 s]   le problème, dit en une phrase.
[8–25 s]  la démonstration, en plans courts.
[FIN]     l'appel implicite : « dis-moi en commentaire ».
```

Priorité au **taux de visionnage complet**. **Pas de watermark importé** et pas de
réemploi brut d'un Reel : le réseau le détecte et l'enterre. 9:16, 15 à 30 s.

### 6.5 Le gabarit commun, quel que soit le format

Un post valable répond à ces six questions. La machine refuse de passer un
brouillon en « prêt » si l'une manque :

1. **À qui** ? (un persona nommé, pas « les entreprises »)
2. **Quelle preuve** ? (et est-elle autorisée pour cette entité ?)
3. **Quel pilier** ?
4. **Qu'est-ce que le lecteur sait de plus en partant** ?
5. **Quelle unique demande** ?
6. **Qu'est-ce qu'on mesure** ?

---

## 6bis. Connexion aux comptes — l'échelle à gravir, réseau par réseau

Les quatre comptes existent déjà (page LinkedIn, Instagram rattaché à Meta
Business, TikTok, Reddit). **Avoir le compte ne suffit pas pour publier par API** :
chaque réseau exige en plus une application développeur, des permissions
accordées, et pour trois d'entre eux une **revue humaine** de cette application.

La machine traite donc la connexion comme une **échelle à cinq barreaux**, affichée
en clair pour chaque réseau, avec le barreau courant :

```
1. COMPTE          le compte existe et est de type professionnel        ✅ les quatre
2. APPLICATION     une app développeur est créée côté réseau
3. PERMISSIONS     les portées d'écriture sont demandées
4. AUTORISATION    le jeton est obtenu et stocké côté serveur
5. REVUE           le réseau a validé l'app pour la publication
```

**Tant que le barreau 5 n'est pas atteint, la publication passe par la voie
manuelle assistée** — et ce n'est pas un pis-aller : l'outil prépare le texte au
format exact, les visuels aux bonnes dimensions, les hashtags, et te donne le tout
prêt à coller. C'est la voie qui fonctionne dès aujourd'hui, et elle reste
disponible même une fois les API branchées.

Ce qu'il faut réellement franchir, par réseau :

| Réseau | Ce qu'il faut | Difficulté réelle |
|---|---|---|
| **LinkedIn** | app LinkedIn Developers rattachée à la page, produit *Community Management*, portée `w_organization_social` | **revue requise.** C'est la plus sélective des quatre : LinkedIn refuse les apps sans cas d'usage clair |
| **Instagram** | app Meta, compte IG *professionnel* rattaché à une page Facebook, portées `instagram_content_publish` + `pages_read_engagement` | **revue requise.** Le piège classique : un compte IG « créateur » et non « entreprise » ne peut pas publier par API |
| **TikTok** | app TikTok for Developers, *Content Posting API*, portée `video.publish` | **revue requise**, et les comptes non audités publient en **brouillon privé uniquement** |
| **Reddit** | app de type *script*, identifiants OAuth, `User-Agent` nommé | **pas de revue** — c'est le seul réseau branchable en une heure |

> **Ordre recommandé** : Reddit d'abord (immédiat, ça valide la plomberie de la
> machine), Instagram ensuite (l'app Meta Business existe déjà, le chemin est le
> plus court des trois revues), LinkedIn en troisième, TikTok en dernier puisque
> MagistrIA n'y va pas et que Veolt n'y publiera qu'en secondaire.

**Les identifiants ne vivent jamais dans le dépôt** : variables d'environnement
lues côté serveur uniquement, jamais en `NEXT_PUBLIC_*`, jamais affichées dans
l'interface une fois posées. La machine montre « posé » ou « manquant », pas la
valeur.

**Et dans tous les cas la règle de §1 tient** : même API branchée, rien ne part
sans que tu aies fait passer la publication en « validé ». Le connecteur est un
bouton, pas un automate.

## 7. Garde-fous — ce que la machine refuse d'écrire

Codés dans `src/lib/garde-fous.ts`, appliqués à chaque brouillon.

**Communs aux deux entités**
- Jargon banni : « solution innovante », « révolutionner », « disruptif »,
  « booster », « game changer », « n'hésitez pas à », « je me permets de ».
- Pas de superlatif sans chiffre vérifiable derrière.
- Vouvoiement. Pas d'emoji en ouverture d'accroche.
- Une seule demande par publication.

**Veolt**
- Blocage dur sur toute reprise des données de démonstration du site
  (« 28 clients », témoignages, ROAS, « ×12 »).
- « Mon associé a… » autorisé ; « nous avons accompagné… » bloqué.
- Le prix de départ doit figurer dès qu'une offre est citée.
- Pas de vente de vidéo à l'unité.
- Aucun délai promis hors 24 h (devis) et 3–5 semaines (diagnostic).

**MagistrIA**
- Blocage sur toute formule d'avis juridique rendu par l'outil.
- Blocage sur « hébergement souverain », « HDS », « SecNumCloud » tant que ce
  n'est pas en place.
- Les magistrats ne sont pas une cible publique.
- Toute affirmation de droit exige une référence (article ou décision).

---

## 8. SEO, articles et backlinking

### 8.1 Ce qui a changé en 2026

L'**autorité thématique** est passée devant les backlinks comme premier signal
B2B. Un site qui classe 60 % des requêtes de sa catégorie capte ~3,2× plus de
trafic organique — et ~4,8× plus de **citations par les IA** — qu'un site qui en
classe 20 %. Les liens n'ont pas disparu : ils **amplifient** une autorité
existante, ils ne la créent plus.

S'y ajoute une seconde surface de recherche : **les moteurs de réponse**
(ChatGPT, Perplexity, Gemini, AI Overviews). Ils citent du contenu qui **répond
dans les 100 premiers mots**, sur des questions **longues et précises**, et ils
privilégient le **frais** — les URL citées par les IA sont en moyenne ~26 % plus
récentes que celles citées par la recherche classique.

### 8.2 La méthode retenue : grappes, profondeur d'abord

Pour chaque entité, **3 grappes** de 8 à 12 articles, chacune autour d'une page
pilier. Règle de maillage : tout nouvel article pointe vers les existants, et on
remonte les existants pour qu'ils pointent vers le nouveau. C'est ce maillage qui
fait l'autorité, pas le nombre d'articles.

**Grappes Veolt** (le blog existe déjà : 9 articles, 3 par offre)
1. *Business plan et financement* — pilier : « Faire un business plan qui passe en banque »
2. *Site web sur mesure* — pilier : « Combien coûte vraiment un site, et pourquoi »
3. *3D produit et publicité* — pilier : « Packshot 3D contre photo : le vrai arbitrage »

**Grappes MagistrIA**
1. *Sinistre et garantie* — pilier : « Refus de garantie : ce que l'assureur doit prouver »
2. *Conformité datée* — pilier : « NIS 2 et RGPD : les échéances qui engagent »
3. *IA et droit* — pilier : « Une IA qui montre son raisonnement : pourquoi ça change tout »

### 8.3 Forme d'un article qui est cité en 2026

```
[TITRE]       écrit comme la requête, pas comme une accroche de magazine
[RÉPONSE]     la réponse directe, dans les 100 premiers mots, autonome
[CONTEXTE]    pourquoi la question se pose
[CORPS]       une section par sous-question, chaque titre = une question réelle
[PREUVE]      données, articles de loi, décisions, chiffres mesurés par nous
[À RETENIR]   liste courte, citable telle quelle par une IA
[MAILLAGE]    3 à 5 liens internes vers la grappe
[DATÉ]        date de mise à jour visible — la fraîcheur est un signal
```

**Rythme** : 2 articles par semaine et par entité au lancement, puis 1 par
semaine en entretien, plus **une mise à jour d'un article existant par semaine**
— la mise à jour rapporte souvent plus que la création.

### 8.4 Backlinking — relevance avant volume

Priorité, du plus utile au moins utile :
1. **Annuaires et registres légitimes** du métier (ordres, fédérations, annuaires
   d'agences, places de marché) — lent, propre, durable ;
2. **Publication invitée** sur un média sectoriel réellement lu (legaltech,
   assurance, e-commerce selon l'entité) ;
3. **Donnée propriétaire** : une petite étude chiffrée faite par nous est la
   seule chose qui attire un lien sans le demander ;
4. **Partenariats et mentions croisées** avec des structures complémentaires ;
5. ⛔ **Jamais** : achat de liens, fermes d'annuaires génériques, échanges massifs.
   Un lien d'une publication sectorielle respectée vaut des dizaines de liens
   génériques.

---

## 9. Calendrier éditorial

Le calendrier n'est pas une liste de dates, c'est une **conséquence** : piliers ×
réseaux × cadence × capacité. La machine le génère sur douze semaines et affiche
en clair pourquoi chaque créneau existe.

**Semaine type — Veolt** (6 publications)

| Jour | Réseau | Format | Pilier |
|---|---|---|---|
| lundi | LinkedIn | texte + image | Démonter un chiffre |
| mardi | Instagram | Reel | Montrer le travail |
| mercredi | Blog | article | (grappe en cours) |
| mercredi | Instagram | carrousel | Coulisses et méthode |
| jeudi | LinkedIn | **carrousel 8–10 pages** | Montrer le travail |
| vendredi | TikTok | vidéo courte | Montrer le travail |
| samedi | LinkedIn | texte + image | Pédagogie dirigeant |

**Semaine type — MagistrIA** (5 publications, pas de TikTok)

| Jour | Réseau | Format | Pilier |
|---|---|---|---|
| lundi | LinkedIn | texte + image | Un arrêt, une conséquence |
| mardi | Blog | article | (grappe en cours) |
| mercredi | LinkedIn | **carrousel 8–10 pages** | La méthode nommée |
| jeudi | Instagram | carrousel | Le sinistre décortiqué |
| vendredi | LinkedIn | texte + image | Conformité datée |
| *au besoin* | Reddit | post textuel | *soumis au plafond de fréquence du sous-forum* |

**Les quatre semaines de lancement** (séquence identique pour les deux entités) :

1. **S1 — exister.** Qui on est, ce qu'on fait, ce qu'on ne fait pas. Le post de
   positionnement, assumé, sans fausse preuve.
2. **S2 — prouver.** Le travail, la méthode, un chiffre à nous. C'est la semaine
   qui décide de la crédibilité.
3. **S3 — servir.** Du contenu utile sans contrepartie : analyse gratuite (Veolt),
   arrêt commenté (MagistrIA). Premier appel réel.
4. **S4 — ouvrir.** Le produit, les prix, le freemium. On ne vend qu'après avoir
   donné trois semaines.

---

## 10. Campagnes payantes — Meta Ads et LinkedIn Ads

**Position honnête : pas avant la semaine 5.** Payer pour amplifier un message
qui n'a pas encore tenu en organique, c'est payer pour apprendre ce que
l'organique apprend gratuitement.

Et une contrainte concrète, déjà documentée côté Veolt : le paquet de
**consentement n'est pas posé** sur `veoltproduction.fr`. Le pixel Meta ne peut
pas être installé avant, et Matomo (exempté de consentement) passe d'abord. Un
pixel posé sans bandeau conforme, sur un site qui vend du conseil, est un risque
disproportionné.

Quand ça démarrera, la machine suit par campagne : canal, objectif, audience,
budget, dates, créatifs, et les indicateurs qui comptent — coût par conversation
engagée plutôt que coût par clic, parce que c'est la conversation qui se
transforme en dossier.

**Arbitrage de canal** : LinkedIn Ads pour MagistrIA (ciblage par fonction, seul
moyen d'atteindre un gestionnaire de sinistres), Meta pour Veolt (visuel, coût
d'impression bas, retargeting de l'analyse gratuite).

---

## 11. Indicateurs — mesurer ce qui décide

Un indicateur qu'on ne peut pas relever n'est pas un indicateur. Ce que la
machine demande est donc **saisi à la main après relevé**, comme pour les autres
projets, et elle le dit.

| Niveau | Indicateur | Pourquoi celui-là |
|---|---|---|
| Publication | **temps de lecture** (LinkedIn), **visionnage complet** (Reels/TikTok) | ce sont les signaux de diffusion réels en 2026 |
| Publication | clics sortants | seul lien mesurable vers le site |
| Grappe SEO | part des requêtes de la grappe en top 10 | mesure l'autorité thématique, pas la vanité |
| Grappe SEO | **citations par les IA** (relevé manuel sur 10 requêtes types) | nouvelle surface, invisible dans les outils classiques |
| Entonnoir | visites → analyse gratuite demandée (Veolt) / inscription freemium (MagistrIA) | la seule conversion qui compte |
| Entonnoir | **conversations engagées** | ce qui précède un dossier |
| Capacité | dossiers en cours / capacité (6–8 pour Veolt) | **frein volontaire** : saturer la capacité est un échec, pas un succès |

**Ce qu'on ne mesurera pas** : le nombre d'abonnés. Il ne prédit rien ici.

---

## 12. Sources des recommandations 2026

Relevé le 2026-10-06. Ces chiffres datent — ils devront être revérifiés, et c'est
pour ça qu'ils sont dans un fichier plutôt que dans du code.

- LinkedIn — limites, longueur utile, temps de lecture, performance du format
  document : `connectsafely.ai`, `teract.ai`, `viralbrain.ai`, `salesandmarketingengineers.co.uk`
- Reddit — règles d'auto-promotion par sous-forum, resserrement `r/SaaS` d'avril 2026 :
  `soar.sh`, `oneup.today`, `buildmvpfast.com`, `redditmaster.com`
- Instagram / TikTok — accroche 3 s, durées, carrousel contre Reel :
  `blog.hootsuite.com`, `invideo.io`, `influenceflow.io`, `benly.ai`
- SEO / AEO / GEO — autorité thématique devant les backlinks, réponse dans les
  100 premiers mots, fraîcheur des citations IA :
  `thesmarketers.com`, `knapsackcreative.com`, `integrated.social`, `abiresearch.com`, `incremys.com`

---

## 13. Ce que la machine fait, et ce qu'elle ne fait pas

**Elle fait** : tenir les deux identités et leurs règles · générer le calendrier
éditorial à partir des piliers · proposer un brouillon structuré au bon format
pour le bon réseau · refuser les brouillons qui violent un garde-fou · suivre la
file de publication, les grappes SEO, les cibles de backlink, les campagnes · et
mesurer ce qu'on lui donne à mesurer.

**Elle ne fait pas** : publier à ta place · se connecter aux réseaux · inventer
une preuve · relever automatiquement des statistiques · poser un pixel · écrire
un post sans que tu le relises.

**Reste à trancher** `[?]`
- La liste des missions réelles de l'associé Veolt — déjà demandée côté
  prospection, toujours manquante. C'est le matériau le plus précieux pour le
  pilier « Montrer le travail ».
- ~~Qui porte la parole~~ — **tranché le 2026-10-06 : les pages entreprise
  uniquement.** À rouvrir si la portée des pages reste plate après six semaines
  (cf. §5).
- Le consentement sur `veoltproduction.fr`, préalable à toute campagne Meta.
