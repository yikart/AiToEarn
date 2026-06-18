/**
 * 素材媒体类型。
 */
export type MaterialMediaType = 'img' | 'video'

/**
 * 素材媒体项，供素材库与公开推广码素材接口复用。
 */
export interface MaterialMedia {
  url: string
  type: MaterialMediaType
  content?: string
  thumbUrl?: string
}
