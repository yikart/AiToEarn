/*
 * @Author: AI Assistant
 * @Date: 2025-01-08 00:00:00
 * @LastEditTime: 2025-01-08 00:00:00
 * @LastEditors: AI Assistant
 * @Description: TikTok Platform DTO
 */
import { createZodDto } from '@yikart/common'
import { z } from 'zod'

const GetAuthUrlSchema = z.object({
  scopes: z.array(z.string()).optional(),
  spaceId: z.string().optional(),
})
export class GetAuthUrlDto extends createZodDto(GetAuthUrlSchema) {}

const GetAuthInfoSchema = z.object({
  taskId: z.string({ message: '任务ID不能为空' }),
})
export class GetAuthInfoDto extends createZodDto(GetAuthInfoSchema) {}

const CreateAccountAndSetAccessTokenSchema = z.object({
  code: z.string({ message: '授权码不能为空' }),
  state: z.string({ message: '状态码不能为空' }),
})
export class CreateAccountAndSetAccessTokenDto extends createZodDto(CreateAccountAndSetAccessTokenSchema) {}

const AccountIdSchema = z.object({
  accountId: z.string({ message: '账号ID不能为空' }),
})
export class AccountIdDto extends createZodDto(AccountIdSchema) {}

const RefreshTokenSchema = AccountIdSchema.extend({
  refreshToken: z.string({ message: '刷新令牌不能为空' }),
})
export class RefreshTokenDto extends createZodDto(RefreshTokenSchema) {}

const VideoPublishSchema = AccountIdSchema.extend({
  postInfo: z.object({}).describe('发布信息必须是对象'),
  sourceInfo: z.object({}).describe('源信息必须是对象'),
})
export class VideoPublishDto extends createZodDto(VideoPublishSchema) {}

const PhotoPublishSchema = AccountIdSchema.extend({
  postMode: z.string({ message: '发布模式不能为空' }),
  postInfo: z.object({}).describe('发布信息必须是对象'),
  sourceInfo: z.object({}).describe('源信息必须是对象'),
})
export class PhotoPublishDto extends createZodDto(PhotoPublishSchema) {}

const GetPublishStatusSchema = AccountIdSchema.extend({
  publishId: z.string({ message: '发布ID不能为空' }),
})
export class GetPublishStatusDto extends createZodDto(GetPublishStatusSchema) {}

const UploadVideoFileSchema = z.object({
  uploadUrl: z.string({ message: '上传URL不能为空' }),
  contentType: z.string({ message: '内容类型不能为空' }),
})
export class UploadVideoFileDto extends createZodDto(UploadVideoFileSchema) {}
