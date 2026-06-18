import type { Request, Response } from 'express'
import { createHmac } from 'node:crypto'
import { AccountType } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { FacebookWebhookProvider } from './facebook-webhook.provider'

vi.mock('@yikart/mongodb', () => ({
  PublishRecordRepository: class PublishRecordRepository {},
}))

function createResponse(): Response {
  return {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  } as unknown as Response
}

function createProvider(publishRecordRepo?: unknown, stateService?: unknown) {
  return new FacebookWebhookProvider({
    clientId: 'client-id',
    clientSecret: 'app-secret',
    graphApiVersion: 'v25.0',
    redirectUri: 'https://api.example.test/callback',
    webhookVerifyToken: 'verify-token',
    scopes: [],
  }, publishRecordRepo as never, stateService as never)
}

describe('facebook webhook provider', () => {
  it('returns Meta challenge when verify token matches', async () => {
    const provider = createProvider()
    const response = createResponse()

    await provider.handle({
      method: 'GET',
      query: {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'verify-token',
        'hub.challenge': 'challenge-value',
      },
    } as unknown as Request, response)

    expect(response.status).toHaveBeenCalledWith(200)
    expect(response.send).toHaveBeenCalledWith('challenge-value')
  })

  it('verifies x-hub-signature-256, parses publish events and marks publish record', async () => {
    const body = {
      entry: [{
        changes: [{
          field: 'feed',
          value: {
            post_id: 'page_123',
            permalink_url: 'https://facebook.com/page/posts/123',
          },
        }],
      }],
    }
    const rawBody = Buffer.from(JSON.stringify(body))
    const signature = `sha256=${createHmac('sha256', 'app-secret').update(rawBody).digest('hex')}`
    const publishRecordRepo = {
      getByAccountTypeAndPlatformWorkId: vi.fn(async () => ({ id: 'task-1' })),
    }
    const stateService = {
      markPublished: vi.fn(async () => true),
    }
    const provider = createProvider(publishRecordRepo, stateService)
    const response = createResponse()

    await provider.handle({
      method: 'POST',
      headers: { 'x-hub-signature-256': signature },
      body,
      rawBody,
    } as unknown as Request, response)

    expect(publishRecordRepo.getByAccountTypeAndPlatformWorkId).toHaveBeenCalledWith(AccountType.Facebook, 'page_123')
    expect(stateService.markPublished).toHaveBeenCalledWith('task-1', {
      platformWorkId: 'page_123',
      permalink: 'https://facebook.com/page/posts/123',
      dataOption: expect.objectContaining({
        postId: 'page_123',
        permalinkUrl: 'https://facebook.com/page/posts/123',
        webhook: body.entry[0].changes[0],
      }),
    })
    expect(response.status).toHaveBeenCalledWith(200)
    expect(response.send).toHaveBeenCalledWith('EVENT_RECEIVED')
  })
})
