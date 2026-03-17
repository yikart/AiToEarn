# Aitoearn-website

## Address

https://aitoearn.ai


# AiToEarn — The Best Open-Source AI Content Growth & Monetization Platform

## AiToEarn 的核心是Agent（Content Agent）。

每一个 Agent 都代表一位“可配置、可持续工作的 AI 创作者”，负责从内容生成到发布的完整流程。

Agent 不只是生成内容，而是 真正完成「创作 → 适配 → 发布」的闭环。

平台账号绑定（一次绑定，持续使用）

支持将 Agent 绑定到多个社交媒体账号

账号绑定后可长期复用，无需重复配置

一个 Agent 可同时管理多个平台账号

## 支持平台：

TikTok / YouTube / Instagram

X（Twitter） / Facebook / LinkedIn

小红书 / 抖音 / Bilibili / 快手 等


# 文档与资源

官方在线文档（帮助中心）：https://docs.aitoearn.ai/

官方网站： https://aitoearn.ai/


# 前端项目架构与技术栈

本项目是 AiToEarn 官网 / Web 应用前端，基于 Next.js 14（App Router） 构建，围绕 Agent 驱动的内容创作与发布流程 进行模块化设计。

整体目标是：

支撑 Agent 持续创作、账号绑定、多平台发布的复杂交互与状态管理


# 开发环境

Node.js & pnpm

npm run dev

自动化测试命令
npx playwright test tests/e2e/home/simple-test.spec.ts --headed --project=chromium

npm run test:agent

npm run test:agent:quick  