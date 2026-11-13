import sys
import unittest
from pathlib import Path
from types import SimpleNamespace

SCRIPTS_DIR = Path(__file__).resolve().parents[1] / "scripts"
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

import prepare_pet_run as run


def make_args(**overrides: object) -> SimpleNamespace:
    values: dict[str, object] = {
        "display_name": "Yvonne",
        "pet_name": "Yvonne",
        "pet_id": "yvonne",
        "description": "",
        "pet_notes": "pink twin tails, black-and-pink horns, teal cropped jacket, white bodysuit",
        "style_preset": "auto",
        "style_notes": "",
        "brand_name": "Arknights: Endfield",
        "brand_brief": "industrial sci-fi palette with pink accents",
        "chroma_key": {"hex": "#00FF00", "rgb": [0, 255, 0], "name": "green", "selection": "auto"},
    }
    values.update(overrides)
    return SimpleNamespace(**values)


class PromptNameSafetyTest(unittest.TestCase):
    def prompts(self, args: SimpleNamespace) -> dict[str, str]:
        return {
            "base": run.base_pet_prompt(args),
            "row": run.row_prompt(args, "idle", 6, 3, 2, (3840, 2160)),
            "retry": run.retry_row_prompt(args, "idle", 6, 3, 2, (3840, 2160)),
        }

    def test_prompts_never_carry_user_facing_labels(self) -> None:
        # A character name or franchise title in a prompt is what makes the
        # endpoint answer HTTP 400 and is a copyright risk on the output.
        for name, prompt in self.prompts(make_args()).items():
            lowered = prompt.lower()
            self.assertNotIn("yvonne", lowered, name)
            self.assertNotIn("arknights", lowered, name)
            self.assertNotIn("endfield", lowered, name)

    def test_brand_name_alone_never_reaches_a_prompt(self) -> None:
        args = make_args(brand_brief="")
        self.assertEqual(run.brand_inspiration_line(args), "")
        prompt = run.base_pet_prompt(args)
        self.assertNotIn("Arknights", prompt)

    def test_brand_only_inference_does_not_leak_the_brand_name(self) -> None:
        args = make_args(pet_notes="", description="", brand_brief="")
        self.assertNotIn("Arknights", run.infer_pet_notes(args, []))
        self.assertNotIn("Arknights", run.infer_description(args, []))


if __name__ == "__main__":
    unittest.main()
