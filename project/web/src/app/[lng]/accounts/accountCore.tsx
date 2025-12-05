'use client'

import type { SocialAccount } from '@/api/types/account.type'
import { NoSSR } from '@kwooshung/react-no-ssr'
import Image from 'next/image'
import { useEffect, useState, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import AccountSidebar from '@/app/[lng]/accounts/components/AccountSidebar/AccountSidebar'
import AddAccountModal from '@/app/[lng]/accounts/components/AddAccountModal'
import CalendarTiming from '@/app/[lng]/accounts/components/CalendarTiming'
import AllPlatIcon from '@/app/[lng]/accounts/components/CalendarTiming/AllPlatIcon'
import { PlatType, AccountPlatInfoMap } from '@/app/config/platConfig'
import { AccountStatus } from '@/app/config/accountConfig'
import { useTransClient } from '@/app/i18n/client'
import rightArrow from '@/assets/images/jiantou.png'
import VipContentModal from '@/components/modals/VipContentModal'
import PublishDialog from '@/components/PublishDialog'
import type { IPublishDialogRef } from '@/components/PublishDialog'
import { useAccountStore } from '@/store/account'
import { useUserStore } from '@/store/user'

import styles from './accounts.module.scss'

interface AccountPageCoreProps {
  searchParams?: {
    platform?: string
    spaceId?: string
    showVip?: string
    // AI生成的内容参数
    aiGenerated?: string
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
  const userStore = useUserStore()

  // 移动端下载提示弹窗开关
  const [showMobileDownload, setShowMobileDownload] = useState(false)
  // 微信浏览器提示弹窗开关
  const [showWechatBrowserTip, setShowWechatBrowserTip] = useState(false)
  // VIP弹窗状态
  const [vipModalOpen, setVipModalOpen] = useState(false)
  // 发布弹窗状态
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [defaultAccountId, setDefaultAccountId] = useState<string>()
  const [aiGeneratedData, setAiGeneratedData] = useState<any>(null)
  const publishDialogRef = useRef<IPublishDialogRef>(null)

  useEffect(() => {
    accountInit()
  }, [])

  // 获取所有账号列表（扁平化）
  const allAccounts = accountGroupList.reduce<SocialAccount[]>((acc, group) => {
    return [...acc, ...group.children]
  }, [])

  // 处理URL参数
  useEffect(() => {
    // 处理显示VIP弹窗的参数
    if (searchParams?.showVip === 'true') {
      setVipModalOpen(true)
      // 清除URL参数
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        url.searchParams.delete('showVip')
        window.history.replaceState({}, '', url.toString())
      }
    }

    // Handle AI-generated content params
    if (searchParams?.aiGenerated === 'true' && searchParams?.taskId && allAccounts.length > 0) {
      try {
        const medias = searchParams.medias ? JSON.parse(decodeURIComponent(searchParams.medias)) : []
        const tags = searchParams.tags ? JSON.parse(decodeURIComponent(searchParams.tags)) : []
        
        const data = {
          taskId: searchParams.taskId,
          title: searchParams.title || '',
          description: searchParams.description || '',
          tags: tags,
          medias: medias,
        }
        
        setAiGeneratedData(data)
        
        // 选择第一个在线且PC端支持的账户
        const firstAvailableAccount = allAccounts.find(account => {
          // 检查账户是否在线
          const isOnline = account.status === AccountStatus.USABLE
          // 检查平台是否支持PC端
          const platConfig = AccountPlatInfoMap.get(account.type)
          const isPcSupported = !platConfig?.pcNoThis
          
          return isOnline && isPcSupported
        })
        
        if (firstAvailableAccount) {
          setDefaultAccountId(firstAvailableAccount.id)
        } else if (allAccounts[0]) {
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
          url.searchParams.delete('aiGenerated')
          url.searchParams.delete('taskId')
          url.searchParams.delete('title')
          url.searchParams.delete('description')
          url.searchParams.delete('tags')
          url.searchParams.delete('medias')
          window.history.replaceState({}, '', url.toString())
        }
      } catch (error) {
        console.error('Failed to parse AI generated data:', error)
      }
    }

    if (searchParams?.platform || searchParams?.spaceId) {
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
        } catch (error) {
          console.error('Failed to fill AI data:', error)
        }
      }, 1000)

      // Helper function to fill data
      const fillAIData = async (store: any) => {
        // Dynamic import generateUUID and VideoGrabFrame
        const { generateUUID } = require('@/utils')
        const { VideoGrabFrame } = require('@/components/PublishDialog/PublishDialog.util')

        // Build params - append tags to description
        let description = aiGeneratedData.description || ''
        if (aiGeneratedData.tags && aiGeneratedData.tags.length > 0) {
          const tagsText = aiGeneratedData.tags.map((tag: string) => `#${tag}`).join(' ')
          description = description + '\n\n' + tagsText
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
              
              // If API returned cover URL, use it directly
              if (videoMedia.coverUrl) {
                const { formatImg } = require('@/components/PublishDialog/PublishDialog.util')
                
                // Load cover image to get dimension info
                coverInfo = await new Promise((resolve) => {
                  const img = document.createElement('img')
                  img.crossOrigin = 'anonymous'
                  img.onload = () => {
                    resolve({
                      id: generateUUID(),
                      width: img.width,
                      height: img.height,
                      imgUrl: videoMedia.coverUrl,
                      ossUrl: videoMedia.coverUrl,
                      filename: `ai_${aiGeneratedData.taskId}_cover.jpg`,
                      imgPath: '',
                      size: 0,
                      file: null as any,
                    })
                  }
                  img.onerror = () => {
                    resolve(null)
                  }
                  img.src = videoMedia.coverUrl
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
                } catch (extractError) {
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
              } else {
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
            } catch (error) {
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
          } else {
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
      <div className={styles.accounts}>
        <AccountSidebar
          activeAccountId={accountActive?.id || ''}
          onAccountChange={(account) => {
            setAccountActive(account)
          }}
          sidebarTopExtra={(
            <>
              <div
                className={[
                  'accountList-item',
                  `${!accountActive?.id ? 'accountList-item--active' : ''}`,
                ].join(' ')}
                style={{
                  border: '1px solid #d9d9d9',
                  borderRight: 'none',
                  borderLeft: 'none',
                }}
                onClick={async () => {
                  setAccountActive(undefined)
                }}
              >
                <AllPlatIcon size={38} />
                <div className="accountList-item-right">
                  <div className="accountList-item-right-name">
                    {t('allPlatforms')}
                  </div>
                </div>
              </div>
            </>
          )}
        />
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
            <div className={styles.mobileDownloadOverlay} onClick={closeWechatBrowserTip} />
            <Image src={rightArrow} alt="rightArrow" width={120} height={120} className={styles.rightArrow} />
            <div className={styles.wechatTipContainer}>
              <div className={styles.wechatTipContent}>
                <div className={styles.wechatTipTitle}>{wechatBrowserTexts.title}</div>
                <div className={styles.wechatTipSteps}>
                  <div className={styles.wechatTipStep}>
                    <span className={styles.stepNumber}>1</span>
                    <span className={styles.stepText}>
                      {t('wechatBrowserTip.clickCorner')}
                      <span className={styles.dotsButton}>⋯</span>
                      {t('wechatBrowserTip.dotsButton')}
                    </span>
                  </div>
                  <div className={styles.wechatTipStep}>
                    <span className={styles.stepNumber}>2</span>
                    <span className={styles.stepText}>
                      {t('wechatBrowserTip.selectBrowser')}
                      <span className={styles.browserButton}>🌐</span>
                      {t('wechatBrowserTip.openInBrowser')}
                    </span>
                  </div>
                </div>
                <button className={styles.wechatTipClose} onClick={closeWechatBrowserTip}>
                  {wechatBrowserTexts.cta}
                </button>
              </div>

            </div>
          </>
        )}

        {/* 移动端下载提示（遮罩 + 底部弹窗） */}
        {showMobileDownload && (
          <>
            <div className={styles.mobileDownloadOverlay} />
            <div className={styles.mobileDownloadSheet} role="dialog" aria-modal="true">
              <div className={styles.sheetHeader}>
                <div className={styles.sheetTitle}>
                  {downloadTexts.title}
                  {' '}
                  👋
                </div>
                <button className={styles.sheetClose} aria-label="Close" onClick={closeMobileDownload}>
                  ×
                </button>
              </div>
              <div className={styles.sheetBody}>
                <p className={styles.sheetDesc}>{downloadTexts.desc}</p>
              </div>
              <div className={styles.sheetFooter}>
                <a
                  className={styles.sheetCta}
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

        {/* VIP弹窗 */}
        <VipContentModal
          open={vipModalOpen}
          onClose={() => setVipModalOpen(false)}
        />

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
            }}
          />
        )}
      </div>
    </NoSSR>
  )
}
