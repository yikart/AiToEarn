/**
 * 高级使用示例
 */

'use client'

import type { PlatformType } from '../index'
import { Button, Input, message, Progress, Select } from 'antd'
import { useState } from 'react'
import {
  formatFileSize,
  formatProgress,
  getPublishStageText,
  isValidImageFile,
  isValidVideoFile,

  usePlugin,
  usePluginPublish,
  usePluginWorkflow,
  validateFileSize,
  withRetry,
} from '../index'

const { TextArea } = Input
const { Option } = Select

/**
 * 示例 1: 一键登录并发布
 */
export function OneClickPublishExample() {
  const { isConnected, loginAndPublishVideo } = usePluginWorkflow()
  const [platform, setPlatform] = useState<PlatformType>('douyin')

  const handleOneClickPublish = async () => {
    const videoInput = document.getElementById('videoOne') as HTMLInputElement
    const coverInput = document.getElementById('coverOne') as HTMLInputElement

    const videoFile = videoInput?.files?.[0]
    const coverFile = coverInput?.files?.[0]

    if (!videoFile || !coverFile) {
      message.warning('请选择视频和封面')
      return
    }

    message.loading('正在登录...', 0)

    const result = await loginAndPublishVideo(
      platform,
      videoFile,
      coverFile,
      {
        title: '一键发布测试',
        desc: '测试描述',
        topics: ['测试'],
      },
      (progress) => {
        message.destroy()
        message.loading(
          `${getPublishStageText(progress.stage)}: ${formatProgress(progress.progress)}`,
          0,
        )
      },
    )

    message.destroy()

    if (result.success) {
      message.success('发布成功！')
    }
    else {
      message.error(result.error || '操作失败')
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h3>一键登录并发布</h3>
      <p>
        插件状态:
        {isConnected ? '✓ 已连接' : '✗ 未连接'}
      </p>

      <div style={{ marginBottom: 10 }}>
        <Select
          value={platform}
          onChange={setPlatform}
          style={{ width: 200, marginBottom: 10 }}
        >
          <Option value="douyin">抖音</Option>
          <Option value="xhs">小红书</Option>
        </Select>
      </div>

      <div style={{ marginBottom: 10 }}>
        <input type="file" id="videoOne" accept="video/*" />
      </div>
      <div style={{ marginBottom: 10 }}>
        <input type="file" id="coverOne" accept="image/*" />
      </div>

      <Button
        type="primary"
        size="large"
        onClick={handleOneClickPublish}
        disabled={!isConnected}
      >
        一键登录并发布
      </Button>
    </div>
  )
}

/**
 * 示例 2: 完整的发布表单
 */
export function CompletePublishForm() {
  const { isConnected } = usePlugin()
  const { publishVideo, isPublishing, publishProgress, resetPublishState }
    = usePluginPublish()

  const [formData, setFormData] = useState({
    platform: 'douyin' as PlatformType,
    title: '',
    desc: '',
    topics: '',
  })

  const handlePublish = async () => {
    const videoInput = document.getElementById('videoFull') as HTMLInputElement
    const coverInput = document.getElementById('coverFull') as HTMLInputElement

    const videoFile = videoInput?.files?.[0]
    const coverFile = coverInput?.files?.[0]

    if (!videoFile || !coverFile || !formData.title) {
      message.warning('请填写完整信息')
      return
    }

    // 文件验证
    if (!isValidVideoFile(videoFile)) {
      message.error('请选择有效的视频文件')
      return
    }

    if (!validateFileSize(videoFile, 500 * 1024 * 1024)) {
      message.error('视频文件不能超过 500MB')
      return
    }

    if (!isValidImageFile(coverFile)) {
      message.error('请选择有效的图片文件')
      return
    }

    const topics = formData.topics
      ? formData.topics.split(',').map(t => t.trim()).filter(t => t)
      : []

    const result = await publishVideo(
      formData.platform,
      videoFile,
      coverFile,
      {
        title: formData.title,
        desc: formData.desc,
        topics,
        visibility: 'public',
      },
    )

    if (result.success) {
      message.success('发布成功！')
      // 重置表单
      setFormData({
        platform: 'douyin',
        title: '',
        desc: '',
        topics: '',
      })
      videoInput.value = ''
      coverInput.value = ''
    }
    else {
      message.error(result.error)
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 600 }}>
      <h2>发布视频</h2>

      {/* 插件状态 */}
      <div style={{ marginBottom: 20, padding: 10, background: '#f5f5f5' }}>
        <strong>插件状态: </strong>
        {isConnected ? (
          <span style={{ color: 'green' }}>✓ 已连接</span>
        ) : (
          <span style={{ color: 'red' }}>✗ 未连接</span>
        )}
      </div>

      {/* 平台选择 */}
      <div style={{ marginBottom: 15 }}>
        <label>平台:</label>
        <Select
          value={formData.platform}
          onChange={value => setFormData({ ...formData, platform: value })}
          style={{ width: '100%', marginTop: 5 }}
        >
          <Option value="douyin">抖音</Option>
          <Option value="xhs">小红书</Option>
        </Select>
      </div>

      {/* 标题 */}
      <div style={{ marginBottom: 15 }}>
        <label>标题:</label>
        <Input
          value={formData.title}
          onChange={e => setFormData({ ...formData, title: e.target.value })}
          placeholder="请输入标题"
          style={{ marginTop: 5 }}
        />
      </div>

      {/* 描述 */}
      <div style={{ marginBottom: 15 }}>
        <label>描述:</label>
        <TextArea
          value={formData.desc}
          onChange={e => setFormData({ ...formData, desc: e.target.value })}
          placeholder="请输入描述"
          rows={4}
          style={{ marginTop: 5 }}
        />
      </div>

      {/* 话题 */}
      <div style={{ marginBottom: 15 }}>
        <label>话题（用逗号分隔）:</label>
        <Input
          value={formData.topics}
          onChange={e => setFormData({ ...formData, topics: e.target.value })}
          placeholder="例如: 生活,记录,美好"
          style={{ marginTop: 5 }}
        />
      </div>

      {/* 文件上传 */}
      <div style={{ marginBottom: 15 }}>
        <label>视频文件:</label>
        <div style={{ marginTop: 5 }}>
          <input type="file" id="videoFull" accept="video/*" />
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label>封面图片:</label>
        <div style={{ marginTop: 5 }}>
          <input type="file" id="coverFull" accept="image/*" />
        </div>
      </div>

      {/* 发布按钮 */}
      <Button
        type="primary"
        size="large"
        block
        onClick={handlePublish}
        loading={isPublishing}
        disabled={!isConnected || isPublishing}
      >
        {isPublishing ? '发布中...' : '开始发布'}
      </Button>

      {/* 进度显示 */}
      {publishProgress && (
        <div style={{ marginTop: 20 }}>
          <Progress
            percent={Math.round(publishProgress.progress)}
            status={
              publishProgress.stage === 'complete'
                ? 'success'
                : publishProgress.stage === 'error'
                  ? 'exception'
                  : 'active'
            }
          />
          <div style={{ marginTop: 10, fontSize: 14, color: '#666' }}>
            <strong>{getPublishStageText(publishProgress.stage)}</strong>
            {publishProgress.message && `: ${publishProgress.message}`}
          </div>
        </div>
      )}

      {/* 完成后的操作 */}
      {publishProgress?.stage === 'complete' && (
        <div style={{ marginTop: 15, textAlign: 'center' }}>
          <Button onClick={resetPublishState}>继续发布下一个</Button>
        </div>
      )}
    </div>
  )
}

/**
 * 示例 3: 带重试机制的发布
 */
export function PublishWithRetryExample() {
  const { isConnected } = usePlugin()
  const { publish } = usePluginPublish()
  const [retrying, setRetrying] = useState(false)

  const handlePublishWithRetry = async () => {
    const videoInput = document.getElementById('videoRetry') as HTMLInputElement
    const coverInput = document.getElementById('coverRetry') as HTMLInputElement

    const videoFile = videoInput?.files?.[0]
    const coverFile = coverInput?.files?.[0]

    if (!videoFile || !coverFile) {
      message.warning('请选择视频和封面')
      return
    }

    setRetrying(true)
    message.loading('发布中，如失败将自动重试...', 0)

    // 创建带重试的发布函数（最多重试 3 次，每次间隔 2 秒）
    const publishWithRetry = withRetry(
      () =>
        publish({
          platform: 'douyin',
          type: 'video',
          title: '重试测试',
          video: videoFile,
          cover: coverFile,
        }),
      3,
      2000,
    )

    try {
      const result = await publishWithRetry()
      message.destroy()
      message.success('发布成功！')
      console.log('发布结果:', result)
    }
    catch (error) {
      message.destroy()
      message.error('重试 3 次后仍然失败')
      console.error('发布失败:', error)
    }
    finally {
      setRetrying(false)
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h3>带重试机制的发布</h3>
      <p style={{ color: '#666', fontSize: 12 }}>
        失败时会自动重试，最多重试 3 次
      </p>

      <div style={{ marginBottom: 10 }}>
        <input type="file" id="videoRetry" accept="video/*" />
      </div>
      <div style={{ marginBottom: 10 }}>
        <input type="file" id="coverRetry" accept="image/*" />
      </div>

      <Button
        type="primary"
        onClick={handlePublishWithRetry}
        loading={retrying}
        disabled={!isConnected || retrying}
      >
        {retrying ? '发布中（自动重试）...' : '发布（带重试）'}
      </Button>
    </div>
  )
}

/**
 * 示例 4: 文件信息预览
 */
export function FilePreviewExample() {
  const [fileInfo, setFileInfo] = useState<{
    name: string
    size: string
    type: string
    valid: boolean
  } | null>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setFileInfo(null)
      return
    }

    const valid = isValidVideoFile(file) && validateFileSize(file, 500 * 1024 * 1024)

    setFileInfo({
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type,
      valid,
    })
  }

  return (
    <div style={{ padding: 20 }}>
      <h3>文件信息预览</h3>
      <input type="file" accept="video/*" onChange={handleFileSelect} />

      {fileInfo && (
        <div
          style={{
            marginTop: 15,
            padding: 15,
            background: fileInfo.valid ? '#f6ffed' : '#fff1f0',
            border: `1px solid ${fileInfo.valid ? '#b7eb8f' : '#ffa39e'}`,
            borderRadius: 4,
          }}
        >
          <div style={{ marginBottom: 5 }}>
            <strong>文件名:</strong>
            {' '}
            {fileInfo.name}
          </div>
          <div style={{ marginBottom: 5 }}>
            <strong>大小:</strong>
            {' '}
            {fileInfo.size}
          </div>
          <div style={{ marginBottom: 5 }}>
            <strong>类型:</strong>
            {' '}
            {fileInfo.type}
          </div>
          <div>
            <strong>状态:</strong>
            {' '}
            {fileInfo.valid ? (
              <span style={{ color: 'green' }}>✓ 有效</span>
            ) : (
              <span style={{ color: 'red' }}>✗ 无效或超过大小限制</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
