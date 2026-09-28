// 本文件由 scripts/sync-tomo-contracts.mjs 从 tomo 仓库同步生成。
// 来源：tomo@a2a56ca src/shared/types.ts
// 刷新：node scripts/sync-tomo-contracts.mjs
/**
 * 主进程与渲染进程共享的契约类型。
 * 渲染进程（src/lib/types.ts）从这里 re-export，避免两处漂移。
 *
 * 事件语义层（抽象事件目录 / 各 Agent 原生映射 / 两通道默认层）已迁到 src/shared/events.ts，
 * 本文件只保留 Agent 身份与数据模型。两文件互引均为 `import type`，编译期擦除、无运行时环。
 */

import type { AbstractEvent } from "./events"
import type { PetdexSource } from "./tomo-res-url"

// ---------------------------------------------------------------- Agent

/** 已知的 Agent 适配器 id */
export type AgentId =
  | "claude-code"
  | "codex"
  | "opencode"
  | "cursor"
  | "kimi-code"
  | "copilot"

export const AGENT_IDS: AgentId[] = [
  "claude-code",
  "codex",
  "opencode",
  "cursor",
  "kimi-code",
  "copilot",
]

export function isAgentId(v: unknown): v is AgentId {
  return typeof v === "string" && (AGENT_IDS as string[]).includes(v)
}

export const AGENT_META: Record<AgentId, { label: string }> = {
  "claude-code": { label: "Claude Code" },
  codex: { label: "Codex" },
  opencode: { label: "opencode" },
  cursor: { label: "Cursor" },
  "kimi-code": { label: "Kimi Code" },
  copilot: { label: "Copilot" },
}

// ---------------------------------------------------------------- 数据模型

/** 角色：挂在某个 Agent 下的一整套事件音频绑定的命名容器 */
export interface CharacterInfo {
  id: number
  agent: AgentId
  name: string
  createdAt: string
  /** 身体图集 URL（`tomo-res://`，带内容指纹）；**没有身体 → null**（桌面上不出现、界面显示「还没有宠物」） */
  petSheetUrl: string | null
  /** 有没有身体（= `petSheetUrl !== null`；UI 读它比反复判空更直白） */
  hasBody: boolean
}

/**
 * 「已安装的宠物」列表项：本机 PetDex 目录扫描的结果（见 `PetdexLibraryService`）。
 * **扫描不做任何合格性预判**——读不出 pet.json 的目录照样在列（名字退回 slug），
 * 点它时才由 `extractBodyFromDir` 报出真正的原因。
 */
export interface InstalledPetView {
  /** 来源根：`petdex` = ~/.petdex/pets，`codex` = ${CODEX_HOME:-~/.codex}/pets（两处都列，不去重） */
  source: PetdexSource
  /** 目录名（PetDex 的 slug）——回传给主进程时用它定位，渲染进程永远不传路径 */
  slug: string
  /** pet.json 的 name → displayName → slug；读不出来时退回 slug */
  name: string
  /** 图集 URL（`tomo-res://petdex/...`，带内容指纹）；目录里没有图集时 null（缩略图退成首字占位） */
  sheetUrl: string | null
}

/** 一条音频绑定（定位与展示解耦）。所属 Agent 由角色的 agent 决定，不在此冗余 */
export interface AudioBinding {
  /** 绑定记录 id（event_audio.id） */
  id: number
  characterId: number
  /** 抽象事件名（16 词表之一，见 src/shared/events.ts） */
  event: AbstractEvent
  /** 文件定位符：内嵌=角色目录内相对路径（audio/<uuid>.<ext>）；外链=绝对路径 */
  path: string
  /** UI 展示名（导入=包内真实文件名，手动=源文件 basename），只读 */
  name: string
  /** 源文件是否缺失（内嵌/外链统一 stat 检测；缺失时 UI 标红、播放报错） */
  missing: boolean
  /** 时长（秒）。主进程无法解码音频，由渲染进程探测后本地缓存，这里恒为 null */
  durationSec: number | null
}

/** 暴露给 UI 的守卫子集；内部还有 queueMax/noInterrupt 用默认值 */
export interface GuardSettings {
  /** 同事件防抖窗口（秒） */
  debounceSec: number
  /** 播放间隔（秒）：语音（含队列）播完后起算，窗口内该 Agent 的所有事件直接丢弃；0 = 不限制 */
  cooldownSec: number
  /** 全局音量 0~1 */
  volume: number
  /**
   * 静音：守卫的第一道门（`EventProcessor` 在防抖之前判它），命中的事件结局记作 `"muted"`。
   * 它独立于 `volume`——静音时音量滑块的值原样保留，取消静音即恢复。
   */
  muted: boolean
}

/** 收到的事件的最终结局（运行状态页事件流水用） */
export type EventOutcome =
  | { kind: "played"; clipName: string }
  | { kind: "queued" }
  | {
      kind: "skipped"
      reason: "debounce" | "cooldown" | "no-audio" | "muted" | "queue-full"
    }

export interface RecentEvent {
  /** ISO 时间戳 */
  at: string
  agent: AgentId
  event: AbstractEvent
  outcome: EventOutcome
}

/** 运行时仪表盘数据（内存态，重启清空）。只记当前 Agent 的事件——非当前 Agent 的在门控处就丢弃了 */
export interface RuntimeInfo {
  /** hook 服务监听端口 */
  port: number
  playedToday: number
  /** 最近一次收到的事件（无论结局） */
  lastEvent: { at: string; agent: AgentId; event: AbstractEvent } | null
  /** 最近事件流水，新的在前，最多 20 条 */
  recentEvents: RecentEvent[]
}

// ---------------------------------------------------------------- 软件更新

/**
 * 更新状态机（主进程 UpdateService 持有，经 IPC 推送渲染进程）：
 *   idle → checking → available → downloading → downloaded
 * 任何环节失败 → error；检查无更新 → 回 idle。
 */
export type UpdateStatus =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "available"; version: string }
  | { state: "downloading"; percent: number }
  | { state: "downloaded"; version: string }
  | { state: "error"; message: string }

/** 更新视图：设置页「软件更新」卡片 + 更新弹窗共用 */
export interface UpdateView {
  /** 当前运行版本（app.getVersion()） */
  currentVersion: string
  /** 闸门拦截的强制更新：弹窗不可关闭、无「以后再说」，错误走主进程原生弹窗 */
  forced: boolean
  status: UpdateStatus
}

// ---------------------------------------------------------------- 页面视图

/**
 * 状态同步：静态数据由各页面挂载时自治拉取，只有 runtime 走推送。
 * 角色详情页按 characterId 显式读写（与激活解耦）。主进程只存两个全局指针（都在 settings 表）：
 * `activeCharacter:<agent>` 与 `currentAgent`。hook 写入由角色生命周期驱动，tomo 不回读 Agent 配置。
 */
export interface BindingsView {
  /** 详情页目标角色（getBindingsView 查不到角色时整个视图返回 null） */
  character: CharacterInfo
  /** 该角色是否其 Agent 的激活角色（详情页「使用中」徽章用） */
  active: boolean
  /** 全部绑定；未出现在这里的抽象事件 = 该角色没配音频 */
  bindings: AudioBinding[]
}

/** 角色管理页视图：该 Agent 的角色列表 + 激活指针 */
export interface CharactersView {
  characters: CharacterInfo[]
  activeId: number | null
}

export interface SettingsView {
  guard: GuardSettings
  /** 当前 Agent：只服务它下面的激活角色（侧边栏切换器读写） */
  currentAgent: AgentId
  /** 桌面宠物总开关（全局）。托盘与设置页两个入口读写同一个键 */
  petVisible: boolean
}

/** 内部完整守卫参数（DB 里按 key 分散存储） */
export interface GuardInternal {
  muted: boolean
  dedupWindowSec: number
  /** 播放间隔（秒）：语音（含队列）播完后起算；0 = 不限制 */
  cooldownSec: number
  queueMax: number
  noInterrupt: boolean
  volume: number
}

export const DEFAULT_GUARD: GuardInternal = {
  muted: false,
  dedupWindowSec: 5,
  cooldownSec: 10,
  queueMax: 2,
  noInterrupt: true,
  volume: 0.8,
}

/**
 * hook 转发器 POST 到本地服务的事件信封。
 * `event` 已是**抽象事件名**——转发器按烘焙在源码里的 NATIVE_TO_ABSTRACT 翻译后才投递，
 * Runtime 全链路只见抽象名（契约见 docs/contracts/事件目录契约.md §四）。
 */
export interface HookEnvelope {
  agent: AgentId
  event: AbstractEvent
  cwd: string | null
  at?: string
  raw?: unknown
}

/** window.tomo 的 IPC 接口（preload 实现，渲染进程调用）。写操作返回对应切片 */
export interface TomoApi {
  /** 角色详情视图（全部绑定）；角色不存在返回 null */
  getBindingsView: (characterId: number) => Promise<BindingsView | null>
  getCharactersView: (agent: AgentId) => Promise<CharactersView>
  getSettingsView: () => Promise<SettingsView>
  /** 运行状态页仪表盘（端口/今日播放/事件流水） */
  getRuntimeView: () => Promise<RuntimeInfo>
  /** 添加音频到指定角色的指定事件（弹文件对话框；用户取消返回当前绑定列表） */
  addAudio: (characterId: number, event: AbstractEvent) => Promise<AudioBinding[]>
  removeAudio: (bindingId: number) => Promise<AudioBinding[]>
  /** 改绑定展示名（纯元数据；空名/超长由后端拒绝，返回更新后的绑定列表） */
  renameAudio: (bindingId: number, name: string) => Promise<AudioBinding[]>
  preview: (bindingId: number) => Promise<void>
  setGuard: (patch: Partial<GuardSettings>) => Promise<GuardSettings>
  /** 切换当前 Agent：此后宠物/语音只服务它下面的激活角色（不重写任何 hook） */
  setCurrentAgent: (agent: AgentId) => Promise<SettingsView>
  /** 打开指定 Agent 的 hook 配置文件所在目录并选中该文件；Agent 未接入抛错 */
  openConfigFolder: (agent: AgentId) => Promise<void>
  /** 打开指定角色的私有目录（userData/characters/<id>）；不存在则先创建 */
  openCharacterFolder: (characterId: number) => Promise<void>
  /** 角色管理。写操作返回最新 CharactersView */
  createCharacter: (agent: AgentId, name: string) => Promise<CharactersView>
  renameCharacter: (characterId: number, name: string) => Promise<CharactersView>
  deleteCharacter: (characterId: number) => Promise<CharactersView>
  copyCharacter: (characterId: number) => Promise<CharactersView>
  /** 激活角色（顺带装该 Agent 的 hook）；characterId 为 null = 不使用角色（剥离全部 tomo hook） */
  activateCharacter: (agent: AgentId, characterId: number | null) => Promise<CharactersView>
  /**
   * 更换角色身体：从宠物包（.zip / 1.0 存量 .tomochar / PetDex zip）提取身体段覆盖角色目录，
   * 音频绑定与激活状态一概不动。弹文件对话框，用户取消返回 null。
   */
  setCharacterBody: (characterId: number) => Promise<CharactersView | null>
  /**
   * 本机已安装的 PetDex 宠物（扫 ~/.petdex/pets 与 ${CODEX_HOME:-~/.codex}/pets）。
   * 每次调用都重新扫——用户是**在 tomo 之外**跑 `npx petdex install` 的，
   * 不重扫就看不见刚装的那只。
   */
  listInstalledPets: () => Promise<InstalledPetView[]>
  /**
   * 用某只已安装宠物的身体段覆盖角色（「添加宠物」弹窗里点一行）。
   * 只传 (source, slug)：**渲染进程永远不传路径**，主进程自己拼、自己判目录是否安全。
   */
  setCharacterBodyFromPet: (
    characterId: number,
    source: PetdexSource,
    slug: string,
  ) => Promise<CharactersView>
  /** 打开 PetDex 宠物画廊（系统浏览器；URL 主进程写死，见 src/shared/urls.ts） */
  openPetdexGallery: () => Promise<void>
  /**
   * 桌面宠物总开关（全局，落库）。关掉后宠物窗口消失，但语音照常——
   * 与「当前 Agent 没有激活角色 / 角色没有身体」是三道**独立**的门，任一不成立就没有宠物。
   */
  setPetVisible: (visible: boolean) => Promise<SettingsView>
  /**
   * 忘掉宠物上次的停靠位置，把它搬回默认的右下角。宠物被拖到屏幕外（换了显示器、
   * 拔了外接屏）时唯一的回头路——此时它仍在运行、仍在播动画，只是不在任何看得见的地方。
   */
  resetPetPosition: () => Promise<void>
  /** 导出角色为 .zip（弹保存对话框；完整三件校验——身体 + 8 个可绑事件各至少一条音频，缺任一拒绝；用户取消返回 false） */
  exportCharacter: (characterId: number) => Promise<boolean>
  /** 导入 .zip（含 1.0 存量 .tomochar）/ PetDex zip（弹多选对话框；用户取消返回 null；单个失败不中断其余，失败信息汇入 Error.message 抛出） */
  importCharacters: (agent: AgentId) => Promise<CharactersView | null>
  /** 从内存数据导入角色包（角色库下载场景；校验失败抛错） */
  importCharacterPackage: (agent: AgentId, data: Uint8Array) => Promise<CharactersView>
  /** 打开上传角色包落地页（系统浏览器；URL 主进程写死，见 src/shared/urls.ts） */
  openUploadPage: () => Promise<void>
  /** 订阅运行时推送（事件到达/播放开始结束）；返回退订函数 */
  onRuntimeChanged: (cb: (runtime: RuntimeInfo) => void) => () => void
  /** 订阅宠物身体渲染失败（宠物窗口已留空，原因在此回报）；返回退订函数 */
  onPetError: (cb: (message: string) => void) => () => void
  /**
   * 订阅设置项推送（整份 SettingsView）。托盘是设置页之外的第二个入口，
   * 它改静音/宠物开关时设置页必须跟着走，否则两处显示的状态会分裂。
   */
  onSettingsChanged: (cb: (view: SettingsView) => void) => () => void
  /** 更新视图（当前版本 + 状态机）；dev 模式更新系统禁用，返回 null */
  getUpdateView: () => Promise<UpdateView | null>
  /** 手动检查更新（设置页按钮）；检查失败抛错（调用方 toast），成功返回最新视图 */
  checkUpdate: () => Promise<UpdateView | null>
  /** 下载已发现的更新（仅 available 状态有效，其余状态为空操作） */
  downloadUpdate: () => Promise<void>
  /** 重启并安装已下载的更新（仅 downloaded 状态有效） */
  quitAndInstallUpdate: () => Promise<void>
  /** 订阅更新状态推送；返回退订函数 */
  onUpdateStatus: (cb: (view: UpdateView) => void) => () => void
}
