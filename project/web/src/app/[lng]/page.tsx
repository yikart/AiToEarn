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
} from '@ant-design/icons'


import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { useUserStore } from '@/store/user'
import ReactMarkdown from 'react-markdown'
import { QRCode } from 'react-qrcode-logo'

import { message, Modal, Form, Input, Button } from 'antd'


// Import SVG icons
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

import { getMainAppDownloadUrlSync } from '../config/appDownloadConfig'
import { useTransClient } from '../i18n/client'
import { getOssUrl } from '@/utils/oss'


import { 
  loginWithMailApi, 
  mailRegistApi,
  googleLoginApi,
} from '@/api/apiReq'

import styles from './styles/difyHome.module.scss'
import loginStyles from './login/login.module.css'


import PromptGallerySection from './components/PromptGallery'

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
  const [taskId, setTaskId] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [uploadedImages, setUploadedImages] = useState<string[]>([]) // 上传的图片链接
  const [isUploading, setIsUploading] = useState(false) // 上传状态
  const fileInputRef = useRef<HTMLInputElement>(null) // 文件输入框引用
  const [selectedMode, setSelectedMode] = useState<'agent' | 'image' | 'video' | 'draft' | 'publishbatch'>('agent') // 选中的模式
  
  // Login modal states
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [registCode, setRegistCode] = useState('')
  const [loginForm] = Form.useForm()
  const [isActivating, setIsActivating] = useState(false)

  // 应用提示词（从 PromptGallery 触发）
  useEffect(() => {
    if (promptToApply) {
      setPrompt(promptToApply.prompt)
      // 不再自动添加图片
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

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    try {
      // 动态导入
      const { uploadToOss } = await import('@/api/oss')
      const { OSS_URL } = await import('@/constant')
      
      // 并行上传所有图片
      const uploadPromises = Array.from(files).map(async (file) => {
        const ossKey = await uploadToOss(file)
        const ossUrl = `${OSS_URL}${ossKey}`
        return ossUrl
      })
      
      // 等待所有上传完成，得到完整的OSS URL
      const imageUrls = await Promise.all(uploadPromises)
      
      console.log('上传成功的完整URLs:', imageUrls)
      
      // 添加到已上传图片列表
      setUploadedImages(prev => [...prev, ...imageUrls])
      message.success(t('aiGeneration.uploadSuccess' as any))
      
    } catch (error) {
      console.error('Image upload failed:', error)
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

  // Login handlers
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await loginWithMailApi({ mail: loginEmail, password: loginPassword })
      if (!response) return

      if (response.code === 0) {
        if (response.data.type === 'regist') {
          // User not registered, show registration modal
          setRegistCode(response.data.code || '')
          loginForm.setFieldsValue({ password: loginPassword })
          setIsModalOpen(true)
        } else if (response.data.token) {
          // Login successful
          setToken(response.data.token)
          if (response.data.userInfo) {
            setUserInfo(response.data.userInfo)
          }
          message.success(tLogin('loginSuccess'))
          setLoginModalOpen(false)
          // Continue with task creation
          handleCreateTask()
        }
      } else {
        message.error(response.message || tLogin('loginFailed'))
      }
    } catch (error) {
      message.error(tLogin('loginError'))
    }
  }

  const handleRegistSubmit = async (values: { password: string, code: string, inviteCode?: string }) => {
    try {
      setIsActivating(true)
      const response = await mailRegistApi({
        mail: loginEmail,
        code: values.code,
        password: values.password,
        inviteCode: values.inviteCode || '',
      })

      if (!response) {
        message.error(tLogin('registerError'))
        setIsActivating(false)
        return
      }

      if (response.code === 0 && response.data.token) {
        setIsActivating(false)
        setIsModalOpen(false)
        setLoginModalOpen(false)
        loginForm.resetFields()
        setToken(response.data.token)
        if (response.data.userInfo) {
          setUserInfo(response.data.userInfo)
        }
        message.success(tLogin('registerSuccess'))
        // Continue with task creation
        handleCreateTask()
      } else {
        message.error(response.message || tLogin('registerError'))
        setIsActivating(false)
      }
    } catch (error) {
      message.error(tLogin('registerError'))
      setIsActivating(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const params: any = {
        platform: 'google',
        clientId: credentialResponse.clientId,
        credential: credentialResponse.credential,
      }

      const response: any = await googleLoginApi(params)
      if (!response) {
        message.error(tLogin('googleLoginFailed'))
        return
      }

      if (response.code === 0 && response.data.type === 'login') {
        setToken(response.data.token)
        if (response.data.userInfo) {
          setUserInfo(response.data.userInfo)
        }
        message.success(tLogin('loginSuccess'))
        setLoginModalOpen(false)
        // Continue with task creation
        handleCreateTask()
      } else {
        message.error(response.message || tLogin('googleLoginFailed'))
      }
    } catch (error) {
      message.error(tLogin('googleLoginFailed'))
    }
  }

  // Create AI generation task with SSE
  const handleCreateTask = async () => {
    if (!prompt.trim()) {
      return
    }
    
    // Check if user is logged in
    if (!token) {
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
      setMarkdownMessages([])
      setSessionId('')

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

      // Set initial progress to 10%
      setProgress(10)

      // 构建完整的提示词（包含图片链接，但不在前端显示）
      let fullPrompt = prompt
      if (uploadedImages.length > 0) {
        fullPrompt = `${prompt}\n\n[image]:\n${uploadedImages.join('\n ')}`
      }

      // Dynamic import API
      const { agentApi } = await import('@/api/agent')

      // Create task with SSE (使用包含图片链接的完整提示词)
      await agentApi.createTaskWithSSE(
        { prompt: fullPrompt },
        // onMessage callback
        (sseMessage: any) => {
          console.log('SSE Message:', sseMessage)

          // Save sessionId
          if (sseMessage.sessionId) {
            setSessionId(sseMessage.sessionId)
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
          
          if (sseMessage.type === 'status' && sseMessage.status) {
            // Update statu
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
          
          // SSE completed, fetch final result
          if (finalSessionId) {
            try {
              const res = await agentApi.getTaskDetail(finalSessionId)
              
              if (res?.code === 0 && res.data) {
                const taskData = res.data

                // Show completion status
                addMessageToQueue({
                  type: 'status',
                  content: t('aiGeneration.status.completed' as any),
                  status: 'COMPLETED'
                })

                setProgress(100)
                setIsGenerating(false)

                // Navigate to accounts page after delay
                setTimeout(() => {
                  const queryParams = new URLSearchParams({
                    aiGenerated: 'true',
                    taskId: taskData.id,
                    title: taskData.title || '',
                    description: taskData.description || '',
                    tags: JSON.stringify(taskData.tags || []),
                    medias: JSON.stringify(taskData.medias || []),
                  })
                  
                  router.push(`/${lng}/accounts?${queryParams.toString()}`)
                }, 1500)
              }
            }
            catch (error) {
              console.error('Failed to fetch task detail:', error)
              setIsGenerating(false)
            }
          }
          else {
            setIsGenerating(false)
          }
        }
      )
    }
    catch (error: any) {
      console.error('Create task error:', error)
      message.error(`${t('aiGeneration.createTaskFailed' as any)}: ${error.message || t('aiGeneration.unknownError' as any)}`)
      setIsGenerating(false)
      setProgress(0)
    }
  }

  // Removed pollTaskStatus function - now using SSE instead
  /* const pollTaskStatus = async (taskId: string) => {
    const { agentApi } = await import('@/api/agent')
    let lastStatus = ''
    let hasShownTitle = false
    let hasShownDescription = false

    const poll = async () => {
      try {
        const res = await agentApi.getTaskDetail(taskId)
        
        if (res?.code === 0 && res.data) {
          const taskData = res.data

          // Show title if available and not shown yet
          if (taskData.title && !hasShownTitle) {
            addMessageToQueue({
              type: 'text',
              content: `✨ ${t('aiGeneration.generatedTitlePrefix' as any)}${taskData.title}`
            })
            hasShownTitle = true
          }

          // Show description if available and not shown yet (before status)
          if (taskData.description && !hasShownDescription) {
            addMessageToQueue({
              type: 'description',
              content: `${t('aiGeneration.descriptionPrefix' as any)}${taskData.description}`
            })
            hasShownDescription = true
          }

          // Add new message when status changes (skip THINKING as it's already shown in step 1)
          if (taskData.status !== lastStatus && taskData.status !== 'THINKING') {
            const statusDisplay = getStatusDisplay(taskData.status)
            // Mark media generation statuses to need loading animation
            const needsLoadingAnimation = taskData.status === 'GENERATING_VIDEO' || 
                                         taskData.status === 'GENERATING_IMAGE' ||
                                         taskData.status === 'GENERATING_CONTENT' ||
                                         taskData.status === 'GENERATING_TEXT'
            
            addMessageToQueue({
              type: 'status',
              content: statusDisplay.text,
              status: taskData.status,
              loading: needsLoadingAnimation
            } as any)
            
            // Update progress (new status) - use functional update to avoid closure issues
            setProgress(prev => calculateProgress(taskData.status, true, prev))
            
            lastStatus = taskData.status
          } else if (taskData.status === 'THINKING') {
            // Only record status, don't show message
            lastStatus = taskData.status
          } else if (taskData.status === lastStatus) {
            // For same status, if it's generating status, increase progress
            const generatingStatuses = ['GENERATING_CONTENT', 'GENERATING_IMAGE', 'GENERATING_VIDEO', 'GENERATING_TEXT']
            if (generatingStatuses.includes(taskData.status)) {
              // Use functional update to avoid closure issues
              setProgress(prev => calculateProgress(taskData.status, false, prev))
            }
          }

          // If task completed
          if (taskData.status === 'COMPLETED') {
            setIsGenerating(false)
            
            // Delay navigation to ensure last message is displayed
            setTimeout(() => {
              // Build navigation params
              const queryParams = new URLSearchParams({
                aiGenerated: 'true',
                taskId: taskData.id,
                title: taskData.title || '',
                description: taskData.description || '',
                tags: JSON.stringify(taskData.tags || []),
                medias: JSON.stringify(taskData.medias || []),
              })
              
              // Navigate to accounts page
              router.push(`/${lng}/accounts?${queryParams.toString()}`)
            }, 1500)
            return
          }
          // If task failed
          else if (taskData.status === 'FAILED') {
            addMessageToQueue({
              type: 'error',
              content: `${t('aiGeneration.failedReasonPrefix' as any)}${taskData.errorMessage || t('aiGeneration.unknownError' as any)}`
            })
            setIsGenerating(false)
            setProgress(0) // Reset progress
            return
          }
          // If task cancelled
          else if (taskData.status === 'CANCELLED') {
            setIsGenerating(false)
            setProgress(0) // Reset progress
            return
          }

          // Continue polling
          setTimeout(poll, 2000)
        }
      } catch (error) {
        setTimeout(poll, 2000)
      }
    }

    // Start polling
    poll()

    // Set maximum polling time to 10 minutes
    setTimeout(() => {
      if (isGenerating) {
        setIsGenerating(false)
        setProgress(0) // Reset progress
        addMessageToQueue({
          type: 'error',
          content: t('aiGeneration.taskTimeout' as any)
        })
      }
    }, 600000)
  } */

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
            style={{ backgroundImage: `url(${getImageUrl(jimengangent)})` }}
          >
            <div className={styles.modeContent}>
              <div className={styles.modeTitle}>Agent 模式</div>
              {selectedMode === 'agent' && (
                <div className={styles.modeDescription}>灵感来了?一句话帮你开始创作</div>
              )}
              {selectedMode !== 'agent' && (
                <svg className={styles.modeArrow} width="16" height="16" viewBox="0 0 10 10" fill="none">
                  <path d="M3.253 1.172a.604.604 0 0 1 .854.005l3.359 3.398a.604.604 0 0 1 0 .85L4.107 8.823a.604.604 0 0 1-.859-.85L6.187 5 3.248 2.026a.604.604 0 0 1 .005-.854Z" fill="currentColor"/>
                </svg>
              )}
            </div>
          </div>
          
          {/* <div 
            className={`${styles.modeItem} ${selectedMode === 'image' ? styles.modeItemActive : ''}`}
            onClick={() => setSelectedMode('image')}
            style={{ backgroundImage: `url(${getImageUrl(jimengshengtu)})` }}
          >
            <div className={styles.modeContent}>
              <div className={styles.modeTitle}>图片生成</div>
              {selectedMode === 'image' && (
                <div className={styles.modeDescription}>支持多图参考 · 生成系列组图</div>
              )}
              {selectedMode !== 'image' && (
                <svg className={styles.modeArrow} width="16" height="16" viewBox="0 0 10 10" fill="none">
                  <path d="M3.253 1.172a.604.604 0 0 1 .854.005l3.359 3.398a.604.604 0 0 1 0 .85L4.107 8.823a.604.604 0 0 1-.859-.85L6.187 5 3.248 2.026a.604.604 0 0 1 .005-.854Z" fill="currentColor"/>
                </svg>
              )}
            </div>
          </div>
          
          <div 
            className={`${styles.modeItem} ${selectedMode === 'video' ? styles.modeItemActive : ''}`}
            onClick={() => setSelectedMode('video')}
            style={{ backgroundImage: `url(${getImageUrl(jimengshengshipin)})` }}
          >
            <div className={styles.modeContent}>
              <div className={styles.modeTitle}>视频生成</div>
              {selectedMode === 'video' && (
                <div className={styles.modeDescription}>智能多帧 · 超长镜头轻松生成</div>
              )}
              {selectedMode !== 'video' && (
                <svg className={styles.modeArrow} width="16" height="16" viewBox="0 0 10 10" fill="none">
                  <path d="M3.253 1.172a.604.604 0 0 1 .854.005l3.359 3.398a.604.604 0 0 1 0 .85L4.107 8.823a.604.604 0 0 1-.859-.85L6.187 5 3.248 2.026a.604.604 0 0 1 .005-.854Z" fill="currentColor"/>
                </svg>
              )}
            </div>
          </div> */}
          
          <div 
            className={`${styles.modeItem} ${selectedMode === 'draft' ? styles.modeItemActive : ''}`}
            onClick={() => setSelectedMode('draft')}
            style={{ backgroundImage: `url(${getImageUrl(jimengshuziren)})` }}
          >
            <div className={styles.modeContent}>
              <div className={styles.modeTitle}>草稿箱</div>
              {selectedMode === 'draft' && (
                <div className={styles.modeDescription}>智能数字人 · 无限创造可能</div>
              )}
              {selectedMode !== 'draft' && (
                <svg className={styles.modeArrow} width="16" height="16" viewBox="0 0 10 10" fill="none">
                  <path d="M3.253 1.172a.604.604 0 0 1 .854.005l3.359 3.398a.604.604 0 0 1 0 .85L4.107 8.823a.604.604 0 0 1-.859-.85L6.187 5 3.248 2.026a.604.604 0 0 1 .005-.854Z" fill="currentColor"/>
                </svg>
              )}
            </div>
          </div>
          
          <div 
            className={`${styles.modeItem} ${selectedMode === 'publishbatch' ? styles.modeItemActive : ''}`}
            onClick={() => setSelectedMode('publishbatch')}
            style={{ backgroundImage: `url(${getImageUrl(jimengdongzuo)})` }}
          >
            <div className={styles.modeContent}>
              <div className={styles.modeTitle}>批次发布</div>
              {selectedMode === 'publishbatch' && (
                <div className={styles.modeDescription}>响应更灵动 跟随质量高</div>
              )}
              {selectedMode !== 'publishbatch' && (
                <svg className={styles.modeArrow} width="16" height="16" viewBox="0 0 10 10" fill="none">
                  <path d="M3.253 1.172a.604.604 0 0 1 .854.005l3.359 3.398a.604.604 0 0 1 0 .85L4.107 8.823a.604.604 0 0 1-.859-.85L6.187 5 3.248 2.026a.604.604 0 0 1 .005-.854Z" fill="currentColor"/>
                </svg>
              )}
            </div>
          </div>
        </div>

        {/* AI Generation Input */}
        <div className={styles.aiGenerationWrapper}>
          <div className={styles.aiInputContainer}>
           
            <div className={styles.uploadedImagesPreview}>
              <div className={styles.imagesRow}>
                {uploadedImages.length > 0 && uploadedImages.map((imageUrl, index) => (
                  <div key={index} className={styles.imageItem}>
                    <img 
                      src={imageUrl} 
                      alt={`pic ${index + 1}`} 
                      className={styles.imageThumb}
                    />
                    {!isGenerating && (
                      <span
                        className={styles.removeImageBtn}
                        onClick={() => handleRemoveImage(index)}
                        title="remove image"
                      >
                        <CloseCircleOutlined />
                      </span>
                    )}
                  </div>
                ))}

                {/* 图片上传按钮 */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isGenerating || isUploading}
                    className={styles.aiUploadBtn}
                    title="上传图片"
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
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !isGenerating && !isUploading) {
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
                  {selectedMode === 'agent' && 'Agent 模式'}
                  {selectedMode === 'image' && '图片生成'}
                  {selectedMode === 'video' && '视频生成'}
                  {selectedMode === 'draft' && '草稿箱'}
                  {selectedMode === 'publishbatch' && '批次发布'}
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              
            </div>
            <button 
              className={styles.scrollTopBtn}
              onClick={handleCreateTask}
              disabled={isGenerating || !prompt.trim() || isUploading}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12.002 3c.424 0 .806.177 1.079.46l5.98 5.98.103.114a1.5 1.5 0 0 1-2.225 2.006l-3.437-3.436V19.5l-.008.153a1.5 1.5 0 0 1-2.985 0l-.007-.153V8.122l-3.44 3.438a1.5 1.5 0 0 1-2.225-2.006l.103-.115 6-5.999.025-.025.059-.052.044-.037c.029-.023.06-.044.09-.065l.014-.01a1.43 1.43 0 0 1 .101-.062l.03-.017c.209-.11.447-.172.699-.172Z" fill="currentColor"/>
              </svg>
            </button>
          </div>
          </div>

         

          {/* Progress Display Area - COMMENTED OUT, KEPT FOR REFERENCE */}
          {/* {(isGenerating || completedMessages.length > 0 || currentTypingMsg) && (
            <div className={styles.aiProgressWrapper}>
              <div 
                ref={progressContainerRef}
                className={styles.aiProgressContainer}
                style={{
                  borderBottom: progress > 0 ? 'none' : '1px solid rgba(0, 0, 0, 0.08)',
                  borderRadius: progress > 0 ? '12px 12px 0 0' : '12px',
                }}
              >
                {isGenerating && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent, #a66ae4, transparent)',
                    animation: 'slideRight 2s infinite',
                    zIndex: 10,
                  }} />
                )}
                
                <div className={styles.aiProgressContent}>
                  {completedMessages.map((msg, index) => {
                    const statusDisplay = msg.status ? getStatusDisplay(msg.status) : null
                    const isDescription = msg.type === 'description'
                    const isError = msg.type === 'error'
                    const isText = msg.type === 'text'
                    
                    return (
                      <div 
                        key={`completed-${index}`}
                        className={styles.aiProgressMessage}
                        style={{
                          color: isError ? '#ff4d4f' : statusDisplay?.color || '#333',
                        }}
                      >
                        {statusDisplay && statusDisplay.icon}
                        {isDescription && <FileTextOutlined style={{ marginRight: '8px', color: '#52c41a', flexShrink: 0 }} />}
                        {isError && <CloseCircleOutlined style={{ marginRight: '8px', color: '#ff4d4f', flexShrink: 0 }} />}
                        {isText && !statusDisplay && <span style={{ marginRight: '8px' }}></span>}
                        <span style={{ textAlign: 'left', flex: 1 }}>
                          {msg.content}
                          {msg.loading && <LoadingDots />}
                        </span>
                      </div>
                    )
                  })}
                  
                  {currentTypingMsg && displayedText && (
                    <div 
                      className={styles.aiProgressMessage}
                      style={{ 
                        color: currentTypingMsg.type === 'error' 
                          ? '#ff4d4f' 
                          : currentTypingMsg.status 
                            ? getStatusDisplay(currentTypingMsg.status).color 
                            : '#333',
                      }}
                    >
                      {currentTypingMsg.status && getStatusDisplay(currentTypingMsg.status).icon}
                      {currentTypingMsg.type === 'description' && <FileTextOutlined style={{ marginRight: '8px', color: '#52c41a', flexShrink: 0 }} />}
                      {currentTypingMsg.type === 'error' && <CloseCircleOutlined style={{ marginRight: '8px', color: '#ff4d4f', flexShrink: 0 }} />}
                      {currentTypingMsg.type === 'text' && !currentTypingMsg.status && <span style={{ marginRight: '8px' }}></span>}
                      <span style={{ textAlign: 'left', flex: 1 }}>
                        {displayedText}
                        {currentTypingMsg.loading && <LoadingDots />}
                        <span className={styles.aiProgressCursor}>|</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {progress > 0 && (
                <div className={styles.aiProgressBarContainer}>
                  <div 
                    className={styles.aiProgressBar}
                    style={{ width: `${progress}%` }}
                  >
                    <span className={styles.aiProgressText}>{progress}%</span>
                  </div>
                </div>
              )}
            </div>
          )} */}

          {/* SSE Message Display - Visible when generating or has messages */}
          {(isGenerating || markdownMessages.length > 0) && (
            <div className={styles.markdownMessagesWrapper}>
              <div 
                ref={markdownContainerRef}
                className={styles.markdownMessagesContainer}
              >
                <h3 className={styles.markdownTitle}>
                  <Image src={logo} alt="Logo" className={styles.logoAi} />
                   AI 生成过程 {isGenerating && <LoadingDots />}
                </h3>
                <div className={styles.markdownContent}>
                  <ReactMarkdown>
                    {markdownMessages.length > 0 
                      ? markdownMessages.join('\n\n') 
                      : '等待 AI 响应...'}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}

          
        </div>

        {/* Mobile button */}
        <button
          onClick={() => {
            router.push('/accounts')
          }}
          className={`${styles.heroBtn} ${styles.heroBtnMobile}`}
          style={{ marginTop: '20px' }}
        >
          {t('hero.getStarted')}
          <svg className={styles.btnArrow} width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="m6 12 4-4-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>



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
      <Modal
        open={loginModalOpen}
        onCancel={() => setLoginModalOpen(false)}
        footer={null}
        width={460}
        centered
        destroyOnClose
      >
        <div className={loginStyles.loginBox} style={{ boxShadow: 'none', padding: '24px 0' }}>
          <h1 className={loginStyles.title}>{tLogin('welcomeBack')}</h1>
          <form onSubmit={handleLoginSubmit} className={loginStyles.form}>
            <div className={loginStyles.inputGroup}>
              <input
                type="email"
                placeholder={tLogin('emailPlaceholder')}
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                className={loginStyles.input}
                required
              />
            </div>
            <div className={loginStyles.inputGroup}>
              <input
                type="password"
                placeholder={tLogin('passwordPlaceholder')}
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                className={loginStyles.input}
                required
              />
            </div>
            <Button type="primary" htmlType="submit" block className={loginStyles.submitButton}>
              {tLogin('login')}
            </Button>
          </form>

          <div className={loginStyles.divider}>
            <span>{tLogin('or')}</span>
          </div>

          <div className={loginStyles.googleButtonWrapper}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => message.error(tLogin('googleLoginFailed'))}
              useOneTap={false}
              theme="outline"
              shape="rectangular"
              text="signin_with"
              locale={lng === 'zh-CN' ? 'zh_CN' : 'en'}
              width="100%"
              size="large"
            />
          </div>
        </div>
      </Modal>

      {/* Registration Modal */}
      <Modal
        title={tLogin('completeRegistration')}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false)
          setIsActivating(false)
          loginForm.resetFields()
        }}
        maskClosable={false}
        keyboard={false}
        closable={true}
        footer={null}
      >
        <Form
          form={loginForm}
          onFinish={handleRegistSubmit}
          layout="vertical"
        >
          <Form.Item
            label={tLogin('emailCode')}
            name="code"
            rules={[
              { required: true, message: tLogin('emailCodeRequired') },
              { len: 6, message: tLogin('emailCodeLength') },
            ]}
          >
            <Input placeholder={tLogin('enterEmailCode')} maxLength={6} />
          </Form.Item>

          <Form.Item
            label={tLogin('setPassword')}
            name="password"
            rules={[
              { required: true, message: tLogin('passwordRequired') },
              { min: 6, message: tLogin('passwordMinLength') },
            ]}
          >
            <Input.Password placeholder={tLogin('enterPassword')} />
          </Form.Item>

          <Form.Item
            label={tLogin('inviteCode')}
            name="inviteCode"
          >
            <Input placeholder={tLogin('enterInviteCode')} />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={isActivating}
            >
              {isActivating ? tLogin('registering') : tLogin('completeRegistration')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
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
                    <span className={styles.downloadOn}>立即下载</span>
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
                <Image src={gongzhonghao} alt="微信公众号" width={200} height={200} className={styles.qrCodeImage} />
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
                <Image src={gongzhonghao} alt="社区公众号" width={200} height={200} className={styles.qrCodeImage} />
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
        onApplyPrompt={(prompt) => {
          setPromptToApply({ prompt })
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
