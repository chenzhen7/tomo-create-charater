#!/usr/bin/env python3
"""Render lightweight animated motion previews from extracted Codex pet frames."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image

import pet_geometry as geo

ROW_DURATIONS = {
    "idle": [280, 110, 110, 140, 140, 320],
    "running-right": [120, 120, 120, 120, 120, 120, 120, 220],
    "running-left": [120, 120, 120, 120, 120, 120, 120, 220],
    "waving": [140, 140, 140, 280],
    "jumping": [140, 140, 140, 140, 280],
    "failed": [140, 140, 140, 140, 140, 140, 140, 240],
    "waiting": [150, 150, 150, 150, 150, 260],
    "running": [120, 120, 120, 120, 120, 220],
    "review": [150, 150, 150, 150, 150, 280],
}
IMAGE_SUFFIXES = {".png", ".webp", ".jpg", ".jpeg"}


def frame_files(state_dir: Path) -> list[Path]:
    if not state_dir.is_dir():
        return []
    return sorted(path for path in state_dir.iterdir() if path.suffix.lower() in IMAGE_SUFFIXES)


def load_frames(frames_root: Path, state: str, expected_count: int) -> list[Image.Image]:
    files = frame_files(frames_root / state)
    if len(files) != expected_count:
        raise SystemExit(
            f"{state} preview needs {expected_count} frames, found {len(files)} under {frames_root / state}"
        )
    frames = []
    for path in files:
        with Image.open(path) as opened:
            frames.append(opened.convert("RGBA"))
    return frames


def save_preview(
    frames: list[Image.Image],
    durations: list[int],
    output: Path,
    preview_width: int,
    preview_height: int,
) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    # The atlas may be N×; previews are for watching the motion at the logical
    # 192×208 display size, not for inspecting source detail (the contact sheet does that).
    frames = [
        frame
        if frame.size == (preview_width, preview_height)
        else frame.resize((preview_width, preview_height), Image.Resampling.LANCZOS)
        for frame in frames
    ]
    frames[0].save(
        output,
        save_all=True,
        append_images=frames[1:],
        duration=durations,
        loop=0,
        disposal=2,
        optimize=False,
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--frames-root", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--preview-width", type=int, default=geo.BASE_CELL_WIDTH)
    parser.add_argument("--preview-height", type=int, default=geo.BASE_CELL_HEIGHT)
    args = parser.parse_args()

    frames_root = Path(args.frames_root).expanduser().resolve()
    output_dir = Path(args.output_dir).expanduser().resolve()
    previews = []
    for state, durations in ROW_DURATIONS.items():
        frames = load_frames(frames_root, state, len(durations))
        output = output_dir / f"{state}.gif"
        save_preview(
            frames,
            durations,
            output,
            args.preview_width,
            args.preview_height,
        )
        previews.append(
            {
                "state": state,
                "path": str(output),
                "frames": len(frames),
                "width": args.preview_width,
                "height": args.preview_height,
            }
        )

    result = {"ok": True, "output_dir": str(output_dir), "previews": previews}
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
