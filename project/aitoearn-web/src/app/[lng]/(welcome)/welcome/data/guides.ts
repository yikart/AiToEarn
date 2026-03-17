/**
 * guides.ts - 指南数据
 * 已弃用：数据已迁移到国际化文件中
 * 保留类型定义以备后用
 */

export interface Guide {
  id: string
  title: string
  image: string
  imageSrcSet?: string
  href: string
  isVideo?: boolean
  external?: boolean
}

/** @deprecated 使用国际化翻译代替 */
export const guides: Guide[] = []
