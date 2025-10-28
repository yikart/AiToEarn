import { createZodDto } from '@yikart/common'
import { z } from 'zod'

enum SubMetaPlatform {
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  THREADS = 'threads',
  LINKEDIN = 'linkedin',
}

const GetAuthUrlSchema = z.object({
  platform: z.enum(SubMetaPlatform, { message: '平台名称不能为空' }),
  spaceId: z.string().optional(),
})
export class GetAuthUrlDto extends createZodDto(GetAuthUrlSchema) {}

const GetAuthInfoSchema = z.object({
  taskId: z.string({ message: '任务ID不能为空' }),
})
export class GetAuthInfoDto extends createZodDto(GetAuthInfoSchema) {}

const FacebookPageSelectionSchema = z.object({
  pageIds: z.array(z.string({ message: '页面ID不能为空' })).describe('页面ID列表必须是字符串数组'),
})
export class FacebookPageSelectionDto extends createZodDto(FacebookPageSelectionSchema) {}

const CreateAccountAndSetAccessTokenSchema = z.object({
  code: z.string({ message: '授权码不能为空' }),
  state: z.string({ message: '状态码不能为空' }),
})
export class CreateAccountAndSetAccessTokenDto extends createZodDto(CreateAccountAndSetAccessTokenSchema) {}
