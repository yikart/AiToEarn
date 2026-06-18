import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { describe, expect, it } from 'vitest'
import { AuthType, PlatformStatus } from '../platforms.interface'
import { DouyinMiniAppService } from './douyin-miniapp.service'

function createService(): DouyinMiniAppService {
  return new DouyinMiniAppService({
    status: PlatformStatus.Available,
    clientId: 'client-id',
    clientSecret: 'client-secret',
    redirectUri: 'https://api.example.test/callback',
    logoUrl: 'https://assets.example.test/douyin.svg',
    authType: AuthType.QrCode,
    scopes: [],
    miniApp: {
      clientId: 'miniapp-client-id',
      clientSecret: 'miniapp-client-secret',
      sandbox: false,
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
  service: DouyinMiniAppService,
  adapter: (config: InternalAxiosRequestConfig) => Promise<AxiosResponse<unknown>>,
) {
  const serviceWithHttp = service as unknown as {
    http: {
      defaults: {
        adapter: (config: InternalAxiosRequestConfig) => Promise<AxiosResponse<unknown>>
      }
    }
  }
  serviceWithHttp.http.defaults.adapter = adapter
}

describe('douyin miniapp service data APIs', () => {
  it('reads official miniapp user fans count data', async () => {
    const service = createService()

    setAdapter(service, async (config) => {
      expect(config.url).toBe('https://open.douyin.com/api/apps/v1/user/get_fans/')
      expect(config.method).toBe('get')
      expect(config.headers['access-token']).toBe('user-data-access-token')
      expect(config.params).toEqual({
        open_id: 'miniapp-openid',
        date_type: 7,
      })

      return createResponse({
        err_no: 0,
        err_msg: 'success',
        data: {
          result_list: [
            { date: '2026-05-30', total_fans: '1100' },
            { date: '2026-05-31', total_fans: '1200' },
          ],
        },
      }, config)
    })

    await expect(service.getFansCount('user-data-access-token', 'miniapp-openid')).resolves.toBe(1200)
  })
})
