"""
Le logotype en vraie 3D, rendu par Blender : l'apparition de la marque pour les
vidéos de la machine (plan « marque »), avec les polices et les couleurs des
sites en ligne.

  - veolt     : « VEOLT » en Bebas Neue, faces en métal sombre aubergine,
                tranches lumineuses magenta, lumières magenta / violet / orange.
  - magistria : « Magistr » en Spectral blanc nacré + « IA » or #E0B85A,
                éclairage cyan à gauche et ambre à droite, comme le cerveau du site.

Le mot pivote en entrant, la caméra avance doucement, un reflet traverse les
lettres. Fond à la couleur du site (#0C0C0C / #03050A).

Utilisation :
  blender -b -P outils/blender/logo_3d.py -- veolt outils/blender/rendu-logo-veolt [images] [echantillons] [largeur]

Puis assembler la séquence en clip :
  ffmpeg -framerate 24 -i <dossier>/image-%04d.png -c:v libx264 -pix_fmt yuv420p -crf 16 logo-veolt.mp4

Le clip se dépose dans la médiathèque avec l'origine « clip » sous le nom
`veolt-logo-3d.mp4` / `magistria-logo-3d.mp4` : un plan qui porte
`clip: 'veolt-logo-3d'` le prend en fond.
"""

import math
import os
import sys

import bpy

ARGS = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
MARQUE = ARGS[0] if ARGS else "veolt"
ICI = os.path.dirname(os.path.abspath(__file__))
SORTIE = ARGS[1] if len(ARGS) > 1 else os.path.join(ICI, f"rendu-logo-{MARQUE}")
IMAGES = int(ARGS[2]) if len(ARGS) > 2 else 96
ECHANTILLONS = int(ARGS[3]) if len(ARGS) > 3 else 32
LARGEUR = int(ARGS[4]) if len(ARGS) > 4 else 720
POLICES = os.path.normpath(os.path.join(ICI, "..", "..", "src", "assets", "polices"))


def hexa(h, a=1.0):
    h = h.lstrip("#")
    lin = lambda c: (c / 255) ** 2.2  # sRGB → linéaire, ce qu'attend Blender
    return (lin(int(h[0:2], 16)), lin(int(h[2:4], 16)), lin(int(h[4:6], 16)), a)


def materiau(nom, base, metal=0.0, rugosite=0.4, emission=None, force=0.0):
    m = bpy.data.materials.new(nom)
    m.use_nodes = True
    p = m.node_tree.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = hexa(base)
    p.inputs["Metallic"].default_value = metal
    p.inputs["Roughness"].default_value = rugosite
    if emission:
        p.inputs["Emission Color"].default_value = hexa(emission)
        p.inputs["Emission Strength"].default_value = force
    return m


def texte(mot, police, taille=1.0):
    bpy.ops.object.text_add(location=(0, 0, 0))
    t = bpy.context.object
    t.data.body = mot
    t.data.font = bpy.data.fonts.load(os.path.join(POLICES, police))
    t.data.size = taille
    t.data.extrude = 0.07 * taille
    t.data.bevel_depth = 0.012 * taille
    t.data.bevel_resolution = 3
    t.data.align_x = "LEFT"
    t.data.align_y = "CENTER"
    bpy.ops.object.convert(target="MESH")
    return bpy.context.object


def habiller(obj, face, tranche):
    """Faces avant et arrière d'un matériau, tranches et biseaux d'un autre."""
    obj.data.materials.append(face)
    obj.data.materials.append(tranche)
    for poly in obj.data.polygons:
        poly.material_index = 0 if abs(poly.normal.z) > 0.92 else 1


def lumiere(nom, type_, couleur, energie, position, taille=2.0):
    d = bpy.data.lights.new(nom, type_)
    d.color = hexa(couleur)[:3]
    d.energy = energie
    if type_ == "AREA":
        d.size = taille
    o = bpy.data.objects.new(nom, d)
    bpy.context.collection.objects.link(o)
    o.location = position
    cible = bpy.data.objects.get("Cible")
    if cible:
        c = o.constraints.new("TRACK_TO")
        c.target = cible
        c.track_axis = "TRACK_NEGATIVE_Z"
        c.up_axis = "UP_Y"
    return o


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    cible = bpy.data.objects.new("Cible", None)
    bpy.context.collection.objects.link(cible)

    groupe = bpy.data.objects.new("Logo", None)
    bpy.context.collection.objects.link(groupe)

    if MARQUE == "veolt":
        fond = "#0C0C0C"
        mot = texte("VEOLT", "BebasNeue.ttf", 1.6)
        habiller(
            mot,
            materiau("Face", "#1A0B22", metal=0.85, rugosite=0.22),
            materiau("Tranche", "#B600A8", metal=0.3, rugosite=0.3, emission="#B600A8", force=7.0),
        )
        mots = [mot]
        lumieres = [("Clé", "#C79BFF", 900, (-3.5, -4.0, 3.0)), ("Contre", "#BE4C00", 700, (4.0, 2.5, 2.0)), ("Remplissage", "#7621B0", 400, (0.0, -5.0, -2.0))]
    else:
        fond = "#03050A"
        debut = texte("Magistr", "Spectral-SemiBold.ttf", 1.1)
        habiller(debut, materiau("Nacre", "#E9EEF5", metal=0.6, rugosite=0.2), materiau("NacreTranche", "#9AA9BB", metal=0.8, rugosite=0.25))
        fin = texte("IA", "Spectral-SemiBold.ttf", 1.1)
        habiller(fin, materiau("Or", "#E0B85A", metal=0.9, rugosite=0.22, emission="#E0B85A", force=0.35), materiau("OrTranche", "#B8862E", metal=1.0, rugosite=0.25, emission="#E0B85A", force=1.2))
        bpy.context.view_layer.update()
        fin.location.x = debut.dimensions.x + 0.02
        mots = [debut, fin]
        # Clé presque blanche (le mot doit rester nacré), cyan et ambre en contre-jour.
        lumieres = [("Clé", "#E9EEF5", 700, (-2.5, -5.0, 2.5)), ("Cyan", "#3CC8FF", 500, (-4.5, 1.5, 1.5)), ("Contre", "#FF9A3C", 600, (4.0, 2.5, 2.0)), ("Haut", "#FFFFFF", 400, (0.0, -1.0, 5.0))]

    # Centrer le mot et le rattacher au groupe qui va pivoter.
    bpy.context.view_layer.update()
    xs = [v.co.x + o.location.x for o in mots for v in o.data.vertices]
    milieu = (min(xs) + max(xs)) / 2
    for o in mots:
        o.location.x -= milieu
        o.rotation_euler = (math.pi / 2, 0, 0)  # debout, face à la caméra
        o.parent = groupe
    # Même largeur pour les deux marques : le mot tient dans le cadre 9:16 avec ses marges.
    k = 2.75 / (max(xs) - min(xs))
    groupe.scale = (k, k, k)

    # Un sol sombre et brillant sous le mot : le reflet donne la profondeur.
    bpy.context.view_layer.update()
    zs = [(o.matrix_world @ v.co).z for o in mots for v in o.data.vertices]
    bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, min(zs) - 0.04))
    sol = bpy.context.object
    sol.data.materials.append(materiau("Sol", fond, metal=0.2, rugosite=0.12))

    for nom, coul, e, pos in lumieres:
        lumiere(nom, "AREA", coul, e, pos, 3.0)
    # Le reflet qui traverse les lettres : une lumière étroite qui glisse.
    reflet = lumiere("Reflet", "AREA", "#FFFFFF", 0, (-6.0, -3.0, 0.4), 0.6)

    cam_d = bpy.data.cameras.new("Caméra")
    cam_d.lens = 50
    cam = bpy.data.objects.new("Caméra", cam_d)
    bpy.context.collection.objects.link(cam)
    sc.camera = cam
    c = cam.constraints.new("TRACK_TO")
    c.target = cible
    c.track_axis = "TRACK_NEGATIVE_Z"
    c.up_axis = "UP_Y"

    # ── Animation ──
    sc.frame_start, sc.frame_end = 1, IMAGES
    sc.render.fps = 24
    n = IMAGES
    for f, rz, ech in [(1, math.radians(-38), 0.82), (int(n * 0.55), math.radians(4), 1.0), (n, math.radians(0), 1.02)]:
        groupe.rotation_euler = (0, 0, rz)
        groupe.scale = (ech * k, ech * k, ech * k)
        groupe.keyframe_insert("rotation_euler", frame=f)
        groupe.keyframe_insert("scale", frame=f)
    for f, y in [(1, -9.5), (n, -7.6)]:
        cam.location = (0.0, y, 0.35)
        cam.keyframe_insert("location", frame=f)
    for f, x, e in [(int(n * 0.35), -6.0, 0), (int(n * 0.45), -4.0, 1400), (int(n * 0.75), 5.0, 1400), (int(n * 0.85), 7.0, 0)]:
        reflet.location.x = x
        reflet.data.energy = e
        reflet.keyframe_insert("location", frame=f)
        reflet.data.keyframe_insert("energy", frame=f)

    # ── Rendu ──
    monde = bpy.data.worlds.new("Fond")
    monde.use_nodes = True
    monde.node_tree.nodes["Background"].inputs["Color"].default_value = hexa(fond)
    monde.node_tree.nodes["Background"].inputs["Strength"].default_value = 1.0
    sc.world = monde
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = ECHANTILLONS
    # La version Ubuntu de Blender est compilée sans OpenImageDenoise : pas de
    # débruitage ici (ffmpeg hqdn3d au montage) ; sur le Mac, le mettre à True.
    sc.cycles.use_denoising = os.environ.get("DEBRUITER") == "1"
    sc.render.resolution_x = LARGEUR
    sc.render.resolution_y = int(LARGEUR * 16 / 9)
    sc.render.image_settings.file_format = "PNG"
    sc.view_settings.view_transform = "AgX" if "AgX" in [v.identifier for v in type(sc.view_settings).bl_rna.properties["view_transform"].enum_items] else "Filmic"
    sc.view_settings.look = "None"
    sc.render.filepath = os.path.join(SORTIE, "image-")
    # Le halo des sites : « Fog Glow » dans le compositeur.
    sc.use_nodes = True
    arbre = sc.node_tree
    arbre.nodes.clear()
    rl = arbre.nodes.new("CompositorNodeRLayers")
    gl = arbre.nodes.new("CompositorNodeGlare")
    gl.glare_type = "FOG_GLOW"
    gl.quality = "MEDIUM"
    gl.threshold = 0.8
    gl.size = 8
    out = arbre.nodes.new("CompositorNodeComposite")
    arbre.links.new(rl.outputs["Image"], gl.inputs["Image"])
    arbre.links.new(gl.outputs["Image"], out.inputs["Image"])

    os.makedirs(SORTIE, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(SORTIE, f"logo-{MARQUE}.blend"))
    une = os.environ.get("UNE_IMAGE")
    if une:
        # Essai : une seule image, pour régler cadrage et lumière avant le rendu complet.
        sc.frame_set(int(une))
        sc.render.filepath = os.path.join(SORTIE, f"essai-{une}.png")
        bpy.ops.render.render(write_still=True)
    else:
        bpy.ops.render.render(animation=True)


main()
