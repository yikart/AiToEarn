import type { Redis } from 'ioredis'
/*
 * @Author: nevin
 * @Date: 2024-08-31 19:15:15
 * @LastEditTime: 2024-09-18 11:42:41
 * @LastEditors: nevin
 * @Description:
 */
import { Injectable } from '@nestjs/common'

@Injectable()
export class RedisService {
  constructor(private readonly client: Redis) { }

  /**
   * 设置key-value
   */
  async set(key: string, value: string, seconds?: number): Promise<boolean> {
    if (!seconds)
      return !!(await this.client.set(key, value))

    return !!(await this.client.set(key, value, 'EX', seconds))
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
}
