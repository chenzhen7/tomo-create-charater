// 本文件由 scripts/sync-tomo-contracts.mjs 从 tomo 仓库同步生成。
// 来源：tomo@bf49878 src/shared/tomo-res-url.ts
// 刷新：node scripts/sync-tomo-contracts.mjs
/**
 * tomo-res:// URL 的解析与拼接（契约的唯一来源）。
 *
 * 两个 host，各代表一个**资源根**：
 * - `tomo-res://char/<角色id>/<角色目录内相对路径>`（相对路径经 encodeURIComponent 后可能含 %2F）
 * - `tomo-res://petdex/<来源>/<slug>/<宠物目录内相对路径>`
 *
 * 名字是 tomo-res 而非 tomo-audio：这个协议的本质是**本地资产的文件访问**，
 * 音频只是第一个消费者（2.0 起图集与头像同样走它）。别再为新的资产另开协议——
 * petdex 那一路是给协议**加了一个根**，不是新协议。
 *
 * 两路的宽松度不同，这是刻意的：
 * - `char` 的 rel **允许绝对路径**（音频外链按 DB 引用白名单放行，见 CharacterFileProtocol）
 * - `petdex` 的 rel **只允许相对路径**——那些目录是用户的下载目录，不该成为读任意文件的跳板
 *
 * ⚠️ 历史教训：host 曾用纯数字（tomo-audio://<id>/...），Chromium 标准 URL 解析器会把
 * 纯数字 host 规范化为 IPv4 点分形式（5 → 0.0.0.5），导致 Number(hostname)=NaN → 400。
 * 因此 id 必须放 path、host 必须固定字母，禁止再回到纯数字 host。
 */

/** PetDex 宠物在本机的两个安装根（`npx petdex install` 两处都写；`${CODEX_HOME}/pets` 是生态公约数） */
export const PETDEX_SOURCES = ["petdex", "codex"] as const
export type PetdexSource = (typeof PETDEX_SOURCES)[number]

/**
 * 来源的展示标签。写**路径**而不是"官方/Codex"这类说法：用户能拿它到自己的文件管理器里
 * 对上号——「列表里这两只为什么一模一样」的答案就在路径里（同一只宠物被 CLI 写了两处）。
 */
export const PETDEX_SOURCE_LABEL: Record<PetdexSource, string> = {
  petdex: "~/.petdex",
  codex: "~/.codex",
}

export function isPetdexSource(v: unknown): v is PetdexSource {
  return typeof v === "string" && (PETDEX_SOURCES as readonly string[]).includes(v)
}

/** 解析结果：两个资源根各一支，`kind` 是判别式（协议处理器据此分派） */
export type TomoResTarget =
  | { kind: "char"; characterId: number; rel: string }
  | { kind: "petdex"; source: PetdexSource; slug: string; rel: string }

export function parseTomoResUrl(urlString: string): TomoResTarget | null {
  let url: URL
  try {
    url = new URL(urlString)
  } catch {
    return null
  }
  let segments: string[]
  try {
    segments = decodeURIComponent(url.pathname.slice(1)).split("/")
  } catch {
    return null
  }

  if (url.hostname === "char") {
    const characterId = Number(segments[0])
    const rel = segments.slice(1).join("/")
    if (!Number.isInteger(characterId) || characterId <= 0 || rel.length === 0) return null
    return { kind: "char", characterId, rel }
  }

  if (url.hostname === "petdex") {
    const source = segments[0]
    const slug = segments[1]
    const rel = segments.slice(2).join("/")
    // slug 必须是**单段**且不含穿越：它是目录名，多一段就意味着有人想拿它当路径用
    if (!isPetdexSource(source) || !isSafeSlug(slug) || rel.length === 0) return null
    return { kind: "petdex", source, slug, rel }
  }

  return null
}

/**
 * slug 的合法性 = 「可以安全地当作一个目录名」。
 * readdir 出来的名字本就不含分隔符，但本函数的输入来自 URL 字符串，必须自己判。
 */
export function isSafeSlug(slug: unknown): slug is string {
  return (
    typeof slug === "string" &&
    slug.length > 0 &&
    slug !== "." &&
    slug !== ".." &&
    !slug.includes("/") &&
    !slug.includes("\\")
  )
}

/** 拼 tomo-res://char/<id>/<相对路径>；rel 需自行 encodeURIComponent（含 / 时应编码为 %2F） */
export function tomoResUrl(characterId: number, rel: string): string {
  return `tomo-res://char/${characterId}/${rel}`
}

/** 拼 tomo-res://petdex/<来源>/<slug>/<相对路径>；rel 需自行 encodeURIComponent */
export function petdexResUrl(source: PetdexSource, slug: string, rel: string): string {
  return `tomo-res://petdex/${source}/${encodeURIComponent(slug)}/${rel}`
}
