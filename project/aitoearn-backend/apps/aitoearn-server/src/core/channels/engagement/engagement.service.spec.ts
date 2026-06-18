import { AccountType, ResponseCode } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { ChannelPlatformException, PlatformErrorCategory, PlatformErrorCauseType } from '../platforms/platforms.exception'
import { ChannelPaginationMode } from '../platforms/platforms.interface'
import { EngagementService } from './engagement.service'

vi.mock('@yikart/mongodb', () => ({
  AccountRepository: class AccountRepository {},
}))

vi.mock('../auth/auth.service', () => ({
  AuthService: class AuthService {},
}))

describe('engagementService', () => {
  it('calls engagement provider methods with the provider receiver', async () => {
    const listComments = vi.fn()
    const provider = {
      commentPagination: { mode: ChannelPaginationMode.None },
      listComments,
    }
    listComments.mockImplementation(function (this: unknown) {
      expect(this).toBe(provider)
      return Promise.resolve({
        items: [],
        pagination: {},
      })
    })
    const registry = {
      getEngagement: vi.fn(() => provider),
    }
    const authService = {
      getValidCredential: vi.fn(async () => ({ accessToken: 'access-token' })),
      markAccountOfflineForCredentialFailure: vi.fn(async () => true),
    }
    const accountRepository = {
      getByIdAndUserId: vi.fn(async () => ({
        id: 'account-id',
        type: AccountType.Twitter,
        uid: 'twitter-user-id',
      })),
    }
    const service = new EngagementService(registry as never, authService as never, accountRepository as never)

    await expect(service.listComments('user-id', AccountType.Twitter, 'work-id', 'account-id', {}))
      .resolves
      .toEqual({
        platform: AccountType.Twitter,
        items: [],
        pagination: {},
      })

    expect(authService.markAccountOfflineForCredentialFailure).not.toHaveBeenCalled()
  })

  it('marks the account offline when engagement provider returns an auth failure', async () => {
    const platformError = new ChannelPlatformException({
      code: ResponseCode.ChannelAccessTokenFailed,
      platform: AccountType.Twitter,
      category: PlatformErrorCategory.Auth,
      retryable: false,
      cause: {
        type: PlatformErrorCauseType.Http,
        httpStatus: 401,
      },
    })
    const provider = {
      commentPagination: { mode: ChannelPaginationMode.None },
      listComments: vi.fn(async () => {
        throw platformError
      }),
    }
    const registry = {
      getEngagement: vi.fn(() => provider),
    }
    const authService = {
      getValidCredential: vi.fn(async () => ({ accessToken: 'access-token' })),
      markAccountOfflineForCredentialFailure: vi.fn(async () => true),
    }
    const accountRepository = {
      getByIdAndUserId: vi.fn(async () => ({
        id: 'account-id',
        type: AccountType.Twitter,
        uid: 'twitter-user-id',
      })),
    }
    const service = new EngagementService(registry as never, authService as never, accountRepository as never)

    await expect(service.listComments('user-id', AccountType.Twitter, 'work-id', 'account-id', {}))
      .rejects
      .toBe(platformError)

    expect(authService.markAccountOfflineForCredentialFailure).toHaveBeenCalledWith(
      'account-id',
      platformError,
      'platform_auth_failed',
    )
  })
})
