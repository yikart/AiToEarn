import type { AuthCallbackInput } from '../platforms/platforms.interface'
import { AccountType, ChannelAuthSessionStatus, ResponseCode } from '@yikart/common'
import { describe, expect, it } from 'vitest'
import { assertAuthCallbackState, parseAuthCodeVerifier, parseOAuthCallback } from './auth-callback-state.util'

function createInput(input: Partial<AuthCallbackInput>): AuthCallbackInput {
  return {
    query: {},
    session: {
      id: 'session-1',
      userId: 'user-1',
      platform: AccountType.Twitter,
      groupId: 'group-default',
      status: ChannelAuthSessionStatus.Pending,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    },
    ...input,
  }
}

describe('auth callback state util', () => {
  it('accepts matching query state', () => {
    expect(() => assertAuthCallbackState(createInput({
      query: { state: 'session-1' },
    }))).not.toThrow()
  })

  it('accepts matching body state when query state is absent', () => {
    expect(() => assertAuthCallbackState(createInput({
      body: { state: 'session-1' },
    }))).not.toThrow()
  })

  it('rejects missing state', () => {
    expect(() => assertAuthCallbackState(createInput({})))
      .toThrow(expect.objectContaining({ code: ResponseCode.ChannelAuthCsrfInvalid }))
  })

  it('rejects mismatched state', () => {
    expect(() => assertAuthCallbackState(createInput({
      query: { state: 'other-session' },
    })))
      .toThrow(expect.objectContaining({ code: ResponseCode.ChannelAuthCsrfInvalid }))
  })

  it('parses OAuth callback code and state with query taking precedence', () => {
    const callback = parseOAuthCallback(createInput({
      query: { code: 'query-code', state: 'session-1' },
      body: { code: 'body-code', state: 'other-session' },
    }))

    expect(callback).toEqual({
      code: 'query-code',
      state: 'session-1',
    })
  })

  it('rejects OAuth callback without code', () => {
    expect(() => parseOAuthCallback(createInput({
      query: { state: 'session-1' },
    }))).toThrow(expect.objectContaining({ code: ResponseCode.ChannelAuthCodeMissing }))
  })

  it('parses PKCE code verifier from auth extras', () => {
    expect(parseAuthCodeVerifier(createInput({
      session: {
        ...createInput({}).session,
        authExtras: { codeVerifier: 'verifier-1' },
      },
    }))).toBe('verifier-1')
  })

  it('rejects missing PKCE code verifier', () => {
    expect(() => parseAuthCodeVerifier(createInput({})))
      .toThrow(expect.objectContaining({ code: ResponseCode.ChannelAuthSessionInvalid }))
  })
})
