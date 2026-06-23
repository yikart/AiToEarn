import type {
  AnalyticsAccountInput,
  AnalyticsProvider,
  AnalyticsWorkInput,
  ChannelAccountAnalyticsResult,
  ChannelWorkAnalyticsResult,
  ChannelWorkMetricsSnapshot,
} from '../platforms.interface'
import { Injectable } from '@nestjs/common'
import { PinterestService } from './pinterest.service'

@Injectable()
export class PinterestAnalyticsProvider implements AnalyticsProvider {
  constructor(private readonly pinterestService: PinterestService) {}

  async fetchAccountAnalytics(input: AnalyticsAccountInput): Promise<ChannelAccountAnalyticsResult> {
    const user = await this.pinterestService.getUser(input.credential.accessToken)
    const fetchedAt = new Date()
    const snapshot = {
      platformUid: user.platformUid,
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
        viewCount: user.monthlyViews,
        workCount: user.pinCount,
      },
      extra: {
        monthlyViews: user.monthlyViews,
        pinCount: user.pinCount,
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
    const until = input.until ?? new Date()
    const since = input.since ?? new Date(until.getTime() - 30 * 24 * 60 * 60 * 1000)
    const response = await this.pinterestService.getPinAnalytics(
      input.credential.accessToken,
      input.platformWorkId,
      { since, until },
    )
    const metricMap: Record<string, keyof ChannelWorkMetricsSnapshot> = {
      IMPRESSION: 'impressionCount',
      SAVE: 'saveCount',
      PIN_CLICK: 'clickCount',
      OUTBOUND_CLICK: 'clickCount',
      VIDEO_MRC_VIEW: 'playCount',
    }
    const snapshots: Array<{
      platformWorkId: string
      snapshotAt: Date
      fetchedAt: Date
      work: { id: string }
      metrics: ChannelWorkMetricsSnapshot
      extra: Record<string, unknown>
      rawResponse: unknown
    }> = []
    for (const group of Object.values(response)) {
      for (const item of group.daily_metrics ?? []) {
        const fetchedAt = new Date()
        const parsedAt = item.date ? new Date(item.date) : fetchedAt
        const snapshotAt = Number.isNaN(parsedAt.getTime()) ? fetchedAt : parsedAt
        const metrics: ChannelWorkMetricsSnapshot = {}
        const extra: { [key: string]: unknown } = {
          dataStatus: item.data_status,
        }
        for (const [name, value] of Object.entries(item.metrics ?? {})) {
          const metricKey = metricMap[name]
          if (metricKey) {
            metrics[metricKey] = Number(value ?? 0)
          }
          else {
            extra[name] = value
          }
        }
        snapshots.push({
          platformWorkId: input.platformWorkId,
          snapshotAt,
          fetchedAt,
          work: { id: input.platformWorkId },
          metrics,
          extra,
          rawResponse: response,
        })
      }
    }

    return {
      snapshots,
      work: snapshots[snapshots.length - 1]?.work ?? { id: input.platformWorkId },
      metrics: snapshots[snapshots.length - 1]?.metrics,
      extra: snapshots[snapshots.length - 1]?.extra,
      rawResponse: response,
    }
  }
}
