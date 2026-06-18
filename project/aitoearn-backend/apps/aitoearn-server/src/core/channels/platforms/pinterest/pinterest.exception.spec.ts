import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { PinterestErrorBody } from './pinterest.exception'
import { ResponseCode } from '@yikart/common'
import { AxiosError } from 'axios'
import { PlatformErrorCategory, PlatformErrorCauseType } from '../platforms.exception'
import { PinterestPlatformException } from './pinterest.exception'

function createAxiosError(
  data: PinterestErrorBody,
  input: { url: string, method: string, status: number, requestData?: string },
): AxiosError<PinterestErrorBody> {
  const config = {
    url: input.url,
    method: input.method,
    data: input.requestData,
  } as InternalAxiosRequestConfig
  const response: AxiosResponse<PinterestErrorBody> = {
    data,
    status: input.status,
    statusText: 'Error',
    headers: {},
    config,
  }

  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, undefined, response)
}

describe('pinterest platform exception', () => {
  it('classifies 409 responses as conflicts with platform code', () => {
    const exception = PinterestPlatformException.fromAxiosError(createAxiosError(
      {
        code: 409,
        message: 'Pin already exists',
      },
      {
        url: 'https://api.pinterest.com/v5/pins',
        method: 'post',
        status: 409,
      },
    ))

    expect(exception.category).toBe(PlatformErrorCategory.Conflict)
    expect(exception.retryable).toBe(false)
    expect(exception.platformCause).toMatchObject({
      type: PlatformErrorCauseType.Platform,
      httpStatus: 409,
      platformCode: 409,
      platformMessage: 'Pin already exists',
    })
  })

  it('classifies 429 responses as retryable rate limits', () => {
    const exception = PinterestPlatformException.fromAxiosError(createAxiosError(
      {
        code: 'rate_limit',
        message: 'Too many requests',
      },
      {
        url: 'https://api.pinterest.com/v5/pins',
        method: 'post',
        status: 429,
      },
    ))

    expect(exception.category).toBe(PlatformErrorCategory.RateLimit)
    expect(exception.retryable).toBe(true)
  })

  it('classifies axios network errors as retryable network failures', () => {
    const config = {
      url: 'https://api.pinterest.com/v5/pins',
      method: 'post',
    } as InternalAxiosRequestConfig
    const error = new AxiosError('socket hang up', 'ECONNRESET', config)

    const exception = PinterestPlatformException.fromAxiosError(error)

    expect(exception.category).toBe(PlatformErrorCategory.Network)
    expect(exception.retryable).toBe(true)
    expect(exception.platformCause).toMatchObject({
      type: PlatformErrorCauseType.Network,
      platformMessage: 'socket hang up',
    })
  })

  it('maps OAuth authorization code failures to access token failures', () => {
    const exception = PinterestPlatformException.fromAxiosError(createAxiosError(
      {
        code: 1,
        message: 'Invalid authorization code',
      },
      {
        url: 'https://api.pinterest.com/v5/oauth/token',
        method: 'post',
        status: 400,
        requestData: new URLSearchParams({
          grant_type: 'authorization_code',
          code: 'bad-code',
        }).toString(),
      },
    ))

    expect(exception.code).toBe(ResponseCode.ChannelAccessTokenFailed)
    expect(exception.category).toBe(PlatformErrorCategory.Auth)
    expect(exception.platformCause?.platformMessage).toBe('Invalid authorization code')
  })

  it('maps OAuth refresh failures to refresh token failures', () => {
    const exception = PinterestPlatformException.fromAxiosError(createAxiosError(
      {
        code: 2,
        message: 'Invalid refresh token',
      },
      {
        url: 'https://api.pinterest.com/v5/oauth/token',
        method: 'post',
        status: 400,
        requestData: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: 'bad-refresh-token',
        }).toString(),
      },
    ))

    expect(exception.code).toBe(ResponseCode.ChannelRefreshTokenFailed)
    expect(exception.category).toBe(PlatformErrorCategory.Auth)
    expect(exception.platformCause?.platformMessage).toBe('Invalid refresh token')
  })
})
