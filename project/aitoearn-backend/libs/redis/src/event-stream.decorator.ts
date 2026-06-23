import type { EventStream } from './enum/event-stream.enum'
import type { EventTopic } from './enum/event-topic.enum'

export interface OnEventStreamOptions {
  streams?: EventStream[]
  group?: string
  consumer?: string
  maxRetries?: number
  pollInterval?: number
}

export interface EventStreamHandlerMetadata {
  topics: EventTopic[]
  options: OnEventStreamOptions
}

export const ON_EVENT_STREAM_METADATA = Symbol('ON_EVENT_STREAM_METADATA')

export function OnEventStream(
  topic: EventTopic | EventTopic[],
  options: OnEventStreamOptions = {},
): MethodDecorator {
  return (_target, _propertyKey, descriptor) => {
    Reflect.defineMetadata(ON_EVENT_STREAM_METADATA, {
      topics: Array.isArray(topic) ? topic : [topic],
      options,
    } satisfies EventStreamHandlerMetadata, descriptor.value!)
  }
}
