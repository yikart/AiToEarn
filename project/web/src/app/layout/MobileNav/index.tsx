/**
 * MobileNav - 移动端顶部导航组件
 * 在移动端显示，包含 Logo 和抽屉式导航菜单
 * 与桌面端侧边栏功能保持一致
 */
'use client'

import type { SettingsTab } from '@/components/SettingsModal'
import {
  Bell,
  ChevronDown,
  ChevronUp,
  Crown,
  DollarSign,
  FileText,
  Mail,
  Menu,
  MoreHorizontal,
  Share2,
  Smartphone,
  Tv,
  X,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSelectedLayoutSegments } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { centsToUsd } from '@/api/credits'
import { useTransClient } from '@/app/i18n/client'
import { routerData } from '@/app/layout/routerData'
import { ACTIVE_VIP_STATUSES, AFFILIATES_URL, ExternalLinks } from '@/app/layout/shared'
import logo from '@/assets/images/logo.png'
import { useChannelManagerStore } from '@/components/ChannelManager'
import DownloadAppModal from '@/components/common/DownloadAppModal'
import NotificationPanel from '@/components/notification/NotificationPanel'
import SettingsModal from '@/components/SettingsModal'
import { useSettingsModalStore } from '@/components/SettingsModal/store'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CONTACT } from '@/constant'
import { useNotification } from '@/hooks/useNotification'
import { useGetClientLng } from '@/hooks/useSystem'
import { cn } from '@/lib/utils'
import { openLoginModal } from '@/store/loginModal'
import { useUserStore } from '@/store/user'
import { getOssUrl } from '@/utils/oss'

/**
 * 移动端导航项组件
 */
function MobileNavItem({
  path,
  translationKey,
  icon,
  isActive,
  onClose,
}: {
  path: string
  translationKey: string
  icon?: React.ReactNode
  isActive: boolean
  onClose: () => void
}) {
  const { t } = useTransClient('route')
  const lng = useGetClientLng()
  const fullPath = path.startsWith('/') ? `/${lng}${path}` : `/${lng}/${path}`

  return (
    <Link
      href={fullPath}
      onClick={onClose}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all',
        'text-muted-foreground hover:bg-muted hover:text-foreground',
        isActive && 'bg-primary/10 text-primary',
      )}
    >
      <span className={cn('flex items-center justify-center', isActive && 'text-primary')}>
        {icon || <FileText size={20} />}
      </span>
      <span>{t(translationKey as any)}</span>
    </Link>
  )
}

/**
 * 移动端我的频道按钮
 */
function MobileMyChannelsButton({
  onClose,
  onOpenMyChannels,
}: {
  onClose: () => void
  onOpenMyChannels: () => void
}) {
  const { t } = useTransClient('account')

  return (
    <button
      onClick={() => {
        onClose()
        onOpenMyChannels()
      }}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all w-full',
        'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      <span className="flex items-center justify-center text-primary">
        <Tv size={20} />
      </span>
      <span>{t('channelManager.myChannels')}</span>
    </button>
  )
}

/**
 * 移动端导航列表 - 包含主导航和"更多"折叠菜单
 */
function MobileNavList({
  currentRoute,
  onClose,
  onOpenMyChannels,
}: {
  currentRoute: string
  onClose: () => void
  onOpenMyChannels: () => void
}) {
  const { t } = useTransClient('route')
  const [moreOpen, setMoreOpen] = useState(false)

  // Keys to group into the "More" section
  // Order: tasksHistory, interactive (作品互动), dataStatistics, materialLibrary, draftBox
  const groupKeys = [
    'tasksHistory',
    'interactive',
    'dataStatistics',
    'header.materialLibrary',
    'header.draftBox',
  ]

  // Main items: only Home and Publish (accounts)
  const mainItems = routerData.filter(i => !groupKeys.includes(i.translationKey as string))
  // Grouped items in specified order
  const groupedItems = groupKeys
    .map(key => routerData.find(i => i.translationKey === key))
    .filter((i): i is (typeof routerData)[0] => i !== undefined)

  // Auto-expand if current route is in grouped items
  useEffect(() => {
    const isCurrentRouteInGroup = groupedItems.some(item => item.path === currentRoute)
    if (isCurrentRouteInGroup && !moreOpen) {
      setMoreOpen(true)
    }
  }, [currentRoute, groupedItems, moreOpen])

  return (
    <nav className="flex flex-col gap-1 p-4">
      {/* Main navigation items: Home, Publish */}
      {mainItems.map(item => (
        <MobileNavItem
          key={item.path || item.name}
          path={item.path || '/'}
          translationKey={item.translationKey}
          icon={item.icon}
          isActive={item.path === currentRoute}
          onClose={onClose}
        />
      ))}

      {/* 我的频道 */}
      <MobileMyChannelsButton
        onClose={onClose}
        onOpenMyChannels={onOpenMyChannels}
      />

      {/* "More" collapsible section */}
      {groupedItems.length > 0 && (
        <div className="mt-1">
          {/* More button */}
          <button
            onClick={() => setMoreOpen(s => !s)}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all w-full',
              'text-muted-foreground hover:bg-muted hover:text-foreground',
              moreOpen && 'bg-muted text-foreground',
            )}
          >
            <span className="flex items-center justify-center">
              <MoreHorizontal size={20} />
            </span>
            <span className="flex-1 text-left">{t('sidebar.more')}</span>
            {moreOpen ? (
              <ChevronUp size={18} className="text-muted-foreground" />
            ) : (
              <ChevronDown size={18} className="text-muted-foreground" />
            )}
          </button>

          {/* Expanded items */}
          {moreOpen && (
            <div className="mt-1 ml-2 flex flex-col gap-1">
              {groupedItems.map(item => (
                <MobileNavItem
                  key={item.path || item.name}
                  path={item.path || '/'}
                  translationKey={item.translationKey}
                  icon={item.icon}
                  isActive={item.path === currentRoute}
                  onClose={onClose}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </nav>
  )
}

/**
 * 移动端用户头像/登录区域
 */
function MobileUserSection({
  onClose,
  onOpenSettings,
}: {
  onClose: () => void
  onOpenSettings: (tab?: SettingsTab) => void
}) {
  const { t } = useTransClient('common')
  const token = useUserStore(state => state.token)
  const userInfo = useUserStore(state => state.userInfo)

  const handleLogin = () => {
    onClose()
    openLoginModal()
  }

  if (token && userInfo) {
    return (
      <button
        onClick={() => {
          onClose()
          onOpenSettings()
        }}
        className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
      >
        <Avatar className="h-8 w-8 shrink-0 border-2 border-border">
          <AvatarImage
            src={getOssUrl(userInfo.avatar) || ''}
            alt={userInfo.name || t('unknownUser')}
          />
          <AvatarFallback className="bg-muted-foreground font-semibold text-background">
            {userInfo.name?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <span className="truncate text-sm font-medium text-foreground">
          {userInfo.name || t('unknownUser')}
        </span>
      </button>
    )
  }

  return (
    <Button onClick={handleLogin} className="w-full">
      {t('login')}
    </Button>
  )
}

/**
 * 移动端底部功能区
 */
function MobileBottomSection({
  onClose,
  onOpenSettings,
}: {
  onClose: () => void
  onOpenSettings: (tab?: SettingsTab) => void
}) {
  const { t } = useTransClient('common')
  const lng = useGetClientLng()
  const token = useUserStore(state => state.token)
  const userInfo = useUserStore(state => state.userInfo)
  const { unreadCount } = useNotification()

  const { creditsBalance, creditsLoading, fetchCreditsBalance } = useUserStore(
    useShallow(state => ({
      creditsBalance: state.creditsBalance,
      creditsLoading: state.creditsLoading,
      fetchCreditsBalance: state.fetchCreditsBalance,
    })),
  )

  const [downloadModalVisible, setDownloadModalVisible] = useState(false)
  const [notificationVisible, setNotificationVisible] = useState(false)

  // 判断用户是否是有效会员：需要有有效的状态且未过期
  const isVip = Boolean(
    userInfo?.vipInfo?.status
    && ACTIVE_VIP_STATUSES.includes(userInfo.vipInfo.status)
    && userInfo.vipInfo.expireTime
    && new Date(userInfo.vipInfo.expireTime) > new Date(),
  )

  // 登录后获取余额
  useEffect(() => {
    if (token) {
      fetchCreditsBalance()
    }
  }, [token, fetchCreditsBalance])

  return (
    <>
      <div className="flex flex-col gap-1 border-t border-border pt-3">
        {/* 推广赚钱入口 */}
        <a
          href={AFFILIATES_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
        >
          <div className="flex items-center gap-3">
            <Share2 size={20} className="text-primary" />
            <span className="text-base font-medium">{t('affiliates')}</span>
          </div>
        </a>

        {/* 余额 - 仅登录后显示 */}
        {token && (
          <button
            onClick={() => {
              onClose()
              onOpenSettings('subscription')
            }}
            className="flex items-center justify-between px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted transition-colors w-full"
          >
            <div className="flex items-center gap-3">
              <DollarSign size={20} className="text-success" />
              <span className="text-base font-medium">{t('balance')}</span>
            </div>
            {creditsLoading ? (
              <Skeleton className="h-4 w-12" />
            ) : (
              <span className="text-sm font-medium text-foreground">
                $
                {centsToUsd(creditsBalance)}
              </span>
            )}
          </button>
        )}

        {/* VIP 会员入口 */}
        <Link
          href={`/${lng}/pricing`}
          onClick={onClose}
          className="flex flex-col px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <Crown size={20} className="text-warning" />
              <span className="text-base font-medium">{t('vip')}</span>
            </div>
            {!isVip && (
              <span className="text-xs text-muted-foreground">{t('subscribe')}</span>
            )}
          </div>
          {!isVip && (
            <div className="mt-1 ml-8">
              <span className="text-[10px] text-orange-500 font-medium">$19→$50 Credits</span>
            </div>
          )}
        </Link>
      </div>

      {/* 图标栏 */}
      <div className="flex items-center justify-center gap-4 border-t border-border py-3 mt-2">
        {/* 邮箱 - 联系我们 */}
        <a
          href={`mailto:${CONTACT}`}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          title={`${t('contactUs')}: ${CONTACT}`}
        >
          <Mail size={20} />
        </a>

        {/* 下载APP */}
        <button
          onClick={() => setDownloadModalVisible(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
          title={t('downloadAppButton')}
        >
          <Smartphone size={20} />
        </button>

        {/* 通知 - 仅登录后显示 */}
        {token && (
          <button
            onClick={() => setNotificationVisible(true)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors relative cursor-pointer"
            title={t('notifications')}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 h-[18px] min-w-[18px] px-1 text-[10px] leading-[18px]"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </button>
        )}
      </div>

      {/* 外部链接 - Docs 和 GitHub */}
      <ExternalLinks isMobile />

      {/* 用户区域 */}
      <div className="border-t border-border pt-3 px-4">
        <MobileUserSection onClose={onClose} onOpenSettings={onOpenSettings} />
      </div>

      {/* 弹窗 */}
      <DownloadAppModal visible={downloadModalVisible} onClose={() => setDownloadModalVisible(false)} />
      <NotificationPanel visible={notificationVisible} onClose={() => setNotificationVisible(false)} />
    </>
  )
}

/**
 * 移动端导航主组件
 */
function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const lng = useGetClientLng()
  const route = useSelectedLayoutSegments()
  const token = useUserStore(state => state.token)
  const {
    settingsVisible,
    settingsDefaultTab,
    openSettings,
    closeSettings,
  } = useSettingsModalStore()

  // 频道管理器
  const { openModal } = useChannelManagerStore(
    useShallow(state => ({
      openModal: state.openModal,
    })),
  )

  // 获取当前路由
  let currRouter = '/'
  if (route.length === 1) {
    currRouter = route[0]
    currRouter = currRouter === '/' ? currRouter : `/${currRouter}`
  }
  else if (route.length >= 2) {
    currRouter = `/${route.slice(0, 2).join('/')}`
  }

  // auth 和 websit 页面不显示导航
  const isAuthPage = route[0] === 'auth' || route[0] === 'websit'
  if (isAuthPage) {
    return null
  }

  const handleClose = () => setIsOpen(false)

  const handleOpenSettings = (defaultTab?: SettingsTab) => {
    openSettings(defaultTab)
  }

  return (
    <>
      {/* 移动端顶部栏 */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-14 px-4 bg-background border-b border-border">
        <Link href={`/${lng}`} className="flex items-center gap-2">
          <Image src={logo} alt="Aitoearn" width={32} height={32} />
          <span className="text-base font-semibold text-foreground">Aitoearn</span>
        </Link>
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center w-10 h-10 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* 抽屉遮罩 */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50 transition-opacity"
          onClick={handleClose}
        />
      )}

      {/* 抽屉导航 */}
      <div
        className={cn(
          'md:hidden fixed top-0 right-0 z-50 w-[300px] h-full bg-background shadow-xl transition-transform duration-300 ease-in-out flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* 抽屉头部 */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-border shrink-0">
          <span className="text-base font-semibold text-foreground">Menu</span>
          <button
            onClick={handleClose}
            className="flex items-center justify-center w-10 h-10 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* 可滚动内容区域 */}
        <div className="flex-1 overflow-y-auto">
          {/* 导航列表 */}
          <MobileNavList
            currentRoute={currRouter}
            onClose={handleClose}
            onOpenMyChannels={openModal}
          />

          {/* 底部功能区 */}
          <div className="px-4 pb-4">
            <MobileBottomSection onClose={handleClose} onOpenSettings={handleOpenSettings} />
          </div>
        </div>
      </div>

      {/* 设置弹框 */}
      <SettingsModal
        open={settingsVisible}
        onClose={closeSettings}
        defaultTab={settingsDefaultTab}
      />
    </>
  )
}

export default MobileNav
