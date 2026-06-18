/* eslint-disable ts/no-explicit-any */
import type { EventStream } from './enum/event-stream.enum'
import type { EventTopic } from './enum/event-topic.enum'
import type { EventPayloadMap } from './event-payload.interface'
import { randomUUID } from 'node:crypto'
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { Redis } from 'ioredis'

export type EventEnvelope<TTopic extends EventTopic = EventTopic> = TTopic extends EventTopic ? {
  eventId: string
  topic: TTopic
  version: number
  occurredAt: string
  source: string
  idempotencyKey: string
  payload: EventPayloadMap[TTopic]
} : never

export interface ConsumerConfig {
  group: string
  consumer: string
  streams: EventStream[]
  topics?: EventTopic[]
  handler: (envelope: EventEnvelope) => Promise<void>
  maxRetries?: number
  pollInterval?: number
}

@Injectable()
export class EventStreamService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventStreamService.name)
  private readonly consumers: ConsumerConfig[] = []
  private running = false

  constructor(private readonly redis: Redis) {}

  async onModuleInit() {
    this.running = true
    for (const config of this.consumers) {
      await this.ensureConsumerGroups(config)
      this.startPolling(config).catch((err) => {
        this.logger.error(err, `Polling failed for group ${config.group}`)
      })
    }
  }

  onModuleDestroy() {
    this.running = false
  }

  async emit<TTopic extends EventTopic>(
    stream: EventStream,
    topic: TTopic,
    payload: EventPayloadMap[TTopic],
    options?: { source?: string, idempotencyKey?: string },
  ): Promise<string> {
    const envelope = {
      eventId: randomUUID(),
      topic,
      version: 1,
      occurredAt: new Date().toISOString(),
      source: options?.source ?? 'aitoearn-server',
      idempotencyKey: options?.idempotencyKey ?? randomUUID(),
      payload,
    }

    await this.redis.xadd(stream, '*', 'data', JSON.stringify(envelope))
    return envelope.eventId
  }

  subscribe(config: ConsumerConfig): void {
    this.consumers.push(config)
    if (this.running) {
      this.ensureConsumerGroups(config)
        .then(() => this.startPolling(config))
        .catch((err) => {
          this.logger.error(err, `Failed to start polling for group ${config.group}`)
        })
    }
  }

  private async ensureConsumerGroups(config: ConsumerConfig): Promise<void> {
    for (const stream of config.streams) {
      try {
        await this.redis.xgroup('CREATE', stream, config.group, '$', 'MKSTREAM')
      }
      catch (err: any) {
        if (!err.message?.includes('BUSYGROUP')) {
          this.logger.error(err, `Failed to create consumer group ${config.group} on stream ${stream}`)
        }
      }
    }
  }

  private async startPolling(config: ConsumerConfig): Promise<void> {
    const pollInterval = config.pollInterval ?? 1000
    const maxRetries = config.maxRetries ?? 5

    while (this.running) {
      try {
        const streamArgs = Array.from({ length: config.streams.length }, () => '>')

        const results = await this.redis.xreadgroup(
          'GROUP',
          config.group,
          config.consumer,
          'COUNT',
          10,
          'BLOCK',
          pollInterval,
          'STREAMS',
          ...config.streams,
          ...streamArgs,
        )

        if (results) {
          for (const [stream, messages] of results as Array<[string, Array<[string, string[]]>]>) {
            for (const [id, fields] of messages) {
              await this.processMessage(stream, id, fields, config, maxRetries)
            }
          }
        }
      }
      catch (err: any) {
        if (this.running) {
          this.logger.error(err, `Poll error for group ${config.group}`)
          await this.sleep(pollInterval)
        }
      }
    }
  }

  private async processMessage(
    stream: string,
    id: string,
    fields: string[],
    config: ConsumerConfig,
    maxRetries: number,
  ): Promise<void> {
    const dataField = this.extractField(fields, 'data')
    if (!dataField) {
      await this.redis.xack(stream, config.group, id)
      return
    }

    const envelope: EventEnvelope = JSON.parse(dataField)
    if (config.topics?.length && !config.topics.includes(envelope.topic)) {
      await this.redis.xack(stream, config.group, id)
      return
    }

    let retries = 0

    while (retries <= maxRetries) {
      try {
        await config.handler(envelope)
        await this.redis.xack(stream, config.group, id)
        return
      }
      catch (err: any) {
        retries++
        if (retries > maxRetries) {
          this.logger.error(err, `Max retries exceeded for message ${id} in group ${config.group}`)
          await this.sendToDlq(stream, envelope, err, retries)
          await this.redis.xack(stream, config.group, id)
          return
        }
        await this.sleep(1000 * retries)
      }
    }
  }

  private async sendToDlq(stream: string, envelope: EventEnvelope, error: unknown, retries: number): Promise<void> {
    const dlqStream = `${stream}:dlq`
    const dlqPayload = {
      originalEnvelope: JSON.stringify(envelope),
      error: error instanceof Error ? error.message : String(error),
      retries,
      sentToDlqAt: new Date().toISOString(),
    }
    await this.redis.xadd(dlqStream, '*', 'data', JSON.stringify(dlqPayload))
  }

  private extractField(fields: string[], key: string): string | undefined {
    for (let i = 0; i < fields.length; i += 2) {
      if (fields[i] === key) {
        return fields[i + 1]
      }
    }
    return undefined
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
