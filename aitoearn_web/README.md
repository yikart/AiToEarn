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

AiToEarn的WEB项目，web端实现: 
<div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap; margin: 20px 0;">
    <img src="https://lf1-cdn-tos.bytegoofy.com/goofy/ies/douyin_web/public/favicon.ico" title="抖音" alt="抖音" width="32" height="32" style="object-fit: contain; transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
    <img src="https://i0.hdslb.com/bfs/static/jinkela/long/images/favicon.ico" title="B站" alt="B站" width="32" height="32" style="object-fit: contain; transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
    <img src="https://s1-111422.kwimgs.com/kos/nlav111422/ks-web/favicon.ico" title="快手" alt="快手" width="32" height="32" style="object-fit: contain; transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
    <img src="https://res.wx.qq.com/a/wx_fed/assets/res/NTI4MWU5.ico" title="微信公众号" alt="微信公众号" width="32" height="32" style="object-fit: contain; transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
    <img src="https://www.youtube.com/s/desktop/3ad23781/img/logos/favicon.ico" title="YouTube" alt="YouTube" width="32" height="32" style="object-fit: contain; transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
    <img src="https://abs.twimg.com/responsive-web/client-web/icon-svg.ea5ff4aa.svg" title="Twitter" alt="Twitter" width="32" height="32" style="object-fit: contain; transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
    <img src="https://www.tiktok.com/favicon.ico" title="TikTok" alt="TikTok" width="32" height="32" style="object-fit: contain; transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
    <img src="https://static.xx.fbcdn.net/rsrc.php/y1/r/ay1hV6OlegS.ico" title="Facebook" alt="Facebook" width="32" height="32" style="object-fit: contain; transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
    <img src="https://static.cdninstagram.com/rsrc.php/y4/r/QaBlI0OZiks.ico" title="Instagram" alt="Instagram" width="32" height="32" style="object-fit: contain; transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
    <img src="https://static.cdninstagram.com/rsrc.php/ye/r/lEu8iVizmNW.ico" title="Threads" alt="Threads" width="32" height="32" style="object-fit: contain; transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
    <img src="https://s.pinimg.com/webapp/logo_transparent_144x144-3da7a67b.png" title="Pinterest" alt="Pinterest" width="32" height="32" style="object-fit: contain; transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
</div>

抖音、小红书、快手、bilibili、公众号、 Tiktok、Youtube、Facebook、Instagram、Threads、Twitter、Pinterest等12个平台的矩阵发布

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
├── config                                   不同环境的配置文件(各个三方平台的开发者key和密钥，微信三方平台在aitoearn-wxplay项目配置文件配置)
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
