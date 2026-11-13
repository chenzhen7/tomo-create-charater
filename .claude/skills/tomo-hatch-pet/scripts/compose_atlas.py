#!/usr/bin/env python3
"""Compose or normalize a Codex pet spritesheet atlas."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image

import pet_geometry as geo

ROW_SPECS = [
    ("idle", 0, 6),
    ("running-right", 1, 8),
    ("running-left", 2, 8),
    ("waving", 3, 4),
    ("jumping", 4, 5),
    ("failed", 5, 8),
    ("waiting", 6, 6),
    ("running", 7, 6),
    ("review", 8, 6),
]
IMAGE_SUFFIXES = {".png", ".webp", ".jpg", ".jpeg"}


def image_files(path: Path) -> list[Path]:
    return sorted(p for p in path.iterdir() if p.suffix.lower() in IMAGE_SUFFIXES)


def find_row_frames(root: Path, state: str, row_index: int) -> list[Path]:
    candidates = [
        root / state,
        root / f"row-{row_index}",
        root / f"row{row_index}",
        root / f"{row_index}-{state}",
    ]
    for candidate in candidates:
        if candidate.is_dir():
            files = image_files(candidate)
            if files:
                return files
    globs = [
        f"{state}_*",
        f"{state}-*",
        f"row{row_index}_*",
        f"row-{row_index}-*",
    ]
    files: list[Path] = []
    for pattern in globs:
        files.extend(p for p in root.glob(pattern) if p.suffix.lower() in IMAGE_SUFFIXES)
    return sorted(set(files))


def frame_cell_size(root: Path) -> tuple[int, int]:
    for state, row, _frame_count in ROW_SPECS:
        files = find_row_frames(root, state, row)
        if files:
            with Image.open(files[0]) as opened:
                return opened.size
    raise SystemExit(f"no frame images found under {root}")


def paste_centered(
    atlas: Image.Image,
    source: Image.Image,
    row: int,
    column: int,
    cell_width: int,
    cell_height: int,
) -> None:
    frame = source.convert("RGBA")
    if frame.size != (cell_width, cell_height):
        raise SystemExit(
            f"frame {source} is {frame.width}x{frame.height}; expected the extracted "
            f"cell {cell_width}x{cell_height}"
        )
    atlas.alpha_composite(frame, (column * cell_width, row * cell_height))


def compose_from_source_atlas(path: Path) -> Image.Image:
    with Image.open(path) as opened:
        source = opened.convert("RGBA")
    cell = geo.derive_cell_from_atlas(source.width, source.height, geo.ROWS)
    if cell is None:
        raise SystemExit(
            f"source atlas must be 8 columns x 9 rows with a 192:208 cell ratio; "
            f"got {source.width}x{source.height}"
        )
    cell_width, cell_height = cell
    atlas = Image.new(
        "RGBA", (geo.COLUMNS * cell_width, geo.ROWS * cell_height), (0, 0, 0, 0)
    )
    for _state, row, frame_count in ROW_SPECS:
        for column in range(frame_count):
            left = column * cell_width
            top = row * cell_height
            cell_image = source.crop(
                (left, top, left + cell_width, top + cell_height)
            )
            atlas.alpha_composite(cell_image, (left, top))
    return atlas


def compose_from_frames(root: Path) -> Image.Image:
    cell_width, cell_height = frame_cell_size(root)
    atlas = Image.new(
        "RGBA", (geo.COLUMNS * cell_width, geo.ROWS * cell_height), (0, 0, 0, 0)
    )
    for state, row, frame_count in ROW_SPECS:
        files = find_row_frames(root, state, row)
        if len(files) < frame_count:
            raise SystemExit(
                f"{state} row needs {frame_count} frames, found {len(files)} under {root}"
            )
        for column, frame_path in enumerate(files[:frame_count]):
            with Image.open(frame_path) as frame:
                paste_centered(
                    atlas, frame, row, column, cell_width, cell_height
                )
    return atlas


def clear_transparent_rgb(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    data = bytearray(rgba.tobytes())
    for index in range(0, len(data), 4):
        if data[index + 3] == 0:
            data[index] = 0
            data[index + 1] = 0
            data[index + 2] = 0
    return Image.frombytes("RGBA", rgba.size, bytes(data))


def save_outputs(atlas: Image.Image, output: Path, webp_output: Path | None) -> None:
    atlas = clear_transparent_rgb(atlas)
    output.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(output)
    if webp_output is not None:
        webp_output.parent.mkdir(parents=True, exist_ok=True)
        atlas.save(
            webp_output,
            format="WEBP",
            lossless=True,
            quality=100,
            method=6,
            exact=True,
        )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--source-atlas")
    source.add_argument("--frames-root")
    parser.add_argument("--output", required=True)
    parser.add_argument("--webp-output")
    args = parser.parse_args()

    if args.source_atlas:
        atlas = compose_from_source_atlas(Path(args.source_atlas).expanduser().resolve())
    else:
        atlas = compose_from_frames(Path(args.frames_root).expanduser().resolve())

    save_outputs(
        atlas,
        Path(args.output).expanduser().resolve(),
        Path(args.webp_output).expanduser().resolve() if args.webp_output else None,
    )
    print(f"wrote {Path(args.output).expanduser().resolve()}")
    if args.webp_output:
        print(f"wrote {Path(args.webp_output).expanduser().resolve()}")


if __name__ == "__main__":
    main()
