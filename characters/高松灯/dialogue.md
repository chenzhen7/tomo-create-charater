---
name: 高松灯
reference_id: b4f70fdef5f943c2bf43db00e80ad680
# 上传参数（步骤⑦ 自动读取）：lang / description / tags
lang: zh
description: 内向敏感的「企鹅」主唱，呢喃式独白，自称「私」，用歌声倾诉心事。
tags: BanG Dream,MyGO,高松灯,主唱,内向
---

## session-start

- file: session-start-1.mp3
  text: 啊…你来了。你能来，真好。
  name: 登场问候
- file: session-start-2.mp3
  text: 笔记本已经打开了…想写的东西，攒了好多呢。
  name: 笔记本开场
- file: session-start-3.mp3
  text: 今天…也一起加油吧。我会尽全力的。
  name: 拼命宣言

## prompt-submit

- file: prompt-submit-1.mp3
  text: 这个…是给我的吗？嗯，我会尽全力的。
  name: 接受任务
- file: prompt-submit-2.mp3
  text: 我记下来了…一句一句，像写歌词那样。
  name: 歌词式记录
- file: prompt-submit-3.mp3
  text: 那个…那就，开始了哦。
  name: 轻声开工

## task-completed

- file: task-completed-1.mp3
  text: [happy] 做好了…！这、这样可以吗？嘿嘿…
  name: 忐忑求夸
- file: task-completed-2.mp3
  text: 又积累了一个瞬间…这样下去，会变成"一辈子"的吧。
  name: 一辈子哲学
- file: task-completed-3.mp3
  text: 嗯，做到了…想把这个瞬间，也写进歌词里。
  name: 写进歌词

## permission-request

- file: permission-request-1.mp3
  text: 那个…这个，可以让我试试吗？我等你回答。
  name: 轻声请示
- file: permission-request-2.mp3
  text: 这个需要你决定…不着急，我会一直等你的。
  name: 创可贴请求

## turn-complete

- file: turn-complete-1.mp3
  text: 呼…到这里，告一段落了呢。我等你下一步。
  name: 完工待命
- file: turn-complete-2.mp3
  text: 迷路了也没关系…停下来看看风景，也挺好的。
  name: 迷路也没关系

## turn-failure

- file: turn-failure-1.mp3
  text: [sad] 呜…好像出错了。没关系，我们再确认一次吧。
  name: 安抚提醒
- file: turn-failure-2.mp3
  text: 走错路的话…停下来，看清脚下再走，好吗？
  name: 看清脚下

## post-tool-use-failure

- file: post-tool-use-failure-1.mp3
  text: 啊…这里卡住了。没关系，我再试一次…可以吗？
  name: 再试一次

## session-end
- file: session-end-1.mp3
  text: 今天辛苦了…笔记本先合上，好好休息哦。
  name: 合上笔记本
- file: session-end-2.mp3
  text: 明天见…那个，下次也能，陪我一起吗？
  name: 一辈子的约定
- file: session-end-3.mp3
  text: 把今天的瞬间收好…攒得多了，就会变成"一辈子"的。
  name: 收好今天
