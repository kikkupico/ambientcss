# Refit: `amb-mat-brushed` / `-brushed-round` / `-blasted` against reference crops

**Status: DONE (2026-08-21).** Blender side, CSS side, notes and docs are
all landed. §5's blocker is fixed at the source; §6.1-6.5 are complete
except for one item called out under "Outcomes" below. Sections 1-7 are
kept as the reasoning record — read "Outcomes" first for what changed and
where the plan's own targets were rejected.

Started 2026-08-21 from three reference crops supplied by the user: brushed
aluminium sheet, spun/lathe-turned disc, bead-blasted sheet. Goal was "both
the Blender renders and the CSS look more realistic" against them.

---

## 1. The measurement that reframed the task

Everything below depends on splitting each image into a **low-frequency
sweep** and a **high-frequency grain**, because the three finishes turn out
to live in different halves of that split. Gaussian blur, then RMS L\* of
the blur (sweep) and of the residual (grain).

**σ must be a fixed fraction of crop width — 2% — not a fixed pixel count.**
The photos, the 512px renders and a browser element are three different
spatial scales; a shared σ=6 silently compares different cutoffs. Helper
kept at `scratchpad/meas.py`.

Measured over the plate crop `(130,130,390,390)` on 512px renders, and the
middle 70%×60% of each reference photo:

| | ref mean | ref **sweep** | ref **grain** |
|---|---|---|---|
| brushed | 66.4 | **16.2** | 2.5 |
| spun | 82.6 | **13.4** | 2.9 |
| blasted | 68.3 | 3.4 | **11.9** |

**Brushed and spun are almost entirely sweep.** Their grain (~2.5 L\*) was
already matched by the shipped dielectric renders (2.27/2.25). The prior
pass got their relief right; what is missing is the broad anisotropic
highlight, which is 6× larger than the grain and carries the whole look.

**Blasted is almost entirely grain**, and the shipped render had 1.27
against 11.9 — an order of magnitude short, on top of being 40 L\* too dark.

---

## 2. What was wrong, and what was NOT

### Blasted: a real grounding bug (fixed)

`--amb-albedo: 0.0594` was a fossil of this material's previous identity as
a bead-blasted **elastomer**, from before commit `fe347b8` renamed
`.amb-mat-rubber` → `.amb-mat-blasted`. The rename happened; the grounding
never followed. The reference is bead-blasted **aluminium**: light grey with
dense sparkle.

### Brushed/spun: NOT metallic, and that is now measured

`grain_material` built all three as dielectrics (Metallic 0, Specular IOR
Level 0.5 → ~4% reflectance), so `Anisotropic 0.75` was reshaping a lobe
carrying almost no energy. That looked like the root cause of everything.
**It is not.** Making brushed/spun conductors was tried and reverted:

| brushed | grain | mean L\* |
|---|---|---|
| dielectric (shipped) | 2.3 | 72.9 |
| Metallic 1 | **8–9** | **84+** |
| reference | 2.5 | 66.4 |

It is a regression, and it buys nothing for the sheen either (§3). There is
also a structural reason: the CSS model these renders ground is *diffuse
tone + relief + a separately-painted band*, and a conductor has no diffuse
lobe for `--amb-albedo` to correspond to.

### Blasted's metalness IS earned

Discriminating test, dielectric blasted at albedo 0.49, roughness 1.0,
sweeping `GRAIN_BUMP_DISTANCE_MM` upward against a grain target of 11.9:

| period / distance | grain | mean L\* |
|---|---|---|
| 2.5mm / 0.4 | 2.58 | 71.8 |
| 2.5mm / 1.0 | 4.10 | 66.1 |
| 2.5mm / 2.0 | 4.40 | 59.3 |
| 2.5mm / 4.0 | **4.48** | **52.8** |

It saturates at 4.5 and only gets there by darkening the plate 19 L\* below
target. Metallic at roughness 0.25 reaches 11.3 at the correct tone. The
glitter *is* the material and a diffuse lobe cannot produce it.

---

## 3. The rig cannot render brushed/spun's sweep — and this licenses the CSS fix

**24 renders across roughness × anisotropy × bump strength: max sweep 1.04
against a target of 16.2. With bump reduced, sweep goes to exactly 0.00** —
proving the bump was the *only* source of spatial variation.

The reason is geometric and unfixable without changing the camera: the
calibration camera is **orthographic** (`amb_params.py:426`), so every view
ray is parallel; reflected off a flat plate they all leave in one direction
and sample one point of the environment. Positional variation can only come
from perturbed normals. The references are perspective photos of a large
near source, which is exactly where their gradient comes from.

Do **not** change the camera — it would invalidate every other calibration
in the manifest.

**The consequence that matters:** the prior pass cut `--_sheen-alpha` 4–5×
(`calc(key*0.11+0.04)` → `calc(key*0.0207+0.0103)`) on the strength of a
sheen measurement taken from this rig. That cut is an artifact of measuring
a rig that is structurally blind to what it was measuring. At key 0.9 the
alpha is ~0.029 — effectively invisible. Restoring it is the single largest
realism win available for brushed and spun, and §3 is the evidence that
licenses grounding it on the reference crops instead.

---

## 4. Done already (durable on disk)

**`ambient3d/amb_params.py`**
- `BLAST_METALLIC = 1.0` (new), with the saturation evidence in its comment.
- `BLAST_ROUGHNESS` 1.0 → **0.25**. Low for something called "blasted"
  because the two scales are modelled separately: the bead craters are the
  height field, so what is left for the BSDF is the smooth metal *between*
  craters. Putting roughness in both places double-counts and flattens it.
- `is_metal` split into `is_anisotropic` (has a grain *direction*) — it was
  gating both metalness and roughness, which is what left blasted matte.
- Docstrings record the reverted-metallic experiment so it is not retried.

**`ambient3d/manifest.json`** — all 14 grain-entry albedos now `0.49`, one
aluminium reflectance shared by three finishes. brushed/spun unchanged;
blasted `0.0644` → `0.49`.

**Re-rendered at 512 samples**: `renders/calib/mat_{brushed,spun,blasted}_default.png`
and `renders/sweeps/blasted_angle/` (8 frames).

**Regenerated**: `derived/measurements.json`, `derived/coefficients.json`.

Result — blasted transformed, brushed/spun held steady:

| | mean (ref) | sweep (ref) | grain (ref) |
|---|---|---|---|
| brushed | 73.7 (66.4) | 0.61 (16.2) | 2.60 (2.5) |
| spun | 73.6 (82.6) | 0.60 (13.4) | 2.53 (2.9) |
| blasted | **71.2** (68.3) | 0.94 (3.4) | **11.71** (11.9) |

New fitted coefficients:

| | `albedo_linear` was | now |
|---|---|---|
| brushed | 0.4688 | **0.4819** |
| spun | 0.4664 | **0.4795** |
| blasted | **0.0594** | **0.4457** |

brushed/spun stay within 0.5% of each other, so the "one reflectance, two
finishes" claim survives; blasted now sits within 8% of them, which extends
it to three.

---

## 5. Blocker — do this first

**`measure/fit.py`'s `write_note` truncates and rewrites the whole note
file** (`fit.py:797`). Running the fit therefore deleted the hand-written
`## Transcribed into ambient.css` prose from all five grain notes:

| note | prose lines lost |
|---|---|
| `brushed.md` | 62 → 9 |
| `spun.md` | 30 → 9 |
| `blasted.md` | 26 → 9 |
| `brushed_sheen.md` | 54 → 13 |
| `spun_sheen.md` | 53 → 12 |

Intact backups: **`.plans/notes-prose-backup-2026-08-21/`**. These five notes
were *untracked* in git, so the wiped prose had no copy in history at all —
the backup directory is the only surviving source. It also holds `meas.py`
and `harness.html` from §6.4. Delete it once the prose is restored.

Restore the prose *below* the newly generated machine header, then append a
dated `## Correction (2026-08-21)` section per this repo's convention rather
than rewriting history. Note the backups' machine headers hold the **old**
numbers — take only the prose.

Worth fixing properly: make `write_note` preserve everything from the first
`## ` heading onward, so the next fit run cannot do this again.

---

## 6. Remaining work, in order

### 6.1 Restore the notes (above), then transcribe blasted to CSS

`packages/ambient-css/src/ambient.css`:

- **:916** comment and the `.amb-mat-blasted` block — `--amb-albedo`
  `0.0594` → **`0.4457`**.
- **:939** `--_grain-alpha: 0.137` → re-solve against the new target.
  Target is `mat_blasted_default`'s own `grain_texture.rms_lstar` = **11.7355**
  at this file's default light (key 0.9 / fill 0.7), matching the method the
  existing comment describes. 0.137 was fit against a render with 1.27, so
  expect a large increase.
- **:934–935** `--amb-mat-specular: 0; --amb-mat-roughness: 1;` — open
  question, flag rather than assume. The Blender material is now a metal at
  roughness 0.25, so "fully matte" is no longer literally true. But the
  reference's sweep is only 3.4, i.e. no distinct highlight band, so
  specular 0 is still defensible. Decide explicitly and write down why.

### 6.2 Raise `--_sheen-alpha` for brushed and spun

Both share one formula, at **:891** and **:1058**:
`calc(var(--amb-key-light-intensity) * 0.0207 + 0.0103)`.

Ground it on the **reference crops**, not the rig, and say so plainly in the
CSS comment and the notes — relief amplitude from the rig, sweep amplitude
from the crops, because §3 shows the rig cannot see the latter. Raise until
the CSS's own rendered sweep RMS hits **16.2** (brushed) / **13.4** (spun),
measured with the same 2%-of-width σ split.

Also update the reference-tone comments at **:799** and **:979**:
`0.468 0.468 0.468` → `0.481 0.481 0.481`. And **:1031**
`--_grain-alpha: 0.175` (spun) should be re-checked against spun's new
target, since its albedo moved.

### 6.3 Correct `spun_sheen.md`'s conclusion

It currently claims no directionality as "a checked conclusion, not a gap".
That conclusion came from the same rig blindness, and reference crop #2
plainly shows the converged hotspot and opposed lobes the CSS already
paints. **Keep the shipped conic shape**; downgrade the claim from
*disconfirmed* to *unmeasurable on this rig*.

### 6.4 Measurement harness

Chrome **refuses `file://`** URLs via the extension, which is where this
stalled. Serve the repo over HTTP (`python3 -m http.server` from the repo
root) and point the harness at `http://localhost:…`.

Harness already written: `scratchpad/harness.html`, which takes
`?mode=blasted|brushed|spun&a=0.1,0.2,…` and lays out one 160px panel per
candidate alpha with the new albedo pre-set. Screenshot and measure with
`scratchpad/meas.py`.

Screenshots are adequate here — the plan's "canvas readback, not
screenshots" warning was about statistics of 1–2 L\*; these amplitudes are
11.7 and 16.2.

**Scale caveat to carry into the notes:** the render is 4 px/mm on 2.5mm
dimples (~10px features); the CSS tile at `baseFrequency 0.9` / 96px has
~1px features. Matching per-pixel RMS across those means equal *contrast* at
different *spatial frequency*. That is the repo's existing convention and it
happens to suit the reference's fine sparkle — but it is an assumption, and
it should be stated rather than left implicit.

### 6.5 Downstream

- Regenerate the published docs images
  `apps/docs/static/img/renders/mat-{brushed,spun,blasted}.png` (via
  `measure/publish.py`).
- `derived/compare-report.json` is stale — it predates this session and was
  not regenerated; run `measure/compare.py`.
- Update the blasted paragraph in `apps/docs/docs/ambient-css/grounded.mdx:143–192`
  (it still describes blasted as having "no anisotropic term … fully matte").
- Check the demo faceplate at `apps/demo/src/App.tsx:986`
  (`.amb-mat-brushed`), which will visibly change once the sheen comes back.
- Verify in a real browser, not a background tab — per repo memory, hidden
  tabs freeze transitions and make working animated controls read as broken.

---

## 7. Things not to redo

- Do not make brushed/spun metallic. Measured, reverted, §2.
- Do not chase the sweep in Blender by tuning roughness/aniso/bump. 24
  renders, §3; it is the ortho camera, not the material.
- Do not change the calibration camera to perspective.
- Do not fit three separate albedos to the three photos. Spun's 82.6 vs
  brushed's 66.4 is 16 L\* apart for the same metal in the same finish
  class — that is exposure difference between stock photos, not material
  difference.
- Do not chase the reference's sub-pixel sparkle in Blender. The
  `GRAIN_ACROSS_MM` comment already documents that going below ~2.5mm
  collapses into Bump-derivative and pixel-AA crush. The render carries a
  resolvable dimple; the CSS tile carries the fine grain.

---

## Outcomes (2026-08-21) — read this before re-running anything above

### §5 blocker: fixed at the source

`measure/fit.py`'s `write_note` now preserves everything from the first
`## ` heading onward, so a fit run can no longer truncate hand-written
prose. Verified twice: the restored notes survive a re-run byte-identically.
All five notes are back to full length and carry new dated
`## Correction (2026-08-21)` sections. `.plans/notes-prose-backup-2026-08-21/`
has been deleted — but note what it also held: `meas.py` and `harness.html`
were in there too, and those are NOT prose. They now live durably as
`ambient3d/measure/panel_split.py` and `tools/css-harness/ladder.mjs`
(see below), which is where to look for them.

### §6.2's stopping rule had no solution, and that is the headline finding

The plan said "raise `--_sheen-alpha` until the CSS's own rendered sweep RMS
hits 16.2 (brushed) / 13.4 (spun)". **Measured: a fully opaque white band
(alpha 1.0) reaches 6.49.** The exposure-invariant sweep/grain *ratio* fails
the same way (4.4 against the crops' 6.5), which rules out §7's own
exposure-difference explanation and leaves non-commensurability: 16.2 is the
low-frequency RMS of a photograph of a large sheet, so most of that energy is
scene-scale illumination falloff that a 240px control has nothing to
reproduce. **The target was rejected, not missed. Do not re-run that fit.**

Grounded visually on the ladder instead — 0.0289 invisible, 0.139 barely
there, 0.30 reads as brushed metal — keeping the hand-authored original's
floor:slope proportion (0.04:0.11) rescaled so key 0.9 lands on 0.30:

`calc(key * 0.0207 + 0.0103)` -> `calc(key * 0.237 + 0.0863)`

That is ~10x the shipped value and shared by brushed and spun, as before.
Note the plan's §3 assumed restoring `0.11/0.04` would be the reference-
grounded answer; checking `247d4f9` shows that value was authored by analogy
to `.amb-mat-shiny`, never crop-fit. Neither old constant was grounded.

### §6.1 blasted: transcribed, and the grain target is NOT reached

`--amb-albedo` 0.0594 -> 0.4457 and the whole `.amb-mat-blasted` comment
block rewritten (it described a dark elastomer, which the rename made false).
`--amb-mat-specular: 0` / `--amb-mat-roughness: 1` KEPT, with the reason now
stated: the crop's sweep is 3.4 against a grain of 11.9, so there is no
highlight band to paint, and the metal's low roughness is crater glitter that
the grain tile carries instead.

`--_grain-alpha` 0.137 -> **0.85**, and it falls short of the 11.7355 target
on purpose. Alpha is one factor of an `opacity` product whose other factors
are all 1 here, so it **hard-rails at 1.0** where ~1.27 is needed; the
response is linear right to the rail (0.864 / 2.472 / 4.449 / 6.529 at 0.137
/ 0.4 / 0.7 / 1.0, flat above), so the rail is a ceiling and not a
saturation point. At the rail the panel reads as sensor static — §6.4's scale
caveat biting for real, ~1px CSS features against ~10px rendered craters.
0.85 gives x6.3 the old contrast (~68% of target) and reads as dense
sparkle. Next levers, both out of scope here: the tile's contrast stretch
(`feComponentTransfer` slope 2) and its feature size (`baseFrequency 0.9`).

### The plan missed that brushed's grain target moved too

§6.2 flagged only spun's `--_grain-alpha`. The shared-aluminium albedo
re-exposed all three, so both moved. Solved by **ratio, not re-search** —
linearity was verified first on the panel harness, which makes the answer
independent of the measurement's blur radius:

| | target was | now | alpha | verified |
|---|---|---|---|---|
| brushed | 2.2145 | 2.5334 | 0.45 -> **0.515** | x1.155 vs x1.144 |
| spun | 2.28 | 2.5677 | 0.175 -> **0.197** | x1.120 vs x1.126 |

Reference tones: brushed `0.468` -> `0.482`, spun -> `0.480`.

### §6.3, §6.4, §6.5

- `spun_sheen.md`'s "checked conclusion" is downgraded to **unmeasurable on
  this rig** — the orthographic argument applies to both finishes, so
  brushed's peak (via perturbed normals) was never a fair control. Conic
  shape kept.
- Harness: the Chrome extension was not connected at all this session, so
  the plan's "serve over HTTP and point the extension at it" route was
  dropped. The scratch `meas.py` / `harness.html` pair is now **durable and
  in the repo**, next to the CSS harness that already existed:
  - `tools/css-harness/ladder.mjs` — renders one panel per candidate value
    of a single custom property against the shipped `ambient.css`, via the
    Playwright already vendored there. `node ladder.mjs --mat brushed --var
    --_sheen-alpha --values 0,0.139,0.30`. No HTTP server, no extension.
  - `ambient3d/measure/panel_split.py` — the sweep/grain split, sigma fixed
    at 2% of crop width (unchanged from `meas.py`), plus `split_grid` for
    reading a whole ladder.

  Every number quoted in the notes and CSS comments this pass was
  re-measured through exactly this pair at the shipped values, so they
  reproduce rather than merely being asserted.
- Downstream all done: `publish.py` re-ran (13 images), `compare.py` re-ran
  (174 pairs, 0 failures), `grounded.mdx`'s metals section rewritten,
  `App.tsx:743`'s blasted pad retoned, demo builds clean.

### The one thing not verified

**The demo faceplate was not seen scrolled-into-view in a live browser.**
The Chrome extension is disconnected, and the demo is scroll-animation
driven so a headless screenshot only ever captures the sticky hero. The
material itself was verified directly against the shipped `ambient.css` in
headless Chrome, and the demo builds clean — but `.amb-mat-brushed`'s sheen
is ~10x its previous amplitude, so the faceplate at `App.tsx:986` should be
eyeballed in a real foreground tab (per repo memory: hidden tabs freeze
transitions and make working controls read as broken).

### Both open items closed, 2026-08-21 (later the same day)

**The faceplate was verified.** The Chrome extension came back, so
`App.tsx:987`'s `.cord-panel.amb-mat-brushed` was seen in a live foreground
tab at Retina. Scrolling never reveals it — it is the console slab behind
the theme keys, parked off the top of the viewport and pulled down by the
gear key, which is why every headless attempt only caught the sticky hero.
The ~10x sheen reads as a lit metal plate, not blown out.

**A hand-tune pass followed, by request**, and it is worth flagging here
because it changes something this plan asserted. The brushed tile was
retuned for longer, blurrier streaks (128px/36 cells -> 512px/8 cells,
across-grain 20 -> 0.9, alpha 0.515 -> 0.42 so contrast holds at 1.680 vs
1.695), and blasted's alpha 0.85 -> 0.666. Full record in the two notes and
the two CSS comment blocks.

The finding that matters beyond this pass: **the anisotropy this plan
treated as a matched target was never reaching the screen.** `brushed.md`
records row/col 7.60 against the render's 7.4963, but the shipped tile
measured on a real Chrome raster reads 1.55 at dpr 1. Its across-grain
frequency was 20 cycles per CSS pixel — forty times Nyquist — so the browser
rendered that grain's aliasing, which has no direction. §7's "don't redo"
list should gain an entry: a closed-loop CSS fit has to be measured in the
regime it ships in. The sharper rule, found when a first attempt at 2.9px
read as bands and the fix ran into a cliff at 1.0: the failure is INTEGER
CYCLES PER DEVICE PIXEL, not high frequency. There the noise lattice
coincides with the sampling grid and every sample lands on a lattice node,
where gradient noise is zero by construction. 0.9 renders cleanly and 1.0
does not, though 1.0 is barely finer. The shipped tile measures 12.15 at
dpr 1 — an overshoot of the fitted 7.4963, knowingly, because the look
asked for is finer than the fit.

New durable tooling, alongside `ladder.mjs` and `panel_split.py`:
`tools/css-harness/variants.mjs` (varies whole tiles rather than one custom
property), `ambient3d/measure/variant_grid.py` (adds the anisotropy ratio),
and `tools/css-harness/specs/` holding the ladders and the coupon-page
generator that produced every published figure.
