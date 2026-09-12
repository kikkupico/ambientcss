# glass — grounded fit

Model: `pane transfer out = T*backdrop + V (sRGB), T = tk*Ik + tf*If + t0, V = vk*Ik + vf*If + v0; CSS alpha = 1 - T, lightness = V / alpha; body gate T/V per thickness; frost blur sigma_mm = be*elev_mm + bt*thick_mm; edge band peaks (lit: dark, far: bright) affine in Ik, If; veil gradient lit/far sixth excess affine in Ik, If`

- **shadow_ring**: `{"e0_t1": {"peak_alpha": 0.2086, "peak_d_mm": 2.62, "hm_mm": 4.38, "near_alpha": 0.1364, "halo_alpha": 0.0004}, "e1_t1": {"peak_alpha": 0.1755, "peak_d_mm": 8.12, "hm_mm": 12.88, "near_alpha": 0.09, "halo_alpha": 0.0103}, "e2_t1": {"peak_alpha": 0.1737, "peak_d_mm": 13.25, "hm_mm": 21.38, "near_alpha": 0.1029, "halo_alpha": 0.0835}, "e3_t1": {"peak_alpha": 0.1542, "peak_d_mm": 18.0, "hm_mm": 21.88, "near_alpha": 0.0931, "halo_alpha": 0.143}, "e0_t2": {"peak_alpha": 0.2114, "peak_d_mm": 5.38, "hm_mm": 8.88, "near_alpha": 0.1103, "halo_alpha": 0.0067}}`
- **shadow_interior_alpha**: `0.0953`
- **ring_center_per_elev**: `5.164`
- **ring_center_per_thick**: `2.72`
- **ring_sigma_per_elev**: `1.207`
- **ring_sigma_per_thick**: `1.803`
- **ring_peak_per_elev**: `-0.0165`
- **ring_peak0**: `0.2027`
- **T_per_key**: `0.0011`
- **T_per_fill**: `0.0167`
- **T0**: `0.7674`
- **r2_T**: `0.0533`
- **V_per_key**: `0.0509`
- **V_per_fill**: `0.0424`
- **V0**: `0.0923`
- **r2_V**: `0.9176`
- **TV_by_light_at_defaults**: `{"-1,-1": [0.7689, 0.1714], "-1,0": [0.7949, 0.1632], "0,-1": [0.7956, 0.1629], "1,0": [0.7958, 0.1629]}`
- **body**: `{"t1": {"T": 0.7478, "V": 0.19}, "t0": {"T": 0.9457, "V": 0.0184}, "t2": {"T": 0.7243, "V": 0.2103}}`
- **blur_per_elev_mm**: `0.1884`
- **blur_per_thick_mm**: `0.1393`
- **r2_blur**: `0.9936`
- **n_blur_samples**: `7`
- **bands_at_defaults**: `{"lit": {"T": 0.5438, "V": 0.2767, "beta": 0.3029, "L_beta": 0.5274, "peak_over_ground": -0.1383, "peak_over_dark": 0.1538}, "far": {"T": 0.691, "V": 0.3023, "beta": 0.1142, "L_beta": 1.3453, "peak_over_ground": 0.027, "peak_over_dark": 0.221}}`
- **lit_edge_mean_at_defaults**: `-0.1063`
- **lit_edge_per_key**: `-0.0847`
- **lit_edge_per_fill**: `0.0219`
- **lit_edge0**: `-0.0439`
- **r2_lit_edge**: `0.9304`
- **lit_edge_width_mm**: `1.917`
- **far_edge_per_key**: `0.0668`
- **far_edge_per_fill**: `-0.0335`
- **far_edge0**: `0.0219`
- **r2_far_edge**: `0.9014`
- **far_edge_width_mm**: `2.05`
- **perp_edge_mean**: `-0.0322`
- **veil_lit_per_key**: `-0.0015`
- **veil_lit_per_fill**: `0.0024`
- **veil_lit0**: `-0.0033`
- **r2_veil_lit**: `0.1531`
- **veil_far_per_key**: `0.0049`
- **veil_far_per_fill**: `-0.007`
- **veil_far0**: `0.014`
- **r2_veil_far**: `0.0668`
- **veil_shape_defaults**: `[-0.0248, -0.0001, 0.0036, 0.0004, -0.0018, -0.0036, -0.0034, -0.0031, -0.0021, -0.0029, -0.0018, -0.001, -0.0003, -0.0004, -0.0009, -0.0005, 0.0001, 0.0002, 0.0004, 0.0001, 0.001, -0.0007, -0.0006, -0.0008, -0.0013, -0.0018, -0.0021, -0.0001, -0.0002, 0.0, 0.0, 0.0009, 0.0008, -0.0003, 0.0006, 0.0, -0.0003, 0.0013, 0.0021, 0.0013, 0.002, 0.0026, 0.0025, 0.0031, 0.0028, 0.004, 0.0038, 0.0053, 0.0058, 0.0057, 0.0062, 0.0081, 0.0097, 0.0107, 0.0125, 0.0134, 0.0151, 0.0175, 0.0219, 0.0303, 0.0483]`

## Transcribed into ambient.css (2026-09-12)

Referent: `amb_params.glass_material` — a clear slab (base colour 1.0,
transmission 1, IOR 1.5, roughness 0.65 on both faces) built by the
`plate` builder at thickness 1, lifted `SHEET_PROUD_MM` off the ground
(`plate_z`) so its bottom face never ties with the ground's top face.
Rendered with Filter Glossy 0 (see the note on `GLASS_ROUGHNESS`); no
shadow-ray tricks. Backdrops are flush decals (`build_decals`,
`DECAL_PROUD_MM`): a full dark field (albedo 0.06) for the transfer solve,
and a 16 mm stripe of the same albedo for the blur. The CSS harness paints
the same rects behind its subject (`css.backdrop` in the manifest).

Blur, edges and the light-axis profile are all measured with `.ambient`
on the CSS side too, so the pane's resting shadow is in both pictures.

**Pane** — `--_glass-alpha`, `--_glass-veil`, `--_glass-lightness`:

    alpha = (0.232 - 0.017 If) * (0.245 + 0.755 body + 0.09 slab2)
    veil  = (0.0509 Ik + 0.0424 If + 0.0923) * (0.09 + 0.91 body + 0.11 slab2)
    background-color: hsl(light-hue light-sat veil/alpha / alpha)

with `body = clamp(thickness, 0, 1)` and `slab2 = clamp(thickness - 1, 0, 1)`.
The key slope of T (0.0011) is dropped; T's own R² is 0.05 because T
barely varies (0.77–0.80 across every frame), which is the point. The
body factors are the ratios of the striped-frame T/V per thickness
(`body` above) to the t1 value: t0 keeps 0.245 of the alpha and 0.09 of
the veil, t2 adds 9% / 11%.

**Blur** — `--_glass-blur = (1.51 elevation + 0.63 thickness) px` (0.1884
mm per mm × 8 mm per level; 0.1393 × 4.5). The elevation-3 frame's stripe
was too smeared for a single-edge fit, which is why `frost_blur` fits the
stripe's whole box; after the stripe moved to x = 4..20 mm (14 mm of pane
past its far edge) every frame fits with R² ≥ 0.993.

**Edges** — eight `background-image` gradients, one lit-wash and one
far-glow per side, each running `--_glass-band-w = 4.5px × thickness`
inward (2.25× the fitted half-max width). Per side `s = ±light-x/-y`
clamped to [-1, 1]: lit wash alpha `0.303 body (1 - elevation)+ (0.81 Ik
- 0.21 If + 0.42)+ (0.5 + 0.5 s)` at lightness 53% (`bands_at_defaults.lit`:
beta 0.30, L 0.53); far glow alpha `0.22 body (1.13 Ik - 0.57 If + 0.37)+
(-s)+` at white, with a 0.7 stop at 1 px for the hairline core seen over
the dark field. The far solve gives L 1.35 — additive beyond any wash —
so 0.22 is a split: +0.03 of the +0.057 over the ground, +0.13 of the
+0.10 over the dark field. The intensity factors are the fitted affine
peaks normalised to 1 at the defaults.

**Dropped from the old class**: the light-keyed 8–16 px blur, the
`saturate(160%)`, the lit-edge specular gradient (`veil_lit` r² 0.15:
the interior excess is flat to 0.005) and the uniform 1 px white border.

**Gate**: 26 glass pairs, 0 failures, with three documented residual-only
classes in `compare.py` (edge bands on striped frames, band widths over
the dark field, stripe depth through an elevated pane — the GGX
transmission lobe's tails lift the stripe's centre in a way a Gaussian
`blur()` of the fitted core sigma cannot).

## Shadow and far-edge glow (2026-09-13)

User feedback on the first transcription: the glass shadow must be lighter
than an opaque plate's (light gets through), it reads as a HOLLOW outline
at elevation in the render, and the far edges carry a highlight where the
inner side of the wall catches the light. New sweep `glass_shadow` (clean
t1 pane, elevation 1/2/3 and thickness 2) and extractor `hollow_shadow`
(outward alpha beyond each far edge: `near_alpha`, `peak_alpha`,
`peak_d_mm`, `hm_mm`, `halo_alpha`).

What the render says (`shadow_ring` above): the interior of the shadow is
not empty but shallow — ~0.09–0.10 alpha at every elevation (the diffused
key minus the pane's transmission loss), where the opaque model fades from
0.32 to 0.16 — and a ring rides the projected silhouette, peaking at 0.21
at rest (t1 and t2 alike), 0.17 at e1/e2, 0.15 at e3, its centre at
5.16 px per level of elevation + 2.72 per level of thickness, blurring
wider as the pane lifts, with a long soft skirt beyond it.

**Transcribed** (three pieces, all in `.amb-mat-glass` / `::after`):

- `.ambient`'s four filled layers gained a multiplier `--_amb-sh-gain`
  (default 1, so every opaque frame is unchanged); glass sets
  `0.12 + 0.12 * elevation`, which puts the interior at the measured
  ~0.09–0.10.
- The ring is `.amb-mat-glass::after`: a blurred hollow frame the pane's
  size, `border-width 4px * thickness`, plateau alpha
  `(0.2 + 0.04 * elevation) * body`, `filter: blur(0.9 + 1.7 * elevation +
  0.5 * (thickness - 1)+ px)`, translated by `5.16 * elevation + 5.12 *
  thickness` px along the shadow direction (the fitted centre plus half
  the border, plus 0.5 px so the blur's inner tail stays off the pane's
  far edge). Far sides full; lit and parallel sides at 0.25 × elevation+
  (under the pane, seen through it; at rest the fitted edge bands already
  are the walls' shadow). Its outer `box-shadow` (`0 0 (6 + 5 *
  elevation)px`, alpha `(0.12 + 0.12 * min(elevation, 2)) * elevation+`)
  paints only beyond the frame: the skirt.
- `--amb-elevation` is a registered NON-inheriting property, so nothing
  in `::after` may read it directly (it reads 0 there — the first build
  did, and the ring's blur and skirt silently evaluated at rest). Every
  elevation term is computed on the host as a `--_glass-*` var.
- Far-edge glow raised from 0.22 to 0.45 white with a peaked core (0.6a
  at 0, a at 0.75 px, 0.55a at 1.75 px, 0 at 3.5 px × thickness): the far
  edge now reads brighter than the bare ground beside it, as the render's
  does (+0.06 over the pane's interior; over the dark field it overshoots
  ~3×, gated as a residual). Its fill dependence was cut to -0.1 If: the
  pane brightens with fill and a wash saturates, so the fitted -0.57 slope
  double-counted.
- The veil gains `0.008 * elevation`: the render's interior brightens
  ~1–2 points from rest to e3.

Chrome floors fractional border widths (3.8px painted as 3px at DPR 4),
hence the whole-pixel 4px ring.

**Gate**: 204 frame pairs, 0 failures (glass: 30 pairs).
