/**
 * dialogue.md 解析（make-character skill 的共享中间产物格式）。
 *
 * 格式约定（SKILL.md 同步维护，改动必须双侧一致）：
 *   ---
 *   name: 芙宁娜
 *   reference_id: <fish audio voice id>
 *   ---
 *
 *   ## session-start
 *   - file: session-start-1.mp3
 *     text: [happy] 呀，你来啦！
 *     name: 登场问候          ← 可选，展示名；缺省 = file 去扩展名
 *
 * 规则：
 * - frontmatter 为简单 key: value 对（不做 YAML 全语法）
 * - 事件节标题 `## <抽象事件名>`（16 词表之一，kebab-case，无空格；见 vendor/tomo-contracts/events.ts）
 * - 条目以 `- file: <文件名>` 开始，后续缩进行为 text:/name:
 * - 语音是否已生成不在文件里记状态——以 audio/<file> 是否存在为准（重生成 = 删文件重跑）
 */
import fs from "node:fs"
import path from "node:path"

/** @typedef {{ file: string, text: string, name: string | null }} DialogueItem */
/** @typedef {{ event: string, items: DialogueItem[] }} DialogueSection */
/** @typedef {{ meta: Record<string, string>, sections: DialogueSection[] }} Dialogue */

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/

/** 解析 frontmatter 的简单 key: value 对 */
export function parseFrontmatter(raw) {
  const m = FRONTMATTER_RE.exec(raw)
  /** @type {Record<string, string>} */
  const meta = {}
  if (!m) return { meta, body: raw }
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z_]+):\s*(.*)$/.exec(line)
    if (kv) meta[kv[1]] = kv[2].trim()
  }
  return { meta, body: raw.slice(m[0].length) }
}

/** 把 key 写回 frontmatter（存在则替换，不存在则追加；保持用户其余编辑不动） */
export function setFrontmatterValue(raw, key, value) {
  const m = FRONTMATTER_RE.exec(raw)
  if (!m) throw new Error("dialogue.md 缺少 frontmatter（--- 包裹的头部）")
  const lines = m[1].split(/\r?\n/)
  const re = new RegExp(`^${key}:`)
  const idx = lines.findIndex((l) => re.test(l))
  if (idx >= 0) lines[idx] = `${key}: ${value}`
  else lines.push(`${key}: ${value}`)
  return `---\n${lines.join("\n")}\n---\n` + raw.slice(m[0].length)
}

/** 解析 dialogue.md 全文；格式损坏时抛出带行号的错误 */
export function parseDialogue(filePath) {
  const raw = fs.readFileSync(filePath, "utf8")
  const { meta, body } = parseFrontmatter(raw)

  /** @type {DialogueSection[]} */
  const sections = []
  /** @type {DialogueSection | null} */
  let current = null
  /** @type {DialogueItem | null} */
  let item = null

  const lines = body.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const heading = /^##\s+(\S+)\s*$/.exec(line)
    if (heading) {
      current = { event: heading[1], items: [] }
      sections.push(current)
      item = null
      continue
    }
    const fileMatch = /^- file:\s*(\S+)\s*$/.exec(line)
    if (fileMatch) {
      if (!current) {
        throw new Error(`dialogue.md 第 ${i + 1} 行：条目必须位于某个 ## 事件节内`)
      }
      item = { file: fileMatch[1], text: "", name: null }
      current.items.push(item)
      continue
    }
    const field = /^\s+(text|name):\s*(.*)$/.exec(line)
    if (field) {
      if (!item) {
        throw new Error(`dialogue.md 第 ${i + 1} 行：${field[1]} 必须跟在 - file: 之后`)
      }
      if (field[1] === "text") item.text = field[2].trim()
      else item.name = field[2].trim() || null
      continue
    }
  }
  return { meta, sections }
}

/** 身体段图集的两种合法条目名（PetDex 规范：根级 spritesheet.webp 或 spritesheet.png） */
export const SPRITESHEET_NAMES = ["spritesheet.webp", "spritesheet.png"]

/** staging 目录布局的统一定义（身体段两文件在角色目录根级，与包内结构一致） */
export function stagingPaths(stagingDir) {
  return {
    root: stagingDir,
    dialogue: path.join(stagingDir, "dialogue.md"),
    audioDir: path.join(stagingDir, "audio"),
    petJson: path.join(stagingDir, "pet.json"),
  }
}

/** 定位身体段图集：根级 spritesheet.webp / spritesheet.png 取先存在者；都没有返回 null */
export function findSpritesheet(dir) {
  for (const name of SPRITESHEET_NAMES) {
    const abs = path.join(dir, name)
    if (fs.existsSync(abs)) return abs
  }
  return null
}

