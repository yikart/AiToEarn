import type {
  AnalyticsAccountInput,
  AnalyticsProvider,
  AnalyticsWorkInput,
  ChannelAccountAnalyticsResult,
  ChannelWorkAnalyticsResult,
} from '../platforms.interface'
import { Injectable } from '@nestjs/common'
import { TikTokService } from './tiktok.service'

@Injectable()
export class TikTokAnalyticsProvider implements AnalyticsProvider {
  constructor(private readonly tikTokService: TikTokService) {}

  async fetchAccountAnalytics(input: AnalyticsAccountInput): Promise<ChannelAccountAnalyticsResult> {
    const user = await this.tikTokService.getUserInfo(input.credential.accessToken)
    const fetchedAt = new Date()
    const snapshot = {
      platformUid: user.openId,
      snapshotAt: fetchedAt,
      fetchedAt,
      profile: {
        displayName: user.displayName,
        username: user.username,
        avatarUrl: user.avatarUrl,
      },
      metrics: {
        fansCount: user.followerCount,
        followingCount: user.followingCount,
        likeCount: user.likesCount,
        workCount: user.videoCount,
      },
      extra: {
        unionId: user.unionId,
        bioDescription: user.bioDescription,
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
    const response = await this.tikTokService.queryVideos(input.credential.accessToken, [input.platformWorkId])
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
}
