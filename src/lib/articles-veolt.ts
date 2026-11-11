/**
 * Articles de blog Veolt — un par titre du plan de grappes (`GRAPPES` dans
 * `db.ts`), écrits le 2026-11-11.
 *
 * Même discipline que `sujets.ts`, avec ce qu'exige un article :
 *  - `accroche` + `corps[0]` forment « La réponse, en bref » : autonome,
 *    citable telle quelle, dans les cent premiers mots ;
 *  - `corps[1]` explique pourquoi la question se pose ;
 *  - `corps[2…]` sont les sections, chacune titrée par la question réelle de
 *    `questions` (même rang) ;
 *  - aucune référence client, aucun « nous avons accompagné », aucun résultat
 *    chiffré de démonstration (preuvesInterdites de `marques.ts`). Les seuls
 *    chiffres Veolt sont les prix affichés, la réponse sous 24 h, la capacité
 *    de 6 à 8 dossiers par mois. Les ordres de grandeur du métier sont donnés
 *    comme tels, jamais comme une mesure faite par nous.
 */

import type { Sujet } from './sujets';

const BP = 'Business plan et financement';
const SITE = 'Site web sur mesure';
const TROISD = '3D produit et publicité';

export const ARTICLES_VEOLT: Sujet[] = [
  // ── Business plan et financement ────────────────────────────────────────
  {
    ref: 'v-art-bp-1',
    grappe: BP,
    requete: 'business plan pour prêt bancaire création entreprise',
    titre: 'Business plan pour un prêt bancaire : ce que la banque regarde',
    pilier: 'pedagogie-dirigeant',
    persona: 'porteur-projet',
    accroche:
      "Une banque lit un business plan pour une seule raison : savoir si le prêt sera remboursé. Elle regarde la trésorerie au point le plus bas, l'apport rapporté au besoin, et la cohérence entre le chiffre d'affaires annoncé et ce que vous pouvez réellement produire.",
    corps: [
      "Le reste du dossier — étude de marché, présentation de l'équipe, stratégie — sert à rendre ces trois lignes crédibles. Un dossier qui les soigne passe la première lecture ; un dossier qui les noie dans quarante pages n'y arrive souvent pas.",
      "La plupart des modèles de business plan sont écrits pour convaincre un investisseur, qui achète un potentiel. Un banquier, lui, prête de l'argent qu'il doit récupérer avec intérêts : il achète une capacité de remboursement. Les deux lectures n'ont presque rien en commun.",
      "Le plan de trésorerie mensuel de la première année est la pièce la plus regardée. Un compte de résultat bénéficiaire ne dit pas si la caisse passe sous zéro au septième mois, quand les clients paient à soixante jours et que le loyer tombe tous les mois. C'est ce creux qui décide du montant à financer, et c'est lui que la banque cherche.",
      "L'apport personnel fixe la part du risque que vous portez vous-même. Il n'existe pas de seuil écrit, mais un apport faible rapporté au besoin total rend le dossier difficile à défendre en comité, quelle que soit la qualité du reste. S'il est faible, mieux vaut le dire et montrer ce qui le compense — un prêt d'honneur, une garantie, un associé — que de le diluer dans les annexes.",
      "Un chiffre d'affaires se vérifie contre une capacité : combien d'heures, de machines, de couverts ou de livraisons par mois. Si le prévisionnel vend plus que ce que l'équipe peut livrer, l'écart se voit en quelques minutes et fragilise tout le document. Un business plan solide montre le calcul qui relie la capacité au chiffre, ligne par ligne.",
      "Enfin, un dossier qui ne contient qu'une hypothèse se lit comme un dossier non travaillé. Un scénario dégradé — ventes plus lentes, délais clients plus longs — montre que vous avez regardé le risque en face, et que le prêt reste remboursable même quand tout ne se passe pas comme prévu.",
    ],
    questions: [
      'Pourquoi la trésorerie compte-t-elle plus que le résultat ?',
      "Quel apport personnel la banque attend-elle ?",
      "Comment la banque vérifie-t-elle le chiffre d'affaires annoncé ?",
      'Faut-il présenter un scénario pessimiste ?',
    ],
    aRetenir: [
      "La banque achète une capacité de remboursement, pas un potentiel.",
      'Trois lignes décident : trésorerie au point bas, apport rapporté au besoin, chiffre d’affaires cohérent avec la capacité.',
      'Un scénario dégradé rend le dossier plus crédible, pas plus fragile.',
    ],
    preuve: 'le droit commun du métier, et la méthode de cadrage affichée',
    enseignement: "Un business plan bancaire se juge sur sa capacité à rembourser, pas sur son ambition.",
    appel:
      "Vous préparez un dossier de financement ? Demandez l'analyse gratuite de votre prévisionnel : réponse sous 24 h, sans engagement.",
    indicateur: 'part des requêtes de la grappe en top 10, et citations par les IA (relevé manuel)',
    source:
      'Pratique bancaire courante du prêt à la création (lecture du plan de trésorerie, de l’apport et de la cohérence capacité / chiffre d’affaires) ; aucune statistique avancée. Offre Veolt : business plan à partir de 490 € HT, analyse gratuite, réponse sous 24 h.',
  },
  {
    ref: 'v-art-bp-2',
    grappe: BP,
    requete: 'prix business plan professionnel',
    titre: 'Combien coûte un business plan réalisé par un professionnel',
    pilier: 'positionnement-prix',
    persona: 'porteur-projet',
    accroche:
      "Un business plan réalisé par un professionnel coûte de quelques centaines à plusieurs milliers d'euros. Chez Veolt, il démarre à 490 € HT. L'écart entre deux devis tient à trois choses : le prévisionnel est-il construit avec vous ou rempli à partir d'un modèle, qui rédige, et le dossier est-il accompagné jusqu'à la banque.",
    corps: [
      "Le prix seul ne dit donc presque rien. Deux offres au même tarif peuvent livrer un tableur prérempli ou un prévisionnel défendable en rendez-vous : il faut comparer ce que contient le livrable.",
      "L'offre va du modèle téléchargeable à quelques dizaines d'euros jusqu'à l'accompagnement complet d'un cabinet. Le porteur de projet compare des prix sans pouvoir comparer les contenus, et choisit souvent sur le total.",
      "Un business plan sérieux comprend au minimum un plan de financement initial, un compte de résultat prévisionnel sur trois ans, un plan de trésorerie mensuel la première année et une partie rédigée qui explique les hypothèses. Le poste qui fait varier le prix est le prévisionnel : il se construit à partir de vos chiffres réels — devis, loyers, délais de paiement — et pas à partir de ratios moyens.",
      "Un prix plus élevé se justifie quand il achète quelque chose de précis : des entretiens de cadrage, plusieurs scénarios, la préparation du rendez-vous bancaire, des allers-retours jusqu'à l'accord. Il ne se justifie pas par le nombre de pages. Un dossier de soixante pages n'est pas mieux financé qu'un dossier de vingt.",
      "Nos prix sont bas parce que la structure est jeune et légère, pas parce que le travail est réduit : nous prenons 6 à 8 dossiers par mois, toutes offres confondues. C'est aussi pourquoi nous commençons par une analyse gratuite — vous jugez le travail avant de payer quoi que ce soit.",
    ],
    questions: [
      "Que doit contenir un business plan pour justifier son prix ?",
      'Quand un prix plus élevé se justifie-t-il ?',
      'Pourquoi les prix de Veolt sont-ils bas ?',
    ],
    aRetenir: [
      'Comparer le contenu du livrable, pas le total du devis.',
      'Le poste qui fait le prix est un prévisionnel construit à partir de vos chiffres réels.',
      'Veolt : business plan à partir de 490 € HT, analyse gratuite avant toute commande.',
    ],
    preuve: 'les prix affichés, et le contenu du livrable',
    enseignement: "Le prix d'un business plan se lit dans son prévisionnel, pas dans son nombre de pages.",
    appel: "Envoyez-nous votre projet en quelques lignes : l'analyse gratuite vous dit ce que votre dossier doit contenir, sous 24 h.",
    indicateur: 'part des requêtes de la grappe en top 10, et citations par les IA (relevé manuel)',
    source:
      'Prix affichés par Veolt (business plan à partir de 490 € HT), capacité de 6 à 8 dossiers par mois, analyse gratuite. Fourchette de marché donnée en ordre de grandeur, sans relevé chiffré.',
  },
  {
    ref: 'v-art-bp-3',
    grappe: BP,
    requete: 'prévisionnel financier lignes importantes banque',
    titre: 'Prévisionnel financier : les trois lignes qui décident',
    pilier: 'demonter-un-chiffre',
    persona: 'porteur-projet',
    accroche:
      "Dans un prévisionnel financier, trois lignes décident de la réponse de la banque : la trésorerie au mois le plus bas, l'apport rapporté au besoin de financement, et le chiffre d'affaires rapporté à la capacité de production.",
    corps: [
      "Tout le reste du prévisionnel sert à justifier ces trois lignes. Si elles tiennent, le dossier se discute ; si l'une d'elles casse, le reste n'est généralement pas lu.",
      "Un prévisionnel produit des dizaines de lignes, et les outils en ligne les présentent toutes au même niveau. Le porteur de projet soigne le compte de résultat, que la banque regarde peu, et néglige le plan de trésorerie, qu'elle regarde d'abord.",
      "La trésorerie au point bas, c'est le solde de caisse le plus faible sur les douze ou dix-huit premiers mois. Il se calcule mois par mois, en datant chaque encaissement et chaque décaissement à son vrai moment : une facture émise en mars et payée à soixante jours entre en mai, pas en mars. Si ce solde passe sous zéro, le besoin de financement est sous-estimé.",
      "L'apport rapporté au besoin mesure le risque que vous portez. La banque le compare au total à financer — investissements et besoin en fonds de roulement compris. Un besoin en fonds de roulement oublié fait mécaniquement baisser ce rapport après coup, au pire moment.",
      "Le chiffre d'affaires doit se déduire de la capacité, et non l'inverse. On part de ce que l'équipe peut produire par mois, on applique un taux de remplissage prudent au démarrage, puis on multiplie par le prix. Un prévisionnel écrit à l'envers — à partir du montant qu'on veut emprunter — se repère immédiatement.",
    ],
    questions: [
      'Comment calculer la trésorerie au point le plus bas ?',
      "Pourquoi l'apport se compare-t-il au besoin total ?",
      "Comment rendre le chiffre d'affaires crédible ?",
    ],
    aRetenir: [
      "Le plan de trésorerie mensuel est la pièce la plus lue d'un prévisionnel.",
      'Le besoin en fonds de roulement fait partie du besoin à financer.',
      "Le chiffre d'affaires se déduit de la capacité, jamais du prêt souhaité.",
    ],
    preuve: 'le droit commun du métier, et nos propres analyses',
    enseignement: "Un prévisionnel n'est pas un exercice d'optimisme : c'est une démonstration de capacité à rembourser.",
    appel: "Votre trésorerie au point le plus bas, vous la connaissez ? Si non, c'est la première ligne que nous calculons dans l'analyse gratuite.",
    indicateur: 'part des requêtes de la grappe en top 10, et citations par les IA (relevé manuel)',
    source: 'Méthode de lecture d’un prévisionnel (trésorerie mensuelle, apport / besoin, capacité / chiffre d’affaires) ; reprend le sujet v-dc-2 en version longue.',
  },
  {
    ref: 'v-art-bp-4',
    grappe: BP,
    requete: 'calculer besoin en fonds de roulement création',
    titre: 'Besoin en fonds de roulement : le calculer sans comptable',
    pilier: 'pedagogie-dirigeant',
    persona: 'porteur-projet',
    accroche:
      "Le besoin en fonds de roulement est l'argent immobilisé entre le moment où vous payez et celui où vos clients vous paient. Il se calcule en jours : délai moyen d'encaissement client, plus durée de stockage, moins délai moyen de paiement fournisseur, appliqués à votre chiffre d'affaires quotidien.",
    corps: [
      "Exemple simple : 300 000 € de chiffre d'affaires annuel hors taxes, clients payés à 45 jours, pas de stock, fournisseurs payés à 30 jours. L'écart est de 15 jours de chiffre d'affaires, soit environ 300 000 × 15 / 365 ≈ 12 300 € à financer en permanence — et davantage si l'activité grandit.",
      "Le besoin en fonds de roulement n'apparaît dans aucun compte de résultat. Une entreprise peut être rentable sur le papier et manquer de trésorerie tous les mois, parce que ses ventes sont encaissées après ses dépenses. C'est une cause fréquente d'arrêt d'activités pourtant viables.",
      "Il vous faut trois chiffres. Le délai moyen de paiement de vos clients, en jours. Le délai moyen de paiement de vos fournisseurs, en jours. Et, si vous avez du stock, sa durée moyenne de rotation. Le calcul est : (délai clients + durée de stock − délai fournisseurs) × chiffre d'affaires annuel / 365. C'est une approximation, suffisante pour un prévisionnel de création.",
      "Le besoin grandit avec l'activité. Doubler le chiffre d'affaires double, à délais constants, l'argent immobilisé. C'est contre-intuitif : la croissance consomme de la trésorerie avant d'en produire, et c'est pourquoi la banque veut le voir chiffré dans le plan de financement initial.",
      "Deux leviers, et deux seulement : encaisser plus vite — acompte à la commande, facturation à l'étape, relances datées — ou payer plus tard, dans la limite légale. En France, l'article L. 441-10 du code de commerce plafonne les délais de paiement entre entreprises à soixante jours après la date d'émission de la facture, ou quarante-cinq jours fin de mois si le contrat le prévoit.",
    ],
    questions: [
      'De quels chiffres a-t-on besoin pour le calculer ?',
      'Pourquoi le besoin augmente-t-il quand on vend plus ?',
      'Comment réduire son besoin en fonds de roulement ?',
    ],
    aRetenir: [
      'BFR ≈ (délai clients + durée de stock − délai fournisseurs) × CA annuel / 365.',
      "Il augmente avec la croissance : vendre plus immobilise plus d'argent.",
      'Il fait partie du besoin à financer dès le plan de financement initial.',
    ],
    preuve: 'le droit commun du métier, et le code de commerce',
    enseignement: "Une entreprise s'arrête plus souvent faute de trésorerie que faute de rentabilité.",
    appel: "Combien de jours s'écoulent entre votre dépense et votre encaissement ? Ce chiffre suffit pour commencer le calcul.",
    indicateur: 'part des requêtes de la grappe en top 10, et citations par les IA (relevé manuel)',
    source:
      'Formule usuelle du BFR en jours de chiffre d’affaires (exemple chiffré construit, pas un cas client) ; article L. 441-10 du code de commerce pour les délais de paiement interentreprises. Reprend le sujet v-pd-1 en version longue.',
  },
  {
    ref: 'v-art-bp-5',
    grappe: BP,
    requete: 'scénario pessimiste prévisionnel banque',
    titre: 'Scénario dégradé dans un prévisionnel : pourquoi il est obligatoire',
    pilier: 'pedagogie-dirigeant',
    persona: 'porteur-projet',
    accroche:
      "Aucun texte n'impose un scénario dégradé dans un prévisionnel, mais un dossier de financement qui n'en contient pas se défend mal. Il montre que le prêt reste remboursable si les ventes arrivent plus tard ou plus lentement que prévu.",
    corps: [
      "Un bon scénario dégradé ne divise pas tout par deux. Il dégrade deux ou trois hypothèses précises — le rythme de démarrage, le délai de paiement des clients, un coût clé — et montre ce que devient la trésorerie.",
      "Le porteur de projet craint qu'une hypothèse basse affaiblisse son dossier. C'est l'inverse : une banque sait que le scénario central est optimiste par construction. Elle cherche à savoir ce qui se passe quand il ne se réalise pas, et si vous l'avez déjà regardé.",
      "Trois hypothèses à dégrader en priorité. Le démarrage : les premiers mois de ventes décalés d'un trimestre. Les encaissements : des clients qui paient à soixante jours au lieu de trente. Un coût : la matière, le loyer ou le salaire qui pèse le plus, augmenté. Chacune se teste séparément, puis ensemble.",
      "Le scénario dégradé se lit sur la même ligne que le scénario central : la trésorerie au mois le plus bas. S'il reste positif, le dossier est solide. S'il passe sous zéro, il indique le montant de sécurité à prévoir — découvert autorisé, prêt plus long, apport complémentaire — et c'est une information utile pour négocier, pas un aveu.",
      "Le présenter en premier est souvent la meilleure stratégie : un dossier qui annonce lui-même son hypothèse basse inspire plus confiance qu'un dossier qui attend la question.",
    ],
    questions: [
      'Quelles hypothèses faut-il dégrader ?',
      'Comment lire le résultat du scénario dégradé ?',
      'Faut-il le montrer à la banque ?',
    ],
    aRetenir: [
      'Le scénario dégradé dégrade deux ou trois hypothèses précises, pas tout le prévisionnel.',
      'Il se lit sur la trésorerie au mois le plus bas.',
      'Un dossier qui annonce son hypothèse basse est plus crédible.',
    ],
    preuve: 'le droit commun du métier',
    enseignement: "Un dossier de financement se juge sur son hypothèse basse, pas sur son hypothèse haute.",
    appel: "Votre dossier contient-il un scénario dégradé ? L'analyse gratuite le construit avec vous.",
    indicateur: 'part des requêtes de la grappe en top 10, et citations par les IA (relevé manuel)',
    source: 'Pratique courante de l’analyse de sensibilité en prévisionnel ; aucune obligation légale avancée (le titre dit « obligatoire » au sens de la pratique bancaire, ce que la réponse précise).',
  },
  {
    ref: 'v-art-bp-6',
    grappe: BP,
    requete: 'pourquoi mon business plan a été refusé banque',
    titre: 'Business plan refusé : les motifs les plus fréquents',
    pilier: 'pedagogie-dirigeant',
    persona: 'porteur-projet',
    accroche:
      "Un refus de prêt sur business plan tient le plus souvent à l'une de ces lignes : un apport trop faible rapporté au besoin, une trésorerie qui passe sous zéro dans le prévisionnel, un chiffre d'affaires sans lien avec la capacité de production, ou l'absence de scénario dégradé.",
    corps: [
      "La banque ne détaille pas toujours son motif. Le bon réflexe est de relire le dossier avec ces quatre lignes en tête avant de le présenter ailleurs, plutôt que de changer de banque avec le même document.",
      "Un refus arrive souvent sans explication écrite, ou avec une formule générale. Le porteur de projet en conclut que son projet est mauvais, alors que c'est fréquemment la présentation d'un chiffre qui a bloqué.",
      "Demandez un rendez-vous de restitution et posez une question précise : « quelle ligne du dossier a posé problème ? ». Une réponse orale est plus fréquente qu'une réponse écrite, et elle oriente directement la correction.",
      "Les corrections les plus efficaces portent rarement sur le texte. Recalculer le besoin en fonds de roulement, dater les encaissements à leur vrai moment, ajouter un scénario dégradé, ou compléter l'apport par un prêt d'honneur changent davantage la lecture du dossier que dix pages d'étude de marché.",
      "Un même projet peut être refusé par une banque et accepté par une autre, parce que leurs politiques de risque diffèrent selon le secteur. Mais représenter un dossier inchangé, c'est s'exposer au même motif : la correction passe avant le changement de guichet.",
    ],
    questions: [
      'Comment connaître le motif réel du refus ?',
      'Que corriger en priorité dans le dossier ?',
      "Faut-il présenter le dossier à une autre banque ?",
    ],
    aRetenir: [
      'Quatre motifs reviennent : apport, trésorerie au point bas, cohérence du chiffre d’affaires, absence de scénario dégradé.',
      'Demander quelle ligne a posé problème, en rendez-vous.',
      'Corriger le dossier avant de changer de banque.',
    ],
    preuve: 'le droit commun du métier',
    enseignement: "Un refus vise presque toujours une ligne du dossier, rarement le projet entier.",
    appel: "Votre dossier a été refusé ? Envoyez-le : l'analyse gratuite vous dit quelle ligne relire en premier.",
    indicateur: 'part des requêtes de la grappe en top 10, et citations par les IA (relevé manuel)',
    source:
      'Motifs usuels de refus de financement à la création, présentés comme pratique du métier et non comme statistique. Reprend le sujet v-pd-3 sans la mention « refus réellement observés », que Veolt ne peut pas encore documenter.',
  },

  // ── Site web sur mesure ─────────────────────────────────────────────────
  {
    ref: 'v-art-site-1',
    grappe: SITE,
    requete: 'prix site vitrine sur mesure',
    titre: 'Combien coûte un site vitrine sur mesure en 2026',
    pilier: 'demonter-un-chiffre',
    persona: 'dirigeant-site-bloque',
    accroche:
      "Un site vitrine sur mesure coûte, selon les prestataires, de 1 500 € à plus de 10 000 € HT. Chez Veolt, nos fourchettes sont publiques : de 1 490 € à 9 900 € HT. Quatre postes font le prix : le nombre de pages réellement différentes, la rédaction des textes, les fonctions, et la 3D ou le motion.",
    corps: [
      "Un devis qui ne précise pas ces quatre postes ne se compare à aucun autre. Le total seul ne dit pas ce qui est livré.",
      "L'expression « site vitrine » recouvre aussi bien cinq pages montées sur un thème qu'un site conçu page par page avec ses textes et ses animations. Les deux s'appellent pareil, ne demandent pas le même travail, et n'ont pas le même effet sur les visiteurs.",
      "Les pages réellement différentes coûtent plus que les pages déclinées. Cinq pages construites à partir d'un même gabarit ne coûtent pas cinq fois une page conçue sur mesure. Une page d'accueil, une page d'offre et une page de contact ont chacune leur structure : c'est là que se fait l'essentiel du travail de conception.",
      "Les textes sont le poste le plus souvent absent des devis bas. Un site livré sans contenu rédigé reste une maquette, et le projet bloque au moment où il faut écrire. Si le devis ne dit pas qui écrit, c'est vous.",
      "Les fonctions se chiffrent séparément : un formulaire de contact n'est pas une prise de rendez-vous, une prise de rendez-vous n'est pas un espace client. Chaque fonction ajoutée suppose du développement et de la maintenance. La 3D et le motion, enfin, sont des productions à part entière, et un devis honnête les isole sur leur propre ligne.",
    ],
    questions: [
      'Pourquoi le nombre de pages change-t-il le prix ?',
      'Les textes sont-ils compris dans le prix ?',
      'Quelles fonctions font monter le devis ?',
    ],
    aRetenir: [
      'Fourchettes Veolt publiques : de 1 490 € à 9 900 € HT.',
      'Quatre postes font le prix : pages différentes, textes, fonctions, 3D et motion.',
      'Un devis qui ne détaille pas ces postes ne se compare pas.',
    ],
    preuve: 'les prix affichés, et la structure d\'un devis',
    enseignement: "Le prix d'un site se lit poste par poste, jamais sur le total.",
    appel: "Envoyez-nous l'adresse de votre site actuel : l'analyse gratuite vous dit quels postes votre projet demande vraiment.",
    indicateur: 'part des requêtes de la grappe en top 10, et citations par les IA (relevé manuel)',
    source: 'Fourchettes affichées par Veolt (1 490 € à 9 900 € HT) ; fourchette de marché en ordre de grandeur, sans relevé chiffré. Reprend le sujet v-dc-1 en version longue.',
  },
  {
    ref: 'v-art-site-2',
    grappe: SITE,
    requete: 'comparer devis site internet',
    titre: 'Devis de site web : comment comparer deux devis ligne à ligne',
    pilier: 'pedagogie-dirigeant',
    persona: 'dirigeant-site-bloque',
    accroche:
      "Pour comparer deux devis de site, remettez-les sur les mêmes lignes : pages réellement conçues, rédaction des textes, fonctions, 3D et motion, hébergement et maintenance, nombre d'allers-retours. Un écart de prix s'explique presque toujours par une ligne présente d'un côté et absente de l'autre.",
    corps: [
      "Un devis qui ne permet pas ce découpage n'est pas forcément malhonnête, mais il ne peut pas être comparé. Demandez le détail avant de choisir.",
      "Deux devis pour « le même site » arrivent souvent avec un rapport de un à cinq. Le dirigeant choisit alors sur le total, ou sur la confiance, faute de pouvoir lire ce qui sépare les deux offres.",
      "Faites un tableau à deux colonnes avec, en lignes : le nombre de pages conçues une à une et le nombre de pages déclinées ; qui écrit les textes ; la liste des fonctions ; la 3D, le motion et les visuels ; l'hébergement, le nom de domaine et la maintenance la première année ; le nombre de séries de corrections incluses. Chaque case vide est une question à poser au prestataire.",
      "Trois absences se paient plus tard. Les textes : s'ils ne sont pas prévus, le projet s'arrête au moment de les écrire. La maintenance : sans elle, la première mise à jour devient un nouveau devis. Les corrections : un nombre d'allers-retours non défini finit en dépassement.",
      "Le prix bas n'est pas suspect en soi. Il l'est quand il ne s'explique pas. Les nôtres sont bas parce que la structure est jeune et que nous prenons 6 à 8 dossiers par mois ; ils sont publiés, de 1 490 € à 9 900 € HT, avec ce qu'ils contiennent.",
    ],
    questions: [
      'Quelles lignes faut-il comparer ?',
      'Quelles absences coûtent le plus cher ensuite ?',
      'Un devis bas est-il forcément suspect ?',
    ],
    aRetenir: [
      'Remettre les deux devis sur les mêmes lignes avant de comparer les totaux.',
      'Textes, maintenance et corrections sont les absences qui coûtent le plus après coup.',
      "Un prix bas se juge à son explication, pas à son montant.",
    ],
    preuve: 'la structure d\'un devis, et les prix affichés',
    enseignement: "Un devis de site ne se compare pas sur le total : il se compare ligne par ligne.",
    appel: "Vous avez deux devis sur la table ? Envoyez-les : nous vous disons ce qui les sépare, sans vous vendre le nôtre.",
    indicateur: 'part des requêtes de la grappe en top 10, et citations par les IA (relevé manuel)',
    source: 'Grille de comparaison de devis construite par Veolt ; prix et capacité affichés.',
  },
  {
    ref: 'v-art-site-3',
    grappe: SITE,
    requete: 'faut-il refaire son site internet',
    titre: 'Refaire son site : trois signes qui le justifient',
    pilier: 'pedagogie-dirigeant',
    persona: 'dirigeant-site-bloque',
    accroche:
      "Trois signes justifient de refaire un site : les visiteurs quittent la page d'accueil sans aller plus loin, vous ne pouvez rien modifier sans faire appel à quelqu'un, et le site ne décrit plus ce que vous vendez. Un design daté ou un trafic faible, à eux seuls, ne le justifient pas.",
    corps: [
      "Avant de refaire, il faut donc savoir lequel de ces problèmes se pose : ils n'appellent pas la même réponse, ni le même budget.",
      "La refonte est souvent décidée sur une impression — « le site fait vieux » — alors que le vrai problème est ailleurs : une promesse illisible, un parcours confus, ou une absence de trafic que la refonte ne réglera pas.",
      "Ouvrez votre page d'accueil et demandez-vous ce qu'un inconnu en comprend en trois secondes, sans faire défiler. Si la réponse n'est pas « ce que nous vendons, et pour qui », le problème est la promesse. Il se corrige souvent sur une seule page, avant toute refonte complète.",
      "Si chaque modification passe par un prestataire, le site vous coûte du temps et de l'argent à chaque changement d'offre. Au bout de quelques demandes, ce coût dépasse celui d'un site que vous pouvez modifier vous-même. C'est un motif de refonte légitime.",
      "Un design daté ne coûte rien si la promesse est claire. Un trafic faible est un problème d'acquisition — référencement, réseaux, publicité —, pas un problème de site : refaire les pages n'amènera personne de plus. Dans ces deux cas, le budget est mieux placé ailleurs.",
    ],
    questions: [
      'Comment savoir si le problème vient de la page d’accueil ?',
      'Quand la dépendance à un prestataire justifie-t-elle une refonte ?',
      'Pourquoi un design daté ou un trafic faible ne suffisent-ils pas ?',
    ],
    aRetenir: [
      "Refaire quand le site ment sur l'offre, bloque les modifications, ou perd les visiteurs dès l'accueil.",
      'Un design daté n’est pas un motif en soi.',
      "Un trafic faible se traite par l'acquisition, pas par la refonte.",
    ],
    preuve: 'le droit commun du métier',
    enseignement: "On refait un site quand il ment sur l'offre, pas quand il vieillit.",
    appel: "Envoyez-nous l'adresse de votre page d'accueil : nous vous disons en une phrase ce qu'on comprend de votre offre.",
    indicateur: 'part des requêtes de la grappe en top 10, et citations par les IA (relevé manuel)',
    source: 'Reprend le sujet v-pd-2 en version longue ; aucun chiffre avancé.',
  },
  {
    ref: 'v-art-site-4',
    grappe: SITE,
    requete: 'site vitrine ou ecommerce choisir',
    titre: 'Site vitrine ou site e-commerce : lequel pour démarrer',
    pilier: 'pedagogie-dirigeant',
    persona: 'dirigeant-site-bloque',
    accroche:
      "Pour démarrer, un site vitrine suffit si la vente se conclut ailleurs — par téléphone, sur devis, en boutique. Un site e-commerce se justifie quand le client peut acheter seul, en ligne, un produit au prix fixe, et que vous êtes prêt à gérer paiement, livraison et retours.",
    corps: [
      "Le choix ne dépend donc pas de l'ambition, mais de la façon dont vos clients achètent aujourd'hui. Un site e-commerce sur une offre qui se vend sur devis reste une vitrine plus chère.",
      "La boutique en ligne paraît être l'étape naturelle de tout site, et les plateformes la rendent accessible en quelques clics. Mais vendre en ligne crée des obligations et une charge de travail quotidienne que le site vitrine n'a pas.",
      "Une boutique en ligne suppose un catalogue tenu à jour, un paiement sécurisé, des frais et délais de livraison, un service client, et des conditions générales de vente. Pour la vente aux particuliers, le code de la consommation ouvre en principe un droit de rétractation de quatorze jours (article L. 221-18) : il faut pouvoir organiser les retours.",
      "Un site vitrine bien construit fait déjà vendre : il présente l'offre, montre le travail, donne les prix de départ et mène à une prise de contact. Pour une prestation de service ou un produit configuré, c'est souvent le meilleur outil commercial, et il coûte moins cher à faire et à tenir.",
      "Rien n'empêche de commencer par une vitrine et d'ajouter la vente en ligne quand un produit s'y prête. C'est moins coûteux que l'inverse : une boutique ouverte trop tôt, qui ne vend pas, se transforme rarement en bonne vitrine.",
    ],
    questions: [
      'Que demande une boutique en ligne au quotidien ?',
      'Un site vitrine peut-il faire vendre ?',
      'Peut-on passer de l’un à l’autre plus tard ?',
    ],
    aRetenir: [
      'Vitrine : la vente se conclut ailleurs. E-commerce : le client achète seul, en ligne.',
      'Vendre en ligne aux particuliers implique CGV, livraison et droit de rétractation de 14 jours.',
      "Commencer par une vitrine et ajouter la vente quand un produit s'y prête.",
    ],
    preuve: 'le droit commun du métier, et le code de la consommation',
    enseignement: "Le bon site est celui qui reproduit la façon dont vos clients achètent déjà.",
    appel: "Vos clients achètent-ils sur devis ou au prix affiché ? Dites-le-nous : l'analyse gratuite vous oriente vers le bon format.",
    indicateur: 'part des requêtes de la grappe en top 10, et citations par les IA (relevé manuel)',
    source: 'Article L. 221-18 du code de la consommation (droit de rétractation de quatorze jours, vente à distance aux consommateurs, sous réserve des exceptions légales).',
  },
  {
    ref: 'v-art-site-5',
    grappe: SITE,
    requete: 'site web 3D intérêt performance',
    titre: 'Web 3D : quand ça sert vraiment, et quand ça ralentit',
    pilier: 'coulisses-methode',
    persona: 'dirigeant-site-bloque',
    accroche:
      "La 3D sur un site sert quand elle montre quelque chose qu'une photo ne montre pas : un produit qu'on fait tourner, un volume, un assemblage. Elle ralentit quand elle décore, parce qu'un modèle 3D pèse lourd et sollicite le processeur graphique du téléphone.",
    corps: [
      "La question à poser n'est donc pas « la 3D, c'est moderne ? » mais « qu'est-ce que le visiteur comprend grâce à elle ? ». Si la réponse est « rien de plus », une image ou une courte vidéo fait mieux.",
      "La 3D temps réel, longtemps réservée aux grandes marques, est devenue accessible : des bibliothèques comme three.js l'affichent dans n'importe quel navigateur. La tentation est grande d'en mettre partout, au détriment de la vitesse d'affichage.",
      "La 3D sert sur une page produit qu'on veut examiner sous tous les angles, sur un configurateur de couleurs ou de matières, sur la démonstration d'un mécanisme, ou sur un élément de marque fort et unique en haut de page. Dans ces cas, elle remplace plusieurs images et répond à une question du visiteur.",
      "Elle ralentit quand le modèle est trop détaillé, que ses textures sont lourdes, ou qu'elle s'affiche avant le contenu. Google mesure l'expérience de chargement par les Core Web Vitals : le plus grand élément visible doit s'afficher en moins de 2,5 secondes (LCP). Une scène 3D mal préparée peut dégrader cet indicateur et la lecture sur mobile.",
      "Bien faite, la 3D reste légère : modèle simplifié et compressé, chargement différé après le texte, image fixe de repli sur les téléphones modestes, animation interrompue quand elle sort de l'écran. Notre propre site affiche une scène 3D en page d'accueil : c'est un choix de marque, assumé, avec ces précautions.",
    ],
    questions: [
      'Dans quels cas la 3D est-elle utile sur un site ?',
      'Comment la 3D peut-elle ralentir un site ?',
      'Comment garder une page 3D rapide ?',
    ],
    aRetenir: [
      "La 3D sert quand elle montre ce qu'une photo ne montre pas.",
      'Les Core Web Vitals fixent l’objectif : plus grand élément affiché en moins de 2,5 s.',
      'Modèle compressé, chargement différé, image de repli sur mobile.',
    ],
    preuve: 'le processus, et notre propre site',
    enseignement: "En web, la 3D se justifie par ce qu'elle explique, jamais par ce qu'elle décore.",
    appel: "Vous hésitez à mettre de la 3D sur votre site ? Décrivez-nous la page : nous vous disons si elle y gagne.",
    indicateur: 'part des requêtes de la grappe en top 10, et citations par les IA (relevé manuel)',
    source:
      'Seuil LCP de 2,5 s des Core Web Vitals (documentation Google web.dev) ; bibliothèque three.js ; scène 3D de la page d’accueil du site Veolt. Aucune mesure de performance Veolt avancée.',
  },
  {
    ref: 'v-art-site-6',
    grappe: SITE,
    requete: 'rédaction contenu site web prix',
    titre: 'Qui écrit les textes de votre site, et pourquoi ça change le prix',
    pilier: 'positionnement-prix',
    persona: 'dirigeant-site-bloque',
    accroche:
      "Si le devis de votre site ne dit pas qui écrit les textes, c'est vous qui les écrirez. La rédaction est le poste le plus souvent absent des devis bas, et c'est elle qui fait le plus souvent déraper le délai : un site sans contenu ne peut pas être mis en ligne.",
    corps: [
      "Faire rédiger les textes augmente le devis, mais fixe un délai et un résultat. Les écrire soi-même coûte moins cher sur le papier, à condition de les livrer à temps et de savoir écrire pour le web.",
      "Le dirigeant pense à son site comme à un objet graphique, et le prestataire chiffre souvent ce qu'on lui demande : des pages. Le contenu, lui, est supposé exister. Il existe rarement sous une forme utilisable.",
      "Écrire pour un site, c'est trouver la promesse qui se lit en trois secondes, découper l'offre en pages qui répondent chacune à une question, et écrire des titres que les moteurs de recherche et les visiteurs comprennent. C'est un travail de fond sur l'offre autant qu'un travail d'écriture.",
      "Rédiger soi-même convient quand l'offre est déjà claire, que vous avez le temps, et que le prestataire fournit une trame page par page : titres, nombre de mots, questions auxquelles chaque bloc doit répondre. Sans trame, le texte arrive tard, trop long, et le site attend.",
      "Chez Veolt, la rédaction est une ligne à part du devis, et le site n'est pas livré sans textes : nous ne livrons pas de maquette vide. Si vous écrivez vous-même, nous fournissons la trame, et le délai est calé sur la remise de vos textes.",
    ],
    questions: [
      'Qu’est-ce qu’écrire pour un site, concrètement ?',
      'Quand peut-on écrire ses textes soi-même ?',
      'Comment Veolt traite-t-il la rédaction ?',
    ],
    aRetenir: [
      'Si le devis ne dit pas qui écrit, c’est vous.',
      'Les textes sont la première cause de site bloqué avant la mise en ligne.',
      'Rédiger soi-même suppose une trame page par page fournie par le prestataire.',
    ],
    preuve: 'nos contraintes réelles, et la structure d\'un devis',
    enseignement: "Un site sans textes n'est pas un site moins cher : c'est un site qui n'est pas fini.",
    appel: "Vos textes existent-ils déjà ? Dites-le-nous : la réponse change le devis plus que le nombre de pages.",
    indicateur: 'part des requêtes de la grappe en top 10, et citations par les IA (relevé manuel)',
    source: 'Refus affiché par Veolt de livrer un site sans textes (sujet v-cm-2) ; structure de devis Veolt.',
  },

  // ── 3D produit et publicité ─────────────────────────────────────────────
  {
    ref: 'v-art-3d-1',
    grappe: TROISD,
    requete: 'packshot 3D ou photo produit',
    titre: 'Packshot 3D ou photo produit : lequel choisir',
    pilier: 'montrer-le-travail',
    persona: 'marque-produit',
    accroche:
      "Choisissez la photo si vous avez besoin de peu de visuels par produit et que la matière réelle compte. Choisissez la 3D si vous devez décliner le même produit en de nombreux angles, coloris ou mises en scène : le modèle se fait une fois, les variantes coûtent peu.",
    corps: [
      "Le vrai arbitrage n'est donc pas la qualité d'image — les deux peuvent être irréprochables — mais le nombre de déclinaisons par référence, et la fréquence à laquelle vous en aurez besoin.",
      "Les rendus 3D sont devenus difficiles à distinguer d'une photo, et les marques hésitent entre une séance photo connue et une technique qu'elles maîtrisent moins. Les deux se vendent comme « la meilleure image », alors qu'elles ne coûtent pas de la même façon.",
      "Une séance photo se paie à chaque fois : studio, photographe, retouche. Son coût suit à peu près le nombre de produits et de prises de vue. La 3D fonctionne à l'envers : le modèle est un investissement par produit, puis chaque nouvel angle, coloris ou fond se produit sans relouer de studio.",
      "La photo reste préférable pour les matières difficiles à reproduire fidèlement — certains tissus, l'alimentaire, la peau — et quand le produit physique existe déjà et ne changera pas. La 3D prend l'avantage quand le produit n'est pas encore fabriqué, quand il existe en de nombreuses variantes, ou quand il faut des mises en scène impossibles en studio.",
      "En ordre de grandeur, le croisement se situe autour de cinq visuels par référence : en dessous, la photo est souvent moins chère ; au-delà, la 3D devient le format tenable. C'est une règle de calcul, pas une loi — et nos rendus démarrent à 119 € HT la pièce.",
    ],
    questions: [
      'Comment chacun des deux se paie-t-il ?',
      'Dans quels cas la photo reste-t-elle meilleure ?',
      'À partir de combien de visuels la 3D devient-elle rentable ?',
    ],
    aRetenir: [
      'La photo se paie à chaque séance, la 3D une fois par produit.',
      'Photo pour les matières délicates et les produits figés, 3D pour les variantes et les produits à venir.',
      'Croisement autour de cinq visuels par référence ; rendus Veolt à partir de 119 € HT.',
    ],
    preuve: 'le rendu lui-même, produit par nous, et les prix affichés',
    enseignement: "La 3D ne remplace pas la photo. Elle remplace la deuxième séance photo.",
    appel: "Vous avez une référence à décliner ? Dites-nous laquelle : nous vous disons lequel des deux formats est le moins cher dans votre cas.",
    indicateur: 'part des requêtes de la grappe en top 10, et citations par les IA (relevé manuel)',
    source: 'Reprend les sujets v-mt-1 et v-dc-3 (seuil de cinq visuels donné comme ordre de grandeur) ; prix affiché à partir de 119 € HT.',
  },
  {
    ref: 'v-art-3d-2',
    grappe: TROISD,
    requete: 'prix visuel 3D produit',
    titre: "Prix d'un visuel produit en 3D, par référence",
    pilier: 'demonter-un-chiffre',
    persona: 'marque-produit',
    accroche:
      "Un visuel produit en 3D se paie en deux temps : la création du modèle de la référence, puis chaque rendu. Chez Veolt, un rendu démarre à 119 € HT. Le prix d'une référence dépend surtout de la complexité de l'objet et du nombre de matières à reproduire.",
    corps: [
      "Un devis 3D lisible sépare donc le modèle et les rendus. Un prix « au visuel » qui les confond empêche de savoir ce que coûteront les déclinaisons suivantes.",
      "Les tarifs affichés pour la 3D vont du simple au décuple, sans que l'on sache ce qu'ils couvrent. Un prix bas peut cacher un modèle qu'il faudra refaire à chaque campagne ; un prix élevé peut inclure un modèle réutilisable pendant des années.",
      "Trois facteurs font le prix du modèle. La géométrie : une bouteille lisse se modélise vite, un mécanisme ou un textile froissé beaucoup moins. Les matières : verre, métal brossé, liquide ou étiquette demandent un réglage précis pour paraître réels. Et les sources : un fichier technique ou des plans fournis réduisent le travail par rapport à des photos seules.",
      "Une fois le modèle prêt, chaque visuel supplémentaire — angle, couleur, fond, mise en scène — ne demande que le cadrage, l'éclairage et le rendu. C'est pourquoi le deuxième visuel d'une référence coûte une fraction du premier, et pourquoi la 3D devient intéressante dès qu'on décline.",
      "Pour comparer deux devis, demandez quatre choses : le prix du modèle, le prix d'un rendu supplémentaire, à qui appartient le fichier du modèle à la fin, et combien de séries de corrections sont incluses. La troisième question est souvent la plus importante pour vos prochaines campagnes.",
    ],
    questions: [
      'Qu’est-ce qui fait le prix du modèle 3D ?',
      'Combien coûte un visuel supplémentaire ?',
      'Quelles questions poser pour comparer deux devis 3D ?',
    ],
    aRetenir: [
      'Un devis 3D sépare le modèle (une fois par référence) et les rendus.',
      'Géométrie, matières et sources fournies font le prix du modèle.',
      'Demander à qui appartient le fichier du modèle à la fin.',
    ],
    preuve: 'les prix affichés, et le processus',
    enseignement: "En 3D, le premier visuel paie le modèle. Les suivants ne paient que le cadrage.",
    appel: "Envoyez-nous une photo de la référence à modéliser : nous vous disons ce qui en fera le prix.",
    indicateur: 'part des requêtes de la grappe en top 10, et citations par les IA (relevé manuel)',
    source: 'Prix affiché Veolt (rendu à partir de 119 € HT) ; structure de coût modèle / rendu décrite dans le sujet v-mt-3.',
  },
  {
    ref: 'v-art-3d-3',
    grappe: TROISD,
    requete: 'étapes production publicité 3D',
    titre: 'Publicité 3D : les sept étapes de production',
    pilier: 'coulisses-methode',
    persona: 'marque-produit',
    accroche:
      "Une publicité 3D se produit en sept étapes : modélisation, matières, éclairage, caméra, animation, rendu, étalonnage et montage. Les deux qui pèsent le plus ne sont pas celles qu'on imagine : ce sont les matières et l'éclairage, parce que ce sont elles qui rendent l'image crédible.",
    corps: [
      "Avant la première étape, un brief court fixe l'essentiel : le message, les formats de diffusion — vertical pour les réseaux, horizontal pour le site — et la durée. Un brief flou se paie à l'étape d'animation, quand il faut tout recadrer.",
      "La 3D publicitaire est souvent présentée comme une boîte noire : on envoie un produit, on reçoit une vidéo. Comprendre les étapes permet de savoir où intervenir, quand valider, et pourquoi une modification tardive coûte cher.",
      "La modélisation reproduit la forme exacte du produit ; elle se réutilise ensuite indéfiniment. Les matières donnent au verre sa transparence, au métal ses reflets, au carton sa texture : c'est l'étape où l'image passe de « maquette » à « produit ». L'éclairage, enfin, sculpte le volume et fait l'ambiance — exactement comme en studio photo.",
      "La caméra et l'animation racontent : mouvement, rythme, cadrage de chaque plan. Le rendu calcule ensuite chaque image, ce qui peut prendre du temps machine sur les scènes complexes. L'étalonnage et le montage harmonisent les couleurs, posent le texte, la musique et le son, et déclinent les formats.",
      "Les validations comptent plus que les étapes. Valider la forme avant les matières, les matières avant l'animation, l'animation avant le rendu final : chaque retour fait au bon moment coûte peu, le même retour fait après le rendu oblige à tout recalculer. C'est aussi pourquoi nous ne vendons pas de vidéo à l'unité — le modèle et les matières n'ont de sens que réutilisés.",
    ],
    questions: [
      'Que se passe-t-il pendant la modélisation, les matières et l’éclairage ?',
      'Que font la caméra, l’animation, le rendu et l’étalonnage ?',
      'À quels moments faut-il valider ?',
    ],
    aRetenir: [
      'Sept étapes : modélisation, matières, éclairage, caméra, animation, rendu, étalonnage et montage.',
      'Matières et éclairage font la crédibilité de l’image.',
      'Un retour fait après le rendu coûte le plus cher : valider étape par étape.',
    ],
    preuve: 'le processus, étape par étape',
    enseignement: "En 3D, le premier visuel paie le modèle. Les suivants ne paient que le cadrage.",
    appel: "Quelle étape vous paraît la plus floue ? Posez-nous la question : nous y répondons avec un exemple concret.",
    indicateur: 'part des requêtes de la grappe en top 10, et citations par les IA (relevé manuel)',
    source: 'Reprend le sujet v-mt-3 (sept étapes) ; aucune durée de production promise, conformément aux contraintes de la marque.',
  },
  {
    ref: 'v-art-3d-4',
    grappe: TROISD,
    requete: 'motion design page de vente utilité',
    titre: 'Motion design : à quoi ça sert dans une page de vente',
    pilier: 'coulisses-methode',
    persona: 'marque-produit',
    accroche:
      "Dans une page de vente, le motion design sert à faire comprendre plus vite : montrer un fonctionnement, l'ordre d'une démarche, ou l'avant et l'après d'un produit en quelques secondes. Il ne sert pas à décorer, et une animation qui ne raconte rien ralentit la lecture.",
    corps: [
      "Le bon test est simple : si l'on retire l'animation, le visiteur comprend-il moins bien ? Si la réponse est non, elle peut partir.",
      "Les pages de vente se sont remplies d'animations depuis que les outils les rendent faciles. Beaucoup attirent l'œil sans rien expliquer, et certaines retardent l'affichage de l'information que le visiteur venait chercher.",
      "Le motion explique bien trois choses : un processus en étapes, qu'il déroule dans l'ordre ; une transformation, qu'il montre en continu plutôt qu'en deux photos ; et une interface ou un produit qu'on ne peut pas toucher, qu'il fait manipuler à l'écran. Dans ces cas, quelques secondes d'animation valent un paragraphe.",
      "Une animation de page de vente doit rester courte, se lire sans le son — la plupart des vidéos sont regardées muettes sur mobile — et porter un texte lisible. Elle ne doit pas retarder le titre ni le bouton d'action, et elle doit respecter le réglage « réduire les animations » du système de l'utilisateur.",
      "Le motion a un coût de production proportionnel à sa durée et à sa complexité. Une animation de quelques secondes, ciblée sur le point que la page peine à expliquer, rapporte davantage qu'une longue vidéo de présentation que personne ne regarde jusqu'au bout.",
    ],
    questions: [
      'Que le motion design explique-t-il mieux qu’un texte ?',
      'Quelles règles pour une animation de page de vente ?',
      'Faut-il une animation courte ou une vidéo complète ?',
    ],
    aRetenir: [
      'Une animation se justifie si, sans elle, on comprend moins bien.',
      'Courte, lisible sans le son, sans retarder le titre ni le bouton.',
      'Cibler le point que la page peine à expliquer.',
    ],
    preuve: 'le processus',
    enseignement: "Une animation qui n'explique rien est un temps de chargement en plus.",
    appel: "Quel point de votre page de vente est le plus difficile à expliquer ? C'est celui-là qu'il faut animer.",
    indicateur: 'part des requêtes de la grappe en top 10, et citations par les IA (relevé manuel)',
    source: 'Pratique du métier ; préférence système « prefers-reduced-motion » (norme CSS). Offre Veolt vidéo, pub 3D et motion à partir de 119 € HT, jamais vendue à l’unité.',
  },
  {
    ref: 'v-art-3d-5',
    grappe: TROISD,
    requete: 'rentabilité 3D produit nombre visuels',
    titre: 'Combien de visuels par référence avant que la 3D soit rentable',
    pilier: 'demonter-un-chiffre',
    persona: 'marque-produit',
    accroche:
      "En ordre de grandeur, la 3D devient plus rentable que la photo à partir de cinq visuels par référence environ. En dessous, une séance photo coûte généralement moins cher ; au-delà, chaque visuel 3D supplémentaire coûte peu, alors qu'une photo de plus demande souvent une nouvelle prise de vue.",
    corps: [
      "Ce seuil est une règle de calcul, pas une loi : il bouge avec la complexité du produit et les tarifs photo de votre région. Le bon calcul est le vôtre, et il se fait avec deux devis.",
      "La 3D est présentée tantôt comme plus chère, tantôt comme moins chère que la photo. Les deux sont vrais : tout dépend du nombre de visuels dont vous avez besoin par produit, sur un an.",
      "Comptez sur douze mois, pour une référence, tous les visuels nécessaires : fiche produit, angles, coloris, mises en situation, réseaux sociaux, saisonnalité. Ce total, plus que le prix unitaire, décide du format.",
      "Côté photo, additionnez le coût de chaque séance — studio, photographe, retouche — multiplié par le nombre de séances sur l'année. Côté 3D, additionnez le modèle, payé une fois, et le prix de chaque rendu. Le point où les deux courbes se croisent est votre seuil.",
      "Un modèle 3D se réutilise d'une campagne à l'autre : sa valeur augmente avec chaque déclinaison. C'est pour cela qu'il faut demander à récupérer les fichiers du modèle — sans eux, la rentabilité calculée ne se réalise pas.",
    ],
    questions: [
      'Combien de visuels faut-il compter par référence ?',
      'Comment comparer le coût photo et le coût 3D ?',
      'Pourquoi le modèle 3D prend-il de la valeur avec le temps ?',
    ],
    aRetenir: [
      'Seuil indicatif : environ cinq visuels par référence.',
      "Compter tous les visuels d'une référence sur douze mois.",
      'Récupérer les fichiers du modèle, sinon la rentabilité ne se réalise pas.',
    ],
    preuve: 'une analyse faite par nous, hypothèses affichées',
    enseignement: "La 3D est un investissement par produit, la photo une dépense par séance : ça ne s'arbitre pas pareil.",
    appel: "Combien de visuels produisez-vous par référence et par an ? Envoyez-nous ce chiffre : il suffit à trancher.",
    indicateur: 'part des requêtes de la grappe en top 10, et citations par les IA (relevé manuel)',
    source: 'Reprend le sujet v-dc-3 ; seuil de cinq visuels donné comme ordre de grandeur, sans devis photo relevé.',
  },
];
