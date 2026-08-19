/** The grounded surface finishes from @ambientcss/css.
 *
 *  Lives on parts and presets, never on a mechanism: which element a
 *  material belongs on is a fact about a particular control's construction,
 *  and a mechanism cannot know that once the parts are yours.
 *
 *  `brushed` and `rubber` are micro-relief materials: they paint their grain
 *  into BOTH of the host's pseudo-elements, so a part that already spends one
 *  of its own has to give them an inner layer rather than wear them directly.
 *  `ButtonCap` is the only part in this package that does. */
export type AmbientMaterial = "matte" | "shiny" | "glass" | "brushed" | "rubber";

/** Whether a finish carries micro-relief, and therefore needs both
 *  pseudo-elements of whatever it is put on. */
export function isRelief(material: AmbientMaterial | undefined): boolean {
  return material === "brushed" || material === "rubber";
}
