# Components 组件库

本目录包含项目通用组件。开发前请先查阅，避免重复开发。

## 目录总览

| 目录/文件         | 描述                                                 |
| ----------------- | ---------------------------------------------------- |
| `ui/`             | shadcn/ui 基础组件                                   |
| `common/`         | 通用功能组件                                         |
| `modals/`         | 弹窗组件集合                                         |
| `Plugin/`         | 浏览器插件相关组件                                   |
| `Home/`           | 首页相关组件（AgentGenerator、HomeChat 等）          |
| `Chat/`           | 聊天组件（ChatInput、ChatMessage 等）                |
| `PublishDialog/`  | 发布对话框（PC/移动端分离架构）                      |
| `ChannelManager/` | 频道管理弹窗                                         |
| `SettingsModal/`  | 用户设置弹框                                         |
| `twitter/`        | Twitter 控制台、推文卡片、推文详情与发布/互动相关 UI |
| `notification/`   | 通知相关组件                                         |

---

## ui/ - shadcn/ui 基础组件

新增组件使用 `npx shadcn@latest add <component>` 安装。

| 组件                    | 说明                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------- |
| `modal.tsx`             | 通用 Modal 封装（基于 dialog），替代 antd Modal                                             |
| `select.tsx`            | 基础选择器（基于 Radix Select，支持 `clearable` / `onClear` 清除当前选择）                  |
| `searchable-select.tsx` | 可搜索选择器（基于 command + popover，选项支持 `icon` / `color` 展示）                      |
| `form.tsx`              | 表单组件（基于 react-hook-form，提供 FormField/FormItem/FormLabel/FormControl/FormMessage） |
| `star-rating.tsx`       | 星星评分组件（悬停预览、点击选择）                                                          |
| `sonner.tsx`            | Toast 通知（配合 `@/lib/toast` 使用）                                                       |
| `number-input.tsx`      | 数字输入框（基于 react-number-format，替代 type="number"，支持 `min` / `max` 失焦校正）     |
| `sheet.tsx`             | 抽屉组件（基于 Radix Dialog，支持 bottom/right/left/top，用于移动端详情与配置说明）         |
| `date-picker/`          | 单日期选择器（Popover + 日历面板，替代 `<Input type="date">`）                              |
| `date-range-picker/`    | 日期范围选择器（Popover + 日历面板，导出 `DateRangeCalendar` 供移动端内嵌）                 |
| `hover-card.tsx`        | Hover 信息卡片（基于 Radix HoverCard，适合带交互内容的悬浮说明）                            |
| `carousel.tsx`          | Embla 轮播封装，`CarouselContent` 支持 `viewportClassName` 调整视口溢出裁切与留白           |

> **Modal** 使用：`<Modal open onClose title="标题" footer={...}>`，命令式确认用 `@/lib/confirm`。新代码禁止使用 antd Modal。

---

## common/ - 通用功能组件

| 组件               | 说明                                                                          |
| ------------------ | ----------------------------------------------------------------------------- |
| `AppReleaseModal`  | 版本更新提示弹框，已集成到 Providers                                          |
| `LanguageSwitcher` | 语言切换下拉菜单                                                              |
| `MediaPreview`     | 媒体预览（图片/视频/文件），支持放大、轮播、画笔编辑、图片压缩与 JPG/PNG 转换 |
| `GlobalLoginModal` | 全局登录弹窗（任意页面触发）                                                  |
| `LoginModal`       | 局部登录弹窗（表单页/内嵌场景）                                               |
| `FavoriteButton`   | 收藏按钮，带 loading 和红心动画                                               |
| `EditTitleModal`   | 编辑标题弹窗，支持字数限制和回车提交                                          |

---

## Plugin/ - 浏览器插件组件

| 组件                          | 说明                                                              |
| ----------------------------- | ----------------------------------------------------------------- |
| `PluginModal`                 | 插件状态主弹框（未安装→下载引导/未授权→授权引导/已就绪→Tab 布局） |
| `PluginUpdatePopover`         | 插件更新提示气泡（供 `PluginReady`、侧边栏状态等 hover 复用）     |
| `PublishDetailModal`          | 发布任务详情弹框                                                  |
| `PluginPublishingFloatButton` | 插件发布中的全局悬浮入口，可打开发布详情并在完成后通知用户        |

子组件：`PluginNotInstalled`、`PluginNoPermission`、`PluginReady`（含 AccountsTab、PublishListTab）

---

## Home/ - 首页组件

| 组件             | 说明                                                                                                                  |
| ---------------- | --------------------------------------------------------------------------------------------------------------------- |
| `AgentGenerator` | AI 内容生成（SSE 流式对话、多媒体上传、多平台发布）。详见 [AgentGenerator/README.md](./Home/AgentGenerator/README.md) |
| `PromptGallery`  | 提示词画廊（瀑布流、筛选、搜索）                                                                                      |
| `HomeChat`       | 首页聊天输入，提交后跳转对话详情页                                                                                    |
| `TaskPreview`    | 最近任务卡片列表                                                                                                      |
| `Footer`         | 首页底部（公司链接、版权、社交媒体）                                                                                  |

---

## Chat/ - 聊天组件

| 组件          | 说明                              |
| ------------- | --------------------------------- |
| `ChatInput`   | 聊天输入框，支持文本和媒体上传    |
| `ChatMessage` | 消息气泡（user/assistant）        |
| `MediaUpload` | 媒体上传预览，支持进度显示        |
| `TaskCard`    | 任务卡片（含 `TaskCardSkeleton`） |

---

## 独立组件

| 组件                    | 说明                                             |
| ----------------------- | ------------------------------------------------ |
| `AvatarPlat`            | 带平台标识的头像                                 |
| `AvatarCropModal`       | 头像裁剪弹窗（基于 cropperjs，输出 400x400 PNG） |
| `ScrollButtonContainer` | 左右滚动按钮容器                                 |
| `ChooseAccountModule`   | 社交账号选择模块                                 |
| `GetCode`               | 获取验证码组件                                   |
| `UserLogsModal`         | 用户 AI 使用日志弹窗（分页）                     |
| `VideoHistoryModal`     | 视频生成历史弹窗（分页、播放、下载）             |

### 关键组件说明

**PublishDialog** - 内容发布对话框（复杂）

- PC 端入口：`PublishDialog/index.tsx`（完整功能）
- 移动端入口：`PublishDialog/compoents/mobile/MobilePublishContent.tsx`（精简版）
- **修改时必须检查两端是否都需要更新！**
- Twitter 发布参数位于 `PublishDialog/compoents/PlatParamsSetting/plats/TwitterParams/`，按基础设置、投票和媒体增强拆分。
- 详见 [PublishDialog/README.md](./PublishDialog/README.md)

**twitter** - Twitter 浏览与互动 UI

- `TwitterAnalyticsDialog` 是账号/频道入口打开的 Twitter 控制台，覆盖 OpenAPI2 的 `users/me/*`、用户查询、列表、隐私和推文查询能力。
- `TweetDetailDialog` 负责推文详情、对话、引用、转推、点赞用户和互动操作。

**ChannelManager** - 频道管理弹窗

- 支持受控/非受控模式，非受控时通过 `useChannelManagerStore` 的 `setOpen(true)` 控制

**NotificationPanel** - 通知面板

- 虚拟列表 + 无限滚动，支持乐观更新
- 状态管理：`useNotificationStore`（`src/store/notification.ts`）
- 含 `NotificationControlModal` 通知邮件推送设置

---

## 新增组件规范

1. 开发前先查阅本文档，确认无类似组件
2. 新增后**必须更新本文档**
3. 命名 **PascalCase**，使用独立文件夹（`index.tsx` + `*.module.scss`）
4. 新组件使用 **shadcn/ui**，禁止使用 antd
