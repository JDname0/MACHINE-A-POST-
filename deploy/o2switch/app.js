/**
 * Fichier de démarrage pour Passenger (cPanel « Setup Node.js App », o2switch).
 *
 * Il est copié à la racine du build `standalone`, à côté du `server.js` que
 * Next génère. Passenger fournit le port et intercepte l'écoute ; les
 * variables (MAP_STOCKAGE, MAP_DOSSIER_DONNEES, MACHINE_MOT_DE_PASSE,
 * MACHINE_CLE_SESSION…) sont posées dans cPanel, jamais dans ce dépôt.
 */
process.env.NODE_ENV = 'production';
process.chdir(__dirname);
require('./server.js');
