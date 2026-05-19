import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const AITOEARN_AUTH_OPTIONS = Symbol('AITOEARN_AUTH_OPTIONS')

export const aitoearnAuthConfigSchema = z.object({
  secret: z.string().default(''),
  expiresIn: z.number().default(7 * 24 * 60 * 60),
  internalToken: z.string().min(1),
})

export class AitoearnAuthConfig extends createZodDto(aitoearnAuthConfigSchema) {}

export interface TokenPayload {
  readonly id: string
  readonly mail?: string
  readonly name?: string
  readonly shopDomain?: string
  readonly exp?: number
}

export type AitoearnAuthOptions<TTokenInfo = unknown> = AitoearnAuthConfig & {
  getTokenInfo: (payload: TokenPayload) => TTokenInfo | Promise<TTokenInfo>
  getTokenInfoByApiKey?: (apiKey: string) => TTokenInfo | Promise<TTokenInfo>
}
