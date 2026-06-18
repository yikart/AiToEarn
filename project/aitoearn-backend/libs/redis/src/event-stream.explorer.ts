import type { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper'
import type { EventStream } from './enum/event-stream.enum'
import type { EventTopic } from './enum/event-topic.enum'
import type { EventStreamHandlerMetadata } from './event-stream.decorator'
import { randomUUID } from 'node:crypto'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { MetadataScanner, ModulesContainer } from '@nestjs/core'
import { EventStream as EventStreamEnum } from './enum/event-stream.enum'
import { ON_EVENT_STREAM_METADATA } from './event-stream.decorator'
import { EventStreamService } from './event-stream.service'

@Injectable()
export class EventStreamExplorer implements OnModuleInit {
  private static readonly registeredGroups = new Set<string>()
  private readonly logger = new Logger(EventStreamExplorer.name)
  private readonly metadataScanner = new MetadataScanner()

  constructor(
    private readonly modulesContainer: ModulesContainer,
    private readonly eventStreamService: EventStreamService,
  ) {}

  onModuleInit() {
    for (const moduleRef of this.modulesContainer.values()) {
      this.scanWrappers(moduleRef.providers)
      this.scanWrappers(moduleRef.controllers)
    }
  }

  private scanWrappers(wrappers: Map<unknown, InstanceWrapper>) {
    for (const wrapper of wrappers.values()) {
      if (!wrapper.instance || typeof wrapper.instance !== 'object')
        continue
      this.scanInstance(wrapper.instance)
    }
  }

  private scanInstance(instance: object) {
    const prototype = Object.getPrototypeOf(instance)
    if (!prototype)
      return

    for (const methodName of this.metadataScanner.getAllMethodNames(prototype)) {
      const method = prototype[methodName]
      const metadata = Reflect.getMetadata(ON_EVENT_STREAM_METADATA, method) as EventStreamHandlerMetadata | undefined
      if (!metadata)
        continue

      const group = metadata.options.group ?? this.buildGroup(instance.constructor.name, methodName, metadata.topics)
      if (EventStreamExplorer.registeredGroups.has(group))
        continue

      const streams = metadata.options.streams ?? this.inferStreams(metadata.topics)
      if (!streams.length) {
        throw new Error(`No event stream configured for ${instance.constructor.name}.${methodName}`)
      }
      this.eventStreamService.subscribe({
        group,
        consumer: metadata.options.consumer ?? `${group}:${process.pid}:${randomUUID()}`,
        streams,
        topics: metadata.topics,
        maxRetries: metadata.options.maxRetries,
        pollInterval: metadata.options.pollInterval,
        handler: async (envelope) => {
          await (instance as Record<string, (...args: unknown[]) => unknown>)[methodName](envelope)
        },
      })
      EventStreamExplorer.registeredGroups.add(group)
    }
  }

  private buildGroup(className: string, methodName: string, topics: EventTopic[]) {
    return `event-stream:${className}.${methodName}:${topics.join(',')}`
  }

  private inferStreams(topics: EventTopic[]): EventStream[] {
    const streams = new Set<EventStream>()
    for (const topic of topics) {
      if (topic.startsWith('channels.')) {
        streams.add(EventStreamEnum.Channels)
        continue
      }
      if (topic.startsWith('user.')) {
        streams.add(EventStreamEnum.User)
        continue
      }
      this.logger.error(`Unable to infer event stream for topic ${topic}`)
    }
    return Array.from(streams)
  }
}
