import { createZodDto } from '@yikart/common'
import { z } from 'zod'
import { SourceTypeEnum } from '../comment'

const CreateBoardBodySchema = z.object({
  name: z.string({ message: '名称' }),
  accountId: z.string().optional(),
})
export class CreateBoardBodyDto extends createZodDto(CreateBoardBodySchema) {}

const ListBodySchema = z.object({
  page: z.string({ message: '页码' }),
  size: z.string({ message: '每页大小' }),
  accountId: z.string().optional(),
})
export class ListBodyDto extends createZodDto(ListBodySchema) {}

const MediaSourceSchema = z.object({
  source_type: z.enum(SourceTypeEnum).optional(),
  url: z.string().optional(),
})
export class MediaSource extends createZodDto(MediaSourceSchema) {}

const CreatePinBodyItemSchema = z.object({
  url: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  link: z.string().optional(),
})
export class CreatePinBodyItemDto extends createZodDto(CreatePinBodyItemSchema) {}

const CreatePinBodySchema = z.object({
  board_id: z.string({ message: '此Pin所属board的板块。' }),
  link: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  decs: z.string().optional(),
  dominant_color: z.string().optional(),
  alt_text: z.string().optional(),
  media_source: MediaSourceSchema.optional(),
  items: z.array(CreatePinBodyItemSchema).optional(),
  accountId: z.string().optional(),
})
export class CreatePinBodyDto extends createZodDto(CreatePinBodySchema) {}

const WebhookSchema = z.object({
  code: z.string({ message: 'code' }).optional(),
  state: z.string({ message: 'state' }).optional(),
})
export class WebhookDto extends createZodDto(WebhookSchema) {}
