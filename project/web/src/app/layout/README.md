# Layout 布局组件文档

本目录包含应用全局布局相关组件。

## 目录结构

| 目录/文件 | 描述 |
|----------|------|
| `LayoutSidebar/` | 桌面端左侧侧边栏组件 |
| `MobileNav/` | 移动端顶部导航组件（抽屉式） |
| `Providers.tsx` | 全局 Provider 包装组件 |
| `routerData.tsx` | 路由/导航数据配置（含图标） |
| `layout.utils.ts` | 布局工具函数 |
| `images/` | 布局相关图片资源 |

---

## LayoutSidebar - 桌面端侧边栏

左侧侧边栏布局组件，使用 Tailwind CSS + shadcn/ui 实现。

**功能：**
- Logo 区域
- 主导航菜单（使用 `routerData` 数据和图标）
- 底部功能区：邮箱、设置、通知、用户头像/登录按钮

**响应式：** 桌面端（md 及以上）显示，移动端隐藏

---

## MobileNav - 移动端导航

移动端顶部导航组件，使用 Tailwind CSS + shadcn/ui 实现。

**功能：**
- 固定顶部栏（Logo + 菜单按钮）
- 抽屉式导航菜单
- 登录按钮（未登录时显示）

**响应式：** 移动端（md 以下）显示，桌面端隐藏

---

## routerData - 导航数据配置

定义导航菜单数据，包含图标。

```tsx
import { routerData } from '@/app/layout/routerData'

interface IRouterDataItem {
  name: string           // 导航标题
  translationKey: string // 翻译键
  path?: string          // 跳转链接
  icon?: React.ReactNode // 图标（Lucide）
  children?: IRouterDataItem[]
}
```

---

## Providers - 全局 Provider

```tsx
import { Providers } from '@/app/layout/Providers'

<Providers lng={lng}>
  {children}
</Providers>
```
