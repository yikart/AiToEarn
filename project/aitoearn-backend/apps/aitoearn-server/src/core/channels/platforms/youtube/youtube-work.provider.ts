import type { youtube_v3 } from 'googleapis'
import type { ChannelWorkDataResult, ChannelWorkListResult, WorkDetailInput, WorkLinkInfoInput, WorkListInput, WorkOwnershipInput, WorkProvider } from '../platforms.interface'
import { Injectable, Logger } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import { PlatformErrorCategory } from '../platforms.exception'
import { ChannelPaginationMode, PublishContentMode } from '../platforms.interface'
import { parsePlatformDate } from '../platforms.utils'
import { YouTubePlatformException } from './youtube.exception'
import { YoutubeSearchType } from './youtube.schema'
import { YoutubeService } from './youtube.service'

@Injectable()
export class YoutubeWorkProvider implements WorkProvider {
  private readonly logger = new Logger(YoutubeWorkProvider.name)
  readonly listWorksPagination = {
    mode: ChannelPaginationMode.Cursor,
    defaultLimit: 25,
    maxLimit: 50,
    supportsPrevious: false,
  } as const

  constructor(private readonly youtubeService: YoutubeService) {}

  async listWorks(input: WorkListInput): Promise<ChannelWorkListResult> {
    if (!input.credential.account) {
      throw YouTubePlatformException.validation({
        code: ResponseCode.ChannelPlatformResponseInvalid,
        category: PlatformErrorCategory.Validation,
        context: { endpoint: 'works.list.channel', accountId: input.accountId },
      })
    }
    const limit = input.pagination.limit ?? this.listWorksPagination.defaultLimit
    const response = await this.youtubeService.search(input.credential.accessToken, {
      channelId: input.credential.account,
      type: YoutubeSearchType.Video,
      maxResults: limit,
      pageToken: input.pagination.cursor,
    })

    return {
      items: (response.items ?? [])
        .map((item: youtube_v3.Schema$SearchResult) => ({
          platformWorkId: item.id?.videoId ?? '',
          contentMode: PublishContentMode.Video,
          title: item.snippet?.title ?? undefined,
          description: item.snippet?.description ?? undefined,
          coverUrl: item.snippet?.thumbnails?.high?.url ?? item.snippet?.thumbnails?.default?.url ?? undefined,
          publishedAt: parsePlatformDate(item.snippet?.publishedAt ?? undefined),
          authorName: item.snippet?.channelTitle ?? undefined,
          authorPlatformUid: item.snippet?.channelId ?? undefined,
        }))
        .filter((item): item is typeof item & { platformWorkId: string } => Boolean(item.platformWorkId)),
      pagination: {
        mode: ChannelPaginationMode.Cursor,
        nextCursor: response.nextPageToken ?? undefined,
        hasNext: Boolean(response.nextPageToken),
        hasPrevious: false,
        limit,
      },
    }
  }

  async getLinkInfo(input: WorkLinkInfoInput): Promise<ChannelWorkDataResult> {
    const platformWorkId = this.parseYoutubeVideoId(input.link)
    if (!platformWorkId) {
      throw new AppException(ResponseCode.InvalidWorkLink)
    }
    return {
      snapshots: [],
      work: {
        id: platformWorkId,
        url: `https://www.youtube.com/watch?v=${platformWorkId}`,
        mediaType: 'video',
      },
    }
  }

  async getDetail(input: WorkDetailInput): Promise<ChannelWorkDataResult> {
    const video = await this.youtubeService.getVideoDetails(
      input.credential.accessToken,
      input.platformWorkId,
    )
    const fetchedAt = new Date()
    const publishedAt = video.publishedAt ? new Date(video.publishedAt) : undefined
    const snapshot = {
      platformWorkId: input.platformWorkId,
      snapshotAt: publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : fetchedAt,
      fetchedAt,
      work: {
        id: input.platformWorkId,
        title: video.title,
        description: video.description,
        mediaType: 'video',
        publishedAt: publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : undefined,
      },
      metrics: {
        viewCount: Number(video.viewCount ?? 0),
        likeCount: Number(video.likeCount ?? 0),
        commentCount: Number(video.commentCount ?? 0),
      },
      rawResponse: video,
    }
    return {
      snapshots: [snapshot],
      work: snapshot.work,
      metrics: snapshot.metrics,
      rawResponse: video,
    }
  }

  async verifyOwnership(input: WorkOwnershipInput): Promise<boolean> {
    try {
      if (!input.credential.account) {
        return false
      }
      const video = await this.youtubeService.getVideoDetails(input.credential.accessToken, input.platformWorkId)
      return video.channelId === input.credential.account
    }
    catch (err) {
      this.logger.warn(err, `Failed to verify YouTube ownership for ${input.platformWorkId}`)
      return false
    }
  }

  private parseYoutubeVideoId(link: string): string | undefined {
    try {
      const url = new URL(link)
      const hostname = url.hostname.replace(/^www\./, '')
      if (hostname === 'youtu.be') {
        return url.pathname.split('/').filter(Boolean)[0]
      }
      if (hostname !== 'youtube.com' && hostname !== 'm.youtube.com') {
        return undefined
      }
      const parts = url.pathname.split('/').filter(Boolean)
      if (url.pathname === '/watch') {
        return url.searchParams.get('v') ?? undefined
      }
      if (['shorts', 'embed', 'live', 'v'].includes(parts[0])) {
        return parts[1]
      }
      return undefined
    }
    catch (err) {
      this.logger.warn(err, `Failed to parse YouTube link ${link}`)
      return undefined
    }
  }
}
