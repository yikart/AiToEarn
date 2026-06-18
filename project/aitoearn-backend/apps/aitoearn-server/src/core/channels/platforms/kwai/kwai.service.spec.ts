import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { KwaiPlatformResponseBody } from './kwai.exception'
import { AxiosError } from 'axios'
import { PlatformErrorCategory, PlatformErrorCauseType } from '../platforms.exception'
import { KwaiPlatformException } from './kwai.exception'
import { KwaiService } from './kwai.service'

function createService() {
  return new KwaiService({
    clientId: 'client-id',
    clientSecret: 'client-secret',
    redirectUri: 'https://api.example.test/api/v2/channels/accounts/auth/KWAI/callback',
    logoUrl: 'https://assets.aitoearn.ai/platforms/kwai.svg',
    scopes: ['user_info', 'user_video_publish'],
  } as never)
}

describe('kwai service auth url', () => {
  it('adds pc ua parameter for desktop auth', () => {
    const service = createService()

    const authUrl = new URL(service.generateAuthUrl(['user_info'], 'state-1', 'desktop'))

    expect(authUrl.searchParams.get('ua')).toBe('pc')
  })

  it.each(['mobile', 'tablet', 'unknown'] as const)('does not add pc ua parameter for %s auth', (deviceType) => {
    const service = createService()

    const authUrl = new URL(service.generateAuthUrl(['user_info'], 'state-1', deviceType))

    expect(authUrl.searchParams.has('ua')).toBe(false)
  })
})

describe('kwai service axios interceptors', () => {
  it('converts successful HTTP platform body errors in the response interceptor', async () => {
    const service = createService()
    const serviceWithHttp = service as unknown as { http: { defaults: { adapter: unknown } } }
    serviceWithHttp.http.defaults.adapter = async (config: unknown) => ({
      data: {
        result: 1001,
        error_msg: 'invalid authorization code',
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    })

    await expect(service.exchangeCode('bad-code')).rejects.toMatchObject({
      category: PlatformErrorCategory.Auth,
      platformCause: {
        platformCode: 1001,
        platformMessage: 'invalid authorization code',
      },
    })
  })
})

describe('kwai platform exception', () => {
  it('classifies axios network errors as retryable network failures', () => {
    const config = {
      method: 'get',
      url: 'https://open.kuaishou.com/openapi/photo/info',
    } as InternalAxiosRequestConfig
    const error = new AxiosError('socket hang up', 'ECONNRESET', config)

    const exception = KwaiPlatformException.fromAxiosError(error)

    expect(exception.context?.endpoint).toBe('GET /openapi/photo/info')
    expect(exception.category).toBe(PlatformErrorCategory.Network)
    expect(exception.retryable).toBe(true)
    expect(exception.platformCause).toMatchObject({
      type: PlatformErrorCauseType.Network,
      platformMessage: 'socket hang up',
    })
  })

  it('marks post-publish VIDEO_NOT_EXIST photo info responses as retryable', () => {
    const response: AxiosResponse<KwaiPlatformResponseBody> = {
      data: {
        result: 100120001,
        error: 'video_not_exist',
        error_msg: 'VIDEO_NOT_EXIST',
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {
        method: 'get',
        url: 'https://open.kuaishou.com/openapi/photo/info',
      } as InternalAxiosRequestConfig,
    }

    expect(KwaiPlatformException.fromPlatformResponse(response)).toMatchObject({
      category: PlatformErrorCategory.MediaProcessingFailed,
      retryable: true,
      platformCause: {
        platformCode: 100120001,
        platformMessage: 'VIDEO_NOT_EXIST',
      },
    })
  })
})
