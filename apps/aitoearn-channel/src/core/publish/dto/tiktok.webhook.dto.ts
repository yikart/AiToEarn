import { z } from 'zod'

export const TiktokWebhookSchema = z.object({
  client_key: z.string(),
  event: z.string(),
  create_time: z.number(),
  user_openid: z.string(),
  content: z.string(),
})

export type TiktokWebhookDto = z.infer<typeof TiktokWebhookSchema>
