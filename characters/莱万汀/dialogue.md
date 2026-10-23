---
name: 莱万汀
reference_id: 8b264b8ffa7a41abbb3e14ca4e56ced4
# 上传参数（步骤⑦ 自动读取）：lang / description / tags
lang: zh
description: 《明日方舟：终末地》萨卡兹「再旅者」，自我定义是剑与火焰。句子极短、开口就是命令，句长极少超 15 字，尾音挂着「哼」「啧」「嘁」，主动拒绝一切肯定与说教；关心全藏在反话里——「别误会，我没在特意等你。」反差是狂爱冰淇淋、偏爱低温
tags: 明日方舟终末地,莱万汀,萨卡兹,再旅者,明日方舟
---

> **取材纪律：优先原句 → 再化用 → 最后才拟写。** 每条出处写在条目下的 `<!-- -->` 里
> （parser 不认的行一律跳过，见 dialogue.js:86）。
>
> **口吻锚点**：称呼用户一律「**管理员**」，直呼、无敬语。萨卡兹「再旅者」，自我定义是
> **剑与火焰**。句式：**极短句 + 命令式 + 嘴硬**——句长极少超 15 字，战斗台词全是两到四字
> （「斩断！」「焚烧黑暗！」「灰飞烟灭吧！」）；高频尾音「**哼**」「**啧**」「**嘁**」。
> **主动拒绝一切肯定与说教**（这算什么？鼓励？肯定？不需要）；**关心必须藏在反话 / 否认
> 句式里**（「是你……别误会，我没在特意等你。」「我没兴趣看你硬撑。」）。长句只出现在
> 信赖 / 话题类语音，本表基本不取。反差萌：狂爱冰淇淋甜点、偏要待在低温环境。
>
> **资料源**：中文语音集共 81 条（BWIKI 语音记录）+ 信赖对话 / 帝江号闲聊 / 精英化晋升。
> 她是少数在 `session-end` 有真正对位原句（「休整」）的角色，该节优先用原句。

## session-start

- file: session-start-1.mp3
  text: 我们不是见过了吗？比起自我介绍，还是用剑与火焰来记住我吧。
  <!-- 原句 · 语音记录·干员报到 -->
- file: session-start-2.mp3
  text: [serious] 我是剑，我是火焰。
  <!-- 原句 · 语音记录·编入队伍2 -->
- file: session-start-3.mp3
  text: 啊，你在这里。
  <!-- 原句 · 语音记录·打招呼1 -->

## prompt-submit

- file: prompt-submit-1.mp3
  text: 有我一个人就够了。
  <!-- 原句 · 语音记录·编入队伍1 -->
- file: prompt-submit-2.mp3
  text: 接下来的事，最好值得我记住。
  <!-- 原句 · 语音记录·行动准备2 -->
- file: prompt-submit-3.mp3
  text: 早该动手了。
  <!-- 原句 · 语音记录·作战开始2 -->

## permission-request

- file: permission-request-1.mp3
  text: [serious] 看见那个家伙了？要我出手吗？
  <!-- 原句 · 语音记录·发现强敌 -->
- file: permission-request-2.mp3
  text: 放心去看看吧，跟在我身后就行了。
  <!-- 原句 · 语音记录·发现未探索区域 -->
- file: permission-request-3.mp3
  text: 在这条路上，无论去哪儿，都可以叫我同行。
  <!-- 原句 · 语音记录·信赖对话5 -->

## turn-complete

- file: turn-complete-1.mp3
  text: 连热身都算不上。
  <!-- 原句 · 语音记录·作战胜利1 -->
- file: turn-complete-2.mp3
  text: 胜利是理所应当的。
  <!-- 原句 · 语音记录·作战胜利2 -->
- file: turn-complete-3.mp3
  text: 已经做得很好了。下一次先把棘手的交给我。
  <!-- 原句 · 语音记录·作战胜利4 —— 否认式关心的变形 -->

## turn-failure

- file: turn-failure-1.mp3
  text: [serious] 我不会再让这种情况发生。
  <!-- 原句 · 语音记录·作战失败 -->
- file: turn-failure-2.mp3
  text: [sad] 啧……死不了。
  <!-- 原句 · 语音记录·负伤 -->
- file: turn-failure-3.mp3
  text: 我没兴趣看你硬撑。
  <!-- 原句 · 语音记录·使用战术物品1 -->

## post-tool-use-failure

- file: post-tool-use-failure-1.mp3
  text: [serious] 你想发愣到什么时候？
  <!-- 原句 · 语音记录·危险提醒 -->
- file: post-tool-use-failure-2.mp3
  text: 哼，不碍事了。
  <!-- 原句 · 语音记录·使用战术物品2 -->
- file: post-tool-use-failure-3.mp3
  text: 嘁，一点小磕碰而已。继续。
  <!-- 拟写 · 工具级小失败无对位原句（危险提醒 / 战术物品两条已用在前两条，负伤与硬撑语义偏重留给 turn-failure）；按「极短句 + 尾音『嘁』」自撰 -->

## task-completed

- file: task-completed-1.mp3
  text: 我记得你喜欢这些。
  <!-- 原句 · 语音记录·打开储藏箱 -->
- file: task-completed-2.mp3
  text: [serious] 真正有价值的东西经得住火炼。
  <!-- 原句 · 语音记录·采集矿物1 -->
- file: task-completed-3.mp3
  text: 嗯，不错，下次我来。
  <!-- 原句 · 语音记录·小队激励2 -->

## session-end

- file: session-end-1.mp3
  text: 如果还觉得冷，可以往我这边靠。
  <!-- 原句 · 语音记录·休整 -->
- file: session-end-2.mp3
  text: 是你……别误会，我没在特意等你。
  <!-- 原句 · 语音记录·打招呼2 -->
- file: session-end-3.mp3
  text: [relaxed] 感觉有点冷？是我把温控调低的……受不了就靠过来。
  <!-- 化用 · 语音记录·帝江号闲聊4：「感觉有点冷？是我要求把温控度数调低的，谁让这艘船连露天吹风的地方都没有。要是受不了的话，就站得离我近点儿。」（截短中段，末句改为「靠过来」） -->
