import { createZodDto } from '@yikart/common'
import { z } from 'zod'
import { AddArchiveDataDto } from '../../bilibili/dto/bilibili.dto'

const AccountIdSchema = z.object({
  accountId: z.coerce.number().describe('账号ID'),
})
export class AccountIdDto extends createZodDto(AccountIdSchema) {}

const UserIdSchema = z.object({
  userId: z.string().describe('用户ID'),
})
export class UserIdDto extends createZodDto(UserIdSchema) {}

const GetAuthUrlSchema = UserIdSchema.extend({
  spaceId: z.string().describe('空间ID'),
  type: z.enum(['pc', 'h5']).describe('授权类型'),
  prefix: z.string().optional().describe('前缀'),
})
export class GetAuthUrlDto extends createZodDto(GetAuthUrlSchema) {}

const DisposeAuthTaskSchema = z.object({
  taskId: z.string().describe('任务ID'),
  auth_code: z.string().describe('授权码'),
  expires_in: z.coerce.number().describe('过期时间'),
})
export class DisposeAuthTaskDto extends createZodDto(DisposeAuthTaskSchema) {}

const AuthBackParamSchema = z.object({
  taskId: z.string().describe('任务ID'),
  prefix: z.string().optional().describe('前缀'),
})
export class AuthBackParamDto extends createZodDto(AuthBackParamSchema) {}

const AuthBackQuerySchema = z.object({
  auth_code: z.string().describe('授权码'),
  expires_in: z.coerce.number().describe('过期时间'),
})
export class AuthBackQueryDto extends createZodDto(AuthBackQuerySchema) {}

const GetAuthInfoSchema = z.object({
  taskId: z.string().describe('任务ID'),
})
export class GetAuthInfoDto extends createZodDto(GetAuthInfoSchema) {}

const GetHeaderSchema = AccountIdSchema.extend({
  body: z.record(z.string(), z.any()).describe('请求体'),
  isForm: z.boolean().describe('是否表单提交'),
})
export class GetHeaderDto extends createZodDto(GetHeaderSchema) {}

const VideoInitSchema = AccountIdSchema.extend({
  utype: z.coerce.number().describe('上传类型，0-多分片，1-单个小文件（不超过100M）。默认值为0'),
  name: z.string().describe('文件名称'),
})
export class VideoInitDto extends createZodDto(VideoInitSchema) {}

const AddArchiveSchema = AccountIdSchema.extend({
  data: AddArchiveDataDto.schema,
  uploadToken: z.string().describe('上传token'),
})
export class AddArchiveDto extends createZodDto(AddArchiveSchema) {}
