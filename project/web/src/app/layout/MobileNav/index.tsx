/**
 * MobileNav - 移动端顶部导航组件
 * 在移动端显示，包含 Logo 和抽屉式导航菜单
 * 与桌面端侧边栏功能保持一致
 */
'use client'

import type { SettingsTab } from '@/components/SettingsModal'
import {
  Bell,
  BookOpen,
  Crown,
  DollarSign,
  FileText,
  Mail,
  Menu,
  PlusCircle,
  Puzzle,
  Share2,
  Smartphone,
  X,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSelectedLayoutSegments } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { centsToUsd } from '@/api/credits'
import AddAccountModal from '@/app/[lng]/accounts/components/AddAccountModal'
import { useTransClient } from '@/app/i18n/client'
import { routerData } from '@/app/layout/routerData'
import logo from '@/assets/images/logo.png'
import DownloadAppModal from '@/components/common/DownloadAppModal'
import NotificationPanel from '@/components/notification/NotificationPanel'
import { PluginModal } from '@/components/Plugin'
import SettingsModal from '@/components/SettingsModal'
import { useSettingsModalStore } from '@/components/SettingsModal/store'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CONTACT } from '@/constant'
import { useNotification } from '@/hooks/useNotification'
import { useGetClientLng } from '@/hooks/useSystem'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { openLoginModal } from '@/store/loginModal'
import { usePluginStore } from '@/store/plugin'
import { PluginStatus } from '@/store/plugin/types/baseTypes'
import { useUserStore } from '@/store/user'
import { getOssUrl } from '@/utils/oss'

// GitHub 配置
const GITHUB_REPO = 'yikart/AiToEarn'
const DOCS_URL = 'https://docs.aitoearn.ai'
const AFFILIATES_URL = 'https://aitoearn.getrewardful.com/signup?_gl=1*15wk8k8*_gcl_au*MjAzNTIwODgyMi4xNzY1MjkwMjc2LjExMjI2NzUyNDguMTc2NjE1MjM5OS4xNzY2MTUzODYz*_ga*OTk1MTc5MzQzLjE3NjUyOTAyNzY.*_ga_YJYFH7ZS27*czE3NjYxNTIzOTIkbzckZzEkdDE3NjYxNTM4OTQkajQ3JGwwJGgxODk3OTAxMTc1'

// 有效的 VIP 会员状态
const ACTIVE_VIP_STATUSES = ['active_monthly', 'active_yearly', 'active_nonrenewing', 'monthly_once', 'yearly_once']

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
 * 移动端 Add Channel 按钮
 */
function MobileAddChannelButton({
  onClose,
  onAddChannel,
}: {
  onClose: () => void
  onAddChannel: () => void
}) {
  const { t } = useTransClient('route')

  return (
    <button
      onClick={() => {
        onClose()
        onAddChannel()
      }}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all w-full',
        'text-primary hover:bg-primary/10 hover:text-primary',
        'border border-dashed border-primary/40 hover:border-primary',
      )}
    >
      <span className="flex items-center justify-center text-primary">
        <PlusCircle size={20} />
      </span>
      <span>{t('addChannel' as any)}</span>
    </button>
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

  const pluginStatus = usePluginStore(state => state.status)
  const [pluginModalVisible, setPluginModalVisible] = useState(false)
  const [downloadModalVisible, setDownloadModalVisible] = useState(false)
  const [notificationVisible, setNotificationVisible] = useState(false)
  const [starCount, setStarCount] = useState<string>('9.5k')

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

  // 获取 GitHub star 数量
  useEffect(() => {
    fetch(`https://api.github.com/repos/${GITHUB_REPO}`)
      .then(res => res.json())
      .then((data) => {
        if (data.stargazers_count) {
          const count = data.stargazers_count
          setStarCount(count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count.toString())
        }
      })
      .catch(() => {})
  }, [])

  // 根据插件状态返回对应的颜色和状态文本
  const getPluginStatusInfo = () => {
    switch (pluginStatus) {
      case PluginStatus.READY:
        return {
          iconColor: 'text-success',
          dotColor: 'bg-success',
          statusText: t('pluginStatus.ready'),
        }
      case PluginStatus.INSTALLED_NO_PERMISSION:
        return {
          iconColor: 'text-warning',
          dotColor: 'bg-warning',
          statusText: t('pluginStatus.noPermission'),
        }
      case PluginStatus.CHECKING:
        return {
          iconColor: 'text-info',
          dotColor: 'bg-info animate-pulse',
          statusText: t('pluginStatus.checking'),
        }
      default:
        return {
          iconColor: 'text-muted-foreground/70',
          dotColor: 'bg-muted-foreground/70',
          statusText: t('pluginStatus.notInstalled'),
        }
    }
  }

  const pluginInfo = getPluginStatusInfo()

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

        {/* 插件入口 */}
        <button
          onClick={() => setPluginModalVisible(true)}
          className="flex items-center justify-between px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted transition-colors w-full"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <Puzzle size={20} className={pluginInfo.iconColor} />
              <span
                className={cn(
                  'absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-background',
                  pluginInfo.dotColor,
                )}
              />
            </div>
            <span className="text-base font-medium">{t('plugin')}</span>
          </div>
          <span className="text-xs text-muted-foreground">{pluginInfo.statusText}</span>
        </button>

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
          className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          title={t('downloadAppButton')}
        >
          <Smartphone size={20} />
        </button>

        {/* 通知 - 仅登录后显示 */}
        {token && (
          <button
            onClick={() => setNotificationVisible(true)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors relative"
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
      <div className="flex items-center justify-center gap-3 border-t border-border py-3">
        <a
          href={DOCS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
        >
          <BookOpen className="w-3.5 h-3.5" />
          Docs
        </a>
        <a
          href={`https://github.com/${GITHUB_REPO}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-full border border-border/60 overflow-hidden hover:border-border transition-all"
        >
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Star
          </span>
          <span className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 border-l border-border/60">
            {starCount}
          </span>
        </a>
      </div>

      {/* 用户区域 */}
      <div className="border-t border-border pt-3 px-4">
        <MobileUserSection onClose={onClose} onOpenSettings={onOpenSettings} />
      </div>

      {/* 弹窗 */}
      <PluginModal visible={pluginModalVisible} onClose={() => setPluginModalVisible(false)} />
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
  const [addAccountVisible, setAddAccountVisible] = useState(false)
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

  // 打开添加账号弹窗
  const handleAddChannel = () => {
    if (!token) {
      toast.warning('Please login first')
      openLoginModal(() => setAddAccountVisible(true))
      return
    }
    setAddAccountVisible(true)
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
          <nav className="flex flex-col gap-1 p-4">
            {routerData.map((item, index) => {
              // 找到 interactive（Engage）的位置，在其后面插入 Add Channel 按钮
              const isInteractive = item.translationKey === 'interactive'
              return (
                <div key={item.path || item.name}>
                  <MobileNavItem
                    path={item.path || '/'}
                    translationKey={item.translationKey}
                    icon={item.icon}
                    isActive={item.path === currRouter}
                    onClose={handleClose}
                  />
                  {/* 在 Engage 后面插入 Add Channel 按钮 */}
                  {isInteractive && (
                    <div className="mt-1">
                      <MobileAddChannelButton
                        onClose={handleClose}
                        onAddChannel={handleAddChannel}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

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

      {/* 添加账号弹窗 */}
      <AddAccountModal
        open={addAccountVisible}
        onClose={() => setAddAccountVisible(false)}
        onAddSuccess={() => {
          setAddAccountVisible(false)
        }}
        showSpaceSelector={true}
      />
    </>
  )
}

export default MobileNav
