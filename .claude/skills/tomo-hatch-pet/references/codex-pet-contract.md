# Codex Pet Contract

## Sprite Atlas

- Format: PNG or WebP.
- Dimensions: `1536x1872`.
- Grid: 8 columns x 9 rows.
- Cell: `192x208`.
- Background: transparent.
- Rows `0-8`: standard animation states.
- Unused standard-row cells: fully transparent.

## Local Custom Pet Package

Upstream (Codex) places files under `${CODEX_HOME:-$HOME/.codex}/pets/<pet-name>/`. The tomo flow lands the same two files in the character folder — `characters/<角色名>/` under the current working directory, which is what `make-character` packages:

```text
${CODEX_HOME:-$HOME/.codex}/pets/<pet-name>/     # upstream Codex
characters/<角色名>/                              # tomo
├── pet.json
└── spritesheet.webp
```

Required manifest shape:

```json
{
  "id": "pet-name",
  "displayName": "Pet Name",
  "description": "One short sentence.",
  "spritesheetPath": "spritesheet.webp"
}
```

