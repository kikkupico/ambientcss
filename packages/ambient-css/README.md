# @ambientcss/css

Ambient lighting primitives and surface utility CSS.

Grounded on Blender renders: every coefficient in `ambient.css` is fitted
from measured Cycles renders of an equivalent physical scene (see the
`ambient3d/` kit in the repository and the *Grounded on Blender renders*
docs page). The public API — every class name and `--amb-*` custom
property — is frozen by `api-baseline.json` and checked in CI; grounding
changes values, never names. New in this line: `.amb-thickness-0/1/2`
give elements physical body height, feeding the drop shadow and gating
edge treatments.

## Install

```bash
pnpm add @ambientcss/css
```

## Usage

```css
@import "@ambientcss/css/ambient.css";
```

Or in JS:

```ts
import "@ambientcss/css/ambient.css";
```

`@ambientcss/css` contains foundational ambient primitives (lighting variables, edges,
surfaces, light position helpers, and generic utilities). Component styling
for `AmbientButton`, `AmbientKnob`, `AmbientSlider`, `AmbientFader`, and
`AmbientSwitch` lives in `@ambientcss/components/styles.css`.
