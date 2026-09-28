/**
 * body.js — 身体段收编：把外部宠物包的两个文件落到角色目录。
 *
 * 用法：
 *   node .claude/skills/make-character/body.js <stagingDir> [--from <来源目录 | zip>]
 *
 * 来源三种，缺省是第一种：
 *   （不写 --from）  角色目录自身——"我已经手放好了"，只跑落盘规则
 *   --from <目录>    来源目录根级的 pet.json + spritesheet.(webp|png)。
 *                    hatch-pet 的 `~/.codex/pets/<pet-id>/` 与 PetDex 画廊的
 *                    `~/.petdex/pets/<slug>/` 都是这个形状
 *   --from <zip>     包根级的同名两文件（解包用 fflate，与 pack.js 同包，零新依赖）
 *
 * 职责刻意很小：**找齐两文件 → 落盘 → 清掉另一种扩展名**。
 * **不判几何、不判画质**——几何的唯一裁判是渲染进程（`src/lib/pet-sheet.ts` 的
 * `loadPetSheet` 抛 `sheetGeometryError`）；导入侧、打包侧、本脚本都不假装能预判。
 * 「画得对不对」更是只能人看，没有机器判据。
 *
 * 落盘规则对齐 `CharacterBodyService.write`：
 * - 两种图集扩展名**只能留一个**：`.webp` 与 `.png` 并存时"用哪张"全凭探测顺序，
 *   那种"看着换了其实用的是旧图"最难查
 * - 覆盖是**允许**的（换一只更好的身体是常态，身体已入库、可从 git 找回），
 *   但覆盖了谁会打印出来——动作要可见
 * - `pet.json` 原样落盘，不解析改写（与 `CharacterBodyService` 同一约定）
 */
import fs from "node:fs"
import path from "node:path"

import { unzipSync } from "fflate"

import { SPRITESHEET_NAMES, findSpritesheet, stagingPaths } from "./dialogue.js"

function fail(msg) {
  console.error(`[body] ${msg}`)
  process.exit(1)
}

const [, , stagingDir, ...flags] = process.argv
if (!stagingDir) {
  fail("用法：node .claude/skills/make-character/body.js <stagingDir> [--from <来源目录 | zip>]")
}

const fromIdx = flags.indexOf("--from")
const from = fromIdx >= 0 ? flags[fromIdx + 1] : undefined
if (fromIdx >= 0 && !from) fail("--from 后面要跟来源目录或 zip 的路径")

if (!fs.existsSync(stagingDir)) fail(`找不到角色目录：${stagingDir}`)

const paths = stagingPaths(stagingDir)
if (!fs.existsSync(paths.dialogue)) {
  fail(`${stagingDir} 里没有 dialogue.md（不是 make-character 的角色目录）`)
}

// ---------------------------------------------------------------- 找齐两文件（全过才落盘）

const source = from ?? stagingDir
if (!fs.existsSync(source)) fail(`来源不存在：${source}`)

/** @type {Uint8Array} */
let petJson
/** @type {string} */
let sheetName
/** @type {Uint8Array} */
let sheet

if (fs.statSync(source).isDirectory()) {
  const sheetAbs = findSpritesheet(source)
  if (!sheetAbs) {
    fail(`来源目录根级没有 ${SPRITESHEET_NAMES.join(" / ")}：${source}`)
  }
  const petJsonAbs = path.join(source, "pet.json")
  if (!fs.existsSync(petJsonAbs)) {
    fail(`来源目录根级没有 pet.json：${source}`)
  }
  sheetName = path.basename(sheetAbs)
  petJson = new Uint8Array(fs.readFileSync(petJsonAbs))
  sheet = new Uint8Array(fs.readFileSync(sheetAbs))
} else {
  /** @type {Record<string, Uint8Array>} */
  let table
  try {
    table = unzipSync(new Uint8Array(fs.readFileSync(source)))
  } catch (e) {
    fail(`来源不是能解开的 zip：${source}（${e instanceof Error ? e.message : e}）`)
  }
  const found = SPRITESHEET_NAMES.find((n) => table[n])
  if (!found) fail(`包根级没有 ${SPRITESHEET_NAMES.join(" / ")}：${source}`)
  if (!table["pet.json"]) fail(`包根级没有 pet.json：${source}`)
  sheetName = found
  petJson = table["pet.json"]
  sheet = table[found]
}

// ---------------------------------------------------------------- 落盘

// 落盘前先看清目标状态：覆盖了谁、要清掉谁——动作可见，别静默换脸
const replaced = [
  ...SPRITESHEET_NAMES.filter((n) => fs.existsSync(path.join(stagingDir, n))),
  ...(fs.existsSync(paths.petJson) ? ["pet.json"] : []),
]

// 两种扩展名只能留一个（对齐 CharacterBodyService.write）
for (const name of SPRITESHEET_NAMES) {
  if (name === sheetName) continue
  fs.rmSync(path.join(stagingDir, name), { force: true })
}
fs.writeFileSync(path.join(stagingDir, sheetName), sheet)
fs.writeFileSync(paths.petJson, petJson)

const kb = (n) => `${Math.round(n / 1024)} KB`
console.log(
  `[body] ✓ ${stagingDir}\n` +
    `  来源：${from ?? "角色目录自身"}\n` +
    `  图集：${sheetName}（${kb(sheet.length)}）\n` +
    (replaced.length > 0 ? `  覆盖：${replaced.join(" / ")}\n` : "") +
    `  下一步：node .claude/skills/make-character/pack.js ${stagingDir}`
)
