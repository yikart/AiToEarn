import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PublishType } from '@/libs/database/schema/publishTask.schema';

export const CreatePublishSchema = z.object({
  flowId: z.string({ required_error: '流水ID' }).optional(),
  accountId: z.string({ required_error: '账户ID' }),
  type: z.nativeEnum(PublishType, { required_error: '类型' }),
  title: z.string().optional(),
  desc: z.string().optional(),
  videoUrl: z.string().optional(),
  coverUrl: z.string().optional(),
  imgUrlList: z.string().optional(),
  publishTime: z
    .date()
    .default(() => new Date()),
  topics: z.string(),
})
export class CreatePublishDto extends createZodDto(CreatePublishSchema) {}
