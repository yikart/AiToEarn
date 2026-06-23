import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { AccountType, ResponseCode } from '@yikart/common'
import axios, { AxiosError } from 'axios'
import { afterEach, vi } from 'vitest'
import { ChannelPlatformException, PlatformErrorCategory, PlatformErrorCauseType } from '../platforms.exception'
import { PlatformStatus } from '../platforms.interface'
import { WeChatService } from './wechat.service'

function createService(): WeChatService {
  return new WeChatService({
    official: {
      status: PlatformStatus.Available,
      appId: 'official-app-id',
      appSecret: 'official-secret',
      hostUrl: '',
      token: '',
      encodingAESKey: '',
      redirectUri: 'https://api.example.test/wechat/callback',
      logoUrl: 'https://assets.aitoearn.ai/platforms/wechat-official.svg',
      scopes: ['snsapi_userinfo'],
    },
    channels: {
      status: PlatformStatus.Available,
      appId: 'channels-app-id',
      appSecret: 'channels-secret',
      token: '',
      encodingAESKey: '',
      redirectUri: '',
      logoUrl: 'https://assets.aitoearn.ai/platforms/wechat-channels.svg',
    },
  } as never)
}

function createResponse<T>(
  data: T,
  config: InternalAxiosRequestConfig,
): AxiosResponse<T> {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  }
}

function setAdapter(
  service: WeChatService,
  adapter: (config: InternalAxiosRequestConfig) => Promise<AxiosResponse<unknown>>,
) {
  const serviceWithHttp = service as unknown as {
    httpClient: {
      defaults: {
        adapter: (config: InternalAxiosRequestConfig) => Promise<AxiosResponse<unknown>>
      }
    }
  }
  serviceWithHttp.httpClient.defaults.adapter = adapter
}

describe('wechat service error interceptor', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('converts official account errcode responses in the axios interceptor', async () => {
    const service = createService()

    setAdapter(service, async config => createResponse({
      errcode: 40001,
      errmsg: 'invalid credential',
    }, config))

    await expect(service.getOfficialAccessToken()).rejects.toMatchObject({
      code: ResponseCode.ChannelAccessTokenFailed,
      platform: AccountType.WeChatOfficial,
      category: PlatformErrorCategory.Auth,
      retryable: false,
      context: {
        endpoint: 'GET /cgi-bin/token',
      },
      platformCause: {
        type: PlatformErrorCauseType.Platform,
        platformCode: 40001,
        platformMessage: 'invalid credential',
      },
    } satisfies Partial<ChannelPlatformException>)
  })

  it('infers WeChat Channels from POST token requests without per-request context', async () => {
    const service = createService()

    setAdapter(service, async config => createResponse({
      errcode: 45009,
      errmsg: 'api freq out of limit',
    }, config))

    await expect(service.getChannelsAccessToken()).rejects.toMatchObject({
      code: ResponseCode.ChannelAccessTokenFailed,
      platform: AccountType.WeChatChannels,
      category: PlatformErrorCategory.RateLimit,
      retryable: true,
      context: {
        endpoint: 'POST /cgi-bin/token',
      },
      platformCause: {
        type: PlatformErrorCauseType.Platform,
        platformCode: 45009,
        platformMessage: 'api freq out of limit',
      },
    } satisfies Partial<ChannelPlatformException>)
  })

  it('classifies official account transport failures as retryable network errors', async () => {
    const service = createService()

    setAdapter(service, async (config) => {
      throw new AxiosError('socket hang up', 'ECONNRESET', config)
    })

    await expect(service.getOfficialAccessToken()).rejects.toMatchObject({
      code: ResponseCode.ChannelAccessTokenFailed,
      platform: AccountType.WeChatOfficial,
      category: PlatformErrorCategory.Network,
      retryable: true,
      context: {
        endpoint: 'GET /cgi-bin/token',
      },
      platformCause: {
        type: PlatformErrorCauseType.Network,
        platformMessage: 'socket hang up',
      },
    } satisfies Partial<ChannelPlatformException>)
  })

  it('fetches and normalizes WeChat Channels auth data from loginCookie', async () => {
    const service = createService()
    const post = vi.spyOn(axios, 'post').mockResolvedValue({
      data: {
        errCode: 0,
        errMsg: 'request successful',
        data: {
          userAttr: {
            nickname: 'Admin',
            username: 'user-openid',
            encryptedUsername: 'a19****59194',
            encryptedHeadImage: 'https://assets.example.test/admin.jpg',
          },
          finderUser: {
            finderUsername: 'finder-1',
            nickname: 'Finder',
            headImgUrl: 'https://assets.example.test/avatar.jpg',
            fansCount: 321,
            feedsCount: 84,
            uniqId: 'sphExample',
            isMasterFinder: true,
          },
        },
      },
    })
    const loginCookie = JSON.stringify([
      { domain: 'channels.weixin.qq.com', name: 'sessionid', value: 'session-cookie' },
      { domain: 'channels.weixin.qq.com', name: 'wxuin', value: '1000000000' },
    ])

    const result = await service.getChannelsAuthData(loginCookie)
    expect(result).toMatchObject({
      uid: 'sphExample',
      nickname: 'Finder',
      avatar: 'https://assets.example.test/avatar.jpg',
      fansCount: 321,
      workCount: 84,
    })
    expect(result).not.toHaveProperty('account')
    expect(result).not.toHaveProperty('channelId')
    expect(post).toHaveBeenCalledWith(
      'https://channels.weixin.qq.com/cgi-bin/mmfinderassistant-bin/auth/auth_data',
      expect.objectContaining({
        timestamp: expect.any(String),
        _log_finder_uin: '',
        _log_finder_id: '',
        rawKeyBuff: null,
        pluginSessionId: null,
        scene: 7,
        reqScene: 7,
      }),
      expect.objectContaining({
        params: expect.objectContaining({
          _aid: expect.any(String),
          _rid: expect.any(String),
          _pageUrl: 'https://channels.weixin.qq.com/platform',
        }),
        headers: expect.objectContaining({
          'Cookie': 'sessionid=session-cookie; wxuin=1000000000',
          'X-WECHAT-UIN': '1000000000',
        }),
      }),
    )
  })

  it('rejects CRLF characters in WeChat Channels loginCookie', async () => {
    const service = createService()
    const post = vi.spyOn(axios, 'post')

    await expect(service.getChannelsAuthData('sessionid=session-cookie\r\nX-Injected: value'))
      .rejects
      .toMatchObject({
        code: ResponseCode.ChannelAccountInfoFailed,
        platform: AccountType.WeChatChannels,
        category: PlatformErrorCategory.Validation,
      })

    expect(post).not.toHaveBeenCalled()
  })

  it('rejects invalid WeChat Channels auth data response shape', async () => {
    const service = createService()
    vi.spyOn(axios, 'post').mockResolvedValue({
      data: {
        errCode: 0,
        errMsg: 'request successful',
        data: 'unexpected payload',
      },
    })

    await expect(service.getChannelsAuthData('sessionid=session-cookie'))
      .rejects
      .toMatchObject({
        code: ResponseCode.ChannelPlatformResponseInvalid,
        platform: AccountType.WeChatChannels,
        category: PlatformErrorCategory.Validation,
      })
  })

  it('classifies WeChat Channels auth data transport failures as retryable network errors', async () => {
    const service = createService()
    vi.spyOn(axios, 'post').mockRejectedValue(new AxiosError('socket hang up', 'ECONNRESET'))

    await expect(service.getChannelsAuthData('sessionid=session-cookie'))
      .rejects
      .toMatchObject({
        code: ResponseCode.ChannelAccountInfoFailed,
        platform: AccountType.WeChatChannels,
        category: PlatformErrorCategory.Network,
        retryable: true,
        platformCause: {
          type: PlatformErrorCauseType.Network,
          platformMessage: 'socket hang up',
        },
      } satisfies Partial<ChannelPlatformException>)
  })
})
