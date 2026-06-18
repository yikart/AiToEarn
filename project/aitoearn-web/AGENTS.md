# AGENTS.md

本文件定义 Codex 在 `aitoearn-web` 仓库内的默认工作规则。

## Communication

- 默认用中文回答问题。
- 生成 git commit message 或提交说明时，不要加入 `Co-Authored-By` 或 `<noreply@anthropic.com>`。
- git commit message 必须符合 commitlint / Conventional Commits 规范，使用 `feat`、`fix`、`docs`、`style`、`refactor`、`perf`、`test`、`build`、`ci`、`chore`、`revert` 等类型，格式为 `type(scope): 中文描述` 或 `type: 中文描述`。
- 如果需要用 git 提交代码，必须生成完整的 git 提交记录，必须生成中文提交记录。

## Skill Usage

- 默认遵循 `karpathy-guidelines`：先明确假设与边界，再编码；保持实现简单；只做与需求直接相关的最小改动；完成后用可验证结果确认修改生效。
- 编写、审查、重构 React 或 Next.js 代码时，优先遵循 `vercel-react-best-practices`。
- UI 设计类 skill 职责边界：
  - `PRODUCT.md` / `DESIGN.md` 是项目设计宪法；任何 UI 设计输出、参考图、代码实现和审查结论都必须服从它们。
  - `taste-skill`（安装目录；skill name 为 `design-taste-frontend`）：用于从零生成设计方案，例如全新页面、全新模块、全新组件或全新视觉方向的初始设计构思。
  - `impeccable`：用于审查、打磨、修复或优化现有设计，例如已有页面、组件、截图或代码的视觉/体验改进。
  - `taste-skill` / `design-taste-frontend` 只能在现有品牌 token、字体、圆角、组件体系、主题兼容、国际化和工程硬约束内发散，不得重新定义项目设计系统。
  - 当任务是“从零设计 + 落地实现”时，先使用 `taste-skill` / `design-taste-frontend` 产出方向，再按项目现有设计系统与工程约束实现；最终落地前必须使用 `impeccable` 做一致性、可访问性、主题兼容和反模板化审查。
  - 当两者看似都适用时，以任务对象为准：全新设计方案用 `taste-skill` / `design-taste-frontend`，现有设计审查/修复用 `impeccable`，不要让两个 skill 同时争夺最终设计权。

## Before Coding

编写新逻辑前，必须先检查是否已有可复用实现，按顺序检索：

1. `src/utils/README.md`
2. 如涉及 `src/utils/<目录>/`，继续检查目标子目录 `README.md`
3. `src/hooks/README.md`
4. `src/components/README.md`
5. `src/store/README.md`
6. `src/app/config/`
7. 当前页面目录下的 `store`、`hooks`、`utils`

如果找到相似实现，必须优先复用或扩展，不要重复造轮子。

- 新增可复用代码时，必须同步更新对应 README。
- 可复用的全局方法写到 `src/utils/`，并同步更新 `src/utils/README.md` 和目标子目录 README。
- `src/utils` 是唯一全局工具目录，禁止新增或恢复 `src/lib` 作为工具目录。
- 添加工具方法前，先检查 `src/utils/README.md` 和目标子目录 README，避免重复实现。
- 涉及 UI、交互、滚动、弹窗、按钮等能力时，组件选择优先级必须为：
  1. 先搜索并复用全局组件或现有公共组件
  2. 其次使用 `shadcn/ui` 组件或基于其现有封装扩展
  3. 如果以上都没有，禁止直接在当前页面/局部临时实现，必须先与用户讨论方案，再决定是否新增组件或局部实现

## Hard Constraints

- 不要使用 `npm run build` 做类型检查；改用 `npx tsc --noEmit`。
- 不要使用 `as any` 绕过 TypeScript 错误；必须从类型源头修复。
- 不要使用硬编码货币符号或货币代码，如 `$`、`USD`、`¥`、`CNY`；使用 `appCurrencySymbol` / `appCurrency`，见 `src/utils/currency.ts`。
- 用户可见金额默认只展示货币符号与金额，不额外展示 `appCurrency`、接口返回的 `currency` 或 `currencyCode` 后缀；国内版和国际版不会同时存在，`CNY` / `USD` 仅用于数据、API、计算和必要的配置逻辑。
- 不要使用 `<Input type="number">` 或 `<input type="number">`；统一使用 `NumberInput`，见 `src/components/ui/number-input.tsx`。
- 不要使用硬编码颜色，如 `text-gray-900`。
- 如果页面或组件中渲染 OSS/R2 图片，必须使用全局组件 `OssImage`（`@/components/common/OssImage`），不要直接使用 `next/image` 或 `<img>` 渲染 OSS 图片；`OssImage` 会根据 `sizes`、`width`、`height` 或显式缩略图参数生成阿里云 OSS / Cloudflare R2 缩略图 URL。
- 不要使用纯黑色，如 `#000`、`black`、`text-black`；优先使用语义化颜色变量，如 `text-foreground`、`text-muted-foreground`。
- 修改中文、日文、韩文等非 ASCII 文本文件时，必须确保读写链路为 UTF-8，禁止通过未设置 UTF-8 的 PowerShell 管道传递非 ASCII 文本到 `python -`、`node -e` 等命令。
- 如必须在 PowerShell 中用管道/Here-String 传递非 ASCII 文本，命令开头必须设置 `$OutputEncoding = [System.Text.UTF8Encoding]::new($false); [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false); [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false);`。

## Reuse Rules

以下能力优先复用现有实现，不要手写重复逻辑：

- 数字、日期、时间、秒数格式化
- 货币显示与换算
- OSS URL 与代理 URL 拼接
- 移动端判断
- 视频信息与视频时长获取
- 倒计时逻辑
- VIP 状态判断
- 中文语言判断
- 相对时间格式化
- 确认弹窗
- 图片/视频预览

决策规则：

- 功能完全一致：直接复用
- 功能 80% 相似：扩展现有实现
- 功能 50% 相似：抽取公共部分后复用
- 功能全新且无类似实现：允许新建，但必须放到合适的公共目录并更新 README

如果开发过程中发现已有重复代码，主动提示是否需要合并重构。

## Project Utilities

- OSS 资源使用 `getOssUrl`，见 `src/utils/oss.ts`
- Canvas 跨域代理使用 `getOssProxyPath`，见 `src/utils/oss.ts`
- 货币显示使用 `appCurrencySymbol` + `appCurrency`，见 `src/utils/currency.ts`
- SEO 元数据使用 `getMetadata`，见 `src/utils/metadata.ts`
- 持久化 store 使用 `createPersistStore`，见 `src/utils/storage/createPersistStore.ts`
- 数字输入统一使用 `NumberInput`
- 语言配置在 `src/app/i18n/languageConfig.ts`
- 国际化目录在 `src/app/i18n`

## Directory Conventions

- 页面私有组件放在 `pages/xxx/components/`
- 公共组件放在 `src/components/`
- 跨组件状态放在 `xxxStore/`
- API 方法放在 `src/api/`
- API 类型放在 `src/api/types/`
- 子模块目录结构保持一致，例如 `src/api/tasks/task.api.ts` 对应 `src/api/tasks/task.types.ts`
- 仅在当前页面、当前布局或当前模块内使用的 `components`、`hooks`、`utils`、`store`，必须放在对应局部目录，不要提前放到全局目录。
- 只有在确认被多个页面、布局或模块复用后，才允许提升到 `src/components/`、`src/hooks/`、`src/utils/`、`src/store/` 等全局目录。
- 不要为了“可能以后会复用”而提前做全局抽取；先局部沉淀，复用场景明确后再抽象。

### Global Hooks Directory Boundary

- `src/hooks` 只放项目级通用 Hook，必须被多个页面、布局、全局组件或跨业务域场景真实复用。
- 只有一个页面或组件引用的 Hook 必须放到调用方局部 `hooks/` 目录，不允许通过 `@/hooks` 暴露。
- 仅某个全局业务组件域复用的 Hook 放到 `src/components/<业务域>/hooks/`，不要提升到 `src/hooks`。
- 新增全局 Hook 前必须先用 `rg` 检查调用方与类似实现；单引用或未被复用的 Hook 不满足全局准入。
- 新增、迁移、删除 `src/hooks` 下任意文件时，必须同步更新 `src/hooks/README.md` 和 `src/hooks/index.ts`。

### Global Utils Directory Boundary

- `src/utils` 是唯一全局工具目录，只放跨页面、跨业务复用的纯工具函数、稳定基础设施封装和低业务耦合工具。
- 禁止新增或恢复 `src/lib` 作为工具目录；历史 `lib` 能力必须迁移到 `src/utils`、`src/api`、`src/app/i18n` 或调用方局部目录。
- `src/utils/README.md` 维护一级目录边界、根目录文件说明、准入规则和 README 更新规则。
- `src/utils` 下每个一级子目录都必须维护自己的 `README.md`，说明目录职责、覆盖范围、文件清单、导出方法和新增规则。
- 新增、迁移、删除 `src/utils` 下任意文件时，必须同步更新 `src/utils/README.md` 和对应子目录 README。
- 单页面、单布局、单 store、单 hook 使用的工具必须下沉到对应局部目录，不允许放入 `src/utils`。
- 功能模块相似的工具必须归入同一业务目录，例如任务相关工具归入 `src/utils/task/`，请求基础设施归入 `src/utils/request/`，命令式 UI 工具归入 `src/utils/ui/`。

### Global Components Directory Boundary

- `src/components/README.md` 只维护一级目录边界、放置规则和索引，不维护二级目录内部组件说明。
- `src/components` 根目录禁止新增孤立业务组件；新增全局组件必须归入 `common`、`ui` 或明确业务域目录，例如 `task`、`social`、`analytics`、`Chat`、`Plugin`。
- `src/components/common` 只放跨页面、跨业务域复用的小型通用组件，例如头像、图片、SEO、通用弹窗入口；不要放页面流程或业务域专属组件。
- 明确属于某个业务域的复用组件必须放入对应业务域目录，例如任务类型标签放 `src/components/task/TaskTypeBadge`，社交平台组件放 `src/components/social/<platform>/`，数据图表放 `src/components/analytics/`。
- 每个全局二级目录必须维护自己的 `README.md`，记录该目录组件清单、职责边界和新增规则；新增或迁移组件时同步更新对应二级目录 README。
- 如果组件只被单个页面、布局或模块使用，优先放到该页面、布局或模块的局部 `components/` 目录，不要提升到 `src/components`。
- `src/app/layout` 只放 App Shell、侧边栏、移动导航、全局 Provider、布局私有工具和只由布局挂载的全局弹窗 UI；普通页面如需控制 layout 弹窗，必须通过 `src/store` 中立状态或事件协作，不要直接 import layout 内部组件。

### Cross-Page Reuse Boundary

- `src/app/[lng]/xxx/` 页面目录下的 `components`、`hooks`、`utils`、`store`、`xxxStore` 默认都是该页面的局部实现，其他页面禁止直接引用。
- 如果已经有 A 页面，B 页面需要复用 A 页面中的局部组件、store、hook、utils 或类型，必须先把被复用部分拆到中立公共位置，再由 A / B 页面共同引用，不能让 B 页面直接依赖 A 页面内部文件。
- 跨页面复用组件放到 `src/components/<业务域>/`，跨页面复用状态放到 `src/store/<业务域>/`，跨页面复用 hook 放到 `src/hooks/` 或 `src/components/<业务域>/hooks/`，跨页面复用纯工具放到 `src/utils/` 或 `src/components/<业务域>/utils/`。
- API 数据模型、请求/响应类型等跨页面类型必须放到 `src/api/types/` 或对应 API 类型文件中，不要放在某个页面的 store/types 里供其他页面引用。
- 如果两个页面都需要访问同一份 zustand 状态，必须拆成共享 store；页面级局部 store 只能服务当前页面，不允许通过 `@/app/[lng]/其他页面/...Store` 形成跨页面耦合。
- 如果共享组件里需要接入某个页面专属 UI（例如品牌信息卡、二维码区），共享组件必须通过 props / render props / slot 注入，不允许共享组件反向 import 页面专属组件。
- 允许页面之间通过路由跳转、URL 参数、事件或公共 store 协作；不允许页面之间直接 import 对方局部目录中的实现细节。
- 发现已有跨页面直接引用时，新增功能前必须先重构解耦；至少要把本次会继续依赖的部分提取成公共模块，并同步更新对应 README。

禁止示例：

```tsx
import PlanTabBar from '@/app/[lng]/brand-promotion/components/PlanTabBar'
import { usePlanDetailStore } from '@/app/[lng]/brand-promotion/[planId]/planDetailStore'
import DraftContentModule from '@/app/[lng]/draft-box/components/DraftContentModule'
```

推荐示例：

```tsx
import PlanTabBar from '@/components/draft-box/components/PlanTabBar'
import DraftContentModule from '@/components/draft-box/components/DraftContentModule'
import { usePlanDetailStore } from '@/store/draft-box/planDetailStore'
```

### Component Folder Structure

每个组件使用独立文件夹，通过 `index.tsx` 导出：

```text
components/
  DraftDetailDialog/
    index.tsx
    DraftDetailDialog.module.scss
```

- 文件夹名使用 PascalCase，并与组件名一致
- 主文件命名为 `index.tsx`
- 样式文件命名为 `[文件夹名].module.scss`
- 组件内部子组件、hooks、工具函数也放在同一文件夹内

### Local Large Component Directory Structure

当局部页面或组件目录继续扩展，已经拆出多个私有子组件、hooks、工具函数或样式文件时，必须使用标准化子目录，避免把所有文件平铺在组件根目录。

推荐结构：

```text
ComponentName/
  index.tsx
  README.md
  components/
    ChildComponent/
      index.tsx
      ChildComponent.module.scss
      components/
      hooks/
      utils/
      types/
  hooks/
    useXxx.ts
  store/
    xxxStore.ts
  types/
    index.ts
  utils/
    xxx.ts
  styles/
    ComponentName.module.scss
```

- `index.tsx` 只保留组件入口、组合编排和必要的 props 连接，不继续堆积大段业务逻辑。
- `components/` 只放当前组件私有 UI 子组件；确认跨组件复用后再提升到上层公共 `components/`。
- `components/<ChildComponent>/` 如果继续变大，也必须按同样规则继续拆出自己的 `components/`、`hooks/`、`utils/`、`types/`，必要时在上层组件目录使用 `store/` 承接共享状态。
- `hooks/` 只放当前组件私有 Hook；确认被多个组件真实复用后再提升到业务域 hooks 或全局 `src/hooks`。
- `utils/` 只放当前组件私有纯函数、常量和低副作用计算；跨业务复用再提升到合适公共目录。
- `types/` 只放当前组件私有类型、props 类型、视图模型类型和类型辅助；不要把类型定义混在组件、hooks 或 utils 文件里。
- `store/` 只放当前组件私有局部状态；跨页面或跨业务复用后再提升到合适公共 store。
- `styles/` 放当前组件入口样式或多个内部区块共享的样式；单个子组件私有样式仍放在对应子组件文件夹内。
- 使用 `components/`、`hooks/`、`utils/`、`types/`、`store/`、`styles/` 的复杂组件目录必须维护本目录 `README.md`，说明目录职责、内部文件清单和提升复用规则。
- 不要在一个文件里同时堆放组件、hooks、业务方法、纯工具函数和类型；必须按职责放到对应子目录。
- 不要为了“可能以后复用”提前把局部 hooks、utils、types、store 或子组件提升到全局；先在局部标准目录内沉淀。

### File Scalability

- 单个文件必须保持职责单一，不要在一个文件内堆积过多 UI、请求、状态、事件处理、格式化逻辑。
- 页面或组件文件如果已经同时承载大段 JSX、数据请求、复杂状态编排、类型定义和多个交互区域，必须按职责拆分到同目录的 `components/`、`hooks/`、`utils/`、`types/`、`store/` 中。
- 出现明显独立的区块时必须及时提取，不要持续向单文件追加代码；例如：弹窗、表单区、筛选区、列表区、表格列定义、步骤流、卡片区、独立异步流程。
- 不要在同一个文件中放多个职责无关的组件或工具函数；可复用逻辑优先抽到公共目录，并同步更新对应 README。
- 对已有大文件新增功能时，若继续追加会明显降低可读性或扩展性，必须先拆分再开发，不要把重构成本继续后移。

## State Management

当页面内或大型局部组件内多个组件需要共享状态时，必须使用局部 zustand store，不要通过 props 层层传递大量字段。

- 在页面或组件目录下创建 `store/xxxStore.ts`
- 使用 `zustand` + `combine`
- 页面或组件顶层负责初始化数据，子组件直接从 store 读取
- 2 个及以上字段联合取值时，必须配合 `useShallow` 使用
- 页面级或组件级共享状态放局部 store；全局状态仍放 `src/store/`
- 父子组件 props 入参或回调明显过多、出现多层透传、兄弟组件需要读写同一组状态时，必须优先评估局部 store，不要继续扩大 props 面。
- 不要把服务单个页面或单个大型组件的状态提升到全局 store；先在局部 `store/` 内沉淀。

示例：

```tsx
const { foo, bar } = useXxxStore(
  useShallow((state) => ({
    foo: state.foo,
    bar: state.bar,
  }))
)
```

## API Rules

- 新增或修改 API 前必须先阅读 `src/api/README.md` 和目标子目录 `README.md`，按模块边界放置接口。
- API 目录使用业务子目录结构：请求方法写入同目录 `*.api.ts`，请求/响应类型与枚举写入 `*.types.ts`，模块常量写入 `*.constants.ts`。
- 禁止新增或恢复 `src/api/types` 全局类型目录；类型必须与对应 API 模块同目录，确认为跨模块复用后才允许放入 `src/api/_shared`。
- 新增接口前必须用后端路径、HTTP 方法和函数名搜索 `src/api`，已有同功能接口必须复用或扩展，不要重复封装。
- 删除或迁移 API 后必须同步更新对应子目录 README，并运行 `npx tsc --noEmit`。
- API 方法和类型定义必须分离，不能放在同一文件中。
- 创建类接口必须判断返回值 `code === 0` 才视为成功；其他 `code` 都视为失败，并提示 `message`。

接口响应示例：

```json
{ "data": {}, "code": 0, "message": "success", "timestamp": 1772099056662 }
```

## Code Quality

- 优先复用已有类型和组件。
- 保持 lint、prettier、TypeScript 通过。
- 页面顶部注释写明组件名称和功能描述。
- API 操作需要 loading 状态；UI 需要骨架屏。
- 按钮 loading 状态使用 `Loader2` 转圈图标，并设置 `disabled`，不要改变按钮文案。
- 按钮加 `cursor-pointer`，兼容移动端。

## UI Style

- 技术栈优先使用 Tailwind CSS + shadcn/ui
- 页面主视觉、CTA、强调状态优先使用当前品牌渐变：`gradient-back`；辅助强调可使用 `primary`、`brand-purple`、`brand-cyan`
- 主要按钮默认使用 `bg-gradient-back text-gradient-foreground` 的渐变视觉，参考品牌紫到品牌青的圆角胶囊按钮效果
- 中性内容、边框、背景仍优先使用语义化 token，如 `bg-background`、`text-foreground`、`text-muted-foreground`、`border-border`
- 视觉风格保持简约、现代、留白充足、层次分明
- 组件优先使用 shadcn/ui，保持设计语言一致

## Tailwind CSS v4

优先使用 v4 写法：

```tsx
<div className="bg-(--primary-color)" />
<div className="bg-gradient-back text-gradient-foreground" />
```

不要写：

```tsx
<div className="bg-[var(--primary-color)]" />
```

### Theme Compatibility

- 所有样式必须兼容 Tailwind CSS 的浅色 / 深色主题切换，不允许只适配单一主题。
- 优先使用语义化颜色 token 或主题变量，如 `bg-background`、`text-foreground`、`border-border`、`text-muted-foreground`，避免直接写死仅适用于浅色或深色的颜色值。
- 品牌色统一使用 `bg-gradient-back`、`text-gradient-foreground`、`text-primary`、`bg-primary`、`border-primary`、`text-brand-purple`、`text-brand-cyan` 等 Tailwind 主题类，不要直接写 `oklch(...)` 或重复定义品牌渐变。
- `--primary` / `bg-primary` 作为背景时，不允许搭配黑色或深色文字；必须使用 `text-primary-foreground`、`text-gradient-foreground` 或其它在当前主题下可读的前景色 token。
- 新增或修改 UI 时，必须同时检查文字、背景、边框、分割线、阴影，以及 hover、active、disabled 等状态在浅色 / 深色下的可读性与层级关系。
- 如果现有页面或组件已经基于 shadcn/ui 的主题 token 实现，必须延续该方案，不要额外维护一套局部明暗主题样式。

## Internationalization

- 所有用户可见文本必须国际化。
- 不要给 `t()` 添加类型断言。
- 新增 key 时同步更新翻译文件。

### Route Rule

路由链接不要手动拼接语言前缀：

```tsx
<Link href="/pricing">定价</Link>
```

不要写：

```tsx
<Link href={`/${lng}/pricing`}>定价</Link>
```

## Next.js Rules

- 默认使用服务端组件，仅在需要交互时使用客户端组件
- 仅在客户端组件文件中写 `'use client'`
- 使用 `error.tsx` 处理错误，使用 `loading.tsx` 管理加载状态
- 使用 Next.js `Image` 组件优化图像

### Metadata

- 静态元数据直接使用 `metadata`
- 动态元数据优先使用 `generateMetadata`
- 页面 SEO 元数据优先复用 `getMetadata`

## TypeScript Rules

- 让 TypeScript 自动推断返回类型，避免冗余标注
- 避免使用 `JSX.Element` 作为常规返回类型；需要描述可渲染内容时使用 `React.ReactNode`
- 页面组件可以默认导出，普通组件优先命名导出

## SCSS Rules

### `:global()` Syntax

不要在 `:global()` 内使用 `&-suffix` 追加类名；单独声明完整类名。

### BEM Naming

- Block: `.block`
- Element: `.block_element`
- Modifier: `.block_element-modifier`

## Project Config References

开发前务必查阅 `src/app/config/`，避免硬编码和重复定义。

重点配置：

- `platConfig.ts`：平台配置与 `PlatType`
- `publishConfig.ts`：发布类型 `PubType`
- `accountConfig.ts`：账号状态与异常状态
- `appDownloadConfig.ts`：应用下载地址与缓存逻辑
- `promotionConfig.ts`：推广配置预留文件

## Known Pitfalls

### `useTransClient` namespace 首次动态加载闪烁

原因：

- `settings.ts` 只预加载 `common` 和 `route`
- 其他 namespace 首次使用时会异步加载
- 首帧可能显示 key，随后才显示真实翻译

规则：

- 条件渲染组件可拆成外层控制渲染、内层使用翻译的两层结构
- 对已有 loading/skeleton 的组件，外层必须同时等待数据 ready 和 i18n ready，再渲染子组件

### 新增路由要检查 `src/middleware.ts`

新增不需要语言前缀的路由时，要把路径加入 `src/middleware.ts` 白名单，否则会被自动重定向到带语言前缀的路径。

### 页面主滚动容器

页面主滚动元素是 `id="main-content"`，定义在 `src/app/layout/MainContent/index.tsx`。回到顶部等滚动操作应基于该元素，不要基于 `window`。

### Radix UI Popover 内部滚动失效

在 `PopoverContent` 上添加 `allowInnerScroll`。

### Canvas 跨域问题

跨域图片会污染 Canvas；使用同域代理方案，优先复用 `getOssProxyPath`。

### Radix UI Tooltip 受控/非受控切换警告

始终保持受控模式，用独立 state 管理 `open`，不要在 `false` 和 `undefined` 之间切换。

### `confirm()` 内需要 loading 时

将异步逻辑放进 `onOk`，让弹窗内部自己管理确认按钮 loading，不要在 `confirm()` 外部再维护一层 loading。
