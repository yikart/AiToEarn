import { Injectable } from '@nestjs/common'
import { AxiosRequestConfig } from 'axios'
import { ChatCompletionVo, UserChatCompletionDto } from '../interfaces'
import { BaseService } from './base.service'

@Injectable()
export class AiService extends BaseService {
  async chatCompletion(data: UserChatCompletionDto) {
    const url = `/api/internal/ai/chat/completion`
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
}
