import { Injectable, Logger } from '@nestjs/common'
import { AxiosRequestConfig } from 'axios'
import { InternalApi } from '../api'
import { ChatCompletionVo, UserChatCompletionDto } from './ai.interface'

@Injectable()
export class AIInternalApi extends InternalApi {
  override logger = new Logger(AIInternalApi.name)

  constructor() {
    super()
  }

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
