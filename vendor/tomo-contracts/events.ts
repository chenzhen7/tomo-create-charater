// 本文件由 scripts/sync-tomo-contracts.mjs 从 tomo 仓库同步生成。
// 来源：tomo@bf49878 src/shared/events.ts
// 刷新：node scripts/sync-tomo-contracts.mjs
/**
 * 事件语义层的唯一事实源（契约：docs/contracts/事件目录契约.md）。
 *
 * 三层结构：
 *   原生事件层（各 Agent 官方名字） → 抽象事件层（本文件的 16 词表） → 通道默认层（语音 8 / 宠物 16）
 *
 * 三条护栏：
 *   1. 抽象层只做分类学，不做策略——策略分属两条通道各自的契约（语音：绑定+守卫；宠物：事件状态映射契约）
 *   2. 同 Agent 内 native → abstract 单射——由 NATIVE_TO_ABSTRACT 的 Record 形状在结构上保证（键唯一）
 *   3. 写不进 hook 的原生事件 = 不存在——不映射就不进 NATIVE_TO_ABSTRACT，结构上不可能被写进 hook 配置
 */

import type { AgentId } from "./types"

// ---------------------------------------------------------------- 抽象事件目录

/**
 * 抽象事件目录（16 个）：tomo 自己的 kebab-case 词表，Agent 无关。
 * 命名纪律：不出现任何一家 Agent 的原生词（如 `stop`）——抽象层不该被单一家族绑架。
 */
export const ABSTRACT_EVENTS = [
  "session-start",
  "session-end",
  "prompt-submit",
  "post-tool-use",
  "post-tool-use-failure",
  "permission-request",
  "turn-complete",
  "turn-failure",
  "subagent-start",
  "subagent-stop",
  "pre-compact",
  "post-compact",
  "file-edited",
  "task-created",
  "task-completed",
  "session-error",
] as const

export type AbstractEvent = (typeof ABSTRACT_EVENTS)[number]

export function isAbstractEvent(v: unknown): v is AbstractEvent {
  return typeof v === "string" && (ABSTRACT_EVENTS as readonly string[]).includes(v)
}

/** 事件 → UI 展示元数据。键以 AbstractEvent 收窄：加事件漏配元数据 → 编译报错 */
export interface AbstractEventMeta {
  label: string
  description: string
}

export const ABSTRACT_EVENT_META: Record<AbstractEvent, AbstractEventMeta> = {
  "session-start": { label: "会话开始", description: "Agent 会话启动或恢复时播放" },
  "session-end": { label: "会话结束", description: "Agent 会话终止时播放" },
  "prompt-submit": {
    label: "提交指令",
    description: "你提交 prompt、Agent 开始处理时播放",
  },
  "post-tool-use": {
    label: "工具调用后",
    description: "每次工具调用成功后播放（高频）",
  },
  "post-tool-use-failure": {
    label: "工具调用失败",
    description: "工具执行报错、但本轮还没结束时播放",
  },
  "permission-request": {
    label: "请求权限",
    description: "Agent 请求授权、等你确认时播放",
  },
  "turn-complete": { label: "回复完成", description: "Agent 完成一轮回复时播放" },
  "turn-failure": { label: "回复失败", description: "本轮因错误结束时播放" },
  "subagent-start": { label: "子任务开始", description: "子代理（Task）启动时播放" },
  "subagent-stop": { label: "子任务完成", description: "子代理（Task）结束时播放" },
  "pre-compact": { label: "压缩前", description: "上下文压缩之前播放" },
  "post-compact": { label: "压缩后", description: "上下文压缩之后播放" },
  "file-edited": { label: "文件编辑", description: "Agent 编辑文件时播放（高频）" },
  "task-created": { label: "任务创建", description: "新任务创建时播放" },
  "task-completed": { label: "任务完成", description: "任务被标记为完成时播放" },
  "session-error": { label: "会话出错", description: "会话级错误时播放" },
}

// ---------------------------------------------------------------- 各 Agent 原生映射

/**
 * 原生事件名 → 抽象事件名。**接入新 Agent 只需在这里加一段**，两条通道自动获得完整支持。
 * 不列出某原生事件 = 不接入它（裁剪理由写在契约文档 §三的逐家表格里）。
 *
 * 刻意全家族统一的排除项：
 * - `PreToolUse` 家族：与 `post-tool-use` 状态动作相同且后者随后必到，近乎冗余；
 *   且 Copilot 的 preToolUse 命令 hook 出错 fail-closed（会拒绝工具调用），旁路原则不容许
 * - `Notification` 家族：语义太通用（等待输入/权限/空闲混杂），跨 Agent 无稳定对应
 * - Kimi `Notification` 同理；Copilot `ErrorOccurred` / `userPromptTransformed` 无陪伴语义
 */
export const NATIVE_TO_ABSTRACT: Record<AgentId, Record<string, AbstractEvent>> = {
  "claude-code": {
    SessionStart: "session-start",
    SessionEnd: "session-end",
    UserPromptSubmit: "prompt-submit",
    PostToolUse: "post-tool-use",
    PostToolUseFailure: "post-tool-use-failure",
    PermissionRequest: "permission-request",
    Stop: "turn-complete",
    StopFailure: "turn-failure",
    SubagentStart: "subagent-start",
    SubagentStop: "subagent-stop",
    PreCompact: "pre-compact",
    PostCompact: "post-compact",
    TaskCreated: "task-created",
    TaskCompleted: "task-completed",
    // 不映射：PreToolUse / Notification / WorktreeCreate / FileChanged
  },
  codex: {
    SessionStart: "session-start",
    SessionEnd: "session-end",
    UserPromptSubmit: "prompt-submit",
    PostToolUse: "post-tool-use",
    PermissionRequest: "permission-request",
    Stop: "turn-complete",
    SubagentStart: "subagent-start",
    SubagentStop: "subagent-stop",
    PreCompact: "pre-compact",
    PostCompact: "post-compact",
    // Codex 没有工具失败事件，也没有回合失败事件——post-tool-use-failure / turn-failure 够不到
  },
  opencode: {
    "session.created": "session-start",
    "session.idle": "turn-complete",
    "session.error": "session-error",
    "session.compacted": "post-compact",
    "tool.execute.after": "post-tool-use",
    "permission.asked": "permission-request",
    "file.edited": "file-edited",
    // 不映射：tool.execute.before（同 pre-tool-use 理由）、lsp.updated / todo.updated 等无陪伴语义
  },
  cursor: {
    sessionStart: "session-start",
    sessionEnd: "session-end",
    beforeSubmitPrompt: "prompt-submit",
    postToolUse: "post-tool-use",
    postToolUseFailure: "post-tool-use-failure",
    subagentStart: "subagent-start",
    subagentStop: "subagent-stop",
    preCompact: "pre-compact",
    stop: "turn-complete",
    afterFileEdit: "file-edited",
    // 不映射：preToolUse、Tab hooks（行内补全）、workspaceOpen（非陪伴场景）
  },
  "kimi-code": {
    SessionStart: "session-start",
    SessionEnd: "session-end",
    UserPromptSubmit: "prompt-submit",
    PostToolUse: "post-tool-use",
    PostToolUseFailure: "post-tool-use-failure",
    PermissionRequest: "permission-request",
    Stop: "turn-complete",
    StopFailure: "turn-failure",
    SubagentStart: "subagent-start",
    SubagentStop: "subagent-stop",
    PreCompact: "pre-compact",
    PostCompact: "post-compact",
    // 不映射：PreToolUse / Notification
  },
  copilot: {
    SessionStart: "session-start",
    SessionEnd: "session-end",
    UserPromptSubmit: "prompt-submit",
    PostToolUse: "post-tool-use",
    PostToolUseFailure: "post-tool-use-failure",
    PermissionRequest: "permission-request",
    Stop: "turn-complete",
    SubagentStart: "subagent-start",
    SubagentStop: "subagent-stop",
    PreCompact: "pre-compact",
    // 不映射：PreToolUse（fail-closed）、ErrorOccurred / Notification / userPromptTransformed
  },
}

/** 原生事件名 → 抽象事件名；未映射的原生事件返回 null（转发器据此不投递） */
export function toAbstract(agent: AgentId, native: unknown): AbstractEvent | null {
  if (typeof native !== "string") return null
  return NATIVE_TO_ABSTRACT[agent][native] ?? null
}

/** 该 Agent 能否触达这个抽象事件（绑定页标灰依据：够不到的绑定保留但不可编辑） */
export function isReachable(agent: AgentId, event: AbstractEvent): boolean {
  return Object.values(NATIVE_TO_ABSTRACT[agent]).includes(event)
}

// ---------------------------------------------------------------- 两条通道的默认层

/**
 * **语音通道可绑的事件（8 个）——白名单，不是默认分组。**
 *
 * 入选依据：每会话/每轮最多触发一次、陪伴感强。高频事件（`post-tool-use` / `file-edited` /
 * `task-created` …）刻意**不可绑**——它们只是宠物状态的驱动源，不进语音。
 *
 * 这张表同时是绑定页列项（`event-binding-list.tsx`）与包内 `manifest.events[].event` 的
 * 校验依据（`CharacterArchiveService`，服务端上传校验同表）；导出与上架要求这 8 个**各至少
 * 有一条音频绑定**（`missingVoiceEvents`），导入侧不受此约束。宠物通道不受影响，仍消费全部 16 个。
 */
export const VOICE_EVENTS = [
  "session-start",
  "session-end",
  "prompt-submit",
  "turn-complete",
  "turn-failure",
  "permission-request",
  "post-tool-use-failure",
  "task-completed",
] as const satisfies readonly AbstractEvent[]

/** 宠物通道默认层：**全部**抽象事件（视觉是弱打扰的无条件镜像，事件越多状态越准，且不可配置） */
export const PET_EVENTS: readonly AbstractEvent[] = ABSTRACT_EVENTS

/**
 * 各 Agent 该装哪些 hook + 每个 hook 怎么翻译 = **两条通道需求的反查结果**，不是手写清单
 * （收窄宠物层时它会自动跟着收窄）。**hook 集与角色无关**——角色只决定这些事件里哪些有音频，
 * 因此改绑定永不重写 Agent 配置。
 *
 * 这张表也是**投递侧烘焙的原料**：转发器 / opencode 插件把对应那一行烤进源码，
 * 在 Agent 侧完成翻译后才 POST（见契约 §四）。
 */
export const HOOK_EVENT_MAP: Record<AgentId, Record<string, AbstractEvent>> = (() => {
  const needed = new Set<AbstractEvent>([...VOICE_EVENTS, ...PET_EVENTS])
  return Object.fromEntries(
    (Object.keys(NATIVE_TO_ABSTRACT) as AgentId[]).map((agent) => [
      agent,
      Object.fromEntries(
        Object.entries(NATIVE_TO_ABSTRACT[agent]).filter(([, abstract]) =>
          needed.has(abstract),
        ),
      ),
    ]),
  ) as Record<AgentId, Record<string, AbstractEvent>>
})()

/** 各 Agent 写入 hook 配置的原生事件名 = HOOK_EVENT_MAP 的键（顺序即写入顺序） */
export const HOOK_EVENTS: Record<AgentId, readonly string[]> = (() => {
  const table = {} as Record<AgentId, readonly string[]>
  for (const agent of Object.keys(HOOK_EVENT_MAP) as AgentId[]) {
    table[agent] = Object.keys(HOOK_EVENT_MAP[agent])
  }
  return table
})()

/** 可绑语音的抽象事件（8 个之一）。包内 `manifest.events[].event` 就是它 */
export type BindableEvent = (typeof VOICE_EVENTS)[number]

/** 该事件能不能绑语音（唯一的判定入口，别在别处再写一遍 `includes`） */
export function isBindable(v: unknown): v is BindableEvent {
  return typeof v === "string" && (VOICE_EVENTS as readonly string[]).includes(v)
}

/**
 * 导出门槛：**8 个可绑事件必须各自至少有一条音频绑定**，缺一个都不给导出/上架——
 * 分享出去的包要在任何 Agent 上都能开口，缺哪个事件就在哪个场景哑掉。
 *
 * 返回缺席的那些（按 VOICE_EVENTS 顺序），空数组 = 配满。唯一判定入口：导出
 * （`CharacterArchiveService`）、详情页前置检查、make-character 的 `pack.js` 共用它，
 * 别在别处再写一遍差集。
 */
export function missingVoiceEvents(bound: Iterable<string>): BindableEvent[] {
  const set = new Set(bound)
  return VOICE_EVENTS.filter((e) => !set.has(e))
}

/** 取事件展示元数据；未知事件回退为原名展示（不静默丢事件） */
export function eventMeta(event: string): AbstractEventMeta {
  return ABSTRACT_EVENT_META[event as AbstractEvent] ?? { label: event, description: "" }
}
