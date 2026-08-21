---
title: AmbientSelect
---

import { SelectPreview, SelectMultiPreview, SelectSizesPreview } from "@site/src/components/ComponentPreviews";

`AmbientSelect` is a bank of lamp-lit keys in a shared rail — the hardware
idiom for a mode, bank or track selector, where the state is a lamp rather
than a tick or a fill. Selecting a key lights the LED under it, and the light
floods up through the key's translucent cap.

## Interactive preview

<SelectPreview />

## How it is built

Each key is three physical layers, and the order is the whole trick:

1. the option itself is the **pocket floor**, in the grounded `amb-surface` tone;
2. `amb-select-lens` is the **LED's lens** — a big disc lying on that floor;
3. `amb-select-cap` is a translucent **diffuser** sitting over both, carrying
   `amb-mat-glass`.

Because the cap is glass, its `backdrop-filter` blurs whatever is behind it —
which is the lens. That single fact produces both states with no second
gradient anywhere. Unlit, the lens body reads as a soft dark circle through
the frost, so you can see the lamp is there. Lit, the same disc blooms into a
broad radial glow with a hot centre, the way an LED actually behaves behind a
diffuser. The light that escapes around the key onto the rail uses the
grounded emissive bloom radius (6.2px, two sigma of the measured falloff —
the same figure `amb-glow` uses).

Pressing a key sinks it and only sinks it, exactly as
[AmbientButton](/ambient-components/button) does: the drop shadow shortens and
the chamfer bands narrow. Nothing repaints.

## Multi-select

Pass `multiple` to let several lamps be lit at once. The group's semantics
change with it — single select is a `radiogroup` of `radio`s where the arrow
keys move focus *and* selection; `multiple` is a `group` of `checkbox`es where
every key is tabbable and <kbd>Space</kbd> toggles the one you are on.

<SelectMultiPreview />

## Colour

The lamp colour is `--amb-led-color`, the same variable `amb-led` and
[AmbientSwitch](/ambient-components/switch)'s `led` prop use — so one
declaration lights every indicator on a panel. Set it per group with `color`,
or per key with an option's own `color`. Left unset it falls back to the
scene's `--amb-highlight-color` rather than to a hardcoded hue.

## Orientation and sizes

`orientation="vertical"` (the default) stacks the rail; `"horizontal"` lays it
out as a row, and the arrow keys follow. `size` scales the key and its legend.

Keys are square by default — a bank of glyphs stays a bank of glyphs — but a
longer legend is allowed to widen one: the size is a floor, not a fixed width.
In a vertical rail every key then stretches to the widest, so the bank stays a
bank. If you want uniform keys with long names, legend them with icons and put
the names in `ariaLabel`.

<SelectSizesPreview />

## Props

| Prop | Type | Default |
| --- | --- | --- |
| `options` | `AmbientSelectOption[]` | — |
| `value` | `string \| string[]` | uncontrolled |
| `defaultValue` | `string \| string[]` | — |
| `onChange` | `(value: string \| string[]) => void` | — |
| `multiple` | `boolean` | `false` |
| `orientation` | `"vertical" \| "horizontal"` | `"vertical"` |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` |
| `color` | `string` | `--amb-highlight-color` |
| `label` | `string` | — |

`AmbientSelectOption` is `{ value, label?, ariaLabel?, color?, disabled? }`.

`AmbientSelect` is a preset over `AmbientBank`, whose parts apply per key
rather than once. To change what a key looks like, pass `keyParts` — the
lens has to sit in `base` and the cap in `actuator`, because the cap's
`backdrop-filter` is what diffuses the lamp behind it. A key's parts can
read their own option with `useBankKey()` and their own lit state from
`--ambx-percent` or `useControlState()`. See
[Composing controls](./composing).
`label` takes any node and falls back to `value`; `ariaLabel` supplies the
accessible name and the hover title, and is needed whenever the legend is a
glyph or an icon, which has no name of its own.

Also inherits all `HTMLAttributes<HTMLDivElement>` props.

## Examples

### Controlled single select

```tsx
const [bank, setBank] = useState("3");

<AmbientSelect
  label="Bank"
  color="#00b4dc"
  options={[{ value: "1" }, { value: "2" }, { value: "3" }, { value: "4" }]}
  value={bank}
  onChange={(next) => setBank(next as string)}
/>
```

### Multi-select with a per-key colour

```tsx
<AmbientSelect
  multiple
  orientation="horizontal"
  options={[
    { value: "A" },
    { value: "B", color: "#f59e0b" },
    { value: "C" },
    { value: "D", disabled: true }
  ]}
  defaultValue={["A", "C"]}
/>
```
