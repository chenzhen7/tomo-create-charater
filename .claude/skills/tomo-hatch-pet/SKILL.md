---
name: tomo-hatch-pet
description: Create, repair, validate, and package Codex-compatible animated pets from character art, generated images, company or prospect brand cues, or visual references. Use for any new Codex pet, custom mascot, non-pixel pet style, brand-inspired pet, existing-pet repair, or 8x9 spritesheet workflow requiring all 9 standard animation rows and deterministic assembly.
---

# Hatch Pet

## Overview

Create a Codex-compatible animated pet from a concept, brand cue, company/prospect name, one or more reference images, or any combination of those inputs. Every newly hatched pet is an 8x9 atlas with the 9 standard animation rows.

User-facing inputs are optional. If the user omits a pet name, infer one from the concept, brand, company, or reference filenames; if that is not possible, choose a short friendly name. If the user omits a description, infer one from the concept or references. If the user omits reference images, generate the base pet from text first, then use that base as the canonical reference for every animation row.

## Vocabulary

- **the generation layer** — the image-generation path defined once in **Generation Delegation**; every later mention means that definition.
- **worker** — a subagent handling exactly one visual job, spawned with the agent's own delegation mechanism. The worker return contract (`selected_source=...` / `qa_note=...`) and the concurrency limits below apply unchanged.
- **`<skill>`** — the directory containing this SKILL.md. **`<py>`** — the Python launcher probed per **Runtime Dependencies**.

## Existing Inputs And Upgrades

Treat character art, generated images, standard atlases, contact sheets, and built-in pet art as first-class grounding inputs.

- Preserve user-provided art as a generation reference; do not assume it already has final cell geometry.
- For an existing valid 8x9 atlas, preserve approved rows and repair only the failing row.
- For a built-in pet, extract and use its atlas or neutral/idle cell as the canonical identity reference.

## Generation Delegation

All visual generation goes through **the generation layer**, which resolves to exactly one of two paths:

**Vendored CLI (default)** — `vendor/image_gen.py` inside `<skill>`. It reads `OPENAI_API_KEY` (and `OPENAI_BASE_URL`) from the environment:

```bash
# prompt-only job (no input images)
<py> <skill>/vendor/image_gen.py generate \
  --no-augment --prompt-file /absolute/path/to/prompt.md --out /absolute/path/to/output.png

# job that lists input images — pass every one, in the listed order
<py> <skill>/vendor/image_gen.py edit \
  --no-augment --prompt-file /absolute/path/to/prompt.md \
  --image /absolute/path/to/canonical-base.png --image /absolute/path/to/layout-guide.png \
  --out /absolute/path/to/output.png
```

**Agent built-in (explicit user choice only)** — some agents ship their own image-generation tool (e.g. Codex's built-in `image_gen` skill, documented at `${CODEX_HOME:-$HOME/.codex}/skills/.system/imagegen/SKILL.md`). Use it only when the user explicitly chooses it — typically because they have no `OPENAI_API_KEY` and do not want one — and then follow that tool's own documentation.

`--no-augment` is mandatory on the CLI: it suppresses the CLI's generic prompt schema, which this skill forbids. Do not call any third image-generation path. If the chosen path fails, stop and report it; never silently fall back to the other one.

The endpoint behind `OPENAI_BASE_URL` decides what it returns, and the CLI cannot steer it. Expect and accept:

- The image may arrive as a `url` rather than inline `b64_json`; the CLI accepts both.
- Background kind is not controllable. A prompt asking for a flat chroma-key background often returns an RGBA image with a transparent background instead, and neither `--background` nor `--output-format` changes that — `--output-format` never governs the primary output container, which is written with the API's raw bytes, so the `--out` extension has no effect either. Accept whichever background arrives: the pipeline keys out the chroma key when it is present and is alpha-based when it is not.
- Judge sprite opacity by **mean alpha over body pixels**, never by counting exactly-255 pixels. Endpoints commonly render bodies at ~250–253, which is fully usable and is not a defect.

Pass `no_proxy='*' NO_PROXY='*'` when the endpoint is local or domestic. An ambient HTTP proxy otherwise breaks the result download even though the API call itself succeeded, which reads like a generation failure but is not.

When invoking the generation layer, pass the generated pet prompt as the authoritative visual spec. Pet prompts should stay concise, state-specific, sprite-production oriented, and grounded in the listed input images. Keep longer policy rules in this skill and the deterministic review scripts rather than expanding them into every image prompt.

Use this skill's scripts for deterministic image work only: preparing layout guides and prompts, mirroring approved `running-left`, extracting frames, validating rows, composing the final atlas, and creating contact-sheet and motion-preview artifacts. The parent owns manifest updates, packaging, and cleanup directly.

## Runtime Dependencies

Every bundled script needs Python 3.8+ with Pillow. Probe once for a working launcher and use that launcher (`<py>`) for the whole run:

| Platform | Try in order |
|----------|--------------|
| Windows | `py -3` → `python` |
| macOS / Linux | `python3` → `python` |

Verify with `<py> -c "import sys;print(sys.version_info[:2])"` and trust only a launcher that prints a version tuple — on Windows `python` can be a Store stub that prints nothing, so judge by output, not exit code. Then check Pillow with `<py> -c "import PIL"`; install it with `<py> -m pip install Pillow` when missing. If Pillow cannot be installed, stop and report it rather than falling back to another image library.

## Storage Controls

Keep generated images out of the main conversation's context and out of stray locations:

- Use one lightweight generation worker per visual job. Do not batch multiple base/row jobs into the same worker.
- Workers must return only `selected_source=...` and `qa_note=...`; they must not include Markdown image previews, base64, or extra visual attachments in their final response.
- The parent must not open every generated image visually. Each generation worker returns a one-line verdict only, so no generated image enters the parent thread.
- After copying the selected generated output into `decoded/`, delete the original generated file whenever it lives outside the run folder, then remove its now-empty generation directory if possible. Agent built-in tools may write to their own locations (e.g. Codex under `${CODEX_HOME:-$HOME/.codex}/generated_images`); the CLI writes exactly where `--out` points, so point it inside the run folder and there is nothing to clean up.

## Brand Discovery

If the user provides a brand, company, product, or prospect name rather than a concrete avatar description or reference image, run a lightweight discovery subagent before preparing the pet run. The discovery worker must use web search and prefer official sources such as the brand site, product pages, docs, about pages, press pages, or brand pages. Use reputable secondary sources only when official pages are too thin. Keep the search narrow: enough to extract visual and personality cues, not a market-research brief.

Skip discovery when the user already provides a concrete mascot/avatar description or reference images, unless the user explicitly asks for brand research.

Discovery worker responsibilities:

- search the web for 2-4 relevant sources, preferring official pages
- write an adaptive markdown brief rather than a rigid field dump
- cover identity/category, audience/use context, visual system, personality/tone, product/domain motifs, mascot translation cues, avoidances, and evidence/confidence
- mark mascot guidance that is inferred from sources as inference
- avoid copying logos, readable marks, UI screenshots, slogans, or text
- end with a compact `Generation handoff` section containing only `brand_name`, `brand_brief`, `avatar_seed`, `avoid`, and `brand_sources`
- do not generate images, prepare run folders, or edit unrelated files

Use this discovery worker prompt:

```text
Research a brand for hatch-pet mascot creation.

Brand/product/prospect: <brand name>
User context: <short user request>
Output file: <absolute path to brand-discovery.md>

Use web search. Prefer official brand, product, docs, about, press, or brand pages. Use reputable secondary sources only if official sources are too thin. Write an adaptive markdown brief to the output file. Headings may flex by brand, but the brief must cover:
- identity/category: canonical name, product type, what it does
- audience/use context: who it serves and where it appears
- visual system: palette, shapes, line quality, materials, typography feel, iconography, patterns
- personality/tone: emotional traits, energy, formality, playfulness
- product/domain motifs: objects, workflows, verbs, metaphors, environments
- mascot translation cues: candidate forms, signature traits, props, what must read at pet size
- avoidances: logos/text, trademark-sensitive elements, misleading cues, competitor confusion, poor mascot fits
- evidence/confidence: source URLs plus notes where evidence is weak or inferred

Do not copy logos, readable marks, UI screenshots, slogans, or text. Clearly label mascot guidance that is inferred rather than directly sourced.

End the brief with a `Generation handoff` section containing exactly:
- brand_name=<canonical brand/product name>
- brand_brief=<one sentence, max 45 words, covering palette/tone/domain motifs/personality>
- avatar_seed=<short mascot-safe visual idea, no logo copying>
- avoid=<short comma-separated list>
- brand_sources=<comma-separated source URLs>

Return exactly:
brand_discovery_file=<absolute output file path>
brand_name=<canonical brand/product name>
brand_brief=<same compact sentence from Generation handoff>
avatar_seed=<same short seed from Generation handoff>
avoid=<same short avoid list from Generation handoff>
brand_sources=<same comma-separated URLs from Generation handoff>
```

The parent should save the markdown brief before preparing the run, then pass it to `prepare_pet_run.py` as `--brand-discovery-file` together with `--brand-name`, `--brand-brief`, repeated `--brand-source`, and a concise `--pet-notes` value based on `avatar_seed` when the user did not provide a better avatar description. Keep the full brief for review; only the compact handoff fields should shape prompts. If web search is unavailable and the user gave only a bare brand name, ask for brand cues before generating.

## Generation Contract

### Visual Job Graph

Expect up to 10 visual jobs: 1 base pet and 9 standard row strips. The standard states are `idle`, `running-right`, `running-left`, `waving`, `jumping`, `failed`, `waiting`, `running`, and `review`. The only deterministic visual derivation is `running-left`, which may be produced by mirroring `running-right` only after `running-right` has been generated, visually inspected, and explicitly approved as safe to mirror. If mirroring is not appropriate, generate `running-left` as a normal grounded generation-layer row.

### Visual Provenance And Grounding

After selecting a visual output, the parent agent copies that exact image into the job's `decoded/` path, runs its required incremental checks, and only then marks the job complete in `imagegen-jobs.json`. Do not write helper scripts that populate row outputs. The deterministic Python scripts may only process already-generated visual outputs.

Only the base job may be prompt-only. Every row-strip job generated through the generation layer must use the input images listed in `imagegen-jobs.json`, including the canonical base reference created after the selected base output is copied. Treat any row generation without attached grounding images as invalid.

## Pet-Safe Styles

Default style is `auto`: infer the pet's style from the user's prompt and references, then preserve that style across every row. If the user names a style, honor it. Supported style presets include `pixel`, `plush`, `clay`, `sticker`, `flat-vector`, `3d-toy`, `painterly`, `brand-inspired`, and `auto`.

Any style is acceptable when it remains pet-safe:

- compact whole-body silhouette readable inside a `192x208` cell
- consistent face, proportions, material, palette, and props across all rows
- clean removable chroma-key background
- details large enough to read at pet size
- no text, labels, UI, or readable logos unless the user explicitly provides approved reference art and asks for them

Non-pixel styles are first-class. Plush, clay, sticker, vector, 3D toy, painterly mascot, ink, and brand-inspired looks should be accepted when they satisfy the atlas and readability constraints.

## Transparency And Effects

Pet rows are processed into transparent `192x208` cells, so every generated pixel must either belong to the pet sprite or be cleanly removable chroma-key background. Prefer pose, expression, and silhouette changes over decorative effects.

The deterministic raster pipeline owns the transparency and chroma-cleanup invariants. Its final edge-local spill-suppression step selects every translucent silhouette-boundary pixel plus opaque boundary pixels whose chroma points toward the known key, then extends clean interior RGB outward through that band in linear light. It preserves alpha exactly, clears hidden RGB under fully transparent pixels, and reports the algorithm and parameters used. The cleanup report plus atlas validator are authoritative for chroma contamination. Once the final report has `ok: true` and atlas validation passes, do not regenerate imagery or add another chroma-cleanup pass.

Fully transparent pixels are allowed outside the sprite silhouette, in unused cells, and in intentional negative-space openings that are part of the pet's design, such as loops or holes in a ribbon body. Reject any generated or repaired cell with accidental 100%-transparent holes inside a filled body, including horizontal bands, seam rows, scanline-like gaps, sliced-tile boundaries, or "see-through" interior stripes. Inspect suspect cells on a high-contrast background or alpha mask before accepting them; ordinary atlas validation is not enough when the hole is inside the silhouette.

Allowed effects must satisfy all of these conditions:

- The effect is state-relevant and helps explain the animation.
- The effect is physically attached to, touching, or overlapping the pet silhouette, not floating nearby.
- The effect is inside the same frame slot as the pet and does not create a separate sprite component.
- The effect is opaque, hard-edged enough for clean extraction, and uses non-chroma-key colors.
- The effect is small enough to remain readable at `192x208` without clutter.

Avoid these by default because they usually break transparent-background cleanup or component extraction:

- wave marks, motion arcs, speed lines, action streaks, afterimages, blur, or smears
- detached stars, loose sparkles, floating punctuation, floating icons, falling tear drops, separated smoke clouds, or loose dust
- cast shadows, contact shadows, drop shadows, oval floor shadows, floor patches, landing marks, impact bursts, glow, halo, aura, or soft transparent effects
- text, labels, frame numbers, visible grids, guide marks, speech bubbles, thought bubbles, UI panels, code snippets, checkerboard transparency, white backgrounds, black backgrounds, or scenery
- chroma-key-adjacent colors in the pet, prop, effects, highlights, or shadows
- stray pixels, disconnected outline bits, speckle/noise, cropped body parts, overlapping poses, or any pose that crosses into a neighboring frame slot

State-specific guidance:

- `idle`: keep this calm and low-distraction. Use only subtle breathing, a tiny blink, a slight head or body bob, a very small material sway, or another quiet persona-preserving motion. The loop must still contain visible micro-variation; do not accept six effectively identical copies. Do not show waving, walking, running, jumping, talking, working, reviewing, emotional reactions, large gestures, item interactions, or new props.
- `waving`: show the wave through paw, hand, wing, or limb pose only. Do not draw wave marks, motion arcs, lines, sparkles, symbols, or floating effects around the gesture.
- `jumping`: show vertical motion through body position only. Do not draw shadows, dust, landing marks, impact bursts, bounce pads, or floor cues.
- `failed`: tears, attached smoke puffs, or attached stars are allowed if they obey the allowed-effects rules; do not use red X marks, floating symbols, detached smoke, detached stars, or separate tear droplets.
- `waiting`: show that the agent needs approval, help, or user input through an expectant asking pose. Keep it distinct from ordinary idle and review.
- `running`: show active task work, processing, thinking, scanning, typing, or focused effort. Do not show literal foot-running, jogging, sprinting, treadmill motion, raised knees, long steps, pumping arms, directional travel, speed lines, dust clouds, floor shadows, motion trails, or detached motion effects.
- `review`: show focus through lean, blink, eyes, head tilt, or paw/hand position. Do not add magnifying glasses, papers, code, UI, punctuation, symbols, or other new props unless they already exist in the base pet identity.
- `running-right` and `running-left`: show directional drag movement through body, limb, and prop movement only. `running-right` must face and travel right; `running-left` must face and travel left. Their cadence must visibly alternate across the loop rather than repeating one nearly static stride. Every figure keeps identical scale — same head size, body height, and silhouette envelope across all frames; stride, lean, and arm swing carry the motion, never a resized pet. Do not draw speed lines, dust clouds, floor shadows, motion trails, or detached motion effects.

## Visible Progress Plan

For every pet run, keep a visible checklist so the user can see where the work is up to. Create the checklist before starting, keep one step active at a time, and update it as each step finishes.

Use this checklist for every pet run, replacing `<Pet>` with the pet's name or `your pet`:

1. Getting `<Pet>` ready.
2. Imagining `<Pet>`'s main look.
3. Picturing `<Pet>`'s poses.
4. Hatching `<Pet>`.

What each step means:

- `Getting <Pet> ready.` Choose or confirm the pet name, description, source images, style preset, style notes, and working folder. For bare brand/product/company requests, first run the brand discovery worker and capture the compact brand brief, source URLs, and avatar seed.
- `Imagining <Pet>'s main look.` Generate the pet's main reference image. This becomes the visual source of truth.
- `Picturing <Pet>'s poses.` Generate and approve rows `0-8`, write the pet-specific look mechanics plan, then generate rows `9-10`. Only mirror `running-left` if `running-right` clearly works when flipped.
- `Hatching <Pet>.` Assemble the 8x9 atlas, run the deterministic gates, repair every row that fails them, and report the output paths.

Only mark a step complete when the real file, image, or decision exists. If this is a repair run, start from the first relevant step instead of restarting the whole checklist.

## Time Budget And Convergence

Aim to complete a normal pet run within 30 minutes while preserving every mandatory acceptance criterion. Treat this as a planning target and an incentive to maximize validated progress per minute, not as permission to weaken a gate or package a failing pet.

At the start of the run, allocate an approximate budget:

- preparation: 2 minutes
- base image: 3 minutes
- standard rows: 10 minutes
- deterministic validation and packaging: 5 minutes
- buffer: 2 minutes

Run independent generation jobs concurrently up to the worker limit, start deterministic checks as soon as each dependency is ready, and record actual stage plus repair time. Prefer character and prop constructions that naturally satisfy cell geometry, transparency, and component connectivity; identify likely conflicts such as open interior gaps, detached parts, thin connectors, asymmetric props, or ambiguous faces before row generation.

After every failed attempt:

1. Classify the failure as source-edge geometry, component connectivity, extraction, or chroma.
2. State the concrete evidence and the root condition the next action will change.
3. Use a deterministic correction for deterministic failures before regenerating imagery.
4. Regenerate only when the source visual is genuinely wrong, and preserve every property that already passed.
5. Compare the new result with the previous one. A repair counts as progress only when it reduces the number or severity of failures without breaking a previously passing gate.

If the same root failure recurs twice, stop varying the prompt and change strategy: strengthen the row-level animation instructions, simplify the pose or prop construction, change the deterministic extraction method, or redesign the problematic visual feature. If a repair merely moves a failure to another cell or gate, treat that as a cycle and change strategy immediately.

Use elapsed-time checkpoints:

- At 15 minutes, verify the run is on pace and that the remaining dependency path is bounded.
- At 25 minutes, prioritize the shortest quality-preserving path through remaining blockers and avoid optional polish.
- At 30 minutes, continue only when the remaining work is clearly converging and bounded, such as final validation, one targeted repair, or packaging.
- Keep recording elapsed time, retries, and validation failures throughout the run, but do not pause or stop solely because elapsed time crosses 45 or 60 minutes. Continue until the pet passes, the user cancels, or a genuine external blocker prevents further progress.

Never use the time target to skip atlas validation, despill validation, or any other acceptance criterion.

Escalate to the user as soon as any of these holds, instead of working around it:

- the generation layer, the endpoint, or a bundled script fails in a way the evidence does not explain
- a deviation is needed: a different extraction path, a weaker gate, a changed acceptance criterion, an unexpected background, or an output format the CLI does not actually control
- a row still fails `qa/review.json` after its one repair, i.e. that row has now been generated twice — stop and report it rather than attempting a third generation
- the same root failure has recurred twice and the strategy change is not obviously safe
- the run passes the 30-minute checkpoint without a bounded path to done
- you are about to accept output you would have to describe to the user as "probably fine"

Send one short message with the evidence, the options, and a recommendation. Do not spend more generations first and ask afterwards.

## Default Workflow

1. Prepare a pet run folder and imagegen job manifest:

```bash
SKILL_DIR="<skill>"   # the directory containing this SKILL.md
PY="<py>"             # the probed Python launcher — see Runtime Dependencies
"$PY" "$SKILL_DIR/scripts/prepare_pet_run.py" \
  --pet-name "<Name>" \
  --pet-id "<ascii-slug>" \
  --display-name "<角色名>" \
  --description "<one sentence>" \
  --reference /absolute/path/to/reference.png \
  --output-dir /absolute/path/to/run \
  --pet-notes "<stable pet description>" \
  --brand-discovery-file /absolute/path/to/brand-discovery.md \
  --brand-name "<optional researched brand name>" \
  --brand-brief "<optional compact researched brand cue sentence>" \
  --brand-source "https://example.com/source" \
  --style-preset auto \
  --style-notes "<optional freeform style notes>" \
  --force
```

All arguments above are optional except any flags needed to express user constraints. For text-only requests, pass the concept through `--pet-notes` and omit `--reference`; `prepare_pet_run.py` will infer a name, description, chroma key, and output directory as needed. With `--output-dir` omitted the run folder defaults to `characters/<display-name>/hatch/<pet-id>-<UTC timestamp>` under the current working directory — the whole `hatch/` tree is scratch: it never enters the package (`pack.py` packs a strict whitelist) and can be deleted once the run is accepted.
For brand-only requests, run the discovery worker first, save the markdown brief, then pass the brief path through `--brand-discovery-file`, `avatar_seed` through `--pet-notes`, `brand_name` through `--brand-name`, `brand_brief` through `--brand-brief`, and each source URL through repeated `--brand-source`.

2. Read `imagegen-jobs.json` directly for the next ready generation jobs — do not add helper scripts for status display. A job is ready when its `status` is not `complete` and every id in `depends_on` is already complete. Each job entry carries `id`, `kind`, `status`, `depends_on`, `prompt_file`, `retry_prompt_file`, `input_images`, `output_path`, and `derivation_policy`.

3. Generate visual jobs with lightweight workers by default:

- Generate and copy `base` first, using a lightweight base worker.
- Generate and copy `idle` and `running-right` next as the identity and gait check, using one lightweight worker per row.
- Inspect `running-right`; mirror `running-left` only when visual identity, prop placement, markings, lighting, and direction semantics remain correct.
- Generate `running-left` normally with a lightweight worker when mirroring would change meaning or identity.
- Generate the remaining rows with lightweight workers, using every input image listed for each job.

Keep up to three generation workers active whenever three independent jobs are ready and worker capacity permits. Backfill an available slot immediately instead of waiting for a fixed wave to finish. Use two or one worker when the dependency graph exposes fewer ready jobs. Do not exceed three generation workers without explicit user direction.

For each ready visual job, run the generation layer with the prompt file listed in `imagegen-jobs.json` and every listed input image with its role label. CLI path: run with `--no-augment` and `--out "$RUN_DIR/generated/<job-id>.png"`, passing one `--image` per listed input. Agent built-in path: follow that tool's own usage. The parent agent must keep its own image handling minimal: do not open every generated base or row in the parent thread. Workers return only the selected source path and a one-sentence QA note; the parent records the selected source path in the manifest.

`prepare_pet_run.py` creates matching layout guides under `references/layout-guides/` for the nine standard rows. Visual jobs attach the matching guide as a layout-only input so the model can follow the correct frame count, spacing, centering, and safe padding. Treat these guides as invisible construction references: generated strips must not include visible boxes, borders, center marks, labels, guide colors, or the guide background.

When generating row strips, keep the identity lock in the row prompt authoritative. Preserve the same style, face, markings, palette, materials, prop design, body proportions, and silhouette from the canonical base. Row jobs attach the layout guide and canonical base by default; the decoded base is kept in the run folder for deterministic processing rather than sent as a redundant generation input.

If the generation layer returns a transport-level `Bad Request` for a row, retry that same row once with its generated `retry_prompt_file`. The retry prompt preserves the row id, frame count, chroma key, canonical-base identity, and state action. Keep the canonical base attached. If the retry still fails, stop and report the failing row and prompt paths instead of switching to any other generation path.

4. After selecting a generated output for a job, look up the job's `output_path` in `imagegen-jobs.json` and copy the selected output into that decoded path under the run folder (create parent directories first). For `base`, also copy the same image to `references/canonical-base.png` in the run folder as the canonical identity reference. Throughout the steps below:

```bash
RUN_DIR=/absolute/path/to/run
JOB_ID=<job-id>   # the job currently being processed
```

For every standard `row-strip` job, immediately extract and inspect only that row before marking the job complete. This overlaps deterministic validation and any repair with generation of other ready rows instead of waiting for all nine rows:

```bash
ROW_QA_DIR="$RUN_DIR/qa/rows/$JOB_ID"
"$PY" "$SKILL_DIR/scripts/extract_strip_frames.py" \
  --decoded-dir "$RUN_DIR/decoded" \
  --output-dir "$ROW_QA_DIR/frames" \
  --states "$JOB_ID" \
  --method auto
"$PY" "$SKILL_DIR/scripts/inspect_frames.py" \
  --frames-root "$ROW_QA_DIR/frames" \
  --json-out "$ROW_QA_DIR/review.json" \
  --states "$JOB_ID" \
  --require-components
```

Treat errors as an immediate repair request. Inspect warnings before accepting the row; do not defer a known clipping, component, or extraction problem to final atlas validation. Chroma cleanup belongs to the deterministic post-assembly despill pass and must not trigger row regeneration. If the only failure is component extraction and the source strip itself has stable scale and placement, use the existing `stable-slots` correction with `--allow-stable-slots` instead of regenerating imagery.

An `empty or too sparse` frame on an otherwise full strip means the source's figures touch: connected components came out fewer than the frame count, so a stray speck was promoted into the missing slot. Count the strip's components before spending a regeneration, and fix it by regenerating with clearly separated, narrow figures. Equal-slot extraction is a defensible fallback only when every figure is narrower than its slot and no figure crosses a slot boundary — measure both, then record the choice in the run's notes; on that path the method lands in `qa/review.json` as a warning rather than an error.

If the generation layer wrote the selected output outside the run folder (agent built-in tools do — e.g. Codex writes under `${CODEX_HOME:-$HOME/.codex}/generated_images`), delete the original once the decoded copy exists. On the CLI path the file lands wherever `--out` pointed, so point `--out` inside the run folder and there is nothing to clean up:

```bash
GENERATED_ROOT="${CODEX_HOME:-$HOME/.codex}/generated_images"
case "$SOURCE" in
  "$GENERATED_ROOT"/*)
    rm -f "$SOURCE"
    rmdir "$(dirname "$SOURCE")" 2>/dev/null || true
    ;;
esac
```

5. Derive `running-left` only when it is visually safe:

```bash
"$PY" "$SKILL_DIR/scripts/derive_running_left_from_running_right.py" \
  --run-dir /absolute/path/to/run \
  --confirm-appropriate-mirror \
  --decision-note "<why mirroring preserves this pet's identity>"
```

That script mirrors each generated frame slot in place so the leftward row preserves the rightward row's temporal order. Do not replace it with a whole-strip mirror that reverses animation timing.

6. When all nine incrementally validated standard row jobs are complete, build and review the intermediate rows `0-8`:

```bash
RUN_DIR=/absolute/path/to/run
mkdir -p "$RUN_DIR/final" "$RUN_DIR/qa"
```

```bash
"$PY" "$SKILL_DIR/scripts/extract_strip_frames.py" \
  --decoded-dir "$RUN_DIR/decoded" \
  --output-dir "$RUN_DIR/frames" \
  --states all \
  --method auto
```

```bash
"$PY" "$SKILL_DIR/scripts/inspect_frames.py" \
  --frames-root "$RUN_DIR/frames" \
  --json-out "$RUN_DIR/qa/review.json" \
  --require-components
```

```bash
"$PY" "$SKILL_DIR/scripts/compose_atlas.py" \
  --frames-root "$RUN_DIR/frames" \
  --output "$RUN_DIR/final/spritesheet.png" \
  --webp-output "$RUN_DIR/final/spritesheet.webp"
```

Run the single deterministic edge-local spill-suppression pass on the assembled 8x9 atlas, then validate it:

```bash
"$PY" "$SKILL_DIR/scripts/despill_chroma_edges.py" \
  "$RUN_DIR/final/spritesheet.png" \
  --output "$RUN_DIR/final/spritesheet.png" \
  --webp-output "$RUN_DIR/final/spritesheet.webp" \
  --chroma-key "$CHROMA_KEY" \
  --json-out "$RUN_DIR/qa/chroma-despill.json"
```

```bash
"$PY" "$SKILL_DIR/scripts/validate_atlas.py" \
  "$RUN_DIR/final/spritesheet.webp" \
  --json-out "$RUN_DIR/final/validation.json" \
  --chroma-key "$CHROMA_KEY"
```

Treat `qa/chroma-despill.json` as the authoritative chroma result. When it has `ok: true` and `validate_atlas.py` passes, do not fail the row for perceived magenta fringe, regenerate any row, rerun despill, tune thresholds, or create an additional chroma-repair script. If either deterministic check fails, stop with a pipeline failure instead of retrying image generation.

```bash
"$PY" "$SKILL_DIR/scripts/make_contact_sheet.py" \
  "$RUN_DIR/final/spritesheet.webp" \
  --output "$RUN_DIR/qa/contact-sheet.png"
```

```bash
"$PY" "$SKILL_DIR/scripts/render_animation_previews.py" \
  --frames-root "$RUN_DIR/frames" \
  --output-dir "$RUN_DIR/qa/previews"
```

If the user reports size popping or baseline jumps in the preview GIFs, caused by per-frame fit-to-cell extraction, and the original row strip itself had stable scale and placement, rerun frame extraction with the explicit row-stability mode and then re-run inspection, atlas composition, contact sheet generation, and previews:

```bash
"$PY" "$SKILL_DIR/scripts/extract_strip_frames.py" \
  --decoded-dir "$RUN_DIR/decoded" \
  --output-dir "$RUN_DIR/frames" \
  --states all \
  --method stable-slots
```

```bash
"$PY" "$SKILL_DIR/scripts/inspect_frames.py" \
  --frames-root "$RUN_DIR/frames" \
  --json-out "$RUN_DIR/qa/review.json" \
  --require-components \
  --allow-stable-slots
```

Use `stable-slots` as a deliberate correction after a user report, not the default. It should reduce extraction-induced motion pops without hiding clipped wide poses or bad source strips.

Expected intermediate output:

```text
run/
  pet_request.json
  imagegen-jobs.json
  prompts/
  decoded/
  frames/frames-manifest.json
  final/spritesheet.webp
  qa/contact-sheet.png
  qa/previews/*.gif
  qa/review.json
```

The acceptance gates are deterministic: `qa/review.json` with no errors, the despill report `ok: true`, and `validate_atlas.py` passing. `qa/contact-sheet.png` and `qa/previews/*.gif` are produced as artifacts for the user to view on demand — nothing in this skill inspects them, so they gate nothing.

Only after every deterministic gate passes, package the approved spritesheet.

The package lands directly in the character folder `characters/<角色名>/` under the current working directory — the same folder `make-character` packages. It is not staged anywhere else first. Two naming rules that follow from that:

- `--display-name` must carry the **character's real name** (its Chinese name as the folder spells it). tomo's market derives the character name from `name → displayName → slug`, and this pet.json shape has no `name`, so `displayName` is what actually gets used.
- `--pet-id` must be an **ASCII slug** (hand-written pinyin, e.g. `perlica`, `chen-qianyu`). `prepare_pet_run.py` slugifies a non-ASCII pet name down to nothing — `佩丽卡` becomes the empty string, `提弗洛斯（SD）` becomes `sd` — which would poison both the run folder name and the `id` field.

Copy the final spritesheet into the character folder as `spritesheet.webp`, then write `pet.json` next to it with exactly these fields (values from `pet_request.json`):

```json
{
  "id": "<pet_id — ASCII slug>",
  "displayName": "<display_name — the character's real name>",
  "description": "<one short sentence>",
  "spritesheetPath": "spritesheet.webp"
}
```

Then write `qa/run-summary.json` in the run folder with this shape (`package` is the character folder path):

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

After all gates and packaging succeed, keep `pet_request.json`, `final/spritesheet.webp`, `final/validation.json`, `qa/chroma-despill.json`, `qa/contact-sheet.png`, `qa/previews/`, `qa/review.json`, and `qa/run-summary.json`. Remove prompts, layout guides, generated row strips, extracted frames, PNG intermediates, and the imagegen job manifest unless the user wants debug artifacts.

## Lightweight Visual Workers

Use lightweight subagents for image-heavy work by default. This bounds each generation job to one selected image, keeps every generated image out of the parent thread, and reduces cost while preserving the full contract.

Bound every worker's scope explicitly: one artifact set, one verdict, and a stop condition. Say what is in scope, what the worker should return, and that it should stop once that verdict is determined. A reviewer that keeps enumerating cells and re-measuring long after the verdict is clear costs more than the generation it is reviewing.

## Subagent Delegation

Use lightweight workers unless the user specifically prohibits delegation.

Parent responsibilities:

- run the brand discovery worker before preparation when the user provides a bare brand/product/company/prospect name
- prepare the run and inspect `imagegen-jobs.json`
- assign the base job and every standard row to lightweight workers
- copy selected worker outputs into their decoded paths and mark jobs complete in `imagegen-jobs.json`
- create `references/canonical-base.png` from the selected base output
- run the approved `running-left` mirror derivation when appropriate
- run deterministic assembly, packaging, repair regeneration, and cleanup

Base worker responsibilities:

- handle only the `base` job
- read `prompts/base-pet.md` and use any listed reference images
- use the generation layer only
- honor any compact brand inspiration line in the prompt as broad visual/personality guidance, without copying logos, readable marks, UI screenshots, slogans, or text
- return only `selected_source=/absolute/path/to/selected-output.png` and `qa_note=<one sentence>`

Row worker responsibilities:

- handle exactly one row job
- read the row prompt and use all listed input images
- use the generation layer only; do not draw, edit, tile, or synthesize sprites locally
- perform a quick visual sanity check for frame count, identity, per-frame scale consistency, chroma background, spacing, clipping, and detached effects
- enforce the row prompt's transparency and effects rules, including no detached effects, no wave marks for `waving`, no speed lines or dust for directional running rows, no literal foot-running for the non-directional `running` row, and only attached opaque sprite-like tears/smoke/stars when allowed by the state prompt
- return only `selected_source=/absolute/path/to/selected-output.png` and `qa_note=<one sentence>`

Model choice for workers:

- Prefer a smaller capable model for brand discovery, since it returns a compact research brief rather than doing orchestration.
- Prefer a smaller capable model for visual workers too, when the agent supports per-worker model choice; use the parent/default model otherwise.
- Dynamically keep up to three generation workers active while at least three independent jobs are ready and capacity permits; backfill slots as workers finish. Use fewer workers when dependencies expose fewer jobs. Close workers after their result has been consumed.

Use this base worker prompt:

```text
Generate the hatch-pet base image.

Run dir: <absolute run dir>
Job id: base
Prompt file: <absolute base prompt file>
Input images:
- <absolute path> — <role>

Use the generation layer only. Read the base prompt and attach every listed input image. If the prompt contains brand inspiration, use it only as broad mascot-safe guidance; do not copy logos, readable marks, UI screenshots, slogans, or text. Before returning, visually check that the result is one centered full-body pet on a flat chroma background, with no text, scenery, shadows, or detached effects.

Do not edit manifests, copy into decoded, mark jobs complete, generate rows, run image-processing scripts, repair, package, or open unrelated files.
Do not include Markdown image previews, base64, or extra attachments in the final response.

Return exactly:
selected_source=/absolute/path/to/selected-output.png
qa_note=<one sentence>
```

Use this row worker prompt:

```text
Generate one hatch-pet row.

Run dir: <absolute run dir>
Row id: <row-id>
Prompt file: <absolute prompt file>
Retry prompt file: <absolute retry prompt file>
Input images:
- <absolute path> — <role>
- <absolute path> — <role>

Use the generation layer only. Read the row prompt and attach every listed input image. If it returns Bad Request, retry once with the retry prompt and the same input images.

Before returning, visually check: exact frame count, same pet identity as canonical base, flat chroma background, complete separated unclipped poses, every figure at one consistent size (no head or body growing or shrinking between frames), and no detached effects or guide marks. The prompt's transparency and effects rules are mandatory: no detached effects, no wave marks for `waving`, no speed lines or dust for directional running rows, no literal foot-running for the non-directional `running` row, and only attached opaque sprite-like tears/smoke/stars when allowed by the state prompt.

Do not edit manifests, copy into decoded, mark jobs complete, mirror rows, run image-processing scripts, repair, package, or open unrelated files.
Do not include Markdown image previews, base64, or extra attachments in the final response.

Return exactly:
selected_source=/absolute/path/to/selected-output.png
qa_note=<one sentence>
```

> **No LLM acceptance step.** Acceptance is the deterministic gates only — `qa/review.json` with no errors, the despill report, `validate_atlas.py`. The contact sheet and previews are produced for the user to look at, not for an agent to score. Re-adding a visual-QA worker is a reversal of a measured decision: three of them cost ~301k tokens and ~52 minutes of wall clock to produce four verdicts, one of them wrong, while every defect they confirmed was independently measurable by a script in seconds.

## Repair Workflow

If `qa/review.json` reports errors, regenerate the smallest failing row, copy the replacement row into the same decoded output path, and keep that job marked complete with the new `source_path` and `completed_at`. Repair the failed row, not the whole sheet.

A row gets at most **two generations total** — the original plus one repair. If the repair still leaves `qa/review.json` errors for that row, stop and report it to the user with the row id, the measured evidence, and the prompts used. Do not attempt a third generation, and do not switch extraction method, thresholds, or gates on your own to force it through.

A repair reuses the row's existing `generated/<job-id>.png` path, so the CLI refuses to overwrite it. Pass `--force`, or point `--out` at a fresh path — without one of those the generation call succeeds, the write fails, and the run burns an API call for nothing.

## Rules

- For brand/product/company/prospect requests without a concrete avatar description or reference image, run brand discovery before base generation and pass only the compact brief into the run.
- Use the generation layer as the only visual generation layer — that means one of the two paths in **Generation Delegation**, never a third. Do not invoke other image APIs, other image CLIs, local raster generators, or one-off generation scripts.
- Keep reference images attached/visible for the generation layer whenever the chosen path supports references.
- Attach the row's `references/layout-guides/<state>.png` image to every row-strip job as a layout-only guide, and do not accept outputs that copy guide pixels.
- Use lightweight visual workers for base generation and row-strip visual generation by default; the parent owns manifest updates, deterministic image scripts, packaging, and cleanup.
- Generate every normal visual job with the generation layer: base plus all row strips that are not explicitly approved `running-left` mirror derivations.
- Treat only the base job as eligible for prompt-only generation; every row job must attach its listed grounding images.
- Generate `running-right` before deciding whether `running-left` can be mirrored.
- When `running-left` is mirrored, preserve frame order and timing semantics; derive it through the deterministic script instead of mirroring an entire strip wholesale.
- Do not derive or reuse `waiting`, `running`, `failed`, `review`, `jumping`, or `waving` from another state; each has distinct app semantics and must be generated as its own row.
- Never substitute locally drawn, tiled, transformed, or code-generated row strips for missing generation-layer outputs.
- Only mark a visual job complete after its selected output has been copied into the decoded output path.
- Never mark a failed coherent row, diagnostic iteration, or one-off repair cell as packaging eligible.
- Do not rely on generated images for exact atlas geometry; use this skill's deterministic image scripts.
- Use the chroma key stored in `pet_request.json`; do not force a fixed green screen.
- Keep the pet's silhouette, face, materials, palette, style, and props consistent across all rows.
- Reject a row at generation time if its identity, style, or prop handedness drifts from `references/canonical-base.png`.
- Treat forbidden detached effects, shadows, glows, smears, dust, landing marks, wave marks, speed lines, or motion trails as failed rows. Chroma-key-adjacent generation artifacts are handled only by the single deterministic despill pass and never trigger image retries after that pass reports success.
- Treat `qa/review.json` errors as blockers. Warnings must be read and judged before the row is accepted.

## Acceptance Criteria

- Final atlas is PNG or WebP, exactly `1536x1872`, and based on `192x208` cells.
- The despill report has `ok: true` and the packaged spritesheet passes `validate_atlas.py` with the run's chroma key. These deterministic results close chroma validation; no separate visual chroma-fringe gate or image retry is allowed.
- Used cells are non-empty and unused cells are fully transparent.
- Atlas follows the row/frame counts in `references/animation-rows.md`.
- `qa/review.json` has no errors, and no row exceeded two generations (original plus one repair).
- Contact sheet and per-row motion previews have been produced as artifacts.
- Non-pixel styles are accepted when readable at pet size and consistent across rows.
- `pet.json` and `spritesheet.webp` are staged together in the character folder `characters/<角色名>/`, with `displayName` carrying the character's real name and `id` an ASCII slug.
