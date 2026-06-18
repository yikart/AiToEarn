import { z } from 'zod'

export const KwaiOptionSchema = z.object({
  cover: z.string().optional().describe('封面 URL'),
  stereo_type: z.string().optional().describe('视频类型'),
  merchant_product_id: z.string().optional().describe('挂载商品 ID'),
})

export type KwaiOption = z.infer<typeof KwaiOptionSchema>

export const KwaiDataOptionSchema = z.object({
  photoId: z.string().optional().describe('快手 photo_id'),
  publishPlayUrl: z.string().url().optional().describe('发布接口返回的 play_url，仅作诊断'),
  latestPlayUrl: z.string().url().optional().describe('最近一次 photo/info 返回的 play_url，仅作诊断'),
})

export type KwaiDataOption = z.infer<typeof KwaiDataOptionSchema>
