"""Parametric push button on a sharp, flat base tile.

`shape_n` is the superellipse exponent: 2.0 gives a round button, ~4.5 the
rounded-square OP-1 style key. `base_style` "flush" seats the cap in a
plain clearance hole (OP-1/EP-133 panels); "well" is the TP-7-style
machined pocket — the cap sits in a countersunk recess with a shadow-gap
ring, barely proud of the tile.

`tile_shape` "rect" gives a sharp-cornered rectangular tile so buttons can
butt side by side into a panel (tile size, thickness, and material are
parametric); "fit" hugs the cap profile at `tile_margin` instead — the
CSS button's look, where the well IS the button and there's no
surrounding panel.

State: `value` (0..1) sinks the cap by `value * travel`; 1.0 = fully
pressed. Requires the base (the cap alone has nothing to travel into).
Units: mm.
"""

from components._common import (base_tile, boolean_cut, capped_solid,
                                label_object, offset_profile, prism_object,
                                superellipse)


def build_button(
    name="Button",
    width=9.0,            # cap width (diameter if round)
    depth=None,           # cap depth; defaults to width
    height=4.2,           # cap height
    shape_n=2.0,          # 2.0 round, >=4 rounded square
    dome=0.5,             # cap dome height, 0 = flat
    fillet=1.1,
    base=True,
    base_size=None,       # (w, d) tile; default: cap + 3mm border each side
    base_h=2.5,           # tile thickness
    tile_shape="rect",    # "rect" sharp tile (butts panel neighbors) or
                          # "fit" hugs the cap profile at tile_margin (the
                          # CSS button's tight well-ring look: the well IS
                          # the button, no surrounding panel)
    tile_margin=2.0,      # "fit" mode: tile edge beyond the cap profile
    base_style="flush",   # "flush" clearance hole or "well" machined pocket
    clearance=0.4,        # gap between cap and hole (flush)
    seat=1.2,             # how deep the flush cap sits into the tile
    well_gap=0.6,         # shadow-gap ring width around a well cap
    well_depth=1.3,       # pocket depth
    label=None,           # printed text, or "@play"/"@stop"/"@rec"/...
    label_size=None,      # glyph height / font size in mm; auto if None
    value=0.0,            # 0..1 press state
    travel=0.7,           # full-press depth
    cap_material=None,
    base_material=None,
    label_material=None,
    location=(0.0, 0.0, 0.0),
):
    depth = depth if depth is not None else width
    cap_profile = superellipse(width / 2, depth / 2, shape_n)

    cap = capped_solid(
        name + "_Cap", cap_profile, height,
        fillet=fillet, chamfer=0.0, dome=dome,
        location=location, material=cap_material,
    )

    if label:
        size = label_size
        if size is None:
            size = min(width, depth) * (0.34 if label.startswith("@") else 0.42)
            if not label.startswith("@") and len(label) > 1:
                # rough clamp so long words stay inside the cap
                size = min(size, width * 0.8 / (0.62 * len(label)))
        lab = label_object(name + "_Label", label, size=size,
                           material=label_material)
        lab.parent = cap
        # sink into the cap so only a hair of relief shows: printed, not embossed
        lab.location = (0, 0, height + dome - 0.06)

    if not base:
        return cap

    if tile_shape == "fit":
        tile = prism_object(
            name + "_Base", offset_profile(cap_profile, -tile_margin),
            0.0, base_h, material=base_material, location=location,
        )
    else:
        if base_size is None:
            base_size = (width + 6.0, depth + 6.0)
        tile = base_tile(name + "_Base", base_size[0], base_size[1], base_h,
                         material=base_material, location=location)

    if base_style == "well":
        pocket = prism_object(
            name + "_Pocket",
            offset_profile(cap_profile, -well_gap),
            base_h - well_depth, base_h + 1.0,
        )
        boolean_cut(tile, pocket)
        cap_rest = base_h - well_depth
    else:
        hole = prism_object(
            name + "_Hole",
            offset_profile(cap_profile, -clearance),
            -1.0, base_h + 1.0,
        )
        boolean_cut(tile, hole)
        cap_rest = base_h - seat

    cap.parent = tile
    cap.location = (0, 0, cap_rest)
    tile["skeuo_type"] = "button"
    tile["skeuo_travel"] = travel
    tile["skeuo_cap_rest"] = cap_rest
    set_value(tile, value)
    return tile


def set_value(obj, value):
    v = max(0.0, min(1.0, value))
    obj["skeuo_value"] = v
    rest = obj.get("skeuo_cap_rest", 0.0)
    for child in obj.children:
        if child.name.split(".")[0].endswith("_Cap"):
            child.location = (0, 0, rest - obj["skeuo_travel"] * v)
    return obj
