#!/usr/bin/env python3
"""Slice 2x2 / 4x4 green-key sheets into individual cutout PNGs."""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]


def chroma(im: Image.Image, key=(0, 255, 0), tol=70) -> Image.Image:
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    kr, kg, kb = key
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            # also catch near-green
            if g > 180 and g > r + 40 and g > b + 40:
                px[x, y] = (0, 0, 0, 0)
            elif abs(r - kr) <= tol and abs(g - kg) <= tol and abs(b - kb) <= tol:
                px[x, y] = (0, 0, 0, 0)
    return im


def trim(im: Image.Image, pad=4) -> Image.Image:
    bbox = im.getbbox()
    if not bbox:
        return im
    l, t, r, b = bbox
    l = max(0, l - pad)
    t = max(0, t - pad)
    r = min(im.width, r + pad)
    b = min(im.height, b + pad)
    return im.crop((l, t, r, b))


def slice_grid(src: Path, rows: int, cols: int, out_dir: Path, prefix: str, names: list[str] | None = None):
    im = Image.open(src).convert("RGBA")
    im = chroma(im)
    cw, ch = im.width // cols, im.height // rows
    out_dir.mkdir(parents=True, exist_ok=True)
    i = 0
    for r in range(rows):
        for c in range(cols):
            cell = im.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch))
            cell = trim(cell)
            name = names[i] if names and i < len(names) else f"{prefix}-{i:02d}"
            dest = out_dir / f"{name}.png"
            cell.save(dest)
            print("wrote", dest)
            i += 1


def main():
    # Islands 2x2 packs → 16 islands
    packs = [
        ("raw/islands/pack-a.png", "isl", 0),
        ("raw/islands/pack-b.png", "isl", 4),
        ("raw/islands/pack-c.png", "isl", 8),
        ("raw/islands/pack-d.png", "isl", 12),
    ]
    out_islands = ROOT / "assets" / "islands-pack"
    for rel, prefix, start in packs:
        src = ROOT / rel
        if not src.exists():
            print("skip missing", src)
            continue
        names = [f"isl-{start + i:02d}" for i in range(4)]
        slice_grid(src, 2, 2, out_islands, prefix, names)

    # Ships 4x4 → 16 dirs
    dirs16 = [
        "e", "ese", "se", "sse",
        "s", "ssw", "sw", "wsw",
        "w", "wnw", "nw", "nnw",
        "n", "nne", "ne", "ene",
    ]
    # Note: generation order may be row-major starting at E going clockwise or arbitrary.
    # We map row-major index 0..15 to dirs16; runtime can remap if needed.
    for seat in range(4):
        src = ROOT / f"raw/ships/ship-{seat}-16.png"
        if not src.exists():
            print("skip missing", src)
            continue
        out = ROOT / "assets" / f"ship-{seat}-dirs"
        out.mkdir(parents=True, exist_ok=True)
        slice_grid(src, 4, 4, out, f"ship-{seat}", [f"ship-{seat}-{d}" for d in dirs16])
        # also copy into flat assets for easy load
        for d in dirs16:
            srcp = out / f"ship-{seat}-{d}.png"
            if srcp.exists():
                dest = ROOT / "assets" / f"ship-{seat}-{d}.png"
                Image.open(srcp).save(dest)

    # Scenes: convert png → jpg into assets/scenes
    scenes_out = ROOT / "assets" / "scenes"
    scenes_out.mkdir(parents=True, exist_ok=True)
    for i in range(10):
        src = ROOT / f"raw/scenes/scene-{i:02d}.png"
        if not src.exists():
            print("skip missing", src)
            continue
        im = Image.open(src).convert("RGB")
        dest = scenes_out / f"scene-{i:02d}.jpg"
        im.save(dest, quality=88, optimize=True)
        print("wrote", dest)
    for name in ("below-deck", "loot-voyage"):
        src = ROOT / f"raw/scenes/{name}.png"
        if not src.exists():
            continue
        im = Image.open(src).convert("RGB")
        dest = scenes_out / f"{name}.jpg"
        im.save(dest, quality=88, optimize=True)
        print("wrote", dest)


if __name__ == "__main__":
    main()
