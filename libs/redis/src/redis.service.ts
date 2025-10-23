import { Injectable } from '@nestjs/common'
import { Redis } from 'ioredis'

@Injectable()
export class RedisService {
  constructor(private readonly client: Redis) { }

  /**
   * 设置key-value
   */
  async set(key: string, value: string, seconds?: number): Promise<boolean> {
    if (!seconds)
      return (await this.client.set(key, value)) === 'OK'

    return (await this.client.set(key, value, 'EX', seconds)) === 'OK'
  }

  async setNx(key: string, value: string, seconds?: number): Promise<boolean> {
    if (!seconds)
      return (await this.client.set(key, value, 'NX')) === 'OK'

    return (await this.client.set(key, value, 'EX', seconds, 'NX')) === 'OK'
  }

  /**
   * 设置 json key-value
   */
  async setJson(key: string, value: unknown, seconds?: number): Promise<boolean> {
    return this.set(key, JSON.stringify(value), seconds)
  }

  /**
   * 获取值
   */
  async get(key: string) {
    return await this.client.get(key)
  }

  /**
   * 获取 json 值
   */
  async getJson<T>(key: string): Promise<T | null> {
    const value = await this.get(key)
    return value ? JSON.parse(value) : null
  }

  /**
   * 清除值
   */
  async del(key: string): Promise<boolean> {
    const data = await this.client.del(key)
    return !!data
  }

  /**
   * 设置过期时间
   */
  async expire(key: string, times = 0): Promise<boolean> {
    const data = await this.client.pexpire(key, times)
    return data === 1
  }

  /**
   * 获取剩余时间 （秒）
   */
  async ttl(key: string): Promise<number> {
    const data = await this.client.pttl(key)
    return data
  }

  async eval(...args: [
    script: string | Buffer,
    numkeys: number | string,
    ...args: (string | Buffer | number)[],
  ]) {
    return this.client.eval(...args)
  }
}
