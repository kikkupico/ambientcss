"""Parametric slider: a shallow rounded groove in a flat tile with a
domed disc thumb riding on the surface.

The 3D counterpart of AmbientSlider: a shallow concave channel (the
physical referent of `.amb-surface-concave-h`) — like the fader's slot
it reads as a dark `--amb-lume` cavity (`floor_material`), just shallower
and without a through-slot's stem — and the thumb glides over it.

State: `value` (0..1) places the thumb along the groove; `set_value`
re-poses a built slider. Units: mm.
"""

from components._common import (base_tile, boolean_cut, capped_solid,
                                offset_profile, prism_object, stadium,
                                superellipse)


def build_slider(
    name="Slider",
    base_w=48.0,
    base_d=14.0,
    base_h=2.5,
    groove_len=36.0,
    groove_w=3.4,
    groove_depth=1.0,     # shallow concave channel, not a through-slot
    thumb_d=9.0,
    thumb_h=3.2,
    value=0.5,
    floor_material=None,  # groove floor color; falls back to plate_material
                          # (CSS tracks sit on a dark --amb-lume interior)
    plate_material=None,
    thumb_material=None,
    location=(0.0, 0.0, 0.0),
):
    groove_profile = stadium(groove_len, groove_w)

    plate = base_tile(name + "_Plate", base_w, base_d, base_h,
                      material=plate_material, location=location)

    groove = prism_object(name + "_Groove", groove_profile,
                          base_h - groove_depth, base_h + 1.0)
    boolean_cut(plate, groove)

    if floor_material is not None:
        floor = prism_object(
            name + "_Floor", offset_profile(groove_profile, -1.0),
            0.05, base_h - groove_depth + 0.02, material=floor_material,
        )
        floor.parent = plate
        floor.location = (0, 0, 0)

    thumb = capped_solid(
        name + "_Thumb", superellipse(thumb_d / 2, thumb_d / 2, 2.0, 128),
        thumb_h, fillet=0.9, chamfer=0.25, dome=0.5,
        material=thumb_material,
    )
    thumb.parent = plate
    thumb.location = (0, 0, base_h - groove_depth * 0.4)

    plate["skeuo_type"] = "slider"
    plate["skeuo_travel"] = groove_len / 2 - thumb_d * 0.35
    set_value(plate, value)
    return plate


def set_value(obj, value):
    v = max(0.0, min(1.0, value))
    obj["skeuo_value"] = v
    x = obj["skeuo_travel"] * (2 * v - 1.0)
    for child in obj.children:
        if child.name.split(".")[0].endswith("_Thumb"):
            child.location.x = x
    return obj
