/**
 * PublishDialogAi - 发布对话框 AI 助手
 * 提供 AI 文本处理、图片生成、视频生成等功能
 */
import type { ForwardedRef } from 'react'
import type { IImgFile, IVideoFile } from '@/components/PublishDialog/publishDialog.type'
import {
  Copy,
  Image,
  Languages,
  Loader2,
  Maximize2,
  Minimize2,
  Pencil,
  RefreshCw,
  Send,
  Settings,
  Tags,
  Video,
  XCircle,
} from 'lucide-react'
import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import ReactMarkdown from 'react-markdown'
import { aiChatStream, generateVideo, getVideoGenerationModels, getVideoTaskStatus } from '@/api/ai'
import { uploadToOss } from '@/api/oss'
import { useTransClient } from '@/app/i18n/client'
import { formatImg, VideoGrabFrame } from '@/components/PublishDialog/PublishDialog.util'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Modal } from '@/components/ui/modal'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { getOssUrl } from '@/utils/oss'

// Custom urlTransform to allow data: URLs (base64 images)
function urlTransform(url: string) {
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
  onSyncToEditor?: (
    content: string,
    images?: IImgFile[],
    video?: IVideoFile,
    append?: boolean,
  ) => void
  // Chat model list
  chatModels?: any[]
}

export type AIAction
  = | 'shorten'
    | 'expand'
    | 'polish'
    | 'translate'
    | 'generateImage'
    | 'generateVideo'
    | 'generateHashtags'
    | 'imageToImage'

interface Message {
  role: 'user' | 'assistant'
  content: string
  action?: AIAction
}

// Message item component - use memo to avoid unnecessary re-renders
const MessageItem = memo(
  ({
    msg,
    index,
    showRawContent,
    setShowRawContent,
    syncToEditor,
    videoStatus,
    videoProgress,
    messagesLength,
    t,
    markdownComponents,
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
            {textPart && <div className="mb-3">{textPart}</div>}
            <video
              src={fullVideoUrl}
              controls
              className="max-w-full max-h-[400px] rounded-lg block"
            />
          </>
        )
      }
      return null
    }

    return (
      <div
        key={index}
        className={cn('mb-4 flex flex-col', msg.role === 'user' ? 'items-end' : 'items-start')}
      >
        <div
          className={cn(
            'max-w-[85%] p-3 rounded-lg shadow-sm',
            msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted',
          )}
        >
          {msg.content ? (
            msg.role === 'assistant' ? (
              <>
                {msg.content.includes('__VIDEO__') ? (
                  processVideoContent(msg.content)
                ) : (
                  <ReactMarkdown urlTransform={urlTransform} components={markdownComponents}>
                    {msg.content}
                  </ReactMarkdown>
                )}
                {/* Show progress bar if it's a video generation message with progress */}
                {msg.action === 'generateVideo'
                  && videoStatus
                  && videoStatus !== 'completed'
                  && index === messagesLength - 1 && (
                  <div className="mt-2">
                    <Progress
                      value={videoProgress}
                      className={cn('h-2', videoStatus === 'failed' && 'bg-destructive')}
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      {videoStatus === 'submitted' && t('aiFeatures.taskSubmitted' as any)}
                      {videoStatus === 'processing' && t('aiFeatures.generatingStatus' as any)}
                      {videoStatus === 'failed' && t('aiFeatures.videoFailed' as any)}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="whitespace-pre-wrap">{msg.content}</div>
            )
          ) : (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
        </div>
        {msg.role === 'assistant' && msg.content && (
          <div className="mt-1 flex flex-col gap-2">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => syncToEditor(msg.content, msg.action)}
                className="cursor-pointer"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                {t('aiFeatures.syncToEditor' as any)}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(msg.content)
                  toast.success(t('aiFeatures.copied' as any))
                }}
                className="cursor-pointer"
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowRawContent(showRawContent === index ? null : index)}
                className="cursor-pointer"
              >
                {showRawContent === index
                  ? t('aiFeatures.hideRaw' as any)
                  : t('aiFeatures.showRaw' as any)}
              </Button>
            </div>
            {showRawContent === index && (
              <div className="bg-muted p-2 rounded text-xs max-h-[200px] overflow-y-auto break-all">
                <pre className="m-0 whitespace-pre-wrap">{msg.content}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    )
  },
  (prevProps, nextProps) => {
    // Only re-render when these properties change
    return (
      prevProps.msg.content === nextProps.msg.content
      && prevProps.showRawContent === nextProps.showRawContent
      && prevProps.videoStatus === nextProps.videoStatus
      && prevProps.videoProgress === nextProps.videoProgress
    )
  },
)

// AI-generated image component
const AIGeneratedImage = memo(
  ({ src, alt }: { src: string, alt?: string }) => {
    const { t } = useTransClient('publish')
    const [imageLoading, setImageLoading] = useState(true)
    const [imageError, setImageError] = useState(false)

    // Show error if no src
    if (!src) {
      return (
        <div className="p-2 bg-destructive/10 border border-destructive/20 rounded">
          {t('aiFeatures.imageMissing' as any)}
        </div>
      )
    }

    return (
      <div className="my-2 relative">
        {/* Loading placeholder */}
        {imageLoading && !imageError && (
          <div className="w-full min-w-[200px] h-[200px] bg-muted animate-pulse rounded flex items-center justify-center text-muted-foreground text-sm">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
        <img
          src={src}
          alt={alt || 'AI-generated image'}
          className={cn('max-w-full h-auto rounded', imageLoading ? 'hidden' : 'block')}
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
          <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
            {t('aiFeatures.imageLoadFailed' as any)}
          </div>
        )}
      </div>
    )
  },
  (prevProps, nextProps) => {
    // Only re-render when src or alt changes
    return prevProps.src === nextProps.src && prevProps.alt === nextProps.alt
  },
)

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
      const syncToEditorRef = useRef<
        ((content: string, action?: AIAction) => Promise<void>) | null
      >(null)

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
      // Initialize from localStorage, will be set from API if empty
      const [selectedVideoModel, setSelectedVideoModel] = useState(() => {
        const savedModel = localStorage.getItem('ai_video_model')
        return savedModel || ''
      })
      const [videoTaskId, setVideoTaskId] = useState<string | null>(null)
      const [videoStatus, setVideoStatus] = useState<string>('')
      const [videoProgress, setVideoProgress] = useState(0)
      const [videoResult, setVideoResult] = useState<string | null>(null)

      // Image to image state
      const [uploadedImage, setUploadedImage] = useState<{
        file: File
        preview: string
        ossUrl?: string
        uploading?: boolean
      } | null>(null)

      // Collapsible state for custom prompts
      const [customPromptsOpen, setCustomPromptsOpen] = useState(false)

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
            }
            else if (chatModels.length > 0) {
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
            }
            else if (chatModels.length > 0) {
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
              }
              else if (savedModel && res.data.find((m: any) => m.name === savedModel)) {
                // Use saved model if it exists in list
                setSelectedVideoModel(savedModel)
              }
              else if (res.data.length > 0) {
                // Use first available model
                setSelectedVideoModel(res.data[0].name)
                localStorage.setItem('ai_video_model', res.data[0].name)
              }
            }
          }
          catch (error) {
            console.error('Failed to fetch video models:', error)
          }
          finally {
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
              const { status, fail_reason, progress, data }: any = res.data
              const up = typeof status === 'string' ? status.toUpperCase() : ''
              const normalized
                = up === 'SUCCESS'
                  ? 'completed'
                  : up === 'FAILED'
                    ? 'failed'
                    : up === 'PROCESSING'
                      ? 'processing'
                      : up === 'NOT_START'
                        || up === 'NOT_STARTED'
                        || up === 'QUEUED'
                        || up === 'PENDING'
                        ? 'submitted'
                        : (status || '').toString().toLowerCase()
              setVideoStatus(normalized)

              let percent = 0
              if (typeof progress === 'string') {
                const m = progress.match(/(\d+)/)
                percent = m ? Number(m[1]) : 0
              }
              else if (typeof progress === 'number') {
                percent = progress > -1 ? Math.round(progress) : Math.round(progress * 100)
              }

              if (normalized === 'completed') {
                const videoUrl = res.data?.data?.video_url || data?.video_url
                console.log('videoUrl', videoUrl)
                setVideoResult(videoUrl)
                setVideoProgress(100)

                // Update last message, embed video (using custom marker)
                setMessages((prev) => {
                  const newMessages = [...prev]
                  if (
                    newMessages.length > 0
                    && newMessages[newMessages.length - 1].role === 'assistant'
                  ) {
                    // Save original video URL to message for syncing
                    newMessages[newMessages.length - 1] = {
                      ...newMessages[newMessages.length - 1],
                      content: `${t('aiFeatures.videoReady' as any)}\n\n__VIDEO__${videoUrl}__VIDEO__`,
                    }
                  }
                  return newMessages
                })

                toast.success(t('aiFeatures.videoGenerated' as any))
                setIsProcessing(false)
                return true
              }
              if (normalized === 'failed') {
                setVideoProgress(0)
                toast.error(fail_reason || t('aiFeatures.videoFailed' as any))
                setMessages(prev => prev.slice(0, -1))
                setIsProcessing(false)
                return true
              }
              setVideoProgress(percent)
              return false
            }
            return false
          }
          catch {
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
      const handleVideoGeneration = useCallback(
        async (prompt: string) => {
          // Wait for model list to load if still loading
          if (videoModelsLoadingRef.current) {
            toast.loading({
              content: t('aiFeatures.loadingVideoModels' as any),
              key: 'loadingModels',
              duration: 0,
            })

            // Poll to check if models loaded, max wait 30 seconds
            const maxWaitTime = 30000
            const checkInterval = 200
            let waited = 0

            while (videoModelsLoadingRef.current && waited < maxWaitTime) {
              await new Promise(resolve => setTimeout(resolve, checkInterval))
              waited += checkInterval
            }

            toast.dismiss('loadingModels')

            if (videoModelsLoadingRef.current) {
              toast.error(t('aiFeatures.videoModelLoadTimeout' as any))
              return
            }
          }

          if (!selectedVideoModel) {
            toast.error(t('aiFeatures.selectVideoModelFirst' as any))
            return
          }

          const selectedModel = videoModels.find((m: any) => m.name === selectedVideoModel)
          if (!selectedModel) {
            console.error(
              'Video model unavailable:',
              selectedVideoModel,
              'Available models:',
              videoModels.map(m => m.name),
            )
            toast.error(t('aiFeatures.videoModelUnavailable' as any, { model: selectedVideoModel }))
            return
          }

          try {
            setIsProcessing(true)
            setVideoStatus('submitted')
            setVideoProgress(10)

            // Add assistant message placeholder
            const placeholderMsg: Message = {
              role: 'assistant',
              content: t('aiFeatures.generatingVideo' as any),
              action: 'generateVideo',
            }
            setMessages(prev => [...prev, placeholderMsg])

            // Get first available resolution and duration
            let duration = 5
            let size = '720p'

            if (selectedModel?.durations?.length > 0)
              duration = selectedModel.durations[0]
            if (selectedModel?.resolutions?.length > 0)
              size = selectedModel.resolutions[0]

            const data: any = {
              model: selectedVideoModel,
              prompt,
              duration,
              size,
            }

            const res: any = await generateVideo(data)

            if (res?.data?.task_id) {
              setVideoTaskId(res.data.task_id)
              setVideoStatus(res.data.status)
              toast.success(t('aiFeatures.videoTaskSubmitted' as any))
              pollVideoTaskStatus(res.data.task_id)
            }
            else {
              throw new Error(t('aiFeatures.videoGenerationFailed' as any))
            }
          }
          catch (error: any) {
            console.error('Video Generation Error:', error)
            setMessages(prev => prev.slice(0, -1))
            toast.error(error.message || t('aiFeatures.videoGenerationFailed' as any))
            setVideoStatus('')
            setIsProcessing(false)
          }
        },
        [selectedVideoModel, videoModels, pollVideoTaskStatus, t],
      )

      // Handle AI response
      const handleAIResponse = useCallback(
        async (
          action: AIAction,
          apiMessages: Array<{ role: string, content: string | Array<any> }>,
        ) => {
          try {
            setIsProcessing(true)

            // Add assistant message placeholder
            const placeholderMsg: Message = { role: 'assistant', content: '', action }
            setMessages(prev => [...prev, placeholderMsg])

            // Select model based on action (use image model for both generateImage and imageToImage)
            const modelToUse
              = action === 'generateImage' || action === 'imageToImage'
                ? selectedImageModel
                : selectedChatModel

            const response = await aiChatStream({
              messages: apiMessages as any,
              model: modelToUse,
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
              const replacements: Array<{ original: string, blobUrl: string }> = []

              while ((match = base64Regex.exec(result.data.content)) !== null) { // eslint-disable-line no-cond-assign
                const [fullMatch, alt, base64Url] = match
                try {
                  // Extract base64 data
                  const parts = base64Url.split(',')
                  if (parts.length === 2) {
                    const mimeType = base64Url.match(/data:(.*?);/)?.[1] || 'image/png'
                    const base64Data = parts[1]

                    // Convert to blob
                    const byteCharacters = atob(base64Data)
                    const byteArray = Uint8Array.from(byteCharacters, c => c.charCodeAt(0))
                    const blob = new Blob([byteArray], { type: mimeType })
                    const blobUrl = URL.createObjectURL(blob)

                    replacements.push({
                      original: fullMatch,
                      blobUrl: `![${alt}](${blobUrl})`,
                    })
                  }
                }
                catch (error) {
                  console.error('Base64 to blob conversion failed:', error)
                }
              }

              // Execute all replacements
              replacements.forEach(({ original, blobUrl }) => {
                processedContent = processedContent.replace(original, blobUrl)
              })

              // Update last message
              setMessages((prev) => {
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
            }
            else {
              throw new Error(result.message || 'AI response failed')
            }

            setIsProcessing(false)
          }
          catch (error: any) {
            console.error('AI Response Error:', error)
            // Remove placeholder message
            setMessages(prev => prev.slice(0, -1))
            toast.error(error.message || 'AI processing failed, please retry')
            setIsProcessing(false)
          }
        },
        [selectedChatModel, selectedImageModel],
      )

      // Handle action button click
      const handleActionClick = useCallback((action: AIAction) => {
        setActiveAction(action)
        // Clear uploaded image when switching to non-imageToImage actions
        if (action !== 'imageToImage') {
          setUploadedImage(null)
        }
      }, [])

      // Handle image upload for image-to-image
      const handleImageUpload = useCallback(
        async (file: File) => {
          try {
            // First create preview for display
            const reader = new FileReader()
            reader.onload = async (e) => {
              const preview = e.target?.result as string
              setUploadedImage({ file, preview, uploading: true })

              try {
                // Upload to OSS
                const ossKey = await uploadToOss(file)
                const ossUrl = `${getOssUrl(ossKey)}`

                // Update with OSS URL
                setUploadedImage({ file, preview, ossUrl, uploading: false })
                toast.success(t('aiFeatures.imageUploadSuccess' as any))
              }
              catch (error) {
                console.error('Upload to OSS failed:', error)
                toast.error(t('aiFeatures.imageUploadFailed' as any))
                setUploadedImage(null)
              }
            }
            reader.readAsDataURL(file)
          }
          catch (error) {
            console.error('Failed to read image:', error)
            toast.error(t('aiFeatures.imageUploadFailed' as any))
          }
        },
        [t],
      )

      // 发送消息
      const sendMessage = useCallback(
        async (content?: string, forceAction?: AIAction) => {
          const messageContent = content || inputValue
          if (!messageContent.trim()) {
            toast.warning(t('aiFeatures.selectText' as any))
            return
          }

          // Use passed action or current state action
          const currentAction = forceAction || activeAction

          // Check if image is required for imageToImage action
          if (currentAction === 'imageToImage' && !uploadedImage) {
            toast.warning(t('aiFeatures.uploadImageFirst' as any))
            return
          }

          // Check if image is still uploading
          if (currentAction === 'imageToImage' && uploadedImage?.uploading) {
            toast.warning(t('aiFeatures.imageUploading' as any))
            return
          }

          // Check if image has OSS URL
          if (currentAction === 'imageToImage' && uploadedImage && !uploadedImage.ossUrl) {
            toast.error(t('aiFeatures.imageUploadFailed' as any))
            return
          }

          // Add user message
          const userMessage: Message = {
            role: 'user',
            content: messageContent,
            action: currentAction || undefined,
          }
          setMessages(prev => [...prev, userMessage])

          // Save uploaded image reference before clearing
          const savedUploadedImage = uploadedImage

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
          const userCustomPrompt = currentAction ? customPrompts[currentAction] || '' : ''
          if (userCustomPrompt) {
            apiMessages.push({ role: 'system', content: userCustomPrompt })
          }

          // For imageToImage, add image data to user message (use saved reference)
          if (currentAction === 'imageToImage' && savedUploadedImage && savedUploadedImage.ossUrl) {
            apiMessages.push({
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: {
                    url: savedUploadedImage.ossUrl,
                  },
                },
                {
                  type: 'text',
                  text: messageContent,
                },
              ],
            })
          }
          else {
            apiMessages.push({ role: 'user', content: messageContent })
          }

          // Clear input and uploaded image immediately
          setInputValue('')
          if (currentAction === 'imageToImage') {
            setUploadedImage(null)
            setActiveAction(null) // Clear active action after sending imageToImage
          }

          // Call AI interface
          await handleAIResponse(currentAction || 'polish', apiMessages)
        },
        [
          activeAction,
          inputValue,
          customPrompts,
          uploadedImage,
          handleAIResponse,
          handleVideoGeneration,
          t,
        ],
      )

      // Download image from URL and convert to IImgFile object
      const downloadImageAsImgFile = async (
        url: string,
        index: number,
      ): Promise<IImgFile | null> => {
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
            const byteArray = Uint8Array.from(byteCharacters, c => c.charCodeAt(0))
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
        }
        catch (error) {
          console.error('Image processing failed:', error)
          toast.error(
            t('aiFeatures.imageProcessingFailed' as any, {
              index: index + 1,
              error: error instanceof Error ? error.message : 'Unknown',
            }),
          )
          return null
        }
      }

      // Create IVideoFile object from URL (no download, use generated URL directly)
      const downloadVideoAsVideoFile = async (url: string): Promise<IVideoFile | null> => {
        try {
          // Convert relative path to full S3 URL for publishing
          // API returns: ai/video/{model}/...
          const ossUrl = `${getOssUrl(url)}`
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
            ossUrl, // Full S3 URL for publishing API
            ...videoInfo,
          }

          return videoFile
        }
        catch (error) {
          console.error('Video processing failed:', error)
          toast.error(t('aiFeatures.videoProcessingFailed' as any))
          return null
        }
      }

      // Sync to editor
      const syncToEditor = useCallback(
        async (content: string, action?: AIAction) => {
          if (onSyncToEditor) {
            // Extract all image URLs and video links
            const imageMatches = content.match(/!\[.*?\]\(([^)]+)\)/g) || []
            const linkMatches = content.match(/\[.*?\]\(([^)]+)\)/g) || []

            // Separate image and video links
            const imageUrls: string[] = []
            let videoUrl: string | null = null

            imageMatches.forEach((match) => {
              const urlMatch = match.match(/!\[.*?\]\(([^)]+)\)/)
              const url = urlMatch ? urlMatch[1] : null
              if (url) {
                // Support regular URLs and base64 format images
                imageUrls.push(url)
              }
            })

            // Check for video links (support Markdown and pure URL formats)
            linkMatches.forEach((match) => {
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
              const urlRegex = /(https?:\/\/\S+\.(mp4|webm)|https?:\/\/\S*video\S*)/gi
              const urlMatches = content.match(urlRegex)
              if (urlMatches && urlMatches.length > 0) {
                videoUrl = urlMatches[0]
              }
            }

            // Download images
            let imageFiles: IImgFile[] = []
            if (imageUrls.length > 0) {
              toast.loading({
                content: t('aiFeatures.downloadingImages' as any),
                key: 'downloadMedia',
              })
              const downloadPromises = imageUrls.map((url, index) =>
                downloadImageAsImgFile(url, index),
              )
              const results = await Promise.all(downloadPromises)
              imageFiles = results.filter((file): file is IImgFile => file !== null)
            }

            // Download video
            let videoFile: IVideoFile | undefined
            if (videoUrl) {
              toast.loading({
                content: t('aiFeatures.downloadingVideo' as any),
                key: 'downloadMedia',
              })
              videoFile = (await downloadVideoAsVideoFile(videoUrl)) || undefined
            }

            if (imageUrls.length > 0 || videoUrl) {
              toast.dismiss('downloadMedia')
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
              toast.success(t('aiFeatures.videoSynced' as any))
            }
            else if (imageFiles.length > 0) {
              onSyncToEditor('', imageFiles, undefined, shouldAppend)
              toast.success(t('aiFeatures.imagesSynced' as any))
            }
            else {
              onSyncToEditor(textContent, [], undefined, shouldAppend)
              toast.success(
                shouldAppend
                  ? t('aiFeatures.hashtagsAppended' as any)
                  : t('aiFeatures.syncSuccess' as any),
              )
            }
          }
        },
        [onSyncToEditor, t, downloadImageAsImgFile, downloadVideoAsVideoFile],
      )

      // Update syncToEditor ref
      useEffect(() => {
        syncToEditorRef.current = syncToEditor
      }, [syncToEditor])

      // Expose methods to parent component
      useImperativeHandle(
        ref,
        () => ({
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
        }),
        [sendMessage, handleImageUpload],
      )

      const actionButtons = [
        {
          action: 'shorten',
          icon: <Minimize2 className="h-4 w-4" />,
          label: t('aiFeatures.shorten' as any),
        },
        {
          action: 'expand',
          icon: <Maximize2 className="h-4 w-4" />,
          label: t('aiFeatures.expand' as any),
        },
        {
          action: 'polish',
          icon: <Pencil className="h-4 w-4" />,
          label: t('aiFeatures.polish' as any),
        },
        {
          action: 'translate',
          icon: <Languages className="h-4 w-4" />,
          label: t('aiFeatures.translate' as any),
        },
        {
          action: 'generateImage',
          icon: <Image className="h-4 w-4" />,
          label: t('aiFeatures.generateImage' as any),
        },
        {
          action: 'imageToImage',
          icon: <Image className="h-4 w-4" />,
          label: t('aiFeatures.imageToImage' as any),
        },
        {
          action: 'generateVideo',
          icon: <Video className="h-4 w-4" />,
          label: t('aiFeatures.generateVideo' as any),
        },
        {
          action: 'generateHashtags',
          icon: <Tags className="h-4 w-4" />,
          label: t('aiFeatures.generateHashtags' as any),
        },
      ]

      // Cache Markdown component config to avoid creating new objects on every render
      const markdownComponents = useMemo(
        () => ({
          img: ({ node, ...props }: any) => {
            return <AIGeneratedImage src={props.src || ''} alt={props.alt} />
          },
          p: ({ node, ...props }: any) => (
            <p {...props} className="my-1 leading-relaxed" dir="auto" />
          ),
          code: ({ node, inline, className, children, ...props }: any) => {
            return inline ? (
              <code className="bg-muted px-1.5 py-0.5 rounded text-[0.9em]" {...props}>
                {children}
              </code>
            ) : (
              <code
                className="block bg-muted p-3 rounded overflow-x-auto text-[0.9em] leading-relaxed"
                {...props}
              >
                {children}
              </code>
            )
          },
          a: ({ node, ...props }: any) => {
            const href = props.href || ''

            // Check if it's an audio file
            if (/\.(?:aac|mp3|opus|wav)$/.test(href)) {
              return (
                <figure className="my-2">
                  <audio controls src={href}></audio>
                </figure>
              )
            }

            // Check if it's a video file
            if (/\.(?:3gp|3g2|webm|ogv|mpeg|mp4|avi)$/.test(href) || href.includes('video')) {
              return (
                <div className="my-2">
                  <video controls className="max-w-full max-h-[400px] rounded-lg block">
                    <source src={getOssUrl(href)} />
                  </video>
                </div>
              )
            }

            // Regular link
            const isInternal = /^\/#/.test(href)
            const target = isInternal ? '_self' : (props.target ?? '_blank')
            return (
              <a
                {...props}
                target={target}
                className="text-primary underline"
                rel="noopener noreferrer"
              />
            )
          },
          ul: ({ node, ...props }: any) => <ul className="my-2 pl-5" {...props} />,
          ol: ({ node, ...props }: any) => <ol className="my-2 pl-5" {...props} />,
          li: ({ node, ...props }: any) => <li className="my-1" {...props} />,
          h1: ({ node, ...props }: any) => <h1 className="text-xl font-bold my-3" {...props} />,
          h2: ({ node, ...props }: any) => <h2 className="text-lg font-bold my-3" {...props} />,
          h3: ({ node, ...props }: any) => <h3 className="text-base font-bold my-2" {...props} />,
          blockquote: ({ node, ...props }: any) => (
            <blockquote
              className="border-l-[3px] border-border pl-3 my-2 text-muted-foreground"
              {...props}
            />
          ),
        }),
        [],
      )

      return (
        <div
          className="bg-background w-[380px] overflow-hidden rounded-lg flex flex-col z-10 mx-[15px] max-h-[calc(100vh-80px)]"
          id="publishDialogAi"
        >
          <h1 className="text-base font-semibold text-left px-[15px] pt-[15px] pb-0 flex justify-between flex-shrink-0">
            <span>{t('aiAssistant' as any)}</span>
            <XCircle className="h-5 w-5 cursor-pointer" onClick={onClose} />
          </h1>
          <div className="px-3 mt-3 flex flex-col flex-1 min-h-0">
            {/* Chat messages area */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto mb-3 p-3 bg-muted rounded-lg"
            >
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-10">
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
            <div className="relative">
              {/* Image upload area for imageToImage - positioned above buttons */}
              {activeAction === 'imageToImage' && (
                <div className="absolute bottom-full left-[120px] right-0 mb-2.5 flex gap-2 flex-wrap">
                  {/* Uploaded image preview */}
                  {uploadedImage && (
                    <div className="relative inline-block rounded-lg overflow-hidden">
                      <img
                        src={uploadedImage.preview}
                        alt="Uploaded"
                        className={cn(
                          'w-[120px] h-[80px] rounded-lg block object-cover',
                          uploadedImage.uploading && 'opacity-50',
                        )}
                      />
                      {uploadedImage.uploading && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                      )}
                      {/* Close button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setUploadedImage(null)}
                        disabled={uploadedImage.uploading}
                        className="absolute top-1 right-1 p-0 w-5 h-5 min-w-0 bg-black/50 text-white hover:bg-black/70 cursor-pointer"
                      >
                        <XCircle className="h-3 w-3" />
                      </Button>
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
                        className="hidden"
                        id="imageToImageUpload"
                      />
                      <label htmlFor="imageToImageUpload" className="m-0 cursor-pointer">
                        <div className="w-[120px] h-[80px] border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center bg-muted/50 transition-colors hover:border-primary hover:text-primary text-muted-foreground">
                          <Image className="h-6 w-6 mb-1" />
                          <span className="text-xs">{t('aiFeatures.uploadImage' as any)}</span>
                        </div>
                      </label>
                    </>
                  )}
                </div>
              )}

              <div className="flex gap-2 mb-2 p-2 bg-muted/50 rounded-lg justify-between items-center">
                <TooltipProvider>
                  <div className="flex gap-2 flex-1 flex-wrap">
                    {actionButtons.map(({ action, icon, label }) => (
                      <Tooltip key={action}>
                        <TooltipTrigger asChild>
                          <Button
                            variant={activeAction === action ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleActionClick(action as AIAction)}
                            className="cursor-pointer"
                          >
                            {icon}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{label}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSettingsVisible(true)}
                        className="cursor-pointer"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('aiFeatures.settings' as any)}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Input area */}
            <div className="flex gap-2 mb-3">
              <Textarea
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder={
                  activeAction
                    ? t('aiFeatures.inputPrompt' as any)
                    : t('aiFeatures.emptyChat' as any)
                }
                rows={1}
                disabled={isProcessing}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                className="flex-1 min-h-[36px] resize-none"
              />
              <Button
                onClick={() => sendMessage()}
                disabled={isProcessing}
                className="cursor-pointer"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Send className="h-4 w-4 mr-1" />
                )}
                {t('aiFeatures.send' as any)}
              </Button>
            </div>
          </div>

          {/* Settings modal */}
          <Modal
            title={t('aiFeatures.settings' as any)}
            open={settingsVisible}
            onCancel={() => setSettingsVisible(false)}
            footer={(
              <Button
                variant="outline"
                onClick={() => setSettingsVisible(false)}
                className="cursor-pointer"
              >
                {t('aiFeatures.close' as any)}
              </Button>
            )}
            width={700}
          >
            {/* Chat model selection */}
            <div className="mb-4">
              <div className="mb-2 font-bold flex items-center">
                <Pencil className="h-4 w-4 mr-2" />
                {t('aiFeatures.chatModel' as any)}
              </div>
              <Select
                value={selectedChatModel}
                onValueChange={(value) => {
                  setSelectedChatModel(value)
                  localStorage.setItem('ai_chat_model', value)
                  toast.success(t('aiFeatures.chatModelSaved' as any))
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('aiFeatures.selectChatModel' as any)} />
                </SelectTrigger>
                <SelectContent>
                  {chatModels.map((model: any) => (
                    <SelectItem key={model.name} value={model.name}>
                      <div className="py-1">
                        <div className="font-bold mb-1">{model.description}</div>
                        {model.description && (
                          <div className="text-xs text-muted-foreground">{model.name}</div>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Image generation model selection */}
            <div className="mb-4">
              <div className="mb-2 font-bold flex items-center">
                <Image className="h-4 w-4 mr-2" />
                {t('aiFeatures.imageModel' as any)}
              </div>
              <Select
                value={selectedImageModel}
                onValueChange={(value) => {
                  setSelectedImageModel(value)
                  localStorage.setItem('ai_image_model', value)
                  toast.success(t('aiFeatures.imageModelSaved' as any))
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('aiFeatures.selectImageModel' as any)} />
                </SelectTrigger>
                <SelectContent>
                  {chatModels.map((model: any) => (
                    <SelectItem key={model.name} value={model.name}>
                      <div className="py-1">
                        <div className="font-bold mb-1">{model.description}</div>
                        {model.description && (
                          <div className="text-xs text-muted-foreground">{model.name}</div>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Video generation model selection */}
            <div className="mb-4">
              <div className="mb-2 font-bold flex items-center">
                <Video className="h-4 w-4 mr-2" />
                {t('aiFeatures.videoModel' as any)}
              </div>
              <Select
                value={selectedVideoModel}
                onValueChange={(value) => {
                  setSelectedVideoModel(value)
                  localStorage.setItem('ai_video_model', value)
                  toast.success(t('aiFeatures.videoModelSaved' as any))
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('aiFeatures.selectVideoModel' as any)} />
                </SelectTrigger>
                <SelectContent>
                  {videoModels.map((model: any) => (
                    <SelectItem key={model.name} value={model.name}>
                      <div className="py-1">
                        <div className="font-bold mb-1">{model.description}</div>
                        {model.description && (
                          <div className="text-xs text-muted-foreground">{model.name}</div>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedVideoModel
                && (() => {
                  const model = videoModels.find((m: any) => m.name === selectedVideoModel)
                  if (!model)
                    return null

                  let duration = 5
                  let size = '720p'

                  if (model?.durations?.length > 0)
                    duration = model.durations[0]
                  if (model?.resolutions?.length > 0)
                    size = model.resolutions[0]

                  return (
                    <div className="mt-2 p-2 bg-muted rounded text-xs text-muted-foreground">
                      <div>
                        {t('aiFeatures.defaultDuration' as any)}
                        :
                        {duration}
                        {t('aiFeatures.seconds' as any)}
                      </div>
                      <div>
                        {t('aiFeatures.defaultResolution' as any)}
                        :
                        {size}
                      </div>
                    </div>
                  )
                })()}
            </div>

            {/* Custom prompts editor */}
            <div className="mt-6 border-t pt-4">
              <Collapsible open={customPromptsOpen} onOpenChange={setCustomPromptsOpen}>
                <CollapsibleTrigger className="w-full flex items-center justify-between font-bold cursor-pointer hover:text-primary transition-colors">
                  <div className="flex items-center">
                    <Pencil className="h-4 w-4 mr-2" />
                    {t('aiFeatures.customPrompts.title' as any)}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {customPromptsOpen ? '▼' : '▶'}
                  </span>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <div className="mb-3 text-xs text-muted-foreground">
                    {t('aiFeatures.customPrompts.description' as any)}
                  </div>

                  {/* Shorten */}
                  <div className="mb-4">
                    <div className="mb-1 font-medium text-sm flex items-center">
                      <Minimize2 className="h-3 w-3 mr-1" />
                      {t('aiFeatures.shorten' as any)}
                    </div>
                    <Textarea
                      value={customPrompts.shorten || ''}
                      onChange={(e) => {
                        const newPrompts = { ...customPrompts, shorten: e.target.value }
                        setCustomPrompts(newPrompts)
                        localStorage.setItem('ai_custom_prompts', JSON.stringify(newPrompts))
                      }}
                      placeholder={t('aiFeatures.customPrompts.placeholder' as any)}
                      rows={2}
                      className="text-xs"
                    />
                  </div>

                  {/* Expand */}
                  <div className="mb-4">
                    <div className="mb-1 font-medium text-sm flex items-center">
                      <Maximize2 className="h-3 w-3 mr-1" />
                      {t('aiFeatures.expand' as any)}
                    </div>
                    <Textarea
                      value={customPrompts.expand || ''}
                      onChange={(e) => {
                        const newPrompts = { ...customPrompts, expand: e.target.value }
                        setCustomPrompts(newPrompts)
                        localStorage.setItem('ai_custom_prompts', JSON.stringify(newPrompts))
                      }}
                      placeholder={t('aiFeatures.customPrompts.placeholder' as any)}
                      rows={2}
                      className="text-xs"
                    />
                  </div>

                  {/* Polish */}
                  <div className="mb-4">
                    <div className="mb-1 font-medium text-sm flex items-center">
                      <Pencil className="h-3 w-3 mr-1" />
                      {t('aiFeatures.polish' as any)}
                    </div>
                    <Textarea
                      value={customPrompts.polish || ''}
                      onChange={(e) => {
                        const newPrompts = { ...customPrompts, polish: e.target.value }
                        setCustomPrompts(newPrompts)
                        localStorage.setItem('ai_custom_prompts', JSON.stringify(newPrompts))
                      }}
                      placeholder={t('aiFeatures.customPrompts.placeholder' as any)}
                      rows={2}
                      className="text-xs"
                    />
                  </div>

                  {/* Translate */}
                  <div className="mb-4">
                    <div className="mb-1 font-medium text-sm flex items-center">
                      <Languages className="h-3 w-3 mr-1" />
                      {t('aiFeatures.translate' as any)}
                    </div>
                    <Textarea
                      value={customPrompts.translate || ''}
                      onChange={(e) => {
                        const newPrompts = { ...customPrompts, translate: e.target.value }
                        setCustomPrompts(newPrompts)
                        localStorage.setItem('ai_custom_prompts', JSON.stringify(newPrompts))
                      }}
                      placeholder={t('aiFeatures.customPrompts.placeholder' as any)}
                      rows={2}
                      className="text-xs"
                    />
                  </div>

                  {/* Generate Image */}
                  <div className="mb-4">
                    <div className="mb-1 font-medium text-sm flex items-center">
                      <Image className="h-3 w-3 mr-1" />
                      {t('aiFeatures.generateImage' as any)}
                    </div>
                    <Textarea
                      value={customPrompts.generateImage || ''}
                      onChange={(e) => {
                        const newPrompts = { ...customPrompts, generateImage: e.target.value }
                        setCustomPrompts(newPrompts)
                        localStorage.setItem('ai_custom_prompts', JSON.stringify(newPrompts))
                      }}
                      placeholder={t('aiFeatures.customPrompts.placeholder' as any)}
                      rows={2}
                      className="text-xs"
                    />
                  </div>

                  {/* Image to Image */}
                  <div className="mb-4">
                    <div className="mb-1 font-medium text-sm flex items-center">
                      <Image className="h-3 w-3 mr-1" />
                      {t('aiFeatures.imageToImage' as any)}
                    </div>
                    <Textarea
                      value={customPrompts.imageToImage || ''}
                      onChange={(e) => {
                        const newPrompts = { ...customPrompts, imageToImage: e.target.value }
                        setCustomPrompts(newPrompts)
                        localStorage.setItem('ai_custom_prompts', JSON.stringify(newPrompts))
                      }}
                      placeholder={t('aiFeatures.customPrompts.placeholder' as any)}
                      rows={2}
                      className="text-xs"
                    />
                  </div>

                  {/* Generate Video */}
                  <div className="mb-4">
                    <div className="mb-1 font-medium text-sm flex items-center">
                      <Video className="h-3 w-3 mr-1" />
                      {t('aiFeatures.generateVideo' as any)}
                    </div>
                    <Textarea
                      value={customPrompts.generateVideo || ''}
                      onChange={(e) => {
                        const newPrompts = { ...customPrompts, generateVideo: e.target.value }
                        setCustomPrompts(newPrompts)
                        localStorage.setItem('ai_custom_prompts', JSON.stringify(newPrompts))
                      }}
                      placeholder={t('aiFeatures.customPrompts.placeholder' as any)}
                      rows={2}
                      className="text-xs"
                    />
                  </div>

                  {/* Generate Hashtags */}
                  <div className="mb-4">
                    <div className="mb-1 font-medium text-sm flex items-center">
                      <Tags className="h-3 w-3 mr-1" />
                      {t('aiFeatures.generateHashtags' as any)}
                    </div>
                    <Textarea
                      value={customPrompts.generateHashtags || ''}
                      onChange={(e) => {
                        const newPrompts = { ...customPrompts, generateHashtags: e.target.value }
                        setCustomPrompts(newPrompts)
                        localStorage.setItem('ai_custom_prompts', JSON.stringify(newPrompts))
                      }}
                      placeholder={t('aiFeatures.customPrompts.placeholder' as any)}
                      rows={2}
                      className="text-xs"
                    />
                  </div>

                  <Button
                    variant="link"
                    size="sm"
                    className="text-destructive p-0 h-auto cursor-pointer"
                    onClick={() => {
                      setCustomPrompts({})
                      localStorage.removeItem('ai_custom_prompts')
                      toast.success(t('aiFeatures.customPrompts.clearSuccess' as any))
                    }}
                  >
                    {t('aiFeatures.customPrompts.clearAll' as any)}
                  </Button>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </Modal>
        </div>
      )
    },
  ),
)

export default PublishDialogAi
