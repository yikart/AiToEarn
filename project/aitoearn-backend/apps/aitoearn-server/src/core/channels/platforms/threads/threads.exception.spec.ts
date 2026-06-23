import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { ThreadsErrorBody } from './threads.exception'
import { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'
import { PlatformErrorCategory, PlatformErrorCauseType } from '../platforms.exception'
import { ThreadsPlatformException } from './threads.exception'

function createAxiosError(
  data: ThreadsErrorBody,
  input: { url: string, method: string, status: number },
): AxiosError<ThreadsErrorBody> {
  const config = {
    url: input.url,
    method: input.method,
  } as InternalAxiosRequestConfig
  const response: AxiosResponse<ThreadsErrorBody> = {
    data,
    status: input.status,
    statusText: 'Error',
    headers: {},
    config,
  }

  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, undefined, response)
}

describe('threads platform exception', () => {
  it('converts Graph API OAuth errors into channel platform auth errors', () => {
    const error = createAxiosError(
      {
        error: {
          message: 'The access token is invalid.',
          type: 'OAuthException',
          code: 190,
        },
      },
      {
        url: 'https://graph.threads.net/me',
        method: 'get',
        status: 400,
      },
    )

    const exception = ThreadsPlatformException.fromAxiosError(error)

    expect(exception.category).toBe(PlatformErrorCategory.Auth)
    expect(exception.retryable).toBe(false)
    expect(exception.platformCause).toMatchObject({
      type: PlatformErrorCauseType.Platform,
      httpStatus: 400,
      platformCode: 190,
      platformMessage: 'The access token is invalid.',
    })
  })

  it('classifies Graph API field errors as non-retryable validation errors', () => {
    const error = createAxiosError(
      {
        error: {
          message: 'Tried accessing nonexisting field (permalink)',
          type: 'THApiException',
          code: 100,
        },
      },
      {
        url: 'https://graph.threads.net/container-1',
        method: 'get',
        status: 500,
      },
    )

    const exception = ThreadsPlatformException.fromAxiosError(error)

    expect(exception.category).toBe(PlatformErrorCategory.Validation)
    expect(exception.retryable).toBe(false)
    expect(exception.platformCause).toMatchObject({
      type: PlatformErrorCauseType.Platform,
      httpStatus: 500,
      platformCode: 100,
      platformMessage: 'Tried accessing nonexisting field (permalink)',
    })
  })

  it('classifies axios network errors as retryable network failures', () => {
    const config = {
      url: 'https://graph.threads.net/me',
      method: 'get',
    } as InternalAxiosRequestConfig
    const error = new AxiosError('socket hang up', 'ECONNRESET', config)

    const exception = ThreadsPlatformException.fromAxiosError(error)

    expect(exception.category).toBe(PlatformErrorCategory.Network)
    expect(exception.retryable).toBe(true)
    expect(exception.platformCause).toMatchObject({
      type: PlatformErrorCauseType.Network,
      platformMessage: 'socket hang up',
    })
  })
})
