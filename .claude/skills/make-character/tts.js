/**
 * tts.js — make-character skill 的语音合成（Fish Audio 后端）。
 *
 * 用法：
 *   node .claude/skills/make-character/tts.js <stagingDir>                  # 合成全部缺失音频
 *   node .claude/skills/make-character/tts.js <stagingDir> --only <file>    # 只重生成指定条目
 *   node .claude/skills/make-character/tts.js <stagingDir> --clone <audio>  # 先用参考音频克隆音色
 *
 * 行为约定：
 * - 已存在的 audio/<file> 跳过（重生成 = 删掉文件再跑，或 --only 强制）
 * - 克隆得到的 reference_id 写回 dialogue.md frontmatter，后续合成复用
 * - 单条失败重试 2 次；仍有失败 → 以非零码退出并列出失败条目（不静默、不留半成品假象）
 * - API key 从 FISH_AUDIO_API_KEY 环境变量（或 repo 根 .env）读取，缺失即中止
 * - 代理：.env 里 FISH_PROXY（或环境变量 HTTPS_PROXY）指向本地代理（如 http://127.0.0.1:7897）
 */
import fs from "node:fs"
import path from "node:path"

import axios from "axios"

import { loadEnv } from "../../../vendor/tomo-contracts/load-env.mjs"

import {
  parseDialogue,
  parseFrontmatter,
  setFrontmatterValue,
  stagingPaths,
} from "./dialogue.js"

const API_BASE = "https://api.fish.audio/v1"
const MAX_RETRY = 2
/** 官方 curl 示例用的模型；frontmatter 可加 `model: <模型名>` 覆盖（如账户无 free 版权限时换 s2-pro） */
const DEFAULT_MODEL = "s2.1-pro-free"

/** FISH_PROXY / HTTPS_PROXY 解析成 axios 的 proxy 配置；无代理返回 null */
function proxyUrl() {
  const proxy = process.env.FISH_PROXY ?? process.env.HTTPS_PROXY
  return proxy ? new URL(proxy) : null
}

/** 鉴权头 / 代理 / 状态码判定集中在一个实例上。
 *  无代理时显式传 false：否则 axios 会去自动探测 HTTP_PROXY / NO_PROXY，行为随环境漂移 */
function createClient(key, proxy) {
  return axios.create({
    baseURL: API_BASE,
    headers: { Authorization: `Bearer ${key}` },
    proxy: proxy ?? false,
    // 非 2xx 不当异常抛，交给 checkHttp 带上服务端 body 片段统一报错
    validateStatus: () => true,
  })
}

function fail(msg) {
  console.error(`[tts] ${msg}`)
  process.exit(1)
}

function apiKey() {
  const key = process.env.FISH_AUDIO_API_KEY
  if (!key) {
    fail(
      "缺少 FISH_AUDIO_API_KEY：请设置环境变量，或在 repo 根目录 .env 里加一行 FISH_AUDIO_API_KEY=<key>"
    )
  }
  return key
}

/** 响应体转文本：合成接口用 responseType: arraybuffer 时是 Buffer，其余接口 axios 已解析成对象 */
function bodyText(data) {
  if (data == null) return ""
  if (Buffer.isBuffer(data)) return data.toString("utf8")
  return typeof data === "string" ? data : JSON.stringify(data)
}

function checkHttp(res, what) {
  if (res.status >= 200 && res.status < 300) return
  throw new Error(`${what} 失败：HTTP ${res.status} ${bodyText(res.data).slice(0, 300)}`)
}

/** 克隆音色：上传参考音频建 voice，返回 reference_id */
async function cloneVoice(api, audioPath, title) {
  const form = new FormData()
  form.append("type", "tts")
  form.append("train_mode", "fast")
  form.append("title", title)
  form.append("visibility", "private")
  const buf = fs.readFileSync(audioPath)
  form.append(
    "voices",
    new Blob([buf]),
    path.basename(audioPath)
  )
  const res = await api.post("/voices", form)
  checkHttp(res, "克隆音色")
  const id = res.data?._id ?? res.data?.id
  if (!id) throw new Error(`克隆音色返回中找不到 id：${JSON.stringify(res.data).slice(0, 300)}`)
  return id
}

/** 合成一条台词，返回 mp3 字节（官方格式：model 走 HTTP header，情绪标签内联在 text 里） */
async function synthesize(api, { text, referenceId, speed, model }) {
  const body = { text, reference_id: referenceId, format: "mp3" }
  if (speed) body.prosody = { speed: Number(speed) }
  const res = await api.post("/tts", body, {
    headers: { model },
    responseType: "arraybuffer",
  })
  checkHttp(res, `合成「${text.slice(0, 20)}…」`)
  return res.data
}

async function withRetry(fn, what) {
  let lastErr
  for (let attempt = 0; attempt <= MAX_RETRY; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (attempt < MAX_RETRY) {
        console.warn(`[tts] ${what} 第 ${attempt + 1} 次失败，重试：${err.message}`)
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
      }
    }
  }
  throw lastErr
}

async function main() {
  const [, , stagingDir, ...flags] = process.argv
  if (!stagingDir) fail("用法：node .claude/skills/make-character/tts.js <stagingDir> [--clone <audio>] [--only <file>]")
  loadEnv(path.resolve(stagingDir, "..", ".."))

  const paths = stagingPaths(stagingDir)
  if (!fs.existsSync(paths.dialogue)) fail(`找不到 ${paths.dialogue}（先完成台词设计阶段）`)
  fs.mkdirSync(paths.audioDir, { recursive: true })

  const proxy = proxyUrl()
  if (proxy) console.log(`[tts] 使用代理：${proxy.href}`)
  const api = createClient(apiKey(), proxy)
  let raw = fs.readFileSync(paths.dialogue, "utf8")
  const { meta } = parseFrontmatter(raw)
  const dialogue = parseDialogue(paths.dialogue)

  // 克隆模式：上传参考音频 → reference_id 写回 dialogue.md
  // clonedId 单独跟踪：meta 是克隆前解析的，克隆成功后必须用它而不是重读 meta
  let clonedId = null
  const cloneIdx = flags.indexOf("--clone")
  if (cloneIdx >= 0) {
    const audioPath = flags[cloneIdx + 1]
    if (!audioPath || !fs.existsSync(audioPath)) fail(`--clone 参考音频不存在：${audioPath}`)
    if (meta.reference_id) {
      console.log(`[tts] 已有 reference_id=${meta.reference_id}，跳过克隆（如需重克隆请先删除该行）`)
    } else {
      const title = meta.name ?? path.basename(stagingDir)
      console.log(`[tts] 克隆音色中（参考音频：${audioPath}）…`)
      clonedId = await withRetry(() => cloneVoice(api, audioPath, title), "克隆音色")
      raw = setFrontmatterValue(raw, "reference_id", clonedId)
      fs.writeFileSync(paths.dialogue, raw)
      console.log(`[tts] 克隆完成，reference_id=${clonedId}（已写回 dialogue.md）`)
    }
  }

  const referenceId = meta.reference_id ?? clonedId
  if (!referenceId) {
    fail(
      "dialogue.md 缺少 reference_id：请填入已有音色 id，或先用 --clone <参考音频> 克隆音色"
    )
  }

  const onlyIdx = flags.indexOf("--only")
  const only = onlyIdx >= 0 ? flags[onlyIdx + 1] : null

  const todos = []
  for (const section of dialogue.sections) {
    for (const item of section.items) {
      const target = path.join(paths.audioDir, item.file)
      if (only && item.file !== only) continue
      if (!only && fs.existsSync(target)) continue
      if (!item.text) fail(`条目 ${item.file} 缺少 text`)
      todos.push({ item, target })
    }
  }
  if (todos.length === 0) {
    console.log("[tts] 没有待合成的条目（已存在的跳过；重生成请删除对应 mp3 或用 --only）")
    return
  }

  console.log(`[tts] 待合成 ${todos.length} 条…`)
  /** @type {{ file: string, err: string }[]} */
  const failures = []
  for (const { item, target } of todos) {
    try {
      const bytes = await withRetry(
        () =>
          synthesize(api, {
            text: item.text,
            referenceId,
            speed: meta.speed,
            model: meta.model ?? DEFAULT_MODEL,
          }),
        `合成 ${item.file}`
      )
      fs.writeFileSync(target, bytes)
      console.log(`[tts] ✓ ${item.file}（${(bytes.length / 1024).toFixed(1)} KB）`)
    } catch (err) {
      failures.push({ file: item.file, err: err.message })
      console.error(`[tts] ✗ ${item.file}：${err.message}`)
    }
  }

  if (failures.length > 0) {
    console.error(
      `[tts] ${failures.length} 条合成失败：\n` +
        failures.map((f) => `  - ${f.file}: ${f.err}`).join("\n")
    )
    process.exit(1)
  }
  console.log(`[tts] 完成，共 ${todos.length} 条`)
}

main().catch((err) => fail(err.message))
