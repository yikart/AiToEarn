import { Injectable, Logger } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import axios from 'axios'
import { Md2cardConfig } from './md2card.config'
import { GenerateCardParams, GenerateCardResult } from './md2card.interface'

@Injectable()
export class Md2cardService {
  private readonly logger = new Logger(Md2cardService.name)
  private readonly baseUrl: string
  private readonly apiKey: string
  private readonly timeout: number

  constructor(private readonly config: Md2cardConfig) {
    this.baseUrl = config.baseUrl
    this.apiKey = config.apiKey
    this.timeout = config.timeout
  }

  async generateCard(params: GenerateCardParams): Promise<GenerateCardResult> {
    this.logger.debug(`调用 MD2Card API: ${this.baseUrl}/api/generate`)

    try {
      const response = await axios.post(
        `${this.baseUrl}/api/generate`,
        params,
        {
          headers: {
            'x-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
          timeout: this.timeout,
        },
      )

      return response.data
    }
    catch (error: any) {
      this.logger.error(`MD2Card API 调用失败: ${error.message}`)
      throw new AppException(ResponseCode.AiCallFailed, { error: error.message || 'Unknown error' })
    }
  }
}
