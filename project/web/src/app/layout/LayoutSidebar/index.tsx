/**
 * LayoutSidebar - 左侧侧边栏布局组件
 * 包含 Logo、主导航、底部功能区（邮箱、设置、通知、用户头像/登录按钮）
 * 支持展开/收缩两种状态
 */
'use client'

import {
  Bell,
  Crown,
  FileText,
  Mail,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Smartphone,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSelectedLayoutSegments } from 'next/navigation'
import { useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { routerData } from '@/app/layout/routerData'
import logo from '@/assets/images/logo.png'
import NotificationPanel from '@/components/notification/NotificationPanel'
import SettingsModal from '@/components/SettingsModal'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useNotification } from '@/hooks/useNotification'
import { useGetClientLng } from '@/hooks/useSystem'
import { cn } from '@/lib/utils'
import { useUserStore } from '@/store/user'
import { getOssUrl } from '@/utils/oss'

/**
 * 用户信息组件 - 底部用户头像
 */
function UserAvatar({ collapsed }: { collapsed: boolean }) {
  const userInfo = useUserStore(state => state.userInfo)
  const { t } = useTransClient('common')

  if (!userInfo) {
    return null
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'flex items-center rounded-lg',
              collapsed ? 'justify-center p-1' : 'gap-2 px-2 py-1.5',
            )}
          >
            <Avatar className="h-8 w-8 shrink-0 border-2 border-purple-200">
              <AvatarImage src={getOssUrl(userInfo.avatar) || ''} alt={userInfo.name || t('unknownUser')} />
              <AvatarFallback className="bg-purple-400 font-semibold text-white">
                {userInfo.name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <span className="truncate text-sm font-medium text-gray-700">
                {userInfo.name || t('unknownUser')}
              </span>
            )}
          </div>
        </TooltipTrigger>
        {collapsed && (
          <TooltipContent side="right">
            <p>{t('profile')}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * 主导航项组件
 */
function NavItem({
  path,
  translationKey,
  icon,
  isActive,
  collapsed,
}: {
  path: string
  translationKey: string
  icon?: React.ReactNode
  isActive: boolean
  collapsed: boolean
}) {
  const { t } = useTransClient('route')
  const lng = useGetClientLng()
  const fullPath = path.startsWith('/') ? `/${lng}${path}` : `/${lng}/${path}`

  const content = (
    <Link
      href={fullPath}
      className={cn(
        'relative flex items-center rounded-lg text-sm font-medium transition-all',
        'text-gray-500 hover:bg-black/5 hover:text-gray-900',
        isActive && 'bg-white text-gray-900 shadow-sm',
        collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5',
      )}
    >
      {/* 激活状态左边框指示器 */}
      {isActive && (
        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-purple-500" />
      )}
      <span className={cn('flex shrink-0 items-center justify-center', isActive && 'text-purple-500')}>
        {icon || <FileText size={20} />}
      </span>
      {!collapsed && (
        <span className="overflow-hidden text-ellipsis whitespace-nowrap">
          {t(translationKey as any)}
        </span>
      )}
    </Link>
  )

  // 收缩状态下显示 Tooltip
  if (collapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{t(translationKey as any)}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return content
}

/**
 * 侧边栏主组件
 */
const LayoutSidebar = () => {
  const router = useRouter()
  const { t } = useTransClient('common')
  const lng = useGetClientLng()
  const token = useUserStore(state => state.token)
  const route = useSelectedLayoutSegments()
  const { unreadCount } = useNotification()
  const [notificationVisible, setNotificationVisible] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [settingsVisible, setSettingsVisible] = useState(false)

  // 获取当前路由
  let currRouter = '/'
  if (route.length === 1) {
    currRouter = route[0]
    currRouter = currRouter === '/' ? currRouter : `/${currRouter}`
  }
  else if (route.length >= 2) {
    currRouter = `/${route.slice(0, 2).join('/')}`
  }

  // 处理登录跳转
  const handleLogin = () => {
    router.push(`/${lng}/login`)
  }

  return (
    <>
      <aside
        className={cn(
          'group sticky left-0 top-0 hidden h-screen flex-col border-r border-gray-200 bg-[#f7f8f8] p-3 transition-all duration-300 md:flex',
          collapsed ? 'w-[68px] min-w-[68px]' : 'w-[220px] min-w-[220px]',
        )}
      >
        {/* Logo 区域 */}
        <div className={cn(
          'mb-3 flex items-center',
          collapsed ? 'justify-center px-1 py-2' : 'justify-between px-2 py-2',
        )}
        >
          {collapsed
            ? (
                // 收起状态：默认显示 logo，hover 时显示展开按钮
                <div className="relative flex h-8 w-8 items-center justify-center">
                  {/* Logo - 默认显示，hover 时隐藏 */}
                  <Link
                    href={`/${lng}`}
                    className="flex items-center justify-center transition-opacity group-hover:opacity-0"
                  >
                    <Image src={logo} alt="AIToEarn" width={32} height={32} />
                  </Link>
                  {/* 展开按钮 - 默认隐藏，hover 时显示 */}
                  <button
                    onClick={() => setCollapsed(false)}
                    className="absolute inset-0 flex items-center justify-center rounded-md border-none bg-transparent text-gray-400 opacity-0 transition-opacity hover:bg-black/5 hover:text-gray-600 group-hover:opacity-100"
                  >
                    <PanelLeftOpen size={18} />
                  </button>
                </div>
              )
            : (
                <>
                  <Link href={`/${lng}`} className="flex items-center gap-2 text-gray-800 no-underline hover:opacity-85">
                    <Image src={logo} alt="AIToEarn" width={32} height={32} />
                    <span className="text-base font-semibold tracking-tight">AIToEarn</span>
                  </Link>
                  <button
                    onClick={() => setCollapsed(true)}
                    className="flex h-8 w-8 items-center justify-center rounded-md border-none bg-transparent text-gray-400 transition-colors hover:bg-black/5 hover:text-gray-600"
                  >
                    <PanelLeftClose size={18} />
                  </button>
                </>
              )}
        </div>

        {/* 主导航区域 */}
        <nav className="flex flex-1 flex-col gap-1">
          {routerData.map(item => (
            <NavItem
              key={item.path || item.name}
              path={item.path || '/'}
              translationKey={item.translationKey}
              icon={item.icon}
              isActive={item.path === currRouter}
              collapsed={collapsed}
            />
          ))}
        </nav>

        {/* 底部区域 */}
        <div className={cn(
          'mt-auto flex flex-col gap-1 border-t border-gray-200 pt-3',
          collapsed && 'items-center',
        )}
        >
          {/* VIP 会员入口 */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={`/${lng}/pricing`}
                  className={cn(
                    'flex items-center rounded-lg text-gray-600 transition-colors hover:bg-black/5 hover:text-gray-900',
                    collapsed ? 'h-9 w-9 justify-center' : 'justify-between px-3 py-2',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Crown size={18} className="text-amber-500" />
                    {!collapsed && <span className="text-sm">{t('vip')}</span>}
                  </div>
                  {!collapsed && (
                    <span className="text-xs text-purple-500">{t('subscribe')}</span>
                  )}
                </Link>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right">
                  <p>{t('vip')}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>

          {/* 设置入口 */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setSettingsVisible(true)}
                  className={cn(
                    'flex items-center rounded-lg text-gray-600 transition-colors hover:bg-black/5 hover:text-gray-900 border-none bg-transparent cursor-pointer',
                    collapsed ? 'h-9 w-9 justify-center' : 'gap-2 px-3 py-2',
                  )}
                >
                  <Settings size={18} />
                  {!collapsed && <span className="text-sm">{t('settings')}</span>}
                </button>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right">
                  <p>{t('settings')}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>

          {/* 底部图标栏 - 邮箱、下载APP、通知 */}
          <div className={cn(
            'mt-2 flex items-center justify-center border-t border-gray-200 pt-2',
            collapsed ? 'flex-col gap-1' : 'flex-row gap-0',
          )}
          >
            {/* 邮箱 - 联系我们 */}
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href="mailto:agent@aiearn.ai"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-black/5 hover:text-gray-600"
                  >
                    <Mail size={18} />
                  </a>
                </TooltipTrigger>
                <TooltipContent side={collapsed ? 'right' : 'top'} className="bg-gray-900 text-white">
                  <p>{t('contactUs')}: agent@aiearn.ai</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* 手机 - 下载APP */}
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border-none bg-transparent text-gray-400 transition-colors hover:bg-black/5 hover:text-gray-600"
                    onClick={() => {
                      // TODO: 打开下载APP弹窗
                    }}
                  >
                    <Smartphone size={18} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side={collapsed ? 'right' : 'top'} className="bg-gray-900 text-white">
                  <p>{t('downloadAppButton')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* 通知 - 仅登录后显示 */}
            {token && (
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border-none bg-transparent text-gray-400 transition-colors hover:bg-black/5 hover:text-gray-600"
                      onClick={() => setNotificationVisible(true)}
                    >
                      {unreadCount > 0
                        ? (
                            <div className="relative flex items-center justify-center">
                              <Bell size={18} />
                              <Badge
                                variant="destructive"
                                className="absolute -right-2 -top-2 h-[18px] min-w-[18px] px-1 text-[10px] leading-[18px]"
                              >
                                {unreadCount > 99 ? '99+' : unreadCount}
                              </Badge>
                            </div>
                          )
                        : (
                            <Bell size={18} />
                          )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side={collapsed ? 'right' : 'top'} className="bg-gray-900 text-white">
                    <p>{t('notifications')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* 用户头像 / 登录按钮 */}
          {token
            ? (
                <UserAvatar collapsed={collapsed} />
              )
            : (
                collapsed
                  ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={handleLogin}
                              size="icon"
                              className="h-9 w-9 bg-purple-500 text-white hover:bg-purple-600"
                            >
                              <span className="text-sm font-semibold">登</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>{t('login')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )
                  : (
                      <Button
                        onClick={handleLogin}
                        className="mt-1 w-full bg-purple-500 text-white hover:bg-purple-600"
                      >
                        {t('login')}
                      </Button>
                    )
              )}
        </div>
      </aside>

      {/* 通知面板 */}
      <NotificationPanel
        visible={notificationVisible}
        onClose={() => setNotificationVisible(false)}
      />

      {/* 设置弹框 */}
      <SettingsModal
        open={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
    </>
  )
}

export default LayoutSidebar
