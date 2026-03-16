import crypto from 'node:crypto'
import { Injectable, Logger } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import { RedisService } from '@yikart/redis'
import { config } from '../../config'

const SHORT_LINK_PREFIX = 'server:shortLink:'
const DEFAULT_EXPIRE_SECONDS = 60 * 60 * 24 * 1 // 7 days

@Injectable()
export class ShortLinkService {
  private readonly logger = new Logger(ShortLinkService.name)

  constructor(
    private readonly redisService: RedisService,
  ) {}

  private generateCode(length = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const randomBytes = crypto.randomBytes(length)
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars[randomBytes[i] % chars.length]
    }
    return result
  }

  private getCacheKey(code: string): string {
    return `${SHORT_LINK_PREFIX}${code}`
  }

  async create(
    originalUrl: string,
    options?: {
      expiresInSeconds?: number
    },
  ): Promise<string> {
    const code = this.generateCode()
    const expireSeconds = options?.expiresInSeconds ?? DEFAULT_EXPIRE_SECONDS

    await this.redisService.set(
      this.getCacheKey(code),
      originalUrl,
      expireSeconds,
    )

    return `${config.channel.shortLink.baseUrl}${code}`
  }

  async getByCode(code: string): Promise<string> {
    const originalUrl = await this.redisService.get(this.getCacheKey(code))

    if (!originalUrl) {
      throw new AppException(ResponseCode.ShortLinkNotFound)
    }

    return originalUrl
  }
}
