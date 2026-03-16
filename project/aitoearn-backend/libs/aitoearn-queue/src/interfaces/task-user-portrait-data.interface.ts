/**
 * 用户画像上报数据接口
 */
export interface TaskUserPortraitData {
  userId: string
  name?: string
  avatar?: string
  status?: number
  lastLoginTime?: string
  contentTags?: Record<string, number>
  totalFollowers?: number
  totalWorks?: number
  totalViews?: number
  totalLikes?: number
  totalCollects?: number
}
