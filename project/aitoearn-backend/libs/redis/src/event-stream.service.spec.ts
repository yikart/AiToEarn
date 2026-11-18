import type { ConsumerConfig, EventEnvelope } from './event-stream.service'
import { describe, expect, it, vi } from 'vitest'
import { EventStream } from './enum/event-stream.enum'
import { EventTopic } from './enum/event-topic.enum'
import { EventStreamService } from './event-stream.service'

function createEnvelope(topic: EventTopic = EventTopic.UserCreated): EventEnvelope {
  return {
    eventId: 'event_1',
    topic,
    version: 1,
    occurredAt: '2026-06-09T00:00:00.000Z',
    source: 'spec',
    idempotencyKey: 'event_1',
    payload: {},
  } as EventEnvelope
}

function createConfig(handler: ConsumerConfig['handler']): ConsumerConfig {
  return {
    group: 'group-1',
    consumer: 'consumer-1',
    streams: [EventStream.User],
    topics: [EventTopic.UserCreated],
    handler,
  }
}

function createRedis() {
  return {
    xack: vi.fn(),
    xadd: vi.fn(),
    xautoclaim: vi.fn(),
  }
}

describe('eventStreamService malformed messages', () => {
  it('sends an unparsable payload to the DLQ and acks it', async () => {
    const redis = createRedis()
    const service = new EventStreamService(redis as never)
    const handler = vi.fn()

    await (service as unknown as {
      processMessage: (stream: string, id: string, fields: string[], config: ConsumerConfig, maxRetries: number) => Promise<void>
    }).processMessage(EventStream.User, '1-0', ['data', '{not-json'], createConfig(handler), 0)

    expect(handler).not.toHaveBeenCalled()
    expect(redis.xadd).toHaveBeenCalledWith(`${EventStream.User}:dlq`, '*', 'data', expect.stringContaining('{not-json'))
    expect(redis.xack).toHaveBeenCalledWith(EventStream.User, 'group-1', '1-0')
  })

  it('sends a payload without a topic to the DLQ instead of retrying forever', async () => {
    const redis = createRedis()
    const service = new EventStreamService(redis as never)
    const handler = vi.fn()

    await (service as unknown as {
      processMessage: (stream: string, id: string, fields: string[], config: ConsumerConfig, maxRetries: number) => Promise<void>
    }).processMessage(EventStream.User, '2-0', ['data', JSON.stringify({ eventId: 'event_2' })], createConfig(handler), 5)

    expect(handler).not.toHaveBeenCalled()
    expect(redis.xadd).toHaveBeenCalledTimes(1)
    expect(redis.xack).toHaveBeenCalledWith(EventStream.User, 'group-1', '2-0')
  })

  it('keeps processing the rest of the batch when one message cannot be acked', async () => {
    const redis = createRedis()
    redis.xack.mockRejectedValueOnce(new Error('redis down'))
    const service = new EventStreamService(redis as never)
    const handler = vi.fn()
    const config = createConfig(handler)
    const target = service as unknown as {
      processMessageSafely: (stream: string, id: string, fields: string[], config: ConsumerConfig, maxRetries: number) => Promise<void>
    }

    await target.processMessageSafely(EventStream.User, '3-0', ['data', JSON.stringify(createEnvelope())], config, 0)
    await target.processMessageSafely(EventStream.User, '4-0', ['data', JSON.stringify(createEnvelope())], config, 0)

    expect(handler).toHaveBeenCalledTimes(2)
    expect(redis.xack).toHaveBeenLastCalledWith(EventStream.User, 'group-1', '4-0')
  })
})

describe('eventStreamService pending message recovery', () => {
  it('claims idle pending messages so they are not lost after a restart', async () => {
    const redis = createRedis()
    const handler = vi.fn()
    redis.xautoclaim
      .mockResolvedValueOnce(['0-0', [['5-0', ['data', JSON.stringify(createEnvelope())]]]])
      .mockResolvedValueOnce(['0-0', []])

    const service = new EventStreamService(redis as never)
    const config = createConfig(handler)

    await (service as unknown as {
      reclaimPendingMessages: (config: ConsumerConfig, maxRetries: number) => Promise<void>
    }).reclaimPendingMessages(config, 0)

    expect(redis.xautoclaim).toHaveBeenCalledWith(
      EventStream.User,
      'group-1',
      'consumer-1',
      60000,
      '0-0',
      'COUNT',
      10,
    )
    expect(handler).toHaveBeenCalledTimes(1)
    expect(redis.xack).toHaveBeenCalledWith(EventStream.User, 'group-1', '5-0')
  })

  it('honours the configured idle threshold', async () => {
    const redis = createRedis()
    redis.xautoclaim.mockResolvedValue(['0-0', []])
    const service = new EventStreamService(redis as never)

    await (service as unknown as {
      reclaimPendingMessages: (config: ConsumerConfig, maxRetries: number) => Promise<void>
    }).reclaimPendingMessages({ ...createConfig(vi.fn()), pendingMinIdleMs: 5000 }, 0)

    expect(redis.xautoclaim).toHaveBeenCalledWith(
      EventStream.User,
      'group-1',
      'consumer-1',
      5000,
      '0-0',
      'COUNT',
      10,
    )
  })

  it('continues scanning large pending lists from the saved cursor', async () => {
    const redis = createRedis()
    redis.xautoclaim
      .mockResolvedValueOnce(['10-0', []])
      .mockResolvedValueOnce(['20-0', []])
      .mockResolvedValueOnce(['30-0', []])
      .mockResolvedValueOnce(['40-0', []])
      .mockResolvedValueOnce(['50-0', []])
      .mockResolvedValueOnce(['0-0', []])

    const service = new EventStreamService(redis as never)
    const target = service as unknown as {
      reclaimPendingMessages: (config: ConsumerConfig, maxRetries: number) => Promise<void>
    }

    await target.reclaimPendingMessages(createConfig(vi.fn()), 0)
    await target.reclaimPendingMessages(createConfig(vi.fn()), 0)

    expect(redis.xautoclaim.mock.calls[5][4]).toBe('50-0')
  })
})
