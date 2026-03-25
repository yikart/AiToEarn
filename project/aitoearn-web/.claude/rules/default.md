# 项目规则（aitoearn-website 专有）

## 禁止事项

- 使用硬编码货币符号/代码（如 `$`、`USD`、`¥`、`CNY`）→ 用 `appCurrencySymbol` / `appCurrency`（`/src/utils/currency.ts`）
- 使用 `<Input type="number">` 或 `<input type="number">` → 用 `NumberInput`（`/src/components/ui/number-input.tsx`），自动处理清空、小数、格式化

## 开发前必查

1. `src/utils/README.md` - 工具函数（格式化、OSS、货币、请求、下载等）
2. `src/lib/README.md` - 工具方法（toast、confirm、cn、VIP、i18n 等）
3. `src/hooks/` - 自定义 Hooks（useIsMobile、useMediaUpload、useKeepTimeCountdown、useVideoThumbnail 等）
4. `src/components/README.md` - 公共组件（MediaPreview、Modal、LoginModal 等）
5. `src/store/README.md` - 全局状态管理（useUserStore、useAccountStore 等）
6. `src/app/config/` - 业务常量与枚举（PlatType、PubType、AccountStatus 等）
7. 新增可复用代码时**必须同步更新对应 README**

## 项目特有工具

- OSS 资源用 `getOssUrl`（`/src/utils/oss.ts`）
- Canvas 跨域用 `getOssProxyPath`（`/src/utils/oss.ts`）
- 货币显示用 `appCurrencySymbol` + `appCurrency`（`/src/utils/currency.ts`），自动适配国内外环境
- SEO 元数据用 `getMetadata`（`/src/utils/general.ts`），不要自己拼接 title
- 持久化 store 用 `createPersistStore`（`/src/lib/store.ts`）
- 数字输入用 `NumberInput`（`/src/components/ui/number-input.tsx`），禁止使用 `<Input type="number">`
- 语言配置：`src/lib/i18n/languageConfig.ts`
- 国际化目录：`/src/app/i18n`

## 工具函数规范

- 可复用的全局方法应写到 `src/utils/` 中，并同步更新 `src/utils/README.md`
- 添加前先检查 `src/utils/README.md` 和 `src/lib/README.md`，避免重复实现

## 目录规范

```
页面私有组件 → pages/xxx/components/
公共组件 → src/components/
跨组件状态 → xxxStore/
API 方法 → src/api/
API 类型 → src/api/types/
```

- API 方法放在 `src/api/` 下，类型定义放在 `src/api/types/` 下
- 子模块保持目录结构一致，如 `src/api/advertiser/xxx.ts` 对应 `src/api/types/advertiser/xxx.ts`

## 页面级状态管理

当页面内多个组件需要共享状态（如素材数据、发布参数等）时，**必须使用局部 zustand store** 管理，禁止通过 props 逐层传递大量字段。

- 在页面目录下创建 `xxxStore.ts`（如 `promoStore.ts`），使用 `zustand` + `combine` 创建局部 store
- 页面顶层组件负责初始化 store 数据，子组件直接从 store 读取
- 取值时遵循 `useShallow` 规范（见 Store 规范章节）
- 仅页面级别共享的状态用局部 store，全局状态仍放 `src/store/`

## 配置文件（`src/app/config/`）

全局业务常量和类型定义，开发前务必查阅，避免硬编码或重复定义。

### `platConfig.ts` — 平台配置（核心）

**`PlatType` 枚举**：所有支持的社交平台标识

| 值         | 平台       | 值          | 平台      |
| ---------- | ---------- | ----------- | --------- |
| `tiktok`   | TikTok     | `youtube`   | YouTube   |
| `douyin`   | 抖音       | `twitter`   | Twitter/X |
| `xhs`      | 小红书     | `facebook`  | Facebook  |
| `wxSph`    | 微信视频号 | `instagram` | Instagram |
| `KWAI`     | 快手       | `threads`   | Threads   |
| `bilibili` | B站        | `pinterest` | Pinterest |
| `wxGzh`    | 微信公众号 | `linkedin`  | LinkedIn  |

**`IAccountPlatInfo` 接口**：平台信息结构

| 字段                    | 类型           | 说明                                                       |
| ----------------------- | -------------- | ---------------------------------------------------------- |
| `themeColor`            | `string`       | 平台主题色                                                 |
| `icon`                  | `string`       | 平台图标                                                   |
| `name`                  | `string`       | 平台名称（通过 `directTrans` 自动国际化）                  |
| `url`                   | `string`       | 平台 URL                                                   |
| `pubTypes`              | `Set<PubType>` | 支持的发布类型                                             |
| `commonPubParamsConfig` | `object`       | 发布参数限制（`titleMax`/`topicMax`/`desMax`/`imagesMax`） |
| `pcNoThis?`             | `boolean`      | PC 端是否隐藏                                              |
| `jiancha?`              | `boolean`      | 是否需要内容安全检测                                       |
| `tips?`                 | `object`       | 平台提示（`account`/`publish`）                            |

**`AccountPlatInfoMap`**：`Map<PlatType, IAccountPlatInfo>` — 平台信息映射表，获取平台信息时使用
**`AccountPlatInfoArr`**：平台信息数组形式，用于遍历

### `publishConfig.ts` — 发布类型

**`PubType` 枚举**：

| 值         | 说明   |
| ---------- | ------ |
| `video`    | 视频   |
| `article`  | 图文   |
| `article2` | 纯文字 |

### `accountConfig.ts` — 账号状态

**`AccountStatus` 枚举**：

| 值            | 说明   |
| ------------- | ------ |
| `1` (USABLE)  | 未失效 |
| `0` (DISABLE) | 失效   |

**`XhsAccountAbnormal` 枚举**：

| 值             | 说明                     |
| -------------- | ------------------------ |
| `1` (Normal)   | 账号正常                 |
| `2` (Abnormal) | 账号异常（无法发布视频） |

### `appDownloadConfig.ts` — 应用下载配置

- **`MAIN_APP_DOWNLOAD_URL`**：主应用默认下载地址
- **`getMainAppDownloadUrl(lng?)`**：异步获取下载地址（优先 API，回退默认）
- **`getMainAppDownloadUrlSync(lng?)`**：同步版本（返回缓存或默认地址）
- **`APP_DOWNLOAD_CONFIGS`**：各平台下载配置（`Record<string, AppDownloadConfig>`）
- **`getAppDownloadConfig(platformKey)`**：获取指定平台下载配置
- **`fetchLatestDownloadUrl()`**：从 API 获取最新 Android 下载地址（5 分钟缓存）

### `promotionConfig.ts` — 推广配置

当前为空文件，预留用于推广相关配置。

---

## 疑难杂症（项目特有）

### useTransClient 动态加载 namespace 导致闪烁

**原因**：`settings.ts` 只预加载 `common` 和 `route`，其他 namespace 首次使用时异步 import → 首帧 `t('key')` 返回 key 本身（如 `"setup.title"`）→ 翻译加载后重渲染为真实文本，产生闪烁。

**场景一：弹窗/条件渲染组件** — 拆成两层组件

```tsx
// 外层：控制渲染时机（不用 hooks）
export function Modal({ open, onOpenChange }) {
  if (!open) return null
  return <ModalContent onOpenChange={onOpenChange} />
}

// 内层：使用翻译
const ModalContent = memo(({ onOpenChange }) => {
  const { t } = useTransClient('material')
  return (
    <Dialog open onOpenChange={onOpenChange}>
      ...
    </Dialog>
  )
})
```

**场景二：有 loading 状态的组件（如依赖 API 数据）** — 外层预加载 namespace + 双重 ready 守卫

当组件本身已有加载态（skeleton / spinner），**必须在外层同时等待 namespace ready**，否则会出现 `skeleton → key文本闪现 → 翻译文本` 的二次闪烁。

```tsx
const MyComponent = memo(({ id }: Props) => {
  const { initialized, data } = useMyData(id)
  // 外层预加载 namespace，子组件再调用时命中缓存，首帧即有翻译
  const { ready: i18nReady } = useTransClient('myNamespace')

  // 双重守卫：数据 + 翻译都就绪前持续显示骨架屏
  if (!initialized || !i18nReady) {
    return <LoadingSkeleton />
  }

  // 此时子组件内 useTransClient('myNamespace') 命中缓存，ready 立即为 true
  return data ? <DataView data={data} /> : <EmptyState />
})
```

**关键原则**：任何有 loading/skeleton 的组件，如果子组件使用了非预加载 namespace，都要在外层用 `useTransClient` 的 `ready` 状态守卫，确保只有一次 skeleton → 内容的干净过渡。

### 新增路由需要加 Middleware 白名单

**场景**：新增不需要语言前缀的路由（如 sitemap、API 代理等）

**原因**：`src/middleware.ts` 中的路由守卫会将不在白名单中的路径自动重定向加语言前缀（如 `/task-sitemap/1` → `/en/task-sitemap/1`），导致无法正常访问

**解决**：在 `src/middleware.ts` 的白名单数组中添加对应路径，确保新路由不被重定向

### 页面主滚动容器

页面主滚动元素为 `id="main-content"`（定义在 `src/app/layout/MainContent/index.tsx`），回到顶部等滚动操作应基于此元素，而非 `window`。
