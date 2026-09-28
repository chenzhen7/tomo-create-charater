/**
 * sync-tomo-contracts.mjs — 从 tomo 仓库同步 make-character 依赖的契约文件。
 *
 *   node scripts/sync-tomo-contracts.mjs [--from <tomo 仓库路径>]
 *
 * 来源路径解析顺序：--from > 环境变量 TOMO_REPO > ../tomo。
 * 每份文件写入一行 provenance 头（含来源 commit），刷新重跑本脚本即可。
 *
 * 同步清单（唯一事实源都在 tomo，这里只放快照）：
 *   src/shared/events.ts       → vendor/tomo-contracts/events.ts      事件目录，pack.js 校验绑定用
 *   src/shared/types.ts        → vendor/tomo-contracts/types.ts       events.ts 的 AgentId 来源
 *   src/shared/tomo-res-url.ts → vendor/tomo-contracts/tomo-res-url.ts types.ts 的 PetdexSource 来源
 *   src/shared/audio-ext.ts    → vendor/tomo-contracts/audio-ext.ts   音频扩展名与展示名
 *   scripts/load-env.mjs       → vendor/tomo-contracts/load-env.mjs   .env 读取
 *   docs/contracts/*.md        → docs/contracts/*.md                  make-character / hatch-pet 引用的契约正文
 */
import fs from "node:fs"
import path from "node:path"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const OUT_DIR = path.join(REPO_ROOT, "vendor", "tomo-contracts")

// make-character / hatch-pet 正文引用到的契约文档，按同名路径落盘
const DOCS = [
  "docs/contracts/角色库包格式.md",
  "docs/contracts/PetDex宠物包格式.md",
  "docs/contracts/事件目录契约.md",
]

const FILES = [
  ["src/shared/events.ts", "events.ts"],
  ["src/shared/types.ts", "types.ts"],
  ["src/shared/tomo-res-url.ts", "tomo-res-url.ts"],
  ["src/shared/audio-ext.ts", "audio-ext.ts"],
  ["scripts/load-env.mjs", "load-env.mjs"],
]

function fail(message) {
  console.error(`[sync-tomo-contracts] ${message}`)
  process.exit(1)
}

function tomoRoot() {
  const flagIndex = process.argv.indexOf("--from")
  const from = flagIndex >= 0 ? process.argv[flagIndex + 1] : process.env.TOMO_REPO
  if (flagIndex >= 0 && !from) fail("--from 后面要跟 tomo 仓库路径")
  return path.resolve(REPO_ROOT, from ?? "../tomo")
}

const root = tomoRoot()
if (!fs.existsSync(path.join(root, "src", "shared", "events.ts"))) {
  fail(`${root} 里没有 src/shared/events.ts，不像是 tomo 仓库；用 --from <路径> 或 TOMO_REPO 指定`)
}

const rev = spawnSync("git", ["-C", root, "rev-parse", "--short", "HEAD"], { encoding: "utf8" })
const sha = rev.status === 0 ? rev.stdout.trim() : "unknown"
if (rev.status !== 0) fail(`读不到 ${root} 的 HEAD commit：${rev.stderr?.trim() ?? ""}`)

const header = (source) =>
  [
    `// 本文件由 scripts/sync-tomo-contracts.mjs 从 tomo 仓库同步生成。`,
    `// 来源：tomo@${sha} ${source}`,
    `// 刷新：node scripts/sync-tomo-contracts.mjs`,
    "",
  ].join("\n")

fs.mkdirSync(OUT_DIR, { recursive: true })
const written = []
for (const [source, name] of FILES) {
  const abs = path.join(root, source)
  if (!fs.existsSync(abs)) fail(`来源文件不存在：${abs}`)
  const body = fs.readFileSync(abs, "utf8")
  fs.writeFileSync(path.join(OUT_DIR, name), header(source) + body, "utf8")
  written.push(`${source} → vendor/tomo-contracts/${name}`)
}

for (const source of DOCS) {
  const abs = path.join(root, source)
  if (!fs.existsSync(abs)) fail(`来源文档不存在：${abs}`)
  const body = fs.readFileSync(abs, "utf8")
  const out = path.join(REPO_ROOT, source)
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(
    out,
    [
      `<!-- 本文件由 scripts/sync-tomo-contracts.mjs 从 tomo 仓库同步生成。 -->`,
      `<!-- 来源：tomo@${sha} ${source} -->`,
      `<!-- 刷新：node scripts/sync-tomo-contracts.mjs -->`,
      "",
      body,
    ].join("\n"),
    "utf8",
  )
  written.push(`${source} → ${source}`)
}

console.log(JSON.stringify({ ok: true, from: root, rev: sha, written }, null, 2))
