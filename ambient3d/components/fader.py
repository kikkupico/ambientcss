"""Parametric fader on a sharp, flat base tile: slot, stem, and cap.

`cap_shape` "pill" is the OB-4-style rectangular cap with a grip line;
"disc" is the small round thumb of the TX-6/EP-133. `ticks` prints a row of
scale dots alongside the slot. A dark slab sits inside the tile under the
slot so it reads as a black cavity while the tile still lies flat and butts
seamlessly against panel neighbors.

State: `value` (0..1) places the cap along the slot; `set_value` re-poses a
built fader by sliding stem and cap. Units: mm.
"""

import math

from components._common import (accent_bar, base_tile, boolean_cut,
                                capped_solid, prism_object, superellipse)


def build_fader(
    name="Fader",
    base_w=48.0,
    base_d=14.0,
    base_h=2.5,
    slot_len=36.0,
    slot_w=2.8,
    cap_shape="pill",     # "pill" or "disc"
    cap_w=11.0,           # pill cap size along the slot
    cap_d=7.0,
    cap_h=7.0,
    disc_d=8.5,           # disc thumb diameter
    disc_h=2.6,
    ticks=0,              # printed scale dots alongside the slot
    value=0.5,            # 0..1 along the slot
    well_depth=1.2,       # visual depth of the dark cavity below the slot
    plate_material=None,
    cap_material=None,
    accent_material=None,
    well_material=None,
    tick_material=None,
    location=(0.0, 0.0, 0.0),
):
    plate = base_tile(name + "_Plate", base_w, base_d, base_h,
                      material=plate_material, location=location)

    slot_profile = superellipse(slot_len / 2, slot_w / 2, 2.2)
    slot = prism_object(name + "_Slot", slot_profile, -1.0, base_h + 1.0)
    boolean_cut(plate, slot)

    # dark slab inside the tile; visible through the slot as a black cavity
    well = prism_object(
        name + "_Well",
        [(-slot_len / 2 - 2, -slot_w / 2 - 2), (slot_len / 2 + 2, -slot_w / 2 - 2),
         (slot_len / 2 + 2, slot_w / 2 + 2), (-slot_len / 2 - 2, slot_w / 2 + 2)],
        0.05, base_h - well_depth,
        material=well_material,
    )
    well.parent = plate
    well.location = (0, 0, 0)

    stem = prism_object(
        name + "_Stem",
        superellipse(1.2, slot_w / 2 - 0.5, 3.0),
        base_h - well_depth - 0.2, base_h + 2.2,
        material=cap_material,
    )
    stem.parent = plate
    stem.location = (0, 0, 0)

    if cap_shape == "disc":
        cap = capped_solid(
            name + "_Cap", superellipse(disc_d / 2, disc_d / 2, 2.0, 128),
            disc_h, fillet=0.8, chamfer=0.0, dome=0.35,
            material=cap_material,
        )
        cap.parent = plate
        cap.location = (0, 0, base_h + 2.2)
        cap_extent = disc_d / 2
    else:
        cap_profile = superellipse(cap_w / 2, cap_d / 2, 4.5)
        cap = capped_solid(
            name + "_Cap", cap_profile, cap_h,
            fillet=1.0, chamfer=0.3,
            material=cap_material,
        )
        cap.parent = plate
        cap.location = (0, 0, base_h + 2.2)
        cap_extent = cap_w / 2

        # grip line across the cap top
        bar_len = cap_d * 0.8
        bar = accent_bar(
            name + "_Grip",
            length=bar_len, width=cap_w * 0.09, thickness=0.3,
            top_z=cap_h, angle=math.radians(90),
        )
        bar.parent = cap
        bar.location = (0, -bar_len / 2, 0)
        if accent_material:
            bar.data.materials.append(accent_material)

    travel = slot_len / 2 - cap_extent * 0.5
    if ticks > 1:
        ty = slot_w / 2 + 1.8
        for i in range(ticks):
            tx = -travel + 2 * travel * i / (ticks - 1)
            dot = prism_object(
                name + f"_Tick{i}",
                superellipse(0.35, 0.35, 2.0, 32),
                base_h - 0.05, base_h + 0.04,
                material=tick_material,
            )
            dot.parent = plate
            dot.location = (tx, ty, 0)

    plate["skeuo_type"] = "fader"
    plate["skeuo_travel"] = travel
    set_value(plate, value)
    return plate


def set_value(obj, value):
    v = max(0.0, min(1.0, value))
    obj["skeuo_value"] = v
    x = obj["skeuo_travel"] * (2 * v - 1.0)
    for child in obj.children:
        base = child.name.split(".")[0]
        if base.endswith("_Stem") or base.endswith("_Cap"):
            child.location.x = x
    return obj
