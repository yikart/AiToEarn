---
name: aitoearn-accounts
description: 管理 AiToEarn 已授权的平台账号：查看授权状态、发现失效账号并引导重新授权
when_to_use: 用户询问"哪些账号已绑定/授权过期了吗"，或发布失败提示授权问题时
version: 1.0.0
apiVersion: ^1.0.0
allowed-tools: ["list_accounts"]
---

# AiToEarn 账号管理

## 鉴权与环境

与 aitoearn-publish 技能相同：先确认中国版（`https://aitoearn.cn`）或国际版（`https://aitoearn.ai`），请求头携带 `x-api-key`。

## 操作步骤

1. `GET {baseUrl}/api/v1/open/accounts` —— 列出全部已授权账号及其状态。
2. 发现授权失效/过期的账号：告知用户具体平台与账号名，引导其到 AiToEarn 对应环境完成重新授权；不要尝试代替用户走 OAuth 流程。
3. 用户想新增平台：告知在 AiToEarn「渠道账号」页发起授权即可，授权完成后即可通过 API 使用。
