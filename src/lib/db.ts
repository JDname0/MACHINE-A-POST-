/**
 * Base unique — `data/machine.db`. Source de vérité, comme dans les deux
 * machines à prospection : on n'a jamais deux vérités, et les données
 * volumineuses vivent ici plutôt qu'en markdown.
 *
 * Le semis est **déterministe** : relancer ne duplique rien, parce que les
 * créneaux portent une clé (entité + date + format + sujet). On peut donc
 * étendre le calendrier sans écraser ce qui a été écrit à la main.
 */

import Database from 'better-sqlite3';
import { ENTITES, type EntiteSlug } from './marques';
import { CHEMIN_BASE, EN_SERVERLESS, hydrater, sauvegarder } from './persistance';
import { deroule } from './calendrier';
import { sujetsDe } from './sujets';
import { fabriquer } from './gabarits';

/**
 * Initialisation au chargement du module — une fois par instance, dans un
 * contexte asynchrone. C'est ce qui permet à `db()` de rester **synchrone**
 * ensuite : tout le reste du code appelle `db()` sans `await`.
 *
 * Le semis est poussé vers le Blob **immédiatement**, et c'est le point
 * important : le calendrier est daté du jour du semis. Sans cette poussée, une
 * instance démarrée la semaine suivante sèmerait un calendrier décalé, et deux
 * visiteurs ne verraient pas les mêmes dates ni les mêmes identifiants.
 */
async function initialiser() {
  const niveau = await hydrater();
  const d = new Database(CHEMIN_BASE);
  // WAL en local (plus rapide), DELETE en serverless : un instantané Blob doit
  // tenir dans un seul fichier, sinon on sauvegarde une base amputée.
  d.pragma(EN_SERVERLESS ? 'journal_mode = DELETE' : 'journal_mode = WAL');
  d.pragma('foreign_keys = ON');
  schema(d);
  migrer(d);
  const aSeme = semer(d);
  if (aSeme) await sauvegarder();
  return { d, niveau };
}


function schema(d: Database.Database) {
  d.exec(`
    CREATE TABLE IF NOT EXISTS publications (
      id INTEGER PRIMARY KEY,
      entite TEXT NOT NULL,
      format_slug TEXT NOT NULL,
      pilier TEXT NOT NULL,
      persona TEXT,
      sujet_ref TEXT,
      date_prevue TEXT NOT NULL,
      semaine INTEGER,
      phase TEXT,
      raison TEXT,
      statut TEXT NOT NULL DEFAULT 'brouillon',
      titre TEXT,
      accroche TEXT DEFAULT '',
      corps TEXT DEFAULT '',
      appel TEXT DEFAULT '',
      hashtags TEXT DEFAULT '',
      consignes_visuel TEXT DEFAULT '',
      preuve TEXT,
      indicateur TEXT,
      sous_forum TEXT,
      url_publiee TEXT,
      publie_le TEXT,
      cree_le TEXT NOT NULL DEFAULT (datetime('now')),
      maj_le TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (entite, date_prevue, format_slug, pilier)
    );

    CREATE TABLE IF NOT EXISTS metriques (
      id INTEGER PRIMARY KEY,
      publication_id INTEGER NOT NULL REFERENCES publications(id) ON DELETE CASCADE,
      impressions INTEGER,
      interactions INTEGER,
      clics INTEGER,
      duree_s REAL,
      note TEXT,
      releve_le TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS grappes (
      id INTEGER PRIMARY KEY,
      entite TEXT NOT NULL,
      nom TEXT NOT NULL,
      page_pilier TEXT NOT NULL,
      UNIQUE (entite, nom)
    );

    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY,
      entite TEXT NOT NULL,
      grappe_id INTEGER REFERENCES grappes(id) ON DELETE SET NULL,
      titre TEXT NOT NULL,
      requete TEXT NOT NULL,
      intention TEXT,
      statut TEXT NOT NULL DEFAULT 'a-ecrire',
      url TEXT,
      mots INTEGER,
      top10 INTEGER DEFAULT 0,
      cite_par_ia INTEGER DEFAULT 0,
      maj_le TEXT,
      UNIQUE (entite, titre)
    );

    CREATE TABLE IF NOT EXISTS backlinks (
      id INTEGER PRIMARY KEY,
      entite TEXT NOT NULL,
      domaine TEXT NOT NULL,
      type TEXT NOT NULL,
      priorite INTEGER NOT NULL DEFAULT 3,
      contact TEXT,
      statut TEXT NOT NULL DEFAULT 'a-contacter',
      note TEXT,
      url TEXT,
      UNIQUE (entite, domaine)
    );

    CREATE TABLE IF NOT EXISTS campagnes (
      id INTEGER PRIMARY KEY,
      entite TEXT NOT NULL,
      nom TEXT NOT NULL,
      canal TEXT NOT NULL,
      objectif TEXT,
      audience TEXT,
      budget REAL,
      debut TEXT,
      fin TEXT,
      statut TEXT NOT NULL DEFAULT 'projet',
      note TEXT,
      UNIQUE (entite, nom)
    );

    CREATE TABLE IF NOT EXISTS campagne_releves (
      id INTEGER PRIMARY KEY,
      campagne_id INTEGER NOT NULL REFERENCES campagnes(id) ON DELETE CASCADE,
      depense REAL,
      impressions INTEGER,
      clics INTEGER,
      conversations INTEGER,
      releve_le TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sous_forums (
      id INTEGER PRIMARY KEY,
      nom TEXT NOT NULL UNIQUE,
      regle TEXT NOT NULL,
      plafond_jours INTEGER,
      promotion_interdite INTEGER NOT NULL DEFAULT 0,
      dernier_post TEXT,
      note TEXT
    );

    CREATE TABLE IF NOT EXISTS connexions (
      id INTEGER PRIMARY KEY,
      entite TEXT NOT NULL,
      reseau TEXT NOT NULL,
      barreau INTEGER NOT NULL DEFAULT 1,
      note TEXT,
      maj_le TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (entite, reseau)
    );

    CREATE TABLE IF NOT EXISTS medias (
      id INTEGER PRIMARY KEY,
      entite TEXT NOT NULL,
      cle TEXT NOT NULL UNIQUE,
      nom TEXT NOT NULL,
      type_mime TEXT NOT NULL,
      octets INTEGER NOT NULL,
      largeur INTEGER,
      hauteur INTEGER,
      duree_s REAL,
      legende TEXT,
      publication_id INTEGER REFERENCES publications(id) ON DELETE SET NULL,
      cree_le TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Réécritures proposées par l'IA. Elles n'entrent dans le brouillon que
    -- sur « Adopter » : la publication elle-même n'est jamais modifiée ici.
    CREATE TABLE IF NOT EXISTS propositions_ia (
      id INTEGER PRIMARY KEY,
      publication_id INTEGER NOT NULL REFERENCES publications(id) ON DELETE CASCADE,
      accroche TEXT NOT NULL DEFAULT '',
      corps TEXT NOT NULL DEFAULT '',
      appel TEXT NOT NULL DEFAULT '',
      hashtags TEXT NOT NULL DEFAULT '',
      note TEXT,
      consigne TEXT,
      statut TEXT NOT NULL DEFAULT 'en-attente',
      cree_le TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS journal (
      id INTEGER PRIMARY KEY,
      entite TEXT,
      action TEXT NOT NULL,
      detail TEXT,
      le TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

/**
 * Colonnes ajoutées après coup.
 *
 * `CREATE TABLE IF NOT EXISTS` ne touche pas une table qui existe déjà : sur
 * une base en production — et l'instantané du Blob en est une — la colonne
 * manquerait, et chaque lecture tomberait. D'où cette reprise, qui coûte une
 * lecture de `table_info` au démarrage.
 */
function migrer(d: Database.Database) {
  const ajouts: Array<[string, string, string]> = [['medias', 'duree_s', 'REAL']];
  for (const [table, colonne, type] of ajouts) {
    const colonnes = d.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
    if (colonnes.length === 0 || colonnes.some((c) => c.name === colonne)) continue;
    try {
      d.exec(`ALTER TABLE ${table} ADD COLUMN ${colonne} ${type}`);
    } catch (e) {
      // Deux processus qui démarrent sur le même fichier — le `next build`
      // en lance plusieurs — peuvent lire `table_info` avant que l'autre
      // n'ait ajouté la colonne. Le perdant n'a rien à faire.
      if (!/duplicate column name/i.test((e as Error).message)) throw e;
    }
  }
}

export function tracer(action: string, detail?: string, entite?: string) {
  db().prepare('INSERT INTO journal (entite, action, detail) VALUES (?, ?, ?)').run(entite ?? null, action, detail ?? null);
}

// ─────────────────────────────────────────────────────────────────────────────
// Semis
// ─────────────────────────────────────────────────────────────────────────────

const GRAPPES: Record<EntiteSlug, Array<{ nom: string; pilier: string; articles: Array<[string, string, string]> }>> = {
  veolt: [
    {
      nom: 'Business plan et financement',
      pilier: 'Faire un business plan qui passe en banque',
      articles: [
        ['Business plan pour un prêt bancaire : ce que la banque regarde', 'business plan pour prêt bancaire création entreprise', 'informationnelle'],
        ['Combien coûte un business plan réalisé par un professionnel', 'prix business plan professionnel', 'commerciale'],
        ['Prévisionnel financier : les trois lignes qui décident', 'prévisionnel financier lignes importantes banque', 'informationnelle'],
        ['Besoin en fonds de roulement : le calculer sans comptable', 'calculer besoin en fonds de roulement création', 'informationnelle'],
        ['Scénario dégradé dans un prévisionnel : pourquoi il est obligatoire', 'scénario pessimiste prévisionnel banque', 'informationnelle'],
        ['Business plan refusé : les motifs les plus fréquents', 'pourquoi mon business plan a été refusé banque', 'informationnelle'],
      ],
    },
    {
      nom: 'Site web sur mesure',
      pilier: "Combien coûte vraiment un site, et pourquoi",
      articles: [
        ['Combien coûte un site vitrine sur mesure en 2026', 'prix site vitrine sur mesure', 'commerciale'],
        ["Devis de site web : comment comparer deux devis ligne à ligne", 'comparer devis site internet', 'commerciale'],
        ['Refaire son site : trois signes qui le justifient', 'faut-il refaire son site internet', 'informationnelle'],
        ['Site vitrine ou site e-commerce : lequel pour démarrer', 'site vitrine ou ecommerce choisir', 'informationnelle'],
        ['Web 3D : quand ça sert vraiment, et quand ça ralentit', 'site web 3D intérêt performance', 'informationnelle'],
        ['Qui écrit les textes de votre site, et pourquoi ça change le prix', 'rédaction contenu site web prix', 'commerciale'],
      ],
    },
    {
      nom: '3D produit et publicité',
      pilier: 'Packshot 3D contre photo : le vrai arbitrage',
      articles: [
        ['Packshot 3D ou photo produit : lequel choisir', 'packshot 3D ou photo produit', 'commerciale'],
        ['Prix d\'un visuel produit en 3D, par référence', 'prix visuel 3D produit', 'commerciale'],
        ['Publicité 3D : les sept étapes de production', 'étapes production publicité 3D', 'informationnelle'],
        ['Motion design : à quoi ça sert dans une page de vente', 'motion design page de vente utilité', 'informationnelle'],
        ['Combien de visuels par référence avant que la 3D soit rentable', 'rentabilité 3D produit nombre visuels', 'informationnelle'],
      ],
    },
  ],
  magistria: [
    {
      nom: 'Sinistre et garantie',
      pilier: "Refus de garantie : ce que l'assureur doit prouver",
      articles: [
        ['Refus de garantie : ce que l\'assureur doit prouver', 'refus de garantie assureur charge de la preuve', 'informationnelle'],
        ['Clause d\'exclusion formelle et limitée : ce que dit l\'article L. 113-1', 'clause exclusion formelle et limitée L113-1', 'informationnelle'],
        ['Délai de déclaration de sinistre : à partir de quand il court', 'délai déclaration sinistre point de départ', 'informationnelle'],
        ['Rapport d\'expertise cyber : les trois phrases qui décident', 'lire rapport expertise cyber assurance', 'informationnelle'],
        ['Déchéance pour déclaration tardive : les conditions', 'déchéance garantie déclaration tardive conditions', 'informationnelle'],
        ['Courrier de refus de garantie : les quatre vérifications', 'rédiger courrier refus garantie assurance', 'commerciale'],
      ],
    },
    {
      nom: 'Conformité datée',
      pilier: 'NIS 2 et RGPD : les échéances qui engagent',
      articles: [
        ['NIS 2 : qui est concerné et à quelles dates', 'NIS 2 entités concernées échéances', 'informationnelle'],
        ['Notification d\'incident NIS 2 : le délai et la clause à prévoir', 'NIS2 notification incident délai clause contrat', 'informationnelle'],
        ['Clause de limitation de responsabilité et faute lourde', 'clause limitation responsabilité faute lourde inopposable', 'informationnelle'],
        ['RGPD et sous-traitance : les mentions obligatoires du contrat', 'contrat sous-traitance RGPD article 28 mentions', 'informationnelle'],
        ['Registre des traitements : ce qui est réellement exigé', 'registre des traitements contenu obligatoire', 'informationnelle'],
      ],
    },
    {
      nom: 'IA et droit',
      pilier: 'Une IA qui montre son raisonnement : pourquoi ça change tout',
      articles: [
        ['IA juridique : comment vérifier ce qu\'elle avance', 'vérifier fiabilité IA juridique sources', 'informationnelle'],
        ['Syllogisme juridique et IA : pourquoi le découpage compte', 'syllogisme juridique IA raisonnement', 'informationnelle'],
        ['Méthode FAIR : quantifier un risque cyber en euros', 'méthode FAIR quantification risque cyber', 'informationnelle'],
        ['EBIOS Risk Manager pour un juriste : les cinq ateliers', 'EBIOS Risk Manager ateliers juridique', 'informationnelle'],
        ['Comparatif des outils d\'IA juridique français', 'comparatif outils IA juridique France prix', 'commerciale'],
        ['Ce qu\'une IA juridique ne doit pas faire', 'limites IA juridique avis juridique', 'informationnelle'],
      ],
    },
  ],
};

const BACKLINKS: Record<EntiteSlug, Array<[string, string, number, string]>> = {
  veolt: [
    ['annuaire des agences web (type sortlist, la-fabrique-du-net)', 'annuaire légitime', 1, "Lent, propre, durable. C'est le socle : on y est ou on n'existe pas pour un acheteur qui compare."],
    ['CCI / réseaux d\'accompagnement à la création', 'annuaire légitime', 1, 'Pertinent pour l\'offre business plan, et le lien est thématiquement juste.'],
    ['médias e-commerce et retail (publication invitée)', 'publication invitée', 2, 'Pour la 3D produit. Un seul article dans un média réellement lu vaut des dizaines d\'annuaires.'],
    ['étude chiffrée « coût réel d\'un visuel produit »', 'donnée propriétaire', 1, "La seule chose qui attire un lien sans le demander. À produire une fois nos premiers chiffres disponibles."],
    ['partenaires complémentaires (comptables, courtiers)', 'partenariat', 3, 'Mentions croisées. Volume faible, mais pertinence maximale.'],
    ['fermes d\'annuaires génériques', 'à éviter', 5, "⛔ Jamais. Un lien d'une publication sectorielle respectée vaut des dizaines de liens génériques."],
  ],
  magistria: [
    ['annuaires legaltech (type village-justice, legaltech-hub)', 'annuaire légitime', 1, 'Le socle pour une legaltech. Pertinence thématique maximale.'],
    ['médias assurance et courtage (publication invitée)', 'publication invitée', 1, 'Le cœur de cible MVP est assureur : c\'est là que le lien a une double valeur, trafic et crédibilité.'],
    ['médias juridiques (Village de la Justice, Actu-Juridique)', 'publication invitée', 2, 'Un arrêt commenté y est publiable, et c\'est notre pilier n° 1.'],
    ['étude chiffrée sur les refus de garantie', 'donnée propriétaire', 1, "Donnée propriétaire. [?] suppose d'avoir un volume de dossiers analysés — à rouvrir plus tard."],
    ['CNB / ordres et fédérations professionnelles', 'annuaire légitime', 2, "[?] Le CNB a été contacté côté prospection (DEMANDE-CNB.md). Même porte, autre sujet."],
    ['achat de liens', 'à éviter', 5, "⛔ Jamais. Sur un produit qui vend de la conformité, c'est un risque disproportionné."],
  ],
};

const SOUS_FORUMS: Array<[string, string, number | null, number, string]> = [
  ['r/entrepreneur', 'promotion tolérée si le post apporte une analyse ; ratio 9:1 attendu', 30, 0, 'Le plus accessible. Un chiffre réel y passe bien.'],
  ['r/SaaS', 'une auto-promotion tous les 60 jours (resserré en avril 2026)', 60, 0, "Dépassement = retrait, bannissement et mise en liste noire de l'URL du produit."],
  ['r/france', 'promotion mal tolérée ; aucun lien commercial', null, 1, 'À traiter comme un forum de discussion, pas comme un canal.'],
  ['r/marketing', 'promotion interdite', null, 1, '⛔ Interdiction pure. Réponses uniquement.'],
  ['r/SEO', 'promotion interdite', null, 1, '⛔ Interdiction pure. Réponses uniquement.'],
  ['r/b2bmarketing', 'promotion interdite', null, 1, '⛔ Interdiction pure. Réponses uniquement.'],
  ['r/LeadGeneration', 'promotion interdite', null, 1, '⛔ Interdiction pure. Réponses uniquement.'],
  ['r/juridique', 'promotion mal tolérée ; contributions de fond acceptées', null, 1, "Pour MagistrIA : y répondre, ne rien y vendre. L'affiliation doit être déclarée."],
  ['r/assurance', 'à vérifier avant tout post', null, 1, '[?] Règles non relevées. À lire avant la première contribution.'],
];

const CAMPAGNES: Record<EntiteSlug, Array<[string, string, string, string, number, string]>> = {
  veolt: [
    ['Retargeting analyse gratuite', 'Meta Ads', 'conversations engagées', 'visiteurs du site 30 jours, hors convertis', 300, "⛔ Bloquée : le paquet de consentement n'est pas posé sur veoltproduction.fr. Pixel impossible avant. Matomo d'abord (exempté de consentement)."],
    ['Notoriété 3D produit', 'Meta Ads', 'portée et coût par visionnage complet', 'marques produit et e-commerce, France', 400, 'Pas avant la semaine 5 : amplifier un message qui n\'a pas tenu en organique, c\'est payer pour apprendre ce que l\'organique apprend gratuitement.'],
  ],
  magistria: [
    ['Gestionnaires de sinistres — ciblage par fonction', 'LinkedIn Ads', 'conversations engagées', 'fonction « gestionnaire de sinistres », « indemnisation » ; assurance et mutuelles, France', 600, "LinkedIn Ads est le seul moyen d'atteindre cette fonction. Pas avant la semaine 5."],
    ['Document sponsorisé — méthode FAIR', 'LinkedIn Ads', 'téléchargements du document', 'directions juridiques et risk managers, France', 400, 'Le carrousel est notre meilleur format organique : c\'est lui qu\'on amplifie, pas un visuel neuf.'],
  ],
};

/** Renvoie `true` si le calendrier vient d'être créé — donc s'il faut pousser. */
function semer(d: Database.Database): boolean {
  const dejaFait = d.prepare('SELECT COUNT(*) AS n FROM publications').get() as { n: number };

  // ── Référentiels (idempotents) ─────────────────────────────────────────
  const insGrappe = d.prepare('INSERT OR IGNORE INTO grappes (entite, nom, page_pilier) VALUES (?, ?, ?)');
  const insArticle = d.prepare(
    'INSERT OR IGNORE INTO articles (entite, grappe_id, titre, requete, intention) VALUES (?, ?, ?, ?, ?)',
  );
  const insBacklink = d.prepare(
    'INSERT OR IGNORE INTO backlinks (entite, domaine, type, priorite, note) VALUES (?, ?, ?, ?, ?)',
  );
  const insCampagne = d.prepare(
    'INSERT OR IGNORE INTO campagnes (entite, nom, canal, objectif, audience, budget, note) VALUES (?, ?, ?, ?, ?, ?, ?)',
  );
  const insSousForum = d.prepare(
    'INSERT OR IGNORE INTO sous_forums (nom, regle, plafond_jours, promotion_interdite, note) VALUES (?, ?, ?, ?, ?)',
  );
  const insConnexion = d.prepare('INSERT OR IGNORE INTO connexions (entite, reseau, barreau, note) VALUES (?, ?, ?, ?)');

  d.transaction(() => {
    for (const ent of ENTITES) {
      for (const g of GRAPPES[ent.slug]) {
        insGrappe.run(ent.slug, g.nom, g.pilier);
        const row = d.prepare('SELECT id FROM grappes WHERE entite = ? AND nom = ?').get(ent.slug, g.nom) as { id: number };
        for (const [titre, requete, intention] of g.articles) {
          insArticle.run(ent.slug, row.id, titre, requete, intention);
        }
      }
      for (const [domaine, type, prio, note] of BACKLINKS[ent.slug]) insBacklink.run(ent.slug, domaine, type, prio, note);
      for (const [nom, canal, objectif, audience, budget, note] of CAMPAGNES[ent.slug])
        insCampagne.run(ent.slug, nom, canal, objectif, audience, budget, note);
      for (const reseau of Object.keys(ent.reseaux)) {
        if (reseau === 'blog') continue;
        // Barreau 1 pour tous : les quatre comptes existent (confirmé le 2026-10-06).
        insConnexion.run(ent.slug, reseau, 1, 'Compte existant. Application développeur non créée.');
      }
    }
    for (const sf of SOUS_FORUMS) insSousForum.run(...sf);
  })();

  if (dejaFait.n > 0) return false;

  // ── Calendrier : 12 semaines, brouillons pré-remplis ───────────────────
  const ins = d.prepare(`
    INSERT OR IGNORE INTO publications
      (entite, format_slug, pilier, persona, sujet_ref, date_prevue, semaine, phase, raison,
       statut, titre, accroche, corps, appel, hashtags, consignes_visuel, preuve, indicateur)
    VALUES (@entite, @format_slug, @pilier, @persona, @sujet_ref, @date_prevue, @semaine, @phase, @raison,
            @statut, @titre, @accroche, @corps, @appel, @hashtags, @consignes_visuel, @preuve, @indicateur)
  `);

  const depart = new Date();
  d.transaction(() => {
    for (const ent of ENTITES) {
      const compteur = new Map<string, number>();
      // Un même sujet ne doit pas revenir deux fois dans la même semaine : pendant
      // les quatre semaines de lancement le pilier est forcé, et un pilier à deux
      // sujets se répéterait sinon du lundi au jeudi.
      const vusSemaine = new Map<number, Set<string>>();
      for (const c of deroule(ent.slug, depart, 12)) {
        const candidats = sujetsDe(ent.slug, c.pilier);
        const pool = candidats.length ? candidats : sujetsDe(ent.slug);
        const i = compteur.get(c.pilier) ?? 0;
        compteur.set(c.pilier, i + 1);
        if (!vusSemaine.has(c.semaine)) vusSemaine.set(c.semaine, new Set());
        const vus = vusSemaine.get(c.semaine)!;
        let s = pool[i % pool.length];
        if (vus.has(s.ref)) {
          // D'abord le reste du pilier, puis tout le réservoir de l'entité.
          const secours =
            pool.find((x) => !vus.has(x.ref)) ?? sujetsDe(ent.slug).find((x) => !vus.has(x.ref));
          if (secours) s = secours;
        }
        vus.add(s.ref);
        const b = fabriquer(s, c.formatSlug, ent.slug);
        ins.run({
          entite: ent.slug,
          format_slug: c.formatSlug,
          pilier: c.pilier,
          persona: s.persona,
          sujet_ref: s.ref,
          date_prevue: c.date,
          semaine: c.semaine,
          phase: c.phase,
          raison: c.raison,
          statut: 'brouillon',
          titre: b.titre ?? s.titre,
          accroche: b.accroche,
          corps: b.corps,
          appel: b.appel,
          hashtags: b.hashtags,
          consignes_visuel: b.consignesVisuel.join('\n'),
          preuve: s.preuve,
          indicateur: s.indicateur,
        });
      }
    }
  })();

  d.prepare('INSERT INTO journal (entite, action, detail) VALUES (NULL, ?, ?)').run(
    'semis',
    '12 semaines de calendrier générées pour les deux entités',
  );
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Démarrage
// ─────────────────────────────────────────────────────────────────────────────
//
// Volontairement en **fin de fichier** : `initialiser()` sème, et le semis lit
// les tables de référence (GRAPPES, BACKLINKS, CAMPAGNES, SOUS_FORUMS) déclarées
// plus haut avec `const`. Lancer l'attente au milieu du module les attrape dans
// leur zone morte temporelle — l'erreur, peu lisible, est « Cannot access 'p'
// before initialization » au moment de la compilation des pages.

const { d: _db, niveau: NIVEAU } = await initialiser();

export function niveauStockage() {
  return NIVEAU;
}

export function db(): Database.Database {
  return _db;
}
