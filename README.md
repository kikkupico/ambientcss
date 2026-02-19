# Ambient CSS

**A physics-based lighting system for CSS.** Define a light source, and every shadow, highlight, and surface gradient follows from it — no more hand-tuned `shadow-sm` / `shadow-md` / `shadow-lg`.

[Live Demo](https://ambientcss.vercel.app/) &nbsp;&bull;&nbsp; [Documentation](https://kikkupico.github.io/ambientcss/) &nbsp;&bull;&nbsp; [npm](https://www.npmjs.com/package/@ambientcss/css)

---

## Why?

Traditional CSS shadow scales are decorative — a card with `shadow-lg` next to a button with `shadow-sm` doesn't imply a shared physical scene. They're just two unrelated blur values coexisting on the same page.

Ambient CSS starts from the other end. You describe a lighting environment — where the light is, how strong it is, how far each element sits from the background — and the shadows, highlights, and surface gradients follow from that. Change the light direction, and *every element updates consistently*.

## How it works

The model treats your UI as physical surfaces under a two-light system (key light + fill light). Every element reads from the same CSS custom properties and generates a five-layer `box-shadow`:

1. **Drop shadow** — offset by light direction, scaled by elevation
2. **Fillet highlight** — bright inner edge on the lit side
3. **Fillet shadow** — dark inner edge on the opposite side
4. **Chamfer highlight** — wider, softer inner glow for beveled edges
5. **Chamfer shadow** — dark bevel on the far side

Each element combines four concerns:

```
Structure ─── ambient               (enables the shadow system)
Surface ───── flat / concave / convex (background gradient)
Edge ──────── chamfer / fillet        (inner highlights)
Depth ──────── elevation 0–3          (drop shadow scale)
```

## Quick start

### Pure CSS

```bash
npm install @ambientcss/css
```

```html
<link rel="stylesheet" href="@ambientcss/css/ambient.css" />

<!-- Set up the light environment on any parent -->
<div class="amb-light-tl">
  <button class="ambient amb-surface amb-chamfer amb-elevation-1 amb-rounded">
    Click me
  </button>
</div>
```

### React components

```bash
npm install @ambientcss/components
```

```tsx
import { AmbientProvider, AmbientButton, AmbientKnob } from "@ambientcss/components";
import "@ambientcss/components/styles.css";

function App() {
  return (
    <AmbientProvider theme={{ lightX: -1, lightY: -1, keyLight: 0.9, fillLight: 0.6 }}>
      <AmbientButton>Press</AmbientButton>
      <AmbientKnob size={80} />
    </AmbientProvider>
  );
}
```

## Packages

| Package | Description |
|---|---|
| [`@ambientcss/css`](packages/ambient-css) | Pure CSS — no JS, no build step, works with any framework |
| [`@ambientcss/components`](packages/ambient-components) | React components: Button, Knob, Fader, Slider, Switch, Panel |

## CSS API at a glance

**Light direction** — set on any ancestor, inherited by all children:

`.amb-light-tl` `.amb-light-tr` `.amb-light-bl` `.amb-light-br` `.amb-light-top` `.amb-light-bottom` `.amb-light-left` `.amb-light-right`

**Or use custom properties for precise control:**

```css
.my-scene {
  --amb-light-x: -0.7;
  --amb-light-y: -0.8;
  --amb-key-light-intensity: 0.9;
  --amb-fill-light-intensity: 0.6;
}
```

**Surfaces:** `.amb-surface` `.amb-surface-darker` `.amb-surface-concave` `.amb-surface-convex`

**Edges:** `.amb-chamfer` `.amb-fillet` `.amb-chamfer-2` `.amb-fillet-2`

**Elevation:** `.amb-elevation-0` `.amb-elevation-1` `.amb-elevation-2` `.amb-elevation-3`

**Emissive:** `.amb-emit-red` `.amb-emit-green` `.amb-emit-blue` `.amb-emit-cyan` `.amb-emit-amber` `.amb-emit-white`

## Contributing

```bash
git clone https://github.com/kikkupico/ambientcss.git
cd ambientcss
pnpm install
pnpm build

# Run the demo app
pnpm --filter demo dev

# Run the docs site
pnpm docs:dev
```

## License

MIT
