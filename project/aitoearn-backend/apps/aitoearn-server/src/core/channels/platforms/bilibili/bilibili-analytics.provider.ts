import type {
  AnalyticsAccountInput,
  AnalyticsProvider,
  AnalyticsWorkInput,
  ChannelAccountAnalyticsResult,
  ChannelWorkAnalyticsResult,
} from '../platforms.interface'
import { Injectable } from '@nestjs/common'
import { BilibiliService } from './bilibili.service'

@Injectable()
export class BilibiliAnalyticsProvider implements AnalyticsProvider {
  constructor(private readonly bilibiliService: BilibiliService) {}

  async fetchAccountAnalytics(input: AnalyticsAccountInput): Promise<ChannelAccountAnalyticsResult> {
    const stat = await this.bilibiliService.getUserStat(input.credential.accessToken)
    const fetchedAt = new Date()
    const snapshot = {
      platformUid: input.credential.platformUid,
      snapshotAt: fetchedAt,
      fetchedAt,
      metrics: {
        fansCount: stat.fansCount,
        followingCount: stat.followingCount,
        workCount: stat.archiveCount,
      },
      extra: {
        archiveCount: stat.archiveCount,
      },
      rawResponse: stat,
    }
    return {
      snapshots: [snapshot],
      metrics: snapshot.metrics,
      extra: snapshot.extra,
      rawResponse: stat,
    }
  }

  async fetchWorkAnalytics(input: AnalyticsWorkInput): Promise<ChannelWorkAnalyticsResult> {
    const stat = await this.bilibiliService.getArchiveStat(
      input.credential.accessToken,
      input.platformWorkId,
    )
    const fetchedAt = new Date()
    const publishedAt = stat.ptime === undefined ? undefined : new Date(Number(stat.ptime) * 1000)
    const snapshot = {
      platformWorkId: input.platformWorkId,
      snapshotAt: publishedAt ?? fetchedAt,
      fetchedAt,
      work: {
        id: input.platformWorkId,
        title: stat.title,
        publishedAt,
      },
      metrics: {
        viewCount: Number(stat.view ?? 0),
        likeCount: Number(stat.like ?? 0),
        collectCount: Number(stat.favorite ?? 0),
        shareCount: Number(stat.share ?? 0),
        commentCount: Number(stat.reply ?? 0),
      },
      extra: {
        coinCount: Number(stat.coin ?? 0),
        danmakuCount: Number(stat.danmaku ?? 0),
      },
      rawResponse: stat,
    }
    return {
      snapshots: [snapshot],
      work: snapshot.work,
      metrics: snapshot.metrics,
      extra: snapshot.extra,
      rawResponse: stat,
    }
  }
}
