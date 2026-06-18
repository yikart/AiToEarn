import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { DouyinPlatformResponseBody } from './douyin.exception'
import { ResponseCode } from '@yikart/common'
import { AxiosError } from 'axios'
import { PlatformErrorCategory, PlatformErrorCauseType } from '../platforms.exception'
import { DouyinPlatformException } from './douyin.exception'

function createResponse(
  data: DouyinPlatformResponseBody,
  input: { url: string, method: string, status?: number },
): AxiosResponse<DouyinPlatformResponseBody> {
  return {
    data,
    status: input.status ?? 200,
    statusText: 'OK',
    headers: {},
    config: {
      url: input.url,
      method: input.method,
    } as InternalAxiosRequestConfig,
  }
}

describe('douyin platform exception', () => {
  it('parses OAuth envelope platform errors from successful responses', () => {
    const response = createResponse(
      {
        data: {
          error_code: 2100004,
          description: 'invalid authorization code',
        },
        message: 'error',
      },
      { url: '/oauth/access_token/', method: 'post' },
    )

    const exception = DouyinPlatformException.fromPlatformResponse(response)

    expect(DouyinPlatformException.hasPlatformError(response)).toBe(true)
    expect(exception.code).toBe(ResponseCode.ChannelAccessTokenFailed)
    expect(exception.category).toBe(PlatformErrorCategory.Auth)
    expect(exception.context?.endpoint).toBe('POST /oauth/access_token/')
    expect(exception.platformCause?.platformCode).toBe(2100004)
    expect(exception.platformCause?.platformMessage).toBe('invalid authorization code')
    expect(exception.platformCause?.raw).toBe(response.data)
  })

  it('parses common err_no response errors', () => {
    const response = createResponse(
      {
        err_no: 28001003,
        err_msg: 'invalid qrcode path',
      },
      { url: '/api/apps/v1/qrcode/create/', method: 'post' },
    )

    const exception = DouyinPlatformException.fromPlatformResponse(response)

    expect(exception.code).toBe(ResponseCode.ChannelPlatformApiFailed)
    expect(exception.category).toBe(PlatformErrorCategory.Auth)
    expect(exception.platformCause?.platformCode).toBe(28001003)
    expect(exception.platformCause?.platformMessage).toBe('invalid qrcode path')
  })

  it('classifies share_id client token expiry as auth failure', () => {
    const response = createResponse(
      {
        data: {},
        extra: {
          error_code: 28001008,
          sub_description: 'access_token过期,请刷新或重新授权',
          description: 'access_token过期,请刷新或重新授权',
        },
      },
      { url: '/share-id/', method: 'post' },
    )

    const exception = DouyinPlatformException.fromPlatformResponse(response)

    expect(exception.code).toBe(ResponseCode.ChannelAccessTokenFailed)
    expect(exception.category).toBe(PlatformErrorCategory.Auth)
    expect(exception.platformCause?.platformCode).toBe(28001008)
    expect(exception.platformCause?.platformMessage).toBeUndefined()
    expect(exception.platformCause?.raw).toBe(response.data)
  })

  it('keeps legacy access token expiry codes classified as auth failures', () => {
    const response = createResponse(
      {
        data: {
          error_code: 2190008,
          description: 'access_token过期,请刷新或重新授权',
        },
      },
      { url: '/share-id/', method: 'post' },
    )

    const exception = DouyinPlatformException.fromPlatformResponse(response)

    expect(exception.code).toBe(ResponseCode.ChannelAccessTokenFailed)
    expect(exception.category).toBe(PlatformErrorCategory.Auth)
    expect(exception.platformCause?.platformCode).toBe(2190008)
  })

  it('classifies share_id platform errors from official codes', () => {
    const response = createResponse(
      {
        data: {},
        extra: {
          error_code: 28001005,
          sub_description: '系统内部错误，请重试',
          description: '系统内部错误，请重试',
        },
      },
      { url: '/share-id/', method: 'post' },
    )

    const exception = DouyinPlatformException.fromPlatformResponse(response)

    expect(exception.code).toBe(ResponseCode.ChannelPlatformServiceUnavailable)
    expect(exception.category).toBe(PlatformErrorCategory.PlatformUnavailable)
    expect(exception.retryable).toBe(true)
    expect(exception.platformCause?.platformCode).toBe(28001005)
  })

  it('parses SDK camelCase data errors', () => {
    const response = createResponse(
      {
        data: {
          errorCode: 40001,
          description: 'sdk response failed',
        },
      },
      { url: '/oauth/access_token/', method: 'post' },
    )

    const exception = DouyinPlatformException.fromPlatformResponse(response)

    expect(exception.platformCause?.platformCode).toBe(40001)
    expect(exception.platformCause?.platformMessage).toBe('sdk response failed')
  })

  it('converts axios errors with responses', () => {
    const response = createResponse(
      {
        err_no: 1001,
        err_msg: 'bad request',
      },
      { url: '/api/douyin/v1/video/upload_video/', method: 'post', status: 400 },
    )
    const error = new AxiosError('Request failed', 'ERR_BAD_REQUEST', response.config, undefined, response)

    const exception = DouyinPlatformException.fromAxiosError(error)

    expect(exception.code).toBe(ResponseCode.ChannelPlatformMediaProcessingFailed)
    expect(exception.category).toBe(PlatformErrorCategory.MediaProcessingFailed)
    expect(exception.platformCause?.httpStatus).toBe(400)
    expect(exception.platformCause?.platformCode).toBe(1001)
    expect(exception.platformCause?.platformMessage).toBe('bad request')
    expect(exception.platformCause?.raw).toBe(response.data)
  })

  it('converts axios network errors without responses', () => {
    const config = {
      url: '/share-id/',
      method: 'get',
    } as InternalAxiosRequestConfig
    const error = new AxiosError('socket hang up', 'ECONNRESET', config)

    const exception = DouyinPlatformException.fromAxiosError(error)

    expect(exception.context?.endpoint).toBe('GET /share-id/')
    expect(exception.category).toBe(PlatformErrorCategory.Network)
    expect(exception.retryable).toBe(true)
    expect(exception.platformCause?.type).toBe(PlatformErrorCauseType.Network)
    expect(exception.platformCause?.platformCode).toBeUndefined()
    expect(exception.platformCause?.platformMessage).toBe('socket hang up')
  })

  it('falls back to HTTP status when the endpoint does not imply a category', () => {
    const response = createResponse(
      {
        err_no: 999999,
        err_msg: 'too many requests',
      },
      { url: '/unknown/resource', method: 'get', status: 429 },
    )
    const error = new AxiosError('Request failed', 'ERR_BAD_REQUEST', response.config, undefined, response)

    const exception = DouyinPlatformException.fromAxiosError(error)

    expect(exception.category).toBe(PlatformErrorCategory.RateLimit)
    expect(exception.retryable).toBe(true)
  })
})
