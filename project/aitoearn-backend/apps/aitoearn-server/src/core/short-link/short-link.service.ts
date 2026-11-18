import crypto from 'node:crypto'
import { Injectable, Logger } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import { ServerRedisService } from '../../common/redis'
import { config } from '../../config'

@Injectable()
export class ShortLinkService {
  private readonly logger = new Logger(ShortLinkService.name)

  constructor(
    private readonly redisService: ServerRedisService,
  ) {}

  private generateCode(length = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    while (result.length < length) {
      const bytes = crypto.randomBytes(length - result.length)
      for (const byte of bytes) {
        // Reject the incomplete modulo range to keep every character equally likely.
        if (byte < 248) {
          result += chars[byte % chars.length]
          if (result.length === length) {
            break
          }
        }
      }
    }
    return result
  }

  async create(originalUrl: string): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = this.generateCode()
      if (await this.redisService.saveShortLink(code, originalUrl)) {
        return `${config.channel.shortLink.baseUrl}${code}`
      }
    }

    this.logger.error('Failed to allocate a unique short-link code after 5 attempts')
    throw new Error('Failed to create short link')
  }

  async getByCode(code: string): Promise<string> {
    const originalUrl = await this.redisService.getShortLink(code)

    if (!originalUrl) {
      throw new AppException(ResponseCode.ShortLinkNotFound)
    }

    return originalUrl
  }
}
