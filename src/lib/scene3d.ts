/**
 * La couche 3D des vidéos, reprise des sites en ligne (three.js 0.160, halo
 * UnrealBloom 0,45 / 0,35 / 0,35 comme sur les deux sites) :
 *
 *  - **Veolt** : le champ de particules de veolt.fr — une sphère de Fibonacci
 *    de 16 000 points qui se construit depuis la dispersion, puis se
 *    métamorphose en icône (écran, téléphone, €, coche, loupe) et finit en
 *    galaxie ; zones argent / magenta / blanc tirées d'un bruit 3D.
 *  - **MagistrIA** : le « cerveau » de magistrai.fr — coquille de particules
 *    et réseau de neurones intérieur, bleu nuit / cyan / blanc tirant à
 *    l'orange sur la droite, et le cadran façon Jarvis (anneaux qui se tracent
 *    et tournent, graduations), avec l'onde de choc au moment clé.
 *
 * Tout est fonction du temps seulement (graine fixe, aucun `Math.random`) :
 * la même vidéo ressort identique. Le rendu se fait sur une toile WebGL hors
 * écran, posée ensuite sur l'image en mode « screen » — comme le site pose sa
 * couche 3D (mix-blend-mode: screen).
 *
 * Module navigateur uniquement, chargé à la demande (three pèse ~600 ko).
 */

import type * as TROIS from 'three';

export type Forme3D = 'sphere' | 'ecran' | 'telephone' | 'euro' | 'coche' | 'loupe' | 'lecture' | 'galaxie' | 'cerveau' | 'balance' | 'document' | 'bouclier';
export type Place3D = 'centre' | 'haut' | 'bas' | 'fond' | 'gauche' | 'droite';

export interface EtatNoyau {
  /** Temps absolu (dérives lentes). */
  t: number;
  de: Forme3D;
  vers: Forme3D;
  /** 0 → 1 : avancement de la métamorphose. */
  morph: number;
  /** Centre (px) et rayon (px) dans l'image. */
  cx: number;
  cy: number;
  rayon: number;
  /** 0 → 1 : construction depuis la dispersion. */
  construction: number;
  /** 0 → 1 : onde de choc (MagistrIA) / éclat (Veolt) ; 0 : rien. */
  onde: number;
  /** 0 → 1 : le cadran (MagistrIA) se trace. */
  cadran: number;
  /** Agitation : 0 au repos, 1 quand « ça travaille ». */
  activite: number;
  /** Luminosité générale (0,4 en fond, 1 au premier plan). */
  intensite: number;
}

export interface Moteur3D {
  rendre(e: EtatNoyau): HTMLCanvasElement;
  detruire(): void;
}

const E = 16000;

function graine(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SIMPLEX_GLSL = `
  vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
    vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g;
    vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
    i=mod289(i);
    vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
    float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.0*floor(p*ns.z*ns.z);
    vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
    vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy;
    vec4 h=1.0-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0;
    vec4 sh=-step(h,vec4(0.0));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
    vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
    return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Formes : chaque forme est un nuage de E points
// ─────────────────────────────────────────────────────────────────────────────

type Dessin = (c: CanvasRenderingContext2D, s: number) => void;

/** Icônes dessinées en blanc sur 256 px, puis échantillonnées en particules (technique de veolt.fr). */
const ICONES: Partial<Record<Forme3D, Dessin>> = {
  ecran: (c, s) => {
    // L'icône « site web » de veolt.fr : écran, pied, triangle de lecture.
    const x0 = s * 0.06, y0 = s * 0.12, x1 = s * 0.94, y1 = s * 0.68;
    c.lineWidth = s * 0.045;
    c.beginPath();
    c.roundRect(x0, y0, x1 - x0, y1 - y0, s * 0.05);
    c.stroke();
    c.lineWidth = s * 0.035;
    c.beginPath();
    c.moveTo(s * 0.43, y1);
    c.lineTo(s * 0.43, y1 + s * 0.13);
    c.lineTo(s * 0.57, y1 + s * 0.13);
    c.lineTo(s * 0.57, y1);
    c.stroke();
    c.lineWidth = s * 0.05;
    c.beginPath();
    c.moveTo(s * 0.28, y1 + s * 0.17);
    c.lineTo(s * 0.72, y1 + s * 0.17);
    c.stroke();
    const t = s * 0.13;
    c.beginPath();
    c.moveTo(s * 0.5 - t * 0.6, s * 0.4 - t);
    c.lineTo(s * 0.5 - t * 0.6, s * 0.4 + t);
    c.lineTo(s * 0.5 + t * 0.9, s * 0.4);
    c.closePath();
    c.fill();
  },
  telephone: (c, s) => {
    c.lineWidth = s * 0.045;
    c.beginPath();
    c.roundRect(s * 0.3, s * 0.06, s * 0.4, s * 0.88, s * 0.07);
    c.stroke();
    c.beginPath();
    c.roundRect(s * 0.44, s * 0.11, s * 0.12, s * 0.025, s * 0.012);
    c.fill();
    c.lineWidth = s * 0.03;
    for (let k = 0; k < 4; k++) {
      c.beginPath();
      c.moveTo(s * 0.36, s * (0.26 + k * 0.1));
      c.lineTo(s * (k % 2 ? 0.56 : 0.64), s * (0.26 + k * 0.1));
      c.stroke();
    }
    c.beginPath();
    c.roundRect(s * 0.36, s * 0.72, s * 0.28, s * 0.09, s * 0.045);
    c.fill();
  },
  lecture: (c, s) => {
    // L'icône « pub / vidéo » de veolt.fr : un cercle, un triangle de lecture.
    c.lineWidth = s * 0.05;
    c.beginPath();
    c.arc(s / 2, s / 2, s * 0.4, 0, Math.PI * 2);
    c.stroke();
    const t = s * 0.4 * 0.55;
    c.beginPath();
    c.moveTo(s / 2 - t * 0.55, s / 2 - t);
    c.lineTo(s / 2 - t * 0.55, s / 2 + t);
    c.lineTo(s / 2 + t * 0.9, s / 2);
    c.closePath();
    c.fill();
  },
  euro: (c, s) => {
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = `bold ${Math.round(s * 0.7)}px Georgia, serif`;
    c.fillText('€', s / 2, s / 2 + s * 0.02);
  },
  coche: (c, s) => {
    c.lineWidth = s * 0.05;
    c.beginPath();
    c.arc(s / 2, s / 2, s * 0.4, 0, Math.PI * 2);
    c.stroke();
    c.lineWidth = s * 0.075;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(s * 0.32, s * 0.52);
    c.lineTo(s * 0.45, s * 0.65);
    c.lineTo(s * 0.7, s * 0.37);
    c.stroke();
  },
  loupe: (c, s) => {
    c.lineWidth = s * 0.06;
    c.beginPath();
    c.arc(s * 0.43, s * 0.43, s * 0.27, 0, Math.PI * 2);
    c.stroke();
    c.lineWidth = s * 0.09;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(s * 0.63, s * 0.63);
    c.lineTo(s * 0.86, s * 0.86);
    c.stroke();
  },
  balance: (c, s) => {
    // La balance de la justice : fléau, colonne, deux plateaux.
    c.lineWidth = s * 0.04;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(s * 0.5, s * 0.14);
    c.lineTo(s * 0.5, s * 0.84);
    c.moveTo(s * 0.32, s * 0.86);
    c.lineTo(s * 0.68, s * 0.86);
    c.moveTo(s * 0.16, s * 0.26);
    c.lineTo(s * 0.84, s * 0.26);
    c.stroke();
    for (const x of [0.2, 0.8]) {
      c.beginPath();
      c.moveTo(s * x, s * 0.26);
      c.lineTo(s * (x - 0.1), s * 0.52);
      c.moveTo(s * x, s * 0.26);
      c.lineTo(s * (x + 0.1), s * 0.52);
      c.stroke();
      c.beginPath();
      c.arc(s * x, s * 0.52, s * 0.12, 0, Math.PI);
      c.stroke();
    }
    c.beginPath();
    c.arc(s * 0.5, s * 0.14, s * 0.035, 0, Math.PI * 2);
    c.fill();
  },
  document: (c, s) => {
    c.lineWidth = s * 0.045;
    c.beginPath();
    c.moveTo(s * 0.24, s * 0.08);
    c.lineTo(s * 0.62, s * 0.08);
    c.lineTo(s * 0.78, s * 0.24);
    c.lineTo(s * 0.78, s * 0.92);
    c.lineTo(s * 0.24, s * 0.92);
    c.closePath();
    c.stroke();
    c.lineWidth = s * 0.03;
    for (let k = 0; k < 6; k++) {
      c.beginPath();
      c.moveTo(s * 0.33, s * (0.34 + k * 0.09));
      c.lineTo(s * (k === 5 ? 0.52 : 0.69), s * (0.34 + k * 0.09));
      c.stroke();
    }
  },
  bouclier: (c, s) => {
    c.lineWidth = s * 0.05;
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(s * 0.5, s * 0.08);
    c.lineTo(s * 0.84, s * 0.2);
    c.quadraticCurveTo(s * 0.84, s * 0.72, s * 0.5, s * 0.92);
    c.quadraticCurveTo(s * 0.16, s * 0.72, s * 0.16, s * 0.2);
    c.closePath();
    c.stroke();
    c.lineWidth = s * 0.065;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(s * 0.36, s * 0.5);
    c.lineTo(s * 0.47, s * 0.61);
    c.lineTo(s * 0.66, s * 0.4);
    c.stroke();
  },
};

function depuisIcone(dessin: Dessin, alea: () => number, echelle = 3.7): Float32Array {
  const s = 256;
  const c = document.createElement('canvas');
  c.width = s;
  c.height = s;
  const x = c.getContext('2d', { willReadFrequently: true })!;
  x.strokeStyle = '#fff';
  x.fillStyle = '#fff';
  dessin(x, s);
  const d = x.getImageData(0, 0, s, s).data;
  const pts: Array<[number, number]> = [];
  for (let py = 0; py < s; py += 2) for (let px = 0; px < s; px += 2) if (d[(py * s + px) * 4 + 3] > 128) pts.push([px, py]);
  const out = new Float32Array(E * 3);
  for (let i = 0; i < E; i++) {
    const p = pts.length ? pts[Math.floor(alea() * pts.length)] : [s / 2, s / 2];
    const j = (alea() - 0.5) * 2.5;
    out[i * 3] = ((p[0] + j) / s - 0.5) * echelle;
    out[i * 3 + 1] = -((p[1] + j) / s - 0.5) * echelle;
    out[i * 3 + 2] = (alea() - 0.5) * 0.45;
  }
  return out;
}

function sphere(alea: () => number, r = 2): Float32Array {
  const out = new Float32Array(E * 3);
  for (let s = 0; s < E; s++) {
    // Sphère de Fibonacci à rayon variable : exactement la répartition des sites.
    const v = Math.acos(1 - (2 * (s + 0.5)) / E);
    const g = Math.PI * (1 + Math.sqrt(5)) * (s + 0.5);
    const y = r * (0.8 + alea() * 0.4);
    out[s * 3] = y * Math.sin(v) * Math.cos(g);
    out[s * 3 + 1] = y * Math.sin(v) * Math.sin(g);
    out[s * 3 + 2] = y * Math.cos(v);
  }
  return out;
}

function galaxie(alea: () => number): Float32Array {
  const out = new Float32Array(E * 3);
  for (let s = 0; s < E; s++) {
    const bras = s % 3;
    const r = Math.pow(alea(), 0.5) * 3.4;
    const a = r * 1.1 + (bras * Math.PI * 2) / 3 + (alea() - 0.5) * 0.6;
    out[s * 3] = Math.cos(a) * r;
    out[s * 3 + 1] = (alea() - 0.5) * 0.35 * (1.2 - r / 3.4);
    out[s * 3 + 2] = Math.sin(a) * r;
  }
  return out;
}

/** Le cerveau de magistrai.fr : coquille de 13 600 points + 2 400 points le long d'un réseau intérieur. */
function cerveau(alea: () => number): Float32Array {
  const coquille = Math.floor(E * 0.85);
  const out = new Float32Array(E * 3);
  for (let s = 0; s < coquille; s++) {
    const v = Math.acos(1 - (2 * (s + 0.5)) / coquille);
    const g = Math.PI * (1 + Math.sqrt(5)) * (s + 0.5);
    const y = 2.03 * (0.8 + alea() * 0.4);
    out[s * 3] = y * Math.sin(v) * Math.cos(g);
    out[s * 3 + 1] = y * Math.sin(v) * Math.sin(g);
    out[s * 3 + 2] = y * Math.cos(v);
  }
  const noeuds: number[][] = [];
  while (noeuds.length < 64) {
    const v = [alea() * 2 - 1, alea() * 2 - 1, alea() * 2 - 1];
    const l2 = v[0] ** 2 + v[1] ** 2 + v[2] ** 2;
    if (l2 < 0.01 || l2 > 1) continue;
    const k = (1.45 * Math.pow(alea(), 0.45)) / Math.sqrt(l2);
    noeuds.push(v.map((x) => x * k));
  }
  const aretes: Array<[number[], number[]]> = [];
  noeuds.forEach((a, i) => {
    const proches = noeuds
      .map((b, j) => [j, (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2] as const)
      .filter((x) => x[0] !== i)
      .sort((x, y) => x[1] - y[1]);
    for (let k = 0; k < 2; k++) aretes.push([a, noeuds[proches[k][0]]]);
    const la = Math.hypot(a[0], a[1], a[2]);
    if (la > 1.05 && alea() < 0.6) aretes.push([a, a.map((x) => (x / la) * 1.7)]);
  });
  for (let s = coquille; s < E; s++) {
    const [a, b] = aretes[Math.floor(alea() * aretes.length)];
    const t = alea();
    for (let d = 0; d < 3; d++) out[s * 3 + d] = a[d] + (b[d] - a[d]) * t + (alea() - 0.5) * 0.05;
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Moteur
// ─────────────────────────────────────────────────────────────────────────────

export async function creerMoteur3D(marque: 'veolt' | 'magistria', L: number, H: number, qualite = 0.75): Promise<Moteur3D | null> {
  let THREE: typeof TROIS;
  let EffectComposer: typeof import('three/examples/jsm/postprocessing/EffectComposer.js').EffectComposer;
  let RenderPass: typeof import('three/examples/jsm/postprocessing/RenderPass.js').RenderPass;
  let UnrealBloomPass: typeof import('three/examples/jsm/postprocessing/UnrealBloomPass.js').UnrealBloomPass;
  let OutputPass: typeof import('three/examples/jsm/postprocessing/OutputPass.js').OutputPass;
  try {
    THREE = await import('three');
    ({ EffectComposer } = await import('three/examples/jsm/postprocessing/EffectComposer.js'));
    ({ RenderPass } = await import('three/examples/jsm/postprocessing/RenderPass.js'));
    ({ UnrealBloomPass } = await import('three/examples/jsm/postprocessing/UnrealBloomPass.js'));
    ({ OutputPass } = await import('three/examples/jsm/postprocessing/OutputPass.js'));
  } catch {
    return null;
  }
  const largeur = Math.round(L * qualite);
  const hauteur = Math.round(H * qualite);
  const toile = document.createElement('canvas');
  toile.width = largeur;
  toile.height = hauteur;
  let renderer: TROIS.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: toile, alpha: false, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  } catch {
    return null; // pas de WebGL : la vidéo sort sans la couche 3D, jamais cassée
  }
  renderer.setPixelRatio(1);
  renderer.setSize(largeur, hauteur, false);
  renderer.setClearColor(0x000000, 1);

  const scene = new THREE.Scene();
  const CAM_D = 11;
  const camera = new THREE.PerspectiveCamera(50, largeur / hauteur, 0.1, 200);
  camera.position.set(0, 0, CAM_D);
  camera.lookAt(0, 0, 0);
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(1);
  composer.setSize(largeur, hauteur);
  composer.addPass(new RenderPass(scene, camera));
  // Les réglages de halo des deux sites.
  const bloom = new UnrealBloomPass(new THREE.Vector2(largeur, hauteur), 0.45, 0.35, 0.35);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  const alea = graine(marque === 'veolt' ? 2024 : 1337);
  const formes = new Map<Forme3D, Float32Array>();
  const forme = (f: Forme3D) => {
    let a = formes.get(f);
    if (!a) {
      a = f === 'sphere' ? sphere(alea) : f === 'galaxie' ? galaxie(alea) : f === 'cerveau' ? cerveau(alea) : depuisIcone(ICONES[f] ?? ICONES.coche!, alea);
      formes.set(f, a);
    }
    return a;
  };

  // ── Le nuage principal ──
  const aSeed = new Float32Array(E);
  const aSize = new Float32Array(E);
  const aBright = new Float32Array(E);
  for (let s = 0; s < E; s++) {
    aSeed[s] = alea();
    aSize[s] = alea() < 0.5 ? 0.56 : 0.27;
    aBright[s] = 0.4 + alea() * 2.6;
  }
  const geo = new THREE.BufferGeometry();
  const depart = forme(marque === 'veolt' ? 'sphere' : 'cerveau');
  const attrDe = new THREE.BufferAttribute(depart.slice(), 3);
  const attrVers = new THREE.BufferAttribute(depart.slice(), 3);
  geo.setAttribute('position', attrDe);
  geo.setAttribute('aVers', attrVers);
  geo.setAttribute('aSeed', new THREE.BufferAttribute(aSeed, 1));
  geo.setAttribute('aSize', new THREE.BufferAttribute(aSize, 1));
  geo.setAttribute('aBrightness', new THREE.BufferAttribute(aBright, 1));
  let paire = `${marque === 'veolt' ? 'sphere' : 'cerveau'}>${marque === 'veolt' ? 'sphere' : 'cerveau'}`;

  const U = {
    uTime: { value: 0 },
    uMorph: { value: 0 },
    uIntro: { value: 1 },
    uRot: { value: 0 },
    uActivite: { value: 0 },
    uOnde: { value: 0 },
    uIntensite: { value: 1 },
    // Plus fines que sur le site : la forme occupe ici tout l'écran d'un téléphone.
    uTaille: { value: (hauteur / 900) * 0.46 },
    // Une icône concentre les 16 000 points sur un trait : on baisse leur éclat
    // pour garder la forme lisible au lieu d'une tache blanche.
    uDensite: { value: 1 },
    uMarque: { value: marque === 'veolt' ? 0 : 1 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: U,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute vec3 aVers; attribute float aSeed; attribute float aSize; attribute float aBrightness;
      uniform float uTime, uMorph, uIntro, uRot, uActivite, uOnde, uIntensite, uTaille, uMarque, uDensite;
      varying vec3 vColor; varying float vAlpha;
      ${SIMPLEX_GLSL}
      float easeInOutCubic(float t){ return t < 0.5 ? 4.0*t*t*t : 1.0 - pow(-2.0*t+2.0,3.0)/2.0; }
      void main() {
        float m = easeInOutCubic(clamp(uMorph, 0.0, 1.0));
        vec3 pos = mix(position, aVers, m);
        // Turbulence de veolt.fr : forte au milieu de la métamorphose, réveillée par l'activité.
        float pic = sin(3.14159 * m);
        float n1t = snoise(pos * 0.7 + uTime * 0.04);
        float turb = (0.03 + 0.9 * pic + 0.22 * uActivite) * n1t;
        float a1 = aSeed * 6.28318 + uTime * 0.5;
        float a2 = aSeed * 4.0 + uTime * 0.8;
        pos += vec3(
          sin(a1) * cos(aSeed * 3.14159) + sin(a2 * 1.7) * 0.5,
          cos(a1) * sin(aSeed * 5.0) + cos(a2 * 2.3) * 0.4,
          sin(a2) * cos(aSeed * 7.1) + cos(a1 * 1.5) * 0.6) * turb;
        pos.x += sin(uTime * 0.8 + aSeed * 6.28) * 0.03;
        pos.y += cos(uTime * 0.56 + aSeed * 3.14) * 0.02;
        pos.z += sin(uTime * 0.4 + aSeed * 9.42) * 0.02;
        // Onde de choc qui traverse la forme depuis la droite.
        vec3 dir = normalize(pos + vec3(0.0001));
        float ang = acos(clamp(dot(dir, normalize(vec3(0.6, 0.3, 0.75))), -1.0, 1.0)) / 3.14159;
        float w = exp(-pow((ang - uOnde * 1.1) * 9.0, 2.0)) * (1.0 - uOnde) * step(0.001, uOnde);
        pos *= 1.0 + w * 0.10;
        // Rotation lente autour de l'axe vertical.
        float c = cos(uRot), s = sin(uRot);
        pos.xz = mat2(c, -s, s, c) * pos.xz;
        // Construction : les points arrivent de loin, chacun à son tour (veolt.fr).
        float introK = clamp(uIntro * 1.5 - aSeed * 0.5, 0.0, 1.0);
        introK = 1.0 - pow(1.0 - introK, 3.0);
        vec3 introFrom = dir * (7.0 + aSeed * 9.0) + vec3(sin(aSeed * 40.0), cos(aSeed * 27.0), sin(aSeed * 13.0)) * 2.0;
        pos = mix(introFrom, pos, introK);
        vec4 wp = modelMatrix * vec4(pos, 1.0);
        // Couleur : trois octaves de bruit en zones, comme sur les sites.
        float n1 = snoise(wp.xyz * 0.7 + uTime * 0.04);
        float n2 = snoise(wp.xyz * 1.47 + vec3(37.0, 91.0, 54.0) + uTime * 0.024);
        float n3 = snoise(wp.xyz * 3.01 + vec3(150.0, 23.0, 77.0) + uTime * 0.012);
        float zone = mix((n1 * 0.6 + n2 * 0.3 + n3 * 0.1) * 0.5 + 0.5, aSeed, 0.45);
        float wD = 1.0 - smoothstep(0.39, 0.45, zone);
        float wW = smoothstep(0.64, 0.70, zone);
        float wC = max(1.0 - wD - wW, 0.0);
        vec3 veolt = vec3(0.729, 0.800, 0.839) * wD + vec3(0.714, 0.0, 0.659) * wC + vec3(1.0) * wW;
        vec3 froid = vec3(0.0, 0.22, 0.95) * wD + vec3(0.0, 0.75, 1.0) * wC + vec3(1.0) * wW;
        vec3 chaud = vec3(0.85, 0.20, 0.0) * wD + vec3(1.0, 0.52, 0.04) * wC + vec3(1.0) * wW;
        vec3 magistria = mix(froid, chaud, smoothstep(-0.2, 2.0, pos.x) * 0.5);
        vec3 col = mix(veolt, magistria, uMarque);
        col = mix(col, uMarque > 0.5 ? vec3(0.75, 0.95, 1.0) : vec3(1.0, 0.75, 0.95), clamp(w, 0.0, 1.0) * 0.8);
        vColor = col * (1.0 + w * 0.8);
        vAlpha = aBrightness * smoothstep(0.0, 0.35, introK) * uIntensite * uDensite;
        vec4 mv = viewMatrix * wp;
        gl_PointSize = aSize * uTaille * (1.0 + w) * (120.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying vec3 vColor; varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = 1.0 - smoothstep(0.15, 0.45, d);
        gl_FragColor = vec4(vColor, a * vAlpha * 0.55);
      }`,
  });
  const nuage = new THREE.Points(geo, mat);
  const groupe = new THREE.Group();
  groupe.add(nuage);
  scene.add(groupe);

  // ── Champ d'ambiance : 450 points lointains qui dérivent (les deux sites) ──
  const N = 450;
  const pa = new Float32Array(N * 3);
  const ta = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    pa[i * 3] = (alea() - 0.5) * 60;
    pa[i * 3 + 1] = (alea() - 0.5) * 60;
    pa[i * 3 + 2] = alea() * -30 - 4;
    ta[i] = alea() < 0.5 ? 1.2 : 0.5;
  }
  const geoA = new THREE.BufferGeometry();
  geoA.setAttribute('position', new THREE.BufferAttribute(pa, 3));
  geoA.setAttribute('size', new THREE.BufferAttribute(ta, 1));
  const matA = new THREE.ShaderMaterial({
    uniforms: U,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float size; uniform float uTime, uTaille, uMarque; varying vec3 vC; varying float vD;
      void main() {
        vec3 p = position;
        float seed = fract(sin(dot(position.xy, vec2(12.9898,78.233))) * 43758.5453);
        p.y += cos(uTime * 0.282 + seed * 1.5) * 0.5;
        p.x += sin(uTime * 0.21 + position.z) * 0.3;
        vC = mix(seed > 0.6 ? vec3(0.714, 0.0, 0.659) : vec3(0.73, 0.8, 0.84), seed > 0.7 ? vec3(1.0, 0.6, 0.25) : vec3(0.15, 0.75, 1.0), uMarque);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vD = clamp(-mv.z / 35.0, 0.0, 1.0);
        gl_PointSize = size * uTaille * (120.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying vec3 vC; varying float vD;
      void main() { float d = length(gl_PointCoord - 0.5); float a = 1.0 - smoothstep(0.15, 0.45, d); gl_FragColor = vec4(vC, a * mix(0.7, 0.1, vD)); }`,
  });
  scene.add(new THREE.Points(geoA, matA));

  // ── Le cadran façon Jarvis (MagistrIA) : anneaux qui se tracent et tournent ──
  const anneaux: Array<{ o: TROIS.LineSegments; vitesse: number; u: { uReveal: { value: number }; uAlpha: { value: number } } }> = [];
  if (marque === 'magistria') {
    const SIDE = `vec3 sideColor(float x){ float k = smoothstep(-1.3, 1.5, x); return mix(vec3(0.10, 0.70, 1.0), vec3(1.0, 0.45, 0.08), k); }`;
    const definir = (r: number, segments: Array<[number, number]>, graduations: number, longueur: number, vitesse: number, alpha: number) => {
      const p: number[] = [];
      const a: number[] = [];
      for (const [d, f] of segments) {
        const n = Math.max(8, Math.round((f - d) * 90));
        for (let k = 0; k < n; k++) {
          const t0 = d + ((f - d) * k) / n;
          const t1 = d + ((f - d) * (k + 1)) / n;
          p.push(Math.cos(t0 * Math.PI * 2) * r, Math.sin(t0 * Math.PI * 2) * r, 0, Math.cos(t1 * Math.PI * 2) * r, Math.sin(t1 * Math.PI * 2) * r, 0);
          a.push(t0, t1);
        }
      }
      for (let k = 0; k < graduations; k++) {
        const t = k / graduations;
        const l = k % 5 === 0 ? longueur * 1.8 : longueur;
        p.push(Math.cos(t * Math.PI * 2) * r, Math.sin(t * Math.PI * 2) * r, 0, Math.cos(t * Math.PI * 2) * (r + l), Math.sin(t * Math.PI * 2) * (r + l), 0);
        a.push(t, t);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
      g.setAttribute('aAng', new THREE.Float32BufferAttribute(a, 1));
      const u = { uReveal: { value: 0 }, uAlpha: { value: alpha } };
      const m = new THREE.ShaderMaterial({
        uniforms: { ...u, uIntensite: U.uIntensite },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: `attribute float aAng; varying float vAng; varying float vX; void main(){ vAng = aAng; vec4 w = modelMatrix * vec4(position,1.0); vX = w.x; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: `${SIDE} uniform float uReveal, uAlpha, uIntensite; varying float vAng; varying float vX; void main(){ if (vAng > uReveal) discard; gl_FragColor = vec4(sideColor(vX), uAlpha * uIntensite); }`,
      });
      const o = new THREE.LineSegments(g, m);
      groupe.add(o);
      anneaux.push({ o, vitesse, u });
    };
    definir(2.75, [[0, 0.22], [0.3, 0.62], [0.7, 0.93]], 0, 0, 0.18, 0.75);
    definir(3.05, [[0, 1]], 120, 0.08, -0.09, 0.42);
    definir(3.45, [[0.05, 0.18], [0.27, 0.45], [0.55, 0.6], [0.66, 0.9]], 0, 0, 0.12, 0.6);
    definir(3.85, [], 60, 0.12, -0.05, 0.3);
    definir(4.2, [[0.1, 0.4], [0.6, 0.85]], 0, 0, 0.07, 0.35);
  }

  const visible = 2 * CAM_D * Math.tan((50 / 2) * (Math.PI / 180)); // hauteur vue au plan z = 0
  const parPixel = visible / H;

  return {
    rendre(e: EtatNoyau) {
      const cle = `${e.de}>${e.vers}`;
      if (cle !== paire) {
        attrDe.copyArray(forme(e.de));
        attrDe.needsUpdate = true;
        attrVers.copyArray(forme(e.vers));
        attrVers.needsUpdate = true;
        paire = cle;
      }
      U.uTime.value = e.t;
      U.uMorph.value = e.morph;
      U.uIntro.value = e.construction;
      U.uActivite.value = e.activite;
      U.uOnde.value = e.onde;
      U.uIntensite.value = e.intensite;
      // Une icône fait face ; une sphère, un cerveau, une galaxie tournent.
      const tourne = (f: Forme3D) => f === 'sphere' || f === 'cerveau' || f === 'galaxie';
      const rotLibre = e.t * 0.22;
      const rotIcone = Math.sin(e.t * 0.5) * 0.28;
      const r0 = tourne(e.de) ? rotLibre : rotIcone;
      const r1 = tourne(e.vers) ? rotLibre : rotIcone;
      const mm = Math.min(1, Math.max(0, e.morph));
      U.uRot.value = r0 + (r1 - r0) * (mm * mm * (3 - 2 * mm));
      const dens = (f: Forme3D) => (tourne(f) ? 1 : 0.3);
      U.uDensite.value = dens(e.de) + (dens(e.vers) - dens(e.de)) * mm;
      const echelle = (e.rayon * parPixel) / 2.1;
      groupe.scale.setScalar(echelle);
      groupe.position.set((e.cx - L / 2) * parPixel, -(e.cy - H / 2) * parPixel, 0);
      groupe.rotation.x = e.vers === 'galaxie' ? 0.45 * mm : 0;
      for (const a of anneaux) {
        a.o.rotation.z = e.t * a.vitesse * (1 + 2.5 * e.activite);
        a.u.uReveal.value = e.cadran;
      }
      bloom.strength = 0.45 + 0.35 * (e.onde > 0 ? 1 - e.onde : 0);
      composer.render();
      return toile;
    },
    detruire() {
      geo.dispose();
      geoA.dispose();
      mat.dispose();
      matA.dispose();
      composer.dispose();
      renderer.dispose();
    },
  };
}
