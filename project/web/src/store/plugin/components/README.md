# 插件组件使用文档

## 📦 组件列表

### 1. PublishListModal - 发布任务列表弹框

显示所有发布任务的列表，每个任务可能包含多个平台的发布。

**功能：**
- 展示发布任务列表
- 显示任务状态（待发布、发布中、已完成、失败）
- 显示包含的平台
- 点击查看详情

**使用示例：**

```tsx
import { useState } from 'react'
import { Button } from 'antd'
import { PublishListModal } from '@/store/plugin'

export function MyComponent() {
  const [visible, setVisible] = useState(false)
  const [detailTask, setDetailTask] = useState()
  
  const handleViewDetail = (task) => {
    setDetailTask(task)
    // 可以在这里打开详情弹框
  }
  
  return (
    <>
      <Button onClick={() => setVisible(true)}>
        查看发布列表
      </Button>
      
      <PublishListModal
        visible={visible}
        onClose={() => setVisible(false)}
        onViewDetail={handleViewDetail}
      />
    </>
  )
}
```

### 2. PublishDetailModal - 发布详情弹框

显示单次发布任务中多个平台的详细进度和结果。

**功能：**
- 显示任务基本信息
- 显示每个平台的发布进度
- 显示发布结果（作品ID、分享链接等）
- 显示错误信息
- 支持两种使用方式：传入 task 对象或 taskId

**使用方式一：传入 task 对象**

```tsx
import { useState } from 'react'
import { PublishDetailModal } from '@/store/plugin'
import type { PublishTask } from '@/store/plugin'

export function MyComponent() {
  const [visible, setVisible] = useState(false)
  const [task, setTask] = useState<PublishTask>()
  
  return (
    <PublishDetailModal
      visible={visible}
      onClose={() => setVisible(false)}
      task={task}
    />
  )
}
```

**使用方式二：传入 taskId**

```tsx
import { useState } from 'react'
import { PublishDetailModal } from '@/store/plugin'

export function MyComponent() {
  const [visible, setVisible] = useState(false)
  const [taskId, setTaskId] = useState<string>()
  
  return (
    <PublishDetailModal
      visible={visible}
      onClose={() => setVisible(false)}
      taskId={taskId}
    />
  )
}
```

## 🔧 完整使用流程

### 1. 创建发布任务

```tsx
import { usePluginStore } from '@/store/plugin'
import { PlatformTaskStatus } from '@/store/plugin'

export function PublishPage() {
  const { addPublishTask } = usePluginStore()
  
  const handlePublish = () => {
    // 创建发布任务
    const taskId = addPublishTask({
      title: '我的视频',
      description: '发布到多个平台',
      platformTasks: [
        {
          platform: 'douyin',
          params: {
            platform: 'douyin',
            type: 'video',
            title: '我的视频',
            desc: '视频描述',
            video: videoFile,
            cover: coverFile,
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
            video: videoFile,
            cover: coverFile,
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
    
    console.log('任务ID:', taskId)
  }
  
  return <button onClick={handlePublish}>发布</button>
}
```

### 2. 更新发布进度

```tsx
import { usePluginStore } from '@/store/plugin'
import { PlatformTaskStatus } from '@/store/plugin'

export function PublishService() {
  const { updatePlatformTask } = usePluginStore()
  
  const startPublish = async (taskId: string) => {
    // 开始发布到抖音
    updatePlatformTask(taskId, 'douyin', {
      status: PlatformTaskStatus.PUBLISHING,
      startTime: Date.now(),
      progress: {
        stage: 'upload',
        progress: 0,
        message: '开始上传...',
        timestamp: Date.now(),
      },
    })
    
    // 模拟上传进度
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      updatePlatformTask(taskId, 'douyin', {
        progress: {
          stage: 'upload',
          progress: i,
          message: `上传中 ${i}%`,
          timestamp: Date.now(),
        },
      })
    }
    
    // 发布完成
    updatePlatformTask(taskId, 'douyin', {
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
        workId: '123456',
        shareLink: 'https://douyin.com/video/123456',
        publishTime: Date.now(),
      },
    })
  }
  
  return null
}
```

### 3. 集成发布列表和详情

```tsx
import { useState } from 'react'
import { Button } from 'antd'
import { 
  PublishListModal, 
  PublishDetailModal,
  type PublishTask 
} from '@/store/plugin'

export function PublishManagePage() {
  const [listVisible, setListVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedTask, setSelectedTask] = useState<PublishTask>()
  
  const handleViewDetail = (task: PublishTask) => {
    setSelectedTask(task)
    setDetailVisible(true)
    setListVisible(false) // 关闭列表，打开详情
  }
  
  return (
    <div>
      <Button type="primary" onClick={() => setListVisible(true)}>
        查看发布列表
      </Button>
      
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

### 4. 发布完成后自动弹出详情

```tsx
import { useState, useEffect } from 'react'
import { PublishDetailModal } from '@/store/plugin'
import { usePluginStore } from '@/store/plugin'
import { PlatformTaskStatus } from '@/store/plugin'

export function PublishWithAutoDetail() {
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentTaskId, setCurrentTaskId] = useState<string>()
  
  const { publishTasks, addPublishTask, updatePlatformTask } = usePluginStore()
  
  // 监听任务完成
  useEffect(() => {
    if (!publishTasks || !currentTaskId) return
    
    const task = publishTasks.find(t => t.id === currentTaskId)
    if (!task) return
    
    // 检查是否所有平台都完成了
    const allCompleted = task.platformTasks.every(
      pt => pt.status === PlatformTaskStatus.COMPLETED || 
            pt.status === PlatformTaskStatus.ERROR
    )
    
    if (allCompleted) {
      // 自动弹出详情
      setDetailVisible(true)
    }
  }, [publishTasks, currentTaskId])
  
  const handlePublish = async () => {
    // 创建任务
    const taskId = addPublishTask({
      title: '测试发布',
      platformTasks: [
        // ... 平台任务
      ],
    })
    
    setCurrentTaskId(taskId)
    
    // 开始发布...
    // updatePlatformTask(...)
  }
  
  return (
    <>
      <button onClick={handlePublish}>开始发布</button>
      
      <PublishDetailModal
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        taskId={currentTaskId}
      />
    </>
  )
}
```

## 🌍 国际化支持

组件内置国际化支持，会自动根据项目的语言设置显示对应文本。

**支持的语言：**
- 中文 (`zh-CN`)
- 英文 (`en`)

**国际化文件位置：**
- `src/store/plugin/locales/zh-CN.json`
- `src/store/plugin/locales/en.json`

## 📝 类型定义

```typescript
// 发布任务
interface PublishTask {
  id: string
  title: string
  description?: string
  platformTasks: PlatformPublishTask[]
  createdAt: number
  updatedAt: number
  overallStatus: PlatformTaskStatus
}

// 平台任务
interface PlatformPublishTask {
  platform: PlatformType
  params: PublishParams
  status: PlatformTaskStatus
  progress: ProgressEvent | null
  result: PublishResult | null
  startTime: number | null
  endTime: number | null
  error: string | null
}

// 任务状态
enum PlatformTaskStatus {
  PENDING = 'pending',
  PUBLISHING = 'publishing',
  COMPLETED = 'completed',
  ERROR = 'error',
}
```

## 🎨 样式定制

组件使用 SCSS Module，可以通过 CSS 变量进行样式定制：

```scss
// 在你的全局样式中定义这些变量
:root {
  --text-primary: #333;
  --text-secondary: #666;
  --text-tertiary: #999;
  --bg-primary: #fff;
  --bg-secondary: #f9f9f9;
  --border-color: #e8e8e8;
  --primary-color: #667eea;
  --error-color: #f44336;
  --error-bg: #ffebee;
  --error-color-dark: #c62828;
}
```

## 📖 更多示例

查看 `src/store/plugin/components/example.tsx` 获取更多完整示例。

## 💡 注意事项

1. **任务持久化**: 发布任务会通过 zustand persist 中间件自动持久化到 localStorage
2. **最大任务数**: 默认最多保存 100 个任务，可通过 `updateTaskListConfig` 修改
3. **自动清理**: 可配置自动清理已完成任务的时间
4. **实时更新**: 组件会自动响应 store 的变化，无需手动刷新

## 🔗 相关链接

- [插件 Store 文档](../README.md)
- [类型定义](../types/)
- [完整示例](./example.tsx)

