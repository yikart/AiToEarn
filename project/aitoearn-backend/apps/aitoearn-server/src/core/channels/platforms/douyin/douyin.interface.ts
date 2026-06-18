import type { DouyinPlatformResponseBody } from './douyin.exception'
import { z } from 'zod'

export enum DouyinWebhookEvent {
  VerifyWebhook = 'verify_webhook',
  CreateVideo = 'create_video',
  Authorize = 'authorize',
  Unauthorize = 'unauthorize',
  ImReceiveMsg = 'im_receive_msg',
  ImSendMsg = 'im_send_msg',
  ImEnterDirectMsg = 'im_enter_direct_msg',
  ImGroupReceiveMsg = 'im_group_receive_msg',
  ImGroupSendMsg = 'im_group_send_msg',
  EnterGroupAuditChange = 'enter_group_audit_change',
  GroupFansEvent = 'group_fans_event',
  ContractAuthorize = 'contract_authorize',
  ContractUnauthorize = 'contract_unauthorize',
  NewVideoDigg = 'new_video_digg',
  NewFollowAction = 'new_follow_action',
  UnionAuthInfoForC = 'union_auth_info_for_c',
  UnionAuthInfoForB = 'union_auth_info_for_b',
}

export enum DouyinMediaType {
  Image = 'image',
  Video = 'video',
}

export enum DouyinOAuthGrantType {
  AuthorizationCode = 'authorization_code',
  RefreshToken = 'refresh_token',
  ClientCredential = 'client_credential',
}

export interface DouyinApiResponse<T> extends Omit<DouyinPlatformResponseBody, 'data'> {
  data: T
}

export interface DouyinOAuthResponse {
  access_token: string
  expires_in: number | string
  open_id: string
  refresh_token: string
  refresh_expires_in: number | string
  scope: string
}

export interface DouyinOAuthEnvelope<T> extends Omit<DouyinPlatformResponseBody, 'data'> {
  data: T & {
    error_code?: number | string
    description?: string
  }
}

export interface DouyinUserInfo {
  open_id: string
  union_id?: string
  nickname?: string
  avatar?: string
  city?: string
  province?: string
  country?: string
  e_account_role?: string
}

export interface DouyinVideoUploadResponse {
  video?: {
    video_id?: string
    width?: number
    height?: number
    duration?: number
  }
}

export interface DouyinVideoCreateResponse {
  item_id?: string
  video_id?: string
  share_url?: string
}

export interface DouyinClientTokenResponse {
  access_token?: string
  expires_in?: number | string
  error_code?: number | string
  description?: string
}

export interface DouyinOpenTicketResponse {
  ticket?: string
  expires_in?: number | string
  error_code?: number | string
  description?: string
}

export interface DouyinShareIdEnvelope extends DouyinPlatformResponseBody {
  data?: {
    share_id?: string
    error_code?: number | string
    description?: string
  }
}

export interface DouyinOpenIdRequestBody {
  open_id: string
}

export interface DouyinVideoCreateRequestBody {
  video_id: string
  text: string
  custom_cover_image_url?: string
  cover_tsp?: number
  download_type?: number
  private_status?: number
}

export type DouyinApiRequestBody = DouyinOpenIdRequestBody | DouyinVideoCreateRequestBody

export interface DouyinSharePublishResultData {
  share_id?: string
  item_id?: string
  video_id?: string
  share_url?: string
  error_code?: number | string
  description?: string
}

export interface DouyinSharePublishResultEnvelope extends Omit<DouyinPlatformResponseBody, 'data'> {
  data?: DouyinSharePublishResultData
}

export interface DouyinSharePublishResult {
  shareId: string
  itemId?: string
  videoId?: string
  shareUrl?: string
  raw: DouyinSharePublishResultData
}

export interface DouyinShareSchemaOptions {
  shareId: string
  title?: string
  short_title?: string
  title_hashtag_list?: Array<{ name: string, start: number }>
  cover_tsp?: number
  download_type?: number
  private_status?: number
  image_list_path?: string[]
  video_path?: string
}

const DouyinWebhookCommonFields = {
  from_user_id: z.string().optional(),
  to_user_id: z.string().optional(),
  client_key: z.string(),
  log_id: z.string().optional(),
}

function parseDouyinWebhookContent(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value
  }
  try {
    return JSON.parse(value) as unknown
  }
  catch {
    return value
  }
}

export const DouyinCreateVideoWebhookContentSchema = z.object({
  share_id: z.string().min(1).optional(),
  item_id: z.string().min(1).optional(),
  video_id: z.string().min(1).optional(),
  has_default_hashtag: z.boolean().optional(),
})

export const DouyinCreateVideoWebhookBodySchema = z.object({
  ...DouyinWebhookCommonFields,
  event: z.literal(DouyinWebhookEvent.CreateVideo),
  content: z.preprocess(parseDouyinWebhookContent, DouyinCreateVideoWebhookContentSchema),
})

export const DouyinVerifyWebhookBodySchema = z.object({
  ...DouyinWebhookCommonFields,
  event: z.literal(DouyinWebhookEvent.VerifyWebhook),
  content: z.object({
    challenge: z.union([z.string().min(1), z.number()]),
  }),
})

export const DouyinAcknowledgedWebhookBodySchema = z.object({
  ...DouyinWebhookCommonFields,
  event: z.enum([
    DouyinWebhookEvent.Authorize,
    DouyinWebhookEvent.Unauthorize,
    DouyinWebhookEvent.ImReceiveMsg,
    DouyinWebhookEvent.ImSendMsg,
    DouyinWebhookEvent.ImEnterDirectMsg,
    DouyinWebhookEvent.ImGroupReceiveMsg,
    DouyinWebhookEvent.ImGroupSendMsg,
    DouyinWebhookEvent.EnterGroupAuditChange,
    DouyinWebhookEvent.GroupFansEvent,
    DouyinWebhookEvent.ContractAuthorize,
    DouyinWebhookEvent.ContractUnauthorize,
    DouyinWebhookEvent.NewVideoDigg,
    DouyinWebhookEvent.NewFollowAction,
    DouyinWebhookEvent.UnionAuthInfoForC,
    DouyinWebhookEvent.UnionAuthInfoForB,
  ]),
  content: z.union([z.record(z.string(), z.unknown()), z.string()]),
})

export const DouyinWebhookBodySchema = z.union([
  DouyinCreateVideoWebhookBodySchema,
  DouyinVerifyWebhookBodySchema,
  DouyinAcknowledgedWebhookBodySchema,
])

export type DouyinCreateVideoWebhookBody = z.infer<typeof DouyinCreateVideoWebhookBodySchema>
export type DouyinVerifyWebhookBody = z.infer<typeof DouyinVerifyWebhookBodySchema>
export type DouyinAcknowledgedWebhookBody = z.infer<typeof DouyinAcknowledgedWebhookBodySchema>
export type DouyinWebhookBody = z.infer<typeof DouyinWebhookBodySchema>

export const DouyinDataOptionSchema = z.object({
  shareId: z.string().min(1),
  schema: z.string().optional(),
  shortLink: z.string().optional(),
  expiresAt: z.string().optional(),
  itemId: z.string().optional(),
  videoId: z.string().optional(),
  workLink: z.string().optional(),
  webhook: DouyinCreateVideoWebhookBodySchema.optional(),
})

export type DouyinDataOption = z.infer<typeof DouyinDataOptionSchema>

export function parseDouyinDataOption(dataOption: unknown): DouyinDataOption | undefined {
  const parsed = DouyinDataOptionSchema.safeParse(dataOption)
  return parsed.success ? parsed.data : undefined
}

export function buildDouyinVideoWorkLink(videoId: string): string {
  return `https://www.douyin.com/video/${videoId}`
}
