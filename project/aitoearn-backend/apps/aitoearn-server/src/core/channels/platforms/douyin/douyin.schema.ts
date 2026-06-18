import { z } from 'zod'

export enum DouyinDownloadType {
  Allow = 1,
  Disallow = 2,
}

export enum DouyinPrivateStatus {
  Public = 0,
  Private = 1,
  Friends = 2,
}

export const DouyinOptionSchema = z.object({
  short_title: z.string().max(12).optional().describe('短标题'),
  cover_tsp: z.number().int().min(0).optional().describe('封面时间戳，单位毫秒'),
  download_type: z.enum(DouyinDownloadType).optional().describe('下载类型 1-允许，2-不允许'),
  private_status: z.enum(DouyinPrivateStatus).optional().describe('私密状态'),
})

export type DouyinOption = z.infer<typeof DouyinOptionSchema>
