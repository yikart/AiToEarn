import type { ChannelWorkDataResult, ChannelWorkListResult, WorkDetailInput, WorkLinkInfoInput, WorkListInput, WorkOwnershipInput, WorkProvider } from '../platforms.interface'
import type { FacebookPost, FacebookPostAttachment } from './facebook.interface'
import { Injectable, Logger } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import axios from 'axios'
import { ChannelPaginationDirection, ChannelPaginationMode, PublishContentMode } from '../platforms.interface'
import { parsePlatformDate } from '../platforms.utils'
import { FacebookService } from './facebook.service'

@Injectable()
export class FacebookWorkProvider implements WorkProvider {
  private readonly logger = new Logger(FacebookWorkProvider.name)
  readonly listWorksPagination = {
    mode: ChannelPaginationMode.Cursor,
    defaultLimit: 25,
    maxLimit: 100,
    supportsPrevious: true,
  } as const

  constructor(private readonly facebookService: FacebookService) {}

  async listWorks(input: WorkListInput): Promise<ChannelWorkListResult> {
    const limit = input.pagination.limit ?? this.listWorksPagination.defaultLimit
    const response = await this.facebookService.listPagePosts(
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
      items: (response.data ?? []).map(post => ({
        platformWorkId: post.id,
        contentMode: this.toContentMode(post),
        description: post.message,
        url: post.permalink_url,
        coverUrl: post.full_picture,
        publishedAt: parsePlatformDate(post.created_time),
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

  private toContentMode(post: FacebookPost): PublishContentMode {
    if (this.hasVideoAttachment(post.attachments?.data) || this.isVideoType(post.type) || this.isVideoType(post.status_type)) {
      return PublishContentMode.Video
    }
    if (post.full_picture || this.hasImageAttachment(post.attachments?.data)) {
      return PublishContentMode.ImageText
    }
    return PublishContentMode.Text
  }

  private hasVideoAttachment(attachments?: FacebookPostAttachment[]): boolean {
    return attachments?.some(attachment =>
      this.isVideoType(attachment.media_type)
      || this.isVideoType(attachment.type)
      || this.hasVideoAttachment(attachment.subattachments?.data),
    ) ?? false
  }

  private hasImageAttachment(attachments?: FacebookPostAttachment[]): boolean {
    return attachments?.some(attachment =>
      this.isImageType(attachment.media_type)
      || this.isImageType(attachment.type)
      || this.hasImageAttachment(attachment.subattachments?.data),
    ) ?? false
  }

  private isVideoType(type?: string): boolean {
    return !!type && type.toLowerCase().includes('video')
  }

  private isImageType(type?: string): boolean {
    const normalized = type?.toLowerCase()
    return normalized === 'photo' || normalized === 'image'
  }

  async getLinkInfo(input: WorkLinkInfoInput): Promise<ChannelWorkDataResult> {
    const resolvedUrl = await this.normalizeLink(input.link)
    const platformWorkId = this.parseFacebookWorkId(resolvedUrl)
    if (!platformWorkId) {
      throw new AppException(ResponseCode.InvalidWorkLink)
    }
    return {
      snapshots: [],
      work: {
        id: platformWorkId,
        url: resolvedUrl,
      },
    }
  }

  async getDetail(input: WorkDetailInput): Promise<ChannelWorkDataResult> {
    const post = await this.facebookService.getPostInfo(
      input.credential.accessToken,
      input.platformWorkId,
    )
    const fetchedAt = new Date()
    const createdAt = post.createdTime ? new Date(post.createdTime) : undefined
    const snapshot = {
      platformWorkId: input.platformWorkId,
      snapshotAt: createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt : fetchedAt,
      fetchedAt,
      work: {
        id: post.id,
        url: post.permalinkUrl,
        description: post.message,
        publishedAt: createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt : undefined,
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
    try {
      await this.facebookService.getPostInfo(input.credential.accessToken, input.platformWorkId)
      return true
    }
    catch (err) {
      this.logger.warn(err, `Failed to verify Facebook ownership for ${input.platformWorkId}`)
      return false
    }
  }

  private parseFacebookWorkId(link: string): string | undefined {
    try {
      const url = new URL(link)
      const hostname = url.hostname.replace(/^www\./, '')
      if (hostname !== 'facebook.com' && hostname !== 'm.facebook.com') {
        return undefined
      }
      const watchId = url.searchParams.get('v')
      if (url.pathname.startsWith('/watch') && watchId) {
        return watchId
      }
      const pathParts = url.pathname.split('/').filter(Boolean)
      const compoundId = pathParts.find(part => /^\d+_\d+$/.test(part))
      if (compoundId) {
        return compoundId
      }
      const markerIndex = pathParts.findIndex(part => ['reel', 'videos', 'posts'].includes(part))
      return markerIndex >= 0 ? pathParts[markerIndex + 1] : undefined
    }
    catch (err) {
      this.logger.warn(err, `Failed to parse Facebook link ${link}`)
      return undefined
    }
  }

  private async normalizeLink(link: string): Promise<string> {
    try {
      const url = new URL(link)
      if (url.hostname.replace(/^www\./, '') === 'fb.watch') {
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
      this.logger.warn(err, `Failed to resolve Facebook short link: ${link}`)
      throw new AppException(ResponseCode.InvalidWorkLink)
    }
  }
}
