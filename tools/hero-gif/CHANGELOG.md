# @ambientcss/hero-gif

## 0.0.2

### Patch Changes

- 17548b6: Recompose the README hero panel as a real device face, laid out entirely on
  the spacing scale.

  The old panel was six controls at hand-picked coordinates on a 264×136 mm
  body — plenty to prove the Blender/CSS wipe registers, but it read as a
  sample sheet rather than a piece of hardware. The new layout is 13 controls
  on a 472×272 mm body, and every coordinate in `layouts/panel.json` is
  composed from the tight-12 / normal-20 / loose-32 mm tiers (the
  `@ambientcss/components` spacing tokens, mirrored in
  `ambient3d/components/_common.py` as `GAP_*_MM`) rather than chosen by eye:

  - a 128-wide display-and-mixer column — screen over a bank of three sliders
    stacked tight — and a 248-wide control column of three rows normal apart:
    three knobs tight, three square pads tight, then the switch normal from a
    tight bank of three round keys. Both columns come to 208 mm tall by
    construction; the two sit loose apart, and the body adds a loose edge
    margin all round, so its border is one more slot in the same lattice.
  - the pill button is dropped from the hero: its referent is 64 mm wide where
    the CSS pill's `min-width` is 72 px, and an unlabelled pill would show
    those 8 px as a registration error at the seam.
  - the arithmetic behind every number now lives in the layout file's own
    `layout.note`, so the panel can be recomposed without re-deriving it.

  Registration is unchanged in kind and better in degree — `align.py` reports
  IoU 0.867 and mean |diff| 0.049 between the two halves of the new frame.

- Updated dependencies [17548b6]
  - @ambientcss/components@2.1.0

## 0.0.1

### Patch Changes

- Updated dependencies [d3e9ee6]
  - @ambientcss/components@2.0.1
