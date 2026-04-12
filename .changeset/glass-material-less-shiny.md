---
"@ambientcss/css": patch
---

Fix `amb-mat-glass` material to look like frosted glass instead of polished metal.

The glass material was reusing the same sharp specular highlight and cylindrical dome environment reflection as the shiny/metal material, making it appear reflective and metallic. It now uses a wide, faint diffuse brightening gradient (max alpha 0.12 vs 1.0, spanning 75% of the surface) that softly brightens the light-facing edge — consistent with how frosted glass scatters light. The metallic overlay blend layer and brightness/contrast filter have been removed. Roughness is raised to 0.9 and specular lowered to 0.05.
