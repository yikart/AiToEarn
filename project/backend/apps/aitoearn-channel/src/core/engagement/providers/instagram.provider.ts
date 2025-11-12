import { Injectable } from '@nestjs/common'
import { PostsResponseVo } from '@yikart/common'
import { InstagramService } from '../../../core/plat/meta/instagram.service'
import { InstagramMediaType } from '../../../libs/instagram/instagram.enum'
import { IGPostCommentsRequest, InstagramUserPostRequest } from '../../../libs/instagram/instagram.interfaces'
import { KeysetPagination, OffsetPagination } from '../engagement.dto'
import { EngagementComment, EngagementProvider, FetchPostCommentsResponse, PublishCommentResponse } from '../engagement.interface'

@Injectable()
export class InstagramEngagementProvider implements EngagementProvider {
  constructor(
    private readonly instagramService: InstagramService,
  ) { }

  async fetchUserPosts(accountId: string, pagination: KeysetPagination | OffsetPagination | null): Promise<PostsResponseVo> {
    const req: InstagramUserPostRequest = {
      fields: 'fields=id,caption,comments_count,like_count,media_type,media_url,permalink,thumbnail_url,timestamp,view_count,children\{media_url,thumbnail_url,media_type\}',
      limit: (pagination as KeysetPagination)?.limit || 50,
      before: (pagination as KeysetPagination)?.before,
      after: (pagination as KeysetPagination)?.after,
    }
    const resp = await this.instagramService.getUserPosts(accountId, req)
    const posts = resp.data.map((item) => {
      const medias = []
      if (item.media_type === InstagramMediaType.CAROUSEL_ALBUM && item.children?.data) {
        for (const child of item.children.data) {
          medias.push({
            url: child.media_url,
            type: child.media_type === 'VIDEO' ? 'video' : 'image',
          })
        }
      }
      else {
        medias.push({
          url: item.media_url,
          type: item.media_type === 'VIDEO' ? 'video' : 'image',
          thumbnail: item.thumbnail_url || '',
        })
      }
      return {
        id: item.id,
        platform: 'instagram',
        title: '',
        content: item.caption || '',
        medias,
        permalink: item.permalink || '',
        publishTime: new Date(item.timestamp).getTime(),
        viewCount: item.view_count || 0,
        commentCount: item.comments_count || 0,
        likeCount: item.like_count || 0,
        shareCount: 0,
        clickCount: 0,
        impressionCount: 0,
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

  async fetchPostComments(accountId: string, postId: string, pagination: KeysetPagination | OffsetPagination | null): Promise<FetchPostCommentsResponse> {
    const query: IGPostCommentsRequest = {
      fields: 'id,text,timestamp,from,replies',
    }
    if ((pagination as KeysetPagination)?.before) {
      query.before = (pagination as KeysetPagination).before || ''
    }
    if ((pagination as KeysetPagination)?.after) {
      query.after = (pagination as KeysetPagination).after || ''
    }
    const resp = await this.instagramService.fetchPostComments(accountId, postId, query)
    const comments: EngagementComment[] = []
    for (const item of resp?.data || []) {
      comments.push({
        id: item.id,
        message: item.text,
        author: {
          username: item.from?.username || 'Unknown',
          avatar: '', // Instagram API does not provide avatar in comments
        },
        createdAt: item.timestamp,
        hasReplies: (item.replies?.data.length || 0) > 0,
      })
    }
    const result: FetchPostCommentsResponse = {
      comments,
      cursor: {
        before: resp?.paging?.cursors?.before || '',
        after: resp?.paging?.cursors?.after || '',
      },
    }
    return result
  }

  async fetchCommentReplies(accountId: string, commentId: string, pagination: KeysetPagination | OffsetPagination | null): Promise<FetchPostCommentsResponse> {
    const query: IGPostCommentsRequest = {
      fields: 'id,text,timestamp,from',
    }
    if ((pagination as KeysetPagination)?.before) {
      query.before = (pagination as KeysetPagination).before || ''
    }
    if ((pagination as KeysetPagination)?.after) {
      query.after = (pagination as KeysetPagination).after || ''
    }
    const resp = await this.instagramService.fetchCommentReplies(accountId, commentId, query)
    const comments: EngagementComment[] = []
    for (const item of resp?.data || []) {
      comments.push({
        id: item.id,
        message: item.text,
        author: {
          username: item.from?.username || 'Unknown',
          avatar: '', // Instagram API does not provide avatar in comments
        },
        createdAt: item.timestamp,
        hasReplies: false,
      })
    }
    const result: FetchPostCommentsResponse = {
      comments,
      cursor: {
        before: resp?.paging?.cursors?.before || '',
        after: resp?.paging?.cursors?.after || '',
      },
    }
    return result
  }

  async commentOnPost(accountId: string, postId: string, message: string): Promise<PublishCommentResponse> {
    const result: PublishCommentResponse = {
      success: false,
      error: 'Failed to publish comment',
    }
    const resp = await this.instagramService.publishPlaintextComment(accountId, postId, message)
    if (resp?.id) {
      result.id = resp.id
      result.success = true
      result.error = ''
    }
    return result
  }

  async replyToComment(accountId: string, commentId: string, message: string): Promise<PublishCommentResponse> {
    const result: PublishCommentResponse = {
      success: false,
      error: 'Failed to publish comment',
    }
    const resp = await this.instagramService.publishPlaintextCommentReply(accountId, commentId, message)
    if (resp?.id) {
      result.id = resp.id
      result.success = true
      result.error = ''
    }
    return result
  }
}
