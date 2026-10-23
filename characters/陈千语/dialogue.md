---
name: 陈千语
reference_id: ac8cb824154f4469aba3e85bb8b0150e
# 上传参数（步骤⑦ 自动读取）：lang / description / tags
lang: zh
description: 《明日方舟：终末地》龙族侠客，佩丽卡的护卫。短促感叹句密集，语气词「嘿/哇/欸/好嘞」不离口；招牌是「自夸 → 立刻讨夸」的循环——先炫一句，再眼巴巴等你夸她。满口侠客江湖词汇，战斗时喊单字，剑招起手「当破即破！当断即断！当弃即弃！」
tags: 明日方舟终末地,陈千语,龙族,侠客,明日方舟
---

> **取材纪律：优先原句 → 再化用 → 最后才拟写。** 每条出处写在条目下的 `<!-- -->` 里
> （parser 不认的行一律跳过，见 dialogue.js:86）。
>
> **口吻锚点**：称呼用户一律「**管理员**」（终末地语境）。龙族侠客、佩丽卡的护卫——
> 短促感叹句密集，语气词不离口（嘿 / 哇 / 欸 / 好嘞 / 嘛）；招牌是**「自夸 → 立刻讨夸」循环**：
> 先炫一句，再眼巴巴等你夸她（待命1 → 精英化晋升3 是原型）。满口侠客江湖词汇
> （侠客 / 剑法 / 秘笈 / 磨刀不误砍柴工），战斗时喊单字，起手是「当破即破！当断即断！当弃即弃！」。
>
> **资料源**：中文语音集共 79 条。**session-end 素材偏薄**——全套语音里只有 2 条勉强对位，
> 素材已自注，该节 1 条为拟写；素材里标 ⚠ 的条目是**语义外延**，出处注里已如实标出。

## session-start

- file: session-start-1.mp3
  text: [happy] 管理员！陈千语前来报到！
  <!-- 化用 · 干员报到：「管理员！我——嗯？走流程？哦，懂了懂了。终末地干员陈千语，前来报到！」（截短，略去「走流程」的插科打诨） -->
- file: session-start-2.mp3
  text: [happy] 嘿，这儿呢，管理员！
  <!-- 原句 · 待命2 -->
- file: session-start-3.mp3
  text: 准备？嘿，我的剑可没有懈怠的时候！
  <!-- 原句 · 行动准备1 -->

## prompt-submit

- file: prompt-submit-1.mp3
  text: 轮到我们了？该出手时就出手嘛。
  <!-- 原句 · 编入队伍1 -->
- file: prompt-submit-2.mp3
  text: [happy] 这样，再这样？好嘞，我已经明白了！
  <!-- 原句 · 观看作战记录 -->
- file: prompt-submit-3.mp3
  text: 收到收到，管理员你就放一百个心吧。
  <!-- 原句 · 进驻设施 -->

## permission-request

- file: permission-request-1.mp3
  text: 那里似乎有个厉害的家伙，让我来试试手吧。
  <!-- 原句 · 发现强敌 -->
- file: permission-request-2.mp3
  text: 能不能让我再往前站站？我想第一个出门！
  <!-- 原句 · 行动准备2 -->
- file: permission-request-3.mp3
  text: 咦？这里我们是不是没来过？
  <!-- 原句 · 发现未探索区域 -->

## turn-complete

- file: turn-complete-1.mp3
  text: [happy] 呼——意料之中。怎么样，帅不帅？
  <!-- 化用 · 作战胜利1：「呼——意料之中。」＋ 待命1：「起势——！怎么样，帅不帅？」（合成「自夸→讨夸」循环） -->
- file: turn-complete-2.mp3
  text: [happy] 耶！刚刚的配合简直完美！
  <!-- 原句 · 小队激励2 -->
- file: turn-complete-3.mp3
  text: 这次轻松。
  <!-- 原句 · 作战胜利2 -->

## turn-failure

- file: turn-failure-1.mp3
  text: [sad] ……再来！
  <!-- 原句 · 作战失败 -->
- file: turn-failure-2.mp3
  text: [sad] 唔，我没事！先对付他们。
  <!-- 原句 · 负伤 -->
- file: turn-failure-3.mp3
  text: [sad] 呜……可恶……不，再来！
  <!-- 化用 · 力竭：「呜……可恶……」＋ 作战失败：「……再来！」 -->

## post-tool-use-failure

- file: post-tool-use-failure-1.mp3
  text: [serious] 当心，快退后！
  <!-- 原句 · 危险提醒 -->
- file: post-tool-use-failure-2.mp3
  text: 快，用这个！
  <!-- 原句 · 使用战术物品1 -->
- file: post-tool-use-failure-3.mp3
  text: [relaxed] 呼……恢复过来了！
  <!-- 原句 · 使用战术物品2 -->

## task-completed

- file: task-completed-1.mp3
  text: [happy] 秘笈总是放在这种箱子里面呢！
  <!-- 原句 · 打开储藏箱 -->
- file: task-completed-2.mp3
  text: [happy] 没想到吧？我有专门对付石头的剑法。
  <!-- 原句 · 采集矿物1 -->
- file: task-completed-3.mp3
  text: [happy] 你这招很帅嘛！——欸，你也夸夸我呀？
  <!-- 化用 · 小队激励1：「你这招很帅嘛！」＋ 精英化晋升3：「哎呀，夸得我都不好意思啦——再来两句！」（收成讨夸循环的完整形态） -->

## session-end

- file: session-end-1.mp3
  text: [happy] 哎呀，管理员，剩下的还是交给我吧。劳逸结合！
  <!-- 原句 · 打招呼2 -->
- file: session-end-2.mp3
  text: [relaxed] 歇歇，磨刀不误砍柴工嘛！
  <!-- 原句 · 休整（素材标注 ⚠ 语义外延：原为中途休整语，此处借作收尾休息提示） -->
- file: session-end-3.mp3
  text: [relaxed] 好嘞，今天就到这儿！剩下的明天再打。
  <!-- 拟写 · 素材已自注该事件偏薄（全套仅 2 条勉强对位）：借「好嘞」语气词与侠客口吻补一条收尾 -->
