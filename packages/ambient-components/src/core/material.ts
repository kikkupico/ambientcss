/** The grounded surface finishes from @ambientcss/css.
 *
 *  Lives on parts and presets, never on a mechanism: which element a
 *  material belongs on is a fact about a particular control's construction,
 *  and a mechanism cannot know that once the parts are yours.
 *
 *  `brushed`, `brushed-round` and `blasted` are micro-relief materials: they
 *  paint their grain into BOTH of the host's pseudo-elements, so a part that
 *  already spends one of its own has to give them an inner layer rather than
 *  wear them directly. `ButtonCap` is the only part in this package that does.
 *
 *  `brushed-round` is the same aluminium as `brushed` with the grain spun
 *  round the element's centre, so it belongs on round faces — a knob cap, a
 *  round button — where the centre it turns about is a real feature. */
export type AmbientMaterial =
  | "matte"
  | "shiny"
  | "glass"
  | "brushed"
  | "brushed-round"
  | "blasted";

/** Whether a finish carries micro-relief, and therefore needs both
 *  pseudo-elements of whatever it is put on. */
export function isRelief(material: AmbientMaterial | undefined): boolean {
  return material === "brushed" || material === "brushed-round" || material === "blasted";
}
