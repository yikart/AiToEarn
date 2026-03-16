import type { ThumbnailVo } from './types/assets'
import http from '@/utils/request'

export function getVideoThumbnail(url: string, timeInSeconds = 1) {
  return http.get<ThumbnailVo>('assets/thumbnail', { url, timeInSeconds })
}
