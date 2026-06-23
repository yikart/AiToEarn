import type { Request, Response } from 'express'
import { createHash } from 'node:crypto'
import { Logger } from '@nestjs/common'
import { AccountType } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { DouyinWebhookProvider } from './douyin-webhook.provider'

vi.mock('@yikart/mongodb', () => ({
  PublishRecordRepository: class PublishRecordRepository {},
}))

function createResponse() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response & {
    status: ReturnType<typeof vi.fn>
    json: ReturnType<typeof vi.fn>
  }
}

function createSignedRequest(body: unknown): Request {
  const rawBody = Buffer.from(JSON.stringify(body))
  const signature = createHash('sha1').update(`secret${rawBody.toString('utf8')}`).digest('hex')
  return {
    headers: {
      'x-douyin-signature': signature,
    },
    query: {},
    body,
    rawBody,
  } as unknown as Request
}

describe('douyin webhook provider', () => {
  it('marks H5 share publish record as published from create_video result', async () => {
    const publishRecordRepo = {
      getByAccountTypeAndPlatformWorkId: vi.fn(async () => ({ id: 'task-1' })),
      getByAccountTypeAndDataId: vi.fn(),
    }
    const stateService = {
      markPublished: vi.fn(),
    }
    const provider = new DouyinWebhookProvider(
      { clientSecret: 'secret' } as never,
      publishRecordRepo as never,
      stateService as never,
    )
    const response = createResponse()
    const body = {
      event: 'create_video',
      from_user_id: 'open-id-1',
      client_key: 'client-key',
      log_id: 'log-1',
      content: {
        share_id: 'share-1',
        item_id: 'item-1',
        video_id: 'video-1',
        has_default_hashtag: false,
      },
    }
    const request = createSignedRequest(body)

    await provider.handle(request, response)

    expect(publishRecordRepo.getByAccountTypeAndPlatformWorkId).toHaveBeenCalledWith(
      AccountType.Douyin,
      'share-1',
    )
    expect(stateService.markPublished).toHaveBeenCalledWith('task-1', {
      platformWorkId: 'video-1',
      permalink: 'https://www.douyin.com/video/video-1',
      dataOption: {
        shareId: 'share-1',
        itemId: 'item-1',
        videoId: 'video-1',
        workLink: 'https://www.douyin.com/video/video-1',
        webhook: body,
      },
    })
    expect(response.status).toHaveBeenCalledWith(200)
  })

  it('falls back to legacy pending dataId when share_id is not in platformWorkId', async () => {
    const publishRecordRepo = {
      getByAccountTypeAndPlatformWorkId: vi.fn(async () => null),
      getByAccountTypeAndDataId: vi.fn(async () => ({ id: 'task-legacy' })),
    }
    const stateService = {
      markPublished: vi.fn(),
    }
    const provider = new DouyinWebhookProvider(
      { clientSecret: 'secret' } as never,
      publishRecordRepo as never,
      stateService as never,
    )
    const response = createResponse()
    const request = createSignedRequest({
      event: 'create_video',
      from_user_id: 'open-id-1',
      client_key: 'client-key',
      log_id: 'log-1',
      content: {
        share_id: 'share-legacy',
        item_id: 'item-legacy',
        video_id: 'video-legacy',
        has_default_hashtag: true,
      },
    })

    await provider.handle(request, response)

    expect(publishRecordRepo.getByAccountTypeAndDataId).toHaveBeenCalledWith(
      AccountType.Douyin,
      'share-legacy',
    )
    expect(stateService.markPublished).toHaveBeenCalledWith('task-legacy', expect.objectContaining({
      platformWorkId: 'video-legacy',
      permalink: 'https://www.douyin.com/video/video-legacy',
    }))
  })

  it('does not publish when create_video webhook has no final video_id', async () => {
    const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined)
    const publishRecordRepo = {
      getByAccountTypeAndPlatformWorkId: vi.fn(),
      getByAccountTypeAndDataId: vi.fn(),
    }
    const stateService = {
      markPublished: vi.fn(),
    }
    const provider = new DouyinWebhookProvider(
      { clientSecret: 'secret' } as never,
      publishRecordRepo as never,
      stateService as never,
    )
    const response = createResponse()
    const request = createSignedRequest({
      event: 'create_video',
      from_user_id: 'open-id-1',
      client_key: 'client-key',
      log_id: 'log-1',
      content: {
        share_id: 'share-1',
        has_default_hashtag: false,
      },
    })

    await provider.handle(request, response)

    expect(warn).toHaveBeenCalledWith(
      { platform: AccountType.Douyin, shareId: 'share-1' },
      'Douyin webhook missing final video id',
    )
    expect(publishRecordRepo.getByAccountTypeAndPlatformWorkId).not.toHaveBeenCalled()
    expect(stateService.markPublished).not.toHaveBeenCalled()
    expect(response.status).toHaveBeenCalledWith(200)
    warn.mockRestore()
  })

  it('answers verify_webhook numeric challenge from official content field', async () => {
    const provider = new DouyinWebhookProvider({ clientSecret: 'secret' } as never)
    const response = createResponse()
    const request = createSignedRequest({
      event: 'verify_webhook',
      from_user_id: 'open-id-1',
      client_key: '',
      log_id: 'log-1',
      content: {
        challenge: 12345,
      },
    })

    await provider.handle(request, response)

    expect(response.status).toHaveBeenCalledWith(200)
    expect(response.json).toHaveBeenCalledWith({ challenge: 12345 })
  })

  it('acknowledges authorize webhook events without publishing', async () => {
    const log = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined)
    const publishRecordRepo = {
      getByAccountTypeAndPlatformWorkId: vi.fn(),
      getByAccountTypeAndDataId: vi.fn(),
    }
    const stateService = {
      markPublished: vi.fn(),
    }
    const provider = new DouyinWebhookProvider(
      { clientSecret: 'secret' } as never,
      publishRecordRepo as never,
      stateService as never,
    )
    const response = createResponse()
    const request = createSignedRequest({
      event: 'authorize',
      from_user_id: 'open-id-1',
      client_key: 'client-key',
      content: {
        scopes: ['video.create'],
      },
    })

    await provider.handle(request, response)

    expect(log).toHaveBeenCalledWith(
      { platform: AccountType.Douyin, event: 'authorize' },
      'Douyin webhook event acknowledged',
    )
    expect(publishRecordRepo.getByAccountTypeAndPlatformWorkId).not.toHaveBeenCalled()
    expect(stateService.markPublished).not.toHaveBeenCalled()
    expect(response.status).toHaveBeenCalledWith(200)
    expect(response.json).toHaveBeenCalledWith({ code: 0, message: 'ok' })
    log.mockRestore()
  })

  it('acknowledges official webhook events with string content', async () => {
    const log = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined)
    const provider = new DouyinWebhookProvider({ clientSecret: 'secret' } as never)
    const response = createResponse()
    const request = createSignedRequest({
      event: 'contract_authorize',
      from_user_id: 'open-id-1',
      client_key: 'client-key',
      content: JSON.stringify({
        scopes: ['enterprise.bind'],
        timestamp: 1781093478,
      }),
    })

    await provider.handle(request, response)

    expect(log).toHaveBeenCalledWith(
      { platform: AccountType.Douyin, event: 'contract_authorize' },
      'Douyin webhook event acknowledged',
    )
    expect(response.status).toHaveBeenCalledWith(200)
    expect(response.json).toHaveBeenCalledWith({ code: 0, message: 'ok' })
    log.mockRestore()
  })
})
