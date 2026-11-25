/**
 * PREMIÈRE VERSION des pages de carrousel Veolt (25/11/2026, 10 à 12 pages),
 * gardée telle quelle : `raccourcirCarrousels` (`db.ts`) reconnaît un brouillon
 * resté à cette version et le passe à la version courte (`carrousels-veolt.ts`).
 * Ne pas modifier : ce fichier sert de référence pour détecter « non retouché ».
 */
/**
 * Les pages des carrousels Veolt, écrites pour le format (25/11/2026).
 *
 * Le corps d'un sujet est taillé pour un post texte : trois à cinq phrases.
 * Posé tel quel en carrousel, il donnait 6 à 8 pages d'une phrase chacune —
 * sous la fourchette utile du format (8 à 10 pages, `formats.ts`) et sans
 * profondeur. Ici chaque page porte **une idée** : un titre court (la première
 * phrase, qui finit par « . » ou « ? » — jamais « : », la page se couperait
 * là), puis une ou deux phrases qui l'expliquent.
 *
 * Règles tenues, comme dans `sujets.ts` : rien que des preuves autorisées
 * (`marques.ts`) — prix affichés, méthode, métier, structure. Aucun client,
 * aucun résultat chiffré inventé : ce qui manque reste marqué « [?] » et
 * bloque la validation tant qu'une mesure réelle ne le remplace pas.
 *
 * Le moule (`gabarits.ts`) ajoute la page 1 (titre du sujet), la page
 * « À retenir » (l'enseignement) et la page de fin (la question, l'identité).
 */
export const PAGES_CARROUSEL_VEOLT_V1: Record<string, string[]> = {
  // Le même produit, en photo studio et en 3D
  'v-mt-1': [
    "Deux images, deux métiers. La photo capte un objet réel sous une lumière réelle. La 3D reconstruit l'objet, puis l'éclaire comme on le décide.",
    "Ce que la photo fait mieux. La matière brute : un tissu, un grain de bois, une goutte sur une bouteille. Pour un seul visuel, elle reste imbattable.",
    "Ce que la 3D fait mieux. Quatorze angles, trois coloris et un fond qui change, sans relouer le studio ni refaire la retouche.",
    "Le vrai arbitrage n'est pas la qualité. C'est le nombre de déclinaisons dont vous aurez besoin pendant la vie du produit.",
    "En dessous de cinq visuels par référence. La photo reste moins chère : une séance, une retouche, et c'est terminé.",
    "Au-delà de cinq visuels. La 3D devient le seul format tenable : le modèle est fait une fois, les variantes ne coûtent presque plus rien.",
    "Nos rendus démarrent à 119 € HT la pièce. Ce n'est pas un prix d'appel : c'est le prix quand on ne refait pas le modèle à chaque fois.",
  ],

  // Avant / après sur une page d'accueil
  'v-mt-2': [
    "Le défaut le plus fréquent. En trois secondes, on ne sait pas ce que l'entreprise vend. Le visiteur repart avant la suite.",
    "Ce qu'on n'a pas changé. Même offre, même prix, mêmes textes sources. Le fond était bon, c'est l'ordre qui ne l'était pas.",
    "Avant, le slogan d'abord. Une phrase d'ambiance en haut de page, et l'offre trois écrans plus bas.",
    "Après, la promesse en haut. Ce que vous faites, pour qui, et à partir de quel prix, lisible sans défiler.",
    "Un seul bouton. Deux appels à l'action côte à côte se neutralisent : on a gardé celui qui mène au contact.",
    "Les preuves avant les arguments. Ce qui se vérifie — prix, délais, livrables — passe avant ce qui s'affirme.",
    "Le reste vient après. Animations, dégradés, 3D ne servent que si la première phrase tient.",
    "Le résultat chiffré. [?] taux de conversion avant / après, à poser dès qu'une mesure réelle existe. Sans mesure, on montre le travail, on n'annonce rien.",
  ],

  // Un pipeline 3D de bout en bout, en dix pages
  'v-mt-3': [
    "Modélisation. On reconstruit la forme exacte du produit, à partir de plans ou de photos. C'est le socle : il se réutilise pour tous les visuels suivants.",
    "Matériaux. Verre, métal brossé, carton mat : chaque surface se règle pour réagir à la lumière comme la vraie. Avec l'éclairage, c'est ce qui pèse le plus dans le budget.",
    "Éclairage. Le même objet change de caractère selon la lumière. C'est elle qui fait premium ou bon marché, bien plus que le modèle.",
    "Caméra. Angle, focale, profondeur de champ : on cadre comme un photographe, sans contrainte de placement.",
    "Animation. Pour une vidéo, la caméra et l'objet bougent. Quelques secondes bien rythmées valent mieux qu'un long tour du produit.",
    "Rendu. Le calcul des images, une par une. Sa durée dépend de la complexité des matériaux et de la lumière, pas de la taille de l'objet.",
    "Étalonnage. Les couleurs finales, accordées à la charte de la marque, comme pour un film. Un deuxième visuel du même produit ne repasse que par le cadrage, le rendu et cette étape.",
  ],

  // Pourquoi un devis de site varie de 1 500 à 10 000 €
  'v-dc-1': [
    "Deux devis, deux périmètres. 1 490 € et 9 900 € pour « le même site » : les deux peuvent être honnêtes, ils ne chiffrent pas la même chose.",
    "Ligne 1, les pages uniques. Cinq pages assemblées à partir d'un même gabarit ne coûtent pas cinq fois une page dessinée sur mesure.",
    "Ligne 2, qui écrit les textes. C'est le poste le plus souvent oublié dans un devis bas, et celui qui fait déraper le délai.",
    "Ligne 3, les fonctions. Un formulaire n'est pas un espace client, et un espace client n'est pas une facturation.",
    "Ligne 4, la 3D et le motion. Ils se chiffrent à part : un modèle 3D ou une animation est une production en soi.",
    "Comment lire votre devis. Pour chacune de ces quatre lignes, une seule question : incluse, chiffrée à part, ou absente ?",
    "Nos fourchettes sont publiques. De 1 490 à 9 900 € HT. Un devis qui ne dit pas lesquelles de ces lignes il contient n'est pas comparable.",
  ],

  // Le coût réel d'un visuel produit, par référence
  'v-dc-3': [
    "La photo, un coût par séance. Studio, photographe, retouche : à chaque nouvelle série de visuels, on repaie à peu près tout.",
    "La 3D, un coût par produit. Le modèle se paie une fois. Chaque visuel suivant ne demande qu'un cadrage et un rendu.",
    "Deux courbes qui se croisent. La photo monte à peu près en ligne droite avec le nombre de visuels. La 3D part plus haut, puis reste presque à plat.",
    "Le point de croisement. Autour de cinq visuels par référence : c'est un ordre de grandeur, pas une loi.",
    "Ce qui déplace ce point. Un produit aux formes simples rend la 3D rentable plus tôt. Une matière difficile à reproduire, comme un textile, la repousse.",
    "Notre prix de départ. Un rendu 3D à partir de 119 € HT, quand le modèle est réutilisé d'un visuel à l'autre.",
    "Le chiffre qui manque. [?] un devis photo réel du marché, pour que la comparaison soit chiffrée des deux côtés.",
  ],

  // Comment on cadre un business plan en quatre entretiens
  'v-cm-1': [
    "Pourquoi pas le tableur d'abord. Un prévisionnel rempli avant le cadrage aligne des chiffres sans hypothèses, et un banquier le voit tout de suite.",
    "Entretien 1, qu'est-ce qui est déjà vendu ? Un euro encaissé vaut dix pages de marché adressable.",
    "Entretien 2, combien de temps pour produire une unité ? C'est ce qui plafonne le chiffre d'affaires, bien avant la demande.",
    "Entretien 3, et si tout prend deux fois plus de temps ? La réponse décide du besoin de financement, et souvent de la viabilité du projet.",
    "Entretien 4, qui décide et qui paie ? En B2B, ce n'est pas la même personne, et le délai de vente en dépend.",
    "Ensuite seulement, le tableur. Il met les quatre réponses en colonnes : ventes, capacité, scénario dégradé, délai d'encaissement.",
    "Ce que vous obtenez. Un dossier dont chaque chiffre renvoie à une réponse. Nos business plans démarrent à 490 € HT.",
  ],

  // Ce qu'on refuse de faire, et pourquoi
  'v-cm-2': [
    "Pourquoi le dire. Annoncer ce qu'on ne fait pas fait gagner du temps à tout le monde, à commencer par vous.",
    "Refus 1, la vidéo à l'unité. Sur un seul visuel, nous ne sommes pas compétitifs. Le dire est plus utile que de surfacturer.",
    "À la place, une série. Le modèle 3D est fait une fois, et chaque visuel suivant coûte une fraction du premier.",
    "Refus 2, le site livré sans textes. Un site sans contenu écrit n'est pas un site, c'est une maquette — et le projet s'arrête souvent là.",
    "À la place, les textes dans le périmètre. Écrits par nous ou avec vous, avant le design, pas après.",
    "Refus 3, le prévisionnel écrit à l'envers. Partir du montant qu'on veut emprunter ne passe pas en banque, et ça nous engage.",
    "Ce qui rend ces refus possibles. Nous prenons 6 à 8 dossiers par mois. C'est aussi pour ça qu'on choisit.",
  ],

  // Trois métiers dans la même structure : à quoi ça sert concrètement
  'v-cm-3': [
    "Trois métiers, une seule structure. Des développeurs web, des créateurs vidéo et des analystes financiers travaillent sur le même dossier.",
    "Quand ils sont séparés. Une agence créative ne fait pas de prévisionnel. Un cabinet de conseil ne fait pas de 3D.",
    "Ce qui se passe alors. Le site se construit avant que le modèle économique soit arrêté.",
    "Le symptôme classique. Une page de prix qui ne correspond pas aux marges réelles, et qu'il faut refaire six mois plus tard.",
    "Notre ordre de travail. Le prévisionnel passe d'abord. Le site raconte ensuite un modèle qui tient.",
    "Et la vidéo ? Elle arrive en dernier, quand on sait quoi montrer et à qui. Un visuel sans message ne vend rien.",
    "Ce que ce n'est pas. Un fait sur notre structure, pas une promesse de résultat.",
  ],

  // ── Séries du 25/11/2026, tirées de veolt.fr (sujets-series-veolt.ts) ──

  // De la demande au devis
  'v-vf-1': [
    "Étape 1, le questionnaire. Dix questions guidées, en quelques minutes : votre secteur, où en est le projet, ce dont vous avez besoin.",
    "Étape 2, vos objectifs. Notoriété, ventes, levée de fonds ou refonte : on vous demande ce que le projet doit produire.",
    "Étape 3, budget et délai. Une fourchette suffit. C'est elle qui permet une réponse précise plutôt qu'un tarif générique.",
    "Étape 4, votre espace client. Il se crée à la fin du questionnaire. Vous y réservez directement un appel de cadrage.",
    "Étape 5, le devis sous 24 h. Périmètre, délai et prix arrêtés par écrit, dans votre espace.",
    "Étape 6, la commande. Un premier paiement à la commande, le solde à la livraison.",
    "Ce qui ne change jamais. Rien ne démarre avant votre accord.",
  ],

  // Nos packs vidéo, ligne par ligne
  'v-vf-2': [
    "Starter, 499 € HT. Cinq vidéos de 15 secondes, soit 99,80 € la vidéo : script, génération IA et montage, musique, sous-titres en vertical.",
    "Creator, 899 € HT. Dix vidéos de 15 secondes, des scripts variés, des accroches différentes et deux variations créatives.",
    "Pro, 999 € HT. Cinq vidéos de 30 secondes : storytelling, voix off, deux variantes à tester.",
    "Business, 1 799 € HT. Dix vidéos de 30 secondes, direction artistique et narration. C'est le pack qu'on recommande aux entreprises.",
    "Premium, 2 499 € HT. Cinq vidéos de 60 secondes : storyboard, narration cinéma, effets et motion design.",
    "À l'unité, dès 119 € HT. 15 secondes à 119 €, 30 secondes à 199 €, 60 secondes à 399 €. Les packs restent plus avantageux.",
    "Sur mesure, dès 3 500 € HT. Pour une campagne complète, avec un chef de projet dédié.",
  ],

  // Une vidéo fabriquée avec l'IA
  'v-vf-3': [
    "Étape 1, le script. Le message, le public, le rythme : tout s'écrit avant de générer la moindre image.",
    "Étape 2, le prompt. Chaque plan se décrit en une phrase précise : le sujet, la lumière, le cadre, les couleurs de la marque.",
    "Étape 3, la génération. Plusieurs versions du même plan, en quelques minutes au lieu d'une journée de tournage.",
    "Étape 4, le tri. On garde les meilleures, on jette le reste. L'IA propose, on choisit.",
    "Étape 5, le montage. Le rythme, les coupes, l'ordre des plans : c'est là que la vidéo prend son sens.",
    "Étape 6, le son. Musique et sound design, calés image par image.",
    "Étape 7, les formats. Sous-titres incrustés et une déclinaison par réseau : vertical, carré, horizontal.",
  ],

  // Atelier Noir, décortiqué
  'v-vf-4': [
    "Le point de départ. Une promesse en une ligne, « Plus qu'un parfum, une présence ». Tout le site en découle.",
    "Le zoning. Des blocs gris : la promesse en haut, le produit à droite, le bouton visible sans défiler.",
    "La maquette. La typographie, le flacon en héros, le rythme des sections. Toujours sans le moindre effet.",
    "La direction artistique. Le noir, la pierre, la lumière rasante : l'ambiance d'une boutique, sur un écran.",
    "Le développement. La même page, rapide sur mobile, avec ses vraies interactions.",
    "Le mobile. La promesse et le bouton tiennent sur un écran de téléphone, sans rien perdre.",
  ],

  // Une canette, de l'esquisse à la pub
  'v-vf-5': [
    "L'esquisse. La silhouette, l'esprit de la marque, les couleurs : tout se décide au crayon.",
    "Le modèle 3D. Les proportions exactes d'une canette slim, faites une fois pour toutes.",
    "L'étiquette. Elle se dessine à plat, puis s'enroule sur le modèle, au millimètre.",
    "Les déclinaisons. Le même modèle, quatre coloris, sans refaire une seule photo.",
    "Le rendu. L'aluminium, les gouttes, les reflets : la matière qui donne envie.",
  ],

  // L'analyse gratuite
  'v-vf-6': [
    "Étape 1, votre secteur. Une case à cocher, pour cadrer l'analyse dès le départ.",
    "Étape 2, où en est le projet. Une idée, un projet en structuration, une activité lancée ou établie.",
    "Étape 3, vos besoins. Branding, site web, vidéo 3D, stratégie, réseaux sociaux. Plusieurs réponses possibles.",
    "Étapes 4 à 6, objectifs, situation, budget. Ce que le projet doit produire, où vous en êtes, ce que vous pouvez engager.",
    "Étapes 7 à 10, l'entreprise et l'équipe. Surtout en cases à cocher : ça va plus vite qu'écrire.",
    "Ce que vous recevez. Des recommandations concrètes et un plan d'action clair, sous 24 h, sans engagement.",
  ],

  // Trois concepts Veolt décortiqués
  'v-vf-7': [
    "Novo, la vitrine. Une page sombre et minimale : on comprend l'offre sans défiler.",
    "Pourquoi une vitrine. Quand l'objectif est un appel ou une prise de contact, moins de pages, une seule action.",
    "Elysia, l'e-commerce. Des catégories, des fiches produit qui se comparent, un parcours d'achat sans détour.",
    "Pourquoi un e-commerce. Quand l'objectif est la vente en ligne, la structure suit le panier, pas l'inverse.",
    "Wealth, le site animé. Le mouvement sert la lecture et guide l'œil de section en section.",
    "Pourquoi un site animé. Quand l'objectif est de marquer les esprits, à condition que la première phrase tienne seule.",
  ],
};

/**
 * La dernière étape, montrée en situation réelle (25/11/2026) : le produit fini
 * dans un vrai décor, le site en main. Posée juste avant « À retenir », avec son
 * image du pack (`illustrations.ts`). Le texte ne dit jamais qu'il s'agit d'un
 * travail client : l'image porte sa mention (« Illustration IA », « Concept
 * Veolt »). Ajoutée aux brouillons non retouchés par `poserPagesFinales` (`db.ts`).
 */
export const PAGES_FINALES_VEOLT_V1: Record<string, string> = {
  'v-mt-3':
    "Le produit fini, en situation. Le même modèle, éclairé et étalonné, se pose dans un vrai décor. C'est cette image-là que voit le client final.",
  'v-mt-2':
    'Le site refait, en main. La promesse et le bouton tiennent sur un écran de téléphone, sans défiler : c’est là que se joue la première visite.',
  'v-dc-1':
    'À l’arrivée, un site en ligne. Exemple : Atelier Noir, concept de parfumerie conçu par Veolt, sur ordinateur et sur mobile. Le devis décrit ce chemin-là, ligne par ligne.',
  'v-dc-3':
    'Le visuel fini, en situation. Une fois le modèle fait, le même produit se pose dans une scène de vie sans nouvelle séance photo.',
  'v-vf-1': 'De votre côté, en vrai. Le questionnaire sur votre téléphone, une réponse écrite, un espace pour suivre : c’est tout ce qu’on vous demande.',
  'v-vf-2': 'Sur veolt.fr, en vrai. Les packs sont affichés tels quels, prix compris : rien à demander pour les voir.',
  'v-vf-3': 'Le résultat, en situation. La vidéo telle qu’elle passe dans le fil, sur le téléphone de vos clients.',
  'v-vf-4': 'Le site, en situation. Atelier Noir ouvert sur un portable et un téléphone, comme dans une vraie boutique.',
  'v-vf-5': 'La canette, en situation. Le même modèle, posé dans une scène de vie, sans aucune séance photo.',
  'v-vf-6': 'Sur veolt.fr, en vrai. Le questionnaire tel que vous le verrez, étape par étape.',
  'v-vf-7': 'À l’arrivée, un site en ligne. Atelier Noir, un autre concept Veolt, ouvert sur ordinateur et sur mobile.',
};

/**
 * Version courte du 25/11 à 22 h 30 (avant la relecture indépendante de 23 h 40) :
 * gardée pour reconnaître un brouillon resté à cette version intermédiaire.
 */
export const PAGES_CARROUSEL_VEOLT_V1B: Record<string, string[]> = {
  // Le même produit, en photo studio et en 3D
  'v-mt-1': [
    "La photo capte la matière. Un lin, un grain de chêne, une goutte sur du verre : pour *un seul visuel*, elle reste imbattable.",
    'La 3D, elle, se décline. Quatorze angles, trois coloris, un autre fond. *Sans relouer le studio*, sans refaire la retouche.',
    'Tout se joue sur le nombre. Sous *cinq visuels par référence*, la photo coûte moins cher. Au-delà, la courbe s’inverse.',
    'Un modèle, dix coloris. Le modèle se fait une fois, les variantes ne coûtent presque plus rien. Le rendu démarre *à 119 € HT*.',
  ],

  // Avant / après sur une page d'accueil
  'v-mt-2': [
    'Trois secondes pour comprendre. Si le visiteur ne voit pas ce que vous vendez, *il repart* avant la suite.',
    'Avant, le slogan d’abord. Une phrase d’ambiance en haut, *l’offre trois écrans plus bas*, et deux boutons qui se disputent.',
    'Après, la promesse en haut. Ce que vous faites, pour qui, *à partir de quel prix*. Et un seul bouton.',
    'Rien n’a été réécrit. Même offre, mêmes prix, mêmes textes. *Seul l’ordre a changé.*',
  ],

  // Un pipeline 3D de bout en bout
  'v-mt-3': [
    'Modéliser. On reconstruit la forme exacte, à partir de plans ou de photos. *Ce modèle sert ensuite à tous les visuels.*',
    'Habiller, puis éclairer. Verre, métal brossé, carton mat. Puis la lumière : *c’est elle qui fait premium*, ou bon marché.',
    'Cadrer, puis animer. Angle, focale, mouvement : on filme comme un photographe, *sans contrainte de place*.',
    'Calculer, puis étalonner. Le rendu image par image, puis des couleurs *accordées à votre charte*.',
  ],

  // Pourquoi un devis de site varie de 1 500 à 10 000 €
  'v-dc-1': [
    'Les pages uniques. Cinq pages tirées du même gabarit *ne coûtent pas cinq fois* une page dessinée sur mesure.',
    'Qui écrit les textes. C’est le poste oublié des devis bas, et *celui qui fait déraper le délai*.',
    'Les fonctions, la 3D. Un formulaire n’est pas un espace client. Une animation 3D est *une production à part entière*.',
    'Ligne par ligne, une seule question. Inclus, chiffré à part, ou absent ? Nos fourchettes sont publiques : *de 1 490 à 9 900 € HT*.',
  ],

  // Le coût réel d'un visuel produit, par référence
  'v-dc-3': [
    'La photo se paie à la séance. Studio, photographe, retouche : *à chaque nouvelle série*, on repaie presque tout.',
    'La 3D se paie au produit. Le modèle, une fois. Chaque visuel suivant, *un cadrage et un rendu*.',
    'Les courbes se croisent vers cinq. Autour de *cinq visuels par référence*, la 3D passe devant. C’est un ordre de grandeur, pas une loi.',
    'La matière déplace ce point. Une forme simple rend la 3D rentable plus tôt. *Un textile la repousse.*',
  ],

  // Comment on cadre un business plan en quatre entretiens
  'v-cm-1': [
    'Qu’est-ce qui est déjà vendu ? Premier entretien. *Un euro encaissé* pèse plus que dix pages de marché.',
    'Combien de temps pour une unité ? Deuxième entretien. C’est la capacité qui plafonne le chiffre, *bien avant la demande*.',
    'Et si tout prenait deux fois plus de temps ? Troisième entretien. La réponse fixe *le besoin de financement*.',
    'Qui décide, et qui paie ? Quatrième entretien. En B2B, rarement la même personne. *Le délai de vente en dépend.*',
  ],

  // Ce qu'on refuse de faire, et pourquoi
  'v-cm-2': [
    'On refuse la vidéo à l’unité. Sur un seul visuel, on n’est pas compétitifs. *À la place, une série* : le modèle se fait une fois.',
    'On refuse le site sans textes. Sans contenu, c’est une maquette. *Les textes entrent dans le périmètre*, avant le design.',
    'On refuse le prévisionnel à l’envers. Partir du montant qu’on veut emprunter *ne passe pas en banque*.',
    'Pourquoi on peut choisir. *6 à 8 dossiers par mois*, pas plus. Le dire fait gagner du temps à tout le monde.',
  ],

  // Trois métiers dans la même structure : à quoi ça sert concrètement
  'v-cm-3': [
    'Quand les métiers sont séparés. L’agence fait le site, le cabinet fait le prévisionnel. *Le site part avant le modèle économique.*',
    'Le symptôme. Une page de prix *qui ne colle pas aux marges réelles*, à refaire six mois plus tard.',
    'Notre ordre de travail. D’abord le prévisionnel. *Ensuite le site*, qui raconte un modèle qui tient.',
    'La vidéo en dernier. Quand on sait quoi montrer, et à qui. C’est un fait sur notre structure, *pas une promesse de résultat*.',
  ],

  // ── Séries tirées de veolt.fr (sujets-series-veolt.ts) ──

  // De la demande au devis
  'v-vf-1': [
    'Dix questions, quelques minutes. Votre secteur, où en est le projet, *ce dont vous avez besoin*.',
    'Vos besoins, cochés. Site, vidéo 3D, stratégie : *plusieurs réponses possibles*. Puis un budget et un délai, en fourchette.',
    'Votre espace client. Il se crée à la fin du questionnaire. *Vous y réservez l’appel de cadrage.*',
    'Le devis sous 24 h. Périmètre, délai et prix, par écrit. *Premier paiement à la commande*, le solde à la livraison.',
  ],

  // Nos packs vidéo, ligne par ligne (chaque page : la carte du pack, recomposée)
  'v-vf-2': [
    'Starter, 499 € HT. Cinq vidéos de 15 secondes, soit 99,80 € la vidéo.',
    'Creator, 899 € HT. Dix vidéos de 15 secondes, des accroches différentes.',
    'Business, 1 799 € HT. Dix vidéos de 30 secondes. Le pack qu’on recommande aux entreprises.',
    'Premium, 2 499 € HT. Cinq vidéos de 60 secondes, narration cinéma.',
    'À l’unité, dès 119 € HT. 15 secondes à 119 €, 30 secondes à 199 €, 60 secondes à 399 €.',
  ],

  // Une vidéo fabriquée avec l'IA
  'v-vf-3': [
    'Le script avant tout. Le message, le public, le rythme : *tout s’écrit avant de générer* la moindre image.',
    'Générer, puis trier. Plusieurs versions du même plan en quelques minutes. *L’IA propose, on choisit.*',
    'Le montage et le son. Les coupes, l’ordre, la musique calée à l’image : *c’est là que la vidéo prend son sens*.',
    'Un format par réseau. Sous-titres incrustés, puis *vertical, carré, horizontal*.',
  ],

  // Atelier Noir, décortiqué
  'v-vf-4': [
    'Une promesse, puis des blocs. « Plus qu’un parfum, une présence » : *tout le site en découle*. Le zoning la place en haut.',
    'La maquette. La typographie, le flacon en héros, le rythme des sections, *sans le moindre effet*.',
    'La direction artistique. Le noir, la pierre, la lumière rasante : *l’ambiance d’une boutique*, sur un écran.',
    'Le développement. La même page, *rapide sur mobile*, avec ses vraies interactions.',
  ],

  // Une canette, de l'esquisse à la pub
  'v-vf-5': [
    'L’esquisse. La silhouette, l’esprit de la marque, les couleurs : *tout se décide au crayon*.',
    'Le modèle 3D. Les proportions exactes d’une canette slim, *faites une fois pour toutes*.',
    'L’étiquette. Dessinée à plat, puis *enroulée sur le modèle*, au millimètre.',
    'Quatre coloris, zéro photo. L’aluminium, les gouttes, les reflets : *la matière qui donne envie*.',
  ],

  // L'analyse gratuite
  'v-vf-6': [
    'Votre secteur, d’un clic. Une case à cocher, *pour cadrer l’analyse* dès le départ.',
    'Où en est le projet. Une idée, un projet en structuration, *une activité lancée ou établie*.',
    'Vos besoins, puis le reste. Branding, site, vidéo 3D, stratégie. Objectifs, budget, équipe : *surtout des cases à cocher*.',
    'Ce que vous recevez. Des recommandations concrètes et *un plan d’action*, sous 24 h, sans engagement.',
  ],

  // Trois concepts Veolt décortiqués
  'v-vf-7': [
    'Novo, la vitrine. Une page sombre et minimale. Pour un appel ou une prise de contact, *une seule action*.',
    'Elysia, l’e-commerce. Des catégories, des fiches qui se comparent. *La structure suit le panier*, pas l’inverse.',
    'Wealth, le site animé. Le mouvement guide l’œil, *à condition que la première phrase tienne seule*.',
  ],
};

export const PAGES_FINALES_VEOLT_V1B: Record<string, string> = {
  'v-mt-1': 'Et à la fin, la vraie scène. Le même flacon posé dans une salle de bain, *sans séance photo*.',
  'v-mt-2': 'Sur le téléphone, ça tient. La promesse et le bouton se lisent *sans défiler*, là où se joue la première visite.',
  'v-mt-3': 'Le produit fini, en situation. Le même modèle se pose dans un vrai décor. *C’est cette image que voit votre client.*',
  'v-dc-1': 'À l’arrivée, un site en ligne. Atelier Noir, concept de parfumerie de Veolt, *sur ordinateur et sur mobile*.',
  'v-dc-3': 'Le visuel fini, en situation. Le même produit dans une scène de vie, *sans nouvelle séance photo*.',
  'v-cm-1': 'Ensuite seulement, le tableur. Chaque chiffre renvoie à une réponse. Nos business plans démarrent *à 490 € HT*.',
  'v-vf-1': 'Rien ne démarre sans votre accord. Le questionnaire sur votre téléphone, une réponse écrite, *un espace pour suivre*.',
  'v-vf-3': 'Le résultat, en situation. La vidéo dans le fil, *sur le téléphone de vos clients*.',
  'v-vf-4': 'Le site, en situation. Atelier Noir sur un portable et un téléphone, *comme dans une vraie boutique*.',
  'v-vf-5': 'La canette, en situation. Posée dans une scène de vie, *sans aucune séance photo*.',
  'v-vf-7': 'À l’arrivée, un site en ligne. Atelier Noir, un autre concept Veolt, *sur ordinateur et sur mobile*.',
};
