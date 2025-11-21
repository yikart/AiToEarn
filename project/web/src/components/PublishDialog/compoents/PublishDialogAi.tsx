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
  TagsOutlined,
} from '@ant-design/icons'
import { Button, Collapse, Input, message, Modal, Spin, Tooltip, Select, Progress } from 'antd'
import { forwardRef, memo, useCallback, useImperativeHandle, useRef, useEffect, useState, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import { useTransClient } from '@/app/i18n/client'
import { aiChatStream, getVideoGenerationModels, generateVideo, getVideoTaskStatus } from '@/api/ai'
import { uploadToOss } from '@/api/oss'
import { formatImg, VideoGrabFrame } from '@/components/PublishDialog/PublishDialog.util'
import type { IImgFile, IVideoFile } from '@/components/PublishDialog/publishDialog.type'
import { getOssUrl } from '@/utils/oss'
import { OSS_URL } from '@/constant'
import styles from '../publishDialog.module.scss'


// Custom urlTransform to allow data: URLs (base64 images)
const urlTransform = (url: string) => {
  // Allow data: protocol (base64 images)
  if (url.startsWith('data:image/')) {
    return url
  }
  // Allow blob: protocol
  if (url.startsWith('blob:')) {
    return url
  }
  // Allow http and https
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  // Return empty string for other protocols (security handling)
  return ''
}

const { Option } = Select

export interface IPublishDialogAiRef {
  // AI text processing
  processText: (text: string, action: AIAction) => void
  // Image to image processing
  processImageToImage: (imageFile: File, prompt?: string) => void
}

export interface IPublishDialogAiProps {
  onClose: () => void
  // Callback to sync content to editor
  // append: true means append content, false means replace content
  onSyncToEditor?: (content: string, images?: IImgFile[], video?: IVideoFile, append?: boolean) => void
  // Chat model list
  chatModels?: any[]
}

export type AIAction = 'shorten' | 'expand' | 'polish' | 'translate' | 'generateImage' | 'generateVideo' | 'generateHashtags' | 'imageToImage'

interface Message {
  role: 'user' | 'assistant'
  content: string
  action?: AIAction
}

  // Message item component - use memo to avoid unnecessary re-renders
  const MessageItem = memo(({ 
    msg, 
    index, 
    showRawContent,
    setShowRawContent,
    syncToEditor,
    videoStatus,
    videoProgress,
    messagesLength,
    t,
    markdownComponents
  }: {
    msg: Message
    index: number
    showRawContent: number | null
    setShowRawContent: (index: number | null) => void
    syncToEditor: (content: string, action?: AIAction) => void
    videoStatus: string
    videoProgress: number
    messagesLength: number
    t: any
    markdownComponents: any
  }) => {
    // Process video markers
    const processVideoContent = (content: string) => {
      const videoMatch = content.match(/__VIDEO__(.*?)__VIDEO__/)
      if (videoMatch) {
        const videoUrl = videoMatch[1]
        const fullVideoUrl = getOssUrl(videoUrl)
        const textPart = content.replace(/__VIDEO__.*?__VIDEO__/, '').trim()
        
        return (
          <>
            {textPart && <div style={{ marginBottom: '12px' }}>{textPart}</div>}
            <video 
              src={fullVideoUrl}
              controls 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '400px', 
                borderRadius: '8px',
                display: 'block'
              }} 
            />
          </>
        )
      }
      return null
    }
    
    return (
      <div
        key={index}
        style={{
          marginBottom: 16,
          display: 'flex',
          flexDirection: 'column',
          alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
        }}
      >
        <div
          style={{
            maxWidth: '85%',
            padding: '12px',
            background: msg.role === 'user' ? '#1890ff' : '#f5f5f5',
            color: msg.role === 'user' ? '#fff' : '#000',
            borderRadius: '8px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          }}
          className="ai-message-content"
        >
          {msg.content ? (
            msg.role === 'assistant' ? (
              <>
                {msg.content.includes('__VIDEO__') ? (
                  processVideoContent(msg.content)
                ) : (
                  <ReactMarkdown 
                    urlTransform={urlTransform}
                    components={markdownComponents}
                  >
                    {msg.content}
                  </ReactMarkdown>
                )}
                {/* Show progress bar if it's a video generation message with progress */}
                {msg.action === 'generateVideo' && videoStatus && videoStatus !== 'completed' && index === messagesLength - 1 && (
                  <div style={{ marginTop: 8 }}>
                    <Progress percent={videoProgress} status={videoStatus === 'failed' ? 'exception' : 'active'} />
                    <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                      {videoStatus === 'submitted' && t('aiFeatures.taskSubmitted' as any)}
                      {videoStatus === 'processing' && t('aiFeatures.generatingStatus' as any)}
                      {videoStatus === 'failed' && t('aiFeatures.videoFailed' as any)}
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
                onClick={() => syncToEditor(msg.content, msg.action)}
              >
                {t('aiFeatures.syncToEditor' as any)}
              </Button>
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => {
                  navigator.clipboard.writeText(msg.content)
                  message.success(t('aiFeatures.copied' as any))
                }}
              />
              <Button
                size="small"
                onClick={() => setShowRawContent(showRawContent === index ? null : index)}
              >
                {showRawContent === index ? t('aiFeatures.hideRaw' as any) : t('aiFeatures.showRaw' as any)}
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
  }, (prevProps, nextProps) => {
    // Only re-render when these properties change
    return (
      prevProps.msg.content === nextProps.msg.content &&
      prevProps.showRawContent === nextProps.showRawContent &&
      prevProps.videoStatus === nextProps.videoStatus &&
      prevProps.videoProgress === nextProps.videoProgress
    )
  })

  // AI-generated image component
  const AIGeneratedImage = memo(({ src, alt }: { src: string; alt?: string }) => {
    const { t } = useTransClient('publish')
    const [imageLoading, setImageLoading] = useState(true)
    const [imageError, setImageError] = useState(false)

  // Show error if no src
  if (!src) {
    const { t } = useTransClient('publish')
    return (
      <div style={{ padding: '8px', background: '#fee', border: '1px solid #fcc', borderRadius: '4px' }}>
        {t('aiFeatures.imageMissing' as any)}
      </div>
    )
  }

  return (
    <div style={{ margin: '8px 0', position: 'relative' }}>
      {/* Loading placeholder */}
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
        alt={alt || 'AI-generated image'}
        style={{
          maxWidth: '100%',
          height: 'auto',
          borderRadius: '4px',
          display: imageLoading ? 'none' : 'block',
        }}
        onError={(e) => {
          console.error('Image load failed:', e)
          setImageLoading(false)
          setImageError(true)
        }}
        onLoad={() => {
          setImageLoading(false)
          setImageError(false)
        }}
      />
      {/* Error message */}
      {imageError && (
        <div style={{
          padding: '8px',
          background: '#fee',
          border: '1px solid #fcc',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#c00',
        }}>
          {t('aiFeatures.imageLoadFailed' as any)}
        </div>
      )}
    </div>
  )
}, (prevProps, nextProps) => {
  // Only re-render when src or alt changes
  return prevProps.src === nextProps.src && prevProps.alt === nextProps.alt
})

// AI Feature Assistant
const PublishDialogAi = memo(
  forwardRef(
    (
      { onClose, onSyncToEditor, chatModels = [] }: IPublishDialogAiProps,
      ref: ForwardedRef<IPublishDialogAiRef>,
    ) => {
      const { t } = useTransClient('publish')
      const [activeAction, setActiveAction] = useState<AIAction | null>(null)
      const [messages, setMessages] = useState<Message[]>([])
      const [inputValue, setInputValue] = useState('')
      // Load custom prompts from localStorage
      const [customPrompts, setCustomPrompts] = useState<Record<string, string>>(() => {
        const saved = localStorage.getItem('ai_custom_prompts')
        return saved ? JSON.parse(saved) : {}
      })
      const [isProcessing, setIsProcessing] = useState(false)
      const [settingsVisible, setSettingsVisible] = useState(false)
      const [showRawContent, setShowRawContent] = useState<number | null>(null)
      const chatContainerRef = useRef<HTMLDivElement>(null)
      // Save syncToEditor reference to avoid circular dependencies
      const syncToEditorRef = useRef<((content: string, action?: AIAction) => Promise<void>) | null>(null)

      // Chat model state (for shorten/expand/polish/translate/hashtags)
      const [selectedChatModel, setSelectedChatModel] = useState(() => {
        const savedModel = localStorage.getItem('ai_chat_model')
        return savedModel || 'gpt-5.1-all'
      })

      // Image generation model state
      const [selectedImageModel, setSelectedImageModel] = useState(() => {
        const savedModel = localStorage.getItem('ai_image_model')
        return savedModel || 'gemini-2.5-flash-image'
      })

      // Video generation state
      const [videoModels, setVideoModels] = useState<any[]>([])
      const videoModelsLoadingRef = useRef(true) // Use ref to track loading state
      // Initialize from localStorage or use default 'sora-2'
      const [selectedVideoModel, setSelectedVideoModel] = useState(() => {
        const savedModel = localStorage.getItem('ai_video_model')
        return savedModel || 'sora-2'
      })
      const [videoTaskId, setVideoTaskId] = useState<string | null>(null)
      const [videoStatus, setVideoStatus] = useState<string>('')
      const [videoProgress, setVideoProgress] = useState(0)
      const [videoResult, setVideoResult] = useState<string | null>(null)
      
      // Image to image state
      const [uploadedImage, setUploadedImage] = useState<{ file: File; preview: string; ossUrl?: string; uploading?: boolean } | null>(null)

      // Auto-scroll to bottom
      useEffect(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
        }
      }, [messages])

      // Initialize chat and image models
      useEffect(() => {
        if (chatModels.length > 0) {
          // Check if current chat model exists in list
          const chatModelExists = chatModels.find((m: any) => m.name === selectedChatModel)
          if (!chatModelExists) {
            // Try to find default model
            const defaultModel = chatModels.find((m: any) => m.name === 'gpt-5.1-all')
            if (defaultModel) {
              setSelectedChatModel(defaultModel.name)
              localStorage.setItem('ai_chat_model', defaultModel.name)
            } else if (chatModels.length > 0) {
              // Use first model if default not found
              setSelectedChatModel(chatModels[0].name)
              localStorage.setItem('ai_chat_model', chatModels[0].name)
            }
          }

          // Check if current image model exists in list
          const imageModelExists = chatModels.find((m: any) => m.name === selectedImageModel)
          if (!imageModelExists) {
            // Try to find default model
            const defaultModel = chatModels.find((m: any) => m.name === 'gemini-2.5-flash-image')
            if (defaultModel) {
              setSelectedImageModel(defaultModel.name)
              localStorage.setItem('ai_image_model', defaultModel.name)
            } else if (chatModels.length > 0) {
              // Use first model if default not found
              setSelectedImageModel(chatModels[0].name)
              localStorage.setItem('ai_image_model', chatModels[0].name)
            }
          }
        }
      }, [chatModels])

      // Initialize video models
      useEffect(() => {
        const fetchVideoModels = async () => {
          try {
            videoModelsLoadingRef.current = true
            const res: any = await getVideoGenerationModels()
            if (res.data && Array.isArray(res.data)) {
              setVideoModels(res.data)
              
              // Read saved model from localStorage
              const savedModel = localStorage.getItem('ai_video_model')
              
              // Check if current model exists in list
              const currentModelExists = res.data.find((m: any) => m.name === selectedVideoModel)
              
              if (currentModelExists) {
                // Current model is valid, no update needed
              } else if (savedModel && res.data.find((m: any) => m.name === savedModel)) {
                // Use saved model if it exists in list
                setSelectedVideoModel(savedModel)
              } else {
                // Try to find sora-related model
                const soraModel = res.data.find((m: any) => 
                  m.name?.toLowerCase().includes('sora') || m.name === 'sora-2'
                )
                
                if (soraModel) {
                  // Prefer sora model
                  setSelectedVideoModel(soraModel.name)
                  localStorage.setItem('ai_video_model', soraModel.name)
                } else if (res.data.length > 0) {
                  // Use first model if no sora found
                  setSelectedVideoModel(res.data[0].name)
                  localStorage.setItem('ai_video_model', res.data[0].name)
                }
              }
            }
          } catch (error) {
            console.error('Failed to fetch video models:', error)
          } finally {
            videoModelsLoadingRef.current = false
          }
        }
        
        fetchVideoModels()
      }, []) // Only execute once on component mount

      // Poll video task status
      const pollVideoTaskStatus = useCallback(async (taskId: string) => {
        const checkStatus = async () => {
          try {
            const res: any = await getVideoTaskStatus(taskId)
            if (res.data) {
              const { status, fail_reason, progress, data } : any = res.data;
            //   {
            //     "task_id": "691d59a0cf8f85110ff2538d",
            //     "action": "",
            //     "status": "SUCCESS",
            //     "fail_reason": "ai/video/sora-2/68abbe6af812ccb3e1a53d68/691d59a0cf8f85110ff2538d.mp4",
            //     "submit_time": 1763531161,
            //     "start_time": 1763531161,
            //     "finish_time": 1763531405,
            //     "progress": "100%",
            //     "data": {
            //         "id": "video_1459b06c-e279-4765-8465-3040eec4e10a",
            //         "size": "720x1280",
            //         "model": "sora-2",
            //         "object": "video",
            //         "status": "completed",
            //         "seconds": "10",
            //         "progress": 100,
            //         "video_url": "ai/video/sora-2/68abbe6af812ccb3e1a53d68/691d59a0cf8f85110ff2538d.mp4",
            //         "created_at": 1763531162,
            //         "completed_at": 1763531339
            //     }
            // }
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
                let videoUrl = res.data?.data?.video_url || data?.video_url
                console.log('videoUrl', videoUrl)
                setVideoResult(videoUrl)
                setVideoProgress(100)
                
                // Update last message, embed video (using custom marker)
                setMessages(prev => {
                  const newMessages = [...prev]
                  if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'assistant') {
                    // Save original video URL to message for syncing
                    newMessages[newMessages.length - 1] = {
                      ...newMessages[newMessages.length - 1],
                      content: `${t('aiFeatures.videoReady' as any)}\n\n__VIDEO__${videoUrl}__VIDEO__`,
                    }
                  }
                  return newMessages
                })
                
                message.success(t('aiFeatures.videoGenerated' as any))
                setIsProcessing(false)
                return true
              }
              if (normalized === 'failed') {
                setVideoProgress(0)
                message.error(fail_reason || t('aiFeatures.videoFailed' as any))
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

      // Handle video generation
      const handleVideoGeneration = useCallback(async (prompt: string) => {
        // Wait for model list to load if still loading
        if (videoModelsLoadingRef.current) {
          message.loading({ content: t('aiFeatures.loadingVideoModels' as any), key: 'loadingModels', duration: 0 })
          
          // Poll to check if models loaded, max wait 30 seconds
          const maxWaitTime = 30000
          const checkInterval = 200
          let waited = 0
          
          while (videoModelsLoadingRef.current && waited < maxWaitTime) {
            await new Promise(resolve => setTimeout(resolve, checkInterval))
            waited += checkInterval
          }
          
          message.destroy('loadingModels')
          
          if (videoModelsLoadingRef.current) {
            message.error(t('aiFeatures.videoModelLoadTimeout' as any))
            return
          }
        }

        if (!selectedVideoModel) {
          message.error(t('aiFeatures.selectVideoModelFirst' as any))
          return
        }

        const selectedModel = videoModels.find((m: any) => m.name === selectedVideoModel)
        if (!selectedModel) {
          console.error('Video model unavailable:', selectedVideoModel, 'Available models:', videoModels.map(m => m.name))
          message.error(t('aiFeatures.videoModelUnavailable' as any, { model: selectedVideoModel }))
          return
        }

        try {
          setIsProcessing(true)
          setVideoStatus('submitted')
          setVideoProgress(10)

          // Add assistant message placeholder
          const placeholderMsg: Message = { role: 'assistant', content: t('aiFeatures.generatingVideo' as any), action: 'generateVideo' }
          setMessages(prev => [...prev, placeholderMsg])

          // Get first available resolution and duration
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

          // Use mode parameter for kling model
          if (selectedModel?.channel === 'kling') {
            data.mode = size
          } else {
            data.size = size
          }

          const res: any = await generateVideo(data)
          
          if (res?.data?.task_id) {
            setVideoTaskId(res.data.task_id)
            setVideoStatus(res.data.status)
            message.success(t('aiFeatures.videoTaskSubmitted' as any))
            pollVideoTaskStatus(res.data.task_id)
          } else {
            throw new Error(t('aiFeatures.videoGenerationFailed' as any))
          }
        } catch (error: any) {
          console.error('Video Generation Error:', error)
          setMessages(prev => prev.slice(0, -1))
          message.error(error.message || t('aiFeatures.videoGenerationFailed' as any))
          setVideoStatus('')
          setIsProcessing(false)
        }
      }, [selectedVideoModel, videoModels, pollVideoTaskStatus, t])


      // Handle AI response
      const handleAIResponse = useCallback(async (
        action: AIAction,
        apiMessages: Array<{ role: string, content: string | Array<any> }>,
      ) => {
        try {
          setIsProcessing(true)
          
          // Add assistant message placeholder
          const placeholderMsg: Message = { role: 'assistant', content: '', action }
          setMessages(prev => [...prev, placeholderMsg])

          // Select model based on action (use image model for both generateImage and imageToImage)
          const modelToUse = (action === 'generateImage' || action === 'imageToImage') ? selectedImageModel : selectedChatModel
          
          const response = await aiChatStream({ 
            messages: apiMessages as any,
            model: modelToUse
          })
          
          // Check response status
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          // Try to read JSON response
          const result = await response.json()
          
          if (result.code === 0 && result.data?.content) {
            // Optimize: convert base64 images to blob URLs to avoid storing large data causing input lag
            let processedContent = result.data.content
            
            // Find all base64 images and convert to blob URLs
            const base64Regex = /!\[([^\]]*)\]\((data:image\/[^;]+;base64,[^)]+)\)/g
            let match
            const replacements: Array<{ original: string; blobUrl: string }> = []
            
            while ((match = base64Regex.exec(result.data.content)) !== null) {
              const [fullMatch, alt, base64Url] = match
              try {
                // Extract base64 data
                const parts = base64Url.split(',')
                if (parts.length === 2) {
                  const mimeType = base64Url.match(/data:(.*?);/)?.[1] || 'image/png'
                  const base64Data = parts[1]
                  
                  // Convert to blob
                  const byteCharacters = atob(base64Data)
                  const byteNumbers = new Array(byteCharacters.length)
                  for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i)
                  }
                  const byteArray = new Uint8Array(byteNumbers)
                  const blob = new Blob([byteArray], { type: mimeType })
                  const blobUrl = URL.createObjectURL(blob)
                  
                  replacements.push({
                    original: fullMatch,
                    blobUrl: `![${alt}](${blobUrl})`
                  })
                }
              } catch (error) {
                console.error('Base64 to blob conversion failed:', error)
              }
            }
            
            // Execute all replacements
            replacements.forEach(({ original, blobUrl }) => {
              processedContent = processedContent.replace(original, blobUrl)
            })
            
            // Update last message
            setMessages(prev => {
              const newMessages = [...prev]
              newMessages[newMessages.length - 1] = {
                role: 'assistant',
                content: processedContent,
                action,
              }
              return newMessages
            })
            
            // Auto-sync to editor if hashtags generation (append mode)
            if (action === 'generateHashtags') {
              // Delay to let user see the result
              setTimeout(() => {
                if (syncToEditorRef.current) {
                  syncToEditorRef.current(processedContent, action)
                }
              }, 500)
            }
          } else {
            throw new Error(result.message || 'AI response failed')
          }

          setIsProcessing(false)
        } catch (error: any) {
          console.error('AI Response Error:', error)
          // Remove placeholder message
          setMessages(prev => prev.slice(0, -1))
          message.error(error.message || 'AI processing failed, please retry')
          setIsProcessing(false)
        }
      }, [selectedChatModel, selectedImageModel])

      // Handle action button click
      const handleActionClick = useCallback((action: AIAction) => {
        setActiveAction(action)
        // Clear uploaded image when switching to non-imageToImage actions
        if (action !== 'imageToImage') {
          setUploadedImage(null)
        }
      }, [])
      
      // Handle image upload for image-to-image
      const handleImageUpload = useCallback(async (file: File) => {
        try {
          // First create preview for display
          const reader = new FileReader()
          reader.onload = async (e) => {
            const preview = e.target?.result as string
            setUploadedImage({ file, preview, uploading: true })
            
            try {
              // Upload to OSS
              const ossKey = await uploadToOss(file)
              const ossUrl = `${OSS_URL}${ossKey}`
              
              // Update with OSS URL
              setUploadedImage({ file, preview, ossUrl, uploading: false })
              message.success(t('aiFeatures.imageUploadSuccess' as any))
            } catch (error) {
              console.error('Upload to OSS failed:', error)
              message.error(t('aiFeatures.imageUploadFailed' as any))
              setUploadedImage(null)
            }
          }
          reader.readAsDataURL(file)
        } catch (error) {
          console.error('Failed to read image:', error)
          message.error(t('aiFeatures.imageUploadFailed' as any))
        }
      }, [t])

      // 发送消息
      const sendMessage = useCallback(async (content?: string, forceAction?: AIAction) => {
        const messageContent = content || inputValue
        if (!messageContent.trim()) {
          message.warning(t('aiFeatures.selectText' as any))
          return
        }

        // Use passed action or current state action
        const currentAction = forceAction || activeAction

        // Check if image is required for imageToImage action
        if (currentAction === 'imageToImage' && !uploadedImage) {
          message.warning(t('aiFeatures.uploadImageFirst' as any))
          return
        }
        
        // Check if image is still uploading
        if (currentAction === 'imageToImage' && uploadedImage?.uploading) {
          message.warning(t('aiFeatures.imageUploading' as any))
          return
        }
        
        // Check if image has OSS URL
        if (currentAction === 'imageToImage' && uploadedImage && !uploadedImage.ossUrl) {
          message.error(t('aiFeatures.imageUploadFailed' as any))
          return
        }

        // Add user message
        const userMessage: Message = { role: 'user', content: messageContent, action: currentAction || undefined }
        setMessages(prev => [...prev, userMessage])

        // Call video generation directly if it's video generation
        if (currentAction === 'generateVideo') {
          await handleVideoGeneration(messageContent)
          setInputValue('')
          return
        }

        let systemPrompt = ''

        // Generate default system prompt based on selected action
        if (currentAction) {
          switch (currentAction) {
            case 'shorten':
              systemPrompt = t('aiFeatures.defaultPrompts.shorten' as any)
              break
            case 'expand':
              systemPrompt = t('aiFeatures.defaultPrompts.expand' as any)
              break
            case 'polish':
              systemPrompt = t('aiFeatures.defaultPrompts.polish' as any)
              break
            case 'translate':
              systemPrompt = t('aiFeatures.defaultPrompts.translate' as any)
              break
            case 'generateImage':
              systemPrompt = t('aiFeatures.defaultPrompts.generateImage' as any)
              break
            case 'imageToImage':
              systemPrompt = t('aiFeatures.defaultPrompts.imageToImage' as any)
              break
            case 'generateHashtags':
              systemPrompt = t('aiFeatures.defaultPrompts.generateHashtags' as any)
              break
          }
        }

        // Prepare API messages
        const apiMessages: Array<{ role: string, content: string | Array<any> }> = []
        
        // Add default system prompt if exists
        if (systemPrompt) {
          apiMessages.push({ role: 'system', content: systemPrompt })
        }
        
        // Add user custom system prompt if configured
        const userCustomPrompt = currentAction ? (customPrompts[currentAction] || '') : ''
        if (userCustomPrompt) {
          apiMessages.push({ role: 'system', content: userCustomPrompt })
        }
        
        // For imageToImage, add image data to user message
        if (currentAction === 'imageToImage' && uploadedImage && uploadedImage.ossUrl) {
          apiMessages.push({ 
            role: 'user', 
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: uploadedImage.ossUrl
                }
              },
              {
                type: 'text',
                text: messageContent
              }
            ]
          })
        } else {
          apiMessages.push({ role: 'user', content: messageContent })
        }

        // Call AI interface
        await handleAIResponse(currentAction || 'polish', apiMessages)

        // Clear input and uploaded image after successful processing
        setInputValue('')
        if (currentAction === 'imageToImage') {
          setUploadedImage(null)
        }
      }, [activeAction, inputValue, customPrompts, uploadedImage, handleAIResponse, handleVideoGeneration, t])

      // Download image from URL and convert to IImgFile object
      const downloadImageAsImgFile = async (url: string, index: number): Promise<IImgFile | null> => {
        try {
          let blob: Blob
          
          // If it's a blob URL
          if (url.startsWith('blob:')) {
            const response = await fetch(url)
            if (!response.ok) {
              throw new Error(`Cannot read blob: ${response.status}`)
            }
            blob = await response.blob()
          }
          // If it's base64 image, convert directly
          else if (url.startsWith('data:image/')) {
            if (!url.includes(',')) {
              throw new Error('Invalid base64 image format')
            }
            
            const parts = url.split(',')
            if (parts.length !== 2) {
              throw new Error('Base64 data format error')
            }
            
            const base64Data = parts[1]
            const mimeType = url.match(/data:(.*?);/)?.[1] || 'image/png'
            
            // Check if base64 data is valid
            if (!base64Data || base64Data.length < 100) {
              throw new Error('Base64 data too short or empty')
            }
            
            const byteCharacters = atob(base64Data)
            const byteNumbers = new Array(byteCharacters.length)
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i)
            }
            const byteArray = new Uint8Array(byteNumbers)
            blob = new Blob([byteArray], { type: mimeType })
          } 
          // Regular URL, need to download
          else {
            const response = await fetch(url)
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`)
            }
            blob = await response.blob()
          }
          
          const filename = `ai-generated-image-${index + 1}.png`
          
          // Use formatImg function to properly process image
          const imgFile = await formatImg({
            blob,
            path: filename,
          })
          
          return imgFile
        } catch (error) {
          console.error('Image processing failed:', error)
          message.error(t('aiFeatures.imageProcessingFailed' as any, { index: index + 1, error: error instanceof Error ? error.message : 'Unknown' }))
          return null
        }
      }

      // Create IVideoFile object from URL (no download, use generated URL directly)
      const downloadVideoAsVideoFile = async (url: string): Promise<IVideoFile | null> => {
        try {
          // Convert relative path to full S3 URL for publishing
          // API returns: ai/video/sora-2/...
          // Publishing expects: https://aitoearn.s3.ap-southeast-1.amazonaws.com/ai/video/...
          const ossUrl = `${OSS_URL}${url}`
          const filename = `ai-generated-video.mp4`
          
          // Extract video info using proxy URL for preview (only for VideoGrabFrame)
          const proxyUrl = getOssUrl(url)
          const videoInfo = await VideoGrabFrame(proxyUrl, 0)
          
          // Note: we don't create local blob, just use network URL
          const videoFile: IVideoFile = {
            filename,
            videoUrl: ossUrl, // Full S3 URL
            size: 0, // No download means no size, set to 0
            file: new Blob(), // Placeholder, not actually used
            ossUrl: ossUrl, // Full S3 URL for publishing API
            ...videoInfo,
          }
          
          return videoFile
        } catch (error) {
          console.error('Video processing failed:', error)
          message.error(t('aiFeatures.videoProcessingFailed' as any))
          return null
        }
      }

      // Sync to editor
      const syncToEditor = useCallback(async (content: string, action?: AIAction) => {
        if (onSyncToEditor) {
          // Extract all image URLs and video links
          const imageMatches = content.match(/!\[.*?\]\(([^)]+)\)/g) || []
          const linkMatches = content.match(/\[.*?\]\(([^)]+)\)/g) || []
          
          // Separate image and video links
          const imageUrls: string[] = []
          let videoUrl: string | null = null
          
          imageMatches.forEach(match => {
            const urlMatch = match.match(/!\[.*?\]\(([^)]+)\)/)
            const url = urlMatch ? urlMatch[1] : null
            if (url) {
              // Support regular URLs and base64 format images
              imageUrls.push(url)
            }
          })
          
          // Check for video links (support Markdown and pure URL formats)
          linkMatches.forEach(match => {
            const urlMatch = match.match(/\[.*?\]\(([^)]+)\)/)
            const url = urlMatch ? urlMatch[1] : null
            if (url && (url.includes('.mp4') || url.includes('.webm') || url.includes('video'))) {
              videoUrl = url
            }
          })
          
          // If no Markdown video link found, try to match custom marker
          if (!videoUrl) {
            const videoTagMatch = content.match(/__VIDEO__(.*?)__VIDEO__/)
            if (videoTagMatch) {
              videoUrl = videoTagMatch[1]
            }
          }
          
          // If still not found, try to match pure URL
          if (!videoUrl) {
            const urlRegex = /(https?:\/\/[^\s]+\.(mp4|webm)|https?:\/\/[^\s]*video[^\s]*)/gi
            const urlMatches = content.match(urlRegex)
            if (urlMatches && urlMatches.length > 0) {
              videoUrl = urlMatches[0]
            }
          }

          // Download images
          let imageFiles: IImgFile[] = []
          if (imageUrls.length > 0) {
            message.loading({ content: t('aiFeatures.downloadingImages' as any), key: 'downloadMedia' })
            const downloadPromises = imageUrls.map((url, index) => 
              downloadImageAsImgFile(url, index)
            )
            const results = await Promise.all(downloadPromises)
            imageFiles = results.filter((file): file is IImgFile => file !== null)
          }

          // Download video
          let videoFile: IVideoFile | undefined
          if (videoUrl) {
            message.loading({ content: t('aiFeatures.downloadingVideo' as any), key: 'downloadMedia' })
            videoFile = await downloadVideoAsVideoFile(videoUrl) || undefined
          }
          
          if (imageUrls.length > 0 || videoUrl) {
            message.destroy('downloadMedia')
          }

          // Remove images and video links from markdown, keep only text content
          let textContent = content
            .replace(/!\[.*?\]\([^)]+\)/g, '') // Remove images
            .replace(/\[视频链接\]\([^)]+\)/g, '') // Remove Markdown video links
            .replace(/\[.*?\]\([^)]+\.(mp4|webm)[^)]*\)/gi, '') // Remove Markdown format videos
            .replace(/__VIDEO__.*?__VIDEO__/g, '') // Remove custom video markers
          
          // Remove pure URL format video links
          if (videoUrl) {
            textContent = textContent.replace(videoUrl, '')
          }
          
          textContent = textContent.trim()

          // Determine if content should be appended (hashtags generation)
          const shouldAppend = action === 'generateHashtags'
          
          // If there's video, only sync video (don't update text)
          // If there are images, only sync images (don't update text)
          // If neither, sync text content
          if (videoFile) {
            onSyncToEditor('', [], videoFile, shouldAppend)
            message.success(t('aiFeatures.videoSynced' as any))
          } else if (imageFiles.length > 0) {
            onSyncToEditor('', imageFiles, undefined, shouldAppend)
            message.success(t('aiFeatures.imagesSynced' as any))
          } else {
            onSyncToEditor(textContent, [], undefined, shouldAppend)
            message.success(shouldAppend ? t('aiFeatures.hashtagsAppended' as any) : t('aiFeatures.syncSuccess' as any))
          }
        }
      }, [onSyncToEditor, t, downloadImageAsImgFile, downloadVideoAsVideoFile])

      // Update syncToEditor ref
      useEffect(() => {
        syncToEditorRef.current = syncToEditor
      }, [syncToEditor])

      // Expose methods to parent component
      useImperativeHandle(ref, () => ({
        processText: (text: string, action: AIAction) => {
          setActiveAction(action)
          setInputValue(text)
          // Auto-send immediately, pass action parameter to avoid async state issues
          setTimeout(() => {
            sendMessage(text, action) // Pass action parameter
          }, 50)
        },
        processImageToImage: (imageFile: File, prompt?: string) => {
          setActiveAction('imageToImage')
          handleImageUpload(imageFile)
          if (prompt) {
            setInputValue(prompt)
          }
        },
      }), [sendMessage, handleImageUpload])

      const actionButtons = [
        { action: 'shorten', icon: <CompressOutlined />, label: t('aiFeatures.shorten' as any) },
        { action: 'expand', icon: <ExpandOutlined />, label: t('aiFeatures.expand' as any) },
        { action: 'polish', icon: <EditOutlined />, label: t('aiFeatures.polish' as any) },
        { action: 'translate', icon: <TranslationOutlined />, label: t('aiFeatures.translate' as any) },
        { action: 'generateImage', icon: <PictureOutlined />, label: t('aiFeatures.generateImage' as any) },
        { action: 'imageToImage', icon: <PictureOutlined />, label: t('aiFeatures.imageToImage' as any) },
        { action: 'generateVideo', icon: <VideoCameraOutlined />, label: t('aiFeatures.generateVideo' as any) },
        { action: 'generateHashtags', icon: <TagsOutlined />, label: t('aiFeatures.generateHashtags' as any) },
      ]

      // Cache Markdown component config to avoid creating new objects on every render
      const markdownComponents = useMemo(() => ({
        img: ({ node, ...props }: any) => {
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
          
          // Check if it's an audio file
          if (/\.(aac|mp3|opus|wav)$/.test(href)) {
            return (
              <figure style={{ margin: '8px 0' }}>
                <audio controls src={href}></audio>
              </figure>
            )
          }
          
          // Check if it's a video file
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
          
          // Regular link
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
            {/* Chat messages area */}
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
                  {t('aiFeatures.emptyChat' as any)}
                </div>
              ) : (
                messages.map((msg, index) => (
                  <MessageItem
                    key={`${index}-${msg.content.substring(0, 20)}`}
                    msg={msg}
                    index={index}
                    showRawContent={showRawContent}
                    setShowRawContent={setShowRawContent}
                    syncToEditor={syncToEditor}
                    videoStatus={videoStatus}
                    videoProgress={videoProgress}
                    messagesLength={messages.length}
                    t={t}
                    markdownComponents={markdownComponents}
                  />
                ))
              )}
            </div>

            {/* Action buttons area */}
            <div style={{ position: 'relative' }}>
              {/* Image upload area for imageToImage - positioned above buttons */}
              {activeAction === 'imageToImage' && (
                <div style={{ 
                  position: 'absolute',
                  bottom: '100%',
                  left: '120px',
                  right: 0,
                  marginBottom: 10,
                  display: 'flex',
                  gap: 8,
                  flexWrap: 'wrap'
                }}>
                  {/* Uploaded image preview */}
                  {uploadedImage && (
                    <div style={{ 
                      position: 'relative', 
                      display: 'inline-block',
                      borderRadius: '8px',
                      overflow: 'hidden'
                    }}>
                      <img 
                        src={uploadedImage.preview} 
                        alt="Uploaded" 
                        style={{ 
                          width: '120px',
                          height: '80px', 
                          borderRadius: '8px',
                          display: 'block',
                          objectFit: 'cover',
                          opacity: uploadedImage.uploading ? 0.5 : 1
                        }} 
                      />
                      {uploadedImage.uploading && (
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)'
                        }}>
                          <Spin />
                        </div>
                      )}
                      {/* Close button */}
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<CloseCircleFilled />}
                        onClick={() => setUploadedImage(null)}
                        disabled={uploadedImage.uploading}
                        style={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          minWidth: 'auto',
                          padding: 0,
                          width: 20,
                          height: 20,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(0, 0, 0, 0.5)',
                          color: '#fff',
                          border: 'none'
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Upload box - show when no image */}
                  {!uploadedImage && (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleImageUpload(file)
                          }
                        }}
                        style={{ display: 'none' }}
                        id="imageToImageUpload"
                      />
                      <label 
                        htmlFor="imageToImageUpload" 
                        style={{ 
                          margin: 0,
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{
                          width: '120px',
                          height: '80px',
                          border: '2px dashed #d9d9d9',
                          borderRadius: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#fafafa',
                          transition: 'all 0.3s',
                          color: '#999'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#1890ff'
                          e.currentTarget.style.color = '#1890ff'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#d9d9d9'
                          e.currentTarget.style.color = '#999'
                        }}
                        >
                          <PictureOutlined style={{ fontSize: '24px', marginBottom: '4px' }} />
                          <span style={{ fontSize: '12px' }}>{t('aiFeatures.uploadImage' as any)}</span>
                        </div>
                      </label>
                    </>
                  )}
                </div>
              )}
              
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
                <Tooltip title={t('aiFeatures.settings' as any)}>
                  <Button
                    icon={<SettingOutlined />}
                    onClick={() => setSettingsVisible(true)}
                    size="small"
                  />
                </Tooltip>
              </div>
            </div>

            {/* Input area */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <Input.TextArea
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder={activeAction ? t('aiFeatures.inputPrompt' as any) : t('aiFeatures.emptyChat' as any)}
                rows={1}
                disabled={isProcessing}
                onPressEnter={(e) => {
                  if (e.shiftKey) return // Shift+Enter for new line
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

          {/* Settings modal */}
          <Modal
            title={t('aiFeatures.settings' as any)}
            open={settingsVisible}
            onCancel={() => setSettingsVisible(false)}
            footer={[
              <Button key="close" onClick={() => setSettingsVisible(false)}>
                {t('aiFeatures.close' as any)}
              </Button>,
            ]}
            width={700}
          >
            {/* Chat model selection */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8, fontWeight: 'bold' }}>
                <EditOutlined style={{ marginRight: 8 }} />
                {t('aiFeatures.chatModel' as any)}
              </div>
              <Select
                value={selectedChatModel}
                onChange={(value) => {
                  setSelectedChatModel(value)
                  localStorage.setItem('ai_chat_model', value)
                  message.success(t('aiFeatures.chatModelSaved' as any))
                }}
                style={{ width: '100%' }}
                placeholder={t('aiFeatures.selectChatModel' as any)}
                optionLabelProp="label"
              >
                {chatModels.map((model: any) => (
                  <Option 
                    key={model.name} 
                    value={model.name}
                    label={model.description || model.name}
                  >
                    <div style={{ padding: '4px 0' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{model.description}</div>
                      {model.description && (
                        <div style={{ fontSize: '12px', color: '#999', whiteSpace: 'normal', lineHeight: '1.4' }}>
                          {model.name}
                        </div>
                      )}
                    </div>
                  </Option>
                ))}
              </Select>
            </div>

            {/* Image generation model selection */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8, fontWeight: 'bold' }}>
                <PictureOutlined style={{ marginRight: 8 }} />
                {t('aiFeatures.imageModel' as any)}
              </div>
              <Select
                value={selectedImageModel}
                onChange={(value) => {
                  setSelectedImageModel(value)
                  localStorage.setItem('ai_image_model', value)
                  message.success(t('aiFeatures.imageModelSaved' as any))
                }}
                style={{ width: '100%' }}
                placeholder={t('aiFeatures.selectImageModel' as any)}
                optionLabelProp="label"
              >
                {chatModels.map((model: any) => (
                  <Option 
                    key={model.name} 
                    value={model.name}
                    label={model.description || model.name}
                  >
                    <div style={{ padding: '4px 0' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{model.description}</div>
                      {model.description && (
                        <div style={{ fontSize: '12px', color: '#999', whiteSpace: 'normal', lineHeight: '1.4' }}>
                          {model.name}
                        </div>
                      )}
                    </div>
                  </Option>
                ))}
              </Select>
            </div>

            {/* Video generation model selection */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8, fontWeight: 'bold' }}>
                <VideoCameraOutlined style={{ marginRight: 8 }} />
                {t('aiFeatures.videoModel' as any)}
              </div>
              <Select
                value={selectedVideoModel}
                onChange={(value) => {
                  setSelectedVideoModel(value)
                  localStorage.setItem('ai_video_model', value)
                  message.success(t('aiFeatures.videoModelSaved' as any))
                }}
                style={{ width: '100%' }}
                placeholder={t('aiFeatures.selectVideoModel' as any)}
                optionLabelProp="label"
              >
                {videoModels.map((model: any) => (
                  <Option 
                    key={model.name} 
                    value={model.name}
                    label={model.description || model.name}
                  >
                    <div style={{ padding: '4px 0' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{model.description}</div>
                      {model.description && (
                        <div style={{ fontSize: '12px', color: '#999', whiteSpace: 'normal', lineHeight: '1.4' }}>
                          {model.name}
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
                    <div>{t('aiFeatures.defaultDuration' as any)}: {duration}{t('aiFeatures.seconds' as any)}</div>
                    <div>{t('aiFeatures.defaultResolution' as any)}: {size}</div>
                  </div>
                )
              })()}
            </div>

            {/* Custom prompts editor */}
            <div style={{ marginTop: 24, borderTop: '1px solid #e8e8e8', paddingTop: 16 }}>
              <Collapse
                items={[
                  {
                    key: '1',
                    label: (
                      <div style={{ fontWeight: 'bold' }}>
                        <EditOutlined style={{ marginRight: 8 }} />
                        {t('aiFeatures.customPrompts.title' as any)}
                      </div>
                    ),
                    children: (
                      <div>
                        <div style={{ marginBottom: 12, fontSize: '12px', color: '#666' }}>
                          {t('aiFeatures.customPrompts.description' as any)}
                        </div>
                        
                        {/* Shorten */}
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ marginBottom: 4, fontWeight: 500, fontSize: '13px' }}>
                            <CompressOutlined style={{ marginRight: 4 }} />
                            {t('aiFeatures.shorten' as any)}
                          </div>
                          <Input.TextArea
                            value={customPrompts.shorten || ''}
                            onChange={(e) => {
                              const newPrompts = { ...customPrompts, shorten: e.target.value }
                              setCustomPrompts(newPrompts)
                              localStorage.setItem('ai_custom_prompts', JSON.stringify(newPrompts))
                            }}
                            placeholder={t('aiFeatures.customPrompts.placeholder' as any)}
                            rows={2}
                            style={{ fontSize: '12px' }}
                          />
                        </div>

                        {/* Expand */}
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ marginBottom: 4, fontWeight: 500, fontSize: '13px' }}>
                            <ExpandOutlined style={{ marginRight: 4 }} />
                            {t('aiFeatures.expand' as any)}
                          </div>
                          <Input.TextArea
                            value={customPrompts.expand || ''}
                            onChange={(e) => {
                              const newPrompts = { ...customPrompts, expand: e.target.value }
                              setCustomPrompts(newPrompts)
                              localStorage.setItem('ai_custom_prompts', JSON.stringify(newPrompts))
                            }}
                            placeholder={t('aiFeatures.customPrompts.placeholder' as any)}
                            rows={2}
                            style={{ fontSize: '12px' }}
                          />
                        </div>

                        {/* Polish */}
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ marginBottom: 4, fontWeight: 500, fontSize: '13px' }}>
                            <EditOutlined style={{ marginRight: 4 }} />
                            {t('aiFeatures.polish' as any)}
                          </div>
                          <Input.TextArea
                            value={customPrompts.polish || ''}
                            onChange={(e) => {
                              const newPrompts = { ...customPrompts, polish: e.target.value }
                              setCustomPrompts(newPrompts)
                              localStorage.setItem('ai_custom_prompts', JSON.stringify(newPrompts))
                            }}
                            placeholder={t('aiFeatures.customPrompts.placeholder' as any)}
                            rows={2}
                            style={{ fontSize: '12px' }}
                          />
                        </div>

                        {/* Translate */}
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ marginBottom: 4, fontWeight: 500, fontSize: '13px' }}>
                            <TranslationOutlined style={{ marginRight: 4 }} />
                            {t('aiFeatures.translate' as any)}
                          </div>
                          <Input.TextArea
                            value={customPrompts.translate || ''}
                            onChange={(e) => {
                              const newPrompts = { ...customPrompts, translate: e.target.value }
                              setCustomPrompts(newPrompts)
                              localStorage.setItem('ai_custom_prompts', JSON.stringify(newPrompts))
                            }}
                            placeholder={t('aiFeatures.customPrompts.placeholder' as any)}
                            rows={2}
                            style={{ fontSize: '12px' }}
                          />
                        </div>

                        {/* Generate Image */}
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ marginBottom: 4, fontWeight: 500, fontSize: '13px' }}>
                            <PictureOutlined style={{ marginRight: 4 }} />
                            {t('aiFeatures.generateImage' as any)}
                          </div>
                          <Input.TextArea
                            value={customPrompts.generateImage || ''}
                            onChange={(e) => {
                              const newPrompts = { ...customPrompts, generateImage: e.target.value }
                              setCustomPrompts(newPrompts)
                              localStorage.setItem('ai_custom_prompts', JSON.stringify(newPrompts))
                            }}
                            placeholder={t('aiFeatures.customPrompts.placeholder' as any)}
                            rows={2}
                            style={{ fontSize: '12px' }}
                          />
                        </div>

                        {/* Image to Image */}
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ marginBottom: 4, fontWeight: 500, fontSize: '13px' }}>
                            <PictureOutlined style={{ marginRight: 4 }} />
                            {t('aiFeatures.imageToImage' as any)}
                          </div>
                          <Input.TextArea
                            value={customPrompts.imageToImage || ''}
                            onChange={(e) => {
                              const newPrompts = { ...customPrompts, imageToImage: e.target.value }
                              setCustomPrompts(newPrompts)
                              localStorage.setItem('ai_custom_prompts', JSON.stringify(newPrompts))
                            }}
                            placeholder={t('aiFeatures.customPrompts.placeholder' as any)}
                            rows={2}
                            style={{ fontSize: '12px' }}
                          />
                        </div>

                        {/* Generate Video */}
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ marginBottom: 4, fontWeight: 500, fontSize: '13px' }}>
                            <VideoCameraOutlined style={{ marginRight: 4 }} />
                            {t('aiFeatures.generateVideo' as any)}
                          </div>
                          <Input.TextArea
                            value={customPrompts.generateVideo || ''}
                            onChange={(e) => {
                              const newPrompts = { ...customPrompts, generateVideo: e.target.value }
                              setCustomPrompts(newPrompts)
                              localStorage.setItem('ai_custom_prompts', JSON.stringify(newPrompts))
                            }}
                            placeholder={t('aiFeatures.customPrompts.placeholder' as any)}
                            rows={2}
                            style={{ fontSize: '12px' }}
                          />
                        </div>

                        {/* Generate Hashtags */}
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ marginBottom: 4, fontWeight: 500, fontSize: '13px' }}>
                            <TagsOutlined style={{ marginRight: 4 }} />
                            {t('aiFeatures.generateHashtags' as any)}
                          </div>
                          <Input.TextArea
                            value={customPrompts.generateHashtags || ''}
                            onChange={(e) => {
                              const newPrompts = { ...customPrompts, generateHashtags: e.target.value }
                              setCustomPrompts(newPrompts)
                              localStorage.setItem('ai_custom_prompts', JSON.stringify(newPrompts))
                            }}
                            placeholder={t('aiFeatures.customPrompts.placeholder' as any)}
                            rows={2}
                            style={{ fontSize: '12px' }}
                          />
                        </div>

                        <Button
                          type="link"
                          danger
                          size="small"
                          onClick={() => {
                            setCustomPrompts({})
                            localStorage.removeItem('ai_custom_prompts')
                            message.success(t('aiFeatures.customPrompts.clearSuccess' as any))
                          }}
                        >
                          {t('aiFeatures.customPrompts.clearAll' as any)}
                        </Button>
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          </Modal>
        </div>
      )
    },
  ),
)

export default PublishDialogAi
