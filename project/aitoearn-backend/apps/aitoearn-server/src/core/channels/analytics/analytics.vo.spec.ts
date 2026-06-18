import { AccountType } from '@yikart/common'
import { ChannelWorkAnalyticsVo } from './analytics.vo'

describe('channel analytics vo', () => {
  it('does not expose raw platform responses from snapshots', () => {
    const result = ChannelWorkAnalyticsVo.create({
      platform: AccountType.YouTube,
      platformWorkId: 'video-id',
      snapshots: [{
        id: 'snapshot-1',
        platformWorkId: 'video-id',
        snapshotAt: new Date('2026-06-01T00:00:00.000Z'),
        fetchedAt: new Date('2026-06-01T00:00:01.000Z'),
        work: { id: 'video-id' },
        rawResponse: { token: 'raw' },
      }],
      rawResponse: { token: 'top-level-raw' },
    } as never)

    expect(result).not.toHaveProperty('rawResponse')
    expect(result.snapshots[0]).not.toHaveProperty('rawResponse')
  })
})
