<!--
 * @Author: nevin
 * @Date: 2025-01-17 19:25:28
 * @LastEditTime: 2025-02-24 19:37:13
 * @LastEditors: nevin
 * @Description:
-->
# AiToEarn Web
[简体中文](README.md) | English

## Project Introduction

AiToEarn WEB project implements matrix publishing across 11 platforms on the web side: Douyin, Bilibili, Kuaishou, YouTube, Twitter, TikTok, Facebook, WeChat Official Accounts, Instagram, Threads, and Pinterest.

## Backend Modules Introduction

1. `aitoearn-gateway` - Gateway module
2. `aitoearn-channel` - Channel module
3. `aitoearn-user` - User module
4. `aitoearn-wxplat` - WeChat third-party platform service (decoupled development environment)

## Backend Technology Stack

- NestJS
- NATS
- MongoDB
- Redis
- AWS S3
- BullMQ

## Usage Instructions

1. Start backend service modules:
   - `aitoearn-gateway`
   - `aitoearn-channel`
   - `aitoearn-user`
   - `aitoearn-wxplat`
2. Start frontend project: `aitoearn-web`
3. Authorize accounts and create `skkey` on the frontend page
4. Create workflows on the workflow platform (or import templates from the workflow folder)
5. Use `skkey` for content publishing

## Workflow Platform Interface

`aitoearn-channel\src\core\mcp\plugin.controller.ts`