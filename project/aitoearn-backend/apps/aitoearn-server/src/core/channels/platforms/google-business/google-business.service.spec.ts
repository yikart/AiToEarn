import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { describe, expect, it } from 'vitest'
import { GoogleBusinessService } from './google-business.service'

function createService(): GoogleBusinessService {
  return new GoogleBusinessService({
    clientId: 'client-id',
    clientSecret: 'client-secret',
    redirectUri: 'https://api.example.test/callback',
    logoUrl: 'https://assets.example.test/google-business.svg',
    scopes: ['https://www.googleapis.com/auth/business.manage'],
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
  service: GoogleBusinessService,
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

describe('google business service locations', () => {
  it('requests official Business Information location title field', async () => {
    const service = createService()

    setAdapter(service, async (config) => {
      expect(config.url).toBe('https://mybusinessbusinessinformation.googleapis.com/v1/accounts/123/locations')
      expect(config.method).toBe('get')
      expect(config.headers.Authorization).toBe('Bearer access-token')
      expect(config.params).toMatchObject({
        readMask: 'name,title,websiteUri,storefrontAddress',
      })

      return createResponse({
        locations: [{
          name: 'locations/456',
          title: 'Store One',
          websiteUri: 'https://store.example.test',
          storefrontAddress: {
            regionCode: 'US',
            locality: 'San Francisco',
          },
        }],
      }, config)
    })

    await expect(service.listLocations('access-token', 'accounts/123')).resolves.toEqual([{
      name: 'locations/456',
      title: 'Store One',
      websiteUri: 'https://store.example.test',
      storefrontAddress: {
        regionCode: 'US',
        locality: 'San Francisco',
      },
    }])
  })
})
