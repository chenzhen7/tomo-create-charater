# CLAUDE.md

---

## 项目概述

tomo 的**制作仓库**：把二次元角色做成可导入的角色包（台词语音 + 九态身体段），上传到 tomo 角色库市场。

| 仓库 | 职责 |
|------|------|
| **tomo-create-charater**（本仓库） | 角色与宠物制作：人设调研 → 台词 → TTS 合成 → 身体段生成 → 打包 → 上传 |
| **tomo**（`G:\Study_Data\VSCode\tomo`） | 桌宠应用本体：导入导出角色包、播放、市场客户端、软件更新。**不参与制作** |

两仓库之间只有一条连接：[vendor/tomo-contracts](vendor/tomo-contracts) 下的契约快照（见下）。

---

## 目录结构

```text
characters/                      # 制作目录：一个角色一个子目录 + 台账
├── roster.md                    # 角色清单与制作状态追踪表
└── <角色名>/
    ├── dialogue.md              # 台词表 + 元信息（frontmatter），人机共同编辑的核心文件
    ├── audio/                   # tts.js 生成的语音（<事件>-<序号>.mp3）
    ├── tachie.png               # 官方立绘（美术参考）
    ├── tachie2.png              # 第二参考图
    ├── pet.json                 # 身体段元数据（PetDex 规范）
    ├── spritesheet.webp         # 身体段图集（8 列 × 9 状态行，192×208/帧）
    └── out/<角色名>.zip         # pack.js 的最终产物

output/                          # 生成草稿（不进 git）
├── hatch-pet/<pet>/             # hatch-pet 的整条 run：references / prompts / generated / frames / decoded / final / qa
└── imagegen/                    # 单张图生成的一次性产物

vendor/tomo-contracts/           # 从 tomo 同步来的契约快照（见「契约同步」）
scripts/sync-tomo-contracts.mjs  # 快照的刷新脚本
.claude/skills/                  # make-character（本仓库正本）· tomo-hatch-pet（tomo 是正本，这里是副本）
```

---

## 制作流水线

### 编排：`/make-character <人物> [语言] [模型ID]`

完整流程见 [.claude/skills/make-character/SKILL.md](.claude/skills/make-character/SKILL.md)。七个阶段：

| 阶段 | 动作 | 产物 / 命令 |
|------|------|-------------|
| ① 采集 | WebSearch/WebFetch 调研人设与口吻锚点，搜 Fish Audio 现成音色 | `dialogue.md` frontmatter 的 `reference_id` |
| ② 台词 | 按抽象事件目录写台词表（每个可绑事件 2~3 条短句） | `characters/<角色名>/dialogue.md` |
| ③ 合成 | Fish Audio TTS（幂等，已存在的 mp3 跳过） | `node .claude/skills/make-character/tts.js characters/<角色名>` |
| ④ 试听 | 人工确认音色贴不贴脸 | — |
| ⑤ 身体 | 收编 tomo-hatch-pet 产出的 `pet.json` + `spritesheet.webp` | `node .claude/skills/make-character/body.js characters/<角色名> --from <来源目录\|zip>` |
| ⑥ 打包 | 全量校验 + 出 `.zip` | `node .claude/skills/make-character/pack.js characters/<角色名>` |
| ⑦ 上传 | 传角色库市场（默认测试环境，生产需 `--yes`） | `node .claude/skills/make-character/upload.js characters/<角色名> [--env prod --yes]` |

每个阶段完成后把 `characters/roster.md` 该行的「状态」列推进一格：`待调研 → 台词 → 合成 → 试听 → 身体 → 打包 → 已上传 → 已上线`。

### 身体段：`/tomo-hatch-pet`

身体段（九态图集）由 tomo-hatch-pet 生成，见 [.claude/skills/tomo-hatch-pet/SKILL.md](.claude/skills/tomo-hatch-pet/SKILL.md)。它跑在 `output/hatch-pet/<pet>/` 这棵 run 目录里，最终把 `pet.json` + `spritesheet.webp` 落到 `characters/<角色名>/`，交给 `body.js` 收编。图集规格与九态语义见 [docs/contracts/PetDex宠物包格式.md](docs/contracts/PetDex宠物包格式.md)。

> **tomo-hatch-pet 的正本在 tomo 仓库**（`.claude/skills/tomo-hatch-pet/`），本仓库那份是副本。改动 skill 请在 tomo 里改，再复制过来。

---

## 契约同步

`make-character` 的打包校验必须与 tomo 应用使用同一份事件目录——`pack.js` 校验的语音白名单、`missingVoiceEvents()` 判定的 8 个可绑事件，都是 tomo 的 `src/shared/events.ts`。本仓库通过快照引用它：

```bash
node scripts/sync-tomo-contracts.mjs                 # 默认从 ../tomo 同步
node scripts/sync-tomo-contracts.mjs --from <路径>    # 或指定 tomo checkout
```

同步清单（每份文件带 provenance 头，写明来源 commit）：

| 本仓库 | 来源（唯一事实源） | 用途 |
|--------|-------------------|------|
| `vendor/tomo-contracts/events.ts` | `tomo/src/shared/events.ts` | 抽象事件目录 / `VOICE_EVENTS` / `isBindable` / `missingVoiceEvents` |
| `vendor/tomo-contracts/types.ts` | `tomo/src/shared/types.ts` | `AgentId` |
| `vendor/tomo-contracts/tomo-res-url.ts` | `tomo/src/shared/tomo-res-url.ts` | `PetdexSource` |
| `vendor/tomo-contracts/audio-ext.ts` | `tomo/src/shared/audio-ext.ts` | `AUDIO_EXT` / `audioDisplayName` |
| `vendor/tomo-contracts/load-env.mjs` | `tomo/scripts/load-env.mjs` | `.env` 读取 |
| `docs/contracts/角色库包格式.md` | 同名路径 | 角色包 `.zip` 格式：包结构 / manifest / 完整性门槛 |
| `docs/contracts/PetDex宠物包格式.md` | 同名路径 | 身体段规格与 9 态语义 |
| `docs/contracts/事件目录契约.md` | 同名路径 | 抽象事件目录（16）+ 两通道默认层 |

**tomo 改了事件目录就重跑一次同步**，否则 `pack.js` 会按旧词表校验。

---

## 凭据

`.env` + `.env.defaults` 在仓库根，两者都入库（私人库）。`.env.defaults` 是键位对照 + 无隐私默认值（市场 baseUrl），`.env` 存真实凭据：

- `FISH_AUDIO_API_KEY` / `FISH_PROXY` — 语音合成（Fish Audio）
- `MARKET_TEST_USERNAME` / `MARKET_TEST_PASSWORD` — 上传测试环境
- `MARKET_PROD_USERNAME` / `MARKET_PROD_PASSWORD` — 上传生产环境（`--yes` 才走）
- `MARKET_PROXY` — 上传代理（可选）

发版用的 `OSS_ACCESS_KEY_*` 留在 tomo 仓库，与角色制作无关。

---

## 入库判据

**能不能凭已入库的东西重新造出来？**

- **入库**：`dialogue.md`（台词原稿）· `tachie*.png`（立绘参考）· `pet.json` + `spritesheet.*`（身体段）——这些是**不可再生的原创资产**：同一个 prompt 重跑不会得到同一只，丢了只能重新孵一遍。
- **不入库**：`audio/`（`tts.js` 幂等重跑）· `out/`（`pack.js` 重打）· `output/`（整棵 scratch 树）。

---

## 编码规范

**错误处理原则**
- 不做静默兜底（如 catch 后 fallback 到本地数据）；异常必须上报，让错误可见
- 兜底逻辑会掩盖真实问题，禁止以「降级」为由隐藏错误

**定位 Bug 的纪律**
- 找到根本原因前，不提交补丁；找到后，**回滚所有错误方向的补丁**，再应用最小化正确修复

**注释与文档**
- 写「为什么」不写「是什么」——复述代码在做什么的注释一律删掉
- 契约与规范一律**引用**（`docs/contracts/xxx.md §N` 或对应源码路径），不抄录
- 注释掉的死代码一律删除；改动逻辑必须同步改注释，**过时注释等同于错误信息**

---

## 文档索引

### 本仓库

- [characters/roster.md](characters/roster.md) — 角色清单与制作状态追踪表
- [.claude/skills/make-character/SKILL.md](.claude/skills/make-character/SKILL.md) — 制作流水线完整说明（/make-character）
- [.claude/skills/tomo-hatch-pet/SKILL.md](.claude/skills/tomo-hatch-pet/SKILL.md) — 九态身体段生成（/tomo-hatch-pet）
- [docs/contracts/角色库包格式.md](docs/contracts/角色库包格式.md) — 角色包 `.zip` 格式：包结构 / manifest / 完整性门槛
- [docs/contracts/PetDex宠物包格式.md](docs/contracts/PetDex宠物包格式.md) — 视觉资产标准：包结构 / spritesheet 规格 / 9 态官方语义
- [docs/contracts/事件目录契约.md](docs/contracts/事件目录契约.md) — 抽象事件目录（16）+ 各 Agent 原生映射 + 两通道默认层

> 这三份是**同步来的快照**（唯一事实源在 tomo 的 `docs/contracts/`），刷新走 `npm run sync-contracts`。

### 跨仓库文档（家在 tomo 仓库）

- tomo 的 [CLAUDE.md](G:/Study_Data/VSCode/tomo/CLAUDE.md) — 应用本体架构、技术栈、目录结构
- 《角色库公开接口契约》— `tomo-server` 仓库：客户端 ↔ 市场服务端的公开 HTTP 契约
