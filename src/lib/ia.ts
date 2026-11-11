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

// ─────────────────────────────────────────────────────────────────────────────
// Article de blog à la demande
// ─────────────────────────────────────────────────────────────────────────────

export interface ArticleIA {
  titre: string;
  accroche: string;
  complement: string;
  pourquoi: string;
  sections: Array<{ question: string; texte: string }>;
  aRetenir: string[];
  enseignement: string;
  appel: string;
  pilier: string;
  persona: string;
  preuve: string;
  sources: string;
}

function schemaArticle(entite: EntiteSlug) {
  const m = marque(entite);
  return {
    type: 'object',
    properties: {
      titre: { type: 'string', description: 'Le titre, écrit comme la requête qu’un lecteur taperait (160 caractères au plus).' },
      accroche: { type: 'string', description: 'La réponse directe à la requête, en une ou deux phrases autonomes et citables telles quelles.' },
      complement: { type: 'string', description: 'Une ou deux phrases qui complètent la réponse (les cent premiers mots doivent suffire à répondre).' },
      pourquoi: { type: 'string', description: 'Pourquoi la question se pose, en un paragraphe. Ne commence pas par « La question se pose ».' },
      sections: {
        type: 'array',
        description: 'Trois à cinq sections : chacune répond à une sous-question réelle, en un paragraphe de 3 à 6 phrases.',
        items: {
          type: 'object',
          properties: {
            question: { type: 'string', description: 'Le titre de la section, sous forme de question réelle.' },
            texte: { type: 'string', description: 'Le paragraphe qui y répond.' },
          },
          required: ['question', 'texte'],
          additionalProperties: false,
        },
      },
      aRetenir: { type: 'array', description: 'Trois points courts, citables tels quels.', items: { type: 'string' } },
      enseignement: { type: 'string', description: 'La leçon de l’article, en une phrase.' },
      appel: { type: 'string', description: 'L’appel final, une ou deux phrases, au plus un point d’interrogation.' },
      pilier: { type: 'string', enum: m.piliers.map((p) => p.slug), description: 'Le pilier éditorial de l’article.' },
      persona: { type: 'string', enum: m.personas.map((p) => p.slug), description: 'Le lecteur visé.' },
      preuve: { type: 'string', description: 'La preuve autorisée sur laquelle l’article s’appuie, en quelques mots.' },
      sources: {
        type: 'string',
        description: 'Les textes et sources réellement cités, et ce qu’il faut revérifier avant publication. Jamais publié.',
      },
    },
    required: ['titre', 'accroche', 'complement', 'pourquoi', 'sections', 'aRetenir', 'enseignement', 'appel', 'pilier', 'persona', 'preuve', 'sources'],
    additionalProperties: false,
  } as const;
}

/**
 * Rédige un article de blog sur une requête donnée, au moule des articles de
 * grappe (réponse en tête, sections en questions, « À retenir »). Même cadre de
 * marque que la réécriture, preuves interdites comprises ; l'article entre
 * ensuite en **brouillon** et repasse par les garde-fous comme tout post — un
 * repère « [?] » laissé par le modèle bloque la validation jusqu'à ce que
 * Jonathan le remplisse.
 */
/** Ce que le calendrier dit autour de l'article : le post qu'il développe, et la semaine où il paraît. */
export interface ContexteCalendrier {
  post?: { titre: string; format: string; accroche: string; corps: string; appel: string };
  semaine?: { numero: number; phase?: string; intention?: string; autres: string[] };
}

export async function redigerArticle(
  entite: EntiteSlug,
  requete: string,
  grappe: { nom: string; articles: string[] } | null,
  consigne = '',
  contexte: ContexteCalendrier = {},
): Promise<ArticleIA> {
  if (!iaDisponible()) throw new Error('ANTHROPIC_API_KEY manquante côté serveur.');
  const f = format('blog-article');
  const regleDroit =
    entite === 'magistria'
      ? [
          'Toute affirmation de droit vise sa référence exacte : article de code, règlement ou directive avec son numéro, décision avec sa juridiction et sa date.',
          'Ne cite une décision que si tu es certain de sa juridiction, de sa date et de sa solution ; sinon écris « [?] décision à viser » à sa place.',
          'L’outil MagistrIA instruit, il ne conclut pas à la place du professionnel : ne le présente jamais autrement.',
        ]
      : ['Les seuls chiffres Veolt autorisés sont les prix affichés, la réponse sous 24 h et la capacité de 6 à 8 dossiers par mois.'];
  const texteDemande = [
    `Rédige un article de blog pour ${marque(entite).nom}, sur la requête : « ${requete.trim()} ».`,
    `Format : ${f.nom}. Longueur utile ${f.utileMin} à ${f.utileMax} caractères ; vise 2 500 à 4 500 caractères.`,
    'Ossature attendue :',
    ...f.ossature.map((e) => `- ${e.nom} : ${e.consigne}`),
    grappe
      ? `L’article rejoint la grappe « ${grappe.nom} », qui compte déjà : ${grappe.articles.map((t) => `« ${t} »`).join(', ')}. Ne les répète pas : traite l’angle propre à cette requête.`
      : '',
    ...(contexte.post
      ? [
          '',
          `L’article développe en version longue ce post du calendrier (${contexte.post.format}). Garde son angle et ses faits, n’en ajoute aucun qui ne soit vérifiable :`,
          '<post>',
          `Titre : ${contexte.post.titre}`,
          contexte.post.accroche,
          contexte.post.corps,
          contexte.post.appel,
          '</post>',
        ]
      : []),
    ...(contexte.semaine
      ? [
          '',
          `Il paraît en semaine ${contexte.semaine.numero} du calendrier${contexte.semaine.phase ? `, phase « ${contexte.semaine.phase} »` : ''}${contexte.semaine.intention ? ` (intention : ${contexte.semaine.intention})` : ''}.`,
          contexte.semaine.autres.length
            ? `Les autres posts de la semaine, que l’article doit compléter sans les répéter : ${contexte.semaine.autres.map((t) => `« ${t} »`).join(', ')}.`
            : '',
        ]
      : []),
    '',
    ...regleDroit,
    'Aucun client, chiffre, résultat, témoignage ou citation inventé. Si une information manque, écris « [?] » suivi de ce qu’il faut vérifier : le brouillon restera bloqué jusqu’à ce que ce soit complété.',
    'Écris en français, au « nous » de la marque, sans formule publicitaire.',
    consigne.trim() ? `\nConsigne de Jonathan : ${consigne.trim()}` : '',
  ].join('\n');

  const client = new Anthropic();
  // Sortie longue : en flux, pour ne pas buter sur le délai d'une requête simple.
  const reponse = await client.beta.messages
    .stream({
      model: MODELE_IA,
      max_tokens: 32000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'high', format: { type: 'json_schema', schema: schemaArticle(entite) } },
      system: [{ type: 'text', text: cadreEntite(entite), cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: texteDemande }],
    })
    .finalMessage();

  if (reponse.stop_reason === 'refusal') throw new Error('Le modèle a refusé cette demande. Reformule la requête.');
  if (reponse.stop_reason === 'max_tokens') throw new Error('Article tronqué. Réessaie avec une requête plus précise.');
  const texte = reponse.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
  const brut = JSON.parse(texte) as Partial<ArticleIA>;
  const sections = (brut.sections ?? [])
    .map((s) => ({ question: String(s?.question ?? '').trim(), texte: String(s?.texte ?? '').trim() }))
    .filter((s) => s.question && s.texte);
  if (!brut.titre || !brut.accroche || sections.length < 2) throw new Error('Article incomplet dans la réponse. Réessaie.');
  const m = marque(entite);
  return {
    titre: String(brut.titre).slice(0, 160),
    accroche: String(brut.accroche),
    complement: String(brut.complement ?? ''),
    pourquoi: String(brut.pourquoi ?? ''),
    sections,
    aRetenir: (brut.aRetenir ?? []).map(String).filter(Boolean).slice(0, 5),
    enseignement: String(brut.enseignement ?? ''),
    appel: String(brut.appel ?? ''),
    pilier: m.piliers.some((p) => p.slug === brut.pilier) ? String(brut.pilier) : m.piliers[0].slug,
    persona: m.personas.some((p) => p.slug === brut.persona) ? String(brut.persona) : m.personas[0].slug,
    preuve: String(brut.preuve ?? ''),
    sources: String(brut.sources ?? ''),
  };
}
