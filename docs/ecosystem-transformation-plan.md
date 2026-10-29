# AiToEarn 生态改造技术方案

> **插件生态学习 Superpowers（obra/superpowers）· 开源生态学习 Postiz（gitroomhq/postiz-app）**
>
> 本文档是供 AI Agent 读取并执行的改造蓝本。创建于 2026-10-27。

---

## 0. 给 AI 执行者的说明（必读）

1. **本文档是唯一执行蓝本**。按 Phase 顺序推进，每个 Phase 结束后运行其「验收标准」中的命令，全部通过才可进入下一阶段。
2. **标注【人工决策】的任务不可自行决定**，需向用户提问确认后，把决策结果回填到本文档 §9 决策记录表。
3. **执行状态跟踪**：完成一个任务后，更新 §10 执行状态表（`[ ]` → `[x]`），并附提交哈希。
4. **文档与代码冲突时以代码为准**：先核实代码现状，更新本文档对应「现状」描述，再继续执行。
5. 每个任务独立提交，提交信息格式：`feat(ecosystem): P{phase}-T{task} 任务描述`。
6. 所有回复、注释、文档使用简体中文（遵循仓库 AGENTS.md 规则）。

---

## 1. 现状诊断（证据锚点）

### 1.1 核心痛点：同一平台逻辑写了三遍

| 宿主 | 代码位置 | 平台 |
|------|---------|------|
| Electron 桌面端 | `project/aitoearn-electron/electron/plat/` | douyin、xiaohongshu、Kwai、bilibili、shipinhao |
| Web 浏览器插件 | `project/aitoearn-web/src/store/plugin/plats/` | douyin、xhs |
| 后端 Provider | `project/aitoearn-backend/apps/aitoearn-server/src/core/channels/platforms/` | douyin、rednote、kwai、bilibili、wechat、tiktok、youtube、facebook、instagram、pinterest、linkedin、threads、twitter 共 13 个 |

后果：平台一改版需改三处；无法让第三方贡献新平台；能力声明没有统一来源。

### 1.2 已有生态资产（不要重复建设）

| 资产 | 位置 | 状态 |
|------|------|------|
| MIT License | 根目录 `LICENSE` | 已有（协议决策见 Phase 0） |
| 贡献指南 | `CONTRIBUTING.md` / `CONTRIBUTING_CN.md` | 已有 |
| Issue/PR 模板 | `.github/ISSUE_TEMPLATE/`、`pull_request_template.md` | 已有 |
| CI 流水线 ×6 | `.github/workflows/`（backend/web build+check、pr-issue-check、pr-to-feishu） | 已有 |
| MCP 三域实现 | `core/channels/mcp/`、`core/content/`、`core/unified-mcp/`（均含测试） | 已有，**最大资产** |
| OpenAPI 工具链 | `libs/common/src/utils/zod-openapi.util.ts`、`decorators/api-doc.decorator.ts` | 内部体系已有，未开放 |
| Agent 动作框架 | `project/aitoearn-web/src/store/agent/handlers/action.handlers.ts` | 已有 |
| API Key 体系 | `RELAY_API_KEY` + Relay/SSE 通道 | 已有 |
| 三语 README | `README.md` / `README_EN.md` / `README_JA.md` | 已有 |
| Docker 文档 | `DOCKER_DEPLOYMENT_CN.md` / `DOCKER_DEPLOYMENT_EN.md` | 已有 |

### 1.3 已确认的断点

- `pnpm dev`（web）不带 `NEXT_PUBLIC_API_URL` 时请求全部打到 `/undefined/` 404，无报错指引。
- 无 demo 账号、无 seed 脚本；根 `docker-compose.yml` 仅含 MongoDB。
- 无公开 REST API 文档站、无 SDK、无 outbound webhook（现有 `youtube-webhook.provider.ts` 是接收平台回调的 inbound 方向）。
- 无 SECURITY.md、CODE_OF_CONDUCT、CHANGELOG、公开 roadmap。
- 平台接入层无公开契约，第三方无从贡献新平台。

---

## 2. 对标研究结论摘要

### 2.1 Superpowers 的 7 个可移植机制

| # | 机制 | Superpowers 做法 | 移植到 AiToEarn |
|---|------|-----------------|------------------|
| 1 | 极简标准单元 | 插件 = 含 SKILL.md 的文件夹 | Platform Pack（platform.json + 流程 + 选择器 + 测试夹具） |
| 2 | 一条命令安装 | `/plugin install superpowers@marketplace` | `aitoearn plugin add douyin` |
| 3 | 内容与分发解耦 | skills 独立仓库，plugin 是管理 clone 的 shim，更新=git pull | 平台包独立仓库，宿主只做适配层 |
| 4 | 多宿主一份内容 | 同一技能包适配 Claude/Cursor/Codex/Gemini | 一份 Pack 被 Electron/Web 插件/后端/MCP 复用 |
| 5 | Agent-native 安装 | 让 Agent 读 INSTALL.md 自己装 | 对话中发现缺包 → Agent 自动拉取安装 → 引导授权 |
| 6 | 自举 | `writing-skills` 技能教贡献者写技能 | `aitoearn plugin new` 脚手架 + writing-platforms 指南 |
| 7 | 自动触发 | Agent 任务前主动检查注入技能 | 能力矩阵暴露给 MCP，Agent 规划时自动选平台 |

### 2.2 Postiz 的生态打法（按优先级）

- **P0 协议战略**：AGPL-3.0 + 自营云闭环（AiToEarn 需自行决策，见 Phase 0）
- **P1 五分钟体验**：Quick Start 文档站第一入口、全栈一键起
- **P2 API 生态**：Public API + docs 站 + `@postiz/node` SDK + outbound webhook
- **P3 自动化生态**：N8N 节点、Make.com、CLI、provider 可扩展
- **P4 社区治理**：Discord、Discussions、roadmap、good first issue

### 2.3 AiToEarn 独有优势（对标对象都没有）

**UGC 任务体系 × 插件生态 = 货币化飞轮**：谁维护某平台的插件包（持续跟进平台改版），谁参与该平台任务流水分成。用经济激励解决「平台改版导致插件失效」的维护难题。

---

## 3. 目标与原则

### 3.1 North Star

1. 任何开发者 **5 分钟内** 从 clone 到登录看到带数据的界面。
2. 任何平台接入逻辑**只写一遍**，三个宿主共享。
3. 任何人一条命令安装/更新平台包，Agent 能在对话中自动完成安装与授权。

### 3.2 非目标（防止范围蔓延）

- 不重写现有发布流程的业务逻辑，只做契约抽取与收口。
- 不在本方案内实现团队协作/Workspace（另立方案）。
- 不改动 UGC 任务的现有业务规则（Phase 6 只做分成机制设计）。

### 3.3 设计原则

1. **契约先行**：先定 schema（zod），再迁实现。
2. **能声明式就声明式**：选择器、能力矩阵进 JSON，只有流程编排允许代码。
3. **内容与分发解耦**：平台包在独立仓库，宿主适配层只读不存。
4. **复用现有资产**：MCP 三域、zod-openapi 工具链、Agent 动作框架是地基，不另起炉灶。
5. **小步可回滚**：每个任务独立提交、独立验收。

---

## 4. 目标架构

```
┌─────────────────────────────────────────────────────┐
│  aitoearn-platforms 仓库（内容 + Marketplace 清单）    │
│  ├── registry.json          # 市场清单（包名/版本/兼容）│
│  └── platforms/             │
│      ├── douyin/            # Platform Pack          │
│      │   ├── platform.json  # 契约（能力矩阵/入口）     │
│      │   ├── flows/         # 发布流程编排             │
│      │   ├── selectors.json  # 页面选择器（声明式）     │
│      │   └── fixtures/       # 录制回放测试夹具         │
│      └── xhs/ …              │
└──────────────┬──────────────────────────────────────┘
               │ 读取（aitoearn plugin add/update 拉取）
   ┌───────────┼───────────┬─────────────┐
   ▼           ▼           ▼             ▼
Electron     Web 浏览器    后端 Provider   MCP
适配层        插件适配层    （能力矩阵源）  （能力矩阵暴露给 Agent）
```

### 4.1 Platform Pack 契约 v1（核心产物）

每个 Pack 的 `platform.json` 结构（JSON Schema 由 `@airongrong/platform-spec` 包定义并校验）：

```json
{
  "$schema": "https://aitoearn.cn/schemas/platform-v1.json",
  "id": "douyin",
  "displayName": "抖音",
  "version": "1.0.0",
  "host": { "minHostVersion": "0.8.0" },
  "capabilities": {
    "video": true,
    "imageText": true,
    "comment": true,
    "reply": true,
    "analytics": true
  },
  "auth": { "type": "browser-session", "guideUrl": "./auth.md" },
  "publish": {
    "implementation": "adapter",
    "entry": "./flows/index.mjs",
    "selectors": "./selectors.json"
  }
}
```

- `capabilities` 是 Agent 与后端的唯一能力事实来源（single source of truth）。
- `publish.implementation` 取值：`adapter`（JS 模块，实现 `PlatformAdapter` 接口）或 `declarative`（纯 JSON 步骤，Phase 2 先支持 adapter，declarative 留接口）。
- `PlatformAdapter` TypeScript 接口（由 spec 包导出）：`login` / `publishVideo` / `publishImageText` / `fetchComments` / `reply`，每个方法带统一的进度回调和错误码。

---

## 5. 全局工程约束（AI 必须遵守）

1. **包管理器**：backend/web 用 pnpm；electron 用 npm；**根目录禁止执行 install/build**。
2. **backend 验证**：在 `project/aitoearn-backend/` 下用 `pnpm nx ...`，遵循该目录 `CLAUDE.md`；至少跑受影响模块的单测。
3. **web 验证**：在 `project/aitoearn-web/` 下跑 `pnpm run type-check` 与 `pnpm build`。
4. **纯文档改动**：至少运行 `git diff --check`。
5. **README 三语同步**：凡改动用户可见能力、安装、OpenClaw、MCP、Relay、API Key、环境地址，必须同步 `README.md` / `README_EN.md` / `README_JA.md`；Docker 相关同步检查 `DOCKER_DEPLOYMENT_CN.md` / `DOCKER_DEPLOYMENT_EN.md`。
6. **环境区分**：`*.aitoearn.cn` = 中国版，`*.aitoearn.ai` = 国际版；Key 与 URL 必须匹配（不匹配会 401）。MCP 示例区分 `https://aitoearn.cn/api/unified/mcp` 与 `https://aitoearn.ai/api/unified/mcp`，SSE 同理。
7. **⚠️ 许可证红线（最高优先级）**：
   - **Postiz 是 AGPL-3.0**。严禁复制、改写、参考其任何源码进入本仓库——本方案对 Postiz 仅做**概念对标**。Phase 0 未做出协议决策前，不得在公开文档中建立与 Postiz 代码的任何关联。
   - Superpowers 是 MIT，机制可自由借鉴；直接复用其代码片段时注明出处。
8. **兼容性约束**：改造期间三个宿主（Electron 33 / Next.js 14 / NestJS）现有发布链路不可中断——契约抽取采用「新 Pack 与旧实现并行 → 灰度切换 → 删除旧实现」三步走，不允许一步切换。

---

## 6. 分阶段执行计划

> 推荐执行顺序：Phase 0 → 1 → 2 → 3 → 4 → 5 → 6。
> Phase 1 与 Phase 2 之后的内容无依赖，可并行。

### Phase 0：战略决策【人工决策】

| 任务 | 内容 | 产出 |
|------|------|------|
| P0-T1 | 【人工决策】开源协议：A) 维持 MIT + 明确「客户端/框架开源、任务撮合服务化」叙事；B) 转 AGPL-3.0（对标 Postiz，防云厂商 fork）；C) 双许可。决策时考虑：自营双云（aitoearn.cn/ai）+ UGC 抽成模式 | 决策回填 §9 |
| P0-T2 | 【人工决策】分层开源范围：明确哪些仓库开源（建议：web、electron、platforms 市场、SDK；任务撮合与计费服务端保持闭源） | 决策回填 §9 |
| P0-T3 | 【人工决策】是否引入插件维护者收益分成（§2.3 飞轮）。若做，Phase 6 的 T4 升级为正式需求 | 决策回填 §9 |

**验收**：§9 决策记录表三项均有结论。

---

### Phase 1：五分钟本地体验（独立，先做先受益）

| 任务 | 内容 | 涉及路径 |
|------|------|---------|
| P1-T1 | docker-compose 补全全栈：新增 redis、backend、web 服务；backend 依赖 mongo+redis 健康检查；web 依赖 backend | 根 `docker-compose.yml` |
| P1-T2 | seed 脚本：创建 demo 账号（`demo@aitoearn.dev`，user 无密码字段，seed 完成后输出 JWT 登录 token）、示例账号绑定、示例发布记录；提供 `pnpm nx run aitoearn-server:seed` | `project/aitoearn-backend/apps/aitoearn-server/src/seed/`（新建）+ `project.json` 增加 target |
| P1-T3 | `.env.example` 全量补齐并逐项注释（backend 的 Mongo/Redis/JWT/OSS/AI keys；web 的 `NEXT_PUBLIC_API_URL` 等） | `project/aitoearn-backend/apps/aitoearn-server/.env.example`、`project/aitoearn-web/.env.example` |
| P1-T4 | web dev 环境守卫：`NEXT_PUBLIC_API_URL` 缺失时启动即报错并打印指引（禁止静默 `/undefined/` 404） | `project/aitoearn-web/scripts/check-env.mjs`（新建）+ `package.json` 的 `dev` 前置 |
| P1-T5 | 架构文档：一张图讲清 web / electron / backend / 浏览器插件 / MCP 五者关系 | `docs/architecture.md`（新建） |

**验收**：
1. `git clone` → `docker compose up -d` → 等待就绪 → 浏览器打开 web 端口，用 demo 账号登录成功；
2. `cd project/aitoearn-web && pnpm run type-check && pnpm build` 通过；
3. backend 受影响模块 `pnpm nx test` 通过；
4. README 安装章节如有改动，三语同步。

---

### Phase 2：Platform Pack 契约与三端统一（核心重构）

| 任务 | 内容 | 涉及路径 |
|------|------|---------|
| P2-T1 | 创建 spec 包 `@airongrong/platform-spec`：zod schema + TS 类型（`PlatformPack`、`Capabilities`、`PlatformAdapter` 接口、统一错误码枚举）+ schema JSON 导出。先以 backend workspace 内 nx lib 起步，接口稳定后发 npm | `project/aitoearn-backend/libs/platform-spec/`（新建） |
| P2-T2 | 创建包仓库 `aitoearn-platforms`（目录结构见 §4），迁入抖音作为参考实现：合并三处逻辑为一份 canonical douyin Pack | 新仓库 + `platforms/douyin/` |
| P2-T3 | Electron 适配层：`electron/plat/douyin/` 改造为读取 Pack（加载 `flows/index.mjs`、`selectors.json`），保留浏览器控制原语 | `project/aitoearn-electron/electron/plat/` |
| P2-T4 | Web 浏览器插件适配层：`src/store/plugin/plats/douyin/` 同样改为读 Pack，与 Electron 共享 adapter 模块 | `project/aitoearn-web/src/store/plugin/plats/` |
| P2-T5 | 后端能力对齐：`core/channels/platforms/douyin/` 的平台能力元数据改从 Pack 的 `capabilities` 读取（发布实现暂不动，仅元数据收口） | `project/aitoearn-backend/.../channels/platforms/` |
| P2-T6 | 录制回放测试夹具：douyin Pack 附 fixtures，三宿主适配层跑同一组契约测试 | `aitoearn-platforms/platforms/douyin/fixtures/` |

**执行约束**：按 §5-8 三步走——P2-T2 完成后新 Pack 与旧实现并存；P2-T3/T4 切换后观察一个迭代周期；确认稳定后单独提交删除旧实现的 commit。

**验收**：
1. douyin 的能力矩阵在三端来自同一份 `platform.json`（用单测断言三端读取同一 schema 校验结果）；
2. Electron 端 + Web 插件端各完成一次抖音发布冒烟（或录制回放通过）；
3. backend `pnpm nx affected -t test` 通过；
4. electron `npm run lint` 无新增错误。

---

### Phase 3：Marketplace 与 CLI 分发

| 任务 | 内容 | 涉及路径 |
|------|------|---------|
| P3-T1 | `aitoearn-platforms` 仓库补 `registry.json` 市场清单：包名、版本、兼容宿主版本、简介、维护者。纯 Git 仓库即市场（学习 superpowers-marketplace 形态） | `aitoearn-platforms/registry.json` |
| P3-T2 | CLI 工具 `aitoearn`（nx lib，bin 入口）：`plugin add <id>` / `plugin update` / `plugin list` / `plugin search`；add = 按 registry 拉包到宿主约定目录并校验 schema | `project/aitoearn-backend/packages/cli/`（新建，bin 名 `aitoearn`） |
| P3-T3 | 版本兼容检查：安装时校验 `host.minHostVersion` 与宿主版本，不满足则明确报错 | CLI 内 |
| P3-T4 | 迁移第二个平台（建议 xhs）验证市场流程非抖音特化 | `aitoearn-platforms/platforms/xhs/` |

**验收**：干净环境执行 `aitoearn plugin add xhs` → schema 校验通过 → 宿主内可见能力 → `plugin update` 拉到新版本。

---

### Phase 4：Agent-native 安装与能力矩阵

| 任务 | 内容 | 涉及路径 |
|------|------|---------|
| P4-T1 | MCP 工具扩展：channels MCP 新增 `list_platform_packs`（返回能力矩阵）、`install_platform_pack`（调用 CLI）工具，含 schema 与测试 | `project/aitoearn-backend/.../channels/mcp/` |
| P4-T2 | Web Agent 缺包检测：`action.handlers.ts` 在发布动作前检查目标平台 Pack 是否已安装，缺失时走「拉取 → 安装 → 引导授权」链路 | `project/aitoearn-web/src/store/agent/handlers/` |
| P4-T3 | 授权衔接：安装完成后进入现有平台登录/授权引导流程，闭环到发布 | 同上 + `src/store/plugin/` |

**验收**：对话中说「我要发小红书」（未装 xhs Pack 时）→ Agent 自动安装 → 引导授权 → 进入发布表单，全程无人工到设置页操作。

---

### Phase 5：API 生态开放

| 任务 | 内容 | 涉及路径 |
|------|------|---------|
| P5-T1 | Public API v1：版本化路由 `/api/v1/*`；复用 API Key 体系做鉴权中间件；增加限流（Redis 令牌桶，复用现有 redis lib） | `project/aitoearn-backend/apps/aitoearn-server/src/api/v1/`（新建模块） |
| P5-T2 | OpenAPI 文档导出：复用 `zod-openapi.util.ts` 生成 OpenAPI JSON；文档站用静态托管（Scalar 或同类），域名走 docs.aitoearn.cn / docs.aitoearn.ai（注意 §5-6 环境区分） | 复用 `libs/common/src/utils/zod-openapi.util.ts` |
| P5-T3 | Outbound Webhook：新增 `core/webhooks/` 模块——订阅 CRUD、事件（发布成功/失败、账号掉线、评论到达）、HMAC 签名、BullMQ 重试退避 | `project/aitoearn-backend/.../core/webhooks/`（新建） |
| P5-T4 | SDK `@airongrong/node`：基于 OpenAPI 生成 client + 薄封装（auth/发布/记录查询），发 npm | `project/aitoearn-backend/packages/sdk-node/`（新建） |
| P5-T5 | MCP 产品化：三域工具清单公开文档（区分中国版/国际版地址）；新增 stdio 传输入口供自托管用户本地接入 | `core/unified-mcp/` + 文档 |

**验收**：
1. `curl` 用 API Key 调 `/api/v1/*` 成功，OpenAPI JSON 可导出且文档站可访问；
2. webhook 订阅后，触发一次发布失败事件，订阅端收到带合法签名的 POST；
3. `@airongrong/node` 在干净 Node 项目里 `npm i` 后能完成一次认证 + 创建发布记录；
4. 本地 stdio MCP 可被 Claude/Cursor 连接并列出工具。

---

### Phase 6：社区治理、自举与合规

| 任务 | 内容 | 涉及路径 |
|------|------|---------|
| P6-T1 | 补齐治理文件：SECURITY.md、CODE_OF_CONDUCT.md、CHANGELOG.md（release 自动生成，可用 GitHub Release notes） | 根目录（新建） |
| P6-T2 | 自举脚手架：`aitoearn plugin new <platform>` 生成 Pack 骨架（含 platform.json 模板、adapter 样例、fixtures 空目录）；配套贡献指南 `docs/contributing/platform-pack.md` | CLI + docs |
| P6-T3 | 合规声明：README 增补——模拟发布仅用于无开放 API 的国内平台、海外平台走官方 OAuth 的立场声明。**注意三语同步 + Docker 文档检查（§5-5/§5-6）** | `README.md` ×3 |
| P6-T4 | 【设计任务】插件维护者收益分成机制：定义「平台包维护记录 → 任务流水分成」的规则草案（绑定钱包、维护活跃度考核、防刷）。产出设计文档供【人工决策】 | `docs/design/pack-revenue-sharing.md`（新建） |
| P6-T5 | GitHub 治理：开启 Discussions、打 `good first issue` 标签、公开 roadmap（可用 GitHub Projects）；外部 PR 设响应时限 | 仓库设置（需人工/管理员操作） |

**验收**：根目录三个治理文件存在；`aitoearn plugin new test-plat` 生成的骨架通过 schema 校验；README 三语均含合规声明；分成设计文档完成初稿。

---

## 7. 风险与对策

| 风险 | 影响 | 对策 |
|------|------|------|
| 平台改版导致选择器失效 | Pack 失效 | 选择器与代码分离（改版只改 JSON）+ fixtures 回归测试 + （Phase 0-T3 通过后）维护者分成激励 |
| AGPL 传染 | 法律风险 | §5-7 红线：只学概念不抄 Postiz 代码；代码审查时检查 |
| 三端切换造成发布中断 | 业务受损 | §5-8 三步走：并行 → 灰度 → 删旧 |
| MCP 工具被滥用安装恶意包 | 安全 | marketplace 仅白名单仓库；安装前 schema 校验 + 包哈希校验 |
| 文档站/SDK 与内部 API 漂移 | 维护成本 | OpenAPI 从 zod 单一来源生成，禁止手写文档同步 |

---

## 8. 总验收清单（改造完成的定义）

- [ ] `docker compose up` + demo 账号登录 ≤ 5 分钟
- [ ] `pnpm dev`（web）缺环境变量时启动即报错指引，无 `/undefined/` 请求
- [ ] douyin / xhs 平台逻辑在三端来自同一份 Pack，旧实现已删除
- [ ] `aitoearn plugin add/list/update/search` 可用，registry 校验通过
- [ ] 对话式「发小红书」可自动装包 + 授权 + 进发布流
- [ ] `/api/v1/*` + OpenAPI 文档站 + `@airongrong/node` SDK 可用
- [ ] outbound webhook 事件带签名送达
- [ ] MCP 三域工具清单文档（区分 cn/ai 环境）+ stdio 入口
- [ ] SECURITY / CODE_OF_CONDUCT / CHANGELOG 齐备，README 三语含合规声明
- [ ] `aitoearn plugin new` 脚手架 + 贡献指南 + （若决策通过）分成设计文档

---

## 9. 决策记录表（Phase 0 回填）

| 编号 | 决策项 | 结论 | 决策日期 | 决策人 |
|------|--------|------|---------|--------|
| D1 | 开源协议（MIT 保持 / AGPL / 双许可） | 待定 | — | — |
| D2 | 分层开源范围 | 待定 | — | — |
| D3 | 插件维护者收益分成 | 待定 | — | — |

---

## 10. 执行状态表（AI 执行时更新）

| Phase | 任务 | 状态 | 提交哈希 | 备注 |
|-------|------|------|---------|------|
| P0 | P0-T1~T3 | ☐ 待决策 | — | 需人工输入 |
| P1 | P1-T1 | ☐ | — | |
| P1 | P1-T2 | ☐ | — | |
| P1 | P1-T3 | ☐ | — | |
| P1 | P1-T4 | ☐ | — | |
| P1 | P1-T5 | ☐ | — | |
| P2 | P2-T1~T6 | ☐ | — | |
| P3 | P3-T1~T4 | ☐ | — | |
| P4 | P4-T1~T3 | ☐ | — | |
| P5 | P5-T1~T5 | ☐ | — | |
| P6 | P6-T1~T5 | ☐ | — | |

---

## 11. 参考资料

- Superpowers（MIT，机制借鉴对象）：https://github.com/obra/superpowers
  - marketplace 形态参考：obra/superpowers-marketplace
- Postiz（AGPL-3.0，**仅概念对标，严禁代码复制**）：https://github.com/gitroomhq/postiz-app
- 本仓库内部锚点：`AGENTS.md`（工程规则）、`project/aitoearn-backend/CLAUDE.md`（backend 验证命令）、`CONTRIBUTING_CN.md`（现有贡献流程）
