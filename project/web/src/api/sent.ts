import type { SentPostsResponse } from './types/sent.types'
import { request } from '@/utils/request'

// Get published posts list
export function getSentPosts(params: any) {
  return request<SentPostsResponse>({
    url: 'plat/publish/statuses/published/posts',
    method: 'POST',
    data: params,
  })
}
