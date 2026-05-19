# 巨鲸网络浏览器桥接插件

这是巨鲸网络客户雷达使用的 Chrome Extension MVP。它兼容现有 Web 端的 `window.AIToEarnPlugin` 协议，让客户雷达可以从官方 AiToEarn 插件切换到我们自己的插件。

## 当前能力

- 注入 `window.AIToEarnPlugin`
- `checkPermission()`：检查 `cookies / tabs / storage` 权限
- `getVersion()`：返回巨鲸插件版本
- `login('xhs')`：通过 Cookie 和已打开页面检测小红书登录态
- `login('douyin')`：通过 Cookie 和已打开页面检测抖音登录态
- `xhsRequest(...)`：用浏览器 Cookie 发起小红书请求
- `douyinRequest(...)`：用浏览器 Cookie 发起抖音请求
- `douyinInteraction(...) / unifiedInteraction(...)`：通过平台页面执行器完成点赞、收藏、评论、私信等动作
- 小红书评论接口失败时，会回退到当前作品页 DOM 执行器：可识别可见评论、填写评论框并点击发布
- `unifiedInteraction({ action: 'discoverByKeyword' })`：打开平台搜索页，识别别人笔记和评论里的潜在线索

## 安装测试

1. 打开 Chrome：`chrome://extensions`
2. 开启右上角「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择本目录：

   `/Users/forkman03/Documents/Aitoearn/AiToEarn/project/jujing-browser-extension`

5. 打开 `http://localhost:8080/zh-CN/customer-radar`，或本地开发端口 `http://localhost:6060/zh-CN/customer-radar`
6. 刷新页面，点击「检测插件/账号」或「插件诊断」
7. 如需真实执行评论/私信，先在同一浏览器登录并打开目标小红书或抖音作品页
8. 如需测试关键词获客，在客户雷达里填写关键词，点击「搜索并生成线索」

## 登录态要求

小红书需要同时登录：

- `https://www.xiaohongshu.com`
- `https://creator.xiaohongshu.com`

抖音需要登录：

- `https://www.douyin.com`
- 或 `https://creator.douyin.com`

## 重要说明

当前版本已经具备页面执行器基础能力，但它依赖平台真实页面结构。小红书评论接口可能需要 `x-s / x-t` 等签名头，所以插件会优先尝试接口请求，失败后回退到页面 DOM 执行。真实生产使用前，还需要针对平台页面变更继续做选择器加固和风控限频。

本地开发端口通过 Chrome match pattern `http://*:*/*` 覆盖，`content-home.js` 会在运行时只允许 `localhost`、`127.0.0.1`、`aitoearn.cn`、`aitoearn.ai` 相关入口注入页面桥接。
