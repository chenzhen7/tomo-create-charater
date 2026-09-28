---
name: 提弗洛斯（SD）
reference_id: d6b75dc5b5dd44919bd0dbd921222ec6
# 上传参数（步骤⑦ 自动读取）：lang / description / tags
lang: zh
description: 《明日方舟：终末地》罗德岛出身的荒野猎手，萨卡兹「再旅者」。冷静得像个老猎人，却会拿着笔记本追着人要故事——句子短、爱用打猎比喻，认定传说该由活着的人继续讲下去
tags: 明日方舟终末地,提弗洛斯,萨卡兹,荒野猎手,明日方舟
---

> **取材纪律：优先原句 → 再化用 → 最后才原创。** 每条出处写在条目下的 `<!-- -->` 里
> （parser 不认的行一律跳过，见 dialogue.js:86）。
>
> **口吻锚点**：称呼用户一律「**管理员**」（终末地语境，**不是**「博士」）。句子极短、几乎不用修辞，
> 作战语音全是两三个字（「让开。」「别吵。」「留心！」）；习惯把人与事都换算成**狩猎**
> （等待、观察、攻击 / 猎物走上绝路 / 守夜）；核心动机是**记录传说**——笔记本是圣物，谁都不给看，
> 却给管理员留了最后一页。冷静「远超成年人」，但好奇心旺盛、有孩子心性。
>
> **资料源**：中文语音集共 81 条，另有干员档案四则。她与《明日方舟》的**提丰**同源
> （再旅者，日配同为**大空直美**），但**提丰的台词不算数**——本表只用终末地的文本。

## session-start

- file: session-start-1.mp3
  text: [relaxed] 管理员，我按当时约定的来找你了。今天，要讲个什么故事给我听？
  name: 依约而来
  <!-- 原句 · 干员报到：「管理员，我按当时约定的来找你。那你呢？有没有想好我来到这里后，要给我讲个什么样的故事？」 -->
- file: session-start-2.mp3
  text: [serious] 带好自己的武器和工具，半途跑回来取就太丢人了。
  name: 出门前的叮嘱
  <!-- 原句 · 行动准备1 -->
- file: session-start-3.mp3
  text: [serious] 狩猎永不结束。走吧。
  name: 狩猎永不结束
  <!-- 原句 · 档案资料三结尾：「狩猎永不结束。」 -->

## prompt-submit

- file: prompt-submit-1.mp3
  text: 说吧，你要委托我做什么？
  name: 领受委托
  <!-- 原句 · 编入队伍1 -->
- file: prompt-submit-2.mp3
  text: [serious] 好故事和好猎手一样，先瞄准的，都是心脏。
  name: 先瞄准心脏
  <!-- 原句 · 官方干员演示签名句 -->
- file: prompt-submit-3.mp3
  text: [serious] 等待、观察、攻击。
  name: 等待观察攻击
  <!-- 原句 · 战技1 -->

## permission-request

- file: permission-request-1.mp3
  text: [serious] 预言并非注定，结局该是我们自己书写。
  name: 由你书写
  <!-- 原句 · 待命1 -->
- file: permission-request-2.mp3
  text: 弓已经拉开了。放，还是不放，你说。
  name: 弦已拉满
  <!-- 拟写 · 狩猎比喻，无对应原句 -->
- file: permission-request-3.mp3
  text: 直觉告诉我，这里值得再仔细看看。要动手吗？
  name: 直觉
  <!-- 化用 · 发现资源2：「直觉告诉我，这附近值得我们再仔细看看。」 -->

## turn-complete

- file: turn-complete-1.mp3
  text: [happy] 我喜欢这个结局。
  name: 喜欢这个结局
  <!-- 原句 · 作战胜利1 -->
- file: turn-complete-2.mp3
  text: 这一页写完了。下一页呢？
  name: 翻到下一页
  <!-- 化用 · 笔记本/传说意象（档案资料四：写完结局撕去重写） -->
- file: turn-complete-3.mp3
  text: [serious] 不该沉醉在胜利的喜悦中，得警惕。
  name: 保持警惕
  <!-- 原句 · 作战胜利2 -->

## turn-failure

- file: turn-failure-1.mp3
  text: [relaxed] 冷静，管理员，别着急。我们回头看看，是哪一步走歪了。
  name: 别着急
  <!-- 化用 · 信赖对话1：「冷静，管理员，别着急，我会保护你的。」 -->
- file: turn-failure-2.mp3
  text: 哪怕在最后一刻也没有放弃。这已经是最好的结局。
  name: 最好的结局
  <!-- 原句 · 作战失败，略缩 -->
- file: turn-failure-3.mp3
  text: 箭偏了不要紧。知道它偏在哪儿，就够了。
  name: 箭偏在哪儿
  <!-- 拟写 · 狩猎比喻，无对应原句 -->

## post-tool-use-failure

- file: post-tool-use-failure-1.mp3
  text: [serious] 留心，这一步出了岔子。
  name: 留心
  <!-- 化用 · 危险提醒：「留心！」 -->
- file: post-tool-use-failure-2.mp3
  text: 不行，还没到最后一刻。换个法子，再来。
  name: 还没到最后一刻
  <!-- 化用 · 负伤：「不行，还没到最后一刻。」 -->
- file: post-tool-use-failure-3.mp3
  text: 急不得。先看清楚，是哪一步错了。
  name: 急不得
  <!-- 拟写 · 无对应原句 -->

## task-completed

- file: task-completed-1.mp3
  text: [happy] 命运的馈赠。
  name: 命运的馈赠
  <!-- 原句 · 打开储藏箱 -->
- file: task-completed-2.mp3
  text: [happy] 很荣幸，有你做同伴。
  name: 很荣幸
  <!-- 原句 · 小队激励1：「很荣幸有你做同伴。」 -->
- file: task-completed-3.mp3
  text: [proud] 这一箭，正中。
  name: 正中
  <!-- 拟写 · 狩猎比喻，无对应原句 -->

## session-end

- file: session-end-1.mp3
  text: [relaxed] 愿你今夜好梦。
  name: 今夜好梦
  <!-- 原句 · 打招呼2 -->
- file: session-end-2.mp3
  text: [relaxed] 睡袋铺好了，今天我来守夜。你先休息。
  name: 我来守夜
  <!-- 化用 · 信赖对话3：「冷吗？我再添些柴火，睡袋已经铺好了，你先睡吧，今天我来守夜就好。」 -->
- file: session-end-3.mp3
  text: 现在看着我的眼睛，告诉我——我该敲晕你吗？
  name: 该敲晕你吗
  <!-- 原句 · 交谈5：「……现在看着我的眼睛，告诉我，我该敲晕你吗？」 -->
