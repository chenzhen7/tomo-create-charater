<!-- 本文件由 scripts/sync-tomo-contracts.mjs 从 tomo 仓库同步生成。 -->
<!-- 来源：tomo@bf49878 docs/contracts/PetDex宠物包格式.md -->
<!-- 刷新：node scripts/sync-tomo-contracts.mjs -->

# PetDex 宠物包格式参考（tomo 2.0 采用）

> 来源：PetDex 官方仓库 README / petdex.dev/docs / petdex-cli README（2026-09-18 抓取）。
> 地位：tomo 2.0 决定**采用 PetDex 作为视觉资产标准格式**，tomo 角色包（`.zip`）v2 = 合法 PetDex 包 + tomo 语音扩展段（超集策略）。
> 上游：[github.com/crafter-station/petdex](https://github.com/crafter-station/petdex)（MIT；宠物素材版权归各自投稿者）

---

## 1. 包结构

每个宠物 = 一个文件夹（或同结构 zip），根级两个文件：

```text
my-pet/
├── pet.json                # 元数据：name, slug, tags, vibes, kind, 帧尺寸, 动画状态声明
└── spritesheet.webp        # 帧图集（也接受 .png）
```

- 两文件必须在**根级**，缺少任一 → `register 400 missing_field`
- CLI 投稿限流：10 次/24h/用户

## 2. Spritesheet 规格

| 版本 | 网格 | 推荐尺寸 | 单帧 |
|------|------|---------|------|
| v1 | 8 列 × 9 行 | 1536×1872 | 192×208 px |
| v2 | 8 列 × 11 行 | 1536×2288 | 192×208 px |

- 最小 256×256；两规格**或其整数缩放**均可（"clean scale"）
- **8 列是网格宽度上限，不是每行的帧数**：行内短帧是常态，8 列里没画到的格子保持全透明。规范表给出的每行帧数为 `[6,8,8,4,5,8,6,6,6]`——`idle` 只画 6 帧、`waving` 只画 4 帧。
  - **渲染端必须按规范表播，不能按 8 取模**——取模会播到空白格上，表现为「宠物每循环闪一下、消失一瞬间」；瞬时态若停在第 8 格，更会定格在一片空白上。逐帧时长表（数组长度即帧数）见 [src/shared/pet.ts](../../src/shared/pet.ts) 的 `PET_STATE_FRAME_MS`。
  - **帧数取自规范表，不是从图集上量出来的**（2026-09-19 决策）。三方实现逐行一致，没有一家扫像素：官方原生运行时 `packages/petdex-desktop-native/src/sprite.zig` 把它写死成 `uniform(N, dur, last)`；PetDex `audit-pet-atlases.ts` 的 `expectedColumns()` 硬编码同一组数字；PawPause `src/shared/spriteStates.ts` 的 `PETDEX_STATES.frames` 长度逐行相同，且其 `durationMs` 与本表求和逐行相等（idle 1100、waving 700、jumping 840、failed 1220 …）。
  - **节拍不是统一 fps**：末帧更长（动作收尾那一拍的停顿）；`idle` 更是不规则——呼吸之间夹着眨眼，对应官方语义「neutral breathing/blinking loop」。
  - 副作用（**已接受**）：作者若在某行画了超过规范帧数的内容，超出部分不会被播到；画得比规范少的，尾巴上那几格本来就全透明，按规范播会多停在透明格上——**与生态里的其他运行时表现一致**，这是对齐的代价。换来的是帧数不需要逐包去数，也不必为此做像素回读（`tomo-res://` 的 `corsEnabled` 只为宠物窗口的 alpha 命中检测而留，与帧数无关）。
- v2 的 11 行中 9 行是标准状态行，**多出的 2 行是 16 个朝向帧**：22.5° 一档顺时针排（第 9 行 `000°`→`157.5°`、第 10 行 `180°`→`337.5°`），`000` 指正上方、屏幕坐标系；指针落在正中心的死区回落到 `idle`，没有"中立"帧。
  - **这不是留给消费端的空地**：那两行有主，语义由 Codex/ChatGPT 侧定义（出处：Codex 的 `hatch-pet` skill 与它的 `references/animation-rows.md`；PetDex 官方文档本身只说"同样九行"，未见对应定义）。**别往里写自己的东西**——将来 tomo 若做鼠标跟随，必须按上面这套语义读，自创一套会与生态里的宠物冲突。
  - tomo **当前不读这两行**：宠物注视方向不由指针驱动，`PET_STATE_ROWS` 只有 9 项。几何推导只要求 `rows ≥ 9`，所以 8×11 的图集照收，多出来的行照不到也照不坏。
- ChatGPT 官方宠物导出即为 v2 形状，无需转换；Petdex 可量网格并自动生成缺失的 pet.json

## 3. 九个标准动画状态（官方语义）

| 状态 | 官方标签 | 官方用途定义 |
|------|---------|-------------|
| `idle` | Idle | Neutral breathing and blinking loop（呼吸+眨眼待机循环，含不规则眨眼时机） |
| `running-right` | Run Right | Directional locomotion to the right（向右位移） |
| `running-left` | Run Left | Directional locomotion to the left（向左位移） |
| `waving` | Waving | Greeting or attention gesture（打招呼/吸引注意） |
| `jumping` | Jumping | Anticipation, lift, peak, descent, settle（跳跃全过程：蓄力-腾空-顶点-下落-落地） |
| `failed` | Failed | Readable error or sad reaction（可读的失败/沮丧反应） |
| `waiting` | Waiting | Patient idle variant（耐心等待的待机变体） |
| `running` | Running | Generic in-place run loop（原地奔跑循环） |
| `review` | Review | Focused inspecting or thinking loop（专注检查/思考循环） |

> **tomo 2.0 用法约定**（与官方语义的关系）：
> - `running-left` / `running-right`：tomo 站桩形态下**不做自主位移**，这两行复用为**用户手动拖拽宠物时**的方向动画（拖拽方向决定播哪行）
> - `waving` / `jumping`：问候与庆祝——session 开始 / 任务完成等正向事件的候选
> - `running`：Agent 工作中的原地动画
> - `waiting`：等待用户授权/输入
> - `failed`：任务失败
> - `review`：Agent 检查/思考中
> - 精确的事件→状态映射表在 2.0 需求设计中另行确定

## 4. 运行时驱动接口（PetDex 桌面端的做法，供参照）

- 桌面 App 内置 HTTP hook server：`127.0.0.1:7777`
- 驱动方式：`POST /state`，body `{"state":"waving"}`，头 `X-Petdex-Update-Token: <token>`
- token 每次启动轮换，存 `~/.petdex/runtime/update-token`（权限 0600，仅本用户可读）
- **与 tomo 现有架构同构**（随机端口 + token 文件鉴权），可沿用

## 5. 窗口行为（官方桌面端语义）

- 宠物浮于所有窗口之上，**永不抢夺焦点**
- 气泡（activity bubble）区域 **click-through**，点击穿透到背后窗口
- 精灵本体可拖拽换位

## 6. 安装路径约定（生态互操作点）

- PetDex CLI 安装到 `~/.petdex/pets/<slug>/` **和** `~/.codex/pets/<slug>/`
- PawPause 等第三方运行时会自动扫描 `~/.codex/pets`
- **tomo 2.0 已采纳"已安装宠物发现"**（决策 33）：两个目录都扫，且因为 CLI 一次写两处，**同名会在列表里各占一行**（不去重，决策 34）。扫描实现见 `electron/src/service/PetdexLibraryService.ts`；缩略图走 `tomo-res://petdex/<来源>/<slug>/<相对路径>`。
  > 上面那句"CLI 同时写两处"是本文件 2026-09-18 从官方 README 抓来的，**tomo 侧没有真机复核过**（开发机上 `~/.petdex` 不存在、`~/.codex/pets` 是空的）。去重与否**不依赖这句话成立**——不去重的理由（两份内容可能不一致时无权替用户选）独立成立

## 7. 生态规模（2026-09 快照）

- 画廊 4867+ 个过审宠物，头部：Boba 10.6K 安装、Doraemon 4.2K、噜噜 4.1K、Shinchan 3.9K
- 21 个开源项目基于 PetDex 格式/API 构建
- 公开 API：`petdex.dev/api/manifest` 返回全部过审宠物（slug / spritesheet URL / 动画状态 / 元数据）
  > **tomo 不用它**（决策 33）：客户端不调 petdex.dev 的任何 API，只有 `src/shared/urls.ts` 里一个网页链接。**这条 API 存在 ≠ 我们该去接它**——把浏览搬进应用就等于自己维护一份第三方列表的镜像，而用户本来就有一个更好的浏览器
- IP 政策：投稿即同人二创，PetDex 不主张底层 IP 权利，takedown 48h 内处理——**tomo 角色库若引入 PetDex 来源素材，需同样处理 IP 风险**

## 8. 尚无音频/扩展字段（tomo 超集的原因）

- pet.json 无音频字段、无文档化扩展机制
- tomo 扩展段方案（语音 + 事件映射）需在 tomo 角色包 v2 设计中自定，保证其他 PetDex 消费端**忽略扩展段后仍能正常渲染**
