/**
 * Articles de blog MagistrIA — un par titre du plan de grappes (`GRAPPES` dans
 * `db.ts`), écrits le 2026-11-11. L'article « IA juridique : comment vérifier
 * ce qu'elle avance » existe déjà (sujet `m-pi-5`) et n'est pas doublé ici.
 *
 * Règles tenues, en plus de celles de `sujets.ts` :
 *  - toute affirmation de droit vise un texte (article, règlement, directive)
 *    ou une décision citée avec sa date. Aucune décision n'est citée de
 *    mémoire sans être certaine : quand un point repose sur la jurisprudence,
 *    l'article le dit sans inventer de numéro de pourvoi ;
 *  - l'outil instruit, il ne conclut pas seul : aucun « avis » rendu par
 *    l'outil, aucune promesse de fiabilité, aucune mention d'hébergement ;
 *  - les dates de conformité sont celles des textes européens ; l'état de la
 *    transposition française se vérifie le jour de la publication (consigne
 *    dans `source`, jamais affirmé dans le texte).
 */

import type { Sujet } from './sujets';

const SINISTRE = 'Sinistre et garantie';
const CONFORMITE = 'Conformité datée';
const IA = 'IA et droit';
const INDICATEUR = 'part des requêtes de la grappe en top 10, et citations par les IA (relevé manuel)';

export const ARTICLES_MAGISTRIA: Sujet[] = [
  // ── Sinistre et garantie ────────────────────────────────────────────────
  {
    ref: 'm-art-sin-1',
    grappe: SINISTRE,
    requete: 'refus de garantie assureur charge de la preuve',
    titre: "Refus de garantie : ce que l'assureur doit prouver",
    pilier: 'sinistre-decortique',
    persona: 'gestionnaire-sinistres',
    accroche:
      "L'assuré doit prouver que le sinistre entre dans l'objet de la garantie. L'assureur qui refuse en invoquant une exclusion, une déchéance ou une faute intentionnelle doit prouver que les conditions de ce refus sont réunies.",
    corps: [
      "C'est l'application de l'article 1353 du code civil : celui qui réclame l'exécution d'une obligation doit la prouver, et celui qui se prétend libéré doit justifier le fait qui l'a libéré. Un refus de garantie est une prétention à être libéré.",
      "Les deux charges se croisent dans le même dossier. Le gestionnaire reçoit une déclaration, un rapport d'expertise et des conditions générales, et doit déterminer qui doit établir quoi avant de rédiger un refus. Une erreur sur ce point fragilise le refus dès la première réclamation.",
      "Pour une exclusion contractuelle, l'assureur doit établir que les faits entrent dans les termes de la clause, et que la clause elle-même est valable : formelle et limitée au sens de l'article L. 113-1 du code des assurances, en caractères très apparents selon l'article L. 112-4. Une exclusion valable mais dont les conditions de fait ne sont pas démontrées ne fonde pas un refus.",
      "Pour une déchéance pour déclaration tardive, l'article L. 113-2 du code des assurances ajoute une exigence : l'assureur doit établir que le retard lui a causé un préjudice, et la déchéance ne peut être opposée en cas de cas fortuit ou de force majeure. Pour la faute intentionnelle ou dolosive de l'article L. 113-1, alinéa 2, c'est encore à l'assureur d'en rapporter la preuve.",
      "La difficulté pratique tient à la qualification de la clause. Une clause rédigée comme une condition de la garantie fait peser la preuve sur l'assuré ; la même idée rédigée comme une exclusion la fait peser sur l'assureur. Avant tout refus, il faut donc qualifier la clause invoquée — c'est souvent sur ce point que le litige se joue.",
    ],
    questions: [
      "Que doit prouver l'assureur pour une exclusion ?",
      'Et pour une déchéance ou une faute intentionnelle ?',
      'Condition de garantie ou exclusion : pourquoi la qualification décide-t-elle ?',
    ],
    aRetenir: [
      "L'assuré prouve que le sinistre entre dans la garantie ; l'assureur prouve les conditions de son refus (article 1353 du code civil).",
      'Exclusion : clause valable (L. 113-1, L. 112-4) et faits démontrés.',
      'Déchéance pour retard : préjudice de l’assureur à établir (L. 113-2).',
    ],
    preuve: 'le code des assurances et le code civil, articles cités',
    enseignement: "Un refus de garantie est une prétention à être libéré, et se prouve comme telle.",
    appel: "Dans vos refus, la charge de la preuve est-elle identifiée avant la rédaction ?",
    indicateur: INDICATEUR,
    source:
      'Article 1353 du code civil ; articles L. 112-4, L. 113-1 (al. 1 et 2) et L. 113-2 du code des assurances. Aucune décision citée : la distinction condition de garantie / exclusion est présentée comme un enjeu de qualification, sans référence d’arrêt.',
  },
  {
    ref: 'm-art-sin-2',
    grappe: SINISTRE,
    requete: 'clause exclusion formelle et limitée L113-1',
    titre: "Clause d'exclusion formelle et limitée : ce que dit l'article L. 113-1",
    pilier: 'sinistre-decortique',
    persona: 'gestionnaire-sinistres',
    accroche:
      "L'article L. 113-1 du code des assurances met à la charge de l'assureur les pertes et dommages causés par des cas fortuits ou par la faute de l'assuré, « sauf exclusion formelle et limitée contenue dans la police ». Une exclusion qui n'est pas à la fois formelle et limitée ne peut pas fonder un refus.",
    corps: [
      "« Formelle » signifie que l'assuré peut savoir, à la seule lecture, ce qui est exclu. « Limitée » signifie que l'exclusion ne vide pas la garantie de sa substance. Les deux conditions sont cumulatives.",
      "De nombreuses polices excluent des situations décrites par un standard — « défaut d'entretien », « négligence », « mesures de sécurité insuffisantes » — sans dire ce que ce standard recouvre. Le gestionnaire qui applique la clause doit alors la compléter lui-même, et c'est précisément ce que le texte interdit.",
      "Une clause est formelle quand ses termes se suffisent : elle désigne un fait, une circonstance ou un objet précis, sans renvoyer à une appréciation. Une clause qu'il faut interpréter pour l'appliquer ne permet pas à l'assuré de savoir ce qui est exclu. En cas de doute, l'article 1190 du code civil commande d'interpréter le contrat d'adhésion contre celui qui l'a proposé — ici, l'assureur.",
      "Une clause est limitée quand elle laisse subsister un champ de garantie réel. Une exclusion si large qu'elle couvre la plupart des sinistres possibles du risque assuré prive le contrat de son objet : elle ne répond plus à la condition du texte, même si elle est rédigée avec précision.",
      "S'y ajoute une exigence de forme : selon l'article L. 112-4, les clauses édictant des exclusions ne sont valables que si elles sont mentionnées en caractères très apparents. Une exclusion formelle et limitée mais noyée dans le corps du texte reste exposée.",
    ],
    questions: [
      'Quand une clause est-elle « formelle » ?',
      'Quand une clause est-elle « limitée » ?',
      'Quelle forme la clause doit-elle prendre dans la police ?',
    ],
    aRetenir: [
      'Formelle : se comprend à la seule lecture. Limitée : laisse subsister la garantie.',
      'Les deux conditions sont cumulatives (article L. 113-1 du code des assurances).',
      'Caractères très apparents exigés (article L. 112-4).',
    ],
    preuve: 'le code des assurances et le code civil, articles cités',
    enseignement: "Une exclusion imprécise n'est pas une exclusion opposable.",
    appel: "Vos clauses d'exclusion définissent-elles ce qu'elles excluent, ou renvoient-elles à un standard ?",
    indicateur: INDICATEUR,
    source:
      'Article L. 113-1 du code des assurances (citation de l’alinéa 1) ; article L. 112-4 (caractères très apparents) ; article 1190 du code civil (interprétation du contrat d’adhésion). Reprend le sujet m-ac-2 en version longue.',
  },
  {
    ref: 'm-art-sin-3',
    grappe: SINISTRE,
    requete: 'délai déclaration sinistre point de départ',
    titre: 'Délai de déclaration de sinistre : à partir de quand il court',
    pilier: 'sinistre-decortique',
    persona: 'gestionnaire-sinistres',
    accroche:
      "Le délai de déclaration court à partir du moment où l'assuré a eu connaissance du sinistre, et non de sa survenance. L'article L. 113-2, 4°, du code des assurances l'impose : l'avis est donné dès la connaissance, au plus tard dans le délai fixé par le contrat.",
    corps: [
      "Ce délai contractuel ne peut pas être inférieur à cinq jours ouvrés, ramené à deux jours ouvrés en cas de vol. Les parties peuvent le prolonger d'un commun accord, pas le réduire en dessous de ces minimums.",
      "Le point est aigu pour les sinistres découverts tard : une intrusion informatique, une infiltration lente, une fraude interne. Entre la survenance et la découverte, il peut s'écouler des semaines. Retenir la mauvaise date transforme une déclaration régulière en déclaration tardive.",
      "La date à documenter est celle de la connaissance par l'assuré. Elle se prouve par une pièce : l'alerte du prestataire, le premier courriel interne qui signale l'anomalie, le rapport qui constate l'incident. La date de survenance, souvent reconstituée après coup par l'expert, ne fait pas courir le délai.",
      "Le minimum légal protège l'assuré : une clause qui fixerait trois jours ouvrés, hors cas de vol, serait contraire au texte. Le gestionnaire doit donc lire le délai du contrat, vérifier qu'il respecte le minimum, et le compter en jours ouvrés à partir de la connaissance.",
      "Même hors délai, la sanction n'est pas automatique. La déchéance doit être prévue par une clause, figurer en caractères très apparents (article L. 112-4), et l'assureur doit établir que le retard lui a causé un préjudice (article L. 113-2). Elle ne peut jamais être opposée si le retard résulte d'un cas fortuit ou de force majeure.",
    ],
    questions: [
      'Quelle date faut-il retenir, et comment la prouver ?',
      'Le contrat peut-il fixer un délai plus court ?',
      'Que se passe-t-il si la déclaration est tardive ?',
    ],
    aRetenir: [
      'Le délai court de la connaissance du sinistre, pas de sa survenance.',
      'Minimum légal : cinq jours ouvrés, deux en cas de vol (article L. 113-2, 4°).',
      'La déchéance pour retard suppose clause apparente et préjudice prouvé.',
    ],
    preuve: 'le code des assurances, articles cités, et la méthode de chronologie',
    enseignement: "La date qui compte est celle de la connaissance, et elle doit être prouvée par une pièce.",
    appel: "Vos chronologies de sinistre citent-elles la pièce en regard de chaque date ?",
    indicateur: INDICATEUR,
    source:
      'Article L. 113-2 (4° et dernier alinéa) et article L. 112-4 du code des assurances. Les régimes particuliers (catastrophes naturelles, assurances de personnes) ne sont pas traités. Reprend le sujet m-ac-3 en version longue.',
  },
  {
    ref: 'm-art-sin-4',
    grappe: SINISTRE,
    requete: 'lire rapport expertise cyber assurance',
    titre: "Rapport d'expertise cyber : les trois phrases qui décident",
    pilier: 'sinistre-decortique',
    persona: 'gestionnaire-sinistres',
    accroche:
      "Dans un rapport d'expertise cyber, trois phrases décident de la garantie : celle qui date la compromission et sa découverte, celle qui qualifie le vecteur d'entrée, et celle qui dit si des sauvegardes existaient et avaient été testées.",
    corps: [
      "La première commande le délai de déclaration et le rattachement à la période de garantie, la deuxième l'application éventuelle d'une exclusion, la troisième l'étendue du préjudice indemnisable. Le reste du rapport documente ces trois points.",
      "Un rapport cyber est écrit par des techniciens pour décrire une attaque, pas pour trancher une garantie. Il fait souvent quarante pages de journaux, d'indicateurs et de chronologie technique. Le gestionnaire doit y retrouver ce qui a une portée juridique, sans être lui-même expert en sécurité.",
      "La date de découverte fait courir le délai de déclaration, qui court à compter de la connaissance du sinistre (article L. 113-2, 4°, du code des assurances). La date de compromission initiale, elle, peut décider du rattachement du sinistre à la période de garantie, selon le déclencheur prévu au contrat — l'article L. 124-5 l'encadre pour les garanties de responsabilité. Un rapport qui confond les deux dates oblige à le relire.",
      "Le vecteur d'entrée — hameçonnage, mot de passe compromis, faille non corrigée — est l'endroit où se joue l'exclusion. Encore faut-il que la clause invoquée soit formelle et limitée (article L. 113-1) et que le rapport établisse le lien entre le manquement allégué et le sinistre, au lieu de le laisser implicite.",
      "Les sauvegardes déterminent l'ampleur du dommage : une restauration rapide limite la perte d'exploitation, leur absence l'aggrave. Un dernier point se vérifie à part : si une rançon est en cause, l'article L. 12-10-1 du code des assurances subordonne l'indemnisation au dépôt d'une plainte au plus tard soixante-douze heures après la connaissance de l'attaque.",
    ],
    questions: [
      'Pourquoi la date de découverte et la date de compromission comptent-elles toutes les deux ?',
      "Pourquoi le vecteur d'entrée décide-t-il de l'exclusion ?",
      'Que changent les sauvegardes, et quelle autre pièce vérifier ?',
    ],
    aRetenir: [
      'Trois phrases : dates (compromission et découverte), vecteur d’entrée, sauvegardes.',
      'La découverte fait courir le délai de déclaration (article L. 113-2, 4°).',
      'Rançon : plainte sous 72 heures exigée pour l’indemnisation (article L. 12-10-1).',
    ],
    preuve: 'le code des assurances, et la structure réelle d\'un rapport',
    enseignement: "Dans un rapport technique, cherchez les phrases qui déplacent une date, une exclusion ou un montant.",
    appel: "Laquelle de ces trois phrases manque le plus souvent dans les rapports que vous recevez ?",
    indicateur: INDICATEUR,
    source:
      'Articles L. 113-1, L. 113-2 (4°), L. 124-5 et L. 12-10-1 du code des assurances (ce dernier issu de la loi n° 2023-22 du 24 janvier 2023, dite LOPMI). Reprend le sujet m-sd-1 en version longue.',
  },
  {
    ref: 'm-art-sin-5',
    grappe: SINISTRE,
    requete: 'déchéance garantie déclaration tardive conditions',
    titre: 'Déchéance pour déclaration tardive : les conditions',
    pilier: 'sinistre-decortique',
    persona: 'gestionnaire-sinistres',
    accroche:
      "La déchéance pour déclaration tardive suppose quatre conditions : une clause du contrat qui la prévoit, rédigée en caractères très apparents, un retard réel au regard du délai contractuel, et un préjudice causé à l'assureur par ce retard, que l'assureur doit prouver.",
    corps: [
      "Elle ne peut en outre jamais être opposée lorsque le retard est dû à un cas fortuit ou à un cas de force majeure. Ces règles viennent des articles L. 113-2 et L. 112-4 du code des assurances.",
      "La déchéance est souvent opposée comme une conséquence automatique du dépassement d'un délai. Elle ne l'est pas. Un refus fondé sur la seule tardiveté, sans clause apparente ni préjudice établi, expose l'assureur à devoir la garantie, et parfois davantage.",
      "La clause doit exister et être visible. Sans stipulation expresse, aucune déchéance n'est possible ; avec une stipulation en petits caractères, l'article L. 112-4 la prive de validité. La vérification se fait sur la police applicable au jour du sinistre, conditions générales et particulières ensemble.",
      "Le retard s'apprécie à partir de la connaissance du sinistre par l'assuré, et non de sa survenance (article L. 113-2, 4°). Le délai contractuel ne peut être inférieur à cinq jours ouvrés, ou deux en cas de vol. Un délai plus court stipulé au contrat ne peut pas servir de base à la déchéance.",
      "Le préjudice est la condition la plus souvent négligée. L'assureur doit démontrer que le retard lui a nui concrètement : preuves disparues, aggravation du dommage qu'une déclaration rapide aurait évitée, impossibilité d'exercer un recours. Un retard sans conséquence sur l'instruction ne suffit pas.",
    ],
    questions: [
      'Quelle clause faut-il pour opposer une déchéance ?',
      "Comment s'apprécie le retard ?",
      "Quel préjudice l'assureur doit-il démontrer ?",
    ],
    aRetenir: [
      'Clause expresse, en caractères très apparents (articles L. 113-2 et L. 112-4).',
      'Retard compté depuis la connaissance du sinistre, délai minimum légal respecté.',
      'Préjudice de l’assureur prouvé ; jamais en cas de force majeure.',
    ],
    preuve: 'le code des assurances, articles cités',
    enseignement: "Une déchéance se prouve en quatre temps ; l'oubli d'un seul suffit à la faire tomber.",
    appel: "Vos refus pour déclaration tardive établissent-ils le préjudice subi ?",
    indicateur: INDICATEUR,
    source: 'Article L. 113-2 (4° et dernier alinéa) et article L. 112-4 du code des assurances.',
  },
  {
    ref: 'm-art-sin-6',
    grappe: SINISTRE,
    requete: 'rédiger courrier refus garantie assurance',
    titre: 'Courrier de refus de garantie : les quatre vérifications',
    pilier: 'sinistre-decortique',
    persona: 'gestionnaire-sinistres',
    accroche:
      "Avant d'envoyer un refus de garantie, quatre vérifications : la clause est-elle formelle et limitée, a-t-elle été portée à la connaissance de l'assuré, le lien entre le fait invoqué et le sinistre est-il prouvé, et la date retenue est-elle la bonne ?",
    corps: [
      "Chacune correspond à un texte précis du code des assurances ou du code civil. Un refus qui échoue sur l'une d'elles coûte plus cher qu'une indemnisation : il coûte l'indemnisation, augmentée des intérêts et des frais de procédure.",
      "Le courrier de refus est souvent rédigé à partir d'un modèle, en citant la clause et en concluant. Il est pourtant la première pièce que lira l'avocat de l'assuré, et la plus facile à attaquer s'il repose sur une clause fragile ou une date approximative.",
      "Première vérification : la clause est formelle et limitée (article L. 113-1) et figure en caractères très apparents (article L. 112-4). Le courrier la cite dans ses termes, sans la résumer ni la reformuler.",
      "Deuxième vérification : la clause est opposable à l'assuré. L'article 1119 du code civil ne donne effet aux conditions générales que si elles ont été portées à la connaissance de l'autre partie et acceptées par elle. En pratique, il faut pouvoir produire des conditions particulières signées qui y renvoient.",
      "Troisième vérification : le lien entre le fait invoqué et le sinistre est établi par une pièce, et pas seulement supposé. Quatrième : la date retenue est celle de la connaissance du sinistre (article L. 113-2, 4°), prouvée par une pièce. Enfin, le courrier gagne à rappeler la prescription biennale de l'article L. 114-1, que la police doit elle-même mentionner selon l'article R. 112-1.",
    ],
    questions: [
      'La clause invoquée est-elle valable ?',
      "La clause est-elle opposable à l'assuré ?",
      'Le lien de causalité et la date sont-ils prouvés ?',
    ],
    aRetenir: [
      'Clause formelle, limitée et apparente (L. 113-1, L. 112-4), citée dans ses termes.',
      'Conditions générales connues et acceptées (article 1119 du code civil).',
      'Causalité et date de connaissance prouvées par pièce ; prescription biennale rappelée (L. 114-1).',
    ],
    preuve: 'le code des assurances et le code civil, articles cités',
    enseignement: "Un refus de garantie se prépare comme une conclusion, pas comme un courrier type.",
    appel: "Votre procédure de refus comporte-t-elle ces quatre vérifications ?",
    indicateur: INDICATEUR,
    source:
      'Articles L. 112-4, L. 113-1, L. 113-2 (4°), L. 114-1 et R. 112-1 du code des assurances ; article 1119 du code civil. Reprend le sujet m-sd-2 en version longue ; la mention des conditions particulières y est rattachée à l’article 1119.',
  },

  // ── Conformité datée ────────────────────────────────────────────────────
  {
    ref: 'm-art-conf-1',
    grappe: CONFORMITE,
    requete: 'NIS 2 entités concernées échéances',
    titre: 'NIS 2 : qui est concerné et à quelles dates',
    pilier: 'conformite-datee',
    persona: 'juriste-entreprise',
    accroche:
      "La directive NIS 2 (directive (UE) 2022/2555 du 14 décembre 2022) vise les entreprises moyennes et grandes de dix-huit secteurs, classées entités essentielles ou importantes. Les États devaient la transposer au plus tard le 17 octobre 2024, pour une application à partir du 18 octobre 2024.",
    corps: [
      "Elle remplace la directive NIS de 2016 et élargit fortement le champ : on passe de quelques centaines d'opérateurs désignés à des milliers d'entités, en France comme ailleurs. Une entreprise qui n'était pas concernée par NIS peut l'être par NIS 2.",
      "La directive ne désigne pas les entités une à une : elle fixe des critères, que chaque entreprise doit appliquer à elle-même. Beaucoup découvrent tard qu'elles entrent dans le champ, souvent par la demande d'un client ou d'un assureur.",
      "Deux critères se combinent. Le secteur : les annexes I (secteurs hautement critiques, comme l'énergie, les transports, la banque, la santé, l'eau, les infrastructures numériques ou l'administration publique) et II (autres secteurs critiques, comme les services postaux, la gestion des déchets, la chimie, l'alimentaire, l'industrie manufacturière ou les fournisseurs numériques). Et la taille : en principe, les entreprises d'au moins cinquante salariés ou de plus de dix millions d'euros de chiffre d'affaires et de bilan. Certaines entités sont visées quelle que soit leur taille.",
      "Le classement en entité essentielle ou importante change le régime de contrôle et le plafond des sanctions. L'article 34 prévoit des amendes d'au moins 10 millions d'euros ou 2 % du chiffre d'affaires annuel mondial pour les entités essentielles, et d'au moins 7 millions d'euros ou 1,4 % pour les entités importantes. L'article 20 fait en outre porter la responsabilité des mesures sur les organes de direction.",
      "En France, l'autorité nationale est l'ANSSI, et les modalités — liste des secteurs détaillée, procédures d'enregistrement, délais d'entrée en conformité — relèvent de la loi de transposition et de ses textes d'application. Les dates européennes ci-dessus sont certaines ; les échéances nationales se vérifient dans le texte en vigueur le jour de la lecture.",
    ],
    questions: [
      'Comment savoir si votre entreprise est concernée ?',
      'Entité essentielle ou importante : quelle différence ?',
      'Quelles dates retenir en France ?',
    ],
    aRetenir: [
      'Directive (UE) 2022/2555 du 14 décembre 2022 : transposition au 17 octobre 2024, application au 18 octobre 2024.',
      'Champ : secteurs des annexes I et II, entreprises moyennes et grandes en principe.',
      'Sanctions d’au moins 10 M€ ou 2 % (essentielles), 7 M€ ou 1,4 % (importantes) — article 34.',
    ],
    preuve: 'les textes et leurs dates',
    enseignement: "NIS 2 ne désigne pas les entreprises concernées : chacune doit se désigner elle-même.",
    appel: "Votre entreprise a-t-elle vérifié son classement au regard des annexes I et II ?",
    indicateur: INDICATEUR,
    source:
      'Directive (UE) 2022/2555 du 14 décembre 2022 : articles 2, 3, 20, 34 et 41, annexes I et II. ⚠ Avant publication : vérifier l’état de la transposition française (loi et décrets) et, le cas échéant, ajouter ses dates dans le dernier paragraphe — ne pas les écrire de mémoire.',
  },
  {
    ref: 'm-art-conf-2',
    grappe: CONFORMITE,
    requete: 'NIS2 notification incident délai clause contrat',
    titre: "Notification d'incident NIS 2 : le délai et la clause à prévoir",
    pilier: 'conformite-datee',
    persona: 'juriste-entreprise',
    accroche:
      "NIS 2 impose, pour tout incident important, une alerte précoce dans les 24 heures suivant sa connaissance, une notification dans les 72 heures, et un rapport final dans le mois (article 23 de la directive (UE) 2022/2555). Pour tenir ces délais, les contrats avec les prestataires doivent prévoir leur propre délai de notification.",
    corps: [
      "Sans clause, l'information remonte trop tard : l'entité est tenue par le délai, mais l'incident se produit souvent chez un prestataire qui n'a aucune obligation contractuelle de la prévenir vite.",
      "La plupart des contrats d'infogérance, d'hébergement ou de logiciel ont été signés avant NIS 2. Ils prévoient au mieux une information « dans les meilleurs délais », une formule qui ne permet pas de respecter vingt-quatre heures. L'article 21 de la directive range d'ailleurs la sécurité de la chaîne d'approvisionnement parmi les mesures obligatoires.",
      "L'incident important est celui qui a causé ou peut causer une perturbation opérationnelle grave ou une perte financière, ou qui a affecté ou peut affecter d'autres personnes en causant des dommages considérables. L'alerte précoce intervient sans retard injustifié et au plus tard 24 heures après sa connaissance ; la notification, au plus tard 72 heures après ; le rapport final, au plus tard un mois après la notification.",
      "La clause à ajouter tient en quelques lignes : notification de tout incident de sécurité affectant le service, dans un délai compatible avec l'alerte précoce — quelques heures, pas « les meilleurs délais » ; un point de contact désigné de chaque côté ; le contenu minimal de l'information ; l'obligation de coopérer à l'analyse ; la répercussion de ces obligations aux sous-traitants du prestataire ; un droit d'audit.",
      "La même clause peut servir le RGPD : en cas de violation de données personnelles, le sous-traitant doit prévenir le responsable du traitement dans les meilleurs délais, et celui-ci doit notifier l'autorité de contrôle dans les 72 heures (article 33 du règlement (UE) 2016/679). Pour les entités financières, le règlement DORA (règlement (UE) 2022/2554, applicable depuis le 17 janvier 2025) fixe son propre régime de notification.",
    ],
    questions: [
      "Qu'est-ce qu'un incident important, et quels sont les délais ?",
      'Que doit contenir la clause prestataire ?',
      'Comment articuler NIS 2, RGPD et DORA ?',
    ],
    aRetenir: [
      'Alerte précoce sous 24 h, notification sous 72 h, rapport final sous un mois (article 23).',
      'Une clause prestataire en « meilleurs délais » ne permet pas de tenir 24 h.',
      'Le moment pour poser la clause est le renouvellement du contrat.',
    ],
    preuve: 'les textes et leurs dates',
    enseignement: "Une obligation de notification sans clause en amont est une obligation qu'on ne peut pas tenir.",
    appel: "Vos contrats prestataires fixent-ils un délai de notification d'incident en heures ?",
    indicateur: INDICATEUR,
    source:
      'Directive (UE) 2022/2555, articles 21 et 23 ; règlement (UE) 2016/679 (RGPD), article 33 ; règlement (UE) 2022/2554 (DORA), applicable au 17 janvier 2025. Reprend le sujet m-cd-1 en version longue (délai prestataire laissé à la négociation, sans chiffre imposé).',
  },
  {
    ref: 'm-art-conf-3',
    grappe: CONFORMITE,
    requete: 'clause limitation responsabilité faute lourde inopposable',
    titre: 'Clause de limitation de responsabilité et faute lourde',
    pilier: 'conformite-datee',
    persona: 'avocat-independant',
    accroche:
      "Une clause de limitation de responsabilité est en principe valable entre professionnels, mais elle est écartée en cas de faute lourde ou dolosive (article 1231-3 du code civil), et réputée non écrite si elle prive de sa substance l'obligation essentielle du débiteur (article 1170).",
    corps: [
      "Le plafond courant — par exemple douze mois de redevance — protège donc le cas ordinaire, mais pas le cas grave, qui est précisément celui pour lequel on croit être couvert.",
      "Le sujet revient dans tous les contrats de services numériques, où le plafond de responsabilité est souvent la clause la plus négociée et la moins relue. Le client pense que le plafond est bas et l'accepte ; le prestataire pense qu'il le protège en toute hypothèse. Les deux ont tort sur une partie des cas.",
      "La faute lourde fait tomber la limitation : l'article 1231-3 ne limite les dommages et intérêts à ce qui était prévisible lors de la conclusion du contrat que hors faute lourde ou dolosive. La Cour de cassation définit la faute lourde comme un comportement d'une extrême gravité, confinant au dol et dénotant l'inaptitude du débiteur à accomplir sa mission (chambre mixte, 22 avril 2005).",
      "L'obligation essentielle est l'autre limite. Depuis l'arrêt Chronopost (chambre commerciale, 22 octobre 1996), une clause qui contredit la portée de l'engagement essentiel est écartée ; l'article 1170 du code civil, issu de la réforme de 2016, codifie cette solution. Un plafond dérisoire sur l'obligation qui fait l'objet même du contrat est exposé.",
      "En pratique, une clause solide sort explicitement du plafond la faute lourde et le dol, prévoit un plafond cohérent avec le risque réel, et traite à part les obligations essentielles — disponibilité, sécurité, confidentialité. C'est une lecture de contrat : l'outil peut signaler la clause et l'article qui la fragilise, le juriste décide de la négociation.",
    ],
    questions: [
      'Pourquoi la faute lourde fait-elle tomber la limitation ?',
      "Qu'est-ce que l'obligation essentielle, et pourquoi compte-t-elle ?",
      'Comment rédiger une clause qui tient ?',
    ],
    aRetenir: [
      'Limitation écartée en cas de faute lourde ou dolosive (article 1231-3 du code civil).',
      'Clause réputée non écrite si elle vide l’obligation essentielle (article 1170).',
      'Sortir du plafond le dol, la faute lourde et les obligations essentielles.',
    ],
    preuve: 'les textes, et le principe de décision humaine',
    enseignement: "Un plafond de responsabilité protège le cas ordinaire, jamais le cas grave.",
    appel: "Vos obligations essentielles sont-elles sorties du plafond ?",
    indicateur: INDICATEUR,
    source:
      'Articles 1170 et 1231-3 du code civil ; Cass. com., 22 octobre 1996 (Chronopost) ; Cass. ch. mixte, 22 avril 2005 (définition de la faute lourde). ⚠ Vérifier les références des deux arrêts sur Légifrance avant publication et, au besoin, ajouter les numéros de pourvoi. Reprend le sujet m-cd-2.',
  },
  {
    ref: 'm-art-conf-4',
    grappe: CONFORMITE,
    requete: 'contrat sous-traitance RGPD article 28 mentions',
    titre: 'RGPD et sous-traitance : les mentions obligatoires du contrat',
    pilier: 'conformite-datee',
    persona: 'juriste-entreprise',
    accroche:
      "L'article 28 du RGPD exige un contrat écrit entre le responsable du traitement et son sous-traitant. Il doit décrire le traitement — objet, durée, nature, finalité, types de données, catégories de personnes — et contenir huit engagements du sous-traitant, énumérés au paragraphe 3.",
    corps: [
      "Un contrat de prestation qui mentionne seulement « le prestataire respecte le RGPD » ne remplit pas cette exigence. Le texte est précis, et l'autorité de contrôle vérifie clause par clause.",
      "Presque tous les contrats de services informatiques impliquent un traitement de données personnelles pour le compte du client : hébergement, logiciel en ligne, support, paie, marketing. Les annexes « protection des données » sont souvent génériques, et ne décrivent pas le traitement réel.",
      "Les huit engagements du paragraphe 3 sont : traiter les données uniquement sur instruction documentée du responsable, y compris pour les transferts hors de l'Union ; garantir la confidentialité des personnes autorisées ; prendre les mesures de sécurité de l'article 32 ; respecter les conditions de recours à un autre sous-traitant ; aider le responsable à répondre aux demandes d'exercice des droits ; l'aider à respecter les obligations des articles 32 à 36 ; supprimer ou restituer les données en fin de contrat ; mettre à disposition les informations nécessaires et permettre les audits.",
      "Le sous-traitant ne peut recourir à un autre sous-traitant sans autorisation écrite, préalable, spécifique ou générale, du responsable (article 28, paragraphe 2). Il doit imposer les mêmes obligations à ce sous-traitant ultérieur, et reste pleinement responsable de son exécution (paragraphe 4).",
      "La Commission européenne a adopté des clauses contractuelles types pour cette relation (décision d'exécution (UE) 2021/915 du 4 juin 2021) : elles constituent une base sûre à compléter par la description du traitement. Le manquement aux obligations de l'article 28 relève des amendes de l'article 83, paragraphe 4 : jusqu'à 10 millions d'euros ou 2 % du chiffre d'affaires annuel mondial.",
    ],
    questions: [
      'Quels sont les huit engagements obligatoires du sous-traitant ?',
      'Que dit le texte sur la sous-traitance en cascade ?',
      'Existe-t-il un modèle de clauses reconnu ?',
    ],
    aRetenir: [
      'Contrat écrit décrivant le traitement réel (article 28, paragraphe 3).',
      'Huit engagements du sous-traitant, dont instructions documentées, sécurité, audits.',
      'Clauses types de la Commission : décision (UE) 2021/915 du 4 juin 2021.',
    ],
    preuve: 'les textes et leurs dates',
    enseignement: "Une annexe RGPD générique ne décrit aucun traitement : elle ne remplit donc pas l'article 28.",
    appel: "Vos annexes de sous-traitance décrivent-elles le traitement réel, ou seulement le RGPD ?",
    indicateur: INDICATEUR,
    source: 'Règlement (UE) 2016/679, articles 28 (paragraphes 2, 3 et 4), 32 à 36 et 83 (paragraphe 4) ; décision d’exécution (UE) 2021/915 de la Commission du 4 juin 2021.',
  },
  {
    ref: 'm-art-conf-5',
    grappe: CONFORMITE,
    requete: 'registre des traitements contenu obligatoire',
    titre: 'Registre des traitements : ce qui est réellement exigé',
    pilier: 'conformite-datee',
    persona: 'juriste-entreprise',
    accroche:
      "Le registre exigé par l'article 30 du RGPD contient, pour chaque traitement : le responsable et ses coordonnées, les finalités, les catégories de personnes et de données, les destinataires, les transferts hors de l'Union, les durées de conservation et, si possible, une description des mesures de sécurité.",
    corps: [
      "Il se tient par écrit, y compris sous forme électronique, et se présente à l'autorité de contrôle sur demande (article 30, paragraphes 3 et 4). Rien dans le texte n'impose un logiciel ou un format particulier.",
      "Le registre est souvent perçu comme un exercice documentaire lourd, ou au contraire comme réservé aux grandes entreprises. Les deux idées conduisent au même résultat : un registre absent, ou un tableau rempli une fois et jamais mis à jour.",
      "L'exemption de l'article 30, paragraphe 5, pour les entreprises de moins de 250 salariés est étroite. Elle ne joue pas si le traitement est susceptible de comporter un risque, s'il n'est pas occasionnel, ou s'il porte sur des données sensibles ou relatives aux condamnations. Une paie ou un fichier clients ne sont pas des traitements occasionnels : la plupart des entreprises doivent donc tenir un registre au moins pour ces traitements.",
      "Le sous-traitant tient aussi un registre, plus court (article 30, paragraphe 2) : ses coordonnées et celles des responsables pour lesquels il agit, les catégories de traitements effectués pour chacun, les transferts, et la description des mesures de sécurité. Un prestataire qui ne le tient pas s'expose comme son client.",
      "Un registre utile est un registre vivant : une ligne par traitement, mise à jour à chaque nouvel outil ou nouveau prestataire. Il sert de point de départ aux autres obligations — information des personnes, contrats de l'article 28, analyse d'impact — et c'est la première pièce demandée lors d'un contrôle.",
    ],
    questions: [
      "Les petites entreprises en sont-elles dispensées ?",
      'Le sous-traitant doit-il aussi tenir un registre ?',
      'Comment garder un registre à jour ?',
    ],
    aRetenir: [
      'Contenu fixé par l’article 30, paragraphe 1, du RGPD ; écrit ou électronique.',
      "L'exemption sous 250 salariés ne couvre pas les traitements non occasionnels.",
      'Le sous-traitant tient son propre registre (article 30, paragraphe 2).',
    ],
    preuve: 'les textes et leurs dates',
    enseignement: "Le registre n'est pas une formalité : c'est l'inventaire sans lequel aucune autre obligation ne se tient.",
    appel: "Votre registre a-t-il été mis à jour depuis le dernier outil adopté par vos équipes ?",
    indicateur: INDICATEUR,
    source: 'Règlement (UE) 2016/679, article 30 (paragraphes 1 à 5).',
  },

  // ── IA et droit ─────────────────────────────────────────────────────────
  {
    ref: 'm-art-ia-2',
    grappe: IA,
    requete: 'syllogisme juridique IA raisonnement',
    titre: 'Syllogisme juridique et IA : pourquoi le découpage compte',
    pilier: 'methode-nommee',
    persona: 'avocat-independant',
    accroche:
      "Un raisonnement juridique produit par une IA n'est utilisable que s'il est découpé : la règle applicable, citée ; les faits, qualifiés et rattachés aux pièces ; la conclusion, qui découle des deux. Ce découpage en syllogisme permet de contester une étape sans rejeter tout le raisonnement.",
    corps: [
      "C'est la structure même qu'on attend d'une décision motivée — l'article 455 du code de procédure civile impose qu'un jugement soit motivé — et c'est celle qu'un contradicteur attaquera, étape par étape.",
      "Les modèles de langage produisent naturellement des réponses en bloc, fluides et assurées. Une réponse en bloc ne se vérifie pas : on la croit ou on la rejette. Pour un professionnel qui engage sa responsabilité, aucune des deux options n'est acceptable.",
      "La majeure est la règle de droit : un article, une décision, avec sa référence vérifiable. Si la règle est mal identifiée, tout le reste tombe — c'est donc l'étape à afficher en premier et à vérifier d'abord. Dans MagistrIA, chaque référence porte son état : vérifiée, inconnue ou hors-corpus.",
      "La mineure est la qualification des faits : quels faits du dossier entrent dans les conditions de la règle, et quelle pièce les établit. C'est l'étape la plus discutable, et souvent celle où le professionnel a le plus à apporter. La conclusion, enfin, ne doit rien ajouter : si elle affirme davantage que ce que permettent la règle et les faits, le raisonnement est défaillant.",
      "Le découpage a une conséquence moins visible : il permet de dire « les pièces ne permettent pas de conclure ». Quand une condition de la règle n'est établie par aucune pièce, l'outil doit s'arrêter à la mineure. Un outil incapable de s'arrêter produit une conclusion dans tous les cas, y compris quand il n'y en a pas.",
    ],
    questions: [
      'Pourquoi afficher la règle en premier ?',
      'Qu’apporte la séparation entre les faits et la conclusion ?',
      'Que permet le découpage quand le dossier est incomplet ?',
    ],
    aRetenir: [
      'Majeure citée, mineure rattachée aux pièces, conclusion qui n’ajoute rien.',
      'Un raisonnement découpé se conteste étape par étape.',
      'Le découpage permet de répondre « les pièces ne permettent pas de conclure ».',
    ],
    preuve: 'la méthode publiée, et notre propre architecture',
    enseignement: "Un raisonnement qu'on ne peut pas découper ne peut pas être contesté — donc pas utilisé.",
    appel: "Sur quelle étape voudriez-vous reprendre la main : la règle, la qualification ou la conclusion ?",
    indicateur: INDICATEUR,
    source: 'Article 455 du code de procédure civile (motivation) ; architecture du produit (syllogisme en trois étapes affichées, états de citation). Reprend le sujet m-mn-1 en version longue.',
  },
  {
    ref: 'm-art-ia-3',
    grappe: IA,
    requete: 'méthode FAIR quantification risque cyber',
    titre: 'Méthode FAIR : quantifier un risque cyber en euros',
    pilier: 'methode-nommee',
    persona: 'juriste-entreprise',
    accroche:
      "La méthode FAIR (Factor Analysis of Information Risk), normalisée par The Open Group sous le nom Open FAIR, exprime un risque cyber en euros : elle combine la fréquence probable d'un événement de perte et l'ampleur de cette perte, et produit une fourchette plutôt qu'une couleur.",
    corps: [
      "Pour une direction juridique, c'est la forme qui se confronte à un plafond de garantie, à une franchise ou à une clause de responsabilité. Une matrice rouge-orange-vert ne se négocie pas avec un assureur ; une perte annuelle estimée entre deux bornes, si. Et l'analyse des risques n'est plus facultative pour les entités visées par NIS 2 : l'article 21 de la directive (UE) 2022/2555 en fait la première des mesures de gestion des risques imposées.",
      "Les analyses de risque cyber sont souvent produites par les équipes techniques sous forme de cartographies qualitatives. Elles servent à prioriser, mais elles ne disent pas combien un risque coûterait, ni si la couverture souscrite est à la bonne hauteur.",
      "FAIR décompose le risque en deux branches. La fréquence des événements de perte dépend de la fréquence des menaces et de la vulnérabilité, c'est-à-dire de la probabilité qu'une menace aboutisse. L'ampleur de la perte additionne les pertes primaires — interruption, réponse à l'incident, remplacement — et les pertes secondaires, comme les sanctions, les indemnisations ou l'atteinte à la réputation.",
      "Chaque facteur est estimé en fourchette — un minimum, une valeur la plus probable, un maximum — à partir des données disponibles et du jugement d'experts. Une simulation combine ensuite ces fourchettes et donne une distribution des pertes annuelles possibles. Le résultat est discutable, au bon sens du terme : chaque hypothèse est écrite et peut être contestée.",
      "C'est le prix de la méthode : elle oblige à nommer ses hypothèses. Dans MagistrIA, les hypothèses sont affichées séparément du résultat, pour qu'on puisse en changer une sans refaire l'analyse, et pour que le juriste sache exactement sur quoi repose le montant qu'il présente.",
    ],
    questions: [
      'Comment FAIR décompose-t-elle un risque ?',
      'Comment passe-t-on d’estimations à un montant ?',
      'Quelle est la limite de la méthode ?',
    ],
    aRetenir: [
      'Risque = fréquence des événements de perte × ampleur des pertes.',
      'Estimations en fourchettes, résultat en distribution de pertes annuelles.',
      'Les hypothèses sont écrites, donc contestables : c’est ce qui rend le montant défendable.',
    ],
    preuve: 'la méthode publiée',
    enseignement: "Un risque exprimé en couleur ne se négocie pas. Un risque exprimé en euros se négocie.",
    appel: "Vos analyses de risque sortent-elles un montant, ou une couleur ?",
    indicateur: INDICATEUR,
    source: 'Norme Open FAIR de The Open Group (taxonomie et méthode d’analyse du risque) ; directive (UE) 2022/2555, article 21, paragraphe 2, point a) ; architecture du produit (hypothèses affichées à part du résultat). Reprend le sujet m-mn-2 en version longue.',
  },
  {
    ref: 'm-art-ia-4',
    grappe: IA,
    requete: 'EBIOS Risk Manager ateliers juridique',
    titre: 'EBIOS Risk Manager pour un juriste : les cinq ateliers',
    pilier: 'methode-nommee',
    persona: 'juriste-entreprise',
    accroche:
      "EBIOS Risk Manager, méthode d'analyse de risque publiée par l'ANSSI en 2018, se déroule en cinq ateliers : cadrage et socle de sécurité, sources de risque, scénarios stratégiques, scénarios opérationnels, traitement du risque. Le premier, le troisième et le cinquième concernent directement le juriste.",
    corps: [
      "La méthode est publique et gratuite, et les équipes de sécurité la connaissent souvent déjà. Y faire entrer le juridique ne demande pas d'apprendre une méthode nouvelle, mais d'être convié aux bons ateliers.",
      "L'analyse de risque cyber est fréquemment conduite sans la direction juridique, alors qu'elle produit des décisions juridiques : quelles obligations s'appliquent, quels prestataires sont critiques, quel risque est transféré à l'assureur ou accepté.",
      "L'atelier 1 fixe le périmètre, les valeurs métier et les événements redoutés, et établit le socle de sécurité : les référentiels applicables. C'est là qu'entrent le RGPD, NIS 2, les obligations contractuelles et sectorielles. Un événement redouté est souvent la violation d'une obligation — une fuite de données personnelles, une indisponibilité au-delà d'un engagement de service.",
      "L'atelier 3 décrit l'écosystème : les parties prenantes par lesquelles une attaque peut passer, notamment les prestataires. Chaque partie prenante critique renvoie à un contrat, et chaque contrat à des clauses — notification d'incident, audit, sécurité, responsabilité. Les ateliers 2 et 4, plus techniques, décrivent les attaquants et les modes opératoires.",
      "L'atelier 5 décide du traitement de chaque risque : le réduire par des mesures, le transférer — par l'assurance ou par le contrat —, l'accepter ou le refuser. Ces décisions ont une traduction juridique directe, et la direction juridique devrait les valider plutôt que les découvrir après coup.",
    ],
    questions: [
      "Que se décide dans l'atelier 1 ?",
      "Pourquoi l'atelier 3 parle-t-il de contrats ?",
      "Qui doit décider dans l'atelier 5 ?",
    ],
    aRetenir: [
      'Cinq ateliers ; le juriste a sa place dans les ateliers 1, 3 et 5.',
      'Atelier 1 : référentiels applicables et événements redoutés.',
      'Atelier 5 : réduire, transférer, accepter ou refuser — des décisions juridiques.',
    ],
    preuve: "la méthode publiée par l'ANSSI",
    enseignement: "Les ateliers 1 et 3 d'EBIOS sont des ateliers juridiques déguisés en ateliers techniques.",
    appel: "Votre direction juridique est-elle conviée à l'atelier 1 ?",
    indicateur: INDICATEUR,
    source: 'Guide EBIOS Risk Manager, ANSSI (2018), publié sur le site de l’ANSSI. Reprend le sujet m-mn-3 en version longue.',
  },
  {
    ref: 'm-art-ia-5',
    grappe: IA,
    requete: 'comparatif outils IA juridique France prix',
    titre: "Comparatif des outils d'IA juridique français",
    pilier: 'position-ia',
    persona: 'avocat-independant',
    accroche:
      "Pour comparer des outils d'IA juridique, cinq critères comptent plus que le prix : le corpus réellement couvert, l'affichage des sources, l'état de vérification de chaque citation, la capacité à répondre « je ne peux pas conclure », et la place laissée à la décision du professionnel.",
    corps: [
      "Le prix vient ensuite, et se compare par palier d'usage. Les prix d'entrée publics relevés le 6 octobre 2026 vont de 69 à 105 € pour Ordalie, autour de 116 € pour Lexbase, à partir de 213 € pour GenIA-L et de 250 € pour Predictice. MagistrIA propose un accès gratuit sans carte bancaire (10 crédits par mois), puis 59 € HT par mois en formule Pro et 249 € HT pour un cabinet ou une entreprise.",
      "Les outils se présentent tous comme des assistants juridiques, avec des démonstrations convaincantes. Les différences n'apparaissent qu'à l'usage, sur des questions où la réponse exacte est connue, ou sur des dossiers incomplets.",
      "Le corpus d'abord : quelles sources sont interrogées, et que se passe-t-il hors de ce périmètre ? Un outil sérieux déclare son périmètre et renvoie ce qui est dehors. MagistrIA couvre huit référentiels, et répond « hors-corpus » au-delà. Comparez ce périmètre aux matières que vous traitez réellement.",
      "Les citations ensuite : chaque référence avancée est-elle accompagnée de sa source, et l'outil dit-il si elle a été retrouvée ? Faites le test sur une question dont vous connaissez la réponse, puis sur une référence inventée : un outil fiable la signale comme introuvable au lieu de la commenter.",
      "Enfin, la conclusion : donnez à l'outil un dossier auquel il manque une pièce décisive. Un outil utilisable dit que les pièces ne permettent pas de conclure. Testez chaque outil sur vos propres dossiers pendant la période gratuite ou d'essai, avec ces trois épreuves, avant de comparer les prix.",
    ],
    questions: [
      'Quel corpus chaque outil couvre-t-il ?',
      'Comment tester la fiabilité des citations ?',
      "Que fait l'outil face à un dossier incomplet ?",
    ],
    aRetenir: [
      'Comparer corpus, sources, état des citations, capacité à ne pas conclure, décision humaine — puis le prix.',
      'Prix d’entrée publics relevés le 6 octobre 2026, à revérifier le jour de la lecture.',
      'MagistrIA : gratuit sans carte bancaire, Pro 59 € HT/mois, Cabinet 249 € HT/mois.',
    ],
    preuve: 'les prix affichés, et notre propre architecture',
    enseignement: "Un outil d'IA juridique se compare sur ses refus avant de se comparer sur ses prix.",
    appel: "Essayez MagistrIA sur un de vos dossiers, gratuitement et sans carte bancaire : quelle épreuve voulez-vous lui faire passer d'abord ?",
    indicateur: INDICATEUR,
    source:
      'Prix concurrents : relevé du 06/10/2026 consigné dans marques.ts (contraintes MagistrIA). ⚠ Le jour de la publication : revérifier chaque prix, son unité (mensuelle, HT ou TTC) et sa formule sur le site de chaque éditeur, et corriger la date du relevé. Comparaison limitée à des faits vérifiables (publicité comparative : article L. 122-1 du code de la consommation). Prix et périmètre MagistrIA : marques.ts.',
  },
  {
    ref: 'm-art-ia-6',
    grappe: IA,
    requete: 'limites IA juridique avis juridique',
    titre: "Ce qu'une IA juridique ne doit pas faire",
    pilier: 'position-ia',
    persona: 'avocat-independant',
    accroche:
      "Une IA juridique ne doit pas conclure à la place du professionnel, ne doit pas avancer une référence qu'elle n'a pas retrouvée, ne doit pas prédire l'issue d'un litige, et ne doit pas conclure quand les pièces ne le permettent pas.",
    corps: [
      "Ce ne sont pas des précautions de communication : la consultation juridique pour autrui, à titre habituel et rémunéré, est réservée aux professionnels qualifiés par la loi n° 71-1130 du 31 décembre 1971 (titre II). Un outil instruit un dossier ; la décision et la responsabilité restent au professionnel.",
      "La frontière est facile à franchir. Un modèle de langage formule une conclusion aussi aisément qu'une analyse, et l'utilisateur pressé lit la conclusion. L'outil doit donc être construit pour ne pas offrir ce raccourci, plutôt que de compter sur la prudence de chacun.",
      "Conclure à la place du professionnel, c'est présenter comme acquise une solution qui dépend d'une appréciation : la qualification d'un fait, l'opportunité d'une action, la stratégie d'un dossier. L'outil peut exposer la règle, les faits et les points fragiles ; il laisse la décision. Le règlement (UE) 2024/1689 sur l'intelligence artificielle impose d'ailleurs, depuis le 2 février 2025, aux fournisseurs comme aux utilisateurs professionnels de ces systèmes de veiller à ce que leur personnel en ait une maîtrise suffisante (article 4).",
      "Avancer une référence non retrouvée est la faute la plus coûteuse, parce qu'une citation plausible se recopie dans des conclusions. Une référence introuvable doit rester marquée introuvable. Prédire l'issue d'un litige, enfin, transforme une statistique en conseil : un taux de succès affiché sur un dossier ne dit rien de ce dossier-là.",
      "La dernière limite est la plus révélatrice : savoir dire que les pièces ne permettent pas de conclure. Dans MagistrIA, c'est une sortie prévue, au même titre qu'une conclusion. Un outil qui ne sait pas s'arrêter produira une réponse dans tous les cas, y compris quand il n'y en a pas.",
    ],
    questions: [
      'Pourquoi un outil ne doit-il pas conclure à la place du professionnel ?',
      'Pourquoi les références et les prédictions sont-elles des pièges ?',
      'Que doit faire un outil quand le dossier est incomplet ?',
    ],
    aRetenir: [
      'L’outil instruit ; la décision reste au professionnel (loi n° 71-1130 du 31 décembre 1971).',
      'Une référence introuvable reste marquée introuvable.',
      'Savoir répondre « les pièces ne permettent pas de conclure ».',
    ],
    preuve: 'notre propre architecture, et les textes cités',
    enseignement: "Dans un outil juridique, la liste de ce qu'il refuse de faire est plus informative que la liste de ses fonctions.",
    appel: "Un outil qui refuse de conclure vous paraît-il plus utile, ou plus frustrant ?",
    indicateur: INDICATEUR,
    source:
      'Loi n° 71-1130 du 31 décembre 1971, titre II (périmètre du droit et de la consultation juridique) ; règlement (UE) 2024/1689, article 4 (maîtrise de l’IA, applicable au 2 février 2025) ; architecture du produit (états de citation, sortie « ne peut pas conclure »). Reprend le sujet m-pi-2 en version longue.',
  },
];
