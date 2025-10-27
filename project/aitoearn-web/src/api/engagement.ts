import http from '@/utils/request';
import { EngagementPostsParams, EngagementPostsResponse, EngagementCommentsParams, EngagementCommentsResponse, EngagementReplyParams, PostCommentsParamsV2, PostCommentsResponseV2, PublishPostCommentParams, PublishCommentReplyParams, CommentRepliesParams, CommentRepliesResponse } from './types/engagement';

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

// 获取评论的回复列表
export async function apiGetCommentReplies(params: CommentRepliesParams) {
  return http.post<CommentRepliesResponse>('channel/engagement/comment/replies', params);
}


