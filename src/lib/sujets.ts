/**
 * Le réservoir de sujets — un sujet par créneau du calendrier.
 *
 * Écrits un par un plutôt que générés depuis un gabarit : le ton d'un post
 * MagistrIA n'est pas celui d'un post Veolt, et c'est justement cette
 * différence que la machine doit tenir. Chaque sujet ne mobilise que des
 * preuves autorisées pour son entité (cf. `marques.ts`).
 *
 * Les `[?]` marquent ce qui attend un élément de ta part. Ils sont volontaires :
 * un brouillon qui dit « [?] le chiffre » est honnête, un brouillon qui invente
 * le chiffre ne l'est pas.
 */

import type { EntiteSlug } from './marques';
import { ARTICLES_VEOLT } from './articles-veolt';
import { ARTICLES_MAGISTRIA } from './articles-magistria';

export interface Sujet {
  ref: string;
  titre: string;
  pilier: string;
  persona: string;
  /** Accroche courte — retaillée par format au moment du brouillon. */
  accroche: string;
  corps: string[];
  preuve: string;
  enseignement: string;
  appel: string;
  indicateur: string;
  /**
   * La source du fait avancé — texte, relevé daté, ou élément d'architecture
   * du produit. Facultatif pour les sujets antérieurs à son introduction ;
   * obligatoire en pratique pour tout sujet nouveau, parce qu'un post dont on
   * ne peut pas nommer la source est un post qu'on ne peut pas défendre.
   * Reportée dans les consignes de production, jamais dans le texte publié.
   */
  source?: string;
  /**
   * Articles de blog uniquement (`articles-*.ts`). La grappe du plan de
   * référencement et la requête visée ; les titres de section, en question
   * réelle, un par paragraphe à partir de `corps[2]` ; les points « À retenir »
   * écrits pour l'article. Sans eux, le moule laisse des « [?] ».
   */
  grappe?: string;
  requete?: string;
  questions?: string[];
  aRetenir?: string[];
}

export const SUJETS: Record<EntiteSlug, Sujet[]> = {
  veolt: [
    // ── Montrer le travail ────────────────────────────────────────────────
    {
      ref: 'v-mt-1',
      titre: 'Le même produit, en photo studio et en 3D',
      pilier: 'montrer-le-travail',
      persona: 'marque-produit',
      accroche: "Un packshot 3D et une photo studio du même produit, côte à côte. La différence n'est pas celle qu'on croit.",
      corps: [
        "La photo studio donne la matière réelle. Le rendu 3D donne quatorze angles, trois coloris et un fond qui change sans relouer le studio.",
        "Le vrai arbitrage n'est donc pas la qualité. C'est le nombre de déclinaisons.",
        "En dessous de cinq visuels par référence, la photo reste moins chère. Au-delà, la 3D devient le seul format tenable — le modèle est fait une fois, les variantes sont gratuites.",
        "Nos rendus démarrent à 119 € HT la pièce. Ce n'est pas un prix d'appel : c'est le prix quand on ne refait pas le modèle à chaque fois.",
      ],
      preuve: 'le rendu lui-même, produit par nous',
      enseignement: "La 3D ne remplace pas la photo. Elle remplace la deuxième séance photo.",
      appel: "Si vous avez une référence à décliner, dites-nous laquelle — on vous dit lequel des deux est le moins cher dans votre cas.",
      indicateur: 'temps de lecture',
    },
    {
      ref: 'v-mt-2',
      titre: 'Avant / après sur une page d\'accueil',
      pilier: 'montrer-le-travail',
      persona: 'dirigeant-site-bloque',
      accroche: "Une page d'accueil qui ne convertit pas a presque toujours le même défaut : on ne sait pas en trois secondes ce que l'entreprise vend.",
      corps: [
        "On a refait cette page sans rien changer au fond : même offre, même prix, mêmes textes sources.",
        "Ce qui a changé : une promesse en haut, lisible sans défiler. Un seul bouton. Les preuves avant les arguments.",
        "Le reste — animations, dégradés, 3D — ne sert que si cette première phrase tient.",
        "[?] à compléter avec le chiffre de conversion avant/après dès qu'on dispose d'une mesure réelle. Sans mesure, on montre le travail, on n'annonce pas de résultat.",
      ],
      preuve: 'le livrable — les deux captures',
      enseignement: "Un site se juge sur ce qu'on comprend sans défiler.",
      appel: "Envoyez-nous l'adresse de votre page d'accueil : on vous dit en une phrase ce qu'on comprend de votre offre.",
      indicateur: 'clics sortants',
    },
    {
      ref: 'v-mt-3',
      titre: 'Un pipeline 3D de bout en bout, en dix pages',
      pilier: 'montrer-le-travail',
      persona: 'marque-produit',
      accroche: "Du brief au rendu final : les sept étapes d'une publicité 3D produit, avec ce que chacune coûte en temps.",
      corps: [
        "Modélisation. Matériaux. Éclairage. Caméra. Animation. Rendu. Étalonnage.",
        "Les deux étapes qui mangent le budget ne sont pas celles qu'on imagine : les matériaux et l'éclairage. La modélisation, elle, se réutilise indéfiniment.",
        "C'est pour ça qu'un deuxième visuel sur le même produit coûte une fraction du premier — et pourquoi on ne vend pas de vidéo à l'unité.",
      ],
      preuve: 'le processus, étape par étape',
      enseignement: "En 3D, le premier visuel paie le modèle. Les suivants ne paient que le cadrage.",
      appel: "Quelle étape vous paraît la plus floue ? On en fera le prochain carrousel.",
      indicateur: 'taux d\'achèvement du document',
    },
    // ── Démonter un chiffre ───────────────────────────────────────────────
    {
      ref: 'v-dc-1',
      titre: 'Pourquoi un devis de site varie de 1 500 à 10 000 €',
      pilier: 'demonter-un-chiffre',
      persona: 'dirigeant-site-bloque',
      accroche: "Deux devis pour le même site : 1 490 € et 9 900 €. Les deux peuvent être honnêtes. Voici ce qui change entre les deux.",
      corps: [
        "Le nombre de pages uniques. Cinq pages assemblées à partir d'un même gabarit ne coûtent pas cinq fois une page sur mesure.",
        "Qui écrit les textes. C'est le poste le plus souvent oublié dans un devis bas, et celui qui fait déraper le délai.",
        "Les fonctions : un formulaire n'est pas un espace client, un espace client n'est pas une facturation.",
        "La 3D et le motion, qui se chiffrent à part.",
        "Nos propres fourchettes sont publiques, de 1 490 à 9 900 € HT. Un devis qui ne dit pas laquelle de ces quatre lignes il contient n'est pas comparable.",
      ],
      preuve: 'les prix affichés, et la structure d\'un devis',
      enseignement: "Un devis de site ne se compare pas sur le total. Il se compare ligne par ligne.",
      appel: "Vous avez deux devis sur la table ? Envoyez-les : on vous dit ce qui les sépare, sans vous vendre le nôtre.",
      indicateur: 'temps de lecture',
    },
    {
      ref: 'v-dc-2',
      titre: 'Les trois lignes qu\'un banquier regarde dans un prévisionnel',
      pilier: 'demonter-un-chiffre',
      persona: 'porteur-projet',
      accroche: "Un banquier ne lit pas votre prévisionnel en entier. Il regarde trois lignes, dans cet ordre.",
      corps: [
        "La trésorerie au point le plus bas. Pas le résultat : la trésorerie. Un prévisionnel rentable qui passe sous zéro en mois sept ne finance rien.",
        "L'apport rapporté au besoin. C'est ce qui fixe le risque qu'il prend, et donc sa réponse.",
        "La cohérence du chiffre d'affaires avec la capacité réelle de production. Un prévisionnel qui vend plus que ce que l'équipe peut livrer se voit en trente secondes.",
        "Tout le reste du document sert à justifier ces trois lignes.",
      ],
      preuve: 'le droit commun du métier, et nos propres analyses',
      enseignement: "Un prévisionnel n'est pas un exercice d'optimisme. C'est une démonstration de capacité à rembourser.",
      appel: "Votre point de trésorerie le plus bas, vous le connaissez ? Si non, c'est la première chose à calculer.",
      indicateur: 'temps de lecture',
    },
    {
      ref: 'v-dc-3',
      titre: 'Le coût réel d\'un visuel produit, par référence',
      pilier: 'demonter-un-chiffre',
      persona: 'marque-produit',
      accroche: "Calculons honnêtement : à partir de combien de références la 3D devient moins chère que la photo ?",
      corps: [
        "Photo : location de studio, photographe, retouche, par séance. Le coût est à peu près linéaire au nombre de produits.",
        "3D : le modèle est un coût fixe par produit, puis chaque visuel supplémentaire est quasi gratuit.",
        "Le croisement se situe autour de cinq visuels par référence — c'est une règle d'ordre de grandeur, pas une loi.",
        "[?] à affiner avec un devis photo réel du marché pour que la comparaison soit chiffrée des deux côtés.",
      ],
      preuve: 'une analyse faite par nous, hypothèses affichées',
      enseignement: "La 3D est un investissement par produit, la photo une dépense par séance. Ça ne s'arbitre pas pareil.",
      appel: "Combien de visuels produisez-vous par référence et par an ? Le chiffre suffit à trancher.",
      indicateur: 'enregistrements et partages',
    },
    // ── Coulisses et méthode ──────────────────────────────────────────────
    {
      ref: 'v-cm-1',
      titre: 'Comment on cadre un business plan en quatre entretiens',
      pilier: 'coulisses-methode',
      persona: 'porteur-projet',
      accroche: "Un business plan ne commence pas dans un tableur. Il commence par quatre questions, et la troisième élimine la moitié des projets.",
      corps: [
        "Un : qu'est-ce qui est déjà vendu ? Un euro encaissé vaut dix pages de marché adressable.",
        "Deux : combien de temps pour produire une unité ? C'est ce qui plafonne le chiffre d'affaires.",
        "Trois : qu'est-ce qui se passe si ça prend deux fois plus de temps que prévu ? La réponse décide du besoin de financement, et souvent de la viabilité.",
        "Quatre : qui décide d'acheter, et qui paie ? En B2B ce n'est pas la même personne.",
        "Le tableur vient après. Il ne fait que mettre ces quatre réponses en colonnes.",
      ],
      preuve: 'le processus',
      enseignement: "Un prévisionnel est la conséquence d'un cadrage, pas son point de départ.",
      appel: "Laquelle de ces quatre questions est la moins claire chez vous ?",
      indicateur: 'taux d\'achèvement du document',
    },
    {
      ref: 'v-cm-2',
      titre: 'Ce qu\'on refuse de faire, et pourquoi',
      pilier: 'coulisses-methode',
      persona: 'dirigeant-site-bloque',
      accroche: "On refuse trois types de demandes. Les dire fait gagner du temps à tout le monde.",
      corps: [
        "La vidéo à l'unité. Sur un seul visuel, nous ne sommes pas compétitifs, et le dire est plus utile que de surfacturer.",
        "Le site livré sans textes. Un site sans contenu écrit n'est pas un site, c'est une maquette — et le projet s'arrête toujours là.",
        "Le prévisionnel écrit à l'envers, c'est-à-dire à partir du montant qu'on veut emprunter. Ça ne passe pas en banque, et ça nous engage.",
        "Nous prenons 6 à 8 dossiers par mois. C'est aussi pour ça qu'on choisit.",
      ],
      preuve: 'nos contraintes réelles, et nos prix affichés',
      enseignement: "Un studio qui ne refuse rien ne tient aucun de ses délais.",
      appel: "Votre projet entre dans l'une de ces trois cases ? Dites-le, on vous orientera ailleurs.",
      indicateur: 'temps de lecture',
    },
    {
      ref: 'v-cm-3',
      titre: 'Trois métiers dans la même structure : à quoi ça sert concrètement',
      pilier: 'coulisses-methode',
      persona: 'porteur-projet',
      accroche: "Des développeurs web, des créateurs vidéo et des analystes financiers dans la même structure. Ce n'est pas un argument de plaquette, ça change l'ordre du travail.",
      corps: [
        "Une agence créative ne fait pas de prévisionnel. Un cabinet de conseil ne fait pas de 3D. Quand les deux sont séparés, le site se construit avant que le modèle économique soit arrêté.",
        "Résultat classique : une page de prix qui ne correspond pas aux marges réelles, et qu'il faut refaire six mois plus tard.",
        "Chez nous le prévisionnel passe d'abord. Le site raconte ensuite un modèle qui tient.",
        "C'est un fait sur notre structure, pas une promesse de résultat.",
      ],
      preuve: 'la combinaison des trois métiers',
      enseignement: "Le site ne devrait jamais être écrit avant le modèle économique.",
      appel: "Vous avez arrêté vos prix avant d'écrire votre site, ou l'inverse ?",
      indicateur: 'temps de lecture',
    },
    // ── Pédagogie dirigeant ───────────────────────────────────────────────
    {
      ref: 'v-pd-1',
      titre: 'Le besoin en fonds de roulement, expliqué sans jargon',
      pilier: 'pedagogie-dirigeant',
      persona: 'porteur-projet',
      accroche: "Le besoin en fonds de roulement, c'est l'argent qui dort entre le moment où vous payez et le moment où on vous paie. C'est aussi la première cause d'arrêt d'activité rentable.",
      corps: [
        "Vous achetez en mars. Vous vendez en avril. Votre client paie en juin.",
        "Entre mars et juin, l'argent sort de votre poche et rien ne rentre. Ce trou, c'est le besoin en fonds de roulement.",
        "Il grandit quand l'activité grandit. C'est contre-intuitif, et c'est ce qui tue des entreprises en croissance.",
        "Deux leviers, et deux seulement : raccourcir vos délais d'encaissement, ou allonger vos délais de paiement.",
      ],
      preuve: 'le droit commun du métier',
      enseignement: "Une entreprise ne meurt pas d'un manque de rentabilité. Elle meurt d'un manque de trésorerie.",
      appel: "Combien de jours s'écoulent entre votre dépense et votre encaissement ?",
      indicateur: 'enregistrements et partages',
    },
    {
      ref: 'v-pd-2',
      titre: 'Trois signes qu\'il faut refaire son site, et deux qui ne veulent rien dire',
      pilier: 'pedagogie-dirigeant',
      persona: 'dirigeant-site-bloque',
      accroche: "« Mon site fait vieux » n'est pas une raison de le refaire. Voici les trois qui en sont.",
      corps: [
        "Les visiteurs partent de la page d'accueil sans aller plus loin. Le problème est la promesse, pas le design.",
        "Vous ne pouvez pas modifier une page sans appeler quelqu'un. Le coût de cette dépendance dépasse vite le coût d'un site.",
        "Le site ne reflète plus ce que vous vendez. C'est la seule urgence réelle.",
        "En revanche : un design daté et un trafic faible ne sont pas des raisons. Le premier ne coûte rien si la promesse est claire ; le second est un problème d'acquisition, pas de site.",
      ],
      preuve: 'le droit commun du métier',
      enseignement: "On refait un site quand il ment sur l'offre, pas quand il vieillit.",
      appel: "Lequel de ces trois signes reconnaissez-vous ?",
      indicateur: 'temps de lecture',
    },
    {
      ref: 'v-pd-3',
      titre: 'Ce que votre banquier ne vous dira pas sur votre dossier',
      pilier: 'pedagogie-dirigeant',
      persona: 'porteur-projet',
      accroche: "Un refus de financement est presque toujours motivé par une ligne, et presque jamais expliqué. Les trois les plus fréquentes.",
      corps: [
        "L'apport. En dessous d'un certain rapport apport/besoin, le dossier ne passe pas la première lecture.",
        "La cohérence entre le chiffre d'affaires annoncé et votre capacité de production. Un écart inexpliqué se lit immédiatement.",
        "L'absence de scénario dégradé. Un dossier sans hypothèse basse se lit comme un dossier non travaillé.",
        "[?] à enrichir avec les refus réellement observés dès qu'on en documente.",
      ],
      preuve: 'le droit commun du métier',
      enseignement: "Un dossier de financement se juge sur son hypothèse basse, pas sur son hypothèse haute.",
      appel: "Votre dossier contient-il un scénario dégradé ?",
      indicateur: 'clics sortants',
    },
    // ── Positionnement et prix ────────────────────────────────────────────
    {
      ref: 'v-pp-1',
      titre: 'Nos prix sont bas. Voilà pourquoi, et ce que ça implique',
      pilier: 'positionnement-prix',
      persona: 'dirigeant-site-bloque',
      accroche: "Business plan à partir de 490 €, site à partir de 1 490 €, visuel 3D à partir de 119 €. Ces prix sont sous le marché, et ce n'est pas une promotion.",
      corps: [
        "Nous démarrons. Un studio immatriculé il y a trois mois n'a pas d'historique à faire payer.",
        "Nous prenons 6 à 8 dossiers par mois. À ce volume, nous n'avons pas de structure commerciale à financer.",
        "Ce que ça implique pour vous : des prix bas, et pas de référence client à vous montrer. Nous l'assumons plutôt que de le contourner.",
        "C'est aussi pourquoi l'analyse est gratuite : vous jugez sur pièce avant de payer quoi que ce soit.",
      ],
      preuve: 'les prix affichés, et notre ancienneté réelle',
      enseignement: "Un prix bas se justifie par une structure, pas par une remise.",
      appel: "Demandez l'analyse gratuite : réponse sous 24 h, sans engagement.",
      indicateur: 'clics sortants',
    },
    {
      ref: 'v-pp-2',
      titre: 'Pourquoi nous donnons l\'analyse avant de vendre',
      pilier: 'positionnement-prix',
      persona: 'porteur-projet',
      accroche: "Nous n'avons aucune référence client à vous montrer. Nous avons donc choisi de prouver autrement : en travaillant d'abord, gratuitement.",
      corps: [
        "Un studio sans historique ne peut pas vendre en rassurant. Il peut vendre en donnant.",
        "L'analyse gratuite n'est pas une accroche. C'est la pièce qui remplace la référence : vous jugez le travail, pas la plaquette.",
        "Réponse sous 24 h. C'est le seul délai que nous promettons, parce que c'est le seul que nous tenons.",
        "Si l'analyse est bonne, nous n'avons pas besoin d'argumenter. Si elle ne l'est pas, vous ne nous devez rien.",
      ],
      preuve: "l'analyse gratuite, qui est une vraie offre sans engagement",
      enseignement: "Quand on n'a pas de preuve à montrer, il faut en fabriquer une pour chaque prospect.",
      appel: "Dites-nous sur quoi vous voulez être challengé : le prévisionnel, le site ou les visuels.",
      indicateur: 'clics sortants',
    },
  ],

  magistria: [
    // ── Un arrêt, une conséquence ─────────────────────────────────────────
    {
      ref: 'm-ac-1',
      titre: 'Charge de la preuve du lien entre manquement et sinistre',
      pilier: 'arret-consequence',
      persona: 'gestionnaire-sinistres',
      accroche: "Quand un assureur invoque un défaut de maintenance pour refuser sa garantie, c'est à lui d'établir le lien avec le sinistre. Pas à l'assuré de le réfuter.",
      corps: [
        "La deuxième chambre civile de la Cour de cassation l'a rappelé (pourvoi n° 23-23358) : la preuve du lien entre le manquement allégué et le sinistre pèse sur l'assureur.",
        "La conséquence pratique est lourde pour un service indemnisation : un rapport d'expertise qui constate un défaut d'entretien ne suffit pas. Il faut qu'il établisse que ce défaut a causé le dommage.",
        "Deux dossiers sur lesquels nous voyons passer la même fragilité : le rapport conclut à un manquement, et la causalité reste implicite.",
        "Un refus motivé par un rapport qui ne dit pas cela est un refus attaquable.",
      ],
      preuve: 'la décision, citée',
      enseignement: "Constater un manquement et prouver sa causalité sont deux opérations distinctes. Seule la seconde fonde un refus.",
      appel: "Dans vos dossiers, le rapport d'expertise établit-il la causalité, ou seulement le manquement ?",
      indicateur: 'temps de lecture',
    },
    {
      ref: 'm-ac-2',
      titre: 'Une clause d\'exclusion doit être formelle et limitée',
      pilier: 'arret-consequence',
      persona: 'gestionnaire-sinistres',
      accroche: "Une exclusion qui renvoie à un « entretien régulier » sans le définir est réputée non écrite. L'article L. 113-1 du code des assurances ne laisse pas de marge.",
      corps: [
        "L'article L. 113-1 subordonne la validité d'une clause d'exclusion à son caractère formel et limité.",
        "L'article L. 112-4 ajoute qu'elle doit figurer en caractères très apparents.",
        "« Formel » signifie que l'assuré peut savoir, en lisant la clause, ce qui est exclu. Un standard de diligence indéterminé ne le permet pas.",
        "« Limité » signifie que l'exclusion ne vide pas la garantie de son objet.",
        "Vérification concrète à faire sur chaque refus : la clause est-elle aussi dans les conditions particulières, et dans quels caractères ?",
      ],
      preuve: 'le code des assurances, articles cités',
      enseignement: "Une exclusion imprécise n'est pas une exclusion opposable.",
      appel: "Vos clauses d'exclusion définissent-elles ce qu'elles excluent, ou renvoient-elles à un standard ?",
      indicateur: 'temps de lecture',
    },
    {
      ref: 'm-ac-3',
      titre: 'Le délai de déclaration : ce qui le fait courir',
      pilier: 'arret-consequence',
      persona: 'gestionnaire-sinistres',
      accroche: "Le délai de déclaration court de la connaissance du sinistre, pas de sa survenance. La nuance décide d'une déchéance.",
      corps: [
        "Un sinistre informatique découvert quatre jours après sa survenance, déclaré dans les cinq jours ouvrés contractuels, est déclaré dans les temps.",
        "La déchéance pour déclaration tardive suppose en outre une clause expresse, et un préjudice pour l'assureur.",
        "Pour un service indemnisation, le point à documenter n'est donc pas la date de l'incident mais la date de découverte, et la pièce qui l'établit.",
        "C'est exactement ce que nous demandons à l'outil de reconstituer : une chronologie pièce par pièce, avec le numéro de pièce en regard de chaque date.",
      ],
      preuve: 'le code des assurances, et la méthode de chronologie',
      enseignement: "La date qui compte est celle de la connaissance, et elle doit être prouvée par une pièce.",
      appel: "Vos chronologies de sinistre citent-elles la pièce en regard de chaque date ?",
      indicateur: 'taux d\'achèvement du document',
    },
    // ── La méthode nommée ─────────────────────────────────────────────────
    {
      ref: 'm-mn-1',
      titre: 'Pourquoi notre outil raisonne en syllogisme, et le montre',
      pilier: 'methode-nommee',
      persona: 'avocat-independant',
      accroche: "Majeure, mineure, conclusion. Notre outil ne répond pas : il applique un syllogisme juridique, et affiche les trois étapes séparément.",
      corps: [
        "Règle applicable, citée. Faits qualifiés, rattachés aux pièces. Conclusion, qui découle des deux.",
        "L'intérêt n'est pas académique. Un raisonnement en trois temps est vérifiable : vous pouvez contester la majeure sans tout reprendre.",
        "Une réponse en bloc, elle, ne se conteste pas — elle se croit ou elle se jette.",
        "C'est pour cette raison que l'outil dit aussi quand les pièces ne permettent pas de conclure. C'est une sortie prévue, pas un échec.",
      ],
      preuve: 'la méthode publiée, et notre propre architecture',
      enseignement: "Un raisonnement qu'on ne peut pas découper ne peut pas être contesté — donc pas utilisé.",
      appel: "Sur quelle étape voudriez-vous pouvoir reprendre la main : la règle, la qualification ou la conclusion ?",
      indicateur: 'temps de lecture',
    },
    {
      ref: 'm-mn-2',
      titre: 'FAIR : quantifier un risque cyber en euros, pas en couleurs',
      pilier: 'methode-nommee',
      persona: 'juriste-entreprise',
      accroche: "Une matrice de risque rouge-orange-vert ne se négocie pas avec un assureur. Une fourchette en euros, si.",
      corps: [
        "La méthode FAIR décompose un risque en fréquence d'événement et en ampleur de perte, puis produit une distribution — pas une couleur.",
        "Pour une direction juridique, l'intérêt est direct : c'est la seule forme qui se confronte à un montant de garantie.",
        "Elle impose en revanche de nommer ses hypothèses. C'est son coût, et c'est aussi ce qui la rend discutable au bon sens du terme.",
        "Notre outil applique FAIR en affichant les hypothèses séparément du résultat, pour qu'on puisse changer l'une sans refaire l'autre.",
      ],
      preuve: 'la méthode publiée',
      enseignement: "Un risque exprimé en couleur ne se négocie pas. Un risque exprimé en euros se négocie.",
      appel: "Vos analyses de risque sortent-elles un montant, ou une couleur ?",
      indicateur: 'taux d\'achèvement du document',
    },
    {
      ref: 'm-mn-3',
      titre: 'EBIOS Risk Manager, en dix pages pour un juriste',
      pilier: 'methode-nommee',
      persona: 'juriste-entreprise',
      accroche: "EBIOS Risk Manager est une méthode de l'ANSSI. Pour une direction juridique, l'essentiel tient en cinq ateliers.",
      corps: [
        "Atelier 1 : le socle de sécurité et les événements redoutés. C'est là que le juridique entre — un événement redouté est souvent une obligation contractuelle.",
        "Atelier 2 : les sources de risque et leurs objectifs.",
        "Atelier 3 : les scénarios stratégiques, c'est-à-dire l'écosystème. Les prestataires y apparaissent, donc les contrats.",
        "Atelier 4 : les scénarios opérationnels.",
        "Atelier 5 : le traitement du risque, où se décide ce qui est assuré et ce qui est accepté.",
        "La méthode est publique et gratuite. C'est son intérêt : vos interlocuteurs techniques la connaissent déjà.",
      ],
      preuve: 'la méthode publiée par l\'ANSSI',
      enseignement: "Les ateliers 1 et 3 d'EBIOS sont des ateliers juridiques déguisés en ateliers techniques.",
      appel: "Votre direction juridique est-elle conviée à l'atelier 1 ?",
      indicateur: 'taux d\'achèvement du document',
    },
    // ── Le sinistre décortiqué ────────────────────────────────────────────
    {
      ref: 'm-sd-1',
      titre: 'Un rapport d\'expertise cyber, traduit en enjeux de garantie',
      pilier: 'sinistre-decortique',
      persona: 'gestionnaire-sinistres',
      accroche: "Un rapport d'expertise cyber de quarante pages contient en général trois phrases qui décident de la garantie. Les trouver est un travail de lecture, pas de technique.",
      corps: [
        "La première situe la date de compromission initiale — elle commande le délai de déclaration.",
        "La deuxième qualifie le vecteur d'entrée — elle commande l'exclusion éventuelle.",
        "La troisième dit si des sauvegardes existaient et étaient testées — elle commande l'ampleur du préjudice indemnisable.",
        "Le reste du rapport documente ces trois points. Un gestionnaire qui les isole d'abord lit le rapport en vingt minutes au lieu de deux heures.",
      ],
      preuve: 'le code des assurances, et la structure réelle d\'un rapport',
      enseignement: "Dans un rapport technique, cherchez les phrases qui déplacent une date, une exclusion ou un montant.",
      appel: "Laquelle de ces trois phrases est la plus souvent absente de vos rapports ?",
      indicateur: 'temps de lecture',
    },
    {
      ref: 'm-sd-2',
      titre: 'Les quatre vérifications avant un courrier de refus',
      pilier: 'sinistre-decortique',
      persona: 'gestionnaire-sinistres',
      accroche: "Avant d'envoyer un refus de garantie, quatre vérifications. Chacune a fait tomber des refus devant un juge.",
      corps: [
        "La clause invoquée est-elle formelle et limitée (art. L. 113-1) ?",
        "Figure-t-elle en caractères très apparents, et aussi dans les conditions particulières (art. L. 112-4) ?",
        "Le lien entre le manquement et le sinistre est-il établi par une pièce, et non supposé ?",
        "La date retenue est-elle celle de la connaissance du sinistre, et prouvée ?",
        "Un refus qui échoue sur l'une des quatre coûte plus qu'une indemnisation : il coûte l'indemnisation, les intérêts et les frais.",
      ],
      preuve: 'le code des assurances, articles cités',
      enseignement: "Un refus de garantie se prépare comme une conclusion, pas comme un courrier type.",
      appel: "Votre procédure de refus comporte-t-elle ces quatre points ?",
      indicateur: 'enregistrements et partages',
    },
    // ── Conformité datée ──────────────────────────────────────────────────
    {
      ref: 'm-cd-1',
      titre: 'NIS 2 : l\'obligation de notification que les contrats ignorent encore',
      pilier: 'conformite-datee',
      persona: 'juriste-entreprise',
      accroche: "La directive NIS 2 impose une notification d'incident dans des délais courts. Beaucoup de contrats prestataires signés avant ne prévoient rien pour la tenir.",
      corps: [
        "L'obligation pèse sur l'entité, mais l'information remonte des prestataires. Sans clause, elle ne remonte pas dans les temps.",
        "La clause à ajouter est courte : notification de tout incident de sécurité sous 24 heures, et droit d'audit.",
        "Le moment pour la poser est le renouvellement. Après un incident, elle ne sert plus à rien.",
        "C'est le type de point que notre outil fait ressortir d'un contrat : non pas « ce contrat est risqué », mais « cet article manque, et voici lequel ajouter ».",
      ],
      preuve: 'les textes et leurs dates',
      enseignement: "Une obligation de notification sans clause contractuelle en amont est une obligation qu'on ne peut pas tenir.",
      appel: "Vos contrats prestataires prévoient-ils un délai de notification d'incident ?",
      indicateur: 'clics sortants',
    },
    {
      ref: 'm-cd-2',
      titre: 'Une clause de limitation de responsabilité tombe sur la faute lourde',
      pilier: 'conformite-datee',
      persona: 'juriste-entreprise',
      accroche: "Un plafond d'indemnisation fixé aux douze derniers mois de redevance est courant. Il est inopposable en cas de faute lourde.",
      corps: [
        "La clause reste valable pour le reste — ce n'est pas une nullité générale.",
        "Mais elle ne protège pas là où le risque est le plus grand, et c'est précisément là qu'on croit être couvert.",
        "Conséquence pratique : un plafond bas est acceptable si, et seulement si, les obligations essentielles sont assorties d'engagements distincts.",
        "C'est une lecture de contrat, pas un avis : l'outil signale la clause et l'article, le juriste tranche.",
      ],
      preuve: 'les textes, et le principe de décision humaine',
      enseignement: "Un plafond de responsabilité protège le cas ordinaire, jamais le cas grave.",
      appel: "Vos obligations essentielles sont-elles sorties du plafond ?",
      indicateur: 'temps de lecture',
    },
    // ── Position sur l'IA ─────────────────────────────────────────────────
    {
      ref: 'm-pi-1',
      titre: "« L'IA propose, le professionnel décide » n'est pas un slogan",
      pilier: 'position-ia',
      persona: 'avocat-independant',
      accroche: "La défiance des juristes envers l'IA est rationnelle. Un outil qui tranche sans montrer son raisonnement est inutilisable en contentieux.",
      corps: [
        "Nous avons donc construit l'inverse : l'outil instruit, il ne conclut jamais seul.",
        "Trois conséquences concrètes dans le produit : chaque affirmation porte sa source, chaque raisonnement est découpé en étapes vérifiables, et l'outil dit explicitement quand les pièces ne permettent pas de conclure.",
        "Cette dernière sortie est la plus importante. Un outil qui ne sait pas dire « je ne peux pas conclure » produira une conclusion dans tous les cas, y compris quand il n'y en a pas.",
        "C'est une contrainte d'architecture, visible dans le produit. Pas une intention.",
      ],
      preuve: 'notre propre architecture, et le principe fondateur',
      enseignement: "Un outil juridique qui ne sait pas dire « je ne peux pas conclure » n'est pas prudent, il est faux.",
      appel: "Qu'attendez-vous d'un outil d'IA juridique avant de lui faire confiance : la source, l'étape, ou la limite ?",
      indicateur: 'temps de lecture',
    },
    {
      ref: 'm-pi-2',
      titre: 'Ce que notre outil ne fait pas, et pourquoi c\'est volontaire',
      pilier: 'position-ia',
      persona: 'avocat-independant',
      accroche: "Notre outil ne rend pas d'avis juridique, ne prédit pas l'issue d'un litige et ne remplace personne. Ces trois refus sont le produit.",
      corps: [
        "Pas d'avis : le conseil juridique est un acte professionnel, pas une sortie de modèle.",
        "Pas de prédiction d'issue : un taux de succès affiché sur un dossier est une statistique déguisée en conseil.",
        "Pas de remplacement : la décision reste celle du professionnel, et l'outil est construit pour qu'elle le reste.",
        "Ce qu'il fait à la place : il instruit — chronologie des pièces, règles applicables citées, points fragiles identifiés, et ce qui manque au dossier.",
      ],
      preuve: 'notre propre architecture',
      enseignement: "Dans un outil juridique, la liste de ce qu'il refuse de faire est plus informative que la liste de ses fonctions.",
      appel: "Un outil qui refuse de conclure vous paraît-il plus utile, ou plus frustrant ?",
      indicateur: 'enregistrements et partages',
    },

    // ─────────────────────────────────────────────────────────────────────
    // Série préparée le 2026-10-19 — angle : **ce que l'outil refuse de faire**
    //
    // C'est le seul angle à la fois vrai et intéressant pour cette entité : une
    // citation introuvable qui reste marquée introuvable, un acte signalé
    // incomplet plutôt que rendu impeccable et sans effet, une méthode nommée
    // qu'on peut défendre devant un confrère. Chaque sujet porte sa `source` —
    // aucun fait avancé ici n'est une estimation.
    // ─────────────────────────────────────────────────────────────────────
    {
      ref: 'm-pi-3',
      titre: 'Une citation introuvable reste marquée introuvable',
      pilier: 'position-ia',
      persona: 'avocat-independant',
      accroche:
        "Une citation que notre outil ne retrouve pas reste marquée « introuvable ». Nous n'avons pas prévu de bouton pour la faire disparaître.",
      corps: [
        "Chaque citation produite est classée dans l'un de trois états : vérifiée, inconnue, hors-corpus. L'état s'affiche à côté de la citation, pas en annexe.",
        "« Inconnue » veut dire que la référence n'a pas été retrouvée dans les sources branchées. Elle n'est pas rapprochée de la référence la plus proche, elle n'est pas reformulée : elle reste inconnue.",
        "Exemple concret : lorsque l'outil avance l'article L. 113-1 du code des assurances sur les clauses d'exclusion, la citation porte son état en regard — et la même règle vaut pour une décision qu'il n'aurait pas retrouvée.",
        "Une référence approximative coûte plus cher qu'une référence absente, parce qu'elle se recopie dans des conclusions. L'absence se voit ; l'approximation se propage.",
      ],
      preuve: 'notre propre architecture — le classement de chaque citation en trois états',
      source:
        "Architecture du produit MagistrIA : classement de chaque citation produite en vérifiée / inconnue / hors-corpus, une citation introuvable restant marquée introuvable. Article L. 113-1 du code des assurances pour l'exemple cité. Produit en ligne : https://magistrai.fr",
      enseignement:
        "Un outil qui ne peut pas afficher « introuvable » affichera toujours quelque chose — et ce quelque chose se recopie.",
      appel:
        "Dans votre pratique, qu'attendez-vous d'abord d'une citation produite par un outil : qu'elle soit utile, ou qu'elle soit vérifiable ?",
      indicateur: 'temps de lecture',
    },
    {
      ref: 'm-pi-4',
      titre: 'Trente spécialisations, et aucune pour le droit de l\'IA',
      pilier: 'position-ia',
      persona: 'avocat-independant',
      accroche:
        "La nomenclature des spécialisations d'avocat compte trente entrées. Aucune ne porte sur l'intelligence artificielle.",
      corps: [
        "Le Conseil national des barreaux publie l'annuaire national des avocats en open data sur data.gouv.fr, sous Licence Ouverte v2, en application de l'article 21-1 alinéa 2 de la loi du 31 décembre 1971. Version du 15 octobre 2026 : 116 720 avocats.",
        "On y trouve le barreau, le cabinet, le SIREN, jusqu'à trois spécialisations et la date de serment. Ni courriel, ni téléphone : c'est un annuaire de la profession, pas un fichier de contact.",
        "Et dans les trente spécialisations de la nomenclature, aucune ne mentionne l'intelligence artificielle. Les avocats qui travaillent sur ces sujets apparaissent sous « droit du numérique et des communications » — 187 en France — ou « protection des données personnelles » — 12.",
        "Pour comparaison, dans le même relevé : propriété intellectuelle 383, assurances 41, bancaire et boursier 49.",
        "Ces nombres ne disent pas qu'il manque des compétences. Ils disent que la nomenclature n'a pas encore de case pour un contentieux qui existe déjà — et qu'un professionnel qui s'en occupe reste, pour l'instant, invisible dans la case où on le chercherait.",
      ],
      preuve: "l'annuaire national des avocats, open data du Conseil national des barreaux",
      source:
        "Annuaire national des avocats, Conseil national des barreaux — open data sur data.gouv.fr, Licence Ouverte v2, publié en application de l'article 21-1 alinéa 2 de la loi du 31 décembre 1971. Version du 15/10/2026 : 116 720 avocats, nomenclature de trente spécialisations, dont 187 « droit du numérique et des communications », 12 « protection des données personnelles », 383 propriété intellectuelle, 41 assurances, 49 bancaire et boursier. Agrégats uniquement — aucun nom, aucun cabinet.",
      enseignement:
        "Quand une compétence n'a pas de case dans la nomenclature, elle ne se cherche pas : elle se construit sans être comptée.",
      appel: "Sous quelle spécialisation déclareriez-vous une mission de droit de l'IA aujourd'hui ?",
      indicateur: 'temps de lecture',
    },
    {
      ref: 'm-pi-5',
      titre: "Comment vérifier qu'une IA juridique ne cite pas une décision qui n'existe pas",
      pilier: 'position-ia',
      persona: 'juriste-entreprise',
      accroche:
        "Trois questions suffisent : l'outil affiche-t-il l'état de chaque citation, cite-t-il sa source, et sait-il répondre qu'il ne sait pas ?",
      corps: [
        "Dans MagistrIA, chaque citation produite est classée vérifiée, inconnue ou hors-corpus, et l'état s'affiche à côté de la citation. Une référence introuvable reste marquée introuvable.",
        "La question se pose parce qu'un modèle de langage produit une référence plausible aussi facilement qu'une référence exacte, et qu'une référence plausible se recopie dans des conclusions.",
        "Premier test : demander l'état de la citation. Un outil qui n'a pas d'état n'a pas vérifié, il a seulement produit.",
        "Deuxième test : demander le périmètre. MagistrIA couvre huit référentiels — RGPD, NIS 2, DORA, MiCA, règlement sur l'intelligence artificielle, ACPR et code des assurances, loi de programmation militaire 2024-2030, volet cybercriminalité du code pénal. Hors de là, la réponse est hors-corpus.",
        "Troisième test : demander une affirmation de droit sans référence. Elle ne doit pas sortir. Une clause d'exclusion, par exemple, ne se discute pas sans viser l'article L. 113-1 du code des assurances.",
        "Quatrième test, le plus révélateur : donner un dossier incomplet. Un outil utilisable répond que les pièces ne permettent pas de conclure. Un outil dangereux conclut quand même.",
      ],
      preuve: "l'architecture du produit — états de citation et périmètre déclaré — et les articles cités",
      source:
        "Architecture du produit : classement vérifié / inconnu / hors-corpus, et périmètre de huit référentiels (RGPD, NIS 2, DORA, MiCA, règlement IA, ACPR / code des assurances, LPM 2024-2030, code pénal — cybercriminalité). Article L. 113-1 du code des assurances. Grappe « IA et droit », article pilier déjà en base.",
      enseignement:
        "La liste de ce qu'un outil juridique refuse de faire est plus informative que la liste de ses fonctions.",
      grappe: 'IA et droit',
      requete: 'vérifier fiabilité IA juridique sources',
      questions: [
        "L'outil affiche-t-il l'état de chaque citation ?",
        "L'outil déclare-t-il son périmètre ?",
        'Une affirmation de droit peut-elle sortir sans référence ?',
        "Que répond l'outil face à un dossier incomplet ?",
      ],
      aRetenir: [
        'Chaque citation doit porter un état : vérifiée, inconnue ou hors-corpus.',
        'Un périmètre déclaré se vérifie ; hors de lui, la réponse est « hors-corpus ».',
        'Un outil utilisable sait répondre que les pièces ne permettent pas de conclure.',
      ],
      appel: "Lequel de ces quatre tests votre outil actuel échoue-t-il ?",
      indicateur: 'part des requêtes de la grappe en top 10, et citations par les IA (relevé manuel)',
    },
    {
      ref: 'm-mn-4',
      titre: 'Trois méthodes nommées, et pourquoi le nom compte',
      pilier: 'methode-nommee',
      persona: 'avocat-independant',
      accroche:
        "Notre outil n'applique pas « l'IA ». Il applique trois méthodes qui portent un nom : le syllogisme juridique, FAIR, EBIOS Risk Manager.",
      corps: [
        "Une méthode nommée se défend devant un confrère. On peut dire laquelle a été suivie, à quelle étape, et sur quelle hypothèse.",
        "Le syllogisme juridique : règle citée, faits qualifiés, conclusion. Trois étapes affichées séparément, donc trois étapes contestables séparément.",
        "FAIR, pour la quantification du risque : une fréquence d'événement et une ampleur de perte, hypothèses affichées à part du résultat.",
        "EBIOS Risk Manager, publiée par l'ANSSI : cinq ateliers, dont le premier et le troisième sont des ateliers juridiques déguisés en ateliers techniques.",
        "Et à l'intérieur de chaque méthode, la même exigence : toute affirmation de droit porte sa référence — l'article L. 113-1 du code des assurances pour une clause d'exclusion, par exemple, et pas « la jurisprudence considère que ».",
        "Un contradicteur peut attaquer une méthode nommée, et on peut la défendre. Une réponse sans méthode ne se défend pas : elle se croit ou elle se jette.",
      ],
      preuve: 'les méthodes publiées : syllogisme juridique, FAIR, EBIOS Risk Manager (ANSSI)',
      source:
        "Méthodes publiques et nommées, réellement appliquées par le produit : syllogisme juridique ; FAIR pour la quantification du risque ; EBIOS Risk Manager, publiée par l'ANSSI. Article L. 113-1 du code des assurances pour l'exemple cité.",
      enseignement:
        "Une méthode qu'on peut nommer est une méthode qu'on peut contester — et c'est précisément ce qui la rend utilisable.",
      appel: 'Laquelle de ces trois méthodes vos contradicteurs connaissent-ils déjà ?',
      indicateur: "taux d'achèvement du document",
    },
    {
      ref: 'm-sd-3',
      titre: "Un acte signalé incomplet, plutôt qu'un acte impeccable et sans effet",
      pilier: 'sinistre-decortique',
      persona: 'gestionnaire-sinistres',
      accroche:
        "Un contrôle vérifie, sur chaque acte produit, les mentions dont l'absence prive l'acte d'effet. Il signale plutôt qu'il ne rattrape.",
      corps: [
        "Un acte bien écrit mais privé d'une mention peut ne produire aucun effet. La forme n'est pas un ornement ici : elle est la condition de l'effet.",
        "Premier exemple : une mise en demeure doit porter un délai chiffré, sans quoi les intérêts moratoires ne courent pas. [?] la référence exacte reste à viser avant publication — à confirmer dans le code civil, et à ne pas publier approximative.",
        "Deuxième exemple : un refus de garantie doit citer l'exclusion dans ses termes, parce que l'article L. 113-1 du code des assurances exige une clause formelle et limitée.",
        "Troisième exemple : le même refus doit rappeler la prescription biennale de l'article L. 114-1 du code des assurances.",
        "Le contrôle ne réécrit pas l'acte. Il dit quelle mention manque et pourquoi son absence coûte l'effet recherché — puis il laisse décider.",
      ],
      preuve: 'le code des assurances, articles cités, et le contrôle des mentions du produit',
      source:
        "Articles L. 113-1 (clause formelle et limitée) et L. 114-1 (prescription biennale) du code des assurances. Contrôle des mentions dont l'absence prive l'acte d'effet, implémenté dans le produit. ⚠ L'article fondant l'intérêt moratoire n'est pas visé : marqué [?] dans le corps, à compléter avant publication.",
      enseignement:
        "Un acte sans effet coûte plus cher qu'un acte visiblement incomplet : le second se corrige avant d'être envoyé.",
      appel: "Votre procédure relit-elle les mentions obligatoires avant l'envoi, ou après le premier contentieux ?",
      indicateur: "taux d'achèvement du document",
    },
    {
      ref: 'm-sd-4',
      titre: 'Deux ans — le délai que le courrier de refus doit rappeler',
      pilier: 'sinistre-decortique',
      persona: 'gestionnaire-sinistres',
      accroche: "Deux ans. C'est le délai de prescription que votre courrier de refus doit rappeler.",
      corps: [
        "L'article L. 114-1 du code des assurances fixe à deux ans la prescription des actions nées du contrat d'assurance.",
        "Le rappel de ce délai est l'une des mentions que notre contrôle vérifie sur un refus de garantie. Son absence n'est pas un détail de rédaction.",
        "Deuxième mention vérifiée : l'exclusion doit être citée dans ses termes, parce que l'article L. 113-1 exige une clause formelle et limitée.",
        "Le contrôle ne réécrit pas le courrier. Il dit : cette mention manque, voici pourquoi elle compte.",
        "Un courrier impeccable et sans effet est le pire des deux mondes — il coûte le temps de la rédaction et le résultat du contentieux.",
      ],
      preuve: 'le code des assurances, articles L. 113-1 et L. 114-1',
      source:
        "Articles L. 114-1 (prescription biennale) et L. 113-1 (clause formelle et limitée) du code des assurances ; contrôle des mentions obligatoires du produit.",
      enseignement: "Sur un refus de garantie, la mention manquante coûte plus que la phrase maladroite.",
      appel: 'Vos modèles de courrier rappellent-ils la prescription biennale ?',
      indicateur: 'enregistrements et partages',
    },
    {
      ref: 'm-cd-3',
      titre: 'Huit référentiels, et ce qui est dehors est dit dehors',
      pilier: 'conformite-datee',
      persona: 'juriste-entreprise',
      accroche:
        "Notre outil couvre huit référentiels. Ce qui est en dehors est renvoyé « hors-corpus » — pas traité à l'estime.",
      corps: [
        "Les huit : RGPD, NIS 2, DORA, MiCA, règlement sur l'intelligence artificielle, ACPR et code des assurances, loi de programmation militaire 2024-2030, et le volet cybercriminalité du code pénal.",
        "Un périmètre déclaré n'est pas une limite qu'on cache, c'est une information qui se vérifie. Hors de ces huit, l'outil ne produit pas une réponse approximative : il répond hors-corpus.",
        "La raison est pratique. Une direction juridique qui tient des échéances a besoin de savoir où l'outil s'arrête — un outil qu'il faut entièrement revérifier ne fait gagner aucun temps.",
        "À l'intérieur du périmètre, chaque règle citée porte sa référence : un article, une décision, une date. C'est l'exigence d'une note interne, pas celle d'un moteur de recherche.",
      ],
      preuve: 'le périmètre réel du produit, et les textes cités avec leurs dates',
      source:
        "Périmètre du produit : huit référentiels — RGPD, NIS 2, DORA, MiCA, règlement sur l'intelligence artificielle, ACPR / code des assurances, loi de programmation militaire 2024-2030, code pénal (volet cybercriminalité).",
      enseignement:
        "Un périmètre déclaré vaut mieux qu'un périmètre large et flou : le premier se vérifie, le second se découvre en contentieux.",
      appel: 'Sur lequel de ces huit référentiels votre équipe manque-t-elle le plus de temps ?',
      indicateur: 'temps de lecture',
    },
  ],
};

export function sujetsDe(entite: EntiteSlug, pilier?: string) {
  const tous = SUJETS[entite];
  return pilier ? tous.filter((s) => s.pilier === pilier) : tous;
}

/**
 * Les articles de blog du plan de référencement, dans l'ordre où le calendrier
 * les pose : les grappes alternent, pour que chaque série avance en parallèle.
 * `m-pi-5` (déjà écrit, hors calendrier) ouvre la grappe « IA et droit ».
 */
export const ARTICLES: Record<EntiteSlug, Sujet[]> = {
  veolt: ARTICLES_VEOLT,
  magistria: [...ARTICLES_MAGISTRIA, ...SUJETS.magistria.filter((s) => s.ref === 'm-pi-5')],
};

const ORDRE_CALENDRIER: Record<EntiteSlug, string[]> = {
  veolt: [
    'v-art-bp-1', 'v-art-site-1', 'v-art-3d-1', 'v-art-bp-3', 'v-art-site-2', 'v-art-bp-2',
    'v-art-3d-2', 'v-art-bp-4', 'v-art-site-3', 'v-art-3d-3', 'v-art-bp-5', 'v-art-site-6',
    // Réserve, au-delà des douze semaines :
    'v-art-bp-6', 'v-art-site-4', 'v-art-site-5', 'v-art-3d-4', 'v-art-3d-5',
  ],
  magistria: [
    'm-art-sin-1', 'm-art-conf-1', 'm-art-ia-2', 'm-art-sin-2', 'm-art-conf-2', 'm-art-ia-6',
    'm-art-sin-3', 'm-art-conf-3', 'm-art-ia-3', 'm-art-sin-4', 'm-art-conf-4', 'm-art-sin-6',
    // Réserve, au-delà des douze semaines :
    'm-art-sin-5', 'm-art-conf-5', 'm-art-ia-4', 'm-art-ia-5',
  ],
};

/** Les articles d'une entité dans l'ordre du calendrier. */
export function articlesDe(entite: EntiteSlug): Sujet[] {
  return ORDRE_CALENDRIER[entite].map((ref) => ARTICLES[entite].find((s) => s.ref === ref)!).filter(Boolean);
}

/**
 * L'article du plan qui développe un sujet court du calendrier — la
 * correspondance est celle que chaque article déclare dans sa `source`
 * (« Reprend le sujet v-dc-2 »). Un article est sa propre correspondance.
 */
export function articlePourSujet(ref: string, entite: EntiteSlug): Sujet | undefined {
  const tous = ARTICLES[entite];
  return tous.find((a) => a.ref === ref) ?? tous.find((a) => new RegExp(`\\b${ref}\\b`).test(a.source ?? ''));
}

/** Les autres articles de la même grappe — la série affichée en fin d'article. */
export function serieDe(s: Sujet, entite: EntiteSlug): Sujet[] {
  if (!s.grappe) return [];
  return ARTICLES[entite].filter((x) => x.grappe === s.grappe && x.ref !== s.ref);
}

export function sujet(ref: string): Sujet | undefined {
  return [...SUJETS.veolt, ...SUJETS.magistria, ...ARTICLES_VEOLT, ...ARTICLES_MAGISTRIA].find((s) => s.ref === ref);
}
