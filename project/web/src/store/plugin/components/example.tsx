/**
 * 组件使用示例
 */

'use client'

import { Button } from 'antd'
import { useState } from 'react'
import { PlatformTaskStatus } from '../types/baseTypes'
import { usePluginStore } from '../store'
import type { PublishTask } from '../types/baseTypes'
import { PublishDetailModal } from './PublishDetailModal'
import { PublishListModal } from './PublishListModal'

/**
 * 完整使用示例
 */
export function PublishModalExample() {
  const [listVisible, setListVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedTask, setSelectedTask] = useState<PublishTask | undefined>()

  const { addPublishTask } = usePluginStore()

  // 模拟添加一个发布任务
  const handleAddTask = () => {
    if (!addPublishTask)
      return

    const taskId = addPublishTask({
      title: '测试发布任务',
      description: '这是一个测试的发布任务',
      platformTasks: [
        {
          platform: 'douyin',
          params: {
            platform: 'douyin',
            type: 'video',
            title: '测试视频',
            desc: '描述',
          },
          status: PlatformTaskStatus.PUBLISHING,
          progress: {
            stage: 'upload',
            progress: 45,
            message: '正在上传...',
            timestamp: Date.now(),
          },
          result: null,
          startTime: Date.now(),
          endTime: null,
          error: null,
        },
        {
          platform: 'xhs',
          params: {
            platform: 'xhs',
            type: 'video',
            title: '测试视频',
            desc: '描述',
          },
          status: PlatformTaskStatus.COMPLETED,
          progress: {
            stage: 'complete',
            progress: 100,
            message: '发布成功',
            timestamp: Date.now(),
          },
          result: {
            success: true,
            workId: '123456',
            shareLink: 'https://example.com/share/123456',
            publishTime: Date.now(),
          },
          startTime: Date.now() - 60000,
          endTime: Date.now(),
          error: null,
        },
      ],
    })

    console.log('添加的任务ID:', taskId)
  }

  // 查看详情
  const handleViewDetail = (task: PublishTask) => {
    setSelectedTask(task)
    setDetailVisible(true)
    setListVisible(false)
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>发布任务管理组件示例</h2>

      <div style={{ marginBottom: 20 }}>
        <Button type="primary" onClick={() => setListVisible(true)}>
          打开发布列表
        </Button>
        {' '}
        <Button onClick={handleAddTask}>
          添加测试任务
        </Button>
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

/**
 * 使用 taskId 的示例
 */
export function PublishDetailWithTaskIdExample() {
  const [detailVisible, setDetailVisible] = useState(false)
  const [taskId, setTaskId] = useState<string>()

  const { addPublishTask } = usePluginStore()

  const handleCreateAndView = () => {
    if (!addPublishTask)
      return

    const id = addPublishTask({
      title: '通过ID查看的任务',
      description: '演示通过taskId查看详情',
      platformTasks: [
        {
          platform: 'douyin',
          params: {
            platform: 'douyin',
            type: 'video',
            title: '测试',
            desc: '描述',
          },
          status: PlatformTaskStatus.COMPLETED,
          progress: {
            stage: 'complete',
            progress: 100,
            message: '完成',
            timestamp: Date.now(),
          },
          result: {
            success: true,
            workId: '789',
            shareLink: 'https://example.com/789',
            publishTime: Date.now(),
          },
          startTime: Date.now() - 30000,
          endTime: Date.now(),
          error: null,
        },
      ],
    })

    setTaskId(id)
    setDetailVisible(true)
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>通过TaskID查看详情示例</h2>

      <Button type="primary" onClick={handleCreateAndView}>
        创建并查看任务
      </Button>

      <PublishDetailModal
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        taskId={taskId}
      />
    </div>
  )
}

