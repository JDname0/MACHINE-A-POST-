/**
 * La bande-son des vidéos, fabriquée dans le navigateur : une musique propre à
 * chaque marque et des bruitages calés à l'image près sur ce qui se passe à
 * l'écran (frappe au clavier, clic, notification, coche, révélation du logo…).
 *
 * Tout est synthétisé (OfflineAudioContext) : aucun fichier sous licence,
 * aucun service tiers, et la même vidéo ressort avec le même son. Une voix off
 * (ElevenLabs, Higgsfield…) peut s'y ajouter : la musique s'efface alors sous
 * la voix (« ducking »).
 *
 * Les repères viennent du dessin lui-même (voir `Env.repere` dans
 * rendu-scenes.ts) : chaque scène déclare ses instants, donc le son suit le
 * montage quoi qu'on change dans le studio.
 *
 * Module navigateur uniquement.
 */

export type TypeRepere =
  | 'transition'
  | 'frappe'
  | 'clic'
  | 'notif'
  | 'coche'
  | 'pop'
  | 'whoosh'
  | 'impact'
  | 'montee'
  | 'brouillage'
  | 'compteur'
  | 'papier'
  | 'succes'
  | 'erreur'
  | 'scintille'
  | 'defile';

export interface Repere {
  type: TypeRepere;
  /** Instant de départ, en secondes depuis le début de la vidéo. */
  t: number;
  /** Fin, pour les sons qui durent (frappe, montée, brouillage, compteur). */
  fin?: number;
}

export interface VoixOff {
  /** Début de la voix dans la vidéo, en secondes. */
  t: number;
  /** Le fichier audio (MP3, WAV…), lu par le navigateur. */
  url: string;
}

export interface OptionsSon {
  musique: boolean;
  bruitages: boolean;
  /** La musique et le grain des bruitages suivent la marque. */
  style: 'veolt' | 'magistria';
  /** 0 à 1 ; 0,55 par défaut — la musique porte, elle ne couvre pas. */
  volumeMusique?: number;
  voix?: VoixOff[];
}

export const SON_PAR_DEFAUT: Pick<OptionsSon, 'musique' | 'bruitages'> = { musique: true, bruitages: true };

export const FREQ = 48000;

/** Pseudo-aléatoire déterministe (mulberry32) : même vidéo, même son. */
function graine(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const note = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

/** Réverbération synthétique : un bruit stéréo qui décroît — l'espace, sans fichier d'impulsion. */
function reverbe(ac: BaseAudioContext, duree: number, decroissance: number, alea: () => number): AudioBuffer {
  const n = Math.floor(ac.sampleRate * duree);
  const b = ac.createBuffer(2, n, ac.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = b.getChannelData(c);
    for (let i = 0; i < n; i++) d[i] = (alea() * 2 - 1) * Math.pow(1 - i / n, decroissance);
  }
  return b;
}

function bruit(ac: BaseAudioContext, duree: number, alea: () => number): AudioBuffer {
  const n = Math.max(1, Math.floor(ac.sampleRate * duree));
  const b = ac.createBuffer(1, n, ac.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = alea() * 2 - 1;
  return b;
}

interface Bus {
  ac: OfflineAudioContext;
  musique: GainNode;
  bruitages: GainNode;
  rev: ConvolverNode;
  alea: () => number;
  bruitBlanc: AudioBuffer;
}

// ─────────────────────────────────────────────────────────────────────────────
// Musique
// ─────────────────────────────────────────────────────────────────────────────

/** Enveloppe d'un son : attaque, maintien, relâche — sans clic. */
function enveloppe(g: GainNode, t: number, attaque: number, niveau: number, maintien: number, relache: number) {
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(niveau, t + attaque);
  g.gain.setValueAtTime(niveau, t + attaque + maintien);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attaque + maintien + relache);
}

function voixSynthe(b: Bus, dest: AudioNode, freq: number, t: number, duree: number, o: { type: OscillatorType; niveau: number; attaque: number; relache: number; desaccord?: number; filtre?: number; pan?: number }) {
  const { ac } = b;
  const g = ac.createGain();
  enveloppe(g, t, o.attaque, o.niveau, Math.max(0, duree - o.attaque), o.relache);
  let sortieNode: AudioNode = g;
  if (o.pan) {
    const p = ac.createStereoPanner();
    p.pan.value = o.pan;
    g.connect(p);
    sortieNode = p;
  }
  if (o.filtre) {
    const f = ac.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = o.filtre;
    f.Q.value = 0.6;
    f.connect(g);
    sortieNode.connect(dest);
    for (const d of o.desaccord ? [-o.desaccord, o.desaccord] : [0]) {
      const osc = ac.createOscillator();
      osc.type = o.type;
      osc.frequency.value = freq;
      osc.detune.value = d;
      osc.connect(f);
      osc.start(t);
      osc.stop(t + duree + o.relache + 0.05);
    }
    return;
  }
  sortieNode.connect(dest);
  for (const d of o.desaccord ? [-o.desaccord, o.desaccord] : [0]) {
    const osc = ac.createOscillator();
    osc.type = o.type;
    osc.frequency.value = freq;
    osc.detune.value = d;
    osc.connect(g);
    osc.start(t);
    osc.stop(t + duree + o.relache + 0.05);
  }
}

/** Grosse caisse : une sinusoïde qui tombe en fréquence. */
function caisse(b: Bus, dest: AudioNode, t: number, niveau: number) {
  const { ac } = b;
  const o = ac.createOscillator();
  o.frequency.setValueAtTime(150, t);
  o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
  const g = ac.createGain();
  g.gain.setValueAtTime(niveau, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
  o.connect(g).connect(dest);
  o.start(t);
  o.stop(t + 0.45);
}

function souffle(b: Bus, dest: AudioNode, t: number, duree: number, o: { type: BiquadFilterType; freq: number; q?: number; niveau: number; pan?: number; attaque?: number }) {
  const { ac } = b;
  const s = ac.createBufferSource();
  s.buffer = b.bruitBlanc;
  const f = ac.createBiquadFilter();
  f.type = o.type;
  f.frequency.value = o.freq;
  f.Q.value = o.q ?? 0.8;
  const g = ac.createGain();
  enveloppe(g, t, o.attaque ?? 0.002, o.niveau, 0, duree);
  let n: AudioNode = s.connect(f).connect(g);
  if (o.pan) {
    const p = ac.createStereoPanner();
    p.pan.value = o.pan;
    n = n.connect(p);
  }
  n.connect(dest);
  const debut = b.alea() * Math.max(0, (b.bruitBlanc.duration - duree - 0.1));
  s.start(t, debut, duree + 0.05);
}

/**
 * Veolt : électronique tendue, 112 BPM, fa mineur (i – VI – III – VII), basse
 * pulsée qui « respire » sur la caisse, arpège en écho, pads larges — le son
 * d'un lancement, comme le champ de particules du site.
 */
function musiqueVeolt(b: Bus, duree: number) {
  const { ac } = b;
  const bpm = 112;
  const temps = 60 / bpm;
  const mesure = temps * 4;
  const accords = [
    [53, 56, 60, 63], // Fm(7)
    [49, 53, 56, 60], // Db(maj7)
    [56, 60, 63, 67], // Ab(maj7)
    [51, 55, 58, 62], // Eb(maj7)
  ];
  const basses = [41, 37, 44, 39];
  const pompe = ac.createGain(); // le « sidechain » : tout sauf la caisse respire au temps
  pompe.connect(b.musique);
  const echo = ac.createDelay(1);
  echo.delayTime.value = temps * 0.75;
  const retour = ac.createGain();
  retour.gain.value = 0.32;
  const echoFiltre = ac.createBiquadFilter();
  echoFiltre.type = 'lowpass';
  echoFiltre.frequency.value = 2600;
  echo.connect(echoFiltre).connect(retour).connect(echo);
  echoFiltre.connect(pompe);
  const versRev = ac.createGain();
  versRev.gain.value = 0.28;
  versRev.connect(b.rev);

  const fin = duree - 0.2;
  const nbMesures = Math.ceil(duree / mesure) + 1;
  for (let m = 0; m < nbMesures; m++) {
    const t0 = m * mesure;
    if (t0 > fin) break;
    const k = m % 4;
    const ac0 = accords[k];
    // Pads : trois scies désaccordées, filtrées.
    for (const n of ac0) voixSynthe(b, pompe, note(n), t0, mesure, { type: 'sawtooth', niveau: 0.028, attaque: 0.35, relache: 0.6, desaccord: 9, filtre: 1100 + 500 * Math.sin(m * 0.7) });
    for (const n of ac0.slice(0, 2)) voixSynthe(b, versRev, note(n + 12), t0, mesure, { type: 'triangle', niveau: 0.02, attaque: 0.5, relache: 0.8 });
    const aRythme = m >= 1;
    for (let q = 0; q < 16; q++) {
      const t = t0 + (q * temps) / 4;
      if (t > fin) break;
      // Basse en croches, coupée sur le temps (place pour la caisse).
      if (q % 2 === 1 || (q % 4 === 2 && m >= 2)) voixSynthe(b, pompe, note(basses[k]), t, temps / 2 - 0.02, { type: 'sawtooth', niveau: 0.11, attaque: 0.004, relache: 0.06, filtre: 340 });
      // Arpège en doubles croches, dans l'écho.
      if (m >= 1 || q >= 8) {
        const n = ac0[[0, 2, 1, 3, 2, 0, 3, 1][q % 8]] + 12;
        const g = ac.createGain();
        enveloppe(g, t, 0.003, 0.05, 0.02, 0.16);
        const f = ac.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.setValueAtTime(3800, t);
        f.frequency.exponentialRampToValueAtTime(700, t + 0.18);
        const p = ac.createStereoPanner();
        p.pan.value = q % 2 ? 0.35 : -0.35;
        const o = ac.createOscillator();
        o.type = 'square';
        o.frequency.value = note(n);
        o.connect(f).connect(g).connect(p);
        p.connect(pompe);
        p.connect(echo);
        o.start(t);
        o.stop(t + 0.25);
      }
      if (!aRythme) continue;
      // Caisse sur chaque temps, claquement sur 2 et 4, charleston à contretemps.
      if (q % 4 === 0) {
        caisse(b, b.musique, t, 0.5);
        pompe.gain.setValueAtTime(0.35, t);
        pompe.gain.linearRampToValueAtTime(1, t + temps * 0.6);
      }
      if (q % 8 === 4) souffle(b, b.musique, t, 0.16, { type: 'bandpass', freq: 1700, q: 0.9, niveau: 0.16 });
      if (q % 4 === 2) souffle(b, b.musique, t, 0.05, { type: 'highpass', freq: 7500, niveau: 0.07, pan: 0.2 });
      if (q % 2 === 1 && m % 2 === 1) souffle(b, b.musique, t, 0.03, { type: 'highpass', freq: 9000, niveau: 0.035, pan: -0.25 });
    }
  }
}

/**
 * MagistrIA : calme et précis, 76 BPM, ré majeur (Dmaj9 – Bm9 – Gmaj7 – A6/9),
 * nappes douces, piano de verre en notes rares dans une grande réverbération,
 * pulsation feutrée — l'écoute d'un cabinet, pas une publicité.
 */
function musiqueMagistria(b: Bus, duree: number) {
  const { ac } = b;
  const bpm = 76;
  const temps = 60 / bpm;
  const mesure = temps * 4;
  const accords = [
    [50, 57, 61, 64, 66], // Dmaj9
    [47, 54, 57, 61, 62], // Bm9
    [43, 50, 54, 57, 59], // Gmaj7
    [45, 52, 57, 59, 61], // A6/9
  ];
  const versRev = ac.createGain();
  versRev.gain.value = 0.55;
  versRev.connect(b.rev);
  const sec = ac.createGain();
  sec.gain.value = 0.75;
  sec.connect(b.musique);
  const fin = duree - 0.2;
  const nbMesures = Math.ceil(duree / mesure) + 1;
  const motif = [4, 2, 3, 1, 4, 3, 2, 0];
  for (let m = 0; m < nbMesures; m++) {
    const t0 = m * mesure;
    if (t0 > fin) break;
    const ac0 = accords[m % 4];
    // Nappe : sinus + triangle, attaque lente.
    for (const n of ac0.slice(1)) {
      voixSynthe(b, sec, note(n), t0, mesure, { type: 'sine', niveau: 0.03, attaque: 1.2, relache: 1.4, desaccord: 5 });
      voixSynthe(b, versRev, note(n), t0, mesure, { type: 'triangle', niveau: 0.012, attaque: 1.5, relache: 1.5, filtre: 1400 });
    }
    voixSynthe(b, sec, note(ac0[0] - 12), t0, mesure, { type: 'sine', niveau: 0.09, attaque: 0.4, relache: 0.8 });
    // Piano de verre : modulation de fréquence, attaque nette, longue chute.
    for (let q = 0; q < 8; q++) {
      const t = t0 + (q * temps) / 2;
      if (t > fin || (m === 0 && q < 4)) continue;
      if (b.alea() < 0.42) continue;
      const n = ac0[motif[(q + m) % 8]] + 12;
      const porteuse = ac.createOscillator();
      porteuse.frequency.value = note(n);
      const mod = ac.createOscillator();
      mod.frequency.value = note(n) * 2;
      const modG = ac.createGain();
      modG.gain.setValueAtTime(note(n) * 1.6, t);
      modG.gain.exponentialRampToValueAtTime(1, t + 0.8);
      mod.connect(modG).connect(porteuse.frequency);
      const g = ac.createGain();
      enveloppe(g, t, 0.004, 0.055, 0.05, 1.6);
      const p = ac.createStereoPanner();
      p.pan.value = (b.alea() - 0.5) * 0.7;
      porteuse.connect(g).connect(p);
      p.connect(sec);
      p.connect(versRev);
      porteuse.start(t);
      mod.start(t);
      porteuse.stop(t + 1.8);
      mod.stop(t + 1.8);
    }
    // Pulsation feutrée à partir de la troisième mesure.
    if (m >= 2) {
      for (let q = 0; q < 4; q++) {
        const t = t0 + q * temps;
        if (t > fin) break;
        const o = ac.createOscillator();
        o.frequency.setValueAtTime(95, t);
        o.frequency.exponentialRampToValueAtTime(50, t + 0.1);
        const g = ac.createGain();
        g.gain.setValueAtTime(q === 0 ? 0.16 : 0.08, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
        o.connect(g).connect(b.musique);
        o.start(t);
        o.stop(t + 0.32);
        if (q % 2 === 1) souffle(b, b.musique, t, 0.04, { type: 'highpass', freq: 8000, niveau: 0.025 });
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Bruitages
// ─────────────────────────────────────────────────────────────────────────────

function bip(b: Bus, t: number, f0: number, f1: number, duree: number, niveau: number, type: OscillatorType = 'sine', pan = 0, versRev = 0) {
  const { ac } = b;
  const o = ac.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + duree * 0.6);
  const g = ac.createGain();
  enveloppe(g, t, 0.003, niveau, 0, duree);
  const p = ac.createStereoPanner();
  p.pan.value = pan;
  o.connect(g).connect(p).connect(b.bruitages);
  if (versRev) {
    const r = ac.createGain();
    r.gain.value = versRev;
    p.connect(r).connect(b.rev);
  }
  o.start(t);
  o.stop(t + duree + 0.05);
}

function balayage(b: Bus, t: number, duree: number, f0: number, f1: number, niveau: number, panDe = -0.6, panA = 0.6) {
  const { ac } = b;
  const s = ac.createBufferSource();
  s.buffer = b.bruitBlanc;
  const f = ac.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = 1.2;
  f.frequency.setValueAtTime(f0, t);
  f.frequency.exponentialRampToValueAtTime(f1, t + duree);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(niveau, t + duree * 0.55);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  const p = ac.createStereoPanner();
  p.pan.setValueAtTime(panDe, t);
  p.pan.linearRampToValueAtTime(panA, t + duree);
  s.connect(f).connect(g).connect(p).connect(b.bruitages);
  const r = ac.createGain();
  r.gain.value = 0.25;
  p.connect(r).connect(b.rev);
  s.start(t, b.alea() * 2, duree + 0.05);
}

function bruitage(b: Bus, r: Repere, style: OptionsSon['style']) {
  const v = style === 'veolt';
  const t = Math.max(0, r.t);
  const a = b.alea;
  switch (r.type) {
    case 'transition':
      balayage(b, Math.max(0, t - 0.18), 0.36, v ? 500 : 900, v ? 5200 : 2600, v ? 0.5 : 0.22);
      if (v) caisse(b, b.bruitages, t, 0.22);
      break;
    case 'whoosh':
      balayage(b, Math.max(0, t - 0.1), 0.42, 2800, 400, v ? 0.4 : 0.22, 0.5, -0.5);
      break;
    case 'frappe': {
      // Le clavier : des touches à intervalle irrégulier, chacune légèrement différente.
      const fin = r.fin ?? t + 1;
      for (let x = t; x < fin; x += 0.055 + a() * 0.06) {
        souffle(b, b.bruitages, x, 0.018, { type: 'highpass', freq: 2200 + a() * 1500, niveau: 0.12 + a() * 0.08, pan: (a() - 0.5) * 0.3 });
        bip(b, x, 1800 + a() * 900, 1800, 0.012, 0.02, 'triangle');
      }
      break;
    }
    case 'clic':
      souffle(b, b.bruitages, t, 0.012, { type: 'highpass', freq: 3000, niveau: 0.35 });
      souffle(b, b.bruitages, t + 0.07, 0.01, { type: 'highpass', freq: 4000, niveau: 0.22 });
      bip(b, t, 2400, 2400, 0.01, 0.06, 'square');
      break;
    case 'notif':
      if (v) {
        bip(b, t, note(84), note(84), 0.25, 0.14, 'triangle', 0.15, 0.3);
        bip(b, t + 0.09, note(91), note(91), 0.35, 0.12, 'triangle', 0.15, 0.3);
      } else {
        bip(b, t, note(88), note(88), 0.6, 0.09, 'sine', -0.1, 0.5);
        bip(b, t + 0.11, note(93), note(93), 0.8, 0.08, 'sine', 0.1, 0.5);
      }
      break;
    case 'coche':
      bip(b, t, note(v ? 79 : 81), note(v ? 86 : 88), 0.22, 0.11, v ? 'triangle' : 'sine', 0, 0.35);
      break;
    case 'pop':
      bip(b, t, 380, 920, 0.08, v ? 0.16 : 0.1, 'sine', (a() - 0.5) * 0.4, 0.15);
      break;
    case 'impact': {
      const { ac } = b;
      const o = ac.createOscillator();
      o.frequency.setValueAtTime(90, t);
      o.frequency.exponentialRampToValueAtTime(32, t + 1.1);
      const g = ac.createGain();
      g.gain.setValueAtTime(v ? 0.75 : 0.45, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
      o.connect(g).connect(b.bruitages);
      o.start(t);
      o.stop(t + 1.7);
      souffle(b, b.bruitages, t, 0.9, { type: 'lowpass', freq: 900, niveau: v ? 0.35 : 0.16 });
      // L'éclat qui suit : une poussière cristalline dans la réverbération.
      for (let k = 0; k < 7; k++) bip(b, t + 0.05 + k * 0.045, note(96 + [0, 4, 7, 12, 7, 16, 19][k]), note(96 + [0, 4, 7, 12, 7, 16, 19][k]), 0.9, 0.03, 'sine', (a() - 0.5) * 0.8, 0.8);
      break;
    }
    case 'montee': {
      const fin = Math.max(t + 0.4, r.fin ?? t + 1.5);
      const d = fin - t;
      const { ac } = b;
      const s = ac.createBufferSource();
      s.buffer = b.bruitBlanc;
      const f = ac.createBiquadFilter();
      f.type = 'bandpass';
      f.Q.value = 2;
      f.frequency.setValueAtTime(300, t);
      f.frequency.exponentialRampToValueAtTime(7000, fin);
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v ? 0.45 : 0.22, fin - 0.02);
      g.gain.linearRampToValueAtTime(0, fin);
      s.connect(f).connect(g).connect(b.bruitages);
      s.start(t, 0, d + 0.05);
      const o = ac.createOscillator();
      o.type = v ? 'sawtooth' : 'sine';
      o.frequency.setValueAtTime(110, t);
      o.frequency.exponentialRampToValueAtTime(880, fin);
      const go = ac.createGain();
      go.gain.setValueAtTime(0.0001, t);
      go.gain.exponentialRampToValueAtTime(v ? 0.06 : 0.04, fin - 0.02);
      go.gain.linearRampToValueAtTime(0, fin);
      const fo = ac.createBiquadFilter();
      fo.type = 'lowpass';
      fo.frequency.value = 2400;
      o.connect(fo).connect(go).connect(b.bruitages);
      o.start(t);
      o.stop(fin + 0.05);
      break;
    }
    case 'brouillage': {
      // Le décodage des lettres de veolt.fr : des éclats numériques serrés.
      const fin = r.fin ?? t + 0.5;
      for (let x = t; x < fin; x += 0.028 + a() * 0.02) bip(b, x, 2000 + a() * 4000, 2000 + a() * 4000, 0.014, 0.025, 'square', (a() - 0.5) * 0.6);
      break;
    }
    case 'compteur': {
      const fin = r.fin ?? t + 1;
      let x = t;
      let pas = 0.035;
      while (x < fin) {
        bip(b, x, 3200, 3200, 0.01, 0.05, 'square');
        x += pas;
        pas *= 1.07;
      }
      bip(b, fin, note(84), note(91), 0.3, 0.1, 'triangle', 0, 0.3);
      break;
    }
    case 'papier':
      souffle(b, b.bruitages, t, 0.22, { type: 'bandpass', freq: 2500 + a() * 1500, q: 0.7, niveau: 0.18, attaque: 0.03, pan: (a() - 0.5) * 0.5 });
      souffle(b, b.bruitages, t + 0.16, 0.06, { type: 'lowpass', freq: 500, niveau: 0.2 });
      break;
    case 'succes':
      [72, 76, 79, 84].forEach((n, k) => bip(b, t + k * 0.07, note(n + (v ? 0 : 2)), note(n + (v ? 0 : 2)), 0.5, 0.07, v ? 'triangle' : 'sine', 0, 0.45));
      break;
    case 'erreur':
      bip(b, t, 220, 180, 0.22, 0.1, 'sawtooth');
      bip(b, t + 0.12, 180, 150, 0.22, 0.08, 'sawtooth');
      break;
    case 'scintille': {
      const fin = r.fin ?? t + 1;
      for (let x = t; x < fin; x += 0.12 + a() * 0.12) bip(b, x, note(90 + Math.floor(a() * 12)), note(90), 0.4, 0.018, 'sine', (a() - 0.5) * 0.8, 0.6);
      break;
    }
    case 'defile':
      balayage(b, t, 0.3, 1200, 2400, 0.08, 0, 0);
      break;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Assemblage
// ─────────────────────────────────────────────────────────────────────────────

/** Fabrique la bande-son complète (stéréo, 48 kHz) de `duree` secondes. */
export async function composerBandeSon(duree: number, reperes: Repere[], o: OptionsSon): Promise<AudioBuffer> {
  const n = Math.ceil(FREQ * (duree + 0.05));
  const ac = new OfflineAudioContext(2, n, FREQ);
  const alea = graine(o.style === 'veolt' ? 7331 : 1337);

  const maitre = ac.createDynamicsCompressor();
  maitre.threshold.value = -14;
  maitre.ratio.value = 3;
  maitre.attack.value = 0.01;
  maitre.release.value = 0.2;
  const sortieG = ac.createGain();
  sortieG.gain.value = 0.9;
  maitre.connect(sortieG).connect(ac.destination);

  const musique = ac.createGain();
  const vol = o.volumeMusique ?? 0.55;
  musique.gain.setValueAtTime(0, 0);
  musique.gain.linearRampToValueAtTime(vol, 0.6);
  musique.gain.setValueAtTime(vol, Math.max(0.7, duree - 1.4));
  musique.gain.linearRampToValueAtTime(0, duree);
  musique.connect(maitre);
  const bruitages = ac.createGain();
  bruitages.gain.value = 0.8;
  bruitages.connect(maitre);
  const rev = ac.createConvolver();
  rev.buffer = reverbe(ac, o.style === 'veolt' ? 1.6 : 2.8, o.style === 'veolt' ? 3 : 2.2, alea);
  const revG = ac.createGain();
  revG.gain.value = 0.5;
  rev.connect(revG).connect(maitre);

  const b: Bus = { ac, musique, bruitages, rev, alea, bruitBlanc: bruit(ac, 4, alea) };

  if (o.musique) {
    if (o.style === 'veolt') musiqueVeolt(b, duree);
    else musiqueMagistria(b, duree);
  }
  if (o.bruitages) {
    const tries = [...reperes].sort((x, y) => x.t - y.t);
    for (const r of tries) if (r.t < duree) bruitage(b, r, o.style);
  }

  // Voix off : elle passe devant, la musique s'efface sous elle.
  for (const v of o.voix ?? []) {
    try {
      const donnees = await (await fetch(v.url)).arrayBuffer();
      const buf = await ac.decodeAudioData(donnees);
      const s = ac.createBufferSource();
      s.buffer = buf;
      const g = ac.createGain();
      g.gain.value = 1.15;
      s.connect(g).connect(maitre);
      s.start(Math.max(0, v.t));
      const fin = Math.min(duree, v.t + buf.duration);
      musique.gain.setTargetAtTime(vol * 0.32, Math.max(0, v.t - 0.15), 0.08);
      musique.gain.setTargetAtTime(vol, fin + 0.1, 0.25);
    } catch {
      // Une voix illisible ne bloque pas la vidéo : elle sort sans.
    }
  }

  return normaliser(await ac.startRendering(), -14);
}

/**
 * Loudness intégrée selon BS.1770 (celle que mesurent les réseaux) : filtre
 * de pondération K (plateau haut +4 dB vers 1,7 kHz, coupe-bas à 38 Hz), blocs
 * de 400 ms, porte absolue à −70 LUFS puis relative à −10 LU.
 */
async function loudness(b: AudioBuffer): Promise<number> {
  const ac = new OfflineAudioContext(b.numberOfChannels, b.length, b.sampleRate);
  const s = ac.createBufferSource();
  s.buffer = b;
  const plateau = ac.createBiquadFilter();
  plateau.type = 'highshelf';
  plateau.frequency.value = 1681;
  plateau.gain.value = 4;
  const coupe = ac.createBiquadFilter();
  coupe.type = 'highpass';
  coupe.frequency.value = 38;
  coupe.Q.value = 0.5;
  s.connect(plateau).connect(coupe).connect(ac.destination);
  s.start();
  const k = await ac.startRendering();
  const bloc = Math.floor(b.sampleRate * 0.4);
  const pas = Math.floor(bloc / 4);
  const canaux = Array.from({ length: k.numberOfChannels }, (_, c) => k.getChannelData(c));
  const puissances: number[] = [];
  for (let i = 0; i + bloc <= k.length; i += pas) {
    let somme = 0;
    for (const d of canaux) for (let j = i; j < i + bloc; j++) somme += d[j] * d[j];
    puissances.push(somme / bloc);
  }
  const lufs = (p: number) => -0.691 + 10 * Math.log10(Math.max(p, 1e-12));
  const absolus = puissances.filter((p) => lufs(p) > -70);
  if (!absolus.length) return -70;
  const moyenne = absolus.reduce((a, b2) => a + b2, 0) / absolus.length;
  const relatifs = absolus.filter((p) => lufs(p) > lufs(moyenne) - 10);
  return lufs(relatifs.reduce((a, b2) => a + b2, 0) / Math.max(1, relatifs.length));
}

/**
 * Ramène la bande-son au niveau des réseaux (−14 LUFS : Instagram, TikTok,
 * YouTube normalisent autour de cette valeur) ; un limiteur doux garde les
 * crêtes sous −1 dBFS. Sans ça, la vidéo sonnerait deux fois plus bas que
 * celle d'avant dans le fil.
 */
export async function normaliser(b: AudioBuffer, cible: number): Promise<AudioBuffer> {
  const mesure = await loudness(b);
  if (mesure <= -69) return b;
  const gain = Math.min(10 ** ((cible - mesure) / 20), 12);
  const seuil = 0.75;
  const plafond = 0.89 - seuil;
  for (let c = 0; c < b.numberOfChannels; c++) {
    const d = b.getChannelData(c);
    for (let i = 0; i < d.length; i++) {
      const x = d[i] * gain;
      const ax = Math.abs(x);
      d[i] = ax <= seuil ? x : Math.sign(x) * (seuil + plafond * Math.tanh((ax - seuil) / plafond));
    }
  }
  return b;
}

/** Repères dédoublonnés : chaque scène redéclare ses instants à chaque image. */
export class CollecteReperes {
  private vus = new Set<string>();
  readonly liste: Repere[] = [];
  ajouter(r: Repere) {
    const cle = `${r.type}@${Math.round(r.t * 50)}`;
    if (this.vus.has(cle)) return;
    this.vus.add(cle);
    this.liste.push(r);
  }
}

/** Le son en WAV 16 bits : pour After Effects, Premiere ou un montage à la main. */
export function enWav(b: AudioBuffer): Blob {
  const nc = b.numberOfChannels;
  const n = b.length;
  const octets = 44 + n * nc * 2;
  const v = new DataView(new ArrayBuffer(octets));
  const ecrire = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  ecrire(0, 'RIFF');
  v.setUint32(4, octets - 8, true);
  ecrire(8, 'WAVE');
  ecrire(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, nc, true);
  v.setUint32(24, b.sampleRate, true);
  v.setUint32(28, b.sampleRate * nc * 2, true);
  v.setUint16(32, nc * 2, true);
  v.setUint16(34, 16, true);
  ecrire(36, 'data');
  v.setUint32(40, n * nc * 2, true);
  const canaux = Array.from({ length: nc }, (_, c) => b.getChannelData(c));
  let o = 44;
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < nc; c++) {
      const x = Math.max(-1, Math.min(1, canaux[c][i]));
      v.setInt16(o, x < 0 ? x * 0x8000 : x * 0x7fff, true);
      o += 2;
    }
  }
  return new Blob([v.buffer], { type: 'audio/wav' });
}

/** Le meilleur codec audio que ce navigateur sait encoder pour un MP4 : AAC, sinon Opus. */
export async function codecAudio(): Promise<{ webcodecs: string; muxer: 'aac' | 'opus' } | null> {
  if (!('AudioEncoder' in window)) return null;
  for (const [webcodecs, muxer] of [
    ['mp4a.40.2', 'aac'],
    ['opus', 'opus'],
  ] as const) {
    try {
      const r = await AudioEncoder.isConfigSupported({ codec: webcodecs, sampleRate: FREQ, numberOfChannels: 2, bitrate: 192_000 });
      if (r.supported) return { webcodecs, muxer };
    } catch {
      /* codec suivant */
    }
  }
  return null;
}

/** Encode la bande-son et la verse dans le conteneur MP4. */
export async function encoderAudio(
  b: AudioBuffer,
  codec: string,
  verser: (chunk: EncodedAudioChunk, meta?: EncodedAudioChunkMetadata) => void,
): Promise<void> {
  let erreur: unknown = null;
  const enc = new AudioEncoder({ output: (c, m) => verser(c, m), error: (e) => (erreur = e) });
  enc.configure({ codec, sampleRate: b.sampleRate, numberOfChannels: b.numberOfChannels, bitrate: 192_000 });
  const pas = 1024;
  const g = b.getChannelData(0);
  const d = b.numberOfChannels > 1 ? b.getChannelData(1) : g;
  for (let i = 0; i < b.length; i += pas) {
    const n = Math.min(pas, b.length - i);
    const plan = new Float32Array(n * 2);
    plan.set(g.subarray(i, i + n), 0);
    plan.set(d.subarray(i, i + n), n);
    const ad = new AudioData({ format: 'f32-planar', sampleRate: b.sampleRate, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round((i / b.sampleRate) * 1e6), data: plan });
    enc.encode(ad);
    ad.close();
    if (erreur) throw erreur;
  }
  await enc.flush();
  if (erreur) throw erreur;
}
