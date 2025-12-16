# Hooks 文档

本目录包含项目通用的自定义 React Hooks。

## 文件列表

| 文件 | 描述 |
|------|------|
| `useMediaUpload.ts` | 媒体文件上传 Hook，支持进度显示、中断上传 |
| `useNotification.ts` | 通知相关 Hook |
| `useSystem.ts` | 系统相关 Hook |

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
  const {
    medias,
    isUploading,
    handleMediasChange,
    handleMediaRemove,
    clearMedias,
  } = useMediaUpload({
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

- **全路径 URL**：上传完成后自动返回完整的 S3 URL（如 `https://aitoearn.s3.ap-southeast-1.amazonaws.com/userId/hash/filename.jpg`）
- **进度显示**：支持实时上传进度
- **中断上传**：支持取消正在进行的上传
- **多文件上传**：支持同时上传多个文件

### 注意事项

- 上传完成后 `media.url` 为完整的 S3 URL（`presignedData.url + presignedData.fields.key`）
- 上传过程中 `media.progress` 为 0-100 的数字，上传完成后为 `undefined`
- 上传失败会触发 `onError` 回调

---

## 新增 Hook 规范

在添加新的 Hook 前，请：

1. 检查本文档确认是否已存在类似功能
2. 确认是否属于通用 Hook（非业务逻辑）
3. 添加完整的 JSDoc 注释
4. 更新本文档
5. 在 `index.ts` 中导出新 Hook

