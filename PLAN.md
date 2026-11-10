# Plan de travail — Machine à post

> **Démarrage : lundi 16 novembre 2026.** Fin des 12 semaines : dimanche 07/02/2027.
> Mis à jour le 10/11/2026. La demande d'origine est réécrite dans `PROMPT.md`.
>
> Qui fait quoi : **[C]** Claude · **[J]** Jonathan · **[C+J]** ensemble.
> Une tâche se coche quand elle marche en production, pas seulement en local.

## Où on en est (10/11/2026)

- ✅ L'outil est en ligne : https://machine-a-post.vercel.app
- ✅ Le code source est sauvegardé sur GitHub : `JDname0/MACHINE-A-POST-`
- ✅ Déjà en place :
  - 144 posts en brouillon : 84 Veolt (7 par semaine) et 60 MagistrIA (5 par semaine) ;
  - 9 formats et 5 gabarits de visuels (PNG générés) ;
  - les garde-fous ;
  - la médiathèque (images et vidéos) ;
  - les grappes SEO et les cibles de backlinks.
- ⚠️ Le calendrier commence encore le 05/10. Le tableau de bord compte 35
  créneaux passés sans avoir été traités.
- ⚠️ Aucun réseau n'est branché : les quatre réseaux sont au barreau 1 sur 5.
- ⚠️ Blog : 0 article écrit sur 17 par entité.
- ⚠️ Vidéo : les scripts existent, aucune vidéo n'est produite.

---

## Décisions à prendre avant de coder — [J]

- [ ] **D1. Envoi automatique après validation ?** Aujourd'hui, la règle est :
  « le connecteur est un bouton qu'on presse, jamais un automate ». Tu demandes
  que les posts validés partent seuls à leur date. Je propose :
  - validation post par post, par toi ;
  - envoi automatique à l'heure prévue ;
  - possibilité d'annuler jusqu'à l'heure d'envoi.
  Si tu es d'accord, je mets à jour la règle 1 de `CLAUDE.md`.
- [ ] **D2. Semaines de Noël et du Nouvel An.** S6 (21–27/12) et S7 (28/12–03/01) :
  - garder la cadence normale ;
  - la réduire de moitié ;
  - ou faire une pause et décaler la suite de 2 semaines.
- [ ] **D3. Blog Veolt.** Sur quoi tourne `veoltproduction.fr` (hébergé chez
  o2switch) : WordPress ou un site statique ? Ça décide comment l'outil y
  publie.
- [ ] **D4. Blog MagistrIA.** Où vivent les articles ? Dans le site `magistrai`,
  ou ailleurs ? Ce dépôt ne modifie aucun autre projet. Il faut donc une API de
  publication côté site, ou un export Markdown que tu déposes toi-même.
- [ ] **D5. Statistiques automatiques ?** Aujourd'hui, tous les chiffres sont
  saisis à la main (règle de `CLAUDE.md`). Pour « analyser », on peut brancher
  la lecture des statistiques : API des réseaux et Google Search Console.
  Faut-il lever cette règle ?
- [ ] **D6. Quels outils comparer pour les sujets ?** Je propose
  `magistria-prospection`, `dcr-prospection`, les deux sites et la machine
  elle-même. On ne compare jamais Veolt avec MagistrIA.

---

## Lot 1 — Calendrier recalé au 16/11 (à faire avant lundi)

- [ ] [C] Récupérer la base de production (Blob `machine-a-post/machine.db`)
  pour travailler sur les vraies données. La copie locale vient du paquet de
  déploiement et peut être en retard.
- [x] [C] Ajouter une action « Recaler le calendrier à partir du … » (page Calendrier, testée le 10/11) :
  - elle décale les dates **sans re-semer**, pour garder tout ce qui a déjà été
    édité ;
  - elle applique la décision D2 ;
  - elle se termine par `await sauvegarder()`.
- [x] [C] Remettre à zéro le compteur « créneaux passés non traités » (il se vide de lui-même une fois les dates recalées).
- [x] [C] Vérifier en local que S1 commence le lundi 16/11 avec la phase
  « exister ». S4 se termine le 13/12 (S12 le 07/02).
- [ ] [J] Feu vert → [C] déploiement en production, puis vérification sur l'outil
  en ligne.
- [ ] [C] Ajouter un export du calendrier (`.ics` ou CSV) pour le voir dans
  ton agenda.

| Semaine | Dates | Phase |
|---|---|---|
| S1 | 16–22 nov. | exister |
| S2 | 23–29 nov. | prouver |
| S3 | 30 nov.–6 déc. | servir |
| S4 | 7–13 déc. | ouvrir |
| S5–S12 | 14 déc.–7 fév. | semaine type (voir D2 pour Noël) |

## Lot 2 — Posts prêts à valider

- [ ] [C] Relire et compléter les 12 posts de S1 (7 Veolt + 5 MagistrIA). Chaque
  post doit passer les garde-fous sans blocage.
- [ ] [J] Valider les posts de S1 avant le samedi 14/11.
- [ ] [C] Faire de même pour S2 à S4, une semaine d'avance à chaque fois.
- [x] [C] Ajouter une vue « À valider cette semaine » : une page avec, pour
  chaque post, le texte, le visuel et deux boutons, Valider ou Renvoyer
  (menu « À valider » ; le garde-fou est revérifié côté serveur).
- [x] [C] Ajouter la validation par lot avec relecture : toujours un clic par
  post, jamais un « tout valider ».
- [x] [C] Réécriture IA d'un post (Claude), sous supervision : l'IA propose,
  tu adoptes ou rejettes ; un texte adopté repasse « à relire ».
- [ ] [J] Poser `ANTHROPIC_API_KEY` sur Vercel (variable sensible) pour
  activer la réécriture IA en production.
- [ ] [C] Pré-rédiger toute une semaine avec l'IA en un clic : une
  proposition par post, toujours adoptée une par une.

## Lot 3 — Images générées

- [ ] [C] Générer et rattacher automatiquement le visuel de chaque post, au bon
  gabarit et aux bonnes dimensions.
- [ ] [C] Faire un aperçu des carrousels page par page, et l'export PDF pour
  LinkedIn.
- [ ] [C] Contrôler les chartes :
  - Veolt confirmée ;
  - MagistrIA : bordeaux `#7B2D3E` et police Spectral, pas le bleu et l'or du
    cadrage de mai.
- [ ] [J] Déposer dans la médiathèque les vraies images : rendus 3D, captures,
  photos.

## Lot 4 — Vidéo (Higgsfield, Blender, After Effects)

**En place (10/11)** :
- [x] [C] Mémoire des visuels : chaque visuel généré se range dans la
  médiathèque (bouton « Mémoriser », mémorisation de toute une semaine, et
  automatique à la validation d'un post). Pas de doublon.
- [x] [C] Studio vidéo (menu « Studio vidéo ») : plans tirés du script ou du
  texte du post, une image par plan (carte à la charte, visuel généré, ou
  image apportée avec texte incrusté), MP4 H.264 fabriqué dans le navigateur,
  rangé dans la médiathèque et rattaché au post.
- [x] [C] Échéancier : chaque vidéo doit exister 3 jours avant sa
  publication ; états prête / à monter / en retard ; compteur dans le menu.
- [x] [C] Production en lot : un clic fabrique toutes les vidéos dues dans
  les 7 jours, avec le montage par défaut.
- [x] [C] Garde-fou « Vidéo manquante » : un post vidéo sans vidéo ne peut pas
  être validé.
- [x] [C] Réglage par entité : produire les contenus le jour même, la veille,
  3 jours ou une semaine avant ; mode boutons / rappel / automatique.
  Formulaire dans le calendrier et dans le studio.
- [x] [C] Calendrier : clic sur un post → aperçu complet (texte, visuel, pages
  de carrousel, vidéo) avec Valider, Générer, Régénérer, sans quitter la page.
- [x] [C] Rappel du jour (carte flottante) : visuels et vidéos dus, génération
  en un clic ou automatique à l'ouverture (une fois par jour).
- [x] [C] Studio : storyboard image par image, réordonner / dupliquer les
  plans, durée conseillée du format, variante sombre (MagistrIA), légende à
  copier, plans proposés par l'IA, galerie des vidéos produites.
- [x] [C] Vidéo à la demande depuis n'importe quel post (réseaux autorisés par
  la marque) — c'est ce qui permet des vidéos MagistrIA.
- [x] [C] Régénérer une vidéo : remplace la précédente (studio, calendrier,
  galerie).
- [x] [C] Pages de carrousel générées et mémorisées une à une.
- [x] [C] Chartes vérifiées le 10/11 : MagistrIA = code du site (4/11),
  Veolt = veoltproduction.fr. ⚠️ La racine de veoltproduction.fr affiche la
  connexion de la « Machine à prospection », pas la vitrine — [J] à vérifier.
- [ ] [C] Plans vidéo dans le studio : accepter des clips (Higgsfield,
  Blender, After Effects) en plus des images, découpés au bon plan.
- [ ] [C] Musique et sous-titres : piste son libre de droits, optionnelle.

**Ensuite** :

- [ ] [C] Lister les créneaux vidéo des 12 semaines (Reels, vidéos LinkedIn,
  TikTok Veolt), chacun avec son script de `videos.ts`.
- [ ] [C] Écrire la fiche qualité d'une vidéo :
  - format 9:16 en 1080×1920 ;
  - sujet lisible dans les 3 premières secondes, sans son ;
  - texte incrusté partout ;
  - rythme Veolt : coupes sèches ; rythme MagistrIA : posé ;
  - durée selon `formats.ts`.
- [ ] [C] Higgsfield (déjà connecté à Claude) : générer les plans d'un premier
  script, puis comparer avec la fiche qualité.
- [ ] [C+J] Blender, pour les rendus 3D Veolt :
  - une scène type, réutilisable ;
  - un script Python `bpy` pour rendre sans ouvrir Blender ;
  - Blender tourne sur ton Mac.
- [ ] [C+J] After Effects, pour l'habillage et les textes incrustés :
  - un modèle `.aep` par marque ;
  - remplissage automatique du texte depuis le script (ExtendScript ou
    nexrender) ;
  - After Effects tourne sur ton Mac.
- [ ] [C] Chaîne complète : script → plans → montage → export MP4 →
  médiathèque → rattaché au post.
- [ ] [J] Produire le premier Reel Veolt de S1, prévu le mardi 17/11.

## Lot 5 — Connexion aux réseaux et envoi

Ordre recommandé par le cadrage : Reddit, puis Instagram, puis LinkedIn, puis
TikTok.

- [ ] [J] **Reddit** : créer l'application de type *script*. Une heure de
  travail, aucune revue.
  - [ ] [C] Brancher le connecteur et faire un premier envoi test sur un
    sous-forum de test.
- [ ] [J] **Instagram** : créer l'application Meta et vérifier que le compte est
  de type *entreprise*. Demander la revue (`instagram_content_publish`).
  - [ ] [C] Préparer le dossier de revue : cas d'usage, captures, vidéo.
- [ ] [J] **LinkedIn** : créer l'application Developers et demander *Community
  Management* (`w_organization_social`).
  - [ ] [C] Préparer le dossier de revue.
- [ ] [J] **TikTok**, pour Veolt seulement : *Content Posting API*. Tant que
  l'application n'est pas auditée, les envois arrivent en brouillon privé.
- [ ] [C] Ajouter la file d'envoi (si la décision D1 est oui) :
  - une tâche planifiée Vercel qui envoie, à l'heure, les posts
    **validés** dont le réseau est branché ;
  - un journal de chaque envoi ;
  - une nouvelle tentative en cas d'échec ;
  - une alerte si l'envoi échoue.
- [ ] [C] Garder la voie « prêt à coller » pour les réseaux non branchés : texte
  au bon format, visuel, hashtags, bouton Copier.
- [ ] [C+J] Piste à évaluer : les outils de publication sociale déjà connectés à
  Claude (vidIQ). Ils pourraient servir de relais en attendant les revues des
  réseaux.

## Lot 6 — Blog

- [ ] [C] Écrire les 3 premiers articles par entité, dans l'ordre des grappes.
  Le pilier d'abord, puis les articles satellites.
- [ ] [C] Contrôler chaque article avant publication :
  - forme 2026 (cadrage §8.3) ;
  - sources citées ;
  - aucune preuve interdite ;
  - liens internes vers la page pilier.
- [ ] [C] Connecteur blog Veolt, selon la décision D3 : API WordPress ou dépôt
  par cPanel.
- [ ] [C] Connecteur blog MagistrIA, selon la décision D4.
- [ ] [C] Après publication : vérifier l'indexation, vérifier les balises et
  noter l'URL dans l'outil.

## Lot 7 — SEO et backlinks

- [ ] [C] Relire les 3 grappes par entité et ajuster les 17 sujets d'articles
  selon les requêtes réelles.
- [ ] [C] Pour chaque article, renseigner dans l'outil : la requête cible,
  l'intention de recherche, le lien vers le pilier et les liens entrants
  prévus.
- [ ] [C+J] Backlinks : traiter les 6 cibles par entité, une par semaine. Pour
  chacune : le message, la relance et le suivi. La cible marquée « jamais » le
  reste.
- [ ] [C] Ajouter un tableau « où en est chaque grappe » : articles publiés,
  liens obtenus, positions saisies.

## Lot 8 — Analyse et indicateurs

- [ ] [C] Ajouter une fiche hebdomadaire : ce qui est parti, les chiffres
  relevés, ce qu'on garde et ce qu'on change.
- [ ] [C] Comparer les résultats par format et par réseau, avec le repère 2026
  de chaque format.
- [ ] [C] Si la décision D5 est oui : lecture automatique des statistiques,
  réseau par réseau, une fois le réseau branché, plus la Search Console.
- [ ] [J] Faire le point avec `/brief` chaque lundi.

## Lot 9 — Cohérence entre les outils

- [ ] [C] Faire l'inventaire des sujets déjà traités dans les outils choisis en
  D6, entité par entité.
- [ ] [C] Ajouter un contrôle de doublon : un sujet déjà publié ailleurs dans
  les 30 derniers jours déclenche une alerte, pas un blocage.
- [ ] [C] Vérifier que les messages ne se contredisent pas : même promesse,
  mêmes preuves autorisées que dans la prospection.

## Lot 10 — Sécurité et exploitation

- [ ] [C] Vérifier en production :
  - la protection Vercel est active ;
  - le mot de passe est posé ;
  - la route PNG et la route médias contrôlent bien la session.
- [ ] [C] Sauvegarder chaque semaine une copie de la base Blob, horodatée.
- [ ] [C] Tenir `RECAP.md` à jour à chaque changement d'état.

---

## Cette semaine (avant le lundi 16/11)

1. [J] Répondre à D1 et D2.
2. [C] Lot 1 en entier : calendrier recalé, puis déployé après ton feu vert.
3. [C] S1 prête : 12 posts relus avec leurs visuels.
4. [J] Valider S1 et créer l'application Reddit.
5. [C+J] Premier Reel Veolt, pour tester la chaîne vidéo.
