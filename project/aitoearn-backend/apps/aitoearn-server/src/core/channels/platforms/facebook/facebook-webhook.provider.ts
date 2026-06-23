import type { PublishRecord } from '@yikart/mongodb'
import type { Request, Response } from 'express'
import type { PlatformWebhookHandler, RawBodyRequest } from '../platforms.interface'
import type { FacebookWebhookBody, FacebookWebhookChange, FacebookWebhookFeedChange } from './facebook.interface'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { Injectable, Logger, Optional } from '@nestjs/common'
import { AccountType, getCodeMessage, getLocale, ResponseCode } from '@yikart/common'
import { PublishRecordRepository } from '@yikart/mongodb'
import { PublishStateService } from '../../publish/tasks/publish-state.service'
import { PlatformErrorCategory } from '../platforms.exception'
import { FacebookConfig } from './facebook.config'
import { FacebookVideoStatus, FacebookWebhookField, FacebookWebhookStatus } from './facebook.enum'
import { FacebookDataOptionSchema, FacebookWebhookBodySchema } from './facebook.interface'

interface FacebookWebhookChallengeQuery {
  'hub.mode'?: string
  'hub.verify_token'?: string
  'hub.challenge'?: string
}

@Injectable()
export class FacebookWebhookProvider implements PlatformWebhookHandler {
  private readonly logger = new Logger(FacebookWebhookProvider.name)

  constructor(
    private readonly config: FacebookConfig,
    @Optional() private readonly publishRecordRepo?: PublishRecordRepository,
    @Optional() private readonly stateService?: PublishStateService,
  ) {}

  async handle(request: Request, response: Response): Promise<void> {
    if (request.method === 'GET') {
      this.handleChallenge(request, response)
      return
    }

    if (!this.verifyMetaSignature(request)) {
      this.logger.warn({ platform: AccountType.Facebook }, 'Facebook webhook signature invalid')
      response.status(401).send(getCodeMessage(ResponseCode.ChannelWebhookInvalidSignature, undefined, getLocale()))
      return
    }

    const body = this.parseMetaBody(request)
    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        await this.applyFacebookChange(change)
      }
    }
    response.status(200).send('EVENT_RECEIVED')
  }

  private handleChallenge(request: Request, response: Response): void {
    const {
      'hub.mode': mode,
      'hub.verify_token': verifyToken,
      'hub.challenge': challenge,
    } = request.query as FacebookWebhookChallengeQuery
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

  private parseMetaBody(request: Request): FacebookWebhookBody {
    const parsed = FacebookWebhookBodySchema.safeParse(request.body)
    if (!parsed.success) {
      this.logger.warn({ platform: AccountType.Facebook }, 'Facebook webhook body invalid')
      return {}
    }
    return parsed.data
  }

  private async applyFacebookChange(change: FacebookWebhookChange): Promise<void> {
    if (change.field !== FacebookWebhookField.Feed || change.value.comment_id) {
      this.logger.log({ platform: AccountType.Facebook }, 'Facebook webhook event ignored')
      return
    }
    if (!this.publishRecordRepo || !this.stateService) {
      return
    }
    const feedChange = change
    const candidateIds = this.getCandidateWorkIds(feedChange)
    if (candidateIds.length === 0) {
      this.logger.log({ platform: AccountType.Facebook }, 'Facebook webhook event ignored')
      return
    }
    const record = await this.getPublishRecordByCandidateIds(candidateIds)
    if (!record?.id) {
      this.logger.warn({ platform: AccountType.Facebook, candidateIds }, 'Facebook webhook publish record not found')
      return
    }
    if (change.value.status === FacebookWebhookStatus.Failed || change.value.video_status === FacebookVideoStatus.Error) {
      await this.stateService.markFailed(record.id, {
        category: PlatformErrorCategory.WebhookInvalid,
        message: getCodeMessage(ResponseCode.ChannelWebhookPublishFailed, { platform: AccountType.Facebook }, getLocale()),
        retryable: false,
        occurredAt: new Date(),
      })
      return
    }
    if (!change.value.permalink_url) {
      this.logger.warn({ platform: AccountType.Facebook, candidateIds }, 'Facebook webhook missing work link')
      return
    }
    const platformWorkId = change.value.post_id ?? change.value.story_id ?? change.value.photo_id ?? change.value.video_id
    if (!platformWorkId) {
      this.logger.warn({ platform: AccountType.Facebook, candidateIds }, 'Facebook webhook missing final work id')
      return
    }
    await this.stateService.markPublished(record.id, {
      platformWorkId,
      permalink: feedChange.value.permalink_url,
      dataOption: FacebookDataOptionSchema.parse({
        postId: feedChange.value.post_id,
        storyId: feedChange.value.story_id,
        videoId: feedChange.value.video_id,
        photoId: feedChange.value.photo_id,
        permalinkUrl: feedChange.value.permalink_url,
        webhook: feedChange,
      }),
    })
  }

  private getCandidateWorkIds(change: FacebookWebhookFeedChange): string[] {
    const ids = [
      change.value.post_id,
      change.value.story_id,
      change.value.video_id,
      change.value.photo_id,
    ].filter((id): id is string => Boolean(id))

    return Array.from(new Set(ids))
  }

  private async getPublishRecordByCandidateIds(candidateIds: string[]): Promise<PublishRecord | null> {
    if (!this.publishRecordRepo) {
      return null
    }

    for (const candidateId of candidateIds) {
      const record = await this.publishRecordRepo.getByAccountTypeAndPlatformWorkId(
        AccountType.Facebook,
        candidateId,
      )
      if (record?.id) {
        return record
      }
    }
    return null
  }

  private verifyMetaSignature(request: RawBodyRequest): boolean {
    const rawBody = request.rawBody
    const signature = this.getHeader(request, 'x-hub-signature-256')
    if (!signature?.startsWith('sha256=') || !rawBody || !this.config.clientSecret) {
      return false
    }

    const expected = `sha256=${createHmac('sha256', this.config.clientSecret).update(rawBody).digest('hex')}`
    return this.safeEqual(signature, expected)
  }

  private safeEqual(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left)
    const rightBuffer = Buffer.from(right)
    return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
  }

  private getHeader(request: Request, key: string): string | undefined {
    const value = Object.entries(request.headers).find(([name]) => name.toLowerCase() === key)?.[1]
    return Array.isArray(value) ? value[0] : value
  }
}
