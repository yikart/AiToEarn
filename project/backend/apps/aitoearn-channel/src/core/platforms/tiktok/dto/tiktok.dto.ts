import { createZodDto } from '@yikart/common'
import { z } from 'zod'
import { TiktokPostMode, TiktokPrivacyLevel, TiktokSourceType } from '../../../../libs/tiktok/tiktok.enum'
/*
 * @Author: nevin
 * @Date: 2025-01-08 00:00:00
 * @LastEditTime: 2025-01-08 00:00:00
 * @LastEditors: nevin
 * @Description: TikTok DTO
 */

const PostInfoSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  privacy_level: z.nativeEnum(TiktokPrivacyLevel),
  disable_comment: z.boolean().optional(),
  disable_duet: z.boolean().optional(),
  disable_stitch: z.boolean().optional(),
  auto_add_music: z.boolean().optional(),
  brand_content_toggle: z.boolean().optional(),
  brand_organic_toggle: z.boolean().optional(),
  video_cover_timestamp_ms: z.number().optional(),
})
export class PostInfoDto extends createZodDto(PostInfoSchema) {}

const VideoFileUploadSourceSchema = z.object({
  source: z.literal(TiktokSourceType.FILE_UPLOAD),
  video_size: z.number(),
  chunk_size: z.number(),
  total_chunk_count: z.number(),
})
export class VideoFileUploadSourceDto extends createZodDto(VideoFileUploadSourceSchema) {}

const VideoPullUrlSourceSchema = z.object({
  source: z.literal(TiktokSourceType.PULL_FROM_URL),
  video_url: z.string().url(),
})
export class VideoPullUrlSourceDto extends createZodDto(VideoPullUrlSourceSchema) {}

const PhotoSourceInfoSchema = z.object({
  source: z.literal(TiktokSourceType.PULL_FROM_URL),
  photo_images: z.array(z.string().url()),
  photo_cover_index: z.number(),
})
export class PhotoSourceInfoDto extends createZodDto(PhotoSourceInfoSchema) {}

const AccountIdSchema = z.object({
  accountId: z.string(),
})
export class AccountIdDto extends createZodDto(AccountIdSchema) {}

const UserIdSchema = z.object({
  userId: z.string(),
})
export class UserIdDto extends createZodDto(UserIdSchema) {}

const GetAuthUrlSchema = UserIdSchema.extend({
  spaceId: z.string(),
  scopes: z.array(z.string()).optional(),
})
export class GetAuthUrlDto extends createZodDto(GetAuthUrlSchema) {}

const GetAuthInfoSchema = z.object({
  taskId: z.string(),
})
export class GetAuthInfoDto extends createZodDto(GetAuthInfoSchema) {}

const CreateAccountAndSetAccessTokenSchema = z.object({
  code: z.string(),
  state: z.string(),
})
export class CreateAccountAndSetAccessTokenDto extends createZodDto(
  CreateAccountAndSetAccessTokenSchema,
) {}

const RefreshTokenSchema = AccountIdSchema.extend({
  refreshToken: z.string(),
})
export class RefreshTokenDto extends createZodDto(RefreshTokenSchema) {}

const VideoPublishSchema = AccountIdSchema.extend({
  postInfo: PostInfoSchema,
  sourceInfo: z.union([VideoFileUploadSourceSchema, VideoPullUrlSourceSchema]),
})
export class VideoPublishDto extends createZodDto(VideoPublishSchema) {}

const PhotoPublishSchema = AccountIdSchema.extend({
  postMode: z.nativeEnum(TiktokPostMode),
  postInfo: PostInfoSchema,
  sourceInfo: PhotoSourceInfoSchema,
})
export class PhotoPublishDto extends createZodDto(PhotoPublishSchema) {}

const GetPublishStatusSchema = AccountIdSchema.extend({
  publishId: z.string(),
})
export class GetPublishStatusDto extends createZodDto(GetPublishStatusSchema) {}

const UploadVideoFileSchema = z.object({
  uploadUrl: z.string().url(),
  videoBase64: z.string(),
  contentType: z.string().optional(),
})
export class UploadVideoFileDto extends createZodDto(UploadVideoFileSchema) {}

const UserInfoSchema = AccountIdSchema.extend({
  fields: z.string().optional(),
})
export class UserInfoDto extends createZodDto(UserInfoSchema) {}

const ListUserVideosSchema = AccountIdSchema.extend({
  fields: z.string(),
  cursor: z.coerce.number().optional(),
  max_count: z.coerce.number().optional(),
})
export class ListUserVideosDto extends createZodDto(ListUserVideosSchema) {}

export class RevokeTokenDto extends createZodDto(AccountIdSchema) {}
