# 巨鲸网络浏览器桥接插件

这是巨鲸网络客户雷达使用的 Chrome Extension MVP。它兼容现有 Web 端的 `window.AIToEarnPlugin` 协议，但只作为客户雷达执行器使用；频道账号登录、归属和发布授权仍由原版系统/官方 OAuth 维护。

## 当前能力

- 注入 `window.AIToEarnPlugin`
- `checkPermission()`：检查 `cookies / tabs / storage` 权限
- `getVersion()`：返回巨鲸插件版本
- `login('xhs')`：通过 Cookie 和已打开页面检测小红书登录态
- `login('douyin' / 'kwai')`：不会同步账号，直接提示走官方 OAuth
- `xhsRequest(...)`：用浏览器 Cookie 发起小红书请求
- `douyinRequest(...)`：用浏览器 Cookie 发起抖音请求
- `douyinInteraction(...) / unifiedInteraction(...)`：通过平台页面执行器完成点赞、收藏、评论、私信等动作
- 小红书评论接口失败时，会回退到当前作品页 DOM 执行器：可识别可见评论、填写评论框并点击发布
- `unifiedInteraction({ action: 'discoverByKeyword' })`：打开平台搜索页，识别别人笔记和评论里的潜在线索

## 安装测试

1. 打开 Chrome：`chrome://extensions`
2. 开启右上角「开发者模式」
3. 如果是从网页下载的 `jujing-browser-extension.zip`，先解压；不要把 zip 直接拖进扩展程序页面
4. 点击「加载已解压的扩展程序」
5. 选择包含 `manifest.json` 的插件目录：

   - 开发环境：`/Users/forkman03/Documents/Aitoearn/AiToEarn/project/jujing-browser-extension`
   - 下载包：选择解压后能直接看到 `manifest.json` 和 `src` 文件夹的目录

6. 打开 `https://nasnas.vip/zh-CN/customer-radar`、`https://aitoearn.cn/zh-CN/customer-radar`、`https://aitoearn.ai/zh-CN/customer-radar`，或本地开发端口 `http://localhost:6060/zh-CN/customer-radar`
7. 刷新页面，点击「检测执行器」或「插件诊断」
8. 如需真实执行评论/私信，先在同一浏览器登录并打开目标小红书或抖音作品页
9. 如需测试关键词获客，在客户雷达里填写关键词，点击「搜索并生成线索」

## 执行要求

小红书需要同时登录：

- `https://www.xiaohongshu.com`
- `https://creator.xiaohongshu.com`

抖音需要登录：

- `https://www.douyin.com`
- 或 `https://creator.douyin.com`

抖音、快手频道账号绑定不能通过本插件完成，必须走官方 OAuth。这里的登录态只用于页面执行器在用户浏览器内读取公开页面和执行用户确认后的动作。

## 重要说明

当前版本已经具备页面执行器基础能力，但它依赖平台真实页面结构。小红书评论接口可能需要 `x-s / x-t` 等签名头，所以插件会优先尝试接口请求，失败后回退到页面 DOM 执行。真实生产使用前，还需要针对平台页面变更继续做选择器加固和风控限频。

本地开发端口通过 Chrome match pattern `http://*/*` 覆盖；线上入口显式覆盖 `nasnas.vip`、`aitoearn.cn`、`aitoearn.ai` 及其子域名。`content-home.js` 会在运行时只允许 `localhost`、`127.0.0.1`、`nasnas.vip`、`aitoearn.cn`、`aitoearn.ai` 相关入口注入页面桥接。
