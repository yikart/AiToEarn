# Pull Request

## Issue Link
<!--
关闭型：Closes #123 / Fixes #123 / Resolves #123
关联型：Related to #123 / Refs #123
支持多条：Closes #12, Related to #34
跨仓库：Closes owner/repo#123
-->


## 描述
<!-- 简要描述此 PR 的目的和主要更改内容 -->

## 变更清单
<!-- 列出此 PR 中的主要变更点 -->
-
-

## 检查清单
- [ ] 本地 lint 通过：`pnpm nx lint <affected-projects>`
- [ ] 本地构建通过：`pnpm nx build <affected-projects>`
- [ ] 已添加/更新相关测试
- [ ] 新接口已添加 `@ApiDoc` 装饰器，DTO/VO 字段已添加 `.describe()`
- [ ] 无破坏性 API 变更（或已在描述中说明）
- [ ] 已等待 Gemini code review 并修复其提出的问题

## 测试计划
<!-- 描述测试策略和覆盖范围 -->
- 测试类型：<!-- unit / integration / e2e -->
- 运行命令：<!-- pnpm nx run <project>:test -->

## 数据库迁移
<!-- 如无迁移请删除此部分 -->
- [ ] 迁移脚本已放置在 `migrations/` 目录
- [ ] 迁移脚本为纯 MongoDB shell 脚本

## 备注
<!-- 其他需要说明的信息 -->
