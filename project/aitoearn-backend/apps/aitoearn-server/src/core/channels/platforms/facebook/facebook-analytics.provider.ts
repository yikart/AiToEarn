import type {
  AnalyticsAccountInput,
  AnalyticsProvider,
  AnalyticsWorkInput,
  ChannelAccountAnalyticsResult,
  ChannelAccountMetricsSnapshot,
  ChannelWorkAnalyticsResult,
  ChannelWorkMetricsSnapshot,
} from '../platforms.interface'
import { Injectable } from '@nestjs/common'
import { FacebookService } from './facebook.service'

@Injectable()
export class FacebookAnalyticsProvider implements AnalyticsProvider {
  constructor(private readonly facebookService: FacebookService) {}

  async fetchAccountAnalytics(input: AnalyticsAccountInput): Promise<ChannelAccountAnalyticsResult> {
    const page = await this.facebookService.getPageInfo(
      input.credential.accessToken,
      input.credential.platformUid ?? input.accountId,
    )
    const fetchedAt = new Date()
    const metrics: ChannelAccountMetricsSnapshot = {
      fansCount: page.followers_count,
    }
    const profile = {
      displayName: page.name,
      avatarUrl: page.picture?.data?.url,
    }
    const extra = {
      fanCount: page.fan_count,
      followersCount: page.followers_count,
      category: page.category,
      categoryList: page.category_list,
    }
    const snapshot = {
      platformUid: page.id,
      snapshotAt: fetchedAt,
      fetchedAt,
      profile,
      metrics,
      extra,
      rawResponse: page,
    }
    return {
      snapshots: [snapshot],
      profile,
      metrics,
      extra,
      rawResponse: page,
    }
  }

  async fetchWorkAnalytics(input: AnalyticsWorkInput): Promise<ChannelWorkAnalyticsResult> {
    const response = await this.facebookService.getPostInsights(
      input.credential.accessToken,
      input.platformWorkId,
    )
    const metricMap: Record<string, keyof ChannelWorkMetricsSnapshot> = {
      post_impressions: 'impressionCount',
      post_engaged_users: 'engagementCount',
      post_clicks: 'clickCount',
    }
    const snapshotsByAt = new Map<string, {
      platformWorkId: string
      snapshotAt: Date
      fetchedAt: Date
      work: { id: string }
      metrics: ChannelWorkMetricsSnapshot
      extra: Record<string, unknown>
      rawResponse: unknown
    }>()
    const data = response.data ?? []

    for (const item of data) {
      const name = item.name
      for (const value of item.values ?? []) {
        const fetchedAt = new Date()
        const parsedAt = value.end_time ? new Date(value.end_time) : fetchedAt
        const snapshotAt = Number.isNaN(parsedAt.getTime()) ? fetchedAt : parsedAt
        const key = snapshotAt.toISOString()
        const snapshot = snapshotsByAt.get(key) ?? {
          platformWorkId: input.platformWorkId,
          snapshotAt,
          fetchedAt,
          work: { id: input.platformWorkId },
          metrics: {},
          extra: {},
          rawResponse: response,
        }
        const metricKey = name ? metricMap[name] : undefined
        if (metricKey) {
          snapshot.metrics[metricKey] = Number(value.value ?? 0)
        }
        else if (name) {
          snapshot.extra[name] = value.value
        }
        snapshotsByAt.set(key, snapshot)
      }
    }

    const snapshots = Array.from(snapshotsByAt.values())
    return {
      snapshots,
      work: snapshots[snapshots.length - 1]?.work ?? { id: input.platformWorkId },
      metrics: snapshots[snapshots.length - 1]?.metrics,
      extra: snapshots[snapshots.length - 1]?.extra,
      rawResponse: response,
    }
  }
}
