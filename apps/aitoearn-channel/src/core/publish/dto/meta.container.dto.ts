import { z } from 'zod'
import { PostCategory, PostMediaStatus, PostSubCategory } from '../../../libs/database/schema/postMediaContainer.schema'

export const PostMediaContainer = z.object({
  publishId: z.string().describe('发布任务ID'),
  userId: z.string().describe('用户ID'),
  platform: z.string().describe('平台'),
  taskId: z.string().describe('任务ID'),
  status: z.enum(PostMediaStatus).describe('任务状态').default(PostMediaStatus.CREATED),
  category: z.enum(PostCategory).describe('任务类别').default(PostCategory.POST),
  subCategory: z.enum(PostSubCategory).describe('任务子类别').default(PostSubCategory.PLAINTEXT),
  accountId: z.string().describe('账户ID'),
  option: z.any().optional(),
})

export class CreatePostMediaContainerDto {
  constructor(data: z.infer<typeof PostMediaContainer>) {
    Object.assign(this, data)
  }
}
