---
title: Kits
---

import { KitComparisonPreview, ConsoleKitPreview, KitAccentPreview } from "@site/src/components/ComponentPreviews";

A **kit** is a named visual identity: a bundle of parts, tokens and
presentation defaults that dresses every control beneath it.

[Composing controls](./composing) covers dressing one control by hand. A kit
is the same thing applied to a whole panel — and it is how a look travels
between projects, because a kit is a plain object and publishing one is
publishing a module.

```tsx
import { AmbientKitProvider, AmbientKnob, AmbientSwitch, consoleKit } from "@ambientcss/components";

<AmbientKitProvider kit={consoleKit}>
  <AmbientKnob label="LEVEL" defaultValue={68} />
  <AmbientSwitch label="ON" defaultValue />
</AmbientKitProvider>
```

The call sites do not change. Only the look does — the two columns below
render the same `AmbientKnob` and `AmbientSwitch` with the same props off the
same state, and differ only in the kit above them.

<KitComparisonPreview />

Or build one without writing any of it: the [Kit Builder](/kit-builder) gives
each control a tab, the control itself a screen, and its parts a row of keys
beneath it — open a key and you are editing that part. What it hands back is
the module: a real `ControlKit`, its imports, and the scene it was drawn
under. It goes all the way down to the parts themselves: see [Composing a kit
without code](#composing-a-kit-without-code) below.

## What ships

- **`groundedKit`** — the Blender-grounded hardware look. The default, used
  whenever no kit is set.
- **`consoleKit`** — a mixer-desk identity: cuboid bar knobs seated in a
  circular groove, and pill toggles that light up with the panel accent.

## Writing one

The [Kit Builder](/kit-builder) will write this file for you; what follows is
what it writes.

```tsx
import type { ControlKit } from "@ambientcss/components";

export const neon: ControlKit = {
  name: "neon",
  rotary: (look) => ({
    className: "neon-knob",
    parts: { base: <span className="neon-body" />, actuator: <span className="neon-pointer" /> }
  }),
  looks: { rotary: [] }
};
```

Three things and no more:

| Field | What it does |
| --- | --- |
| `<family>` | `(look) => { parts, className }` for `rotary`, `travel`, `press`, `latch`, `bank` |
| `defaults` | presentation-only prop defaults — `travel`, `input`, `animate` |
| `looks` | which look keys each family honours, used to warn in development |

**A kit may be partial.** `consoleKit` dresses knobs and switches and lets
faders, buttons and key banks fall through to `groundedKit`. That is what a
real third-party kit looks like: it is not obliged to have an opinion about
everything.

**A kit is paint, not behaviour.** Everything a part needs is already
published on the control root — `--ambx-percent`, `--ambx-angle`,
`--ambx-size`, `data-dragging` — so most of a kit is a stylesheet and a
handful of `<span>`s. The console toggle's track is one element that mixes
its own colour from `--ambx-percent`; no React state reaches it and the
mechanism does not know it exists.

**`className` replaces, it does not join.** The root class is part of the
look: `.amb-knob` carries the grounded knob's own token table, and a kit
that replaces the parts has no use for it.

## Composing a kit without code

There is no shallower mode in the [Kit Builder](/kit-builder): what a tab
shows you is always the real thing — the control's four frames as a list of
elements, each one either a part this package exports or a **shape**, which is
a `<span>` with a generated rule behind it. Every part in the row of keys under
a control can be opened, including the two the library ships.

A shape is not a lesser way of writing a part; it is what a part is.
`ConsoleWell` is a groove ring with a flat disc in it. `ConsoleBar` is one
chamfered box that restates the light in its own turned coordinates. Both are
reachable from the form:

| Field | What it writes |
| --- | --- |
| Placement | `inset`, a centred `width`/`height`, an edge anchor — including *outside* the control's box, which is what a panel graphic needs — or **in flow**, the one a button's cap has to use |
| Structure | `.ambient` (a body that cuts edges and casts), `.amb-groove` (a recess), or neither. Never both: each paints the whole lighting model into `box-shadow` |
| Surface, edge, material | `amb-surface*`, `amb-chamfer`/`amb-fillet`, `amb-mat-*` |
| Thickness, elevation | `--amb-thickness`, `--amb-elevation`, as fractions — the console housing is 0.27 deep |
| Colour | an albedo the light then acts on, a flat paint, the scene's recess floor, the accent, **lit by value** (mixes the accent in from `--ambx-percent`, with no React anywhere near it), or ink |
| Keep the light still | emits the two-element light-capture trick the console bar uses |

**Start from** seeds the list rather than locking it: `grounded parts`,
`console parts`, or `console, in shapes` — the console knob and toggle rebuilt
entirely out of shapes, with the reference's own numbers, so you can take one
apart to see how it is made. A shipped look is a starting point in that
builder, never a wall.

Two things live beside the parts rather than in them, because they belong to
the control root: the **root class** — the library classes the kit keeps, which
carry the token table a part expects and the margin a scale ring overhangs into
— and the geometry a latch cannot express any other way, since a latch *is* its
own track. Both are fields you can see and edit, not something inferred from
what you picked.

A kit that uses shapes exports two files: the module, and the stylesheet it
imports. Every generated rule is two classes wide, so it wins on specificity
rather than on import order — which the app consuming the kit controls and the
kit does not.

## Look props are kit vocabulary

`AmbientKnob` takes `knurling`, `markers` and `indicator`. Those are the
*grounded* kit's words — the console knob has no knurl; it has a bar, a
housing and a centre mark.

Look props pass through, and a kit reads the ones it understands. This is
what a CSS theme already does: a stylesheet that never implemented a class
simply does not react to it. The common path stays fully typed, so a misspelt
`knurling` is still a compile error, and the `looks` field makes the drop
visible rather than silent:

> `[@ambientcss/components] the "console" kit's rotary does not use \`knurling\` — it is a look prop from another kit's vocabulary, so it will have no effect here.`

For another kit's vocabulary, pass `look`:

```tsx
<AmbientKnob label="LEVEL" look={{ mark: false, legend: false }} />
```

Or use the preset the kit ships, which types its own words:

```tsx
import { ConsoleKnob } from "@ambientcss/components";

<ConsoleKnob label="LEVEL" mark={false} legend={false} />
```

## Precedence

Caller prop → kit default → mechanism default. A kit that falls through for a
family has no say in that family's defaults either.

## The console kit

Both controls were measured off photographs of the real hardware.

<ConsoleKitPreview />

**The knob** is a cuboid bar standing on a flat face, housed in a circular
groove cut into the panel — the same construction the button uses, and the
same numbers: the housing takes the button's seat depth, its clearance gap
and its near-black floor. Inside that ring everything is the panel's own
surface colour: the face has no body at all, and the bar is that same
material again, so nothing there is told apart by tone. The dark ring, the
bar's chamfered edges and the shadow it drops on the face are the whole
drawing.

The bar *is* the pointer, and it runs the full width of the face, so a short
dark mark is printed across it near one end to say which end reads. The
accent centre mark and the −/+ legends sit outside the knob's own box, in the
`panel` frame.

The bar rides the rotating `actuator` frame, which is a problem worth
describing, because it is the kind a kit has to solve in CSS. A lit edge
painted from the inherited light would turn with the bar and end up on the
shadow side of the screen at half the angles. So the part rotates the *light*
the other way instead: an outer span captures the scene's light vector, and
the bar restates it in the frame's own turned coordinates —

```css
--amb-light-x: calc(
  var(--captured-x) * cos(var(--ambx-angle)) +
  var(--captured-y) * sin(var(--ambx-angle))
);
```

— which keeps the bright edge and the drop shadow where the room put them
while the bar sweeps under them. Two elements, because a custom property
cannot read itself. Nothing about it reaches the mechanism: `--ambx-angle` is
already published on the control root, so this is a stylesheet doing
trigonometry.

Look props: `mark` (the centre mark, default on) and `legend` (the −/+ marks,
default on). Its rotary defaults are `input="angle"` and a 280° sweep — the
desk pot it is drawn from grabs where you press rather than tracking a drag.

**The toggle** is a pill track that fills with the accent as the switch
travels, carrying a round accent thumb inside a white ring. Track 2.06:1, and
a thumb at 0.9 of the track height — a thumb that nearly fills its groove,
which is why the end clearance comes down to 0.05 with it. The thumb is
flat-topped but not weightless: `.ambient` with a knob-scale thickness and no
edge treatment at all, which is the combination that casts a drop shadow
while leaving the top face unbroken.

Set the accent with `--ambx-accent` on the control or any ancestor; it
defaults to the scene's own `--amb-highlight-color`, so a kit inherits the
app's colour rather than imposing one.

```tsx
<div style={{ "--ambx-accent": "#00a84d" }}>
  <ConsoleToggle label="ON" defaultValue />
</div>
```

<KitAccentPreview />
