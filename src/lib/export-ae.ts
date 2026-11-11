/**
 * Export vers After Effects : un script ExtendScript (.jsx) qui recrée la
 * vidéo de la machine sous forme de composition modifiable.
 *
 * Ce que le script construit (Fichier → Scripts → Exécuter le fichier de script) :
 *  - une composition aux dimensions et à la cadence de la vidéo (30 i/s) ;
 *  - le fond de la marque, puis la vidéo rendue par la machine en calque de
 *    référence (guide, désactivé à l'export) si le MP4 est posé à côté du script ;
 *  - la bande-son (WAV) si elle est posée à côté ;
 *  - un calque texte par plan, aux polices et couleurs de la charte, avec son
 *    entrée animée (montée + fondu) — à retravailler librement ;
 *  - un marqueur par plan (chapitre ou texte), pour se repérer et caler.
 *
 * Le script est en ES3 (ExtendScript) : pas de let, pas de fonctions fléchées.
 * Les polices doivent être installées sur le Mac (Bebas Neue, Kanit, Spectral,
 * Inter, JetBrains Mono) ; sinon After Effects substitue et le signale.
 */

import type { Montage } from './fabrique-video';

const POSTSCRIPT: Record<string, string> = {
  Bebas: 'BebasNeue-Regular',
  Spectral: 'Spectral-SemiBold',
  Inter: 'Inter-SemiBold',
  Kanit: 'Kanit-Bold',
  Mono: 'JetBrainsMono-Medium',
};

function rgb(hex: string): string {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  const v = [0, 2, 4].map((i) => (parseInt(n.slice(i, i + 2), 16) / 255).toFixed(4));
  return `[${v.join(', ')}]`;
}

const chaine = (s: string) => JSON.stringify(s).replace(/[\u2028\u2029]/g, ' ');

export function scriptAfterEffects(m: Montage, fichiers: { video: string; son?: string }): string {
  const th = m.theme;
  const police = POSTSCRIPT[th.policeTitre] ?? 'Inter-SemiBold';
  const etiquette = POSTSCRIPT[th.surTitre?.police ?? 'Mono'] ?? 'JetBrainsMono-Medium';
  const duree = m.plans.reduce((n, p) => n + p.duree, 0);
  const vertical = m.hauteur > m.largeur * 1.4;
  const taille = Math.round(m.largeur * (th.policeTitre === 'Bebas' ? (vertical ? 0.11 : 0.09) : vertical ? 0.075 : 0.068));
  let t = 0;
  const plans = m.plans.map((p, i) => {
    const de = t;
    t += p.duree;
    const texte = (th.majuscules ? p.texte.toUpperCase() : p.texte).replace(/\s+/g, ' ').trim();
    return { i, de, a: t, texte, chapitre: p.chapitre ?? '', accent: p.accent ?? '', centre: Boolean(p.centre), scene: p.scene?.type ?? 'titre' };
  });
  const nom = `${m.entite === 'veolt' ? 'Veolt' : 'MagistrIA'} · ${m.legende || 'vidéo'}`.slice(0, 60);

  return `// Projet After Effects — Machine à post (${m.entite === 'veolt' ? 'Veolt' : 'MagistrIA'})
// Fichier → Scripts → Exécuter le fichier de script…, puis choisir ce fichier.
// Poser à côté : ${fichiers.video}${fichiers.son ? ` et ${fichiers.son}` : ''} (facultatif, pour la référence et le son).
(function () {
  if (!app.project) app.newProject();
  app.beginUndoGroup(${chaine('Machine à post')});
  var dossier = new File($.fileName).parent;
  var comp = app.project.items.addComp(${chaine(nom)}, ${m.largeur}, ${m.hauteur}, 1, ${duree.toFixed(3)}, 30);
  comp.bgColor = ${rgb(th.fond)};
  var fond = comp.layers.addSolid(${rgb(th.fond)}, ${chaine('Fond · charte')}, ${m.largeur}, ${m.hauteur}, 1, ${duree.toFixed(3)});
  fond.locked = true;

  function importer(nomFichier) {
    var f = new File(dossier.fsName + '/' + nomFichier);
    if (!f.exists) return null;
    try { return app.project.importFile(new ImportOptions(f)); } catch (e) { return null; }
  }
  var video = importer(${chaine(fichiers.video)});
  if (video) {
    var ref = comp.layers.add(video);
    ref.name = ${chaine('Référence · rendu de la machine')};
    ref.guideLayer = true;
    ref.moveToEnd();
    fond.moveToEnd();
  }
  ${fichiers.son ? `var son = importer(${chaine(fichiers.son)});
  if (son) { var ls = comp.layers.add(son); ls.name = ${chaine('Bande-son · musique et bruitages')}; }` : ''}

  var plans = ${JSON.stringify(plans)};
  for (var i = 0; i < plans.length; i++) {
    var p = plans[i];
    var mk = new MarkerValue(p.chapitre || p.texte || p.scene);
    comp.markerProperty.setValueAtTime(p.de, mk);
    if (!p.texte) continue;
    var calque = comp.layers.addText(p.texte);
    calque.name = 'Plan ' + (i + 1) + ' · ' + p.texte.substring(0, 28);
    calque.inPoint = p.de;
    calque.outPoint = p.a;
    var source = calque.property('Source Text');
    var doc = source.value;
    doc.font = ${chaine(police)};
    doc.fontSize = ${taille};
    doc.fillColor = ${rgb(th.encre)};
    doc.applyFill = true;
    doc.applyStroke = false;
    doc.justification = p.centre ? ParagraphJustification.CENTER_JUSTIFY : ParagraphJustification.LEFT_JUSTIFY;
    doc.boxText = false;
    source.setValue(doc);
    var y = p.scene === 'titre' ? ${Math.round(m.hauteur * 0.47)} : ${Math.round(m.hauteur * 0.18)};
    var x = p.centre ? ${Math.round(m.largeur / 2)} : ${vertical ? 92 : 80};
    var pos = calque.property('Transform').property('Position');
    pos.setValueAtTime(p.de, [x, y + 28]);
    pos.setValueAtTime(p.de + 0.6, [x, y]);
    var op = calque.property('Transform').property('Opacity');
    op.setValueAtTime(p.de, 0);
    op.setValueAtTime(p.de + 0.45, 100);
    op.setValueAtTime(Math.max(p.de + 0.5, p.a - 0.2), 100);
    op.setValueAtTime(p.a, 0);
    var ease = new KeyframeEase(0, 75);
    pos.setTemporalEaseAtKey(2, [ease], [ease]);
    if (p.chapitre) {
      var ch = comp.layers.addText(p.chapitre.toUpperCase());
      ch.name = 'Chapitre ' + (i + 1);
      ch.inPoint = p.de;
      ch.outPoint = p.a;
      var cs = ch.property('Source Text');
      var cd = cs.value;
      cd.font = ${chaine(etiquette)};
      cd.fontSize = ${Math.round(m.largeur * 0.022)};
      cd.fillColor = ${rgb(th.surTitre?.couleur ?? th.accent)};
      cd.tracking = 220;
      cs.setValue(cd);
      ch.property('Transform').property('Position').setValue([x, y - ${Math.round(taille * 1.3)}]);
    }
    if (p.accent) {
      var ac = comp.layers.addText(p.accent);
      ac.name = 'Accent ' + (i + 1);
      ac.inPoint = p.de + 0.5;
      ac.outPoint = p.a;
      var as = ac.property('Source Text');
      var ad = as.value;
      ad.font = ${chaine(th.policeTitre === 'Bebas' ? police : 'Spectral-MediumItalic')};
      ad.fontSize = ${Math.round(m.largeur * 0.05)};
      ad.fillColor = ${rgb(th.accent2 ?? th.accent)};
      ad.justification = p.centre ? ParagraphJustification.CENTER_JUSTIFY : ParagraphJustification.LEFT_JUSTIFY;
      as.setValue(ad);
      ac.property('Transform').property('Position').setValue([x, y + ${Math.round(taille * 1.4)}]);
    }
  }
  comp.openInViewer();
  app.endUndoGroup();
  alert(${chaine('Composition créée : un calque par plan, un marqueur par plan. Le rendu de la machine est en calque guide (référence).')});
})();
`;
}
