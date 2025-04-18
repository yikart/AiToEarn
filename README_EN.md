<!--
 * @Author: nevin
 * @Date: 2025-01-17 19:25:28
 * @LastEditTime: 2025-02-24 20:17:47
 * @LastEditors: nevin
 * @Description:
-->

# AiToEarn

![GitHub stars](https://img.shields.io/github/stars/yikart/AttAiToEarn?color=fa6470)
![GitHub issues](https://img.shields.io/github/issues/yikart/AttAiToEarn?color=d8b22d)
![GitHub license](https://img.shields.io/github/license/yikart/AttAiToEarn)
[![Required Node.JS 20.18.x](https://img.shields.io/static/v1?label=node&message=20.18.x%20&logo=node.js&color=3f893e)](https://nodejs.org/about/releases)

[简体中文](README.zh-CN.md) | English

## Overview

One-click publishing tool for multiple social media platforms, such as douyin, red book, wechat channels, kuaishou.

## Supported Platforms

![Douyin](https://lf1-cdn-tos.bytegoofy.com/goofy/ies/douyin_web/public/favicon.ico 'Douyin') Douyin (TikTok)  
![Xiaohongshu](https://www.xiaohongshu.com/favicon.ico 'Xiaohongshu') Xiaohongshu (Little Red Book)  
![WeChat Channels](https://res.wx.qq.com/t/wx_fed/finder/helper/finder-helper-web/res/favicon-v2.ico 'WeChat Channels') WeChat Channels  
![Kuaishou](https://s1-111422.kwimgs.com/kos/nlav111422/ks-web/favicon.ico 'Kuaishou') Kuaishou

## Quick Start

```sh
# Clone the project
git clone https://github.com/yikart/AttAiToEarn.git

# Enter the project directory
cd AttAiToEarn

# Install dependencies
npm i

# Start development
npm run dev
```

## Upper Frame

- vite [template-react-ts](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts)
- Electron + react [electron-vite-react](https://github.com/electron-vite/electron-vite-react)

## Catalogue

\_🚨 By default, files in the 'electron' folder will be built to 'dis-electron'

```tree
├── build                                    Build-related files
│
├── common                                   Shared types/constants between renderer and main processes
│
├── electron                                Electron source code
│   ├── db                                  SQLite3 database
│   │   ├── migrations                      Database migration scripts
│   │   ├── models                          Database entities
│   │   ├── scripts                         Database scripts
│   │   └── index.ts                        Database entry
│   ├── global                              Renderer process globals
│   ├── main                                Main process source
│   │   ├── api                             Business APIs
│   │   ├── core                            Core modules (DI, decorators)
│   │   └── ...                             Others
│   ├── plat                                Third-party platforms
│   ├── preload                             Preload-scripts
│   ├── tray                                System tray
│   └── util                                Utilities
│
├── public                                  Public assets
│
├── scripts                                 Build scripts
│
├── release                                 Build output
│   └── {version}
│       ├── {os}-{os_arch}                  Unpacked binaries
│       └── {app_name}_{version}.{ext}      Installers
│
├── public                                  Same as Vite template's public
└── src                                     Renderer process source (React)
```
## Other explanations
Regarding the MAC package, as Apple has strict requirements for applications, this project is still in the trial stage. Please package it yourself or set the ignore security policy