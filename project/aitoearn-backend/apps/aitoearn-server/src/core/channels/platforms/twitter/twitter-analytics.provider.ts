import type {
  AnalyticsAccountInput,
  AnalyticsProvider,
  AnalyticsWorkInput,
  ChannelAccountAnalyticsResult,
  ChannelWorkAnalyticsResult,
} from '../platforms.interface'
import { Injectable } from '@nestjs/common'
import { TwitterService } from './twitter.service'

@Injectable()
export class TwitterAnalyticsProvider implements AnalyticsProvider {
  constructor(private readonly twitterService: TwitterService) {}

  async fetchAccountAnalytics(input: AnalyticsAccountInput): Promise<ChannelAccountAnalyticsResult> {
    const response = await this.twitterService.getUserAnalytics(
      input.credential.accessToken,
      input.accountId,
      input.credential.platformUid ?? input.accountId,
    )
    const user = response.data
    const metrics = user?.public_metrics ?? user?.publicMetrics
    const fetchedAt = new Date()
    const snapshot = {
      platformUid: user?.id ?? input.credential.platformUid,
      snapshotAt: fetchedAt,
      fetchedAt,
      profile: {
        displayName: user?.name,
        username: user?.username,
        avatarUrl: user?.profile_image_url ?? user?.profileImageUrl,
      },
      metrics: {
        fansCount: Number(metrics?.followers_count ?? metrics?.followersCount ?? 0),
        followingCount: Number(metrics?.following_count ?? metrics?.followingCount ?? 0),
        workCount: Number(metrics?.tweet_count ?? metrics?.tweetCount ?? 0),
        likeCount: Number(metrics?.like_count ?? metrics?.likeCount ?? 0),
      },
      extra: {
        verified: user?.verified,
      },
      rawResponse: response,
    }
    return {
      snapshots: [snapshot],
      profile: snapshot.profile,
      metrics: snapshot.metrics,
      extra: snapshot.extra,
      rawResponse: response,
    }
  }

  async fetchWorkAnalytics(input: AnalyticsWorkInput): Promise<ChannelWorkAnalyticsResult> {
    const response = await this.twitterService.getPostAnalytics(
      input.credential.accessToken,
      input.accountId,
      input.platformWorkId,
    )
    const post = response.data
    const metrics = post?.public_metrics ?? post?.publicMetrics
    const fetchedAt = new Date()
    const createdAtValue = post?.created_at ?? post?.createdAt
    const createdAt = createdAtValue ? new Date(createdAtValue) : undefined
    const snapshot = {
      platformWorkId: input.platformWorkId,
      snapshotAt: createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt : fetchedAt,
      fetchedAt,
      work: {
        id: post?.id ?? input.platformWorkId,
        description: post?.text,
        mediaType: 'tweet',
        publishedAt: createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt : undefined,
      },
      metrics: {
        likeCount: Number(metrics?.like_count ?? metrics?.likeCount ?? 0),
        commentCount: Number(metrics?.reply_count ?? metrics?.replyCount ?? 0),
        shareCount: Number(metrics?.retweet_count ?? metrics?.retweetCount ?? 0),
        saveCount: Number(metrics?.bookmark_count ?? metrics?.bookmarkCount ?? 0),
        impressionCount: Number(metrics?.impression_count ?? metrics?.impressionCount ?? 0),
      },
      extra: {
        quoteCount: Number(metrics?.quote_count ?? metrics?.quoteCount ?? 0),
      },
      rawResponse: response,
    }
    return {
      snapshots: [snapshot],
      work: snapshot.work,
      metrics: snapshot.metrics,
      extra: snapshot.extra,
      rawResponse: response,
    }
  }
}
