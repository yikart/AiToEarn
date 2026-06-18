import type { EventEnvelope } from './event-stream.service'
import { describe, expect, it, vi } from 'vitest'
import { EventStream } from './enum/event-stream.enum'
import { EventTopic } from './enum/event-topic.enum'
import { OnEventStream } from './event-stream.decorator'
import { EventStreamExplorer } from './event-stream.explorer'
import { EventStreamService } from './event-stream.service'

function createModulesContainer(instance: object) {
  return new Map([
    ['test-module', {
      providers: new Map([
        ['handler', { instance }],
      ]),
      controllers: new Map(),
    }],
  ])
}

function createEnvelope(topic: EventTopic): EventEnvelope {
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

describe('eventStreamExplorer', () => {
  it('registers decorated handlers with an inferred stream and generated group', async () => {
    class AutoGroupHandler {
      received: EventEnvelope[] = []

      @OnEventStream(EventTopic.UserCreated)
      async handle(envelope: EventEnvelope) {
        this.received.push(envelope)
      }
    }
    const instance = new AutoGroupHandler()
    const eventStreamService = { subscribe: vi.fn() }

    new EventStreamExplorer(
      createModulesContainer(instance) as never,
      eventStreamService as unknown as EventStreamService,
    ).onModuleInit()

    const expectedGroup = 'event-stream:AutoGroupHandler.handle:user.created'
    expect(eventStreamService.subscribe).toHaveBeenCalledWith(expect.objectContaining({
      group: expectedGroup,
      consumer: expect.stringContaining(`${expectedGroup}:`),
      streams: [EventStream.User],
      topics: [EventTopic.UserCreated],
    }))

    await eventStreamService.subscribe.mock.calls[0][0].handler(createEnvelope(EventTopic.UserCreated))

    expect(instance.received).toHaveLength(1)
  })

  it('keeps explicit consumer group options', () => {
    class ExplicitGroupHandler {
      @OnEventStream(EventTopic.ChannelsAccountConnected, {
        streams: [EventStream.Channels],
        group: 'channels-account-connected-spec',
        consumer: 'consumer-1',
        maxRetries: 2,
        pollInterval: 300,
      })
      async handle() {
        return undefined
      }
    }
    const eventStreamService = { subscribe: vi.fn() }

    new EventStreamExplorer(
      createModulesContainer(new ExplicitGroupHandler()) as never,
      eventStreamService as unknown as EventStreamService,
    ).onModuleInit()

    expect(eventStreamService.subscribe).toHaveBeenCalledWith(expect.objectContaining({
      group: 'channels-account-connected-spec',
      consumer: 'consumer-1',
      streams: [EventStream.Channels],
      topics: [EventTopic.ChannelsAccountConnected],
      maxRetries: 2,
      pollInterval: 300,
    }))
  })
})

describe('eventStreamService topic filtering', () => {
  it('acks messages without invoking handlers when the topic does not match', async () => {
    const redis = {
      xack: vi.fn(),
      xadd: vi.fn(),
    }
    const service = new EventStreamService(redis as never)
    const handler = vi.fn()

    await (service as unknown as {
      processMessage: (
        stream: string,
        id: string,
        fields: string[],
        config: {
          group: string
          consumer: string
          streams: EventStream[]
          topics: EventTopic[]
          handler: (envelope: EventEnvelope) => Promise<void>
        },
        maxRetries: number,
      ) => Promise<void>
    }).processMessage(
      EventStream.User,
      '1-0',
      ['data', JSON.stringify(createEnvelope(EventTopic.UserCreated))],
      {
        group: 'group-1',
        consumer: 'consumer-1',
        streams: [EventStream.User],
        topics: [EventTopic.ChannelsAccountConnected],
        handler,
      },
      0,
    )

    expect(handler).not.toHaveBeenCalled()
    expect(redis.xack).toHaveBeenCalledWith(EventStream.User, 'group-1', '1-0')
  })
})
