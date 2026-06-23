import type { PublishRecord } from '@yikart/mongodb'
import type { Request, Response } from 'express'
import type { PlatformWebhookHandler, RawBodyRequest } from '../platforms.interface'
import type {
  BilibiliPublishDataOption,
  BilibiliPublishVideoWebhookBody,
  BilibiliVideoFailWebhookBody,
  BilibiliVideoOpenWebhookBody,
  BilibiliWebhookBody,
} from './bilibili.interface'
import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { Injectable, Logger, Optional } from '@nestjs/common'
import { AccountType, getCodeMessage, getLocale, ResponseCode } from '@yikart/common'
import { PublishRecordRepository } from '@yikart/mongodb'
import { PublishStateService } from '../../publish/tasks/publish-state.service'
import { PlatformErrorCategory } from '../platforms.exception'
import { BilibiliConfig } from './bilibili.config'
import { BILIBILI_PUBLIC_VIDEO_ID_PATTERN } from './bilibili.constants'
import {
  BilibiliPublishDataOptionSchema,
  BilibiliWebhookBodySchema,
  BilibiliWebhookEvent,
} from './bilibili.interface'

type PersistedPublishDataOption = PublishRecord['dataOption']

@Injectable()
export class BilibiliWebhookProvider implements PlatformWebhookHandler {
  private readonly logger = new Logger(BilibiliWebhookProvider.name)

  constructor(
    private readonly config: BilibiliConfig,
    @Optional() private readonly publishRecordRepo?: PublishRecordRepository,
    @Optional() private readonly stateService?: PublishStateService,
  ) {}

  async handle(request: Request, response: Response): Promise<void> {
    const verified = this.verify(request)
    this.logger.log({ platform: AccountType.Bilibili, verified }, 'Bilibili webhook received')
    if (!verified) {
      response.status(401).json({ code: -1, message: getCodeMessage(ResponseCode.ChannelWebhookInvalidSignature, undefined, getLocale()) })
      return
    }

    const body = this.parseBilibiliBody(request.body)
    if (!body) {
      response.status(200).json({ code: 0, message: 'ok' })
      return
    }
    if (body.event === BilibiliWebhookEvent.VerifyWebhooks) {
      response.status(200).json({ data: body.content.data })
      return
    }

    await this.applyBilibiliPublishResult(body)
    response.status(200).json({ code: 0, message: 'ok' })
  }

  private verify(request: RawBodyRequest): boolean {
    const rawBody = request.rawBody
    const authorization = this.getHeader(request, 'authorization')
    const contentMd5 = this.getHeader(request, 'x-bili-content-md5')
    const accessKeyId = this.getHeader(request, 'x-bili-accesskeyid')
    const signatureMethod = this.getHeader(request, 'x-bili-signature-method')
    const signatureNonce = this.getHeader(request, 'x-bili-signature-nonce')
    const signatureVersion = this.getHeader(request, 'x-bili-signature-version')
    const timestamp = this.getHeader(request, 'x-bili-timestamp')
    if (
      !authorization
      || !contentMd5
      || !accessKeyId
      || !signatureMethod
      || !signatureNonce
      || !signatureVersion
      || !timestamp
      || !rawBody
      || !this.config.clientSecret
      || accessKeyId !== this.config.clientId
    ) {
      return false
    }

    const expectedMd5 = createHash('md5').update(rawBody).digest('hex')
    if (!this.safeEqual(contentMd5, expectedMd5)) {
      return false
    }

    const signaturePayload = [
      ['x-bili-accesskeyid', accessKeyId],
      ['x-bili-content-md5', contentMd5],
      ['x-bili-signature-method', signatureMethod],
      ['x-bili-signature-nonce', signatureNonce],
      ['x-bili-signature-version', signatureVersion],
      ['x-bili-timestamp', timestamp],
    ]
      .map(([key, value]) => `${key}:${value}`)
      .join('\n')
    const expected = createHmac('sha256', this.config.clientSecret)
      .update(signaturePayload)
      .digest('hex')
    return this.safeEqual(authorization.replace(/^HMAC-SHA256\s+/i, ''), expected)
  }

  private parseBilibiliBody(value: unknown): BilibiliWebhookBody | undefined {
    const parsed = BilibiliWebhookBodySchema.safeParse(value)
    if (parsed.success) {
      return parsed.data
    }

    this.logger.warn({
      platform: AccountType.Bilibili,
      issues: parsed.error.issues,
    }, 'Bilibili webhook body invalid')
    return undefined
  }

  private async applyBilibiliPublishResult(body: BilibiliWebhookBody): Promise<void> {
    if (body.event === BilibiliWebhookEvent.VideoFail) {
      await this.applyVideoFail(body)
      return
    }

    if (body.event === BilibiliWebhookEvent.VideoOpen) {
      await this.applyVideoOpen(body)
      return
    }

    if (body.event === BilibiliWebhookEvent.PublishVideo) {
      await this.applyPublishVideo(body)
    }
  }

  private async applyVideoOpen(body: BilibiliVideoOpenWebhookBody): Promise<void> {
    const lookupId = body.content.resource_id
    const platformWorkId = this.resolvePublicVideoId(body.content.resource_id)

    if (!platformWorkId) {
      this.logger.warn({ platform: AccountType.Bilibili, lookupId }, 'Bilibili video_open missing public video id')
      return
    }

    await this.markPublishedByLookupId(lookupId, platformWorkId, {
      resourceId: lookupId,
      finalVideoId: platformWorkId,
      webhook: body,
    })
  }

  private async applyPublishVideo(body: BilibiliPublishVideoWebhookBody): Promise<void> {
    const lookupId = body.content.share_id
    const platformWorkId = this.resolvePublicVideoId(body.content.video_id)

    if (!platformWorkId) {
      this.logger.warn({ platform: AccountType.Bilibili, lookupId }, 'Bilibili publish_video missing public video id')
      return
    }

    await this.markPublishedByLookupId(lookupId, platformWorkId, {
      shareId: lookupId,
      finalVideoId: platformWorkId,
      webhook: body,
    })
  }

  private async markPublishedByLookupId(
    lookupId: string,
    platformWorkId: string,
    incomingDataOption: BilibiliPublishDataOption,
  ): Promise<void> {
    if (!this.publishRecordRepo || !this.stateService) {
      this.logger.warn({ platform: AccountType.Bilibili, lookupId, platformWorkId }, 'Bilibili webhook handler missing dependencies')
      return
    }

    const record = await this.publishRecordRepo.getByAccountTypeAndPlatformWorkId(AccountType.Bilibili, lookupId)
    if (!record?.id) {
      this.logger.warn({ platform: AccountType.Bilibili, lookupId, platformWorkId }, 'Bilibili webhook publish record not found')
      return
    }

    const dataOption = this.parseDataOption(record.dataOption)

    await this.stateService.markPublished(record.id, {
      platformWorkId,
      permalink: this.buildWorkLink(platformWorkId),
      dataOption: {
        ...dataOption,
        ...incomingDataOption,
      },
    })
  }

  private async applyVideoFail(body: BilibiliVideoFailWebhookBody): Promise<void> {
    const lookupId = body.content.resource_id
    if (!this.publishRecordRepo || !this.stateService) {
      this.logger.warn({ platform: AccountType.Bilibili, lookupId }, 'Bilibili webhook handler missing dependencies')
      return
    }

    const record = await this.publishRecordRepo.getByAccountTypeAndPlatformWorkId(AccountType.Bilibili, lookupId)
    if (!record?.id) {
      this.logger.warn({ platform: AccountType.Bilibili, lookupId }, 'Bilibili webhook publish record not found')
      return
    }

    await this.stateService.markFailed(record.id, {
      category: PlatformErrorCategory.WebhookInvalid,
      message: body.content.state_desc
        || getCodeMessage(ResponseCode.ChannelWebhookPublishFailed, { platform: AccountType.Bilibili }, getLocale()),
      retryable: false,
      occurredAt: new Date(),
    })
  }

  private parseDataOption(dataOption: PersistedPublishDataOption): BilibiliPublishDataOption {
    const parsed = BilibiliPublishDataOptionSchema.safeParse(dataOption ?? {})
    if (parsed.success) {
      return parsed.data
    }

    this.logger.warn({
      platform: AccountType.Bilibili,
      issues: parsed.error.issues,
    }, 'Bilibili publish dataOption invalid')
    return {}
  }

  private resolvePublicVideoId(value: string): string | undefined {
    const trimmed = value.trim()
    return BILIBILI_PUBLIC_VIDEO_ID_PATTERN.test(trimmed) ? trimmed : undefined
  }

  private buildWorkLink(videoId: string): string {
    return `https://www.bilibili.com/video/${videoId}`
  }

  private getHeader(request: Request, key: string): string | undefined {
    const value = Object.entries(request.headers).find(([name]) => name.toLowerCase() === key)?.[1]
    return Array.isArray(value) ? value[0] : value
  }

  private safeEqual(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left)
    const rightBuffer = Buffer.from(right)
    return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
  }
}
