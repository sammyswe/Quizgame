#!/usr/bin/env python3
"""Chroma-key bright green/magenta backgrounds to RGBA PNG."""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image


def key_out(src: Path, dst: Path, key_rgb: tuple[int, int, int], tol: int = 55) -> None:
    im = Image.open(src).convert("RGBA")
    px = im.load()
    w, h = im.size
    kr, kg, kb = key_rgb
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if abs(r - kr) <= tol and abs(g - kg) <= tol and abs(b - kb) <= tol:
                px[x, y] = (0, 0, 0, 0)
            elif a > 0:
                # fringe soften near key
                dist = max(abs(r - kr), abs(g - kg), abs(b - kb))
                if dist < tol + 25:
                    fade = max(0, min(255, int(255 * (dist - tol) / 25)))
                    px[x, y] = (r, g, b, fade)
    im.save(dst)


def main() -> None:
    if len(sys.argv) < 3:
        print("usage: chroma_key.py <src> <dst> [green|magenta]")
        sys.exit(2)
    src, dst = Path(sys.argv[1]), Path(sys.argv[2])
    which = sys.argv[3] if len(sys.argv) > 3 else "green"
    key = (0, 255, 0) if which == "green" else (255, 0, 255)
    key_out(src, dst, key)
    print(f"wrote {dst}")


if __name__ == "__main__":
    main()
