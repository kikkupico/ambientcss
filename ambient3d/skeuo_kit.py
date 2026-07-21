"""Shared helpers for the skeuo parametric component kit.

Units: 1 Blender unit = 1 mm. All components are built at real-world size.
"""

import math

import bpy


# ---------------------------------------------------------------- palette ---

# Teenage-engineering-adjacent palette. Each preset: body color, indicator
# (accent) color, and surface roughness.
PRESETS = {
    "orange":   {"body": "#FF4A00", "accent": "#F2EFE9", "rough": 0.38},
    "cream":    {"body": "#E7E3D9", "accent": "#1B1B1D", "rough": 0.42},
    "bone":     {"body": "#EDEAE3", "accent": "#3A3A3C", "rough": 0.42},
    "grey":     {"body": "#9A9A9E", "accent": "#1B1B1D", "rough": 0.42},
    "graphite": {"body": "#232326", "accent": "#F2EFE9", "rough": 0.45},
    "cobalt":   {"body": "#0A44E0", "accent": "#F2EFE9", "rough": 0.38},
    "navy":     {"body": "#2B3560", "accent": "#F2EFE9", "rough": 0.4},
    "tan":      {"body": "#C9995C", "accent": "#1B1B1D", "rough": 0.4},
}


def hex_to_linear(hexcode):
    """'#RRGGBB' -> linear-space (r, g, b)."""
    h = hexcode.lstrip("#")
    srgb = [int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4)]

    def lin(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    return tuple(lin(c) for c in srgb)


# -------------------------------------------------------------- materials ---

def _principled(mat):
    for n in mat.node_tree.nodes:
        if n.type == "BSDF_PRINCIPLED":
            return n
    return None


def plastic_material(name, hexcode, rough=0.4):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = _principled(mat)
    bsdf.inputs["Base Color"].default_value = (*hex_to_linear(hexcode), 1.0)
    bsdf.inputs["Roughness"].default_value = rough
    return mat


def metal_material(name, hexcode="#D2D2D6", rough=0.5):
    mat = plastic_material(name, hexcode, rough)
    _principled(mat).inputs["Metallic"].default_value = 1.0
    return mat


def materials_for(preset_name):
    """(body, accent) plastic materials for a palette preset."""
    preset = PRESETS[preset_name]
    body = plastic_material(f"Body_{preset_name}", preset["body"],
                            preset["rough"])
    accent = plastic_material(f"Accent_{preset_name}", preset["accent"], 0.45)
    return body, accent


def base_material_for(name_or_alu, fallback="alu"):
    """Base-tile material: a palette preset body, or brushed aluminum."""
    choice = name_or_alu or fallback
    if choice == "alu":
        return metal_material("BaseAlu")
    return materials_for(choice)[0]


# ------------------------------------------------------------------ scene ---

def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def _cyclorama(extent):
    """Infinite-sweep backdrop: floor curving up into a back wall."""
    e = extent
    floor_front, arc_start, arc_r, wall_top = -14 * e, 3 * e, 5 * e, 14 * e
    profile = [(floor_front, 0.0), (arc_start, 0.0)]
    for i in range(1, 13):
        a = (i / 12) * (math.pi / 2)
        profile.append((arc_start + arc_r * math.sin(a),
                        arc_r * (1.0 - math.cos(a))))
    profile.append((arc_start + arc_r, wall_top))

    half_w = 14 * e
    verts, faces = [], []
    for y, z in profile:
        verts += [(-half_w, y, z), (half_w, y, z)]
    for i in range(len(profile) - 1):
        a = 2 * i
        faces.append((a, a + 1, a + 3, a + 2))

    mesh = bpy.data.meshes.new("Cyc")
    mesh.from_pydata(verts, [], faces)
    mesh.validate()
    for poly in mesh.polygons:
        poly.use_smooth = True
    cyc = bpy.data.objects.new("Cyc", mesh)
    bpy.context.collection.objects.link(cyc)
    cyc.data.materials.append(plastic_material("CycMat", "#E4E2DD", rough=0.6))
    return cyc


def setup_studio(center=(0, 0, 5), extent=15.0, azimuth=32.0, elevation=28.0,
                 dist=6.5, lens=85.0):
    """Cyclorama backdrop, soft three-point lighting, camera aimed at `center`.

    `extent` is the rough radius of the subject in mm; camera distance and
    light framing scale from it. `azimuth` is degrees off straight-on,
    `elevation` degrees above the horizon.
    """
    scene = bpy.context.scene

    # world
    world = bpy.data.worlds.new("Studio")
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.82, 0.82, 0.82, 1.0)
    bg.inputs["Strength"].default_value = 0.28
    scene.world = world

    _cyclorama(extent)

    # target empty for the camera to track
    target = bpy.data.objects.new("CamTarget", None)
    target.location = center
    bpy.context.collection.objects.link(target)

    # camera
    cam_data = bpy.data.cameras.new("Camera")
    cam_data.lens = lens
    cam_data.sensor_width = 36
    cam_data.clip_start = 1.0
    cam_data.clip_end = extent * 1000
    cam = bpy.data.objects.new("Camera", cam_data)
    d = extent * dist
    az, el = math.radians(azimuth), math.radians(elevation)
    cam.location = (
        center[0] + d * math.cos(el) * math.sin(az),
        center[1] - d * math.cos(el) * math.cos(az),
        center[2] + d * math.sin(el),
    )
    bpy.context.collection.objects.link(cam)
    tc = cam.constraints.new("TRACK_TO")
    tc.target = target
    tc.track_axis = "TRACK_NEGATIVE_Z"
    tc.up_axis = "UP_Y"
    scene.camera = cam

    def area_light(name, loc, energy, size):
        ldata = bpy.data.lights.new(name, type="AREA")
        ldata.energy = energy
        ldata.size = size
        light = bpy.data.objects.new(name, ldata)
        light.location = loc
        bpy.context.collection.objects.link(light)
        lt = light.constraints.new("TRACK_TO")
        lt.target = target
        lt.track_axis = "TRACK_NEGATIVE_Z"
        lt.up_axis = "UP_Y"
        return light

    s = extent  # scale factor for positions
    area_light("Key", (s * 8, -s * 5, s * 12), energy=s ** 2 * 3200, size=s * 10)
    area_light("Fill", (-s * 10, -s * 8, s * 6), energy=s ** 2 * 800, size=s * 18)
    area_light("Rim", (-s * 3, s * 10, s * 10), energy=s ** 2 * 1500, size=s * 8)


def setup_render(out_path, resolution=800, samples=96):
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = samples
    scene.render.resolution_x = resolution
    scene.render.resolution_y = resolution
    scene.render.filepath = out_path
    scene.render.image_settings.file_format = "PNG"

    # AgX desaturates flat product colors badly; Standard keeps the palette true
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"

    # prefer Metal GPU, fall back silently to CPU
    try:
        prefs = bpy.context.preferences.addons["cycles"].preferences
        prefs.compute_device_type = "METAL"
        prefs.get_devices()
        for dev in prefs.devices:
            dev.use = True
        scene.cycles.device = "GPU"
    except Exception:
        pass


def render_and_save(png_path, blend_path=None):
    if blend_path:
        bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    bpy.context.scene.render.filepath = png_path
    bpy.ops.render.render(write_still=True)
