import type { ChannelWorkDataResult, ChannelWorkListResult, WorkDetailInput, WorkLinkInfoInput, WorkListInput, WorkOwnershipInput, WorkProvider } from '../platforms.interface'
import { Injectable, Logger } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import axios from 'axios'
import { ChannelPaginationMode, PublishContentMode } from '../platforms.interface'
import { parsePlatformDate } from '../platforms.utils'
import { buildPinterestPinWorkLink } from './pinterest.interface'
import { PinterestService } from './pinterest.service'

@Injectable()
export class PinterestWorkProvider implements WorkProvider {
  readonly requiresCredentialForLinkInfo = false
  private readonly logger = new Logger(PinterestWorkProvider.name)
  readonly listWorksPagination = {
    mode: ChannelPaginationMode.Cursor,
    defaultLimit: 25,
    maxLimit: 100,
    supportsPrevious: false,
  } as const

  constructor(private readonly pinterestService: PinterestService) {}

  async listWorks(input: WorkListInput): Promise<ChannelWorkListResult> {
    const limit = input.pagination.limit ?? this.listWorksPagination.defaultLimit
    const response = await this.pinterestService.listPins(input.credential.accessToken, {
      bookmark: input.pagination.cursor,
      pageSize: limit,
    })

    return {
      items: (response.list ?? []).map(pin => ({
        platformWorkId: pin.id,
        contentMode: pin.media?.media_type?.toLowerCase().includes('video')
          ? PublishContentMode.Video
          : PublishContentMode.ImageText,
        title: pin.title,
        description: pin.description,
        url: buildPinterestPinWorkLink(pin.id),
        coverUrl: pin.media?.images?.['1200x']?.url,
        publishedAt: parsePlatformDate(pin.created_at),
      })),
      pagination: {
        mode: ChannelPaginationMode.Cursor,
        nextCursor: response.bookmark,
        hasNext: Boolean(response.bookmark),
        hasPrevious: false,
        limit,
      },
    }
  }

  async getLinkInfo(input: WorkLinkInfoInput): Promise<ChannelWorkDataResult> {
    const resolvedUrl = await this.normalizeLink(input.link)
    const pinId = this.parsePinterestPinId(resolvedUrl)
    if (!pinId) {
      throw new AppException(ResponseCode.InvalidWorkLink)
    }
    const url = buildPinterestPinWorkLink(pinId)
    return {
      snapshots: [],
      work: {
        id: pinId,
        url,
      },
      extra: {
        dataId: pinId,
        uniqueId: `${input.platform}_${pinId}`,
        resolvedUrl,
      },
      rawResponse: { resolvedUrl },
    }
  }

  async getDetail(input: WorkDetailInput): Promise<ChannelWorkDataResult> {
    const pin = await this.pinterestService.getPin(
      input.credential.accessToken,
      input.platformWorkId,
    )
    const fetchedAt = new Date()
    const createdAt = pin.created_at ? new Date(pin.created_at) : undefined
    const snapshot = {
      platformWorkId: input.platformWorkId,
      snapshotAt: createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt : fetchedAt,
      fetchedAt,
      work: {
        id: pin.id,
        title: pin.title,
        description: pin.description,
        url: buildPinterestPinWorkLink(pin.id),
        mediaType: pin.media?.media_type,
        coverUrl: pin.media?.images?.['1200x']?.url,
        publishedAt: createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt : undefined,
      },
      extra: {
        boardId: pin.board_id,
        destinationUrl: pin.link,
        media: pin.media,
      },
      rawResponse: pin,
    }
    return {
      snapshots: [snapshot],
      work: snapshot.work,
      extra: snapshot.extra,
      rawResponse: pin,
    }
  }

  async verifyOwnership(input: WorkOwnershipInput): Promise<boolean> {
    try {
      await this.pinterestService.getPin(input.credential.accessToken, input.platformWorkId)
      return true
    }
    catch (err) {
      this.logger.warn(err, `Failed to verify Pinterest ownership for ${input.platformWorkId}`)
      return false
    }
  }

  private parsePinterestPinId(link: string): string | undefined {
    try {
      const url = new URL(link)
      const hostname = url.hostname.replace(/^www\./, '')
      if (hostname !== 'pinterest.com' && !hostname.endsWith('.pinterest.com')) {
        return undefined
      }
      if (!url.pathname.startsWith('/pin/')) {
        return undefined
      }
      return url.pathname.split('/pin/')[1]?.split(/[?&#/]/)[0] || undefined
    }
    catch (err) {
      this.logger.warn(err, `Failed to parse Pinterest link ${link}`)
      return undefined
    }
  }

  private async normalizeLink(link: string): Promise<string> {
    try {
      const url = new URL(link)
      const hostname = url.hostname.replace(/^www\./, '')
      if (hostname === 'pin.it') {
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
      this.logger.warn(err, `Failed to resolve Pinterest short link: ${link}`)
      throw new AppException(ResponseCode.InvalidWorkLink)
    }
  }
}
