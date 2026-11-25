# Studio — le système de génération et son contrôle qualité (Veolt)

Arrêté le 25/11/2026. Principe : **montrer, pas dire.** Chaque post, carrousel,
vidéo et article montre ce que son texte avance : l'objet, l'étape, le résultat,
puis la **version finale en situation réelle** (produit dans un vrai décor, site
en main). Rien d'inventé : une image ne sert jamais de preuve (règle 2).

## La chaîne

| Étape | Où | Ce qui est exigé |
|---|---|---|
| 1. Écrire la scène | `illustrations.ts` → `promptVeolt(scène)` | Un seul objet ou une seule action, concret. La charte (`CHARTE_PROMPT_VEOLT`) s'ajoute seule : fond noir, magenta `#B600A8`, violet `#7621B0`, lavande `#C79BFF`, **aucune lettre, aucun chiffre, aucun logo**. |
| 2. Générer | Higgsfield, `gpt_image_2_6`, medium, 1k | 4:5 pour une couverture, 4:3 pour une page d'étape. Une série (pipeline) part d'**une seule image de référence** (`reference`), pour que l'objet reste le même d'une étape à l'autre. 4 générations à la fois au plus. ≈ 1 crédit l'image. |
| 3. Regarder | navigateur, avant tout enregistrement | Lettres parasites, mains déformées, objet qui change d'une étape à l'autre, marque réelle visible : on regénère, on n'importe pas. |
| 4. Consigner | `IMAGES_PACK` | Nom, ce qu'elle montre, job, adresse, référence, **prompt mot pour mot**, `mention`. |
| 5. Placer | `PLACEMENTS`, `FIGURES_ARTICLES`, `illustration:` d'un plan de script | Couverture d'un sujet, page repérée par le **début de son texte**, cadrage (point d'intérêt + zoom ≤ 2,3 : au-delà l'image se dégrade), figures d'article (3 au moins). |
| 6. Importer | Visuels → « Importer les illustrations manquantes » | Copie serveur depuis une liste fermée d'hôtes (`HOTES_IMPORT`), type et signature vérifiés, 15 Mo au plus. Une nouvelle génération sous le même nom remplace l'ancienne. |
| 7. Refaire les visuels | Visuels → « Remettre les visuels au logo » | Posts à venir seulement ; un post publié garde son image. |
| 8. Fabriquer les vidéos | Aperçu du post → « Générer la vidéo » | Le **contrôle qualité du montage** s'affiche sous le bouton : lisibilité (≤ 3,2 mots/s), plan fixe trop long, vidéo sans image au milieu, illustration manquante. |
| 9. Valider | Jonathan | Rien ne part sans son « oui » (règle 1). |

## La mention dans le cadre

Chaque image porte ce qu'elle est : « Illustration IA » par défaut, « Concept
Veolt · mise en situation IA » pour une mise en situation d'un concept réel de
veolt.fr. Elle ne s'enlève pas : c'est ce qui permet de montrer sans prétendre.

## Le contenu réel de veolt.fr

- **Utilisable** : les créations et concepts Veolt du portfolio (Atelier Noir,
  Elysia, Velora, Moka, Novo, Nova, Aurélie, Orme ; Wealth et New Era en site
  animé ; Astronaute, Orbite, Astéroïde, Nageur, Dreamina en 3D). Les vignettes
  font 420 × 270 : elles servent de **référence** à une mise en situation en
  haute définition, pas d'image finale.
- **Exclu** : tout ce qui porte la marque **1337** (Tonic, Tonic Energy, Focus,
  Gélule, Film de marque, et le showreel qui les montre), et les logos des
  clients business plan. Un client ne se montre qu'avec son accord écrit.

## Rendu

- Visuels (Satori, `visuels.tsx > rendreIllustre`) : cadre de verre au-dessus du
  texte ; sa hauteur se calcule sur le texte (420 à 760 px). Couverture
  d'article : titre à gauche, image à droite.
- Vidéos (`fabrique-video.ts > dessinerIllustration`) : fond flouté calculé une
  fois par plan (en quart de taille, pour l'encodage), cadre qui entre, poussée
  lente, reflet qui traverse le verre, sons « pop » et « scintille ». Le titre
  reste au-dessus de la zone couverte par l'interface des réseaux.
- `cadrer()` (`illustrations.ts`) est le même calcul pour les deux : un cadrage
  réglé pour le carrousel vaut pour la vidéo.
