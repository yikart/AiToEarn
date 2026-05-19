# 客户雷达真实插件验收

这份检查用于把客户雷达从本地演练推进到真实浏览器插件验收。默认只读，不会向平台发布评论。

## 前置条件

- 本地 Web 可访问，例如 `http://localhost:8080/zh-CN/customer-radar`。
- 若要验收真实插件，Chrome 需要加载 `/Users/forkman03/Documents/Aitoearn/AiToEarn/project/jujing-browser-extension`。
- 若要读取真实小红书评论，需要在 Chrome 登录小红书主页和创作者中心。

## 只读验收

在 `project/aitoearn-web` 下执行：

```bash
pnpm run test:customer-radar:readonly
```

脚本会打开客户雷达，点击「检测插件/账号」，并保存截图到 `test-results/customer-radar-live-check.png`。

要强制要求检测到插件：

```bash
CUSTOMER_RADAR_REQUIRE_PLUGIN=1 \
CUSTOMER_RADAR_EXTENSION_PATH=/Users/forkman03/Documents/Aitoearn/AiToEarn/project/jujing-browser-extension \
CUSTOMER_RADAR_HEADED=1 \
pnpm run test:customer-radar:readonly
```

Chrome 137+ 已移除 `--load-extension` 命令行加载能力，脚本会使用 CDP `Extensions.loadUnpacked` 加载解压插件，并自动带上 `--enable-unsafe-extension-debugging`。如果 Chrome 继续限制自动加载，请改用 `chrome://extensions` 的「加载已解压的扩展程序」手动加载后再打开客户雷达页面检查。

客户雷达的主动获客主链路是关键词搜索别人笔记/评论，不依赖笔记 ID。笔记 ID 只用于“自己笔记评论自动回复”这条辅助链路。

要只读验证关键词搜索：

```bash
CUSTOMER_RADAR_REQUIRE_PLUGIN=1 \
CUSTOMER_RADAR_EXTENSION_PATH=/Users/forkman03/Documents/Aitoearn/AiToEarn/project/jujing-browser-extension \
CUSTOMER_RADAR_HEADED=1 \
pnpm run test:customer-radar:readonly
```

然后在页面里点击「检测插件/账号」，确认小红书账号已登录，再填写关键词并点击「搜索并生成线索」。这一步只生成线索和候选回复，不会发布评论。

要只读抓取一条真实小红书笔记评论，也就是验证“自己笔记评论自动回复”辅助链路：

```bash
CUSTOMER_RADAR_REQUIRE_PLUGIN=1 \
CUSTOMER_RADAR_EXTENSION_PATH=/Users/forkman03/Documents/Aitoearn/AiToEarn/project/jujing-browser-extension \
CUSTOMER_RADAR_XHS_WORK_ID=你的笔记ID \
CUSTOMER_RADAR_HEADED=1 \
pnpm run test:customer-radar:readonly
```

## Mock 发布链路验收

这一步不会访问真实平台，只验证 Web、插件协议、批准、发布按钮和评论发布回调是否串通。

```bash
pnpm run test:customer-radar:mock-publish
```

通过标准：

- 能打开客户雷达页面。
- 能检测到 mock 小红书账号。
- 能抓到 mock 评论。
- 能批准候选回复。
- 能触发 mock 评论发布，并写入页面日志。

## 真平台写操作边界

真实发布评论只允许在明确测试账号和测试笔记上执行。执行前必须确认：

- 「真实平台执行」已打开。
- 候选回复带有真实 `workId`。
- 自己笔记评论回复带有真实 `commentId`。
- 回复内容不包含测试、机器人、自动化等平台外显风险词。
- 每次只发布一条，发布后立即检查平台页面和客户记忆。
