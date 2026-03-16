import http from '@/utils/request'

export type TikTokPrivacyLevel
  = | 'PUBLIC_TO_EVERYONE'
    | 'MUTUAL_FOLLOW_FRIENDS'
    | 'FOLLOWER_OF_CREATOR'
    | 'SELF_ONLY'

export interface TikTokNoUserAuthUrlParams {
  promotionCode: string
}

export interface TikTokVideoPublishParams {
  accountId: string
  postInfo: {
    title: string
    description?: string
    privacy_level: TikTokPrivacyLevel
  }
  sourceInfo: {
    source: 'PULL_FROM_URL'
    video_url: string
  }
  materialGroupId?: string
  materialId?: string
}

export interface TikTokPhotoPublishParams {
  accountId: string
  postMode: 'DIRECT_POST' | 'MEDIA_UPLOAD'
  postInfo: {
    title: string
    description?: string
    privacy_level: TikTokPrivacyLevel
  }
  sourceInfo: {
    source: 'PULL_FROM_URL'
    photo_images: string[]
    photo_cover_index: number
  }
  materialGroupId?: string
  materialId?: string
}

export function apiGetTikTokNoUserAuthUrl(params: TikTokNoUserAuthUrlParams) {
  return http.post<{ url: string, promotionCode: string }>('plat/tiktok/authUrl', params)
}

export function apiTikTokVideoPublish(params: TikTokVideoPublishParams) {
  return http.post<{ success: boolean, publishId?: string }>('plat/tiktok/initVideoPublish', params)
}

export function apiTikTokPhotoPublish(params: TikTokPhotoPublishParams) {
  return http.post<{ success: boolean, publishId?: string }>('plat/tiktok/initPhotoPublish', params)
}
