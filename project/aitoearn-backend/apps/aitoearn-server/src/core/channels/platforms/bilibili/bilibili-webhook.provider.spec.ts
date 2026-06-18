import type { Request, Response } from 'express'
import { createHash, createHmac } from 'node:crypto'
import { AccountType } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { BilibiliWebhookProvider } from './bilibili-webhook.provider'

vi.mock('@yikart/mongodb', () => ({
  PublishRecordRepository: class PublishRecordRepository {},
}))

function createBilibiliSignedHeaders(rawBody: Buffer): Record<string, string> {
  const contentMd5 = createHash('md5').update(rawBody).digest('hex')
  const headers = {
    'x-bili-accesskeyid': 'client-id',
    'x-bili-content-md5': contentMd5,
    'x-bili-signature-method': 'HMAC-SHA256',
    'x-bili-signature-nonce': 'nonce-1',
    'x-bili-signature-version': '2.0',
    'x-bili-timestamp': '1770000000',
  }
  const signaturePayload = Object.entries(headers)
    .map(([key, value]) => `${key}:${value}`)
    .join('\n')
  return {
    ...headers,
    authorization: createHmac('sha256', 'client-secret').update(signaturePayload).digest('hex'),
  }
}

function createResponse(): Response {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response
}

describe('bilibili webhook provider', () => {
  it('uses legacy share id to mark published with final public video id', async () => {
    const body = {
      event: 'publish_video',
      from_user_id: 'open-id',
      client_key: 'client-id',
      log_id: 'log-1',
      content: {
        share_id: 'share-1',
        item_id: 'encrypted-item-id',
        video_id: 'BV1xx411c7mD',
        has_default_hashtag: true,
      },
    }
    const rawBody = Buffer.from(JSON.stringify(body))
    const publishRecordRepo = {
      getByAccountTypeAndPlatformWorkId: vi.fn(async () => ({
        id: 'task-1',
        dataOption: { shareId: 'share-1' },
      })),
    }
    const stateService = {
      markPublished: vi.fn(async () => true),
    }
    const provider = new BilibiliWebhookProvider({
      clientId: 'client-id',
      clientSecret: 'client-secret',
      redirectUri: 'https://api.example.test/callback',
    }, publishRecordRepo as never, stateService as never)
    const response = createResponse()

    await provider.handle({
      method: 'POST',
      headers: createBilibiliSignedHeaders(rawBody),
      body,
      rawBody,
    } as unknown as Request, response)

    expect(publishRecordRepo.getByAccountTypeAndPlatformWorkId).toHaveBeenCalledWith(AccountType.Bilibili, 'share-1')
    expect(stateService.markPublished).toHaveBeenCalledWith('task-1', {
      platformWorkId: 'BV1xx411c7mD',
      permalink: 'https://www.bilibili.com/video/BV1xx411c7mD',
      dataOption: {
        shareId: 'share-1',
        finalVideoId: 'BV1xx411c7mD',
        webhook: body,
      },
    })
    expect(response.status).toHaveBeenCalledWith(200)
    expect(response.json).toHaveBeenCalledWith({ code: 0, message: 'ok' })
  })

  it('uses official resource id open event only when it is a public video id', async () => {
    const body = {
      event: 'video_open',
      content: {
        openid: 'open-id',
        client_id: 'client-id',
        resource_id: 'BV1xx411c7mD',
        state: 0,
        state_desc: '审核通过',
      },
      timestamp: 1770000000,
    }
    const rawBody = Buffer.from(JSON.stringify(body))
    const publishRecordRepo = {
      getByAccountTypeAndPlatformWorkId: vi.fn(async () => ({ id: 'task-1' })),
    }
    const stateService = {
      markPublished: vi.fn(async () => true),
    }
    const provider = new BilibiliWebhookProvider({
      clientId: 'client-id',
      clientSecret: 'client-secret',
      redirectUri: 'https://api.example.test/callback',
    }, publishRecordRepo as never, stateService as never)
    const response = createResponse()

    await provider.handle({
      method: 'POST',
      headers: createBilibiliSignedHeaders(rawBody),
      body,
      rawBody,
    } as unknown as Request, response)

    expect(publishRecordRepo.getByAccountTypeAndPlatformWorkId).toHaveBeenCalledWith(AccountType.Bilibili, 'BV1xx411c7mD')
    expect(stateService.markPublished).toHaveBeenCalledWith('task-1', {
      platformWorkId: 'BV1xx411c7mD',
      permalink: 'https://www.bilibili.com/video/BV1xx411c7mD',
      dataOption: {
        resourceId: 'BV1xx411c7mD',
        finalVideoId: 'BV1xx411c7mD',
        webhook: body,
      },
    })
  })

  it('marks official video_fail events as failed by resource id', async () => {
    const body = {
      event: 'video_fail',
      content: {
        openid: 'open-id',
        client_id: 'client-id',
        resource_id: 'resource-1',
        state: -1,
        state_desc: '审核失败',
      },
      timestamp: 1770000000,
    }
    const rawBody = Buffer.from(JSON.stringify(body))
    const publishRecordRepo = {
      getByAccountTypeAndPlatformWorkId: vi.fn(async () => ({ id: 'task-1' })),
    }
    const stateService = {
      markFailed: vi.fn(async () => true),
    }
    const provider = new BilibiliWebhookProvider({
      clientId: 'client-id',
      clientSecret: 'client-secret',
      redirectUri: 'https://api.example.test/callback',
    }, publishRecordRepo as never, stateService as never)
    const response = createResponse()

    await provider.handle({
      method: 'POST',
      headers: createBilibiliSignedHeaders(rawBody),
      body,
      rawBody,
    } as unknown as Request, response)

    expect(publishRecordRepo.getByAccountTypeAndPlatformWorkId).toHaveBeenCalledWith(AccountType.Bilibili, 'resource-1')
    expect(stateService.markFailed).toHaveBeenCalledWith('task-1', expect.objectContaining({
      message: '审核失败',
      retryable: false,
    }))
  })

  it('returns verify_webhooks content data', async () => {
    const body = {
      event: 'verify_webhooks',
      content: { data: 'challenge-data' },
      timestamp: 1770000000,
    }
    const rawBody = Buffer.from(JSON.stringify(body))
    const provider = new BilibiliWebhookProvider({
      clientId: 'client-id',
      clientSecret: 'client-secret',
      redirectUri: 'https://api.example.test/callback',
    })
    const response = createResponse()

    await provider.handle({
      method: 'POST',
      headers: createBilibiliSignedHeaders(rawBody),
      body,
      rawBody,
    } as unknown as Request, response)

    expect(response.status).toHaveBeenCalledWith(200)
    expect(response.json).toHaveBeenCalledWith({ data: 'challenge-data' })
  })

  it('rejects missing signature headers', async () => {
    const provider = new BilibiliWebhookProvider({
      clientId: 'client-id',
      clientSecret: 'client-secret',
      redirectUri: 'https://api.example.test/callback',
    })
    const response = createResponse()

    await provider.handle({
      method: 'POST',
      headers: {},
      body: {},
      rawBody: Buffer.from('{}'),
    } as unknown as Request, response)

    expect(response.status).toHaveBeenCalledWith(401)
  })
})
