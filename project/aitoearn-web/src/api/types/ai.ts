/**
 * AI 模块类型定义
 */

/** 支持适配的平台 */
export type AdaptPlatform
  = | 'douyin'
    | 'xhs'
    | 'wxSph'
    | 'KWAI'
    | 'youtube'
    | 'wxGzh'
    | 'bilibili'
    | 'twitter'
    | 'tiktok'
    | 'facebook'
    | 'instagram'
    | 'threads'
    | 'pinterest'
    | 'linkedin'

/** 素材适配请求参数 */
export interface AdaptMaterialDto {
  materialId: string
  platforms: AdaptPlatform[]
}

/** 素材适配结果 */
export interface MaterialAdaptationVo {
  id: string
  materialId: string
  platform: string
  title?: string
  desc?: string
  topics: string[]
  platformOptions?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}
