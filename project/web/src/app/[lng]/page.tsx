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
import { useEffect, useRef, useState } from 'react'

// Mobile app download section
import { QRCode } from 'react-qrcode-logo'
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

import styles from './styles/difyHome.module.scss'

// External image URL constants
const IMAGE_URLS = {
  calendar: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/common/web/app-screenshot/1.%20content%20publish/calendar.jpeg',
  supportChannels: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/common/web/app-screenshot/1.%20content%20publish/support_channels.jpeg',
  hotspot: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/common/web/app-screenshot/2.%20content%20hotspot/hotspot.jpg',
  hotspot2: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/common/web/app-screenshot/2.%20content%20hotspot/hotspot2.jpeg',
  hotspot3: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/common/web/app-screenshot/2.%20content%20hotspot/hotspot3.jpeg',
  hotspot4: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/common/web/app-screenshot/2.%20content%20hotspot/hotspot4.jpeg',
  contentSearch: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/common/web/app-screenshot/3.%20content%20search/contentsearch.gif',
  contentSearch1: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/common/web/app-screenshot/3.%20content%20search/contentsearch1.jpeg',
  contentSearch2: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/common/web/app-screenshot/3.%20content%20search/contentsearch2.jpeg',
  contentSearch4: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/common/web/app-screenshot/3.%20content%20search/contentsearch4.jpeg',
  commentFilter: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/common/web/app-screenshot/4.%20comments%20search/commentfilter.jpeg',
  commentFilter2: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/common/web/app-screenshot/5.%20content%20engagement/commentfilter2.jpeg',
}

// Release banner
function ReleaseBanner() {
  const { t } = useTransClient('home')

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
        {/* <svg className={styles.arrowIcon} width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="m6 12 4-4-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg> */}
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

// Hero main title section
function Hero() {
  const { t } = useTransClient('home')
  const router = useRouter()
  const { lng } = useParams()

  // AI生成相关状态
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [taskId, setTaskId] = useState('')
  
  // 消息类型定义
  type MessageItem = {
    type: 'status' | 'description' | 'error' | 'text'
    content: string
    status?: string // 状态类型，用于渲染对应图标
    loading?: boolean // 是否显示加载动画（用于媒体生成状态）
  }
  
  const [completedMessages, setCompletedMessages] = useState<MessageItem[]>([]) // 已完成显示的消息
  const [currentTypingMsg, setCurrentTypingMsg] = useState<MessageItem | null>(null) // 正在打字显示的完整消息
  const [displayedText, setDisplayedText] = useState('') // 当前已显示的文字
  const [pendingMessages, setPendingMessages] = useState<MessageItem[]>([]) // 待显示的消息队列
  const progressContainerRef = useRef<HTMLDivElement>(null) // 进度容器引用
  const [progress, setProgress] = useState(0) // 进度百分比 0-100

  // 状态对应的图标和文案
  const getStatusDisplay = (status: string) => {
    const statusConfig: Record<string, { icon: React.ReactNode; text: string; color?: string }> = {
      'THINKING': { 
        icon: <BulbOutlined style={{ marginRight: '8px', color: '#a66ae4' }} />, 
        text: 'AI思考中...',
        color: '#a66ae4'
      },
      'WAITING': { 
        icon: <ClockCircleOutlined style={{ marginRight: '8px', color: '#b78ae9' }} />, 
        text: '等待处理...',
        color: '#b78ae9'
      },
      'GENERATING_CONTENT': { 
        icon: <FileTextOutlined style={{ marginRight: '8px', color: '#a66ae4' }} />, 
        text: '内容生成中',
        color: '#a66ae4'
      },
      'GENERATING_IMAGE': { 
        icon: <PictureOutlined style={{ marginRight: '8px', color: '#8b4fd9' }} />, 
        text: '图片生成中',
        color: '#8b4fd9'
      },
      'GENERATING_VIDEO': { 
        icon: <VideoCameraOutlined style={{ marginRight: '8px', color: '#9558de' }} />, 
        text: '视频生成中',
        color: '#9558de'
      },
      'GENERATING_TEXT': { 
        icon: <EditOutlined style={{ marginRight: '8px', color: '#a66ae4' }} />, 
        text: '文本生成中',
        color: '#a66ae4'
      },
      'COMPLETED': { 
        icon: <CheckCircleOutlined style={{ marginRight: '8px', color: '#52c41a' }} />, 
        text: '生成完成！',
        color: '#52c41a'
      },
      'FAILED': { 
        icon: <CloseCircleOutlined style={{ marginRight: '8px', color: '#ff4d4f' }} />, 
        text: '生成失败',
        color: '#ff4d4f'
      },
      'CANCELLED': { 
        icon: <StopOutlined style={{ marginRight: '8px', color: '#8c8c8c' }} />, 
        text: '已取消',
        color: '#8c8c8c'
      },
    }
    return statusConfig[status] || { icon: null, text: status, color: '#333' }
  }

  // 计算进度（接收当前进度作为参数，避免闭包问题）
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

    // 如果是生成中的状态（非首次），增加5%
    const generatingStatuses = ['GENERATING_CONTENT', 'GENERATING_IMAGE', 'GENERATING_VIDEO', 'GENERATING_TEXT']
    
    if (generatingStatuses.includes(status) && !isNewStatus) {
      // 每次轮询增加5%，但不超过99%
      return Math.min(currentProgress + 5, 99)
    }

    // 新状态时，取当前进度和基础进度的较大值（确保进度只增不减）
    if (isNewStatus) {
      const targetProgress = baseProgress[status]
      if (targetProgress !== undefined) {
        return Math.max(currentProgress, targetProgress)
      }
    }

    return currentProgress
  }

  // 添加新消息到队列
  const addMessageToQueue = (msg: MessageItem) => {
    setPendingMessages(prev => [...prev, msg])
  }

  // 打字机效果 - 处理消息队列
  useEffect(() => {
    // 如果当前没有正在打字的消息，且队列中有待显示的消息
    if (!currentTypingMsg && pendingMessages.length > 0) {
      const nextMsg = pendingMessages[0]
      setCurrentTypingMsg(nextMsg)
      setDisplayedText('')
      setPendingMessages(prev => prev.slice(1))
    }
  }, [currentTypingMsg, pendingMessages])

  // 打字机效果 - 逐字显示
  useEffect(() => {
    if (currentTypingMsg && displayedText.length < currentTypingMsg.content.length) {
      const timer = setTimeout(() => {
        setDisplayedText(currentTypingMsg.content.slice(0, displayedText.length + 1))
      }, 80) // 打字速度 80ms/字符

      return () => clearTimeout(timer)
    } 
    // 当前消息打完了
    else if (currentTypingMsg && displayedText.length >= currentTypingMsg.content.length) {
      const timer = setTimeout(() => {
        // 将当前消息移到已完成列表
        setCompletedMessages(prev => [...prev, currentTypingMsg])
        setCurrentTypingMsg(null)
        setDisplayedText('')
      }, 200) // 等待200ms后开始下一条

      return () => clearTimeout(timer)
    }
  }, [currentTypingMsg, displayedText])

  // 自动滚动到底部
  useEffect(() => {
    if (progressContainerRef.current) {
      progressContainerRef.current.scrollTop = progressContainerRef.current.scrollHeight
    }
  }, [completedMessages, displayedText])

  // 创建任务
  const handleCreateTask = async () => {
    if (!prompt.trim()) {
      alert('请输入生成内容的提示词')
      return
    }

    try {
      setIsGenerating(true)
      setCompletedMessages([])
      setPendingMessages([])
      setCurrentTypingMsg(null)
      setDisplayedText('')
      setProgress(0) // 重置进度

      // 第一步：固定显示 THINKING
      addMessageToQueue({
        type: 'status',
        content: 'AI思考中...',
        status: 'THINKING'
      })

      // 第二步：显示用户的提示词
      addMessageToQueue({
        type: 'text',
        content: `📝 创作主题：${prompt}`
      })

      // 设置初始进度为10%
      setProgress(10)

      // 动态导入API
      const { agentApi } = await import('@/api/agent')

      // 创建任务
      const createRes = await agentApi.createTask({ prompt })
      if (createRes?.code === 0 && createRes.data?.id) {
        const newTaskId = createRes.data.id
        setTaskId(newTaskId)
        
        // 开始轮询任务状态
        pollTaskStatus(newTaskId)
      } else {
        throw new Error('创建任务失败')
      }
    } catch (error: any) {
      console.error('创建任务失败:', error)
      alert(`创建任务失败: ${error.message || '未知错误'}`)
      setIsGenerating(false)
      setProgress(0) // 进度归零
    }
  }

  // 轮询任务状态
  const pollTaskStatus = async (taskId: string) => {
    const { agentApi } = await import('@/api/agent')
    let lastStatus = ''
    let hasShownTitle = false
    let hasShownDescription = false

    const poll = async () => {
      try {
        const res = await agentApi.getTaskDetail(taskId)
        
        if (res?.code === 0 && res.data) {
          const taskData = res.data

          // 如果有title且还没显示过，显示一次
          if (taskData.title && !hasShownTitle) {
            addMessageToQueue({
              type: 'text',
              content: `✨ 生成主题：${taskData.title}`
            })
            hasShownTitle = true
          }

          // 如果有description且还没显示过，优先显示（在状态之前）
          if (taskData.description && !hasShownDescription) {
            addMessageToQueue({
              type: 'description',
              content: `📄 ${taskData.description}`
            })
            hasShownDescription = true
          }

          // 状态变化时添加新消息到队列（跳过THINKING，因为已经在第一步显示）
          if (taskData.status !== lastStatus && taskData.status !== 'THINKING') {
            const statusDisplay = getStatusDisplay(taskData.status)
            // 对于媒体生成状态，标记需要加载动画
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
            
            // 更新进度（新状态）- 使用函数式更新避免闭包问题
            setProgress(prev => calculateProgress(taskData.status, true, prev))
            
            lastStatus = taskData.status
          } else if (taskData.status === 'THINKING') {
            // 只记录状态，不显示消息
            lastStatus = taskData.status
          } else if (taskData.status === lastStatus) {
            // 相同状态下，如果是生成中状态，增加进度
            const generatingStatuses = ['GENERATING_CONTENT', 'GENERATING_IMAGE', 'GENERATING_VIDEO', 'GENERATING_TEXT']
            if (generatingStatuses.includes(taskData.status)) {
              // 使用函数式更新避免闭包问题
              setProgress(prev => calculateProgress(taskData.status, false, prev))
            }
          }

          // 如果任务完成
          if (taskData.status === 'COMPLETED') {
            setIsGenerating(false)
            
            // 延迟跳转，确保最后的消息显示完成
            setTimeout(() => {
              // 构建跳转参数
              const queryParams = new URLSearchParams({
                aiGenerated: 'true',
                taskId: taskData.id,
                title: taskData.title || '',
                description: taskData.description || '',
                tags: JSON.stringify(taskData.tags || []),
                medias: JSON.stringify(taskData.medias || []),
              })
              
              // 跳转到accounts页面
              router.push(`/${lng}/accounts?${queryParams.toString()}`)
            }, 1500)
            return
          }
          // 如果任务失败
          else if (taskData.status === 'FAILED') {
            addMessageToQueue({
              type: 'error',
              content: `失败原因: ${taskData.errorMessage || '未知错误'}`
            })
            setIsGenerating(false)
            setProgress(0) // 进度归零
            return
          }
          // 如果任务取消
          else if (taskData.status === 'CANCELLED') {
            setIsGenerating(false)
            setProgress(0) // 进度归零
            return
          }

          // 继续轮询
          setTimeout(poll, 2000)
        }
      } catch (error) {
        console.error('查询任务状态失败:', error)
        setTimeout(poll, 2000)
      }
    }

    // 开始轮询
    poll()

    // 设置最大轮询时间为10分钟
    setTimeout(() => {
      if (isGenerating) {
        setIsGenerating(false)
        setProgress(0) // 进度归零
        addMessageToQueue({
          type: 'error',
          content: '任务超时，请稍后重试'
        })
      }
    }, 600000)
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

        {/* AI生成输入框 */}
        <div className={styles.aiGenerationWrapper}>
          <div className={styles.aiInputContainer}>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isGenerating) {
                  handleCreateTask()
                }
              }}
              placeholder="输入你想创作的内容，AI将为你生成完整的作品..."
              disabled={isGenerating}
              className={styles.aiInput}
            />
            <button
              onClick={handleCreateTask}
              disabled={isGenerating || !prompt.trim()}
              className={styles.aiGenerateBtn}
            >
              {isGenerating ? '生成中...' : '生成作品'}
            </button>
          </div>

          {/* 进度显示区域 */}
          {(isGenerating || completedMessages.length > 0 || currentTypingMsg) && (
            <div className={styles.aiProgressWrapper}>
              <div 
                ref={progressContainerRef}
                className={styles.aiProgressContainer}
                style={{
                  borderBottom: progress > 0 ? 'none' : '1px solid rgba(0, 0, 0, 0.08)',
                  borderRadius: progress > 0 ? '12px 12px 0 0' : '12px',
                }}
              >
                {/* 顶部加载指示器 - 只在生成时显示 */}
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
                
                {/* 连续文本流显示 */}
                <div className={styles.aiProgressContent}>
                  {/* 已完成的消息 - 连续文本 */}
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
                  
                  {/* 当前正在打字的消息 */}
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
              
              {/* 进度条 - 进度大于0时才显示 */}
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

        <p className={styles.heroSubtitle}>
          {t('hero.subtitle')}
        </p>

        {/* Desktop button */}
        <button
          onClick={() => {
            router.push('/accounts')
          }}
          className={`${styles.heroBtn} ${styles.heroBtnDesktop}`}
        >
          {t('hero.getStarted')}
          <svg className={styles.btnArrow} width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="m6 12 4-4-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <p
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
        </p>
      </div>
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
                    src="https://aitoearn.s3.ap-southeast-1.amazonaws.com/production/temp/uploads/890044ad-c3a3-4a4c-8981-0eb72abff538.mp4"
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
  return (
    <div className={styles.difyHome}>
      <ReleaseBanner />
      <Hero />
      <BrandBar />
      <ContentPublishingSection />
      <ContentHotspotSection />
      <ContentSearchSection />
      <CommentsSearchSection />
      <ContentEngagementSection />
      <UpcomingFeaturesSection />
      <DownloadSection />
      {/* <EnterpriseSection />
      <StatsSection /> */}
      {/* <CommunitySection /> */}
      <Footer />
    </div>
  )
}
