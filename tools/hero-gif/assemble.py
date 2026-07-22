"""Assemble the README hero: a video, and a GIF cut out of it.

    node shot.mjs panel                                   # the CSS frame
    blender -b -P ../../ambient3d/hero_panel.py           # the Blender frames
    python3 assemble.py [--layout panel]

Writes `ambientcss.mp4` (the whole film, full resolution) and
`ambientcss.gif` (a short window cut from that same footage, scaled down for
the README). The GIF is a cut rather than a second render, so the two can
never drift apart — and the expensive stretch, the camera move where every
pixel changes, stays in the video where h264 handles it instead of bloating
a GIF.

Beats, in seconds so the frame rates can change without reshaping the film:

  A  the 3/4 view drifting                    (Blender frames 0..)
  B  the camera tilting down to flat          (..Blender frames)
  C  a beat on the flat frame
  D  a left-to-right wipe to the CSS frame, holding at the halfway line
  E  a hold on CSS — the destination, and the loop's rest point
  R  the whole thing in reverse, decimated, to close the loop

The wipe is deliberate rather than a crossfade: the CSS is an approximation
of the raytrace, so a dissolve would read as a shimmer, while a hard seam
sweeping across an otherwise identical frame lets you see how close the
approximation gets — including where it does not.

The GIF window runs from shortly before the camera settles, through the wipe
and the hold, to the point on the return leg showing that same frame again —
so the excerpt opens and closes on one image and loops without a seam.
"""

import argparse
import os
import shutil
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))

VIDEO_FPS = 24
GIF_FPS = 12
GIF_W = 560           # GIF width; height follows the frame's aspect
GIF_LEAD = 0.7        # seconds of camera move kept in front of the wipe
PALETTE = 80
# Dithering fights GIF's frame-to-frame delta compression: a stipple that
# shifts every frame makes a static background look like it changed. These
# frames are smooth studio gradients, so a coarse Bayer pattern (stable
# between frames, unlike error diffusion) keeps banding away at a fraction
# of the size.
DITHER = "bayer:bayer_scale=5"

BEAT_C = 0.4          # seconds held on the flat render before the wipe
WIPE = 1.2            # seconds of sweep
WIPE_HOLD = 0.5       # seconds parked at the halfway line
BEAT_E = 2.0          # seconds held on CSS
RETURN_STRIDE = 3     # every Nth frame on the way back

BLENDER_LABEL = "BLENDER  ·  CYCLES RAYTRACE"
CSS_LABEL = "CSS  ·  BOX-SHADOW"

FONTS = ("/System/Library/Fonts/Supplemental/Arial Bold.ttf",
         "/System/Library/Fonts/Helvetica.ttc",
         "/System/Library/Fonts/Supplemental/Arial.ttf")


def font(size):
    for path in FONTS:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def label(img, text, side, opacity=1.0):
    """A small caption in a bottom corner. Drawn here rather than in either
    renderer so the wording can change without re-rendering."""
    if opacity <= 0.01:
        return img
    w, h = img.size
    f = font(max(11, round(h * 0.030)))
    pad = round(h * 0.018)
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    tw = d.textlength(text, font=f)
    th = f.size
    x = pad * 2 if side == "left" else w - pad * 2 - tw
    y = h - pad * 2 - th
    a = round(255 * opacity)
    d.text((x, y), text, font=f, fill=(38, 38, 38, a))
    d.line([(x, y + th * 1.5), (x + tw, y + th * 1.5)],
           fill=(38, 38, 38, round(a * 0.35)), width=max(1, round(h * 0.002)))
    return Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB")


def wipe(blender, css, frac):
    """`frac` of the width, from the left, taken from the CSS frame. The seam
    gets a hairline so the eye can find it on an otherwise matching pair."""
    w, h = blender.size
    cut = round(w * frac)
    out = blender.copy()
    if cut > 0:
        out.paste(css.crop((0, 0, cut, h)), (0, 0))
    if 0 < cut < w:
        ImageDraw.Draw(out).line([(cut, 0), (cut, h)], fill=(120, 120, 120), width=2)
    return out


def build_forward(blender_frames, css, fps):
    """The forward run of the film."""
    def secs(s):
        return max(1, round(s * fps))

    seq = []
    # The wipe runs left to right, so CSS claims the left corner and Blender
    # keeps the right one for the whole film — neither caption ever moves.
    # A + B: the camera move. The label fades in over the first half-second.
    for i, img in enumerate(blender_frames):
        seq.append(label(img, BLENDER_LABEL, "right", min(1.0, i / (fps / 2))))

    flat = blender_frames[-1]
    # C: a beat on the flat frame, the pose the CSS shot shares
    seq += [label(flat, BLENDER_LABEL, "right")] * secs(BEAT_C)

    # D: the wipe, parked at the halfway line long enough to compare halves
    steps = secs(WIPE)
    for i in range(steps + 1):
        frac = i / steps
        img = wipe(flat, css, frac)
        img = label(img, BLENDER_LABEL, "right", 1.0 if frac < 0.98 else 0.0)
        img = label(img, CSS_LABEL, "left", 1.0 if frac > 0.02 else 0.0)
        seq.append(img)
        if abs(frac - 0.5) < 0.5 / steps:
            seq += [seq[-1]] * secs(WIPE_HOLD)

    # E: the destination
    seq += [label(css, CSS_LABEL, "left")] * secs(BEAT_E)
    return seq


def run(cmd):
    subprocess.run(cmd, check=True, capture_output=True)


def encode_video(stage, out, fps):
    run(["ffmpeg", "-y", "-framerate", str(fps),
         "-i", os.path.join(stage, "%04d.png"),
         "-c:v", "libx264", "-preset", "slow", "-crf", "18",
         "-pix_fmt", "yuv420p", out])


def cut_gif(src, out, stage, start, length, args):
    """A window of the encoded video, quantized to a GIF. Two passes over the
    same window so the palette is built from the frames that actually ship."""
    chain = f"fps={args.gif_fps},scale={args.gif_width}:-1:flags=lanczos"
    window = ["-ss", f"{start:.4f}", "-t", f"{length:.4f}"]
    pal = os.path.join(stage, "palette.png")
    run(["ffmpeg", "-y", *window, "-i", src, "-vf",
         f"{chain},palettegen=max_colors={args.colors}:stats_mode=diff", pal])
    run(["ffmpeg", "-y", *window, "-i", src, "-i", pal, "-lavfi",
         f"{chain}[x];[x][1:v]paletteuse=dither={args.dither}:diff_mode=rectangle",
         "-loop", "0", out])


def main():
    p = argparse.ArgumentParser(prog="assemble.py")
    p.add_argument("--layout", default="panel")
    p.add_argument("--out", default=os.path.join(REPO, "ambientcss.gif"),
                   help="GIF path; the video is written alongside it as .mp4")
    p.add_argument("--fps", type=int, default=VIDEO_FPS)
    p.add_argument("--gif-fps", type=int, default=GIF_FPS)
    p.add_argument("--gif-width", type=int, default=GIF_W)
    p.add_argument("--colors", type=int, default=PALETTE)
    p.add_argument("--dither", default=DITHER)
    args = p.parse_args()

    bdir = os.path.join(HERE, "out", "blender", args.layout)
    names = sorted(f for f in os.listdir(bdir) if f.endswith(".png"))
    if len(names) < 2:
        sys.exit(f"{bdir} holds {len(names)} frames — render the camera move first")
    blender_frames = [Image.open(os.path.join(bdir, n)).convert("RGB") for n in names]
    css_path = os.path.join(HERE, "out", "css", f"{args.layout}.png")
    css = Image.open(css_path).convert("RGB")
    if css.size != blender_frames[0].size:
        sys.exit(f"size mismatch: css {css.size} vs blender {blender_frames[0].size}")

    forward = build_forward(blender_frames, css, args.fps)
    # the return leg replays the forward run, decimated: it costs no extra
    # renders and lands back on frame 0, so the film loops
    back = list(range(len(forward) - 2, 0, -RETURN_STRIDE))
    seq = forward + [forward[i] for i in back]

    # GIF window: open just before the camera settles, close on the return
    # leg at that same frame, so the excerpt loops on its own.
    #
    # Two constraints, both load-bearing. The return leg is decimated, so it
    # covers ground RETURN_STRIDE times faster than the forward leg: ending
    # merely *near* the opening frame leaves several frames of camera move
    # between the two ends, and the wrap jumps. So the window has to close on
    # the return frame that is literally the same image — which means opening
    # on a frame the return leg actually visits. And the GIF samples every
    # fps/gif_fps'th frame, so the window must span a whole number of those
    # steps or the last sample misses the frame that closes the loop.
    step = max(1, round(args.fps / args.gif_fps))
    want = max(0, len(blender_frames) - round(GIF_LEAD * args.fps))
    k = next(k for k, i in enumerate(back) if i <= want)
    while (len(forward) + k - back[k]) % step:
        k += 1
    gif_in = back[k]
    gif_out = len(forward) + k

    stage = os.path.join(HERE, "out", "frames")
    shutil.rmtree(stage, ignore_errors=True)
    os.makedirs(stage)
    for i, f in enumerate(seq):
        f.save(os.path.join(stage, f"{i:04d}.png"))

    gif = os.path.abspath(args.out)
    mp4 = gif[:-4] + ".mp4"
    encode_video(stage, mp4, args.fps)
    cut_gif(mp4, gif, stage, gif_in / args.fps,
            (gif_out - gif_in + 1) / args.fps, args)

    w, h = seq[0].size
    kb = lambda f: os.path.getsize(f) / 1024
    print(f"WROTE {mp4}  {len(seq)} frames  {w}x{h}  {args.fps} fps  "
          f"{len(seq) / args.fps:.1f}s  {kb(mp4):.0f} KB")
    print(f"WROTE {gif}  cut {gif_in / args.fps:.1f}s-{gif_out / args.fps:.1f}s  "
          f"{args.gif_width}px  {args.gif_fps} fps  "
          f"{(gif_out - gif_in) / args.fps:.1f}s loop  {kb(gif):.0f} KB")


main()
