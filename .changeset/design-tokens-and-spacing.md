---
"@ambientcss/components": minor
---

A coherent design-token system for sizing, border radius, and hardware-style
spacing, so components compose into a device face the way real hardware
(Braun/Dieter Rams, Teenage Engineering) does — one modular pitch instead of
ad hoc per-component numbers:

- **Border-radius scale** — `--ambx-radius-sm/md/lg/xl/full`, deliberately
  identical in px to `@ambientcss/css`'s `.amb-rounded-*` utilities. The
  button's cap/well nesting is now an explicit concentric formula (outer
  radius = inner radius + clearance) instead of an unrelated magic number.
- **Size variants** — `size?: "sm" | "md" | "lg"` added to `AmbientButton`,
  `AmbientKnob`, `AmbientSlider`, and `AmbientFader`, matching
  `AmbientSwitch`'s existing pattern. `"md"` reproduces each component's
  original footprint exactly, so this is additive and non-breaking.
- **Spacing scale** — `--ambx-gap-tight/normal/loose` gap tiers, a new
  `.ambx-rack` utility / `AmbientRack` component for composing controls into
  a device face, and an opt-in `.ambx-panel-device` modifier so a panel's
  edge margin matches the loose gap used between the racks inside it.
- Fixed two latent cascade bugs in `styles.css` where a later rule silently
  overrode an earlier one: the button pill actually rendered at 72px (not
  the documented 64px), and the fader/slider track at 8px (not 4-6px). The
  previously-winning values are now the documented, single source of truth.

See the new [Design tokens](https://kikkupico.github.io/ambientcss/ambient-components/design-tokens)
docs page for the full scale, size table, and spacing guidance.

The Blender referent kit (`ambient3d/`, not published) mirrors the same
gap tiers (`GAP_TIGHT_MM`/`GAP_NORMAL_MM`/`GAP_LOOSE_MM` in
`components/_common.py`) so the demo device-panel render composes its
grille, knob bank, and key rows with the same hardware pitch as the
CSS/React layer.
