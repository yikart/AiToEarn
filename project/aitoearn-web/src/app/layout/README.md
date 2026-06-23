# Layout 布局组件文档

本目录包含应用 App Shell 与全局布局私有组件。这里的组件默认服务布局、侧边栏、移动导航、全局 Provider 或全局挂载弹窗，不作为普通页面的共享组件目录。

## 目录结构

| 目录/文件              | 描述                                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------------------- |
| `LayoutSidebar/`       | 桌面端左侧侧边栏组件。                                                                               |
| `MobileNav/`           | 移动端底部导航组件（BottomBar + 抽屉）。                                                             |
| `MainContent/`         | 页面主滚动容器，主滚动元素为 `id="main-content"`。                                                   |
| `LoginDialog/`         | 全局登录弹窗，状态在 `src/store/login-dialog`。                                                      |
| `SettingsModal/`       | 全局设置弹窗，仅由 layout/Provider 挂载；跨页面控制状态放在 `src/store/settingsModal.ts`。           |
| `ConfigManagerDialog/` | 全局配置管理弹窗，仅由 layout/Provider 挂载；跨页面控制状态放在 `src/store/configManagerDialog.ts`。 |
| `HomeComponents/`      | 首页布局入口组件。                                                                                   |
| `shared/`              | 布局内部共享 hooks、工具与展示组件。                                                                 |
| `Providers.tsx`        | 全局 Provider 包装组件。                                                                             |
| `routerData.tsx`       | 路由/导航数据配置（含图标）。                                                                        |
| `layout.utils.ts`      | 布局工具函数。                                                                                       |
| `images/`              | 布局相关图片资源。                                                                                   |

## 放置边界

- 可以放：侧边栏、移动导航、登录弹窗、设置弹窗、通知面板、全局 Provider、布局私有工具。
- 可以放：只由 layout 挂载、不被普通页面直接复用的全局弹窗 UI。
- 不要放：普通页面之间复用的业务组件；这类组件应放到 `src/components/<业务域>/`。
- 不要放：页面私有组件；这类组件应放到对应页面目录的 `components/`。
- 普通页面如果需要打开 layout 弹窗，应通过 `src/store/` 中立状态或事件协作，不要 import `src/app/layout` 内部组件。

## LayoutSidebar - 桌面端侧边栏

- Logo 区域。
- 主导航菜单使用 `routerData` 数据和图标。
- 底部功能区包含频道入口、插件入口、设置、用户头像/登录按钮。
- 桌面端（md 及以上）显示，移动端隐藏。

## MobileNav - 移动端导航

- 固定底部栏展示开源版核心路由。
- 抽屉式导航菜单和未登录登录按钮。
- 移动端（md 以下）显示，桌面端隐藏。

## SettingsModal - 全局设置弹窗

设置弹窗由 `Providers` 挂载，页面和业务组件通过 `useSettingsModalStore` 打开或关闭。

```tsx
import { useSettingsModalStore } from '@/store/settingsModal'
```

- UI 实现在 `src/app/layout/SettingsModal/`。
- 状态与 `SettingsTab` 类型在 `src/store/settingsModal.ts`，避免页面直接依赖 layout 内部实现。
- 开源版只保留 profile / general 设置入口，不恢复闭源订阅、钱包、API Key、工单等设置页。

## ConfigManagerDialog - 全局配置管理弹窗

配置管理弹窗由 `Providers` 挂载，侧边栏和请求错误提示通过 `useConfigManagerDialogStore` 打开。

```tsx
import { useConfigManagerDialogStore } from '@/store/configManagerDialog'
```

- UI 实现在 `src/app/layout/ConfigManagerDialog/`。
- 弹框内将后端配置对象转换为可编辑表单，不直接暴露 JSON 编辑。
- 保存后可重启服务，并通过 `/health` 健康检查确认服务恢复。

## routerData - 导航数据配置

定义导航菜单数据，包含图标、路径和可见性控制。

```tsx
import { routerData, visibleRouterData } from '@/app/layout/routerData'
```

- `routerData`：完整导航数据。
- `visibleRouterData`：开源版可见导航数据。
- 新增路由时同步检查 `src/middleware.ts` 是否需要白名单。

## Providers - 全局 Provider

```tsx
import { Providers } from '@/app/layout/Providers'
;<Providers lng={lng}>{children}</Providers>
```

- 注入平台元数据初始值、登录弹窗、设置弹窗、插件发布浮窗、Toast 等全局能力。
- 集成微信/支付宝内置浏览器蒙版 `WechatBrowserOverlay`。
