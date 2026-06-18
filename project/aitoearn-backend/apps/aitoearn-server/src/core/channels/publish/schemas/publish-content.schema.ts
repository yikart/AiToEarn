import type { PublishMediaMetadata } from '../../platforms/platforms.interface'
import { z } from 'zod'
import { createPublishMediaOptionsSchema } from '../../platforms/publish-media-adaptation.schema'

export const PublishMediaInputSchema = z.object({
  url: z.httpUrl().describe('媒体 URL'),
  options: createPublishMediaOptionsSchema(),
})

export const PublishCoverInputSchema = z.object({
  url: z.httpUrl().describe('封面 URL'),
  options: createPublishMediaOptionsSchema(),
})

export const PublishContentOverrideSchema = z.object({
  title: z.string().optional().describe('标题覆盖'),
  body: z.string().optional().describe('正文覆盖'),
  media: z.array(PublishMediaInputSchema).optional().describe('主体媒体列表覆盖'),
  cover: PublishCoverInputSchema.nullable().optional().describe('封面覆盖，传 null 表示清空封面'),
})

export const PublishContentInputSchema = z.object({
  title: z.string().optional().describe('标题'),
  body: z.string().optional().describe('正文'),
  media: z.array(PublishMediaInputSchema).default([]).describe('主体媒体列表'),
  cover: PublishCoverInputSchema.optional().describe('封面'),
})

export type PublishMediaInput = z.infer<typeof PublishMediaInputSchema> & {
  metadata?: PublishMediaMetadata
}
export type PublishCoverInput = z.infer<typeof PublishCoverInputSchema> & {
  metadata?: PublishMediaMetadata
}
export type PublishContentOverride = Omit<z.infer<typeof PublishContentOverrideSchema>, 'media' | 'cover'> & {
  media?: PublishMediaInput[]
  cover?: PublishCoverInput | null
}
export type PublishContentInput = Omit<z.infer<typeof PublishContentInputSchema>, 'media' | 'cover'> & {
  media: PublishMediaInput[]
  cover?: PublishCoverInput
}
