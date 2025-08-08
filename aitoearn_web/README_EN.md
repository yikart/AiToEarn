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

AiToEarn WEB project implements matrix publishing across 11 platforms on the web side: Twitter, TikTok, Facebook, Instagram, Threads, Pinterest 
![Douyin](https://lf1-cdn-tos.bytegoofy.com/goofy/ies/douyin_web/public/favicon.ico 'Douyin') Douyin
![Bilibili](https://i0.hdslb.com/bfs/static/jinkela/long/images/favicon.ico 'Bilibili') Bilibili
![Kuaishou](https://s1-111422.kwimgs.com/kos/nlav111422/ks-web/favicon.ico 'Kuaishou') Kuaishou
![WeChat Official Accounts](https://res.wx.qq.com/a/wx_fed/assets/res/NTI4MWU5.ico 'WeChat Official Accounts') WeChat Official Accounts
![YouTube](https://ts1.tc.mm.bing.net/th/id/ODF.cUjlg4bwA5-JhXB6Kg6qZA?w=32&h=32&qlt=70&pcl=fffffa&o=7&cb=thws4&pid=1.2&rm=3 'YouTube') YouTube
Matrix publishing across 11 platforms

## Backend Modules

1. `aitoearn-gateway` - Gateway module
```tree
├── config                                   Configuration files for different environments
│
├── src                                      
│   ├── auth                                 Authentication module
│   ├── common                               Common module
│   ├── core                                 Main process source code
│   │   ├── file                             File module
│   │   ├── plat                             Third-party platform module
│   │   └── ...                              Others
│   ├── libs                                 Utility modules
│   ├── transports                           Communication module
│   └── views                                Views
```
2. aitoearn-channel - Channel module
```tree
├── config                      
│             Configuration files for different environments （Developer keys and keys of various third-party platforms，The wechat third-party platform is configured in the │             aitoearn-wxplay project configuration file）
│
├── src                                      
│   ├── common                               Common module
│   ├── core                                 Main process source code
│   │   ├── account                          Third-party platform account module
│   │   ├── dataCube                         Third-party platform data statistics module
│   │   ├── file                             File module
│   │   ├── interact                         Interaction module
│   │   ├── mcp                              MCP service module
│   │   ├── plat                             Third-party platform module
│   │   ├── publish                          Publishing module
│   │   ├── skKey                            skKey module
│   │   └── ...                              Others
│   ├── libs                                 Utility modules
│   ├── transports                           Communication module
│   └── views    
```
3. aitoearn-user - User module
4. aitoearn-wxplat - WeChat third-party platform service (decoupled development environment)

## Backend Technology Stack
NestJS Node.js framework
NATS Message queue
MongoDB
Redis
AWS S3
BullMQ
## Usage Instructions
1. Start backend service modules separately: Local startup: Create local.config.js file in config directory (copy dev.config.js file and modify configuration)
```sh
pnpm i 
pnpm run dev:local
```
2. Start frontend project: aitoearn-web
```sh
pnpm i 
pnpm run dev
```
3. Add platform accounts on the frontend page
   <img src="./workflow/img/account.jpeg" alt="post" width="500"/>
4. Create skkey associated with multiple accounts
   <img src="./workflow/img/skkey.jpg" alt="post" width="500"/>
5. Create workflows on the workflow platform (or import templates from workflow folder)
6. Use skkey for content publishing in workflow parameter settings
   <img src="./workflow/img/fl.jpg" alt="post" width="500"/>

## Workflow Platform Interface
aitoearn-channel\src\core\mcp\plugin.controller.ts