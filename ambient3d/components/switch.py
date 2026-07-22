"""Parametric slide switch: a stadium recess in a flat tile with a pill
thumb that sits at either end, plus an optional printed LED dot.

The 3D counterpart of AmbientSwitch. State: `value` (0 = off, 1 = on)
slides the pill to the corresponding end of the recess; intermediate
values are legal (they read as mid-throw and keyframe cleanly).
Units: mm.
"""

from components._common import (base_tile, boolean_cut, capped_solid,
                                offset_profile, prism_object, stadium,
                                superellipse)


def build_switch(
    name="Switch",
    base_w=22.0,
    base_d=13.0,
    base_h=2.5,
    well_l=14.0,          # stadium recess length (x)
    well_w=7.0,
    well_depth=1.5,
    pill_h=2.6,           # pill height above the recess floor
    value=0.0,
    led=False,            # printed indicator dot above the recess
    tile_shape="rect",    # "rect" sharp tile or "fit" hugs the well
                          # stadium at tile_margin (CSS: the track IS the
                          # switch, no surrounding panel)
    tile_margin=2.0,      # "fit" mode: tile edge beyond the well profile
    floor_material=None,  # recess floor color; falls back to plate_material
                          # (CSS tracks sit on a dark --amb-lume interior)
    plate_material=None,
    pill_material=None,
    led_material=None,
    location=(0.0, 0.0, 0.0),
):
    well_profile = stadium(well_l, well_w)

    if tile_shape == "fit":
        plate = prism_object(
            name + "_Plate", offset_profile(well_profile, -tile_margin),
            0.0, base_h, material=plate_material, location=location,
        )
    else:
        plate = base_tile(name + "_Plate", base_w, base_d, base_h,
                          material=plate_material, location=location)

    well = prism_object(name + "_Well", well_profile,
                        base_h - well_depth, base_h + 1.0)
    boolean_cut(plate, well)

    if floor_material is not None:
        floor = prism_object(
            name + "_Floor", offset_profile(well_profile, -1.0),
            0.05, base_h - well_depth + 0.02, material=floor_material,
        )
        floor.parent = plate
        floor.location = (0, 0, 0)

    pill_l = well_l * 0.52
    pill_w = well_w * 0.78
    pill = capped_solid(
        name + "_Pill", stadium(pill_l, pill_w),
        well_depth + pill_h, fillet=0.8, chamfer=0.0, dome=0.25,
        material=pill_material,
    )
    pill.parent = plate
    pill.location = (0, 0, base_h - well_depth + 0.1)

    if led:
        dot = prism_object(
            name + "_Led", superellipse(0.9, 0.9, 2.0, 48),
            base_h - 0.05, base_h + 0.12,
            material=led_material,
        )
        dot.parent = plate
        dot.location = (0, well_w / 2 + 2.2, 0)

    plate["skeuo_type"] = "switch"
    plate["skeuo_travel"] = well_l / 2 - pill_l / 2 - 0.5
    set_value(plate, value)
    return plate


def set_value(obj, value):
    v = max(0.0, min(1.0, value))
    obj["skeuo_value"] = v
    x = obj["skeuo_travel"] * (2 * v - 1.0)
    for child in obj.children:
        if child.name.split(".")[0].endswith("_Pill"):
            child.location.x = x
    return obj
