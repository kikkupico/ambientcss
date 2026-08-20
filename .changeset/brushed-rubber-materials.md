---
"@ambientcss/css": minor
---

New `.amb-mat-brushed` and `.amb-mat-blasted`: micro-relief materials

Two surface finishes that add texture rather than gloss, fitted against
photographed crops: brushed aluminium (pale, anisotropic, very low contrast)
and bead-blasted rubber (dark, isotropic, grain about 3x deeper). Both set
`--amb-mat-specular: 0` and `--amb-mat-roughness: 1`, and both compose with
`.amb-surface`, the edge treatments and the elevations like any other
material.

Nothing about the relief is ever transformed. The tile carries the raw height
field and a second tile carries its exact inverse; one is offset toward the
lamp and the other away from it, so the pair evaluates the slope of the
surface along the light. Only `background-position` moves, so every bump stays
on the same pixel and the shading crosses over it — where a lit relief rotated
to follow the lamp is a photograph of a relief, and visibly swims. Anisotropy
then falls out of the geometry: offsetting *along* a brushed grain samples two
points at the same height, the pair cancels, and the metal goes smooth.

Offsets snap to whole pixels with `round()`. A fractional `background-position`
resamples the tile and erases grain about a pixel across, which for grain this
fine is most of it; on rubber that is the difference between 0.44 and 0.99
consistency across lamp angles.

New `--amb-grain-amount` (default `1`) scales the relief and inherits, so a
panel can dial down everything inside it. A material's own directional term is
deliberately not this property: turning the grain down must not be able to
delete the brushed anisotropy.

Each material ships its own `--amb-albedo` — the reflectance it was calibrated
at. It stays overridable, but the grain's amplitude is fitted at that tone and
does not follow the tone law far from it, so refit if you retone a long way.

Two costs: the relief consumes both pseudo-elements, so an element that already
uses one of its own needs the grain on an inner layer (`@ambientcss/components`
paints its button-cap dish in `::after`, so a cap cannot take these directly);
and the host gets `overflow: hidden`, needed so the blend clips to a rounded
corner, which clips real children too.
