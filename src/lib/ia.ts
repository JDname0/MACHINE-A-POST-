/**
 * Assistance IA — l'outil propose une réécriture, Jonathan l'adopte ou non.
 *
 * Règles tenues ici, et à ne pas « simplifier » :
 *  - l'IA ne modifie **jamais** un post directement : elle dépose une
 *    proposition, qui n'entre dans le brouillon que sur « Adopter », et le post
 *    repasse alors « à relire ». La validation reste un geste humain ;
 *  - le prompt porte la marque **d'une seule entité** : jamais de contenu de
 *    l'autre, la cloison est éditoriale (règle 3 de CLAUDE.md) ;
 *  - les preuves interdites sont données à l'IA, **et** la proposition repasse
 *    ensuite par les mêmes garde-fous que tout brouillon : on ne fait pas
 *    confiance au modèle pour se contrôler lui-même ;
 *  - la clé vit en variable d'environnement serveur (`ANTHROPIC_API_KEY`),
 *    jamais `NEXT_PUBLIC_*`, jamais affichée.
 */

import Anthropic from '@anthropic-ai/sdk';
import { marque, JARGON_BANNI, type EntiteSlug } from './marques';
import { format } from './formats';
import type { Constat } from './garde-fous';
import type { LignePublication } from './requetes';

export const MODELE_IA = 'claude-opus-5-5';

export function iaDisponible(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export interface PropositionIA {
  accroche: string;
  corps: string;
  appel: string;
  hashtags: string;
  /** Ce que l'IA a changé et pourquoi, en deux ou trois phrases. */
  note: string;
}

const SCHEMA = {
  type: 'object',
  properties: {
    accroche: { type: 'string', description: 'Les premières lignes visibles avant troncature.' },
    corps: { type: 'string', description: 'Le développement, retours à la ligne compris.' },
    appel: { type: 'string', description: "L'appel à l'action final, une ou deux phrases." },
    hashtags: { type: 'string', description: 'Hashtags séparés par des espaces, ou chaîne vide.' },
    note: { type: 'string', description: 'Ce qui a changé et pourquoi, en deux ou trois phrases.' },
  },
  required: ['accroche', 'corps', 'appel', 'hashtags', 'note'],
  additionalProperties: false,
} as const;

/** Le cadre stable d'une entité : identique d'un post à l'autre, donc mis en cache. */
function cadreEntite(entite: EntiteSlug): string {
  const m = marque(entite);
  return [
    `Tu rédiges les publications de ${m.nomLong} (${m.nom}), en français.`,
    `Phrase fondatrice, à laquelle tout post doit se rattacher : « ${m.principe} »`,
    `Promesse éditoriale : ${m.promesseEditoriale}`,
    '',
    `Signature : ${m.signature}. Site : ${m.site}.`,
    '',
    'Piliers éditoriaux (et la preuve que chacun peut avancer) :',
    ...m.piliers.map((p) => `- ${p.slug} — ${p.nom} : ${p.contenu} Preuve : ${p.preuve}`),
    '',
    'Personas (à qui on parle, et ce qu’ils cherchent) :',
    ...m.personas.map((p) => `- ${p.slug} — ${p.nom} : ${p.douleur} Recherche type : « ${p.requeteType} »`),
    '',
    'Offres réelles (prix affichés, à citer exactement ou pas du tout) :',
    ...m.offres.map((o) => `- ${o.nom} — à partir de ${o.prixDepart}, pour ${o.acheteur}`),
    '',
    'Preuves que tu as le droit d’avancer :',
    ...m.preuvesAutorisees.map((x) => `- ${x}`),
    '',
    'Preuves INTERDITES — un post qui en contient est bloqué. Si le post en a besoin pour tenir, change l’angle :',
    ...m.preuvesInterdites.map((x) => `- ${x.libelle} : ${x.raison}`),
    '',
    'Contraintes de la marque :',
    ...m.contraintes.map((x) => `- ${x}`),
    '',
    `Expressions bannies : ${JARGON_BANNI.join(', ')}.`,
    'La marque parle en « nous » (page entreprise). Aucun chiffre, client, résultat ou citation inventé :',
    'si une information manque, écris autour, ou laisse un repère entre crochets [à compléter] que Jonathan remplira.',
  ].join('\n');
}

function demande(p: LignePublication, constats: Constat[], consigne: string): string {
  const f = format(p.format_slug);
  return [
    `Format : ${f.nom}. Plafond ${f.maxCaracteres} caractères, longueur utile ${f.utileMin}–${f.utileMax}.`,
    `Accroche : ${f.accrocheLibelle} (${f.accrocheMax} caractères maximum).`,
    'Ossature attendue :',
    ...f.ossature.map((e) => `- ${e.nom}${e.limite ? ` (≤ ${e.limite} car.)` : ''} : ${e.consigne}`),
    'Pièges du format :',
    ...f.pieges.map((x) => `- ${x}`),
    '',
    `Pilier : ${p.pilier}. Persona : ${p.persona ?? '—'}. Preuve prévue : ${p.preuve ?? '—'}.`,
    `Titre interne : ${p.titre ?? '—'}`,
    '',
    'Brouillon actuel :',
    '<accroche>', p.accroche, '</accroche>',
    '<corps>', p.corps, '</corps>',
    '<appel>', p.appel, '</appel>',
    '<hashtags>', p.hashtags, '</hashtags>',
    '',
    constats.length
      ? ['Constats du garde-fou sur ce brouillon (corrige d’abord les blocages) :', ...constats.map((c) => `- [${c.niveau}] ${c.regle} : ${c.message}`)].join('\n')
      : 'Le garde-fou ne relève rien sur ce brouillon.',
    '',
    consigne.trim()
      ? `Consigne de Jonathan pour cette réécriture : ${consigne.trim()}`
      : 'Réécris ce post pour qu’il soit plus net, plus concret et dans la bonne longueur, en gardant le fond.',
  ].join('\n');
}

/**
 * Demande une réécriture. Lève une erreur lisible en cas d'échec : l'action
 * serveur la renvoie telle quelle dans l'interface.
 */
export async function proposerReecriture(
  p: LignePublication,
  constats: Constat[],
  consigne = '',
): Promise<PropositionIA> {
  if (!iaDisponible()) throw new Error('ANTHROPIC_API_KEY manquante côté serveur.');
  const client = new Anthropic();
  const reponse = await client.beta.messages.create({
    model: MODELE_IA,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: SCHEMA } },
    system: [{ type: 'text', text: cadreEntite(p.entite as EntiteSlug), cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: demande(p, constats, consigne) }],
  });

  if (reponse.stop_reason === 'refusal') throw new Error('Le modèle a refusé cette demande. Reformule la consigne.');
  if (reponse.stop_reason === 'max_tokens') throw new Error('Réponse tronquée. Réessaie avec une consigne plus courte.');
  const texte = reponse.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
  const brut = JSON.parse(texte) as Partial<PropositionIA>;
  return {
    accroche: String(brut.accroche ?? ''),
    corps: String(brut.corps ?? ''),
    appel: String(brut.appel ?? ''),
    hashtags: String(brut.hashtags ?? ''),
    note: String(brut.note ?? ''),
  };
}

/** Un message d'erreur lisible dans l'interface, sans détail technique inutile. */
export function messageErreurIA(e: unknown): string {
  if (e instanceof Anthropic.AuthenticationError) return 'Clé ANTHROPIC_API_KEY refusée : vérifie la variable sur Vercel.';
  if (e instanceof Anthropic.RateLimitError) return 'Trop de demandes en même temps. Réessaie dans une minute.';
  if (e instanceof Anthropic.APIConnectionError) return 'Impossible de joindre l’API. Réessaie dans un instant.';
  if (e instanceof Anthropic.APIError) return `L’API a répondu une erreur (${e.status ?? '?'}). Réessaie.`;
  if (e instanceof SyntaxError) return 'Réponse illisible du modèle. Réessaie.';
  return e instanceof Error ? e.message : 'Erreur inconnue.';
}

export interface PlanIA {
  duree: number;
  texte: string;
  image: string;
}

const SCHEMA_PLANS = {
  type: 'object',
  properties: {
    plans: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          duree: { type: 'number', description: 'Durée du plan en secondes (2 à 6).' },
          texte: { type: 'string', description: 'Texte incrusté à l’écran, mot pour mot, 90 caractères au plus.' },
          image: { type: 'string', description: 'Ce qu’on voit à l’image, en une phrase, sans rien inventer.' },
        },
        required: ['duree', 'texte', 'image'],
        additionalProperties: false,
      },
    },
    note: { type: 'string', description: 'Le parti pris du montage, en une ou deux phrases.' },
  },
  required: ['plans', 'note'],
  additionalProperties: false,
} as const;

/**
 * Propose les plans d'une vidéo à partir d'un post. Même cadre de marque que
 * la réécriture (preuves interdites comprises) ; la proposition arrive dans le
 * studio, où Jonathan la relit et la retouche avant de fabriquer quoi que ce soit.
 */
export async function proposerPlans(
  p: LignePublication,
  duree: { conseil: [number, number]; pourquoi: string } | null,
  consigne = '',
): Promise<{ plans: PlanIA[]; note: string }> {
  if (!iaDisponible()) throw new Error('ANTHROPIC_API_KEY manquante côté serveur.');
  const f = format(p.format_slug);
  const client = new Anthropic();
  const demandePlans = [
    `Écris le découpage d'une vidéo ${f.nom}, à partir du post ci-dessous.`,
    duree ? `Durée totale visée : ${duree.conseil[0]} à ${duree.conseil[1]} secondes (${duree.pourquoi}).` : '',
    'Règles : lecture muette, donc chaque plan porte un texte incrusté court (90 caractères au plus) ;',
    'les trois premières secondes portent le sujet, sans générique ni logo ; 4 à 7 plans ;',
    'le dernier plan est l’appel à l’action. Aucune preuve interdite, aucun chiffre ni client inventé.',
    '',
    `Titre : ${p.titre ?? '—'}`,
    '<accroche>', p.accroche, '</accroche>',
    '<corps>', p.corps, '</corps>',
    '<appel>', p.appel, '</appel>',
    consigne.trim() ? `\nConsigne de Jonathan : ${consigne.trim()}` : '',
  ].join('\n');
  const reponse = await client.beta.messages.create({
    model: MODELE_IA,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: SCHEMA_PLANS } },
    system: [{ type: 'text', text: cadreEntite(p.entite as EntiteSlug), cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: demandePlans }],
  });
  if (reponse.stop_reason === 'refusal') throw new Error('Le modèle a refusé cette demande. Reformule la consigne.');
  if (reponse.stop_reason === 'max_tokens') throw new Error('Réponse tronquée. Réessaie.');
  const texte = reponse.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
  const brut = JSON.parse(texte) as { plans?: Array<Partial<PlanIA>>; note?: string };
  const plans = (brut.plans ?? [])
    .map((x) => ({
      duree: Math.min(8, Math.max(1.5, Number(x.duree) || 3)),
      texte: String(x.texte ?? '').slice(0, 140),
      image: String(x.image ?? ''),
    }))
    .filter((x) => x.texte);
  if (!plans.length) throw new Error('Aucun plan exploitable dans la réponse. Réessaie.');
  return { plans, note: String(brut.note ?? '') };
}
