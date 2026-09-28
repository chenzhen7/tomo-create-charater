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

Upstream (Codex) places files under `${CODEX_HOME:-$HOME/.codex}/pets/<pet-name>/`. **In this repo the landing site is the tomo character folder instead** — `characters/<角色名>/`, same two files at the root. The shape below is what both expect:

```text
${CODEX_HOME:-$HOME/.codex}/pets/<pet-name>/     # upstream Codex
characters/<角色名>/                              # this repo
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

