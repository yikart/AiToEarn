# 快速开始 - 发布任务管理

## 🚀 5分钟上手

### 1. 安装依赖

```bash
pnpm install dayjs
```

### 2. 导入组件和 Hook

```tsx
import {
  usePluginStore,
  PublishListModal,
  PublishDetailModal,
  PlatformTaskStatus,
  type PublishTask,
} from '@/store/plugin'
```

### 3. 创建发布页面

```tsx
'use client'

import { useState } from 'react'
import { Button } from 'antd'
import {
  usePluginStore,
  PublishListModal,
  PublishDetailModal,
  PlatformTaskStatus,
  type PublishTask,
} from '@/store/plugin'

export default function PublishPage() {
  const [listVisible, setListVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedTask, setSelectedTask] = useState<PublishTask>()

  const { addPublishTask, updatePlatformTask } = usePluginStore()

  // 创建并发布任务
  const handlePublish = async () => {
    // 1. 创建任务
    const taskId = addPublishTask!({
      title: '我的视频',
      description: '发布到抖音和小红书',
      platformTasks: [
        {
          platform: 'douyin',
          params: {
            platform: 'douyin',
            type: 'video',
            title: '我的视频',
            desc: '视频描述',
            // video: videoFile,
            // cover: coverFile,
          },
          status: PlatformTaskStatus.PENDING,
          progress: null,
          result: null,
          startTime: null,
          endTime: null,
          error: null,
        },
        {
          platform: 'xhs',
          params: {
            platform: 'xhs',
            type: 'video',
            title: '我的视频',
            desc: '视频描述',
          },
          status: PlatformTaskStatus.PENDING,
          progress: null,
          result: null,
          startTime: null,
          endTime: null,
          error: null,
        },
      ],
    })

    // 2. 开始发布
    await publishToPlatforms(taskId)

    // 3. 发布完成后自动打开详情
    setSelectedTask(usePluginStore.getState().getPublishTask!(taskId))
    setDetailVisible(true)
  }

  // 发布到各个平台
  const publishToPlatforms = async (taskId: string) => {
    // 发布到抖音
    updatePlatformTask!(taskId, 'douyin', {
      status: PlatformTaskStatus.PUBLISHING,
      startTime: Date.now(),
    })

    // 模拟发布过程
    await simulatePublish(taskId, 'douyin')

    // 发布到小红书
    updatePlatformTask!(taskId, 'xhs', {
      status: PlatformTaskStatus.PUBLISHING,
      startTime: Date.now(),
    })

    await simulatePublish(taskId, 'xhs')
  }

  // 模拟发布过程
  const simulatePublish = async (taskId: string, platform: 'douyin' | 'xhs') => {
    // 上传进度
    for (let i = 0; i <= 100; i += 20) {
      await new Promise((resolve) => setTimeout(resolve, 500))
      updatePlatformTask!(taskId, platform, {
        progress: {
          stage: 'upload',
          progress: i,
          message: `上传中 ${i}%`,
          timestamp: Date.now(),
        },
      })
    }

    // 发布完成
    updatePlatformTask!(taskId, platform, {
      status: PlatformTaskStatus.COMPLETED,
      endTime: Date.now(),
      progress: {
        stage: 'complete',
        progress: 100,
        message: '发布成功',
        timestamp: Date.now(),
      },
      result: {
        success: true,
        workId: `${platform}_${Date.now()}`,
        shareLink: `https://${platform}.com/video/${Date.now()}`,
        publishTime: Date.now(),
      },
    })
  }

  // 查看详情
  const handleViewDetail = (task: PublishTask) => {
    setSelectedTask(task)
    setDetailVisible(true)
    setListVisible(false)
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>发布管理</h1>

      <div style={{ marginBottom: 20 }}>
        <Button type="primary" onClick={handlePublish}>
          开始发布
        </Button>{' '}
        <Button onClick={() => setListVisible(true)}>查看发布列表</Button>
      </div>

      {/* 发布列表弹框 */}
      <PublishListModal
        visible={listVisible}
        onClose={() => setListVisible(false)}
        onViewDetail={handleViewDetail}
      />

      {/* 发布详情弹框 */}
      <PublishDetailModal
        visible={detailVisible}
        onClose={() => {
          setDetailVisible(false)
          setSelectedTask(undefined)
        }}
        task={selectedTask}
      />
    </div>
  )
}
```

## 📦 核心概念

### 1. 发布任务 (PublishTask)

一次发布操作，可能包含多个平台。

```typescript
{
  id: 'task_123',
  title: '我的视频',
  platformTasks: [
    { platform: 'douyin', ... },
    { platform: 'xhs', ... },
  ],
  overallStatus: 'publishing',
  ...
}
```

### 2. 平台任务 (PlatformPublishTask)

单个平台的发布任务。

```typescript
{
  platform: 'douyin',
  status: 'publishing',
  progress: {
    stage: 'upload',
    progress: 45,
    message: '上传中...',
  },
  result: null,
  ...
}
```

### 3. 任务状态 (PlatformTaskStatus)

- `PENDING` - 待发布
- `PUBLISHING` - 发布中
- `COMPLETED` - 已完成
- `ERROR` - 失败

## 🔄 典型流程

```
1. 创建任务 (addPublishTask)
   ↓
2. 更新状态为 PUBLISHING (updatePlatformTask)
   ↓
3. 更新进度 (updatePlatformTask)
   ↓
4. 更新结果 (updatePlatformTask)
   ↓
5. 显示详情 (PublishDetailModal)
```

## 🎯 最佳实践

### 1. 错误处理

```tsx
try {
  await publishToPlatform(taskId, 'douyin')
} catch (error) {
  updatePlatformTask!(taskId, 'douyin', {
    status: PlatformTaskStatus.ERROR,
    error: error.message,
    endTime: Date.now(),
  })
}
```

### 2. 实时进度更新

```tsx
const publishWithProgress = async (taskId, platform) => {
  updatePlatformTask!(taskId, platform, {
    status: PlatformTaskStatus.PUBLISHING,
    startTime: Date.now(),
  })

  // 使用插件的 publish 方法，带进度回调
  await window.AIToEarnPlugin.publish(params, (progress) => {
    updatePlatformTask!(taskId, platform, {
      progress,
    })
  })
}
```

### 3. 批量发布

```tsx
const publishToMultiplePlatforms = async (taskId, platforms) => {
  // 并行发布
  await Promise.all(platforms.map((platform) => publishToPlatform(taskId, platform)))
}
```

## 🌍 国际化

组件自动支持国际化，只需确保项目已配置 `react-i18next`。

```tsx
import { useTranslation } from 'react-i18next'

const { t } = useTranslation()
t('plugin.publishList.title') // "发布列表"
```

## 📱 响应式设计

组件已针对移动端优化，自动适配不同屏幕尺寸。

## 🔧 配置任务列表

```tsx
const { updateTaskListConfig } = usePluginStore()

// 设置最大任务数
updateTaskListConfig!({
  maxTasks: 50, // 最多保存50个任务
  autoCleanCompleted: true, // 自动清理已完成任务
  cleanAfter: 7 * 24 * 60 * 60 * 1000, // 7天后清理
})
```

## 📚 更多文档

- [组件详细文档](./components/README.md)
- [完整示例](./components/example.tsx)
- [API 参考](./README.md)

## 💡 常见问题

### Q: 如何持久化任务列表？

A: 任务列表已通过 zustand persist 自动持久化到 localStorage。

### Q: 如何清空所有任务？

```tsx
const { clearPublishTasks } = usePluginStore()
clearPublishTasks!()
```

### Q: 如何删除单个任务？

```tsx
const { deletePublishTask } = usePluginStore()
deletePublishTask!('task_id')
```

## 🎉 完成！

现在你已经掌握了发布任务管理的基本用法，开始构建你的发布功能吧！
