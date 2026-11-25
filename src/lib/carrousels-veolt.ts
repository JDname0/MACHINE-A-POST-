/**
 * Les pages des carrousels Veolt — version courte (25/11/2026, 22 h 30).
 *
 * Ce que Jonathan a demandé, et que ce fichier tient :
 *  - **Court.** 7 pages au plus : la couverture (titre du sujet), 4 pages au
 *    plus (5 sans version finale), la version finale en situation, la page de
 *    fin (la question, le logo). Plus de page « À retenir » : l'enseignement
 *    est dans la légende. La première version (10 à 12 pages) est gardée dans
 *    `carrousels-veolt-v1.ts`, pour reconnaître les brouillons non retouchés.
 *  - **Chaque page montre ce qu'elle dit.** Une page = une image du registre
 *    (`illustrations.ts`, placement repéré par le début du texte), une capture
 *    réelle de veolt.fr ou une carte de pack recomposée. Le superviseur
 *    (`superviseur.ts`) signale toute page restée en texte seul.
 *  - **Moins « IA ».** Un titre court et concret (la première phrase, finie par
 *    « . » ou « ? », jamais par « : »), puis une ou deux phrases simples. Pas de
 *    formule « Le vrai X n'est pas Y, c'est Z », pas de triade plaquée, pas
 *    d'adverbe d'emphase. On écrit comme on parle à un client.
 *  - **Mise en forme.** Les mots entre astérisques (`*dès 119 € HT*`) sont mis
 *    en valeur à l'image (lavande, demi-gras) : un ou deux par page, jamais plus.
 *
 * Règles inchangées (`marques.ts`) : rien que des preuves autorisées — prix
 * affichés, méthode, capacité de 6 à 8 dossiers par mois. Aucun client, aucun
 * résultat chiffré inventé.
 */
export const PAGES_CARROUSEL_VEOLT: Record<string, string[]> = {
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

/**
 * La dernière étape, montrée en situation réelle : le produit fini dans un vrai
 * décor, le site en main. Posée juste avant la page de fin, avec son image du
 * registre. Le texte ne dit jamais qu'il s'agit d'un travail client : l'image
 * porte sa mention (« Illustration IA », « Concept Veolt »).
 */
export const PAGES_FINALES_VEOLT: Record<string, string> = {
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
