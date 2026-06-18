import type {
  AnalyticsAccountInput,
  AnalyticsProvider,
  AnalyticsWorkInput,
  ChannelAccountAnalyticsResult,
  ChannelWorkAnalyticsResult,
} from '../platforms.interface'
import { Injectable } from '@nestjs/common'
import { PublishContentMode } from '../platforms.interface'
import { KwaiService } from './kwai.service'

@Injectable()
export class KwaiAnalyticsProvider implements AnalyticsProvider {
  constructor(private readonly kwaiService: KwaiService) {}

  async fetchAccountAnalytics(input: AnalyticsAccountInput): Promise<ChannelAccountAnalyticsResult> {
    const user = await this.kwaiService.getUserInfo(input.credential.accessToken)
    const fetchedAt = new Date()
    const snapshot = {
      platformUid: input.credential.platformUid,
      snapshotAt: fetchedAt,
      fetchedAt,
      profile: {
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
      metrics: {
        fansCount: user.fanCount,
        followingCount: user.followCount,
      },
      extra: {
        city: user.city,
        sex: user.sex,
      },
      rawResponse: user,
    }

    return {
      snapshots: [snapshot],
      profile: snapshot.profile,
      metrics: snapshot.metrics,
      extra: snapshot.extra,
      rawResponse: user,
    }
  }

  async fetchWorkAnalytics(input: AnalyticsWorkInput): Promise<ChannelWorkAnalyticsResult> {
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

  private buildWorkLink(photoId: string): string {
    return `https://www.kuaishou.com/short-video/${photoId}`
  }

  private parseCreateTime(createTime?: number): Date | undefined {
    return createTime === undefined ? undefined : new Date(createTime * 1000)
  }
}
