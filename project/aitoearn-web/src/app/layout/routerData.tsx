import type { UserInfo } from '@/store/user'
/**
 * 路由/导航数据配置
 * 包含导航项的图标、路径、翻译键等信息
 */
import {
  BookOpenText,
  Bot,
  History,
  Home,
  Radar,
  ServerCog,
  Sparkles,
  Upload,
} from 'lucide-react'
import { isSystemAdminUser } from '@/utils/systemAdmin'

export interface IRouterDataItem {
  // 导航标题
  name: string
  // 翻译键
  translationKey: string
  // 跳转链接
  path?: string
  // 图标
  icon?: React.ReactNode
  // 子导航
  children?: IRouterDataItem[]
  // 仅系统管理员可见
  adminOnly?: boolean
}

export const routerData: IRouterDataItem[] = [
  {
    name: 'Content Management',
    translationKey: 'header.draftBox',
    path: '/',
    icon: <Home size={20} />,
  },
  {
    name: 'AI Publish',
    translationKey: 'aiSocial',
    path: '/ai-social',
    icon: <Sparkles size={20} />,
  },
  {
    name: 'Customer Radar',
    translationKey: 'customerRadar',
    path: '/customer-radar',
    icon: <Radar size={20} />,
  },
  {
    name: 'Knowledge Base',
    translationKey: 'knowledgeBase',
    path: '/knowledge-base',
    icon: <BookOpenText size={20} />,
  },
  {
    name: 'System Admin',
    translationKey: 'systemAdmin',
    path: '/system-admin',
    icon: <ServerCog size={20} />,
    adminOnly: true,
  },
  {
    name: 'Task History',
    translationKey: 'tasksHistory',
    path: '/tasks-history',
    icon: <History size={20} />,
  },
  {
    name: 'Publish',
    translationKey: 'accounts',
    path: '/accounts',
    icon: <Upload size={20} />,
  },
  // Tasks moved to notification panel
  {
    name: 'Agent Assets',
    translationKey: 'header.agentAssets',
    path: '/agent-assets',
    icon: <Bot size={20} />,
  },
]

export function filterRouterDataForUser(
  items: IRouterDataItem[],
  userInfo?: Partial<UserInfo>,
): IRouterDataItem[] {
  const isAdmin = isSystemAdminUser(userInfo)
  return items
    .filter(item => !item.adminOnly || isAdmin)
    .map(item => ({
      ...item,
      children: item.children ? filterRouterDataForUser(item.children, userInfo) : undefined,
    }))
}
