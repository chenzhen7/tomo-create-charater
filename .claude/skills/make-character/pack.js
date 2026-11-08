/**
 * pack.js — make-character skill 的角色包打包（产物 .zip）+ 全量校验。
 *
 * 用法：
 *   node .claude/skills/make-character/pack.js <stagingDir> [--out <目标路径>]
 *
 * 打包前全量校验（对齐 CharacterArchiveService 导出侧的校验规则，失败无半状态）：
 * - frontmatter 有 name
 * - 每个事件节标题 ∈ 语音白名单（8 词，见 vendor/tomo-contracts/events.ts）
 * - **8 个可绑事件各至少一条音频**（导出门槛：缺哪个事件都不给导出/上架）
 * - 每个音频条目：裸文件名、扩展名白名单、audio/ 下文件存在、text 非空
 * - label（原台词）去掉行首情绪标签后必须非空、≤100 字（与市场服务端同一把尺子）
 * - 身体段必须齐：pet.json（合法 JSON）+ spritesheet.webp|png
 * - 人格 persona.txt 可选：有内容就校验严格 UTF-8 / 10,000 UTF-16 码元后原样入包；缺失或空白只警告
 * 产物结构：manifest.json(version:4，audios[].label = 原台词) + pet.json + spritesheet.<ext> + audio/<uuid>.<ext> + 可选 persona.txt，zip level:0。
 * 包内没有 avatar.png（2.0 起角色可视资产只有身体段，见 docs/contracts/角色库包格式.md）。
 *
 * 事件名一律是**抽象事件名**：包与 Agent 无关（manifest 无 mainAgent），任何 Agent 都能导入，
 * 目标 Agent 够不到的事件在应用里保留 + 标灰，不丢数据。
 */
import fs from "node:fs"
import path from "node:path"
import { randomUUID } from "node:crypto"

import { zipSync } from "fflate"

import { VOICE_EVENTS, isBindable, missingVoiceEvents } from "../../../vendor/tomo-contracts/events.ts"
import { AUDIO_EXT } from "../../../vendor/tomo-contracts/audio-ext.ts"
import { findSpritesheet, parseDialogue, parseFrontmatter, stagingPaths } from "./dialogue.js"

function fail(msg) {
  console.error(`[pack] ${msg}`)
  process.exit(1)
}

/** manifest 的音频字段上限（《角色库包格式》§manifest.json）：与市场服务端校验一致 */
const LABEL_MAX = 100

const PERSONA_TXT = "persona.txt"
/**
 * 与 tomo/src/shared/chat.ts 的 PERSONA_MAX_LENGTH、Java String.length() 同一口径：
 * UTF-16 码元数（JS string.length 天然就是这个）。改上限时三处一起改。
 */
const PERSONA_MAX_LENGTH = 10_000

/** 情绪标签是给 TTS 的合成指令，不是台词；气泡直接显示 label，所以行首标签必须剥掉 */
function labelFrom(text) {
  return text.replace(/^(?:\[[a-z-]+\]\s*)+/, "").trim()
}

const [, , stagingDir, ...flags] = process.argv
if (!stagingDir) fail("用法：node .claude/skills/make-character/pack.js <stagingDir> [--out <目标路径>]")

const paths = stagingPaths(stagingDir)
if (!fs.existsSync(paths.dialogue)) fail(`找不到 ${paths.dialogue}（先完成台词设计阶段）`)

const raw = fs.readFileSync(paths.dialogue, "utf8")
const { meta } = parseFrontmatter(raw)
const dialogue = parseDialogue(paths.dialogue)

// ---------------------------------------------------------------- 校验

const name = meta.name ?? path.basename(stagingDir)

/** @type {string[]} */
const errors = []
/** @type {Record<string, Uint8Array>} */
const files = {}
const manifestEvents = []

if (dialogue.sections.length === 0) errors.push("dialogue.md 没有任何 ## 事件节")

for (const section of dialogue.sections) {
  // 语音白名单（8 个），不是「抽象事件目录」（16 个）：另外 8 个只驱动桌宠状态、不可绑语音，
  // 带它们的包会被 tomo 导入与市场上传双双拒绝——在这里就拦下，别产出导不回去的包
  if (!isBindable(section.event)) {
    errors.push(
      `事件不可绑语音：${section.event}（可用：${VOICE_EVENTS.join(" / ")}）`
    )
    continue
  }
  const audios = []
  for (const item of section.items) {
    const label = labelFrom(item.text)
    if (!item.text) errors.push(`条目缺少 text：${item.file}`)
    else if (!label) errors.push(`台词去掉情绪标签后为空：${item.file}`)
    else if (label.length > LABEL_MAX)
      errors.push(`台词超过 ${LABEL_MAX} 字（${label.length}）：${item.file}`)
    if (item.file.includes("/") || item.file.includes("\\")) {
      errors.push(`非法文件名（必须是裸文件名）：${item.file}`)
      continue
    }
    const ext = path.extname(item.file).slice(1).toLowerCase()
    if (!AUDIO_EXT.includes(ext)) {
      errors.push(`不支持的音频格式：${item.file}（白名单：${AUDIO_EXT.join("/")}）`)
      continue
    }
    const abs = path.join(paths.audioDir, item.file)
    if (!fs.existsSync(abs)) {
      errors.push(`音频未生成：audio/${item.file}（先跑 tts.js）`)
      continue
    }
    const entry = `${randomUUID()}.${ext}`
    files[`audio/${entry}`] = new Uint8Array(fs.readFileSync(abs))
    audios.push({ file: entry, label })
  }
  if (audios.length === 0) errors.push(`事件没有音频条目：${section.event}`)
  manifestEvents.push({ event: section.event, audios })
}

// 导出门槛：8 个可绑事件必须**各至少一条**音频（与导出侧、市场服务端同一把尺子）
const missing = missingVoiceEvents(manifestEvents.map((e) => e.event))
if (missing.length > 0) {
  errors.push(
    `还缺 ${missing.length} 个事件的语音：${missing.join(" / ")}（导出要求 8 个事件各至少一条）`
  )
}

// 身体段：导出必须齐（缺身体 = 下载方只能看到内置默认宠物，市场上也无法区分条目）
if (!fs.existsSync(paths.petJson)) {
  errors.push("缺少 pet.json（身体段必需；把宠物包的 pet.json 放到角色目录）")
} else {
  const raw = fs.readFileSync(paths.petJson, "utf8")
  try {
    JSON.parse(raw)
  } catch (e) {
    errors.push(`pet.json 不是合法 JSON：${e instanceof Error ? e.message : e}`)
  }
  files["pet.json"] = new Uint8Array(fs.readFileSync(paths.petJson))
}

const sheet = findSpritesheet(stagingDir)
if (!sheet) {
  errors.push("缺少 spritesheet.webp / spritesheet.png（身体段必需）")
} else {
  files[path.basename(sheet)] = new Uint8Array(fs.readFileSync(sheet))
}

// ---------------------------------------------------------------- 人格（v4，可选）

const rootEntries = fs.readdirSync(stagingDir)
/** @type {string | null} */
let personaText = null
/** @type {string | null} */
let personaNote = null
// Windows 文件系统不区分大小写：只用 existsSync 会把 Persona.txt 当成 persona.txt 收进包，
// 但导入侧按精确名查找，进包后等同于没有人格。这里像 pet.json 一样点名报错。
const personaCaseWrong = rootEntries.filter(
  (name) => name.toLowerCase() === PERSONA_TXT && name !== PERSONA_TXT
)
if (personaCaseWrong.length > 0) {
  errors.push(
    `文件名大小写不对：${personaCaseWrong.join(" / ")}——必须是全小写的 ${PERSONA_TXT}` +
      "（Windows 上看着是同一个文件，导入侧却是按精确名字找的，进包后等同于没有人格）"
  )
} else if (rootEntries.includes(PERSONA_TXT)) {
  if (!fs.statSync(paths.persona).isFile()) {
    errors.push(`${PERSONA_TXT} 必须是文件，不能是目录`)
  } else {
    let text
    try {
      // fs 的 "utf8" 会把坏字节静默替换成 U+FFFD；这里必须严格解码
      text = new TextDecoder("utf-8", { fatal: true }).decode(
        new Uint8Array(fs.readFileSync(paths.persona))
      )
    } catch (e) {
      errors.push(
        `${PERSONA_TXT} 不是有效的 UTF-8：${e instanceof Error ? e.message : e}`
      )
    }
    if (text !== undefined) {
      const value = text.trim()
      if (!value) {
        personaNote = `${PERSONA_TXT} 为空，按没有人格处理，未打进包`
      } else if (value.length > PERSONA_MAX_LENGTH) {
        errors.push(
          `${PERSONA_TXT} 不能超过 ${PERSONA_MAX_LENGTH} 个字符（当前 ${value.length} 个）`
        )
      } else {
        personaText = value
      }
    }
  }
} else {
  personaNote =
    `未找到 ${PERSONA_TXT}：包仍可导入/上架，聊天会使用内核提示词；` +
    "要角色人格就回到 SKILL.md 步骤②"
}

if (errors.length > 0) {
  fail(`校验未通过，未生成包：\n` + errors.map((e) => `  - ${e}`).join("\n"))
}

// ---------------------------------------------------------------- 打包

if (personaText !== null) {
  // 写 trim 后的文本：与应用导入后存进 DB 的内容一致，避免包内带着首尾空白
  files[PERSONA_TXT] = new TextEncoder().encode(personaText)
}

const manifest = {
  format: "tomochar",
  version: 4,
  name,
  exportedAt: new Date().toISOString(),
  events: manifestEvents,
}
files["manifest.json"] = new TextEncoder().encode(JSON.stringify(manifest, null, 2))

const outIdx = flags.indexOf("--out")
const out =
  outIdx >= 0
    ? flags[outIdx + 1]
    : path.join(paths.root, "out", `${name}.zip`)
fs.mkdirSync(path.dirname(out), { recursive: true })
fs.writeFileSync(out, zipSync(files, { level: 0 }))

const clipCount = manifestEvents.reduce((n, e) => n + e.audios.length, 0)
const personaSummary = personaText === null ? "无" : `${personaText.length} 字符`
console.log(
  `[pack] ✓ ${out}\n` +
    `  角色：${name}\n` +
    `  事件：${manifestEvents.length} 个，音频：${clipCount} 条\n` +
    `  人格：${personaSummary}\n` +
    `  到应用里「角色管理 → 导入」即可完成安装`
)
if (personaNote) console.error(`  ⚠ ${personaNote}`)
