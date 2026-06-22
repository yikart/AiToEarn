import type { ArgumentsHost } from '@nestjs/common'
import type { Request, Response } from 'express'
import { firstValueFrom, type Observable } from 'rxjs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { RelayAuthException } from './relay-auth.exception'
import { RelayExceptionFilter } from './relay-exception.filter'

const axiosMock = vi.hoisted(() => ({
  request: vi.fn(),
}))

vi.mock('axios', () => ({
  default: axiosMock.request,
}))

vi.mock('../../config', () => ({
  relayConfigSchema: z.object({
    serverUrl: z.string(),
    apiKey: z.string(),
    callbackUrl: z.string(),
  }),
}))

const relayConfig = {
  serverUrl: 'https://relay.example.test',
  apiKey: 'relay-key',
  callbackUrl: 'http://localhost:8080/api/relay-callback',
}

describe('relay exception filter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    axiosMock.request.mockResolvedValue({
      status: 200,
      data: { code: 0, data: { ok: true } },
    })
  })

  it('removes local groupId from relay auth GET query', async () => {
    const response = createResponse()
    const request = {
      method: 'GET',
      originalUrl: '/api/v2/channels/accounts/auth/twitter?groupId=group-1&redirectUri=https%3A%2F%2Fclient.example.test%2Fredirect',
      headers: {
        authorization: 'Bearer token',
        host: 'localhost:3002',
        'content-length': '100',
        'x-locale': 'zh-CN',
      },
      user: { id: 'user-1' },
    }
    const filter = new RelayExceptionFilter(relayConfig, undefined, undefined)

    await firstValueFrom(filter.catch(new RelayAuthException(), createHost(request, response)) as Observable<unknown>)

    const proxyRequest = axiosMock.request.mock.calls[0][0]
    const url = new URL(proxyRequest.url)
    expect(url.searchParams.has('groupId')).toBe(false)
    expect(url.searchParams.get('redirectUri')).toBe('https://client.example.test/redirect')
    expect(new URL(url.searchParams.get('callbackUrl')!).searchParams.get('userId')).toBe('user-1')
    expect(proxyRequest.data).toBeUndefined()
    expect(proxyRequest.headers).toEqual({
      'x-locale': 'zh-CN',
      'x-api-key': 'relay-key',
    })
    expect(response.status).toHaveBeenCalledWith(200)
    expect(response.json).toHaveBeenCalledWith({ code: 0, data: { ok: true } })
  })

  it('removes local groupId from relay auth body', async () => {
    const response = createResponse()
    const request = {
      method: 'POST',
      originalUrl: '/api/v2/channels/accounts/auth/twitter',
      headers: {},
      body: {
        groupId: 'group-1',
        redirectUri: 'https://client.example.test/redirect',
        keep: 'value',
      },
      user: { id: 'user-1' },
    }
    const filter = new RelayExceptionFilter(relayConfig, undefined, undefined)

    await firstValueFrom(filter.catch(new RelayAuthException(), createHost(request, response)) as Observable<unknown>)

    const proxyRequest = axiosMock.request.mock.calls[0][0]
    expect(proxyRequest.url).toBe('https://relay.example.test/api/v2/channels/accounts/auth/twitter')
    expect(proxyRequest.data).toEqual({
      redirectUri: 'https://client.example.test/redirect',
      keep: 'value',
      callbackUrl: 'http://localhost:8080/api/relay-callback?userId=user-1',
    })
    expect(proxyRequest.data).not.toHaveProperty('groupId')
  })
})

function createResponse() {
  const response = {
    status: vi.fn(() => response),
    json: vi.fn(),
  }
  return response
}

function createHost(request: Partial<Request> & { user?: { id?: string } }, response: Partial<Response>): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
      getNext: vi.fn(),
    }),
  } as unknown as ArgumentsHost
}
