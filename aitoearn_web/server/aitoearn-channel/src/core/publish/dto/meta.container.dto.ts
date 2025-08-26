import { z } from 'zod'
import { PostCategory, PostMediaStatus, PostSubCategory } from '@/libs/database/schema/postMediaContainer.schema'

export const PostMediaContainer = z.object({
  publishId: z.string({ required_error: '发布任务ID不能为空' }),
  userId: z.string({ required_error: '用户ID不能为空' }),
  platform: z.string({ required_error: '平台不能为空' }),
  taskId: z.string({ required_error: '任务ID不能为空' }),
  status: z.nativeEnum(PostMediaStatus, {
    required_error: '任务状态不能为空',
  }).default(PostMediaStatus.CREATED),
  category: z.nativeEnum(PostCategory, {
    required_error: '任务类别不能为空',
  }).default(PostCategory.POST),
  subCategory: z.nativeEnum(PostSubCategory, {
    required_error: '任务子类别不能为空',
  }).default(PostSubCategory.PLAINTEXT),
  accountId: z.string({ required_error: '账户ID不能为空' }),
  option: z.any().optional(),
})

export class CreatePostMediaContainerDto {
  constructor(data: z.infer<typeof PostMediaContainer>) {
    Object.assign(this, data);
  }
}
