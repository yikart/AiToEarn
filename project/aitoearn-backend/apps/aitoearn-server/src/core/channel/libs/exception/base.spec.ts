import { ResponseCode } from '@yikart/common'
import { PlatformAuthExpiredException } from '../../platforms/platform.exception'
import { BilibiliError } from '../bilibili/bilibili.exception'
import { SocialMediaError, SocialMediaErrorKind } from './index'

describe('socialMediaError', () => {
  it('should normalize axios auth errors into kind and cause', () => {
    const rawError = {
      isAxiosError: true,
      message: 'Request failed with status code 401',
      status: 401,
      config: {
        method: 'get',
        url: 'https://api.bilibili.com/x/account/me',
      },
      response: {
        status: 401,
        data: {
          code: 40101,
          message: 'token expired',
        },
      },
    }

    const error = BilibiliError.buildFromError(rawError, 'getAccountInfo')

    expect(error).toBeInstanceOf(SocialMediaError)
    expect(error.kind).toBe(SocialMediaErrorKind.Auth)
    expect(error.code).toBe(ResponseCode.ChannelAuthorizationExpired)
    expect(error.cause).toEqual({
      type: 'http',
      httpStatus: 401,
      platformCode: 40101,
      platformMessage: 'token expired',
      raw: rawError,
    })
  })

  it('should normalize network errors into network kind', () => {
    const rawError = {
      isAxiosError: true,
      message: 'socket hang up',
      config: {
        method: 'post',
        url: 'https://api.bilibili.com/x/upload',
      },
    }

    const error = BilibiliError.buildFromError(rawError)

    expect(error.kind).toBe(SocialMediaErrorKind.Network)
    expect(error.code).toBe(ResponseCode.ChannelAccountInfoFailed)
    expect(error.operation).toBe('POST /x/upload')
    expect(error.cause).toEqual({
      type: 'network',
      platformMessage: 'socket hang up',
      raw: rawError,
    })
  })

  it('should keep platform business response in cause.raw without legacy status fields', () => {
    const rawResponse = {
      code: 1001,
      message: 'invalid title',
    }

    const error = BilibiliError.buildFromResponse(rawResponse, 'createArchive')
    const json = error.toJSON()

    expect(error.kind).toBe(SocialMediaErrorKind.Client)
    expect(error.cause).toEqual({
      type: 'platform',
      platformCode: 1001,
      platformMessage: 'invalid title',
      raw: rawResponse,
    })
    expect(json).not.toHaveProperty('errorStatus')
    expect(json).not.toHaveProperty('rawStatus')
    expect(json).not.toHaveProperty('rawError')
    expect(json).not.toHaveProperty('isNetworkError')
  })

  it('should keep explicit auth exception as a business error', () => {
    const error = new PlatformAuthExpiredException('bilibili', 'account-1')

    expect(error.kind).toBe(SocialMediaErrorKind.Auth)
    expect(error.code).toBe(ResponseCode.ChannelAuthorizationExpired)
    expect(error.context).toEqual({ accountId: 'account-1' })
    expect(error.cause).toEqual({
      type: 'http',
      httpStatus: 401,
      platformMessage: 'OAuth2 credential expired, please re-authorize',
    })
  })
})
