import { Injectable } from '@nestjs/common'
import { PostsResponseVo, PostVo } from '@yikart/common'
import { ThreadsService } from '../../../core/platforms/meta/threads.service'
import { ThreadsObjectCommentsRequest, ThreadsPostsRequest } from '../../../libs/threads/threads.interfaces'
import { KeysetPagination, OffsetPagination } from '../engagement.dto'
import { EngagementComment, EngagementProvider, FetchPostCommentsResponse, PublishCommentResponse } from '../engagement.interface'

@Injectable()
export class ThreadsEngagementProvider implements EngagementProvider {
  constructor(
    private readonly threadsService: ThreadsService,
  ) { }

  async fetchUserPosts(accountId: string, pagination: KeysetPagination | OffsetPagination | null): Promise<PostsResponseVo> {
    const req: ThreadsPostsRequest = {
      fields: 'id,children.media_url,media_product_type,media_type,media_url,permalink,text,timestamp,thumbnail_url,insights.metric(likes,views,replies,reposts,quotes,shares)',
      limit: (pagination as KeysetPagination)?.limit || 50,
      before: (pagination as KeysetPagination)?.before,
      after: (pagination as KeysetPagination)?.after,
    }
    const resp = await this.threadsService.getUserPosts(accountId, req)
    if (!resp) {
      return {
        posts: [],
        cursor: {
          before: '',
          after: '',
        },
      }
    }
    const posts = resp.data.map((item) => {
      const medias = []
      if (item.media_type === 'CAROUSEL_ALBUM' && item.children?.data) {
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
        platform: 'threads',
        title: '',
        content: item.text || '',
        medias,
        permalink: item.permalink || '',
        publishTime: new Date(item.timestamp).getTime(),
        viewCount: item.insights?.data?.find(d => d.name === 'views')?.values[0]?.value || 0,
        commentCount: item.insights?.data?.find(d => d.name === 'replies')?.values[0]?.value || 0,
        likeCount: item.insights?.data?.find(d => d.name === 'likes')?.values[0]?.value || 0,
        shareCount: item.insights?.data?.find(d => d.name === 'reposts')?.values[0]?.value || 0,
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

  async getMetaPostDetail(accountId: string, postId: string): Promise<PostVo> {
    const query = {
      fields: 'id,text,children.media_url,media_product_type,media_type,media_url,permalink,text,timestamp,thumbnail_url,insights.metric(likes,views,replies,reposts,quotes,shares)',
    }
    const postDetail = await this.threadsService.getPostDetail(accountId, postId, query)
    const medias = []
    if (postDetail.media_type === 'CAROUSEL_ALBUM' && postDetail.children?.data) {
      for (const child of postDetail.children.data) {
        medias.push({
          url: child.media_url,
          type: child.media_type === 'VIDEO' ? 'video' : 'image',
        })
      }
    }
    else {
      medias.push({
        url: postDetail.media_url,
        type: postDetail.media_type === 'VIDEO' ? 'video' : 'image',
        thumbnail: postDetail.thumbnail_url || '',
      })
    }
    return {
      id: postDetail.id,
      platform: 'threads',
      title: '',
      content: postDetail.text || '',
      medias,
      permalink: postDetail.permalink || '',
      publishTime: new Date(postDetail.timestamp).getTime(),
      viewCount: postDetail.insights?.data?.find(d => d.name === 'views')?.values[0]?.value || 0,
      commentCount: postDetail.insights?.data?.find(d => d.name === 'replies')?.values[0]?.value || 0,
      likeCount: postDetail.insights?.data?.find(d => d.name === 'likes')?.values[0]?.value || 0,
      shareCount: postDetail.insights?.data?.find(d => d.name === 'reposts')?.values[0]?.value || 0,
      clickCount: 0,
      impressionCount: 0,
      favoriteCount: 0,
    }
  }

  private async fetchThreadsComments(accountId: string, targetId: string, pagination: KeysetPagination | OffsetPagination | null): Promise<FetchPostCommentsResponse> {
    const query: ThreadsObjectCommentsRequest = {
      fields: 'id,text,timestamp,has_replies,username',
      reverse: true,
    }
    if ((pagination as KeysetPagination)?.before) {
      query.before = (pagination as KeysetPagination).before || ''
    }
    if ((pagination as KeysetPagination)?.after) {
      query.after = (pagination as KeysetPagination).after || ''
    }
    const resp = await this.threadsService.fetchObjectComments(accountId, targetId, query)
    const comments: EngagementComment[] = []
    for (const item of resp?.data || []) {
      comments.push({
        id: item.id,
        message: item.text,
        author: {
          username: item.username || 'Unknown',
          avatar: '', // Threads API does not provide avatar in comments
        },
        createdAt: item.timestamp,
        hasReplies: item.has_replies || false,
      })
    }
    const result = {
      comments,
      cursor: {
        before: resp?.paging?.cursors?.before || '',
        after: resp?.paging?.cursors?.after || '',
      },
    }
    return result
  }

  private async publishThreadsComment(accountId: string, targetId: string, message: string): Promise<PublishCommentResponse> {
    const resp = await this.threadsService.publishPlaintextComment(accountId, targetId, message)
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
    return this.fetchThreadsComments(accountId, postId, pagination)
  }

  async fetchCommentReplies(accountId: string, commentId: string, pagination: KeysetPagination | OffsetPagination | null): Promise<FetchPostCommentsResponse> {
    return this.fetchThreadsComments(accountId, commentId, pagination)
  }

  async commentOnPost(accountId: string, postId: string, message: string): Promise<PublishCommentResponse> {
    return this.publishThreadsComment(accountId, postId, message)
  }

  async replyToComment(accountId: string, commentId: string, message: string): Promise<PublishCommentResponse> {
    return this.publishThreadsComment(accountId, commentId, message)
  }
}
