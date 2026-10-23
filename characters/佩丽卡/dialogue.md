---
name: 佩丽卡
reference_id: cd9778891fd541e98331a8a0dde60fd1
# 上传参数（步骤⑦ 自动读取）：lang / description / tags
lang: zh
description: 《明日方舟：终末地》终末地工业的监督兼发言人。说话像在念作战简报，先报预案、流程、权限，再讲人情；号令永远说「我们」，日常滴水不漏——唯独一碰「我们相遇的过去」就会破句、口吃、自我打断。她等管理员醒来，已经等了十年
tags: 明日方舟终末地,佩丽卡,黎博利,终末地监督,明日方舟
---

> **取材纪律：优先原句 → 再化用 → 最后才拟写。** 每条出处写在条目下的 `<!-- -->` 里
> （parser 不认的行一律跳过，见 dialogue.js:86）。
>
> **口吻锚点**：称呼用户一律「**管理员**」（终末地语境）。终末地工业的监督兼发言人，
> 说话像在念作战简报——先把「预案 / 流程 / 权限」报清楚，再讲人情；带队伍时一律用「各位」起头，
> 说到自己只用「我们」。唯一能让她破句的是**「我们的过去」**：一碰就口吃、自我打断
> （话题：相遇 / 信赖对话5），这是本表里她最好用的情绪出口。
>
> **资料源**：中文语音集共 84 条，另有帝江号闲聊 6 / 话题 8 / 信赖对话 5。
> 素材里标 ⚠ 的条目是**语义外延**（原为战斗喊话，搬到桌宠语境），出处注里已如实标出。

## session-start

- file: session-start-1.mp3
  text: [relaxed] 欢迎回归终末地，管理员。
  <!-- 化用 · 干员报到：「我一直坚信，你会再一次为我们指明前进的方向。欢迎回归终末地，管理员。」（截短） -->
- file: session-start-2.mp3
  text: [serious] 管理员，全员待命，随时可以出发。
  <!-- 化用 · 行动准备1：「全员待命，随时可以出发。」（加呼语） -->
- file: session-start-3.mp3
  text: [relaxed] 适应得还好吗，管理员？
  <!-- 原句 · 打招呼1 -->

## prompt-submit

- file: prompt-submit-1.mp3
  text: [serious] 指挥权限暂时交给你了，管理员。
  <!-- 原句 · 编入队伍1 -->
- file: prompt-submit-2.mp3
  text: 带领我们更进一步吧，管理员。
  <!-- 原句 · 编入队伍2 -->
- file: prompt-submit-3.mp3
  text: [serious] 终末地危机处理小组已就绪。
  <!-- 原句 · 行动准备2 -->

## permission-request

- file: permission-request-1.mp3
  text: [serious] 眼前的敌人非同小可，提高警惕。
  <!-- 原句 · 发现强敌 -->
- file: permission-request-2.mp3
  text: [serious] 歼灭坐标，权限七！
  <!-- 原句 · 终结技1（素材标注 ⚠ 语义外延：原为战斗喊招，此处借她「先报权限」的口吻等你授权） -->
- file: permission-request-3.mp3
  text: [relaxed] 管理员，附近似乎有高价值的物资，值得留意。
  <!-- 化用 · 发现资源2：「附近似乎有高价值的物资，值得留意。」（加呼语） -->

## turn-complete

- file: turn-complete-1.mp3
  text: [happy] 出色的配合，必然的结果。
  <!-- 原句 · 作战胜利1 -->
- file: turn-complete-2.mp3
  text: 管理员，确认一下自己的状况吧。
  <!-- 化用 · 作战胜利2：「各位，确认一下自己的状况吧。」（改称呼） -->
- file: turn-complete-3.mp3
  text: 暴力并非我们的目的，继续前进吧。
  <!-- 原句 · 作战胜利3 -->

## turn-failure

- file: turn-failure-1.mp3
  text: [serious] 我们不会重蹈覆辙……
  <!-- 原句 · 作战失败 -->
- file: turn-failure-2.mp3
  text: [sad] 管理员，没关系……比起我们的目标……
  <!-- 化用 · 负伤：「没关系……比起我们的目标……」（加呼语） -->
- file: turn-failure-3.mp3
  text: [sad] 管理员……不，没什么。我们再来一次。
  <!-- 拟写 · 素材里没有贴合这条语义的句子：借她「一碰我们的过去就破句、自我打断」的口吻锚点（话题：相遇）收势 -->

## post-tool-use-failure

- file: post-tool-use-failure-1.mp3
  text: [serious] 未知的行为，小心！
  <!-- 原句 · 危险提醒 -->
- file: post-tool-use-failure-2.mp3
  text: [serious] 不要掉以轻心。
  <!-- 原句 · 使用战术物品1 -->
- file: post-tool-use-failure-3.mp3
  text: [relaxed] 管理员，调整好状态。
  <!-- 化用 · 使用战术物品2：「调整好状态。」（加呼语） -->

## task-completed

- file: task-completed-1.mp3
  text: [happy] 不错的收获。
  <!-- 原句 · 打开储藏箱 -->
- file: task-completed-2.mp3
  text: [happy] 管理员，出色的技巧，令人赞叹。
  <!-- 化用 · 小队激励1：「出色的技巧，令人赞叹。」（加呼语） -->
- file: task-completed-3.mp3
  text: 侵蚀已经无法威胁如今的终末地。
  <!-- 原句 · 消除侵蚀 -->

## session-end

- file: session-end-1.mp3
  text: [relaxed] 管理员，注意休息，不要勉强自己。
  <!-- 原句 · 打招呼2 -->
- file: session-end-2.mp3
  text: [relaxed] 累的话，就早点休息吧。
  <!-- 原句 · 信赖对话5（节选，原句后半段为「睡脸？管理员的睡脸我已经看了十年了。」） -->
- file: session-end-3.mp3
  text: [sad] ……抱歉，管理员。今天，就先到这里吧。
  <!-- 化用 · 话题：相遇：「……抱歉，管理员。这是我的私心……」（保留破句，尾句换成收尾语义） -->
