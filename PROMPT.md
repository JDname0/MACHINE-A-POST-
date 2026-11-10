# Prompt de reprise — Machine à post

> Version réécrite de la demande du 10/11/2026. Elle complète le cadrage
> (`00-CADRAGE-MACHINE-A-POST.md`) sans le remplacer. Les trois règles de
> `CLAUDE.md` restent prioritaires sur tout ce qui suit.

## Ce que Jonathan demande

Mettre la Machine à post en **exploitation réelle**, pour les deux entités
(Veolt et MagistrIA), à partir du **lundi 16 novembre 2026**.

- **Calendrier éditorial** : recaler les 12 semaines pour qu'elles commencent le
  lundi 16/11/2026 et finissent le dimanche 07/02/2027.
- **Posts** : tous les posts du calendrier sont rédigés à l'avance. Jonathan
  n'a plus qu'à les relire et à les valider.
- **Images** : chaque post a son visuel déjà généré, aux bonnes dimensions.
- **Vidéos** : les Reels, les vidéos LinkedIn et les vidéos TikTok sont
  produits à partir des scripts de `videos.ts`. On monte en qualité avec
  Higgsfield (génération), Blender (3D) et After Effects (montage, habillage).
- **Envoi** : une fois un post validé, il part sur le bon réseau à la date
  prévue, dès que le compte de ce réseau est branché. Tant qu'il ne l'est pas,
  l'outil prépare le post en mode « prêt à coller ».
- **Blog** : les articles sont rédigés, vérifiés, publiés sur le site de
  l'entité, puis suivis.
- **SEO et backlinks** : les grappes, les 17 articles par entité et les cibles
  de backlinks avancent dans le même outil.
- **Cohérence entre les outils** : vérifier quels sujets sont déjà traités
  ailleurs (prospection, sites, autres machines), pour ne pas se répéter ni se
  contredire.
- **Analyse** : relever ce qui marche et ce qui ne marche pas, par réseau et par
  format.
- **Pilotage** : tout le travail est suivi en Markdown, sous forme de listes à
  cocher (`PLAN.md`).

## Ce qui ne change pas

1. **Rien ne part sans un « oui » de Jonathan, post par post.** La validation
   humaine reste obligatoire. Seul le moment de l'envoi peut être automatisé
   (voir la décision D1 dans `PLAN.md`).
2. **Aucune preuve inventée.** Les preuves interdites de `marques.ts` bloquent
   la validation, y compris dans les vidéos et les articles.
3. **Veolt et MagistrIA restent séparés.** Aucun sujet, visuel ou article ne
   passe d'une entité à l'autre, même quand on vérifie la cohérence entre les
   outils.
4. **Toute action serveur qui écrit en base se termine par `await sauvegarder()`.**
5. **Aucun identifiant d'API dans le dépôt**, ni affiché dans l'interface.

## Ce qu'on attend de Claude à chaque séance

- Partir de `PLAN.md` : prendre la première tâche non cochée du lot en cours.
- Faire la tâche, la tester (en local sur le port 8791, puis en production si
  elle y est déployée), cocher la case, et noter en une ligne ce qui a été fait.
- Ne déployer en production (`vercel deploy --prod`) qu'après le feu vert de
  Jonathan.
- Mettre à jour `RECAP.md` dès que l'état du système change.
