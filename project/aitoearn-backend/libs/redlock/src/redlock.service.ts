import { Injectable, Logger } from '@nestjs/common'
import { RedisService } from '@yikart/redis'

@Injectable()
export class RedlockService {
  private readonly logger = new Logger(RedlockService.name)

  constructor(private redis: RedisService) {}

  async acquireLock(key: string, value: string, ttl: number): Promise<boolean> {
    return await this.redis.setNx(key, value, ttl)
  }

  async releaseLock(key: string, value: string): Promise<boolean> {
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `
    const result = await this.redis.eval(script, 1, key, value) as number
    return result === 1
  }

  /**
   * 續期：只有鎖還在自己手上時才延長 TTL，避免臨界區超過 TTL 後鎖被下一個週期搶走。
   */
  async renewLock(key: string, value: string, ttl: number): Promise<boolean> {
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("expire", KEYS[1], ARGV[2])
      else
        return 0
      end
    `
    const result = await this.redis.eval(script, 1, key, value, ttl) as number
    return result === 1
  }
}
