"""
Le noyau de particules des sites, refait dans Blender — pour un rendu 3D
haut de gamme (profondeur de champ, vrai halo, mouvement de caméra) à poser
ensuite dans une vidéo de la machine ou dans After Effects.

  - MARQUE = "veolt"     : sphère de Fibonacci argent / magenta / blanc (veolt.fr)
  - MARQUE = "magistria" : cerveau de particules bleu nuit / cyan / blanc tirant
                           à l'orange sur la droite, et anneaux du cadran (magistrai.fr)

Utilisation (Blender 4.2 ou plus récent) :
  blender --background --python outils/blender/noyau_particules.py -- veolt
  blender --background --python outils/blender/noyau_particules.py -- magistria

Sortie : une séquence PNG à fond transparent (1080 × 1920, 30 i/s) dans
outils/blender/rendu-<marque>/ — à importer dans After Effects (mode « Écran »)
ou à déposer dans la médiathèque une fois assemblée en vidéo.

Les réglages reprennent ceux du code (src/lib/scene3d.ts) : même nombre de
points, même graine, mêmes couleurs, mêmes rayons. Rien n'est inventé : c'est
la même scène, avec un vrai moteur de rendu.
"""

import math
import os
import random
import sys

import bpy

ARGS = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
MARQUE = ARGS[0] if ARGS else "veolt"
DUREE_S = float(ARGS[1]) if len(ARGS) > 1 else 6.0
FPS = 30
N = 16000
DOSSIER = os.path.join(os.path.dirname(os.path.abspath(__file__)), f"rendu-{MARQUE}")

PALETTES = {
    # (zone sombre, zone milieu, zone claire) — comme les shaders des sites
    "veolt": [(0.729, 0.800, 0.839), (0.714, 0.0, 0.659), (1.0, 1.0, 1.0)],
    "magistria": [(0.0, 0.22, 0.95), (0.0, 0.75, 1.0), (1.0, 1.0, 1.0)],
}
CHAUD = [(0.85, 0.20, 0.0), (1.0, 0.52, 0.04), (1.0, 1.0, 1.0)]

random.seed(2024 if MARQUE == "veolt" else 1337)


def vider_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def points_sphere(n, r=2.0):
    pts = []
    for s in range(n):
        v = math.acos(1 - 2 * (s + 0.5) / n)
        g = math.pi * (1 + math.sqrt(5)) * (s + 0.5)
        y = r * (0.8 + random.random() * 0.4)
        pts.append((y * math.sin(v) * math.cos(g), y * math.sin(v) * math.sin(g), y * math.cos(v)))
    return pts


def points_cerveau(n):
    coquille = int(n * 0.85)
    pts = points_sphere(coquille, 2.03)
    noeuds = []
    while len(noeuds) < 64:
        v = [random.random() * 2 - 1 for _ in range(3)]
        l2 = sum(c * c for c in v)
        if l2 < 0.01 or l2 > 1:
            continue
        k = 1.45 * random.random() ** 0.45 / math.sqrt(l2)
        noeuds.append([c * k for c in v])
    aretes = []
    for i, a in enumerate(noeuds):
        proches = sorted(((j, sum((a[d] - b[d]) ** 2 for d in range(3))) for j, b in enumerate(noeuds) if j != i), key=lambda x: x[1])
        for j, _ in proches[:2]:
            aretes.append((a, noeuds[j]))
    for _ in range(n - coquille):
        a, b = random.choice(aretes)
        t = random.random()
        pts.append(tuple(a[d] + (b[d] - a[d]) * t + (random.random() - 0.5) * 0.05 for d in range(3)))
    return pts


def couleur(p):
    """Zones de couleur : un bruit simple sur la position, comme les trois octaves du site."""
    z = 0.5 + 0.5 * math.sin(p[0] * 1.7 + 0.3) * math.cos(p[1] * 1.3 - 0.7) * math.sin(p[2] * 1.1 + 1.9)
    z = 0.55 * z + 0.45 * random.random()
    pal = PALETTES[MARQUE]
    if MARQUE == "magistria" and p[0] > 0.3 and random.random() < min(0.5, p[0] / 4):
        pal = CHAUD
    return pal[0] if z < 0.42 else pal[2] if z > 0.67 else pal[1]


def creer_nuage(pts):
    maillage = bpy.data.meshes.new("nuage")
    maillage.from_pydata(pts, [], [])
    attr = maillage.color_attributes.new(name="Couleur", type="FLOAT_COLOR", domain="POINT")
    for i, p in enumerate(pts):
        c = couleur(p)
        attr.data[i].color = (c[0], c[1], c[2], 1.0)
    obj = bpy.data.objects.new("Noyau", maillage)
    bpy.context.collection.objects.link(obj)

    # Une petite sphère émissive par point (Geometry Nodes : instance sur les points).
    gn = obj.modifiers.new("Particules", "NODES")
    arbre = bpy.data.node_groups.new("Particules", "GeometryNodeTree")
    arbre.interface.new_socket("Geometry", in_out="INPUT", socket_type="NodeSocketGeometry")
    arbre.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
    nd = arbre.nodes
    entree = nd.new("NodeGroupInput")
    sortie = nd.new("NodeGroupOutput")
    ico = nd.new("GeometryNodeMeshIcoSphere")
    ico.inputs["Radius"].default_value = 0.012
    ico.inputs["Subdivisions"].default_value = 1
    inst = nd.new("GeometryNodeInstanceOnPoints")
    hasard = nd.new("FunctionNodeRandomValue")
    hasard.inputs["Min"].default_value = 0.5
    hasard.inputs["Max"].default_value = 1.6
    reel = nd.new("GeometryNodeRealizeInstances")
    mat = nd.new("GeometryNodeSetMaterial")
    lien = arbre.links.new
    lien(entree.outputs["Geometry"], inst.inputs["Points"])
    lien(ico.outputs["Mesh"], inst.inputs["Instance"])
    lien(hasard.outputs["Value"], inst.inputs["Scale"])
    lien(inst.outputs["Instances"], reel.inputs["Geometry"])
    lien(reel.outputs["Geometry"], mat.inputs["Geometry"])
    lien(mat.outputs["Geometry"], sortie.inputs["Geometry"])
    gn.node_group = arbre

    m = bpy.data.materials.new("Emission")
    m.use_nodes = True
    n2 = m.node_tree.nodes
    n2.clear()
    attr_n = n2.new("ShaderNodeAttribute")
    attr_n.attribute_name = "Couleur"
    emi = n2.new("ShaderNodeEmission")
    emi.inputs["Strength"].default_value = 6.0
    out = n2.new("ShaderNodeOutputMaterial")
    m.node_tree.links.new(attr_n.outputs["Color"], emi.inputs["Color"])
    m.node_tree.links.new(emi.outputs["Emission"], out.inputs["Surface"])
    mat.inputs["Material"].default_value = m
    return obj


def creer_cadran():
    """Les anneaux du cadran de magistrai.fr : arcs fins, cyan à gauche, orange à droite."""
    anneaux = []
    for r, segments, vitesse in [(2.75, [(0, 0.22), (0.3, 0.62), (0.7, 0.93)], 0.18), (3.45, [(0.05, 0.18), (0.27, 0.45), (0.66, 0.9)], -0.12), (4.2, [(0.1, 0.4), (0.6, 0.85)], 0.07)]:
        courbe = bpy.data.curves.new(f"anneau-{r}", "CURVE")
        courbe.dimensions = "3D"
        courbe.bevel_depth = 0.006
        for d, f in segments:
            sp = courbe.splines.new("POLY")
            n = max(8, int((f - d) * 120))
            sp.points.add(n - 1)
            for k in range(n):
                t = (d + (f - d) * k / (n - 1)) * 2 * math.pi
                sp.points[k].co = (math.cos(t) * r, math.sin(t) * r, 0, 1)
        obj = bpy.data.objects.new(f"Anneau {r}", courbe)
        bpy.context.collection.objects.link(obj)
        m = bpy.data.materials.new(f"Anneau {r}")
        m.use_nodes = True
        emi = m.node_tree.nodes.new("ShaderNodeEmission")
        emi.inputs["Color"].default_value = (0.1, 0.7, 1.0, 1) if r < 4 else (1.0, 0.45, 0.08, 1)
        emi.inputs["Strength"].default_value = 3.0
        m.node_tree.links.new(emi.outputs["Emission"], m.node_tree.nodes["Material Output"].inputs["Surface"])
        courbe.materials.append(m)
        anneaux.append((obj, vitesse))
    return anneaux


def animer(noyau, anneaux):
    sc = bpy.context.scene
    sc.frame_start = 1
    sc.frame_end = int(DUREE_S * FPS)
    for f in range(sc.frame_start, sc.frame_end + 1, 5):
        t = f / FPS
        noyau.rotation_euler = (math.pi / 2, 0.0, t * 0.22)
        noyau.keyframe_insert("rotation_euler", frame=f)
        for obj, v in anneaux:
            # L'anneau reste face à la caméra et tourne dans son plan.
            obj.rotation_euler = (math.pi / 2, t * v, 0.0)
            obj.keyframe_insert("rotation_euler", frame=f)


def camera_et_rendu():
    sc = bpy.context.scene
    cam_d = bpy.data.cameras.new("Caméra")
    cam_d.lens = 50
    cam_d.dof.use_dof = True
    cam_d.dof.focus_distance = 11
    cam_d.dof.aperture_fstop = 2.8
    cam = bpy.data.objects.new("Caméra", cam_d)
    bpy.context.collection.objects.link(cam)
    sc.camera = cam
    # Lente avancée de caméra : 12 → 10,5 unités.
    for f, z in [(1, 12.0), (sc.frame_end, 10.5)]:
        cam.location = (0, -z, 0)
        cam.rotation_euler = (math.pi / 2, 0, 0)
        cam.keyframe_insert("location", frame=f)
    sc.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items.keys() else "BLENDER_EEVEE"
    sc.render.resolution_x = 1080
    sc.render.resolution_y = 1920
    sc.render.fps = FPS
    sc.render.film_transparent = True
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"
    sc.render.filepath = os.path.join(DOSSIER, "image-")
    monde = bpy.data.worlds.new("Nuit")
    monde.color = (0.004, 0.006, 0.012)
    sc.world = monde
    # Halo (Glare « Fog Glow ») dans le compositeur : le bloom des sites.
    sc.use_nodes = True
    arbre = sc.node_tree
    arbre.nodes.clear()
    rl = arbre.nodes.new("CompositorNodeRLayers")
    gl = arbre.nodes.new("CompositorNodeGlare")
    gl.glare_type = "FOG_GLOW"
    gl.quality = "HIGH"
    gl.threshold = 0.6
    comp = arbre.nodes.new("CompositorNodeComposite")
    arbre.links.new(rl.outputs["Image"], gl.inputs["Image"])
    arbre.links.new(gl.outputs["Image"], comp.inputs["Image"])


def main():
    vider_scene()
    pts = points_cerveau(N) if MARQUE == "magistria" else points_sphere(N)
    noyau = creer_nuage(pts)
    noyau.rotation_mode = "XYZ"
    noyau.rotation_euler = (math.pi / 2, 0, 0)
    anneaux = creer_cadran() if MARQUE == "magistria" else []
    for obj, _ in anneaux:
        obj.rotation_euler = (math.pi / 2, 0, 0)
    animer(noyau, anneaux)
    camera_et_rendu()
    os.makedirs(DOSSIER, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(DOSSIER, f"noyau-{MARQUE}.blend"))
    if "--rendre" in ARGS or bpy.app.background:
        bpy.ops.render.render(animation=True)


main()
