import type { ChannelWorkDataResult, ChannelWorkListResult, WorkDetailInput, WorkLinkInfoInput, WorkListInput, WorkOwnershipInput, WorkProvider } from '../platforms.interface'
import { Injectable, Logger } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import { ChannelPaginationDirection, ChannelPaginationMode, PublishContentMode } from '../platforms.interface'
import { parsePlatformDate } from '../platforms.utils'
import { InstagramMediaType } from './instagram.schema'
import { InstagramService } from './instagram.service'

@Injectable()
export class InstagramWorkProvider implements WorkProvider {
  private readonly logger = new Logger(InstagramWorkProvider.name)
  readonly listWorksPagination = {
    mode: ChannelPaginationMode.Cursor,
    defaultLimit: 25,
    maxLimit: 100,
    supportsPrevious: true,
  } as const

  constructor(private readonly instagramService: InstagramService) {}

  async listWorks(input: WorkListInput): Promise<ChannelWorkListResult> {
    const limit = input.pagination.limit ?? this.listWorksPagination.defaultLimit
    const response = await this.instagramService.listWorks(
      input.credential.accessToken,
      input.credential.platformUid ?? input.accountId,
      {
        ...(input.pagination.cursor && {
          [input.pagination.direction === ChannelPaginationDirection.Previous ? 'before' : 'after']: input.pagination.cursor,
        }),
        limit,
      },
    )

    return {
      items: (response.data ?? []).map(media => ({
        platformWorkId: media.id,
        contentMode: media.media_type === 'VIDEO' || media.media_type === InstagramMediaType.Reels
          ? PublishContentMode.Video
          : PublishContentMode.ImageText,
        description: media.caption,
        url: media.permalink,
        coverUrl: media.media_type === InstagramMediaType.Image ? media.media_url : undefined,
        publishedAt: parsePlatformDate(media.timestamp),
        metrics: {
          likeCount: media.like_count,
          commentCount: media.comments_count,
        },
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
    const shortcode = this.parseInstagramShortCode(input.link)
    if (!shortcode || !input.dataId) {
      throw new AppException(ResponseCode.InvalidWorkLink)
    }
    return {
      snapshots: [],
      work: {
        id: input.dataId,
        url: input.link,
      },
      extra: {
        shortcode,
        dataId: input.dataId,
        resolvedUrl: input.link,
      },
    }
  }

  async getDetail(input: WorkDetailInput): Promise<ChannelWorkDataResult> {
    const media = await this.instagramService.getMediaInfo(
      input.credential.accessToken,
      input.platformWorkId,
    )
    const fetchedAt = new Date()
    const publishedAt = media.timestamp ? new Date(media.timestamp) : undefined
    const snapshot = {
      platformWorkId: input.platformWorkId,
      snapshotAt: publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : fetchedAt,
      fetchedAt,
      work: {
        id: media.id,
        url: media.permalink,
        mediaType: media.mediaType,
        publishedAt: publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : undefined,
      },
      rawResponse: media,
    }
    return {
      snapshots: [snapshot],
      work: snapshot.work,
      rawResponse: media,
    }
  }

  async verifyOwnership(input: WorkOwnershipInput): Promise<boolean> {
    try {
      await this.instagramService.getMediaInfo(input.credential.accessToken, input.platformWorkId)
      return true
    }
    catch (err) {
      this.logger.warn(err, `Failed to verify Instagram ownership for ${input.platformWorkId}`)
      return false
    }
  }

  private parseInstagramShortCode(link: string): string | undefined {
    try {
      const url = new URL(link)
      const hostname = url.hostname.replace(/^www\./, '')
      if (hostname !== 'instagram.com') {
        return undefined
      }
      const parts = url.pathname.split('/').filter(Boolean)
      const markerIndex = parts.findIndex(part => ['p', 'reel', 'reels', 'tv'].includes(part))
      return markerIndex >= 0 ? parts[markerIndex + 1] : undefined
    }
    catch (err) {
      this.logger.warn(err, `Failed to parse Instagram link ${link}`)
      return undefined
    }
  }
}
