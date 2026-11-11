/**
 * Les outils extérieurs qui peuvent nourrir une vidéo : voix off, musique,
 * clips générés, texte par un modèle local. Côté serveur uniquement.
 *
 * Même règle que les réseaux sociaux (CLAUDE.md) : chaque identifiant vit en
 * variable d'environnement serveur — jamais `NEXT_PUBLIC_*`, jamais réaffiché,
 * jamais au dépôt — et chaque appel part d'un bouton pressé par Jonathan, pas
 * d'un automate. Ce que ces outils produisent passe par la médiathèque et par
 * la validation comme le reste.
 *
 * | Outil | Ce qu'il apporte | Variable |
 * |---|---|---|
 * | ElevenLabs | voix off française, plan par plan ; musique (Eleven Music) | `ELEVENLABS_API_KEY`, `ELEVENLABS_VOIX_VEOLT`, `ELEVENLABS_VOIX_MAGISTRIA` |
 * | Runway | clip vidéo à partir d'un visuel (image → vidéo, Gen-4) | `RUNWAY_API_KEY` |
 * | Ollama | réécriture et découpage par un modèle ouvert, sur la machine | `OLLAMA_URL`, `OLLAMA_MODELE` |
 * | Hugging Face | modèles ouverts hébergés (TTS, musique, image) | `HF_TOKEN` |
 *
 * Higgsfield et Suno n'ont pas de branchement direct ici : Higgsfield passe par
 * l'assistant (connecteur MCP) et Suno n'a pas d'API publique officielle —
 * leurs fichiers se déposent dans la médiathèque comme n'importe quel média.
 */

import type { EntiteSlug } from './marques';

export interface EtatFournisseur {
  id: 'elevenlabs' | 'runway' | 'ollama' | 'huggingface';
  nom: string;
  pret: boolean;
  role: string;
  manque?: string;
}

export function etatFournisseurs(): EtatFournisseur[] {
  const e = process.env;
  return [
    { id: 'elevenlabs', nom: 'ElevenLabs', pret: Boolean(e.ELEVENLABS_API_KEY), role: 'Voix off française plan par plan, musique', manque: e.ELEVENLABS_API_KEY ? undefined : 'ELEVENLABS_API_KEY' },
    { id: 'runway', nom: 'Runway', pret: Boolean(e.RUNWAY_API_KEY), role: 'Clip vidéo à partir d’un visuel (Gen-4)', manque: e.RUNWAY_API_KEY ? undefined : 'RUNWAY_API_KEY' },
    { id: 'ollama', nom: 'Ollama', pret: Boolean(e.OLLAMA_URL), role: 'Modèle ouvert local pour réécrire et découper', manque: e.OLLAMA_URL ? undefined : 'OLLAMA_URL' },
    { id: 'huggingface', nom: 'Hugging Face', pret: Boolean(e.HF_TOKEN), role: 'Modèles ouverts hébergés (voix, musique, image)', manque: e.HF_TOKEN ? undefined : 'HF_TOKEN' },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// ElevenLabs — voix off
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Une voix par marque, choisie dans la bibliothèque ElevenLabs et posée en
 * variable : Veolt plus énergique, MagistrIA posée et grave. Sans variable, une
 * voix multilingue de la bibliothèque publique.
 */
function voixDe(entite: EntiteSlug): string {
  const e = process.env;
  const choisie = entite === 'veolt' ? e.ELEVENLABS_VOIX_VEOLT : e.ELEVENLABS_VOIX_MAGISTRIA;
  return choisie || 'XB0fDUnXU5powFXDhCwa'; // « Charlotte », multilingue
}

/** Lit un texte en français et renvoie le MP3. */
export async function voixElevenLabs(texte: string, entite: EntiteSlug): Promise<Buffer> {
  const cle = process.env.ELEVENLABS_API_KEY;
  if (!cle) throw new Error('ELEVENLABS_API_KEY manquante côté serveur.');
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voixDe(entite)}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': cle, 'content-type': 'application/json', accept: 'audio/mpeg' },
    body: JSON.stringify({
      text: texte,
      model_id: 'eleven_multilingual_v2',
      language_code: 'fr',
      voice_settings: entite === 'veolt' ? { stability: 0.4, similarity_boost: 0.8, style: 0.35 } : { stability: 0.65, similarity_boost: 0.8, style: 0.1 },
    }),
  });
  if (!r.ok) throw new Error(`ElevenLabs a refusé la demande (${r.status}) : ${(await r.text()).slice(0, 200)}`);
  return Buffer.from(await r.arrayBuffer());
}

// ─────────────────────────────────────────────────────────────────────────────
// Runway — clip à partir d'un visuel
// ─────────────────────────────────────────────────────────────────────────────

const RUNWAY = 'https://api.dev.runwayml.com/v1';

/** Lance un clip image → vidéo ; renvoie l'identifiant de la tâche à suivre. */
export async function lancerClipRunway(imageUrlPublique: string, consigne: string, vertical: boolean): Promise<string> {
  const cle = process.env.RUNWAY_API_KEY;
  if (!cle) throw new Error('RUNWAY_API_KEY manquante côté serveur.');
  const r = await fetch(`${RUNWAY}/image_to_video`, {
    method: 'POST',
    headers: { authorization: `Bearer ${cle}`, 'content-type': 'application/json', 'X-Runway-Version': '2024-11-06' },
    body: JSON.stringify({ model: 'gen4_turbo', promptImage: imageUrlPublique, promptText: consigne.slice(0, 900), ratio: vertical ? '720:1280' : '1280:720', duration: 5 }),
  });
  if (!r.ok) throw new Error(`Runway a refusé la demande (${r.status}) : ${(await r.text()).slice(0, 200)}`);
  return ((await r.json()) as { id: string }).id;
}

/** État d'un clip Runway : en cours, prêt (avec l'adresse du fichier), ou en échec. */
export async function suivreClipRunway(id: string): Promise<{ etat: 'en-cours' | 'pret' | 'echec'; url?: string; raison?: string }> {
  const cle = process.env.RUNWAY_API_KEY;
  if (!cle) throw new Error('RUNWAY_API_KEY manquante côté serveur.');
  const r = await fetch(`${RUNWAY}/tasks/${encodeURIComponent(id)}`, { headers: { authorization: `Bearer ${cle}`, 'X-Runway-Version': '2024-11-06' } });
  if (!r.ok) return { etat: 'echec', raison: `Runway (${r.status})` };
  const t = (await r.json()) as { status: string; output?: string[]; failure?: string };
  if (t.status === 'SUCCEEDED' && t.output?.[0]) return { etat: 'pret', url: t.output[0] };
  if (t.status === 'FAILED' || t.status === 'CANCELLED') return { etat: 'echec', raison: t.failure ?? t.status };
  return { etat: 'en-cours' };
}

// ─────────────────────────────────────────────────────────────────────────────
// Ollama — modèle ouvert local
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Une réponse d'un modèle ouvert servi par Ollama (Mistral, Llama, Qwen…), en
 * JSON si `schema` est fourni. Utile en local, sans clé ni coût par appel ;
 * en production, il faut un Ollama joignable depuis Vercel.
 */
export async function texteOllama(systeme: string, demande: string, schema?: object): Promise<string> {
  const url = process.env.OLLAMA_URL;
  if (!url) throw new Error('OLLAMA_URL manquante côté serveur (ex. http://localhost:11434).');
  const r = await fetch(`${url.replace(/\/$/, '')}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model: process.env.OLLAMA_MODELE || 'mistral-small3.2',
      stream: false,
      ...(schema ? { format: schema } : {}),
      messages: [
        { role: 'system', content: systeme },
        { role: 'user', content: demande },
      ],
      options: { temperature: 0.4 },
    }),
  });
  if (!r.ok) throw new Error(`Ollama ne répond pas (${r.status}).`);
  return ((await r.json()) as { message?: { content?: string } }).message?.content ?? '';
}
