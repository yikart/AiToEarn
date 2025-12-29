/**
 * ActionCard - Action 卡片组件
 * 用于在聊天消息中显示可交互的 action 卡片
 * 支持：连接频道、更新授权、跳转发布等
 */

'use client'

import type { IActionCard } from '@/store/agent/agent.types'
import { AlertCircle, ArrowRight, Link2, RefreshCw, Send } from 'lucide-react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import AddAccountModal from '@/app/[lng]/accounts/components/AddAccountModal'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { useAgentStore } from '@/store/agent'
import { openLoginModal } from '@/store/loginModal'
import { useUserStore } from '@/store/user'

export interface IActionCardProps {
  /** Action 数据 */
  action: IActionCard
  /** 自定义类名 */
  className?: string
}

/** 平台名称映射 */
const PLATFORM_NAMES: Record<string, string> = {
  douyin: '抖音',
  xhs: '小红书',
  wxSph: '微信视频号',
  KWAI: '快手',
  youtube: 'YouTube',
  wxGzh: '微信公众号',
  bilibili: 'Bilibili',
  twitter: 'Twitter',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  instagram: 'Instagram',
  threads: 'Threads',
  pinterest: 'Pinterest',
  linkedin: 'LinkedIn',
}

/** 获取平台显示名称 */
function getPlatformDisplayName(platform?: string): string {
  if (!platform)
    return 'Platform'
  return PLATFORM_NAMES[platform] || platform.charAt(0).toUpperCase() + platform.slice(1)
}

/** Action 卡片配置 */
interface IActionConfig {
  icon: React.ReactNode
  title: string
  description: string
  buttonText: string
  bgClass: string
  borderClass: string
  iconClass: string
}

/**
 * ActionCard - 渲染单个 Action 卡片
 */
export function ActionCard({ action, className }: IActionCardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { lng } = useParams()
  const { t } = useTransClient('chat')
  const token = useUserStore(state => state.token)

  // Agent store 方法
  const { continueTask } = useAgentStore()

  // 添加账号弹窗状态
  const [addAccountVisible, setAddAccountVisible] = useState(false)

  const platformName = getPlatformDisplayName(action.platform)

  // 根据 action 类型获取配置
  const getActionConfig = (): IActionConfig => {
    switch (action.type) {
      case 'errorOnly':
        return {
          icon: <AlertCircle className="w-5 h-5" />,
          title: action.title || t('action.error' as any) || '生成失败',
          description: action.description || t('action.errorDesc' as any) || '生成失败，请稍后重试。',
          buttonText: '',
          bgClass: 'bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30',
          borderClass: 'border-rose-200 dark:border-rose-800',
          iconClass: 'text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/50',
        }
      case 'createChannel':
        return {
          icon: <Link2 className="w-5 h-5" />,
          title: t('action.addChannel' as any) || 'Add Channel',
          description: t('action.addChannelDesc' as any, { platform: platformName }) || `You haven't connected a ${platformName} account yet. Please add a channel to publish content.`,
          buttonText: t('action.addChannelNow' as any) || 'Add Channel',
          bgClass: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30',
          borderClass: 'border-blue-200 dark:border-blue-800',
          iconClass: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50',
        }
      case 'updateChannel':
        return {
          icon: <RefreshCw className="w-5 h-5" />,
          title: t('action.updateAuth' as any) || '更新授权',
          description: t('action.updateAuthDesc' as any, { platform: platformName }) || `${platformName} 账号授权已过期，请重新授权`,
          buttonText: t('action.reauthorize' as any) || '重新授权',
          bgClass: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30',
          borderClass: 'border-amber-200 dark:border-amber-800',
          iconClass: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50',
        }
      case 'loginChannel':
        return {
          icon: <AlertCircle className="w-5 h-5" />,
          title: t('action.loginChannel' as any) || '登录频道',
          description: t('action.loginChannelDesc' as any, { platform: platformName }) || `请先登录 ${platformName} 账号`,
          buttonText: t('action.goLogin' as any) || '去登录',
          bgClass: 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30',
          borderClass: 'border-purple-200 dark:border-purple-800',
          iconClass: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/50',
        }
      case 'navigateToPublish':
        return {
          icon: <Send className="w-5 h-5" />,
          title: t('action.readyToPublish' as any) || '准备发布',
          description: t('action.readyToPublishDesc' as any, { platform: platformName }) || `内容已准备好，可以发布到 ${platformName}`,
          buttonText: t('action.goPublish' as any) || '去发布',
          bgClass: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30',
          borderClass: 'border-green-200 dark:border-green-800',
          iconClass: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/50',
        }
      default:
        return {
          icon: <Link2 className="w-5 h-5" />,
          title: t('action.action' as any) || '操作',
          description: t('action.actionDesc' as any) || '请完成以下操作',
          buttonText: t('action.continue' as any) || '继续',
          bgClass: 'bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/30 dark:to-slate-950/30',
          borderClass: 'border-gray-200 dark:border-gray-800',
          iconClass: 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/50',
        }
    }
  }

  const config = getActionConfig()

  /**
   * 处理账号添加成功
   */
  const handleAccountAddSuccess = async () => {
    // 关闭弹窗
    setAddAccountVisible(false)

    // 检查是否在 chat 页面
    if (pathname.includes('/chat/')) {
      // 提取 taskId
      const pathParts = pathname.split('/')
      const taskIdIndex = pathParts.findIndex(part => part === 'chat')
      if (taskIdIndex !== -1 && pathParts[taskIdIndex + 1]) {
        const taskId = pathParts[taskIdIndex + 1]

        // 自动发送消息
        const platformName = getPlatformDisplayName(action.platform)
        const autoMessage = `I have added the "${platformName}" channel account, please continue.`

        try {
          await continueTask({
            prompt: autoMessage,
            medias: [],
            t: t as (key: string) => string,
            taskId,
          })
        }
        catch (error) {
          console.error('Auto send message failed:', error)
        }
      }
    }
  }

  // 处理按钮点击
  const handleClick = () => {
    const platform = action.platform || ''

    switch (action.type) {
      case 'createChannel':
        // 未登录时先登录
        if (!token) {
          toast.warning(t('home.loginRequired' as any) || 'Please login first')
          openLoginModal(() => setAddAccountVisible(true))
          return
        }
        // 直接打开添加账号弹窗
        setAddAccountVisible(true)
        break
      case 'updateChannel':
        router.push(`/${lng}/accounts?updateChannel=${platform}`)
        break
      case 'loginChannel':
        router.push(`/${lng}/accounts?loginChannel=${platform}`)
        break
      case 'navigateToPublish':
        // 构建发布参数
        const params = new URLSearchParams()
        params.set('action', 'publish')
        params.set('aiGenerated', 'true')
        if (platform)
          params.set('platform', platform)
        if (action.accountId)
          params.set('accountId', action.accountId)
        if (action.title)
          params.set('title', action.title)
        if (action.description)
          params.set('description', action.description)
        if (action.tags?.length)
          params.set('tags', JSON.stringify(action.tags))
        if (action.medias?.length)
          params.set('medias', JSON.stringify(action.medias))
        router.push(`/${lng}/accounts?${params.toString()}`)
        break
      default:
        router.push(`/${lng}/accounts`)
    }
  }

  return (
    <div
      className={cn(
        'rounded-xl border p-4 transition-all hover:shadow-md',
        config.bgClass,
        config.borderClass,
        className,
      )}
    >
      {/* 头部：图标 + 标题 */}
      <div className="flex items-center gap-3 mb-3">
        <div className={cn('p-2 rounded-lg', config.iconClass)}>
          {config.icon}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-foreground">{config.title}</h4>
          {action.platform && (
            <span className="text-xs text-muted-foreground">{platformName}</span>
          )}
        </div>
      </div>

      {/* 描述 */}
      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
        {config.description}
      </p>

      {/* 操作按钮：errorOnly 不显示按钮 */}
      {action.type !== 'errorOnly' && (
        <Button
          onClick={handleClick}
          className="w-full group"
          variant="default"
        >
          {config.buttonText}
          <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
        </Button>
      )}

      {/* 添加账号弹窗 - 仅用于 createChannel */}
      {action.type === 'createChannel' && (
        <AddAccountModal
          open={addAccountVisible}
          onClose={() => setAddAccountVisible(false)}
          onAddSuccess={handleAccountAddSuccess}
          showSpaceSelector={true}
        />
      )}
    </div>
  )
}

export default ActionCard
