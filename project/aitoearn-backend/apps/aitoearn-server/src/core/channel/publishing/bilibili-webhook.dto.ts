import { z } from 'zod'

export const BilibiliWebhookContentSchema = z.object({
  share_id: z.string(),
  item_id: z.string(),
  video_id: z.string(),
  has_default_hashtag: z.boolean(),
})

export const BilibiliWebhookSchema = z.object({
  event: z.string(),
  from_user_id: z.string(),
  client_key: z.string(),
  log_id: z.string(),
  content: BilibiliWebhookContentSchema,
})

export type BilibiliWebhookDto = z.infer<typeof BilibiliWebhookSchema>
