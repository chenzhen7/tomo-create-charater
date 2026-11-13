import sys
import unittest
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parents[1] / "scripts"
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

import pet_geometry as geo


class PetGeometryTest(unittest.TestCase):
    def test_default_scale_is_the_cap(self) -> None:
        self.assertEqual(geo.MAX_CELL_SCALE, 3)
        self.assertEqual(geo.DEFAULT_CELL_SCALE, geo.MAX_CELL_SCALE)

    def test_cell_and_atlas_size_at_cap(self) -> None:
        self.assertEqual(geo.cell_size(geo.MAX_CELL_SCALE), (576, 624))
        self.assertEqual(geo.atlas_size(geo.MAX_CELL_SCALE), (4608, 5616))

    def test_rejects_scale_above_cap(self) -> None:
        with self.assertRaises(ValueError):
            geo.cell_size(geo.MAX_CELL_SCALE + 1)


if __name__ == "__main__":
    unittest.main()
