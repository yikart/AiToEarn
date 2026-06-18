import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { LinkedInErrorBody } from './linkedin.exception'
import { ResponseCode } from '@yikart/common'
import { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'
import { PlatformErrorCategory, PlatformErrorCauseType } from '../platforms.exception'
import { LinkedInPlatformException } from './linkedin.exception'

function createAxiosError(
  data: LinkedInErrorBody,
  input: { url: string, method: string, status: number },
): AxiosError<LinkedInErrorBody> {
  const config = {
    url: input.url,
    method: input.method,
  } as InternalAxiosRequestConfig
  const response: AxiosResponse<LinkedInErrorBody> = {
    data,
    status: input.status,
    statusText: 'Error',
    headers: {},
    config,
  }

  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, undefined, response)
}

describe('linkedin platform exception', () => {
  it('keeps raw data on validation exceptions without exposing it publicly', () => {
    const raw = {
      value: {
        video: 'urn:li:video:video-1',
      },
    }
    const exception = LinkedInPlatformException.validation({
      code: ResponseCode.ChannelPlatformResponseInvalid,
      category: PlatformErrorCategory.PlatformUnavailable,
      context: { endpoint: 'uploadVideo' },
      cause: { raw },
    })

    expect(exception.platformCause).toMatchObject({
      type: PlatformErrorCauseType.Validation,
      raw,
    })
    expect((exception.getResponse() as { data: Record<string, unknown> }).data).not.toHaveProperty('raw')
  })

  it('classifies 400 responses as validation errors and keeps serviceErrorCode', () => {
    const exception = LinkedInPlatformException.fromAxiosError(createAxiosError(
      {
        message: 'Invalid request body',
        serviceErrorCode: 100,
        status: 400,
      },
      {
        url: 'https://api.linkedin.com/rest/posts',
        method: 'post',
        status: 400,
      },
    ))

    expect(exception.category).toBe(PlatformErrorCategory.Validation)
    expect(exception.retryable).toBe(false)
    expect(exception.platformCause).toMatchObject({
      type: PlatformErrorCauseType.Platform,
      httpStatus: 400,
      platformCode: 100,
      platformMessage: 'Invalid request body',
    })
  })

  it('classifies 429 responses as retryable rate limits', () => {
    const exception = LinkedInPlatformException.fromAxiosError(createAxiosError(
      {
        message: 'Throttle limit exceeded',
        status: 429,
      },
      {
        url: 'https://api.linkedin.com/rest/posts',
        method: 'post',
        status: 429,
      },
    ))

    expect(exception.category).toBe(PlatformErrorCategory.RateLimit)
    expect(exception.retryable).toBe(true)
  })

  it('classifies axios network errors as retryable network failures', () => {
    const config = {
      url: 'https://api.linkedin.com/rest/posts',
      method: 'post',
    } as InternalAxiosRequestConfig
    const error = new AxiosError('socket hang up', 'ECONNRESET', config)

    const exception = LinkedInPlatformException.fromAxiosError(error)

    expect(exception.category).toBe(PlatformErrorCategory.Network)
    expect(exception.retryable).toBe(true)
    expect(exception.platformCause).toMatchObject({
      type: PlatformErrorCauseType.Network,
      platformMessage: 'socket hang up',
    })
  })
})
