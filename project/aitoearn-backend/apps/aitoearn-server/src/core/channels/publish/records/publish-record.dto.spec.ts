import { describe, expect, it, vi } from 'vitest'

import { PublishRecordAccountQuerySchema } from './publish-record.dto'

vi.mock('@yikart/mongodb', () => ({
  AccountType: { Kwai: 'KWAI' },
  PublishRecordLinkStatus: { PENDING: 'pending', READY: 'ready', FAILED: 'failed' },
  PublishRecordSource: { Publish: 'publish' },
  PublishStatus: { WaitingForPublish: 0 },
  PublishType: { VIDEO: 'video' },
}))

describe('publishRecordAccountQuerySchema', () => {
  it('includes the complete UTC day when an end date is provided without a time', () => {
    const result = PublishRecordAccountQuerySchema.parse({ time: '2024-01-01,2024-01-31' })

    expect(result.time?.[0]).toEqual(new Date('2024-01-01T00:00:00.000Z'))
    expect(result.time?.[1]).toEqual(new Date('2024-01-31T23:59:59.999Z'))
  })

  it('preserves exact timestamps in a time range', () => {
    const result = PublishRecordAccountQuerySchema.parse({
      time: ['2024-01-01T08:00:00.000Z', '2024-01-31T09:30:00.000Z'],
    })

    expect(result.time?.[1]).toEqual(new Date('2024-01-31T09:30:00.000Z'))
  })
})
