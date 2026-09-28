/**
 * upload.js — make-character skill 的角色包上传（角色库市场服务端）。
 *
 * 用法：
 *   node .claude/skills/make-character/upload.js <package|stagingDir> \
 *     [--env test|prod] [--lang <code>] [--description <text>] [--tag <tag>]... [--yes]
 *
 * 参数：
 *   <package|stagingDir>    包文件路径（.zip / 1.0 存量 .tomochar）；或角色 staging 目录（自动取 out/ 下唯一产物）
 *   --env test|prod         目标环境（默认 test）；prod 属外向动作，必须再加 --yes 显式确认
 *   --lang <code>           语言标签（覆盖 dialogue.md frontmatter）
 *   --description <text>    角色简介（覆盖 dialogue.md frontmatter；≤200 字，超长本地直接拒绝）
 *   --tag <tag>             标签（可重复，与 dialogue.md 的 tags 合并去重）
 *   --yes                   生产环境跳过确认
 *
 * 参数来源：lang / description / tags 仅取该角色 dialogue.md frontmatter（步骤② 写入），CLI flag 临时覆盖；baseUrl 取固定默认值，凭据来自 .env。
 * 配置（优先级：同名环境变量 > repo 根 .env（敏感凭据）> .env.defaults（无隐私固定默认值））：
 *   测试环境：MARKET_TEST_BASE_URL / MARKET_TEST_USERNAME / MARKET_TEST_PASSWORD
 *   生产环境：MARKET_PROD_BASE_URL / MARKET_PROD_USERNAME / MARKET_PROD_PASSWORD
 *   通用：MARKET_PROXY（可选代理，同 FISH_PROXY 用法）
 *
 * 鉴权流程对齐 docs/contracts/上传接口契约.md（Session + CSRF 双层令牌）：
 *   ① GET /login → 惰性下发 XSRF-TOKEN Cookie
 *   ② POST /login（username/password/_csrf 表单）→ 302 成功，JSESSIONID 换新并从响应 Set-Cookie 重读
 *   ③ GET / → 登录响应会清空 XSRF-TOKEN，站根路径为认证会话刷新令牌；不跟随 /admin 重定向（会被安全层弹回匿名 /login）
 *   ④ POST /api/v1/characters/upload（multipart，头带 X-XSRF-TOKEN）→ 返回角色 ID（status=0 待审核）
 *
 * 失败不静默：HTTP/业务错误原样报出（含服务端 msg），非零退出。
 */
import fs from "node:fs"
import path from "node:path"

import axios from "axios"

import { loadEnv } from "../../../vendor/tomo-contracts/load-env.mjs"

import { parseFrontmatter } from "./dialogue.js"

function fail(msg) {
  console.error(`[upload] ${msg}`)
  process.exit(1)
}

/** 极简 cookie jar：只认 name=value（忽略 path/domain/expires），同名覆盖 */
class CookieJar {
  #cookies = new Map()

  store(res) {
    for (const raw of res.headers.getSetCookie()) {
      const pair = raw.split(";", 1)[0]
      const eq = pair.indexOf("=")
      if (eq <= 0) continue
      this.#cookies.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim())
    }
  }

  get(name) {
    return this.#cookies.get(name)
  }

  header() {
    return [...this.#cookies].map(([k, v]) => `${k}=${v}`).join("; ")
  }
}

/** MARKET_PROXY / HTTPS_PROXY 解析成 axios 的 proxy 配置；无代理返回 null */
function proxyUrl() {
  const proxy = process.env.MARKET_PROXY ?? process.env.HTTPS_PROXY
  return proxy ? new URL(proxy) : null
}

/** 关掉自动重定向（重定向要逐跳吸收 Set-Cookie）+ 关掉非 2xx 抛异常（各步错误语义不同，由调用方报）。
 *  无代理时显式传 false：否则 axios 会去自动探测 HTTP_PROXY / NO_PROXY，行为随环境漂移 */
function createApi(proxy) {
  return axios.create({
    proxy: proxy ?? false,
    maxRedirects: 0,
    validateStatus: () => true,
  })
}

/** 响应体转文本，用于错误信息（登录页/探活失败时拿到的是 HTML，axios 已解析成对象时回退到 JSON） */
function bodyText(data) {
  if (data == null) return ""
  if (Buffer.isBuffer(data)) return data.toString("utf8")
  return typeof data === "string" ? data : JSON.stringify(data)
}

function checkHttp(res, what) {
  if (res.status >= 200 && res.status < 300) return
  throw new Error(`${what} 失败：HTTP ${res.status} ${bodyText(res.data).slice(0, 300)}`)
}

/** 手动跟随重定向，逐跳吸收 Set-Cookie（对齐 curl -c/-b 的 cookie jar 行为） */
async function requestWithJar(api, url, jar, config = {}, maxRedirects = 5) {
  let res = await api.request({ ...config, url })
  jar.store(res)
  let redirects = 0
  while (res.status >= 300 && res.status < 400) {
    if (++redirects > maxRedirects) throw new Error(`重定向过多：${url}`)
    const location = res.headers.get("location")
    if (!location) break
    url = new URL(location, url).toString()
    res = await api.request({
      ...config,
      url,
      headers: { ...config.headers, Cookie: jar.header() },
    })
    jar.store(res)
  }
  return res
}

/** ①GET /login 取 CSRF 令牌 → ②POST /login 登录（JSESSIONID 换新后从响应重读），返回最新 CSRF。
 *  服务端登录表单账号字段名为 email（邮箱即账号），不是 Spring Security 默认的 username */
async function login(api, base, { username, password }, jar) {
  const page = await requestWithJar(api, `${base}/login`, jar)
  checkHttp(page, "获取登录页")
  const csrf = jar.get("XSRF-TOKEN")
  if (!csrf) throw new Error("GET /login 未下发 XSRF-TOKEN Cookie，无法取得 CSRF 令牌")

  const form = new URLSearchParams({ email: username, password, _csrf: csrf })
  const res = await api.post(`${base}/login`, form, {
    headers: { Cookie: jar.header() },
  })
  jar.store(res)
  const location = res.headers.get("location") ?? ""
  if (location.includes("error")) {
    throw new Error(`登录失败：服务端重定向到 ${location}（账号或密码错误）`)
  }
  const ok = res.status >= 200 && res.status < 400
  if (!ok) {
    throw new Error(`登录失败：HTTP ${res.status} ${bodyText(res.data).slice(0, 200)}`)
  }
  if (!jar.get("JSESSIONID")) throw new Error("登录响应未带回 JSESSIONID，登录可能未成功")
  // 不跟随登录成功的重定向（/admin）：它会被安全层弹回匿名 /login，覆盖刚认证的会话；
  // 登录响应会清空 XSRF-TOKEN cookie，改 GET 站根路径为该认证会话刷新 CSRF 令牌
  await requestWithJar(api, `${base}/`, jar)
  return jar.get("XSRF-TOKEN") ?? csrf
}

/** ③POST /api/v1/characters/upload（multipart，头带 X-XSRF-TOKEN），成功返回角色 ID */
async function upload(api, base, filePath, { lang, description, tags }, csrf, jar) {
  const form = new FormData()
  form.append("file", new Blob([fs.readFileSync(filePath)]), path.basename(filePath))
  form.append("lang", lang)
  if (description) form.append("description", description)
  for (const tag of tags) form.append("tags", tag)
  const res = await api.post(`${base}/api/v1/characters/upload`, form, {
    headers: { Cookie: jar.header(), "X-XSRF-TOKEN": csrf },
  })
  // 非 JSON 响应（axios 解析失败时原样返回字符串）当没有业务字段处理
  const json = res.data && typeof res.data === "object" ? res.data : null
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`上传失败：HTTP ${res.status} ${json?.msg ?? ""}`)
  }
  if (json?.code !== 200) {
    throw new Error(`上传失败：${json?.msg ?? `响应缺少 code（HTTP ${res.status}）`}`)
  }
  return json.data
}

function splitTags(v) {
  return (v ?? "")
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/** 输入参数：`<package|stagingDir>` + 一组 flag */
function parseArgs() {
  const [, , input, ...rest] = process.argv
  if (!input) {
    fail(
      "用法：node .claude/skills/make-character/upload.js <package|stagingDir> [--env test|prod] [--lang <code>] [--description <text>] [--tag <tag>]... [--yes]"
    )
  }
  /** @type {{ input: string, env?: string, lang?: string, description?: string, tags: string[], yes?: boolean }} */
  const opts = { input, tags: [] }
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i]
    switch (a) {
      case "--env":
        opts.env = rest[++i]
        break
      case "--lang":
        opts.lang = rest[++i]
        break
      case "--description":
        opts.description = rest[++i]
        break
      case "--tag":
        opts.tags.push(rest[++i])
        break
      case "--yes":
        opts.yes = true
        break
      default:
        fail(`未知参数：${a}`)
    }
  }
  return opts
}

/**
 * 从输入解析出要上传的包路径：目录 → out/ 下唯一产物；文件 → 直接用。
 *
 * out/ 同时认 .zip 与 .tomochar（后者是 1.0 存量产物）：2026-09-26 起 pack.js 改出 .zip，
 * 但盘上已有的旧产物仍然可上传，不能因为改了后缀就把它们判成「没有产物」。
 */
function resolvePackage(input) {
  if (!fs.existsSync(input)) fail(`找不到路径：${input}`)
  if (fs.statSync(input).isDirectory()) {
    const outDir = path.join(input, "out")
    const packs = fs.existsSync(outDir)
      ? fs.readdirSync(outDir).filter((f) => /\.(zip|tomochar)$/i.test(f))
      : []
    if (packs.length === 0) fail(`out/ 下没有 .zip / .tomochar（先跑 pack.js）`)
    if (packs.length > 1)
      fail(`out/ 下有多个包：${packs.join("、")}（请直接指定文件路径）`)
    return path.join(outDir, packs[0])
  }
  if (!/\.(zip|tomochar)$/i.test(input)) fail(`只支持 .zip / .tomochar 角色包：${input}`)
  return input
}

/** 从打包产物反查 staging 目录，读 dialogue.md frontmatter 的角色级上传参数（lang/description/tags） */
function readDialogueMeta(filePath) {
  const dialoguePath = path.join(path.dirname(path.dirname(filePath)), "dialogue.md")
  if (!fs.existsSync(dialoguePath)) return null
  const { meta } = parseFrontmatter(fs.readFileSync(dialoguePath, "utf8"))
  return meta
}

/** 从输入路径向上找含 .env 的目录（repo 根），兜底 cwd */
function repoRoot(from) {
  let dir = path.resolve(from)
  for (;;) {
    if (fs.existsSync(path.join(dir, ".env")) || fs.existsSync(path.join(dir, ".env.defaults"))) return dir
    const parent = path.dirname(dir)
    if (parent === dir) return process.cwd()
    dir = parent
  }
}

/** 组装上传配置：环境二选一（--env）；lang/description/tags 仅取 dialogue.md frontmatter，CLI flag 临时覆盖 */
function loadConfig(opts, dialogueMeta) {
  const env = (opts.env ?? "test").toLowerCase()
  if (!["test", "prod"].includes(env)) fail(`未知环境：${opts.env}（可选 test / prod）`)
  const E = env.toUpperCase()
  const get = (k) => process.env[k]

  const base = (get(`MARKET_${E}_BASE_URL`) ?? "").replace(/\/+$/, "")
  const username = get(`MARKET_${E}_USERNAME`)
  const password = get(`MARKET_${E}_PASSWORD`)
  const lang = opts.lang ?? dialogueMeta?.lang
  const description = opts.description ?? dialogueMeta?.description ?? ""
  const tags = [...new Set([...opts.tags, ...splitTags(dialogueMeta?.tags)])]

  if (!base) fail(`缺少 MARKET_${E}_BASE_URL：请在 repo 根 .env.defaults 填写 ${env} 环境服务地址（或设同名环境变量）`)
  if (!username) fail(`缺少 MARKET_${E}_USERNAME：请在 .env 填写 ${env} 环境登录账号`)
  if (!password) fail(`缺少 MARKET_${E}_PASSWORD：请在 .env 填写 ${env} 环境登录密码`)
  if (!lang) fail(`缺少语言标签：请在 dialogue.md frontmatter 写 lang（步骤②），或用 --lang <code> 指定`)
  if (description.length > 200) fail(`简介超过 200 字（当前 ${description.length} 字）`)

  return { env, base, username, password, lang, description, tags }
}

async function main() {
  const opts = parseArgs()
  const filePath = resolvePackage(opts.input)
  loadEnv(repoRoot(filePath))

  const dialogueMeta = readDialogueMeta(filePath)
  const config = loadConfig(opts, dialogueMeta)
  if (config.env === "prod" && !opts.yes) {
    fail(
      `目标为生产环境 ${config.base}。生产上传是外向动作（创建角色记录待审核上架），确认后加 --yes 重跑`
    )
  }

  const proxy = proxyUrl()
  if (proxy) console.log(`[upload] 使用代理：${proxy.href}`)
  console.log(`[upload] 上传 ${path.basename(filePath)} → ${config.base}（${config.env}）`)

  const api = createApi(proxy)
  const jar = new CookieJar()
  const csrf = await login(api, config.base, config, jar)
  const id = await upload(api, config.base, filePath, config, csrf, jar)
  console.log(`[upload] ✓ 上传成功，角色 ID=${id}（status=0 待管理员审核，上架后进入公开列表）`)
}

// 同步校验阶段（parseArgs/loadConfig 等）的 fail() 用 process.exit(1)，此时尚无网络句柄；
// 网络阶段（login/upload）失败走这里：exitCode + 自然退出，不强退打断在途 socket
main().then(
  () => {},
  (err) => {
    console.error(`[upload] ${err.message}`)
    process.exitCode = 1
  }
)
