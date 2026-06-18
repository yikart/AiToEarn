import type { Request, Response } from 'express'
import type { PlatformWebhookHandler, RawBodyRequest } from '../platforms.interface'
import type { InstagramWebhookBody, InstagramWebhookChange } from './instagram.interface'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { Injectable, Logger, Optional } from '@nestjs/common'
import { AccountType, getCodeMessage, getLocale, ResponseCode } from '@yikart/common'
import { PublishRecordRepository } from '@yikart/mongodb'
import { PublishStateService } from '../../publish/tasks/publish-state.service'
import { PlatformErrorCategory } from '../platforms.exception'
import { InstagramConfig } from './instagram.config'
import {
  InstagramWebhookChangeField,
  InstagramWebhookMediaStatus,
  InstagramWebhookObject,
} from './instagram.interface'
import { InstagramPublishDataOptionSchema, InstagramWebhookBodySchema } from './instagram.schema'

interface InstagramWebhookChallengeQuery {
  'hub.mode'?: string
  'hub.verify_token'?: string
  'hub.challenge'?: string
}

@Injectable()
export class InstagramWebhookProvider implements PlatformWebhookHandler {
  private readonly logger = new Logger(InstagramWebhookProvider.name)

  constructor(
    private readonly config: InstagramConfig,
    @Optional() private readonly publishRecordRepo?: PublishRecordRepository,
    @Optional() private readonly stateService?: PublishStateService,
  ) {}

  async handle(request: Request, response: Response): Promise<void> {
    if (request.method === 'GET') {
      this.handleChallenge(request, response)
      return
    }
    if (!this.verify(request)) {
      this.logger.warn({ platform: AccountType.Instagram }, 'Instagram webhook signature invalid')
      response.status(401).send(getCodeMessage(ResponseCode.ChannelWebhookInvalidSignature, undefined, getLocale()))
      return
    }
    const body = this.parseMetaBody(request)
    if (!body) {
      response.status(200).send('EVENT_RECEIVED')
      return
    }
    if (body.object && body.object !== InstagramWebhookObject.Instagram) {
      response.status(200).send('EVENT_RECEIVED')
      return
    }
    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        await this.applyInstagramChange(change)
      }
    }
    response.status(200).send('EVENT_RECEIVED')
  }

  private handleChallenge(request: Request, response: Response): void {
    const {
      'hub.mode': mode,
      'hub.verify_token': verifyToken,
      'hub.challenge': challenge,
    } = request.query as InstagramWebhookChallengeQuery
    if (
      mode === 'subscribe'
      && verifyToken === this.config.webhookVerifyToken
      && challenge
    ) {
      response.status(200).send(challenge)
      return
    }
    response.status(403).send(getCodeMessage(ResponseCode.ChannelWebhookInvalidVerifyToken, undefined, getLocale()))
  }

  private verify(request: RawBodyRequest): boolean {
    const rawBody = request.rawBody
    const signature = this.getHeader(request, 'x-hub-signature-256')
    if (!signature?.startsWith('sha256=') || !rawBody || !this.config.clientSecret) {
      return false
    }

    const expected = `sha256=${createHmac('sha256', this.config.clientSecret).update(rawBody).digest('hex')}`
    return this.safeEqual(signature, expected)
  }

  private parseMetaBody(request: Request): InstagramWebhookBody | null {
    const result = InstagramWebhookBodySchema.safeParse(request.body)
    if (!result.success) {
      this.logger.warn(
        { platform: AccountType.Instagram, issues: result.error.issues },
        'Instagram webhook body ignored because it does not match known payload fields',
      )
      return null
    }
    return result.data
  }

  private async applyInstagramChange(change: InstagramWebhookChange): Promise<void> {
    if (change.field !== InstagramWebhookChangeField.Media) {
      return
    }
    const platformWorkId = change.value.media_id ?? change.value.id
    if (!platformWorkId || change.value.comment_id || !this.publishRecordRepo || !this.stateService)
      return

    const record = await this.publishRecordRepo.getByAccountTypeAndPlatformWorkId(AccountType.Instagram, platformWorkId)
    if (!record?.id) {
      this.logger.warn({ platform: AccountType.Instagram, platformWorkId }, 'Instagram webhook publish record not found')
      return
    }
    if (change.value.status === InstagramWebhookMediaStatus.Error) {
      await this.stateService.markFailed(record.id, {
        category: PlatformErrorCategory.WebhookInvalid,
        message: getCodeMessage(ResponseCode.ChannelWebhookPublishFailed, { platform: AccountType.Instagram }, getLocale()),
        retryable: false,
        occurredAt: new Date(),
      })
      return
    }
    const permalink = change.value.permalink
    if (!permalink) {
      this.logger.warn({ platform: AccountType.Instagram, platformWorkId }, 'Instagram webhook missing media permalink')
      return
    }
    const dataOption = InstagramPublishDataOptionSchema.parse({
      webhook: {
        field: change.field,
        ...(change.value.id && { id: change.value.id }),
        mediaId: platformWorkId,
        ...(change.value.status && { status: change.value.status }),
        permalink,
      },
    })
    await this.stateService.markPublished(record.id, {
      platformWorkId,
      permalink,
      dataOption,
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
}
