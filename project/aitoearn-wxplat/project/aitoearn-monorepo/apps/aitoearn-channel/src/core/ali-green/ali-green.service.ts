import { Injectable } from '@nestjs/common'
import { AliGreenApiService } from '../../libs/ali-green/ali-green-api.service'

@Injectable()
export class AliGreenService {
  constructor(
    private readonly aliGreenApiService: AliGreenApiService,
  ) {}

  async textGreen(content: string) {
    const result = await this.aliGreenApiService.textGreen(content)
    return result?.body?.data || {}
  }

  async imgGreen(imageUrl: string) {
    const result = await this.aliGreenApiService.imgGreen(imageUrl)
    return result?.body?.data || {}
  }

  async videoGreen(url: string) {
    const result = await this.aliGreenApiService.videoGreen(url)
    return result?.body?.data || {}
  }

  async getVideoResult(taskId: string) {
    const result = await this.aliGreenApiService.getVideoResult(taskId)
    return result?.body?.data || {}
  }
}
