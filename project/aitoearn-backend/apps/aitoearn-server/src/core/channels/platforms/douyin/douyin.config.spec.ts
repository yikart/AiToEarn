import { AuthType, PlatformStatus } from '../platforms.interface'
import { DouyinConfig, douyinConfigSchema } from './douyin.config'

const baseConfig = {
  status: PlatformStatus.Available,
  clientId: 'client-id',
  clientSecret: 'client-secret',
  redirectUri: 'https://api.example.test/callback',
  logoUrl: 'https://assets.aitoearn.ai/platforms/douyin.svg',
}

describe('douyin config', () => {
  it('allows oauth2 auth without miniapp config', () => {
    const config = DouyinConfig.create({
      ...baseConfig,
      authType: AuthType.OAuth2,
    })

    expect(config.authType).toBe(AuthType.OAuth2)
    expect(config.miniApp).toBeUndefined()
  })

  it('requires miniapp config for qrcode auth', () => {
    expect(() => DouyinConfig.create({
      ...baseConfig,
      authType: AuthType.QrCode,
    })).toThrow()
  })

  it('does not accept empty miniapp credentials', () => {
    expect(() => DouyinConfig.create({
      ...baseConfig,
      authType: AuthType.QrCode,
      miniApp: {
        clientId: '',
        clientSecret: 'miniapp-client-secret',
        sandbox: false,
      },
    })).toThrow()
  })

  it('allows hidden platform config without logo or credentials', () => {
    expect(douyinConfigSchema.parse({
      status: PlatformStatus.Hidden,
    })).toEqual({
      status: PlatformStatus.Hidden,
      logoUrl: '',
    })
  })

  it('requires logo for placeholder states', () => {
    expect(() => douyinConfigSchema.parse({
      status: PlatformStatus.Unavailable,
    })).toThrow()
    expect(douyinConfigSchema.parse({
      status: PlatformStatus.ComingSoon,
      logoUrl: 'https://assets.aitoearn.ai/platforms/douyin.svg',
    })).toEqual({
      status: PlatformStatus.ComingSoon,
      logoUrl: 'https://assets.aitoearn.ai/platforms/douyin.svg',
    })
  })
})
