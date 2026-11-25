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
export const PAGES_CARROUSEL_VEOLT: Record<string, string[]> = {
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
};
