# Components 组件库文档

本目录包含项目通用组件。开发前请先查阅本文档，避免重复开发。

## 目录结构

| 目录/文件 | 描述 |
|----------|------|
| `ui/` | shadcn/ui 基础组件 |
| `common/` | 通用功能组件 |
| `modals/` | 弹窗组件集合 |
| `AvatarPlat/` | 带平台标识的头像组件 |
| `Chat/` | 聊天组件 |
| `ChooseAccountModule/` | 账号选择模块 |
| `FacebookPagesModal/` | Facebook 页面选择弹窗 |
| `GetCode/` | 获取验证码组件 |
| `ImageEditorModal/` | 图片编辑弹窗 |
| `LoginModal/` | 登录弹窗 |
| `notification/` | 通知相关组件 |
| `PublishDialog/` | 发布对话框（复杂） |
| `ScrollButtonContainer/` | 滚动按钮容器 |
| `SignInCalendar/` | 签到日历组件 |
| `VideoPreviewModal.tsx` | 视频预览弹窗 |
| `WalletAccountSelect/` | 钱包账户选择器 |

---

## ui/ - shadcn/ui 基础组件

shadcn/ui 组件库，新增组件请使用 `npx shadcn@latest add <component>` 安装。

| 组件 | 说明 |
|------|------|
| `sonner.tsx` | Toast 通知组件（配合 `@/lib/toast` 使用） |

---

## common/ - 通用功能组件

### DownloadAppModal

App 下载提示弹窗，用于引导用户下载移动端 App。

```tsx
import DownloadAppModal from '@/components/common/DownloadAppModal'

<DownloadAppModal
  visible={boolean}
  onClose={() => void}
  platform="douyin"
  appName="抖音"
  downloadUrl="https://..."
  qrCodeUrl="https://..."  // 可选
  zIndex={3000}           // 可选
/>
```

### LanguageSwitcher

语言切换下拉菜单组件。

```tsx
import { LanguageSwitcher } from '@/components/common'
```

---

## modals/ - 弹窗组件集合

### VipContentModal

VIP 内容展示弹窗，显示会员特权信息。

### SubscriptionManagementModal

订阅管理弹窗，管理用户订阅状态。

### PointsDetailModal

积分明细弹窗，展示用户积分记录。

### PointsRechargeModal

积分充值弹窗。

---

## 独立组件

### AvatarPlat - 带平台标识的头像

显示用户头像并在右下角添加平台图标。

```tsx
import AvatarPlat from '@/components/AvatarPlat'

<AvatarPlat
  account={SocialAccount}  // 账号信息
  size="default"           // 'small' | 'default' | 'large'
  disabled={false}         // 禁用状态
/>
```

### VideoPreviewModal - 视频预览弹窗

简单的视频预览弹窗。

```tsx
import VideoPreviewModal from '@/components/VideoPreviewModal'

<VideoPreviewModal
  open={boolean}
  videoUrl="https://..."
  onCancel={() => void}
/>
```

### ImageEditorModal - 图片编辑弹窗

基于 Toast UI Image Editor 的图片编辑弹窗，支持裁剪、滤镜等操作。

```tsx
import ImageEditorModal from '@/components/ImageEditorModal'

<ImageEditorModal
  open={boolean}
  onCancel={() => void}
  imgFile={IImgFile}
  onOk={(editedImg: IImgFile) => void}
/>
```

### LoginModal - 登录弹窗

支持邮箱登录和 Google 登录的弹窗组件。

```tsx
import LoginModal from '@/components/LoginModal'

<LoginModal
  open={boolean}
  onCancel={() => void}
  onSuccess={() => void}  // 登录成功回调
/>
```

### GetCode - 获取验证码

带倒计时的获取验证码按钮。

```tsx
import GetCode from '@/components/GetCode/GetCode'

<GetCode
  onGetCode={(unlock) => {
    // 发送验证码
    // unlock() 可用于提前解锁按钮
  }}
  codeSendTime={60}  // 倒计时秒数，默认60
/>
```

### WalletAccountSelect - 钱包账户选择器

支持分页加载的钱包账户下拉选择器。

```tsx
import WalletAccountSelect from '@/components/WalletAccountSelect'

<WalletAccountSelect
  value={string}
  onChange={(val) => void}
  disabled={boolean}
/>
```

### SignInCalendar - 签到日历

用户签到日历组件。

### ScrollButtonContainer - 滚动按钮容器

为子元素添加左右滚动按钮的容器组件。

### NotificationPanel - 通知面板

通知列表弹窗，包含通知的增删改查、任务接受等功能。

```tsx
import NotificationPanel from '@/components/notification/NotificationPanel'

<NotificationPanel
  visible={boolean}
  onClose={() => void}
/>
```

### ChooseAccountModule - 账号选择模块

社交账号选择模块，支持平台筛选。

### FacebookPagesModal - Facebook 页面选择

Facebook 主页选择弹窗。

### PublishDialog - 发布对话框

复杂的内容发布对话框，包含多平台发布、素材上传、AI 生成等功能。

---

## 新增组件规范

1. **开发前先查阅本文档**，确认是否已存在类似组件
2. 新增组件后**必须更新本文档**
3. 组件命名使用 **PascalCase**
4. 复杂组件使用独立目录，包含：
   - `index.tsx` - 主组件
   - `*.module.scss` - 样式文件
   - `*.type.ts` - 类型定义（如需要）
5. 遵循项目迁移规范：**新组件使用 shadcn/ui**，避免使用 antd

