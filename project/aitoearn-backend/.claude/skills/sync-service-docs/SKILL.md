---
name: sync-service-docs
description: 为指定服务维护产品文档与代码的同步。文档不存在时以 OpenAPI 规范为基础从头生成；文档已存在时根据 git diff 更新受影响章节，并刷新最后更新时间和代码基准 hash。
origin: custom
---

# sync-service-docs

为指定服务生成或同步产品文档。

## 调用方式

```
/sync-service-docs [service]
```

不传 `service` 时，列出可用服务列表并停止。

## 服务配置表

| Service | OpenAPI 文件 | 源码路径 | 文档目录 |
|---------|-------------|---------|---------|
| `ai` | `openapi/aitoearn-ai.yaml` | `apps/aitoearn-ai/src/core/` | `docs/ai-service/` |
| `server` | `openapi/aitoearn-server.yaml` | `apps/aitoearn-server/src/` | `docs/server/` |
| `payment` | `openapi/aitoearn-payment.yaml` | `apps/aitoearn-payment/src/` | `docs/payment/` |
| `task` | `openapi/aitoearn-task.yaml` | `apps/aitoearn-task/src/` | `docs/task/` |
| `admin` | `openapi/aitoearn-admin-server.yaml` | `apps/aitoearn-admin-server/src/` | `docs/admin/` |

---

## 执行流程

### Step 1 — 初始化

1. 校验 `service` 参数，不在配置表中则报错停止
2. 获取 `git rev-parse --short HEAD` → `<hash>` 和当前日期 → `<today>`
3. 检查文档目录是否存在且有 `.md` 文件：
   - **不存在或为空** → 执行 Step 2（首次建档）
   - **已存在** → 执行 Step 3（差异更新）

---

### Step 2 — 首次建档

#### 2a. 读取 OpenAPI 规范

读取对应 OpenAPI 文件，提取：
- 所有 `paths`：path + HTTP method + operationId + summary
- 按 `tags` 分组（每个唯一 tag → 一个 `.md` 文件）
- 每个接口的 `parameters`、`requestBody` schema、`responses` schema

**原则：请求/响应结构必须完全来自 OpenAPI 定义，不得猜测字段。**

#### 2b. 阅读源码（完整追踪业务流程）

对每个 tag 对应的模块，沿调用链路完整追踪：

```
Controller → Service → Helper/Util → Consumer/Processor → Repository
                 ↓
            libs/ 共享库方法（如被调用则跟进阅读）
```

**每个接口都要读完整调用链路中的所有方法**，按代码实际执行顺序记录每一步做了什么，包括但不限于：
- 参数校验、权限检查、资源存在性检查
- 数据查询、数据构建、数据转换
- 积分/计费操作（预扣/后扣、价格计算、退款机制）
- 异步队列投递与消费逻辑
- 日志记录（AiLog 创建/更新）
- 外部 API 调用
- 文件上传/存储操作
- 每个可能的错误分支及对应错误码

**原则：业务流程必须来自源码逐行追踪，任何步骤都不得省略或猜测。**

#### 2c. 大代码库分段处理

当模块数量 ≥ 4 或单模块接口数 ≥ 8 时，使用子代理（Agent tool）并行处理：

- **每个子代理**负责 1-2 个 tag/模块：阅读 OpenAPI 对应部分 + 追踪源码 + 生成该模块的 `.md` 文件内容
- **子代理 prompt 必须包含**：该模块的 OpenAPI paths 列表、源码路径、文档结构规范（从本 skill 复制）、约束条件
- **主流程**负责：初始化、拆分任务、汇总子代理输出、写入文件、生成 README.md

示例拆分方式：
```
子代理 1: chat 模块（5 个接口）
子代理 2: image 模块（14 个接口）
子代理 3: video + agent 模块（各 5-6 个接口）
```

#### 2d. 生成文档文件

按 tag 生成对应 `.md` 文件（格式见"文档结构规范"），同时生成 `README.md`（模块索引 + 通用约定）。

所有文件标题后紧跟：
```
> 最后更新时间：<today> &nbsp;|&nbsp; 代码基准：`<hash>`
```

---

### Step 3 — 差异更新

#### 3a. 读取各文档的代码基准

从每个已有文档的元信息行提取 `代码基准：\`<hash>\`` 中的 hash 值（`<doc_hash>`）。

#### 3b. 检测变更范围

对每个文档，检查 OpenAPI 和源码是否有变更：

```bash
git log <doc_hash>..HEAD --oneline -- <openapi_file> <source_path>
```

无输出则该文档跳过。有输出则继续分析。

#### 3c. 分析差异并更新

```bash
git diff <doc_hash>..HEAD -- <openapi_file> <source_path>
```

根据 diff 内容精准更新对应章节：

| 变更类型 | 文档操作 |
|---------|---------|
| 新增 path/method | 追踪源码，按规范格式新增接口章节 |
| 修改 requestBody/parameters/responses | 更新对应接口的请求/响应部分 |
| 源码业务逻辑变化 | 重新追踪该接口调用链路，更新业务流程 |
| 删除接口 | 移除对应文档章节，更新接口列表 |

**原则：只更新有实际变化的章节，未变更章节保持原文不动（包括措辞和格式）。**

#### 3d. 更新文档元信息

将所有变更文档的日期和 hash 更新为当前值。

---

### Step 4 — 输出摘要

完成后输出变更摘要：

| 文档 | 动作 | 说明 |
|------|------|------|
| `image.md` | 新建 | 14 个接口 |
| `video.md` | 已更新 | 新增 Grok 视频生成章节 |
| `chat.md` | 跳过 | 无代码变更 |

---

## 文档结构规范

### 模块文档（每个 tag 一个 `.md` 文件）

```markdown
# <模块名称>

> 最后更新时间：2026-03-12 &nbsp;|&nbsp; 代码基准：`a7d3afb3`

## 概述

<1-2 句功能描述>

**相关源码：** `apps/<service>/src/core/<module>/`

---

## 接口列表

| 方法 | 路径 | 功能 |
|------|------|------|
| POST | `/api/...` | ... |
| GET  | `/api/...` | ... |

---

## 1. <接口功能名>

### `<METHOD> <path>`

<1-2 句说明>

**请求体：**
```json
{ "field": "value" }
```

**响应体：**
```json
{
  "code": 0,
  "data": { ... }
}
```

**业务流程：**

```
1. 校验参数/权限
   └── 失败 → ErrorCode

2. 查询资源/计算价格
   └── 不存在 → ResourceNotFound

3. 预扣积分（deductCredits, points=<价格>）
   └── 余额不足 → UserCreditsInsufficient

4. 创建 AiLog（status=generating）

5. 投入异步队列（QueueName.Xxx）

6. 返回 { logId } 供前端轮询

── 异步阶段（Consumer） ──────────────────

7. 消费任务 → 调用外部 API

8a. 成功：
    - 上传结果到 S3
    - 更新 AiLog（status=success, response=...）

8b. 失败：
    - 退还积分（addCredits, expiredAt=null）
    - 更新 AiLog（status=failed, errorMessage=...）
```
```

**关于业务流程的说明：**
- 上方模板仅为**预扣+异步队列**模式的示例，实际流程根据源码如实描述
- 同步后扣模式：先调用 API → 从响应提取用量 → 计算积分 → deductCredits → 写 AiLog
- 纯同步无计费：无积分相关步骤，直接描述业务操作
- 流程中的每一步都应来自源码，按实际执行顺序排列
- 错误分支写在对应步骤的 `└──` 子行中，不单独设"错误码"节

### README.md 结构

```markdown
# <Service> 服务产品文档

> 最后更新时间：<date> &nbsp;|&nbsp; 代码基准：`<hash>`

## 模块索引

| 文档 | 功能描述 |
|------|---------|
| [chat.md](./chat.md) | AI 对话、流式输出 |
| ...                   | ... |

## 通用约定

### 认证
- 所有接口需携带 JWT Token（`Authorization: Bearer <token>`）
- `userId` / `userType` 由网关解析后注入

### 响应格式
```json
{ "code": 0, "message": "success", "data": { ... } }
```
`code=0` 表示成功，非 0 为业务错误码（定义在 `libs/common/src/enums/response-code.enum.ts`）。

### 积分（Credits）
<根据该服务的实际计费模式描述，如预扣/后扣、VIP 免费等>
```

---

## 约束

### 必须做

1. **请求/响应结构来自 OpenAPI** — 字段名、类型、必填状态以 OpenAPI schema 为准
2. **业务流程来自源码逐行追踪** — 沿 Controller → Service → Helper → Consumer 完整追踪，不省略任何步骤
3. **libs/ 共享库方法也要跟进阅读** — 当 Service 调用了 `libs/` 中的方法（如 creditsHelper、queueService），必须读取其实现
4. **通用约定写在 README.md** — 认证、响应格式、积分说明等跨模块通用内容只在 README 中写一次
5. **更新模式先看 git diff** — 只更新有实际代码变化的章节，未变化章节保持原文不动
6. **所有文档统一使用当前 HEAD hash** — 不混用不同 hash
7. **中文描述，代码标识符保持英文** — 如 `deductCredits`、`AiLog`、`status=generating`
8. **大代码库使用子代理并行处理** — 模块多或代码量大时拆分给子代理，提高效率

### 禁止做

1. **不得生成测试要点** — 这是纯产品文档，不包含测试用例、测试要点、边界条件测试等内容
2. **不得单独设"计费流程"或"错误码"节** — 计费是业务流程的一个步骤，错误码写在流程的失败分支中
3. **不得在模块文档中重复通用约定** — 认证方式、响应格式等不在各模块文档中重复
4. **不得猜测字段或流程** — OpenAPI 中没有的字段不写，源码中没有的步骤不编
5. **不得修改未变更的章节** — 差异更新时，没有代码变化的章节保持原文（包括措辞和格式）
6. **不得遗漏业务步骤** — 源码中的每个操作（校验、查询、转换、计费、日志、上传、队列等）都要在流程中体现
