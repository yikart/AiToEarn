# 通用规则（适用于所有 Next.js 项目）

用中文回答问题。

提交代码不要写 "Co-Authored-By" 和 "<noreply@anthropic.com>"

## Skills 强制使用规则

**必须自动调用以下 Skills：**

| Skill                         | 触发场景                               |
| ----------------------------- | -------------------------------------- |
| `vercel-react-best-practices` | 编写、审查、重构 React/Next.js 代码时  |
| `frontend-design`             | 创建、修改、优化任何 UI 时（必须调用） |

## 禁止事项

- 使用 `npm run build` 做类型检查 → 用 `npx tsc --noEmit`
- 使用硬编码颜色（如 `text-gray-900`）→ 用 shadcn/ui 语义化变量
- 使用纯黑色（`#000`、`black`、`text-black`）→ 用灰色系语义化变量（`text-muted-foreground`、`text-foreground` 等）
- 用 `as any` 绕过 TypeScript 类型错误 → 必须从源头修复类型定义（扩展 interface/type、添加联合类型等）

## 代码质量

- 复用已有类型和组件
- 符合 lint/prettier/typescript 规范
- 页面顶部注释：组件名称、功能描述
- API 操作加 loading，UI 加骨架屏
- 按钮 loading 状态：`Loader2` 转圈图标（`lucide-react`）+ `disabled`，不改变按钮文字
- 按钮加 `cursor: pointer`，兼容移动端

## UI 设计风格

- 技术栈：Tailwind CSS + shadcn/ui
- 色调：使用 Tailwind 默认灰色中性色调（`slate`/`gray`/`neutral`），保持柔和、舒适的视觉感受
- 避免过度使用纯黑色（`#000` / `black`），文本优先使用深灰（如语义化变量 `foreground`/`muted-foreground`）
- 整体风格：简约、现代、留白充足、层次分明
- 组件优先使用 shadcn/ui，保持一致的设计语言

## 组件文件夹规范

每个组件必须使用独立文件夹，将同一功能的所有相关文件放在一起，通过 `index.tsx` 导出。

```
// ❌ 错误：组件文件散落在 components/ 下
components/
  DraftDetailDialog.tsx
  DraftDetailDialog.module.scss

// ✅ 正确：每个组件一个文件夹
components/
  DraftDetailDialog/
    index.tsx
    DraftDetailDialog.module.scss
```

- 组件主文件命名为 `index.tsx`，样式文件命名为 `[文件夹名].module.scss`
- 组件内部的子组件、hooks、工具函数等也放在同一文件夹内
- 文件夹名使用大驼峰（PascalCase），与组件名一致

## API 文件规范

- API 方法和类型定义**必须分离**，不能放在同一个文件中
- 创建类接口必须判断返回值 `code === 0` 才视为成功，其他 code 均为失败，需提示 `message`

```ts
// 接口响应格式
{ "data": {}, "code": 0, "message": "success", "timestamp": 1772099056662 }

// ✅ 正确：判断 code === 0
const res = await createXxx(params)
if (res.code === 0) {
  toast.success(t('createSuccess'))
} else {
  toast.error(res.message)
}

// ❌ 错误：不判断 code，直接当成功处理
const res = await createXxx(params)
toast.success(t('createSuccess'))
```

## Tailwind CSS v4

```tsx
// ✅ 正确
<div className="bg-(--primary-color)" />
// ❌ 错误
<div className="bg-[var(--primary-color)]" />
```

## Store 规范

- 普通 store：`zustand` + `combine`
- **必须**使用 `useShallow`（来自 `zustand/react/shallow`）优化 store 多属性取值，防止不必要的重渲染
- 单个 selector 可以不用 useShallow；**2 个及以上**必须合并
- 子组件直接从 store 取数据

```tsx
// ❌ 错误：多次独立调用
const foo = useXxxStore((state) => state.foo)
const bar = useXxxStore((state) => state.bar)

// ✅ 正确：useShallow 合并
const { foo, bar } = useXxxStore(
  useShallow((state) => ({
    foo: state.foo,
    bar: state.bar,
  }))
)
```

## 国际化

- 所有文本必须国际化
- 不要给 `t()` 加类型断言
- 新增 key 时同步更新翻译文件

## 路由规范

```tsx
// ✅ 不需要语言前缀
<Link href="/pricing">定价</Link>
// ❌ 错误
<Link href={`/${lng}/pricing`}>定价</Link>
```

---

# Next.js 14 规范

## App Router

- 默认使用服务端组件，仅在需要交互时用客户端组件
- 仅在客户端组件使用 `'use client'`
- 使用 `error.tsx` 处理错误，`loading.tsx` 管理加载状态
- 使用 Next.js Image 组件优化图像

## 数据获取

```tsx
async function getData() {
  const res = await fetch('https://api.example.com/data', {
    next: { revalidate: 3600 },
  })
  if (!res.ok) throw new Error('Failed to fetch data')
  return res.json()
}
```

## 元数据

```tsx
// 静态
export const metadata: Metadata = { title: 'Page Title' }

// 动态
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  return { title: data.title }
}
```

---

# TypeScript 规范

## 组件定义

```tsx
interface ComponentNameProps {
  prop1: string
}

const ComponentName = ({ prop1 }: ComponentNameProps) => {
  // 组件逻辑
}

export const ComponentName = () => {} // 命名导出
export default Page // 页面默认导出
```

- 让 TypeScript 推断返回类型，避免冗余类型标注
- 避免使用 `JSX.Element`，用 `React.ReactNode`

---

# SCSS 规范

## :global() 语法

```scss
// ❌ 错误：不能用 & 后缀
:global(.className) {
  &-loaded {
    opacity: 1;
  }
}

// ✅ 正确：单独声明
:global(.className) {
  opacity: 0;
}
:global(.className-loaded) {
  opacity: 1;
}
```

## BEM 命名

- Block: `.block`
- Element: `.block_element`（单下划线）
- Modifier: `.block_element-modifier`（短横线）

---

# 疑难杂症记录

## 1. Radix UI Popover 内部滚动失效

**原因**：`react-remove-scroll` 阻止了内部滚动

**解决**：在 `PopoverContent` 添加 `allowInnerScroll` 属性

```tsx
<PopoverContent allowInnerScroll>
  <div className="overflow-y-auto">...</div>
</PopoverContent>
```

## 2. Canvas 跨域问题

**原因**：跨域图片污染 Canvas

**解决**：使用代理转为同域资源

## 3. Radix UI Tooltip 受控/非受控切换警告

**原因**：条件性地将 `open` 设为 `false` 或 `undefined` 会导致组件在受控和非受控模式间切换

**错误写法**：

```tsx
<Tooltip open={someCondition ? false : undefined}>
```

**解决**：始终使用受控模式，用独立 state 管理 Tooltip 状态

```tsx
const [tooltipOpen, setTooltipOpen] = useState(false)

<Tooltip open={!someCondition && tooltipOpen} onOpenChange={setTooltipOpen}>
```

## 4. `confirm()` 弹窗内需要 loading 时，必须用 `onOk` 回调模式

**场景**：确认弹窗点击确认后需要调用 API，希望在弹窗内显示 loading 状态

**错误做法**：`confirm` 返回 boolean → 弹窗立即关闭 → 外部按钮显示 loading（体验割裂）

```tsx
// ❌ 错误：API 在 confirm 外部调用，弹窗关闭后才 loading
const confirmed = await confirm({ title: '确认？' })
if (!confirmed) return
setLoading(true)
await apiCall()
setLoading(false)
```

**正确做法**：将 API 调用放入 `onOk` 异步回调，`confirm` 组件会自动在确认按钮上显示 loading，API 完成后才关闭弹窗

```tsx
// ✅ 正确：API 在 onOk 内调用，弹窗内部自动 loading
await confirm({
  title: '确认？',
  onOk: async () => {
    await apiCall()
    // 成功处理...
  },
})
```

这样无需额外维护 `xxxLoading` state，也不需要给外部按钮传 `loading` prop。
