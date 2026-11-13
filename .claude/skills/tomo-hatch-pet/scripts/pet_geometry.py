#!/usr/bin/env python3
"""Single source of truth for pet atlas cell geometry and generation grids.

The PetDex base cell is 192x208. Production runs may use any integer scale N
up to MAX_CELL_SCALE (cell = 192N x 208N) so high-resolution rows survive into
the atlas. Rows are generated on a two-row grid (4x2 for 8 frames, 3x2 for
5-6, 2x2 for 4) so each figure gets more source pixels than a single horizontal
row would allow.
"""

from __future__ import annotations

import json
import math
from pathlib import Path

BASE_CELL_WIDTH = 192
BASE_CELL_HEIGHT = 208
FRAME_ASPECT = BASE_CELL_HEIGHT / BASE_CELL_WIDTH
COLUMNS = 8
ROWS = 9
# N=4 (3072x3744) and above exhaust memory in the despill pass, which expands
# the whole atlas into Python lists; N=3 is the largest scale that finishes on
# a 16GB machine, so it is both the default and the hard ceiling.
MAX_CELL_SCALE = 3
DEFAULT_CELL_SCALE = MAX_CELL_SCALE
DEFAULT_GENERATION_SIZE = (3840, 2160)
MAX_GENERATION_SIZE = (3840, 2160)


def cell_size(scale: int) -> tuple[int, int]:
    if scale < 1:
        raise ValueError(f"cell scale must be >= 1, got {scale}")
    if scale > MAX_CELL_SCALE:
        raise ValueError(f"cell scale must be <= {MAX_CELL_SCALE}, got {scale}")
    return BASE_CELL_WIDTH * scale, BASE_CELL_HEIGHT * scale


def atlas_size(scale: int) -> tuple[int, int]:
    width, height = cell_size(scale)
    return COLUMNS * width, ROWS * height


def grid_for_frames(frames: int) -> tuple[int, int]:
    """Two-row grid that maximizes per-figure area for standard pet rows."""
    if frames < 1:
        raise ValueError(f"frame count must be >= 1, got {frames}")
    rows = 2
    columns = math.ceil(frames / rows)
    return columns, rows


def slot_positions(frames: int, columns: int, rows: int) -> list[tuple[int, int]]:
    """Row-major (column, row) slots used by the first `frames` figures."""
    if columns < 1 or rows < 1:
        raise ValueError(f"grid must be positive, got {columns}x{rows}")
    slots = [(column, row) for row in range(rows) for column in range(columns)]
    if frames > len(slots):
        raise ValueError(f"{frames} frames do not fit in {columns}x{rows} slots")
    return slots[:frames]


def read_request(run_dir: Path) -> dict[str, object]:
    path = run_dir / "pet_request.json"
    if not path.is_file():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def find_request(start: Path) -> dict[str, object]:
    """Walk up from a run subdirectory (decoded/, frames/, qa/rows/...) to the run root."""
    for directory in [start, *start.parents]:
        request = read_request(directory)
        if request:
            return request
    return {}


def request_cell_scale(request: dict[str, object]) -> int | None:
    scale = request.get("cell_scale")
    if isinstance(scale, int) and scale >= 1:
        return scale
    atlas = request.get("atlas")
    if isinstance(atlas, dict):
        cell_width = atlas.get("cell_width")
        if isinstance(cell_width, int) and cell_width > 0 and cell_width % BASE_CELL_WIDTH == 0:
            return cell_width // BASE_CELL_WIDTH
    return None


def request_row_grid(
    request: dict[str, object], state: str
) -> tuple[int, int] | None:
    rows = request.get("rows")
    if not isinstance(rows, list):
        return None
    for row in rows:
        if not isinstance(row, dict) or row.get("state") != state:
            continue
        columns = row.get("grid_columns")
        grid_rows = row.get("grid_rows")
        if (
            isinstance(columns, int)
            and columns >= 1
            and isinstance(grid_rows, int)
            and grid_rows >= 1
        ):
            return columns, grid_rows
    return None


def derive_cell_from_atlas(
    width: int, height: int, rows: int = ROWS
) -> tuple[int, int] | None:
    """Derive a cell from atlas dimensions; None when the grid is not integral."""
    if rows < 1 or width % COLUMNS or height % rows:
        return None
    cell_width = width // COLUMNS
    cell_height = height // rows
    if cell_width < 1 or cell_height < 1:
        return None
    if abs(cell_width / cell_height - BASE_CELL_WIDTH / BASE_CELL_HEIGHT) > 0.005:
        return None
    return cell_width, cell_height


def infer_cell_from_frame_files(
    frames_root: Path, states: list[str] | None = None
) -> tuple[int, int] | None:
    """Read the first extracted frame; every row must use the same cell size."""
    from PIL import Image

    for state in states or []:
        state_dir = frames_root / state
        if not state_dir.is_dir():
            continue
        for path in sorted(state_dir.iterdir()):
            if path.suffix.lower() not in {".png", ".webp", ".jpg", ".jpeg"}:
                continue
            with Image.open(path) as opened:
                return opened.size
    return None
