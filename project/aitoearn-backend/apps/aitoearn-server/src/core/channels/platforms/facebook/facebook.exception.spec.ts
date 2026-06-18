import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { FacebookErrorBody } from './facebook.exception'
import { AxiosError } from 'axios'
import { PlatformErrorCategory, PlatformErrorCauseType } from '../platforms.exception'
import { FacebookPlatformException } from './facebook.exception'

function createAxiosError(
  data: FacebookErrorBody,
  input: { url: string, method: string, status: number },
): AxiosError<FacebookErrorBody> {
  const config = {
    url: input.url,
    method: input.method,
  } as InternalAxiosRequestConfig
  const response: AxiosResponse<FacebookErrorBody> = {
    data,
    status: input.status,
    statusText: 'Error',
    headers: {},
    config,
  }

  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, undefined, response)
}

describe('facebook platform exception', () => {
  it('classifies Graph API conflict code 506 from the platform body', () => {
    const error = createAxiosError(
      {
        error: {
          message: 'Duplicate post.',
          type: 'OAuthException',
          code: 506,
        },
      },
      {
        url: 'https://graph.facebook.com/v25.0/page-id/feed',
        method: 'post',
        status: 400,
      },
    )

    const exception = FacebookPlatformException.fromAxiosError(error)

    expect(exception.category).toBe(PlatformErrorCategory.Conflict)
    expect(exception.retryable).toBe(false)
    expect(exception.platformCause).toMatchObject({
      type: PlatformErrorCauseType.Platform,
      httpStatus: 400,
      platformCode: 506,
      platformMessage: 'Duplicate post.',
    })
  })

  it('classifies Graph API transient codes as retryable platform outages', () => {
    const error = createAxiosError(
      {
        error: {
          message: 'Service temporarily unavailable.',
          type: 'OAuthException',
          code: 2,
        },
      },
      {
        url: 'https://graph.facebook.com/v25.0/me/accounts',
        method: 'get',
        status: 500,
      },
    )

    const exception = FacebookPlatformException.fromAxiosError(error)

    expect(exception.category).toBe(PlatformErrorCategory.PlatformUnavailable)
    expect(exception.retryable).toBe(true)
    expect(exception.platformCause?.platformCode).toBe(2)
  })

  it('classifies axios network errors as retryable network failures', () => {
    const config = {
      url: 'https://graph.facebook.com/v25.0/me/accounts',
      method: 'get',
    } as InternalAxiosRequestConfig
    const error = new AxiosError('socket hang up', 'ECONNRESET', config)

    const exception = FacebookPlatformException.fromAxiosError(error)

    expect(exception.category).toBe(PlatformErrorCategory.Network)
    expect(exception.retryable).toBe(true)
    expect(exception.platformCause).toMatchObject({
      type: PlatformErrorCauseType.Network,
      platformMessage: 'socket hang up',
    })
  })
})
