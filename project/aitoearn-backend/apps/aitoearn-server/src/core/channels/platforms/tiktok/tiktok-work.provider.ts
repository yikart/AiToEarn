import type { ChannelWorkDataResult, ChannelWorkListResult, WorkDetailInput, WorkLinkInfoInput, WorkListInput, WorkOwnershipInput, WorkProvider } from '../platforms.interface'
import { Injectable, Logger } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import axios from 'axios'
import { ChannelPaginationMode, PublishContentMode } from '../platforms.interface'
import { TikTokService } from './tiktok.service'

@Injectable()
export class TikTokWorkProvider implements WorkProvider {
  private readonly logger = new Logger(TikTokWorkProvider.name)
  readonly listWorksPagination = {
    mode: ChannelPaginationMode.Cursor,
    defaultLimit: 20,
    maxLimit: 20,
    supportsPrevious: false,
  } as const

  constructor(private readonly tikTokService: TikTokService) {}

  async listWorks(input: WorkListInput): Promise<ChannelWorkListResult> {
    const limit = input.pagination.limit ?? this.listWorksPagination.defaultLimit
    const response = await this.tikTokService.listVideos(
      input.credential.accessToken,
      input.pagination.cursor,
      limit,
      'id,create_time,title,video_description,cover_image_url,share_url,view_count,like_count,comment_count,share_count',
    )

    return {
      items: (response.videos ?? []).map(video => ({
        platformWorkId: video.id,
        contentMode: PublishContentMode.Video,
        title: video.title,
        description: video.video_description,
        url: video.share_url,
        coverUrl: video.cover_image_url,
        publishedAt: this.parseTimestamp(video.create_time),
        metrics: {
          viewCount: video.view_count,
          likeCount: video.like_count,
          commentCount: video.comment_count,
          shareCount: video.share_count,
        },
      })),
      pagination: {
        mode: ChannelPaginationMode.Cursor,
        nextCursor: response.cursor === undefined ? undefined : String(response.cursor),
        hasNext: Boolean(response.has_more),
        hasPrevious: false,
        limit,
      },
    }
  }

  async getLinkInfo(input: WorkLinkInfoInput): Promise<ChannelWorkDataResult> {
    const resolvedUrl = await this.normalizeLink(input.link)
    const platformWorkId = this.parseTikTokVideoId(resolvedUrl)
    if (!platformWorkId) {
      throw new AppException(ResponseCode.InvalidWorkLink)
    }
    const contentPath = resolvedUrl.includes('/photo/') ? 'photo' : 'video'
    return {
      snapshots: [],
      work: {
        id: platformWorkId,
        url: this.buildCanonicalWorkLink(resolvedUrl, contentPath, platformWorkId),
        mediaType: contentPath,
      },
      extra: {
        resolvedUrl,
      },
    }
  }

  async getDetail(input: WorkDetailInput): Promise<ChannelWorkDataResult> {
    const response = await this.tikTokService.queryVideos(
      input.credential.accessToken,
      [input.platformWorkId],
    )
    const video = response.videos?.[0]
    const fetchedAt = new Date()
    const publishedAt = video?.create_time === undefined ? undefined : new Date(Number(video.create_time) * 1000)
    const snapshot = {
      platformWorkId: input.platformWorkId,
      snapshotAt: publishedAt ?? fetchedAt,
      fetchedAt,
      work: {
        id: video?.id ?? input.platformWorkId,
        title: video?.title,
        description: video?.video_description,
        url: video?.share_url,
        coverUrl: video?.cover_image_url,
        mediaType: 'video',
        publishedAt,
      },
      metrics: {
        viewCount: Number(video?.view_count ?? 0),
        likeCount: Number(video?.like_count ?? 0),
        commentCount: Number(video?.comment_count ?? 0),
        shareCount: Number(video?.share_count ?? 0),
      },
      rawResponse: response,
    }
    return {
      snapshots: [snapshot],
      work: snapshot.work,
      metrics: snapshot.metrics,
      rawResponse: response,
    }
  }

  async verifyOwnership(input: WorkOwnershipInput): Promise<boolean> {
    try {
      await this.tikTokService.queryVideos(input.credential.accessToken, [input.platformWorkId])
      return true
    }
    catch (err) {
      this.logger.warn(err, `Failed to verify TikTok ownership for ${input.platformWorkId}`)
      return false
    }
  }

  private parseTikTokVideoId(link: string): string | undefined {
    try {
      const url = new URL(link)
      const hostname = url.hostname.replace(/^www\./, '')
      if (hostname !== 'tiktok.com') {
        return undefined
      }
      const parts = url.pathname.split('/').filter(Boolean)
      const workIndex = parts.findIndex(part => part === 'video' || part === 'photo')
      return workIndex >= 0 ? parts[workIndex + 1] : undefined
    }
    catch (err) {
      this.logger.warn(err, `Failed to parse TikTok link ${link}`)
      return undefined
    }
  }

  private async normalizeLink(link: string): Promise<string> {
    try {
      const url = new URL(link)
      const hostname = url.hostname.replace(/^www\./, '')
      if (hostname === 'vm.tiktok.com' || hostname === 'vt.tiktok.com') {
        return await this.resolveRedirectUrl(link)
      }
    }
    catch {
      return link
    }
    return link
  }

  private async resolveRedirectUrl(link: string): Promise<string> {
    try {
      const response = await axios.get(link, {
        maxRedirects: 5,
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      })
      return response.request?.res?.responseUrl || response.config?.url || link
    }
    catch (err) {
      this.logger.warn(err, `Failed to resolve TikTok short link: ${link}`)
      throw new AppException(ResponseCode.InvalidWorkLink)
    }
  }

  private buildCanonicalWorkLink(link: string, contentPath: 'video' | 'photo', platformWorkId: string): string {
    const url = new URL(link)
    const username = url.pathname.split('/').filter(Boolean).find(part => part.startsWith('@'))
    return username
      ? `https://www.tiktok.com/${username}/${contentPath}/${platformWorkId}`
      : `https://www.tiktok.com/${contentPath}/${platformWorkId}`
  }

  private parseTimestamp(value?: number): Date | undefined {
    if (value === undefined) {
      return undefined
    }
    return new Date(Number(value) * 1000)
  }
}
