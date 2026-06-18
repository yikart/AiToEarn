import { z } from 'zod'

export enum BilibiliCopyright {
  Original = 1,
  Reprint = 2,
}

export enum BilibiliNoReprint {
  Allow = 0,
  Disallow = 1,
}

const BilibiliOptionBaseSchema = z.object({
  tid: z.number().int().positive().describe('分区 ID'),
  no_reprint: z.enum(BilibiliNoReprint).optional().describe('是否允许转载 0-允许，1-不允许'),
  topic_id: z.number().int().positive().optional().describe('话题 ID'),
  mission_id: z.number().int().positive().optional().describe('投稿活动 ID'),
})

export const BilibiliOptionSchema = z.union([
  BilibiliOptionBaseSchema.extend({
    copyright: z.literal(BilibiliCopyright.Original).default(BilibiliCopyright.Original).describe('1-原创，2-转载'),
    source: z.string().optional().describe('转载来源'),
  }),
  BilibiliOptionBaseSchema.extend({
    copyright: z.literal(BilibiliCopyright.Reprint).describe('1-原创，2-转载'),
    source: z.string().min(1).describe('转载来源'),
  }),
])

export type BilibiliOption = z.infer<typeof BilibiliOptionSchema>
