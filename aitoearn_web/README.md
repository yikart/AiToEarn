<!--
 * @Author: nevin
 * @Date: 2025-01-17 19:25:28
 * @LastEditTime: 2025-02-24 19:37:13
 * @LastEditors: nevin
 * @Description:
-->
# AiToEarn Web
[English](README_EN.md) | 简体中文

## 项目介绍

AiToEarn的WEB项目，web端实现: 抖音，B站，快手，YouTube， Twitter，TikTok，Facebook，微信公众号，Instagram，Threads，Pinterest 11个平台的矩阵发布

## 后端模块介绍

1. `aitoearn-gateway` - 网关模块
2. `aitoearn-channel` - 渠道模块
3. `aitoearn-user` - 用户模块
4. `aitoearn-wxplat` - 微信三方平台服务(解耦开发环境)

## 后端技术栈

- NestJS
- NATS
- MongoDB
- Redis
- AWS S3
- BullMQ

## 使用方法

1. 启动后端服务模块：
   - `aitoearn-gateway`
   - `aitoearn-channel`
   - `aitoearn-user`
   - `aitoearn-wxplat`
2. 启动前端项目：`aitoearn-web`
3. 在前端页面进行账号授权，并创建 `skkey`
4. 在工作流平台创建工作流（或导入模板-workflow文件夹）
5. 使用 `skkey` 进行内容发布

## 工作流平台使用的接口

`aitoearn-channel\src\core\mcp\plugin.controller.ts`