# 客户雷达真实发布安全验收清单

这份清单只用于测试账号和测试笔记。没有完成所有前置项时，不允许打开真实平台执行。

## 前置条件

- 使用明确的测试小红书账号，不使用客户生产账号。
- 使用明确的测试笔记，记录 `workId`、`xsecToken`、测试评论内容和预期回复。
- Chrome 已登录测试账号，并加载 `/Users/forkman03/Documents/Aitoearn/AiToEarn/project/jujing-browser-extension`。
- Web 入口可访问：`http://localhost:8080/zh-CN/customer-radar`。
- 已完成只读验收，能检测插件、识别登录态、抓取关键词结果或测试笔记评论。
- 已确认候选回复不包含“测试、机器人、自动化、批量、爬取”等平台外显风险词。
- 已确认全局知识库里有启用的方案、案例、FAQ、边界和语气规则。

## 验收命令

只读验收：

```bash
cd /Users/forkman03/Documents/Aitoearn/AiToEarn/project/aitoearn-web
CUSTOMER_RADAR_REQUIRE_PLUGIN=1 \
CUSTOMER_RADAR_EXTENSION_PATH=/Users/forkman03/Documents/Aitoearn/AiToEarn/project/jujing-browser-extension \
CUSTOMER_RADAR_HEADED=1 \
pnpm run test:customer-radar:readonly
```

Mock 发布验收：

```bash
cd /Users/forkman03/Documents/Aitoearn/AiToEarn/project/aitoearn-web
pnpm run test:customer-radar:mock-publish
```

## 真平台单条发布步骤

1. 打开客户雷达页面，确认当前登录用户是测试用户。
2. 点击「检测插件/账号」，确认插件在线、测试账号已登录。
3. 填入测试笔记 `workId` 和 `xsecToken`，只抓取测试笔记评论。
4. 生成候选回复后人工检查内容，必要时重写。
5. 打开「真实平台执行」。
6. 只批准并发布一条候选回复。
7. 发布后立即检查小红书页面是否出现对应回复。
8. 回到客户雷达，检查任务日志、候选回复状态、客户互动记录和客户记忆。
9. 关闭「真实平台执行」。

## 通过标准

- 只发布一条测试回复。
- 平台页面能看到回复，且账号、笔记、评论对象正确。
- 客户雷达日志记录发布结果。
- 候选回复状态变为已发布。
- 客户互动记录追加本次回复。
- 客户记忆追加本次触达摘要。
- 没有重复发布，没有向非测试评论发送回复。

## 失败处理

- 如果插件不可用：停止真平台发布，只保留只读和 mock 验收。
- 如果平台页面未显示回复：截图保存，记录候选回复 ID、workId、commentId、插件日志。
- 如果误触发多条发布：立即暂停任务，关闭真实平台执行，保留日志，不继续测试。
- 如果回复内容不合规：标记候选回复为忽略，补充知识库边界规则后重新生成。
