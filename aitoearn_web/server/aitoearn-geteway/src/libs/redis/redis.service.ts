/*
 * @Author: nevin
 * @Date: 2024-08-31 19:15:15
 * @LastEditTime: 2024-09-18 11:42:41
 * @LastEditors: nevin
 * @Description:
 */
import { Inject, Injectable } from '@nestjs/common'
import { Redis } from 'ioredis'
import { REDIS_CLIENT } from './redis.constant'

@Injectable()
export class RedisService {
  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {}

  /**
   * 设置key-value
   * @param key
   * @param value
   * @param seconds
   * @returns
   */
  async setKey<T>(key: string, value: T, seconds?: number): Promise<boolean> {
    const inValue
      = typeof value === 'string' || typeof value === 'number'
        ? value
        : JSON.stringify(value)

    try {
      if (!seconds)
        return !!(await this.client.set(key, inValue))

      return !!(await this.client.set(key, inValue, 'EX', seconds))
    }
    catch (error) {
      console.log('------ redis set key error', error)

      return false
    }
  }

  /**
   * 获取值
   * @param key
   * @returns
   */
  async get<T>(key: string, isObj = true): Promise<T | null> {
    const data = await this.client.get(key)
    if (!data)
      return null
    return isObj ? (JSON.parse(data) as T) : (data as T)
  }

  /**
   * 清除值
   * @param key
   * @returns
   */
  async del(key: string): Promise<boolean> {
    const data = await this.client.del(key)
    return !!data
  }

  /**
   * 设置过期时间
   * @param key
   * @param times
   * @returns
   */
  async setPexire(key: string, times = 0): Promise<boolean> {
    const data = await this.client.pexpire(key, times)
    return data === 1
  }

  /**
   * 获取剩余时间 （秒）
   */
  async getPttl(key: string): Promise<number> {
    const data = await this.client.pttl(key)
    return data
  }

  /**
   * 生成订单号
   * @param h 前置标识
   */
  async generateOrderNumber(h = '') {
    try {
      // 获取今天的日期，格式化为 YYYYMMDD
      const today = new Date()
      const datePrefix = `${today.getFullYear()}${today.getMonth() + 1}${today.getDate()}`

      // 使用 Redis 的 INCR 命令生成递增的序列号
      const sequence = await this.client.incr(`order_seq:${h}${datePrefix}`)

      // 格式化序列号，确保它有固定的位数，例如8位
      const formattedSequence = sequence.toString().padStart(8, '0')

      // 拼接日期前缀和序列号，形成完整的订单号
      const orderNumber = `${h}${datePrefix}-${formattedSequence}`

      return orderNumber
    }
    catch (error) {
      console.error('Error generating order number:', error)
      throw error
    }
  }

  /**
   * 重置订单号
   * @param h 前置标识
   */
  async resetOrderNumber(h = '') {
    try {
      const today = new Date()
      const datePrefix = `${today.getFullYear()}${today.getMonth() + 1}${today.getDate()}`

      // 删除前一天的序列号键
      await this.client.del(`order_seq:${h}${datePrefix}`)
    }
    catch (error) {
      console.error('Error resetting order sequence:', error)
    }
  }
}
