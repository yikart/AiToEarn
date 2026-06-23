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
import { ResponseCode } from '@yikart/common'
import { PlatformErrorCategory } from '../platforms.exception'
import { InstagramPlatformException } from './instagram.exception'
import { InstagramService } from './instagram.service'

@Injectable()
export class InstagramAnalyticsProvider implements AnalyticsProvider {
  constructor(private readonly instagramService: InstagramService) {}

  async fetchAccountAnalytics(input: AnalyticsAccountInput): Promise<ChannelAccountAnalyticsResult> {
    if (
      input.credential.scope
      && !input.credential.scope.split(/[,\s]+/).includes('instagram_business_manage_insights')
    ) {
      throw InstagramPlatformException.validation({
        code: ResponseCode.ChannelPlatformPermissionMissing,
        category: PlatformErrorCategory.Permission,
        context: { endpoint: 'instagram.account.insights', accountId: input.accountId },
        cause: {
          platformCode: 'missing_scope',
          platformMessage: 'Missing instagram_business_manage_insights',
        },
      })
    }

    const response = await this.instagramService.getAccountInsights(
      input.credential.accessToken,
      input.credential.platformUid ?? input.accountId,
      { since: input.since, until: input.until },
    )
    const metricMap: Record<string, keyof ChannelAccountMetricsSnapshot> = {
      reach: 'reachCount',
      profile_views: 'viewCount',
      website_clicks: 'clickCount',
    }
    const snapshotsByAt = new Map<string, {
      snapshotAt: Date
      fetchedAt: Date
      platformUid?: string
      metrics: ChannelAccountMetricsSnapshot
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
          snapshotAt,
          fetchedAt,
          platformUid: input.credential.platformUid,
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
      metrics: snapshots[snapshots.length - 1]?.metrics,
      extra: snapshots[snapshots.length - 1]?.extra,
      rawResponse: response,
    }
  }

  async fetchWorkAnalytics(input: AnalyticsWorkInput): Promise<ChannelWorkAnalyticsResult> {
    const response = await this.instagramService.getMediaInsights(
      input.credential.accessToken,
      input.platformWorkId,
    )
    const metricMap: Record<string, keyof ChannelWorkMetricsSnapshot> = {
      reach: 'reachCount',
      likes: 'likeCount',
      comments: 'commentCount',
      shares: 'shareCount',
      saved: 'saveCount',
      total_interactions: 'engagementCount',
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
