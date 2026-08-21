"""The ambientcss parameter vocabulary, mapped to physical scene values.

This module is the bridge between the CSS lighting model (--amb-* custom
properties) and the Blender kit: the same names, mapped to millimetres,
light positions, energies and BSDF settings. generate.py uses it to light
beauty shots from amb params; calibrate.py uses it to build the flat-on
orthographic rig whose renders ground the CSS coefficients.

Rig geometry (fixed design constants — the CSS is derived from these,
never the other way around):

  1 CSS px = 1 mm, rendered at PX_PER_MM px/mm for sub-pixel measurement.
  Orthographic camera at (0, 0, CAM_Z) looking straight down -Z with
  image-up = +Y, so CSS screen coords map as sx = X, sy = -Y.
  Key light: one AREA light of size LIGHT_SIZE at
  (LIGHT_R * light_x, -LIGHT_R * light_y, LIGHT_Z), tracked at the origin,
  energy E0 * key_light_intensity. Components deliberately unnormalized so
  per-axis behavior matches the per-axis CSS formulas.
  Fill light: the 'white studio' world (studio_world) — an overhead-softbox
  radiance profile normalized so an up-facing surface receives the same
  irradiance as a uniform background of strength S0 * fill_light_intensity
  (the CSS fill: a lift that softens shadows; the studio look lives in the
  reflections).
"""

import bpy

from components._common import prism_object

# The pure half of the model (constants, amb(), mm mappings) lives in
# amb_model.py so the measurement pipeline can import it without bpy.
from amb_model import (  # noqa: F401  (re-exported for callers)
    PX_PER_MM, FRAME_MM, CAM_Z, LIGHT_R, LIGHT_Z, LIGHT_SIZE,
    GROUND_MM, GROUND_ALBEDO, E0, S0, key_energy, SAGITTA_MM, DARKER_ALBEDO,
    DARKEST_ALBEDO, LIGHTER_ALBEDO, LIGHTEST_ALBEDO,
    CHAMFER_MM_PER_WIDTH, FILLET_MM_PER_WIDTH, ELEVATION_MM_PER_LEVEL,
    THICKNESS_MM_PER_LEVEL, SHEET_MM, SHEET_PROUD_MM,
    AMB_DEFAULTS, amb, edge_mm, elevation_mm, plate_z, thickness_mm,
    silhouette_mm,
)


# ------------------------------------------------------------- materials ---

def calib_material(name, albedo, rough=1.0):
    """Near-Lambertian neutral: linear-space albedo, no specular sheen."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Base Color"].default_value = (albedo, albedo, albedo, 1.0)
    bsdf.inputs["Roughness"].default_value = rough
    for socket in ("Specular IOR Level", "Specular"):
        if socket in bsdf.inputs:
            bsdf.inputs[socket].default_value = 0.0
            break
    return mat


# ---- micro-relief materials (brushed / spun / blasted) -------------------
#
# CSS models these as two additive layers: a height-field diffuse RELIEF
# (the screen/multiply tile pair) and, for the two lathe/belt aluminium
# finishes only, a separate specular SHEEN. Mirrored here with a Noise
# Texture height field (bump-mapped, anisotropically stretched to the
# finish's grain) plus, when `sheen` is on, an Anisotropic BSDF lobe tangent
# to that same grain. No UV map exists anywhere in this kit's geometry, so
# every coordinate below comes from Object space (local mm, independent of
# an object's bounding box) rather than Generated/UV.
#
# Period constants read as a common abrasive grit shared by the two
# aluminium finishes (fine across the cut, long along it) and a coarser,
# isotropic bead-blast dimple on the rubber — physically reasoned starting
# points, tuned against a low-sample preview render before the full
# calibration pass (see derived/notes/{brushed,spun,blasted}.md for the
# values that stuck). They are Blender-side INPUTS, not fit outputs: what
# gets fit is the CSS coefficients that reproduce these renders' statistics.
GRAIN_ACROSS_MM = 2.5      # fine dimension: ridge pitch across the cut.
                           # Pinned to the rig's 4 px/mm resolution (10
                           # px/period), not to a real finish's grit: tried
                           # at 0.6mm first and measured almost no
                           # anisotropy (a 0/90deg light-angle RMS ratio of
                           # ~1.1) because 2.4 px/period sits at the Bump
                           # node's derivative estimate and Cycles' pixel AA
                           # low-pass corner, which crushes the fine axis and
                           # leaves the coarse axis untouched — an estimator
                           # artifact, not the physics. 2.5mm (10 px/period)
                           # measures a real ~2x std ratio between along- and
                           # across-grain light angles; going finer than the
                           # render can resolve just re-introduces the same
                           # crush.
GRAIN_ALONG_MM = 40.0      # coarse dimension: streak length along the cut
BLAST_PERIOD_MM = 2.5      # isotropic bead-blast dimple size — same grit
                           # pitch as the metals' across-grain ridges, for
                           # the same resolvability reason
GRAIN_ROUGHNESS = 0.55     # ground/lathe metal: some specular, well spread
GRAIN_ANISO = 0.75         # strong directional highlight from the grooves
# Bead-blasted aluminium is the one finish here that is modelled as a
# CONDUCTOR, and the asymmetry with brushed/spun is earned by measurement
# rather than asserted. Against the reference crop's grain RMS of 11.9 L*,
# a fully matte dielectric (the previous build: Metallic 0, roughness 1.0)
# saturates at 4.5 L* — and only reaches even that by driving
# GRAIN_BUMP_DISTANCE_MM up until the plate darkens to L* 53. Metallic at
# roughness 0.25 reaches 11.3 L* at the correct tone. The glitter IS the
# material, and a diffuse lobe cannot produce it.
#
# Roughness 0.25 is low for something called "blasted" because the two
# scales are modelled separately: the bead craters are the height field
# below, so what is left for the BSDF is the smooth metal BETWEEN the
# craters. Putting the roughness in both places double-counts it and
# flattens the sparkle back out.
BLAST_METALLIC = 1.0
BLAST_ROUGHNESS = 0.25
GRAIN_BUMP_STRENGTH = 1.0
# Bump's "Distance" is the finite-difference step it samples the height
# field at, in the same Object-space mm every other constant here uses. Its
# tiny factory default (0.001 mm) is far below GRAIN_ACROSS_MM's period, so
# the sampled slope of a smooth Noise Texture comes out ~0 there — this has
# to scale with the finest grain pitch in play, not sit at Blender's default.
# 0.4 mm (well under GRAIN_ACROSS_MM's 2.5mm ridge pitch, well over the
# render's 0.25mm pixel pitch) was picked by rendering low-sample previews:
# it is what made blasted's isotropic dimples read clearly on a fully matte
# (roughness 1) surface, where bump only shows up as subtle diffuse shading
# rather than a specular glint.
GRAIN_BUMP_DISTANCE_MM = 0.4
GRAIN_REPR_RADIUS_MM = 28.0  # spun: representative radius converting the
                             # angular coordinate to an arc-length in mm, so
                             # its along-grain period shares GRAIN_ALONG_MM's
                             # units instead of tying pitch to plate size


def _height_field(nt, finish):
    """Noise-texture height field, anisotropically stretched to `finish`'s
    grain direction, and (for brushed/spun) the tangent that direction
    implies for the Anisotropic BSDF lobe. Returns
    (height_output_socket, tangent_output_socket_or_None)."""
    texco = nt.nodes.new("ShaderNodeTexCoord")
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Detail"].default_value = 2.0
    noise.inputs["Roughness"].default_value = 0.6

    if finish == "blasted":
        mapping = nt.nodes.new("ShaderNodeMapping")
        s = 1.0 / BLAST_PERIOD_MM
        mapping.inputs["Scale"].default_value = (s, s, s)
        nt.links.new(texco.outputs["Object"], mapping.inputs["Vector"])
        nt.links.new(mapping.outputs["Vector"], noise.inputs["Vector"])
        return noise.outputs["Factor"], None

    if finish == "brushed":
        # Grain runs along local X: coarse (long-period) frequency on X,
        # fine (short-period) frequency on Y — mirrors the CSS tile's own
        # baseFrequency convention ("coarse in x, fine in y", grain
        # horizontal).
        mapping = nt.nodes.new("ShaderNodeMapping")
        mapping.inputs["Scale"].default_value = (
            1.0 / GRAIN_ALONG_MM, 1.0 / GRAIN_ACROSS_MM, 1.0)
        nt.links.new(texco.outputs["Object"], mapping.inputs["Vector"])
        nt.links.new(mapping.outputs["Vector"], noise.inputs["Vector"])
        tangent = nt.nodes.new("ShaderNodeCombineXYZ")
        tangent.inputs["X"].default_value = 1.0
        return noise.outputs["Factor"], tangent.outputs["Vector"]

    if finish == "spun":
        # Polar remap: radius (Length of the object-space position) is the
        # ACROSS-grain axis, same fine pitch as brushed; angle * a
        # representative radius is the ALONG-grain axis (arc length in mm),
        # same coarse pitch as brushed — the lathe cuts circumferentially at
        # whatever grit the belt sands linearly.
        sep = nt.nodes.new("ShaderNodeSeparateXYZ")
        nt.links.new(texco.outputs["Object"], sep.inputs["Vector"])
        length = nt.nodes.new("ShaderNodeVectorMath")
        length.operation = "LENGTH"
        nt.links.new(texco.outputs["Object"], length.inputs[0])
        angle = nt.nodes.new("ShaderNodeMath")
        angle.operation = "ARCTAN2"
        nt.links.new(sep.outputs["Y"], angle.inputs[0])
        nt.links.new(sep.outputs["X"], angle.inputs[1])
        arc = nt.nodes.new("ShaderNodeMath")
        arc.operation = "MULTIPLY"
        arc.inputs[1].default_value = GRAIN_REPR_RADIUS_MM
        nt.links.new(angle.outputs["Value"], arc.inputs[0])
        along = nt.nodes.new("ShaderNodeMath")
        along.operation = "MULTIPLY"
        along.inputs[1].default_value = 1.0 / GRAIN_ALONG_MM
        nt.links.new(arc.outputs["Value"], along.inputs[0])
        across = nt.nodes.new("ShaderNodeMath")
        across.operation = "MULTIPLY"
        across.inputs[1].default_value = 1.0 / GRAIN_ACROSS_MM
        nt.links.new(length.outputs["Value"], across.inputs[0])
        combine = nt.nodes.new("ShaderNodeCombineXYZ")
        nt.links.new(along.outputs["Value"], combine.inputs["X"])
        nt.links.new(across.outputs["Value"], combine.inputs["Y"])
        nt.links.new(combine.outputs["Vector"], noise.inputs["Vector"])
        tangent = nt.nodes.new("ShaderNodeTangent")
        tangent.direction_type = "RADIAL"
        tangent.axis = "Z"
        return noise.outputs["Factor"], tangent.outputs["Tangent"]

    raise ValueError(f"unknown grain finish '{finish}'")


def grain_material(name, albedo, finish, sheen=True):
    """Micro-relief aluminium plate material for `finish` in
    brushed | spun | blasted.

    `sheen=False` is the calibration variant: same metal, same height
    field, ANISOTROPIC 0. It is used both to measure the relief's own
    statistics (the <finish>_angle sweep) and as the reference the sheen
    fit subtracts (the <finish>_sheen_ref sweeps), so the difference
    `beauty - ref` isolates exactly one thing — the anisotropic reshaping
    of the lobe. Before 2026-08-21 the reference was a DIELECTRIC while
    the beauty variant was too, and the plan for making the beauty
    variant metallic on its own would have made that subtraction
    meaningless (two different materials, not one material with one term
    switched off).

    Two predicates, deliberately not one. `is_anisotropic` asks whether
    the finish has a grain DIRECTION for a specular lobe to align to;
    only the two belt/lathe finishes do. A single `is_metal` flag used to
    gate both this and the roughness choice, which read as if blasted's
    fully-matte setting followed from it not being metal.

    Brushed and spun are NOT metallic, and that is measured rather than
    assumed. Building them as conductors (Metallic 1) was tried on
    2026-08-21 and reverted: it takes their grain RMS from a well-matched
    2.3 L* to 8-9 against a reference grain of ~2.5, and their tone from
    73 to 84+. It also buys nothing for the sheen, which this rig cannot
    render at all (see the sweep note in derived/notes/brushed_sheen.md).
    There is a structural reason too: the CSS model these renders ground
    is `diffuse tone + relief + a separately-painted band`, and a
    conductor has no diffuse lobe for `--amb-albedo` to correspond to.
    Blasted is the exception, on the evidence in BLAST_METALLIC's note."""
    is_anisotropic = finish in ("brushed", "spun")
    mat = calib_material(
        name, albedo,
        rough=GRAIN_ROUGHNESS if is_anisotropic else BLAST_ROUGHNESS)
    nt = mat.node_tree
    bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")

    if finish == "blasted":
        bsdf.inputs["Metallic"].default_value = BLAST_METALLIC
        # a conductor's lobe still needs a nonzero specular level to
        # exist at all; calib_material zeroes it for its Lambertian base
        for socket in ("Specular IOR Level", "Specular"):
            if socket in bsdf.inputs:
                bsdf.inputs[socket].default_value = 0.5
                break

    height, tangent = _height_field(nt, finish)
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = GRAIN_BUMP_STRENGTH
    bump.inputs["Distance"].default_value = GRAIN_BUMP_DISTANCE_MM
    nt.links.new(height, bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])

    if is_anisotropic and sheen:
        # calib_material zeroes specular for a "near-Lambertian neutral"
        # base (every other material in this file wants that); the sheen
        # variant needs it back — Anisotropic only reshapes the specular
        # lobe, so at Specular IOR Level 0 it has nothing to reshape and
        # the sheen silently vanishes (the first pass here missed exactly
        # that).
        for socket in ("Specular IOR Level", "Specular"):
            if socket in bsdf.inputs:
                bsdf.inputs[socket].default_value = 0.5
                break
        bsdf.inputs["Anisotropic"].default_value = GRAIN_ANISO
        nt.links.new(tangent, bsdf.inputs["Tangent"])

    return mat


_GRAIN_KINDS = ("brushed", "brushed-relief", "spun", "spun-relief", "blasted")


def material_for(a, name="PlateMat", albedo=None):
    """Plate material for an amb material kind (calibration variant)."""
    if albedo is None:
        albedo = a["albedo"] if a["albedo"] is not None else GROUND_ALBEDO
    kind = a["mat"]
    if a["emit"]:
        mat = calib_material(name, 0.05)
        bsdf = next(n for n in mat.node_tree.nodes
                    if n.type == "BSDF_PRINCIPLED")
        from skeuo_kit import hex_to_linear
        bsdf.inputs["Emission Color"].default_value = (
            *hex_to_linear(a["emit"]), 1.0)
        # just over display white: reads as a lit LED face and trips the
        # bloom threshold without swamping the frame
        bsdf.inputs["Emission Strength"].default_value = 1.5
        return mat
    if kind == "matte":
        return calib_material(name, albedo, rough=1.0)
    if kind == "shiny":
        mat = calib_material(name, albedo, rough=0.08)
        bsdf = next(n for n in mat.node_tree.nodes
                    if n.type == "BSDF_PRINCIPLED")
        for socket in ("Specular IOR Level", "Specular"):
            if socket in bsdf.inputs:
                bsdf.inputs[socket].default_value = 0.5
                break
        return mat
    if kind == "glass":
        mat = calib_material(name, albedo, rough=0.35)
        bsdf = next(n for n in mat.node_tree.nodes
                    if n.type == "BSDF_PRINCIPLED")
        bsdf.inputs["Transmission Weight"].default_value = 1.0
        return mat
    if kind in _GRAIN_KINDS:
        finish, _, variant = kind.partition("-")
        return grain_material(name, albedo, finish, sheen=variant != "relief")
    raise ValueError(f"unknown material kind '{kind}'")


# --------------------------------------------------------------- lighting ---

def studio_world(a):
    """The 'white studio' fill world (see amb_model studio constants): a
    directional radiance profile over the world ray's z — overhead softbox
    plateau, neutral walls at the horizon, dimmer floor — normalized by
    studio_norm() so an up-facing surface receives exactly the irradiance
    of the uniform world this replaces (S0 * fill). The node graph mirrors
    amb_model.studio_profile: two Smooth Step Map Ranges (above / below the
    horizon) switched at z = 0."""
    from amb_model import (STUDIO_CAP_COS, STUDIO_TOP, STUDIO_BELOW,
                           STUDIO_EASE, studio_norm)

    world = bpy.data.worlds.new("AmbStudio")
    world.use_nodes = True
    nt = world.node_tree
    bg = nt.nodes["Background"]
    bg.inputs["Strength"].default_value = S0 * a["fill_light_intensity"]

    texco = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(texco.outputs["Generated"], sep.inputs["Vector"])
    z = sep.outputs["Z"]

    def map_range(lo, hi, out_lo, out_hi):
        mr = nt.nodes.new("ShaderNodeMapRange")
        mr.interpolation_type = "SMOOTHSTEP"
        mr.clamp = True
        mr.inputs["From Min"].default_value = lo
        mr.inputs["From Max"].default_value = hi
        mr.inputs["To Min"].default_value = out_lo
        mr.inputs["To Max"].default_value = out_hi
        nt.links.new(z, mr.inputs["Value"])
        return mr

    above = map_range(0.0, STUDIO_CAP_COS, 1.0, STUDIO_TOP)
    below = map_range(-STUDIO_EASE, 0.0, STUDIO_BELOW, 1.0)

    gate = nt.nodes.new("ShaderNodeMath")
    gate.operation = "GREATER_THAN"
    nt.links.new(z, gate.inputs[0])
    gate.inputs[1].default_value = 0.0

    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type = "FLOAT"
    nt.links.new(gate.outputs["Value"], mix.inputs["Factor"])
    nt.links.new(below.outputs["Result"], mix.inputs["A"])
    nt.links.new(above.outputs["Result"], mix.inputs["B"])

    scale = nt.nodes.new("ShaderNodeMath")
    scale.operation = "MULTIPLY"
    nt.links.new(mix.outputs["Result"], scale.inputs[0])
    scale.inputs[1].default_value = studio_norm()

    nt.links.new(scale.outputs["Value"], bg.inputs["Color"])
    return world


def apply_lighting(a, target=(0.0, 0.0, 0.0)):
    """Key area light positioned from light-x/y + the studio fill world.
    Replaces any studio lights; returns the key light object."""
    scene = bpy.context.scene

    scene.world = studio_world(a)

    empty = bpy.data.objects.new("AmbLightTarget", None)
    empty.location = target
    bpy.context.collection.objects.link(empty)

    ldata = bpy.data.lights.new("AmbKey", type="AREA")
    ldata.energy = key_energy(a)
    ldata.size = LIGHT_SIZE
    key = bpy.data.objects.new("AmbKey", ldata)
    key.location = (LIGHT_R * a["light_x"], -LIGHT_R * a["light_y"], LIGHT_Z)
    bpy.context.collection.objects.link(key)
    tc = key.constraints.new("TRACK_TO")
    tc.target = empty
    tc.track_axis = "TRACK_NEGATIVE_Z"
    tc.up_axis = "UP_Y"
    return key


# ---------------------------------------------------------------- the rig ---

def _reference_patches(a, plate_w, plate_d):
    """White tile and black trap at the light-perpendicular anchors from
    amb_model.reference_layout — clear of bloom, shadow and the profile
    bands for every light direction and plate size. Measured values are
    anchored against these to neutralize exposure drift."""
    from amb_model import reference_layout

    layout = reference_layout(a, plate_w, plate_d)
    pts = [(-4, -4), (4, -4), (4, 4), (-4, 4)]
    for name, albedo in (("white", 1.0), ("black", 0.0)):
        sx, sy = layout[name]
        prism_object(f"Ref{name.capitalize()}", pts, 0.0, 0.2,
                     location=(sx, -sy, 0.0),  # screen mm -> blender Y flip
                     material=calib_material(f"Ref{name.capitalize()}", albedo))


def setup_calibration_rig(a, plate_size=(80.0, 80.0), resolution=None,
                          patches=True):
    """Ground plane, reference patches, flat-on ortho camera and amb
    lighting. Call on a reset scene; add the subject afterwards (or before —
    order does not matter). Returns the ground object. `patches=False`
    drops the white/black reference patches (component grounding shots,
    which are published imagery rather than measured frames)."""
    scene = bpy.context.scene

    ground_mat = calib_material("GroundMat", GROUND_ALBEDO)
    g = GROUND_MM / 2
    # 12 mm of body below the surface: enough material for a knob-scale
    # groove recess to cut into (the slab is opaque either way)
    ground = prism_object("Ground", [(-g, -g), (g, -g), (g, g), (-g, g)],
                          -12.0, 0.0, material=ground_mat)

    if patches:
        _reference_patches(a, plate_size[0], plate_size[1])

    cam_data = bpy.data.cameras.new("CalibCam")
    cam_data.type = "ORTHO"
    cam_data.ortho_scale = FRAME_MM
    cam_data.clip_start = 1.0
    cam_data.clip_end = CAM_Z * 4
    cam = bpy.data.objects.new("CalibCam", cam_data)
    cam.location = (0.0, 0.0, CAM_Z)
    cam.rotation_euler = (0.0, 0.0, 0.0)  # looks down -Z, image-up = +Y
    bpy.context.collection.objects.link(cam)
    scene.camera = cam

    apply_lighting(a)

    res = resolution or FRAME_MM * PX_PER_MM
    scene.render.resolution_x = res
    scene.render.resolution_y = res
    return ground


def enable_bloom(threshold=1.0, size=0.03):
    """Compositor Fog Glow for emissive scenes only — Cycles emission does
    not bleed on its own. Parameters are fixed so the halo is
    reproducible; recorded here, not in the manifest. Uses the Blender 5
    node-group compositor (glare options are input sockets there)."""
    scene = bpy.context.scene
    tree = bpy.data.node_groups.new("AmbBloom", "CompositorNodeTree")
    tree.interface.new_socket("Image", in_out="OUTPUT",
                              socket_type="NodeSocketColor")
    rl = tree.nodes.new("CompositorNodeRLayers")
    glare = tree.nodes.new("CompositorNodeGlare")
    for socket, value in (("Type", "Fog Glow"), ("Quality", "High"),
                          ("Threshold", threshold), ("Size", size)):
        try:
            glare.inputs[socket].default_value = value
        except (KeyError, TypeError):
            pass
    out = tree.nodes.new("NodeGroupOutput")
    tree.links.new(rl.outputs["Image"], glare.inputs["Image"])
    tree.links.new(glare.outputs["Image"], out.inputs["Image"])
    scene.compositing_node_group = tree


def finalize_calibration_render(samples=512):
    """Deterministic, measurement-grade render settings. Call after
    skeuo_kit.setup_render(); asserts the Standard view transform, which the
    whole measurement pipeline depends on (AgX would poison every fit)."""
    scene = bpy.context.scene
    scene.cycles.samples = samples
    scene.cycles.seed = 0
    scene.cycles.use_denoising = True
    try:
        scene.cycles.denoiser = "OPENIMAGEDENOISE"
    except TypeError:
        pass
    assert scene.view_settings.view_transform == "Standard", (
        "calibration renders require the Standard view transform")


# ---------------------------------------------------------------- argparse ---

def add_argparse_group(parser):
    """--amb-* flags mirroring the CSS custom properties, for generate.py.
    Returns the group. Use amb_from_args() to collect them."""
    group = parser.add_argument_group("ambientcss parameters")
    group.add_argument("--amb-light-x", type=float, default=None)
    group.add_argument("--amb-light-y", type=float, default=None)
    group.add_argument("--amb-key-light-intensity", type=float, default=None)
    group.add_argument("--amb-fill-light-intensity", type=float, default=None)
    group.add_argument("--amb-elevation", type=float, default=None)
    group.add_argument("--amb-thickness", type=float, default=None)
    group.add_argument("--amb-chamfer", type=float, default=None)
    group.add_argument("--amb-chamfer-width", type=float, default=None)
    group.add_argument("--amb-fillet", type=float, default=None)
    group.add_argument("--amb-fillet-width", type=float, default=None)
    group.add_argument("--amb-mat",
                       choices=["matte", "shiny", "glass",
                                "brushed", "spun", "blasted"],
                       default=None)
    group.add_argument("--amb-emit", default=None, metavar="HEX")
    return group


def amb_from_args(args):
    """Collect --amb-* argparse values into an amb dict; None if none given."""
    overrides = {}
    for key in AMB_DEFAULTS:
        val = getattr(args, f"amb_{key}", None)
        if val is not None:
            overrides[key] = val
    return amb(**overrides) if overrides else None
