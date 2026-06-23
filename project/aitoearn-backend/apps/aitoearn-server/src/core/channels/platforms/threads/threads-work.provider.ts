import type { ChannelWorkDataResult, ChannelWorkListResult, WorkDetailInput, WorkLinkInfoInput, WorkListInput, WorkOwnershipInput, WorkProvider } from '../platforms.interface'
import { Injectable, Logger } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import { PlatformErrorCategory } from '../platforms.exception'
import { ChannelPaginationDirection, ChannelPaginationMode, PublishContentMode } from '../platforms.interface'
import { parsePlatformDate } from '../platforms.utils'
import { ThreadsPlatformException } from './threads.exception'
import { ThreadsPublishedMediaType } from './threads.interface'
import { ThreadsService } from './threads.service'

@Injectable()
export class ThreadsWorkProvider implements WorkProvider {
  private readonly logger = new Logger(ThreadsWorkProvider.name)
  readonly listWorksPagination = {
    mode: ChannelPaginationMode.Cursor,
    defaultLimit: 25,
    maxLimit: 100,
    supportsPrevious: true,
  } as const

  constructor(private readonly threadsService: ThreadsService) {}

  async listWorks(input: WorkListInput): Promise<ChannelWorkListResult> {
    const limit = input.pagination.limit ?? this.listWorksPagination.defaultLimit
    const platformUid = input.credential.platformUid
    if (!platformUid) {
      throw ThreadsPlatformException.validation({
        code: ResponseCode.ChannelPlatformAccountMissing,
        category: PlatformErrorCategory.Auth,
        context: {
          endpoint: 'listWorks',
          accountId: input.accountId,
        },
      })
    }

    const response = await this.threadsService.listWorks(
      platformUid,
      input.credential.accessToken,
      {
        ...(input.pagination.cursor && {
          [input.pagination.direction === ChannelPaginationDirection.Previous ? 'before' : 'after']: input.pagination.cursor,
        }),
        limit,
      },
    )

    return {
      items: (response.data ?? []).map(post => ({
        platformWorkId: post.id,
        contentMode: this.toContentMode(post.media_type),
        description: post.text,
        url: post.permalink,
        coverUrl: post.thumbnail_url,
        publishedAt: parsePlatformDate(post.timestamp),
        authorName: post.username,
        authorPlatformUid: post.owner?.id,
      })),
      pagination: {
        mode: ChannelPaginationMode.Cursor,
        nextCursor: response.paging?.cursors?.after,
        previousCursor: response.paging?.cursors?.before,
        hasNext: Boolean(response.paging?.next),
        hasPrevious: Boolean(response.paging?.previous),
        limit,
      },
    }
  }

  async getLinkInfo(input: WorkLinkInfoInput): Promise<ChannelWorkDataResult> {
    const parsed = this.parseThreadsPostLink(input.link)
    if (!parsed) {
      throw new AppException(ResponseCode.InvalidWorkLink)
    }
    return {
      snapshots: [],
      work: {
        id: parsed.postId,
        url: parsed.normalizedUrl,
      },
    }
  }

  async getDetail(input: WorkDetailInput): Promise<ChannelWorkDataResult> {
    const post = await this.threadsService.getPublishedPost(
      input.platformWorkId,
      input.credential.accessToken,
      'id,status,permalink,text,timestamp,username',
    )
    const fetchedAt = new Date()
    const timestamp = post.timestamp ? new Date(post.timestamp) : undefined
    const snapshot = {
      platformWorkId: input.platformWorkId,
      snapshotAt: timestamp && !Number.isNaN(timestamp.getTime()) ? timestamp : fetchedAt,
      fetchedAt,
      work: {
        id: post.id ?? input.platformWorkId,
        url: post.permalink,
        description: post.text,
        status: post.status,
        author: post.username,
        mediaType: 'thread',
        publishedAt: timestamp && !Number.isNaN(timestamp.getTime()) ? timestamp : undefined,
      },
      rawResponse: post,
    }
    return {
      snapshots: [snapshot],
      work: snapshot.work,
      rawResponse: post,
    }
  }

  async verifyOwnership(input: WorkOwnershipInput): Promise<boolean> {
    const platformUid = input.credential.platformUid
    if (!platformUid) {
      throw ThreadsPlatformException.validation({
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
      await this.threadsService.getPublishedPost(input.platformWorkId, input.credential.accessToken, 'id')
      return true
    }
    catch (err) {
      this.logger.warn(err, `Failed to verify Threads ownership for ${input.platformWorkId}`)
      return false
    }
  }

  private parseThreadsPostLink(link: string): { postId: string, normalizedUrl: string } | undefined {
    try {
      const url = new URL(link)
      const hostname = url.hostname.replace(/^www\./, '')
      if (hostname !== 'threads.net' && hostname !== 'threads.com') {
        return undefined
      }

      const postPathMatch = url.pathname.match(/^(\/@[^/]+\/post\/)([^/]+)(?:\/media)?\/?$/)
      if (postPathMatch) {
        return {
          postId: postPathMatch[2],
          normalizedUrl: `https://www.threads.com${postPathMatch[1]}${postPathMatch[2]}`,
        }
      }

      const shortPathMatch = url.pathname.match(/^\/t\/([^/]+)(?:\/media)?\/?$/)
      if (shortPathMatch) {
        return {
          postId: shortPathMatch[1],
          normalizedUrl: `https://www.threads.com/t/${shortPathMatch[1]}`,
        }
      }
      return undefined
    }
    catch (err) {
      this.logger.warn(err, `Failed to parse Threads link ${link}`)
      return undefined
    }
  }

  private toContentMode(mediaType?: ThreadsPublishedMediaType): PublishContentMode {
    const normalizedMediaType = mediaType?.toUpperCase()
    if (normalizedMediaType === ThreadsPublishedMediaType.Video) {
      return PublishContentMode.Video
    }
    if (!normalizedMediaType || normalizedMediaType === ThreadsPublishedMediaType.Text || normalizedMediaType === ThreadsPublishedMediaType.TextPost) {
      return PublishContentMode.Text
    }
    return PublishContentMode.ImageText
  }
}
