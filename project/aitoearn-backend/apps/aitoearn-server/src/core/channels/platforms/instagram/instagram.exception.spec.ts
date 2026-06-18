import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { InstagramErrorBody } from './instagram.exception'
import { ResponseCode } from '@yikart/common'
import { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'
import { PlatformErrorCategory, PlatformErrorCauseType } from '../platforms.exception'
import { InstagramPlatformException } from './instagram.exception'

function createAxiosError(
  data: InstagramErrorBody,
  input: { url: string, method: string, status: number },
): AxiosError<InstagramErrorBody> {
  const config = {
    url: input.url,
    method: input.method,
  } as InternalAxiosRequestConfig
  const response: AxiosResponse<InstagramErrorBody> = {
    data,
    status: input.status,
    statusText: 'Error',
    headers: {},
    config,
  }

  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, undefined, response)
}

describe('instagram platform exception', () => {
  it('classifies Graph API OAuth code 190 as auth and keeps the primary code public', () => {
    const error = createAxiosError(
      {
        error: {
          message: 'Error validating verification code.',
          type: 'OAuthException',
          code: 190,
          error_subcode: 460,
          fbtrace_id: 'trace-id',
        },
      },
      {
        url: 'https://api.instagram.com/oauth/access_token',
        method: 'post',
        status: 400,
      },
    )

    const exception = InstagramPlatformException.fromAxiosError(error)

    expect(exception.code).toBe(ResponseCode.ChannelPlatformApiFailed)
    expect(exception.category).toBe(PlatformErrorCategory.Auth)
    expect(exception.retryable).toBe(false)
    expect(exception.context).toMatchObject({
      endpoint: 'https://api.instagram.com/oauth/access_token',
      method: 'POST',
    })
    expect(exception.platformCause).toMatchObject({
      type: PlatformErrorCauseType.Platform,
      httpStatus: 400,
      platformCode: 190,
      platformMessage: 'Error validating verification code.',
    })
  })

  it('classifies Graph API throttling codes as retryable rate limits', () => {
    const error = createAxiosError(
      {
        error: {
          message: 'User request limit reached.',
          type: 'OAuthException',
          code: 17,
        },
      },
      {
        url: 'https://graph.instagram.com/v25.0/me',
        method: 'get',
        status: 400,
      },
    )

    const exception = InstagramPlatformException.fromAxiosError(error)

    expect(exception.category).toBe(PlatformErrorCategory.RateLimit)
    expect(exception.retryable).toBe(true)
    expect(exception.platformCause?.platformCode).toBe(17)
  })

  it('classifies Graph API permission codes as permission errors', () => {
    const error = createAxiosError(
      {
        error: {
          message: 'Permissions error.',
          type: 'OAuthException',
          code: 200,
        },
      },
      {
        url: 'https://graph.instagram.com/v25.0/me',
        method: 'get',
        status: 400,
      },
    )

    const exception = InstagramPlatformException.fromAxiosError(error)

    expect(exception.category).toBe(PlatformErrorCategory.Permission)
    expect(exception.retryable).toBe(false)
    expect(exception.platformCause?.platformCode).toBe(200)
  })

  it('classifies axios network errors as retryable network failures', () => {
    const config = {
      url: 'https://graph.instagram.com/v25.0/me',
      method: 'get',
    } as InternalAxiosRequestConfig
    const error = new AxiosError('socket hang up', 'ECONNRESET', config)

    const exception = InstagramPlatformException.fromAxiosError(error)

    expect(exception.category).toBe(PlatformErrorCategory.Network)
    expect(exception.retryable).toBe(true)
    expect(exception.platformCause).toMatchObject({
      type: PlatformErrorCauseType.Network,
      platformMessage: 'socket hang up',
    })
  })

  it('classifies content publishing limit as quota without exposing the raw Meta message', () => {
    const error = createAxiosError(
      {
        error: {
          message: 'User is performing too many actions',
          type: 'OAuthException',
          code: 9,
          error_subcode: 2207069,
          error_user_title: 'Media Creation Limit Exceeded',
          error_user_msg: 'You reached maximum number of posts that is allowed to be created by Content Publishing API.',
        },
      },
      {
        url: 'https://graph.instagram.com/v25.0/ig-user-id/media',
        method: 'post',
        status: 400,
      },
    )

    const exception = InstagramPlatformException.fromAxiosError(error)

    expect(exception.category).toBe(PlatformErrorCategory.Quota)
    expect(exception.retryable).toBe(false)
    expect(exception.platformCause?.platformMessage).toBeUndefined()
    expect(exception.toTaskFailure().message).toBeUndefined()
    expect(exception.toTaskFailure().originalData).toMatchObject({
      platformCode: 9,
      httpStatus: 400,
      raw: expect.objectContaining({
        error: expect.objectContaining({
          message: 'User is performing too many actions',
          error_subcode: 2207069,
        }),
      }),
    })
  })
})
