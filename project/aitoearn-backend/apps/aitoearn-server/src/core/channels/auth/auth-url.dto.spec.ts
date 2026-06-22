import { describe, expect, it } from 'vitest'
import { StartAuthQuerySchema } from './auth.dto'

describe('channel auth URL DTOs', () => {
  it('accepts local and internal callback URLs', () => {
    expect(StartAuthQuerySchema.safeParse({
      callbackUrl: 'http://localhost:8080/api/relay-callback',
    }).success).toBe(true)
    expect(StartAuthQuerySchema.safeParse({
      callbackUrl: 'http://aitoearn-server:3002/api/relay-callback',
    }).success).toBe(true)
    expect(StartAuthQuerySchema.safeParse({
      callbackUrl: 'https://client.example.test/callback',
    }).success).toBe(true)
  })

  it('keeps redirectUri strict', () => {
    expect(StartAuthQuerySchema.safeParse({
      redirectUri: 'https://client.example.test/redirect',
    }).success).toBe(true)
    expect(StartAuthQuerySchema.safeParse({
      redirectUri: 'http://localhost:8080/redirect',
    }).success).toBe(false)
  })

  it('rejects relative and non-http callback URLs', () => {
    expect(StartAuthQuerySchema.safeParse({
      callbackUrl: '/api/relay-callback',
    }).success).toBe(false)
    expect(StartAuthQuerySchema.safeParse({
      callbackUrl: 'javascript:alert(1)',
    }).success).toBe(false)
  })
})
