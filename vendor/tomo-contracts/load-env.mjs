// 本文件由 scripts/sync-tomo-contracts.mjs 从 tomo 仓库同步生成。
// 来源：tomo@a2a56ca scripts/load-env.mjs
// 刷新：node scripts/sync-tomo-contracts.mjs
/**
 * load-env.mjs — .env 读取（发版脚本与 make-character skill 共用）。
 *
 * 优先级：真实环境变量 > repo 根 .env > .env.defaults（不覆盖已存在的环境变量）：
 *   - .env.defaults：无隐私固定默认值（baseUrl 等）
 *   - .env：敏感凭据 / 本机值（OSS key、FISH_AUDIO_API_KEY、账号密码、代理）
 * 两个文件都入库（私人库），换机器 clone 下来即可发版；转公开前必须先轮换其中所有 key。
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

export function loadEnv(repoRoot) {
  /** @type {Record<string, string>} */
  const values = {}
  for (const file of [".env.defaults", ".env"]) {
    const envPath = path.join(repoRoot, file)
    if (!fs.existsSync(envPath)) continue
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim())
      if (m) values[m[1]] = m[2].trim()
    }
  }
  for (const [k, v] of Object.entries(values)) {
    if (process.env[k] === undefined) process.env[k] = v
  }
}

/** repo 根（本文件在 scripts/ 下），不依赖 cwd——脚本从任意目录调用都能找到 .env */
export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
