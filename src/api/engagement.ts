import http from '@/utils/request';
import { EngagementPostsParams, EngagementPostsResponse } from './types/engagement';

export async function apiGetEngagementPosts(params: EngagementPostsParams) {
  return http.post<EngagementPostsResponse>('api/channel/engagement/posts', params);
}


