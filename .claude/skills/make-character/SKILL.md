---
name: make-character
description: tomo 仓库自用的**完整**角色制作流水线：采集角色设定 → 生成台词表（dialogue.md）→ Fish Audio TTS 合成 → 身体段收编 → 打包校验 → 上传市场（含 roster 台账、body.js / upload.js）。当在本仓库开发中要新增或维护 characters/ 下的角色、重新打包、或把角色包上传到市场时使用。面向终端用户的简易分发版在 tomo 仓库的同名 skill（make-character）。
---

# /make-character

把一个角色从设定做成可导入的 `.zip` 角色包。核心中间产物是 `dialogue.md`（台词表），全流程围绕它推进，支持中断续跑和单阶段重做。

## 目录与产物

专门的制作工作目录为 repo 根的 `characters/`（一个角色一个子目录）：

```text
characters/
├── roster.md              # 首批角色清单（制作状态追踪表）
└── <角色名>/
    ├── dialogue.md            # 台词表 + 元信息（frontmatter），人机共同编辑的核心文件，入库跟踪
    ├── audio/                 # tts.js 生成的语音（<事件>-<序号>.mp3；二进制产物，gitignore）
    ├── pet.json               # 身体段元数据（PetDex 规范，与包内同名同位置；入库跟踪）
    ├── spritesheet.webp       # 身体段图集（8 列，9 状态行起；也接受 spritesheet.png；入库跟踪）
    └── out/<角色名>.zip       # pack.js 的最终产物（gitignore）
```

> **哪些产物入库的判据只有一条：能不能凭已入库的东西重新造出来？** 台词（`dialogue.md`）和身体（`pet.json` + `spritesheet.*`）都造不出来——台词是原稿，身体是**不可再生的原创资产**（同一个 prompt 重跑不会得到同一只），所以入库；音频可由 `tts.js` 幂等重跑、包可由 `pack.js` 重打，所以不入库。

> **两道导出的硬门槛**：①**身体段**——2.0 起角色包的可视资产只有身体段（`pet.json` + `spritesheet`），包内不再有 `avatar.png`，缺身体就只能停留在本地，无法打包交付、无法上架市场；②**8 个可绑事件各至少一条语音**——缺哪个事件，下载方在那个场景就哑掉。两道门槛在应用内导出、`pack.js` 打包、市场服务端上传三处一致生效。

支撑脚本（就在本 skill 目录下，用法见各文件头注释）：
- `tts.js` — Fish Audio 合成 / 克隆音色
- `body.js` — 身体段收编：把外部宠物包的两个文件落到角色目录（见步骤⑤b）
- `pack.js` — 全量校验 + 打包（产物 .zip）
- `upload.js` — 上传角色包到角色库市场（测试/生产，见步骤⑦）
- `dialogue.js` — dialogue.md 解析（被上面四个引用，不直接跑）

## 前置条件

- `FISH_AUDIO_API_KEY`：环境变量或 repo 根 `.env`（`FISH_AUDIO_API_KEY=<key>`），缺则中止并提示
- 音色二选一（阶段①先搜索 Fish Audio 社区现成音色，找不到再问用户）：
  - 已有 Fish Audio 音色的 `reference_id`（社区音色库有大量现成角色音色）
  - 用户提供 10~30 秒干净角色原声 → `tts.js --clone` 克隆（一次性，id 写回 dialogue.md 复用）

## 工作流

### ① 采集（AI 主动调研，用户只给名字）

调用形式：`/make-character <人物> [语言] [模型ID]`

- **语言参数给了**（日语/中文/…）→ 跳过语言确认，直接用
- **模型ID参数给了** → 跳过音色搜索与克隆提问，写入 dialogue.md frontmatter 的 `reference_id`

用户最少只需提供**角色名**（和出处，如原名有歧义）。

**语言未定才确认**：用 AskUserQuestion 问用户台词语言，**默认推荐角色本来的语言**（调研搜索词和词条选择都用该语言，结果质量更好——萌娘百科/日文维基/公式设定集的原文资料远全于中文转述）。

其余由 AI 用 WebSearch/WebFetch 自行调研：

1. **人设调研**：用确认的语言搜索该角色的萌娘百科 / 维基 / Fandom / 游戏官网词条，提炼：
   - 性格与说话口吻（口癖、自称、语气词、敬语习惯）
   - 标志性台词 / 名场面语录（②台词设计的首选素材，保持原语言引用；多收集、覆盖不同情绪场景——得意/懊恼/撒娇/催促/告别都要有，8~10 句以上，尽可能使用原台词、不要过分创作一些太尬的台词）
   - 与其他角色的关系称呼（如适用）
2. **音色线索**：搜索 Fish Audio 是否已有该角色的社区音色（`fish.audio <角色名>` 等关键词）；找到则将 `reference_id` 作为候选并回填 `characters/roster.md` 的模型ID列，找不到则在阶段③前用 AskUserQuestion 问用户要克隆参考音频（克隆完成后同样回填）
3. **确认**：把调研结果整理成简短人设卡（口吻要点 + 3~5 句代表语录 + 音色方案）给用户过目，用户可补充纠正，确认后进②

**台词表只写这 8 个事件，且 8 个都要写**

| 抽象事件名 | 台词语义 |
|------------|----------|
| `session-start` | 欢迎、进入工作状态 |
| `prompt-submit` | 收到任务、准备开始 |
| `permission-request` | 需要用户许可决策 |
| `turn-complete` | 完成、等待下一步 |
| `turn-failure` | 简短安抚，提醒检查 |
| `post-tool-use-failure` | 工具出错时的小提醒 |
| `task-completed` | 单个任务完成的小成就感 |
| `session-end` | 收尾、休息提示 |



### ② 台词设计 → dialogue.md

按下方格式写 `characters/<角色名>/dialogue.md`，每个事件 2~3 条短句：
- **优先取材名场面/经典台词**：①调研拿到的代表语录是首选素材——直接引用或按事件语义改写（如 `turn-complete`=完工 → 化用角色得胜/收尾的名台词），粉丝听到原句才有陪伴感；没有合适原句的事件再按人设口吻原创
- **语言用①确认的台词语言**（日语原文 / 中文 / 其他），不要混入用户没选的语言
- 贴合①的默认事件语义表（`session-start`=欢迎、`turn-complete`=完成待命、`turn-failure`=简短安抚+提醒检查、`session-end`=收尾休息提示…）
- 口吻以①调研出的人设卡为锚点（口癖、自称、代表语录的风格），不是通用萌妹腔
- 短句（朗读 ≤4 秒）；可带 Fish Audio S2 情绪标签（`[happy]` `[sad]` `[whisper]` 等，**必须方括号包裹**，写在 text 开头）。标签只给 TTS 用：打包时写进 manifest 的 `label`（桌宠气泡显示的台词）会剥掉行首标签，剥离后必须非空且 ≤100 字
- **角色级上传参数一并写进 frontmatter**：`lang`（=①确认的语言）、`description`（角色一句话简介，≤200 字）、`tags`（逗号分隔的角色标签，如作品/类型/关键词）；上传（步骤⑦）自动读取，无需每次命令行指定

写完给用户过目，用户可直接改文件，确认后进③。

```markdown
---
name: 芙宁娜
reference_id: <已有 id 时填；用 --clone 则留空，克隆后自动写回>
# 可选：model: s2.1-pro-free（Fish Audio 模型，HTTP header 传递，默认 s2.1-pro-free）
# 可选：speed: 1.0（语速 0.5~2.0）
# 上传参数（步骤⑦ 自动读取）：lang / description / tags
lang: zh
description: 歌剧院的明星，温柔与执念并存
tags: 原神,芙宁娜,枫丹
---

## session-start

- file: session-start-1.mp3
  text: [happy] 呀，你来啦！今天也请多指教！
```

格式纪律（parser 依赖）：frontmatter 只写简单 `key: value`；事件节标题 `## <抽象事件名>`（kebab-case）；条目以 `- file: <裸文件名>` 起头，后续缩进行为 `text:`。文件名沿用事件名（`<事件名>-<序号>.mp3`），便于人眼对照。

### ③ 语音合成

```bash
# 若用户给的是参考音频（仅首次）：
node .claude/skills/make-character/tts.js characters/<角色名> --clone <参考音频路径>
# 合成（幂等：已存在的 mp3 跳过）：
node .claude/skills/make-character/tts.js characters/<角色名>
```

失败处理遵守项目规范：脚本重试 2 次后仍失败会非零退出并列出失败条目——**不要静默跳过**，把错误原样报给用户（额度不足 / reference_id 失效 / 网络问题），解决后重跑（已生成的会跳过）。

### ④ 试听返工

列出 `audio/` 清单让用户试听。不满意：改 dialogue.md 对应 `text`，删掉对应 mp3（或用 `--only <file>`），重跑 tts.js。确认后进⑤。

### ⑤ 身体段

角色的视觉资产 = PetDex 的 `pet.json` + `spritesheet.(webp|png)`（8 列；9 个状态行依次为 `idle / running-right / running-left / waving / jumping / failed / waiting / running / review`，单帧 192×208 或整数缩放；v2 的 8×11 多出两行朝向，tomo 不读但合法）。规格见 [PetDex宠物包格式](../../../docs/contracts/PetDex宠物包格式.md)。

分两半：**先把两个文件弄到手，再收编进角色目录**。

#### ⑤a 取得（三选一）

- **以该角色为原型定制**（首选——桌宠得是它本人）：跑 `tomo-hatch-pet` skill，产物直接落到 `characters/<角色名>/`：`pet.json` + `spritesheet.webp`
- **从 PetDex 画廊挑一只**（代价最低，但拿到的是通用宠物而非角色本人）：`npx petdex install <slug>`，两文件在 `~/.petdex/pets/<slug>/`
- **自带图集**：手工美术，或别处下载的宠物包（zip 或已解开的目录都行）

#### ⑤b 收编

```bash
node .claude/skills/make-character/body.js characters/<角色名> --from <来源目录 | zip>
# 已经手放进角色目录的，省略 --from（只跑落盘规则）
node .claude/skills/make-character/body.js characters/<角色名>
```

`body.js` 只做三件事：**找齐两文件、落盘、清掉另一种扩展名**（`.webp` 与 `.png` 并存时"用哪张"全凭探测顺序，最难查）。它**不判几何、不判画质**。

> **这一格的出门条件只是「两个文件已就位」。** 图集尺寸对不对，要到应用里才知道——**渲染进程是几何的唯一裁判**，不合规的图集在宠物栏会显示明确的坏图原因。而**画得好不好、9 行的动作对不对，更是没有机器判据，只能人看**：进详情页宠物栏把 9 个状态逐个切一遍（`running` 别是站着、`failed` 别是开心），确认无误再往下走。

### ⑥ 打包交付

```bash
node .claude/skills/make-character/pack.js characters/<角色名>
```

pack.js 先做全量校验（对齐导出侧规则：事件合法性、音频白名单、文件齐全、**身体段齐备**、**8 个事件各至少一条**），全过才打包；校验失败**不产出半成品**，按错误清单修复后重跑。产物 `out/<角色名>.zip`，交付路径并提示用户到应用「角色管理 → 导入」。

交付后把 `characters/roster.md` 里该角色的「状态」列推进到对应阶段（身体 / 打包 / 已上传 / 已上线），保持清单与实际进度一致。

### ⑦ 上传服务端

把打包产物上传到角色库市场（`MARKET_*` 配置：baseUrl 固定默认值在已提交的 `.env.defaults`，登录凭据在 `.env`，脚本自动读取）：

```bash
# 测试环境（默认，开发/验收用）：
node .claude/skills/make-character/upload.js characters/<角色名>
# 生产环境（外向动作，需 --yes 显式确认）：
node .claude/skills/make-character/upload.js characters/<角色名> --env prod --yes
```

`lang` / `description` / `tags` 取该角色 `dialogue.md` frontmatter（步骤② 已写好）；`--lang` / `--description` / `--tag`（可重复）可临时覆盖。上传成功输出角色 ID（`status=0` 待管理员审核，上架后才进公开列表）；失败原样报服务端 `msg`，不静默降级。

**生产上传纪律**：上传前先和用户确认目标环境、简介与标签；生产属对外发布，必须用户明确同意后才执行（脚本强制 `--yes`，杜绝误触）。

上传成功把 `characters/roster.md` 该角色「状态」列推进到 `已上传`（待审核），管理员上架后再到 `已上线`。

