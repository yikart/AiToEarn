<!--
 * @Author: nevin
 * @Date: 2025-01-17 19:25:28
 * @LastEditTime: 2025-02-24 19:37:13
 * @LastEditors: nevin
 * @Description:
-->

# AiToEarn 爱团团

![GitHub stars](https://img.shields.io/github/stars/yikart/AttAiToEarn?color=fa6470)
![GitHub issues](https://img.shields.io/github/issues/yikart/AttAiToEarn?color=d8b22d)
![GitHub license](https://img.shields.io/github/license/yikart/AttAiToEarn)
[![Required Node.JS 20.18.x](https://img.shields.io/static/v1?label=node&message=20.18.x%20&logo=node.js&color=3f893e)](https://nodejs.org/about/releases)

[English](README_EN.md) | 简体中文

## 一句话介绍

抖音，小红书，视频号，快手等多个自媒体平台的一键发布工具

## 具体做了什么

- 视频一键发布
![抖音](https://lf1-cdn-tos.bytegoofy.com/goofy/ies/douyin_web/public/favicon.ico '抖音') 抖音
![小红书](https://www.xiaohongshu.com/favicon.ico '小红书') 小红书
![视频号](https://res.wx.qq.com/t/wx_fed/finder/helper/finder-helper-web/res/favicon-v2.ico '视频号') 视频号
![快手](https://s1-111422.kwimgs.com/kos/nlav111422/ks-web/favicon.ico '快手') 快手 

- 全网热门内容观察
  - 小红书低粉爆文排行榜
  - 小红书，抖音，视频号，快手每日，每周分赛道热门内容排行榜

## 正在实现中
- 发布参数扩展，增加声明，位置，链接等参数，支持短视频带货等
- 热门内容扩展，增加AI工具排行榜
- AI自动评论
- AI搜索评论

## 快速开始

```sh
# 克隆项目
git clone https://github.com/yikart/AttAiToEarn.git

# 进入目录
cd AttAiToEarn

# 安装依赖
npm i

# develop
npm run dev
```

## 上层框架

- vite官方 [template-react-ts](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts)
- Electron + react [electron-vite-react](https://github.com/electron-vite/electron-vite-react)

## 目录

\_🚨 默认情况下, `electron` 文件夹下的文件将会被构建到 `dist-electron`

```tree
├── build                                    打包需要的一些文件
│
├── commont                                  渲染进程和系统进程共同需要的类型,常量等
│
├── electron                                 Electron 源码文件夹
│   ├── db                                   sqlite3 数据库
│   │   ├── migrations                       数据库迁移脚本文件
│   │   ├── models                           数据库实体文件
│   │   ├── scripts                          数据库脚本文件
│   │   └── index.ts                         数据库入口文件
│   ├── global                               渲染进程的全局变量
│   ├── main                                 主进程源码
│   │   ├── api                              业务接口api
│   │   ├── core                             仿nestjs的核心模块(依赖注入、装饰器实现等)
│   │   └── ...                              其他
│   ├── plat                                 三方平台的代码
│   ├── preload                              Preload-scripts 源码
│   ├── tray                                 系统托盘
│   └── util                                 工具
│
├── public                                   公共资源
│
├── scripts                                  构建脚本
│
├── release                                  构建后生成程序目录
│   └── {version}
│       ├── {os}-{os_arch}                   未打包的程序(绿色运行版)
│       └── {app_name}_{version}.{ext}       应用安装文件
│
├── public                                   同 Vite 模板的 public
└── src                                      渲染进程源码、React代码
```
## 加我微信
辛苦备注一下 AiToEarn
<img src="./wechat.jpg" alt="wechat" width="500"/>
