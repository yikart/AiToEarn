# Home 首页组件开发规范

## 布局规范

### 容器宽度

所有首页模块必须使用统一的最大宽度，确保视觉对齐：

```tsx
<section className="py-8 px-4 md:px-6 lg:px-8">
  <div className="w-full max-w-5xl mx-auto">{/* 组件内容 */}</div>
</section>
```

**关键规则：**

- 最大宽度：`max-w-5xl`（1024px）
- 水平居中：`mx-auto`
- 响应式内边距：`px-4 md:px-6 lg:px-8`

### 垂直间距

- section 垂直内边距：`py-8` 或 `py-12`
- 标题与内容间距：`mb-6` 或 `mb-8`

## 现有组件

| 组件          | 路径              | 说明                            |
| ------------- | ----------------- | ------------------------------- |
| HomeChat      | `./HomeChat`      | 首页聊天输入框                  |
| AgentFeatures | `./AgentFeatures` | AI Agent 功能亮点展示（跑马灯） |
| PromptGallery | `./PromptGallery` | 提示词灵感库                    |
| TaskPreview   | `./TaskPreview`   | 任务预览展示                    |

## 常见错误

### ❌ 错误示例

```tsx
// 宽度不统一
<div className="max-w-6xl mx-auto">  // 错误！应该用 max-w-5xl
<div className="max-w-4xl mx-auto">  // 错误！应该用 max-w-5xl
```

### ✅ 正确示例

```tsx
<div className="w-full max-w-5xl mx-auto">
```

## 主题色规范

参考项目根目录 `.claude/rules/default.md`：

- 使用 shadcn/ui 语义化颜色变量（`text-foreground`、`bg-muted` 等）
- 不使用硬编码颜色（如 `text-gray-900`、`bg-white`）
- 不使用 `var.css` 中的旧变量
