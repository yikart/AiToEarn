import type { PublishRecord } from '@yikart/mongodb'
import type { Request, Response } from 'express'
import type { PlatformWebhookHandler, RawBodyRequest } from '../platforms.interface'
import type { TikTokContentPostingWebhookBody, TikTokContentPostingWebhookContent } from './tiktok.interface'
import type { TikTokPublishDataOption } from './tiktok.schema'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { Injectable, Logger, Optional } from '@nestjs/common'
import { AccountType, getCodeMessage, getLocale, ResponseCode } from '@yikart/common'
import { PublishRecordRepository } from '@yikart/mongodb'
import { z } from 'zod'
import { PublishStateService } from '../../publish/tasks/publish-state.service'
import { PlatformErrorCategory } from '../platforms.exception'
import { TiktokConfig } from './tiktok.config'
import { TikTokContentPostingEvent, TikTokContentPostingPublishType } from './tiktok.interface'
import { TikTokContentPath, TikTokPublishDataOptionSchema } from './tiktok.schema'

const TikTokPublishContentSchema = z.object({
  publish_id: z.string(),
  publish_type: z.enum(TikTokContentPostingPublishType).optional(),
  post_id: z.string().optional(),
  reason: z.string().optional(),
}).strict()

const TikTokContentPostingWebhookBodySchema = z.object({
  client_key: z.string(),
  event: z.enum(TikTokContentPostingEvent),
  create_time: z.number().int(),
  user_openid: z.string(),
  content: z.string(),
})

type PersistedPublishDataOption = PublishRecord['dataOption']

interface TikTokWebhookChallengeQuery {
  challenge?: string
}

@Injectable()
export class TikTokWebhookProvider implements PlatformWebhookHandler {
  private readonly logger = new Logger(TikTokWebhookProvider.name)

  constructor(
    private readonly config: TiktokConfig,
    @Optional() private readonly publishRecordRepo?: PublishRecordRepository,
    @Optional() private readonly stateService?: PublishStateService,
  ) {}

  async handle(request: Request, response: Response): Promise<void> {
    if (request.method === 'GET') {
      const query = request.query as TikTokWebhookChallengeQuery
      response.status(query.challenge ? 200 : 404).send(query.challenge ?? '')
      return
    }
    if (!this.verify(request)) {
      this.logger.warn({ platform: AccountType.TikTok }, 'TikTok webhook signature invalid')
      response.status(401).json({ status: 'invalid_signature' })
      return
    }
    const body = this.parseTikTokBody(request)
    if (!body) {
      response.status(200).json({ status: 'ok' })
      return
    }
    await this.applyTikTokPublishResult(body)
    response.status(200).json({ status: 'ok' })
  }

  private verify(request: RawBodyRequest): boolean {
    const rawBody = request.rawBody
    const signatureHeader = this.getHeader(request, 'tiktok-signature')
      ?? this.getHeader(request, 'x-tiktok-signature')
      ?? this.getHeader(request, 'x-tt-signature')
    if (!signatureHeader || !rawBody || !this.config.clientSecret) {
      return false
    }

    const parts = Object.fromEntries(
      signatureHeader
        .split(',')
        .map(part => part.trim().split('='))
        .filter(([key, value]) => key && value)
        .map(([key, value]) => [key, value]),
    )
    const timestamp = parts['t']
    const signature = parts['s']
    if (!timestamp || !signature) {
      return false
    }

    const timestampSeconds = Number(timestamp)
    if (Number.isNaN(timestampSeconds)) {
      return false
    }
    const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - timestampSeconds)
    if (ageSeconds > 5 * 60) {
      return false
    }

    const expected = createHmac('sha256', this.config.clientSecret)
      .update(`${timestamp}.${rawBody.toString('utf8')}`)
      .digest('hex')
    return this.safeEqual(signature, expected)
  }

  private parseTikTokBody(request: Request): TikTokContentPostingWebhookBody | undefined {
    const parsed = TikTokContentPostingWebhookBodySchema.safeParse(request.body)
    if (!parsed.success) {
      this.logger.warn({ platform: AccountType.TikTok }, 'TikTok webhook body invalid')
      return undefined
    }
    return parsed.data
  }

  private parseTikTokContent(body: TikTokContentPostingWebhookBody): TikTokContentPostingWebhookContent | undefined {
    try {
      const parsed = TikTokPublishContentSchema.safeParse(JSON.parse(body.content))
      if (!parsed.success) {
        this.logger.warn({ platform: AccountType.TikTok, event: body.event }, 'TikTok webhook content invalid')
        return undefined
      }
      return parsed.data
    }
    catch (err) {
      this.logger.warn(err, 'Failed to parse TikTok webhook content')
      return undefined
    }
  }

  private async applyTikTokPublishResult(body: TikTokContentPostingWebhookBody): Promise<void> {
    const content = this.parseTikTokContent(body)
    const publishId = content?.publish_id
    if (!publishId || !this.publishRecordRepo || !this.stateService) {
      return
    }
    const record = await this.publishRecordRepo.getByAccountTypeAndPlatformWorkId(AccountType.TikTok, publishId)
    if (!record?.id) {
      this.logger.warn({ platform: AccountType.TikTok, publishId }, 'TikTok webhook publish record not found')
      return
    }
    if (body.event === TikTokContentPostingEvent.PostPublishFailed) {
      await this.stateService.markFailed(record.id, {
        category: PlatformErrorCategory.WebhookInvalid,
        code: body.event,
        message: content.reason
          ?? getCodeMessage(ResponseCode.ChannelWebhookPublishFailed, { platform: AccountType.TikTok }, getLocale()),
        originalData: content,
        retryable: false,
        occurredAt: new Date(),
      })
      return
    }

    if (
      body.event === TikTokContentPostingEvent.PostPublishComplete
      || body.event === TikTokContentPostingEvent.PostPublishInboxDelivered
    ) {
      this.logger.log({ platform: AccountType.TikTok, publishId, event: body.event }, 'TikTok publish not publicly available yet')
      return
    }

    if (body.event !== TikTokContentPostingEvent.PostPublishPubliclyAvailable) {
      this.logger.log({ platform: AccountType.TikTok, publishId, event: body.event }, 'TikTok webhook event ignored')
      return
    }

    const platformWorkId = content.post_id
    if (!platformWorkId) {
      this.logger.warn({ platform: AccountType.TikTok, publishId }, 'TikTok webhook missing final post id')
      return
    }

    const dataOption = this.parseDataOption(record.dataOption)
    const permalink = this.buildWorkLink(
      dataOption?.username,
      dataOption?.contentPath ?? TikTokContentPath.Video,
      platformWorkId,
    )
    if (!permalink) {
      this.logger.warn({ platform: AccountType.TikTok, publishId, platformWorkId }, 'TikTok webhook missing work link')
      return
    }

    await this.stateService.markPublished(record.id, {
      platformWorkId,
      permalink,
      dataOption: this.buildDataOption(dataOption, publishId, platformWorkId, body),
    })
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

  private parseDataOption(dataOption: PersistedPublishDataOption): TikTokPublishDataOption | undefined {
    const parsed = TikTokPublishDataOptionSchema.safeParse(dataOption)
    return parsed.success ? parsed.data : undefined
  }

  private buildDataOption(
    current: TikTokPublishDataOption | undefined,
    publishId: string,
    finalPostId: string,
    body: TikTokContentPostingWebhookBody,
  ): TikTokPublishDataOption {
    const dataOption: TikTokPublishDataOption = {
      publishId,
      contentPath: current?.contentPath ?? TikTokContentPath.Video,
      finalPostId,
      webhookEvent: body.event,
      webhookCreateTime: body.create_time,
      webhookUserOpenId: body.user_openid,
    }
    if (current?.source) {
      dataOption.source = current.source
    }
    if (current?.username) {
      dataOption.username = current.username
    }
    return dataOption
  }

  private buildWorkLink(username: string | undefined, contentPath: TikTokContentPath, postId: string): string | undefined {
    const normalizedUsername = username?.replace(/^@/, '').trim()
    return normalizedUsername
      ? `https://www.tiktok.com/@${normalizedUsername}/${contentPath}/${postId}`
      : undefined
  }
}
