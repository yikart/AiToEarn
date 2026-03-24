import { createZodDto, TableDto } from '@yikart/common'
import { z } from 'zod'
import { DouyinDownloadType, DouyinPrivateStatus } from '../../libs/douyin/common'
import { ArchiveStatus } from './common'

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
  prefix: z.string().optional().describe('前缀'),
  callbackUrl: z.string().url().optional().describe('OAuth 完成后回调地址'),
  callbackMethod: z.enum(['GET', 'POST']).optional().describe('回调方式，默认 GET'),
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

const DouyinShareSchemaOptionsSchema = z.object({
  shareId: z.string().optional().describe('分享ID'),
  hashtag_list: z.array(z.string()).optional().describe('标签列表'),
  title: z.string().optional().describe('标题'),
  title_hashtag_list: z.array(z.object({
    name: z.string().describe('话题名称'),
    start: z.number().describe('插入位置'),
  })).optional().describe('标题内嵌话题列表'),
  downloadType: z.enum(DouyinDownloadType).optional().describe('下载类型'),
  privateStatus: z.enum(DouyinPrivateStatus).optional().describe('隐私状态'),
})
export const GenerateShareSchemaSchema = z.object({
  videoPath: z.string().describe('视频路径'),
  options: DouyinShareSchemaOptionsSchema.optional().describe('分享选项'),
})
export class GenerateShareSchemaDto extends createZodDto(GenerateShareSchemaSchema) {}

const GetArchiveListSchema = AccountIdSchema.extend({
  status: z.enum(ArchiveStatus).optional().describe('稿件状态'),
})
export class GetArchiveListDto extends createZodDto(GetArchiveListSchema) {}

export const CreateDouyinPublishSchema = z.object({
  title: z.string().optional().describe('标题'),
  desc: z.string().optional().describe('描述'),
  accountId: z.string().optional().describe('账号ID'),
  taskId: z.string().optional().describe('任务ID'),
  materialGroupId: z.string().optional().describe('草稿箱ID'),
  materialId: z.string().optional().describe('草稿ID'),
  videoUrl: z.string().optional().describe('视频URL'),
  coverUrl: z.string().optional().describe('封面URL'),
  imgUrlList: z.array(z.string()).optional().describe('图片URL列表'),
  topics: z.array(z.string()).describe('话题列表'),
})
export class CreateDouyinPublishDto extends createZodDto(CreateDouyinPublishSchema) {}
