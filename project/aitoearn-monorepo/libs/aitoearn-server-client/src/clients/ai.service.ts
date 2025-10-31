import { Injectable } from '@nestjs/common'
import { UserType } from '@yikart/common'
import { AxiosRequestConfig } from 'axios'
import { ChatCompletionVo, ImageResponseVo, UserChatCompletionDto, UserImageGenerationDto } from '../interfaces'
import { BaseService } from './base.service'

@Injectable()
export class AiService extends BaseService {
  async chatCompletion(data: UserChatCompletionDto) {
    const url = `/internal/ai/chat/completion`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data,
    }
    const res = await this.request<ChatCompletionVo>(
      url,
      config,
    )
    return res
  }

  async imageGenerate(data: UserImageGenerationDto) {
    const url = `/internal/ai/image/generate`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data,
    }
    const res = await this.request<ImageResponseVo>(
      url,
      config,
    )
    return res
  }

  async getImageGenerationModels(
    data: {
      userId: string
      userType: UserType
    },
  ) {
    const url = `/internal/ai/models/image/generation`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data,
    }
    const res = await this.request(
      url,
      config,
    )
    return res
  }
}
