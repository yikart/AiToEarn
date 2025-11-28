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
    generatedContent?: string
    taskId?: string
    title?: string
    description?: string
    tags?: string
    mediaType?: string
    mediaUrl?: string
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
  // AI生成的内容数据
  const [generatedData, setGeneratedData] = useState<any>(null)

  useEffect(() => {
    accountInit()
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

    // 处理AI生成内容的参数 - 等待账户列表加载完成
    if (searchParams?.generatedContent === 'true' && searchParams?.taskId && accountGroupList.length > 0) {
      const data = {
        taskId: searchParams.taskId,
        title: searchParams.title || '',
        description: searchParams.description || '',
        tags: searchParams.tags ? JSON.parse(decodeURIComponent(searchParams.tags)) : [],
        mediaType: searchParams.mediaType || '',
        mediaUrl: searchParams.mediaUrl || '',
      }
      setGeneratedData(data)
      
      // 延迟打开发布弹窗，确保数据已完全初始化
      setTimeout(() => {
        setPublishDialogOpen(true)
      }, 500)

      // 清除URL参数
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        url.searchParams.delete('generatedContent')
        url.searchParams.delete('taskId')
        url.searchParams.delete('title')
        url.searchParams.delete('description')
        url.searchParams.delete('tags')
        url.searchParams.delete('mediaType')
        url.searchParams.delete('mediaUrl')
        window.history.replaceState({}, '', url.toString())
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
  }, [searchParams, accountGroupList.length])

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

  // 发布弹窗ref
  const publishDialogRef = useRef<IPublishDialogRef>(null)

  // 获取所有账号列表（扁平化）
  const allAccounts = accountGroupList.reduce<SocialAccount[]>((acc, group) => {
    return [...acc, ...group.children]
  }, [])

  // 调试：监控账户数据变化
  useEffect(() => {
    console.log('账户数据更新 - accountGroupList:', accountGroupList.length, '组')
    console.log('账户数据更新 - allAccounts:', allAccounts.length, '个账户')
  }, [accountGroupList.length, allAccounts.length])

  // 处理AI生成内容填充到发布弹窗
  useEffect(() => {
    if (generatedData && publishDialogOpen && allAccounts.length > 0) {
      console.log('开始填充AI生成的内容，账户数量:', allAccounts.length)
      
      // 延迟填充，确保弹窗已完全打开并初始化
      const timeoutId = setTimeout(() => {
        try {
          // 从PublishDialog的store中获取和设置数据的方法
          const { usePublishDialog } = require('@/components/PublishDialog/usePublishDialog')
          const store = usePublishDialog.getState()

          console.log('PublishDialog状态:', {
            pubList: store.pubList?.length || 0,
            pubListChoosed: store.pubListChoosed?.length || 0,
          })

          // 确保store已经初始化
          if (!store.pubList || store.pubList.length === 0) {
            console.warn('PublishDialog的pubList未初始化，等待下一次尝试')
            // 如果pubList未初始化，再等待一段时间后重试
            setTimeout(() => {
              const retryStore = usePublishDialog.getState()
              if (retryStore.pubList && retryStore.pubList.length > 0) {
                fillGeneratedContent(retryStore)
              }
            }, 1000)
            return
          }

          fillGeneratedContent(store)
        } catch (error) {
          console.error('填充AI生成内容失败:', error)
        }
      }, 800) // 延迟800ms，给PublishDialog足够的初始化时间

      // 填充内容的辅助函数
      const fillGeneratedContent = (store: any) => {
        // 构建发布参数
        const params: any = {
          des: generatedData.description || '',
          title: generatedData.title || '',
        }

        // 处理媒体文件
        if (generatedData.mediaType === 'VIDEO' && generatedData.mediaUrl) {
          // 如果是视频，构建视频对象
          params.video = {
            ossUrl: generatedData.mediaUrl,
            file: null as any,
            filename: `ai_generated_${generatedData.taskId}.mp4`,
            duration: 0,
            cover: {
              ossUrl: '',
              file: null as any,
              filename: '',
              url: '',
            },
            url: generatedData.mediaUrl,
          }
          params.images = []
        } else if (generatedData.mediaType === 'IMAGE' && generatedData.mediaUrl) {
          // 如果是图片
          params.images = [{
            ossUrl: generatedData.mediaUrl,
            file: null as any,
            filename: `ai_generated_${generatedData.taskId}.jpg`,
            url: generatedData.mediaUrl,
          }]
          params.video = undefined
        }

        // 如果有选中的账号，设置参数
        if (store.pubListChoosed && store.pubListChoosed.length >= 2) {
          console.log('设置多账号公共参数:', params)
          store.setAccountAllParams(params)
        } else if (store.pubListChoosed && store.pubListChoosed.length === 1) {
          console.log('设置单账号参数:', params)
          store.setOnePubParams(params, store.pubListChoosed[0].account.id)
        } else {
          // 如果没有选中账号，设置公共参数（会应用到所有账号）
          console.log('设置公共参数到所有账号:', params)
          store.setAccountAllParams(params)
        }

        console.log('AI生成内容已成功填充到发布弹窗')
      }

      // 清理定时器
      return () => clearTimeout(timeoutId)
    }
  }, [generatedData, publishDialogOpen, allAccounts.length])

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

        {/* 发布作品弹窗 - 只在有账户数据时渲染 */}
        {allAccounts.length > 0 && (
          <PublishDialog
            ref={publishDialogRef}
            open={publishDialogOpen}
            onClose={() => {
              setPublishDialogOpen(false)
              setGeneratedData(null)
            }}
            accounts={allAccounts}
            onPubSuccess={() => {
              setPublishDialogOpen(false)
              setGeneratedData(null)
            }}
          />
        )}
      </div>
    </NoSSR>
  )
}
