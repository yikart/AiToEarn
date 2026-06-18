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

  it('scans expiring credentials with a fixed batch limit', async () => {
    const credentialService = {
      listExpiringCredentials: vi.fn(async () => [{
        accountId: 'account-1',
        platform: AccountType.Facebook,
        accessTokenExpiresAt: 1767225600,
      }]),
    }
    const authService = {
      refreshCredential: vi.fn(async () => ({ accessToken: 'access-token' })),
    }
    const scheduler = new CredentialHealthScheduler(
      credentialService as never,
      authService as never,
    )

    await scheduler.refreshExpiringCredentials()

    expect(credentialService.listExpiringCredentials).toHaveBeenCalledWith(1767229200, 100)
    expect(authService.refreshCredential).toHaveBeenCalledWith('account-1')
  })
})
