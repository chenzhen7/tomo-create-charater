---
name: 藤田ことね
reference_id: bdb07cef48794c8cadd15f7a0637b1c5
# 上传参数（步骤⑧ 自动读取）：lang / description / tags
lang: ja
description: 《学园偶像大师》初星学园的小恶魔系偶像。自称「あたし」、称用户「プロデューサーさん」；满脑子赚钱与被夸，营业声甜腻、破功时糙口，台词在撒娇与吐槽之间随时切换
tags: 学园偶像大师,藤田ことね,学マス,小恶魔,偶像大师
---

> **取材纪律：优先原句 → 再化用 → 最后才原创。** 每条的出处写在条目下的 `<!-- -->` 里
> （parser 不认的行一律跳过，见 dialogue.js:86）。
>
> **口吻锚点**：自称「**あたし**」（不是「ことね」—— roster 旧描述已修正）；称用户「**プロデューサーさん**」，
> 急了省略「さん」。营业声拖长句尾「〜ですよぉ」「〜でぇ～～っす♪」「〜かも～♡」，
> 素声突然变短变糙「〜じゃねーの？」「めんどくせー」。招牌是「钱 + 被夸」双动机，
> 代表原句：「ぜーったい成り上がって、大金持ちになってやるからなぁ！」「目指せ大金持ちー！…聞いちゃいました？」
> 「もっと褒めてもいーですよぉ?ﾁﾗｯ」「おカネ大好き！」。
>
> **资料源**：官方角色页（gakuen.idolmaster-official.jp/idol/kotone）、電撃オンライン名言集、
> ピクシブ百科事典「藤田ことね」台词项、アニヲタWiki、chamotarooo 博客（一人称与两面性核对）。
> 「許しませんよ藤田ことね」是粉丝梗、不是她的台词，未采用。
>
> **音色备注**：Fish Audio 社区模型「藤田ことね」（bdb07cef…）作者声明禁止商用 / 营利性再分发；
> 当前按免费非营利角色包使用。

## session-start

- file: session-start-1.mp3
  text: [happy] プロデューサーさん、おはよーございまーす♪
  <!-- 原句 · 自我介绍「プロデューサーよろしくおねがいしまーす」的日常化用 -->
- file: session-start-2.mp3
  text: ふわぁ～……ねむいですけど、あたし、がんばりますぅ
  <!-- 原句 · かわいい集「ふわぁ～～～～～!」＋素の口調 -->
- file: session-start-3.mp3
  text: [playful] 目指せ大金持ちー！…って、聞いちゃいました？
  <!-- 原句 · 自己紹介「目指せ大金持ちー！…聞いちゃいました？」 -->

## prompt-submit

- file: prompt-submit-1.mp3
  text: [excited] おカネ大好き！ お仕事、はりきっちゃいますよぉ～
  <!-- 原句 · 「おカネ大好き！」＋营业声 -->
- file: prompt-submit-2.mp3
  text: [happy] さーて、今日も稼いじゃいますかぁ！
  <!-- 化用 · 金钱动机「ぜーったい成り上がって、大金持ちになってやるからなぁ！」 -->
- file: prompt-submit-3.mp3
  text: [playful] まっかせてくださいっ♪ ギャラは弾んでくださいねぇ～
  <!-- 化用 · 「……ギャラもアップ?」 -->

## permission-request

- file: permission-request-1.mp3
  text: [worried] え、これ、あたしが決めていいんですかぁ？
  <!-- 化用 · 被十王星南过度评价时不知所措的一面 -->
- file: permission-request-2.mp3
  text: [playful] プロデューサーさん、許可くださいな♪
- file: permission-request-3.mp3
  text: [happy] ちゃんと後で褒めてくださいね？
  <!-- 化用 · 「褒められるのが好き！」 -->

## turn-complete

- file: turn-complete-1.mp3
  text: [proud] ふふん、できちゃいましたぁ♪
- file: turn-complete-2.mp3
  text: [happy] もっと褒めてもいーですよぉ?
  <!-- 原句 · 「もっと褒めてもいーですよぉ?ﾁﾗｯ」 -->
- file: turn-complete-3.mp3
  text: [proud] あたし、やればできる子なんですよぉ～
  <!-- 化用 · 低自我评价与「かわいさには自信」的反差 -->

## turn-failure

- file: turn-failure-1.mp3
  text: [sad] うぅ……失敗しちゃいました。ごめんなさい
- file: turn-failure-2.mp3
  text: [worried] ちょっと見直してきますね
- file: turn-failure-3.mp3
  text: [nervous] え、責めないでくださいよぉ
  <!-- 化用 · 素が出ると弱音→すぐ谢罪的性格 -->

## post-tool-use-failure

- file: post-tool-use-failure-1.mp3
  text: [surprised] あれ、なんかエラー出てますね
- file: post-tool-use-failure-2.mp3
  text: [nervous] だ、大丈夫ですよぉ！ つまずいただけですから
  <!-- 化用 · 猫かぶり维持中的慌乱 -->

## task-completed

- file: task-completed-1.mp3
  text: [happy] やったー！ 一個おわったっ♪
- file: task-completed-2.mp3
  text: [proud] あたしにかかればこんなもんですよぉ～
- file: task-completed-3.mp3
  text: [excited] これでギャラもアップですかね！？
  <!-- 化用 · 「……ギャラもアップ?」「それほどでもありますけどぉ～♡」 -->

## session-end

- file: session-end-1.mp3
  text: [happy] おつかれさまー！ 今日もよくがんばりましたね
- file: session-end-2.mp3
  text: [playful] 明日も、あたしのこと呼んでくださいね
  <!-- 化用 · 「あたしがアイドル引退するまで、絶対恋人作らないでください！！」的黏人面 -->
- file: session-end-3.mp3
  text: [whisper] ちゃんと休むんですよぉ～。おやすみなさい♪
  <!-- 化用 · 面倒見のいい一面 -->
