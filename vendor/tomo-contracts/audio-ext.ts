// 本文件由 scripts/sync-tomo-contracts.mjs 从 tomo 仓库同步生成。
// 来源：tomo@bf49878 src/shared/audio-ext.ts
// 刷新：node scripts/sync-tomo-contracts.mjs
/**
 * 允许导入/绑定的音频扩展名白名单（唯一来源）。
 * 主进程两处消费：文件对话框过滤（ipc.ts）与角色包导入校验（CharacterArchiveService）。
 */
export const AUDIO_EXT: string[] = [
  "mp3",
  "wav",
  "ogg",
  "m4a",
  "flac",
  "aac",
  "opus",
  "webm",
]

/**
 * 展示名默认值：仅已知音频扩展名才去后缀（导入/手动添加统一）。
 * 不用 lastIndexOf(".") 盲剥——展示名允许含点（如用户自改的「台词.ver2」）。
 */
export function audioDisplayName(fileName: string): string {
  const i = fileName.lastIndexOf(".")
  if (i <= 0) return fileName
  const ext = fileName.slice(i + 1).toLowerCase()
  return AUDIO_EXT.includes(ext) ? fileName.slice(0, i) : fileName
}