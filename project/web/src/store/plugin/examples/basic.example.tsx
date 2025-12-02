/**
 * 基础使用示例
 */

'use client'

import { Button, message, Progress } from 'antd'
import { useEffect } from 'react'
import {
  formatProgress,
  getPluginStatusText,
  usePlugin,
  usePluginLogin,
  usePluginPublish,
} from '../index'

/**
 * 示例 1: 插件状态检测
 */
export function PluginStatusExample() {
  const { status, isConnected } = usePlugin(true, 2000)

  return (
    <div style={{ padding: 20 }}>
      <h3>插件状态</h3>
      <div
        style={{
          color: isConnected ? 'green' : 'red',
          fontSize: 16,
          marginBottom: 10,
        }}
      >
        {getPluginStatusText(status)}
      </div>
    </div>
  )
}

/**
 * 示例 2: 平台登录
 */
export function LoginExample() {
  const { isConnected } = usePlugin()
  const { login } = usePluginLogin()

  const handleLogin = async (platform: 'douyin' | 'xhs') => {
    const result = await login(platform)

    if (result.success) {
      message.success(`登录成功！昵称: ${result.data?.nickname}`)
    }
    else {
      message.error(result.error)
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h3>平台登录</h3>
      <Button
        type="primary"
        onClick={() => handleLogin('douyin')}
        disabled={!isConnected}
        style={{ marginRight: 10 }}
      >
        登录抖音
      </Button>
      <Button
        type="primary"
        onClick={() => handleLogin('xhs')}
        disabled={!isConnected}
      >
        登录小红书
      </Button>
    </div>
  )
}

/**
 * 示例 3: 发布视频
 */
export function PublishVideoExample() {
  const { isConnected } = usePlugin()
  const {
    publishVideo,
    isPublishing,
    publishProgress,
    resetPublishState,
  } = usePluginPublish()

  const handlePublish = async () => {
    const videoInput = document.getElementById('videoInput') as HTMLInputElement
    const coverInput = document.getElementById('coverInput') as HTMLInputElement

    const videoFile = videoInput?.files?.[0]
    const coverFile = coverInput?.files?.[0]

    if (!videoFile || !coverFile) {
      message.warning('请选择视频和封面')
      return
    }

    const result = await publishVideo(
      'douyin',
      videoFile,
      coverFile,
      {
        title: '测试视频',
        desc: '这是一个测试视频',
        topics: ['测试', '示例'],
      },
      (progress) => {
        console.log(`进度: ${progress.progress}%`)
      },
    )

    if (result.success) {
      message.success('发布成功！')
    }
    else {
      message.error(result.error)
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h3>发布视频</h3>

      <div style={{ marginBottom: 10 }}>
        <div style={{ marginBottom: 5 }}>视频文件:</div>
        <input type="file" id="videoInput" accept="video/*" />
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ marginBottom: 5 }}>封面图片:</div>
        <input type="file" id="coverInput" accept="image/*" />
      </div>

      <Button
        type="primary"
        onClick={handlePublish}
        loading={isPublishing}
        disabled={!isConnected || isPublishing}
        style={{ marginBottom: 10 }}
      >
        {isPublishing ? '发布中...' : '开始发布'}
      </Button>

      {publishProgress && (
        <div style={{ marginTop: 20 }}>
          <Progress percent={Math.round(publishProgress.progress)} />
          <div style={{ marginTop: 5, fontSize: 12, color: '#666' }}>
            {publishProgress.stage}
            :
            {publishProgress.message}
          </div>
        </div>
      )}

      {publishProgress?.stage === 'complete' && (
        <Button onClick={resetPublishState} style={{ marginTop: 10 }}>
          重置状态
        </Button>
      )}
    </div>
  )
}

/**
 * 示例 4: 发布图文
 */
export function PublishImagesExample() {
  const { isConnected } = usePlugin()
  const { publishImages, isPublishing } = usePluginPublish()

  const handlePublish = async () => {
    const imageInput = document.getElementById('imagesInput') as HTMLInputElement

    const files = imageInput?.files
    if (!files || files.length === 0) {
      message.warning('请至少选择一张图片')
      return
    }

    const images = Array.from(files)
    if (images.length > 9) {
      message.warning('最多只能选择 9 张图片')
      return
    }

    const result = await publishImages(
      'xhs',
      images,
      {
        title: '图文标题',
        desc: '图文描述',
        topics: ['话题1', '话题2'],
      },
    )

    if (result.success) {
      message.success('发布成功！')
    }
    else {
      message.error(result.error)
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h3>发布图文</h3>

      <div style={{ marginBottom: 10 }}>
        <div style={{ marginBottom: 5 }}>选择图片（最多9张）:</div>
        <input type="file" id="imagesInput" accept="image/*" multiple />
      </div>

      <Button
        type="primary"
        onClick={handlePublish}
        loading={isPublishing}
        disabled={!isConnected || isPublishing}
      >
        {isPublishing ? '发布中...' : '发布到小红书'}
      </Button>
    </div>
  )
}
