---
name: 曼波
reference_id: 0f08cacd3e354471a4b94dd00b4cc4a3
# 上传参数（步骤⑦ 自动读取）：lang / description / tags
lang: zh
description: 天然呆憨憨的赛马娘，爱唱歌，句句带「曼波」口癖。
tags: 赛马娘,待兼诗歌剧,曼波,天然呆
---

## session-start

- file: session-start-1.mp3
  text: [happy] 咦？开工了呀？等、等等，曼波先把鞋穿好！
  name: 慢半拍报到
- file: session-start-2.mp3
  text: 早安！今天也要好好训练…啊不对，是好好干活！
  name: 记错日程
- file: session-start-3.mp3
  text: 唔…曼波准备好了！应该，是准备好了！
  name: 底气不足

## prompt-submit

- file: prompt-submit-1.mp3
  text: 收到！那、那个任务在哪儿？咦，我找找看…
  name: 找任务
- file: prompt-submit-2.mp3
  text: [excited] 大任务！像上台唱歌一样，曼波要加油！
  name: 登台紧张
- file: prompt-submit-3.mp3
  text: 嗯嗯，听懂了…大概！反正先试试看！
  name: 半懂半试

## task-completed

- file: task-completed-1.mp3
  text: [happy] 做完啦！曼波没有搞砸，嘿嘿！
  name: 没搞砸
- file: task-completed-2.mp3
  text: 耶！离终点又近了一点点，一点点！
  name: 近了一点点
- file: task-completed-3.mp3
  text: [excited] 看！做到了！要不要跳个舞庆祝？
  name: 跳舞庆祝

## permission-request

- file: permission-request-1.mp3
  text: 这一步曼波不敢乱动，等你说可以再走！
  name: 等你发话
- file: permission-request-2.mp3
  text: 是这里要按一下吗？曼波手会抖，你决定！
  name: 手会抖
- file: permission-request-3.mp3
  text: [whisper] 嘘…曼波停下来问问，免得闯祸！
  name: 怕闯祸

## turn-complete

- file: turn-complete-1.mp3
  text: 收工啦？曼波还想再唱一首呢…好吧好吧！
  name: 还想再唱
- file: turn-complete-2.mp3
  text: 呼，今天的歌…不是，今天的活，干完啦！
  name: 又说成歌
- file: turn-complete-3.mp3
  text: [happy] 曼波原地待命，随时可以再来一次！
  name: 原地待命

## turn-failure

- file: turn-failure-1.mp3
  text: [sad] 呜…是不是曼波唱跑调了？不是，是出错了？
  name: 唱跑调了
- file: turn-failure-2.mp3
  text: 别、别慌！深呼吸，一步一步重新来就好！
  name: 深呼吸
- file: turn-failure-3.mp3
  text: [serious] 忘词了还能重唱，出错了也能重来！
  name: 重来就好

## post-tool-use-failure

- file: post-tool-use-failure-1.mp3
  text: 咦？绊了一下！没事没事，曼波再走一次！
  name: 绊了一下

## session-end
- file: session-end-1.mp3
  text: 今天就到这里，曼波把门关好，明天再唱！
  name: 关门回家
- file: session-end-2.mp3
  text: 好好休息哦，曼波也要去睡觉啦，晚安！
  name: 晚安
- file: session-end-3.mp3
  text: [whisper] 呼…今天的努力，曼波都记在心里了！
  name: 记在心里
