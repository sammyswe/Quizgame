#!/usr/bin/env python3
"""Remove the solid backgrounds from Higgsfield-generated sprite sheets.

Flood-fills from the image borders, clearing only pixels that are both
colour-close to the background AND connected to the border. Interior pixels
that happen to share the background colour (dark hulls, shadows) are kept.
A one-pixel soft edge is applied where cleared and kept pixels meet.

Writes <name>-cut.png next to each source file.
"""

import sys
from collections import deque

from PIL import Image


def key_out(src: str, dst: str, tolerance: float = 70.0) -> None:
    img = Image.open(src).convert("RGBA")
    px = img.load()
    w, h = img.size

    corners = [px[2, 2], px[w - 3, 2], px[2, h - 3], px[w - 3, h - 3]]
    br = sum(c[0] for c in corners) / 4
    bg = sum(c[1] for c in corners) / 4
    bb = sum(c[2] for c in corners) / 4

    def is_bg(x: int, y: int) -> bool:
        r, g, b, _ = px[x, y]
        return ((r - br) ** 2 + (g - bg) ** 2 + (b - bb) ** 2) ** 0.5 < tolerance

    cleared = bytearray(w * h)
    queue: deque[tuple[int, int]] = deque()
    for x in range(w):
        for y in (0, h - 1):
            if is_bg(x, y) and not cleared[y * w + x]:
                cleared[y * w + x] = 1
                queue.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if is_bg(x, y) and not cleared[y * w + x]:
                cleared[y * w + x] = 1
                queue.append((x, y))

    while queue:
        x, y = queue.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not cleared[ny * w + nx] and is_bg(nx, ny):
                cleared[ny * w + nx] = 1
                queue.append((nx, ny))

    for y in range(h):
        for x in range(w):
            if cleared[y * w + x]:
                r, g, b, _ = px[x, y]
                px[x, y] = (r, g, b, 0)

    # soft edge: kept pixels bordering cleared pixels get partial alpha
    for y in range(h):
        for x in range(w):
            if cleared[y * w + x]:
                continue
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if 0 <= nx < w and 0 <= ny < h and cleared[ny * w + nx]:
                    r, g, b, a = px[x, y]
                    px[x, y] = (r, g, b, min(a, 150))
                    break

    img.save(dst)
    print(f"{src} -> {dst}")


if __name__ == "__main__":
    for path in sys.argv[1:]:
        key_out(path, path.replace(".png", "-cut.png"))
