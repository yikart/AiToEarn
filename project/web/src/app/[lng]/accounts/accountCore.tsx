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
import { PlatType } from '@/app/config/platConfig'
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

    // 处理AI生成的内容参数
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
        
        console.log('收到AI生成数据:', data)
        setAiGeneratedData(data)
        
        // 设置默认选择第一个账户
        if (allAccounts[0]) {
          setDefaultAccountId(allAccounts[0].id)
          console.log('设置默认账户:', allAccounts[0].id)
        }
        
        // 打开发布弹窗
        setTimeout(() => {
          console.log('打开发布弹窗，账户数量:', allAccounts.length)
          setPublishDialogOpen(true)
        }, 500)

        // 清除URL参数
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
        console.error('解析AI生成数据失败:', error)
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

  // 处理发布弹窗打开后填充AI生成的数据
  useEffect(() => {
    if (aiGeneratedData && publishDialogOpen && allAccounts.length > 0) {
      console.log('开始填充AI数据到发布弹窗...')
      
      // 延迟填充，确保PublishDialog完全初始化
      const timeoutId = setTimeout(() => {
        try {
          const { usePublishDialog } = require('@/components/PublishDialog/usePublishDialog')
          const store = usePublishDialog.getState()

          console.log('PublishDialog状态:', {
            pubList: store.pubList?.length,
            pubListChoosed: store.pubListChoosed?.length
          })

          // 如果pubList还没初始化，再等待一下
          if (!store.pubList || store.pubList.length === 0) {
            console.log('pubList未初始化，1秒后重试')
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
          console.error('❌ 填充AI数据失败:', error)
        }
      }, 1000)

      // 填充数据的辅助函数
      const fillAIData = async (store: any) => {
        // 动态导入generateUUID和VideoGrabFrame
        const { generateUUID } = require('@/utils')
        const { VideoGrabFrame } = require('@/components/PublishDialog/PublishDialog.util')

        // 构建参数 - tags追加到description后面
        let description = aiGeneratedData.description || ''
        if (aiGeneratedData.tags && aiGeneratedData.tags.length > 0) {
          const tagsText = aiGeneratedData.tags.map((tag: string) => `#${tag}`).join(' ')
          description = description + '\n\n' + tagsText
        }

        const params: any = {
          des: description,
          title: aiGeneratedData.title || '',
        }

        // 处理媒体文件 - 支持多个媒体
        const medias = aiGeneratedData.medias || []
        
        if (medias.length > 0) {
          // 检查是否有视频
          const videoMedia = medias.find((m: any) => m.type === 'VIDEO')
          if (videoMedia) {
            console.log('发现视频媒体:', videoMedia.url, '封面URL:', videoMedia.coverUrl)
            
            try {
              let coverInfo
              
              // 如果API返回了封面URL，直接使用
              if (videoMedia.coverUrl) {
                console.log('使用API返回的封面URL')
                const { formatImg } = require('@/components/PublishDialog/PublishDialog.util')
                
                // 加载封面图片获取尺寸信息
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
                    console.warn('封面图片加载失败，将尝试从视频提取')
                    resolve(null)
                  }
                  img.src = videoMedia.coverUrl
                })
              }
              
              // 如果没有封面URL或封面加载失败，尝试从视频提取
              if (!coverInfo) {
                console.log('尝试从视频URL提取封面和元数据...')
                try {
                  const videoInfo = await VideoGrabFrame(videoMedia.url, 0)
                  console.log('视频封面提取成功:', videoInfo)
                  
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
                  console.warn('视频封面提取失败（可能是跨域问题）:', extractError)
                  console.info('💡 提示：如果视频来自外部URL，建议后端API在返回时提供coverUrl字段')
                  // 跨域视频无法提取封面，使用占位符
                  // 创建一个使用视频URL作为imgUrl的封面（浏览器会自动显示第一帧）
                  const video = document.createElement('video')
                  video.src = videoMedia.url
                  video.crossOrigin = 'anonymous'
                  
                  await new Promise((resolve) => {
                    video.addEventListener('loadedmetadata', () => {
                      // 使用视频URL作为封面的imgUrl，浏览器video标签的poster会自动处理
                      const placeholderCover: any = {
                        id: generateUUID(),
                        size: 0,
                        file: null as any,
                        imgUrl: videoMedia.url, // 使用视频URL，video标签会显示第一帧
                        filename: `ai_${aiGeneratedData.taskId}_cover.jpg`,
                        imgPath: '',
                        width: video.videoWidth,
                        height: video.videoHeight,
                        ossUrl: '', // 没有单独的封面URL
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
                      console.warn('视频元数据加载失败')
                      // 完全失败的情况，使用默认值
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
                // 使用API返回的封面，但仍需要从视频获取宽高和时长
                console.log('加载视频元数据...')
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
                    // 如果视频元数据加载失败，使用默认尺寸
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
              console.error('处理视频失败:', error)
              // 如果所有方法都失败，使用默认封面
              const defaultCover: any = {
                id: generateUUID(),
                size: 0,
                file: null as any,
                imgUrl: '', // 空的，会显示默认图标
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
            // 处理所有图片
            const imageMedias = medias.filter((m: any) => m.type === 'IMAGE')
            if (imageMedias.length > 0) {
              console.log('发现图片媒体数量:', imageMedias.length)
              params.images = imageMedias.map((media: any, index: number) => ({
                id: generateUUID(),
                size: 0,
                file: null as any,
                imgUrl: media.url, // 使用ossUrl作为预览URL
                filename: `ai_${aiGeneratedData.taskId}_${index + 1}.jpg`,
                imgPath: '',
                width: 1920,
                height: 1080,
                ossUrl: media.url, // AI生成的图片已经有ossUrl
              }))
              params.video = undefined
            }
          }
        }

        console.log('准备填充的参数:', params)

        // 填充到第一个选中的账号
        if (store.pubListChoosed && store.pubListChoosed.length > 0) {
          console.log('填充到选中账号:', store.pubListChoosed[0].account.id)
          store.setOnePubParams(params, store.pubListChoosed[0].account.id)
          console.log('✅ 数据填充成功')
        } else {
          console.warn('没有选中的账号')
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
