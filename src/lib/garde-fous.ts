/**
 * Garde-fous — ce que la machine refuse de laisser passer.
 *
 * Trois niveaux, et la distinction compte :
 *  - `blocage`  : le brouillon ne peut pas passer en « validé ». C'est faux,
 *                 trompeur, ou ça expose un actif (compte Reddit, réputation).
 *  - `alerte`   : c'est probablement une erreur, mais le contexte peut la
 *                 justifier. Jonathan tranche.
 *  - `conseil`  : ça marcherait mieux autrement. Informatif.
 *
 * Un contrôle qui bloque doit toujours dire *pourquoi* — sinon on le contourne
 * sans comprendre, et le garde-fou devient une gêne au lieu d'une protection.
 */

import { JARGON_BANNI, marque, type EntiteSlug } from './marques';
import { format, type FormatSlug } from './formats';

export type Niveau = 'blocage' | 'alerte' | 'conseil';

export interface Constat {
  niveau: Niveau;
  regle: string;
  message: string;
  /** Ce qu'il faut faire. Jamais juste « corrigez ». */
  remede: string;
}

export interface BrouillonAControler {
  entite: EntiteSlug;
  formatSlug: FormatSlug;
  accroche: string;
  corps: string;
  appel: string;
  hashtags: string;
  persona: string | null;
  pilier: string | null;
  preuve: string | null;
  indicateur: string | null;
  /** Reddit uniquement. */
  sousForum?: string | null;
  joursDepuisDernierPostSousForum?: number | null;
  plafondJoursSousForum?: number | null;
}

const PREMIERE_PERSONNE_SINGULIER =
  /(?:^|[.!?]\s+|\n)\s*(?:j'|je\s|mon\s|ma\s|mes\s|moi\b)/i;

export function controler(b: BrouillonAControler): Constat[] {
  const m = marque(b.entite);
  const f = format(b.formatSlug);
  const out: Constat[] = [];
  const texte = `${b.accroche}\n${b.corps}\n${b.appel}`;
  const total = texte.trim().length;

  // ─── 0. Cases laissées vides par le moule ────────────────────────────────
  // Les gabarits marquent « [?] » ce qu'ils ne savent pas : une référence à
  // viser, un titre de section à écrire, des liens internes à poser. Publié
  // tel quel, le marqueur s'imprime sur le visuel et dans le texte — et une
  // référence non vérifiée devient une preuve inventée (règle 2).
  const trous = [...texte.matchAll(/\[\?\][^\n.]{0,60}/g)].map((x) => x[0].trim());
  if (trous.length) {
    out.push({
      niveau: 'blocage',
      regle: 'Texte — case à remplir',
      message: `${trous.length} marqueur${trous.length > 1 ? 's' : ''} « [?] » dans le texte : « ${trous[0]}${trous[0].length >= 60 ? '…' : ''} »${trous.length > 1 ? ', …' : ''}.`,
      remede:
        "Remplacer chaque « [?] » par l'information vérifiée (avec sa source), ou retirer la phrase. Ne jamais le remplir de mémoire : une référence approximative est pire qu'une absence.",
    });
  }

  // ─── 1. Preuves interdites, propres à l'entité ───────────────────────────
  for (const interdit of m.preuvesInterdites) {
    const trouve = texte.match(interdit.motif);
    if (trouve) {
      out.push({
        niveau: 'blocage',
        regle: `${m.nom} — ${interdit.libelle}`,
        message: `« ${trouve[0].trim()} » apparaît dans le brouillon.`,
        remede: interdit.raison,
      });
    }
  }

  // ─── 2. Jargon commercial, commun ────────────────────────────────────────
  const minuscules = texte.toLowerCase();
  for (const mot of JARGON_BANNI) {
    if (minuscules.includes(mot)) {
      out.push({
        niveau: 'alerte',
        regle: 'Jargon banni',
        message: `« ${mot} » est dans la liste noire de ton-et-style.md.`,
        remede: 'Le destinataire repère une formule creuse immédiatement. Dire la chose concrètement, ou la supprimer.',
      });
    }
  }

  // ─── 3. Voix : pages entreprise uniquement (décision du 2026-10-06) ──────
  if (PREMIERE_PERSONNE_SINGULIER.test(texte) && !/mon associé/i.test(texte)) {
    out.push({
      niveau: 'alerte',
      regle: 'Voix de la page',
      message: 'Le brouillon emploie la première personne du singulier.',
      remede:
        "Les deux entités publient depuis leurs pages entreprise : le « nous » est la règle. Seule exception admise : « mon associé a… » côté Veolt, qui est précisément une preuve autorisée.",
    });
  }

  // ─── 4. Longueurs du format ──────────────────────────────────────────────
  if (b.accroche.trim().length > f.accrocheMax) {
    out.push({
      niveau: 'blocage',
      regle: `${f.nom} — accroche`,
      message: `${b.accroche.trim().length} caractères pour ${f.accrocheMax} maximum (${f.accrocheLibelle}).`,
      remede: `Tout ce qui dépasse ${f.accrocheMax} caractères n'est pas lu avant le clic. Couper la fin, pas le début.`,
    });
  }
  if (total > f.maxCaracteres) {
    out.push({
      niveau: 'blocage',
      regle: `${f.nom} — plafond plateforme`,
      message: `${total} caractères pour un plafond dur de ${f.maxCaracteres}.`,
      remede: 'La plateforme tronquera. Couper, ou scinder en deux publications.',
    });
  } else if (total > 0 && total < f.utileMin) {
    out.push({
      niveau: 'conseil',
      regle: `${f.nom} — longueur utile`,
      message: `${total} caractères, en dessous de la fourchette utile (${f.utileMin} à ${f.utileMax}).`,
      remede: `Sur ce format, l'indicateur qui décide est : ${f.indicateurCle}. Un texte trop court ne le déclenche pas.`,
    });
  } else if (total > f.utileMax) {
    out.push({
      niveau: 'conseil',
      regle: `${f.nom} — longueur utile`,
      message: `${total} caractères, au-dessus de la fourchette utile (${f.utileMin} à ${f.utileMax}).`,
      remede: 'Au-delà, le taux de lecture jusqu\'au bout chute. Garder la preuve, couper le contexte.',
    });
  }

  // ─── 5. Le gabarit commun : les six questions (cadrage §6.5) ─────────────
  const manques: Array<[string, string]> = [];
  if (!b.persona) manques.push(['À qui', 'Choisir un persona nommé. « Les entreprises » n\'est pas un destinataire.']);
  if (!b.pilier) manques.push(['Quel pilier', 'Un post hors pilier est un post qui ne construit rien de cumulatif.']);
  if (!b.preuve) manques.push(['Quelle preuve', `Preuves autorisées pour ${m.nom} : ${m.preuvesAutorisees[0]}…`]);
  if (!b.indicateur) manques.push(['Qu\'est-ce qu\'on mesure', `Sur ce format : ${f.indicateurCle}.`]);
  for (const [q, r] of manques) {
    out.push({ niveau: 'blocage', regle: `Gabarit commun — ${q} ?`, message: 'Non renseigné.', remede: r });
  }

  // ─── 6. Une seule demande ────────────────────────────────────────────────
  const questions = (b.appel.match(/\?/g) ?? []).length;
  if (questions > 1) {
    out.push({
      niveau: 'alerte',
      regle: 'Une seule demande',
      message: `${questions} questions dans l'appel.`,
      remede: 'Deux demandes dans un même message en annulent une. Garder la moins coûteuse pour le lecteur.',
    });
  }

  // ─── 7. Hashtags ─────────────────────────────────────────────────────────
  const nbHashtags = (b.hashtags.match(/#/g) ?? []).length;
  if (f.reseau === 'linkedin' && nbHashtags > 3) {
    out.push({
      niveau: 'conseil',
      regle: 'LinkedIn — hashtags',
      message: `${nbHashtags} hashtags.`,
      remede: '3 maximum, descriptifs, en pied. Au-delà, ça dilue sans élargir.',
    });
  }

  // ─── 8. Liens dans le corps ──────────────────────────────────────────────
  if (/https?:\/\//i.test(b.corps)) {
    if (f.reseau === 'linkedin') {
      out.push({
        niveau: 'alerte',
        regle: 'LinkedIn — lien dans le corps',
        message: 'Le corps contient une URL.',
        remede: 'Un lien dans le corps réduit la diffusion. Le mettre en premier commentaire, posté par la page.',
      });
    }
    if (f.reseau === 'reddit') {
      out.push({
        niveau: 'blocage',
        regle: 'Reddit — lien au premier jet',
        message: 'Le corps contient une URL.',
        remede:
          "Aucun lien au premier jet : c'est le déclencheur de retrait le plus courant. En commentaire, et seulement si on le demande.",
      });
    }
  }

  // ─── 9. Emoji en ouverture ───────────────────────────────────────────────
  if (/^\s*[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(b.accroche)) {
    out.push({
      niveau: 'conseil',
      regle: 'Accroche',
      message: 'L\'accroche ouvre sur un emoji.',
      remede: 'Les premiers caractères sont les plus chers de la publication. Mettre l\'information là.',
    });
  }

  // ─── 10. Reddit : fréquence et affiliation ───────────────────────────────
  if (f.reseau === 'reddit') {
    if (!b.sousForum) {
      out.push({
        niveau: 'blocage',
        regle: 'Reddit — sous-forum',
        message: 'Aucun sous-forum choisi.',
        remede: 'Chaque sous-forum a sa propre règle d\'auto-promotion. Sans le choisir, on ne peut pas la vérifier.',
      });
    } else if (
      b.plafondJoursSousForum != null &&
      b.joursDepuisDernierPostSousForum != null &&
      b.joursDepuisDernierPostSousForum < b.plafondJoursSousForum
    ) {
      out.push({
        niveau: 'blocage',
        regle: `Reddit — fréquence sur ${b.sousForum.replace(/^r\//, 'r/')}`,
        message: `Dernier post il y a ${b.joursDepuisDernierPostSousForum} jours, pour un plafond déclaré de ${b.plafondJoursSousForum} jours.`,
        remede:
          "Publier maintenant expose au retrait, au bannissement et à la mise en liste noire de l'URL du produit. Un compte Reddit grillé est irrécupérable : attendre est toujours moins cher.",
      });
    }
    if (!/(?:nous (?:sommes|travaillons|construisons)|je travaille|notre (?:équipe|studio|produit|outil))/i.test(b.corps)) {
      out.push({
        niveau: 'alerte',
        regle: 'Reddit — affiliation',
        message: 'Aucune ligne d\'affiliation détectée.',
        remede:
          "Déclarer qui on est, en clair, à la fin. C'est ce qui distingue une contribution d'une publicité déguisée aux yeux des modérateurs.",
      });
    }
  }

  // ─── 11. MagistrIA : toute affirmation de droit exige une référence ──────
  if (b.entite === 'magistria') {
    // « CE » (Conseil d'État) se teste en capitales : avec le drapeau `i`, le
    // simple mot « ce » déclenchait la règle sur n'importe quel texte.
    const affirmeDuDroit =
      /\b(?:article|art\.)\s*(?:L\.?|R\.?|D\.?)?\s*\d|\bCass\.|\barrêt\b|\bjurisprudence\b|\bcode (?:des assurances|civil|de commerce|pénal)\b|\bRGPD\b|\bNIS\s?2\b/i.test(
        texte,
      ) || /\bCE\b/.test(texte);
    const aUneReference =
      /\b(?:art(?:icle)?\.?\s*(?:L|R|D)?\.?\s*\d+|n°\s*\d|\d{2}-\d{4,5}|\b(?:19|20)\d{2}\b)/i.test(texte);
    if (affirmeDuDroit && !aUneReference) {
      out.push({
        niveau: 'blocage',
        regle: 'MagistrIA — référence obligatoire',
        message: 'Le brouillon avance une règle de droit sans référence identifiable.',
        remede:
          "Un article, un numéro de décision ou une date. C'est exactement ce que le produit fait — un post qui ne le fait pas contredit la promesse qu'il vend.",
      });
    }
  }

  return out;
}

export function estValidable(constats: Constat[]): boolean {
  return !constats.some((c) => c.niveau === 'blocage');
}

export function compter(constats: Constat[]) {
  return {
    blocages: constats.filter((c) => c.niveau === 'blocage').length,
    alertes: constats.filter((c) => c.niveau === 'alerte').length,
    conseils: constats.filter((c) => c.niveau === 'conseil').length,
  };
}
