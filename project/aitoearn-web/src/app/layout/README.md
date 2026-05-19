# Layout 布局组件文档

本目录包含应用全局布局相关组件。

## 目录结构

| 目录/文件         | 描述                                   |
| ----------------- | -------------------------------------- |
| `LayoutSidebar/`  | 桌面端左侧侧边栏组件                   |
| `MobileNav/`      | 移动端底部导航组件（BottomBar + 抽屉） |
| `FilingRecord/`   | 中文环境底部公安备案信息               |
| `Providers.tsx`   | 全局 Provider 包装组件                 |
| `routerData.tsx`  | 路由/导航数据配置（含图标）            |
| `layout.utils.ts` | 布局工具函数                           |
| `images/`         | 布局相关图片资源                       |

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

移动端底部导航组件，使用 Tailwind CSS + shadcn/ui 实现。

**功能：**

- 固定底部栏（BottomBar）
- 抽屉式导航菜单
- 登录按钮（未登录时显示）

**响应式：** 移动端（md 以下）显示，桌面端隐藏

---

## FilingRecord - 备案信息

仅在当前语言为中文时显示，挂载在 `MainContent` 的主滚动区域末尾，展示公安备案图标和备案号链接。

---

## routerData - 导航数据配置

定义导航菜单数据，包含图标和区域可见性控制。

```tsx
import { routerData, visibleRouterData } from '@/app/layout/routerData'

interface IRouterDataItem {
  name: string // 导航标题
  translationKey: string // 翻译键
  path?: string // 跳转链接
  icon?: React.ReactNode // 图标（Lucide）
  hideInChina?: boolean // 国内版隐藏
  children?: IRouterDataItem[]
}
```

- `routerData`：完整导航数据
- `visibleRouterData`：已按 `isChina` 过滤后的可见导航数据

---

## Providers - 全局 Provider

```tsx
import { Providers } from '@/app/layout/Providers'
;<Providers lng={lng}>{children}</Providers>
```

- 集成全局微信内置浏览器蒙版 `WechatBrowserOverlay`，任意语言路由在微信内打开时统一提示用户切换系统浏览器。
