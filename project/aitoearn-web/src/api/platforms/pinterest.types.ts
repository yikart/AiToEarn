// Source: types/pinterest.ts

/**
 * PinterestBoardPrivacy 类型。
 */
export type PinterestBoardPrivacy = 'PUBLIC' | 'PROTECTED' | 'SECRET'

/**
 * PinterestBoardCreateParams 请求参数。
 */
export interface PinterestBoardCreateParams {
  name: string
  description?: string
  privacy?: PinterestBoardPrivacy
}

/**
 * PinterestBoardItem 数据结构。
 */
export interface PinterestBoardItem {
  id: string
  name: string
  description?: string
}
