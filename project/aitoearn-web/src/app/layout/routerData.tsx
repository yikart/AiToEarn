/**
 * 路由/导航数据配置
 * 包含导航项的图标、路径、翻译键等信息
 */
import {
  FileText,
  FolderOpen,
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
    path: '/draft-box',
    icon: <FileText size={20} />,
  },
  {
    name: 'AI social media',
    translationKey: 'aiSocial',
    path: '/ai-social',
    icon: <Sparkles size={20} />,
  },
  {
    name: 'Publish',
    translationKey: 'accounts',
    path: '/accounts',
    icon: <Upload size={20} />,
  },
  {
    name: 'Material Library',
    translationKey: 'header.materialLibrary',
    path: '/material',
    icon: <FolderOpen size={20} />,
  },
]
