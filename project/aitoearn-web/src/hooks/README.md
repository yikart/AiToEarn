# Hooks 文档

本目录包含项目级通用 React Hooks。只有被多个页面、布局、全局组件或跨业务域场景真实复用的 Hook 才能放入 `src/hooks`。

## 文件列表

| 文件                           | 描述                                       |
| ------------------------------ | ------------------------------------------ |
| `useDocumentTitle.ts`          | 动态更新浏览器页面标题 Hook                |
| `useDouyinPublishSession.ts`   | 抖音 H5 发布会话轮询与 IndexedDB 恢复 Hook |
| `useDraftGenerationPricing.ts` | AI 草稿生成定价缓存 Hook                   |
| `useGeolocation.ts`            | 浏览器地理位置 Hook                        |
| `useIsMobile.ts`               | 移动端断点判断 Hook                        |
| `useKeepTimeCountdown.ts`      | 倒计时 Hook                                |
| `useMediaUpload.ts`            | 媒体文件上传 Hook，支持进度显示、中断上传  |
| `usePlatformMetadata.ts`       | 平台元数据读取、场景过滤与名称解析 Hook    |
| `useSystem.ts`                 | 系统相关 Hook                              |
| `useVideoThumbnail.ts`         | 视频缩略图生成 Hook                        |

## 常用导入

```ts
import { useDocumentTitle } from '@/hooks'
import { useMediaUpload } from '@/hooks'
import { usePlatformInfo } from '@/hooks/usePlatformMetadata'
```

## useDocumentTitle - 动态页面标题 Hook

在客户端组件中动态更新浏览器页面标题（`document.title`）。标题格式由 `src/utils/title.ts` 统一处理。

```tsx
import { useDocumentTitle } from '@/hooks'

function ChatPage() {
  useDocumentTitle('New chat')
  return <div>...</div>
}
```

## useMediaUpload - 媒体上传 Hook

封装媒体文件上传逻辑，支持进度显示、中断上传、移除媒体。

```tsx
import { useMediaUpload } from '@/hooks'
import { toast } from '@/utils/ui/toast'

function MyComponent() {
  const { medias, isUploading, handleMediasChange, handleMediaRemove, clearMedias } =
    useMediaUpload({
      onError: (error) => toast.error('上传失败: ' + error.message),
    })

  return <div>{isUploading ? 'Uploading...' : medias.length}</div>
}
```

## 新增 Hook 规范

1. 先检查本文档、`src/hooks/index.ts` 和调用方局部 `hooks/`，确认没有类似实现。
2. 确认该 Hook 是项目级通用 Hook；单页面或单组件使用的 Hook 必须下沉到调用方局部目录。
3. 新增、迁移、删除 `src/hooks` 下任意文件时，同步更新本文档和 `src/hooks/index.ts`。
4. 完成后运行 `npx tsc --noEmit`。
