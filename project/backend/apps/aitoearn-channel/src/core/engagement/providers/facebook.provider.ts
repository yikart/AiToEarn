import { Injectable } from '@nestjs/common'
import { PostsResponseVo, PostVo } from '@yikart/common'
import { FacebookService } from '../../../core/platforms/meta/facebook.service'
import { FacebookPagePostRequest, FacebookPostCommentsRequest } from '../../../libs/facebook/facebook.interfaces'
import { KeysetPagination, OffsetPagination } from '../engagement.dto'
import { EngagementComment, EngagementProvider, FetchPostCommentsResponse, PublishCommentResponse } from '../engagement.interface'

@Injectable()
export class FacebookEngagementProvider implements EngagementProvider {
  public readonly paginationType = 'keyset'

  constructor(
    private readonly FacebookService: FacebookService,
  ) { }

  async fetchUserPosts(accountId: string, pagination: KeysetPagination | OffsetPagination | null): Promise<PostsResponseVo> {
    const req: FacebookPagePostRequest = {
      fields: 'id,message,created_time,attachments,is_published,is_expired,permalink_url,shares,comments.summary(true),likes.summary(true),insights.metric(post_impressions,post_clicks,post_reactions_like_total,post_video_views).period(lifetime)',
      limit: (pagination as KeysetPagination)?.limit || 50,
      before: (pagination as KeysetPagination)?.before,
      after: (pagination as KeysetPagination)?.after,
    }
    const resp = await this.FacebookService.getPagePosts(accountId, req)
    const posts = resp.data.map((item) => {
      const medias = []
      if (item.attachments?.data) {
        for (const attachment of item.attachments.data) {
          if (attachment.media?.image?.src) {
            medias.push({
              url: attachment.media.source || attachment.media.image.src,
              type: attachment.type === 'video_autoplay' || attachment.type === 'video_inline' ? 'video' : 'image',
              thumbnail: attachment.media.image.src,
            })
          }
        }
      }
      return {
        id: item.id,
        platform: 'facebook',
        title: '',
        content: item.message || '',
        medias,
        permalink: item.permalink_url || '',
        publishTime: new Date(item.created_time).getTime(),
        viewCount: item.insights?.data?.find(d => d.name === 'post_video_views')?.values[0]?.value || 0,
        commentCount: item.comments?.summary?.total_count || 0,
        likeCount: item.likes?.summary?.total_count || 0,
        shareCount: item.shares?.count || 0,
        clickCount: item.insights?.data?.find(d => d.name === 'post_clicks')?.values[0]?.value || 0,
        impressionCount: item.insights?.data?.find(d => d.name === 'post_impressions')?.values[0]?.value || 0,
        favoriteCount: 0,
      }
    })
    return {
      posts,
      cursor: {
        before: resp.paging?.cursors?.before || '',
        after: resp.paging?.cursors?.after || '',
      } as KeysetPagination,
    }
  }

  async getMetaPostDetail(accountId: string, postId: string): Promise<PostVo> {
    const fields = 'id,message,created_time,attachments,is_published,is_expired,permalink_url,shares,comments.summary(true),likes.summary(true),insights.metric(post_impressions,post_clicks,post_reactions_like_total,post_video_views).period(lifetime)'
    const postDetail = await this.FacebookService.getPostDetail(accountId, postId, fields)
    const medias = []
    if (postDetail.attachments?.data) {
      for (const attachment of postDetail.attachments.data) {
        if (attachment.media?.image?.src) {
          medias.push({
            url: attachment.media.source || attachment.media.image.src,
            type: attachment.type === 'video_autoplay' || attachment.type === 'video_inline' ? 'video' : 'image',
            thumbnail: attachment.media.image.src,
          })
        }
      }
    }
    return {
      id: postDetail.id,
      platform: 'facebook',
      title: '',
      content: postDetail.message || '',
      medias,
      permalink: postDetail.permalink_url || '',
      publishTime: new Date(postDetail.created_time).getTime(),
      viewCount: postDetail.insights?.data?.find(d => d.name === 'post_video_views')?.values[0]?.value || 0,
      commentCount: postDetail.comments?.summary?.total_count || 0,
      likeCount: postDetail.likes?.summary?.total_count || 0,
      shareCount: postDetail.shares?.count || 0,
      clickCount: postDetail.insights?.data?.find(d => d.name === 'post_clicks')?.values[0]?.value || 0,
      impressionCount: postDetail.insights?.data?.find(d => d.name === 'post_impressions')?.values[0]?.value || 0,
      favoriteCount: 0,
    }
  }

  private async fetchFacebookObjectComments(accountId: string, targetId: string, pagination: KeysetPagination | OffsetPagination | null): Promise<FetchPostCommentsResponse> {
    const query: FacebookPostCommentsRequest = {
      filter: 'toplevel',
      fields: 'id,message,from{name,picture{url}},created_time,comment_count',
      order: 'reverse_chronological',
    }
    if ((pagination as KeysetPagination)?.before) {
      query.before = (pagination as KeysetPagination).before || ''
    }
    if ((pagination as KeysetPagination)?.after) {
      query.after = (pagination as KeysetPagination).after || ''
    }
    const resp = await this.FacebookService.fetchObjectComments(accountId, targetId, query)
    const comments: EngagementComment[] = []
    for (const item of resp?.data || []) {
      comments.push({
        id: item.id,
        message: item.message,
        author: {
          username: item.from?.name || 'Unknown',
          avatar: item.from?.picture?.data?.url || '',
        },
        createdAt: item.created_time,
        hasReplies: (item.comment_count || 0) > 0,
      })
    }
    const result: FetchPostCommentsResponse = {
      comments,
      cursor: {
        before: resp?.paging?.cursors?.before || '',
        after: resp?.paging?.cursors?.after || '',
      } as KeysetPagination,
    }
    return result
  }

  private async publishFacebookObjectComment(accountId: string, targetId: string, message: string): Promise<PublishCommentResponse> {
    const resp = await this.FacebookService.publishPlaintextComment(accountId, targetId, message)
    if (resp?.id) {
      return {
        id: resp.id,
        success: true,
      }
    }
    else {
      return {
        success: false,
        error: 'Failed to publish comment',
      }
    }
  }

  async fetchPostComments(accountId: string, postId: string, pagination: KeysetPagination | OffsetPagination | null): Promise<FetchPostCommentsResponse> {
    if (pagination && 'offset' in pagination) {
      throw new Error('Facebook provider only supports keyset pagination')
    }
    return this.fetchFacebookObjectComments(accountId, postId, pagination)
  }

  async fetchCommentReplies(accountId: string, commentId: string, pagination: KeysetPagination | OffsetPagination | null): Promise<FetchPostCommentsResponse> {
    if (pagination && 'offset' in pagination) {
      throw new Error('Facebook provider only supports keyset pagination')
    }
    return this.fetchFacebookObjectComments(accountId, commentId, pagination)
  }

  async commentOnPost(accountId: string, postId: string, message: string): Promise<PublishCommentResponse> {
    return this.publishFacebookObjectComment(accountId, postId, message)
  }

  async replyToComment(accountId: string, commentId: string, message: string): Promise<PublishCommentResponse> {
    return this.publishFacebookObjectComment(accountId, commentId, message)
  }
}
