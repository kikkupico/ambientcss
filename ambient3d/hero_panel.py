"""The Blender half of the README hero GIF, run inside Blender:

    blender -b -P hero_panel.py                # the whole camera move
    blender -b -P hero_panel.py -- --flat      # just the final flat frame
    blender -b -P hero_panel.py -- --layout gate

Builds the panel described by tools/hero-gif/layouts/<layout>.json out of
the component referents (referents.py) and renders a camera move from a 3/4
view down to the calibration rig's flat-on view. Frames go to
tools/hero-gif/out/blender/####.png; assemble.py wipes the last one against
the CSS screenshot of the same layout.

The camera stays ORTHOGRAPHIC throughout — no perspective-to-ortho morph to
fake — and the move ends exactly at the rig's pose, so the final frame is
framed identically to the CSS shot by construction. It orbits by rotating a
parent empty at the panel centre: the rig's camera has no TRACK_TO
constraint (only skeuo_kit.setup_studio does), so keyframing the camera's
own rotation would swing the panel out of frame.
"""

import json
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bpy
from mathutils import Vector

import skeuo_kit as kit
import amb_params as ap
import amb_model as am
from components._common import boolean_cut, prism_object
from components.plate import build_plate
from referents import REFERENTS

ROOT = os.path.dirname(os.path.abspath(__file__))
HERO = os.path.join(ROOT, "..", "tools", "hero-gif")
LAYOUTS = os.path.join(HERO, "layouts")

SAMPLES = 256

# Camera move, in degrees of tilt away from straight-down. The opening 3/4
# view drifts slightly in azimuth so beat A is not a frozen still, then both
# angles ease to zero — the calibration pose.
TILT_START = 35.0
AZIM_START = 24.0
AZIM_HOLD = 16.0
# Tilting and spinning the panel swings its corners out of a frame sized for
# the flat-on view, so the move starts pulled back and pushes in as it
# flattens. The camera is orthographic, so this is a pure change of
# ortho_scale, and it resolves to exactly the rig's framing.
ZOOM_START = 1.4
FRAMES_OPEN = 30        # beat A: the 3/4 drift
FRAMES_TILT = 54        # beat B: tilt down to flat

# CSS kind + variant -> referents.REFERENTS key
REFERENT_FOR = {
    ("knob", "dot"): "knob",
    ("knob", "line"): "knob-line",
    ("knob", "flute"): "knob-flute",
    ("knob", "cap"): "knob-cap",
    ("knob", "wheel"): "knob-wheel",
    ("button", "pill"): "button",
    ("button", "round"): "button-round",
    ("button", "square"): "button-square",
    ("switch", None): "switch",
    ("fader", None): "fader",
    ("slider", None): "slider",
}


def referent_key(spec):
    kind = spec["kind"]
    variant = spec.get("variant")
    if (kind, variant) in REFERENT_FOR:
        return REFERENT_FOR[(kind, variant)]
    return REFERENT_FOR[(kind, None)]


def smoothstep(t):
    return t * t * (3.0 - 2.0 * t)


# Overlap between a sunk tile's rim and the ground around it, in mm. Sized
# to swallow the seam without reading as a step: a twentieth of a millimetre
# is a fifth of a pixel at the rig's 4 px/mm.
SEAM_MM = 0.05


def cut_into(face, cutter, name):
    """boolean_cut, but safe on a face that is not at the origin.

    boolean_cut parents the cutter to its target, and a parent assignment
    with no parent inverse re-applies the target's transform to the cutter —
    harmless when the target is the ground at z = 0, but it lifts every
    recess by the body's elevation once the target is the device."""
    boolean_cut(face, cutter, name=name)
    # matrix_world is lazily evaluated, so a freshly built body still reports
    # the identity here and the compensation would be a no-op
    bpy.context.view_layer.update()
    cutter.matrix_parent_inverse = face.matrix_world.inverted()


def flush_mount(tile, face):
    """Sink a referent's base tile into `face` — the faceplate it is
    mounted on — so its top lands level with that surface, by cutting a
    tile-shaped recess.

    Every referent except the knobs mounts on such a tile: a slab standing
    proud of whatever it sits on. In the one-per-frame docs shots that tile
    reads as a panel running off-frame, but on a device it would be a raised
    plate with its own edges and drop shadow, and the CSS components have no
    such plate — they are grooves and caps cut into one flat face. Sinking
    the tiles makes the Blender panel the same shape of thing the CSS panel
    is.

    The recess stops at the tile's underside rather than going through, so
    cuts in the tile (a button's clearance hole, a fader's slot) bottom out
    on solid material instead of opening into a void.
    """
    # matrix_world is lazily evaluated: without this the tile still reports
    # its pre-placement transform and every recess lands at the origin.
    bpy.context.view_layer.update()
    ws = [tile.matrix_world @ Vector(c) for c in tile.bound_box]
    height = max(v.z for v in ws) - min(v.z for v in ws)
    span = max(max(v.x for v in ws) - min(v.x for v in ws),
               max(v.y for v in ws) - min(v.y for v in ws))

    # The recess takes the tile's own footprint — a bounding box would leave
    # the corners of a round or stadium tile ("fit" tiles hug the cap
    # profile) open onto the material below. Share the tile's mesh, which is
    # the bare prism: modifiers live on the object, so the button's
    # clearance hole is not carried into the cutter.
    cutter = bpy.data.objects.new(tile.name + "_Recess", tile.data)
    bpy.context.collection.objects.link(cutter)
    cutter.matrix_world = tile.matrix_world.copy()
    cutter.scale = (1.0 - 2 * SEAM_MM / span, 1.0 - 2 * SEAM_MM / span,
                    (height + 0.5) / height)
    cutter.location = (tile.location.x, tile.location.y,
                       tile.location.z - height)
    cut_into(face, cutter, "Recess_" + tile.name)
    tile.location = (tile.location.x, tile.location.y,
                     tile.location.z - height)


def build_body(layout):
    """The device: a chamfered slab standing off the ground, whose top face
    every control mounts into. This is the calibration plate — the same
    builder the effect frames use — so the CSS peer is the plain
    `.ambient .amb-surface .amb-chamfer-2` box, and its edge, elevation and
    drop shadow are grounded by the shipped coefficients rather than
    invented for the hero. Returns (object, top_z)."""
    spec = layout["body"]
    a = ap.amb(**spec["amb"])
    thickness = am.thickness_mm(a)
    chamfer, _fillet = am.edge_mm(a)
    z = am.plate_z(a)
    body = build_plate(
        "Body", width=spec["size"][0], depth=spec["size"][1],
        thickness=thickness, chamfer=chamfer, location=(0.0, 0.0, z),
        material=ap.calib_material("BodyMat", ap.GROUND_ALBEDO),
    )
    return body, z + thickness


def build_screen(spec, body, face_z):
    """A recess in the faceplate with a dark floor — the display cutout.
    Physically a groove (components/plate.py build_groove is its calibration
    referent) lined with the accent material, which is what the CSS peer
    `.amb-groove.amb-surface-darkest` paints."""
    w, d = spec["size"]
    recess = am.thickness_mm(ap.amb(**spec.get("amb", {})))
    x, y = spec["x"], spec["y"]
    pts = [(x - w / 2, y - d / 2), (x + w / 2, y - d / 2),
           (x + w / 2, y + d / 2), (x - w / 2, y + d / 2)]
    cutter = prism_object("ScreenCut", pts, face_z - recess, face_z + 1.0)
    cut_into(body, cutter, "Recess_Screen")
    # floor, grown past the recess wall so it is buried at the rim
    pad = 1.0
    floor_pts = [(x - w / 2 - pad, y - d / 2 - pad), (x + w / 2 + pad, y - d / 2 - pad),
                 (x + w / 2 + pad, y + d / 2 + pad), (x - w / 2 - pad, y + d / 2 + pad)]
    return prism_object(
        "ScreenFloor", floor_pts, face_z - recess - 1.0, face_z - recess + 0.02,
        material=ap.calib_material("ScreenMat", am.DARKEST_ALBEDO),
    )


def build(layout):
    """Rig + panel, at the layout's frame size. Returns the camera's parent
    empty (the thing the camera move rotates)."""
    frame_w, frame_h = layout["frameMm"]
    a = ap.amb(**{k: v for k, v in layout["amb"].items()})

    # The rig's key light sits LIGHT_R away, tuned so its direction is
    # near-constant across a 128 mm frame. A wider frame puts components
    # further off-centre, where they would see a visibly different light
    # direction than the single vector the CSS applies — so push the light
    # out in proportion to the frame.
    scale = max(frame_w, frame_h) / am.FRAME_MM
    for name in ("LIGHT_R", "LIGHT_Z", "LIGHT_SIZE"):
        setattr(ap, name, getattr(am, name) * scale)

    # The ground is sized for a flat-on 128 mm frame. Tilted and pulled back
    # for the opening 3/4 view, the camera sees roughly ZOOM_START / cos(tilt)
    # times the frame across a footprint rotated by the azimuth — well past
    # 400 mm — and the corners fall off the edge of the plane onto the world
    # background. Scale it with the frame; it costs nothing to render.
    ap.GROUND_MM = am.GROUND_MM * scale

    kit.reset_scene()
    ground = ap.setup_calibration_rig(a, patches=False)

    # Irradiance falls with the square of the distance the light was just
    # pushed out to, and the fill world does not move with it — without this
    # the whole panel renders dark and fill-heavy, and the surface no longer
    # lands on the .amb-surface lightness the CSS paints.
    bpy.data.objects["AmbKey"].data.energy *= scale ** 2

    # Controls mount into the device's top face; without a body they mount
    # into the ground itself, which is the effect frames' convention.
    if "body" in layout:
        face, face_z = build_body(layout)
    else:
        face, face_z = ground, 0.0

    for spec in layout["components"]:
        if spec["kind"] == "screen":
            build_screen(spec, face, face_z)
            continue
        key = referent_key(spec)
        obj = REFERENTS[key](
            location=(spec["x"], spec["y"], face_z),
            value=spec.get("value", 0.0),
        )
        # the knob referents are built with base=None and stand directly on
        # the face; everything else returns its base tile
        if not key.startswith("knob"):
            flush_mount(obj, face)

    cam = bpy.context.scene.camera
    cam.data.ortho_scale = max(frame_w, frame_h)
    scene = bpy.context.scene
    scene.render.resolution_x = int(frame_w * layout["pxPerMm"])
    scene.render.resolution_y = int(frame_h * layout["pxPerMm"])

    pivot = bpy.data.objects.new("CamPivot", None)
    bpy.context.collection.objects.link(pivot)
    cam.parent = pivot
    cam.matrix_parent_inverse.identity()
    return pivot


def pose(pivot, cam, frame_mm, tilt_deg, azim_deg, zoom):
    """Blender's XYZ euler applies X first, then Z, so this tilts the camera
    away from straight-down and then spins that tilted view about the panel's
    vertical axis. (0, 0, 1) is the calibration pose."""
    pivot.rotation_euler = (math.radians(tilt_deg), 0.0, math.radians(azim_deg))
    cam.data.ortho_scale = frame_mm * zoom


def frames():
    """(tilt, azimuth, zoom) per frame, ending at the calibration pose."""
    out = []
    for i in range(FRAMES_OPEN):
        t = i / (FRAMES_OPEN - 1)
        out.append((TILT_START, AZIM_START + (AZIM_HOLD - AZIM_START) * t,
                    ZOOM_START))
    for i in range(1, FRAMES_TILT + 1):
        t = smoothstep(i / FRAMES_TILT)
        out.append((TILT_START * (1.0 - t), AZIM_HOLD * (1.0 - t),
                    ZOOM_START + (1.0 - ZOOM_START) * t))
    return out


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    name = "panel"
    flat_only = "--flat" in argv
    if "--layout" in argv:
        name = argv[argv.index("--layout") + 1]

    with open(os.path.join(LAYOUTS, f"{name}.json")) as fh:
        layout = json.load(fh)

    pivot = build(layout)
    out_dir = os.path.join(HERO, "out", "blender", name)
    os.makedirs(out_dir, exist_ok=True)

    if flat_only:
        seq = [(0.0, 0.0, 1.0)]
    elif "--pose" in argv:                     # spot-check one camera angle
        i = argv.index("--pose")
        seq = [(float(argv[i + 1]), float(argv[i + 2]), float(argv[i + 3]))]
    else:
        seq = frames()

    cam = bpy.context.scene.camera
    frame_w, frame_h = layout["frameMm"]
    for i, (tilt, azim, zoom) in enumerate(seq):
        pose(pivot, cam, max(frame_w, frame_h), tilt, azim, zoom)
        bpy.context.view_layer.update()
        png = os.path.join(out_dir, f"{i:04d}.png")
        kit.setup_render(png, samples=SAMPLES)
        bpy.context.scene.render.resolution_x = int(frame_w * layout["pxPerMm"])
        bpy.context.scene.render.resolution_y = int(frame_h * layout["pxPerMm"])
        ap.finalize_calibration_render(samples=SAMPLES)
        kit.render_and_save(png)
        print(f"WROTE {png}  tilt {tilt:5.1f} azim {azim:5.1f} zoom {zoom:4.2f}")


if __name__ == "__main__":
    main()
