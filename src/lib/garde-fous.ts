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
  const trous = [...texte.matchAll(/\[(?:\?|à compléter)\][^\n.]{0,60}/gi)].map((x) => x[0].trim());
  if (trous.length) {
    out.push({
      niveau: 'blocage',
      regle: 'Texte — case à remplir',
      message: `${trous.length} marqueur${trous.length > 1 ? 's' : ''} « [?] » ou « [à compléter] » dans le texte : « ${trous[0]}${trous[0].length >= 60 ? '…' : ''} »${trous.length > 1 ? ', …' : ''}.`,
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
        remede:
          "Un lien dans le post réduit la diffusion, et le « lien en premier commentaire » n'est plus un contournement fiable (relevé 2026-11-25). Retirer le lien : proposer la ressource en message privé, ou l'épingler dans la Sélection de la page.",
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

  // ─── 12. LinkedIn : appât à l'engagement (relevé 2026-11-25) ─────────────
  // LinkedIn demande d'éviter les contenus qui réclament explicitement des
  // likes, partages, commentaires ou abonnements, et les « Commentez MOT »
  // ont perdu l'essentiel de leur portée en 2026. La question posée dans le
  // post (et dans l'image) suffit à faire réagir, sans le réclamer.
  if (f.reseau === 'linkedin') {
    const appats: Array<[RegExp, string]> = [
      [/(?:^|[^\p{L}])(?:[Cc]ommente[zr]?|[Tt]ape[zr]?|[ÉéEe]crive[zr]?|[Rr]épondez|[Mm]ettez)(?![\p{L}])[^.\n]{0,40}(?:«\s*|"|“)[A-ZÀ-Ý0-9][A-ZÀ-Ý0-9'’ -]{1,20}(?:\s*»|"|”)/u, '« commentez MOT » pour recevoir quelque chose'],
      [/\b(?:like[zr]?|liker|likez|mettez un (?:like|pouce)|un petit like)\b/i, 'demande de like'],
      [/\b(?:partage[zr]?|repartage[zr]?|reposte[zr]?)\b[^.\n]{0,25}\b(?:ce post|si|autour|à votre réseau|pour)\b/i, 'demande de partage'],
      [/\babonne[zr]?-vous\b|\bsuivez(?:-nous| la page)\b/i, "demande d'abonnement"],
      [/\b(?:réagi(?:ssez|r)|votez)\s+(?:avec|si|👍|❤)/i, 'réaction réclamée'],
    ];
    for (const [motif, libelle] of appats) {
      const t = texte.match(motif);
      if (t) {
        out.push({
          niveau: 'alerte',
          regle: 'LinkedIn — appât à l’engagement',
          message: `${libelle} : « ${t[0].trim()} ».`,
          remede:
            "LinkedIn réduit la portée des posts qui réclament un like, un partage, un abonnement ou un mot-clé en commentaire. Remplacer par une vraie question, qui appelle une expérience (pas un oui/non). Une ressource se propose en message privé.",
        });
        break;
      }
    }
  }

  // ─── 13. Ressource promise qui n'existe pas (règle 2) ────────────────────
  if (m.ressources) {
    const promesse = texte.match(
      /\b(?:guide|rapport|livre blanc|check-?list|modèle|template|kit|grille|e-?book|audit|webinaire|mini-formation)\b[^.\n]{0,60}\b(?:recevoir|reçoi|envoy|envoie|télécharg|obtenir|offert|gratuit|disponible|demandez)|\b(?:recevoir|recevez|envoy|télécharg|obtenez|demandez)[^.\n]{0,60}\b(?:guide|rapport|livre blanc|check-?list|modèle|template|kit|grille|e-?book|audit|webinaire|mini-formation)\b/i,
    );
    if (promesse && !m.ressources.some((r) => r.motif.test(promesse[0]))) {
      out.push({
        niveau: 'blocage',
        regle: `${m.nom} — ressource promise inexistante`,
        message: `« ${promesse[0].trim()} » : cette ressource n'est pas déclarée comme disponible.`,
        remede: `Ressources réelles à ce jour : ${m.ressources.map((r) => `${r.nom} (${r.ou})`).join(' ; ')}. Proposer l'une d'elles, ou créer la ressource puis la déclarer dans marques.ts.`,
      });
    }
  }

  // ─── 14. Veolt, LinkedIn : l'appel est une question ──────────────────────
  if (b.entite === 'veolt' && f.reseau === 'linkedin' && b.appel.trim() && !b.appel.trim().endsWith('?')) {
    out.push({
      niveau: 'conseil',
      regle: 'LinkedIn — la question du post',
      message: "L'appel n'est pas une question.",
      remede:
        "Une question qui appelle une expérience déclenche des commentaires argumentés, ceux que LinkedIn diffuse le plus loin — et elle est alors posée dans l'image du post. Une invitation (« Demandez l'analyse gratuite ») peut suivre, en message privé.",
    });
  }

  // ─── 15. Tics d'écriture « IA » (consignes du studio, 25/11/2026) ─────────
  // Le lecteur repère en deux lignes les structures que les générateurs
  // répètent : il décroche, et LinkedIn freine le contenu générique. Alerte,
  // pas blocage : le tic se réécrit en une phrase simple.
  if (b.entite === 'veolt') {
    const tics: Array<[RegExp, string]> = [
      [/\b(?:le|la|les)\s+(?:vrai|vraie|vrais|véritable)s?\s+[\p{L}’'-]+(?:\s+[\p{L}’'-]+){0,3}\s+n[’']est\s+pas\b/iu, '« le vrai X n’est pas Y »'],
      [/\bce n[’']est pas (?:seulement |juste |qu[’']une? )?[^.\n]{2,40}, c[’']est\b/i, '« ce n’est pas X, c’est Y »'],
      [/(?:^|\n)\s*Et si\b/i, '« Et si… ? » en ouverture'],
      [/\bdans un monde où\b/i, '« Dans un monde où »'],
      [/\b(?:véritable(?:ment)?|incontournable|révolutionn\w+|game[- ]changer|à l[’']ère de|plus que jamais|sans plus attendre|n[’']attendez plus|libérez|boostez|propulsez)\b/i, 'formule d’emphase'],
      [/\b(?:en somme|en définitive|pour conclure|en conclusion)\b/i, 'formule de conclusion scolaire'],
      [/\bimaginez\b/i, '« Imaginez… »'],
    ];
    for (const [motif, libelle] of tics) {
      const t = texte.match(motif);
      if (t) {
        out.push({
          niveau: 'alerte',
          regle: 'Texte — tic d’écriture « IA »',
          message: `${libelle} : « ${t[0].trim()} ».`,
          remede: 'Réécrire comme on le dirait à un client, en une phrase simple et concrète (consignes du studio, page Qualité).',
        });
        break;
      }
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
