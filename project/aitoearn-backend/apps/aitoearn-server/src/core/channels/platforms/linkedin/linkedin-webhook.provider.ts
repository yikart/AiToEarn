import type { Request, Response } from 'express'
import type { PlatformWebhookHandler, RawBodyRequest } from '../platforms.interface'
import type { LinkedInWebhookPayload } from './linkedin.interface'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { Injectable, Logger } from '@nestjs/common'
import { AccountType, getCodeMessage, getLocale, ResponseCode } from '@yikart/common'
import { LinkedinConfig } from './linkedin.config'
import { LinkedInWebhookPayloadSchema } from './linkedin.schema'

interface LinkedInWebhookChallengeQuery {
  challengeCode?: string
}

@Injectable()
export class LinkedInWebhookProvider implements PlatformWebhookHandler {
  private readonly logger = new Logger(LinkedInWebhookProvider.name)

  constructor(private readonly config: LinkedinConfig) {}

  async handle(request: Request, response: Response): Promise<void> {
    if (request.method === 'GET') {
      this.handleChallenge(request, response)
      return
    }
    if (!this.verify(request)) {
      this.logger.warn({ platform: AccountType.LinkedIn }, 'LinkedIn webhook signature invalid')
      response.status(401).send(getCodeMessage(ResponseCode.ChannelWebhookInvalidSignature, undefined, getLocale()))
      return
    }
    const payload: LinkedInWebhookPayload = LinkedInWebhookPayloadSchema.parse(request.body)
    this.logger.log({
      platform: AccountType.LinkedIn,
      eventCount: payload.events?.length ?? 0,
    }, 'LinkedIn webhook events received')
    response.status(200).json({ status: 'ok' })
  }

  private handleChallenge(request: Request, response: Response): void {
    const query = request.query as LinkedInWebhookChallengeQuery
    if (!query.challengeCode) {
      response.status(400).send(getCodeMessage(ResponseCode.ChannelWebhookChallengeCodeMissing, undefined, getLocale()))
      return
    }

    const secret = this.config.webhookSecret || this.config.clientSecret
    const challengeResponse = createHmac('sha256', secret).update(query.challengeCode).digest('hex')
    response.status(200).json({ challengeCode: query.challengeCode, challengeResponse })
  }

  private verify(request: RawBodyRequest): boolean {
    const rawBody = request.rawBody
    const signature = this.getHeader(request, 'x-li-signature')
    const secret = this.config.webhookSecret || this.config.clientSecret
    if (!signature || !rawBody || !secret) {
      return false
    }

    const digest = createHmac('sha256', secret).update(rawBody).digest('hex')
    const expected = signature.startsWith('sha256=') ? `sha256=${digest}` : digest
    return this.safeEqual(signature, expected)
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
