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
  // 注意：react-masonry-css 使用的断点对象用于控制在不同最大宽度下的列数。
  // 这里把默认（超大屏）设置为 6 列，并在较大屏幕与中等屏幕之间做平滑过渡。
  default: 6,   // > 1900px 及更大屏幕采用 6 列
  1900: 6,      // <= 1900px 时也为 6 列（保证超宽屏时为 6 列）
  1536: 5,      // <= 1536px 时 5 列
  1280: 4,      // <= 1280px 时 4 列
  1024: 3,      // <= 1024px 时 3 列
  768: 2,       // <= 768px 时 2 列
  640: 2,       // <= 640px 时 2 列
  480: 1,       // <= 480px 时 1 列
}

