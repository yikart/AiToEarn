import type { ForwardedRef } from 'react'
import { 
  CloseCircleFilled, 
  CopyOutlined, 
  SendOutlined, 
  SyncOutlined,
  CompressOutlined,
  ExpandOutlined,
  EditOutlined,
  TranslationOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { Button, Collapse, Input, message, Modal, Spin, Tooltip, Select, Progress } from 'antd'
import { forwardRef, memo, useCallback, useImperativeHandle, useRef, useEffect, useState, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import { useTransClient } from '@/app/i18n/client'
import { aiChatStream, getVideoGenerationModels, generateVideo, getVideoTaskStatus } from '@/api/ai'
import { formatImg, VideoGrabFrame } from '@/components/PublishDialog/PublishDialog.util'
import type { IImgFile, IVideoFile } from '@/components/PublishDialog/publishDialog.type'
import { getOssUrl } from '@/utils/oss'
import styles from '../publishDialog.module.scss'


// 自定义 urlTransform 以允许 data: URLs（base64 图片）
const urlTransform = (url: string) => {
  // 允许 data: 协议（base64 图片）
  if (url.startsWith('data:image/')) {
    return url
  }
  // 允许 blob: 协议
  if (url.startsWith('blob:')) {
    return url
  }
  // 允许 http 和 https
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  // 其他协议返回空字符串（安全处理）
  return ''
}

const { Option } = Select

export interface IPublishDialogAiRef {
  // AI处理文本
  processText: (text: string, action: AIAction) => void
}

export interface IPublishDialogAiProps {
  onClose: () => void
  // 同步内容到编辑器的回调
  onSyncToEditor?: (content: string, images?: IImgFile[], video?: IVideoFile) => void
}

export type AIAction = 'shorten' | 'expand' | 'polish' | 'translate' | 'generateImage' | 'generateVideo'

interface Message {
  role: 'user' | 'assistant'
  content: string
  action?: AIAction
}

// AI生成的图片组件
const AIGeneratedImage = memo(({ src, alt }: { src: string; alt?: string }) => {
  
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  // 如果没有 src，显示错误
  if (!src) {
    return (
      <div style={{ padding: '8px', background: '#fee', border: '1px solid #fcc', borderRadius: '4px' }}>
        ⚠️ 图片数据缺失
      </div>
    )
  }

  return (
    <div style={{ margin: '8px 0', position: 'relative' }}>
      {/* 加载占位符 */}
      {imageLoading && !imageError && (
        <div style={{
          width: '100%',
          minWidth: '200px',
          height: '200px',
          background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
          backgroundSize: '200% 100%',
          animation: 'loading 1.5s ease-in-out infinite',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#999',
          fontSize: '14px',
        }}>
          <Spin />
        </div>
      )}
      <img
        src={src}
        alt={alt || 'AI生成的图片'}
        style={{
          maxWidth: '100%',
          height: 'auto',
          borderRadius: '4px',
          display: imageLoading ? 'none' : 'block',
        }}
        onError={(e) => {
          console.error('图片加载失败:', e, 'src:', src?.substring(0, 100))
          setImageLoading(false)
          setImageError(true)
        }}
        onLoad={() => {
          console.log('图片加载成功:', src?.substring(0, 50))
          setImageLoading(false)
          setImageError(false)
        }}
      />
      {/* 错误提示 */}
      {imageError && (
        <div style={{
          padding: '8px',
          background: '#fee',
          border: '1px solid #fcc',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#c00',
        }}>
          ⚠️ 图片加载失败
        </div>
      )}
    </div>
  )
}, (prevProps, nextProps) => {
  // 只有当 src 和 alt 都相同时才不重新渲染
  return prevProps.src === nextProps.src && prevProps.alt === nextProps.alt
})

interface ChatSession {
  id: string
  messages: Message[]
  currentResponse?: string
  isStreaming?: boolean
}

// AI功能助手
const PublishDialogAi = memo(
  forwardRef(
    (
      { onClose, onSyncToEditor }: IPublishDialogAiProps,
      ref: ForwardedRef<IPublishDialogAiRef>,
    ) => {
      const { t } = useTransClient('publish')
      const [activeAction, setActiveAction] = useState<AIAction | null>(null)
      const [messages, setMessages] = useState<Message[]>([])
      const [inputValue, setInputValue] = useState('')
      const [customPrompts, setCustomPrompts] = useState<Record<string, string>>({
        expand: t('aiFeatures.defaultPrompts.expand' as any),
        polish: t('aiFeatures.defaultPrompts.polish' as any),
        translate: t('aiFeatures.defaultPrompts.translate' as any),
        generateImage: t('aiFeatures.defaultPrompts.generateImage' as any),
        generateVideo: t('aiFeatures.defaultPrompts.generateVideo' as any),
      })
      const [isProcessing, setIsProcessing] = useState(false)
      const [settingsVisible, setSettingsVisible] = useState(false)
      const [showRawContent, setShowRawContent] = useState<number | null>(null)
      const chatContainerRef = useRef<HTMLDivElement>(null)

      // 视频生成相关状态
      const [videoModels, setVideoModels] = useState<any[]>([])
      const [selectedVideoModel, setSelectedVideoModel] = useState('')
      const [videoTaskId, setVideoTaskId] = useState<string | null>(null)
      const [videoStatus, setVideoStatus] = useState<string>('')
      const [videoProgress, setVideoProgress] = useState(0)
      const [videoResult, setVideoResult] = useState<string | null>(null)

      // 自动滚动到底部
      useEffect(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
        }
      }, [messages])

      // 初始化视频模型
      useEffect(() => {
        const fetchVideoModels = async () => {
          try {
            const res: any = await getVideoGenerationModels()
            if (res.data && Array.isArray(res.data)) {
              setVideoModels(res.data)
              
              // 从 localStorage 读取保存的模型
              const savedModel = localStorage.getItem('ai_video_model')
              
              // 尝试找到 sora2 模型
              const sora2Model = res.data.find((m: any) => m.name?.toLowerCase().includes('sora'))
              
              if (savedModel && res.data.find((m: any) => m.name === savedModel)) {
                // 如果有保存的模型且存在于列表中，使用保存的模型
                setSelectedVideoModel(savedModel)
              } else if (sora2Model) {
                // 否则优先使用 sora2
                setSelectedVideoModel(sora2Model.name)
                localStorage.setItem('ai_video_model', sora2Model.name)
              } else if (res.data.length > 0) {
                // 都没有则使用第一个
                setSelectedVideoModel(res.data[0].name)
                localStorage.setItem('ai_video_model', res.data[0].name)
              }
            }
          } catch (error) {
            console.error('Failed to fetch video models:', error)
          }
        }
        
        fetchVideoModels()
      }, [])

      // 视频任务轮询
      const pollVideoTaskStatus = useCallback(async (taskId: string) => {
        const checkStatus = async () => {
          try {
            const res: any = await getVideoTaskStatus(taskId)
            if (res.data) {
              const { status, fail_reason, video_url, progress } = res.data
              const up = typeof status === 'string' ? status.toUpperCase() : ''
              const normalized = up === 'SUCCESS' ? 'completed' : up === 'FAILED' ? 'failed' : up === 'PROCESSING' ? 'processing' : up === 'NOT_START' || up === 'NOT_STARTED' || up === 'QUEUED' || up === 'PENDING' ? 'submitted' : (status || '').toString().toLowerCase()
              setVideoStatus(normalized)
              
              let percent = 0
              if (typeof progress === 'string') {
                const m = progress.match(/(\d+)/)
                percent = m ? Number(m[1]) : 0
              } else if (typeof progress === 'number') {
                percent = progress > -1 ? Math.round(progress) : Math.round(progress * 100)
              }
              
              if (normalized === 'completed') {
                const videoUrl = video_url || res.data?.data?.video_url || res.data?.video_url
                setVideoResult(videoUrl)
                setVideoProgress(100)
                
                // 更新最后一条消息，添加视频链接（用于同步到编辑器）
                setMessages(prev => {
                  const newMessages = [...prev]
                  if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'assistant') {
                    newMessages[newMessages.length - 1] = {
                      ...newMessages[newMessages.length - 1],
                      content: `✅ 视频生成完成！点击下方"同步到编辑器"按钮将视频添加到发布内容中。\n\n[视频链接](${videoUrl})`,
                    }
                  }
                  return newMessages
                })
                
                message.success('视频生成成功')
                setIsProcessing(false)
                return true
              }
              if (normalized === 'failed') {
                setVideoProgress(0)
                message.error(fail_reason || '视频生成失败')
                setMessages(prev => prev.slice(0, -1))
                setIsProcessing(false)
                return true
              }
              setVideoProgress(percent)
              return false
            }
            return false
          } catch {
            return false
          }
        }
        
        const poll = async () => {
          const done = await checkStatus()
          if (!done) {
            setTimeout(poll, 5000)
          }
        }
        poll()
      }, [])

      // 处理视频生成
      const handleVideoGeneration = useCallback(async (prompt: string) => {
        if (!selectedVideoModel) {
          message.error('请先在设置中选择视频模型')
          return
        }

        const selectedModel = videoModels.find((m: any) => m.name === selectedVideoModel)
        if (!selectedModel) {
          message.error('选中的视频模型不可用')
          return
        }

        try {
          setIsProcessing(true)
          setVideoStatus('submitted')
          setVideoProgress(10)

          // 添加助手消息占位
          const placeholderMsg: Message = { role: 'assistant', content: '正在生成视频...', action: 'generateVideo' }
          setMessages(prev => [...prev, placeholderMsg])

          // 获取第一个可用的分辨率和时长
          let duration = 5
          let size = '720p'
          
          if (selectedModel?.channel === 'kling' && selectedModel?.pricing) {
            const durations = [...new Set(selectedModel.pricing.map((p: any) => p.duration))] as number[]
            const modes = [...new Set(selectedModel.pricing.map((p: any) => p.mode))] as string[]
            if (durations.length > 0) duration = durations[0]
            if (modes.length > 0) size = modes[0]
          } else {
            if (selectedModel?.durations?.length > 0) duration = selectedModel.durations[0]
            if (selectedModel?.resolutions?.length > 0) size = selectedModel.resolutions[0]
          }

          const data: any = {
            model: selectedVideoModel,
            prompt,
            duration,
          }

          // 如果是 kling 模型，传 mode 参数
          if (selectedModel?.channel === 'kling') {
            data.mode = size
          } else {
            data.size = size
          }

          const res: any = await generateVideo(data)
          
          if (res?.data?.task_id) {
            setVideoTaskId(res.data.task_id)
            setVideoStatus(res.data.status)
            message.success('视频生成任务已提交')
            pollVideoTaskStatus(res.data.task_id)
          } else {
            throw new Error('视频生成失败')
          }
        } catch (error: any) {
          console.error('Video Generation Error:', error)
          setMessages(prev => prev.slice(0, -1))
          message.error(error.message || '视频生成失败，请重试')
          setVideoStatus('')
          setIsProcessing(false)
        }
      }, [selectedVideoModel, videoModels, pollVideoTaskStatus])


      // 处理AI响应
      const handleAIResponse = useCallback(async (
        action: AIAction,
        apiMessages: Array<{ role: string, content: string }>,
      ) => {
        try {
          setIsProcessing(true)
          
          // 添加助手消息占位
          const placeholderMsg: Message = { role: 'assistant', content: '', action }
          setMessages(prev => [...prev, placeholderMsg])

          const response = await aiChatStream({ messages: apiMessages })
          
          // 检查响应状态
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          // 尝试读取JSON响应
          const result = await response.json()
          
          if (result.code === 0 && result.data?.content) {
            // 更新最后一条消息
            setMessages(prev => {
              const newMessages = [...prev]
              newMessages[newMessages.length - 1] = {
                role: 'assistant',
                content: result.data.content,
                action,
              }
              return newMessages
            })
          } else {
            throw new Error(result.message || 'AI响应失败')
          }

          setIsProcessing(false)
        } catch (error: any) {
          console.error('AI Response Error:', error)
          // 移除占位消息
          setMessages(prev => prev.slice(0, -1))
          message.error(error.message || 'AI处理失败，请重试')
          setIsProcessing(false)
        }
      }, [])

      // 处理功能按钮点击
      const handleActionClick = useCallback((action: AIAction) => {
        setActiveAction(action)
      }, [])

      // 发送消息
      const sendMessage = useCallback(async (content?: string, forceAction?: AIAction) => {
        const messageContent = content || inputValue
        if (!messageContent.trim()) {
          message.warning(t('aiFeatures.selectText' as any))
          return
        }

        // 使用传入的 action 或当前状态的 action
        const currentAction = forceAction || activeAction

        // 添加用户消息
        const userMessage: Message = { role: 'user', content: messageContent, action: currentAction || undefined }
        setMessages(prev => [...prev, userMessage])

        // 如果是视频生成功能，直接调用视频生成
        if (currentAction === 'generateVideo') {
          await handleVideoGeneration(messageContent)
          setInputValue('')
          return
        }

        let systemPrompt = ''

        // 如果选择了功能，根据不同功能生成提示词
        if (currentAction) {
          switch (currentAction) {
            case 'shorten':
              systemPrompt = t('aiFeatures.defaultPrompts.shorten' as any)
              break
            case 'expand':
              systemPrompt = customPrompts.expand || t('aiFeatures.defaultPrompts.expand' as any)
              break
            case 'polish':
              systemPrompt = customPrompts.polish || t('aiFeatures.defaultPrompts.polish' as any)
              break
            case 'translate':
              systemPrompt = customPrompts.translate || t('aiFeatures.defaultPrompts.translate' as any)
              break
            case 'generateImage':
              systemPrompt = customPrompts.generateImage || t('aiFeatures.defaultPrompts.generateImage' as any)
              break
          }
        }

        // 准备API消息
        const apiMessages: Array<{ role: string, content: string }> = []
        

        
        // 只有在有系统提示词时才添加
        if (systemPrompt) {
          apiMessages.push({ role: 'system', content: systemPrompt })
        }
        
        apiMessages.push({ role: 'user', content: messageContent })

        // 调用AI接口
        await handleAIResponse(currentAction || 'polish', apiMessages)

        // 清空输入
        setInputValue('')
      }, [activeAction, inputValue, customPrompts, handleAIResponse, handleVideoGeneration, t])

      // 从URL下载图片并转换为IImgFile对象
      const downloadImageAsImgFile = async (url: string, index: number): Promise<IImgFile | null> => {
        try {
          let blob: Blob
          
          // 如果是 blob URL
          if (url.startsWith('blob:')) {
            console.log('处理 blob URL:', url)
            const response = await fetch(url)
            if (!response.ok) {
              throw new Error(`无法读取 blob: ${response.status}`)
            }
            blob = await response.blob()
            console.log('blob 读取完成，大小:', blob.size)
          }
          // 如果是 base64 图片，直接转换
          else if (url.startsWith('data:image/')) {
            console.log('处理 base64 图片，长度:', url.length)
            
            if (!url.includes(',')) {
              throw new Error('无效的 base64 图片格式')
            }
            
            const parts = url.split(',')
            if (parts.length !== 2) {
              throw new Error('base64 数据格式错误')
            }
            
            const base64Data = parts[1]
            const mimeType = url.match(/data:(.*?);/)?.[1] || 'image/png'
            
            console.log('MIME类型:', mimeType, 'base64数据长度:', base64Data.length)
            
            // 检查 base64 数据是否有效
            if (!base64Data || base64Data.length < 100) {
              throw new Error('base64 数据太短或为空')
            }
            
            const byteCharacters = atob(base64Data)
            const byteNumbers = new Array(byteCharacters.length)
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i)
            }
            const byteArray = new Uint8Array(byteNumbers)
            blob = new Blob([byteArray], { type: mimeType })
            
            console.log('base64 转换完成，Blob大小:', blob.size)
          } 
          // 普通 URL，需要下载
          else {
            console.log('下载图片:', url)
            const response = await fetch(url)
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`)
            }
            blob = await response.blob()
            console.log('图片下载完成，大小:', blob.size)
          }
          
          const filename = `ai-generated-image-${index + 1}.png`
          
          // 使用 formatImg 函数正确处理图片
          const imgFile = await formatImg({
            blob,
            path: filename,
          })
          
          console.log('图片处理成功:', imgFile)
          return imgFile
        } catch (error) {
          console.error('图片处理失败:', error)
          message.error(`图片 ${index + 1} 处理失败: ${error instanceof Error ? error.message : '未知错误'}`)
          return null
        }
      }

      // 从URL下载视频并转换为IVideoFile对象
      const downloadVideoAsVideoFile = async (url: string): Promise<IVideoFile | null> => {
        try {
          console.log('开始下载视频，原始URL:', url)
          const ossUrl = getOssUrl(url)
          console.log('转换后的OSS URL:', ossUrl)
          
          const response = await fetch(ossUrl)
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          
          const blob = await response.blob()
          console.log('视频下载完成，大小:', blob.size)
          
          const filename = `ai-generated-video.mp4`
          
          // 创建临时 URL 用于获取视频信息
          const videoUrl = URL.createObjectURL(blob)
          console.log('创建临时URL:', videoUrl)
          
          const videoInfo = await VideoGrabFrame(videoUrl, 0)
          console.log('视频信息:', videoInfo)
          
          const videoFile: IVideoFile = {
            filename,
            videoUrl,
            size: blob.size,
            file: blob,
            ossUrl: ossUrl, // 保存转换后的完整 OSS URL
            ...videoInfo,
          }
          
          console.log('视频文件对象创建成功:', videoFile)
          return videoFile
        } catch (error) {
          console.error('下载视频失败，URL:', url, '错误:', error)
          message.error('视频下载失败，请重试')
          return null
        }
      }

      // 同步到编辑器
      const syncToEditor = useCallback(async (content: string) => {
        if (onSyncToEditor) {
          console.log('开始同步到编辑器，内容:', content)
          
          // 提取所有图片URL和视频链接
          const imageMatches = content.match(/!\[.*?\]\(([^)]+)\)/g) || []
          const linkMatches = content.match(/\[.*?\]\(([^)]+)\)/g) || []
          
          console.log('图片匹配:', imageMatches)
          console.log('链接匹配:', linkMatches)
          
          // 分离图片和视频链接
          const imageUrls: string[] = []
          let videoUrl: string | null = null
          
          imageMatches.forEach(match => {
            const urlMatch = match.match(/!\[.*?\]\(([^)]+)\)/)
            const url = urlMatch ? urlMatch[1] : null
            if (url) {
              // 支持普通URL和base64格式的图片
              imageUrls.push(url)
              console.log('提取到图片URL:', url.substring(0, 50) + (url.length > 50 ? '...' : ''))
            }
          })
          
          // 检查是否有视频链接
          linkMatches.forEach(match => {
            const urlMatch = match.match(/\[.*?\]\(([^)]+)\)/)
            const url = urlMatch ? urlMatch[1] : null
            console.log('检查链接是否为视频:', url)
            if (url && (url.includes('.mp4') || url.includes('.webm') || url.includes('video'))) {
              console.log('识别到视频链接:', url)
              videoUrl = url
            }
          })

          console.log('最终识别 - 图片URLs:', imageUrls, '视频URL:', videoUrl)

          // 下载图片
          let imageFiles: IImgFile[] = []
          if (imageUrls.length > 0) {
            message.loading({ content: '正在下载图片...', key: 'downloadMedia' })
            const downloadPromises = imageUrls.map((url, index) => 
              downloadImageAsImgFile(url, index)
            )
            const results = await Promise.all(downloadPromises)
            imageFiles = results.filter((file): file is IImgFile => file !== null)
          }

          // 下载视频
          let videoFile: IVideoFile | undefined
          if (videoUrl) {
            message.loading({ content: '正在下载视频...', key: 'downloadMedia' })
            videoFile = await downloadVideoAsVideoFile(videoUrl) || undefined
            console.log('视频下载结果:', videoFile ? '成功' : '失败')
          }
          
          if (imageUrls.length > 0 || videoUrl) {
            message.destroy('downloadMedia')
          }

          // 移除markdown中的图片和视频链接，只保留文本内容
          const textContent = content
            .replace(/!\[.*?\]\([^)]+\)/g, '')
            .replace(/\[视频链接\]\([^)]+\)/g, '')
            .replace(/\[.*?\]\([^)]+\.(mp4|webm)[^)]*\)/gi, '')
            .trim()

          // 如果有视频，只同步视频（不更新文本）
          // 如果有图片，只同步图片（不更新文本）
          // 如果两者都没有，同步文本内容
          if (videoFile) {
            console.log('同步视频到编辑器')
            onSyncToEditor('', [], videoFile)
            message.success('视频同步成功')
          } else if (imageFiles.length > 0) {
            console.log('同步图片到编辑器')
            onSyncToEditor('', imageFiles)
            message.success('图片同步成功')
          } else {
            console.log('同步文本到编辑器')
            onSyncToEditor(textContent)
            message.success(t('aiFeatures.syncSuccess' as any))
          }
        }
      }, [onSyncToEditor, t, downloadImageAsImgFile, downloadVideoAsVideoFile])

      // 暴露给父组件的方法
      useImperativeHandle(ref, () => ({
        processText: (text: string, action: AIAction) => {
          setActiveAction(action)
          setInputValue(text)
          // 立即自动发送，直接传入 action 参数避免状态异步问题
          setTimeout(() => {
            sendMessage(text, action) // 传入 action 参数
          }, 50)
        },
      }), [sendMessage])

      const actionButtons = [
        { action: 'shorten', icon: <CompressOutlined />, label: t('aiFeatures.shorten' as any) },
        { action: 'expand', icon: <ExpandOutlined />, label: t('aiFeatures.expand' as any) },
        { action: 'polish', icon: <EditOutlined />, label: t('aiFeatures.polish' as any) },
        { action: 'translate', icon: <TranslationOutlined />, label: t('aiFeatures.translate' as any) },
        { action: 'generateImage', icon: <PictureOutlined />, label: t('aiFeatures.generateImage' as any) },
        { action: 'generateVideo', icon: <VideoCameraOutlined />, label: t('aiFeatures.generateVideo' as any) },
      ]

      // 缓存 Markdown 组件配置，避免每次渲染都创建新对象
      const markdownComponents = useMemo(() => ({
        img: ({ node, ...props }: any) => {
          console.log('img 组件 props:', { src: props.src?.substring(0, 100), alt: props.alt })
          return <AIGeneratedImage src={props.src || ''} alt={props.alt} />
        },
        p: ({ node, ...props }: any) => <p {...props} style={{ margin: '4px 0', lineHeight: '1.6' }} dir="auto" />,
        code: ({ node, inline, className, children, ...props }: any) => {
          return inline
            ? <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: '3px', fontSize: '0.9em' }} {...props}>{children}</code>
            : <code style={{ display: 'block', background: '#f0f0f0', padding: '12px', borderRadius: '4px', overflowX: 'auto', fontSize: '0.9em', lineHeight: '1.5' }} {...props}>{children}</code>
        },
        a: ({ node, ...props }: any) => {
          const href = props.href || ''
          
          // 检查是否是音频文件
          if (/\.(aac|mp3|opus|wav)$/.test(href)) {
            return (
              <figure style={{ margin: '8px 0' }}>
                <audio controls src={href}></audio>
              </figure>
            )
          }
          
          // 检查是否是视频文件
          if (/\.(3gp|3g2|webm|ogv|mpeg|mp4|avi)$/.test(href) || href.includes('video')) {
            return (
              <div style={{ margin: '8px 0' }}>
                <video 
                  controls 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '400px', 
                    borderRadius: '8px',
                    display: 'block'
                  }}
                >
                  <source src={getOssUrl(href)} />
                </video>
              </div>
            )
          }
          
          // 普通链接
          const isInternal = /^\/#/i.test(href)
          const target = isInternal ? '_self' : props.target ?? '_blank'
          return <a {...props} target={target} style={{ color: '#1890ff', textDecoration: 'underline' }} rel="noopener noreferrer" />
        },
        ul: ({ node, ...props }: any) => <ul style={{ margin: '8px 0', paddingLeft: '20px' }} {...props} />,
        ol: ({ node, ...props }: any) => <ol style={{ margin: '8px 0', paddingLeft: '20px' }} {...props} />,
        li: ({ node, ...props }: any) => <li style={{ margin: '4px 0' }} {...props} />,
        h1: ({ node, ...props }: any) => <h1 style={{ fontSize: '1.5em', fontWeight: 'bold', margin: '12px 0 8px' }} {...props} />,
        h2: ({ node, ...props }: any) => <h2 style={{ fontSize: '1.3em', fontWeight: 'bold', margin: '12px 0 8px' }} {...props} />,
        h3: ({ node, ...props }: any) => <h3 style={{ fontSize: '1.1em', fontWeight: 'bold', margin: '8px 0 6px' }} {...props} />,
        blockquote: ({ node, ...props }: any) => (
          <blockquote style={{ borderLeft: '3px solid #e0e0e0', paddingLeft: '12px', margin: '8px 0', color: '#666' }} {...props} />
        ),
      }), [])

      return (
        <div className={styles.publishDialogAi} id="publishDialogAi">
          <h1>
            <span>{t('aiAssistant' as any)}</span>
            <CloseCircleFilled onClick={onClose} />
          </h1>
          <div className="publishDialogAi-wrapper" style={{ padding: '0 12px', marginTop: '12px' }}>
            {/* 显示可编辑的默认提示词（缩写和扩写不可编辑） */}
            {/* {activeAction && activeAction !== 'shorten' && activeAction !== 'expand' && (
             <Collapse
                size="small"
                items={[
                  {
                    key: '1',
                    label: '默认提示词',
                    children: (
                      <Input.TextArea
                        value={customPrompts[activeAction]}
                        onChange={e =>
                          setCustomPrompts(prev => ({
                            ...prev,
                            [activeAction]: e.target.value,
                          }))}
                        rows={2}
                        placeholder={t('aiFeatures.inputPrompt' as any)}
                      />
                    ),
                  },
                ]}
                style={{ marginBottom: 12 }}
              /> 
            )} */}

            {/* 聊天消息区域 */}
            <div 
              ref={chatContainerRef}
              className="publishDialogAi-chat" 
              style={{ 
                flex: '1 1 0',
                overflowY: 'auto', 
                marginBottom: 12,
                padding: '12px',
                background: '#f5f5f5',
                borderRadius: '8px',
              }}
            >

              {messages.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  color: '#999', 
                  padding: '40px 20px',
                }}>
                  输入内容开始对话，或选择功能快速处理文本
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isUser = msg.role === 'user'
                  return (
                    <div
                      key={`${index}-${msg.content.substring(0, 20)}`}
                      style={{
                        marginBottom: 12,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isUser ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div
                        style={{
                          maxWidth: '80%',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          background: isUser ? '#1890ff' : '#fff',
                          color: isUser ? '#fff' : '#000',
                          wordBreak: 'break-word',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        }}
                        className="ai-message-content"
                      >

                        
                        {msg.content ? (
                          msg.role === 'assistant' ? (
                            <>
                              <ReactMarkdown 
                                urlTransform={urlTransform}
                                components={markdownComponents}
                              >
                                {msg.content}
                              </ReactMarkdown>
                              {/* 如果是视频生成消息且有进度，显示进度条 */}
                              {msg.action === 'generateVideo' && videoStatus && videoStatus !== 'completed' && index === messages.length - 1 && (
                                <div style={{ marginTop: 8 }}>
                                  <Progress percent={videoProgress} status={videoStatus === 'failed' ? 'exception' : 'active'} />
                                  <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                                    {videoStatus === 'submitted' && '任务已提交，等待处理...'}
                                    {videoStatus === 'processing' && '正在生成视频...'}
                                    {videoStatus === 'failed' && '视频生成失败'}
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                          )
                        ) : (
                          <Spin size="small" />
                        )}
                    </div>
                    {msg.role === 'assistant' && msg.content && (
                      <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Button
                            size="small"
                            icon={<SyncOutlined />}
                            onClick={() => syncToEditor(msg.content)}
                          >
                            {t('aiFeatures.syncToEditor' as any)}
                          </Button>
                          <Button
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={() => {
                              navigator.clipboard.writeText(msg.content)
                              message.success('已复制到剪贴板')
                            }}
                          />
                          <Button
                            size="small"
                            onClick={() => setShowRawContent(showRawContent === index ? null : index)}
                          >
                            {showRawContent === index ? '隐藏原始' : '查看原始'}
                          </Button>
                        </div>
                        {showRawContent === index && (
                          <div style={{ 
                            background: '#f0f0f0', 
                            padding: '8px', 
                            borderRadius: '4px',
                            fontSize: '12px',
                            maxHeight: '200px',
                            overflowY: 'auto',
                            wordBreak: 'break-all',
                          }}>
                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.content}</pre>
                          </div>
                        )}
                      </div>
                    )}
                    </div>
                  )
                })
              )}
            </div>

            {/* 功能按钮区域 */}
            <div style={{ 
              display: 'flex', 
              gap: 8, 
              marginBottom: 8,
              padding: '8px',
              background: '#fafafa',
              borderRadius: '8px',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div style={{ display: 'flex', gap: 8, flex: 1, flexWrap: 'wrap' }}>
                {actionButtons.map(({ action, icon, label }) => (
                  <Tooltip key={action} title={label}>
                    <Button
                      type={activeAction === action ? 'primary' : 'default'}
                      icon={icon}
                      onClick={() => handleActionClick(action as AIAction)}
                      size="small"
                    />
                  </Tooltip>
                ))}
              </div>
              <Tooltip title="设置">
                <Button
                  icon={<SettingOutlined />}
                  onClick={() => setSettingsVisible(true)}
                  size="small"
                />
              </Tooltip>
            </div>

            {/* 输入区域 */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <Input.TextArea
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder={activeAction ? t('aiFeatures.inputPrompt' as any) : '输入内容开始对话...'}
                rows={1}
                disabled={isProcessing}
                onPressEnter={(e) => {
                  if (e.shiftKey) return // Shift+Enter换行
                  e.preventDefault()
                  sendMessage()
                }}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={() => sendMessage()}
                loading={isProcessing}
                disabled={isProcessing}
              >
                {t('aiFeatures.send' as any)}
              </Button>
            </div>
          </div>

          {/* 设置弹窗 */}
          <Modal
            title="AI设置"
            open={settingsVisible}
            onCancel={() => setSettingsVisible(false)}
            footer={[
              <Button key="close" onClick={() => setSettingsVisible(false)}>
                关闭
              </Button>,
            ]}
          >
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8, fontWeight: 'bold' }}>
                <VideoCameraOutlined style={{ marginRight: 8 }} />
                视频生成模型
              </div>
              <Select
                value={selectedVideoModel}
                onChange={(value) => {
                  setSelectedVideoModel(value)
                  localStorage.setItem('ai_video_model', value)
                  message.success('视频模型设置已保存')
                }}
                style={{ width: '100%' }}
                placeholder="选择视频模型"
                optionLabelProp="label"
              >
                {videoModels.map((model: any) => (
                  <Option 
                    key={model.name} 
                    value={model.name}
                    label={model.name}
                  >
                    <div style={{ padding: '4px 0' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{model.name}</div>
                      {model.description && (
                        <div style={{ fontSize: '12px', color: '#999', whiteSpace: 'normal', lineHeight: '1.4' }}>
                          {model.description}
                        </div>
                      )}
                    </div>
                  </Option>
                ))}
              </Select>
              {selectedVideoModel && (() => {
                const model = videoModels.find((m: any) => m.name === selectedVideoModel)
                if (!model) return null
                
                let duration = 5
                let size = '720p'
                
                if (model?.channel === 'kling' && model?.pricing) {
                  const durations = [...new Set(model.pricing.map((p: any) => p.duration))] as number[]
                  const modes = [...new Set(model.pricing.map((p: any) => p.mode))] as string[]
                  if (durations.length > 0) duration = durations[0]
                  if (modes.length > 0) size = modes[0]
                } else {
                  if (model?.durations?.length > 0) duration = model.durations[0]
                  if (model?.resolutions?.length > 0) size = model.resolutions[0]
                }
                
                return (
                  <div style={{ marginTop: 8, padding: '8px', background: '#f5f5f5', borderRadius: '4px', fontSize: '12px', color: '#666' }}>
                    <div>默认时长: {duration}秒</div>
                    <div>默认分辨率: {size}</div>
                  </div>
                )
              })()}
            </div>
          </Modal>
        </div>
      )
    },
  ),
)

export default PublishDialogAi
