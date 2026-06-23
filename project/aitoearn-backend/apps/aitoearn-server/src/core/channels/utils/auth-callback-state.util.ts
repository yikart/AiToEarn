import type { AuthCallbackInput } from '../platforms/platforms.interface'
import { AppException, ResponseCode } from '@yikart/common'
import { z } from 'zod'

const AuthCallbackPayloadSchema = z.object({
  code: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
})

const AuthCallbackStateSchema = z.object({
  state: z.string().min(1).optional(),
})

const AuthCodeVerifierSchema = z.object({
  codeVerifier: z.string().min(1),
})

export interface OAuthCallback {
  code: string
  state: string
}

export function getAuthCallbackState(input: Pick<AuthCallbackInput, 'query' | 'body'>): string | undefined {
  const result = AuthCallbackStateSchema.safeParse({
    ...(input.body ?? {}),
    ...(input.query ?? {}),
  })

  return result.success ? result.data.state : undefined
}

export function parseOAuthCallback(input: AuthCallbackInput): OAuthCallback {
  const result = AuthCallbackPayloadSchema.safeParse({
    ...(input.body ?? {}),
    ...(input.query ?? {}),
  })

  if (!result.success) {
    const hasInvalidState = result.error.issues.some(issue => issue.path[0] === 'state')
    throw new AppException(hasInvalidState ? ResponseCode.ChannelAuthCsrfInvalid : ResponseCode.ChannelAuthCodeMissing)
  }

  assertParsedCallbackState(result.data.state, input.session.id)

  if (!result.data.code) {
    throw new AppException(ResponseCode.ChannelAuthCodeMissing)
  }

  return {
    code: result.data.code,
    state: result.data.state,
  }
}

export function parseAuthCodeVerifier(input: AuthCallbackInput): string {
  const result = AuthCodeVerifierSchema.safeParse(input.session.authExtras ?? {})
  if (!result.success) {
    throw new AppException(ResponseCode.ChannelAuthSessionInvalid)
  }

  return result.data.codeVerifier
}

export function assertAuthCallbackState(input: AuthCallbackInput): void {
  assertParsedCallbackState(getAuthCallbackState(input), input.session.id)
}

export function assertParsedCallbackState(callbackState: string | undefined, sessionId: string): asserts callbackState is string {
  if (callbackState !== sessionId) {
    throw new AppException(ResponseCode.ChannelAuthCsrfInvalid)
  }
}
