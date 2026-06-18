import axios from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ThreadsMediaType } from './threads.interface'
import { ThreadsService } from './threads.service'

const axiosMock = vi.hoisted(() => ({
  request: vi.fn(),
  isAxiosError: vi.fn(() => false),
}))

vi.mock('axios', () => {
  const mockedAxios = axiosMock.request
  return {
    default: Object.assign(mockedAxios, {
      isAxiosError: axiosMock.isAxiosError,
    }),
  }
})

function createService(): ThreadsService {
  return new ThreadsService({
    clientId: 'client-id',
    clientSecret: 'client-secret',
    redirectUri: 'https://api.example.test/threads/callback',
  } as never)
}

describe('threads service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not synthesize OAuth scope from config during code exchange', async () => {
    const service = createService()
    axiosMock.request.mockResolvedValueOnce({
      data: {
        access_token: 'access-token',
        token_type: 'bearer',
        expires_in: 3600,
      },
    })

    await expect(service.exchangeCode('code-1')).resolves.toEqual({
      accessToken: 'access-token',
      expiresAt: expect.any(Date),
    })
  })

  it('refreshes long-lived tokens through the Threads refresh endpoint', async () => {
    const service = createService()
    axiosMock.request.mockResolvedValueOnce({
      data: {
        access_token: 'new-long-lived-token',
        token_type: 'bearer',
        expires_in: 5184000,
      },
    })

    await expect(service.refreshAccessToken('long-lived-token')).resolves.toEqual({
      accessToken: 'new-long-lived-token',
      expiresAt: expect.any(Date),
    })

    expect(axios).toHaveBeenCalledWith(
      'https://graph.threads.net/refresh_access_token',
      {
        method: 'GET',
        params: {
          grant_type: 'th_refresh_token',
          access_token: 'long-lived-token',
        },
      },
    )
  })

  it('requests only container status fields during media polling', async () => {
    const service = createService()
    axiosMock.request.mockResolvedValueOnce({
      data: { id: 'container-1', status: 'FINISHED' },
    })

    await expect(service.getContainerStatus('container-1', 'access-token')).resolves.toEqual({
      id: 'container-1',
      status: 'FINISHED',
    })

    expect(axios).toHaveBeenCalledWith(
      'https://graph.threads.net/container-1',
      {
        method: 'GET',
        headers: { Authorization: 'Bearer access-token' },
        params: { fields: 'id,status' },
      },
    )
  })

  it('deletes an object without a status preflight request', async () => {
    const service = createService()
    axiosMock.request.mockResolvedValueOnce({
      data: { success: true },
    })

    await expect(service.deletePublishedPost('thread-1', 'access-token')).resolves.toBe(true)

    expect(axios).toHaveBeenCalledTimes(1)
    expect(axios).toHaveBeenCalledWith(
      'https://graph.threads.net/thread-1',
      {
        method: 'DELETE',
        headers: { Authorization: 'Bearer access-token' },
      },
    )
  })

  it('sends Threads create-container fields with official parameter names', async () => {
    const service = createService()
    axiosMock.request.mockResolvedValueOnce({
      data: { id: 'container-1' },
    })

    await expect(service.createContainer('threads-user-id', 'access-token', {
      mediaType: ThreadsMediaType.Text,
      text: 'hello',
      topicTag: 'ai',
      linkAttachmentUrl: 'https://example.test/post',
    })).resolves.toEqual({ id: 'container-1' })

    const body = axiosMock.request.mock.calls[0][1].data as FormData
    expect(body.get('media_type')).toBe(ThreadsMediaType.Text)
    expect(body.get('text')).toBe('hello')
    expect(body.get('topic_tag')).toBe('ai')
    expect(body.get('link_attachment')).toBe('https://example.test/post')
    expect(body.get('link_attachment_url')).toBeNull()
  })
})
