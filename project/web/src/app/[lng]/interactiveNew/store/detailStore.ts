/**
 * 详情弹框状态管理
 * 管理详情弹框的打开/关闭、加载状态、预览数据和详情数据
 */

import type { ClickRect } from '../components/FeedCard'
import type { HomeFeedItem, SupportedPlatformType, WorkDetail } from '@/store/plugin/plats/types'
import { create } from 'zustand'
import { platformManager } from '@/store/plugin'

/**
 * 预览数据（从列表项提取，在请求详情前显示）
 */
export interface PreviewData {
  workId: string
  thumbnail: string
  title: string
  authorName: string
  authorAvatar: string
  authorUrl: string
  authorId: string
  likeCount: string
  isVideo: boolean
  isLiked: boolean
  isFollowed: boolean
}

/**
 * 详情弹框状态
 */
interface DetailModalState {
  /** 是否显示弹框 */
  isOpen: boolean
  /** 是否正在加载详情 */
  loading: boolean
  /** 点击位置（用于动画） */
  clickRect: ClickRect | null
  /** 预览数据（从列表项提取） */
  preview: PreviewData | null
  /** 完整详情数据 */
  detail: WorkDetail | null
  /** 错误信息 */
  error: string | null
  /** 当前平台 */
  platform: SupportedPlatformType | null
  /** 原始列表数据（用于请求详情） */
  originData: any

  // ============================================================================
  // 媒体区域状态
  // ============================================================================
  /** 当前图片索引 */
  currentImageIndex: number
  /** 是否显示图片预览 */
  imagePreviewVisible: boolean
}

/**
 * 详情弹框操作
 */
interface DetailModalActions {
  /**
   * 打开弹框并请求详情
   * @param item 列表项数据
   * @param rect 点击位置
   * @param platform 当前平台
   */
  open: (item: HomeFeedItem, rect: ClickRect, platform: SupportedPlatformType) => void

  /** 关闭弹框 */
  close: () => void

  /** 重置状态 */
  reset: () => void

  // ============================================================================
  // 媒体区域操作
  // ============================================================================
  /** 设置当前图片索引 */
  setCurrentImageIndex: (index: number) => void

  /** 打开图片预览 */
  openImagePreview: (index?: number) => void

  /** 关闭图片预览 */
  closeImagePreview: () => void
}

type DetailModalStore = DetailModalState & DetailModalActions

/**
 * 从列表项提取预览数据
 */
function extractPreviewData(item: HomeFeedItem): PreviewData {
  return {
    workId: item.workId,
    thumbnail: item.thumbnail,
    title: item.title,
    authorName: item.authorName,
    authorAvatar: item.authorAvatar,
    authorUrl: item.authorUrl,
    authorId: item.authorId,
    likeCount: item.likeCount,
    isVideo: item.isVideo,
    isLiked: item.isLiked,
    isFollowed: item.isFollowed,
  }
}

/**
 * 初始状态
 */
const initialState: DetailModalState = {
  isOpen: false,
  loading: false,
  clickRect: null,
  preview: null,
  detail: null,
  error: null,
  platform: null,
  originData: null,
  currentImageIndex: 0,
  imagePreviewVisible: false,
}

/**
 * 详情弹框 Store
 */
export const useDetailModalStore = create<DetailModalStore>((set, get) => ({
  ...initialState,

  open: (item, rect, platform) => {
    // 提取预览数据并立即打开弹框
    const preview = extractPreviewData(item)

    set({
      isOpen: true,
      loading: true,
      clickRect: rect,
      preview,
      detail: null,
      error: null,
      platform,
      originData: item.origin,
      currentImageIndex: 0,
      imagePreviewVisible: false,
    })

    // 异步请求详情
    const fetchDetail = async () => {
      try {
        const result = await platformManager.getWorkDetail(platform, {
          workId: item.workId,
          // 小红书需要 xsecToken
          xsecToken: item.origin?.xsec_token,
        })

        // 检查弹框是否还在打开状态（避免关闭后还更新状态）
        if (!get().isOpen)
          return

        if (result.success && result.detail) {
          set({
            detail: result.detail,
            loading: false,
            error: null,
          })
        }
        else {
          set({
            loading: false,
            error: result.message || '获取详情失败',
          })
        }
      }
      catch (error) {
        // 检查弹框是否还在打开状态
        if (!get().isOpen)
          return

        set({
          loading: false,
          error: error instanceof Error ? error.message : '请求失败',
        })
      }
    }

    fetchDetail()
  },

  close: () => {
    set({ isOpen: false, imagePreviewVisible: false })
    // 延迟清理其他状态，让关闭动画完成
    setTimeout(() => {
      const state = get()
      if (!state.isOpen) {
        set({
          preview: null,
          detail: null,
          error: null,
          clickRect: null,
          loading: false,
          currentImageIndex: 0,
        })
      }
    }, 500)
  },

  reset: () => {
    set(initialState)
  },

  // ============================================================================
  // 媒体区域操作
  // ============================================================================
  setCurrentImageIndex: (index) => {
    set({ currentImageIndex: index })
  },

  openImagePreview: (index) => {
    set({
      imagePreviewVisible: true,
      currentImageIndex: index ?? get().currentImageIndex,
    })
  },

  closeImagePreview: () => {
    set({ imagePreviewVisible: false })
  },
}))

/**
 * 获取图片列表（从详情或预览数据中提取）
 */
export function getImageList(detail: WorkDetail | null, preview: PreviewData | null): string[] {
  if (detail?.imageList && detail.imageList.length > 0) {
    return detail.imageList.map(img => img.url)
  }
  if (detail?.coverUrl) {
    return [detail.coverUrl]
  }
  if (preview?.thumbnail) {
    return [preview.thumbnail]
  }
  return []
}

/**
 * 获取视频信息
 */
export function getVideoInfo(detail: WorkDetail | null) {
  if (detail?.type === 'video' && detail.video?.url) {
    return detail.video
  }
  return null
}
