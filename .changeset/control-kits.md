---
"@ambientcss/components": minor
---

Kits: one mechanism, many visual identities

v3 split every control into a mechanism and a skin, then shipped exactly one
skin. Composing a different one worked, but there was no way to say "dress
this whole panel in that other look" — every call site had to pass its own
`parts`.

A **kit** closes that. It is a named bundle of parts, tokens and presentation
defaults, and it is a plain object, so publishing one is publishing a module:
no registry, no lifecycle, nothing to initialise.

```tsx
<AmbientKitProvider kit={consoleKit}>
  <AmbientKnob label="LEVEL" defaultValue={68} />
  <AmbientSwitch label="ON" defaultValue />
</AmbientKitProvider>
```

The call sites do not change. Only the look does.

**`consoleKit`** is the first non-default kit — a mixer-desk identity built
from two controls measured off photographs of the real hardware. Its knob is a
cuboid bar standing on a flat face housed in a circular groove — the same
construction, depth and near-black floor the button's well uses. The bar is
the pointer, and a short mark printed across one end of it says which end
reads. Its toggle is a pill track that
fills with the accent as the switch travels, carrying a round accent thumb
inside a white ring. `ConsoleKnob` and
`ConsoleToggle` are presets that type the kit's own look vocabulary.

**`groundedKit`** is the existing look, packaged as a kit rather than
hardwired into the presets. That was the integrity test for the whole idea: if
the built-in parts had needed a private back door the presets could reach and a
third party could not, the abstraction would have been a fiction. They did not
— every preset now resolves its dressing through the same `useDress` call a
published kit goes through.

Notable properties of the design:

- **A kit may be partial.** `consoleKit` dresses knobs and switches and lets
  faders, buttons and key banks fall through to `groundedKit`, which is what a
  real third-party kit looks like.
- **A kit is paint, not behaviour.** Neither new control needed a line of
  mechanism code: the toggle's thumb travels because the latch already moves
  its actuator frame by `--ambx-percent`, and its track lights because a
  stylesheet can read that same number. That was the real test of the v3
  split.
- **Look props are kit vocabulary.** `knurling` and `markers` are the grounded
  kit's words. They pass through and a kit reads what it understands, exactly
  as a stylesheet that never implemented a class does not react to it. The
  common path stays typed, and a `looks` declaration makes the drop visible: a
  development warning names the prop the active kit is going to ignore.
- **Precedence is caller → kit → mechanism.** A kit that falls through for a
  family has no say in that family's defaults either.

Also in this release:

- `--ambx-accent` is the panel accent a kit paints its lit states with,
  defaulting to the scene's own `--amb-highlight-color` so a kit inherits the
  app's colour rather than imposing one.
- The latch's thumb geometry moved into `--ambx-latch-thumb-w/-h` and
  `--ambx-latch-inset`, so a kit that wants a round thumb on a wider track
  restates three lengths instead of re-writing a selector.

**Renamed:** the press control's size classes are now `.ambx-press`,
`.ambx-press-sm/-md/-lg`, matching the family name the rest of the split uses
(`.ambx-button*` was left over from when the mechanism was called a button).
Nothing that renders `AmbientButton` is affected — the class comes off
`sizeProps` — but markup that hand-rolls the well/cap structure has to be
updated, because that class is what carries `--ambx-button-size` and the cap
padding. Without it the cap collapses to the width of its own text.
