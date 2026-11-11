/**
 * Fabrication du brouillon : un sujet + un format = un texte au bon moule.
 *
 * Le même sujet ne s'écrit pas pareil en texte LinkedIn, en carrousel ou en
 * post Reddit. Ce fichier applique l'ossature du format (`formats.ts`) au
 * contenu du sujet (`sujets.ts`), sans rien inventer : il ne fait que tailler.
 */

import { format, type FormatSlug } from './formats';
import { serieDe, type Sujet } from './sujets';
import { marque, type EntiteSlug } from './marques';

export interface Brouillon {
  accroche: string;
  corps: string;
  appel: string;
  hashtags: string;
  /** Consignes de production pour la partie visuelle. Pas du texte à publier. */
  consignesVisuel: string[];
  titre?: string;
}

const HASHTAGS: Record<EntiteSlug, Record<string, string>> = {
  veolt: {
    'montrer-le-travail': '#3D #motiondesign #studiocreatif',
    'demonter-un-chiffre': '#businessplan #financement #TPE',
    'coulisses-methode': '#studiocreatif #3D #webdesign',
    'pedagogie-dirigeant': '#dirigeant #TPE #gestion',
    'positionnement-prix': '#freelance #agence #TPE',
  },
  magistria: {
    'arret-consequence': '#assurance #sinistre #droitdesassurances',
    'methode-nommee': '#gestiondesrisques #cybersécurité #conformité',
    'sinistre-decortique': '#assurance #indemnisation #expertise',
    'conformite-datee': '#NIS2 #RGPD #conformité',
    'position-ia': '#legaltech #IA #droit',
  },
};

function tronquer(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  const coupe = t.slice(0, max - 1);
  const dernier = Math.max(coupe.lastIndexOf(' '), coupe.lastIndexOf('.'));
  return (dernier > max * 0.6 ? coupe.slice(0, dernier) : coupe).trim();
}

/**
 * Taille le sujet au moule du format, puis reporte la source du fait avancé
 * dans les consignes de production.
 *
 * La source est mise **en tête** des consignes, et pas dans le corps : c'est ce
 * qu'un relecteur doit lire en premier et ce qui ne doit jamais partir dans le
 * texte publié. Un sujet sans source donne une consigne qui le dit — ne rien
 * afficher laisserait croire qu'on a vérifié.
 */
export function fabriquer(s: Sujet, formatSlug: FormatSlug, entite: EntiteSlug): Brouillon {
  const b = tailler(s, formatSlug, entite);
  b.consignesVisuel = [
    s.source ? `SOURCE DU FAIT AVANCÉ — ${s.source}` : 'SOURCE DU FAIT AVANCÉ — [?] non renseignée. À nommer avant de passer en « validé ».',
    ...b.consignesVisuel,
  ];
  return b;
}

function tailler(s: Sujet, formatSlug: FormatSlug, entite: EntiteSlug): Brouillon {
  const f = format(formatSlug);
  const m = marque(entite);
  const hashtags = HASHTAGS[entite][s.pilier] ?? '';

  switch (formatSlug) {
    // ── LinkedIn texte + image : l'ossature complète ────────────────────
    case 'li-texte-image':
    case 'li-video': {
      const corps = [
        ...s.corps,
        '',
        s.enseignement,
      ].join('\n\n');
      return {
        titre: s.titre,
        accroche: tronquer(s.accroche, f.accrocheMax),
        corps,
        appel: s.appel,
        hashtags,
        consignesVisuel:
          formatSlug === 'li-video'
            ? [
                '30 à 90 secondes, 1:1 ou 4:5.',
                'Sous-titres incrustés — la lecture se fait sans son.',
                `Première seconde : ${s.preuve}.`,
              ]
            : [
                '1 200 × 1 200 (carré) ou 1 200 × 627.',
                `Elle doit porter une information, pas décorer : ${s.preuve}.`,
                'Lisible en vignette, sans légende.',
              ],
      };
    }

    // ── Carrousels : une idée par page ──────────────────────────────────
    case 'li-carrousel':
    case 'ig-carrousel': {
      const pages: string[] = [];
      pages.push(`PAGE 1 — ${tronquer(s.titre, 80)}`);
      pages.push(`PAGE 2 — ${s.corps[0]}`);
      s.corps.slice(1).forEach((p, i) => pages.push(`PAGE ${i + 3} — ${p}`));
      pages.push(`PAGE ${pages.length + 1} — À RETENIR : ${s.enseignement}`);
      pages.push(`PAGE ${pages.length + 1} — ${s.appel}\n${m.nom} · ${m.signature}`);
      const texteCourt = `${s.accroche}\n\n${s.enseignement}`;
      return {
        titre: s.titre,
        accroche: tronquer(s.accroche, f.accrocheMax),
        corps: pages.join('\n\n'),
        appel: s.appel,
        hashtags,
        consignesVisuel: [
          `${pages.length} pages — la fourchette utile est 8 à 10.`,
          formatSlug === 'li-carrousel' ? '1 080 × 1 350 (4:5), exporté en PDF.' : '1 080 × 1 350.',
          'Une idée par page. Le titre de page 1 doit être lisible en vignette.',
          `Texte du post, court (${f.utileMin}–${f.utileMax}) : ${tronquer(texteCourt, f.utileMax)}`,
        ],
      };
    }

    // ── Reel / TikTok : le script, pas le texte ─────────────────────────
    case 'ig-reel':
    case 'tiktok-video': {
      const script = [
        `0–3 s — ${tronquer(s.accroche, 90)}`,
        `3–8 s — ${s.corps[0]}`,
        ...s.corps.slice(1, 3).map((p, i) => `${8 + i * 7}–${15 + i * 7} s — ${p}`),
        `fin — ${s.enseignement}`,
      ].join('\n');
      const legende = `${s.accroche}\n\n${s.enseignement}`;
      return {
        titre: s.titre,
        accroche: tronquer(legende, f.accrocheMax),
        corps: legende,
        appel: s.appel,
        hashtags,
        consignesVisuel: [
          formatSlug === 'ig-reel' ? '10 à 20 secondes, 9:16.' : '15 à 30 secondes, 9:16. Aucun watermark importé.',
          'Texte incrusté systématique.',
          'Pas d\'animation de marque en ouverture : les 3 premières secondes décident de tout.',
          'SCRIPT ↓',
          script,
        ],
      };
    }

    case 'ig-video': {
      return {
        titre: s.titre,
        accroche: tronquer(s.accroche, f.accrocheMax),
        corps: `${s.accroche}\n\n${s.corps.join('\n\n')}\n\n${s.enseignement}`,
        appel: s.appel,
        hashtags,
        consignesVisuel: ['60 secondes et plus, 9:16 ou 4:5.', 'Sous-titres incrustés.', 'Pas de générique.'],
      };
    }

    // ── Reddit : rien à vendre, une affiliation en clair ────────────────
    case 'reddit-texte': {
      const corps = [
        s.corps.join('\n\n'),
        '',
        s.enseignement,
        '',
        `Pour être transparent : nous travaillons chez ${m.nom} (${m.nomLong}). Nous ne mettons pas de lien — si quelqu'un veut le détail, nous répondons en commentaire.`,
      ].join('\n');
      return {
        titre: tronquer(s.titre.endsWith('?') ? s.titre : `${s.titre} ?`, 300),
        accroche: tronquer(s.titre.endsWith('?') ? s.titre : `${s.titre} ?`, 300),
        corps,
        appel: s.appel,
        hashtags: '',
        consignesVisuel: [
          'Aucun visuel : c\'est un post textuel.',
          'Aucun lien au premier jet — c\'est le déclencheur de retrait le plus courant.',
          'Vérifier la règle d\'auto-promotion du sous-forum avant d\'envoyer.',
        ],
      };
    }

    // ── Article : la réponse dans les 100 premiers mots ─────────────────
    case 'blog-article': {
      const serie = serieDe(s, entite);
      const corps = [
        `## La réponse, en bref`,
        `${s.accroche} ${s.corps[0]}`,
        '',
        `## Pourquoi la question se pose`,
        s.corps[1] ?? '[?] à développer',
        '',
        ...s.corps.slice(2).flatMap((p, i) => [`## ${i + 1}. ${s.questions?.[i] ?? '[?] titre sous forme de question'}`, p, '']),
        `## À retenir`,
        ...(s.aRetenir ?? s.corps.slice(0, 3).map((p) => tronquer(p, 160))).map((p) => `- ${p}`),
        `- ${s.enseignement}`,
        '',
        // Un article de la grappe annonce sa série ; les liens se posent à la
        // mise en ligne, vers ceux qui sont déjà publiés (consigne ci-dessous).
        ...(serie.length
          ? [`## Dans la même série`, ...serie.map((x) => `- ${x.titre}`)]
          : [
              `## Pour aller plus loin`,
              '[?] 3 à 5 liens internes vers les autres articles de la grappe — et remonter ces articles pour qu\'ils pointent ici.',
            ]),
      ].join('\n');
      return {
        titre: s.titre,
        accroche: tronquer(s.titre, f.accrocheMax),
        corps,
        appel: s.appel,
        hashtags: '',
        consignesVisuel: [
          'Une illustration par section, seulement si elle apporte une information.',
          'Date de mise à jour visible : les URL citées par les IA sont ~26 % plus récentes.',
          'Le bloc « La réponse, en bref » doit être autonome — c\'est lui qui se fait citer.',
          ...(s.requete ? [`REQUÊTE VISÉE — « ${s.requete} » (grappe « ${s.grappe} »).`] : []),
          ...(serie.length
            ? [
                'MAILLAGE — à la mise en ligne, lier chaque titre de « Dans la même série » déjà publié, retirer ceux qui ne le sont pas encore, et ajouter un lien vers cet article dans les articles de la série déjà en ligne.',
              ]
            : []),
        ],
      };
    }
  }
}
