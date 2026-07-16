#!/usr/bin/env python3
"""Chroma-key + resize + WebP pack for title/lobby shell Higgsfield assets."""

from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "design/concept/approved/shell"
OUT = ROOT / "client/src/assets/higgsfield/shell"

JOBS: list[tuple[str, str, bool, int, int]] = [
    ("bg_title_hero.png", "bg-title-hero", False, 1280, 78),
    ("bg_lobby_harbour.png", "bg-lobby-harbour", False, 1280, 78),
    ("mark_treasure_trap.png", "mark-treasure-trap", True, 768, 88),
    ("sheet_title_cta.png", "sheet-title-cta", True, 1280, 85),
    ("sheet_title_decor.png", "sheet-title-decor", True, 1280, 85),
    ("sheet_title_fleet.png", "sheet-title-fleet", True, 1280, 85),
    ("sheet_lobby_panels.png", "sheet-lobby-panels", True, 1280, 85),
    ("sheet_set_sail_cta.png", "sheet-set-sail-cta", True, 1280, 85),
    ("sheet_crew_slots.png", "sheet-crew-slots", True, 1280, 85),
    ("sheet_lobby_icons.png", "sheet-lobby-icons", True, 1280, 88),
    ("sheet_avatar_rings.png", "sheet-avatar-rings", True, 1024, 88),
    ("anim_title_mascot.png", "anim-title-mascot", True, 1280, 85),
    ("anim_title_chest.png", "anim-title-chest", True, 1280, 85),
    ("deco_sail_banner.png", "deco-sail-banner", True, 1024, 88),
]


def chroma(src: Path, dst: Path, tolerance: float = 70.0) -> None:
    sys.path.insert(0, str(ROOT / "scripts"))
    from chroma_key import key_out  # type: ignore

    key_out(str(src), str(dst), tolerance=tolerance)


def resize_max(img: Image.Image, max_edge: int) -> Image.Image:
    w, h = img.size
    edge = max(w, h)
    if edge <= max_edge:
        return img
    scale = max_edge / edge
    return img.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.Resampling.LANCZOS)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, stem, do_chroma, max_edge, quality in JOBS:
        src = SRC / name
        if not src.exists():
            print(f"SKIP {src}")
            continue
        work = OUT / f"{stem}-work.png"
        if do_chroma:
            chroma(src, work)
        else:
            shutil.copy2(src, work)
        img = Image.open(work).convert("RGBA")
        if stem.startswith("bg-"):
            img = img.resize((1280, 720), Image.Resampling.LANCZOS)
        else:
            img = resize_max(img, max_edge)
        png = OUT / f"{stem}.png"
        webp = OUT / f"{stem}.webp"
        img.save(png)
        subprocess.run(
            ["cwebp", "-q", str(quality), "-alpha_q", "90", str(png), "-o", str(webp)],
            check=True,
            capture_output=True,
        )
        png.unlink(missing_ok=True)
        work.unlink(missing_ok=True)
        print(f"OK {webp.name} ({webp.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
