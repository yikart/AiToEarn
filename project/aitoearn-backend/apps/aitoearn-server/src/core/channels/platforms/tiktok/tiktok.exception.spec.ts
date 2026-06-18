import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { ResponseCode } from '@yikart/common'
import { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'
import { PlatformErrorCategory, PlatformErrorCauseType } from '../platforms.exception'
import { TikTokPlatformException, TikTokPlatformResponseBody } from './tiktok.exception'

describe('tiktok platform exception', () => {
  it('converts TikTok response body errors without generic request parsing', () => {
    const response: AxiosResponse<TikTokPlatformResponseBody> = {
      data: {
        error: {
          code: 'access_token_invalid',
          message: 'access token expired',
          log_id: 'log_1',
        },
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {
        method: 'post',
        url: 'https://open.tiktokapis.com/v2/post/publish/video/init/',
      } as InternalAxiosRequestConfig,
    }

    const exception = TikTokPlatformException.fromPlatformResponse(response)

    expect(exception.context?.endpoint).toBe('POST /v2/post/publish/video/init/')
    expect(exception.category).toBe(PlatformErrorCategory.MediaProcessingFailed)
    expect(exception.platformCause?.type).toBe(PlatformErrorCauseType.Platform)
    expect(exception.platformCause?.platformCode).toBe('access_token_invalid')
    expect(exception.platformCause?.platformMessage).toBe('access token expired')
  })

  it('falls back to HTTP status for non-publish endpoints', () => {
    const config = {
      method: 'get',
      url: 'https://open.tiktokapis.com/v2/user/info/',
    } as InternalAxiosRequestConfig
    const response: AxiosResponse<TikTokPlatformResponseBody> = {
      data: {
        error: {
          code: 'rate_limit_exceeded',
          message: 'Too many requests',
        },
      },
      status: 429,
      statusText: 'Too Many Requests',
      headers: {},
      config,
    }
    const error = new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, undefined, response)

    const exception = TikTokPlatformException.fromAxiosError(error)

    expect(exception.context?.endpoint).toBe('GET /v2/user/info/')
    expect(exception.category).toBe(PlatformErrorCategory.RateLimit)
    expect(exception.retryable).toBe(true)
    expect(exception.platformCause?.type).toBe(PlatformErrorCauseType.Platform)
  })

  it('classifies axios network errors as retryable network failures', () => {
    const config = {
      method: 'get',
      url: 'https://open.tiktokapis.com/v2/user/info/',
    } as InternalAxiosRequestConfig
    const error = new AxiosError('socket hang up', 'ECONNRESET', config)

    const exception = TikTokPlatformException.fromAxiosError(error)

    expect(exception.context?.endpoint).toBe('GET /v2/user/info/')
    expect(exception.category).toBe(PlatformErrorCategory.Network)
    expect(exception.retryable).toBe(true)
    expect(exception.platformCause?.type).toBe(PlatformErrorCauseType.Network)
  })

  it('normalizes unaudited direct post guideline errors to a clear permission failure', () => {
    const response: AxiosResponse<TikTokPlatformResponseBody> = {
      data: {
        error: {
          code: 'unaudited_client_can_only_post_to_private_accounts',
          message: 'Please review our integration guidelines at TikTok for Developers',
          log_id: 'log_1',
        },
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {
        method: 'post',
        url: 'https://open.tiktokapis.com/v2/post/publish/video/init/',
      } as InternalAxiosRequestConfig,
    }

    const exception = TikTokPlatformException.fromPlatformResponse(response)

    expect(exception.code).toBe(ResponseCode.ChannelPlatformPermissionMissing)
    expect(exception.category).toBe(PlatformErrorCategory.Permission)
    expect(exception.platformCause?.platformCode).toBe('unaudited_client_can_only_post_to_private_accounts')
    expect(exception.platformCause?.platformMessage).toBe('未审核 TikTok Direct Post 客户端只能私密发布，请选择 SELF_ONLY 或完成 TikTok app 审核')
    expect(exception.toTaskFailure()).toMatchObject({
      message: undefined,
      originalData: {
        platformMessage: '未审核 TikTok Direct Post 客户端只能私密发布，请选择 SELF_ONLY 或完成 TikTok app 审核',
      },
    })
  })
})
