# shadow — grounded fit

Model: `far: h = 8*elevation + 4.5*thickness, offset = A*h, blur = B*h, spread = C, alpha = D*(Ik-If) + De*elevation + Dt*thickness + D0; mid (thickness-gated): hm = 8*elevation + 2.25*thickness, offset = A*hm, blur = B*hm, alpha = E*(Ik-If) + F*thickness + G; layers composite multiplicatively`

- **A_offset_px_per_mm**: `0.8526`
- **B_css_blur_px_per_mm**: `0.5981`
- **C_spread_px**: `0.822`
- **D_alpha_per_contrast**: `0.13`
- **De_alpha_per_level**: `-0.0772`
- **Dt_alpha_per_level**: `-0.0333`
- **D0_alpha**: `0.368`
- **E_mid_alpha_per_contrast**: `0.002`
- **F_mid_alpha_per_thickness**: `0.0364`
- **G_mid_alpha**: `0.012`
- **r2_reach**: `0.985`
- **r2_alpha_far**: `0.6737`
- **r2_alpha_mid**: `0.107`
- **n_edges**: `70`
- **n_balanced_frames**: `9`
