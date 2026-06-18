# MediaMentionPromptInput

`AiBatchGenerateBar` 的私有媒体提及输入框，负责在提示词中输入、渲染、搜索和预览 `@Image`、`@Video`、`@Audio` 素材提及。

## 目录结构

| 目录          | 说明                                                               |
| ------------- | ------------------------------------------------------------------ |
| `index.tsx`   | 入口组合层，只连接 Lexical、插件、上下文、预览和外部 props。       |
| `components/` | 当前输入框私有 UI 子组件，例如提及 chip、缩略图、菜单和空状态。    |
| `context/`    | 当前输入框私有 React Context，向菜单和 chip 提供素材、文案和事件。 |
| `hooks/`      | 当前输入框私有 Hook，承接派生状态、搜索、预览和变更回调。          |
| `plugins/`    | 当前输入框私有 Lexical 插件，每个插件只负责一个编辑器能力。        |
| `types/`      | 当前输入框私有 props、Context、插件参数和媒体提及类型。            |
| `utils/`      | 当前输入框私有纯函数、提及序列化、搜索过滤和编辑器配置。           |

## 维护规则

- `index.tsx` 只做组合编排，不再新增工具函数、类型定义、菜单子组件或 Lexical 插件实现。
- 新增 UI 子组件放入 `components/<PascalCase>/index.tsx`，组件 props 类型放入 `types/`。
- 新增 Lexical 能力放入 `plugins/`，不要直接写回入口文件。
- 新增文本解析、mention 数据转换、搜索过滤等纯逻辑放入 `utils/`。
- 如果输入框内部出现多个子组件共享可写状态，优先在上层 `AiBatchGenerateBar/store/` 扩展局部 store。
- 只有确认被 `MediaMentionPromptInput` 之外复用后，才评估提升到 `AiBatchGenerateBar` 上层目录或草稿箱公共目录。
