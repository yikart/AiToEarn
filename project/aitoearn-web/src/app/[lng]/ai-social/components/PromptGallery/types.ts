/**
 * PromptGallery 组件类型定义
 * 定义视频提示词展示相关的数据结构
 */

/**
 * 视频提示词数据项
 */
export interface PromptGalleryItem {
  /** 提示词标题（用于弹窗标题显示） */
  title: string
  /** 完整的提示词内容 */
  prompt: string
  /** 视频封面图路径 */
  cover: string
  /** 视频文件路径 */
  video: string
  /** 参考素材图片路径列表 */
  materials?: string[]
}

/**
 * 视频卡片尺寸类型
 * - vertical: 竖视频 (9:16)，在 PC 端占据 2 行高度
 * - horizontal: 横视频 (16:9)，在 PC 端占据 1 行高度
 */
export type VideoCardSize = 'vertical' | 'horizontal'

/**
 * VideoCard 组件属性
 */
export interface VideoCardProps {
  /** 视频数据 */
  item: PromptGalleryItem
  /** 点击卡片回调 */
  onClick: () => void
  /** 卡片尺寸类型 */
  size?: VideoCardSize
}

/**
 * VideoDetailModal 组件属性
 */
export interface VideoDetailModalProps {
  /** 是否显示弹窗 */
  open: boolean
  /** 关闭弹窗回调 */
  onOpenChange: (open: boolean) => void
  /** 视频数据 */
  item: PromptGalleryItem | null
  /** 应用提示词回调（包含 prompt 和 materials） */
  onApplyPrompt?: (data: { prompt: string, materials?: string[] }) => void
}
