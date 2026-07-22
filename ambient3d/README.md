# ambient3d — Parametric 3D Component Kit & Physical Grounding Engine

`ambient3d` is a Python-driven 3D component kit and physical raytracing calibration engine for Blender. It serves two purposes in Ambient CSS:

1. **Parametric 3D Hardware Kit**: Headlessly generates 3D skeuomorphic hardware controls (knobs, buttons, faders, grilles, panels) as pure functions of physical parameters (radius, chamfers, fillets, travel, material roughness/specularity).
2. **Ground-Truth Calibration Engine**: Generates 3D scenes on studio cycloramas, measures raytraced light intensity, shadows, and highlight falloffs, and fits the CSS shading formulas used in `@ambientcss/css`.

---

## Usage

Run headlessly inside Blender:

```sh
# Generate individual components with custom parameters & presets
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

# Render composite scenes
blender -b -P generate.py -- lineup     # All knob presets in a row
blender -b -P generate.py -- catalog    # Hero shot of every component
blender -b -P generate.py -- panel      # Mock hardware device panel built from tiled faceplates
```

Each execution outputs `out/<name>.blend` (editable Blender scene) and `out/<name>.png` (studio render on an infinite-sweep cyclorama).

---

## Ground Truth Calibration

To measure physical raytracing lighting and update CSS coefficients:

```sh
# Render grounded reference components under calibrated lighting environments
blender -b -P ground_components.py

# Render the README hero panel (camera move; see tools/hero-gif to assemble)
blender -b -P hero_panel.py

# Extract lighting curves and derive CSS coefficients
python3 calibrate.py
```

Calculated coefficients are saved to `derived/coefficients.json` and documented in `derived/notes/` for CSS implementation.

---

## Components & Parameters

### **knob** — Knurled & fluted rotary controls
- `--radius` (6), `--height` (9), `--ribs` (48, 0 = smooth), `--rib-depth` (0.22), `--rib-sharpness` (1.4)
- `--taper` (0), `--indicator` `line`|`dot`|`none`, `--top-disc` + `--top-preset` (smooth contrasting cap)
- Named style presets: `--knob-style opz|op1|wheel|classic`

### **button** — Tactile caps seated in base tiles
- `--style` `key`|`pad`|`metal` — pillowed key, flat square pad, or machined aluminum cap in a countersunk well.
- `--shape` `round`|`square`, `--width` (9), `--depth`, `--cap-h`, `--fillet`, `--dome`, `--travel` (press depth).
- `--label` text (`--label shift`) in Helvetica or clean geometric icons (`@play`, `@stop`, `@rec`, `@plus`, `@minus`).

### **fader** — Slotted tile + stem + cap over internal cavity
- `--cap` `pill`|`disc`, `--slot-len` (36), `--slot-w` (2.8), `--cap-w`, `--cap-d`, `--cap-h`, `--disc-d`
- `--ticks N` printed scale dots, `--value` (0..1) cap position.

### **grille** — Perforated sound plate
- `--pattern` `grid`|`hex`, `--hole-d` (2.0), `--pitch` (3.4), `--margin` (3.5) hole-free border.

---

## Color Presets & Materials

Available color presets (`skeuo_kit.PRESETS`):
`orange`, `cream`, `bone`, `grey`, `graphite`, `cobalt`, `navy`, `tan`, `alu`

Common CLI flags:
- `--out-dir` output directory path
- `--resolution` (default 900)
- `--samples` (default 96)

---

## Base Tiles & Panels

Every component mounts on a sharp-cornered flat rectangular tile (`base_tile` in `components/_common.py`) with parametric size, thickness, and material:
- `--base W D` sets tile footprint for any component
- `--base-h` thickness (2.5mm)
- `--base-preset <preset>|alu` material finish

Tiles with equal thickness butt together seamlessly to form full device faceplates (see `generate.py -- panel` for a 96×64mm example).

---

## State & Animation

Knobs, buttons, and faders accept a normalized `--value` (0..1) / `--pos` (or `--pressed` for buttons) mapped to physical poses:
- Knob rotation (`min_angle` −135° to `sweep` +270°)
- Button travel depth
- Fader position

State changes apply pure matrix transforms to fixed geometry (`components.set_value(obj, v)`), allowing effortless Blender animation keyframing.

---

## Project Structure

- `skeuo_kit.py` — Color palette, plastic + aluminum materials, studio environment setup, render config.
- `amb_model.py` / `amb_params.py` — Shading models and parameter representations for calibration.
- `calibrate.py` — Statistical curve fitting tool that derives CSS shading coefficients from 3D renders.
- `ground_components.py` — Generates reference models for physical measurement.
- `components/_common.py` — Superellipse geometry profiles, lofting, boolean modifiers, accent graphics.
- `components/knob.py`, `button.py`, `fader.py`, `grille.py` — Component builders.
- `referents.py` — The 3D referent of each `@ambientcss/components` component, built at the CSS component's dimensions in calibration materials. Shared by every scene that places them.
- `hero_panel.py` — The README hero: a panel of referents under an orthographic camera move that ends at the calibration pose, so the last frame is pixel-comparable with the CSS. See [`tools/hero-gif`](../tools/hero-gif).
- `derived/` — Calibration measurements, JSON outputs, and theory notes.
- `generate.py` — Blender CLI entry point.

