import http from '@/utils/request'

export interface XhsPromotionShareConfigResponse {
  verifyConfig: {
    appKey: string
    nonce: string
    timestamp: string
    signature: string
  }
}

export function apiGetXhsPromotionShareConfig(params?: { nonce?: string }) {
  return http.post<XhsPromotionShareConfigResponse>('plat/xiaohongshu/promotion/share-config', params || {})
}
