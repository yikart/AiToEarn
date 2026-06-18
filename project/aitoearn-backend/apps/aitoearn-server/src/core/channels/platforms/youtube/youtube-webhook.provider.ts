import type { Request, Response } from 'express'
import type { PlatformWebhookHandler, RawBodyRequest } from '../platforms.interface'
import { Injectable, Logger, Optional } from '@nestjs/common'
import { AccountType, getCodeMessage, getLocale, ResponseCode } from '@yikart/common'
import { PublishRecordRepository } from '@yikart/mongodb'
import { XMLParser } from 'fast-xml-parser'
import { PublishStateService } from '../../publish/tasks/publish-state.service'
import { YoutubeConfig } from './youtube.config'

interface YoutubeAtomFeed {
  feed?: {
    entry?: YoutubeAtomEntry
  }
}

interface YoutubeAtomEntry {
  'id'?: string
  'yt:videoId'?: string
  'link'?: YoutubeAtomLink | YoutubeAtomLink[]
}

interface YoutubeAtomLink {
  '@_href'?: string
  '@_rel'?: string
}

interface YoutubeVideoNotification {
  videoId?: string
  permalink?: string
  raw: YoutubeAtomFeed
}

@Injectable()
export class YoutubeWebhookProvider implements PlatformWebhookHandler {
  private readonly logger = new Logger(YoutubeWebhookProvider.name)
  private readonly xmlParser = new XMLParser({ ignoreAttributes: false })

  constructor(
    private readonly config: YoutubeConfig,
    @Optional() private readonly publishRecordRepo?: PublishRecordRepository,
    @Optional() private readonly stateService?: PublishStateService,
  ) {}

  async handle(request: Request, response: Response): Promise<void> {
    if (request.method === 'GET') {
      this.handleChallenge(request, response)
      return
    }

    const notification = this.parseYoutubeNotification(request)
    this.logger.log({ platform: AccountType.YouTube, platformWorkId: notification.videoId }, 'YouTube webhook received')
    await this.applyYoutubeVideoNotification(notification)
    response.status(204).send()
  }

  private handleChallenge(request: Request, response: Response): void {
    const mode = this.getQuery(request, 'hub.mode')
    const challenge = this.getQuery(request, 'hub.challenge')
    const verifyToken = this.getQuery(request, 'hub.verify_token')

    if (
      mode
      && challenge
      && (!this.config.webhookVerifyToken || verifyToken === this.config.webhookVerifyToken)
    ) {
      response.status(200).send(challenge)
      return
    }

    this.logger.warn({ platform: AccountType.YouTube, mode }, 'YouTube webhook challenge rejected')
    response.status(403).send(getCodeMessage(ResponseCode.ChannelWebhookInvalidVerifyToken, undefined, getLocale()))
  }

  private parseYoutubeNotification(request: RawBodyRequest): YoutubeVideoNotification {
    const xml = request.rawBody?.toString('utf8') ?? (typeof request.body === 'string' ? request.body : '')
    const raw = this.xmlParser.parse(xml) as YoutubeAtomFeed
    const entry = raw.feed?.entry
    const videoId = entry?.['yt:videoId'] ?? entry?.id?.replace(/^yt:video:/, '')

    return {
      videoId,
      permalink: this.pickYoutubeLink(entry?.link) ?? (videoId ? `https://www.youtube.com/watch?v=${videoId}` : undefined),
      raw,
    }
  }

  private async applyYoutubeVideoNotification(notification: YoutubeVideoNotification): Promise<void> {
    if (!notification.videoId || !this.publishRecordRepo || !this.stateService) {
      this.logger.warn({ platform: AccountType.YouTube, platformWorkId: notification.videoId }, 'YouTube webhook event cannot be matched')
      return
    }

    const record = await this.publishRecordRepo.getByAccountTypeAndPlatformWorkId(AccountType.YouTube, notification.videoId)
    if (!record?.id) {
      this.logger.warn({ platform: AccountType.YouTube, platformWorkId: notification.videoId }, 'YouTube webhook publish record not found')
      return
    }

    await this.stateService.markPublished(record.id, {
      platformWorkId: notification.videoId,
      permalink: notification.permalink,
      dataOption: { webhook: notification.raw },
    })
  }

  private pickYoutubeLink(link?: YoutubeAtomLink | YoutubeAtomLink[]): string | undefined {
    if (Array.isArray(link)) {
      return link.find(item => item['@_rel'] === 'alternate')?.['@_href'] ?? link[0]?.['@_href']
    }
    return link?.['@_href']
  }

  private getQuery(request: Request, key: string): string | undefined {
    const value = request.query[key]
    return typeof value === 'string' ? value : undefined
  }
}
