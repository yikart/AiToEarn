import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { GoogleBusinessErrorBody } from './google-business.exception'
import { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'
import { PlatformErrorCategory, PlatformErrorCauseType } from '../platforms.exception'
import { GoogleBusinessPlatformException } from './google-business.exception'

function createAxiosError(
  data: GoogleBusinessErrorBody,
  input: { url: string, method: string, status: number },
): AxiosError<GoogleBusinessErrorBody> {
  const config = {
    url: input.url,
    method: input.method,
  } as InternalAxiosRequestConfig
  const response: AxiosResponse<GoogleBusinessErrorBody> = {
    data,
    status: input.status,
    statusText: 'Error',
    headers: {},
    config,
  }

  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, undefined, response)
}

describe('google business platform exception', () => {
  it('classifies Google permission status before HTTP fallback', () => {
    const exception = GoogleBusinessPlatformException.fromAxiosError(createAxiosError(
      {
        error: {
          code: 403,
          message: 'Permission denied.',
          status: 'PERMISSION_DENIED',
        },
      },
      {
        url: 'https://mybusinessbusinessinformation.googleapis.com/v1/accounts',
        method: 'get',
        status: 403,
      },
    ))

    expect(exception.category).toBe(PlatformErrorCategory.Permission)
    expect(exception.retryable).toBe(false)
    expect(exception.platformCause).toMatchObject({
      type: PlatformErrorCauseType.Platform,
      httpStatus: 403,
      platformCode: 'PERMISSION_DENIED',
      platformMessage: 'Permission denied.',
    })
  })

  it('classifies axios network errors as retryable network failures', () => {
    const config = {
      url: 'https://mybusinessbusinessinformation.googleapis.com/v1/accounts',
      method: 'get',
    } as InternalAxiosRequestConfig
    const error = new AxiosError('socket hang up', 'ECONNRESET', config)

    const exception = GoogleBusinessPlatformException.fromAxiosError(error)

    expect(exception.category).toBe(PlatformErrorCategory.Network)
    expect(exception.retryable).toBe(true)
    expect(exception.platformCause).toMatchObject({
      type: PlatformErrorCauseType.Network,
      platformMessage: 'socket hang up',
    })
  })
})
