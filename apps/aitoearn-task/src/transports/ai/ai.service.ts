import { Injectable, Logger } from '@nestjs/common'
import {
  CreateJimengImageTaskDto,
  GenerateFireflycardDto,
  GenerateHtmlDto,
  GenerateImageFromTextDto,
  GenerateImageReviewDto,
  GenerateMarkdownDto,
  GenerateReviewReplyDto,
  GenerateTextDto,
  GenerateTextReviewDto,
  GenerateVideoTitleDto,
  GetJimengTaskResultDto,
  GetMarkdownResultDto,
  ImageResponseVo,
  JimengTaskResultVo,
  TextReplyVo,
  TextResponseVo,
  TextReviewVo,
} from './ai.interface'

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name)
  constructor(
  ) {
  }

  private async sendMessage<T = unknown>(pattern: string, data: unknown): Promise<T> {
    // const path = `${this.prefix}.${pattern}`
    // const ret = this.client.send<{
    //   code: number
    //   message: string
    //   data: T
    //   timestamp: number
    // }>(path, data)

    // try {
    //   const res = await lastValueFrom(ret)
    //   if (res.code !== ExceptionCode.Success) {
    //     throw new AppException(res.code, res.message)
    //   }
    //   return res.data
    // }
    // catch (error) {
    //   this.logger.error(`-------- nats --${path}-- message error ------`, error)
    //   this.logger.debug(error, `-------- nats --${path}-- message error ------`)

    //   throw new AppException(ExceptionCode.SendNatsMessageError)
    // }
    this.logger.debug(pattern, data)

    return null as unknown as T
  }

  async generateText(request: GenerateTextDto) {
    return this.sendMessage<TextResponseVo>('ai.text.generate', request)
  }

  async generateTextReview(request: GenerateTextReviewDto) {
    return this.sendMessage<TextReviewVo>('ai.text.generateTextReview', request)
  }

  async generateImageReview(request: GenerateImageReviewDto) {
    return this.sendMessage<TextReviewVo>('ai.text.generateImageReview', request)
  }

  async generateReviewReply(request: GenerateReviewReplyDto) {
    return this.sendMessage<TextReplyVo>('ai.text.generateReviewReply', request)
  }

  async generateVideoTitle(request: GenerateVideoTitleDto) {
    return this.sendMessage<string>('ai.text.generateVideoTitle', request)
  }

  async generateHtml(request: GenerateHtmlDto) {
    return this.sendMessage<string>('ai.text.generateHtml', request)
  }

  async generateMarkdown(request: GenerateMarkdownDto) {
    return this.sendMessage<string>('ai.text.generateMarkdown', request)
  }

  async getMarkdownResult(request: GetMarkdownResultDto) {
    return this.sendMessage<string>('ai.text.getMarkdownResult', request)
  }

  async generateFireflycard(request: GenerateFireflycardDto) {
    return this.sendMessage<string>('ai.image.generateFireflycard', request)
  }

  async createJimengImageTask(request: CreateJimengImageTaskDto) {
    return this.sendMessage<string>('ai.image.createJimengTask', request)
  }

  async getJimengTaskResult(request: GetJimengTaskResultDto) {
    return this.sendMessage<JimengTaskResultVo>('ai.image.getJimengTaskResult', request)
  }

  async generateImageFromText(request: GenerateImageFromTextDto) {
    return this.sendMessage<ImageResponseVo>('ai.image.generateFromText', request)
  }
}
