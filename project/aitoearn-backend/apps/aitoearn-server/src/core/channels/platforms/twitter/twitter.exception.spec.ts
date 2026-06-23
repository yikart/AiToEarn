import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { ApiError } from '@xdevplatform/xdk'
import { ResponseCode } from '@yikart/common'
import { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'
import { PlatformErrorCategory, PlatformErrorCauseType } from '../platforms.exception'
import { TwitterPlatformException } from './twitter.exception'

describe('twitter platform exception', () => {
  it('converts XDK ApiError without generic unknown parsing', () => {
    const error = new ApiError(
      'Forbidden',
      403,
      'Forbidden',
      new Headers(),
      {
        errors: [
          {
            code: 220,
            detail: 'Your credentials do not allow access',
          },
        ],
      },
    )

    const exception = TwitterPlatformException.fromSdkApiError(error, {
      code: ResponseCode.ChannelPlatformApiFailed,
      context: { endpoint: 'GET /2/users/me' },
    })

    expect(exception.category).toBe(PlatformErrorCategory.Permission)
    expect(exception.context?.endpoint).toBe('GET /2/users/me')
    expect(exception.platformCause?.type).toBe(PlatformErrorCauseType.SdkError)
    expect(exception.platformCause?.httpStatus).toBe(403)
    expect(exception.platformCause?.platformCode).toBe(220)
    expect(exception.platformCause?.platformMessage).toBe('Your credentials do not allow access')
  })

  it('converts XDK OAuth Error as SDK auth failure', () => {
    const error = new Error('Failed to refresh token: 400')

    const exception = TwitterPlatformException.fromSdkOAuthError(error, {
      code: ResponseCode.ChannelRefreshTokenFailed,
      context: { endpoint: 'POST /2/oauth2/token' },
    })

    expect(exception.category).toBe(PlatformErrorCategory.Auth)
    expect(exception.context?.endpoint).toBe('POST /2/oauth2/token')
    expect(exception.platformCause?.type).toBe(PlatformErrorCauseType.SdkError)
    expect(exception.platformCause?.platformMessage).toBe('Failed to refresh token: 400')
  })

  it('converts axios revoke errors separately from SDK errors', () => {
    const response: AxiosResponse<{ error: string, error_description: string }> = {
      data: {
        error: 'invalid_request',
        error_description: 'token missing',
      },
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: {
        method: 'post',
        url: 'https://api.x.com/2/oauth2/revoke',
      } as InternalAxiosRequestConfig,
    }
    const error = new AxiosError('Request failed', 'ERR_BAD_REQUEST', response.config, undefined, response)

    const exception = TwitterPlatformException.fromAxiosError(error)

    expect(exception.context?.endpoint).toBe('POST /2/oauth2/revoke')
    expect(exception.category).toBe(PlatformErrorCategory.Auth)
    expect(exception.platformCause?.type).toBe(PlatformErrorCauseType.Platform)
    expect(exception.platformCause?.httpStatus).toBe(400)
    expect(exception.platformCause?.platformCode).toBe('invalid_request')
    expect(exception.platformCause?.platformMessage).toBe('token missing')
  })

  it('converts X API axios errors[] responses', () => {
    const response: AxiosResponse<{ errors: [{ code: number, detail: string }] }> = {
      data: {
        errors: [
          {
            code: 324,
            detail: 'Media parameter is invalid',
          },
        ],
      },
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: {
        method: 'post',
        url: 'https://api.x.com/2/media/upload/media-1/append',
      } as InternalAxiosRequestConfig,
    }
    const error = new AxiosError('Request failed', 'ERR_BAD_REQUEST', response.config, undefined, response)

    const exception = TwitterPlatformException.fromAxiosError(error)

    expect(exception.context?.endpoint).toBe('POST /2/media/upload/media-1/append')
    expect(exception.category).toBe(PlatformErrorCategory.Validation)
    expect(exception.platformCause?.type).toBe(PlatformErrorCauseType.Platform)
    expect(exception.platformCause?.httpStatus).toBe(400)
    expect(exception.platformCause?.platformCode).toBe(324)
    expect(exception.platformCause?.platformMessage).toBe('Media parameter is invalid')
  })

  it('keeps text axios response bodies as platform messages', () => {
    const response: AxiosResponse<string> = {
      data: 'plain platform failure',
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: {
        method: 'post',
        url: 'https://api.x.com/2/media/upload/media-1/append',
      } as InternalAxiosRequestConfig,
    }
    const error = new AxiosError('Request failed', 'ERR_BAD_REQUEST', response.config, undefined, response)

    const exception = TwitterPlatformException.fromAxiosError(error)

    expect(exception.platformCause?.type).toBe(PlatformErrorCauseType.Http)
    expect(exception.platformCause?.httpStatus).toBe(400)
    expect(exception.platformCause?.platformCode).toBe(400)
    expect(exception.platformCause?.platformMessage).toBe('plain platform failure')
    expect(exception.platformCause?.raw).toBe('plain platform failure')
  })

  it('classifies media upload 413 as validation failure', () => {
    const response: AxiosResponse<string> = {
      data: '',
      status: 413,
      statusText: 'Payload Too Large',
      headers: {},
      config: {
        method: 'post',
        url: 'https://api.x.com/2/media/upload',
      } as InternalAxiosRequestConfig,
    }
    const error = new AxiosError('Request failed with status code 413', 'ERR_BAD_REQUEST', response.config, undefined, response)

    const exception = TwitterPlatformException.fromAxiosError(error)

    expect(exception.context?.endpoint).toBe('POST /2/media/upload')
    expect(exception.category).toBe(PlatformErrorCategory.Validation)
    expect(exception.platformCause?.type).toBe(PlatformErrorCauseType.Http)
    expect(exception.platformCause?.httpStatus).toBe(413)
    expect(exception.platformCause?.platformCode).toBe(413)
  })

  it('classifies axios network errors as retryable network failures', () => {
    const config = {
      method: 'post',
      url: 'https://api.x.com/2/oauth2/revoke',
    } as InternalAxiosRequestConfig
    const error = new AxiosError('socket hang up', 'ECONNRESET', config)

    const exception = TwitterPlatformException.fromAxiosError(error)

    expect(exception.context?.endpoint).toBe('POST /2/oauth2/revoke')
    expect(exception.category).toBe(PlatformErrorCategory.Network)
    expect(exception.retryable).toBe(true)
    expect(exception.platformCause).toMatchObject({
      type: PlatformErrorCauseType.Network,
      platformMessage: 'socket hang up',
    })
  })

  it('marks X API 429 SDK errors as retryable rate limits', () => {
    const error = new ApiError(
      'Too Many Requests',
      429,
      'Too Many Requests',
      new Headers(),
      {
        errors: [
          {
            code: 88,
            detail: 'Rate limit exceeded',
          },
        ],
      },
    )

    const exception = TwitterPlatformException.fromSdkApiError(error, {
      code: ResponseCode.ChannelPlatformApiFailed,
      context: { endpoint: 'POST /2/tweets' },
    })

    expect(exception.category).toBe(PlatformErrorCategory.RateLimit)
    expect(exception.retryable).toBe(true)
    expect(exception.platformCause?.platformCode).toBe(88)
  })
})
