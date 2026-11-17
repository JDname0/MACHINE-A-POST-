/**
 * Un objet 3D réellement rendu par le studio (motion design v4).
 *
 * Veolt vend du packshot 3D : ses vidéos disaient « ce produit n'a jamais été
 * photographié » au-dessus d'une carte de texte. Ici, un vrai modèle — un
 * flacon d'EXEMPLE, modélisé pour la vidéo et présenté comme tel — est rendu
 * image par image : matériaux physiques (vernis, métal brossé), éclairage de
 * studio par environnement, ombre de contact. Il tourne, change de coloris,
 * et peut se montrer en maillage brut (« de ça… à ça »).
 *
 * Aucun `Math.random`, aucune horloge : même état → même image.
 * Module navigateur ; sans WebGL, `creerMoteurObjet` renvoie `null` et la
 * scène le dit à l'écran au lieu de casser la vidéo.
 */

import type * as TROIS from 'three';

export interface EtatObjet {
  t: number;
  /** Couleur du corps (#RRGGBB). */
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
  detruire(): void;
}

export async function creerMoteurObjet(marque: 'veolt' | 'magistria', cote: number): Promise<MoteurObjet | null> {
  let THREE: typeof TROIS;
  let RoundedBoxGeometry: typeof import('three/examples/jsm/geometries/RoundedBoxGeometry.js').RoundedBoxGeometry;
  let RoomEnvironment: typeof import('three/examples/jsm/environments/RoomEnvironment.js').RoomEnvironment;
  try {
    THREE = await import('three');
    ({ RoundedBoxGeometry } = await import('three/examples/jsm/geometries/RoundedBoxGeometry.js'));
    ({ RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js'));
  } catch {
    return null;
  }
  const toile = document.createElement('canvas');
  toile.width = cote;
  toile.height = cote;
  let renderer: TROIS.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: toile, alpha: true, antialias: true, preserveDrawingBuffer: true, premultipliedAlpha: true });
  } catch {
    return null;
  }
  renderer.setPixelRatio(1);
  renderer.setSize(cote, cote, false);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  // L'éclairage de studio : une pièce aux panneaux lumineux, préfiltrée — ce
  // sont ses reflets qui font lire le vernis et le métal.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0.25, 8.2);
  camera.lookAt(0, 0, 0);

  const accent = marque === 'veolt' ? 0xc79bff : 0x3cc8ff;
  const cle = new THREE.DirectionalLight(0xffffff, 2.6);
  cle.position.set(3.5, 5, 4);
  scene.add(cle);
  // Débouchage de face, doux : il rend la matière sans écraser les reflets.
  const face = new THREE.DirectionalLight(0xfff4ea, 0.9);
  face.position.set(-2.5, 1.5, 6);
  scene.add(face);
  // Contre-jour à la couleur de la marque : il détoure l'objet sur le fond sombre.
  const contre = new THREE.DirectionalLight(accent, 3.2);
  contre.position.set(-4, 2.5, -4.5);
  scene.add(contre);

  const groupe = new THREE.Group();
  scene.add(groupe);
  const geos: TROIS.BufferGeometry[] = [];
  const mats: TROIS.Material[] = [];
  const geo = <T extends TROIS.BufferGeometry>(g: T) => (geos.push(g), g);
  const mat = <T extends TROIS.Material>(m: T) => (mats.push(m), m);

  // Le flacon : corps vernis, épaule, col et capot en métal, étiquette en creux.
  const vernis = mat(
    new THREE.MeshPhysicalMaterial({ color: 0xb600a8, roughness: 0.32, metalness: 0.18, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 2.4, sheen: 0.4, sheenRoughness: 0.5 }),
  );
  // Le capot : métal clair brossé. L'environnement est poussé, sinon un métal ne reflète que du noir.
  const metal = mat(new THREE.MeshStandardMaterial({ color: 0xf1ede6, roughness: 0.26, metalness: 0.92, envMapIntensity: 3.4 }));
  const metalSombre = mat(new THREE.MeshStandardMaterial({ color: 0x8d8794, roughness: 0.3, metalness: 0.95, envMapIntensity: 3 }));
  const papier = mat(new THREE.MeshStandardMaterial({ color: 0xf2eee8, roughness: 0.72, metalness: 0 }));
  const encre = mat(new THREE.MeshStandardMaterial({ color: 0x1b1820, roughness: 0.5, metalness: 0.2 }));

  const corps = new THREE.Mesh(geo(new RoundedBoxGeometry(1.9, 2.55, 0.98, 6, 0.26)), vernis);
  corps.position.y = -0.38;
  groupe.add(corps);
  const epaule = new THREE.Mesh(geo(new THREE.CylinderGeometry(0.36, 0.52, 0.2, 40, 1)), metalSombre);
  epaule.position.y = 0.99;
  groupe.add(epaule);
  const col = new THREE.Mesh(geo(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 40, 1)), metal);
  col.position.y = 1.18;
  groupe.add(col);
  const capot = new THREE.Mesh(geo(new RoundedBoxGeometry(0.98, 0.78, 0.78, 5, 0.12)), metal);
  capot.position.y = 1.66;
  groupe.add(capot);
  // L'étiquette : une plaque claire sur la face, trois filets d'« écriture » et un sceau.
  const plaque = new THREE.Mesh(geo(new RoundedBoxGeometry(1.2, 1.15, 0.03, 3, 0.05)), papier);
  plaque.position.set(0, -0.42, 0.495);
  groupe.add(plaque);
  [0.62, 0.42, 0.52].forEach((largeur, k) => {
    const filet = new THREE.Mesh(geo(new THREE.BoxGeometry(largeur, 0.05, 0.012)), encre);
    filet.position.set(-0.6 + 0.14 + largeur / 2, -0.52 - k * 0.14, 0.515);
    groupe.add(filet);
  });
  const sceau = new THREE.Mesh(geo(new THREE.CylinderGeometry(0.15, 0.15, 0.014, 32)), vernis);
  sceau.rotation.x = Math.PI / 2;
  sceau.position.set(-0.28, -0.14, 0.516);
  groupe.add(sceau);
  // Recentré et ramené dans le cadre : rien ne touche le bord de la toile, même incliné.
  for (const o of groupe.children) o.position.y -= 0.2;
  groupe.scale.setScalar(0.96);

  // Maillage brut : les mêmes géométries, en fil de fer à la couleur de la marque.
  const filDeFer = mat(new THREE.MeshBasicMaterial({ color: accent, wireframe: true, transparent: true, opacity: 0.9 }));
  const couleur = new THREE.Color();

  return {
    rendre(e: EtatObjet) {
      // Un vernis saturé à 100 % sort en aplat : on l'assombrit un peu, les reflets font le reste.
      couleur.set(e.couleur).multiplyScalar(0.72);
      vernis.color.copy(couleur);
      vernis.sheenColor.set(e.couleur);
      groupe.rotation.set(e.inclinaison, e.angle, 0);
      // Une respiration verticale à peine visible : l'objet « tient » dans l'air du studio.
      groupe.position.y = Math.sin(e.t * 0.9) * 0.035;
      scene.overrideMaterial = e.fil >= 0.5 ? filDeFer : null;
      scene.environment = e.fil >= 0.5 ? null : env;
      renderer.render(scene, camera);
      return toile;
    },
    detruire() {
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
      env.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
