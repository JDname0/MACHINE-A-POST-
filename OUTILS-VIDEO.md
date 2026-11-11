# Outils vidéo — ce qui est en place, ce qu'on peut brancher

Relevé du 11/11/2026. Rôle de ce document : choisir où mettre l'effort (et
l'argent) pour monter la qualité des vidéos Veolt et MagistrIA, sans casser les
trois règles du dépôt — rien ne part sans le « oui » de Jonathan, aucune preuve
inventée, aucune passerelle entre les deux entités.

## 1. Ce que la machine fait déjà, gratuitement, dans le navigateur

| Brique | Fichier | Ce que ça donne |
|---|---|---|
| 3D des sites | `src/lib/scene3d.ts` | La sphère de 16 000 particules de veolt.fr (qui se métamorphose : écran, €, lecture, galaxie) et le cerveau + cadran de magistrai.fr — three.js 0.160 et halo UnrealBloom aux réglages des sites |
| Verre | `src/lib/verre.ts` | Cartes en verre dépoli (flou de l'arrière-plan, liseré spéculaire, reflet qui glisse, grain), halos et grille des sites, grain de film, vignettage |
| Son | `src/lib/son.ts` | Musique propre à chaque marque (synthétisée, libre de droits) + bruitages calés à l'image (frappe, clic, notification, coche, révélation du logo, transitions) ; piste AAC (Mac/Windows) ou Opus dans le MP4 ; voix off mixée avec la musique qui s'efface dessous |
| Animation | `src/lib/fabrique-video.ts`, `rendu-scenes.ts` | Typographie cinétique (mots qui sortent du flou / lettres qui se décodent), transitions « à travers » (zoom + flou de vitesse pour Veolt, fondu flouté pour MagistrIA), fenêtres qui flottent, pastilles de verre, bento |
| After Effects | `src/lib/export-ae.ts` | Bouton « Projet After Effects (.jsx) » : la compo recréée, un calque texte par plan aux polices de la charte, marqueurs, rendu de la machine en calque guide, bande-son |
| Blender | `outils/blender/noyau_particules.py` | Le même noyau de particules en vrai rendu 3D (profondeur de champ, halo du compositeur), séquence PNG transparente |
| Voix, clips, LLM local | `src/lib/fournisseurs-media.ts` | ElevenLabs (voix off plan par plan, bouton dans le studio), Runway (image → vidéo), Ollama (modèle ouvert local) — prêts, en attente de clés |

## 2. Recommandations, par ordre d'effet sur la qualité

### 1) La voix off — le plus grand saut
- **ElevenLabs** — *recommandé*. Déjà branché : bouton « 🎙 Voix off ElevenLabs »
  dans le studio, un MP3 par plan, musique effacée sous la voix. À poser sur
  Vercel : `ELEVENLABS_API_KEY` (+ facultatif `ELEVENLABS_VOIX_VEOLT`,
  `ELEVENLABS_VOIX_MAGISTRIA` pour choisir une voix par marque). Une voix
  clonée (celle de Jonathan) est possible — avec son accord écrit, jamais une
  voix de tiers.
- Open source, si on veut zéro abonnement : **Kokoro** (82 M, Apache 2.0, voix
  française `ff_siwis`), **Chatterbox Multilingual** (Resemble AI, MIT, 23
  langues dont le français). À héberger soi-même ou sur un Space Hugging Face.
  L'espace Chatterbox exposé à l'assistant aujourd'hui est la version
  anglaise : inutilisable pour du français.
- À éviter : **XTTS-v2** (licence non commerciale).

### 2) La musique
- **En place** : musique synthétisée par marque, libre de droits par construction.
- **ElevenLabs Music** : API, morceaux autorisés en usage commercial — même clé que la voix.
- **Suno** : très bon rendu, mais **pas d'API publique officielle**. Générer sur
  suno.com avec une offre payante (seule à donner les droits commerciaux),
  puis déposer le fichier. Higgsfield propose aussi `suno_music`, mais le
  compte est à **0 crédit** (offre gratuite) au 11/11.
- À éviter pour de la pub : **MusicGen** (poids sous licence non commerciale).

### 3) Les plans filmés / générés (b-roll)
- **Runway Gen-4** : branché côté serveur (`RUNWAY_API_KEY`), image → clip de 5 s.
- **Higgsfield** : connecté à l'assistant (Kling, Veo, Wan, Seedance…), mais
  **0 crédit** — rien ne peut être généré tant que le compte n'est pas rechargé.
- **Wan 2.2** (open source, Apache 2.0) : disponible gratuitement via un Space
  Hugging Face (image → vidéo), qualité correcte pour des plans d'ambiance.
- **À faire dans la machine** : accepter un clip vidéo comme source de plan
  (aujourd'hui : images seulement). C'est la prochaine brique utile.

### 4) Les animations « de designer »
- **After Effects → Lottie (Bodymovin)** — *recommandé pour aller plus loin*.
  Un motion designer fait l'animation dans After Effects, l'exporte en JSON
  Lottie, et la machine la joue en remplaçant les textes et couleurs de la
  marque. Bibliothèque libre (`lottie-web`, MIT). Le meilleur rapport
  qualité / automatisation.
- **GSAP** (entièrement gratuit depuis 2025, plugins compris) : courbes
  d'animation et timelines plus riches que nos fonctions maison — utile si les
  scènes se multiplient.
- **Theatre.js** (Apache 2.0) : éditeur de keyframes visuel pour three.js —
  régler les mouvements de caméra 3D à la souris au lieu de les coder.
- **Remotion** (vidéo en React) : rendu côté serveur, pratique pour la
  production en lot ; licence payante au-delà de 3 personnes dans l'entreprise.
  Pas nécessaire tant que le rendu navigateur suffit.

### 5) Les modèles de langage
- **Claude** : en place (réécriture, découpage en plans) — `ANTHROPIC_API_KEY` à poser.
- **Ollama** (Mistral Small 3.2, Qwen 3…) : fournisseur prêt dans le code
  (`OLLAMA_URL`, `OLLAMA_MODELE`), utile en local sur le Mac, sans coût par
  appel. Pas encore relié aux boutons « IA » du studio.

### 6) Finition
- Upscale / débruitage : Topaz Video AI, ou `upscale_video` de Higgsfield (crédits).
- Encodage final pour la diffusion : le MP4 du navigateur (H.264, 8 Mbit/s) est
  propre ; pour un fichier maître, repasser par ffmpeg (x264 CRF 18) depuis le
  `.jsx` After Effects ou le WAV + MP4.

## 3. Chaîne conseillée

1. La machine fabrique la vidéo (3D, verre, son, voix ElevenLabs).
2. Si elle doit être exceptionnelle : « Projet After Effects (.jsx) » + WAV, et
   on retravaille dans After Effects (le rendu machine sert de guide) ; les
   plans 3D lourds viennent de Blender (`outils/blender`).
3. Jonathan valide. Rien ne part sans son « oui ».

## 4. Ce qui attend une décision ou une clé

| Quoi | Où | Effet |
|---|---|---|
| `ELEVENLABS_API_KEY` | Vercel, variable sensible | Voix off (et musique) |
| `RUNWAY_API_KEY` | Vercel, variable sensible | Clips image → vidéo |
| Crédits Higgsfield | compte Higgsfield | Clips, musique Suno, upscale |
| `OLLAMA_URL` | `.env.local` (Mac) | Modèle local |
| Voix clonée de Jonathan | ElevenLabs, avec accord | Voix de marque reconnaissable |
