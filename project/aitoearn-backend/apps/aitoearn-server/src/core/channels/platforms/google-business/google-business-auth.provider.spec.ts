import { AccountType } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { GoogleBusinessAuthProvider } from './google-business-auth.provider'

vi.mock('./google-business.service', () => ({
  GoogleBusinessService: class GoogleBusinessService {},
}))

function createProvider() {
  const googleBusinessService = {
    generateAuthUrl: vi.fn(),
    exchangeCode: vi.fn(),
    refreshAccessToken: vi.fn(),
    revokeToken: vi.fn(),
    getUserInfo: vi.fn(),
    listAccounts: vi.fn(async () => [{
      name: 'accounts/123',
      accountName: 'Business Account',
      type: 'PERSONAL',
      role: 'OWNER',
    }]),
    listLocations: vi.fn(async () => [{
      name: 'locations/456',
      title: 'Store One',
      websiteUri: 'https://store.example.test',
      storefrontAddress: {
        regionCode: 'US',
        locality: 'San Francisco',
      },
    }]),
  }
  const provider = new GoogleBusinessAuthProvider(googleBusinessService as never, {
    scopes: ['https://www.googleapis.com/auth/business.manage'],
    redirectUri: 'https://api.example.test/callback',
  } as never)

  return { provider, googleBusinessService }
}

describe('google business auth provider', () => {
  it('uses Business Profile locations as selectable accounts with official title field', async () => {
    const { provider, googleBusinessService } = createProvider()

    await expect(provider.listSelectableAccounts({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    })).resolves.toEqual([{
      platform: AccountType.GoogleBusiness,
      platformUid: 'accounts/123/locations/456',
      account: 'accounts/123',
      displayName: 'Store One',
      credential: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      },
      profile: {
        accountName: 'accounts/123',
        accountType: 'PERSONAL',
        locationName: 'Store One',
        websiteUri: 'https://store.example.test',
        address: {
          regionCode: 'US',
          locality: 'San Francisco',
        },
      },
    }])
    expect(googleBusinessService.listAccounts).toHaveBeenCalledWith('access-token')
    expect(googleBusinessService.listLocations).toHaveBeenCalledWith('access-token', 'accounts/123')
  })
})
