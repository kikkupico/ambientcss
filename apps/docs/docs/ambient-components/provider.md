---
title: AmbientProvider
---

import { ProviderPreview } from "@site/src/components/ComponentPreviews";

`AmbientProvider` applies theme values by writing Ambient CSS variables to `document.documentElement`.

## Interactive preview

<ProviderPreview />

## Props

| Prop | Type | Notes |
| --- | --- | --- |
| `theme` | `AmbientTheme` | Optional global light/theme overrides. |
| `className` | `string` | Wrapper class. |
| `style` | `CSSProperties` | Wrapper inline style. |
| `children` | `ReactNode` | Wrapped app content. |

### AmbientTheme

| Field | Type |
| --- | --- |
| `lightX` | `number` |
| `lightY` | `number` |
| `keyLight` | `number` |
| `fillLight` | `number` |
| `lightHue` | `number` |
| `lightSaturation` | `number` |
| `highlightColor` | `string` |
| `lumeHue` | `number` |

## Example

```tsx
import { AmbientProvider } from "@ambientcss/components";

export function AppTheme({ children }: { children: React.ReactNode }) {
  return (
    <AmbientProvider
      theme={{
        lightX: -1,
        lightY: -1,
        keyLight: 0.9,
        fillLight: 0.72,
        lightHue: 220,
        lightSaturation: 14,
        highlightColor: "#7dd3fc",
        lumeHue: 190
      }}
    >
      {children}
    </AmbientProvider>
  );
}
```
