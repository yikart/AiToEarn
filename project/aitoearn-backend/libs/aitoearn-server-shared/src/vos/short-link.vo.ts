import { z } from 'zod'

// ---------------------------------------------------------------------------
// CreateShortLinkOptions
// ---------------------------------------------------------------------------

export const CreateShortLinkOptionsSchema = z.object({
  originalUrl: z.string().describe('原始 URL'),
  expiresInSeconds: z.number().optional().describe('过期时间（秒）'),
})
export interface CreateShortLinkOptions extends z.infer<typeof CreateShortLinkOptionsSchema> {}

// ---------------------------------------------------------------------------
// CreateShortLinkResponse
// ---------------------------------------------------------------------------

export const CreateShortLinkResponseSchema = z.object({
  shortLink: z.string().describe('短链接'),
})
export interface CreateShortLinkResponse extends z.infer<typeof CreateShortLinkResponseSchema> {}
