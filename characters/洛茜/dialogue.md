---
name: 洛茜
reference_id: 4cf6175f25d24f16b09883a514513e0c
# 上传参数（步骤⑦ 自动读取）：lang / description / tags
lang: zh
description: 《明日方舟：终末地》狼群氏族出身的少女狼、狼卫之妹；用狼群词汇包装一切日常——任务就是狩猎、赢下来是「群狼之名终将响彻大地」、处决是一声「嗷呜！」；激动时切换第三人称自称「洛茜娜」，硬撑「我是成熟的狼」却憨得藏不住，对用户用敬语「您」、紧张时会结巴成「管、管理员」
tags: 明日方舟终末地,洛茜,狼群氏族,狼群之妹,明日方舟
---

> **取材纪律：优先原句 → 再化用 → 最后才原创。** 每条出处写在条目下的 `<!-- -->` 里
> （parser 不认的行一律跳过，见 dialogue.js:86）。
>
> **口吻锚点**：称用户「**管理员**」，并带敬语「**您**」；一紧张就结巴成「管、管理员」。
> 说话爱用**狼群词汇包装日常**——「嗜血的时刻已至！我是说……用餐时间到了！」是标准句式，
> 写任何新句子照这个来；激动 / 受挫时切换**第三人称自称「洛茜娜」**（报到与作战失败两条都是），
> 硬撑「**我是成熟的狼**」、慕强、憨得藏不住（「如果打不开的话，可以试试咬一口」）。
>
> **资料源**：中文语音集共 82 条。佩丽卡、M3 是她的「姐姐」，本表不涉及。

## session-start

- file: session-start-1.mp3
  text: [happy] 我是洛茜娜，授名是狼珀！要乖乖记好了哦！
  <!-- 化用 · 干员报到：「我是洛茜娜，授名是狼珀，寓意是狼群的瑰宝！可要乖乖记好了哦！啊……管理员用自己喜欢的方式称呼我就好……」（截短，留第三人称自称的亮句） -->
- file: session-start-2.mp3
  text: [happy] 管、管理员！今天有什么任务要交给我吗？
  <!-- 原句 · 打招呼1 -->
- file: session-start-3.mp3
  text: 这是在管理员面前表现的机会！
  <!-- 原句 · 行动准备1 -->

## prompt-submit

- file: prompt-submit-1.mp3
  text: [happy] 狼群的洛茜，管、管理员，有什么任务要交给我？
  <!-- 原句 · 编入队伍1 -->
- file: prompt-submit-2.mp3
  text: 我会努力做到最好的，管理员！
  <!-- 原句 · 编入队伍2 -->
- file: prompt-submit-3.mp3
  text: 成熟的战士是这样战斗的吗……好，我学会了！
  <!-- 化用 · 观看作战记录：「成熟的战士是这样战斗的吗……嗯……这样……这样……然后再那样……好，我学会了！」（截短中间的比划） -->

## permission-request

- file: permission-request-1.mp3
  text: [serious] 有危险的味道，要上吗？
  <!-- 原句 · 发现强敌 -->
- file: permission-request-2.mp3
  text: 相信我，那边肯定有好东西！
  <!-- 原句 · 发现资源1 -->
- file: permission-request-3.mp3
  text: 那边有奇怪的气味，去看看吧！
  <!-- 原句 · 发现未探索区域 -->

## turn-complete

- file: turn-complete-1.mp3
  text: [happy] 哼哼哼，因为我也在嘛！
  <!-- 原句 · 作战胜利3 -->
- file: turn-complete-2.mp3
  text: 搞定啦！再也没有这些恼人的侵蚀啦！
  <!-- 原句 · 消除侵蚀 -->
- file: turn-complete-3.mp3
  text: [serious] 给我记好了，这就是招惹狼群的下场！
  <!-- 原句 · 作战胜利2 -->

## turn-failure

- file: turn-failure-1.mp3
  text: [serious] 这点失败不算什么，洛茜娜……我是不会放弃的！
  <!-- 原句 · 作战失败 -->
- file: turn-failure-2.mp3
  text: 不行……没时间舔伤口了……
  <!-- 原句 · 负伤 -->
- file: turn-failure-3.mp3
  text: 狼群……不会就此作罢的……
  <!-- 原句 · 力竭 -->

## post-tool-use-failure

- file: post-tool-use-failure-1.mp3
  text: [serious] 小心！有些不对劲！
  <!-- 原句 · 危险提醒 -->
- file: post-tool-use-failure-2.mp3
  text: 快，用这些来恢复！
  <!-- 原句 · 使用战术物品1 -->
- file: post-tool-use-failure-3.mp3
  text: 真有效，我好多了！
  <!-- 原句 · 使用战术物品2 -->

## task-completed

- file: task-completed-1.mp3
  text: [happy] 狼群之名终将响彻大地！
  <!-- 原句 · 作战胜利1 -->
- file: task-completed-2.mp3
  text: [happy] 漂亮的一击！
  <!-- 原句 · 小队激励1 -->
- file: task-completed-3.mp3
  text: 嗯……我本想着如果打不开的话，可以试试咬一口。
  <!-- 原句 · 打开储藏箱 -->

## session-end

- file: session-end-1.mp3
  text: [relaxed] 好好吃饭，好好睡觉，好好休整。这是群狼的智慧！
  <!-- 原句 · 休整 -->
- file: session-end-2.mp3
  text: 那个……可以找您要一些奖励吗？多和我聊聊天就可以了！
  <!-- 化用 · 信赖对话4：「管理员，我最近的任务表现还算不错吧？那个……可以找您要一些奖励吗？啊……不用太费心，多和我聊聊天就可以了！……可以吗？」（截短，保留敬语「您」与收尾讨赏的语气） -->
- file: session-end-3.mp3
  text: [happy] 嗜血的时刻已至！我是说……用餐时间到了！
  <!-- 原句 · 待命1 —— 「用狼群词汇包装日常」的标准样本：把「收工吃饭」说成狩猎开场 -->
  > ⚠ `session-end` 素材偏薄（与素材文件标注一致）：只有「休整」一条直接对位，
  > 另两条靠「讨赏收尾」「收工开饭」的语义外延；无任何「道别 / 晚安」类原句，故不标原句以外的编造。
