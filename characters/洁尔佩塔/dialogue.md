---
name: 洁尔佩塔
reference_id: 4d68521247bf4ac3a11bc29761b00d7d
# 上传参数（步骤⑦ 自动读取）：lang / description / tags
lang: zh
description: 《明日方舟：终末地》塔卫二的信使，安洁莉娜的再旅者。开朗轻盈、话多到停不下来，标志是用「信使小姐」自称第三人称，几乎每句话都长出一个比喻——信件、气球、颜色香味、星星罗盘；底色是浪漫化的孤独，还总忍不住操心管理员的作息
tags: 明日方舟终末地,洁尔佩塔,沃尔珀,信使,明日方舟
---

> **取材纪律：优先原句 → 再化用 → 最后才拟写。** 每条出处写在条目下的 `<!-- -->` 里
> （parser 不认的行一律跳过，见 dialogue.js:86）。
>
> **口吻锚点**：称呼用户一律「**管理员**」。塔卫二信使，开朗轻盈、话多到停不下来；
> 最标志的是用「**信使小姐**」第三人称自指（「信使小姐带着你的信飞来咯！」）。
> 几乎每句话都能长出一个比喻，意象固定死在四个圈：**信件 / 信纸、重力与飞行（气球）、
> 色彩与香味、星空与罗盘**——把任何人任何事都翻译成一封信，把抽象感受说成可触摸的
> 颜色、气味、重量。底色是浪漫化的孤独（「孤独是信使的伴侣，但我永远也习惯不了孤独」），
> 且天然操心管理员的作息。
>
> **资料源**：中文语音集共 80 条（BWIKI 语音记录）+ 信赖对话 / 帝江号闲聊 / 干员报到。
> 她是《明日方舟》**安洁莉娜**的再旅者（沃尔珀），但**安洁莉娜的台词不算数**——
> 本表只用终末地的文本。

## session-start

- file: session-start-1.mp3
  text: [happy] 你好呀！你身上有股令人怀念的气味……像一封没写完的信。
  <!-- 化用 · 语音记录·干员报到：「你好呀！你身上有一股令人怀念的气味……好像一封没有写完的信，我很好奇它会去往哪里。」（截短后半句） -->
- file: session-start-2.mp3
  text: [happy] 看这里！瞧，信使小姐带着你的信飞来咯！
  <!-- 原句 · 语音记录·待命1 -->
- file: session-start-3.mp3
  text: 嗨，管理员，外面的天气很不错哦。
  <!-- 原句 · 语音记录·行动准备1 -->

## prompt-submit

- file: prompt-submit-1.mp3
  text: 今天的塔罗斯，会闪烁着什么样的光彩呢？
  <!-- 原句 · 语音记录·编入队伍1 -->
- file: prompt-submit-2.mp3
  text: 要前往下一个目的地了吗？
  <!-- 原句 · 语音记录·编入队伍2 -->
- file: prompt-submit-3.mp3
  text: [happy] 放心交给我吧！
  <!-- 原句 · 语音记录·进驻设施 -->

## permission-request

- file: permission-request-1.mp3
  text: [serious] 信使准则：未知区域需要谨慎前行！
  <!-- 原句 · 语音记录·发现未探索区域 -->
- file: permission-request-2.mp3
  text: [serious] 那里的敌人好像很危险，要小心哦。
  <!-- 原句 · 语音记录·发现强敌 -->
- file: permission-request-3.mp3
  text: 那边有值得注意的东西。
  <!-- 原句 · 语音记录·发现资源1 -->

## turn-complete

- file: turn-complete-1.mp3
  text: [happy] 这是今天最开心的事！
  <!-- 原句 · 语音记录·作战胜利2 -->
- file: turn-complete-2.mp3
  text: [happy] 好耶，又可以上路了。
  <!-- 原句 · 语音记录·作战胜利3 -->
- file: turn-complete-3.mp3
  text: 我们坚持到了最后……嗯，艰辛的过程是值得的。
  <!-- 原句 · 语音记录·作战胜利4 -->

## turn-failure

- file: turn-failure-1.mp3
  text: [relaxed] 送信的路总有些坎坷，没关系，我们会再次启程。
  <!-- 化用 · 语音记录·作战失败：「把一封信送到终点的旅途，或许会坎坷不平，但没关系，我们会再次启程。」（截短首句） -->
- file: turn-failure-2.mp3
  text: [sad] 还想要……再一次飞起来……
  <!-- 原句 · 语音记录·力竭 -->
- file: turn-failure-3.mp3
  text: [sad] 感觉……身体好重……
  <!-- 原句 · 语音记录·负伤 -->

## post-tool-use-failure

- file: post-tool-use-failure-1.mp3
  text: [serious] 小心受伤，快闪开！
  <!-- 原句 · 语音记录·危险提醒 -->
- file: post-tool-use-failure-2.mp3
  text: [happy] 试试这个，能帮到你！
  <!-- 原句 · 语音记录·使用战术物品1 -->
- file: post-tool-use-failure-3.mp3
  text: 信纸湿了一角……没关系，重新誊一遍就好。
  <!-- 拟写 · 本格无对位原句（危险提醒 / 战术物品两条已用在前两条，负伤语义偏重留给 turn-failure）；按「信件」比喻圈自撰 -->

## task-completed

- file: task-completed-1.mp3
  text: [happy] 哇！都是我们需要的东西！
  <!-- 原句 · 语音记录·打开储藏箱 -->
- file: task-completed-2.mp3
  text: [happy] 这下送信的道路将会畅通无阻！
  <!-- 原句 · 语音记录·消除侵蚀 -->
- file: task-completed-3.mp3
  text: [happy] 嘿嘿，还好没有飞远。
  <!-- 原句 · 语音记录·获得醚质 -->

## session-end

- file: session-end-1.mp3
  text: 还在忙吗？管理员，要注意休息哦。
  <!-- 原句 · 语音记录·打招呼2 -->
- file: session-end-2.mp3
  text: [relaxed] 休整是为了更好地出发。
  <!-- 原句 · 语音记录·休整 -->
- file: session-end-3.mp3
  text: [whisper] 我爱在夜晚的天空里飞行，看着那些亮闪闪的星星。
  <!-- 化用 · 语音记录·信赖对话2：「我喜欢独自在夜晚的天空中飞行，融进夜色里，看着那些亮闪闪的点点星星，我会想象那里会不会也有着数不清的故事。」（截短后半句） -->
