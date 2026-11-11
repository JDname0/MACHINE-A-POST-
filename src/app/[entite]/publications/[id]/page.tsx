import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Flanc } from '@/components/Flanc';
import { marque, type EntiteSlug } from '@/lib/marques';
import { format, type FormatSlug } from '@/lib/formats';
import { publication, compteursMenu, formaterDate, LIBELLE_STATUT, sousForums, mediasDePublication } from '@/lib/requetes';
import { constatsDe, lienVisuel as lienVisuelDe, texteAColler as texteDuPost } from '@/lib/fiche';
import { diagnostiquer, CONNEXIONS, type ReseauConnectable } from '@/lib/connecteurs';
import { gabaritPour, GABARITS } from '@/lib/visuels';
import { controlerMedia, attendu } from '@/lib/conformite-media';
import { poids, duree, estVideo } from '@/lib/medias';
import { db } from '@/lib/db';
import { AssistantIA } from '@/components/AssistantIA';
import { enregistrerPublication, changerStatut, marquerPublie, publierParApi, releverMetrique, memoriserVisuel } from '@/app/actions';

export default async function Composeur({
  params,
  searchParams,
}: {
  params: Promise<{ entite: string; id: string }>;
  searchParams: Promise<{ erreurIA?: string }>;
}) {
  const { entite, id } = await params;
  const { erreurIA } = await searchParams;
  const e = entite as EntiteSlug;
  const p = publication(Number(id));
  if (!p || p.entite !== e) notFound();

  const m = marque(e);
  const f = format(p.format_slug);
  const apportes = mediasDePublication(p.id);
  const attenduParLeFormat = attendu(p.format_slug);
  // Chaque fichier rattaché est confronté au format **avant** d'arriver au
  // moment de publier : un Reel en 1:1 ou une vidéo de trois minutes se voit
  // ici, pas dans le refus de l'API.
  const examines = apportes.map((m) => ({ m, constats: controlerMedia(p.format_slug, m) }));
  const publiables = examines.filter((x) => !x.constats.some((k) => k.niveau === 'blocage'));
  const fs = sousForums();
  const { constats, validable } = constatsDe(p);
  const total = `${p.accroche}\n${p.corps}\n${p.appel}`.trim().length;

  const connectable = f.reseau !== 'blog';
  const diag = connectable ? diagnostiquer(f.reseau as ReseauConnectable) : null;
  const spec = connectable ? CONNEXIONS[f.reseau as ReseauConnectable] : null;

  const releves = db()
    .prepare('SELECT * FROM metriques WHERE publication_id=? ORDER BY id DESC')
    .all(p.id) as Array<{ impressions: number | null; interactions: number | null; clics: number | null; duree_s: number | null; note: string | null; releve_le: string }>;

  const texteAColler = texteDuPost(p);

  // Le visuel qui va avec ce post, pré-rempli de son propre texte.
  const slugVisuel = gabaritPour(p.format_slug, p.pilier);
  const lienVisuel = lienVisuelDe(p);

  return (
    <>
      <Flanc entite={e} page="publications" compteurs={compteursMenu(e)} />
      <main className="corps">
        <header className="entete">
          <div className="sur">
            {f.nom} · {formaterDate(p.date_prevue)} · {p.phase ?? (p.semaine ? `semaine ${p.semaine}` : 'hors calendrier')}
          </div>
          <h1>{p.titre}</h1>
          <p className="sous">
            <strong style={{ color: 'var(--encre)' }}>Pourquoi ce créneau :</strong> {p.raison}
          </p>
          <div className="rang" style={{ marginTop: 10 }}>
            <span className="pastille" data-t={p.statut === 'publie' ? 'ok' : p.statut === 'valide' ? 'accent' : undefined}>
              {LIBELLE_STATUT[p.statut]}
            </span>
            <span className="pastille">{total} caractères</span>
            <span className="pastille" data-t={validable ? 'ok' : 'blocage'}>
              {validable ? 'validable' : 'bloqué'}
            </span>
            <Link className="pastille" href={`/${e}/publications`}>
              ← la file
            </Link>
          </div>
        </header>

        <div className="grille" style={{ gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 1fr)' }}>
          {/* ── Le brouillon ──────────────────────────────────────────── */}
          <section>
            <form action={enregistrerPublication}>
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="entite" value={e} />

              <div className="champ">
                <label htmlFor="titre">{f.reseau === 'reddit' ? 'Titre du post' : 'Titre interne'}</label>
                <input id="titre" name="titre" defaultValue={p.titre ?? ''} />
              </div>

              <div className="champ">
                <label htmlFor="accroche">
                  Accroche — {f.accrocheLibelle}, {f.accrocheMax} caractères max
                </label>
                <textarea id="accroche" name="accroche" rows={3} defaultValue={p.accroche} />
                <div className="aide">{f.ossature[0].consigne}</div>
              </div>

              <div className="champ">
                <label htmlFor="corps">Corps</label>
                <textarea id="corps" name="corps" rows={16} defaultValue={p.corps} />
                <div className="aide">
                  Fourchette utile du format : {f.utileMin} à {f.utileMax} caractères. Plafond plateforme : {f.maxCaracteres}.
                </div>
              </div>

              <div className="champ">
                <label htmlFor="appel">Appel — une seule demande</label>
                <textarea id="appel" name="appel" rows={2} defaultValue={p.appel} />
              </div>

              {f.reseau !== 'reddit' && f.reseau !== 'blog' ? (
                <div className="champ">
                  <label htmlFor="hashtags">Hashtags</label>
                  <input id="hashtags" name="hashtags" defaultValue={p.hashtags} />
                  <div className="aide">LinkedIn : 3 maximum, descriptifs, en pied.</div>
                </div>
              ) : (
                <input type="hidden" name="hashtags" value={p.hashtags} />
              )}

              <div className="champ">
                <label htmlFor="consignes">Consignes de production du visuel — pas du texte à publier</label>
                <textarea id="consignes" name="consignes_visuel" rows={6} defaultValue={p.consignes_visuel} />
              </div>

              <div className="sep" />
              <h2>Le gabarit commun</h2>
              <p className="aide" style={{ marginBottom: 12 }}>
                Six questions. Sans les quatre premières, la machine refuse de valider — un post qui ne sait pas à qui il
                parle ni ce qu&apos;il prouve ne construit rien.
              </p>

              <div className="grille g2">
                <div className="champ">
                  <label htmlFor="persona">À qui ?</label>
                  <select id="persona" name="persona" defaultValue={p.persona ?? ''}>
                    <option value="">— non renseigné —</option>
                    {m.personas.map((x) => (
                      <option key={x.slug} value={x.slug}>
                        {x.nom}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="champ">
                  <label htmlFor="pilier">Quel pilier ?</label>
                  <select id="pilier" name="pilier" defaultValue={p.pilier}>
                    {m.piliers.map((x) => (
                      <option key={x.slug} value={x.slug}>
                        {x.nom} ({x.part} %)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="champ">
                <label htmlFor="preuve">Quelle preuve ?</label>
                <input id="preuve" name="preuve" defaultValue={p.preuve ?? ''} list="preuves" />
                <datalist id="preuves">
                  {m.preuvesAutorisees.map((x) => (
                    <option key={x} value={x} />
                  ))}
                </datalist>
                <div className="aide">Autorisées pour {m.nom} : {m.preuvesAutorisees.slice(0, 2).join(' · ')}…</div>
              </div>
              <div className="champ">
                <label htmlFor="indicateur">Qu&apos;est-ce qu&apos;on mesure ?</label>
                <input id="indicateur" name="indicateur" defaultValue={p.indicateur ?? ''} />
                <div className="aide">Sur ce format : {f.indicateurCle}.</div>
              </div>

              {f.reseau === 'reddit' ? (
                <div className="champ">
                  <label htmlFor="sf">Sous-forum</label>
                  <select id="sf" name="sous_forum" defaultValue={p.sous_forum ?? ''}>
                    <option value="">— non choisi —</option>
                    {fs.map((x) => (
                      <option key={x.id} value={x.nom} disabled={x.promotion_interdite === 1}>
                        {x.nom} — {x.regle}
                      </option>
                    ))}
                  </select>
                  <div className="aide">
                    Les sous-forums où la promotion est interdite sont désactivés : on y répond, on n&apos;y poste pas.
                  </div>
                </div>
              ) : (
                <input type="hidden" name="sous_forum" value={p.sous_forum ?? ''} />
              )}

              <button type="submit">Enregistrer le brouillon</button>
            </form>
          </section>

          {/* ── Contrôle, ossature, publication ───────────────────────── */}
          <aside className="pile">
            <div className="carte">
              <h3>Contrôle — {constats.length} constat{constats.length > 1 ? 's' : ''}</h3>
              {constats.length === 0 ? (
                <p style={{ color: 'var(--ok)' }}>Rien à signaler. Le brouillon peut être validé.</p>
              ) : (
                <div style={{ marginTop: 9 }}>
                  {constats.map((c, i) => (
                    <div key={i} className="constat" data-n={c.niveau}>
                      <div className="regle">{c.regle}</div>
                      <div className="msg">{c.message}</div>
                      <div className="remede">{c.remede}</div>
                    </div>
                  ))}
                </div>
              )}
              <AssistantIA
                p={p}
                retour={`/${e}/publications/${p.id}`}
                erreur={erreurIA?.startsWith(`${p.id}|`) ? erreurIA.slice(String(p.id).length + 1) : undefined}
              />
            </div>

            <div className="carte">
              <h3>Statut</h3>
              <p style={{ marginBottom: 10 }}>
                {validable
                  ? 'Aucun blocage. À toi de valider.'
                  : "Validation impossible tant qu'un blocage subsiste. Ce n'est pas une question de style."}
              </p>
              <div className="rang">
                {(['brouillon', 'a-relire', 'valide', 'abandonne'] as const).map((s) => (
                  <form key={s} action={changerStatut}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="entite" value={e} />
                    <input type="hidden" name="statut" value={s} />
                    <button
                      type="submit"
                      className={p.statut === s ? '' : 'fantome'}
                      disabled={s === 'valide' && !validable}
                    >
                      {LIBELLE_STATUT[s]}
                    </button>
                  </form>
                ))}
              </div>
            </div>

            {lienVisuel && slugVisuel ? (
              <div className="carte">
                <div className="rang" style={{ justifyContent: 'space-between', marginBottom: 9 }}>
                  <h3>Visuel</h3>
                  <span className="pastille" data-t="accent">
                    {GABARITS[slugVisuel].nom} · {GABARITS[slugVisuel].ratio}
                  </span>
                </div>
                <p style={{ marginBottom: 11 }}>
                  Généré depuis le titre et l&apos;accroche de ce post. Modifie-les au-dessus, enregistre, et l&apos;image
                  suit.
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={lienVisuel}
                  alt={`Visuel — ${p.titre}`}
                  style={{ width: '100%', height: 'auto', borderRadius: 10, border: '1px solid var(--ligne)', display: 'block' }}
                />
                <div className="rang" style={{ marginTop: 11 }}>
                  <a className="bouton fantome" href={lienVisuel} download={`${e}-${p.id}.png`}>
                    Télécharger le PNG
                  </a>
                  <form action={memoriserVisuel}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="entite" value={e} />
                    <button type="submit" className="fantome" title="Range ce visuel dans la médiathèque : il devient matière pour le studio vidéo">
                      Mémoriser
                    </button>
                  </form>
                  <Link className="bouton fantome" href={`/${e}/visuels`}>
                    Tous les gabarits
                  </Link>
                </div>
              </div>
            ) : (
              <div className="carte">
                <h3>Visuel</h3>
                <p>
                  Aucun visuel pour ce format — c&apos;est volontaire.{' '}
                  {f.reseau === 'reddit'
                    ? 'Un post Reddit est textuel : une image de marque y est lue comme une publicité.'
                    : 'Un article porte ses propres illustrations de section.'}
                </p>
              </div>
            )}

            {apportes.length > 0 ? (
              <div className="carte">
                <div className="rang" style={{ justifyContent: 'space-between', marginBottom: 9 }}>
                  <h3>Média de la publication</h3>
                  <span className="pastille" data-t={publiables.length > 0 ? 'ok' : 'blocage'}>
                    {publiables.length} sur {apportes.length} conforme{publiables.length > 1 ? 's' : ''}
                  </span>
                </div>
                <p style={{ marginBottom: 11 }}>
                  Déposé à la main pour ce post — ce que le générateur ne sait pas faire : un rendu, une photo, un
                  montage, un écran du produit. {f.nom} attend{' '}
                  {attenduParLeFormat === 'aucun' ? 'du texte seul' : attenduParLeFormat === 'video' ? 'une vidéo' : 'une image'}.
                </p>

                <div className="pile" style={{ gap: 13 }}>
                  {examines.map(({ m, constats }) => (
                    <div key={m.id} className="grille" style={{ gridTemplateColumns: '96px minmax(0,1fr)', gap: 12 }}>
                      {estVideo(m.type_mime) ? (
                        <video
                          src={`/${e}/medias/${m.id}#t=2`}
                          preload="metadata"
                          muted
                          style={{ width: 96, aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: 8, border: '1px solid var(--ligne)', background: '#000' }}
                        />
                      ) : (
                        <a href={`/${e}/medias/${m.id}`} target="_blank" rel="noreferrer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/${e}/medias/${m.id}`}
                            alt={m.legende ?? m.nom}
                            style={{ width: 96, aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: 8, border: '1px solid var(--ligne)' }}
                          />
                        </a>
                      )}
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 600, wordBreak: 'break-word' }}>{m.nom}</div>
                        <div className="rang" style={{ gap: 5, marginTop: 6 }}>
                          <span className="pastille" data-t={estVideo(m.type_mime) ? 'accent' : undefined}>
                            {estVideo(m.type_mime) ? 'vidéo' : 'image'}
                          </span>
                          {m.largeur && m.hauteur ? <span className="pastille">{m.largeur} × {m.hauteur}</span> : null}
                          {duree(m.duree_s) ? <span className="pastille">{duree(m.duree_s)}</span> : null}
                          <span className="pastille">{poids(m.octets)}</span>
                        </div>
                        {constats.length === 0 ? (
                          <div className="aide">Conforme au format. Rien à signaler.</div>
                        ) : (
                          constats.map((k, i) => (
                            <div className="constat" data-n={k.niveau} key={i} style={{ marginTop: 7 }}>
                              <div className="regle">{k.regle}</div>
                              <div className="msg">{k.message}</div>
                              <div className="remede">{k.remede}</div>
                            </div>
                          ))
                        )}
                        <div className="rang" style={{ marginTop: 8 }}>
                          <a className="bouton fantome" href={`/${e}/medias/${m.id}`} download={m.nom} style={{ padding: '6px 11px', fontSize: 12 }}>
                            Télécharger
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rang" style={{ marginTop: 13 }}>
                  <Link className="bouton fantome" href={`/${e}/visuels#images`}>
                    La médiathèque
                  </Link>
                </div>
              </div>
            ) : attenduParLeFormat !== 'aucun' ? (
              <div className="carte">
                <h3>Média de la publication</h3>
                <p>
                  Aucun fichier rattaché. {f.nom} attend {attenduParLeFormat === 'video' ? 'une vidéo' : 'une image'} —
                  {attenduParLeFormat === 'video'
                    ? ' le visuel généré ne sert ici que de couverture, pas de contenu.'
                    : ' le gabarit généré ci-dessus fait l’affaire, et un fichier apporté le remplace.'}
                </p>
                <div className="rang" style={{ marginTop: 11, gap: 8 }}>
                  {attenduParLeFormat === 'video' ? (
                    <Link className="bouton" href={`/${e}/videos?p=${p.id}`}>
                      Monter la vidéo dans le studio
                    </Link>
                  ) : null}
                  <Link className="bouton fantome" href={`/${e}/visuels#images`}>
                    Déposer un fichier
                  </Link>
                </div>
              </div>
            ) : null}

            <div className="carte">
              <h3>Voie 1 — publication manuelle assistée</h3>
              <p style={{ marginBottom: 9 }}>
                Opérationnelle aujourd&apos;hui, et elle reste disponible même API branchée. Le texte ci-dessous est au
                format exact du réseau.
              </p>
              <pre className="bloc" style={{ maxHeight: 230 }}>{texteAColler}</pre>
              <form action={marquerPublie} style={{ marginTop: 11 }}>
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="entite" value={e} />
                <div className="champ">
                  <label htmlFor="url">Adresse de la publication, une fois en ligne</label>
                  <input id="url" name="url_publiee" defaultValue={p.url_publiee ?? ''} placeholder="https://…" />
                </div>
                <button type="submit" className="fantome" disabled={p.statut !== 'valide' && p.statut !== 'publie'}>
                  Marquer comme publié
                </button>
              </form>
            </div>

            {connectable && diag && spec ? (
              <div className="carte">
                <h3>Voie 2 — {spec.nom} par API</h3>
                {!diag.pret ? (
                  <>
                    <p>
                      Connecteur inerte. {diag.manquantes.length} variable(s) manquante(s) :{' '}
                      <span className="mono">{diag.manquantes.join(', ')}</span>
                    </p>
                    <p style={{ marginTop: 7 }}>{spec.piege}</p>
                    <div style={{ marginTop: 10 }}>
                      <Link className="bouton fantome" href={`/${e}/comptes`}>
                        L&apos;échelle à gravir
                      </Link>
                    </div>
                  </>
                ) : (
                  <form action={publierParApi}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="entite" value={e} />
                    {attenduParLeFormat !== 'aucun' ? (
                      <div className="champ">
                        <label htmlFor="media">Média à joindre</label>
                        <select id="media" name="media_id" defaultValue={publiables[0] ? String(publiables[0].m.id) : ''}>
                          <option value="">— aucun —</option>
                          {publiables.map(({ m }) => (
                            <option key={m.id} value={m.id}>
                              {m.nom}
                              {m.largeur ? ` · ${m.largeur} × ${m.hauteur}` : ''}
                              {duree(m.duree_s) ? ` · ${duree(m.duree_s)}` : ''}
                            </option>
                          ))}
                        </select>
                        <div className="aide">
                          {publiables.length === 0
                            ? 'Aucun fichier conforme rattaché à cette publication. Les fichiers bloqués ne sont pas proposés ici.'
                            : f.reseau === 'linkedin'
                              ? 'LinkedIn n’attache pas encore le fichier : son API exige un envoi en deux temps, à brancher une fois la revue passée. Le fichier reste à joindre à la main.'
                              : 'L’outil signe une adresse temporaire, valable deux heures, que le réseau ira chercher. Le fichier reste privé le reste du temps.'}
                        </div>
                      </div>
                    ) : null}
                    <button type="submit" disabled={p.statut !== 'valide'}>
                      Publier sur {spec.nom}
                    </button>
                    <div className="aide" style={{ marginTop: 7 }}>
                      {p.statut !== 'valide'
                        ? 'Le bouton n’est actif que sur une publication validée. C’est la règle du cadrage §1.'
                        : 'Le résultat, succès ou échec, est écrit au journal.'}
                    </div>
                  </form>
                )}
              </div>
            ) : null}

            <div className="carte">
              <h3>Ossature du format</h3>
              <p style={{ marginBottom: 9 }}>{f.raison}</p>
              <div className="pile">
                {f.ossature.map((o) => (
                  <div key={o.nom} style={{ fontSize: 12.5 }}>
                    <strong>{o.nom}</strong>
                    {o.limite ? <span className="pastille" style={{ marginLeft: 6 }}>{o.limite} car.</span> : null}
                    <div style={{ color: 'var(--encre-dim)' }}>{o.consigne}</div>
                  </div>
                ))}
              </div>
              <div className="sep" style={{ margin: '13px 0' }} />
              <h3>Pièges</h3>
              <ul style={{ paddingLeft: 17, color: 'var(--encre-dim)', fontSize: 12.5, marginTop: 6 }}>
                {f.pieges.map((x) => (
                  <li key={x} style={{ marginBottom: 4 }}>{x}</li>
                ))}
              </ul>
            </div>

            <div className="carte">
              <h3>Relevé</h3>
              <p style={{ marginBottom: 9 }}>
                Saisi à la main après lecture des statistiques du réseau. La machine ne relève rien automatiquement — le
                prétendre serait faux.
              </p>
              <form action={releverMetrique}>
                <input type="hidden" name="publication_id" value={p.id} />
                <input type="hidden" name="entite" value={e} />
                <div className="grille g2">
                  <div className="champ">
                    <label htmlFor="imp">Impressions</label>
                    <input id="imp" name="impressions" inputMode="numeric" />
                  </div>
                  <div className="champ">
                    <label htmlFor="int">Interactions</label>
                    <input id="int" name="interactions" inputMode="numeric" />
                  </div>
                  <div className="champ">
                    <label htmlFor="cli">Clics sortants</label>
                    <input id="cli" name="clics" inputMode="numeric" />
                  </div>
                  <div className="champ">
                    <label htmlFor="dur">Durée moyenne (s)</label>
                    <input id="dur" name="duree_s" inputMode="decimal" />
                  </div>
                </div>
                <button type="submit" className="fantome">Enregistrer le relevé</button>
              </form>
              {releves.length > 0 ? (
                <div className="tbl-enveloppe" style={{ marginTop: 12, background: 'transparent', border: 'none' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Le</th>
                        <th>Imp.</th>
                        <th>Inter.</th>
                        <th>Clics</th>
                        <th>Durée</th>
                      </tr>
                    </thead>
                    <tbody>
                      {releves.map((r, i) => (
                        <tr key={i}>
                          <td className="mono">{r.releve_le.slice(0, 10)}</td>
                          <td>{r.impressions ?? '—'}</td>
                          <td>{r.interactions ?? '—'}</td>
                          <td>{r.clics ?? '—'}</td>
                          <td>{r.duree_s != null ? `${r.duree_s} s` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
