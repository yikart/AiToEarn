/**
 * PromptGallery 类型定义
 */

/** 提示词项接口定义 */
export interface PromptItem {
  title: string
  preview: string
  prompt: string
  author: string
  link?: string
  mode: 'edit' | 'generate'
  category: string
  sub_category?: string
}

/** 筛选模式类型 */
export type FilterMode = 'all' | 'generate' | 'edit'

/** 组件属性接口定义 */
export interface IPromptGalleryProps {
  /** 应用提示词的回调函数 */
  onApplyPrompt?: (data: {
    prompt: string
    image?: string
    mode: 'edit' | 'generate'
  }) => void
  /** 自定义类名 */
  className?: string
}

/** 应用提示词数据 */
export interface ApplyPromptData {
  prompt: string
  image?: string
  mode: 'edit' | 'generate'
}

