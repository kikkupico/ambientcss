# Ambient CSS - Concept Document

## Core Philosophy

AmbientCSS applies cinematography and photography lighting principles to CSS. Instead of arbitrary shadows, elements respond to a unified light source with:

- **Key light**: Primary directional light (creates highlights and shadows)
- **Fill light**: Secondary ambient light (softens shadows)
- **Light position**: X/Y direction the light comes from
- **Elevation**: How "raised" an element is from the surface

---

## Current Features

- Light direction control (--amb-light-x, --amb-light-y)
- Key/Fill light intensity
- Elevation levels (0-3)
- Edge treatments: fillet (subtle edge highlights) and chamfer
- Day/night presets with smooth transitions

---

## Ideas to Explore

### 1. Additional Edge Treatments

- **Bevel**: More pronounced 3D edge effect
- **Inset/Pressed**: Elements that appear pressed into the surface
- **Rim light**: Backlight glow effect around edges

### 2. Material Types

Different materials reflect light differently:

- **Matte**: Current default, soft shadows
- **Glossy**: Sharper highlights, reflection spots
- **Metallic**: Anisotropic highlights, color-tinted reflections
- **Glass/Frosted**: Translucency with edge refraction
- **Fabric/Soft**: Very diffuse, almost no specular

### 3. Light Source Types

- **Directional**: Current implementation (sun-like)
- **Point light**: Light emanates from a specific point, shadows radiate outward
- **Ambient only**: Even lighting from all directions
- **Multiple lights**: Support for 2-3 light sources

### 4. Shadow Improvements

- **Soft shadows**: More realistic penumbra at distance
- **Contact shadows**: Darker shadows where elements touch surface
- **Colored shadows**: Shadows pick up color from the element or environment
- **Inner shadows**: For inset/concave elements

### 5. Interactive States

Pre-built lighting for common states:
- `:hover` - subtle lift effect
- `:active` / pressed - inset effect
- `:focus` - rim glow
- `:disabled` - flattened, less defined

### 6. Animation Utilities

- Light source movement (sunrise/sunset effects)
- Elevation transitions (lift on hover)
- "Breathing" ambient light
- Light flicker effects

### 7. Color Integration

- Automatic surface color detection for appropriate shadow colors
- Warm/cool light temperature presets
- Golden hour, blue hour, etc.

### 8. Component Presets

Ready-made lighting for common UI elements:
- Buttons (raised, flat, ghost)
- Cards
- Modals/dialogs
- Input fields
- Navigation bars
- Floating action buttons

### 9. Accessibility Considerations

- High contrast mode (stronger shadows)
- Reduced motion mode (no light animations)
- Ensure sufficient contrast ratios

### 10. Advanced Concepts

- **Occlusion**: Elements casting shadows on nearby elements
- **Reflection planes**: Subtle reflections below elevated elements
- **Depth of field**: Blur distant elevated elements slightly
- **Caustics**: Light patterns from transparent/refractive elements

---

## Technical Considerations

### CSS-only vs JavaScript-assisted

| Approach | Pros | Cons |
|----------|------|------|
| Pure CSS | No dependencies, works everywhere | Limited dynamic behavior |
| CSS + minimal JS | Best of both worlds | Small runtime cost |
| Full JS | Maximum flexibility | Heavier, framework concerns |

### Custom Properties Strategy

Current approach uses global CSS variables on `:root`. Consider:

- Scoped variables (per-element light overrides)
- Inheritance-based cascading
- Container queries for responsive lighting

### Performance

- Minimize repaints on variable changes
- Use `will-change` hints sparingly
- Test with many ambient elements on page

---

## Questions to Answer

1. Should elevation be continuous (0-1 float) or discrete levels?
2. How to handle overlapping elevated elements?
3. Support for non-rectangular shapes (SVG integration)?
4. Dark mode: invert light direction or adjust intensity?
5. How opinionated should component presets be?

---

## Inspiration

- Neumorphism (but more physically accurate)
- Material Design elevation system
- Photography 3-point lighting
- Video game deferred lighting
- Apple's layered UI design

---

## Next Steps

- [ ] Prototype inset/pressed state
- [ ] Experiment with material types
- [ ] Test multiple light sources
- [ ] Create button component preset
- [ ] Document CSS variable API
