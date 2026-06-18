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
    const randomBytes = crypto.randomBytes(length)
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars[randomBytes[i] % chars.length]
    }
    return result
  }

  async create(originalUrl: string): Promise<string> {
    const code = this.generateCode()

    await this.redisService.saveShortLink(code, originalUrl)

    return `${config.channel.shortLink.baseUrl}${code}`
  }

  async getByCode(code: string): Promise<string> {
    const originalUrl = await this.redisService.getShortLink(code)

    if (!originalUrl) {
      throw new AppException(ResponseCode.ShortLinkNotFound)
    }

    return originalUrl
  }
}
