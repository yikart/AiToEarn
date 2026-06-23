import type { Request, Response } from 'express'
import { createHmac } from 'node:crypto'
import { AccountType } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { InstagramWebhookProvider } from './instagram-webhook.provider'
import { InstagramConfig } from './instagram.config'

vi.mock('@yikart/mongodb', () => ({
  PublishRecordRepository: class PublishRecordRepository {},
}))

function createSignedRequest(body: unknown): Request {
  const rawBody = Buffer.from(JSON.stringify(body))
  const signature = `sha256=${createHmac('sha256', 'client-secret').update(rawBody).digest('hex')}`
  return {
    method: 'POST',
    headers: {
      'x-hub-signature-256': signature,
    },
    rawBody,
    body,
  } as unknown as Request
}

function createResponse(): Response {
  const response = {
    status: vi.fn(),
    send: vi.fn(),
  }
  response.status.mockReturnValue(response)
  return response as unknown as Response
}

function createProvider() {
  const repo = {
    getByAccountTypeAndPlatformWorkId: vi.fn(async () => ({ id: 'record-1' })),
  }
  const stateService = {
    markPublished: vi.fn(),
    markFailed: vi.fn(),
  }
  const provider = new InstagramWebhookProvider(
    {
      webhookVerifyToken: 'verify-token',
      clientSecret: 'client-secret',
    } as InstagramConfig,
    repo as never,
    stateService as never,
  )

  return { provider, repo, stateService }
}

describe('instagram webhook provider', () => {
  it('marks media webhook as published only when final media id and permalink are present', async () => {
    const { provider, repo, stateService } = createProvider()
    const body = {
      object: 'instagram',
      entry: [{
        changes: [{
          field: 'media',
          value: {
            media_id: 'media-1',
            permalink: 'https://www.instagram.com/p/media-shortcode/',
          },
        }],
      }],
    }

    await provider.handle(createSignedRequest(body), createResponse())

    expect(repo.getByAccountTypeAndPlatformWorkId).toHaveBeenCalledWith(AccountType.Instagram, 'media-1')
    expect(stateService.markPublished).toHaveBeenCalledWith('record-1', {
      platformWorkId: 'media-1',
      permalink: 'https://www.instagram.com/p/media-shortcode/',
      dataOption: {
        webhook: {
          field: 'media',
          mediaId: 'media-1',
          permalink: 'https://www.instagram.com/p/media-shortcode/',
        },
      },
    })
  })

  it('does not mark published when permalink is missing', async () => {
    const { provider, stateService } = createProvider()
    const body = {
      object: 'instagram',
      entry: [{
        changes: [{
          field: 'media',
          value: {
            media_id: 'media-1',
          },
        }],
      }],
    }

    await provider.handle(createSignedRequest(body), createResponse())

    expect(stateService.markPublished).not.toHaveBeenCalled()
  })

  it('ignores non-media webhook changes', async () => {
    const { provider, repo, stateService } = createProvider()
    const body = {
      object: 'instagram',
      entry: [{
        changes: [{
          field: 'mentions',
          value: {
            media_id: 'media-1',
            permalink: 'https://www.instagram.com/p/media-shortcode/',
          },
        }],
      }],
    }

    await provider.handle(createSignedRequest(body), createResponse())

    expect(repo.getByAccountTypeAndPlatformWorkId).not.toHaveBeenCalled()
    expect(stateService.markPublished).not.toHaveBeenCalled()
  })
})
