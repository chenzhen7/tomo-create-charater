---
name: tomo-hatch-pet
description: Create, repair, validate, and package Codex-compatible animated pets from character art, generated images, company or prospect brand cues, or visual references. Use for any new Codex pet, custom mascot, non-pixel pet style, brand-inspired pet, existing-pet repair, or 8x9 spritesheet workflow requiring all 9 standard animation rows and deterministic assembly.
---

# Hatch Pet

Create a Codex-compatible animated pet — an 8x9 atlas with 9 animation rows — from character art, a concept, brand cues, or reference images. User inputs are optional: infer a name and description when omitted, and with no references generate the base first, then use it as the canonical identity reference.

## Vocabulary

- **the generation layer** — the image-generation path defined once in **Generation Delegation**.
- **worker** — a subagent handling exactly one visual job.
- **`<skill>`** — the directory containing this SKILL.md. **`<py>`** — the Python launcher probed per **Runtime Dependencies**.

## Prompt Identity Safety

Prompts describe appearance only. Never write a character, work/franchise, studio, brand, or trademark name into `--pet-notes`, `--description`, `--style-notes`, or `--brand-brief`, and never ask for "in the style of <work>" — the endpoint may reject the job (HTTP 400) and the output risks copying protected designs. `--pet-name` / `--display-name` / `--pet-id` / `--brand-name` are local labels; `prepare_pet_run.py` never writes them into prompts.

## Generation Delegation

All visual generation goes through the generation layer, exactly one of:

**Vendored CLI (default)** — `vendor/image_gen.py` inside `<skill>`, reading `OPENAI_API_KEY` / `OPENAI_BASE_URL` from the environment:

```bash
# prompt-only job
<py> <skill>/vendor/image_gen.py generate \
  --no-augment --prompt-file /absolute/path/to/prompt.md --out /absolute/path/to/output.png

# job with input images — pass every one, in the listed order
<py> <skill>/vendor/image_gen.py edit \
  --no-augment --prompt-file /absolute/path/to/prompt.md \
  --image /absolute/path/to/canonical-base.png --image /absolute/path/to/layout-guide.png \
  --out /absolute/path/to/output.png
```

It defaults to `gpt-image-2.5-sunburst`, `high` quality at `3840x2160`; override `--model` / `--quality` / `--size` only when a job needs something else.

**Agent built-in (explicit user choice only)** — some agents ship their own image tool. Use it only when the user explicitly chooses it, then follow that tool's documentation.

`--no-augment` is mandatory: it suppresses the CLI's generic prompt schema, which this skill forbids. Do not call a third path. If the chosen path fails, stop and report; never silently fall back to the other.

The endpoint decides what it returns. Accept:

- a `url` instead of inline `b64_json`;
- either a flat chroma-key background or an already-transparent RGBA background — `--background` / `--output-format` do not change it;
- body opacity around 250–253. Judge by mean alpha over body pixels, never by counting exact-255 pixels.

Pass `no_proxy='*' NO_PROXY='*'` for local or domestic endpoints, or the result download fails after a successful API call.

The prompt file is the authoritative visual spec. Keep prompts concise and grounded in their input images; keep policy rules here and in the scripts, not in every prompt.

## Runtime Dependencies

Every bundled script needs Python 3.8+ with Pillow. Probe once and reuse that launcher:

| Platform | Try in order |
|----------|--------------|
| Windows | `py -3` → `python` |
| macOS / Linux | `python3` → `python` |

Verify with `<py> -c "import sys;print(sys.version_info[:2])"` and trust only a launcher that prints a version — on Windows `python` can be a Store stub that prints nothing. Check Pillow with `<py> -c "import PIL"`; install with `<py> -m pip install Pillow`. If it cannot be installed, stop.

## Storage Controls

- One lightweight worker per visual job; never batch jobs.
- Workers return only `selected_source=...` / `qa_note=...` — no Markdown previews, base64, or attachments. The parent must not open every generated image.
- After copying the selected output into `decoded/`, delete the original if it lives outside the run folder.

## Brand Discovery

When the user gives only a brand, company, product, or prospect name, run one lightweight discovery worker before preparation. It must search 2–4 official sources, write an adaptive markdown brief (identity, visual system, tone, motifs, mascot cues, avoidances, sources) without copying logos or readable text, and end with a `Generation handoff` block containing `brand_name`, `brand_brief` (one sentence, ≤45 words), `avatar_seed`, `avoid`, and `brand_sources`; it returns the same fields. Pass the brief path and compact fields to `prepare_pet_run.py`, with `avatar_seed` as `--pet-notes`. The brand name is metadata only and never enters a prompt. Skip discovery when the user provides a concrete avatar description or reference images.

## Generation Contract

### Geometry

The cell is `192N x 208N` for an integer scale `N`, hard-capped at **3** (`MAX_CELL_SCALE`; larger atlases exhaust memory in the despill pass). Always pass `--cell-scale 3` (4608x5616 atlas); lower it only when the user explicitly asks. Each state generates as one image on a two-row grid — 4x2 for 8 frames, 3x2 for 5–6, 2x2 for 4 — with row-major reading order; a 5-frame row leaves one slot empty. The atlas is always 8 columns x 9 rows.

### Jobs And Provenance

Up to 10 visual jobs: 1 base plus 9 rows (`idle`, `running-right`, `running-left`, `waving`, `jumping`, `failed`, `waiting`, `running`, `review`). Only the base may be prompt-only; every row must attach its listed grounding images. The only deterministic derivation is `running-left`, mirrored from an approved `running-right`. Copy the selected output into the job's `decoded/` path before marking it complete; do not write helper scripts to populate row outputs.

### Look Rules

- Default style preset: `delicate-realistic` — delicate tapered linework, natural 4–5-head proportions, light painterly impasto, soft pastel shading. Other accepted presets: `auto`, `pixel`, `plush`, `clay`, `sticker`, `flat-vector`, `3d-toy`, `painterly`, `brand-inspired`. Whatever the preset, keep a readable whole-body silhouette and consistent face, proportions, palette, and materials across rows.
- Every generated pixel must be sprite or cleanly removable chroma key. Reject accidental 100%-transparent holes inside a filled body; the atlas validator will not catch those.
- Effects are allowed only when state-relevant, attached to the sprite, inside its slot, opaque, and non-key-colored. Reject detached marks, shadows, glows, motion trails, and symbol-like artifacts.
- State and effects rules live in each generated row prompt; do not override or re-specify them.

## Progress

Keep a visible checklist, one active step at a time:

1. Getting `<Pet>` ready.
2. Imagining `<Pet>`'s main look.
3. Picturing `<Pet>`'s poses.
4. Hatching `<Pet>`.

Mark a step complete only when its file or decision exists. For a repair run, start from the failing step.

## Workflow

Aim for a complete run in about 30 minutes, but never weaken a gate to hit it.

1. Prepare the run:

```bash
SKILL_DIR="<skill>"
PY="<py>"
"$PY" "$SKILL_DIR/scripts/prepare_pet_run.py" \
  --pet-name "<Name>" \
  --pet-id "<ascii-slug>" \
  --display-name "<角色名>" \
  --description "<one sentence>" \
  --reference /absolute/path/to/reference.png \
  --output-dir /absolute/path/to/run \
  --pet-notes "<stable appearance description>" \
  --brand-discovery-file /absolute/path/to/brand-discovery.md \
  --brand-name "<brand name>" \
  --brand-brief "<visual cue sentence>" \
  --brand-source "https://example.com/source" \
  --style-preset delicate-realistic \
  --style-notes "<optional>" \
  --cell-scale 3 \
  --generation-size 3840x2160 \
  --force
```

All flags are optional except what expresses user constraints. The run folder defaults to `characters/<display-name>/hatch/<pet-id>-<timestamp>`; the whole `hatch/` tree is scratch and never enters the package.

2. Read `imagegen-jobs.json` for ready jobs — a job is ready when `status` is not complete and every id in `depends_on` is complete. Each entry carries `prompt_file`, `retry_prompt_file`, `input_images`, `output_path`, `generation_size`, and `derivation_policy`.

```bash
RUN_DIR=/absolute/path/to/run
CHROMA_KEY=<hex from pet_request.json>
```

3. Generate with lightweight workers, at most three active, backfilling as slots free:

- base first, then stop: show the base image to the user and wait for explicit confirmation of the look before generating any row;
- then `idle` and `running-right` as the identity and gait check;
- inspect `running-right`, then mirror `running-left` only when identity, props, markings, lighting, and direction stay correct — otherwise generate it as a normal row;
- then the remaining rows.

Each job uses its prompt file and every listed input image with its role. CLI: `--no-augment`, `--out "$RUN_DIR/generated/<job-id>.png"`, the job's `generation_size` as `--size`, the endpoint's exact model name (the CLI does not validate it), and one `--image` per input. Layout guides under `references/layout-guides/` are invisible construction references — generated grids must not copy their boxes, borders, labels, or colors. If a row returns a transport-level `Bad Request`, retry that row once with its `retry_prompt_file` and the same images; if it fails again, stop and report.

4. Copy each selected output into its `decoded/` path; for `base`, also copy it to `references/canonical-base.png`. Then extract and inspect each row immediately, before marking it complete:

```bash
JOB_ID=<job-id>
ROW_QA_DIR="$RUN_DIR/qa/rows/$JOB_ID"
"$PY" "$SKILL_DIR/scripts/extract_strip_frames.py" \
  --decoded-dir "$RUN_DIR/decoded" --output-dir "$ROW_QA_DIR/frames" \
  --states "$JOB_ID" --method auto
"$PY" "$SKILL_DIR/scripts/inspect_frames.py" \
  --frames-root "$ROW_QA_DIR/frames" --json-out "$ROW_QA_DIR/review.json" \
  --states "$JOB_ID" --require-components
```

Treat errors as an immediate repair request; read warnings before accepting. Chroma cleanup belongs to the final despill pass and must not trigger row regeneration. If the only failure is component extraction and the source strip has stable scale and placement, use `stable-slots` with `--allow-stable-slots` instead of regenerating. An `empty or too sparse` frame means the figures touched: count components first and regenerate with clearly separated figures; equal-slot extraction is acceptable only when every figure is narrower than its slot and crosses no boundary.

5. Mirror `running-left` only when appropriate:

```bash
"$PY" "$SKILL_DIR/scripts/derive_running_left_from_running_right.py" \
  --run-dir /absolute/path/to/run --confirm-appropriate-mirror \
  --decision-note "<why mirroring preserves this pet's identity>"
```

6. After all nine rows pass incremental validation, assemble and gate:

```bash
"$PY" "$SKILL_DIR/scripts/extract_strip_frames.py" \
  --decoded-dir "$RUN_DIR/decoded" --output-dir "$RUN_DIR/frames" --states all --method auto
"$PY" "$SKILL_DIR/scripts/inspect_frames.py" \
  --frames-root "$RUN_DIR/frames" --json-out "$RUN_DIR/qa/review.json" --require-components
"$PY" "$SKILL_DIR/scripts/compose_atlas.py" \
  --frames-root "$RUN_DIR/frames" --output "$RUN_DIR/final/spritesheet.png" \
  --webp-output "$RUN_DIR/final/spritesheet.webp"
```

```bash
"$PY" "$SKILL_DIR/scripts/despill_chroma_edges.py" \
  "$RUN_DIR/final/spritesheet.png" --output "$RUN_DIR/final/spritesheet.png" \
  --webp-output "$RUN_DIR/final/spritesheet.webp" \
  --chroma-key "$CHROMA_KEY" --json-out "$RUN_DIR/qa/chroma-despill.json"
"$PY" "$SKILL_DIR/scripts/validate_atlas.py" \
  "$RUN_DIR/final/spritesheet.webp" --json-out "$RUN_DIR/final/validation.json" \
  --chroma-key "$CHROMA_KEY"
```

`qa/chroma-despill.json` with `ok: true` plus passing atlas validation closes chroma. Do not fail perceived fringe, regenerate a row, rerun despill, or tune thresholds. If either check fails, stop with a pipeline failure.

```bash
"$PY" "$SKILL_DIR/scripts/make_contact_sheet.py" \
  "$RUN_DIR/final/spritesheet.webp" --output "$RUN_DIR/qa/contact-sheet.png"
"$PY" "$SKILL_DIR/scripts/render_animation_previews.py" \
  --frames-root "$RUN_DIR/frames" --output-dir "$RUN_DIR/qa/previews"
```

If the user reports size popping or baseline jumps and the source grids had stable scale, rerun extraction with `--method stable-slots`, then rerun inspection with `--allow-stable-slots`, composition, contact sheet, and previews. Use it as a correction after a report, not the default.

7. Package the approved spritesheet into `characters/<角色名>/`:

- `--display-name` must be the character's real name — the market derives the name from `displayName` because this `pet.json` has no `name`.
- `--pet-id` must be an ASCII slug; non-ASCII names slugify to nothing.

Copy the spritesheet as `spritesheet.webp` and write `pet.json`:

```json
{
  "id": "<pet_id>",
  "displayName": "<display_name>",
  "description": "<one short sentence>",
  "spritesheetPath": "spritesheet.webp"
}
```

Write `qa/run-summary.json`:

```json
{
  "ok": true,
  "run_dir": "<RUN_DIR>",
  "spritesheet": "<RUN_DIR>/final/spritesheet.webp",
  "validation": "<RUN_DIR>/final/validation.json",
  "chroma_despill": "<RUN_DIR>/qa/chroma-despill.json",
  "contact_sheet": "<RUN_DIR>/qa/contact-sheet.png",
  "review": "<RUN_DIR>/qa/review.json",
  "package": "characters/<角色名>"
}
```

Keep `pet_request.json`, `final/spritesheet.webp`, `final/validation.json`, `qa/chroma-despill.json`, `qa/contact-sheet.png`, `qa/previews/`, `qa/review.json`, and `qa/run-summary.json`. Remove prompts, layout guides, generated strips, frames, PNG intermediates, and the job manifest unless the user wants debug artifacts.

## Workers

Use lightweight workers unless the user prohibits delegation. Bound each to one job and one verdict, and stop once it is determined. The parent owns preparation, manifests, copying outputs, mirror derivation, deterministic scripts, packaging, and cleanup.

Use one worker prompt, filling the placeholders:

```text
Generate one hatch-pet visual job.

Run dir: <absolute run dir>
Job id: <base | row id>
Prompt file: <absolute prompt file>
Retry prompt file: <absolute retry prompt, rows only>
Generation size: <WIDTHxHEIGHT>
Input images:
- <absolute path> — <role>

Use the generation layer only. Read the prompt and attach every listed input image. Pass the generation size as `--size` and the endpoint's exact model name. If a row returns Bad Request, retry once with the retry prompt and the same images.

Before returning, check: exact frame count, same identity as the canonical base, flat chroma background, separated unclipped poses, one consistent figure size, and no detached effects or guide marks. The prompt's state and effects rules are mandatory.

Do not edit manifests, copy into decoded, mark jobs complete, mirror rows, run image-processing scripts, repair, package, or open unrelated files.
Do not include Markdown image previews, base64, or extra attachments.

Return exactly:
selected_source=/absolute/path/to/selected-output.png
qa_note=<one sentence>
```

Prefer a smaller capable model for workers when the agent supports per-worker choice.

## Repair

Regenerate only the smallest failing row, write it to the same decoded path, and update that job's `source_path` / `completed_at`. A row gets at most two generations total (original plus one repair); if it still fails, stop and report the row id, evidence, and prompts. Never force a third generation or switch gates to make it pass.

A repair reuses `generated/<job-id>.png`, so pass `--force` or point `--out` at a fresh path — otherwise the API call succeeds, the write fails, and the run burns a call.

## Rules

- The generation layer is the only image source. Never substitute locally drawn, tiled, transformed, or code-generated rows.
- Only the base is prompt-only; every row attaches its grounding images.
- Generate `running-right` before deciding on `running-left`, and mirror through the deterministic script so frame order and timing survive.
- Do not derive `waiting`, `running`, `failed`, `review`, `jumping`, or `waving` from another state; each has distinct app semantics.
- Use the chroma key from `pet_request.json`; do not force a fixed green screen.
- Keep identity, style, and prop handedness consistent with `references/canonical-base.png`, and never rely on generated images for exact atlas geometry.
- Acceptance is the deterministic gates only: `qa/review.json` with no errors, despill `ok: true`, and passing `validate_atlas.py`. Contact sheet and previews are user artifacts, not agent-scored gates.

## Acceptance Criteria

- Final atlas is PNG or WebP, 8 columns x 9 rows, one integer-scaled cell `192N x 208N` (use N=3 → 4608x5616; max N=3).
- Despill report has `ok: true` and the packaged spritesheet passes `validate_atlas.py` with the run's chroma key.
- Used cells are non-empty; unused cells are fully transparent.
- Row/frame counts match `pet_request.json`.
- `qa/review.json` has no errors, and no row exceeded two generations.
- Contact sheet and per-row motion previews exist.
- Non-pixel styles are accepted when readable at pet size and consistent across rows.
- `pet.json` and `spritesheet.webp` sit together in `characters/<角色名>/`, with `displayName` as the real name and `id` an ASCII slug.
