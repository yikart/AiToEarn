import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { BilibiliPlatformResponseBody } from './bilibili.exception'
import { requestContext, ResponseCode } from '@yikart/common'
import { AxiosError } from 'axios'
import { PlatformErrorCategory, PlatformErrorCauseType } from '../platforms.exception'
import { BilibiliPlatformException } from './bilibili.exception'

describe('bilibili platform exception', () => {
  it('converts Bilibili response body errors without generic request parsing', () => {
    const response: AxiosResponse<BilibiliPlatformResponseBody> = {
      data: {
        code: -400,
        message: 'invalid archive payload',
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {
        method: 'post',
        url: 'https://member.bilibili.com/arcopen/fn/archive/add-by-utoken',
      } as InternalAxiosRequestConfig,
    }

    const exception = BilibiliPlatformException.fromPlatformResponse(response)

    expect(exception.context?.endpoint).toBe('POST /arcopen/fn/archive/add-by-utoken')
    expect(exception.category).toBe(PlatformErrorCategory.Unknown)
    expect(exception.platformCause?.type).toBe(PlatformErrorCauseType.Platform)
    expect(exception.platformCause?.platformCode).toBe(-400)
    expect(exception.platformCause?.platformMessage).toBe('invalid archive payload')
  })

  it('classifies Bilibili -500 as platform-side service unavailable and keeps internals in raw cause', () => {
    const response = createBilibiliResponse({
      code: -500,
      message: 'close err: rpc error',
      request_id: 'req-1',
      ttl: 1,
    })

    const exception = BilibiliPlatformException.fromPlatformResponse(response)

    expect(exception.context?.endpoint).toBe('POST /video/v2/part/upload')
    expect(exception.code).toBe(ResponseCode.ChannelPlatformServiceUnavailable)
    expect(exception.category).toBe(PlatformErrorCategory.PlatformUnavailable)
    expect(exception.retryable).toBe(true)
    expect(exception.platformCause?.platformCode).toBe(-500)
    expect(exception.platformCause?.platformMessage).toBeUndefined()
    expect(exception.platformCause?.raw).toBe(response.data)
    expect((exception.platformCause?.raw as BilibiliPlatformResponseBody).message).toBe('close err: rpc error')
    expect((exception.platformCause?.raw as BilibiliPlatformResponseBody).request_id).toBe('req-1')
    expect(exception.toTaskFailure().message).toBeUndefined()
    expect(getExceptionMessage(exception)).toBe('bilibili platform service is temporarily unavailable, please try again later')
  })

  it('handles string -500 code without endpoint or platform message parsing', () => {
    const exception = BilibiliPlatformException.fromPlatformResponse(createBilibiliResponse({
      code: '-500',
      message: 'upstream failed',
    }, 'https://member.bilibili.com/arcopen/fn/archive/add-by-utoken'))

    expect(exception.code).toBe(ResponseCode.ChannelPlatformServiceUnavailable)
    expect(exception.category).toBe(PlatformErrorCategory.PlatformUnavailable)
    expect(exception.platformCause?.platformMessage).toBeUndefined()
    expect((exception.platformCause?.raw as BilibiliPlatformResponseBody).message).toBe('upstream failed')
    expect(exception.toTaskFailure().message).toBeUndefined()
  })

  it('uses localized platform-side message for Bilibili internal errors', () => {
    const exception = requestContext.run({ locale: 'zh-CN' }, () => BilibiliPlatformException.fromPlatformResponse(createBilibiliResponse({
      code: 4011,
      message: '内部错误',
    })))

    expect(exception.toTaskFailure().message).toBeUndefined()
    expect(getExceptionMessage(exception)).toBe('bilibili 平台方服务异常，请稍后再试')
  })

  it('classifies official Bilibili platform error codes', () => {
    const rateLimited = BilibiliPlatformException.fromPlatformResponse(createBilibiliResponse({ code: 127009, message: '接口繁忙，请稍后再试' }))
    const validation = BilibiliPlatformException.fromPlatformResponse(createBilibiliResponse({ code: 123013, message: '标题不合法' }))
    const permission = BilibiliPlatformException.fromPlatformResponse(createBilibiliResponse({ code: 127007, message: '应用无该接口权限' }))
    const notFound = BilibiliPlatformException.fromPlatformResponse(createBilibiliResponse({ code: 123004, message: '不存在该稿件' }))
    const processing = BilibiliPlatformException.fromPlatformResponse(createBilibiliResponse({ code: 123028, message: '稿件后台处理中,请10秒后再尝试' }))

    expect(rateLimited.code).toBe(ResponseCode.ChannelPlatformRateLimited)
    expect(rateLimited.category).toBe(PlatformErrorCategory.RateLimit)
    expect(rateLimited.retryable).toBe(true)
    expect(rateLimited.platformCause?.platformMessage).toBeUndefined()

    expect(validation.code).toBe(ResponseCode.ChannelPlatformApiFailed)
    expect(validation.category).toBe(PlatformErrorCategory.Validation)
    expect(validation.platformCause?.platformMessage).toBeUndefined()

    expect(permission.code).toBe(ResponseCode.ChannelPlatformPermissionMissing)
    expect(permission.category).toBe(PlatformErrorCategory.Permission)

    expect(notFound.code).toBe(ResponseCode.ChannelPlatformWorkNotFound)
    expect(notFound.category).toBe(PlatformErrorCategory.NotFound)

    expect(processing.code).toBe(ResponseCode.ChannelPlatformMediaProcessingFailed)
    expect(processing.category).toBe(PlatformErrorCategory.MediaProcessingFailed)
    expect(processing.retryable).toBe(true)
  })

  it('classifies Bilibili HTTP 5xx as platform-side service unavailable regardless of endpoint', () => {
    const response = createBilibiliResponse({
      message: 'service unavailable',
      request_id: 'req-503',
    })
    response.status = 503
    const error = new AxiosError('Request failed with status code 503', undefined, response.config, undefined, response)

    const exception = BilibiliPlatformException.fromAxiosError(error)

    expect(exception.code).toBe(ResponseCode.ChannelPlatformServiceUnavailable)
    expect(exception.category).toBe(PlatformErrorCategory.PlatformUnavailable)
    expect(exception.retryable).toBe(true)
    expect(exception.platformCause?.type).toBe(PlatformErrorCauseType.Http)
    expect(exception.platformCause?.platformMessage).toBeUndefined()
    expect((exception.platformCause?.raw as BilibiliPlatformResponseBody).request_id).toBe('req-503')
    expect(getExceptionMessage(exception)).toBe('bilibili platform service is temporarily unavailable, please try again later')
  })

  it('classifies network failures as retryable network errors', () => {
    const config = {
      method: 'get',
      url: 'https://member.bilibili.com/arcopen/fn/archive/view',
    } as InternalAxiosRequestConfig
    const error = new AxiosError('timeout', 'ETIMEDOUT', config)

    const exception = BilibiliPlatformException.fromAxiosError(error)

    expect(exception.context?.endpoint).toBe('GET /arcopen/fn/archive/view')
    expect(exception.category).toBe(PlatformErrorCategory.Network)
    expect(exception.retryable).toBe(true)
    expect(exception.platformCause?.type).toBe(PlatformErrorCauseType.Network)
  })
})

function createBilibiliResponse(
  data: BilibiliPlatformResponseBody,
  url = 'https://openupos.bilivideo.com/video/v2/part/upload',
): AxiosResponse<BilibiliPlatformResponseBody> {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {
      method: 'post',
      url,
    } as InternalAxiosRequestConfig,
  }
}

function getExceptionMessage(exception: BilibiliPlatformException): unknown {
  const response = exception.getResponse()
  return response && typeof response === 'object'
    ? (response as { message?: unknown }).message
    : undefined
}
