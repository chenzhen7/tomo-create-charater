#!/usr/bin/env python3
"""Create a labeled contact sheet from a Codex pet atlas."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

import pet_geometry as geo

LABEL_HEIGHT = 22
ROW_NAMES = [
    "idle",
    "running-right",
    "running-left",
    "waving",
    "jumping",
    "failed",
    "waiting",
    "running",
    "review",
]
USED_COUNTS = [6, 8, 8, 4, 5, 8, 6, 6, 6]


def is_used_cell(row: int, column: int) -> bool:
    return column < USED_COUNTS[row]


def frame_count_label(row: int) -> str:
    return f"{USED_COUNTS[row]} frames"


def checker(size: tuple[int, int], square: int = 16) -> Image.Image:
    image = Image.new("RGB", size, "#ffffff")
    draw = ImageDraw.Draw(image)
    for y in range(0, size[1], square):
        for x in range(0, size[0], square):
            if (x // square + y // square) % 2:
                draw.rectangle((x, y, x + square - 1, y + square - 1), fill="#e8e8e8")
    return image


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("atlas")
    parser.add_argument("--output", required=True)
    parser.add_argument("--scale", type=float, default=0.5)
    args = parser.parse_args()

    with Image.open(Path(args.atlas).expanduser().resolve()) as opened:
        atlas = opened.convert("RGBA")
    cell = geo.derive_cell_from_atlas(atlas.width, atlas.height, geo.ROWS)
    if cell is None:
        raise SystemExit(
            f"atlas must be {geo.COLUMNS} columns x {geo.ROWS} rows with a 192:208 "
            f"cell ratio; got {atlas.width}x{atlas.height}"
        )
    cell_width, cell_height = cell

    cell_w = max(1, round(cell_width * args.scale))
    cell_h = max(1, round(cell_height * args.scale))
    width = geo.COLUMNS * cell_w
    height = geo.ROWS * (cell_h + LABEL_HEIGHT)
    sheet = Image.new("RGB", (width, height), "#f7f7f7")
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default()

    for row in range(geo.ROWS):
        y = row * (cell_h + LABEL_HEIGHT)
        draw.rectangle((0, y, width, y + LABEL_HEIGHT - 1), fill="#111111")
        draw.text((6, y + 5), f"row {row}: {ROW_NAMES[row]}", fill="#ffffff", font=font)
        draw.text(
            (width - 92, y + 5),
            frame_count_label(row),
            fill="#ffffff",
            font=font,
        )
        for column in range(geo.COLUMNS):
            crop = atlas.crop(
                (
                    column * cell_width,
                    row * cell_height,
                    (column + 1) * cell_width,
                    (row + 1) * cell_height,
                )
            )
            crop = crop.resize((cell_w, cell_h), Image.Resampling.LANCZOS)
            bg = checker((cell_w, cell_h))
            bg.paste(crop, (0, 0), crop)
            x = column * cell_w
            sheet.paste(bg, (x, y + LABEL_HEIGHT))
            outline = "#18a058" if is_used_cell(row, column) else "#cc3344"
            draw.rectangle(
                (x, y + LABEL_HEIGHT, x + cell_w - 1, y + LABEL_HEIGHT + cell_h - 1),
                outline=outline,
            )
            draw.text((x + 4, y + LABEL_HEIGHT + 4), str(column), fill="#111111", font=font)

    output = Path(args.output).expanduser().resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output)
    print(f"wrote {output}")


if __name__ == "__main__":
    main()
