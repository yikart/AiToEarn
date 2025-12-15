'use client'

import { 
  AndroidOutlined,
  BulbOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  StopOutlined,
  FieldTimeOutlined,
  ReloadOutlined,
} from '@ant-design/icons'

// next
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
// react
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
// npm
import ReactMarkdown from 'react-markdown'
import { QRCode } from 'react-qrcode-logo'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
// store
import { useUserStore } from '@/store/user'
import { useAccountStore } from '@/store/account'
import { usePluginStore, PluginStatusModal } from '@/store/plugin'
import { PluginStatus } from '@/store/plugin/types/baseTypes'
import type { PluginPublishItem } from '@/store/plugin/store'
// ui
import { message, Button, Modal, Progress } from 'antd'
// config
import { PubType } from '@/app/config/publishConfig'
import { AccountPlatInfoMap, PlatType } from '@/app/config/platConfig'
import { getMainAppDownloadUrlSync } from '../config/appDownloadConfig'
// components
import LoginModal from '@/components/LoginModal'
import PromptGallerySection from './components/PromptGallery'
// api
import { MediaType } from '@/api/agent'
import { apiCreateMaterial, apiGetMaterialGroupList } from '@/api/material'
// i18n
import { useTransClient } from '../i18n/client'
// utils
import { getOssUrl } from '@/utils/oss'

// Import SVG icons
import styles from './styles/difyHome.module.scss'

import gongzhonghao from '@/assets/images/gongzhonghao.jpg'
import publish1 from '@/assets/images/publish1.png'
import bilibiliIcon from '@/assets/svgs/plat/bilibili.svg'
import douyinIcon from '@/assets/svgs/plat/douyin.svg'
import FacebookIcon from '@/assets/svgs/plat/facebook.png'
import gongzhonghaoIcon from '@/assets/svgs/plat/gongzhonghao.png'
import InstagramIcon from '@/assets/svgs/plat/instagram.png'
import ksIcon from '@/assets/svgs/plat/ks.svg'
import LinkedInIcon from '@/assets/svgs/plat/linkedin.png'
import PinterestIcon from '@/assets/svgs/plat/pinterest.png'
import ThreadsIcon from '@/assets/svgs/plat/threads.png'
import tiktokIcon from '@/assets/svgs/plat/tiktok.svg'
import TwitterIcon from '@/assets/svgs/plat/twitter.png'
import wxSphIcon from '@/assets/svgs/plat/wx-sph.svg'
import xhsIcon from '@/assets/svgs/plat/xhs.svg'
import youtubeIcon from '@/assets/svgs/plat/youtube.png'

// External image URL constants
const IMAGE_URLS = {
  calendar: 'https://assets.aitoearn.ai/common/web/app-screenshot/1.%20content%20publish/calendar.jpeg',
  supportChannels: 'https://assets.aitoearn.ai/common/web/app-screenshot/1.%20content%20publish/support_channels.jpeg',
  hotspot: 'https://assets.aitoearn.ai/common/web/app-screenshot/2.%20content%20hotspot/hotspot.jpg',
  hotspot2: 'https://assets.aitoearn.ai/common/web/app-screenshot/2.%20content%20hotspot/hotspot2.jpeg',
  hotspot3: 'https://assets.aitoearn.ai/common/web/app-screenshot/2.%20content%20hotspot/hotspot3.jpeg',
  hotspot4: 'https://assets.aitoearn.ai/common/web/app-screenshot/2.%20content%20hotspot/hotspot4.jpeg',
  contentSearch: 'https://assets.aitoearn.ai/common/web/app-screenshot/3.%20content%20search/contentsearch.gif',
  contentSearch1: 'https://assets.aitoearn.ai/common/web/app-screenshot/3.%20content%20search/contentsearch1.jpeg',
  contentSearch2: 'https://assets.aitoearn.ai/common/web/app-screenshot/3.%20content%20search/contentsearch2.jpeg',
  contentSearch4: 'https://assets.aitoearn.ai/common/web/app-screenshot/3.%20content%20search/contentsearch4.jpeg',
  commentFilter: 'https://assets.aitoearn.ai/common/web/app-screenshot/4.%20comments%20search/commentfilter.jpeg',
  commentFilter2: 'https://assets.aitoearn.ai/common/web/app-screenshot/5.%20content%20engagement/commentfilter2.jpeg',
}

import logo from '@/assets/images/logo.png'
import jimengangent from '@/assets/images/jimengangent.jpeg'
import jimengshengtu from '@/assets/images/jimengshengtu.jpeg'
import jimengshengshipin from '@/assets/images/jimengshengshipin.jpeg'
import jimengshuziren from '@/assets/images/jimengshuziren.jpeg'
import jimengdongzuo from '@/assets/images/jimengdongzuo.jpeg'



// Release banner
function ReleaseBanner() {
  return (
    <div className={styles.releaseBanner}>
      <div
        className={styles.bannerContent}
        onClick={() => {
          window.location.href = '/accounts?showVip=true'
        }}
      >
        {/* <span className={styles.releaseTag}>{t('releaseBanner.tag')}</span> */}
        <span className={styles.releaseText}>Join Plus —
          
           Enjoy Unlimited Free Sora-2,
           <span style={{ color: '#FFD700', fontSize: '14px', fontWeight: 'bold', padding: '0 5px', fontStyle: 'italic' }}> 
            NEW
           </span>
            Nano Banana Pro !</span>
      </div>
    </div>
  )
}

// 加载动画组件（...动画）
function LoadingDots() {
  return (
    <span className={styles.loadingDots}>
      <span className={styles.dot}>.</span>
      <span className={styles.dot}>.</span>
      <span className={styles.dot}>.</span>
    </span>
  )
}

// 懒加载组件 - 当元素进入视口时才开始加载
function LazyLoadSection({ children }: { children: ReactNode }) {
  const [shouldLoad, setShouldLoad] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true)
            observer.disconnect()
          }
        })
      },
      {
        // 当元素距离视口 200px 时开始加载
        rootMargin: '200px',
      },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <div ref={sectionRef}>
      {shouldLoad ? children : <div style={{ minHeight: '400px' }} />}
    </div>
  )
}

// Hero main title section
function Hero({ promptToApply }: { promptToApply?: {prompt: string; image?: string} | null }) {
  const { t } = useTransClient('home')
  const { t: tLogin } = useTransClient('login')
  const router = useRouter()
  const { lng } = useParams()
  const { token, setToken, setUserInfo } = useUserStore()

  // Helper function to get image URL
  const getImageUrl = (img: any): string => {
    if (typeof img === 'string') return img
    if (img?.src) return img.src
    if (img?.default) return img.default
    return String(img)
  }

  // AI generation related states
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  // 从 sessionStorage 恢复 taskId，仅在当前会话中保存
  const [taskId, setTaskId] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('aiAgentTaskId') || ''
    }
    return ''
  })
  const [sessionId, setSessionId] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('aiAgentSessionId') || ''
    }
    return ''
  })
  const [uploadedImages, setUploadedImages] = useState<Array<{url: string, type: 'image' | 'video'}>>([]) // 上传的图片/视频
  const [isUploading, setIsUploading] = useState(false) // 上传状态
  const fileInputRef = useRef<HTMLInputElement>(null) // 文件输入框引用
  const [selectedMode, setSelectedMode] = useState<'agent' | 'image' | 'video' | 'draft' | 'publishbatch'>('agent') // 选中的模式
  const [streamingText, setStreamingText] = useState('') // 累积的流式文本
  const streamingTextRef = useRef('') // 流式文本的引用（避免闭包问题）
  const sseAbortRef = useRef<(() => void) | null>(null) // SSE 连接的 abort 函数引用
  
  // Login modal state
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  
  // Plugin modal state
  const [pluginModalOpen, setPluginModalOpen] = useState(false)
  const [highlightPlatform, setHighlightPlatform] = useState<string | null>(null)
  
  // 本次消费状态
  const [currentCost, setCurrentCost] = useState<number>(0)
  
  // 固定输入框状态
  const [showFixedInput, setShowFixedInput] = useState(false)
  const mainInputContainerRef = useRef<HTMLDivElement>(null)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const driverObjRef = useRef<ReturnType<typeof driver> | null>(null)

  // 监听主输入框是否在视口内 - 使用 IntersectionObserver 更可靠
  useEffect(() => {
    if (!mainInputContainerRef.current) {
      return
    }

    // 使用 IntersectionObserver 监听元素是否在视口内
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // entry.isIntersecting 为 true 表示元素在视口内，应该隐藏固定输入框
          // entry.isIntersecting 为 false 表示元素不在视口内，应该显示固定输入框
          const shouldShowFixed = !entry.isIntersecting
          
          console.log('[FixedInput] IntersectionObserver 触发 - isIntersecting:', entry.isIntersecting, 'shouldShowFixed:', shouldShowFixed)
          
          setShowFixedInput(shouldShowFixed)
        })
      },
      {
        // threshold: 0 表示元素任何部分进入或离开视口都会触发
        // rootMargin 可以扩展触发区域，负值表示提前触发
        threshold: 0,
        rootMargin: '0px',
      }
    )

    observer.observe(mainInputContainerRef.current)

    return () => {
      observer.disconnect()
    }
  }, [])

  // 初始化新手引导
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding')
    if (hasSeenOnboarding) return

    // 延迟一下显示，确保页面已完全加载且 textarea 已经渲染
    const timer = setTimeout(() => {
      const textarea = document.getElementById('ai-input-textarea')
      if (!textarea) return

      const driverObj = driver({
        showProgress: false,
        showButtons: ['next'],
        nextBtnText: t('aiGeneration.gotIt' as any),
        doneBtnText: t('aiGeneration.gotIt' as any),
        popoverOffset: 10,
        stagePadding: 4,
        stageRadius: 12,
        allowClose: true,
        smoothScroll: true,
        steps: [
          {
            element: '#ai-input-textarea',
            popover: {
              title: t('aiGeneration.onboardingTitle' as any),
              description: t('aiGeneration.onboardingDescription' as any),
              side: 'top',
              align: 'start',
              onPopoverRender: () => {
                // Popover 渲染后，更新按钮文本并添加点击事件
                setTimeout(() => {
                  const nextBtn = document.querySelector('.driver-popover-next-btn') as HTMLButtonElement
                  const doneBtn = document.querySelector('.driver-popover-done-btn') as HTMLButtonElement
                  const btn = nextBtn || doneBtn
                  if (btn) {
                    btn.textContent = t('aiGeneration.gotIt' as any)
                    // 添加点击事件监听器
                    const handleClick = (e: MouseEvent) => {
                      e.preventDefault()
                      e.stopPropagation()
                      driverObj.destroy()
                      localStorage.setItem('hasSeenOnboarding', 'true')
                      btn.removeEventListener('click', handleClick)
                    }
                    btn.addEventListener('click', handleClick)
                  }
                }, 50)
              },
            },
          },
        ],
        onNextClick: () => {
          // 点击按钮时关闭引导
          driverObj.destroy()
          localStorage.setItem('hasSeenOnboarding', 'true')
          return false // 阻止默认行为
        },
        onDestroyStarted: () => {
          localStorage.setItem('hasSeenOnboarding', 'true')
        },
        onDestroyed: () => {
          localStorage.setItem('hasSeenOnboarding', 'true')
        },
      })

      driverObjRef.current = driverObj
      driverObj.drive()
    }, 1000)

    return () => {
      clearTimeout(timer)
      if (driverObjRef.current) {
        driverObjRef.current.destroy()
      }
    }
  }, [])


  // 应用提示词（从 PromptGallery 触发）
  useEffect(() => {
    if (promptToApply) {
      setPrompt(promptToApply.prompt)
      // 如果有图片，添加到 uploadedImages
      if (promptToApply.image) {
        setUploadedImages([{ url: promptToApply.image, type: 'image' }])
      }
    }
  }, [promptToApply])
  
  // Message type definition
  type MessageItem = {
    type: 'status' | 'description' | 'error' | 'text' | 'markdown'
    content: string
    status?: string // Status type for rendering corresponding icon
    loading?: boolean // Whether to show loading animation (for media generation status)
  }
  
  const [completedMessages, setCompletedMessages] = useState<MessageItem[]>([]) // Completed messages
  const [currentTypingMsg, setCurrentTypingMsg] = useState<MessageItem | null>(null) // Current typing message
  const [displayedText, setDisplayedText] = useState('') // Currently displayed text
  const [pendingMessages, setPendingMessages] = useState<MessageItem[]>([]) // Pending message queue
  const progressContainerRef = useRef<HTMLDivElement>(null) // Progress container reference
  const markdownContainerRef = useRef<HTMLDivElement>(null) // Markdown container reference
  const [progress, setProgress] = useState(0) // Progress percentage 0-100
  const [markdownMessages, setMarkdownMessages] = useState<string[]>([]) // SSE markdown messages

  // Status display configuration (icons and text)
  const getStatusDisplay = (status: string) => {
    const statusConfig: Record<string, { icon: React.ReactNode; text: string; color?: string }> = {
      'THINKING': { 
        icon: <BulbOutlined style={{ marginRight: '8px', color: '#a66ae4' }} />, 
        text: t('aiGeneration.status.thinking' as any),
        color: '#a66ae4'
      },
      'WAITING': { 
        icon: <ClockCircleOutlined style={{ marginRight: '8px', color: '#b78ae9' }} />, 
        text: t('aiGeneration.status.waiting' as any),
        color: '#b78ae9'
      },
      'GENERATING_CONTENT': { 
        icon: <FileTextOutlined style={{ marginRight: '8px', color: '#a66ae4' }} />, 
        text: t('aiGeneration.status.generatingContent' as any),
        color: '#a66ae4'
      },
      'GENERATING_IMAGE': { 
        icon: <PictureOutlined style={{ marginRight: '8px', color: '#8b4fd9' }} />, 
        text: t('aiGeneration.status.generatingImage' as any),
        color: '#8b4fd9'
      },
      'GENERATING_VIDEO': { 
        icon: <VideoCameraOutlined style={{ marginRight: '8px', color: '#9558de' }} />, 
        text: t('aiGeneration.status.generatingVideo' as any),
        color: '#9558de'
      },
      'GENERATING_TEXT': { 
        icon: <EditOutlined style={{ marginRight: '8px', color: '#a66ae4' }} />, 
        text: t('aiGeneration.status.generatingText' as any),
        color: '#a66ae4'
      },
      'COMPLETED': { 
        icon: <CheckCircleOutlined style={{ marginRight: '8px', color: '#52c41a' }} />, 
        text: t('aiGeneration.status.completed' as any),
        color: '#52c41a'
      },
      'FAILED': { 
        icon: <CloseCircleOutlined style={{ marginRight: '8px', color: '#ff4d4f' }} />, 
        text: t('aiGeneration.status.failed' as any),
        color: '#ff4d4f'
      },
      'CANCELLED': { 
        icon: <StopOutlined style={{ marginRight: '8px', color: '#8c8c8c' }} />, 
        text: t('aiGeneration.status.cancelled' as any),
        color: '#8c8c8c'
      },
    }
    return statusConfig[status] || { icon: null, text: status, color: '#333' }
  }

  // Calculate progress (receives current progress as parameter to avoid closure issues)
  const calculateProgress = (status: string, isNewStatus: boolean, currentProgress: number) => {
    const baseProgress: Record<string, number> = {
      'THINKING': 10,
      'WAITING': 20,
      'GENERATING_CONTENT': 30,
      'GENERATING_TEXT': 40,
      'GENERATING_IMAGE': 50,
      'GENERATING_VIDEO': 60,
      'COMPLETED': 100,
    }

    // If in generating status (not first time), increase by 5%
    const generatingStatuses = ['GENERATING_CONTENT', 'GENERATING_IMAGE', 'GENERATING_VIDEO', 'GENERATING_TEXT']
    
    if (generatingStatuses.includes(status) && !isNewStatus) {
      // Increase 5% each polling, but not exceed 99%
      return Math.min(currentProgress + 5, 99)
    }

    // For new status, take max of current progress and base progress (ensure progress only increases)
    if (isNewStatus) {
      const targetProgress = baseProgress[status]
      if (targetProgress !== undefined) {
        return Math.max(currentProgress, targetProgress)
      }
    }

    return currentProgress
  }

  // Add new message to queue
  const addMessageToQueue = (msg: MessageItem) => {
    setPendingMessages(prev => [...prev, msg])
  }

  // Typewriter effect - process message queue
  useEffect(() => {
    // If no current typing message and queue has pending messages
    if (!currentTypingMsg && pendingMessages.length > 0) {
      const nextMsg = pendingMessages[0]
      setCurrentTypingMsg(nextMsg)
      setDisplayedText('')
      setPendingMessages(prev => prev.slice(1))
    }
  }, [currentTypingMsg, pendingMessages])

  // Typewriter effect - display character by character
  useEffect(() => {
    if (currentTypingMsg && displayedText.length < currentTypingMsg.content.length) {
      const timer = setTimeout(() => {
        setDisplayedText(currentTypingMsg.content.slice(0, displayedText.length + 1))
      }, 80) // Typing speed 80ms per character

      return () => clearTimeout(timer)
    } 
    // Current message finished typing
    else if (currentTypingMsg && displayedText.length >= currentTypingMsg.content.length) {
      const timer = setTimeout(() => {
        // Move current message to completed list
        setCompletedMessages(prev => [...prev, currentTypingMsg])
        setCurrentTypingMsg(null)
        setDisplayedText('')
      }, 200) // Wait 200ms before next message

      return () => clearTimeout(timer)
    }
  }, [currentTypingMsg, displayedText])

  // Auto scroll to bottom - progress container
  useEffect(() => {
    if (progressContainerRef.current) {
      progressContainerRef.current.scrollTop = progressContainerRef.current.scrollHeight
    }
  }, [completedMessages, displayedText])

  // Auto scroll to bottom - markdown container
  useEffect(() => {
    if (markdownContainerRef.current && markdownMessages.length > 0) {
      markdownContainerRef.current.scrollTop = markdownContainerRef.current.scrollHeight
    }
  }, [markdownMessages])

  // Handle image/video upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    try {
      // 动态导入
      const { uploadToOss } = await import('@/api/oss')
      const { OSS_URL } = await import('@/constant')
      
      // 并行上传所有文件
      const uploadPromises = Array.from(files).map(async (file) => {
        const ossKey = await uploadToOss(file)
        const ossUrl = `${OSS_URL}${ossKey}`
        
        // 判断文件类型
        const fileType = file.type.startsWith('video/') ? 'video' : 'image'
        
        return { url: ossUrl, type: fileType as 'image' | 'video' }
      })
      
      // 等待所有上传完成，得到完整的OSS URL
      const uploadedFiles = await Promise.all(uploadPromises)
      
      console.log('上传成功的文件:', uploadedFiles)
      
      // 添加到已上传文件列表
      setUploadedImages(prev => [...prev, ...uploadedFiles])
      message.success(t('aiGeneration.uploadSuccess' as any))
      
    } catch (error) {
      console.error('File upload failed:', error)
      message.error(t('aiGeneration.uploadFailed' as any))
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Remove uploaded image
  const handleRemoveImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
  }

  // Handle login success - continue with task creation
  const handleLoginSuccess = () => {
    handleCreateTask()
  }

  // Stop AI generation task - 前端打断，不调用后台接口
  const handleStopTask = () => {
    // 调用保存的 abort 函数来中断 SSE 连接
    if (sseAbortRef.current) {
      console.log('[UI] Aborting SSE connection')
      sseAbortRef.current()
      sseAbortRef.current = null
    }
    
    // 设置为非生成状态，但不清空已生成的内容
    setIsGenerating(false)
    setProgress(0)
    
    // 添加停止消息提示
    addMessageToQueue({
      type: 'status',
      content: t('aiGeneration.status.cancelled' as any),
      status: 'CANCELLED'
    })
    
    message.info(t('aiGeneration.taskStopped' as any))
  }

  // 开启新对话
  const handleNewConversation = () => {
    if (isGenerating) {
      message.warning(t('aiGeneration.generatingWarning' as any))
      return
    }
    
    // 清除 state 和 sessionStorage 中的 taskId
    setTaskId('')
    setSessionId('')
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('aiAgentTaskId')
      sessionStorage.removeItem('aiAgentSessionId')
    }
    setMarkdownMessages([])
    setStreamingText('')
    streamingTextRef.current = ''
    setPrompt('')
    message.success(t('aiGeneration.newConversation' as any))
  }

  // Create AI generation task with SSE
  const handleCreateTask = async () => { 
    console.log('handleCreateTask')
    // test 00.00
    // let resultMsg = {"type":"result","message":{"type":"result","subtype":"success","uuid":"64e76d3a-e9f4-492d-84b2-cb196adb4fec","duration_ms":20935,"duration_api_ms":34158,"is_error":false,"num_turns":2,"message":"完成！✅\n\n系统现在会引导您：\n\n1️⃣ **绑定小红书账号** - 请按照页面提示完成小红书账号的绑定授权\n\n2️⃣ **确认发布信息** - 绑定成功后，您会看到已经为您准备好的：\n - 📸 复古宣传海报图片\n - 📝 标题：🔥惊爆价9.9元！GPT最新AI绘画服务震撼来袭\n - ✍️ 完整的推广文案\n - 🏷️ 话题标签：#AI绘画 #设计神器 #限时优惠 等\n\n3️⃣ **一键发布** - 确认无误后即可发布到小红书！\n\n所有内容都已经为您准备就绪，只需完成账号绑定就可以发布了！🎉",
    //   "result":{
    //     "taskId":"693b97aa6259a321fae5f9ff",
    //     "medias":[{"type":"IMAGE","url":"https://aitoearn.s3.ap-southeast-1.amazonaws.com/ai/images/gemini-3-pro-image-preview/68af1bd086d40b6d30173e43/mj2cyn9w.jpg","prompt":"Retro propaganda poster style GPT AI image generation service advertisement with beautiful young woman, red and yellow radiating background, Chinese text promoting 9.9 yuan service"}],
    //     "type":"fullContent",
    //     "title":"GPT最新AI绘画服务震撼来袭",
    //     "description":"💥超值福利来啦！GPT最新AI绘画服务，惊爆价仅需9.9元/张！\n\n✨服务亮点：\n📌 适用各种场景 - 海报、插画、产品图，想画就画\n📌 图像融合 + 局部重绘 - 专业级效果随心调整\n📌 每张提交3次修改 - 直到您满意为止\n📌 AI直出效果 - 无需修改即可使用\n\n🎯 有意向的宝子们，点击右下角\"我想要\"立即体验！\n\n机会难得，名额有限，快来抢购吧！💖",
    //     "tags":["AI绘画","设计神器","限时优惠","平面设计","创意工具"],
    //     "action":"navigateToPublish",
    //     "platform":"douyin",
    //     "errorMessage":"需要先绑定小红书账号才能发布内容"},
    //     "total_cost_usd":0.2353334,"usage":{"cache_creation":{"ephemeral_1h_input_tokens":0,"ephemeral_5m_input_tokens":57188},"cache_creation_input_tokens":57188,"cache_read_input_tokens":3708,"input_tokens":8,"output_tokens":883,"server_tool_use":{"web_search_requests":0}},"permission_denials":[]}}    
    //     const taskData = resultMsg.message.result
    //     const action = taskData.action

    // if (action === 'navigateToPublish') {
    //   const platform = taskData.platform
      
    //   // 对于 xhs 和 douyin，使用插件授权逻辑
    //   if (platform === 'xhs' || platform === 'douyin') {
    //     console.log('createChannel xhs or douyin')
    //     // 检查插件状态
    //     const pluginStatus = usePluginStore.getState().status
    //     const isPluginReady = pluginStatus === PluginStatus.READY
        
    //     if (!isPluginReady) {
    //       // 插件未准备就绪，显示引导授权插件
    //       message.warning(t('plugin.platformNeedsPlugin' as any))
          
    //       // 延迟显示引导，确保页面已加载
    //       setTimeout(() => {
    //         const pluginButton = document.querySelector('[data-driver-target="plugin-button"]') as HTMLElement
    //         if (!pluginButton) {
    //           console.warn('Plugin button not found')
    //           return
    //         }

    //         const driverObj = driver({
    //           showProgress: false,
    //           showButtons: ['next'],
    //           nextBtnText: t('aiGeneration.gotIt' as any),
    //           doneBtnText: t('aiGeneration.gotIt' as any),
    //           popoverOffset: 10,
    //           stagePadding: 4,
    //           stageRadius: 12,
    //           allowClose: true,
    //           smoothScroll: true,
    //           steps: [
    //             {
    //               element: '[data-driver-target="plugin-button"]',
    //               popover: {
    //                 title: t('plugin.authorizePluginTitle' as any),
    //                 description: t('plugin.authorizePluginDescription' as any),
    //                 side: 'bottom',
    //                 align: 'start',
    //                 onPopoverRender: () => {
    //                   setTimeout(() => {
    //                     const nextBtn = document.querySelector('.driver-popover-next-btn') as HTMLButtonElement
    //                     const doneBtn = document.querySelector('.driver-popover-done-btn') as HTMLButtonElement
    //                     const btn = nextBtn || doneBtn
    //                     if (btn) {
    //                       btn.textContent = t('aiGeneration.gotIt' as any)
    //                       const handleClick = (e: MouseEvent) => {
    //                         e.preventDefault()
    //                         e.stopPropagation()
    //                         driverObj.destroy()
    //                         btn.removeEventListener('click', handleClick)
    //                       }
    //                       btn.addEventListener('click', handleClick)
    //                     }
    //                   }, 50)
    //                 },
    //               },
    //             },
    //           ],
    //           onNextClick: () => {
    //             driverObj.destroy()
    //             return false
    //           },
    //         })

    //         driverObj.drive()
    //       }, 1500)
    //     } else {
    //       // 插件已准备就绪，直接调用插件发布方法
    //       try {
    //         // 获取账号列表
    //         const accountGroupList = useAccountStore.getState().accountGroupList
    //         const allAccounts = accountGroupList.reduce<any[]>((acc, group) => {
    //           return [...acc, ...group.children]
    //         }, [])
            
    //         // 根据 taskData 中的平台类型查找账号
    //         const targetAccounts = allAccounts.filter(account => account.type === platform)
            
    //         if (targetAccounts.length === 0) {
    //           // 未找到账号，弹出确认框并引导用户添加账号
    //           Modal.confirm({
    //             title: t('plugin.noAccountFound' as any),
    //             content: '未查询到该平台的有效账号，请打开插件添加账号并完成同步',
    //             okText: '去处理',
    //             cancelText: '取消',
    //             onOk: () => {
    //               // 延迟显示引导，确保页面已加载
    //               setTimeout(() => {
    //                 const pluginButton = document.querySelector('[data-driver-target="plugin-button"]') as HTMLElement
    //                 if (!pluginButton) {
    //                   console.warn('Plugin button not found')
    //                   return
    //                 }

    //                 const driverObj = driver({
    //                   showProgress: false,
    //                   showButtons: ['next'],
    //                   nextBtnText: t('aiGeneration.gotIt' as any),
    //                   doneBtnText: t('aiGeneration.gotIt' as any),
    //                   popoverOffset: 10,
    //                   stagePadding: 4,
    //                   stageRadius: 12,
    //                   allowClose: true,
    //                   smoothScroll: true,
    //                   steps: [
    //                     {
    //                       element: '[data-driver-target="plugin-button"]',
    //                       popover: {
    //                         title: '点击打开插件管理',
    //                         description: '在插件管理中添加您的账号',
    //                         side: 'bottom',
    //                         align: 'start',
    //                         onPopoverRender: () => {
    //                           setTimeout(() => {
    //                             const nextBtn = document.querySelector('.driver-popover-next-btn') as HTMLButtonElement
    //                             const doneBtn = document.querySelector('.driver-popover-done-btn') as HTMLButtonElement
    //                             const btn = nextBtn || doneBtn
    //                             if (btn) {
    //                               btn.textContent = t('aiGeneration.gotIt' as any)
    //                               const handleClick = (e: MouseEvent) => {
    //                                 e.preventDefault()
    //                                 e.stopPropagation()
    //                                 driverObj.destroy()
    //                                 btn.removeEventListener('click', handleClick)
    //                                 // 点击后打开插件弹窗，并高亮对应平台
    //                                 pluginButton.click()
    //                                 // 设置高亮平台
    //                                 setTimeout(() => {
    //                                   setHighlightPlatform(platform)
    //                                 }, 300)
    //                               }
    //                               btn.addEventListener('click', handleClick)
    //                             }
    //                           }, 50)
    //                         },
    //                       },
    //                     },
    //                   ],
    //                   onNextClick: () => {
    //                     driverObj.destroy()
    //                     return false
    //                   },
    //                 })

    //                 driverObj.drive()
    //               }, 500)
    //             },
    //           })
    //           return
    //         }
            
    //         // 构建发布数据
    //         const medias = taskData.medias || []
    //         const hasVideo = medias.some((m: any) => m.type === 'VIDEO')
    //         const video = hasVideo ? medias.find((m: any) => m.type === 'VIDEO') : null
    //         // 创建空的 File 对象作为占位符
    //         const createEmptyFile = () => {
    //           return new File([], '', { type: 'image/jpeg' })
    //         }
            
    //         const images = medias.filter((m: any) => m.type === 'IMAGE').map((m: any) => ({ 
    //           id: '',
    //           imgPath: m.url,
    //           ossUrl: m.url,
    //           size: 0,
    //           // file: createEmptyFile(),
    //           imgUrl: m.url,
    //           filename: '',
    //           width: 0,
    //           height: 0,
    //         }))
            
    //         // 为每个账号创建发布项
    //         // @ts-ignore
    //         const pluginPublishItems: PluginPublishItem[] = targetAccounts.map(account => ({
    //           account,
    //           params: {
    //             title: taskData.title || '',
    //             des: taskData.description || '',
    //             topics: taskData.tags || [],
    //             video: video ? {
    //               size: 0,
    //               videoUrl: video.url,
    //               ossUrl: video.url,
    //               filename: '',
    //               width: 0,
    //               height: 0,
    //               duration: 0,
    //               cover: {
    //                 id: '',
    //                 imgPath: (video as any).coverUrl || '',
    //                 ossUrl: (video as any).coverUrl,
    //                 size: 0,
    //                 imgUrl: (video as any).coverUrl || '',
    //                 filename: '',
    //                 width: 0,
    //                 height: 0,
    //               },
    //             } : undefined,
    //             images: images.length > 0 ? images : undefined,
    //             option: {},
    //           },
    //         }))
            
    //         // 创建平台任务ID映射
    //         const platformTaskIdMap = new Map<string, string>()
    //         pluginPublishItems.forEach((item) => {
    //           const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    //           platformTaskIdMap.set(item.account.id, requestId)
    //         })
            
    //         // 调用插件发布方法
    //         usePluginStore.getState().executePluginPublish({
    //           items: pluginPublishItems,
    //           platformTaskIdMap,
    //           onProgress: (event) => {
    //             // 监听各平台发布进度
    //             const { stage, progress, message: progressMessage, accountId, platform } = event
    //             console.log(`[${platform}] 账号 ${accountId}: ${stage} - ${progress}% - ${progressMessage}`)

    //             // 根据进度阶段显示不同提示
    //             if (stage === 'error') {
    //               message.error(progressMessage)
    //             }
    //           },
    //           onComplete: () => {
    //             message.info(t('plugin.publishTaskSubmitted' as any))
    //           },
    //         })
            
    //         // message.success(t('plugin.publishingViaPlugin' as any))
    //       } catch (error: any) {
    //         console.error('Plugin publish error:', error)
    //         message.error(`${t('plugin.publishFailed' as any)}: ${error.message || t('aiGeneration.unknownError' as any)}`)
    //       }
    //     }
    //   } else {
    //     // 其他平台使用原有的跳转逻辑
    //     // 获取平台名称（支持不同大小写）
    //     let platformName = platform
    //     // 尝试从 AccountPlatInfoMap 获取显示名称
    //     for (const [key, value] of AccountPlatInfoMap.entries()) {
    //       if (key.toLowerCase() === platform.toLowerCase()) {
    //         platformName = value.name
    //         break
    //       }
    //     }
        
    //     Modal.confirm({
    //       title: t('aiGeneration.needAddChannel' as any),
    //       content: t('aiGeneration.channelNotAdded' as any, { platform: platformName }),
    //       okText: t('aiGeneration.goAdd' as any),
    //       cancelText: t('aiGeneration.cancel' as any),
    //       onOk: () => {
    //         // 跳转到账号页面，自动打开对应平台的授权
    //         router.push(`/${lng}/accounts?addChannel=${platform}`)
    //       },
    //     })
    //   }
    // }

    // return

    if (!prompt.trim()) {
      return
    }
    
    // Check if user is logged in - use getState() to get latest token value
    const currentToken = useUserStore.getState().token
    if (!currentToken) {
      setLoginModalOpen(true)
      return
    }

    try {
      setIsGenerating(true)
      setCompletedMessages([])
      setPendingMessages([])
      setCurrentTypingMsg(null)
      setDisplayedText('')
      setProgress(0)
      
      // 判断是否是新对话：如果没有 taskId，就是新对话，需要清空消息
      const isNewConversation = !taskId
      
      if (isNewConversation) {
        // 新对话：清空所有消息和状态
        setMarkdownMessages([])
        setSessionId('')
        setTaskId('')
        // 清除 sessionStorage 中的旧 taskId
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('aiAgentTaskId')
          sessionStorage.removeItem('aiAgentSessionId')
        }
      }
      
      setStreamingText('')
      streamingTextRef.current = ''

      // Step 1: Show THINKING status
      addMessageToQueue({
        type: 'status',
        content: t('aiGeneration.thinking' as any),
        status: 'THINKING'
      })

      // Step 2: Show user's prompt
      addMessageToQueue({
        type: 'text',
        content: `📝 ${t('aiGeneration.topicPrefix' as any)}${prompt}`
      })

      // 将用户消息添加到对话历史中
      setMarkdownMessages(prev => [...prev, `👤 ${prompt}`])

      // 保存当前的 prompt 和 uploadedImages，用于发送请求
      const currentPrompt = prompt
      const currentFiles = [...uploadedImages]

      // 发送成功后立即清空输入框、图片和消费显示
      setPrompt('')
      setUploadedImages([])
      setCurrentCost(0)

      // Set initial progress to 10%
      setProgress(10)

      // 构建完整的提示词（包含图片/视频链接，但不在前端显示）
      let fullPrompt = currentPrompt
      if (currentFiles.length > 0) {
        const fileLinks = currentFiles.map(f => `[${f.type}]: ${f.url}`).join('\n ')
        fullPrompt = `${currentPrompt}\n\n${fileLinks}`
      }

      // Dynamic import API
      const { agentApi } = await import('@/api/agent')

      // 构建请求参数：如果有 taskId，就传递它继续对话
      const requestParams: any = {
        prompt: fullPrompt,
        includePartialMessages: true // 使用流式消息
      }
      
      // 如果有 taskId，就传递它继续当前对话
      if (taskId) {
        requestParams.taskId = taskId
        console.log('[UI] Continuing conversation with taskId:', taskId)
      } else {
        console.log('[UI] Creating new conversation')
      }

      // Create task with SSE (使用包含图片链接的完整提示词)
      const abortFn = await agentApi.createTaskWithSSE(
        requestParams,
        // onMessage callback
        (sseMessage: any) => {
          console.log('SSE Message:', sseMessage)

          // 处理 init 消息 - 保存 taskId
          if (sseMessage.type === 'init' && sseMessage.taskId) {
            console.log('[UI] Received taskId:', sseMessage.taskId)
            const receivedTaskId = sseMessage.taskId
            
            // 如果没有当前 taskId，说明是新对话
            if (!taskId) {
              console.log('[UI] New conversation started with taskId:', receivedTaskId)
            } else {
              console.log('[UI] Continuing conversation with taskId:', receivedTaskId)
            }
            
            // 保存到 state 和 sessionStorage，仅在当前会话中保存
            setTaskId(receivedTaskId)
            setSessionId(receivedTaskId)
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('aiAgentTaskId', receivedTaskId)
              sessionStorage.setItem('aiAgentSessionId', receivedTaskId)
            }
            
            // 清空流式文本（新消息开始）
            streamingTextRef.current = ''
            setStreamingText('')
            return
          }

          // 处理 keep_alive 消息 - 无需特别处理
          if (sseMessage.type === 'keep_alive') {
            console.log('[UI] Keep alive')
            return
          }

          // 处理流式事件
          if (sseMessage.type === 'stream_event' && sseMessage.message) {
            const streamEvent = sseMessage.message as any
            const event = streamEvent.event

            console.log('[UI] Stream event:', event.type)

            // 处理消息开始 - 不清空文本，因为同一个消息里可能多次出现 message_start
            if (event.type === 'message_start') {
              console.log('[UI] Message start within same conversation')
            }
            // 处理内容块增量更新
            else if (event.type === 'content_block_delta' && event.delta) {
              if (event.delta.type === 'text_delta' && event.delta.text) {
                // 累积文本
                streamingTextRef.current += event.delta.text
                setStreamingText(streamingTextRef.current)
                
                // 实时更新到 markdown 消息（替换最后一条消息或添加新消息）
                setMarkdownMessages(prev => {
                  const newMessages = [...prev]
                  // 如果最后一条消息是流式文本，则更新它
                  if (newMessages.length > 0 && newMessages[newMessages.length - 1].startsWith('🤖 ')) {
                    newMessages[newMessages.length - 1] = `🤖 ${streamingTextRef.current}`
                  } else {
                    // 否则添加新消息
                    newMessages.push(`🤖 ${streamingTextRef.current}`)
                  }
                  return newMessages
                })
              }
            }
            // 处理消息结束
            else if (event.type === 'message_stop') {
              console.log('[UI] Stream completed, final text length:', streamingTextRef.current.length)
              // 流式结束，文本已经完整显示在 markdown 中
            }
            return
          }

          // Save sessionId
          if (sseMessage.sessionId) {
            setSessionId(sseMessage.sessionId)
            // 同步到 sessionStorage
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('aiAgentSessionId', sseMessage.sessionId)
            }
          }

          // Handle different message types
          // type === 'text' 或 'error' 都在 markdown 中显示
          if (sseMessage.type === 'text' && sseMessage.message) {
            console.log('[UI] Adding markdown message:', sseMessage.message)
            setMarkdownMessages(prev => {
              const newMessages = [...prev, sseMessage.message!]
              console.log('[UI] Total markdown messages:', newMessages.length)
              return newMessages
            })
          }
          else if (sseMessage.type === 'error' && sseMessage.message) {
            console.log('[UI] Adding error message to markdown:', sseMessage.message)
            const errorMsg = `❌ : ${sseMessage.message || t('aiGeneration.unknownError' as any)}`
            setMarkdownMessages(prev => [...prev, errorMsg])
          }
          // 处理最终结果
          else if (sseMessage.type === 'result' && sseMessage.message) {
            console.log('[UI] Received result:', sseMessage.message)
            const resultMsg = sseMessage.message as any
            
            // 保存本次消费
            if (resultMsg.total_cost_usd !== undefined) {
              setCurrentCost(resultMsg.total_cost_usd)
            }
            
            // 显示结果消息
            if (resultMsg.message) {
              setMarkdownMessages(prev => [...prev, resultMsg.message])
            }

            // Show completion status
            addMessageToQueue({
              type: 'status',
              content: t('aiGeneration.status.completed' as any),
              status: 'COMPLETED'
            })

            setProgress(100)
            setIsGenerating(false)

            // 根据 type 和 action 做不同处理
            if (resultMsg.result) {
              const taskData = resultMsg.result
              const resultType = taskData.type
              const action = taskData.action

              // 处理 imageOnly 或 videoOnly - 不做跳转操作
              if (resultType === 'imageOnly' || resultType === 'videoOnly' || resultType === 'mediaOnly') {
                console.log('[UI] Result type is imageOnly/videoOnly, no navigation needed')
                return
              }

              // 处理 fullContent 类型
              if (resultType === 'fullContent') {
                // 如果没有 action，默认跳转到发布页面
                if (!action) {
                  setTimeout(() => {
                    const queryParams = new URLSearchParams({
                      aiGenerated: 'true',
                      taskId: taskData.taskId || '',
                      title: taskData.title || '',
                      description: taskData.description || '',
                      tags: JSON.stringify(taskData.tags || []),
                      medias: JSON.stringify(taskData.medias || []),
                    })
                    
                    router.push(`/${lng}/accounts?${queryParams.toString()}`)
                  }, 1500)
                }
                // action: draft - 跳转草稿箱
                else if (action === 'navigateToDraft') {
                  setTimeout(() => {
                    router.push(`/${lng}/cgmaterial`)
                  }, 1500)
                }
                // action: saveDraft - 保存草稿再跳转草稿箱
                else if (action === 'saveDraft') {
                  // 保存草稿 - 使用立即执行的 async 函数
                  ;(async () => {
                    try {
                      // 转换 medias 格式：从 Media[] 转换为 MaterialMedia[]
                      const medias = taskData.medias || []
                      const materialMediaList = medias.map((media: any) => {
                        // MediaType.VIDEO -> PubType.VIDEO, MediaType.IMAGE -> PubType.ImageText
                        const pubType = media.type === MediaType.Video 
                          ? PubType.VIDEO 
                          : PubType.ImageText
                        return {
                          url: media.url,
                          type: pubType,
                          content: media.coverUrl || undefined, // 视频封面作为 content
                        }
                      })

                      // 确定封面URL（优先使用第一个视频的封面，否则使用第一张图片）
                      const coverUrl = medias.find((m: any) => m.coverUrl)?.coverUrl 
                        || medias.find((m: any) => m.type === MediaType.Image)?.url
                        || undefined

                      // 第一次调用：创建草稿（先尝试调用，看后端是否返回 groupId）
                      let createResult: any = null
                      let finalGroupId: string | null = null
                      
                      try {
                        // 先获取分组列表，选择一个默认分组用于第一次调用
                        const groupListRes = await apiGetMaterialGroupList(1, 100)
                        const groups = groupListRes?.data?.list || []
                        
                        if (groups.length > 0) {
                          // 根据 medias 类型选择默认分组
                          const hasVideo = medias.some((m: any) => m.type === MediaType.Video)
                          const targetGroupType = hasVideo ? PubType.VIDEO : PubType.ImageText
                          const defaultGroup = groups.find((g: any) => g.type === targetGroupType) || groups[0]
                          finalGroupId = defaultGroup._id || defaultGroup.id
                        }
                        
                        // 如果有分组，尝试创建草稿
                        if (finalGroupId) {
                          createResult = await apiCreateMaterial({
                            groupId: finalGroupId,
                            coverUrl,
                            mediaList: materialMediaList,
                            title: taskData.title || '',
                            desc: taskData.description || '',
                          })
                          
                          // 检查返回结果是否有新的 groupId（可能后端返回了不同的 groupId）
                          const returnedGroupId = createResult?.data?.groupId 
                            || createResult?.data?.group?._id 
                            || createResult?.data?.group?.id
                            || null
                          
                          // 如果返回了 groupId，使用返回的
                          if (returnedGroupId) {
                            finalGroupId = returnedGroupId
                          }
                        }
                      } catch (error: any) {
                        // 如果调用失败，记录错误但继续处理
                        console.error('Create material error:', error)
                      }

                      // 如果没有成功创建（没有 groupId 或创建失败），需要重新获取分组并创建
                      if (!createResult || !finalGroupId) {
                        const groupListRes = await apiGetMaterialGroupList(1, 100)
                        const groups = groupListRes?.data?.list || []

                        if (groups.length === 0) {
                          message.warning(t('aiGeneration.noDraftGroupFound' as any))
                          return
                        }

                        // 根据 medias 类型选择默认分组
                        const hasVideo = medias.some((m: any) => m.type === MediaType.Video)
                        const targetGroupType = hasVideo ? PubType.VIDEO : PubType.ImageText
                        const defaultGroup = groups.find((g: any) => g.type === targetGroupType) || groups[0]
                        finalGroupId = defaultGroup._id || defaultGroup.id

                        // 使用找到的分组ID创建草稿
                        if (finalGroupId) {
                          try {
                            createResult = await apiCreateMaterial({
                              groupId: finalGroupId,
                              coverUrl,
                              mediaList: materialMediaList,
                              title: taskData.title || '',
                              desc: taskData.description || '',
                            })
                          } catch (error) {
                            console.error('Create material with groupId error:', error)
                            message.error(t('aiGeneration.saveDraftFailed' as any))
                            return
                          }
                        } else {
                          message.warning(t('aiGeneration.noDraftGroup' as any))
                          return
                        }
                      }

                      if (createResult) {
                        message.success(t('aiGeneration.saveDraftSuccess' as any))
                        setTimeout(() => {
                          router.push(`/${lng}/cgmaterial`)
                        }, 1500)
                      } else {
                        message.error(t('aiGeneration.saveDraftFailed' as any))
                      }
                    } catch (error: any) {
                      console.error('Save draft error:', error)
                      message.error(`${t('aiGeneration.saveDraftFailed' as any)}: ${error.message || t('aiGeneration.unknownError' as any)}`)
                    }
                  })()
                }
                // action: publish - 选中指定平台账户并填充内容
                else if (action === 'navigateToPublish') {
                  const platform = taskData.platform
                  
                  // 对于 xhs 和 douyin，使用插件授权逻辑
                  if (platform === 'xhs' || platform === 'douyin') {
                    console.log('createChannel xhs or douyin')
                    // 检查插件状态
                    const pluginStatus = usePluginStore.getState().status
                    const isPluginReady = pluginStatus === PluginStatus.READY
                    
                    if (!isPluginReady) {
                      // 插件未准备就绪，显示引导授权插件
                      message.warning(t('plugin.platformNeedsPlugin' as any))
                      
                      // 延迟显示引导，确保页面已加载
                      setTimeout(() => {
                        const pluginButton = document.querySelector('[data-driver-target="plugin-button"]') as HTMLElement
                        if (!pluginButton) {
                          console.warn('Plugin button not found')
                          return
                        }
            
                        const driverObj = driver({
                          showProgress: false,
                          showButtons: ['next'],
                          nextBtnText: t('aiGeneration.gotIt' as any),
                          doneBtnText: t('aiGeneration.gotIt' as any),
                          popoverOffset: 10,
                          stagePadding: 4,
                          stageRadius: 12,
                          allowClose: true,
                          smoothScroll: true,
                          steps: [
                            {
                              element: '[data-driver-target="plugin-button"]',
                              popover: {
                                title: t('plugin.authorizePluginTitle' as any),
                                description: t('plugin.authorizePluginDescription' as any),
                                side: 'bottom',
                                align: 'start',
                                onPopoverRender: () => {
                                  setTimeout(() => {
                                    const nextBtn = document.querySelector('.driver-popover-next-btn') as HTMLButtonElement
                                    const doneBtn = document.querySelector('.driver-popover-done-btn') as HTMLButtonElement
                                    const btn = nextBtn || doneBtn
                                    if (btn) {
                                      btn.textContent = t('aiGeneration.gotIt' as any)
                                      const handleClick = (e: MouseEvent) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        driverObj.destroy()
                                        btn.removeEventListener('click', handleClick)
                                      }
                                      btn.addEventListener('click', handleClick)
                                    }
                                  }, 50)
                                },
                              },
                            },
                          ],
                          onNextClick: () => {
                            driverObj.destroy()
                            return false
                          },
                        })
            
                        driverObj.drive()
                      }, 1500)
                    } else {
                      // 插件已准备就绪，直接调用插件发布方法
                      try {
                        // 获取账号列表
                        const accountGroupList = useAccountStore.getState().accountGroupList
                        const allAccounts = accountGroupList.reduce<any[]>((acc, group) => {
                          return [...acc, ...group.children]
                        }, [])
                        
                        // 根据 taskData 中的平台类型查找账号
                        const targetAccounts = allAccounts.filter(account => account.type === platform)
                        
                        if (targetAccounts.length === 0) {
                          // 未找到账号，弹出确认框并引导用户添加账号
                          Modal.confirm({
                            title: t('plugin.noAccountFound' as any),
                            content: '未查询到该平台的有效账号，请打开插件添加账号并完成同步',
                            okText: '去处理',
                            cancelText: '取消',
                            onOk: () => {
                              // 延迟显示引导，确保页面已加载
                              setTimeout(() => {
                                const pluginButton = document.querySelector('[data-driver-target="plugin-button"]') as HTMLElement
                                if (!pluginButton) {
                                  console.warn('Plugin button not found')
                                  return
                                }
            
                                const driverObj = driver({
                                  showProgress: false,
                                  showButtons: ['next'],
                                  nextBtnText: t('aiGeneration.gotIt' as any),
                                  doneBtnText: t('aiGeneration.gotIt' as any),
                                  popoverOffset: 10,
                                  stagePadding: 4,
                                  stageRadius: 12,
                                  allowClose: true,
                                  smoothScroll: true,
                                  steps: [
                                    {
                                      element: '[data-driver-target="plugin-button"]',
                                      popover: {
                                        title: '点击打开插件管理',
                                        description: '在插件管理中添加您的账号',
                                        side: 'bottom',
                                        align: 'start',
                                        onPopoverRender: () => {
                                          setTimeout(() => {
                                            const nextBtn = document.querySelector('.driver-popover-next-btn') as HTMLButtonElement
                                            const doneBtn = document.querySelector('.driver-popover-done-btn') as HTMLButtonElement
                                            const btn = nextBtn || doneBtn
                                            if (btn) {
                                              btn.textContent = t('aiGeneration.gotIt' as any)
                                              const handleClick = (e: MouseEvent) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                driverObj.destroy()
                                                btn.removeEventListener('click', handleClick)
                                                // 点击后打开插件弹窗，并高亮对应平台
                                                pluginButton.click()
                                                // 设置高亮平台
                                                setTimeout(() => {
                                                  setHighlightPlatform(platform)
                                                }, 300)
                                              }
                                              btn.addEventListener('click', handleClick)
                                            }
                                          }, 50)
                                        },
                                      },
                                    },
                                  ],
                                  onNextClick: () => {
                                    driverObj.destroy()
                                    return false
                                  },
                                })
            
                                driverObj.drive()
                              }, 500)
                            },
                          })
                          return
                        }
                        
                        // 构建发布数据
                        const medias = taskData.medias || []
                        const hasVideo = medias.some((m: any) => m.type === 'VIDEO')
                        const video = hasVideo ? medias.find((m: any) => m.type === 'VIDEO') : null
                        // 创建空的 File 对象作为占位符
                        const createEmptyFile = () => {
                          return new File([], '', { type: 'image/jpeg' })
                        }
                        
                        const images = medias.filter((m: any) => m.type === 'IMAGE').map((m: any) => ({ 
                          id: '',
                          imgPath: m.url,
                          ossUrl: m.url,
                          size: 0,
                          // file: createEmptyFile(),
                          imgUrl: m.url,
                          filename: '',
                          width: 0,
                          height: 0,
                        }))
                        
                        // 为每个账号创建发布项
                        // @ts-ignore
                        const pluginPublishItems: PluginPublishItem[] = targetAccounts.map(account => ({
                          account,
                          params: {
                            title: taskData.title || '',
                            des: taskData.description || '',
                            topics: taskData.tags || [],
                            video: video ? {
                              size: 0,
                              videoUrl: video.url,
                              ossUrl: video.url,
                              filename: '',
                              width: 0,
                              height: 0,
                              duration: 0,
                              cover: {
                                id: '',
                                imgPath: (video as any).coverUrl || '',
                                ossUrl: (video as any).coverUrl,
                                size: 0,
                                imgUrl: (video as any).coverUrl || '',
                                filename: '',
                                width: 0,
                                height: 0,
                              },
                            } : undefined,
                            images: images.length > 0 ? images : undefined,
                            option: {},
                          },
                        }))
                        
                        // 创建平台任务ID映射
                        const platformTaskIdMap = new Map<string, string>()
                        pluginPublishItems.forEach((item) => {
                          const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
                          platformTaskIdMap.set(item.account.id, requestId)
                        })
                        
                        // 调用插件发布方法
                        usePluginStore.getState().executePluginPublish({
                          items: pluginPublishItems,
                          platformTaskIdMap,
                          onProgress: (event) => {
                            // 监听各平台发布进度
                            const { stage, progress, message: progressMessage, accountId, platform } = event
                            console.log(`[${platform}] 账号 ${accountId}: ${stage} - ${progress}% - ${progressMessage}`)
            
                            // 根据进度阶段显示不同提示
                            if (stage === 'error') {
                              message.error(progressMessage)
                            }
                          },
                          onComplete: () => {
                            message.info(t('plugin.publishTaskSubmitted' as any))
                          },
                        })
                        
                        // message.success(t('plugin.publishingViaPlugin' as any))
                      } catch (error: any) {
                        console.error('Plugin publish error:', error)
                        message.error(`${t('plugin.publishFailed' as any)}: ${error.message || t('aiGeneration.unknownError' as any)}`)
                      }
                    }
                  } else {
                    // 其他平台使用原有的跳转逻辑
                    // 获取平台名称（支持不同大小写）
                    let platformName = platform
                    // 尝试从 AccountPlatInfoMap 获取显示名称
                    for (const [key, value] of AccountPlatInfoMap.entries()) {
                      if (key.toLowerCase() === platform.toLowerCase()) {
                        platformName = value.name
                        break
                      }
                    }
                    
                    Modal.confirm({
                      title: t('aiGeneration.needAddChannel' as any),
                      content: t('aiGeneration.channelNotAdded' as any, { platform: platformName }),
                      okText: t('aiGeneration.goAdd' as any),
                      cancelText: t('aiGeneration.cancel' as any),
                      onOk: () => {
                        // 跳转到账号页面，自动打开对应平台的授权
                        router.push(`/${lng}/accounts?addChannel=${platform}`)
                      },
                    })
                  }
                }
                // action: updateChannel - 更新频道授权
                else if (action === 'updateChannel') {
                  const platform = taskData.platform
                  message.warning(t('aiGeneration.channelAuthExpired' as any))
                  
                  Modal.confirm({
                    title: t('aiGeneration.channelAuthExpiredTitle' as any),
                    content: t('aiGeneration.channelAuthExpiredContent' as any),
                    okText: t('aiGeneration.reauthorize' as any),
                    cancelText: t('aiGeneration.cancel' as any),
                    onOk: () => {
                      router.push(`/${lng}/accounts?updateChannel=${platform}`)
                    },
                  })
                }
                // action: loginChannel - 登录频道
                else if (action === 'loginChannel') {
                  const platform = taskData.platform
                  message.info(t('aiGeneration.needLoginChannel' as any))
                  
                  Modal.confirm({
                    title: t('aiGeneration.needLogin' as any),
                    content: t('aiGeneration.pleaseLoginChannel' as any),
                    okText: t('aiGeneration.goLogin' as any),
                    cancelText: t('aiGeneration.cancel' as any),
                    onOk: () => {
                      router.push(`/${lng}/accounts?loginChannel=${platform}`)
                    },
                  })
                }
              }
            }
          }
          
          if (sseMessage.type === 'status' && sseMessage.status) {
            // Update status
            const statusDisplay = getStatusDisplay(sseMessage.status)
            const needsLoadingAnimation = ['GENERATING_VIDEO', 'GENERATING_IMAGE', 'GENERATING_CONTENT', 'GENERATING_TEXT'].includes(sseMessage.status)
            
            addMessageToQueue({
              type: 'status',
              content: statusDisplay.text,
              status: sseMessage.status,
              loading: needsLoadingAnimation
            })

            // Update progress
            setProgress(prev => calculateProgress(sseMessage.status!, true, prev))
          }
          // 注意：error 消息已经在上面添加到 markdownMessages 中了
          // 这里只需要更新状态
          if (sseMessage.type === 'error') {
            // 延迟关闭 isGenerating，让用户能看到错误消息
            setTimeout(() => {
              setIsGenerating(false)
            }, 100)
            setProgress(0)
          }
        },
        // onError callback
        (error) => {
          console.error('SSE Error:', error)
          message.error(`${t('aiGeneration.createTaskFailed' as any)}: ${error.message || t('aiGeneration.unknownError' as any)}`)
          setIsGenerating(false)
          setProgress(0)
        },
        // onDone callback
        async (finalSessionId) => {
          console.log('SSE Done, sessionId:', finalSessionId)
          // 不再需要调用 getTaskDetail，结果已通过 SSE 返回
          setIsGenerating(false)
          // 清除 abort 函数引用
          sseAbortRef.current = null
        }
      )
      
      // 保存 abort 函数引用
      sseAbortRef.current = abortFn
    }
    catch (error: any) {
      console.error('Create task error:', error)
      message.error(`${t('aiGeneration.createTaskFailed' as any)}: ${error.message || t('aiGeneration.unknownError' as any)}`)
      setIsGenerating(false)
      setProgress(0)
      // 清除 abort 函数引用
      sseAbortRef.current = null
    }
  }


  return (
    <section className={styles.hero}>
      <div className={styles.heroContainer}>
        <div
          className={styles.githubStars}
          onClick={() => {
            window.open('https://github.com/yikart/AiToEarn/releases', '_blank')
          }}
        >
          <img src="https://img.shields.io/github/stars/yikart/AiToEarn.svg" alt="logo" className={styles.logo} />
          <span className={styles.starText}>{t('hero.starsText')}</span>
          <span className={styles.githubText}>{t('hero.github')}</span>
        </div>

        {/* Mode Selection Navigation */}
        <div className={styles.modeNavigation}>
          <div 
            className={`${styles.modeItem} ${selectedMode === 'agent' ? styles.modeItemActive : ''}`}
            onClick={() => setSelectedMode('agent')}
            style={{ 
              background: selectedMode === 'agent' 
                ? 'linear-gradient(135deg, #a66ae4 0%, #8b5ad6 100%)' 
                : 'linear-gradient(135deg, rgba(166, 106, 228, 0.8) 0%, rgba(139, 90, 214, 0.8) 100%)'
            }}
          >
            <div className={styles.modeContent}>
              <div className={styles.modeTitle}>{t('aiGeneration.agentMode' as any)}</div>
              {selectedMode === 'agent' && (
                <div className={styles.modeDescription}>{t('aiGeneration.inspirationPrompt' as any)}</div>
              )}
              {selectedMode !== 'agent' && (
                <svg className={styles.modeArrow} width="16" height="16" viewBox="0 0 10 10" fill="none">
                  <path d="M3.253 1.172a.604.604 0 0 1 .854.005l3.359 3.398a.604.604 0 0 1 0 .85L4.107 8.823a.604.604 0 0 1-.859-.85L6.187 5 3.248 2.026a.604.604 0 0 1 .005-.854Z" fill="currentColor"/>
                </svg>
              )}
            </div>
          </div>
          
          {/* 对话信息和新对话按钮 */}
          {selectedMode === 'agent' && (taskId || sessionId) && (
            <div className={styles.conversationInfo}>
              <span className={styles.conversationId}>
                {t('aiGeneration.conversationId' as any)}: {(taskId || sessionId).slice(-6)}
              </span>
              <button
                className={styles.newConversationBtn}
                onClick={handleNewConversation}
                title={t('aiGeneration.startNewConversation' as any)}
                disabled={isGenerating}
              >
                <ReloadOutlined />
              </button>
            </div>
          )}
        </div>

        {/* SSE Message Display - Visible when generating or has messages */}
        {(isGenerating || markdownMessages.length > 0) && (
          <div className={styles.markdownMessagesWrapper}>
            <div 
              ref={markdownContainerRef}
              className={styles.markdownMessagesContainer}
            >
              <h3 className={styles.markdownTitle}>
                <Image src={logo} alt="Logo" className={styles.logoAi} />
                 {t('aiGeneration.aiGenerationProcess' as any)} {isGenerating && <LoadingDots />}
              </h3>
              <div className={styles.markdownContent}>
                <ReactMarkdown>
                  {markdownMessages.length > 0 
                    ? markdownMessages.join('\n\n') 
                    : t('aiGeneration.waitingAiResponse' as any)}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {/* AI Generation Input */}
        <div ref={mainInputContainerRef} className={styles.aiGenerationWrapper}>
          <div className={styles.aiInputContainer}>
           
            <div className={styles.uploadedImagesPreview}>
              <div className={styles.imagesRow}>
                {uploadedImages.length > 0 && uploadedImages.map((file, index) => (
                  <div key={index} className={styles.imageItem}>
                    {file.type === 'video' ? (
                      <video 
                        src={file.url} 
                        className={styles.imageThumb}
                        controls
                        preload="metadata"
                      />
                    ) : (
                      <img 
                        src={file.url} 
                        alt={`pic ${index + 1}`} 
                        className={styles.imageThumb}
                      />
                    )}
                    {!isGenerating && (
                      <span
                        className={styles.removeImageBtn}
                        onClick={() => handleRemoveImage(index)}
                        title="remove file"
                      >
                        <CloseCircleOutlined />
                      </span>
                    )}
                  </div>
                ))}

                {/* 图片/视频上传按钮 */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isGenerating || isUploading}
                    className={styles.aiUploadBtn}
                    title="上传图片/视频"
                  >
                    {isUploading ? (
                      <span>⏳</span>
                    ) : (
                      <span className={styles.plusIcon}>+</span>
                    )}
                  </button>
                
              </div>
            </div>

           

          <div className={styles.aiInputContainer1}>
            <textarea
              ref={textareaRef}
              id="ai-input-textarea"
              data-driver-target="ai-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                // 回车键触发发送（Shift+Enter 换行）
                if (e.key === 'Enter' && !e.shiftKey && !isGenerating && !isUploading) {
                  e.preventDefault()
                  handleCreateTask()
                }
              }}
              placeholder={t('aiGeneration.inputPlaceholder' as any)}
              disabled={isGenerating || isUploading}
              className={styles.aiInput}
              rows={4}
            />
          </div>

          {/* 底部控制栏 */}
          <div className={styles.aiInputBottomBar}>
            <div className={styles.bottomLeft}>
              <button className={styles.modeSelectBtn}>
                <span>
                  {selectedMode === 'agent' && t('aiGeneration.agentMode' as any)}
                  {selectedMode === 'image' && t('aiGeneration.imageGeneration' as any)}
                  {selectedMode === 'video' && t('aiGeneration.videoGeneration' as any)}
                  {selectedMode === 'draft' && t('aiGeneration.draftBox' as any)}
                  {selectedMode === 'publishbatch' && t('aiGeneration.batchPublish' as any)}
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              
              {/* 显示本次消费 */}
              {currentCost > 0 && (
                <span style={{ 
                  fontSize: '12px', 
                  color: '#666', 
                  marginLeft: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 6v6l4 2"></path>
                  </svg>
                  {t('aiGeneration.currentCost' as any)}: ${currentCost.toFixed(4)}
                </span>
              )}
            </div>
            <button 
              className={styles.scrollTopBtn}
              onClick={isGenerating ? handleStopTask : handleCreateTask}
              disabled={!isGenerating && (!prompt.trim() || isUploading)}
              title={isGenerating ? t('status.stopGenerating' as any) : t('status.sendMessage' as any)}
            >
              {isGenerating ? (
                // 停止按钮 - 显示方块
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                // 发送按钮 - 显示向上箭头
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12.002 3c.424 0 .806.177 1.079.46l5.98 5.98.103.114a1.5 1.5 0 0 1-2.225 2.006l-3.437-3.436V19.5l-.008.153a1.5 1.5 0 0 1-2.985 0l-.007-.153V8.122l-3.44 3.438a1.5 1.5 0 0 1-2.225-2.006l.103-.115 6-5.999.025-.025.059-.052.044-.037c.029-.023.06-.044.09-.065l.014-.01a1.43 1.43 0 0 1 .101-.062l.03-.017c.209-.11.447-.172.699-.172Z" fill="currentColor"/>
                </svg>
              )}
            </button>
          </div>
          </div>
        </div>

        {/* <p
          className={styles.heroMobileLink}
          style={{ marginTop: '10px' }}
          onClick={() => {
            const el = document.getElementById('download')
            if (el) {
              el.scrollIntoView({ behavior: 'smooth' })
            }
          }}
        >
          {t('hero.useMobilePhone' as any)}
        </p> */}
      </div>

      {/* Login Modal */}
      <LoginModal
        open={loginModalOpen}
        onCancel={() => setLoginModalOpen(false)}
        onSuccess={handleLoginSuccess}
      />

      {/* Plugin Status Modal */}
      <PluginStatusModal
        visible={pluginModalOpen}
        onClose={() => {
          setPluginModalOpen(false)
          setHighlightPlatform(null)
        }}
        highlightPlatform={highlightPlatform}
      />

      {/* Plugin Status Modal */}
      <PluginStatusModal 
        visible={pluginModalOpen}
        onClose={() => {
          setPluginModalOpen(false)
          setHighlightPlatform(null)
        }}
        highlightPlatform={highlightPlatform}
      />
      
      {/* 固定在底部的简化输入框 */}
      {showFixedInput && (
        <div className={styles.fixedInputWrapper}>
          <div className={styles.fixedInputContainer}>
            {/* 已上传图片/视频预览 */}
            {uploadedImages.length > 0 && (
              <div className={styles.fixedUploadedImages}>
                {uploadedImages.map((file, index) => (
                  <div key={index} style={{ position: 'relative' }}>
                    {file.type === 'video' ? (
                      <video 
                        src={file.url} 
                        className={styles.fixedImageThumb}
                        controls
                        preload="metadata"
                      />
                    ) : (
                      <img 
                        src={file.url} 
                        alt={`pic ${index + 1}`} 
                        className={styles.fixedImageThumb}
                      />
                    )}
                    {!isGenerating && (
                      <span
                        className={styles.fixedRemoveImageBtn}
                        onClick={() => handleRemoveImage(index)}
                        title="移除文件"
                      >
                        ×
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* 图片上传按钮 */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isGenerating || isUploading}
              className={styles.fixedUploadBtn}
              title="上传图片/视频"
            >
              {isUploading ? '⏳' : '+'}
            </button>
            
            {/* 输入框 */}
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !isGenerating && !isUploading) {
                  e.preventDefault()
                  handleCreateTask().then(() => {
                    // 发送后滚动到主输入框
                    mainInputContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  })
                }
              }}
              placeholder={t('aiGeneration.inputPlaceholder' as any)}
              disabled={isGenerating || isUploading}
              className={styles.fixedInput}
            />
            
            {/* 发送按钮 */}
            <button 
              className={styles.fixedSendBtn}
              onClick={() => {
                handleCreateTask().then(() => {
                  // 发送后滚动到主输入框
                  mainInputContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                })
              }}
              disabled={!prompt.trim() || isGenerating || isUploading}
            >
              {isGenerating ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12.002 3c.424 0 .806.177 1.079.46l5.98 5.98.103.114a1.5 1.5 0 0 1-2.225 2.006l-3.437-3.436V19.5l-.008.153a1.5 1.5 0 0 1-2.985 0l-.007-.153V8.122l-3.44 3.438a1.5 1.5 0 0 1-2.225-2.006l.103-.115 6-5.999.025-.025.059-.052.044-.037c.029-.023.06-.044.09-.065l.014-.01a1.43 1.43 0 0 1 .101-.062l.03-.017c.209-.11.447-.172.699-.172Z" fill="currentColor"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

// Brand partner logo section - social media platforms (infinite scroll)
function BrandBar() {
  const { t } = useTransClient('home')
  const { lng } = useParams()

  // Platform data configuration
  const platforms = [
    { name: 'YouTube', key: 'YouTube', hasIcon: true, iconPath: youtubeIcon.src },
    { name: 'TikTok', key: 'TikTok', hasIcon: true, iconPath: tiktokIcon },
    { name: '小红书', key: 'Rednote', hasIcon: true, iconPath: xhsIcon },
    { name: '抖音', key: 'Douyin', hasIcon: true, iconPath: douyinIcon },
    { name: '快手', key: 'Kwai', hasIcon: true, iconPath: ksIcon },
    { name: '公众号', key: 'Wechat Offical Account', hasIcon: true, iconPath: gongzhonghaoIcon.src },
    { name: '视频号', key: 'Wechat Channels', hasIcon: true, iconPath: wxSphIcon },
    { name: 'Bilibili', key: 'Bilibili', hasIcon: true, iconPath: bilibiliIcon },
    { name: 'Facebook', key: 'Facebook', hasIcon: true, iconPath: FacebookIcon.src },
    { name: 'Instagram', key: 'Instagram', hasIcon: true, iconPath: InstagramIcon.src },
    { name: 'LinkedIn', key: 'LinkedIn', hasIcon: true, iconPath: LinkedInIcon.src },
    { name: 'Pinterest', key: 'Pinterest', hasIcon: true, iconPath: PinterestIcon.src },
    { name: 'Threads', key: 'Threads', hasIcon: true, iconPath: ThreadsIcon.src },
    { name: 'X (Twitter)', key: 'X (Twitter)', hasIcon: true, iconPath: TwitterIcon.src },
  ]

  // Duplicate data to achieve seamless scrolling
  const duplicatedPlatforms = [...platforms, ...platforms]

  // Get platform display name
  const getPlatformDisplayName = (platform: any) => {
    if (lng === 'en') {
      return platform.key
    }
    return platform.name
  }

  return (
    <section className={styles.brandBar}>
      <div className={styles.brandContainer}>
        <div className={styles.brandTitle}>{t('brandBar.title')}</div>
        <div className={styles.scrollContainer}>
          <div className={styles.scrollTrack}>
            {duplicatedPlatforms.map((platform, index) => (
              <div key={index} className={styles.platformItem}>
                <div className={styles.platformIcon}>
                  {platform.hasIcon
                    ? (
                        <img
                          src={platform.iconPath}
                          alt={`${getPlatformDisplayName(platform)} logo`}
                          className={styles.platformSvg}
                        />
                      )
                    : (
                        <span className={styles.platformEmoji}>{getPlatformDisplayName(platform)}</span>
                      )}
                </div>
                <span className={styles.platformName}>{getPlatformDisplayName(platform)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// 1. Content Publishing — One-click publishing · Multi-platform reach
function ContentPublishingSection() {
  const { t } = useTransClient('home')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [autoRotate, setAutoRotate] = useState(true)
  const images = [IMAGE_URLS.calendar, IMAGE_URLS.supportChannels]
  const autoRotateRef = useRef<NodeJS.Timeout | null>(null)
  const carouselRef = useRef<HTMLDivElement>(null)

  // Auto rotation
  useEffect(() => {
    if (autoRotate) {
      autoRotateRef.current = setInterval(() => {
        setCurrentImageIndex(prev => (prev + 1) % images.length)
      }, 3000)
    }
    else {
      if (autoRotateRef.current) {
        clearInterval(autoRotateRef.current)
        autoRotateRef.current = null
      }
    }

    return () => {
      if (autoRotateRef.current) {
        clearInterval(autoRotateRef.current)
      }
    }
  }, [autoRotate, images.length])

  // Wheel control
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (carouselRef.current && carouselRef.current.contains(e.target as Node)) {
        e.preventDefault()

        if (e.deltaY > 0) {
          if (currentImageIndex < images.length - 1) {
            setCurrentImageIndex(prev => prev + 1)
            setAutoRotate(false)
          }
          else {
            setAutoRotate(true)
            return
          }
        }
        else {
          if (currentImageIndex > 0) {
            setCurrentImageIndex(prev => prev - 1)
            setAutoRotate(false)
          }
        }

        setTimeout(() => {
          setAutoRotate(true)
        }, 3000)
      }
    }

    const carousel = carouselRef.current
    if (carousel) {
      carousel.addEventListener('wheel', handleWheel, { passive: false })

      return () => {
        carousel.removeEventListener('wheel', handleWheel)
      }
    }
  }, [currentImageIndex, images.length])

  return (
    <section className={styles.buildSection}>
      <div className={styles.buildContainer}>
        <div className={styles.sectionBadge}>
          <div className={styles.badgeIcon}></div>
          <span>{t('buildSection.badge')}</span>
        </div>

        <div className={styles.buildContent}>
          <div className={styles.buildLeft}>
            <h2 className={styles.buildTitle}>
              {t('buildSection.title')}
              <span className={styles.titleBlue}>{t('buildSection.titleBlue')}</span>
            </h2>

            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <h3>{t('buildSection.features.hotTopic.title')}</h3>
                <p>{t('buildSection.features.hotTopic.description')}</p>
              </div>

              <div className={styles.featureItem}>
                <h3>{t('buildSection.features.international.title')}</h3>
                <p>{t('buildSection.features.international.description')}</p>
              </div>
            </div>
          </div>

          <div className={styles.buildRight}>
            <div
              className={styles.imageCarousel}
              ref={carouselRef}
            >
              <div className={`${styles.carouselContainer} ${styles.mobileContainer}`}>
                {images.map((image, index) => (
                  <div
                    key={index}
                    className={`${styles.carouselSlide} ${index === currentImageIndex ? styles.active : ''}`}
                  >
                    <img
                      src={image}
                      alt={`Content Publishing ${index + 1}`}
                      className={styles.mobileCarouselImage}
                    />
                  </div>
                ))}
              </div>

              <div className={styles.carouselIndicators}>
                {images.map((_, index) => (
                  <button
                    key={index}
                    className={`${styles.indicator} ${index === currentImageIndex ? styles.active : ''}`}
                    onClick={() => {
                      setCurrentImageIndex(index)
                      setAutoRotate(false)
                      setTimeout(() => setAutoRotate(true), 3000)
                    }}
                  />
                ))}
              </div>

              <div className={styles.carouselHint}>
                <span>Use scroll wheel to switch images</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// 2. Content Hotspot — Viral inspiration engine
function ContentHotspotSection() {
  const { t } = useTransClient('home')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [autoRotate, setAutoRotate] = useState(true)
  const images = [IMAGE_URLS.hotspot, IMAGE_URLS.hotspot2, IMAGE_URLS.hotspot3, IMAGE_URLS.hotspot4]
  const autoRotateRef = useRef<NodeJS.Timeout | null>(null)
  const carouselRef = useRef<HTMLDivElement>(null)

  // Auto rotation
  useEffect(() => {
    if (autoRotate) {
      autoRotateRef.current = setInterval(() => {
        setCurrentImageIndex(prev => (prev + 1) % images.length)
      }, 3000)
    }
    else {
      if (autoRotateRef.current) {
        clearInterval(autoRotateRef.current)
        autoRotateRef.current = null
      }
    }

    return () => {
      if (autoRotateRef.current) {
        clearInterval(autoRotateRef.current)
      }
    }
  }, [autoRotate, images.length])

  // Wheel control
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (carouselRef.current && carouselRef.current.contains(e.target as Node)) {
        e.preventDefault()

        if (e.deltaY > 0) {
          if (currentImageIndex < images.length - 1) {
            setCurrentImageIndex(prev => prev + 1)
            setAutoRotate(false)
          }
          else {
            setAutoRotate(true)
            return
          }
        }
        else {
          if (currentImageIndex > 0) {
            setCurrentImageIndex(prev => prev - 1)
            setAutoRotate(false)
          }
        }

        setTimeout(() => {
          setAutoRotate(true)
        }, 3000)
      }
    }

    const carousel = carouselRef.current
    if (carousel) {
      carousel.addEventListener('wheel', handleWheel, { passive: false })

      return () => {
        carousel.removeEventListener('wheel', handleWheel)
      }
    }
  }, [currentImageIndex, images.length])

  return (
    <section className={styles.buildSection}>
      <div className={styles.buildContainer}>
        <div className={styles.sectionBadge}>
          <div className={styles.badgeIcon}></div>
          <span>{t('hotspotSection.badge' as any)}</span>
        </div>

        <div className={styles.buildContent}>
          <div className={styles.buildLeft}>
            <h2 className={styles.buildTitle}>
              {t('hotspotSection.title' as any)}
              <span className={styles.titleBlue}>{t('hotspotSection.titleBlue' as any)}</span>
            </h2>

            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <h3>{t('hotspotSection.features.hotTopic.title' as any)}</h3>
                <p>{t('hotspotSection.features.hotTopic.description' as any)}</p>
              </div>

              <div className={styles.featureItem}>
                <h3>{t('hotspotSection.features.international.title' as any)}</h3>
                <p>{t('hotspotSection.features.international.description' as any)}</p>
              </div>
            </div>
          </div>

          <div className={styles.buildRight}>
            <div
              className={styles.imageCarousel}
              ref={carouselRef}
            >
              <div className={`${styles.carouselContainer} ${styles.mobileContainer}`}>
                {images.map((image, index) => (
                  <div
                    key={index}
                    className={`${styles.carouselSlide} ${index === currentImageIndex ? styles.active : ''}`}
                  >
                    <img
                      src={image}
                      alt={`Content Hotspot ${index + 1}`}
                      className={styles.mobileCarouselImage}
                    />
                  </div>
                ))}
              </div>

              <div className={styles.carouselIndicators}>
                {images.map((_, index) => (
                  <button
                    key={index}
                    className={`${styles.indicator} ${index === currentImageIndex ? styles.active : ''}`}
                    onClick={() => {
                      setCurrentImageIndex(index)
                      setAutoRotate(false)
                      setTimeout(() => setAutoRotate(true), 3000)
                    }}
                  />
                ))}
              </div>

              <div className={styles.carouselHint}>
                <span>Use scroll wheel to switch images</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// 3. Content Search — Brand and market insights
function ContentSearchSection() {
  const { t } = useTransClient('home')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [autoRotate, setAutoRotate] = useState(true)
  const images = [IMAGE_URLS.contentSearch, IMAGE_URLS.contentSearch1, IMAGE_URLS.contentSearch2, IMAGE_URLS.contentSearch4]
  const autoRotateRef = useRef<NodeJS.Timeout | null>(null)
  const carouselRef = useRef<HTMLDivElement>(null)

  // Auto rotation
  useEffect(() => {
    if (autoRotate) {
      autoRotateRef.current = setInterval(() => {
        setCurrentImageIndex(prev => (prev + 1) % images.length)
      }, 3000)
    }
    else {
      if (autoRotateRef.current) {
        clearInterval(autoRotateRef.current)
        autoRotateRef.current = null
      }
    }

    return () => {
      if (autoRotateRef.current) {
        clearInterval(autoRotateRef.current)
      }
    }
  }, [autoRotate, images.length])

  // Wheel control
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (carouselRef.current && carouselRef.current.contains(e.target as Node)) {
        e.preventDefault()

        if (e.deltaY > 0) {
          if (currentImageIndex < images.length - 1) {
            setCurrentImageIndex(prev => prev + 1)
            setAutoRotate(false)
          }
          else {
            setAutoRotate(true)
            return
          }
        }
        else {
          if (currentImageIndex > 0) {
            setCurrentImageIndex(prev => prev - 1)
            setAutoRotate(false)
          }
        }

        setTimeout(() => {
          setAutoRotate(true)
        }, 3000)
      }
    }

    const carousel = carouselRef.current
    if (carousel) {
      carousel.addEventListener('wheel', handleWheel, { passive: false })

      return () => {
        carousel.removeEventListener('wheel', handleWheel)
      }
    }
  }, [currentImageIndex, images.length])

  return (
    <section className={styles.buildSection}>
      <div className={styles.buildContainer}>
        <div className={styles.sectionBadge}>
          <div className={styles.badgeIcon}></div>
          <span>{t('searchSection.badge' as any)}</span>
        </div>

        <div className={styles.buildContent}>
          <div className={styles.buildLeft}>
            <h2 className={styles.buildTitle}>
              {t('searchSection.title' as any)}
              <span className={styles.titleBlue}>{t('searchSection.titleBlue' as any)}</span>
            </h2>

            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <h3>{t('searchSection.features.hotTopic.title' as any)}</h3>
                <p>{t('searchSection.features.hotTopic.description' as any)}</p>
              </div>

              <div className={styles.featureItem}>
                <h3>{t('searchSection.features.international.title' as any)}</h3>
                <p>{t('searchSection.features.international.description' as any)}</p>
              </div>
            </div>
          </div>

          <div className={styles.buildRight}>
            <div
              className={styles.imageCarousel}
              ref={carouselRef}
            >
              <div className={`${styles.carouselContainer} ${styles.mobileContainer}`}>
                {images.map((image, index) => (
                  <div
                    key={index}
                    className={`${styles.carouselSlide} ${index === currentImageIndex ? styles.active : ''}`}
                  >
                    <img
                      src={image}
                      alt={`Content Search ${index + 1}`}
                      className={styles.mobileCarouselImage}
                    />
                  </div>
                ))}
              </div>

              <div className={styles.carouselIndicators}>
                {images.map((_, index) => (
                  <button
                    key={index}
                    className={`${styles.indicator} ${index === currentImageIndex ? styles.active : ''}`}
                    onClick={() => {
                      setCurrentImageIndex(index)
                      setAutoRotate(false)
                      setTimeout(() => setAutoRotate(true), 3000)
                    }}
                  />
                ))}
              </div>

              <div className={styles.carouselHint}>
                <span>Use scroll wheel to switch images</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// 4. Comments Search — Precise user mining
function CommentsSearchSection() {
  const { t } = useTransClient('home')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [autoRotate, setAutoRotate] = useState(true)
  const images = [IMAGE_URLS.commentFilter]
  const autoRotateRef = useRef<NodeJS.Timeout | null>(null)
  const carouselRef = useRef<HTMLDivElement>(null)

  // Auto rotation
  useEffect(() => {
    if (autoRotate) {
      autoRotateRef.current = setInterval(() => {
        setCurrentImageIndex(prev => (prev + 1) % images.length)
      }, 3000)
    }
    else {
      if (autoRotateRef.current) {
        clearInterval(autoRotateRef.current)
        autoRotateRef.current = null
      }
    }

    return () => {
      if (autoRotateRef.current) {
        clearInterval(autoRotateRef.current)
      }
    }
  }, [autoRotate, images.length])

  // Wheel control
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (carouselRef.current && carouselRef.current.contains(e.target as Node)) {
        e.preventDefault()

        if (e.deltaY > 0) {
          if (currentImageIndex < images.length - 1) {
            setCurrentImageIndex(prev => prev + 1)
            setAutoRotate(false)
          }
          else {
            setAutoRotate(true)
            return
          }
        }
        else {
          if (currentImageIndex > 0) {
            setCurrentImageIndex(prev => prev - 1)
            setAutoRotate(false)
          }
        }

        setTimeout(() => {
          setAutoRotate(true)
        }, 3000)
      }
    }

    const carousel = carouselRef.current
    if (carousel) {
      carousel.addEventListener('wheel', handleWheel, { passive: false })

      return () => {
        carousel.removeEventListener('wheel', handleWheel)
      }
    }
  }, [currentImageIndex, images.length])

  return (
    <section className={styles.buildSection}>
      <div className={styles.buildContainer}>
        <div className={styles.sectionBadge}>
          <div className={styles.badgeIcon}></div>
          <span>{t('commentsSection.badge' as any)}</span>
        </div>

        <div className={styles.buildContent}>
          <div className={styles.buildLeft}>
            <h2 className={styles.buildTitle}>
              {t('commentsSection.title' as any)}
              <span className={styles.titleBlue}>{t('commentsSection.titleBlue' as any)}</span>
            </h2>

            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <h3>{t('commentsSection.features.hotTopic.title' as any)}</h3>
                <p>{t('commentsSection.features.hotTopic.description' as any)}</p>
              </div>

              <div className={styles.featureItem}>
                <h3>{t('commentsSection.features.international.title' as any)}</h3>
                <p>{t('commentsSection.features.international.description' as any)}</p>
              </div>
            </div>
          </div>

          <div className={styles.buildRight}>
            <div
              className={styles.imageCarousel}
              ref={carouselRef}
            >
              <div className={`${styles.carouselContainer} ${styles.mobileContainer}`}>
                {images.map((image, index) => (
                  <div
                    key={index}
                    className={`${styles.carouselSlide} ${index === currentImageIndex ? styles.active : ''}`}
                  >
                    <img
                      src={image}
                      alt={`Comments Search ${index + 1}`}
                      className={styles.mobileCarouselImage}
                    />
                  </div>
                ))}
              </div>

              <div className={styles.carouselIndicators}>
                {images.map((_, index) => (
                  <button
                    key={index}
                    className={`${styles.indicator} ${index === currentImageIndex ? styles.active : ''}`}
                    onClick={() => {
                      setCurrentImageIndex(index)
                      setAutoRotate(false)
                      setTimeout(() => setAutoRotate(true), 3000)
                    }}
                  />
                ))}
              </div>

              <div className={styles.carouselHint}>
                <span>Use scroll wheel to switch images</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// 5. Content Engagement — Interaction and growth engine
function ContentEngagementSection() {
  const { t } = useTransClient('home')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [autoRotate, setAutoRotate] = useState(true)
  const images = [IMAGE_URLS.commentFilter2]
  const autoRotateRef = useRef<NodeJS.Timeout | null>(null)
  const carouselRef = useRef<HTMLDivElement>(null)

  // Auto rotation
  useEffect(() => {
    if (autoRotate) {
      autoRotateRef.current = setInterval(() => {
        setCurrentImageIndex(prev => (prev + 1) % images.length)
      }, 3000)
    }
    else {
      if (autoRotateRef.current) {
        clearInterval(autoRotateRef.current)
        autoRotateRef.current = null
      }
    }

    return () => {
      if (autoRotateRef.current) {
        clearInterval(autoRotateRef.current)
      }
    }
  }, [autoRotate, images.length])

  // Wheel control
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (carouselRef.current && carouselRef.current.contains(e.target as Node)) {
        e.preventDefault()

        if (e.deltaY > 0) {
          if (currentImageIndex < images.length - 1) {
            setCurrentImageIndex(prev => prev + 1)
            setAutoRotate(false)
          }
          else {
            setAutoRotate(true)
            return
          }
        }
        else {
          if (currentImageIndex > 0) {
            setCurrentImageIndex(prev => prev - 1)
            setAutoRotate(false)
          }
        }

        setTimeout(() => {
          setAutoRotate(true)
        }, 3000)
      }
    }

    const carousel = carouselRef.current
    if (carousel) {
      carousel.addEventListener('wheel', handleWheel, { passive: false })

      return () => {
        carousel.removeEventListener('wheel', handleWheel)
      }
    }
  }, [currentImageIndex, images.length])

  return (
    <section className={styles.buildSection}>
      <div className={styles.buildContainer}>
        <div className={styles.sectionBadge}>
          <div className={styles.badgeIcon}></div>
          <span>{t('connectSection.badge' as any)}</span>
        </div>

        <div className={styles.buildContent}>
          <div className={styles.buildLeft}>
            <h2 className={styles.buildTitle}>
              {t('connectSection.title' as any)}
              <span className={styles.titleBlue}>{t('connectSection.titleBlue' as any)}</span>
            </h2>

            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <h3>{t('connectSection.features.creation.title' as any)}</h3>
                <p>{t('connectSection.features.creation.description' as any)}</p>
              </div>

              <div className={styles.featureItem}>
                <h3>{t('connectSection.features.distribution.title' as any)}</h3>
                <p>{t('connectSection.features.distribution.description' as any)}</p>
              </div>
            </div>
          </div>

          <div className={styles.buildRight}>
            <div
              className={styles.imageCarousel}
              ref={carouselRef}
            >
              <div className={`${styles.carouselContainer} ${styles.mobileContainer}`}>
                {images.map((image, index) => (
                  <div
                    key={index}
                    className={`${styles.carouselSlide} ${index === currentImageIndex ? styles.active : ''}`}
                  >
                    <img
                      src={image}
                      alt={`Content Engagement ${index + 1}`}
                      className={styles.mobileCarouselImage}
                    />
                  </div>
                ))}
              </div>

              <div className={styles.carouselIndicators}>
                {images.map((_, index) => (
                  <button
                    key={index}
                    className={`${styles.indicator} ${index === currentImageIndex ? styles.active : ''}`}
                    onClick={() => {
                      setCurrentImageIndex(index)
                      setAutoRotate(false)
                      setTimeout(() => setAutoRotate(true), 3000)
                    }}
                  />
                ))}
              </div>

              <div className={styles.carouselHint}>
                <span>Use scroll wheel to switch images</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// 6-8. Upcoming features integration module
function UpcomingFeaturesSection() {
  const { t } = useTransClient('home')

  return (
    <section className={styles.buildSection}>
      <div className={styles.buildContainer}>
        <div className={styles.sectionBadge}>
          <div className={styles.badgeIcon}></div>
          <span>{t('upcomingSection.badge' as any)}</span>
        </div>

        <div className={styles.buildContent}>
          <div className={styles.buildLeft}>
            <h2 className={styles.buildTitle}>
              {t('upcomingSection.title' as any)}
              <span className={styles.titleBlue}>{t('upcomingSection.titleBlue' as any)}</span>
            </h2>

            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <h3>{t('upcomingSection.features.smartImport.title' as any)}</h3>
                <p>{t('upcomingSection.features.smartImport.description' as any)}</p>
              </div>

              <div className={styles.featureItem}>
                <h3>{t('upcomingSection.features.analytics.title' as any)}</h3>
                <p>{t('upcomingSection.features.analytics.description' as any)}</p>
              </div>

              <div className={styles.featureItem}>
                <h3>{t('upcomingSection.features.aiCreation.title' as any)}</h3>
                <p>{t('upcomingSection.features.aiCreation.description' as any)}</p>
              </div>

              <div className={styles.featureItem}>
                <h3>{t('upcomingSection.features.marketplace.title' as any)}</h3>
                <p>{t('upcomingSection.features.marketplace.description' as any)}</p>
              </div>
            </div>
          </div>

          <div className={styles.buildRight} style={{ minHeight: '500px' }}>
            <div className={styles.imageCarousel}>
              <div className={styles.carouselContainer}>
                <div className={`${styles.carouselSlide} ${styles.active}`}>
                  <video
                    src="https://assets.aitoearn.ai/production/temp/uploads/890044ad-c3a3-4a4c-8981-0eb72abff538.mp4"
                    controls
                    className={styles.desktopCarouselImage}
                    style={{ borderRadius: '16px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function DownloadSection() {
  const { t } = useTransClient('home')

  return (
    <section className={styles.downloadSection} id="download">
      <div className={styles.downloadContainer}>
        <div className={styles.downloadContent}>
          <div className={styles.downloadLeft}>
            <h2 className={styles.downloadTitle}>
              {t('downloadSection.title')}
              <br />
              <span className={styles.titleBlue}>{t('downloadSection.titleBlue')}</span>
            </h2>

            <p className={styles.downloadDescription}>
              {t('downloadSection.description')}
            </p>

            <div className={styles.downloadButtons}>
              <a href={getMainAppDownloadUrlSync()} className={styles.downloadBtn} target="_blank" rel="noopener noreferrer">
                <div className={styles.downloadBtnContent}>
                  <AndroidOutlined className={styles.downloadIcon} style={{ fontSize: '24px' }} />
                  <div className={styles.downloadBtnText}>
                    <span className={styles.downloadOn}>{t('download.downloadNow' as any)}</span>
                    <span className={styles.downloadStore}>Android APK</span>
                  </div>
                </div>
              </a>
              <a href="https://play.google.com/store/apps/details?id=com.yika.aitoearn.aitoearn_app" className={styles.downloadBtn} target="_blank" rel="noopener noreferrer">
                <div className={styles.downloadBtnContent}>
                  <AndroidOutlined className={styles.downloadIcon} style={{ fontSize: '24px' }} />
                  <div className={styles.downloadBtnText}>
                    <span className={styles.downloadOn}>Get it on</span>
                    <span className={styles.downloadStore}>Google Play</span>
                  </div>
                </div>
              </a>
            </div>
          </div>

          <div className={styles.downloadRight}>
            <div className={styles.phoneContainer}>

              <div className={styles.qrCode}>
                {/* <div className={styles.qrCodeImage}> */}
                <QRCode
                  value={getMainAppDownloadUrlSync()}
                  size={120}
                />
                {/* </div> */}
                <p className={styles.qrCodeText}>{t('downloadSection.qrCodeText' as any)}</p>
              </div>

              <div className={styles.phoneFrame}>
                <div className={styles.phoneScreen}>
                  <div className={styles.phoneStatusBar}>
                    <span className={styles.phoneTime}>9:41</span>
                    <div className={styles.phoneSignals}>
                      <div className={styles.phoneSignal}></div>
                      <div className={styles.phoneBattery}></div>
                    </div>
                  </div>

                  <div className={styles.phoneContent}>
                    <div className={styles.phoneHeader}>
                      <h3>Create</h3>
                      <span className={styles.phoneCounter}>280</span>
                    </div>

                    <div className={styles.phoneVideoCard}>
                      <span className={styles.phoneVideoTitle}>Example video</span>
                      <div className={styles.phoneVideoPreview}>
                        <img src={publish1.src} alt="Video preview" className={styles.phoneVideoImg} />
                      </div>
                      <div className={styles.phoneVideoMeta}>
                        <span>Consumer</span>
                        <span>⌚ 15</span>
                      </div>
                    </div>

                    <div className={styles.phoneCreatePrompt}>
                      <div className={styles.phoneAddBtn}>+</div>
                      <span>What do you want to create?</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Enterprise section
function EnterpriseSection() {
  const { t } = useTransClient('home')

  return (
    <section className={styles.enterpriseSection}>
      <div className={styles.enterpriseContainer}>
        <div className={styles.sectionBadge}>
          <div className={styles.badgeIcon}></div>
          <span>{t('enterpriseSection.badge')}</span>
        </div>

        <h2 className={styles.enterpriseTitle}>
          {t('enterpriseSection.title')}
          <br />
          <span className={styles.titleBlue}>{t('enterpriseSection.titleBlue')}</span>
        </h2>

        <p className={styles.enterpriseSubtitle}>
          {t('enterpriseSection.subtitle')}
        </p>
      </div>
    </section>
  )
}

// Statistics section
function StatsSection() {
  const { t } = useTransClient('home')

  return (
    <section className={styles.statsSection}>
      <div className={styles.statsContainer}>
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>{t('statsSection.stats.users.number')}</div>
            <div className={styles.statLabel}>{t('statsSection.stats.users.label')}</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>{t('statsSection.stats.platforms.number')}</div>
            <div className={styles.statLabel}>{t('statsSection.stats.platforms.label')}</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>{t('statsSection.stats.countries.number')}</div>
            <div className={styles.statLabel}>{t('statsSection.stats.countries.label')}</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>{t('statsSection.stats.content.number')}</div>
            <div className={styles.statLabel}>{t('statsSection.stats.content.label')}</div>
          </div>
        </div>

        <div className={styles.testimonialCard}>
          <div className={styles.testimonialContent}>
            <p>
              "
              {t('statsSection.testimonial.quote')}
              "
            </p>
            <div className={styles.testimonialAuthor}>
              <div className={styles.authorName}>{t('statsSection.testimonial.author')}</div>
              <div className={styles.authorTitle}>{t('statsSection.testimonial.title')}</div>
            </div>
          </div>
        </div>

        <div className={styles.caseStudies}>
          <div className={styles.caseStudy}>
            <div className={styles.caseTitle}>{t('statsSection.caseStudies.timeSaved.title')}</div>
            <div className={styles.caseNumber}>{t('statsSection.caseStudies.timeSaved.number')}</div>
          </div>
          <div className={styles.caseStudy}>
            <div className={styles.caseTitle}>{t('statsSection.caseStudies.aiAssistant.title')}</div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Community section
function CommunitySection() {
  const { t } = useTransClient('home')
  const [hoveredButton, setHoveredButton] = useState<string | null>(null)

  return (
    <section className={styles.communitySection}>
      <div className={styles.communityContainer}>
        <div className={styles.sectionBadge}>
          <div className={styles.badgeIcon}></div>
          <span>{t('communitySection.badge')}</span>
        </div>

        <h2 className={styles.communityTitle}>
          {t('communitySection.title')}
          <br />
          <span className={styles.titleBlue}>{t('communitySection.titleBlue')}</span>
        </h2>

        <p className={styles.communitySubtitle}>
          {t('communitySection.subtitle')}
        </p>

        <div className={styles.communityButtons}>
          <div className={styles.buttonWrapper}>
            <button
              className={styles.githubBtn}
              onMouseEnter={() => setHoveredButton('wechat')}
              onMouseLeave={() => setHoveredButton(null)}
            >
              {t('communitySection.buttons.wechat')}
              <svg className={styles.btnArrow} width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="m6 12 4-4-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {hoveredButton === 'wechat' && (
              <div className={styles.qrCodePopup}>
                <Image src={gongzhonghao} alt={t('wechat.officialAccount' as any)} width={200} height={200} className={styles.qrCodeImage} />
                <p className={styles.qrCodeText}>{t('communitySection.wechatPopup' as any)}</p>
              </div>
            )}
          </div>

          <div className={styles.buttonWrapper}>
            <button
              className={styles.discordBtn}
              onMouseEnter={() => setHoveredButton('community')}
              onMouseLeave={() => setHoveredButton(null)}
            >
              {t('communitySection.buttons.community')}
              <svg className={styles.btnArrow} width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="m6 12 4-4-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {hoveredButton === 'community' && (
              <div className={styles.qrCodePopup}>
                <Image src={gongzhonghao} alt={t('wechat.communityOfficialAccount' as any)} width={200} height={200} className={styles.qrCodeImage} />
                <p className={styles.qrCodeText}>{t('communitySection.communityPopup' as any)}</p>
              </div>
            )}
          </div>
        </div>

        <div className={styles.communityStats}>
          <div className={styles.communityStat}>
            <div className={styles.statNumber}>{t('communitySection.stats.downloads.number')}</div>
            <div className={styles.statLabel}>{t('communitySection.stats.downloads.label')}</div>
          </div>
          <div className={styles.communityStat}>
            <div className={styles.statNumber}>{t('communitySection.stats.members.number')}</div>
            <div className={styles.statLabel}>{t('communitySection.stats.members.label')}</div>
          </div>
          <div className={styles.communityStat}>
            <div className={styles.statNumber}>{t('communitySection.stats.creators.number')}</div>
            <div className={styles.statLabel}>{t('communitySection.stats.creators.label')}</div>
          </div>
        </div>

        <div className={styles.tweets}>
          {/* User sharing card area */}
        </div>
      </div>
    </section>
  )
}

// Footer
function Footer() {
  const { t } = useTransClient('home')
  const [isHovered, setIsHovered] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()
  // Background image array
  const backgroundImages = [
    IMAGE_URLS.hotspot,
    IMAGE_URLS.hotspot2,
    IMAGE_URLS.hotspot3,
    IMAGE_URLS.hotspot4,
  ]

  useEffect(() => {
    if (isHovered) {
      intervalRef.current = setInterval(() => {
        setCurrentImageIndex(prev => (prev + 1) % backgroundImages.length)
      }, 1000)
    }
    else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setCurrentImageIndex(0)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isHovered, backgroundImages.length])

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        {/* Top section: Resources and Company */}
        <div className={styles.footerTop}>
          <div className={styles.footerColumns}>
            {/* <div className={styles.footerColumn}>
              <h4>{t('footer.resources.title')}</h4>
              <a href="#docs">{t('footer.resources.links.docs')}</a>
              <a href="#blog">{t('footer.resources.links.blog')}</a>
              <a href="#education">{t('footer.resources.links.education')}</a>
              <a href="#partner">{t('footer.resources.links.partner')}</a>
              <a href="#support">{t('footer.resources.links.support')}</a>
              <a href="#roadmap">{t('footer.resources.links.roadmap')}</a>
            </div> */}

            <div className={styles.footerColumn}>
              <h4>{t('footer.company.title')}</h4>
              <a onClick={() => {
                router.push('/websit/terms-of-service')
              }}
              >
                {t('footer.company.links.terms')}
              </a>
              <a onClick={() => {
                router.push('/websit/privacy-policy')
              }}
              >
                {t('footer.company.links.privacy')}
              </a>
              <a onClick={() => {
                router.push('/websit/data-deletion')
              }}
              >
                {t('footer.company.links.data')}
              </a>
            </div>
          </div>

          <div className={styles.footerInfo}>
            <div className={styles.footerText}>
              {t('footer.description')}
            </div>

            {/* <div className={styles.socialLinks}>
              <a href="#github">{t('footer.social.github')}</a>
              <a href="#discord">{t('footer.social.discord')}</a>
              <a href="#youtube">{t('footer.social.youtube')}</a>
              <a href="#linkedin">{t('footer.social.linkedin')}</a>
              <a href="#twitter">{t('footer.social.twitter')}</a>
            </div> */}
          </div>
        </div>

        {/* Bottom section: imagine if */}
        <div className={styles.footerBottom}>
          <div
            className={styles.bigText}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {t('footer.bigText')}
            <span
              className={styles.ifText}
              style={{
                marginLeft: '80px',
                backgroundImage: isHovered ? `url(${backgroundImages[currentImageIndex]})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: isHovered ? 'transparent' : '#733DEC',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              }}
            >
              Earn
            </span>
          </div>
        
        <div className={styles.footerCopyright} style={{display: 'flex', flexDirection:'row', justifyContent: 'space-between', width: '100%'}}>

       
          <div >
            <div className={styles.copyright}>{t('footer.copyright')}</div>
            <div className={styles.tagline}>{t('footer.tagline')}</div>
          </div>
        
        <div>

       
       <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <a 
              href="https://x.com/0xDaoo" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ transition: 'opacity 0.2s', display: 'flex' }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <Image src={TwitterIcon} alt="Twitter" width={35} height={35} />
            </a>
            <a 
              href="https://www.instagram.com/harry_wang_1997/" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ transition: 'opacity 0.2s', display: 'flex' }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <Image src={InstagramIcon} alt="Instagram" width={35} height={35} />
            </a>
            <a 
              href="https://www.threads.com/@harry_wang_1997" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ transition: 'opacity 0.2s', display: 'flex' }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <Image src={ThreadsIcon} alt="Threads" width={35} height={35} />
            </a>
            <a 
              href="https://www.linkedin.com/in/honghao-wang-489b88391/" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ transition: 'opacity 0.2s', display: 'flex' }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <Image src={LinkedInIcon} alt="LinkedIn" width={35} height={35} />
            </a>
            <a 
              href="https://www.facebook.com/profile.php?id=61580112800985" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ transition: 'opacity 0.2s', display: 'flex' }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <Image src={FacebookIcon} alt="Facebook" width={35} height={35} />
            </a>
          </div>

          <div className={styles.tagline} style={{fontSize: '14px', color: '#9ca3af', textAlign:'left', marginTop:'10px'}}>Let's use AI to earn!</div>
          </div>

          </div>
        </div>
      </div>
    </footer>
  )
}

export default function Home() {
  // 状态提升：用于从 PromptGallery 应用提示词
  const [promptToApply, setPromptToApply] = useState<{prompt: string; image?: string} | null>(null)

  return (
    <div className={styles.difyHome}>
      <ReleaseBanner />
      <Hero promptToApply={promptToApply} />
      <PromptGallerySection 
        onApplyPrompt={(data) => {
          // 根据 mode 决定如何处理
          if (data.mode === 'edit' && data.image) {
            // edit 模式：设置提示词和图片
            setPromptToApply({ prompt: data.prompt, image: data.image })
          } else {
            // generate 模式：只设置提示词
            setPromptToApply({ prompt: data.prompt })
          }
        }}
      />
      <LazyLoadSection>
        <BrandBar />
      </LazyLoadSection>
      <LazyLoadSection>
        <ContentPublishingSection />
      </LazyLoadSection>
      <LazyLoadSection>
        <ContentHotspotSection />
      </LazyLoadSection>
      <LazyLoadSection>
        <ContentSearchSection />
      </LazyLoadSection>
      <LazyLoadSection>
        <CommentsSearchSection />
      </LazyLoadSection>
      <LazyLoadSection>
        <ContentEngagementSection />
      </LazyLoadSection>
      <LazyLoadSection>
        <UpcomingFeaturesSection />
      </LazyLoadSection>
      <LazyLoadSection>
        <DownloadSection />
      </LazyLoadSection>
      {/* <EnterpriseSection />
      <StatsSection /> */}
      {/* <CommunitySection /> */}
      <Footer />
    </div>
  )
}
