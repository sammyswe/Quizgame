#!/usr/bin/env python3
"""Chroma-key + resize + WebP pack for voyage Higgsfield assets."""

from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
APPROVED = ROOT / "design/concept/approved"
INBOX = ROOT / "design/concept/inbox"
OUT = ROOT / "client/src/assets/higgsfield/voyage"
RAW = OUT / "raw"

# (source, dest stem, chroma?, max_edge, quality)
JOBS: list[tuple[Path, str, bool, int, int]] = [
    (APPROVED / "bg_seven_seas.png", "bg-seven-seas", False, 1280, 78),
    (APPROVED / "bg_lobby_deck.png", "bg-lobby-deck", False, 1280, 78),
    (APPROVED / "bg_loot_map.png", "bg-loot-map", False, 1280, 78),
    (APPROVED / "sheet_answer_islands.png", "sheet-islands", True, 1536, 82),
    (APPROVED / "sheet_player_ships.png", "sheet-ships", True, 1536, 82),
    (APPROVED / "sheet_pirate_avatars.png", "sheet-avatars", True, 1536, 82),
    (APPROVED / "sheet_item_icons.png", "sheet-items", True, 1536, 85),
    (APPROVED / "sheet_item_world_fx.png", "sheet-fx", True, 1536, 85),
    (APPROVED / "sheet_chest_ceremony.png", "sheet-chest", True, 1536, 85),
    (APPROVED / "poseidon_key.png", "poseidon-key", True, 1024, 85),
    (APPROVED / "shark_key.png", "shark-key", True, 1024, 85),
    (APPROVED / "maroon_key.png", "maroon-key", True, 1024, 85),
    (INBOX / "anim_ship_idle_v1.png", "anim-ship-idle", True, 1536, 82),
    (INBOX / "anim_ship_sail_v1.png", "anim-ship-sail", True, 1536, 82),
    (INBOX / "anim_ship_cheer_v1.png", "anim-ship-cheer", True, 1536, 82),
    (INBOX / "anim_ship_wrong_v1.png", "anim-ship-wrong", True, 1536, 82),
    (INBOX / "anim_waves_v1.png", "anim-waves", True, 1280, 82),
    (INBOX / "anim_coins_v1.png", "anim-coins", True, 1280, 85),
    (INBOX / "anim_poseidon_rise_v1.png", "anim-poseidon-rise", True, 1536, 82),
    (INBOX / "anim_shark_attack_v1.png", "anim-shark-attack", True, 1536, 82),
    (INBOX / "anim_treasure_drain_v1.png", "anim-treasure-drain", True, 1280, 82),
    (INBOX / "anim_flag_flutter_v1.png", "anim-flag-flutter", True, 1280, 82),
    (INBOX / "ui_lock_button_v1.png", "ui-lock-button", True, 1280, 85),
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


def to_webp(png: Path, webp: Path, quality: int) -> None:
    subprocess.run(
        ["cwebp", "-q", str(quality), "-alpha_q", "90", str(png), "-o", str(webp)],
        check=True,
        capture_output=True,
    )


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    RAW.mkdir(parents=True, exist_ok=True)
    for src, stem, do_chroma, max_edge, quality in JOBS:
        if not src.exists():
            print(f"SKIP missing {src}")
            continue
        raw_copy = RAW / f"{stem}.png"
        shutil.copy2(src, raw_copy)
        work = OUT / f"{stem}-work.png"
        if do_chroma:
            chroma(src, work)
        else:
            shutil.copy2(src, work)
        img = Image.open(work).convert("RGBA")
        # backgrounds: force 16:9-ish max width
        if stem.startswith("bg-"):
            img = img.resize((1280, 720), Image.Resampling.LANCZOS)
        else:
            img = resize_max(img, max_edge)
        png_out = OUT / f"{stem}.png"
        img.save(png_out)
        webp_out = OUT / f"{stem}.webp"
        to_webp(png_out, webp_out, quality)
        png_out.unlink(missing_ok=True)
        work.unlink(missing_ok=True)
        print(f"OK {webp_out.name} ({webp_out.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
