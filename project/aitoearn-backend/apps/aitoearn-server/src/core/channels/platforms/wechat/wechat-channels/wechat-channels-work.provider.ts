import type {
  ChannelWorkDataResult,
  WorkDetailInput,
  WorkLinkInfoInput,
  WorkOwnershipInput,
  WorkProvider,
} from '../../platforms.interface'
import { Injectable, Logger } from '@nestjs/common'
import { AccountType, ResponseCode } from '@yikart/common'
import { PlatformErrorCategory } from '../../platforms.exception'
import { WeChatService } from '../wechat.service'
import { WeChatChannelsPlatformException } from './wechat-channels.exception'

/**
 * Work provider for WeChat Channels (微信视频号).
 *
 * Supports:
 * - Video link info parsing (channels.weixin.qq.com and weixin.qq.com/sph links)
 * - Work detail retrieval
 * - Ownership verification (checks if video belongs to the authenticated account)
 */
@Injectable()
export class WeChatChannelsWorkProvider implements WorkProvider {
  private readonly logger = new Logger(WeChatChannelsWorkProvider.name)

  readonly platform = AccountType.WeChatChannels

  constructor(private readonly wechatService: WeChatService) {}

  async getLinkInfo(input: WorkLinkInfoInput): Promise<ChannelWorkDataResult> {
    const { link } = input

    if (!this.isChannelsLink(link)) {
      const exception = WeChatChannelsPlatformException.validation({
        code: ResponseCode.InvalidWorkLink,
        category: PlatformErrorCategory.Validation,
        context: { endpoint: 'getLinkInfo', accountId: input.accountId, metadata: { link } },
      })
      this.logger.error(exception, 'Not a valid WeChat Channels link')
      throw exception
    }

    if (input.dataId) {
      return {
        snapshots: [],
        work: {
          id: input.dataId,
          url: link,
          mediaType: 'video',
        },
        extra: {
          dataId: input.dataId,
          platformWorkId: input.dataId,
          resolvedUrl: link,
        },
      }
    }

    const info = await this.wechatService.channelsGetLinkInfo(link)
    const platformWorkId = info.finder_id && info.video_id
      ? `${info.finder_id}:${info.video_id}`
      : link

    return {
      snapshots: [],
      work: {
        id: platformWorkId,
        url: link,
        mediaType: 'video',
      },
      extra: {
        linkInfo: info,
      },
      rawResponse: info,
    }
  }

  async getDetail(input: WorkDetailInput): Promise<ChannelWorkDataResult> {
    const { platformWorkId } = input

    // platformWorkId format: "finderId:videoId"
    const [finderId, videoId] = this.parseWorkId(platformWorkId)

    if (!finderId || !videoId) {
      const exception = WeChatChannelsPlatformException.validation({
        code: ResponseCode.InvalidWorkLink,
        category: PlatformErrorCategory.Validation,
        context: { endpoint: 'getDetail', accountId: input.accountId, platformWorkId },
      })
      this.logger.error(exception, 'Failed to get WeChat Channels work detail')
      throw exception
    }

    const detail = await this.wechatService.channelsGetFinderVideoInfo(finderId, videoId)
    const fetchedAt = new Date()
    const publishAtValue = detail.publish_time ?? detail.create_time
    const publishedAt = publishAtValue === undefined ? undefined : new Date(Number(publishAtValue) * 1000)
    const snapshot = {
      platformWorkId,
      snapshotAt: publishedAt ?? fetchedAt,
      fetchedAt,
      work: {
        id: platformWorkId,
        title: detail.title,
        description: detail.description,
        mediaType: 'video',
        coverUrl: detail.cover_url,
        publishedAt,
        author: detail.finder_id ?? finderId,
      },
      metrics: {
        viewCount: Number(detail.read_count ?? 0),
        likeCount: Number(detail.like_count ?? 0),
        commentCount: Number(detail.comment_count ?? 0),
        shareCount: Number(detail.share_count ?? 0),
      },
      extra: {
        detail,
      },
      rawResponse: detail,
    }

    return {
      snapshots: [snapshot],
      work: snapshot.work,
      metrics: snapshot.metrics,
      extra: snapshot.extra,
      rawResponse: detail,
    }
  }

  async verifyOwnership(input: WorkOwnershipInput): Promise<boolean> {
    try {
      const { platformWorkId } = input
      const [finderId, videoId] = this.parseWorkId(platformWorkId)

      if (!finderId || !videoId) {
        return false
      }

      const detail = await this.wechatService.channelsGetFinderVideoInfo(
        finderId,
        videoId,
      )
      const accountFinderId = input.credential.platformUid
      if (!accountFinderId) {
        return false
      }

      // Check if the video belongs to the authenticated account
      return detail.finder_id === finderId && detail.finder_id === accountFinderId
    }
    catch (err) {
      this.logger.error(err, `Failed to verify ownership for ${input.platformWorkId}`)
      return false
    }
  }

  // ── Private helpers ──

  private parseWorkId(platformWorkId: string): [string, string] {
    const parts = platformWorkId.split(':')
    if (parts.length === 2) {
      return [parts[0], parts[1]]
    }
    return ['', '']
  }

  private isChannelsLink(link: string): boolean {
    try {
      const url = new URL(link)
      const hostname = url.hostname.replace(/^www\./, '')
      return hostname === 'channels.weixin.qq.com'
        || (hostname === 'weixin.qq.com' && url.pathname.startsWith('/sph/'))
    }
    catch (err) {
      this.logger.warn(err, `Failed to parse WeChat Channels link ${link}`)
      return false
    }
  }
}
