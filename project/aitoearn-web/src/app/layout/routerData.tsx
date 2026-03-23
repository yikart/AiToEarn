/**
 * 路由/导航数据配置
 * 包含导航项的图标、路径、翻译键等信息
 */
import {
  Bot,
  History,
  Home,
  Sparkles,
  Upload,
} from 'lucide-react'

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
