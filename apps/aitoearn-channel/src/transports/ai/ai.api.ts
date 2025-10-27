import { Injectable, Logger } from '@nestjs/common'
import { ChatCompletionVo, UserChatCompletionDto } from '@yikart/aitoearn-ai-client'
import { AxiosRequestConfig } from 'axios'
import { InternalApi } from '../api'

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
