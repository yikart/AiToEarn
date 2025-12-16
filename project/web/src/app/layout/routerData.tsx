/**
 * 路由/导航数据配置
 * 包含导航项的图标、路径、翻译键等信息
 */
import {
  BarChart3,
  FileText,
  FolderOpen,
  Home,
  ListTodo,
  MessageCircle,
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
    name: '首页',
    translationKey: 'home',
    path: '/',
    icon: <Home size={20} />,
  },
  {
    name: '发布',
    translationKey: 'accounts',
    path: '/accounts',
    icon: <Upload size={20} />,
  },
  {
    name: '互动数据',
    translationKey: 'interactive',
    path: '/interactive',
    icon: <MessageCircle size={20} />,
  },
  {
    name: 'AI工具',
    translationKey: 'aiTools',
    path: '/material/ai-generate',
    icon: <Sparkles size={20} />,
  },
  {
    name: '任务中心',
    translationKey: 'tasks',
    path: '/tasks',
    icon: <ListTodo size={20} />,
  },
  {
    name: '数据统计',
    translationKey: 'dataStatistics',
    path: '/dataStatistics',
    icon: <BarChart3 size={20} />,
  },
  {
    name: '素材库',
    translationKey: 'header.materialLibrary',
    path: '/material',
    icon: <FolderOpen size={20} />,
  },
  {
    name: '草稿箱',
    translationKey: 'header.draftBox',
    path: '/cgmaterial',
    icon: <FileText size={20} />,
  },
]

