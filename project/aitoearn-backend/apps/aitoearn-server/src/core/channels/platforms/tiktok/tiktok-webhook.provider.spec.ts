import type { Request, Response } from 'express'
import { createHmac } from 'node:crypto'
import { AccountType } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { TikTokWebhookProvider } from './tiktok-webhook.provider'
import { TikTokContentPostingEvent, TikTokContentPostingPublishType } from './tiktok.interface'
import { TikTokContentPath, TikTokPostSource } from './tiktok.schema'

vi.mock('@yikart/mongodb', () => ({
  PublishRecordRepository: class PublishRecordRepository {},
}))

function createResponse() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  } as unknown as Response & {
    status: ReturnType<typeof vi.fn>
    json: ReturnType<typeof vi.fn>
    send: ReturnType<typeof vi.fn>
  }
}

function createSignedRequest(body: unknown, secret = 'client-secret'): Request {
  const rawBody = Buffer.from(JSON.stringify(body))
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const digest = createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody.toString('utf8')}`)
    .digest('hex')
  return {
    method: 'POST',
    headers: {
      'tiktok-signature': `t=${timestamp},s=${digest}`,
    },
    body,
    rawBody,
  } as unknown as Request
}

function createWebhookBody(
  event: TikTokContentPostingEvent,
  content: Record<string, unknown>,
) {
  return {
    client_key: 'client-key',
    event,
    create_time: 1770210873,
    user_openid: 'open-id-1',
    content: JSON.stringify(content),
  }
}

describe('tiktok webhook provider', () => {
  it('does not mark post.publish.complete as published', async () => {
    const publishRecordRepo = {
      getByAccountTypeAndPlatformWorkId: vi.fn(async () => ({ id: 'task-1' })),
    }
    const stateService = {
      markPublished: vi.fn(),
      markFailed: vi.fn(),
    }
    const provider = new TikTokWebhookProvider(
      { clientSecret: 'client-secret' } as never,
      publishRecordRepo as never,
      stateService as never,
    )
    const response = createResponse()

    await provider.handle(createSignedRequest(createWebhookBody(
      TikTokContentPostingEvent.PostPublishComplete,
      {
        publish_id: 'publish-1',
        publish_type: TikTokContentPostingPublishType.DirectPublish,
      },
    )), response)

    expect(publishRecordRepo.getByAccountTypeAndPlatformWorkId).toHaveBeenCalledWith(
      AccountType.TikTok,
      'publish-1',
    )
    expect(stateService.markPublished).not.toHaveBeenCalled()
    expect(stateService.markFailed).not.toHaveBeenCalled()
    expect(response.status).toHaveBeenCalledWith(200)
  })

  it('marks publicly_available webhook with final post_id and canonical permalink', async () => {
    const publishRecordRepo = {
      getByAccountTypeAndPlatformWorkId: vi.fn(async () => ({
        id: 'task-1',
        dataOption: {
          publishId: 'publish-1',
          source: TikTokPostSource.PullFromUrl,
          contentPath: TikTokContentPath.Photo,
          username: 'creator',
        },
      })),
    }
    const stateService = {
      markPublished: vi.fn(),
      markFailed: vi.fn(),
    }
    const provider = new TikTokWebhookProvider(
      { clientSecret: 'client-secret' } as never,
      publishRecordRepo as never,
      stateService as never,
    )
    const response = createResponse()

    await provider.handle(createSignedRequest(createWebhookBody(
      TikTokContentPostingEvent.PostPublishPubliclyAvailable,
      {
        publish_id: 'publish-1',
        publish_type: TikTokContentPostingPublishType.DirectPublish,
        post_id: 'post-1',
      },
    )), response)

    expect(publishRecordRepo.getByAccountTypeAndPlatformWorkId).toHaveBeenCalledWith(
      AccountType.TikTok,
      'publish-1',
    )
    expect(stateService.markPublished).toHaveBeenCalledWith('task-1', {
      platformWorkId: 'post-1',
      permalink: 'https://www.tiktok.com/@creator/photo/post-1',
      dataOption: {
        publishId: 'publish-1',
        source: TikTokPostSource.PullFromUrl,
        contentPath: TikTokContentPath.Photo,
        username: 'creator',
        finalPostId: 'post-1',
        webhookEvent: TikTokContentPostingEvent.PostPublishPubliclyAvailable,
        webhookCreateTime: 1770210873,
        webhookUserOpenId: 'open-id-1',
      },
    })
    expect(response.status).toHaveBeenCalledWith(200)
  })

  it('marks failed webhook using official reason field', async () => {
    const publishRecordRepo = {
      getByAccountTypeAndPlatformWorkId: vi.fn(async () => ({ id: 'task-1' })),
    }
    const stateService = {
      markPublished: vi.fn(),
      markFailed: vi.fn(),
    }
    const provider = new TikTokWebhookProvider(
      { clientSecret: 'client-secret' } as never,
      publishRecordRepo as never,
      stateService as never,
    )
    const response = createResponse()

    await provider.handle(createSignedRequest(createWebhookBody(
      TikTokContentPostingEvent.PostPublishFailed,
      {
        publish_id: 'publish-1',
        publish_type: TikTokContentPostingPublishType.DirectPublish,
        reason: 'privacy_level invalid',
      },
    )), response)

    expect(stateService.markFailed).toHaveBeenCalledWith('task-1', expect.objectContaining({
      category: 'webhook_invalid',
      code: TikTokContentPostingEvent.PostPublishFailed,
      message: 'privacy_level invalid',
      originalData: {
        publish_id: 'publish-1',
        publish_type: TikTokContentPostingPublishType.DirectPublish,
        reason: 'privacy_level invalid',
      },
      retryable: false,
      occurredAt: expect.any(Date),
    }))
    expect(stateService.markPublished).not.toHaveBeenCalled()
    expect(response.status).toHaveBeenCalledWith(200)
  })

  it('rejects non-official webhook content fields without mutating publish state', async () => {
    const publishRecordRepo = {
      getByAccountTypeAndPlatformWorkId: vi.fn(),
    }
    const stateService = {
      markPublished: vi.fn(),
      markFailed: vi.fn(),
    }
    const provider = new TikTokWebhookProvider(
      { clientSecret: 'client-secret' } as never,
      publishRecordRepo as never,
      stateService as never,
    )
    const response = createResponse()

    await provider.handle(createSignedRequest(createWebhookBody(
      TikTokContentPostingEvent.PostPublishPubliclyAvailable,
      {
        publish_id: 'publish-1',
        publish_type: TikTokContentPostingPublishType.DirectPublish,
        post_id: 'post-1',
        content_id: 'not-official-content-posting-field',
      },
    )), response)

    expect(publishRecordRepo.getByAccountTypeAndPlatformWorkId).not.toHaveBeenCalled()
    expect(stateService.markPublished).not.toHaveBeenCalled()
    expect(stateService.markFailed).not.toHaveBeenCalled()
    expect(response.status).toHaveBeenCalledWith(200)
  })

  it('verifies signatures with clientSecret instead of an independent webhook secret', async () => {
    const publishRecordRepo = {
      getByAccountTypeAndPlatformWorkId: vi.fn(async () => ({ id: 'task-1' })),
    }
    const stateService = {
      markPublished: vi.fn(),
      markFailed: vi.fn(),
    }
    const provider = new TikTokWebhookProvider(
      { clientSecret: 'client-secret', webhookSecret: 'wrong-webhook-secret' } as never,
      publishRecordRepo as never,
      stateService as never,
    )
    const response = createResponse()

    await provider.handle(createSignedRequest(createWebhookBody(
      TikTokContentPostingEvent.PostPublishComplete,
      {
        publish_id: 'publish-1',
        publish_type: TikTokContentPostingPublishType.DirectPublish,
      },
    )), response)

    expect(response.status).toHaveBeenCalledWith(200)
    expect(publishRecordRepo.getByAccountTypeAndPlatformWorkId).toHaveBeenCalledWith(
      AccountType.TikTok,
      'publish-1',
    )
  })
})
