# groove — grounded fit

Model: `floor L% = gk * Ik + gf * If + g0; recess = 4.5mm * thickness; wall shadow: reach = Ws * recess per light component, css_blur = Bs * recess, alpha = sa * (Ik - If) + sa0; far-wall bounce (white overlay): reach = Wb * recess + Wb0, css_blur = Bb * recess, alpha = ba * Ik + bf * If + b0, clamped to [0, 1]`

- **gk_pct**: `30.15`
- **gf_pct**: `23.15`
- **g0_pct**: `47.57`
- **r2_floor**: `0.9884`
- **Ws_reach_per_mm**: `0.7969`
- **Bs_css_blur_per_mm**: `0.5924`
- **sa_alpha_per_contrast**: `0.238`
- **sa0_alpha**: `0.308`
- **r2_shadow_alpha**: `0.9528`
- **Wb_reach_per_mm**: `0.7146`
- **Wb0_reach_mm**: `-0.682`
- **Bb_css_blur_per_mm**: `1.1239`
- **ba_alpha_per_key**: `2.019`
- **bf_alpha_per_fill**: `0.795`
- **b0_alpha**: `-1.44`
- **r2_bounce_alpha**: `0.8549`
- **n_floor**: `15`
- **n_shadow_bands**: `26`
- **n_bounce_bands**: `24`
