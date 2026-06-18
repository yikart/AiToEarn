import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { ResponseCode } from '@yikart/common'
import { describe, expect, it } from 'vitest'
import { LinkedInService } from './linkedin.service'

function createService(): LinkedInService {
  return new LinkedInService({
    clientId: 'client-id',
    clientSecret: 'client-secret',
    redirectUri: 'https://api.example.test/callback',
    logoUrl: 'https://assets.example.test/linkedin.svg',
    scopes: ['openid', 'profile', 'email', 'w_member_social'],
    restVersion: '202605',
    webhookSecret: '',
  } as never)
}

function createResponse<T>(
  data: T,
  config: InternalAxiosRequestConfig,
  headers: Record<string, string> = {},
): AxiosResponse<T> {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers,
    config,
  }
}

function setAdapter(
  service: LinkedInService,
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

describe('linkedin service profile', () => {
  it('maps OpenID Connect userinfo claims to profile fields', async () => {
    const service = createService()

    setAdapter(service, async (config) => {
      expect(config.url).toBe('https://api.linkedin.com/v2/userinfo')
      expect(config.method).toBe('get')
      expect(config.headers.Authorization).toBe('Bearer access-token')

      return createResponse({
        sub: 'member-1',
        name: 'Member One',
        picture: 'https://assets.example.test/member.jpg',
        email: 'member@example.test',
      }, config)
    })

    await expect(service.getProfile('access-token')).resolves.toEqual({
      platformUid: 'member-1',
      displayName: 'Member One',
      avatarUrl: 'https://assets.example.test/member.jpg',
      email: 'member@example.test',
    })
  })
})

describe('linkedin service post creation', () => {
  it('reads created post id from x-restli-id header', async () => {
    const service = createService()

    setAdapter(service, async (config) => {
      expect(config.url).toBe('https://api.linkedin.com/rest/posts')
      expect(config.method).toBe('post')
      expect(config.headers['Linkedin-Version']).toBe('202605')

      return createResponse({}, config, {
        'x-restli-id': 'urn:li:activity:123',
      })
    })

    await expect(service.createTextPost(
      'access-token',
      'urn:li:person:member-1',
      'hello',
    )).resolves.toEqual({
      id: 'urn:li:activity:123',
    })
  })

  it('falls back to response body id when x-restli-id is missing', async () => {
    const service = createService()

    setAdapter(service, async (config) => {
      expect(config.url).toBe('https://api.linkedin.com/rest/posts')
      expect(config.method).toBe('post')

      return createResponse({
        id: 'urn:li:activity:456',
      }, config)
    })

    await expect(service.createImagePost(
      'access-token',
      'urn:li:person:member-1',
      'hello',
      ['urn:li:image:image-1'],
    )).resolves.toEqual({
      id: 'urn:li:activity:456',
    })
  })

  it('creates video posts with the official media content union', async () => {
    const service = createService()

    setAdapter(service, async (config) => {
      expect(config.url).toBe('https://api.linkedin.com/rest/posts')
      expect(config.method).toBe('post')
      const data = JSON.parse(String(config.data))
      expect(data).toMatchObject({
        author: 'urn:li:person:member-1',
        commentary: 'hello',
        content: {
          media: {
            id: 'urn:li:video:video-1',
          },
        },
      })
      expect(data).not.toHaveProperty('content.video')

      return createResponse({}, config, {
        'x-restli-id': 'urn:li:activity:video-post-1',
      })
    })

    await expect(service.createVideoPost(
      'access-token',
      'urn:li:person:member-1',
      'hello',
      'urn:li:video:video-1',
    )).resolves.toEqual({
      id: 'urn:li:activity:video-post-1',
    })
  })

  it('throws when created post id is missing from header and body', async () => {
    const service = createService()
    const raw = { activity: 'urn:li:activity:missing-id' }

    setAdapter(service, async config => createResponse(raw, config))

    await expect(service.createVideoPost(
      'access-token',
      'urn:li:person:member-1',
      'hello',
      'urn:li:video:video-1',
    )).rejects.toMatchObject({
      code: ResponseCode.ChannelPlatformResponseInvalid,
      platformCause: { raw },
    })
  })
})
