import { Injectable, Logger } from '@nestjs/common'
import Redis from 'ioredis'

@Injectable()
export class RedlockService {
  private readonly logger = new Logger(RedlockService.name)

  constructor(private redis: Redis) {}

  async acquireLock(key: string, value: string, ttl: number): Promise<boolean> {
    const result = await this.redis.set(key, value, 'EX', ttl, 'NX')
    return result === 'OK'
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
}
