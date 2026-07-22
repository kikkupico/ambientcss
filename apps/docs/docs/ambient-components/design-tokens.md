---
title: Design tokens
---

`@ambientcss/components` builds every control's sizing, radius, and spacing
from a small set of shared tokens (the `--ambx-*` layer in `styles.css`),
rather than each component picking its own numbers. This page is the
reference for that scale. It's separate from the physically-grounded
lighting/shadow API documented in [`@ambientcss/css` → Classes](/ambient-css/classes)
— that `--amb-*` vocabulary is frozen and grounded in measured renders;
these `--ambx-*` tokens are the layout layer built on top of it.

## Grid

Every value on this page is a multiple of one base unit:

```css
--ambx-grid: 4px;
--ambx-grid-half: calc(var(--ambx-grid) / 2);    /* 2px */
--ambx-grid-quarter: calc(var(--ambx-grid) / 4);  /* 1px */
```

## Border radius

| Token | Value |
| --- | --- |
| `--ambx-radius-sm` | 4px |
| `--ambx-radius-md` | 8px |
| `--ambx-radius-lg` | 12px |
| `--ambx-radius-xl` | 16px |
| `--ambx-radius-full` | 9999px |

These are deliberately identical in px to `@ambientcss/css`'s
`.amb-rounded` / `-md` / `-lg` / `-xl` / `-full` utilities (see
[Classes → Border Radius](/ambient-css/classes#border-radius)) — the two
layers sharing one scale is intentional cross-layer coherence, not a
coincidence. Radius does not vary with a component's `size` — only
footprint (min-width/height, padding, font) scales; solving the concentric
formula below at three different sizes would force off-scale radii, which
defeats the point of a canonical scale.

### Concentric shapes

When one rounded shape sits inside another (a button's cap inside its
clearance well), the outer radius is always the inner radius plus the
clearance between them — expressed as a formula, never as an unrelated
second number:

- **Pill button**: cap radius is `--ambx-radius-lg` (12px, on-scale); the
  well radius is `calc(var(--ambx-radius-lg) + var(--ambx-grid-half))`
  (14px — the well's own clearance padding added on top).
- **Square button**: well radius is `--ambx-radius-md` (8px, on-scale);
  the cap radius is `calc(var(--ambx-radius-md) - var(--ambx-grid-half))`
  (6px — the same clearance subtracted, solved the other way because here
  the well sits on the scale instead of the cap).

## Sizes

`size="sm" | "md" | "lg"` is available on `AmbientButton`, `AmbientKnob`,
`AmbientSlider`, `AmbientFader`, and `AmbientSwitch` (Switch had this first;
the others were added to match it). `"md"` reproduces each component's
original, unchanged footprint — adding `size` to existing code is
non-breaking.

| Component | sm | md (unchanged) | lg |
| --- | --- | --- | --- |
| Knob (diameter) | 48px | 64px | 80px |
| Slider (thumb / track) | 20px / 6px | 24px / 8px | 32px / 12px |
| Fader (thumb w×h / track) | 20×30px / 6px | 24×36px / 8px | 32×48px / 12px |
| Button, pill (min-width) | 64px | 72px | 80px |
| Button, round (min-width) | 40px | 48px | 56px |
| Button, square (min-width) | 48px | 56px | 64px |
| Switch (w×h) | 40×20px | 48×24px | 64×32px |

Track/thumb *length* for slider and fader (120px) is layout-driven, not
size-driven, and stays fixed across sizes.

`AmbientPanel` has no `size` prop — see [its own docs](/ambient-components/panel)
for why.

### Thickness and elevation don't scale with size

`--amb-thickness` and `--amb-elevation` (the physically-grounded shadow
depth, see [Classes → Elevation](/ambient-css/classes#elevation)) are
absolute physical measurements — a real 9mm-tall knob doesn't get taller
just because its diameter grows — so they're deliberately **not** scaled by
`size`. A `lg` control keeps the same absolute shadow depth as `md`/`sm`,
which reads as comparatively shallower on `lg` and deeper on `sm`. This
matches how the same physical part would actually look at a bigger or
smaller diameter — it's an intentional characteristic of the grounding, not
a bug.

## Spacing

Composing several controls into one device face borrows a hardware-panel
convention (Braun/Dieter Rams, Teenage Engineering): placement follows one
modular pitch. Tighter gaps read as "these controls belong to one
function"; looser gaps read as "these are separate zones"; the panel's own
edge margin is drawn from the same vocabulary so its border reads as one
more slot in the lattice, not an afterthought.

```css
--ambx-gap-tight: 12px;   /* one functional unit / a repeated row */
--ambx-gap-normal: 20px;  /* a few related-but-distinct controls */
--ambx-gap-loose: 32px;   /* separating zones, or the panel edge */
```

Each tier is roughly 1.6–1.7× the last, so they stay visually distinct at a
glance rather than blurring together.

| Component (md) | Tight | Normal | When to use tight vs. normal |
| --- | --- | --- | --- |
| Knob (64px) | 12px ≈ 0.19× | 20px ≈ 0.31× | Tight: a dense secondary knob bank. Normal: a primary/frequently-adjusted knob, or one next to unrelated controls. |
| Button (48–72px) | 12px | 20px | Tight: a repeated key/transport row. Normal: a single button among mixed controls. |
| Switch (48px) | 12px | 20px | Tight: a bank of switches. Normal: one switch with its own label, isolated. |
| Fader/Slider (track 8px, thumb 24px) | 12px | 20px | Tight: a mixer-style fader bank. Normal: a single fader isolated among other control types. |
| Panel edge margin | — | — | Always loose (32px) when the panel is a device face — see `ambx-panel-device` below. |

These are fixed absolute tokens, not size-aware — same philosophy as the
radius scale. When composing `lg`-sized controls, step up one tier from
what you'd use for `md` (use loose where normal would apply); step down one
tier for `sm`.

### Rack

`.ambx-rack` (and the `AmbientRack` convenience component) applies one of
these gap tiers as a flex container:

```tsx
import { AmbientRack, AmbientKnob, AmbientButton } from "@ambientcss/components";

function TransportRow() {
  return (
    <AmbientRack gap="tight">
      <AmbientButton shape="round">Rec</AmbientButton>
      <AmbientButton shape="round">Play</AmbientButton>
      <AmbientButton shape="round">Stop</AmbientButton>
    </AmbientRack>
  );
}
```

| Prop | Type | Default |
| --- | --- | --- |
| `gap` | `"tight" \| "normal" \| "loose"` | `"normal"` |
| `direction` | `"row" \| "column"` | `"row"` |

Also accepts standard `HTMLAttributes<HTMLDivElement>` props.

### Device-face panels

`AmbientPanel`'s default padding (16px) is unchanged — it's a general
container (cards, settings panels) used far beyond device mockups, so its
default shouldn't jump to the much larger loose-gap value. Add the
`ambx-panel-device` class when a panel *is* a device face composed of one
or more `AmbientRack`s, so its edge margin equals the loose gap used
between them:

```tsx
<AmbientPanel className="ambx-panel-device">
  <AmbientRack gap="loose">
    <AmbientRack gap="tight">{/* a knob bank */}</AmbientRack>
    <AmbientRack gap="tight">{/* a key row */}</AmbientRack>
  </AmbientRack>
</AmbientPanel>
```

## Mirrored in ambient3d

The same three gap constants are mirrored in
`ambient3d/components/_common.py` (`GAP_TIGHT_MM` / `GAP_NORMAL_MM` /
`GAP_LOOSE_MM`, plus a `row_layout`/`grouped_row_layout` helper), kept in
lockstep by design — the same convention `amb_model.py`'s lighting defaults
already use to mirror `ambient.css`'s `:root` block (see
[Grounded](/ambient-css/grounded)). `ambient3d`'s own demo device mockup
(`components/panel.py`) composes its grille, knob bank, fader/button/switch
row, and transport/number keys using these same tiers, so the Blender
referents demonstrate the same hardware-composition pitch as the CSS/React
layer, not just the same lighting.
