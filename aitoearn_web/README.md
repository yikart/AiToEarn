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

AiToEarn的WEB项目，web端实现: Twitter，TikTok，Facebook，Instagram，Threads，Pinterest 
![抖音](https://lf1-cdn-tos.bytegoofy.com/goofy/ies/douyin_web/public/favicon.ico '抖音') 抖音
![B站](https://i0.hdslb.com/bfs/static/jinkela/long/images/favicon.ico 'B站') B站
![快手](https://s1-111422.kwimgs.com/kos/nlav111422/ks-web/favicon.ico '快手') 快手
![微信公众号](https://res.wx.qq.com/a/wx_fed/assets/res/NTI4MWU5.ico '微信公众号') 微信公众号
![YouTube](https://ts1.tc.mm.bing.net/th/id/ODF.cUjlg4bwA5-JhXB6Kg6qZA?w=32&h=32&qlt=70&pcl=fffffa&o=7&cb=thws4&pid=1.2&rm=3 'YouTube') YouTube
11个平台的矩阵发布

## 后端模块

1. `aitoearn-gateway` - 网关模块
```tree
├── config                                   不同环境的配置文件
│
├── src                                      
│   ├── auth                                 认证模块
│   ├── common                               公共模块
│   ├── core                                 主进程源码
│   │   ├── file                             文件模块
│   │   ├── plat                             三方平台模块
│   │   └── ...                              其他
│   ├── libs                                 工具模块
│   ├── transports                           通信模块
│   └── views                                视图
```
2. `aitoearn-channel` - 渠道模块
```tree
├── config                                   不同环境的配置文件
│
├── src                                      
│   ├── common                               公共模块
│   ├── core                                 主进程源码
│   │   ├── account                          三方平台账号模块
│   │   ├── dataCube                         三方平台数据统计模块
│   │   ├── file                             文件模块
│   │   ├── interact                         互动模块
│   │   ├── mcp                              MCP服务用模块
│   │   ├── plat                             三方平台模块
│   │   ├── publish                          发布模块
│   │   ├── skKey                            skKey模块
│   │   └── ...                              其他
│   ├── libs                                 工具模块
│   ├── transports                           通信模块
│   └── views    
```
3. `aitoearn-user` - 用户模块
4. `aitoearn-wxplat` - 微信三方平台服务(解耦开发环境)

## 后端技术栈

- NestJS nodejs 框架
- NATS 消息队列
- MongoDB
- Redis
- AWS S3
- BullMQ

## 使用方法

1. 分别启动后端服务模块：
   本地启动：config目录下创建local.config.js文件（复制dev.config.js文件修改配置）
   ```sh
   pnpm i 
   pnpm run dev:local
   ```
2. 启动前端项目：`aitoearn-web`
   ```sh
   pnpm i
   pnpm run dev
   ```
3. 在前端页面进行添加平台账号
<img src="./workflow/img/account.jpeg" alt="post" width="500"/>

4. 创建关联多个账号的 `skkey`
<img src="./workflow/img/skkey.jpg" alt="post" width="500"/>

4. 在工作流平台创建工作流（或导入模板-workflow文件夹）
5. 在工作流的参数设置使用 `skkey` 进行内容发布
<img src="./workflow/img/fl.jpg" alt="post" width="500"/>

## 工作流平台使用的接口

`aitoearn-channel\src\core\mcp\plugin.controller.ts`