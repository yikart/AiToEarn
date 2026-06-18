import type { ChannelWorkDataResult, ChannelWorkListResult, WorkDetailInput, WorkLinkInfoInput, WorkListInput, WorkOwnershipInput, WorkProvider } from '../platforms.interface'
import type { TwitterPostData, TwitterPostMedia, TwitterPostMetrics } from './twitter.interface'
import { Injectable, Logger } from '@nestjs/common'
import { ResponseCode } from '@yikart/common'
import { PlatformErrorCategory } from '../platforms.exception'
import { ChannelPaginationMode, PublishContentMode } from '../platforms.interface'
import { parsePlatformDate } from '../platforms.utils'
import { TwitterPostMediaType } from './twitter.enum'
import { TwitterPlatformException } from './twitter.exception'
import { TwitterService } from './twitter.service'

@Injectable()
export class TwitterWorkProvider implements WorkProvider {
  private readonly logger = new Logger(TwitterWorkProvider.name)
  readonly listWorksPagination = {
    mode: ChannelPaginationMode.Cursor,
    defaultLimit: 10,
    maxLimit: 100,
    supportsPrevious: false,
  } as const

  constructor(private readonly twitterService: TwitterService) {}

  async listWorks(input: WorkListInput): Promise<ChannelWorkListResult> {
    const limit = input.pagination.limit ?? this.listWorksPagination.defaultLimit
    const platformUid = input.credential.platformUid
    if (!platformUid) {
      throw TwitterPlatformException.validation({
        code: ResponseCode.ChannelPlatformAccountMissing,
        category: PlatformErrorCategory.Auth,
        context: {
          endpoint: 'listWorks',
          accountId: input.accountId,
        },
      })
    }

    const response = await this.twitterService.listWorks(
      input.credential.accessToken,
      input.accountId,
      platformUid,
      {
        paginationToken: input.pagination.cursor,
        maxResults: limit,
      },
    )
    const nextCursor = response.meta?.nextToken ?? response.meta?.next_token
    const mediaByKey = this.mapMediaByKey(response.includes?.media)

    return {
      items: (response.data ?? []).map(post => ({
        platformWorkId: post.id ?? '',
        contentMode: this.toContentMode(post, mediaByKey),
        description: post.text,
        url: post.id ? this.buildCanonicalWorkLink(post.id) : undefined,
        publishedAt: parsePlatformDate(post.created_at ?? post.createdAt),
        authorPlatformUid: post.author_id ?? post.authorId,
        metrics: this.mapMetrics(post.public_metrics ?? post.publicMetrics),
      })).filter(item => item.platformWorkId),
      pagination: {
        mode: ChannelPaginationMode.Cursor,
        nextCursor,
        hasNext: Boolean(nextCursor),
        hasPrevious: false,
        limit,
      },
    }
  }

  async getLinkInfo(input: WorkLinkInfoInput): Promise<ChannelWorkDataResult> {
    const info = await this.twitterService.getLinkInfo(input.link)
    return {
      snapshots: [],
      work: {
        id: info.platformWorkId,
        url: info.resolvedUrl,
        mediaType: 'tweet',
      },
    }
  }

  async getDetail(input: WorkDetailInput): Promise<ChannelWorkDataResult> {
    const response = await this.twitterService.getPostDetail(
      input.credential.accessToken,
      input.accountId,
      input.platformWorkId,
    )
    const post = response.data
    const metrics = post?.public_metrics ?? post?.publicMetrics
    const fetchedAt = new Date()
    const createdAtValue = post?.created_at ?? post?.createdAt
    const createdAt = createdAtValue ? new Date(createdAtValue) : undefined
    const snapshot = {
      platformWorkId: input.platformWorkId,
      snapshotAt: createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt : fetchedAt,
      fetchedAt,
      work: {
        id: post?.id ?? input.platformWorkId,
        description: post?.text,
        url: this.buildCanonicalWorkLink(post?.id ?? input.platformWorkId),
        mediaType: 'tweet',
        publishedAt: createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt : undefined,
      },
      metrics: {
        likeCount: Number(metrics?.like_count ?? metrics?.likeCount ?? 0),
        commentCount: Number(metrics?.reply_count ?? metrics?.replyCount ?? 0),
        shareCount: Number(metrics?.retweet_count ?? metrics?.retweetCount ?? 0),
        saveCount: Number(metrics?.bookmark_count ?? metrics?.bookmarkCount ?? 0),
        impressionCount: Number(metrics?.impression_count ?? metrics?.impressionCount ?? 0),
      },
      extra: {
        quoteCount: Number(metrics?.quote_count ?? metrics?.quoteCount ?? 0),
      },
      rawResponse: response,
    }
    return {
      snapshots: [snapshot],
      work: snapshot.work,
      metrics: snapshot.metrics,
      extra: snapshot.extra,
      rawResponse: response,
    }
  }

  private mapMediaByKey(media?: TwitterPostMedia[]): Map<string, TwitterPostMedia> {
    return new Map((media ?? [])
      .map(item => [item.media_key ?? item.mediaKey, item] as const)
      .filter((entry): entry is [string, TwitterPostMedia] => !!entry[0]))
  }

  private buildCanonicalWorkLink(postId: string): string {
    return `https://x.com/i/web/status/${postId}`
  }

  private toContentMode(post: TwitterPostData, mediaByKey: Map<string, TwitterPostMedia>): PublishContentMode {
    const mediaKeys = post.attachments?.media_keys ?? post.attachments?.mediaKeys ?? []
    const mediaTypes = mediaKeys
      .map(key => this.toPostMediaType(mediaByKey.get(key)?.type))
      .filter((type): type is TwitterPostMediaType => type !== undefined)
    if (mediaTypes.some(type => type === TwitterPostMediaType.Video || type === TwitterPostMediaType.AnimatedGif)) {
      return PublishContentMode.Video
    }
    if (mediaTypes.includes(TwitterPostMediaType.Photo)) {
      return PublishContentMode.ImageText
    }
    return PublishContentMode.Text
  }

  private toPostMediaType(mediaType: TwitterPostMediaType | string | undefined): TwitterPostMediaType | undefined {
    if (mediaType === TwitterPostMediaType.Photo)
      return TwitterPostMediaType.Photo
    if (mediaType === TwitterPostMediaType.Video)
      return TwitterPostMediaType.Video
    if (mediaType === TwitterPostMediaType.AnimatedGif)
      return TwitterPostMediaType.AnimatedGif
    return undefined
  }

  private mapMetrics(metrics: TwitterPostMetrics | undefined) {
    if (!metrics) {
      return undefined
    }
    return {
      likeCount: Number(metrics.like_count ?? metrics.likeCount ?? 0),
      commentCount: Number(metrics.reply_count ?? metrics.replyCount ?? 0),
      shareCount: Number(metrics.retweet_count ?? metrics.retweetCount ?? 0),
      saveCount: Number(metrics.bookmark_count ?? metrics.bookmarkCount ?? 0),
      impressionCount: Number(metrics.impression_count ?? metrics.impressionCount ?? 0),
    }
  }

  async verifyOwnership(input: WorkOwnershipInput): Promise<boolean> {
    const platformUid = input.credential.platformUid
    if (!platformUid) {
      throw TwitterPlatformException.validation({
        code: ResponseCode.ChannelPlatformAccountMissing,
        category: PlatformErrorCategory.Auth,
        context: {
          endpoint: 'verifyOwnership',
          accountId: input.accountId,
          platformWorkId: input.platformWorkId,
        },
      })
    }

    try {
      return await this.twitterService.verifyOwnership(
        input.credential.accessToken,
        input.accountId,
        platformUid,
        input.platformWorkId,
      )
    }
    catch (error) {
      this.logger.warn(error, `Failed to verify Twitter work ownership, accountId=${input.accountId}, platformWorkId=${input.platformWorkId}`)
      return false
    }
  }
}
