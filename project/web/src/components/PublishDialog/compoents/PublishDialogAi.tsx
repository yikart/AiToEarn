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
import { formatImg } from '@/components/PublishDialog/PublishDialog.util'
import type { IImgFile } from '@/components/PublishDialog/publishDialog.type'
import { OSS_URL } from '@/constant'
import { getOssUrl } from '@/utils/oss'
import styles from '../publishDialog.module.scss'

const { Option } = Select

export interface IPublishDialogAiRef {
  // AI处理文本
  processText: (text: string, action: AIAction) => void
}

export interface IPublishDialogAiProps {
  onClose: () => void
  // 同步内容到编辑器的回调
  onSyncToEditor?: (content: string, images?: IImgFile[]) => void
}

export type AIAction = 'shorten' | 'expand' | 'polish' | 'translate' | 'generateImage' | 'generateVideo'

interface Message {
  role: 'user' | 'assistant'
  content: string
  action?: AIAction
}

// AI生成的图片组件
const AIGeneratedImage = memo(({ src, alt }: { src: string; alt?: string }) => {
  const isBase64 = src.startsWith('data:image/')
  const isPollinationsUrl = src.includes('pollinations.ai')
  const base64Length = isBase64 && src.includes('base64,') 
    ? src.split('base64,')[1]?.length || 0 
    : 0
  
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

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
        crossOrigin={isPollinationsUrl ? 'anonymous' : undefined}
        onError={() => {
          setImageLoading(false)
          setImageError(true)
        }}
        onLoad={() => {
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
          {isBase64 && base64Length < 1000 && <><br/>数据不完整，可能被截断</>}
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
                
                // 更新最后一条消息，添加视频
                setMessages(prev => {
                  const newMessages = [...prev]
                  if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'assistant') {
                    newMessages[newMessages.length - 1] = {
                      ...newMessages[newMessages.length - 1],
                      content: `视频生成完成！\n\n[视频链接](${videoUrl})`,
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
        
        // 如果是图片生成功能，添加特殊的系统提示词
        if (currentAction === 'generateImage') {
          apiMessages.push({
            role: 'system',
            content: '当需要提供图片时，必须使用该格式返回图片：![描述](https://image.pollinations.ai/prompt/你的图片描述?nologo=true&width=720&height=720)，URL中的空格等符号需要用%20等编码替换 ',
          })
        }
        
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
          const response = await fetch(url)
          const blob = await response.blob()
          const filename = `ai-generated-image-${index + 1}.png`
          
          // 使用 formatImg 函数正确处理图片
          const imgFile = await formatImg({
            blob,
            path: filename,
          })
          
          return imgFile
        } catch (error) {
          console.error('下载图片失败:', error)
          return null
        }
      }

      // 同步到编辑器
      const syncToEditor = useCallback(async (content: string) => {
        if (onSyncToEditor) {
          // 提取所有图片URL
          const imageMatches = content.match(/!\[.*?\]\(([^)]+)\)/g) || []
          const imageUrls = imageMatches.map(match => {
            const urlMatch = match.match(/!\[.*?\]\(([^)]+)\)/)
            return urlMatch ? urlMatch[1] : null
          }).filter((url): url is string => url !== null && !url.startsWith('data:'))

          // 下载所有图片并转换为IImgFile
          let imageFiles: IImgFile[] = []
          if (imageUrls.length > 0) {
            message.loading({ content: '正在下载图片...', key: 'downloadImages' })
            const downloadPromises = imageUrls.map((url, index) => 
              downloadImageAsImgFile(url, index)
            )
            const results = await Promise.all(downloadPromises)
            imageFiles = results.filter((file): file is IImgFile => file !== null)
            message.destroy('downloadImages')
          }

          // 移除markdown中的图片，只保留文本内容
          const textContent = content.replace(/!\[.*?\]\([^)]+\)/g, '').trim()

          // 如果有图片，只同步图片不更新文本（传递空字符串）
          // 如果没有图片，同步文本内容
          if (imageFiles.length > 0) {
            onSyncToEditor('', imageFiles)
            message.success('图片同步成功')
          } else {
            onSyncToEditor(textContent, imageFiles)
            message.success(t('aiFeatures.syncSuccess' as any))
          }
        }
      }, [onSyncToEditor, t])

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
        img: ({ node, ...props }: any) => (
          <AIGeneratedImage src={props.src || ''} alt={props.alt} />
        ),
        p: ({ node, ...props }: any) => <p style={{ margin: '4px 0', lineHeight: '1.6' }} {...props} />,
        code: ({ node, inline, className, children, ...props }: any) => {
          return inline
            ? <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: '3px', fontSize: '0.9em' }} {...props}>{children}</code>
            : <code style={{ display: 'block', background: '#f0f0f0', padding: '12px', borderRadius: '4px', overflowX: 'auto', fontSize: '0.9em', lineHeight: '1.5' }} {...props}>{children}</code>
        },
        a: ({ node, ...props }: any) => {
          // 检查是否是视频链接
          const href = props.href || ''
          const isVideo = href.includes('.mp4') || href.includes('.webm') || href.includes('video')
          
          if (isVideo) {
            return (
              <div style={{ margin: '8px 0' }}>
                <video 
                  src={getOssUrl(href)} 
                  controls 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '400px', 
                    borderRadius: '8px',
                    display: 'block'
                  }} 
                />
              </div>
            )
          }
          
          return (
            <a {...props} style={{ color: '#1890ff', textDecoration: 'underline' }} target="_blank" rel="noopener noreferrer" />
          )
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
                            <ReactMarkdown components={markdownComponents}>
                              {msg.content
                                .replace(/^`+|`+$/g, '')
                                .replace(/`(!\[.*?\]\(data:image\/.*?\))`/g, '$1')
                              }
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
              >
                {videoModels.map((model: any) => (
                  <Option key={model.name} value={model.name}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 'bold' }}>{model.name}</span>
                      {model.description && (
                        <span style={{ fontSize: '12px', color: '#999' }}>{model.description}</span>
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
