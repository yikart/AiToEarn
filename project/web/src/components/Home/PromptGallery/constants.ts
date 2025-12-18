/**
 * PromptGallery 常量定义
 */

import type { PromptItem } from './types'
import promptsData from './prompt.json'

// 使用导入的提示词数据
export const SAMPLE_PROMPTS: PromptItem[] = promptsData as PromptItem[]

// 首页精选数量
export const FEATURED_COUNT = 8

// 弹框每次加载数量
export const LOAD_MORE_COUNT = 20

// 瀑布流断点配置
export const MASONRY_BREAKPOINTS = {
  default: 5,
  1536: 4, // 2xl
  1280: 4, // xl
  1024: 3, // lg
  768: 2,  // md
  640: 2,  // sm
  480: 1,  // xs
}

