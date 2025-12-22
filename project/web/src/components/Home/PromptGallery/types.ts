/**
 * PromptGallery 类型定义
 */

/** 提示词项接口定义 */
export interface PromptItem {
  title: string
  title_en?: string
  preview: string
  prompt: string
  prompt_en?: string
  author: string
  link?: string
  mode: 'edit' | 'generate'
  category: string
  category_en?: string
  sub_category?: string
  sub_category_en?: string
}

/** 筛选模式类型 */
export type FilterMode = 'all' | 'generate' | 'edit'

/** 分类筛选类型 */
export type CategoryFilter = 'all' | 'Recommend' | 'Image'

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

