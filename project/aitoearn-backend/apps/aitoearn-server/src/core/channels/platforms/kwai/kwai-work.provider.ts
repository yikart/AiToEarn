import type { ChannelWorkDataResult, ChannelWorkListItem, ChannelWorkListResult, WorkDetailInput, WorkLinkInfoInput, WorkListInput, WorkOwnershipInput, WorkProvider } from '../platforms.interface'
import type { KwaiPhotoInfo } from './kwai.interface'
import { Injectable, Logger } from '@nestjs/common'
import { PublishType } from '@yikart/aitoearn-server-shared'
import { AccountType, AppException, ResponseCode } from '@yikart/common'
import axios from 'axios'
import { ChannelPaginationMode, PublishContentMode } from '../platforms.interface'
import { KwaiService } from './kwai.service'

@Injectable()
export class KwaiWorkProvider implements WorkProvider {
  readonly requiresCredentialForLinkInfo = false
  private readonly logger = new Logger(KwaiWorkProvider.name)
  readonly listWorksPagination = {
    mode: ChannelPaginationMode.Cursor,
    defaultLimit: 20,
    maxLimit: 200,
    supportsPrevious: false,
  } as const

  constructor(private readonly kwaiService: KwaiService) {}

  async listWorks(input: WorkListInput): Promise<ChannelWorkListResult> {
    const limit = input.pagination.limit ?? this.listWorksPagination.defaultLimit
    const response = await this.kwaiService.listPhotoPage(
      input.credential.accessToken,
      input.pagination.cursor,
      limit,
    )
    const nextCursor = response.items.reduce<KwaiPhotoInfo | undefined>((current, item) => {
      if (!item.photo_id || item.create_time === undefined) {
        return current
      }
      return !current
        || current.create_time === undefined
        || this.toTimestampMillis(item.create_time) < this.toTimestampMillis(current.create_time)
        ? item
        : current
    }, undefined)?.photo_id

    return {
      items: response.items.map(photo => this.toListItem(photo)).filter(item => item.platformWorkId),
      pagination: {
        mode: ChannelPaginationMode.Cursor,
        nextCursor,
        hasNext: response.items.length >= limit,
        hasPrevious: false,
        limit,
      },
    }
  }

  async getLinkInfo(input: WorkLinkInfoInput): Promise<ChannelWorkDataResult> {
    const resolvedUrl = await this.normalizeLink(input.link)
    const photoId = this.parsePhotoId(resolvedUrl)
    if (!photoId) {
      throw new AppException(ResponseCode.InvalidWorkLink)
    }

    const url = this.buildWorkLink(photoId)
    return {
      snapshots: [],
      work: {
        id: photoId,
        url,
        mediaType: PublishType.VIDEO,
      },
      extra: {
        dataId: photoId,
        uniqueId: `${AccountType.Kwai}_${photoId}`,
        type: PublishType.VIDEO,
        videoType: 'short',
        resolvedUrl,
      },
      rawResponse: { resolvedUrl },
    }
  }

  async getDetail(input: WorkDetailInput): Promise<ChannelWorkDataResult> {
    const video = await this.kwaiService.getVideoInfo(
      input.credential.accessToken,
      input.platformWorkId,
    )
    const fetchedAt = new Date()
    const publishedAt = this.parseCreateTime(video.createTime)
    const snapshot = {
      platformWorkId: input.platformWorkId,
      snapshotAt: publishedAt ?? fetchedAt,
      fetchedAt,
      work: {
        id: video.photoId || input.platformWorkId,
        title: video.caption,
        description: video.caption,
        url: this.buildWorkLink(video.photoId || input.platformWorkId),
        mediaType: PublishContentMode.Video,
        coverUrl: video.cover,
        publishedAt,
        status: video.pending ? 'pending' : 'published',
      },
      metrics: {
        viewCount: video.viewCount,
        likeCount: video.likeCount,
        commentCount: video.commentCount,
      },
      extra: {
        pending: video.pending,
      },
      rawResponse: video,
    }

    return {
      snapshots: [snapshot],
      work: snapshot.work,
      metrics: snapshot.metrics,
      extra: snapshot.extra,
      rawResponse: video,
    }
  }

  async verifyOwnership(input: WorkOwnershipInput): Promise<boolean> {
    try {
      await this.kwaiService.getVideoInfo(
        input.credential.accessToken,
        input.platformWorkId,
      )
      return true
    }
    catch (err) {
      this.logger.warn(err, `Failed to verify Kwai ownership for ${input.platformWorkId}`)
      return false
    }
  }

  private async normalizeLink(link: string): Promise<string> {
    try {
      const url = new URL(link)
      const hostname = url.hostname.replace(/^www\./, '')
      if (hostname === 'v.kuaishou.com' || (hostname === 'kuaishou.com' && url.pathname.startsWith('/f/'))) {
        return await this.resolveRedirectUrl(link)
      }
    }
    catch {
      return link
    }
    return link
  }

  private parsePhotoId(link: string): string | undefined {
    let url: URL
    try {
      url = new URL(link)
    }
    catch {
      return undefined
    }

    const hostname = url.hostname.replace(/^www\./, '')
    const pathname = url.pathname
    if (hostname === 'kuaishou.com') {
      if (pathname.startsWith('/short-video/')) {
        return pathname.split('/short-video/')[1]?.split(/[?&#/]/)[0] || undefined
      }
      if (pathname.startsWith('/video/')) {
        return pathname.split('/video/')[1]?.split(/[?&#/]/)[0] || undefined
      }
    }
    if (hostname === 'c.kuaishou.com') {
      return pathname.match(/\/photo\/([^/?&#]+)/)?.[1]
    }
    return undefined
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
      this.logger.warn(err, `Failed to resolve Kwai short link: ${link}`)
      throw new AppException(ResponseCode.InvalidWorkLink)
    }
  }

  private buildWorkLink(photoId: string): string {
    return `https://www.kuaishou.com/short-video/${photoId}`
  }

  private toListItem(photo: KwaiPhotoInfo): ChannelWorkListItem {
    const photoId = photo.photo_id ?? ''
    return {
      platformWorkId: photoId,
      contentMode: PublishContentMode.Video,
      title: photo.caption,
      description: photo.caption,
      url: photoId ? this.buildWorkLink(photoId) : undefined,
      coverUrl: photo.cover,
      publishedAt: this.parseCreateTime(photo.create_time),
      status: photo.pending === undefined ? undefined : photo.pending ? 'pending' : 'published',
      metrics: {
        viewCount: photo.view_count,
        likeCount: photo.like_count,
        commentCount: photo.comment_count,
      },
    }
  }

  private parseCreateTime(createTime?: number): Date | undefined {
    if (createTime === undefined) {
      return undefined
    }
    return new Date(this.toTimestampMillis(createTime))
  }

  private toTimestampMillis(createTime: number): number {
    return createTime < 1000000000000 ? createTime * 1000 : createTime
  }
}
