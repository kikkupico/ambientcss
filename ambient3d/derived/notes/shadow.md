# shadow — grounded fit

Model: `h = 8*elevation + 4.5*thickness; offset_px = A * h per light component; css_blur = 2 * sigma = B * h; spread = C const; alpha = D * (Ik - If) + De * elevation + D0`

- **A_offset_px_per_mm**: `0.8632`
- **B_css_blur_px_per_mm**: `0.5995`
- **C_spread_px**: `0.839`
- **D_alpha_per_contrast**: `0.142`
- **De_alpha_per_level**: `-0.0674`
- **D0_alpha**: `0.334`
- **r2_reach**: `0.988`
- **r2_alpha**: `0.7361`
- **n_edges**: `70`
