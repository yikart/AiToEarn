/* eslint-disable ts/no-explicit-any */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { Redis } from 'ioredis'

@Injectable()
export class RedisPubSubService implements OnModuleInit {
  private readonly logger = new Logger(RedisPubSubService.name)
  private readonly listeners = new Map<string, Set<(data: any) => void>>()
  private readonly onceListeners = new Map<string, Set<(data: any) => void>>()
  private readonly subscribedChannels = new Set<string>()

  private readonly messageHandler = (channel: string, message: string) => {
    try {
      const data = JSON.parse(message)
      this.dispatchMessage(channel, data)
    }
    catch (error) {
      this.logger.error(`Failed to parse message on channel ${channel}: ${error}`)
    }
  }

  constructor(
    private readonly subscriber: Redis,
    private readonly publisher: Redis,
  ) { }

  async onModuleInit() {
    this.subscriber.on('message', this.messageHandler)
    this.logger.log('Redis Pub/Sub EventEmitter initialized')
  }

  on<T = any>(channel: string, listener: (data: T) => void): this {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set())
    }
    this.listeners.get(channel)!.add(listener)

    if (!this.subscribedChannels.has(channel)) {
      this.subscribeChannel(channel)
    }

    return this
  }

  off<T = any>(channel: string, listener: (data: T) => void): this {
    const channelListeners = this.listeners.get(channel)
    if (channelListeners) {
      channelListeners.delete(listener)
      if (channelListeners.size === 0) {
        this.listeners.delete(channel)
      }
    }

    const channelOnceListeners = this.onceListeners.get(channel)
    if (channelOnceListeners) {
      channelOnceListeners.delete(listener)
      if (channelOnceListeners.size === 0) {
        this.onceListeners.delete(channel)
      }
    }

    if (!this.listeners.has(channel) && !this.onceListeners.has(channel)) {
      this.unsubscribeChannel(channel)
    }

    return this
  }

  once<T = any>(channel: string, listener: (data: T) => void): this {
    const wrappedListener = (data: any) => {
      this.off(channel, wrappedListener)
      listener(data)
    }

    if (!this.onceListeners.has(channel)) {
      this.onceListeners.set(channel, new Set())
    }
    this.onceListeners.get(channel)!.add(wrappedListener)

    if (!this.subscribedChannels.has(channel)) {
      this.subscribeChannel(channel)
    }

    return this
  }

  async emit(channel: string, data: any): Promise<boolean> {
    try {
      const res = await this.publisher.publish(channel, JSON.stringify(data))
      return !!res
    }
    catch (error) {
      this.logger.error(`Failed to emit message on channel ${channel}: ${error}`)
      return false
    }
  }

  private dispatchMessage(channel: string, data: any) {
    const channelListeners = this.listeners.get(channel)
    if (channelListeners) {
      for (const listener of channelListeners) {
        try {
          listener(data)
        }
        catch (error) {
          this.logger.error(`Error in listener for channel ${channel}: ${error}`)
        }
      }
    }

    const channelOnceListeners = this.onceListeners.get(channel)
    if (channelOnceListeners) {
      const listenersToCall = Array.from(channelOnceListeners)
      for (const listener of listenersToCall) {
        try {
          listener(data)
        }
        catch (error) {
          this.logger.error(`Error in once listener for channel ${channel}: ${error}`)
        }
      }
    }
  }

  private subscribeChannel(channel: string) {
    if (this.subscribedChannels.has(channel)) {
      return
    }

    this.subscriber.subscribe(channel).catch((error) => {
      this.logger.error(`Failed to subscribe to channel ${channel}: ${error}`)
    })
    this.subscribedChannels.add(channel)
    this.logger.debug(`Auto-subscribed to channel: ${channel}`)
  }

  private unsubscribeChannel(channel: string) {
    if (!this.subscribedChannels.has(channel)) {
      return
    }

    this.subscriber.unsubscribe(channel).catch((error) => {
      this.logger.error(`Failed to unsubscribe from channel ${channel}: ${error}`)
    })
    this.subscribedChannels.delete(channel)
    this.logger.debug(`Auto-unsubscribed from channel: ${channel}`)
  }
}
