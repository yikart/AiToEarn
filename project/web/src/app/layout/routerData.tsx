/**
 * 路由/导航数据配置
 * 包含导航项的图标、路径、翻译键等信息
 */
import {
  BarChart3,
  FileText,
  FolderOpen,
  History,
  Home,
  ListTodo,
  MessageCircle,
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
    name: 'Home',
    translationKey: 'home',
    path: '/',
    icon: <Home size={20} />,
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
  {
    name: 'Engage',
    translationKey: 'interactive',
    path: '/interactiveNew',
    icon: <MessageCircle size={20} />,
  },
  // Tasks moved to notification panel
  {
    name: 'Data Statistics',
    translationKey: 'dataStatistics',
    path: '/dataStatistics',
    icon: <BarChart3 size={20} />,
  },
  {
    name: 'Material Library',
    translationKey: 'header.materialLibrary',
    path: '/material',
    icon: <FolderOpen size={20} />,
  },
  {
    name: 'Draft Box',
    translationKey: 'header.draftBox',
    path: '/cgmaterial',
    icon: <FileText size={20} />,
  },
]
