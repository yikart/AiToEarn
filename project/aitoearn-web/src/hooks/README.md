# Hooks 文档

本目录包含项目通用的自定义 React Hooks。

## 文件列表

| 文件                           | 描述                                      |
| ------------------------------ | ----------------------------------------- |
| `useDocumentTitle.ts`          | 动态更新浏览器页面标题 Hook               |
| `useDraftGenerationPricing.ts` | AI 草稿生成定价数据 Hook                  |
| `useDouyinPublishSession.ts`   | 抖音 H5 发布轮询与恢复 Hook               |
| `useGeolocation.ts`            | 浏览器定位 Hook，暴露权限/错误状态        |
| `useMediaUpload.ts`            | 媒体文件上传 Hook，支持进度显示、中断上传 |
| `useNotification.ts`           | 通知相关 Hook                             |
| `useSystem.ts`                 | 系统相关 Hook                             |

---

## useDocumentTitle - 动态页面标题 Hook

在客户端组件中动态更新浏览器页面标题（`document.title`）。

### 导入方式

```typescript
import { useDocumentTitle } from '@/hooks'
// 或
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
```

### API

```typescript
function useDocumentTitle(title: string | undefined | null, defaultTitle?: string): void
```

| 参数           | 类型                          | 描述                                |
| -------------- | ----------------------------- | ----------------------------------- |
| `title`        | `string \| undefined \| null` | 页面标题（为空时使用 defaultTitle） |
| `defaultTitle` | `string`                      | 默认标题（title 为空时使用）        |

### 使用示例

```tsx
import { useDocumentTitle } from '@/hooks'

function ChatPage() {
  const { t } = useTransClient('chat')
  const [task, setTask] = useState<Task | null>(null)

  // 动态更新页面标题
  useDocumentTitle(task?.title, t('task.newChat'))

  return <div>...</div>
}
```

### 特性

- **自动格式化**：标题格式为 `{title} —— AiToEarn`
- **默认值支持**：当 title 为空时使用 defaultTitle
- **响应式更新**：title 变化时自动更新页面标题

---

## useDraftGenerationPricing - AI 草稿生成定价 Hook

复用 `ai/draft-generation/pricing` 接口，提供模块级缓存和防重复请求，适用于草稿箱等入口共享模型定价数据。

### 导入方式

```typescript
import { useDraftGenerationPricing } from '@/hooks'
// 或
import { useDraftGenerationPricing } from '@/hooks/useDraftGenerationPricing'
```

### 返回值

```typescript
{
  pricingData: DraftGenerationPricingVo | null
  isLoading: boolean
  error: boolean
}
```

### 使用示例

```tsx
const { pricingData, isLoading, error } = useDraftGenerationPricing()

if (isLoading) {
  return <div>loading...</div>
}

const videoModels = pricingData?.videoModels ?? []
const imageModels = pricingData?.imageModels ?? []
```

### 特性

- **模块级缓存**：同一会话内多组件共享已加载数据
- **防重复请求**：并发场景只发起一次请求
- **统一数据源**：避免不同页面对模型定价各自维护副本

---

## useMediaUpload - 媒体上传 Hook

封装媒体文件上传逻辑，支持进度显示、中断上传、移除媒体。

### 导入方式

```typescript
import { useMediaUpload } from '@/hooks'
// 或
import { useMediaUpload } from '@/hooks/useMediaUpload'
```

### API

```typescript
interface IUseMediaUploadOptions {
  /** 上传失败时的回调 */
  onError?: (error: Error) => void
  /** 公开上传 ID，传入后使用免鉴权上传接口 */
  publicUploadId?: string
}

interface IUseMediaUploadReturn {
  /** 已上传的媒体列表 */
  medias: IUploadedMedia[]
  /** 设置媒体列表 */
  setMedias: React.Dispatch<React.SetStateAction<IUploadedMedia[]>>
  /** 是否正在上传 */
  isUploading: boolean
  /** 处理文件变更（上传） */
  handleMediasChange: (files: FileList) => Promise<void>
  /** 移除媒体 */
  handleMediaRemove: (index: number) => void
  /** 取消上传 */
  cancelUpload: () => void
  /** 清空所有媒体 */
  clearMedias: () => void
}
```

### 使用示例

```tsx
import { useMediaUpload } from '@/hooks'
import { toast } from '@/lib/toast'

function MyComponent() {
  const { medias, isUploading, handleMediasChange, handleMediaRemove, clearMedias } =
    useMediaUpload({
      onError: (error) => toast.error('上传失败: ' + error.message),
    })

  const handleSubmit = async () => {
    // 提交逻辑...
    clearMedias() // 提交后清空
  }

  return (
    <div>
      {/* 媒体预览 */}
      {medias.map((media, index) => (
        <div key={index}>
          <img src={media.url} alt="" />
          <button onClick={() => handleMediaRemove(index)}>删除</button>
        </div>
      ))}

      {/* 上传按钮 */}
      <input
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={(e) => e.target.files && handleMediasChange(e.target.files)}
        disabled={isUploading}
      />
    </div>
  )
}
```

### 特性

- **全路径 URL**：上传完成后自动返回完整的 S3 URL（如 `https://aitoearn.ap-southeast-1.amazonaws.com/userId/hash/filename.jpg`）
- **公开上传**：传入 `publicUploadId` 后使用免鉴权上传签名与确认接口
- **进度显示**：支持实时上传进度
- **中断上传**：支持取消正在进行的上传
- **多文件上传**：支持同时上传多个文件

### 注意事项

- 上传完成后 `media.url` 为完整的 S3 URL（`presignedData.url + presignedData.fields.key`）
- 上传过程中 `media.progress` 为 0-100 的数字，上传完成后为 `undefined`
- 上传失败会触发 `onError` 回调

---

## useGeolocation - 浏览器定位 Hook

封装浏览器 Geolocation API，适用于需要显式请求定位权限、根据授权状态展示 UI、或按需获取当前位置的场景。

### 导入方式

```typescript
import { useGeolocation } from '@/hooks'
// 或
import { useGeolocation } from '@/hooks/useGeolocation'
```

### 返回值

```typescript
{
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  error: string | null
  errorCode: 'permission_denied' | 'position_unavailable' | 'timeout' | 'unsupported' | 'unknown' | null
  loading: boolean
  status: 'idle' | 'loading' | 'granted' | 'denied' | 'error' | 'unsupported'
  refresh: () => void
  refreshAsync: () => Promise<GeolocationState>
}
```

### 使用示例

```tsx
const { latitude, longitude, status, errorCode, loading, refresh } = useGeolocation({
  enableOnMount: false,
})

const hasLocation = latitude !== null && longitude !== null

return (
  <div>
    {!hasLocation && (
      <button type="button" onClick={refresh} disabled={loading}>
        请求位置权限
      </button>
    )}
    <span>{status}</span>
    <span>{errorCode}</span>
  </div>
)
```

### 特性

- **按需触发**：默认不自动请求，适合在用户点击按钮后再拉起浏览器权限弹窗
- **状态明确**：返回 `status` 和 `errorCode`，便于做两步授权 UI
- **兼容缓存**：支持 `maximumAge` 复用短时间内的位置结果
- **错误可区分**：可区分拒绝授权、超时、不可用和浏览器不支持

---

## 新增 Hook 规范

在添加新的 Hook 前，请：

1. 检查本文档确认是否已存在类似功能
2. 确认是否属于通用 Hook（非业务逻辑）
3. 添加完整的 JSDoc 注释
4. 更新本文档
5. 在 `index.ts` 中导出新 Hook

---

## useDouyinPublishSession - 抖音发布轮询 Hook

基于 `publishRecordId` 轮询抖音发布状态，并配合 IndexedDB 恢复 1 小时内未完成的发布会话。

### 导入方式

```typescript
import { useDouyinPublishSession } from '@/hooks/useDouyinPublishSession'
```

### 适用场景

- 抖音 H5 唤起发布
- 发布完成回调存在 1-2 分钟延迟
- 用户关闭页面后重新进入，需要恢复轮询
