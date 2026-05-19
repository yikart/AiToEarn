import { z } from 'zod'

// ---------------------------------------------------------------------------
// GooglePlacePhoto
// ---------------------------------------------------------------------------

export const GooglePlacePhotoSchema = z.object({
  photoReference: z.string().describe('照片引用 ID'),
  url: z.string().optional().describe('照片 URL'),
  width: z.number().describe('宽度'),
  height: z.number().describe('高度'),
  attributions: z.array(z.string()).describe('归属信息'),
})
export interface GooglePlacePhoto extends z.infer<typeof GooglePlacePhotoSchema> {}

// ---------------------------------------------------------------------------
// GooglePlaceReview
// ---------------------------------------------------------------------------

export const GooglePlaceReviewSchema = z.object({
  authorName: z.string().describe('作者名称'),
  authorPhoto: z.string().optional().describe('作者头像'),
  rating: z.number().describe('评分'),
  text: z.string().optional().describe('评论内容'),
  language: z.string().optional().describe('语言'),
  time: z.number().describe('评论时间戳'),
  relativeTimeDescription: z.string().optional().describe('相对时间描述'),
})
export interface GooglePlaceReview extends z.infer<typeof GooglePlaceReviewSchema> {}

// ---------------------------------------------------------------------------
// GooglePlaceOpeningHours
// ---------------------------------------------------------------------------

export const GooglePlaceOpeningHoursSchema = z.object({
  day: z.number().describe('星期几'),
  open: z.string().optional().describe('开门时间'),
  close: z.string().optional().describe('关门时间'),
  isClosed: z.boolean().describe('是否关闭'),
})
export interface GooglePlaceOpeningHours extends z.infer<typeof GooglePlaceOpeningHoursSchema> {}

// ---------------------------------------------------------------------------
// GooglePlacePreview
// ---------------------------------------------------------------------------

export const GooglePlacePreviewSchema = z.object({
  placeId: z.string().describe('Google 地点 ID'),
  name: z.string().describe('地点名称'),
  formattedAddress: z.string().optional().describe('格式化地址'),
  lat: z.number().optional().describe('纬度'),
  lng: z.number().optional().describe('经度'),
  phone: z.string().optional().describe('电话'),
  website: z.string().optional().describe('网站'),
  rating: z.number().optional().describe('评分'),
  userRatingsTotal: z.number().optional().describe('评分总数'),
  priceLevel: z.number().optional().describe('价格水平'),
  types: z.array(z.string()).optional().describe('类型列表'),
  url: z.string().optional().describe('Google 地图 URL'),
  openingHours: z.array(GooglePlaceOpeningHoursSchema).optional().describe('营业时间'),
  photos: z.array(GooglePlacePhotoSchema).optional().describe('照片列表'),
  reviews: z.array(GooglePlaceReviewSchema).optional().describe('评论列表'),
})
export interface GooglePlacePreview extends z.infer<typeof GooglePlacePreviewSchema> {}
