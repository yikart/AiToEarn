import type {
  CanActivate,
  ExecutionContext,
} from '@nestjs/common'
import {
  Injectable,
  Logger,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AppException, ResponseCode } from '@yikart/common'
import { RedisService } from '@yikart/redis'

export const RATE_LIMIT_KEY = 'rate_limit'

export interface RateLimitOptions {
  /**
   * 时间窗口（秒）
   */
  ttl: number
  /**
   * 时间窗口内允许的最大请求次数
   */
  limit: number
  /**
   * 自定义键生成器
   */
  keyGenerator?: (req: any) => string
}

/**
 * 装饰器：设置接口速率限制
 */
export function RateLimit(options: RateLimitOptions) {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    if (propertyKey && descriptor) {
      Reflect.defineMetadata(RATE_LIMIT_KEY, options, descriptor.value)
    }
    else {
      Reflect.defineMetadata(RATE_LIMIT_KEY, options, target)
    }
    return descriptor
  }
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name)
  private readonly reflector = new Reflector()

  constructor(private readonly redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rateLimitOptions = this.reflector.getAllAndOverride<RateLimitOptions | undefined>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    )

    if (!rateLimitOptions) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const { ttl, limit, keyGenerator } = rateLimitOptions

    // 生成限流键
    const key = keyGenerator
      ? keyGenerator(request)
      : this.getDefaultKey(request)

    const redisKey = `rate_limit:${key}`

    try {
      // 使用 Lua 脚本原子性地递增计数器并设置过期时间
      const luaScript = `
        local count = redis.call("INCR", KEYS[1])
        if tonumber(count) == 1 then
          redis.call("EXPIRE", KEYS[1], ARGV[1])
        end
        return count
      `

      const count = (await this.redisService.eval(
        luaScript,
        1,
        redisKey,
        ttl.toString(),
      )) as number

      // 设置响应头
      const response = context.switchToHttp().getResponse()
      response.setHeader('X-RateLimit-Limit', limit.toString())
      response.setHeader('X-RateLimit-Reset', (Date.now() + ttl * 1000).toString())

      // 检查是否超过限制
      if (count > limit) {
        response.setHeader('X-RateLimit-Remaining', '0')
        this.logger.warn(`Rate limit exceeded for key: ${key}, count: ${count}, limit: ${limit}`)
        throw new AppException(
          ResponseCode.TooManyRequests,
          { ttl },
        )
      }

      response.setHeader('X-RateLimit-Remaining', (limit - count).toString())

      return true
    }
    catch (error) {
      if (error instanceof AppException) {
        throw error
      }
      this.logger.error(`Rate limit check failed: ${error}`)
      // 如果Redis出错，允许请求通过（优雅降级）
      return true
    }
  }

  private getDefaultKey(request: any): string {
    // 优先使用用户ID，其次使用IP地址
    const userId = request.user?.id
    const ip = this.getClientIp(request)
    const path = request.route?.path || request.url

    return userId ? `user:${userId}:${path}` : `ip:${ip}:${path}`
  }

  private getClientIp(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0]
      || request.headers['x-real-ip']
      || request.connection?.remoteAddress
      || request.socket?.remoteAddress
      || 'unknown'
    )
  }
}
