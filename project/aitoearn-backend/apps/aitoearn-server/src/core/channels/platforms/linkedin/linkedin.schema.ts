import { z } from 'zod'

export enum LinkedInVisibility {
  Connections = 'CONNECTIONS',
  Public = 'PUBLIC',
}

export enum LinkedInDistribution {
  MainFeed = 'MAIN_FEED',
  None = 'NONE',
}

export enum LinkedInAccountType {
  Person = 'person',
}

const LinkedInAuthorUrnSchema = z.string().regex(/^urn:li:person:[^/?#]+$/)

export const LinkedInOptionSchema = z.object({
  visibility: z.enum(LinkedInVisibility).optional().default(LinkedInVisibility.Public).describe('可见性'),
  authorUrn: LinkedInAuthorUrnSchema.optional().describe('发帖主体 URN，仅支持 person'),
  distribution: z.enum(LinkedInDistribution).optional().default(LinkedInDistribution.MainFeed).describe('分发渠道'),
  commentary: z.string().max(3000).optional().describe('覆盖正文'),
})

export type LinkedInOption = z.infer<typeof LinkedInOptionSchema>

export const LinkedInPublishDataOptionSchema = z.object({
  authorUrn: LinkedInAuthorUrnSchema.optional().describe('实际用于创建 LinkedIn post 的发帖主体 URN'),
  accountType: z.enum(LinkedInAccountType).optional().describe('实际用于创建 LinkedIn post 的账号类型'),
})

export type LinkedInPublishDataOption = z.infer<typeof LinkedInPublishDataOptionSchema>

export const LinkedInWebhookNotificationSchema = z.object({
  eventType: z.string().min(1).optional().describe('LinkedIn webhook event type'),
  entity: z.string().min(1).optional().describe('LinkedIn webhook entity'),
  entityUrn: z.string().min(1).optional().describe('LinkedIn webhook entity URN'),
  lastModifiedAt: z.number().int().optional().describe('LinkedIn webhook last modified time'),
})

export const LinkedInWebhookPayloadSchema = z.object({
  webhookId: z.string().min(1).optional().describe('LinkedIn webhook id'),
  owner: z.string().min(1).optional().describe('LinkedIn webhook owner'),
  events: z.array(LinkedInWebhookNotificationSchema).optional().describe('LinkedIn webhook events'),
})
