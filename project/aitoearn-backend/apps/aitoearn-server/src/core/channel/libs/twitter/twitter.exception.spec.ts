import { ApiError } from '@xdevplatform/xdk'
import { ResponseCode } from '@yikart/common'
import { describe, expect, it } from 'vitest'
import { SocialMediaErrorKind } from '../exception'
import { TwitterError } from './twitter.exception'

describe('twitterError', () => {
  it('能把 xdk ApiError 归一成 http 错误', () => {
    const rawError = new ApiError(
      'Request failed',
      401,
      'Unauthorized',
      new Headers(),
      {
        errors: [{
          type: 'auth_error',
          title: 'token expired',
          detail: 'token expired',
          status: 401,
        }],
      },
    )

    const error = TwitterError.buildFromApiError(rawError, 'getUserInfo')

    expect(error.kind).toBe(SocialMediaErrorKind.Auth)
    expect(error.code).toBe(ResponseCode.ChannelAuthorizationExpired)
    expect(error.cause).toEqual({
      type: 'http',
      httpStatus: 401,
      platformCode: 'auth_error',
      platformMessage: 'token expired',
      raw: rawError,
    })
  })

  it('能把 xdk 的网络错误归一成 network', () => {
    const rawError = new ApiError(
      'socket hang up',
      0,
      'NETWORK_ERROR',
      new Headers(),
      new Error('socket hang up'),
    )

    const error = TwitterError.buildFromApiError(rawError, 'createPost')

    expect(error.kind).toBe(SocialMediaErrorKind.Network)
    expect(error.code).toBe(ResponseCode.ChannelAccountInfoFailed)
    expect(error.cause).toEqual({
      type: 'network',
      platformMessage: 'socket hang up',
      raw: rawError,
    })
  })
})
