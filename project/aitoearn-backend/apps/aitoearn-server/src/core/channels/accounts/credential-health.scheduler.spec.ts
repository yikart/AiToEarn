import { AccountType } from '@yikart/common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CredentialHealthScheduler } from './credential-health.scheduler'

vi.mock('../auth/auth.service', () => ({
  AuthService: class AuthService {},
}))

vi.mock('./credential.service', () => ({
  CredentialService: class CredentialService {},
}))

describe('credential health scheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('scans expiring credentials by cursor until no records remain', async () => {
    const credentialService = {
      listExpiringCredentials: vi.fn()
        .mockResolvedValueOnce([{
          cursorId: 'cursor-1',
          accountId: 'account-1',
          platform: AccountType.Facebook,
          accessTokenExpiresAt: 1767225600,
        }])
        .mockResolvedValueOnce([{
          cursorId: 'cursor-2',
          accountId: 'account-2',
          platform: AccountType.Twitter,
          accessTokenExpiresAt: 1767225601,
        }])
        .mockResolvedValueOnce([]),
    }
    const authService = {
      tryRefreshCredential: vi.fn(async () => ({ accessToken: 'access-token' })),
    }
    const scheduler = new CredentialHealthScheduler(
      credentialService as never,
      authService as never,
    )

    await scheduler.refreshExpiringCredentials()

    expect(credentialService.listExpiringCredentials).toHaveBeenNthCalledWith(1, 1767229200, 100, undefined)
    expect(credentialService.listExpiringCredentials).toHaveBeenNthCalledWith(2, 1767229200, 100, {
      cursorId: 'cursor-1',
      accessTokenExpiresAt: 1767225600,
    })
    expect(credentialService.listExpiringCredentials).toHaveBeenNthCalledWith(3, 1767229200, 100, {
      cursorId: 'cursor-2',
      accessTokenExpiresAt: 1767225601,
    })
    expect(authService.tryRefreshCredential).toHaveBeenCalledWith('account-1')
    expect(authService.tryRefreshCredential).toHaveBeenCalledWith('account-2')
  })

  it('keeps scanning when one credential refresh fails or is locked', async () => {
    const credentialService = {
      listExpiringCredentials: vi.fn()
        .mockResolvedValueOnce([
          {
            cursorId: 'cursor-1',
            accountId: 'account-1',
            platform: AccountType.Facebook,
            accessTokenExpiresAt: 1767225600,
          },
          {
            cursorId: 'cursor-2',
            accountId: 'account-2',
            platform: AccountType.Twitter,
            accessTokenExpiresAt: 1767225601,
          },
          {
            cursorId: 'cursor-3',
            accountId: 'account-3',
            platform: AccountType.Twitter,
            accessTokenExpiresAt: 1767225602,
          },
        ])
        .mockResolvedValueOnce([]),
    }
    const authService = {
      tryRefreshCredential: vi.fn()
        .mockRejectedValueOnce(new Error('refresh failed'))
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ accessToken: 'access-token' }),
    }
    const scheduler = new CredentialHealthScheduler(
      credentialService as never,
      authService as never,
    )

    await scheduler.refreshExpiringCredentials()

    expect(authService.tryRefreshCredential).toHaveBeenCalledTimes(3)
    expect(authService.tryRefreshCredential).toHaveBeenNthCalledWith(1, 'account-1')
    expect(authService.tryRefreshCredential).toHaveBeenNthCalledWith(2, 'account-2')
    expect(authService.tryRefreshCredential).toHaveBeenNthCalledWith(3, 'account-3')
  })
})
