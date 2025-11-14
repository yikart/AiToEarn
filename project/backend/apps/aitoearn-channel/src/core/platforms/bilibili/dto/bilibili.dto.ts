import { createZodDto } from '@yikart/common'
import { z } from 'zod'
import { TableDto } from '../../../../common/global/dto/table.dto'
import { ArchiveStatus } from '../../../../libs/bilibili/common'

const AccountIdSchema = z.object({
  accountId: z.string().describe('账号ID'),
})
export class AccountIdDto extends createZodDto(AccountIdSchema) {}

const UserIdSchema = z.object({
  userId: z.string().describe('用户ID'),
})
export class UserIdDto extends createZodDto(UserIdSchema) {}

const GetAuthUrlSchema = UserIdSchema.extend({
  spaceId: z.string().describe('空间ID'),
  type: z.enum(['h5', 'pc']).describe('授权类型'),
  prefix: z.string().optional().describe('前缀'),
})
export class GetAuthUrlDto extends createZodDto(GetAuthUrlSchema) {}

const GetAuthInfoSchema = z.object({
  taskId: z.string().describe('任务ID'),
})
export class GetAuthInfoDto extends createZodDto(GetAuthInfoSchema) {}

const GetHeaderSchema = AccountIdSchema.extend({
  body: z.record(z.string(), z.any()).describe('请求数据'),
  isForm: z.boolean().describe('是否表单提交'),
})
export class GetHeaderDto extends createZodDto(GetHeaderSchema) {}

const VideoInitSchema = AccountIdSchema.extend({
  utype: z.coerce
    .number()
    .describe('上传类型：0-多分片，1-单文件（不超过100M）。默认值为0'),
  name: z.string().describe('文件名称'),
})
export class VideoInitDto extends createZodDto(VideoInitSchema) {}

const UploadLitVideoSchema = AccountIdSchema.extend({
  file: z.string().describe('文件流 base64编码'),
  uploadToken: z.string().describe('上传token'),
})
export class UploadLitVideoDto extends createZodDto(UploadLitVideoSchema) {}

const UploadVideoPartSchema = UploadLitVideoSchema.extend({
  partNumber: z.coerce.number().describe('分片索引'),
})
export class UploadVideoPartDto extends createZodDto(UploadVideoPartSchema) {}

const VideoCompleteSchema = AccountIdSchema.extend({
  uploadToken: z.string().describe('上传token'),
})
export class VideoCompleteDto extends createZodDto(VideoCompleteSchema) {}

const CoverUploadSchema = AccountIdSchema.extend({
  file: z.string().describe('文件流 base64编码'),
})
export class CoverUploadDto extends createZodDto(CoverUploadSchema) {}

const AddArchiveDataSchema = z.object({
  title: z.string().describe('标题'),
  cover: z.string().optional().describe('封面'),
  tid: z.coerce.number().describe('分区ID'),
  no_reprint: z.union([z.literal(0), z.literal(1)]).optional().describe('是否允许转载'),
  desc: z.string().optional().describe('描述'),
  tag: z.string().describe('标签'),
  copyright: z.union([z.literal(1), z.literal(2)]).describe('版权类型,1-原创，2-转载'),
  source: z.string().optional().describe('转载来源'),
})
export class AddArchiveDataDto extends createZodDto(AddArchiveDataSchema) {}

const AddArchiveSchema = AccountIdSchema.extend({
  data: AddArchiveDataSchema.describe('稿件数据'),
  uploadToken: z.string().describe('上传token'),
})
export class AddArchiveDto extends createZodDto(AddArchiveSchema) {}

const CreateAccountAndSetAccessTokenSchema = z.object({
  taskId: z.string().describe('任务ID'),
  code: z.string().describe('授权码'),
  state: z.string().describe('状态'),
})
export class CreateAccountAndSetAccessTokenDto extends createZodDto(
  CreateAccountAndSetAccessTokenSchema,
) {}

const ArchiveListFilterSchema = z.object({
  status: z.enum(ArchiveStatus).optional().describe('任务状态'),
})
export class ArchiveListFilterDto extends createZodDto(ArchiveListFilterSchema) {}

const ArchiveListSchema = AccountIdSchema.extend({
  filter: ArchiveListFilterSchema.describe('筛选条件'),
  page: TableDto.schema.describe('分页配置'),
})
export class ArchiveListDto extends createZodDto(ArchiveListSchema) {}

const GetArcStatSchema = AccountIdSchema.extend({
  resourceId: z.string().describe('稿件ID'),
})
export class GetArcStatDto extends createZodDto(GetArcStatSchema) {}
