/** The three grounded surface finishes from @ambientcss/css.
 *
 *  Lives on parts and presets, never on a mechanism: which element a
 *  material belongs on is a fact about a particular control's construction,
 *  and a mechanism cannot know that once the parts are yours. */
export type AmbientMaterial = "matte" | "shiny" | "glass";
