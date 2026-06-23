import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { YouTubeErrorBody } from './youtube.exception'
import { AxiosError } from 'axios'
import { GaxiosError } from 'gaxios'
import { describe, expect, it } from 'vitest'
import { PlatformErrorCategory, PlatformErrorCauseType } from '../platforms.exception'
import { YouTubePlatformException } from './youtube.exception'

function createAxiosError(
  data: YouTubeErrorBody,
  input: { url: string, method: string, status: number },
): AxiosError<YouTubeErrorBody> {
  const config = {
    url: input.url,
    method: input.method,
  } as InternalAxiosRequestConfig
  const response: AxiosResponse<YouTubeErrorBody> = {
    data,
    status: input.status,
    statusText: 'Error',
    headers: {},
    config,
  }

  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, undefined, response)
}

function createGaxiosError(
  data: YouTubeErrorBody,
  input: { url: string, method: string, status: number },
): GaxiosError<YouTubeErrorBody> {
  const config = {
    url: input.url,
    method: input.method,
  } as never
  const response = {
    data,
    status: input.status,
    config,
    bodyUsed: true,
  } as never

  return new GaxiosError('Request failed', config, response)
}

describe('youtube platform exception', () => {
  it('classifies YouTube quota reasons using the Google error model', () => {
    const exception = YouTubePlatformException.fromAxiosError(createAxiosError(
      {
        error: {
          code: 403,
          message: 'The request cannot be completed because you have exceeded your quota.',
          errors: [
            {
              reason: 'quotaExceeded',
              message: 'Quota exceeded.',
            },
          ],
        },
      },
      {
        url: 'https://www.googleapis.com/youtube/v3/videos',
        method: 'post',
        status: 403,
      },
    ))

    expect(exception.category).toBe(PlatformErrorCategory.Quota)
    expect(exception.retryable).toBe(false)
    expect(exception.platformCause).toMatchObject({
      type: PlatformErrorCauseType.Platform,
      httpStatus: 403,
      platformCode: 'quotaExceeded',
      platformMessage: 'Quota exceeded.',
    })
  })

  it('classifies OAuth invalid_grant as auth', () => {
    const exception = YouTubePlatformException.fromAxiosError(createAxiosError(
      {
        error: 'invalid_grant',
        error_description: 'Bad Request',
      },
      {
        url: 'https://oauth2.googleapis.com/token',
        method: 'post',
        status: 400,
      },
    ))

    expect(exception.category).toBe(PlatformErrorCategory.Auth)
    expect(exception.platformCause?.platformCode).toBe('invalid_grant')
  })

  it('classifies axios network errors as retryable network failures', () => {
    const config = {
      url: 'https://www.googleapis.com/youtube/v3/videos',
      method: 'post',
    } as InternalAxiosRequestConfig
    const error = new AxiosError('socket hang up', 'ECONNRESET', config)

    const exception = YouTubePlatformException.fromAxiosError(error)

    expect(exception.category).toBe(PlatformErrorCategory.Network)
    expect(exception.retryable).toBe(true)
    expect(exception.platformCause).toMatchObject({
      type: PlatformErrorCauseType.Network,
      platformMessage: 'socket hang up',
    })
  })

  it('classifies gaxios network errors as retryable network failures', () => {
    const error = {
      config: {
        url: 'https://www.googleapis.com/youtube/v3/videos',
        method: 'post',
      },
      message: 'socket hang up',
      code: 'ECONNRESET',
    } as unknown as GaxiosError<YouTubeErrorBody>

    const exception = YouTubePlatformException.fromGaxiosError(error)

    expect(exception.category).toBe(PlatformErrorCategory.Network)
    expect(exception.retryable).toBe(true)
    expect(exception.platformCause).toMatchObject({
      type: PlatformErrorCauseType.Network,
      platformMessage: 'socket hang up',
    })
  })

  it('reads invalidCategoryId from Gaxios response errors', () => {
    const data = {
      error: {
        code: 400,
        message: 'The <code>snippet.categoryId</code> property specifies an invalid category ID.',
        errors: [
          {
            message: 'The <code>snippet.categoryId</code> property specifies an invalid category ID.',
            domain: 'youtube.video',
            reason: 'invalidCategoryId',
            location: 'body.snippet.categoryId',
            locationType: 'other',
          },
        ],
      },
    }
    const exception = YouTubePlatformException.fromGaxiosError(createGaxiosError(
      data,
      {
        url: 'https://www.googleapis.com/youtube/v3/videos',
        method: 'post',
        status: 400,
      },
    ))

    expect(exception.category).toBe(PlatformErrorCategory.Validation)
    expect(exception.retryable).toBe(false)
    expect(exception.platformCause).toMatchObject({
      type: PlatformErrorCauseType.Platform,
      httpStatus: 400,
      platformCode: 'invalidCategoryId',
      platformMessage: '该 YouTube 分类不可用于发布，请重新选择分类',
      raw: data,
    })
  })
})
