import pino from 'pino'
import { describe, expect, it } from 'vitest'
import { serializeError } from './error.serializer'

function createAxiosErrorLike() {
  const error = Object.assign(new Error('Request failed with status code 429'), {
    name: 'AxiosError',
    code: 'ERR_BAD_REQUEST',
    isAxiosError: true,
    config: {
      baseURL: 'https://api.example.com',
      url: '/v1/video/create',
      method: 'post',
      headers: {
        Authorization: 'Bearer token',
      },
    },
    request: {
      socket: { remoteAddress: '127.0.0.1' },
      agent: { keepAlive: true },
    },
    response: {
      status: 429,
      statusText: 'Too Many Requests',
      data: {
        error: 'rate limited',
      },
      headers: {
        'x-api-request-id': 'request-1',
      },
      request: {
        socket: { remoteAddress: '127.0.0.1' },
      },
      req: {
        socket: { remoteAddress: '127.0.0.1' },
      },
      socket: {
        remoteAddress: '127.0.0.1',
      },
    },
    status: 429,
  })

  return error
}

describe('error serializer', () => {
  it('keeps normal error fields', () => {
    const serialized = serializeError(new Error('failed')) as Record<string, unknown>

    expect(serialized['type']).toBe('Error')
    expect(serialized['message']).toBe('failed')
    expect(serialized['stack']).toContain('failed')
  })

  it('keeps error cause', () => {
    const cause = new Error('inner')
    const serialized = serializeError(new Error('outer', { cause })) as Record<string, unknown>
    const serializedCause = serialized['cause'] as Record<string, unknown>

    expect(serialized['message']).toBe('outer')
    expect(serializedCause['message']).toBe('inner')
    expect(String(serializedCause['stack'])).toContain('inner')
  })

  it('removes axios request and socket data only', () => {
    const serialized = serializeError(createAxiosErrorLike()) as Record<string, unknown>
    const config = serialized['config'] as Record<string, unknown>
    const response = serialized['response'] as Record<string, unknown>

    expect(serialized['message']).toBe('Request failed with status code 429')
    expect(serialized['code']).toBe('ERR_BAD_REQUEST')
    expect(serialized['status']).toBe(429)
    expect(config['baseURL']).toBe('https://api.example.com')
    expect(response['status']).toBe(429)
    expect(response['data']).toEqual({ error: 'rate limited' })
    expect(response['headers']).toEqual({ 'x-api-request-id': 'request-1' })
    expect(serialized).not.toHaveProperty('request')
    expect(serialized).not.toHaveProperty('raw')
    expect(response).not.toHaveProperty('request')
    expect(response).not.toHaveProperty('req')
    expect(response).not.toHaveProperty('socket')
  })

  it('removes axios socket data from causes', () => {
    const serialized = serializeError(new Error('wrapped', { cause: createAxiosErrorLike() })) as Record<string, unknown>
    const cause = serialized['cause'] as Record<string, unknown>
    const response = cause['response'] as Record<string, unknown>

    expect(cause['isAxiosError']).toBe(true)
    expect(cause['config']).toBeDefined()
    expect(cause).not.toHaveProperty('request')
    expect(cause).not.toHaveProperty('raw')
    expect(response).not.toHaveProperty('request')
    expect(response).not.toHaveProperty('req')
    expect(response).not.toHaveProperty('socket')
  })

  it('supports pino object field named error', () => {
    const logs: Array<Record<string, unknown>> = []
    const logger = pino({
      serializers: {
        error: serializeError,
      },
    }, {
      write(line) {
        logs.push(JSON.parse(line) as Record<string, unknown>)
      },
    })

    logger.error({ error: createAxiosErrorLike() }, 'request failed')

    const error = logs[0]['error'] as Record<string, unknown>
    const response = error['response'] as Record<string, unknown>

    expect(error['code']).toBe('ERR_BAD_REQUEST')
    expect(error).not.toHaveProperty('request')
    expect(error).not.toHaveProperty('raw')
    expect(response['data']).toEqual({ error: 'rate limited' })
    expect(response).not.toHaveProperty('request')
    expect(response).not.toHaveProperty('req')
    expect(response).not.toHaveProperty('socket')
  })

  it('returns non-error values unchanged', () => {
    const value = { ok: true }

    expect(serializeError(value)).toBe(value)
  })
})
