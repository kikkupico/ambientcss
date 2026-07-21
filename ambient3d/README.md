# skeuo — parametric TE-style component kit for Blender

Components are generated headlessly by Python, so every part is a pure
function of its parameters. Solids are lofted from superellipse profiles
(one exponent slides between circle, pill, and rounded square); holes are
cut with live boolean modifiers. Units are mm.

## Usage

```sh
blender -b -P generate.py -- knob --preset orange
blender -b -P generate.py -- knob --preset graphite --radius 8 --ribs 0
blender -b -P generate.py -- knob --knob-style opz
blender -b -P generate.py -- knob --knob-style wheel --radius 5.5 --height 7
blender -b -P generate.py -- button --shape square --preset cream
blender -b -P generate.py -- button --style metal --label "@play"
blender -b -P generate.py -- button --shape square --label shift
blender -b -P generate.py -- button --style pad --preset graphite --pressed
blender -b -P generate.py -- fader --preset orange --pos 0.7
blender -b -P generate.py -- grille --hole-d 2.2 --pitch 3.6
blender -b -P generate.py -- lineup     # all knob presets in a row
blender -b -P generate.py -- catalog    # hero shot of every component
blender -b -P generate.py -- panel      # mock device from butted tiles
```

Each run writes `out/<name>.blend` (openable scene) and `out/<name>.png`
(studio render on an infinite-sweep cyclorama).

## Components and parameters

**knob** — knurled/fluted rotary knob.
`--radius` (6), `--height` (9), `--ribs` (48, 0 = smooth), `--rib-depth`
(0.22), `--rib-sharpness` (1.4; high = broad ridges, narrow grooves),
`--taper` (0), `--indicator` line|dot|none, `--top-disc` +
`--top-preset` (smooth contrasting cap). Style recipes from inspiration/:
- OP-Z flutes: `--ribs 14 --rib-depth 0.7 --rib-sharpness 8 --taper 0.1
  --indicator dot`
- OP-1 field encoder: `--ribs 64 --rib-depth 0.15 --indicator none
  --top-disc --top-preset orange`

`--knob-style opz|op1|wheel` applies these as named bundles (wheel is the
TP-7 knurled aluminum scroll wheel); `classic` (default) uses the raw
flags. `--preset` overrides the bundle's body color.

**button** — cap seated in its base tile.
`--style` key|pad|metal — OP-1 pillowed key, EP-133 flat square pad, or
TP-7 machined aluminum cap in a countersunk pocket with a shadow-gap ring
(`base_style="well"` in the builder; "flush" is a plain clearance hole).
`--shape` round|square, `--width` (9), `--depth` (default = width, set for
rectangular keys), `--cap-h` cap height, `--fillet`, `--dome`, `--travel`.
`--label` prints on the cap: text (`--label shift`) is set in Helvetica
with auto-sized type; `@play` `@stop` `@rec` `@plus` `@minus` are clean
geometric glyphs. Label color defaults to the cap preset's accent
(`label_material` in the builder). Labels are thin relief (~0.04mm proud)
so they read as ink, and they ride the cap when pressed.

**fader** — slotted tile + stem + cap over a dark internal cavity.
`--cap` pill|disc (disc = TX-6/EP-133 round thumb), `--slot-len` (36),
`--slot-w` (2.8), `--cap-w`/`--cap-d`/`--cap-h` pill cap dims, `--disc-d`
disc diameter, `--ticks N` printed scale dots, `--value` 0..1 cap position.

**grille** — perforated plate.
`--pattern` grid|hex (grid is the TE pattern), `--hole-d` (2.0),
`--pitch` (3.4), `--margin` (3.5) hole-free border.

Presets: orange, cream, bone, grey, graphite, cobalt, navy, tan
(`skeuo_kit.PRESETS`).
Common flags: `--out-dir`, `--resolution` (900), `--samples` (96).

## Base tiles and panels

Every component mounts on a sharp-cornered flat rectangular tile
(`base_tile` in `_common.py`) with parametric size, thickness, and
material — `--base W D` sets the tile footprint for any component (also
the grille/fader plate size), `--base-h` the thickness (2.5),
`--base-preset <preset>|alu` the material; or `base_material`/
`plate_material` in the builders. Tiles with the same
thickness butt together seamlessly, so a whole faceplate is just
components placed on a grid — see the `panel` mode in `generate.py` for a
96×64mm example. Knobs get a tile only when `--base`/`base=(w, d)` is given; buttons
auto-size their tile to the cap + 3mm unless overridden. Grille and fader
tiles hide a dark internal slab so holes and slots read as cavities while
the tile still lies flat.

## State

Knob, button, and fader take a normalized `value` (0..1) mapped to a
physical pose — knob rotation (`min_angle` −135° + `sweep` 270°, like a real
pot), button press depth (`travel`, default 0.9mm), fader cap position.
CLI: `--value 0.33` (alias `--pos`), or `--pressed` for buttons.

State is pure object transforms on fixed geometry, never different
geometry. Mapping is stored as custom properties (`skeuo_type`,
`skeuo_travel`, ...) on the root object, so `components.set_value(obj, v)`
re-poses any component — including one loaded from a saved .blend — and
keyframing `value` poses is all it takes to animate.

## Layout

- `skeuo_kit.py` — palette/presets, plastic + aluminum materials, cyclorama
  studio (camera azimuth/elevation/distance per scene), render config
- `components/_common.py` — superellipse profiles, profile offsetting,
  lofted `capped_solid`, prisms, boolean cuts, printed accent bars
- `components/knob.py`, `button.py`, `fader.py`, `grille.py` — builders
- `generate.py` — CLI entry point run inside Blender

## Adding a component

Add `components/<part>.py` with a `build_<part>(**params)` that returns the
root object, register a mode in `generate.py`, and reuse `_common` geometry
helpers and `skeuo_kit` materials/studio.

## Notes

- The render color transform is Standard, not AgX — AgX washes out the flat
  TE palette.
- Boolean-cut plates (grille, fader) are flat-shaded: smooth normals blotch
  across cut faces.
