import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PublishType } from '@/libs/database/schema/publishTask.schema';

export const CreatePublishSchema = z.object({
  flowId: z.string({ required_error: '流水ID' }).nullable().optional().transform(val => !val ? undefined : val),
  accountId: z.string({ required_error: '账户ID' }),
  type: z.nativeEnum(PublishType, { required_error: '类型' }),
  title: z.string().nullable().optional().transform(val => !val ? undefined : val),
  desc: z.string().nullable().optional().transform(val => !val ? undefined : val),
  videoUrl: z.string().nullable().optional().transform(val => !val ? undefined : val),
  coverUrl: z.string().nullable().optional().transform(val => !val ? undefined : val),
  imgUrlList: z.string().nullable().optional().transform(val => !val ? undefined : val),
  publishTime: z.string().nullable().optional().transform(val => !val ? undefined : val),
  topics: z.string(),
})
export class CreatePublishDto extends createZodDto(CreatePublishSchema) {}
