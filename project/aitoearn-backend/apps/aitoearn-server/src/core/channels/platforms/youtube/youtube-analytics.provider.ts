import type {
  AnalyticsAccountInput,
  AnalyticsProvider,
  AnalyticsWorkInput,
  ChannelAccountAnalyticsResult,
  ChannelWorkAnalyticsResult,
} from '../platforms.interface'
import { Injectable } from '@nestjs/common'
import { ResponseCode } from '@yikart/common'
import { PlatformErrorCategory } from '../platforms.exception'
import { YouTubePlatformException } from './youtube.exception'
import { YoutubeService } from './youtube.service'

@Injectable()
export class YoutubeAnalyticsProvider implements AnalyticsProvider {
  constructor(private readonly youtubeService: YoutubeService) {}

  async fetchAccountAnalytics(input: AnalyticsAccountInput): Promise<ChannelAccountAnalyticsResult> {
    if (!input.credential.account) {
      throw YouTubePlatformException.validation({
        code: ResponseCode.ChannelPlatformResponseInvalid,
        category: PlatformErrorCategory.Validation,
        context: { endpoint: 'analytics.account.channel', accountId: input.accountId },
      })
    }
    const channel = await this.youtubeService.getChannelInfo(input.credential.accessToken, input.credential.account)
    const fetchedAt = new Date()
    const snapshot = {
      platformUid: channel.channelId,
      snapshotAt: fetchedAt,
      fetchedAt,
      profile: {
        displayName: channel.title,
        avatarUrl: channel.thumbnailUrl,
      },
      metrics: {
        fansCount: channel.subscriberCount,
        workCount: channel.videoCount,
        viewCount: channel.viewCount,
      },
      extra: {
        description: channel.description,
      },
      rawResponse: channel,
    }
    return {
      snapshots: [snapshot],
      profile: snapshot.profile,
      metrics: snapshot.metrics,
      extra: snapshot.extra,
      rawResponse: channel,
    }
  }

  async fetchWorkAnalytics(input: AnalyticsWorkInput): Promise<ChannelWorkAnalyticsResult> {
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
}
