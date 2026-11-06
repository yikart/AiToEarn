import type { ArgumentsHost } from '@nestjs/common'
import type { Request, Response } from 'express'
import type { Observable } from 'rxjs'
import { firstValueFrom } from 'rxjs'
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

vi.mock('../../../config', () => ({
  relayConfigSchema: z.object({
    serverUrl: z.string(),
    apiKey: z.string(),
    callbackUrl: z.string(),
  }),
}))

const relayConfig = {
  serverUrl: 'https://relay.example.test',
  apiKey: 'relay-key',
  callbackUrl: 'http://localhost:8080/api/v2/channels/relay/callback',
}

describe('relay exception filter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    axiosMock.request.mockResolvedValue({
      status: 200,
      data: { code: 0, data: { ok: true } },
    })
  })

  it('issues a one-time ticket for the relay auth callback', async () => {
    const response = createResponse()
    const request = {
      method: 'GET',
      originalUrl: '/api/v2/channels/accounts/auth/twitter?groupId=group-1&redirectUri=https%3A%2F%2Fclient.example.test%2Fredirect',
      query: {
        groupId: 'group-1',
      },
      headers: {
        'authorization': 'Bearer token',
        'host': 'localhost:3002',
        'content-length': '100',
        'x-locale': 'zh-CN',
      },
      user: { id: 'user-1' },
    }
    const redisService = createRedisService()
    const filter = new RelayExceptionFilter(relayConfig, undefined, undefined, redisService)
    const logger = createLogger()
    Reflect.set(filter, 'logger', logger)

    await firstValueFrom(filter.catch(new RelayAuthException(), createHost(request, response)) as Observable<unknown>)

    const proxyRequest = axiosMock.request.mock.calls[0][0]
    const url = new URL(proxyRequest.url)
    expect(url.searchParams.has('groupId')).toBe(false)
    expect(url.searchParams.get('redirectUri')).toBe('https://client.example.test/redirect')
    const callbackUrl = new URL(url.searchParams.get('callbackUrl')!)
    const ticket = callbackUrl.searchParams.get('ticket')
    expect(ticket).toMatch(/^[0-9a-f]{64}$/)
    expect(callbackUrl.searchParams.has('userId')).toBe(false)
    expect(callbackUrl.searchParams.has('groupId')).toBe(false)
    expect(redisService.saveRelayCallbackTicket).toHaveBeenCalledWith(ticket, { userId: 'user-1', groupId: 'group-1' })
    expect(proxyRequest.data).toBeUndefined()
    expect(proxyRequest.headers).toEqual({
      'x-locale': 'zh-CN',
      'x-api-key': 'relay-key',
    })
    expect(logger.debug).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: expect.stringContaining('callbackUrl='),
        data: undefined,
      }),
    )
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
    const redisService = createRedisService()
    const filter = new RelayExceptionFilter(relayConfig, undefined, undefined, redisService)

    await firstValueFrom(filter.catch(new RelayAuthException(), createHost(request, response)) as Observable<unknown>)

    const proxyRequest = axiosMock.request.mock.calls[0][0]
    expect(proxyRequest.url).toBe('https://relay.example.test/api/v2/channels/accounts/auth/twitter')
    const callbackUrl = new URL(proxyRequest.data.callbackUrl)
    const ticket = callbackUrl.searchParams.get('ticket')
    expect(ticket).toMatch(/^[0-9a-f]{64}$/)
    expect(callbackUrl.searchParams.has('userId')).toBe(false)
    expect(proxyRequest.data).toEqual({
      redirectUri: 'https://client.example.test/redirect',
      keep: 'value',
      callbackUrl: proxyRequest.data.callbackUrl,
    })
    expect(proxyRequest.data).not.toHaveProperty('groupId')
    expect(redisService.saveRelayCallbackTicket).toHaveBeenCalledWith(ticket, { userId: 'user-1', groupId: 'group-1' })
  })
})

function createResponse() {
  const response = {
    status: vi.fn(() => response),
    json: vi.fn(),
  }
  return response
}

function createLogger() {
  return {
    debug: vi.fn(),
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
  }
}

function createRedisService() {
  return {
    saveRelayCallbackTicket: vi.fn(async () => true),
  }
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
