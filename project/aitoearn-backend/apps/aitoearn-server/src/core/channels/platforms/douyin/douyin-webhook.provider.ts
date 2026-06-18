import type { Request, Response } from 'express'
import type { PlatformWebhookHandler, RawBodyRequest } from '../platforms.interface'
import type { DouyinCreateVideoWebhookBody, DouyinDataOption, DouyinWebhookBody } from './douyin.interface'
import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { Injectable, Logger, Optional } from '@nestjs/common'
import { AccountType, getCodeMessage, getLocale, ResponseCode } from '@yikart/common'
import { PublishRecordRepository } from '@yikart/mongodb'
import { PublishStateService } from '../../publish/tasks/publish-state.service'
import { DouyinConfig } from './douyin.config'
import { buildDouyinVideoWorkLink, DouyinWebhookBodySchema, DouyinWebhookEvent } from './douyin.interface'

@Injectable()
export class DouyinWebhookProvider implements PlatformWebhookHandler {
  private readonly logger = new Logger(DouyinWebhookProvider.name)

  constructor(
    private readonly config: DouyinConfig,
    @Optional() private readonly publishRecordRepo?: PublishRecordRepository,
    @Optional() private readonly stateService?: PublishStateService,
  ) {}

  async handle(request: Request, response: Response): Promise<void> {
    if (!this.verify(request)) {
      this.logger.warn({ platform: AccountType.Douyin }, 'Douyin webhook signature invalid')
      response.status(401).json({ code: -1, message: getCodeMessage(ResponseCode.ChannelWebhookInvalidSignature, undefined, getLocale()) })
      return
    }

    const body = this.parseWebhookBody(request.body)
    if (!body) {
      response.status(200).json({ code: 0, message: 'ok' })
      return
    }

    if (body.event === DouyinWebhookEvent.VerifyWebhook) {
      response.status(200).json({ challenge: body.content.challenge })
      return
    }

    if (body.event === DouyinWebhookEvent.CreateVideo) {
      await this.applyCreateVideoResult(body)
      response.status(200).json({ code: 0, message: 'ok' })
      return
    }

    const logContext: { platform: AccountType, event: DouyinWebhookEvent, msgId?: string } = {
      platform: AccountType.Douyin,
      event: body.event,
    }
    const msgId = this.getHeader(request, 'msg-id')
    if (msgId) {
      logContext.msgId = msgId
    }
    this.logger.log(logContext, 'Douyin webhook event acknowledged')
    response.status(200).json({ code: 0, message: 'ok' })
  }

  private async applyCreateVideoResult(
    body: DouyinCreateVideoWebhookBody,
  ): Promise<void> {
    const { share_id: shareId, item_id: itemId, video_id: platformWorkId } = body.content
    if (!shareId || !this.publishRecordRepo || !this.stateService) {
      this.logger.warn({ platform: AccountType.Douyin, shareId }, 'Douyin webhook event cannot be matched')
      return
    }
    if (!platformWorkId) {
      this.logger.warn({ platform: AccountType.Douyin, shareId }, 'Douyin webhook missing final video id')
      return
    }

    const record = await this.publishRecordRepo.getByAccountTypeAndPlatformWorkId(AccountType.Douyin, shareId)
      ?? await this.publishRecordRepo.getByAccountTypeAndDataId(AccountType.Douyin, shareId)
    if (!record?.id) {
      this.logger.warn({ platform: AccountType.Douyin, shareId }, 'Douyin webhook publish record not found')
      return
    }

    const workLink = buildDouyinVideoWorkLink(platformWorkId)
    const dataOption: DouyinDataOption = {
      shareId,
      itemId,
      workLink,
      webhook: body,
      videoId: platformWorkId,
    }

    await this.stateService.markPublished(record.id, {
      platformWorkId,
      permalink: workLink,
      dataOption,
    })
  }

  private parseWebhookBody(value: unknown): DouyinWebhookBody | undefined {
    const parsed = DouyinWebhookBodySchema.safeParse(value)
    if (!parsed.success) {
      this.logger.warn({
        platform: AccountType.Douyin,
        issues: parsed.error.issues,
      }, 'Douyin webhook body invalid')
      return undefined
    }
    return parsed.data
  }

  private verify(request: RawBodyRequest): boolean {
    const rawBody = request.rawBody
    const signature = this.getHeader(request, 'x-douyin-signature')
      ?? this.getHeader(request, 'x-open-signature')
      ?? this.getHeader(request, 'x-tt-signature')
      ?? this.getQueryString(request, 'signature')
    if (!signature || !rawBody || !this.config.clientSecret) {
      return false
    }

    const normalizedSignature = signature.replace(/^(sha1|sha256)=/, '')
    const rawText = rawBody.toString('utf8')
    return this.safeEqual(normalizedSignature, createHash('sha1').update(`${this.config.clientSecret}${rawText}`).digest('hex'))
      || this.safeEqual(normalizedSignature, createHmac('sha256', this.config.clientSecret).update(rawBody).digest('hex'))
  }

  private getHeader(request: Request, key: string): string | undefined {
    const value = Object.entries(request.headers).find(([name]) => name.toLowerCase() === key)?.[1]
    return Array.isArray(value) ? value[0] : value
  }

  private getQueryString(request: Request, key: string): string | undefined {
    const value = request.query[key]
    if (Array.isArray(value)) {
      const first = value[0]
      return typeof first === 'string' ? first : undefined
    }
    return typeof value === 'string' ? value : undefined
  }

  private safeEqual(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left)
    const rightBuffer = Buffer.from(right)
    return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
  }
}
