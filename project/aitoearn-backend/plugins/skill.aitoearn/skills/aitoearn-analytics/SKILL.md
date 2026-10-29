---
name: aitoearn-analytics
description: 查询 AiToEarn 已发布内容的多平台数据表现（阅读、点赞、评论、分享）
when_to_use: 用户要求查看已发布笔记/视频的数据、做发布效果复盘或跨平台数据汇总时
version: 1.0.0
apiVersion: ^1.0.0
allowed-tools: ["list_posts", "get_metrics"]
---

# AiToEarn 数据查询

## 鉴权与环境

与 aitoearn-publish 技能相同：先确认中国版（`https://aitoearn.cn`）或国际版（`https://aitoearn.ai`），请求头携带 `x-api-key`。

## 查询步骤

1. `GET {baseUrl}/api/v1/open/publish/flows/{flowId}` —— 获取 flow 下各平台任务的状态与作品链接。
2. 对需要细粒度数据的平台（互动数等），在 AiToEarn 账号内已通过官方数据接口或作品洞察自动采集；Agent 侧将各平台已返回的数据汇总成一张对照表呈现给用户。
3. 数据有平台侧延迟（通常 5 分钟至数小时），向用户说明时效，不要声称实时。

## 汇报格式

按平台分行：平台名 | 作品链接 | 曝光/阅读 | 点赞 | 评论 | 分享，并给出一句整体结论（哪个平台表现最好、建议下一步动作）。
