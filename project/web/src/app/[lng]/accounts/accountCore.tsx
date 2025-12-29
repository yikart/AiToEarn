'use client'

import type { SocialAccount } from '@/api/types/account.type'
import type { IPublishDialogRef } from '@/components/PublishDialog'
import { NoSSR } from '@kwooshung/react-no-ssr'
import { driver } from 'driver.js'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import AccountsTopNav from '@/app/[lng]/accounts/components/AccountsTopNav'
import AddAccountModal from '@/app/[lng]/accounts/components/AddAccountModal'
import CalendarTiming from '@/app/[lng]/accounts/components/CalendarTiming'
import { AccountStatus } from '@/app/config/accountConfig'
import { AccountPlatInfoMap, PlatType } from '@/app/config/platConfig'
import { useTransClient } from '@/app/i18n/client'
import rightArrow from '@/assets/images/jiantou.png'
import PublishDialog from '@/components/PublishDialog'
import { VideoGrabFrame } from '@/components/PublishDialog/PublishDialog.util'
import { confirm } from '@/lib/confirm'
import { useAccountStore } from '@/store/account'
import { useUserStore } from '@/store/user'
import { generateUUID } from '@/utils'
import { useCalendarTiming } from './components/CalendarTiming/useCalendarTiming'
import 'driver.js/dist/driver.css'

interface AccountPageCoreProps {
  searchParams?: {
    platform?: string
    spaceId?: string
    addChannel?: string // 添加频道引导参数
    updateChannel?: string // 更新频道授权参数
    action?: string // 动作类型：publish 等
    // AI生成的内容参数
    aiGenerated?: string
    accountId?: string
    taskId?: string
    title?: string
    description?: string
    tags?: string
    medias?: string
  }
}

export default function AccountPageCore({
  searchParams,
}: AccountPageCoreProps) {
  const { accountInit, accountActive, setAccountActive, accountGroupList }
    = useAccountStore(
      useShallow(state => ({
        accountInit: state.accountInit,
        setAccountActive: state.setAccountActive,
        accountActive: state.accountActive,
        accountGroupList: state.accountGroupList,
      })),
    )

  // 添加账号弹窗状态
  const [addAccountModalOpen, setAddAccountModalOpen] = useState(false)
  const [targetPlatform, setTargetPlatform] = useState<PlatType | undefined>()
  const [targetSpaceId, setTargetSpaceId] = useState<string | undefined>()

  const { t } = useTransClient('account')
  const { t: tCommon } = useTransClient('common')
  const userStore = useUserStore()

  // 移动端下载提示弹窗开关
  const [showMobileDownload, setShowMobileDownload] = useState(false)
  // 微信浏览器提示弹窗开关
  const [showWechatBrowserTip, setShowWechatBrowserTip] = useState(false)
  // 发布弹窗状态
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [defaultAccountId, setDefaultAccountId] = useState<string>()
  const [aiGeneratedData, setAiGeneratedData] = useState<any>(null)
  const publishDialogRef = useRef<IPublishDialogRef>(null)
  const driverObjRef = useRef<ReturnType<typeof driver> | null>(null)

  useEffect(() => {
    accountInit()
  }, [])

  // 获取所有账号列表（扁平化）
  const allAccounts = accountGroupList.reduce<SocialAccount[]>((acc, group) => {
    return [...acc, ...group.children]
  }, [])

  // 处理URL参数
  useEffect(() => {
    // 处理更新频道授权（直接打开授权弹窗并自动触发）
    if (searchParams?.updateChannel) {
      const platform = searchParams.updateChannel as PlatType
      const validPlatforms = Object.values(PlatType)

      if (validPlatforms.includes(platform)) {
        // 设置目标平台
        setTargetPlatform(platform)

        // 直接打开添加账号弹窗，autoTriggerPlatform 会自动触发授权
        setTimeout(() => {
          setAddAccountModalOpen(true)
        }, 500)

        // 清除URL参数
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href)
          url.searchParams.delete('updateChannel')
          window.history.replaceState({}, '', url.toString())
        }
      }
      return
    }

    // 处理添加频道引导
    if (searchParams?.addChannel) {
      const platform = searchParams.addChannel
      const platformNames: Record<string, string> = {
        douyin: '抖音',
        xhs: '小红书',
        wxSph: '微信视频号',
        KWAI: '快手',
        youtube: 'YouTube',
        wxGzh: '微信公众号',
        bilibili: 'B站',
        twitter: 'Twitter',
        tiktok: 'TikTok',
        facebook: 'Facebook',
        instagram: 'Instagram',
        threads: 'Threads',
        pinterest: 'Pinterest',
        linkedin: 'LinkedIn',
      }
      const platformName = platformNames[platform] || '该平台'

      // 延迟一下，确保页面已完全加载
      const timer = setTimeout(() => {
        const addChannelBtn = document.querySelector('[data-driver-target="add-channel-btn"]') as HTMLElement
        if (!addChannelBtn) {
          console.warn('Add channel button not found')
          return
        }

        // 设置目标平台
        setTargetPlatform(platform as PlatType)

        const driverObj = driver({
          showProgress: false,
          showButtons: ['next'],
          nextBtnText: '知道了',
          doneBtnText: '知道了',
          popoverOffset: 10,
          stagePadding: 4,
          stageRadius: 12,
          allowClose: true,
          smoothScroll: true,
          steps: [
            {
              element: '[data-driver-target="add-channel-btn"]',
              popover: {
                title: '需要添加频道',
                description: `检测到您还没有添加${platformName}频道，点击这里添加频道`,
                side: 'top',
                align: 'start',
                onPopoverRender: () => {
                  // Popover 渲染后，更新按钮文本并添加点击事件
                  setTimeout(() => {
                    const nextBtn = document.querySelector('.driver-popover-next-btn') as HTMLButtonElement
                    const doneBtn = document.querySelector('.driver-popover-done-btn') as HTMLButtonElement
                    const btn = nextBtn || doneBtn
                    if (btn) {
                      btn.textContent = '知道了'
                      // 添加点击事件监听器
                      const handleClick = (e: MouseEvent) => {
                        e.preventDefault()
                        e.stopPropagation()
                        driverObj.destroy()
                        // 清除URL参数
                        if (typeof window !== 'undefined') {
                          const url = new URL(window.location.href)
                          url.searchParams.delete('addChannel')
                          window.history.replaceState({}, '', url.toString())
                        }
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
            // 点击按钮时关闭引导并打开添加账号弹窗
            driverObj.destroy()
            // 清除URL参数
            if (typeof window !== 'undefined') {
              const url = new URL(window.location.href)
              url.searchParams.delete('addChannel')
              window.history.replaceState({}, '', url.toString())
            }
            // 打开添加账号弹窗
            setTimeout(() => {
              setAddAccountModalOpen(true)
            }, 300)
            return false // 阻止默认行为
          },
          onDestroyStarted: () => {
            // 清除URL参数
            if (typeof window !== 'undefined') {
              const url = new URL(window.location.href)
              url.searchParams.delete('addChannel')
              window.history.replaceState({}, '', url.toString())
            }
          },
          onDestroyed: () => {
            // 清除URL参数
            if (typeof window !== 'undefined') {
              const url = new URL(window.location.href)
              url.searchParams.delete('addChannel')
              window.history.replaceState({}, '', url.toString())
            }
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
    }

    // Handle AI-generated content params
    if (searchParams?.aiGenerated === 'true' && allAccounts.length > 0) {
      try {
        const medias = searchParams.medias ? JSON.parse(decodeURIComponent(searchParams.medias)) : []
        const tags = searchParams.tags ? JSON.parse(decodeURIComponent(searchParams.tags)) : []

        const data = {
          taskId: searchParams.taskId,
          title: searchParams.title ? decodeURIComponent(searchParams.title) : '',
          description: searchParams.description ? decodeURIComponent(searchParams.description) : '',
          tags,
          medias,
        }

        setAiGeneratedData(data)

        // 如果有 platform 参数，设置目标平台
        if (searchParams.platform) {
          const platform = searchParams.platform as PlatType
          const validPlatforms = Object.values(PlatType)
          if (validPlatforms.includes(platform)) {
            setTargetPlatform(platform)
          }
        }

        // 选择账号：优先使用 accountId，其次选择对应平台的账号
        let targetAccount = null

        if (searchParams.accountId) {
          // 如果指定了 accountId，查找该账号
          targetAccount = allAccounts.find(account => account.id === searchParams.accountId)
        }
        else if (searchParams.platform) {
          // 如果指定了 platform，选择该平台的第一个在线账号
          const platform = searchParams.platform as PlatType
          targetAccount = allAccounts.find((account) => {
            const isOnline = account.status === AccountStatus.USABLE
            const isPlatformMatch = account.type === platform
            return isOnline && isPlatformMatch
          })
          // 如果没有在线账号，选择该平台的第一个账号
          if (!targetAccount) {
            targetAccount = allAccounts.find(account => account.type === platform)
          }
        }
        else {
          // 没有指定平台，选择第一个在线且PC端支持的账户
          targetAccount = allAccounts.find((account) => {
            const isOnline = account.status === AccountStatus.USABLE
            const platConfig = AccountPlatInfoMap.get(account.type)
            const isPcSupported = !platConfig?.pcNoThis
            return isOnline && isPcSupported
          })
        }

        if (targetAccount) {
          setDefaultAccountId(targetAccount.id)
        }
        else if (allAccounts[0]) {
          // 如果没有找到符合条件的账户，退而求其次选择第一个账户
          setDefaultAccountId(allAccounts[0].id)
        }

        // Open publish dialog
        setTimeout(() => {
          setPublishDialogOpen(true)
        }, 500)

        // Clear URL params
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href)
          url.searchParams.delete('action')
          url.searchParams.delete('aiGenerated')
          url.searchParams.delete('platform')
          url.searchParams.delete('accountId')
          url.searchParams.delete('taskId')
          url.searchParams.delete('title')
          url.searchParams.delete('description')
          url.searchParams.delete('tags')
          url.searchParams.delete('medias')
          window.history.replaceState({}, '', url.toString())
        }
      }
      catch (error) {
        console.error('Failed to parse AI generated data:', error)
      }
    }

    // 注意：只有在不是 AI 发布场景时才处理 platform 参数打开添加账号弹窗
    if ((searchParams?.platform || searchParams?.spaceId)
      && searchParams?.action !== 'publish'
      && searchParams?.aiGenerated !== 'true') {
      // 验证平台类型是否有效
      const platform = searchParams.platform as PlatType
      const validPlatforms = Object.values(PlatType)

      if (searchParams.platform && validPlatforms.includes(platform)) {
        setTargetPlatform(platform)
      }

      if (searchParams.spaceId) {
        setTargetSpaceId(searchParams.spaceId)
      }

      // 打开添加账号弹窗
      setAddAccountModalOpen(true)
    }
  }, [searchParams, allAccounts.length])

  /**
   * 检测是否为微信浏览器
   */
  const isWechatBrowser = () => {
    if (typeof window === 'undefined')
      return false
    const ua = window.navigator.userAgent.toLowerCase()
    return ua.includes('micromessenger')
  }

  /**
   * 在移动端首次进入 accounts 页面时，展示下载提示弹窗
   * - 条件：屏幕宽度 <= 768
   * - 只在当前会话展示一次（使用 sessionStorage 标记）
   * - 如果是微信浏览器，先显示微信浏览器提示
   */
  useEffect(() => {
    if (typeof window === 'undefined')
      return
    const isMobile = window.innerWidth <= 768
    const hasShown = sessionStorage.getItem('accountsMobileDownloadShown')
    const hasShownWechatTip = sessionStorage.getItem('accountsWechatTipShown')

    if (isMobile) {
      // 如果是微信浏览器且未显示过微信提示，先显示微信提示
      if (isWechatBrowser() && !hasShownWechatTip) {
        setShowWechatBrowserTip(true)
        sessionStorage.setItem('accountsWechatTipShown', '1')
      }
      else if (!hasShown) {
        // 非微信浏览器或已显示过微信提示，显示下载提示
        setShowMobileDownload(true)
        sessionStorage.setItem('accountsMobileDownloadShown', '1')
      }
    }
  }, [])

  /**
   * 关闭下载提示弹窗
   */
  const closeMobileDownload = () => setShowMobileDownload(false)

  /**
   * 关闭微信浏览器提示弹窗
   */
  const closeWechatBrowserTip = () => {
    setShowWechatBrowserTip(false)
    // 关闭微信提示后，显示下载提示
    const hasShown = sessionStorage.getItem('accountsMobileDownloadShown')
    if (!hasShown) {
      setShowMobileDownload(true)
      sessionStorage.setItem('accountsMobileDownloadShown', '1')
    }
  }

  /**
   * 生成下载链接（根据语言）
   */
  const getDownloadHref = () => {
    const lang = userStore.lang
    return lang === 'en'
      ? 'https://docs.aitoearn.ai/en/downloads'
      : 'https://docs.aitoearn.ai/zh/downloads'
  }

  const downloadTexts = (() => {
    const lang = userStore.lang
    if (lang === 'zh-CN') {
      return {
        title: t('mobileDownloadTip.welcomeTitle'),
        desc: t('mobileDownloadTip.description'),
        cta: t('mobileDownloadTip.downloadButton'),
      }
    }
    return {
      title: t('mobileDownloadTip.welcomeTitle'),
      desc: t('mobileDownloadTip.description'),
      cta: t('mobileDownloadTip.downloadButton'),
    }
  })()

  const wechatBrowserTexts = (() => {
    const lang = userStore.lang
    if (lang === 'zh-CN') {
      return {
        title: t('browserTip.title'),
        desc: t('browserTip.description'),
        cta: t('browserTip.button'),
      }
    }
    return {
      title: t('browserTip.title'),
      desc: t('browserTip.description'),
      cta: t('browserTip.button'),
    }
  })()

  const handleAddAccountSuccess = (accountInfo: SocialAccount) => {
    setAddAccountModalOpen(false)
    // 可以在这里添加成功提示或其他逻辑
  }

  const handleAddAccountClose = () => {
    setAddAccountModalOpen(false)
    // 清除URL参数（可选）
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.delete('platform')
      url.searchParams.delete('spaceId')
      window.history.replaceState({}, '', url.toString())
    }
  }

  // Fill AI-generated data after publish dialog opens
  useEffect(() => {
    if (aiGeneratedData && publishDialogOpen && allAccounts.length > 0) {
      // Delay filling to ensure PublishDialog is fully initialized
      const timeoutId = setTimeout(() => {
        try {
          const { usePublishDialog } = require('@/components/PublishDialog/usePublishDialog')
          const store = usePublishDialog.getState()

          // If pubList is not initialized yet, retry after delay
          if (!store.pubList || store.pubList.length === 0) {
            setTimeout(() => {
              const retryStore = usePublishDialog.getState()
              if (retryStore.pubList && retryStore.pubList.length > 0) {
                fillAIData(retryStore)
              }
            }, 1000)
            return
          }

          fillAIData(store)
        }
        catch (error) {
          console.error('Failed to fill AI data:', error)
        }
      }, 1000)

      // Helper function to fill data
      const fillAIData = async (store: any) => {
        // Build params - append tags to description
        let description = aiGeneratedData.description || ''
        if (aiGeneratedData.tags && aiGeneratedData.tags.length > 0) {
          const tagsText = aiGeneratedData.tags.map((tag: string) => `#${tag}`).join(' ')
          description = `${description}\n\n${tagsText}`
        }

        const params: any = {
          des: description,
          title: aiGeneratedData.title || '',
        }

        // Handle media files - support multiple medias
        const medias = aiGeneratedData.medias || []

        if (medias.length > 0) {
          // Check if there's a video
          const videoMedia = medias.find((m: any) => m.type === 'VIDEO')
          if (videoMedia) {
            try {
              let coverInfo

              // If API returned cover URL, use it directly (support both coverUrl and thumbUrl)
              const coverUrl = videoMedia.coverUrl || videoMedia.thumbUrl
              if (coverUrl) {
                // Load cover image to get dimension info
                coverInfo = await new Promise((resolve) => {
                  const img = document.createElement('img')
                  img.crossOrigin = 'anonymous'
                  img.onload = () => {
                    resolve({
                      id: generateUUID(),
                      width: img.width,
                      height: img.height,
                      imgUrl: coverUrl,
                      ossUrl: coverUrl,
                      filename: `ai_${aiGeneratedData.taskId}_cover.jpg`,
                      imgPath: '',
                      size: 0,
                      file: null as any,
                    })
                  }
                  img.onerror = () => {
                    resolve(null)
                  }
                  img.src = coverUrl
                })
              }

              // If no cover URL or cover load failed, try to extract from video
              if (!coverInfo) {
                try {
                  const videoInfo = await VideoGrabFrame(videoMedia.url, 0)

                  params.video = {
                    size: 0,
                    file: null as any,
                    videoUrl: videoMedia.url,
                    ossUrl: videoMedia.url,
                    filename: `ai_${aiGeneratedData.taskId}.mp4`,
                    width: videoInfo.width,
                    height: videoInfo.height,
                    duration: videoInfo.duration,
                    cover: videoInfo.cover,
                  }
                }
                catch (extractError) {
                  // Cross-origin video cannot extract cover, use placeholder
                  // Create a cover using video URL as imgUrl (browser will auto-display first frame)
                  const video = document.createElement('video')
                  video.src = videoMedia.url
                  video.crossOrigin = 'anonymous'

                  await new Promise((resolve) => {
                    video.addEventListener('loadedmetadata', () => {
                      // Use video URL as cover imgUrl, browser video tag's poster will handle it automatically
                      const placeholderCover: any = {
                        id: generateUUID(),
                        size: 0,
                        file: null as any,
                        imgUrl: videoMedia.url, // Use video URL, video tag will show first frame
                        filename: `ai_${aiGeneratedData.taskId}_cover.jpg`,
                        imgPath: '',
                        width: video.videoWidth,
                        height: video.videoHeight,
                        ossUrl: '', // No separate cover URL
                      }

                      params.video = {
                        size: 0,
                        file: null as any,
                        videoUrl: videoMedia.url,
                        ossUrl: videoMedia.url,
                        filename: `ai_${aiGeneratedData.taskId}.mp4`,
                        width: video.videoWidth,
                        height: video.videoHeight,
                        duration: Math.floor(video.duration),
                        cover: placeholderCover,
                      }
                      video.remove()
                      resolve(null)
                    })
                    video.addEventListener('error', () => {
                      // Complete failure, use default values
                      const defaultCover: any = {
                        id: generateUUID(),
                        size: 0,
                        file: null as any,
                        imgUrl: videoMedia.url,
                        filename: `ai_${aiGeneratedData.taskId}_cover.jpg`,
                        imgPath: '',
                        width: 1920,
                        height: 1080,
                        ossUrl: '',
                      }

                      params.video = {
                        size: 0,
                        file: null as any,
                        videoUrl: videoMedia.url,
                        ossUrl: videoMedia.url,
                        filename: `ai_${aiGeneratedData.taskId}.mp4`,
                        width: 1920,
                        height: 1080,
                        duration: 0,
                        cover: defaultCover,
                      }
                      video.remove()
                      resolve(null)
                    })
                    video.load()
                  })
                }
              }
              else {
                // Use API-returned cover, but still need to get width/height/duration from video
                const video = document.createElement('video')
                video.src = videoMedia.url
                video.crossOrigin = 'anonymous'

                await new Promise((resolve) => {
                  video.addEventListener('loadedmetadata', () => {
                    params.video = {
                      size: 0,
                      file: null as any,
                      videoUrl: videoMedia.url,
                      ossUrl: videoMedia.url,
                      filename: `ai_${aiGeneratedData.taskId}.mp4`,
                      width: video.videoWidth,
                      height: video.videoHeight,
                      duration: Math.floor(video.duration),
                      cover: coverInfo,
                    }
                    video.remove()
                    resolve(null)
                  })
                  video.addEventListener('error', () => {
                    // If video metadata loading fails, use default dimensions
                    params.video = {
                      size: 0,
                      file: null as any,
                      videoUrl: videoMedia.url,
                      ossUrl: videoMedia.url,
                      filename: `ai_${aiGeneratedData.taskId}.mp4`,
                      width: 1920,
                      height: 1080,
                      duration: 0,
                      cover: coverInfo,
                    }
                    video.remove()
                    resolve(null)
                  })
                  video.load()
                })
              }

              params.images = []
            }
            catch (error) {
              console.error('Failed to process video:', error)
              // If all methods fail, use default cover
              const defaultCover: any = {
                id: generateUUID(),
                size: 0,
                file: null as any,
                imgUrl: '', // Empty, will show default icon
                filename: `ai_${aiGeneratedData.taskId}_cover.jpg`,
                imgPath: '',
                width: 1920,
                height: 1080,
                ossUrl: '',
              }

              params.video = {
                size: 0,
                file: null as any,
                videoUrl: videoMedia.url,
                ossUrl: videoMedia.url,
                filename: `ai_${aiGeneratedData.taskId}.mp4`,
                width: 1920,
                height: 1080,
                duration: 0,
                cover: defaultCover,
              }
              params.images = []
            }
          }
          else {
            // Process all images
            const imageMedias = medias.filter((m: any) => m.type === 'IMAGE')
            if (imageMedias.length > 0) {
              params.images = imageMedias.map((media: any, index: number) => ({
                id: generateUUID(),
                size: 0,
                file: null as any,
                imgUrl: media.url, // Use ossUrl as preview URL
                filename: `ai_${aiGeneratedData.taskId}_${index + 1}.jpg`,
                imgPath: '',
                width: 1920,
                height: 1080,
                ossUrl: media.url, // AI-generated images already have ossUrl
              }))
              params.video = undefined
            }
          }
        }

        // Fill data to first selected account
        if (store.pubListChoosed && store.pubListChoosed.length > 0) {
          store.setOnePubParams(params, store.pubListChoosed[0].account.id)
        }
      }

      return () => clearTimeout(timeoutId)
    }
  }, [aiGeneratedData, publishDialogOpen, allAccounts.length])

  return (
    <NoSSR>
      <div className="flex flex-col h-full bg-background">
        {/* Row 1: 顶部导航栏 */}
        <AccountsTopNav
          onNewWork={() => {
            // 检查是否有可用账户
            const hasAccounts = allAccounts.some(
              account => account.status === AccountStatus.USABLE,
            )

            if (!hasAccounts) {
              // 使用 confirm 弹窗提示用户先添加账号，点击“去添加”打开添加账号弹窗
              confirm({
                title: t('noAccountWarning.title'),
                content: t('noAccountWarning.content'),
                okText: t('noAccountWarning.addAccount'),
                cancelText: tCommon('actions.cancel'),
                okType: 'default',
                onOk: async () => {
                  // 打开添加账号弹窗
                  setAddAccountModalOpen(true)
                },
              })
            }
            else {
              setPublishDialogOpen(true)
            }
          }}
          onAddAccount={() => setAddAccountModalOpen(true)}
        />

        {/* 主内容区域: CalendarTiming (包含 Row 2 工具栏和日历/列表视图) */}
        <CalendarTiming />

        {/* 添加账号弹窗 */}
        <AddAccountModal
          open={addAccountModalOpen}
          onClose={handleAddAccountClose}
          onAddSuccess={handleAddAccountSuccess}
          targetGroupId={targetSpaceId}
          showSpaceSelector={!targetSpaceId}
          autoTriggerPlatform={targetPlatform}
        />

        {/* 微信浏览器提示（遮罩 + 箭头指向右上角） */}
        {showWechatBrowserTip && (
          <>
            <div className="fixed inset-0 bg-black/85 z-[1000] animate-[fadeIn_0.2s_ease-out]" onClick={closeWechatBrowserTip} />
            <Image
              src={rightArrow}
              alt="rightArrow"
              width={120}
              height={120}
              className="fixed top-[10%] right-5 z-[1002] pointer-events-none bg-accent animate-[arrowPulse_2s_ease-in-out_infinite] rounded-full p-2.5"
            />
            <div className="fixed inset-0 z-[1001] flex items-center justify-center pointer-events-none">
              <div className="bg-background/95 rounded-2xl p-6 mx-5 max-w-[320px] shadow-[0_10px_40px_rgba(0,0,0,0.3)] backdrop-blur-[10px] pointer-events-auto animate-[tipFadeIn_0.3s_ease-out]">
                <div className="text-lg font-bold text-foreground text-center mb-5">{wechatBrowserTexts.title}</div>
                <div className="mb-5">
                  <div className="flex items-center gap-3 mb-3 text-sm text-foreground leading-normal">
                    <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">1</span>
                    <span className="flex-1">
                      {t('wechatBrowserTip.clickCorner')}
                      <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded text-xs mx-1 inline-block">⋯</span>
                      {t('wechatBrowserTip.dotsButton')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mb-3 text-sm text-foreground leading-normal">
                    <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">2</span>
                    <span className="flex-1">
                      {t('wechatBrowserTip.selectBrowser')}
                      <span className="bg-muted text-muted-foreground px-1.5 py-0.5 rounded text-xs mx-1 inline-block">🌐</span>
                      {t('wechatBrowserTip.openInBrowser')}
                    </span>
                  </div>
                </div>
                <button
                  className="w-full bg-primary text-primary-foreground border-none px-3 py-3 rounded-lg font-semibold cursor-pointer transition-all hover:bg-primary/90"
                  onClick={closeWechatBrowserTip}
                >
                  {wechatBrowserTexts.cta}
                </button>
              </div>
            </div>
          </>
        )}

        {/* 移动端下载提示（遮罩 + 底部弹窗） */}
        {showMobileDownload && (
          <>
            <div className="fixed inset-0 bg-black/85 z-[1000] animate-[fadeIn_0.2s_ease-out]" />
            <div className="fixed left-0 right-0 bottom-0 bg-background rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.2)] z-[1001] animate-[slideUp_0.25s_ease-out] p-4 pb-5" role="dialog" aria-modal="true">
              <div className="flex items-center justify-between gap-2">
                <div className="text-lg font-bold text-foreground">
                  {downloadTexts.title}
                  {' '}
                  👋
                </div>
                <button
                  className="bg-transparent border-none text-[22px] text-muted-foreground cursor-pointer px-2 py-1 rounded-md transition-all hover:bg-accent"
                  aria-label="Close"
                  onClick={closeMobileDownload}
                >
                  ×
                </button>
              </div>
              <div className="py-3 px-1">
                <p className="m-0 text-sm text-muted-foreground leading-relaxed">{downloadTexts.desc}</p>
              </div>
              <div className="pt-3 flex justify-center">
                <a
                  className="inline-block bg-primary text-primary-foreground no-underline px-[18px] py-2.5 rounded-lg font-semibold shadow-[0_6px_18px_rgba(79,70,229,0.35)]"
                  href={getDownloadHref()}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeMobileDownload}
                >
                  {downloadTexts.cta}
                </a>
              </div>
            </div>
          </>
        )}

        {/* 发布作品弹窗 */}
        {allAccounts.length > 0 && (
          <PublishDialog
            ref={publishDialogRef}
            open={publishDialogOpen}
            onClose={() => {
              setPublishDialogOpen(false)
              setAiGeneratedData(null)
              setDefaultAccountId(undefined)
            }}
            accounts={allAccounts}
            defaultAccountId={defaultAccountId}
            onPubSuccess={() => {
              setPublishDialogOpen(false)
              setAiGeneratedData(null)
              setDefaultAccountId(undefined)
              useCalendarTiming.getState().getPubRecord()
            }}
          />
        )}
      </div>
    </NoSSR>
  )
}
