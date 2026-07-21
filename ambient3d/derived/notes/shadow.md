# shadow — grounded fit

Model: `4-layer sweep. far: h = 8*elevation + 4.5*thickness, offset = A*h, blur = B*h, spread = C, alpha = D*(Ik-If) + De*elevation + Dt*thickness + D0; three body layers (thickness-gated) at 1/4, 1/2, 3/4 of body height, same A/B scaling, shared alpha = E*(Ik-If) + F*thickness + G; layers composite multiplicatively (the stack IS the outward fade)`

- **A_offset_px_per_mm**: `0.8526`
- **B_css_blur_px_per_mm**: `0.5981`
- **C_spread_px**: `0.822`
- **D_alpha_per_contrast**: `0.13`
- **De_alpha_per_level**: `-0.0782`
- **Dt_alpha_per_level**: `-0.0326`
- **D0_alpha**: `0.37`
- **E_mid_alpha_per_contrast**: `0.0`
- **F_mid_alpha_per_thickness**: `0.0121`
- **G_mid_alpha**: `0.001`
- **r2_reach**: `0.985`
- **r2_alpha_far**: `0.6817`
- **r2_alpha_mid**: `0.1372`
- **n_edges**: `70`
- **n_balanced_frames**: `9`
