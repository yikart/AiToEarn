/**
 * PromptGallery 缓存管理
 * 用于保存弹框状态（跨组件生命周期）
 */

import type { FilterMode } from './types'
import { LOAD_MORE_COUNT } from './constants'

/** 缓存状态接口 */
interface GalleryCache {
  scrollTop: number
  displayCount: number
  selectedMode: FilterMode
  titleFilter: string
}

/** 模块级缓存实例 */
const galleryCache: GalleryCache = {
  scrollTop: 0,
  displayCount: LOAD_MORE_COUNT,
  selectedMode: 'all',
  titleFilter: '',
}

/** 获取缓存 */
export function getGalleryCache(): GalleryCache {
  return galleryCache
}

/** 更新缓存 */
export function updateGalleryCache(updates: Partial<GalleryCache>): void {
  Object.assign(galleryCache, updates)
}

/** 重置缓存（筛选条件改变时） */
export function resetGalleryCache(): void {
  galleryCache.scrollTop = 0
  galleryCache.displayCount = LOAD_MORE_COUNT
}
