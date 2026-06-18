import type { Request, Response } from 'express'
import type { PlatformWebhookHandler } from '../../platforms.interface'
import { createHash } from 'node:crypto'
import { Injectable, Logger } from '@nestjs/common'
import { AccountType, getCodeMessage, getLocale, ResponseCode } from '@yikart/common'
import { XMLParser } from 'fast-xml-parser'
import { WechatOfficialConfig } from '../wechat.config'

interface WeChatOfficialXmlBody {
  xml?: WeChatOfficialMessage
}

interface WeChatOfficialMessage {
  ToUserName?: string
  FromUserName?: string
  CreateTime?: number | string
  MsgType?: string
  Event?: string
  EventKey?: string
  Encrypt?: string
}

@Injectable()
export class WeChatOfficialWebhookProvider implements PlatformWebhookHandler {
  private readonly logger = new Logger(WeChatOfficialWebhookProvider.name)
  private readonly xmlParser = new XMLParser({ ignoreAttributes: false })

  constructor(private readonly config: WechatOfficialConfig) {}

  async handle(request: Request, response: Response): Promise<void> {
    if (request.method === 'GET') {
      this.handleChallenge(request, response)
      return
    }

    if (!this.verify(request)) {
      this.logger.warn({ platform: AccountType.WeChatOfficial }, 'WeChat Official webhook signature invalid')
      response.status(401).send(getCodeMessage(ResponseCode.ChannelWebhookInvalidSignature, undefined, getLocale()))
      return
    }

    const event = this.parseWechatMessage(request)
    this.logger.log({
      platform: AccountType.WeChatOfficial,
      event: event.event,
      messageType: event.messageType,
    }, 'WeChat Official webhook received')
    response.status(200).send('success')
  }

  private handleChallenge(request: Request, response: Response): void {
    const signature = this.getQuery(request, 'signature')
    const timestamp = this.getQuery(request, 'timestamp')
    const nonce = this.getQuery(request, 'nonce')
    const echostr = this.getQuery(request, 'echostr')

    if (
      signature
      && timestamp
      && nonce
      && echostr
      && this.verifySignature(signature, timestamp, nonce)
    ) {
      response.status(200).send(echostr)
      return
    }

    this.logger.warn({ platform: AccountType.WeChatOfficial }, 'WeChat Official webhook challenge rejected')
    response.status(403).send(getCodeMessage(ResponseCode.ChannelWebhookInvalidSignature, undefined, getLocale()))
  }

  private verify(request: Request): boolean {
    const signature = this.getQuery(request, 'signature') ?? this.getQuery(request, 'msg_signature')
    const timestamp = this.getQuery(request, 'timestamp')
    const nonce = this.getQuery(request, 'nonce')
    if (!signature || !timestamp || !nonce) {
      return false
    }

    const xml = this.getRawBody(request)?.toString('utf8') ?? ''
    const encrypt = this.parseWechatXml(xml).Encrypt
    return this.verifySignature(signature, timestamp, nonce, encrypt)
  }

  private parseWechatMessage(request: Request): { event?: string, messageType?: string, raw: WeChatOfficialMessage } {
    const xml = this.getRawBody(request)?.toString('utf8') ?? ''
    const raw = this.parseWechatXml(xml)
    return {
      event: raw.Event,
      messageType: raw.MsgType,
      raw,
    }
  }

  private parseWechatXml(xml: string): WeChatOfficialMessage {
    return (this.xmlParser.parse(xml) as WeChatOfficialXmlBody).xml ?? {}
  }

  private verifySignature(signature: string, timestamp: string, nonce: string, encrypt?: string): boolean {
    const parts = [this.config.token, timestamp, nonce]
    if (encrypt) {
      parts.push(encrypt)
    }
    const expected = createHash('sha1').update(parts.sort().join('')).digest('hex')
    return expected === signature
  }

  private getQuery(request: Request, key: string): string | undefined {
    const value = request.query[key]
    return typeof value === 'string' ? value : undefined
  }

  private getRawBody(request: Request): Buffer | undefined {
    return (request as Request & { rawBody?: Buffer }).rawBody
  }
}
