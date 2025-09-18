import http from '@/utils/request';
import { EngagementPostsParams, EngagementPostsResponse, EngagementCommentsParams, EngagementCommentsResponse, EngagementReplyParams, PostCommentsParamsV2, PostCommentsResponseV2, PublishPostCommentParams, PublishCommentReplyParams } from './types/engagement';

export async function apiGetEngagementPosts(params: EngagementPostsParams) {
  return http.post<EngagementPostsResponse>('channel/engagement/posts', params);
}

export async function apiGetEngagementComments(params: EngagementCommentsParams) {
  return http.post<EngagementCommentsResponse>('channel/engagement/comments', params);
}

export async function apiReplyEngagementComment(params: EngagementReplyParams) {
  return http.post<{}>('channel/engagement/comment/reply', params);
}

// 获取作品一级评论（V2）
export async function apiGetPostComments(params: PostCommentsParamsV2) {
  return http.post<PostCommentsResponseV2>('channel/engagement/post/comments', params);
}

export async function apiPublishPostComment(params: PublishPostCommentParams) {
  return http.post<{}>('channel/engagement/post/comments/publish', params);
}

export async function apiPublishCommentReply(params: PublishCommentReplyParams) {
  return http.post<{}>('channel/engagement/comment/replies/publish', params);
}


