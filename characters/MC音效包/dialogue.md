---
name: MC音效包
# 非 TTS 音效包：text 字段为音效说明，不走 Fish Audio 合成；素材为 Minecraft 现成音效
# 素材多为 Mojang 版权音：仅限个人使用，只上传测试环境验收，不上生产市场
lang: zh
description: Minecraft 经典音效包：开工叮 / 收任务 / 摆方块 / 升级 / 苦力怕警告等
tags: Minecraft,MC,音效包,游戏音效
---

## session-start

- file: orb.mp3
  text: MC 经验球拾取音（清脆叮声），开工欢迎

## prompt-submit

- file: chest-open.mp3
  text: MC 箱子打开声，收到新任务

## task-completed

- file: levelup.mp3
  text: MC 等级升级竖琴音，任务完成

## permission-request

- file: villager-hmm.mp3
  text: MC 村民疑惑声，等你点头

## turn-complete

- file: anvil-land.mp3
  text: MC 铁砧落定声，完工落定

## turn-failure

- file: creeper-hiss.mp3
  text: MC 苦力怕引信嘶声，出错警告

## post-tool-use-failure

- file: anvil-break.mp3
  text: MC 铁砧损坏声，工具出错的小提醒

## session-end
- file: chest-close.mp3
  text: MC 箱子关闭声，合箱收工
