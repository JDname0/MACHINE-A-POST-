/**
 * Un objet 3D réellement rendu par le studio (motion design v4).
 *
 * Veolt vend du packshot 3D : ses vidéos disaient « ce produit n'a jamais été
 * photographié » au-dessus d'une carte de texte. Ici, un vrai modèle — un
 * flacon d'EXEMPLE, modélisé pour la vidéo et présenté comme tel — est rendu
 * image par image, comme un packshot :
 *
 *  - **verre épais** (transmission, indice 1,5) : on voit le liquide à travers,
 *    déformé par la réfraction, et le culot de verre plein sous le liquide ;
 *  - **capot en métal poli**, col et bague ;
 *  - **étiquette imprimée** (texture dessinée ici, marquée « modèle d'exemple ») ;
 *  - **éclairage de studio** : une pièce noire et ses boîtes à lumière (une
 *    grande au-dessus, deux bandes latérales, un contre-jour à la couleur de
 *    la marque), préfiltrée en environnement — ce sont ces panneaux qu'on voit
 *    se refléter dans le verre et le métal ;
 *  - rendu **sur-échantillonné** (1,5×) puis réduit : des arêtes nettes.
 *
 * Il tourne, change de coloris, et peut se montrer en maillage brut.
 *
 * Aucun `Math.random`, aucune horloge : même état → même image.
 * Module navigateur ; sans WebGL, `creerMoteurObjet` renvoie `null` et la
 * scène le dit à l'écran au lieu de casser la vidéo.
 */

import type * as TROIS from 'three';

export interface EtatObjet {
  t: number;
  /** Couleur du liquide (#RRGGBB). */
  couleur: string;
  /** Rotation autour de l'axe vertical, en radians. */
  angle: number;
  /** Bascule vers la caméra, en radians (0,1 : vue de face légèrement plongeante). */
  inclinaison: number;
  /** 1 : maillage brut (fil de fer) ; 0 : rendu final. */
  fil: number;
}

export interface MoteurObjet {
  /** Rend l'objet sur fond transparent. La toile est réutilisée : la dessiner avant le rendu suivant. */
  rendre(e: EtatObjet): HTMLCanvasElement;
  /** Hauteur du pied de l'objet dans la toile (0 haut, 1 bas), vue de face : là où poser l'ombre et le reflet. */
  pied: number;
  detruire(): void;
}

/** L'étiquette imprimée : dessinée une fois, à la police de titre de la marque. */
function textureEtiquette(THREE: typeof TROIS, police: string, encre: string): TROIS.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 768;
  c.height = 640;
  const x = c.getContext('2d')!;
  x.fillStyle = '#F3EFE7';
  x.fillRect(0, 0, c.width, c.height);
  // Un papier légèrement texturé : de fines fibres, à graine fixe.
  let s = 7;
  for (let k = 0; k < 2600; k++) {
    s = (s * 16807) % 2147483647;
    const px = (s % 7680) / 10;
    s = (s * 16807) % 2147483647;
    const py = (s % 6400) / 10;
    x.fillStyle = k % 2 ? 'rgba(0,0,0,0.035)' : 'rgba(255,255,255,0.25)';
    x.fillRect(px, py, 2.2, 1);
  }
  x.strokeStyle = encre;
  x.lineWidth = 3;
  x.strokeRect(34, 34, c.width - 68, c.height - 68);
  x.lineWidth = 1.2;
  x.strokeRect(46, 46, c.width - 92, c.height - 92);
  x.fillStyle = encre;
  x.textAlign = 'center';
  x.font = `600 190px "${police}", Georgia, serif`;
  x.fillText('N° 01', c.width / 2, 290);
  x.fillRect(c.width / 2 - 150, 330, 300, 3);
  (x as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '9px';
  x.font = '500 38px "StudioMono", ui-monospace, Menlo, monospace';
  x.fillText('MODÈLE D’EXEMPLE', c.width / 2 + 4, 410);
  x.font = '500 30px "StudioMono", ui-monospace, Menlo, monospace';
  x.globalAlpha = 0.7;
  x.fillText('RENDU 3D · 50 ML', c.width / 2 + 4, 470);
  x.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export async function creerMoteurObjet(marque: 'veolt' | 'magistria', cote: number, police = 'Georgia'): Promise<MoteurObjet | null> {
  let THREE: typeof TROIS;
  let RoundedBoxGeometry: typeof import('three/examples/jsm/geometries/RoundedBoxGeometry.js').RoundedBoxGeometry;
  try {
    THREE = await import('three');
    ({ RoundedBoxGeometry } = await import('three/examples/jsm/geometries/RoundedBoxGeometry.js'));
  } catch {
    return null;
  }
  // Rendu sur-échantillonné, puis réduit sur la toile de sortie : arêtes nettes.
  const interne = Math.min(1640, Math.round(cote * 1.5));
  const gl = document.createElement('canvas');
  gl.width = interne;
  gl.height = interne;
  let renderer: TROIS.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: gl, alpha: true, antialias: true, preserveDrawingBuffer: true, premultipliedAlpha: true });
  } catch {
    return null;
  }
  renderer.setPixelRatio(1);
  renderer.setSize(interne, interne, false);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const toile = document.createElement('canvas');
  toile.width = cote;
  toile.height = cote;
  const sortie = toile.getContext('2d')!;
  sortie.imageSmoothingQuality = 'high';

  const accent = marque === 'veolt' ? 0xc79bff : 0x3cc8ff;
  const jetables: Array<{ dispose(): void }> = [];
  const garder = <T extends { dispose(): void }>(o: T) => (jetables.push(o), o);

  // ── Le studio : une pièce noire et ses boîtes à lumière ──
  // Chaque panneau est une surface émissive ; préfiltrée, la pièce devient
  // l'environnement de l'objet. Les intensités dépassent 1 : c'est du HDR.
  const piece = new THREE.Scene();
  piece.background = new THREE.Color(0x040406);
  const panneau = (l: number, h: number, x: number, y: number, z: number, intensite: number, couleur = 0xffffff) => {
    const m = garder(new THREE.MeshBasicMaterial({ color: new THREE.Color(couleur).multiplyScalar(intensite), side: THREE.DoubleSide }));
    const p = new THREE.Mesh(garder(new THREE.PlaneGeometry(l, h)), m);
    p.position.set(x, y, z);
    p.lookAt(0, 0, 0);
    piece.add(p);
  };
  panneau(7, 3.6, 0, 7, 2.5, 11); // grande boîte au-dessus : le reflet large sur le capot et l'épaule
  panneau(1.3, 8, -6.5, 1, 2.5, 5.5); // bande à gauche : le liseré vertical dans le verre
  panneau(0.9, 8, 6.5, 1.5, 1, 4); // bande à droite, plus fine
  panneau(5, 5, 0, 1, 8, 1.4); // face, douce : débouche l'étiquette
  panneau(9, 2.2, 0, 1.2, -7.5, 4.5, accent); // contre-jour à la couleur de la marque
  panneau(12, 12, 0, -7, 0, 0.5); // le sol renvoie un peu de lumière
  const pmrem = garder(new THREE.PMREMGenerator(renderer));
  const env = garder(pmrem.fromScene(piece, 0.015).texture);

  const scene = new THREE.Scene();
  scene.environment = env;
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 60);
  const CAM_Z = 10.4;
  camera.position.set(0, 0.35, CAM_Z);
  camera.lookAt(0, 0, 0);
  // Deux lumières directes, discrètes : l'essentiel vient de l'environnement.
  const cle = new THREE.DirectionalLight(0xffffff, 1.3);
  cle.position.set(3.5, 6, 5);
  scene.add(cle);
  const contre = new THREE.DirectionalLight(accent, 2.2);
  contre.position.set(-4, 2.5, -5);
  scene.add(contre);

  const groupe = new THREE.Group();
  scene.add(groupe);

  // ── Le flacon ──
  // Verre : transmission complète, épais, légèrement teinté par le liquide.
  const verre = garder(
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.035,
      metalness: 0,
      transmission: 1,
      thickness: 0.55,
      ior: 1.5,
      attenuationDistance: 3.2,
      envMapIntensity: 1.15,
      specularIntensity: 1,
    }),
  );
  // Liquide : opaque et un peu lumineux — vu à travers le verre, il prend la réfraction.
  const liquide = garder(new THREE.MeshPhysicalMaterial({ color: 0xb600a8, roughness: 0.22, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.2, envMapIntensity: 0.9 }));
  const metal = garder(new THREE.MeshStandardMaterial({ color: 0xece6da, roughness: 0.14, metalness: 1, envMapIntensity: 1.35 }));
  const bague = garder(new THREE.MeshStandardMaterial({ color: 0xbfb8aa, roughness: 0.3, metalness: 1, envMapIntensity: 1.2 }));
  const papier = garder(new THREE.MeshStandardMaterial({ map: garder(textureEtiquette(THREE, police, '#1B1820')), roughness: 0.78, metalness: 0, envMapIntensity: 0.35 }));

  const BAS = -1.72; // le pied du flacon, en unités de scène
  const H_CORPS = 2.6;
  const corps = new THREE.Mesh(garder(new RoundedBoxGeometry(1.96, H_CORPS, 1.0, 10, 0.24)), verre);
  corps.position.y = BAS + H_CORPS / 2;
  groupe.add(corps);
  // Le liquide s'arrête au-dessus d'un culot de verre plein, et sous l'épaule.
  const jus = new THREE.Mesh(garder(new RoundedBoxGeometry(1.66, 1.92, 0.7, 8, 0.16)), liquide);
  jus.position.y = BAS + 0.34 + 0.96;
  groupe.add(jus);
  const hautCorps = BAS + H_CORPS;
  const col = new THREE.Mesh(garder(new THREE.CylinderGeometry(0.27, 0.3, 0.2, 48, 1)), verre);
  col.position.y = hautCorps + 0.08;
  groupe.add(col);
  const anneau = new THREE.Mesh(garder(new THREE.CylinderGeometry(0.36, 0.36, 0.13, 64, 1)), bague);
  anneau.position.y = hautCorps + 0.22;
  groupe.add(anneau);
  // Le capot : un cylindre tourné, arêtes chanfreinées (profil en révolution).
  const profil = [
    [0, 0],
    [0.44, 0],
    [0.47, 0.03],
    [0.47, 0.74],
    [0.43, 0.8],
    [0, 0.8],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const capot = new THREE.Mesh(garder(new THREE.LatheGeometry(profil, 72)), metal);
  capot.position.y = hautCorps + 0.29;
  groupe.add(capot);
  // L'étiquette : posée sur la face, à fleur de verre.
  const etiquette = new THREE.Mesh(garder(new THREE.PlaneGeometry(1.26, 1.05)), papier);
  etiquette.position.set(0, BAS + 1.22, 0.507);
  groupe.add(etiquette);
  // Recentré : le milieu du flacon (capot compris) au centre de la toile.
  const hautTotal = hautCorps + 0.29 + 0.8;
  const milieu = (BAS + hautTotal) / 2;
  for (const o of groupe.children) o.position.y -= milieu;
  const demi = (hautTotal - BAS) / 2;

  // Maillage brut : les mêmes géométries, en fil de fer à la couleur de la marque.
  const filDeFer = garder(new THREE.MeshBasicMaterial({ color: accent, wireframe: true, transparent: true, opacity: 0.9 }));
  const couleur = new THREE.Color();
  // Où tombe le pied dans la toile, vu de face : projection du bas du flacon.
  const visible = 2 * CAM_Z * Math.tan((26 / 2) * (Math.PI / 180));
  const pied = 0.5 + (demi + 0.35 * 0.2) / visible;

  return {
    pied,
    rendre(e: EtatObjet) {
      couleur.set(e.couleur);
      liquide.color.copy(couleur);
      liquide.emissive.copy(couleur).multiplyScalar(0.16);
      // Le verre prend une pointe de la teinte du liquide.
      verre.attenuationColor.copy(couleur).lerp(new THREE.Color(0xffffff), 0.55);
      groupe.rotation.set(e.inclinaison, e.angle, 0);
      const filaire = e.fil >= 0.5;
      scene.overrideMaterial = filaire ? filDeFer : null;
      scene.environment = filaire ? null : env;
      renderer.render(scene, camera);
      sortie.clearRect(0, 0, cote, cote);
      sortie.drawImage(gl, 0, 0, cote, cote);
      return toile;
    },
    detruire() {
      jetables.forEach((o) => o.dispose());
      renderer.dispose();
    },
  };
}
